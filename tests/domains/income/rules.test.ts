import { describe, expect, it } from 'vitest'

import { fromString, toString, ZERO } from '@core/contracts/money'
import type { PaymentOption } from '@core/contracts/payment'
import { POOL_IDS, POOLS } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'
import { createModifiers } from '@core/balance/modifiers'
import { clock, ticks } from '@core/kernel/Clock'

import {
  canBuyLevel,
  canDeclare,
  declarationPriceFor,
  declarationPrices,
  INCOME_PLATEAU,
  INCOME_TARGET,
  incomeByRegime,
  incomeOver,
  incomePerSecond,
  isMaxLevel,
  levelOf,
  levelPriceFor,
  levelPrices,
  MAX_LEVEL,
  regimeOf,
  SOURCES,
  yieldAt,
  type IncomeSource
} from '../../../src/core/domains/income/rules'
import type { IncomeSourceId, IncomeState } from '../../../src/core/domains/income/types'
import { read } from '../../helpers/sources'

/**
 * Le regole pure del reddito, provate senza kernel, senza Ledger e senza sistema: è esattamente
 * ciò che la loro purezza serve a comprare.
 */

const noModifiers = createModifiers()

/** La fonte dietro un id, presa **dall'elenco** invece di essere ricostruita qui. */
const sourceOf = (id: IncomeSourceId): IncomeSource => {
  const found = SOURCES.find((each) => each.id === id)
  if (found === undefined) throw new Error(`nessuna fonte '${id}' nell’elenco`)
  return found
}

const job = sourceOf('job')
const gigs = sourceOf('gigs')

/** Uno stato con i livelli che servono al caso, senza scrivere l'oggetto intero ogni volta. */
const at = (levels: Partial<Record<IncomeSourceId, number>>, declared = false): IncomeState => ({
  levels: { job: levels.job ?? 0, gigs: levels.gigs ?? 0 },
  declared
})

/** La partita appena nata: il lavoro al primo livello, i lavoretti chiusi. */
const fresh = at({ job: 1 })

describe('l’elenco delle fonti', () => {
  it('ne dichiara due, e ciascuna dice dove atterra e con cosa si paga', () => {
    expect(SOURCES.map((each) => each.id)).toEqual(['job', 'gigs'])
    expect(job.levelPool).toBe('card')
    expect(gigs.levelPool).toBe('cash')
  })

  it('i lavoretti in regola non ci vanno, e a dirlo è un null e non il loro id', () => {
    expect(gigs.declared).toBeNull()
    expect(job.declared).not.toBeNull()
  })

  it('al primo livello ciascuna rende quello che la costante dichiara', () => {
    // Uguaglianza e non identità, al contrario dei prezzi: una resa non attraversa INV-19 — non
    // c'è un comando che la rilegga per applicarla — quindi qui la domanda è quanto vale, non se è
    // lo stesso oggetto. Il fattore di crescita alla potenza di zero produce un `Decimal` nuovo, e
    // contorcere la formula per evitarlo comprerebbe una garanzia che non serve a nessuno.
    expect(toString(yieldAt(job, 1))).toBe(toString(BALANCE.INCOME_JOB_BASE_PER_SECOND))
    expect(toString(yieldAt(gigs, 1))).toBe(toString(BALANCE.INCOME_GIGS_BASE_PER_SECOND))
  })
})

describe('la scala di una fonte', () => {
  it('al livello zero non rende niente: una fonte chiusa è chiusa', () => {
    expect(yieldAt(job, 0).isZero()).toBe(true)
    expect(yieldAt(gigs, 0).isZero()).toBe(true)
  })

  it('cresce del fattore dichiarato a ogni gradino', () => {
    for (let level = 2; level <= MAX_LEVEL; level += 1) {
      expect(toString(yieldAt(job, level))).toBe(
        toString(yieldAt(job, level - 1).mul(BALANCE.INCOME_LEVEL_GROWTH))
      )
    }
  })

  it('è finita, e un livello fuori scala si stringe invece di dare undefined', () => {
    // Un livello fuori scala arriva da un salvataggio, cioè da fuori, e una resa `undefined`
    // diventerebbe un importo non finito che il Ledger scopre molto più a valle.
    expect(toString(yieldAt(job, MAX_LEVEL + 5))).toBe(toString(yieldAt(job, MAX_LEVEL)))
    expect(toString(yieldAt(job, -3))).toBe(toString(yieldAt(job, 0)))
  })

  it('l’ultimo livello si dice con isMaxLevel, e prima non è mai vero', () => {
    for (let level = 0; level < MAX_LEVEL; level += 1) {
      expect(isMaxLevel(at({ job: level }), job)).toBe(false)
    }
    expect(isMaxLevel(at({ job: MAX_LEVEL }), job)).toBe(true)
  })

  it('levelOf legge il livello della fonte giusta', () => {
    const state = at({ job: 3, gigs: 5 })
    expect(levelOf(state, job)).toBe(3)
    expect(levelOf(state, gigs)).toBe(5)
  })
})

