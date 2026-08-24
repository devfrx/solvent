import { beforeEach, describe, expect, it } from 'vitest'

import type { Transaction } from '@core/contracts/ledger'
import { fromString, toString, ZERO } from '@core/contracts/money'
import type { PaymentOption } from '@core/contracts/payment'
import { POOL_IDS, POOLS } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'
import { createBus, type Bus } from '@core/kernel/Bus'
import { createLedger, income, poolCapacity, spend, type Ledger } from '@core/kernel/Ledger'

import {
  DECLARATION_PAYMENT,
  createBuyLevel,
  createDeclare,
  levelPaymentFor
} from '../../../src/core/domains/income/commands'
import {
  canBuyLevel,
  declarationPrices,
  levelPriceFor,
  levelPrices,
  MAX_LEVEL,
  SOURCES,
  type IncomeSource
} from '../../../src/core/domains/income/rules'
import type { IncomeSourceId, IncomeState } from '../../../src/core/domains/income/types'

/**
 * L'acquisto di un livello: un comando che può fallire per tre ragioni diverse, e che non deve
 * lasciare mai saldi e stato disallineati.
 *
 * Da D019 il comando riceve lo **strumento** e ricalcola il prezzo dal listino (ADR 0027); da D044
 * riceve anche la **fonte**, e il listino è per livello. Ne discende la domanda che questo file
 * deve chiudere: che il listino e `accepts` non possano divergere **a nessun livello**.
 */

const sourceOf = (id: IncomeSourceId): IncomeSource => {
  const found = SOURCES.find((each) => each.id === id)
  if (found === undefined) throw new Error(`nessuna fonte '${id}' nell’elenco`)
  return found
}

const job = sourceOf('job')
const gigs = sourceOf('gigs')

const at = (levels: Partial<Record<IncomeSourceId, number>>, declared = false): IncomeState => ({
  levels: { job: levels.job ?? 0, gigs: levels.gigs ?? 0 },
  declared
})

/** La partita appena nata: il lavoro al primo livello, i lavoretti chiusi. */
const FRESH: IncomeState = at({ job: 1 })

/** I due strumenti del giocatore. Gli altri quattro conti non si scelgono (ADR 0020). */
type Instrument = 'cash' | 'card'

let bus: Bus
let ledger: Ledger

/**
 * L'opzione di un livello, presa **dal listino**. Ricopiarla qui proverebbe che questo file è
 * coerente con se stesso, che non è la domanda.
 */
const optionFor = (source: IncomeSource, level: number): PaymentOption => {
  const option = levelPriceFor(source, level, source.levelPool)
  if (option === null) throw new Error(`nessun listino per '${source.id}' al livello ${level}`)
  return option
}

/** Mette soldi su un pool passando dal Ledger vero: nessun saldo si scrive a mano (R06). */
const fund = (pool: Instrument, amount: string): void => {
  ledger.transaction(income(pool, fromString(amount), ZERO), { reason: 'reason.income.tick' })
}

const buy = (
  source: IncomeSource,
  state: IncomeState = FRESH,
  pool: Instrument = source.levelPool as Instrument
): ReturnType<ReturnType<typeof createBuyLevel>> =>
  createBuyLevel({ ledger })({ state, source, pool })

const total = (): string =>
  toString(POOL_IDS.reduce((sum, pool) => sum.plus(ledger.balance(pool)), fromString('0')))

/**
 * Un caveau abbastanza grande da non entrare nella domanda.
 *
 * I livelli dei lavoretti si pagano **in contanti**, e il muro del caveau è la ragione di gioco per
 * cui costa fatica arrivarci — ma non è ciò che questo file prova. Con la capienza di partenza
 * (1.000,00 €) nemmeno finanziare il caso di prova riuscirebbe, e ogni asserzione qui dentro
 * misurerebbe il caveau invece del comando. Il muro ha i propri test, e la loro sede è `system`.
 */
const roomy = (): Ledger =>
  createLedger(bus, (pool) => (pool === 'cash' ? fromString('100000000') : poolCapacity(pool)))

beforeEach(() => {
  bus = createBus()
  ledger = roomy()
})

