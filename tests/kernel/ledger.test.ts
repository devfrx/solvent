import { describe, expect, it } from 'vitest'

import type { LedgerError, Posting } from '@core/contracts/ledger'
import type { Money } from '@core/contracts/money'
import { fromString, ZERO } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import { POOL_IDS } from '@core/contracts/pools'

import { createBus } from '@core/kernel/Bus'
import type { Ledger } from '@core/kernel/Ledger'
import {
  createLedger,
  income,
  NestedTransactionError,
  spend,
  transfer,
  UnbalancedSaveError,
  UnbalancedTransactionError
} from '@core/kernel/Ledger'
import { createRng } from '@core/kernel/Rng'

import { read, withoutComments } from '../helpers/sources'

/**
 * R06 · A05 · ADR 0003, 0017, 0019, 0020 — l'unica porta del denaro.
 *
 * Il difetto A05 erano i saldi scritti da più punti, con due iniezioni di dipendenza basate su
 * variabili globali: non c'era modo di rispondere a "da dove arrivano questi soldi?" se non
 * leggendo tutto il codice. Qui i saldi vivono in una `Map` privata nella closure — non c'è la
 * superficie per scriverli, non è che sia vietato.
 *
 * I due test che contano più di tutti gli altri sono l'atomicità (INV-09) e la somma zero
 * (INV-08): il primo è scritto per primo di proposito, perché è l'unico modo di essere sicuri che
 * la validazione avvenga **prima** dell'applicazione e non a metà del ciclo.
 */

const money = fromString

/** INV-08 in una riga: la somma di tutti i conti, giocatore e non. */
const totalOfAccounts = (ledger: Ledger): Money =>
  POOL_IDS.reduce((total, pool) => total.plus(ledger.balance(pool)), ZERO)

/** Un ledger con il suo bus e un contatore di `money.posted`: è l'impalcatura di quasi ogni caso. */
const bench = (): { ledger: Ledger; emitted: () => number } => {
  const bus = createBus()
  let emitted = 0
  bus.on('money.posted', () => {
    emitted += 1
  })
  return { ledger: createLedger(bus), emitted: () => emitted }
}

describe('atomicità', () => {
  it('se l ultimo movimento di una transazione a tre fallisce, nessuno dei tre è applicato', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    ledger.transaction(income('cash', money('100'), ZERO), { reason: 'reason.income.tick' })

    let emitted = 0
    bus.on('money.posted', () => {
      emitted += 1
    })

    // Somma zero, primi due movimenti legittimi, il terzo preleva da una carta vuota.
    const result = ledger.transaction(
      [
        { pool: 'world', amount: money('-100'), category: 'income' },
        { pool: 'cash', amount: money('150'), category: 'income' },
        { pool: 'card', amount: money('-50'), category: 'purchase' }
      ],
      { reason: 'reason.income.tick' }
    )

    expect(result.ok).toBe(false)
    expect(ledger.balance('cash').toString()).toBe('100')
    expect(ledger.balance('card').toString()).toBe('0')
    expect(ledger.balance('world').toString()).toBe('-100')
    expect(emitted).toBe(0)
  })

  it('una transazione valida a tre movimenti applica tutto ed emette una volta sola', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    ledger.transaction(income('card', money('500'), ZERO), { reason: 'reason.income.tick' })

    let emitted = 0
    bus.on('money.posted', () => {
      emitted += 1
    })

    const result = ledger.transaction(
      [
        { pool: 'card', amount: money('-500'), category: 'transfer' },
        { pool: 'cash', amount: money('497.50'), category: 'transfer' },
        { pool: 'fees', amount: money('2.50'), category: 'fee' }
      ],
      { reason: 'reason.atm.withdraw' }
    )

    expect(result.ok).toBe(true)
    expect(ledger.balance('card').toString()).toBe('0')
    expect(ledger.balance('cash').toString()).toBe('497.5')
    expect(ledger.balance('fees').toString()).toBe('2.5')
    expect(emitted).toBe(1)
  })

  it('una transazione dentro una transazione lancia', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    bus.on('money.posted', () => {
      ledger.transaction(income('cash', money('1'), ZERO), { reason: 'reason.income.tick' })
    })

    expect(() =>
      ledger.transaction(income('cash', money('10'), ZERO), { reason: 'reason.income.tick' })
    ).toThrow(NestedTransactionError)
  })
})