describe('il prezzo di un livello — INV-28', () => {
  it('è l’incremento di resa per i secondi di rientro, per **ogni** livello di **ogni** fonte', () => {
    // È la proprietà che l'ADR 0053 esiste per avere, e si misura dal **listino**: chi scrivesse
    // un prezzo a mano da qualche parte lo farebbe diventare rosso qui.
    for (const source of SOURCES) {
      for (let level = 0; level < MAX_LEVEL; level += 1) {
        const [option] = levelPrices(source, level)
        if (option === undefined) throw new Error('listino atteso sotto l’ultimo livello')

        const gained = yieldAt(source, level + 1).minus(yieldAt(source, level))
        expect(toString(option.price)).toBe(toString(gained.mul(BALANCE.INCOME_PAYBACK_SECONDS)))
      }
    }
  })

  it('in cima alla scala il listino è **vuoto**, e la lista vuota è la risposta', () => {
    // Non un caso limite trattato a parte: i prezzi hanno un elemento in meno della scala, quindi
    // l'indice cade fuori da solo. Chi legge non trova un ramo che distingue «si può» da «non si
    // può» — trova una lista.
    for (const source of SOURCES) {
      expect(levelPrices(source, MAX_LEVEL)).toEqual([])
      expect(levelPriceFor(source, MAX_LEVEL, source.levelPool)).toBeNull()
    }
  })

  it('aprire una fonte costa più del livello successivo, e non è un difetto', () => {
    // Aprirla dà tutta la resa base, il livello dopo dà solo l'incremento. Per euro di reddito
    // comprato il prezzo è identico — è la regola vista da vicino.
    for (const source of SOURCES) {
      const [opening] = levelPrices(source, 0)
      const [second] = levelPrices(source, 1)
      if (opening === undefined || second === undefined) throw new Error('due listini attesi')
      expect(opening.price.greaterThan(second.price)).toBe(true)
    }
  })

  it('ogni fonte lo offre **solo** con il proprio strumento', () => {
    expect(levelPriceFor(job, 1, 'cash')).toBeNull()
    expect(levelPriceFor(gigs, 1, 'card')).toBeNull()
    expect(levelPriceFor(job, 1, 'card')).not.toBeNull()
    expect(levelPriceFor(gigs, 1, 'cash')).not.toBeNull()
  })

  it('e il prezzo è **lo stesso oggetto** a ogni lettura, non un numero uguale (INV-19)', () => {
    // La UI lo legge prima di mostrarlo e il comando lo rilegge prima di pagarlo: due `Decimal`
    // uguali passerebbero un `toEqual` e si muoverebbero separatamente.
    expect(levelPriceFor(job, 2, 'card')?.price).toBe(levelPriceFor(job, 2, 'card')?.price)
  })

  it('non offre nessuno dei conti che strumenti non sono (ADR 0020)', () => {
    for (const pool of POOL_IDS.filter((id) => !POOLS[id].player)) {
      expect(levelPriceFor(job, 1, pool)).toBeNull()
      expect(levelPriceFor(gigs, 1, pool)).toBeNull()
    }
  })

  it('è comprabile solo se non si è in cima e se lo strumento scelto basta', () => {
    const option = levelPriceFor(job, 1, 'card') as PaymentOption
    const state = at({ job: 1 })

    expect(canBuyLevel(state, job, option, option.price)).toBe(true)
    expect(canBuyLevel(state, job, option, option.price.plus(fromString('0.01')))).toBe(true)
    expect(canBuyLevel(state, job, option, option.price.minus(fromString('0.01')))).toBe(false)
    expect(canBuyLevel(at({ job: MAX_LEVEL }), job, option, option.price.mul(10))).toBe(false)
  })
})

