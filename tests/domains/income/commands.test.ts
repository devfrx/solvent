import { beforeEach, describe, expect, it } from 'vitest'

import type { Transaction } from '@core/contracts/ledger'
import { fromString, toString } from '@core/contracts/money'
import type { PaymentOption } from '@core/contracts/payment'
import { POOL_IDS, POOLS } from '@core/contracts/pools'

import { createModifiers, type Modifiers } from '@core/balance/modifiers'
import { createBus, type Bus } from '@core/kernel/Bus'
import { createLedger, income, spend, type Ledger } from '@core/kernel/Ledger'

import { UPGRADE_PAYMENT, createBuyUpgrade } from '../../../src/core/domains/income/commands'
import {
  INCOME_TARGET,
  UPGRADE_MODIFIER_ID,
  canBuyUpgrade,
  upgradePriceFor,
  upgradePrices
} from '../../../src/core/domains/income/rules'
import type { IncomeState } from '../../../src/core/domains/income/types'

/**
 * L'acquisto: un comando che può fallire per tre ragioni diverse, e che non deve lasciare mai
 * saldi e stato disallineati.
 *
 * Da D019 il comando riceve lo **strumento** e ricalcola il prezzo dal listino (ADR 0027). Ne
 * discende la terza ragione — «con questo non si paga» — e la domanda che questo file deve
 * chiudere: che il listino e `accepts` non possano divergere.
 */

const FRESH: IncomeState = { upgraded: false }

/** I due strumenti del giocatore. Gli altri quattro conti non si scelgono (ADR 0020). */
type Instrument = 'cash' | 'card'

let bus: Bus
let ledger: Ledger
let modifiers: Modifiers

/**
 * L'opzione della carta, presa **dal listino**. Ricopiarla qui proverebbe che questo file è
 * coerente con se stesso, che non è la domanda.
 */
const cardOption = (): PaymentOption => {
  const option = upgradePriceFor('card')
  if (option === null) throw new Error('il listino dell’upgrade non offre la carta')
  return option
}

/** Mette soldi su un pool passando dal Ledger vero: nessun saldo si scrive a mano (R06). */
const fund = (pool: Instrument, amount: string): void => {
  ledger.transaction(income(pool, fromString(amount)), { reason: 'reason.income.tick' })
}

const buy = (
  state: IncomeState = FRESH,
  pool: Instrument = 'card'
): ReturnType<ReturnType<typeof createBuyUpgrade>> =>
  createBuyUpgrade({ ledger, modifiers })({ state, pool })

const total = (): string =>
  toString(POOL_IDS.reduce((sum, pool) => sum.plus(ledger.balance(pool)), fromString('0')))

beforeEach(() => {
  bus = createBus()
  ledger = createLedger(bus)
  modifiers = createModifiers()
})

describe('comprare con i fondi che bastano', () => {
  it('riesce, scala il costo dallo strumento scelto e registra il modificatore', () => {
    fund('card', '1000')

    const bought = buy()

    expect(bought).toEqual({ ok: true, value: { upgraded: true } })
    expect(toString(ledger.balance('card'))).toBe('200')
    expect(modifiers.sourcesFor(INCOME_TARGET).map((source) => source.id)).toEqual([
      UPGRADE_MODIFIER_ID
    ])
  })

  it('il costo finisce in sink, e la somma di tutti i conti resta zero', () => {
    fund('card', '1000')

    buy()

    expect(toString(ledger.balance('sink'))).toBe(toString(cardOption().price))
    expect(total()).toBe('0')
  })
})

describe('INV-19 — il prezzo mostrato e quello addebitato', () => {
  it('sono **lo stesso oggetto**, non due numeri uguali', () => {
    // Per identità e non per uguaglianza: due `Decimal` con lo stesso valore passerebbero un
    // `toEqual` e potrebbero venire da due formule diverse, che è esattamente il difetto che
    // questa delega esiste per rendere impossibile. La trappola l'ha pagata D015 (correzione 14).
    const applied: Transaction[] = []
    bus.on('money.posted', (posted) => applied.push(posted.transaction))
    fund('card', '1000')

    expect(buy().ok).toBe(true)

    const purchase = applied.find((moved) => moved.reason === 'reason.income.upgrade')
    const charged = purchase?.postings.find((posting) => posting.pool === 'sink')?.amount

    expect(charged).toBe(cardOption().price)
  })
})

