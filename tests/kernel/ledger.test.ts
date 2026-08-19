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

import { leggi, senzaCommenti } from '../helpers/sorgenti'

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

const denaro = fromString

/** INV-08 in una riga: la somma di tutti i conti, giocatore e non. */
const sommaConti = (ledger: Ledger): Money =>
  POOL_IDS.reduce((totale, pool) => totale.plus(ledger.balance(pool)), ZERO)

/** Un ledger con il suo bus e un contatore di `money.posted`: è l'impalcatura di quasi ogni caso. */
const banco = (): { ledger: Ledger; emessi: () => number } => {
  const bus = createBus()
  let emessi = 0
  bus.on('money.posted', () => {
    emessi += 1
  })
  return { ledger: createLedger(bus), emessi: () => emessi }
}

describe('atomicità', () => {
  it('se l ultimo movimento di una transazione a tre fallisce, nessuno dei tre è applicato', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    ledger.transaction(income('cash', denaro('100')), { reason: 'reason.income.tick' })

    let emessi = 0
    bus.on('money.posted', () => {
      emessi += 1
    })

    // Somma zero, primi due movimenti legittimi, il terzo preleva da una carta vuota.
    const esito = ledger.transaction(
      [
        { pool: 'world', amount: denaro('-100'), category: 'income' },
        { pool: 'cash', amount: denaro('150'), category: 'income' },
        { pool: 'card', amount: denaro('-50'), category: 'purchase' }
      ],
      { reason: 'reason.income.tick' }
    )

    expect(esito.ok).toBe(false)
    expect(ledger.balance('cash').toString()).toBe('100')
    expect(ledger.balance('card').toString()).toBe('0')
    expect(ledger.balance('world').toString()).toBe('-100')
    expect(emessi).toBe(0)
  })

  it('una transazione valida a tre movimenti applica tutto ed emette una volta sola', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    ledger.transaction(income('card', denaro('500')), { reason: 'reason.income.tick' })

    let emessi = 0
    bus.on('money.posted', () => {
      emessi += 1
    })

    const esito = ledger.transaction(
      [
        { pool: 'card', amount: denaro('-500'), category: 'transfer' },
        { pool: 'cash', amount: denaro('497.50'), category: 'transfer' },
        { pool: 'fees', amount: denaro('2.50'), category: 'fee' }
      ],
      { reason: 'reason.atm.withdraw' }
    )

    expect(esito.ok).toBe(true)
    expect(ledger.balance('card').toString()).toBe('0')
    expect(ledger.balance('cash').toString()).toBe('497.5')
    expect(ledger.balance('fees').toString()).toBe('2.5')
    expect(emessi).toBe(1)
  })

  it('una transazione dentro una transazione lancia', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    bus.on('money.posted', () => {
      ledger.transaction(income('cash', denaro('1')), { reason: 'reason.income.tick' })
    })

    expect(() =>
      ledger.transaction(income('cash', denaro('10')), { reason: 'reason.income.tick' })
    ).toThrow(NestedTransactionError)
  })
})

