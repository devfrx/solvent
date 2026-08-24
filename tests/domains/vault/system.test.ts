import { beforeEach, describe, expect, it } from 'vitest'

import type { Transaction } from '@core/contracts/ledger'
import { fromString, toString, ZERO } from '@core/contracts/money'
import { POOL_IDS } from '@core/contracts/pools'

import { createBus } from '@core/kernel/Bus'
import type { Capacities } from '@core/kernel/Ledger'
import { createLedger, income, poolCapacity, type Ledger } from '@core/kernel/Ledger'
import { ORDER } from '@core/kernel/Registry'

import {
  cashCapacityFor,
  expansionPriceFor,
  MAX_LEVEL,
  VAULT_POOL
} from '../../../src/core/domains/vault/rules'
import { createVault, type Vault } from '../../../src/core/domains/vault/system'
import type { VaultSave } from '../../../src/core/domains/vault/types'

/**
 * Il sistema del caveau con i pezzi veri: nessun mock del kernel (convenzioni.md). Ciò che si
 * verifica qui è l'orchestrazione — chi paga, in che ordine, e cosa succede se il Ledger dice di
 * no — perché il calcolo ha già i suoi test in `rules.test.ts`.
 */

const money = fromString

let ledger: Ledger
let subject: Vault
let posted: Transaction[]

/**
 * Il giro vero del bootstrap: il caveau possiede la capienza, il Ledger la fa rispettare, e la
 * funzione nomina il caveau prima che esista. Costruirlo qui come lo costruisce `createGame` è ciò
 * che rende questo file una prova invece di una simulazione.
 */
beforeEach(() => {
  const bus = createBus()
  posted = []
  bus.on('money.posted', ({ transaction }) => {
    posted.push(transaction)
  })
  const capacities: Capacities = (pool) =>
    pool === VAULT_POOL ? subject.cashCapacity() : poolCapacity(pool)
  ledger = createLedger(bus, capacities)
  subject = createVault(ledger)
})

/** Mette denaro passando dal Ledger vero: nessun saldo si scrive a mano (R06). */
const fund = (pool: 'cash' | 'card', amount: string): void => {
  ledger.transaction(income(pool, money(amount), ZERO), { reason: 'reason.income.tick' })
  posted = []
}

const total = (): string =>
  toString(POOL_IDS.reduce((sum, pool) => sum.plus(ledger.balance(pool)), money('0')))

const priceOf = (level: number, pool: 'cash' | 'card'): string => {
  const option = expansionPriceFor(level, pool)
  if (option === null) throw new Error('opzione attesa')
  return toString(option.price)
}

describe('come si presenta al Registry', () => {
  it('ha l’id e la fase dichiarati, e non ticchetta', () => {
    // `ECONOMY` e non una fase nuova: il caveau non ticchetta, quindi il suo `order` decide solo
    // salvataggio e caricamento — e lì `ECONOMY` prima di `INCOME` è ciò che fa ritrovare il
    // livello prima che il recupero faccia ticchettare otto ore contro un caveau appena nato.
    expect(subject.system.id).toBe('vault')
    expect(subject.system.order).toBe(ORDER.ECONOMY)
    expect(subject.system.tick).toBeUndefined()
  })

  it('parte dal livello zero, con la capienza di partenza', () => {
    expect(subject.state()).toEqual({ level: 0 })
    expect(subject.cashCapacity()).toBe(cashCapacityFor(0))
  })
})