describe('il plateau', () => {
  it('è la somma delle fonti all’ultimo livello, calcolata e non scritta', () => {
    const summed = SOURCES.reduce((total, each) => total.plus(yieldAt(each, MAX_LEVEL)), ZERO)
    expect(toString(INCOME_PLATEAU)).toBe(toString(summed))
  })

  it('e il gioco non lo supera comprando: al massimo di tutto, il reddito è quello', () => {
    const everything: IncomeState = { levels: { job: MAX_LEVEL, gigs: MAX_LEVEL }, declared: false }
    expect(toString(incomePerSecond(everything, noModifiers))).toBe(toString(INCOME_PLATEAU))
  })

  it('e in cima **entrambi** i listini sono vuoti: non c’è più niente da comprare', () => {
    for (const source of SOURCES) {
      expect(levelPrices(source, MAX_LEVEL)).toEqual([])
    }
  })
})

describe('il reddito', () => {
  it('appena nato è quello con cui la partita si è sempre aperta', () => {
    expect(toString(incomePerSecond(fresh, noModifiers))).toBe(
      toString(BALANCE.INCOME_JOB_BASE_PER_SECOND)
    )
  })

  it('è la somma delle fonti aperte', () => {
    const both = at({ job: 1, gigs: 1 })
    expect(toString(incomePerSecond(both, noModifiers))).toBe(
      toString(BALANCE.INCOME_JOB_BASE_PER_SECOND.plus(BALANCE.INCOME_GIGS_BASE_PER_SECOND))
    )
  })

  it('su più tick è il tasso al tick moltiplicato per quanti ne sono passati', () => {
    const perTick = clock.perSecondToPerTick(BALANCE.INCOME_JOB_BASE_PER_SECOND)
    const [one] = incomeOver(clock, fresh, noModifiers, ticks(1))
    const [thirty] = incomeOver(clock, fresh, noModifiers, ticks(30))

    expect(toString(one?.amount ?? ZERO)).toBe(toString(perTick))
    expect(toString(thirty?.amount ?? ZERO)).toBe(toString(perTick.mul(30)))
  })

  it('un secondo di tick vale esattamente il reddito al secondo', () => {
    const oneSecond = clock.secondsToTicks(clock.ticksToSeconds(ticks(10)))
    const [group] = incomeOver(clock, fresh, noModifiers, oneSecond)

    expect(toString(group?.amount ?? ZERO)).toBe(toString(BALANCE.INCOME_JOB_BASE_PER_SECOND))
  })

  it('i modificatori sono al secondo, come la base: un add non vale dieci volte tanto', () => {
    // Comporre dopo la conversione a tick darebbe 1,2 + 8 al tick, cioè 92,00 €/s: il `mult` non
    // se ne accorgerebbe e il difetto resterebbe invisibile fino al primo `add`.
    const modifiers = createModifiers()
    modifiers.register({
      id: 'test.add',
      target: INCOME_TARGET,
      kind: 'add',
      value: fromString('8')
    })

    expect(toString(incomePerSecond(fresh, modifiers))).toBe('20')
    const [group] = incomeOver(clock, fresh, modifiers, ticks(10))
    expect(toString(group?.amount ?? ZERO)).toBe('20')
  })

  it('un mult su income.all vale su tutte le fonti insieme', () => {
    const modifiers = createModifiers()
    modifiers.register({
      id: 'test.mult',
      target: INCOME_TARGET,
      kind: 'mult',
      value: fromString('2')
    })

    const both = at({ job: 1, gigs: 1 })
    expect(toString(incomePerSecond(both, modifiers))).toBe(
      toString(incomePerSecond(both, noModifiers).mul(2))
    )
  })
})