describe('la somma zero', () => {
  it('una transazione che non bilancia lancia', () => {
    const { ledger } = banco()

    expect(() =>
      ledger.transaction([{ pool: 'cash', amount: denaro('12'), category: 'income' }], {
        reason: 'reason.income.tick'
      })
    ).toThrow(UnbalancedTransactionError)
  })

  it('il messaggio dice di quanto sbilancia, che è l unica cosa utile per trovarlo', () => {
    const { ledger } = banco()

    expect(() =>
      ledger.transaction(
        [
          { pool: 'world', amount: denaro('-10'), category: 'income' },
          { pool: 'cash', amount: denaro('10.01'), category: 'income' }
        ],
        { reason: 'reason.income.tick' }
      )
    ).toThrow(/0\.01/)
  })

  it('dopo 1.000 transazioni casuali con seed fisso la somma è esattamente zero', () => {
    const { ledger } = banco()
    const casuale = createRng(20260819).stream('ledger')
    const GIRI = 1000
    let applicate = 0

    for (let giro = 0; giro < GIRI; giro += 1) {
      const importo = denaro((casuale.next() * 1000).toFixed(2))
      const pool: Pool = casuale.next() < 0.5 ? 'cash' : 'card'
      const dado = casuale.next()

      const esito =
        dado < 0.5
          ? ledger.transaction(income(pool, importo), { reason: 'reason.income.tick' })
          : dado < 0.8
            ? ledger.transaction(spend(pool, importo), { reason: 'reason.income.upgrade' })
            : ledger.transaction(transfer('card', 'cash', importo, importo.mul('0.005')), {
                reason: 'reason.atm.withdraw'
              })

      if (esito.ok) applicate += 1
      expect(sommaConti(ledger).isZero()).toBe(true)
    }

    // Se il generatore producesse solo rifiuti, il test sarebbe verde senza aver mosso nulla.
    expect(applicate).toBeGreaterThan(GIRI / 2)
  })
})

describe('i costruttori', () => {
  it('income costruisce il movimento da world senza che il chiamante lo nomini', () => {
    const { ledger } = banco()

    const esito = ledger.transaction(income('cash', denaro('12')), {
      reason: 'reason.income.tick'
    })

    expect(esito.ok).toBe(true)
    expect(ledger.balance('cash').toString()).toBe('12')
    expect(ledger.balance('world').toString()).toBe('-12')
  })

  it('spend manda il costo nel sink', () => {
    const { ledger } = banco()
    ledger.transaction(income('card', denaro('30')), { reason: 'reason.income.tick' })

    ledger.transaction(spend('card', denaro('30')), { reason: 'reason.income.upgrade' })

    expect(ledger.balance('card').toString()).toBe('0')
    expect(ledger.balance('sink').toString()).toBe('30')
  })

  it('transfer trattiene la commissione e la manda in fees', () => {
    const { ledger } = banco()
    ledger.transaction(income('card', denaro('500')), { reason: 'reason.income.tick' })

    ledger.transaction(transfer('card', 'cash', denaro('500'), denaro('2.50')), {
      reason: 'reason.atm.withdraw'
    })

    expect(ledger.balance('card').toString()).toBe('0')
    expect(ledger.balance('cash').toString()).toBe('497.5')
    expect(ledger.balance('fees').toString()).toBe('2.5')
  })

  it('un importo negativo passato a un costruttore lancia: è una grandezza, non un movimento', () => {
    expect(() => income('cash', denaro('-12'))).toThrow(RangeError)
    expect(() => spend('cash', denaro('-12'))).toThrow(RangeError)
    expect(() => transfer('card', 'cash', denaro('12'), denaro('-1'))).toThrow(RangeError)
  })

  it('una commissione più grande del trasferimento lancia: il destinatario riceverebbe meno di zero', () => {
    expect(() => transfer('card', 'cash', denaro('10'), denaro('20'))).toThrow(RangeError)
  })
})