describe('la somma zero', () => {
  it('una transazione che non bilancia lancia', () => {
    const { ledger } = bench()

    expect(() =>
      ledger.transaction([{ pool: 'cash', amount: money('12'), category: 'income' }], {
        reason: 'reason.income.tick'
      })
    ).toThrow(UnbalancedTransactionError)
  })

  it('il messaggio dice di quanto sbilancia, che è l unica cosa utile per trovarlo', () => {
    const { ledger } = bench()

    expect(() =>
      ledger.transaction(
        [
          { pool: 'world', amount: money('-10'), category: 'income' },
          { pool: 'cash', amount: money('10.01'), category: 'income' }
        ],
        { reason: 'reason.income.tick' }
      )
    ).toThrow(/0\.01/)
  })

  it('dopo 1.000 transazioni casuali con seed fisso la somma è esattamente zero', () => {
    const { ledger } = bench()
    const random = createRng(20260819).stream('ledger')
    const ROUNDS = 1000
    let applied = 0

    for (let round = 0; round < ROUNDS; round += 1) {
      const amount = money((random.next() * 1000).toFixed(2))
      const pool: Pool = random.next() < 0.5 ? 'cash' : 'card'
      const roll = random.next()

      const result =
        roll < 0.5
          ? ledger.transaction(income(pool, amount, ZERO), { reason: 'reason.income.tick' })
          : roll < 0.8
            ? ledger.transaction(spend(pool, amount), { reason: 'reason.income.level' })
            : ledger.transaction(transfer('card', 'cash', amount, amount.mul('0.005')), {
                reason: 'reason.atm.withdraw'
              })

      if (result.ok) applied += 1
      expect(totalOfAccounts(ledger).isZero()).toBe(true)
    }

    // Se il generatore producesse solo rifiuti, il test sarebbe verde senza aver mosso nulla.
    expect(applied).toBeGreaterThan(ROUNDS / 2)
  })
})

describe('i costruttori', () => {
  it('income costruisce il movimento da world senza che il chiamante lo nomini', () => {
    const { ledger } = bench()

    const result = ledger.transaction(income('cash', money('12'), ZERO), {
      reason: 'reason.income.tick'
    })

    expect(result.ok).toBe(true)
    expect(ledger.balance('cash').toString()).toBe('12')
    expect(ledger.balance('world').toString()).toBe('-12')
  })

  it('income trattiene la parte dello Stato e la manda in tax', () => {
    const { ledger } = bench()

    const result = ledger.transaction(income('card', money('100'), money('3')), {
      reason: 'reason.income.tick'
    })

    expect(result.ok).toBe(true)
    expect(ledger.balance('card').toString()).toBe('97')
    expect(ledger.balance('tax').toString()).toBe('3')
    expect(ledger.balance('world').toString()).toBe('-100')
  })

  it('una trattenuta a zero non scrive un movimento da zero: non c è niente da raccontare', () => {
    expect(income('cash', money('12'), ZERO)).toHaveLength(2)
    expect(income('card', money('12'), money('1'))).toHaveLength(3)
  })

  it('una trattenuta più grande del reddito lancia: al giocatore arriverebbe meno di zero', () => {
    expect(() => income('card', money('10'), money('20'))).toThrow(RangeError)
  })

  it('spend manda il costo nel sink', () => {
    const { ledger } = bench()
    ledger.transaction(income('card', money('30'), ZERO), { reason: 'reason.income.tick' })

    ledger.transaction(spend('card', money('30')), { reason: 'reason.income.level' })

    expect(ledger.balance('card').toString()).toBe('0')
    expect(ledger.balance('sink').toString()).toBe('30')
  })

  it('transfer trattiene la commissione e la manda in fees', () => {
    const { ledger } = bench()
    ledger.transaction(income('card', money('500'), ZERO), { reason: 'reason.income.tick' })

    ledger.transaction(transfer('card', 'cash', money('500'), money('2.50')), {
      reason: 'reason.atm.withdraw'
    })

    expect(ledger.balance('card').toString()).toBe('0')
    expect(ledger.balance('cash').toString()).toBe('497.5')
    expect(ledger.balance('fees').toString()).toBe('2.5')
  })

  it('un importo negativo passato a un costruttore lancia: è una grandezza, non un movimento', () => {
    expect(() => income('cash', money('-12'), ZERO)).toThrow(RangeError)
    expect(() => income('cash', money('12'), money('-1'))).toThrow(RangeError)
    expect(() => spend('cash', money('-12'))).toThrow(RangeError)
    expect(() => transfer('card', 'cash', money('12'), money('-1'))).toThrow(RangeError)
  })

  it('una commissione più grande del trasferimento lancia: il destinatario riceverebbe meno di zero', () => {
    expect(() => transfer('card', 'cash', money('10'), money('20'))).toThrow(RangeError)
  })
})