describe('comprare senza fondi', () => {
  it('fallisce con quanto serviva e quanto c’era, e non muove niente', () => {
    fund('card', '799.99')

    const bought = buy()

    expect(bought).toEqual({
      ok: false,
      error: {
        code: 'error.ledger.insufficient_funds',
        pool: 'card',
        required: cardOption().price,
        available: fromString('799.99')
      }
    })
    expect(toString(ledger.balance('card'))).toBe('799.99')
    expect(toString(ledger.balance('sink'))).toBe('0')
    expect(modifiers.sourcesFor(INCOME_TARGET)).toEqual([])
  })

  it('l’anteprima e l’esecuzione danno la stessa risposta, al centesimo', () => {
    // Sono due letture diverse dello stesso fatto — una nella UI, una nel Ledger — ed è
    // esattamente la coppia che, quando diverge, spegne un pulsante che avrebbe funzionato.
    for (const funds of ['799.99', '800', '800.01']) {
      bus = createBus()
      ledger = createLedger(bus)
      modifiers = createModifiers()
      fund('card', funds)

      const preview = canBuyUpgrade(FRESH, cardOption(), ledger.balance('card'))
      expect(buy().ok).toBe(preview)
    }
  })
})

describe('comprare due volte', () => {
  it('è un esito, non un lancio: il registro dei modificatori non viene toccato', () => {
    fund('card', '2000')
    const first = buy()
    expect(first.ok).toBe(true)

    const again = buy({ upgraded: true })

    expect(again).toEqual({ ok: false, error: { code: 'error.income.already_upgraded' } })
    expect(modifiers.sourcesFor(INCOME_TARGET)).toHaveLength(1)
  })

  it('e non paga una seconda volta', () => {
    fund('card', '2000')
    buy()
    const afterFirst = toString(ledger.balance('card'))

    buy({ upgraded: true })

    expect(toString(ledger.balance('card'))).toBe(afterFirst)
  })
})

describe('comprare con uno strumento fuori dal listino', () => {
  it('è rifiutato, e l’errore dice quali andavano bene', () => {
    fund('cash', '1000')

    const bought = buy(FRESH, 'cash')

    expect(bought).toEqual({
      ok: false,
      error: {
        code: 'error.ledger.pool_not_accepted',
        pool: 'cash',
        accepted: upgradePrices().map((option) => option.pool)
      }
    })
  })

  it('e non muove niente, nemmeno sul pool che i soldi ce li aveva', () => {
    fund('cash', '1000')
    fund('card', '1000')

    buy(FRESH, 'cash')

    expect(toString(ledger.balance('cash'))).toBe('1000')
    expect(toString(ledger.balance('card'))).toBe('1000')
    expect(toString(ledger.balance('sink'))).toBe('0')
    expect(modifiers.sourcesFor(INCOME_TARGET)).toEqual([])
  })
})

describe('con cosa si paga', () => {
  it('`accepts` non affianca il listino: ne è generato', () => {
    // Scritto ricopiando le due liste — `toEqual(['card'])` — questo test direbbe soltanto che chi
    // lo ha scritto sapeva cosa c'era dentro. Il confronto è fra la dichiarazione e la sua
    // sorgente, e a renderlo sempre vero è la costruzione, non la cura di chi modifica.
    expect(UPGRADE_PAYMENT.accepts).toEqual(upgradePrices().map((option) => option.pool))
  })

  it('e i due dicono la stessa cosa davanti a ogni strumento del giocatore', () => {
    // La prova che conta: non due liste confrontate fra loro, ma una lista confrontata con un
    // **comportamento**. Per ogni pool del giocatore, ciò che il listino offre è esattamente ciò
    // che il Ledger lascia passare — e il giorno in cui una delle due si muovesse da sola, questo
    // caso lo direbbe anche se il primo restasse verde.
    const price = cardOption().price

    for (const pool of POOL_IDS.filter((id) => POOLS[id].player)) {
      bus = createBus()
      ledger = createLedger(bus)
      ledger.transaction(income(pool, price.mul(2)), { reason: 'reason.income.tick' })

      const paid = ledger.transaction(spend(pool, price), UPGRADE_PAYMENT)
      const refusedAsInstrument = !paid.ok && paid.error.code === 'error.ledger.pool_not_accepted'

      expect(refusedAsInstrument).toBe(upgradePriceFor(pool) === null)
    }
  })
})