describe('i rifiuti', () => {
  it('fondi insufficienti: l errore porta required e available', () => {
    const { ledger } = banco()
    ledger.transaction(income('cash', denaro('12.50')), { reason: 'reason.income.tick' })

    const esito = ledger.transaction(spend('cash', denaro('500')), {
      reason: 'reason.income.upgrade'
    })

    expect(esito.ok).toBe(false)
    if (esito.ok) return
    const errore: LedgerError = esito.error
    expect(errore.code).toBe('error.ledger.insufficient_funds')
    if (errore.code !== 'error.ledger.insufficient_funds') return
    expect(errore.pool).toBe('cash')
    expect(errore.required.toString()).toBe('500')
    expect(errore.available.toString()).toBe('12.5')
  })

  it('pool non accettato: l errore elenca quali sarebbero andati bene', () => {
    const { ledger } = banco()
    ledger.transaction(income('cash', denaro('100')), { reason: 'reason.income.tick' })

    const esito = ledger.transaction(spend('cash', denaro('30')), {
      reason: 'reason.income.upgrade',
      accepts: ['card']
    })

    expect(esito.ok).toBe(false)
    if (esito.ok) return
    const errore: LedgerError = esito.error
    expect(errore.code).toBe('error.ledger.pool_not_accepted')
    if (errore.code !== 'error.ledger.pool_not_accepted') return
    expect(errore.pool).toBe('cash')
    expect(errore.accepted).toEqual(['card'])
  })

  it('i conti non-giocatore non passano da accepts: sono contabilità, non strumenti', () => {
    const { ledger } = banco()

    const esito = ledger.transaction(income('cash', denaro('10')), {
      reason: 'reason.income.tick',
      accepts: ['cash']
    })

    expect(esito.ok).toBe(true)
    expect(ledger.balance('world').toString()).toBe('-10')
  })

  it('un importo non finito è un rifiuto, non un crollo', () => {
    const { ledger } = banco()
    const rotto = denaro('1').div(ZERO)

    const esito = ledger.transaction(
      [
        { pool: 'world', amount: rotto.neg(), category: 'income' },
        { pool: 'cash', amount: rotto, category: 'income' }
      ],
      { reason: 'reason.income.tick' }
    )

    expect(esito.ok).toBe(false)
    if (esito.ok) return
    expect(esito.error.code).toBe('error.ledger.invalid_amount')
  })

  it('un rifiuto non muove niente e non emette niente', () => {
    const { ledger, emessi } = banco()

    ledger.transaction(spend('cash', denaro('1')), { reason: 'reason.income.upgrade' })

    expect(sommaConti(ledger).isZero()).toBe(true)
    expect(ledger.balance('cash').toString()).toBe('0')
    expect(emessi()).toBe(0)
  })
})

describe('l evento', () => {
  it('l handler legge i saldi nuovi, tutti', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    let vistiNelPayload: Record<string, string> = {}
    let vistiChiedendo: Record<string, string> = {}

    bus.on('money.posted', ({ balances }) => {
      vistiNelPayload = Object.fromEntries(
        POOL_IDS.map((pool) => [pool, balances[pool].toString()])
      )
      vistiChiedendo = Object.fromEntries(
        POOL_IDS.map((pool) => [pool, ledger.balance(pool).toString()])
      )
    })

    // Due transazioni: se l'evento portasse i saldi vecchi, l'handler vedrebbe 10, non 40.
    ledger.transaction(income('cash', denaro('10')), { reason: 'reason.income.tick' })
    ledger.transaction(income('cash', denaro('30')), { reason: 'reason.income.tick' })

    expect(vistiNelPayload['cash']).toBe('40')
    expect(vistiNelPayload['world']).toBe('-40')
    expect(vistiChiedendo).toEqual(vistiNelPayload)
  })

  it('porta la transazione intera, con la sua ragione e le sue righe', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    let ragione = ''
    let righe: readonly Posting[] = []

    bus.on('money.posted', ({ transaction }) => {
      ragione = transaction.reason
      righe = transaction.postings
    })

    ledger.transaction(income('cash', denaro('7')), { reason: 'reason.income.tick' })

    expect(ragione).toBe('reason.income.tick')
    expect(righe.map((riga) => riga.pool)).toEqual(['world', 'cash'])
  })

  it('la lista di movimenti del chiamante non è la stessa che finisce nell evento', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    let righe: readonly Posting[] = []
    bus.on('money.posted', ({ transaction }) => {
      righe = transaction.postings
    })

    const movimenti: Posting[] = [
      { pool: 'world', amount: denaro('-5'), category: 'income' },
      { pool: 'cash', amount: denaro('5'), category: 'income' }
    ]
    ledger.transaction(movimenti, { reason: 'reason.income.tick' })
    movimenti.pop()

    expect(righe).toHaveLength(2)
  })
})