describe('il raggruppamento per regime', () => {
  it('in nero le due fonti stanno **insieme**: un regime solo, una transazione sola', () => {
    const groups = incomeByRegime(at({ job: 1, gigs: 1 }), noModifiers)

    expect(groups).toHaveLength(1)
    expect(groups[0]?.regime.pool).toBe('cash')
  })

  it('in regola si separano, perché atterrano su due pool diversi', () => {
    const groups = incomeByRegime(at({ job: 1, gigs: 1 }, true), noModifiers)

    expect(groups).toHaveLength(2)
    expect(groups.map((each) => each.regime.pool).sort()).toEqual(['card', 'cash'])
  })

  it('e la somma dei gruppi è sempre il reddito al secondo', () => {
    // È la proprietà che impedisce al tick di dire una cosa e al cruscotto un'altra.
    const state = at({ job: 4, gigs: 3 }, true)
    const summed = incomeByRegime(state, noModifiers).reduce(
      (total, each) => total.plus(each.amount),
      ZERO
    )
    expect(toString(summed)).toBe(toString(incomePerSecond(state, noModifiers)))
  })
})

describe('il regime di una fonte', () => {
  it('in nero atterra nei contanti e non trattiene niente, per tutte e due', () => {
    for (const source of SOURCES) {
      const regime = regimeOf(source, fresh)
      expect(regime.pool).toBe('cash')
      expect(regime.withholdingRate.isZero()).toBe(true)
    }
  })

  it('in regola il lavoro passa alla carta, e la trattenuta è **la costante**', () => {
    const regime = regimeOf(job, at({ job: 1 }, true))

    expect(regime.pool).toBe('card')
    // Identità e non uguaglianza, per la ragione del listino: una copia si muoverebbe da sola.
    expect(regime.withholdingRate).toBe(BALANCE.INCOME_TAX_RATE)
  })

  it('in regola i lavoretti restano dov’erano: la dichiarazione non li riguarda', () => {
    const regime = regimeOf(gigs, at({ gigs: 1 }, true))

    expect(regime.pool).toBe('cash')
    expect(regime.withholdingRate.isZero()).toBe(true)
  })

  it('il pool del regime dichiarato non ha tetto: è la regola 3 dell’ADR 0052', () => {
    // Ciò che accade da solo non può essere rifiutato da una capienza.
    expect(POOLS[regimeOf(job, at({ job: 1 }, true)).pool].capacity).toBeNull()
  })
})

describe('il listino della dichiarazione', () => {
  it('offre la carta, al prezzo che sta in constants.ts', () => {
    expect(declarationPrices()).toEqual([
      { pool: 'card', price: BALANCE.INCOME_DECLARATION_PRICE_CARD }
    ])
  })

  it('interrogato per uno strumento ritorna la sua voce, e null per gli altri', () => {
    // Identità e non uguaglianza, per la ragione dei listini dei livelli.
    expect(declarationPriceFor('card')?.price).toBe(BALANCE.INCOME_DECLARATION_PRICE_CARD)
    expect(declarationPriceFor('cash')).toBeNull()
  })

  it('non offre nessuno dei conti che strumenti non sono (ADR 0020)', () => {
    for (const pool of POOL_IDS.filter((id) => !POOLS[id].player)) {
      expect(declarationPriceFor(pool)).toBeNull()
    }
  })

  it('si può dichiarare solo se non lo si è già e se lo strumento scelto basta', () => {
    const option = declarationPriceFor('card') as PaymentOption
    const price = option.price

    expect(canDeclare(fresh, option, price)).toBe(true)
    expect(canDeclare(fresh, option, price.minus(fromString('0.01')))).toBe(false)
    expect(canDeclare(at({ job: 1 }, true), option, price.mul(10))).toBe(false)
  })
})

describe('la purezza di rules.ts', () => {
  it('da kernel/ importa solo tipi', () => {
    const source = read('src/core/domains/income/rules.ts')
    const fromKernel = [...source.matchAll(/^import\s+([\s\S]*?)from\s+'(@core\/kernel\/[^']+)'/gm)]

    expect(fromKernel.length).toBeGreaterThan(0)
    for (const [, clause, specifier] of fromKernel) {
      expect(`${specifier}: ${clause?.trimStart() ?? ''}`).toMatch(/: type /)
    }
  })
})
