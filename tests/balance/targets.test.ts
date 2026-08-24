import { describe, expect, it } from 'vitest'

import { toString } from '@core/contracts/money'
import { roomIn } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'
import type { Modifiers } from '@core/balance/modifiers'
import { createModifiers } from '@core/balance/modifiers'
import { TARGET_IDS, TARGETS } from '@core/balance/targets'
import { createBus } from '@core/kernel/Bus'
import { clock, seconds, ticks } from '@core/kernel/Clock'
import type { Capacities, Ledger } from '@core/kernel/Ledger'
import { createLedger, poolCapacity } from '@core/kernel/Ledger'
import type { Registry, SystemContext } from '@core/kernel/Registry'
import { createRegistry } from '@core/kernel/Registry'
import { createRng } from '@core/kernel/Rng'

import {
  INCOME_PLATEAU,
  declarationPriceFor,
  incomePerSecond,
  levelPrices,
  MAX_LEVEL as INCOME_MAX_LEVEL,
  regimeOf,
  SOURCES,
  yieldAt
} from '../../src/core/domains/income/rules'
import { createIncome, type Income } from '../../src/core/domains/income/system'
import type { IncomeState } from '../../src/core/domains/income/types'
import {
  cashCapacityFor,
  expansionPrices,
  MAX_LEVEL,
  VAULT_POOL
} from '../../src/core/domains/vault/rules'
import { createVault } from '../../src/core/domains/vault/system'

/**
 * I bersagli di bilanciamento sono **dati**, e questo è il test che li rende tali: senza,
 * `targets.ts` sarebbe un file di documentazione, cioè esattamente ciò che non deve essere.
 *
 * Il primo minuto è simulato con i pezzi veri e con il sistema vero: il Registry itera, `income`
 * chiede, il Ledger applica. Fino a D010 il loop era scritto qui a mano perché il sistema non
 * esisteva; adesso esiste, e un bersaglio verificato su una simulazione scritta a parte
 * verificherebbe la simulazione.
 */

const ONE_MINUTE = seconds(60)

/** La partita appena nata: il lavoro al primo livello, i lavoretti chiusi. */
const AT_START: IncomeState = { levels: { job: 1, gigs: 0 }, declared: false }

/** La stessa partita, in regola: il lavoro passa alla carta, i lavoretti restano dov'erano. */
const DECLARED: IncomeState = { levels: { job: 1, gigs: 0 }, declared: true }
const ONE_TICK = ticks(1)

/** Molto oltre il tempo che serve a riempire il caveau di partenza: il muro deve gia' aver morso. */
const WELL_PAST_THE_WALL = seconds(300)

interface Simulation {
  readonly ledger: Ledger
  readonly registry: Registry
  readonly modifiers: Modifiers
  readonly ctx: SystemContext
  /** Serve a mettersi in regola dentro la simulazione: il regime è stato, non una costante. */
  readonly income: Income
}

/**
 * La partita, montata con i pezzi veri e nello stesso ordine del bootstrap: il caveau possiede la
 * capienza, il Ledger la fa rispettare, il reddito sa quanto ci sta prima di chiedere.
 *
 * Da D017 il muro esiste, quindi un bersaglio misurato su un Ledger **senza** capienze
 * misurerebbe un gioco che non e' piu' questo: sopra il tetto lo stipendio smette di entrare, e un
 * intervallo verificato ignorandolo sarebbe verde su una simulazione che nessuno gioca.
 */
const simulate = (): Simulation => {
  const bus = createBus()
  const capacities: Capacities = (pool) =>
    pool === VAULT_POOL ? vault.cashCapacity() : poolCapacity(pool)
  const ledger = createLedger(bus, capacities)
  const vault = createVault(ledger)
  const modifiers = createModifiers()
  const registry = createRegistry()
  const income = createIncome(ledger, modifiers, (pool) =>
    roomIn(ledger.capacities(pool), ledger.balance(pool))
  )
  registry.register(income.system)
  registry.register(vault.system)
  return { ledger, registry, modifiers, income, ctx: { clock, rng: createRng(1), bus, ledger } }
}