describe('i rifiuti', () => {
  it('fondi insufficienti: l errore porta required e available', () => {
    const { ledger } = bench()
    ledger.transaction(income('cash', money('12.50'), ZERO), { reason: 'reason.income.tick' })

    const result = ledger.transaction(spend('cash', money('500')), {
      reason: 'reason.income.level'
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    const error: LedgerError = result.error
    expect(error.code).toBe('error.ledger.insufficient_funds')
    if (error.code !== 'error.ledger.insufficient_funds') return
    expect(error.pool).toBe('cash')
    expect(error.required.toString()).toBe('500')
    expect(error.available.toString()).toBe('12.5')
  })

  it('pool non accettato: l errore elenca quali sarebbero andati bene', () => {
    const { ledger } = bench()
    ledger.transaction(income('cash', money('100'), ZERO), { reason: 'reason.income.tick' })

    const result = ledger.transaction(spend('cash', money('30')), {
      reason: 'reason.income.level',
      accepts: ['card']
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    const error: LedgerError = result.error
    expect(error.code).toBe('error.ledger.pool_not_accepted')
    if (error.code !== 'error.ledger.pool_not_accepted') return
    expect(error.pool).toBe('cash')
    expect(error.accepted).toEqual(['card'])
  })

  it('i conti non-giocatore non passano da accepts: sono contabilità, non strumenti', () => {
    const { ledger } = bench()

    const result = ledger.transaction(income('cash', money('10'), ZERO), {
      reason: 'reason.income.tick',
      accepts: ['cash']
    })

    expect(result.ok).toBe(true)
    expect(ledger.balance('world').toString()).toBe('-10')
  })

  it('un importo non finito è un rifiuto, non un crollo', () => {
    const { ledger } = bench()
    const broken = money('1').div(ZERO)

    const result = ledger.transaction(
      [
        { pool: 'world', amount: broken.neg(), category: 'income' },
        { pool: 'cash', amount: broken, category: 'income' }
      ],
      { reason: 'reason.income.tick' }
    )

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('error.ledger.invalid_amount')
  })

  it('un rifiuto non muove niente e non emette niente', () => {
    const { ledger, emitted } = bench()

    ledger.transaction(spend('cash', money('1')), { reason: 'reason.income.level' })

    expect(totalOfAccounts(ledger).isZero()).toBe(true)
    expect(ledger.balance('cash').toString()).toBe('0')
    expect(emitted()).toBe(0)
  })
})

describe('l evento', () => {
  it('l handler legge i saldi nuovi, tutti', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    let seenInPayload: Record<string, string> = {}
    let seenByAsking: Record<string, string> = {}

    bus.on('money.posted', ({ balances }) => {
      seenInPayload = Object.fromEntries(POOL_IDS.map((pool) => [pool, balances[pool].toString()]))
      seenByAsking = Object.fromEntries(
        POOL_IDS.map((pool) => [pool, ledger.balance(pool).toString()])
      )
    })

    // Due transazioni: se l'evento portasse i saldi vecchi, l'handler vedrebbe 10, non 40.
    ledger.transaction(income('cash', money('10'), ZERO), { reason: 'reason.income.tick' })
    ledger.transaction(income('cash', money('30'), ZERO), { reason: 'reason.income.tick' })

    expect(seenInPayload['cash']).toBe('40')
    expect(seenInPayload['world']).toBe('-40')
    expect(seenByAsking).toEqual(seenInPayload)
  })

  it('porta la transazione intera, con la sua ragione e le sue righe', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    let reason = ''
    let rows: readonly Posting[] = []

    bus.on('money.posted', ({ transaction }) => {
      reason = transaction.reason
      rows = transaction.postings
    })

    ledger.transaction(income('cash', money('7'), ZERO), { reason: 'reason.income.tick' })

    expect(reason).toBe('reason.income.tick')
    expect(rows.map((row) => row.pool)).toEqual(['world', 'cash'])
  })

  it('la lista di movimenti del chiamante non è la stessa che finisce nell evento', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    let rows: readonly Posting[] = []
    bus.on('money.posted', ({ transaction }) => {
      rows = transaction.postings
    })

    const postings: Posting[] = [
      { pool: 'world', amount: money('-5'), category: 'income' },
      { pool: 'cash', amount: money('5'), category: 'income' }
    ]
    ledger.transaction(postings, { reason: 'reason.income.tick' })
    postings.pop()

    expect(rows).toHaveLength(2)
  })
})

describe('la persistenza', () => {
  it('nel salvataggio i saldi sono stringhe decimali, conti non-giocatore inclusi', () => {
    const { ledger } = bench()
    ledger.transaction(income('cash', money('12.50'), ZERO), { reason: 'reason.income.tick' })

    const saved = ledger.save()

    expect(saved.balances.cash).toBe('12.5')
    expect(saved.balances.world).toBe('-12.5')
    expect(Object.keys(saved.balances).sort()).toEqual([...POOL_IDS].sort())
  })

  it('0,1 più 0,2 salvato e ricaricato è esattamente 0,3', () => {
    const { ledger } = bench()
    ledger.transaction(income('cash', money('0.1'), ZERO), { reason: 'reason.income.tick' })
    ledger.transaction(income('cash', money('0.2'), ZERO), { reason: 'reason.income.tick' })

    const reloaded = createLedger(createBus())
    reloaded.load(ledger.save())

    expect(reloaded.balance('cash').toString()).toBe('0.3')
    expect(reloaded.balance('cash').equals(money('0.3'))).toBe(true)
  })

  it('dopo load la somma di tutti i conti è ancora zero', () => {
    const { ledger } = bench()
    ledger.transaction(income('card', money('500'), ZERO), { reason: 'reason.income.tick' })
    ledger.transaction(transfer('card', 'cash', money('500'), money('2.50')), {
      reason: 'reason.atm.withdraw'
    })

    const reloaded = createLedger(createBus())
    reloaded.load(ledger.save())

    expect(totalOfAccounts(reloaded).isZero()).toBe(true)
  })

  it('un salvataggio i cui conti non sommano a zero lancia invece di rompere l invariante', () => {
    const reloaded = createLedger(createBus())

    expect(() =>
      reloaded.load({
        balances: { cash: '100', card: '0', world: '0', sink: '0', fees: '0', house: '0', tax: '0' }
      })
    ).toThrow(UnbalancedSaveError)
  })

  it('caricare non emette: non è un evento economico', () => {
    const { ledger } = bench()
    ledger.transaction(income('cash', money('9'), ZERO), { reason: 'reason.income.tick' })

    const bus = createBus()
    let emitted = 0
    bus.on('money.posted', () => {
      emitted += 1
    })
    createLedger(bus).load(ledger.save())

    expect(emitted).toBe(0)
  })
})

describe('il reset', () => {
  it('hard azzera tutto, invariante inclusa', () => {
    const { ledger } = bench()
    ledger.transaction(income('cash', money('123.45'), ZERO), { reason: 'reason.income.tick' })

    ledger.reset('hard')

    for (const pool of POOL_IDS) expect(ledger.balance(pool).toString()).toBe('0')
    expect(totalOfAccounts(ledger).isZero()).toBe(true)
  })

  it('soft non tocca i saldi: azzerare a un prestige è una transazione, non un reset', () => {
    const { ledger } = bench()
    ledger.transaction(income('cash', money('123.45'), ZERO), { reason: 'reason.income.tick' })

    ledger.reset('soft')

    expect(ledger.balance('cash').toString()).toBe('123.45')
    expect(ledger.balance('world').toString()).toBe('-123.45')
    expect(totalOfAccounts(ledger).isZero()).toBe(true)
  })
})

describe('i saldi sono privati', () => {
  it('non c è una Map raggiungibile da fuori', () => {
    const { ledger } = bench()

    for (const value of Object.values(ledger)) {
      expect(value instanceof Map).toBe(false)
    }
  })

  it('la Map dei saldi non compare in nessun export', () => {
    const source = withoutComments(read('src/core/kernel/Ledger.ts'))
    const exportLines = source.match(/export[^\n]*/g) ?? []

    expect(exportLines.filter((line) => line.includes('balances'))).toEqual([])
    expect(source).toMatch(/const balances = new Map<Pool, Money>\(\)/)
  })

  it('due ledger non condividono i saldi', () => {
    const { ledger } = bench()
    const other = createLedger(createBus())

    ledger.transaction(income('cash', money('50'), ZERO), { reason: 'reason.income.tick' })

    expect(other.balance('cash').toString()).toBe('0')
  })
})