describe('l’ampliamento', () => {
  it('si paga in contanti, e il tetto si sposta davvero', () => {
    fund('cash', '1000')

    const expanded = subject.expand('cash')

    expect(expanded).toEqual({ ok: true, value: { level: 1 } })
    expect(toString(ledger.balance('cash'))).toBe(
      toString(money('1000').minus(money(priceOf(0, 'cash'))))
    )
    expect(subject.cashCapacity()).toBe(cashCapacityFor(1))
    expect(total()).toBe('0')
  })

  it('e il Ledger fa rispettare il tetto **nuovo**, non quello di partenza', () => {
    // È il caso che l'ADR 0025 esiste per rendere possibile: senza, il Ledger continuerebbe a
    // leggere `POOLS` e rifiuterebbe un accredito che nel caveau ampliato ci sta benissimo.
    fund('cash', '1000')
    subject.expand('cash')

    const beyondTheOldWall = ledger.transaction(income('cash', money('1500'), ZERO), {
      reason: 'reason.income.tick'
    })

    expect(beyondTheOldWall.ok).toBe(true)
    expect(ledger.balance('cash').lessThanOrEqualTo(cashCapacityFor(1))).toBe(true)
  })

  it('si paga anche con la carta, che costa meno', () => {
    fund('card', '1000')

    expect(subject.expand('card').ok).toBe(true)
    expect(toString(ledger.balance('card'))).toBe(
      toString(money('1000').minus(money(priceOf(0, 'card'))))
    )
    expect(toString(ledger.balance('sink'))).toBe(priceOf(0, 'card'))
  })

  it('paga il prezzo del listino, non uno che gli viene consegnato', () => {
    // INV-19 — il comando riceve lo **strumento**, e ricalcola. Se il prezzo arrivasse da fuori,
    // chi lo consegna potrebbe consegnarne uno diverso da quello mostrato.
    fund('cash', '1000')
    subject.expand('cash')
    const [movement] = posted

    expect(movement?.reason).toBe('reason.vault.expand')
    expect(movement?.postings.map((row) => toString(row.amount.abs()))).toEqual([
      priceOf(0, 'cash'),
      priceOf(0, 'cash')
    ])
  })

  it('con i fondi che non bastano non muove niente, e lo dice col codice del Ledger', () => {
    fund('cash', '10')

    const refused = subject.expand('cash')

    expect(refused.ok).toBe(false)
    if (refused.ok) return
    expect(refused.error.code).toBe('error.ledger.insufficient_funds')
    // Il livello **non** è salito: si paga prima, e lo stato nuovo esiste solo se il Ledger ha
    // detto di sì. L'ordine inverso lascerebbe un caveau più grande di quello comprato.
    expect(subject.state()).toEqual({ level: 0 })
    expect(subject.cashCapacity()).toBe(cashCapacityFor(0))
    expect(posted).toHaveLength(0)
  })

  it('con uno strumento fuori listino risponde con l’elenco di quelli buoni', () => {
    fund('cash', '1000')

    const refused = subject.expand('world')

    expect(refused.ok).toBe(false)
    if (refused.ok || refused.error.code !== 'error.ledger.pool_not_accepted') return
    expect(refused.error.accepted).toEqual(['cash', 'card'])
    expect(subject.state()).toEqual({ level: 0 })
  })

  it('all’ultimo livello è un esito, non un guasto', () => {
    subject.system.load({ level: MAX_LEVEL })
    fund('cash', '1000')

    expect(subject.expand('cash')).toEqual({
      ok: false,
      error: { code: 'error.vault.max_level' }
    })
    expect(posted).toHaveLength(0)
  })
})

describe('salvare e ricaricare', () => {
  it('il livello attraversa il salvataggio, e con esso la capienza', () => {
    fund('cash', '1000')
    subject.expand('cash')
    const saved: VaultSave = subject.system.save()

    const reopened = createVault(ledger)
    reopened.system.load(saved)

    expect(reopened.state()).toEqual({ level: 1 })
    expect(reopened.cashCapacity()).toBe(cashCapacityFor(1))
  })

  it('rifiuta un livello che non è un numero — campo per campo, non “è un oggetto”', () => {
    // INV-20 · D020. Il controllo pigro basterebbe a far passare `{ level: 'tre' }`, e da lì il
    // caveau avrebbe una capienza `undefined`: nessun tetto, cioè il contrario del muro.
    for (const garbage of ['3', true, null, undefined, {}, [], () => 3]) {
      expect(() => subject.system.load({ level: garbage } as unknown as VaultSave)).toThrow(
        TypeError
      )
    }
  })

  it('e rifiuta un numero che non è un livello: frazionario, negativo, oltre l’ultimo', () => {
    // Questi tre `typeof` li dichiara `number`, quindi il test generale di
    // `tests/rules/stateful-systems-reject-garbage` non li prova — li dichiara fra i propri limiti.
    // È il primo stato salvato del progetto che non sia un booleano, ed è il primo che possa
    // sbagliare in silenzio: un livello frazionario non fa rumore, produce una capienza sbagliata.
    for (const wrong of [1.5, -1, MAX_LEVEL + 1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => subject.system.load({ level: wrong })).toThrow(TypeError)
    }
  })

  it('e uno stato intero che non riconosce', () => {
    for (const garbage of [null, undefined, 0, 'x', [], {}]) {
      expect(() => subject.system.load(garbage as unknown as VaultSave)).toThrow(TypeError)
    }
  })

  it('un load rifiutato non lascia il caveau a metà', () => {
    fund('cash', '1000')
    subject.expand('cash')

    expect(() => subject.system.load({ level: -1 })).toThrow(TypeError)

    expect(subject.state()).toEqual({ level: 1 })
  })
})

describe('azzerare', () => {
  it('riporta il caveau al primo livello, e con esso il tetto', () => {
    fund('cash', '1000')
    subject.expand('cash')

    subject.system.reset('hard')

    expect(subject.state()).toEqual({ level: 0 })
    expect(subject.cashCapacity()).toBe(cashCapacityFor(0))
  })
})