describe('comprare un livello con i fondi che bastano', () => {
  it('riesce, scala il costo dallo strumento della fonte e alza **quel** livello', () => {
    const price = optionFor(job, 1).price
    fund('card', toString(price.plus(fromString('200'))))

    const bought = buy(job)

    expect(bought).toEqual({ ok: true, value: at({ job: 2 }) })
    expect(toString(ledger.balance('card'))).toBe('200')
  })

  it('non tocca il livello dell’altra fonte, né il regime', () => {
    const price = optionFor(gigs, 2).price
    fund('cash', toString(price))

    const bought = buy(gigs, at({ job: 3, gigs: 2 }, true))

    expect(bought).toEqual({ ok: true, value: at({ job: 3, gigs: 3 }, true) })
  })

  it('aprire una fonte chiusa è comprare il primo livello, e costa più del secondo', () => {
    const opening = optionFor(gigs, 0).price
    fund('cash', toString(opening))

    expect(buy(gigs, at({ job: 1 })).ok).toBe(true)
    expect(opening.greaterThan(optionFor(gigs, 1).price)).toBe(true)
  })

  it('il costo finisce in sink, e la somma di tutti i conti resta zero', () => {
    fund('card', toString(optionFor(job, 1).price))

    buy(job)

    expect(toString(ledger.balance('sink'))).toBe(toString(optionFor(job, 1).price))
    expect(total()).toBe('0')
  })
})

describe('INV-19 — il prezzo mostrato e quello addebitato', () => {
  it('sono **lo stesso oggetto**, non due numeri uguali', () => {
    // Per identità e non per uguaglianza: due `Decimal` con lo stesso valore passerebbero un
    // `toEqual` e potrebbero venire da due formule diverse, che è esattamente il difetto che
    // l'ADR 0053 esiste per rendere impossibile. La trappola l'ha pagata D015 (correzione 14).
    const applied: Transaction[] = []
    bus.on('money.posted', (posted) => applied.push(posted.transaction))
    fund('card', '100000')

    expect(buy(job).ok).toBe(true)

    const purchase = applied.find((moved) => moved.reason === 'reason.income.level')
    const charged = purchase?.postings.find((posting) => posting.pool === 'sink')?.amount

    expect(charged).toBe(optionFor(job, 1).price)
  })
})

describe('comprare senza fondi', () => {
  it('fallisce con quanto serviva e quanto c’era, e non muove niente', () => {
    const price = optionFor(job, 1).price
    const short = toString(price.minus(fromString('0.01')))
    fund('card', short)

    const bought = buy(job)

    expect(bought).toEqual({
      ok: false,
      error: {
        code: 'error.ledger.insufficient_funds',
        pool: 'card',
        required: price,
        available: fromString(short)
      }
    })
    expect(toString(ledger.balance('card'))).toBe(short)
    expect(toString(ledger.balance('sink'))).toBe('0')
  })

  it('l’anteprima e l’esecuzione danno la stessa risposta, al centesimo', () => {
    // Sono due letture diverse dello stesso fatto — una nella UI, una nel Ledger — ed è
    // esattamente la coppia che, quando diverge, spegne un pulsante che avrebbe funzionato.
    const price = optionFor(job, 1).price
    const cases = [price.minus(fromString('0.01')), price, price.plus(fromString('0.01'))]

    for (const funds of cases) {
      bus = createBus()
      ledger = roomy()
      fund('card', toString(funds))

      const preview = canBuyLevel(FRESH, job, optionFor(job, 1), ledger.balance('card'))
      expect(buy(job).ok).toBe(preview)
    }
  })
})

describe('comprare in cima alla scala', () => {
  it('è un esito e non un lancio: la scala finisce, e il giocatore lo sa dall’inizio', () => {
    fund('card', '1000000')

    const bought = buy(job, at({ job: MAX_LEVEL }))

    expect(bought).toEqual({ ok: false, error: { code: 'error.income.max_level' } })
  })

  it('e non paga: il listino in cima è vuoto, quindi non c’è un prezzo da addebitare', () => {
    fund('card', '1000000')

    buy(job, at({ job: MAX_LEVEL }))

    expect(toString(ledger.balance('card'))).toBe('1000000')
    expect(toString(ledger.balance('sink'))).toBe('0')
  })
})

describe('comprare con uno strumento fuori dal listino', () => {
  it('è rifiutato, e l’errore dice quali andavano bene', () => {
    fund('cash', '100000')

    const bought = buy(job, FRESH, 'cash')

    expect(bought).toEqual({
      ok: false,
      error: {
        code: 'error.ledger.pool_not_accepted',
        pool: 'cash',
        accepted: levelPrices(job, 1).map((option) => option.pool)
      }
    })
  })

  it('e vale anche al contrario: i lavoretti non si comprano con la carta', () => {
    fund('card', '100000')

    const bought = buy(gigs, at({ job: 1, gigs: 1 }), 'card')

    expect(bought.ok).toBe(false)
    expect(toString(ledger.balance('card'))).toBe('100000')
  })

  it('e non muove niente, nemmeno sul pool che i soldi ce li aveva', () => {
    fund('cash', '100000')
    fund('card', '100000')

    buy(job, FRESH, 'cash')

    expect(toString(ledger.balance('cash'))).toBe('100000')
    expect(toString(ledger.balance('card'))).toBe('100000')
    expect(toString(ledger.balance('sink'))).toBe('0')
  })
})