describe('i bersagli di bilanciamento', () => {
  it('sono intervalli, non valori singoli', () => {
    for (const id of TARGET_IDS) {
      expect(TARGETS[id].min.lessThan(TARGETS[id].max)).toBe(true)
    }
  })

  it('il reddito del primo minuto cade dentro income_per_minute_at_start', () => {
    const { ledger, registry, ctx } = simulate()

    // Un tick alla volta, come li chiama il loop: se il tasso al tick perdesse un centesimo per
    // arrotondamento, sessanta secondi lo renderebbero visibile e un tick solo da 600 no.
    const tickCount = clock.secondsToTicks(ONE_MINUTE)
    for (let elapsed = 0; elapsed < tickCount; elapsed += 1) registry.tickAll(ctx, ONE_TICK)

    const earned = ledger.balance('cash')
    const target = TARGETS.income_per_minute_at_start
    expect(earned.greaterThanOrEqualTo(target.min)).toBe(true)
    expect(earned.lessThanOrEqualTo(target.max)).toBe(true)
  })

  it('non perde un centesimo per strada: un minuto vale sessanta volte il reddito al secondo', () => {
    const { ledger, registry, modifiers, ctx } = simulate()

    const tickCount = clock.secondsToTicks(ONE_MINUTE)
    for (let elapsed = 0; elapsed < tickCount; elapsed += 1) registry.tickAll(ctx, ONE_TICK)

    expect(toString(ledger.balance('cash'))).toBe(
      toString(incomePerSecond(AT_START, modifiers).mul(ONE_MINUTE))
    )
  })

  it('il muro morde quando dichiarato: seconds_to_first_wall', () => {
    // Non una costante riletta: il numero si **misura** dai due che lo producono, la capienza di
    // partenza e il reddito al secondo. Cambiarne uno solo sposta questa cifra e rende rosso.
    const perSecond = incomePerSecond(AT_START, createModifiers())
    const secondsToWall = cashCapacityFor(0).div(perSecond)
    const target = TARGETS.seconds_to_first_wall

    expect(secondsToWall.greaterThanOrEqualTo(target.min)).toBe(true)
    expect(secondsToWall.lessThanOrEqualTo(target.max)).toBe(true)
  })

  it('e mordendo ferma davvero lo stipendio, invece di rifiutarlo', () => {
    // Il muro visto dal gioco e non dalla formula: si simula oltre il tempo che serve a riempirlo
    // e il saldo si ferma **al tetto**, non a zero. Zero sarebbe il rifiuto atomico, cioè il
    // difetto che la preparazione di D017 ha trovato misurando.
    const { ledger, registry, ctx } = simulate()
    const wall = cashCapacityFor(0)

    registry.tickAll(ctx, clock.secondsToTicks(WELL_PAST_THE_WALL))

    expect(toString(ledger.balance('cash'))).toBe(toString(wall))
  })

  it('lo sconto della carta resta sotto la commissione del bancomat: vault_card_discount', () => {
    // La legge della non dominanza, misurata. Senza il calore la carta non paga niente in cambio
    // della traccia che lascia, e l'unico argine è che convertire i contanti costi più di quanto
    // lo sconto faccia risparmiare. Il confronto è con `ATM_FEE_FLOOR` e non con una cifra
    // ricopiata: ritoccare il pavimento deve rendere rosso **questo** test.
    //
    // Da D032 la commissione non è un numero ma `max(pavimento, importo × tasso)`, e il pavimento
    // è la più bassa che possa esistere: se lo sconto sta sotto di lui, sta sotto ogni commissione
    // che il bancomat possa mai chiedere. È il confronto più severo, non quello più comodo.
    const target = TARGETS.vault_card_discount

    expect(MAX_LEVEL).toBeGreaterThan(0)
    for (let level = 0; level < MAX_LEVEL; level += 1) {
      const [cash, card] = expansionPrices(level)
      if (cash === undefined || card === undefined) throw new Error('listino a due voci atteso')

      const discount = cash.price.minus(card.price)
      expect(discount.greaterThanOrEqualTo(target.min)).toBe(true)
      expect(discount.lessThanOrEqualTo(target.max)).toBe(true)
      expect(discount.lessThan(BALANCE.ATM_FEE_FLOOR)).toBe(true)
    }
  })

  it('il muro finale resta dove la visione lo vuole: vault_max_cash', () => {
    // Il numero da cui dipende la **forma 1** della saturazione — sopra quella cifra i contanti
    // smettono di essere una scelta possibile, non una scelta cara — e fino a D042 era l'unico
    // numero del caveau che nessun test guardava.
    //
    // Si **misura** dall'ultimo gradino della scala invece di essere riletto da una costante:
    // cambiare quanti livelli esistono, di quanto crescono o quanto valgono sposta questa cifra e
    // rende rosso qui, che è il posto giusto per accorgersene.
    const wall = cashCapacityFor(MAX_LEVEL)
    const target = TARGETS.vault_max_cash

    expect(wall.greaterThanOrEqualTo(target.min)).toBe(true)
    expect(wall.lessThanOrEqualTo(target.max)).toBe(true)
  })

  it('la trattenuta sta sopra la commissione del bancomat: income_tax_rate', () => {
    // La legge della non dominanza applicata al regime (ADR 0052). Il vincolo non è quanto tassa
    // uno Stato vero: è quanto costa fare la stessa cosa a mano. Sotto `ATM_FEE_RATE_IN`
    // dichiarare costerebbe meno che versare, la carta diventerebbe migliore sotto ogni aspetto e
    // i contanti smetterebbero di essere una scelta. Il confronto è con la costante e non con una
    // cifra ricopiata: ritoccare il tasso del bancomat deve rendere rosso **questo** test.
    const job = SOURCES[0]
    if (job === undefined) throw new Error('nessuna fonte nell’elenco')
    const rate = regimeOf(job, DECLARED).withholdingRate
    const target = TARGETS.income_tax_rate

    expect(rate.greaterThan(BALANCE.ATM_FEE_RATE_IN)).toBe(true)
    expect(rate.greaterThanOrEqualTo(target.min)).toBe(true)
    expect(rate.lessThanOrEqualTo(target.max)).toBe(true)
  })

  it('e il gioco la applica davvero: un minuto in regola lascia allo Stato quella frazione', () => {
    // Il tasso dichiarato e il tasso pagato sono due cose diverse finché qualcuno non le mette una
    // di fronte all'altra: un arrotondamento per tick basterebbe a spostare il secondo senza che
    // il primo se ne accorga.
    const { ledger, registry, ctx, income } = simulate()
    income.system.load(DECLARED)

    const tickCount = clock.secondsToTicks(ONE_MINUTE)
    for (let elapsed = 0; elapsed < tickCount; elapsed += 1) registry.tickAll(ctx, ONE_TICK)

    const gross = ledger.balance('world').neg()
    const job = SOURCES[0]
    if (job === undefined) throw new Error('nessuna fonte nell’elenco')
    const rate = regimeOf(job, DECLARED).withholdingRate
    expect(toString(ledger.balance('tax'))).toBe(toString(gross.mul(rate)))
    // E il muro del caveau non c'entra più niente: in regola i contanti restano a zero.
    expect(ledger.balance('cash').isZero()).toBe(true)
  })

  it('mettersi in regola si paga attraversando la scala del caveau: income_declaration_price', () => {
    // Il prezzo non è una cifra scelta perché suona bene: è **dove** sta nella scala del caveau a
    // renderlo una meccanica. Sotto il primo gradino la fetta 02 diventerebbe un tutorial da
    // saltare; sopra l'ultimo, la dichiarazione arriverebbe quando il muro non dà più fastidio a
    // nessuno. Misurato contro la scala, non contro se stesso.
    const option = declarationPriceFor('card')
    if (option === null) throw new Error('il listino della dichiarazione non offre la carta')
    const target = TARGETS.income_declaration_price

    expect(option.price.greaterThanOrEqualTo(target.min)).toBe(true)
    expect(option.price.lessThanOrEqualTo(target.max)).toBe(true)
    expect(option.price.greaterThan(cashCapacityFor(0))).toBe(true)
    expect(option.price.lessThan(cashCapacityFor(MAX_LEVEL))).toBe(true)
  })

  it('con un livello comprato il reddito esce dall intervallo di partenza', () => {
    const bought: IncomeState = { levels: { job: 2, gigs: 0 }, declared: false }
    const perMinute = incomePerSecond(bought, createModifiers()).mul(ONE_MINUTE)

    // Se ci restasse dentro, un livello non sarebbe percepibile e l'intervallo sarebbe troppo largo.
    expect(perMinute.greaterThan(TARGETS.income_per_minute_at_start.max)).toBe(true)
  })

  it('il tetto del reddito attivo resta dove la legge 6 lo vuole: income_plateau', () => {
    // Si **misura** dalle regole e non dalle costanti: `INCOME_PLATEAU` somma le rese all'ultimo
    // livello, quindi cambiare quanti livelli esistono, di quanto crescono o quanto rendono le
    // fonti sposta questa cifra e rende rosso qui, che è il posto giusto per accorgersene.
    const target = TARGETS.income_plateau

    expect(INCOME_PLATEAU.greaterThanOrEqualTo(target.min)).toBe(true)
    expect(INCOME_PLATEAU.lessThanOrEqualTo(target.max)).toBe(true)
  })

  it('e al plateau un anno di gioco riempie un caveau pieno', () => {
    // È la frase che dice al giocatore che i contanti hanno finito il loro mestiere, e insieme il
    // punto in cui il capitale deve prendere il posto del reddito attivo. Non è un intervallo
    // separato: è la ragione per cui l'intervallo del plateau sta dove sta, e legarli qui rende
    // rosso chi sposta uno dei due senza guardare l'altro.
    const aYear = INCOME_PLATEAU.mul(seconds(720))

    expect(aYear.greaterThanOrEqualTo(cashCapacityFor(MAX_LEVEL))).toBe(true)
    expect(aYear.lessThan(cashCapacityFor(MAX_LEVEL).mul(2))).toBe(true)
  })

  it('ogni livello di ogni fonte si ripaga nel tempo dichiarato: income_level_payback', () => {
    // INV-28 · ADR 0053 — è il bersaglio che rende la decisione una **proprietà** invece di
    // un'intenzione. Il rientro si calcola dal **listino** e dalle rese, non dalla costante: chi
    // scrivesse un prezzo a mano da qualche parte lo farebbe diventare rosso qui.
    const target = TARGETS.income_level_payback
    let measured = 0

    for (const source of SOURCES) {
      for (let level = 0; level < INCOME_MAX_LEVEL; level += 1) {
        const [option] = levelPrices(source, level)
        if (option === undefined) throw new Error('listino atteso sotto l’ultimo livello')

        const gained = yieldAt(source, level + 1).minus(yieldAt(source, level))
        const payback = option.price.div(gained)

        expect(payback.greaterThanOrEqualTo(target.min)).toBe(true)
        expect(payback.lessThanOrEqualTo(target.max)).toBe(true)
        measured += 1
      }
    }

    // Senza questa riga un elenco vuoto o una scala di un gradino renderebbero il caso verde
    // senza aver misurato niente.
    expect(measured).toBe(SOURCES.length * INCOME_MAX_LEVEL)
  })
})