describe('la persistenza', () => {
  it('nel salvataggio i saldi sono stringhe decimali, conti non-giocatore inclusi', () => {
    const { ledger } = banco()
    ledger.transaction(income('cash', denaro('12.50')), { reason: 'reason.income.tick' })

    const salvato = ledger.save()

    expect(salvato.balances.cash).toBe('12.5')
    expect(salvato.balances.world).toBe('-12.5')
    expect(Object.keys(salvato.balances).sort()).toEqual([...POOL_IDS].sort())
  })

  it('0,1 più 0,2 salvato e ricaricato è esattamente 0,3', () => {
    const { ledger } = banco()
    ledger.transaction(income('cash', denaro('0.1')), { reason: 'reason.income.tick' })
    ledger.transaction(income('cash', denaro('0.2')), { reason: 'reason.income.tick' })

    const ricaricato = createLedger(createBus())
    ricaricato.load(ledger.save())

    expect(ricaricato.balance('cash').toString()).toBe('0.3')
    expect(ricaricato.balance('cash').equals(denaro('0.3'))).toBe(true)
  })

  it('dopo load la somma di tutti i conti è ancora zero', () => {
    const { ledger } = banco()
    ledger.transaction(income('card', denaro('500')), { reason: 'reason.income.tick' })
    ledger.transaction(transfer('card', 'cash', denaro('500'), denaro('2.50')), {
      reason: 'reason.atm.withdraw'
    })

    const ricaricato = createLedger(createBus())
    ricaricato.load(ledger.save())

    expect(sommaConti(ricaricato).isZero()).toBe(true)
  })

  it('un salvataggio i cui conti non sommano a zero lancia invece di rompere l invariante', () => {
    const ricaricato = createLedger(createBus())

    expect(() =>
      ricaricato.load({
        balances: { cash: '100', card: '0', world: '0', sink: '0', fees: '0', house: '0' }
      })
    ).toThrow(UnbalancedSaveError)
  })

  it('caricare non emette: non è un evento economico', () => {
    const { ledger } = banco()
    ledger.transaction(income('cash', denaro('9')), { reason: 'reason.income.tick' })

    const bus = createBus()
    let emessi = 0
    bus.on('money.posted', () => {
      emessi += 1
    })
    createLedger(bus).load(ledger.save())

    expect(emessi).toBe(0)
  })
})

describe('il reset', () => {
  it('hard azzera tutto, invariante inclusa', () => {
    const { ledger } = banco()
    ledger.transaction(income('cash', denaro('123.45')), { reason: 'reason.income.tick' })

    ledger.reset('hard')

    for (const pool of POOL_IDS) expect(ledger.balance(pool).toString()).toBe('0')
    expect(sommaConti(ledger).isZero()).toBe(true)
  })

  it('soft non tocca i saldi: azzerare a un prestige è una transazione, non un reset', () => {
    const { ledger } = banco()
    ledger.transaction(income('cash', denaro('123.45')), { reason: 'reason.income.tick' })

    ledger.reset('soft')

    expect(ledger.balance('cash').toString()).toBe('123.45')
    expect(ledger.balance('world').toString()).toBe('-123.45')
    expect(sommaConti(ledger).isZero()).toBe(true)
  })
})

describe('i saldi sono privati', () => {
  it('non c è una Map raggiungibile da fuori', () => {
    const { ledger } = banco()

    for (const valore of Object.values(ledger)) {
      expect(valore instanceof Map).toBe(false)
    }
  })

  it('la Map dei saldi non compare in nessun export', () => {
    const sorgente = senzaCommenti(leggi('src/core/kernel/Ledger.ts'))
    const esportazioni = sorgente.match(/export[^\n]*/g) ?? []

    expect(esportazioni.filter((riga) => riga.includes('saldi'))).toEqual([])
    expect(sorgente).toMatch(/const saldi = new Map<Pool, Money>\(\)/)
  })

  it('due ledger non condividono i saldi', () => {
    const { ledger } = banco()
    const altro = createLedger(createBus())

    ledger.transaction(income('cash', denaro('50')), { reason: 'reason.income.tick' })

    expect(altro.balance('cash').toString()).toBe('0')
  })
})