describe('con cosa si paga', () => {
  it('`accepts` non affianca il listino: ne è generato, **livello per livello**', () => {
    // Scritto ricopiando le due liste — `toEqual(['card'])` — questo test direbbe soltanto che chi
    // lo ha scritto sapeva cosa c'era dentro. Il confronto è fra la dichiarazione e la sua
    // sorgente, e a renderlo sempre vero è la costruzione, non la cura di chi modifica.
    for (const source of SOURCES) {
      for (let level = 0; level <= MAX_LEVEL; level += 1) {
        expect(levelPaymentFor(source, level).accepts).toEqual(
          levelPrices(source, level).map((option) => option.pool)
        )
      }
    }
  })

  it('e in cima alla scala `accepts` è vuoto: nessuno strumento compra più niente', () => {
    // È la differenza fra questo listino e quello della dichiarazione: qui si svuota perché la
    // **scala è finita** — un indice che cade fuori — non perché un booleano dice «l'hai già
    // comprato». Un `accepts` che dipende da un booleano rende variabile ciò che il Ledger deve
    // poter sapere prima di guardare una partita.
    for (const source of SOURCES) {
      expect(levelPaymentFor(source, MAX_LEVEL).accepts).toEqual([])
    }
  })

  it('e i due dicono la stessa cosa davanti a ogni strumento del giocatore', () => {
    // La prova che conta: non due liste confrontate fra loro, ma una lista confrontata con un
    // **comportamento**. Per ogni pool del giocatore, ciò che il listino offre è esattamente ciò
    // che il Ledger lascia passare.
    const price = optionFor(job, 1).price

    for (const pool of POOL_IDS.filter((id) => POOLS[id].player)) {
      bus = createBus()
      ledger = roomy()
      ledger.transaction(income(pool, price.mul(2), ZERO), { reason: 'reason.income.tick' })

      const paid = ledger.transaction(spend(pool, price), levelPaymentFor(job, 1))
      const refusedAsInstrument = !paid.ok && paid.error.code === 'error.ledger.pool_not_accepted'

      expect(refusedAsInstrument).toBe(levelPriceFor(job, 1, pool) === null)
    }
  })
})

describe('mettersi in regola', () => {
  const declare = (
    state: IncomeState = FRESH,
    pool: Instrument = 'card'
  ): ReturnType<ReturnType<typeof createDeclare>> => createDeclare({ ledger })({ state, pool })

  it('paga con la carta e cambia il regime', () => {
    fund('card', toString(BALANCE.INCOME_DECLARATION_PRICE_CARD))

    const result = declare()

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.declared).toBe(true)
    expect(ledger.balance('card').isZero()).toBe(true)
    expect(total()).toBe('0')
  })

  it('non dimentica i livelli già comprati: cambia il regime, non lo stato intero', () => {
    fund('card', toString(BALANCE.INCOME_DECLARATION_PRICE_CARD))

    const result = declare(at({ job: 4, gigs: 2 }))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual(at({ job: 4, gigs: 2 }, true))
  })

  it('due volte è un esito, non un lancio, e non paga una seconda volta', () => {
    fund('card', toString(BALANCE.INCOME_DECLARATION_PRICE_CARD))

    const result = declare(at({ job: 1 }, true))

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe('error.income.already_declared')
    expect(toString(ledger.balance('card'))).toBe(toString(BALANCE.INCOME_DECLARATION_PRICE_CARD))
  })

  it('in contanti è rifiutata, e l’errore dice quali strumenti andavano bene', () => {
    fund('cash', '900')

    const result = declare(FRESH, 'cash')

    expect(result.ok).toBe(false)
    if (!result.ok && result.error.code === 'error.ledger.pool_not_accepted') {
      expect(result.error.accepted).toEqual(['card'])
    }
    expect(toString(ledger.balance('cash'))).toBe('900')
  })

  it('senza fondi fallisce e non muove niente', () => {
    fund('card', '10')

    const result = declare()

    expect(result.ok).toBe(false)
    expect(toString(ledger.balance('card'))).toBe('10')
    expect(toString(ledger.balance('sink'))).toBe('0')
  })

  it('`accepts` non affianca il listino: ne è generato', () => {
    expect(DECLARATION_PAYMENT.accepts).toEqual(declarationPrices().map((each) => each.pool))
  })
})
