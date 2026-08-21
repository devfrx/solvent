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

import { incomePerSecond, upgradeModifier } from '../../src/core/domains/income/rules'
import { createIncome } from '../../src/core/domains/income/system'
import { capacityFor, expansionPrices, VAULT_POOL } from '../../src/core/domains/vault/rules'
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
const ONE_TICK = ticks(1)

/** Molto oltre il tempo che serve a riempire il caveau di partenza: il muro deve gia' aver morso. */
const WELL_PAST_THE_WALL = seconds(300)

interface Simulation {
  readonly ledger: Ledger
  readonly registry: Registry
  readonly modifiers: Modifiers
  readonly ctx: SystemContext
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
    pool === VAULT_POOL ? vault.capacity() : poolCapacity(pool)
  const ledger = createLedger(bus, capacities)
  const vault = createVault(ledger)
  const modifiers = createModifiers()
  const registry = createRegistry()
  const income = createIncome(ledger, modifiers, (pool) =>
    roomIn(ledger.capacities(pool), ledger.balance(pool))
  )
  registry.register(income.system)
  registry.register(vault.system)
  return { ledger, registry, modifiers, ctx: { clock, rng: createRng(1), bus, ledger } }
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
      toString(incomePerSecond(modifiers).mul(ONE_MINUTE))
    )
  })

  it('il muro morde quando dichiarato: seconds_to_first_wall', () => {
    // Non una costante riletta: il numero si **misura** dai due che lo producono, la capienza di
    // partenza e il reddito al secondo. Cambiarne uno solo sposta questa cifra e rende rosso.
    const perSecond = incomePerSecond(createModifiers())
    const secondsToWall = capacityFor(0).div(perSecond)
    const target = TARGETS.seconds_to_first_wall

    expect(secondsToWall.greaterThanOrEqualTo(target.min)).toBe(true)
    expect(secondsToWall.lessThanOrEqualTo(target.max)).toBe(true)
  })

  it('e mordendo ferma davvero lo stipendio, invece di rifiutarlo', () => {
    // Il muro visto dal gioco e non dalla formula: si simula oltre il tempo che serve a riempirlo
    // e il saldo si ferma **al tetto**, non a zero. Zero sarebbe il rifiuto atomico, cioè il
    // difetto che la preparazione di D017 ha trovato misurando.
    const { ledger, registry, ctx } = simulate()
    const wall = capacityFor(0)

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
    const levels = BALANCE.VAULT_PRICES_CASH.length

    expect(levels).toBeGreaterThan(0)
    for (let level = 0; level < levels; level += 1) {
      const [cash, card] = expansionPrices(level)
      if (cash === undefined || card === undefined) throw new Error('listino a due voci atteso')

      const discount = cash.price.minus(card.price)
      expect(discount.greaterThanOrEqualTo(target.min)).toBe(true)
      expect(discount.lessThanOrEqualTo(target.max)).toBe(true)
      expect(discount.lessThan(BALANCE.ATM_FEE_FLOOR)).toBe(true)
    }
  })

  it('con l upgrade attivo il reddito esce dall intervallo di partenza', () => {
    const modifiers = createModifiers()
    modifiers.register(upgradeModifier())

    const perMinute = incomePerSecond(modifiers).mul(ONE_MINUTE)

    // Se ci restasse dentro, l'upgrade non sarebbe percepibile e l'intervallo sarebbe troppo largo.
    expect(perMinute.greaterThan(TARGETS.income_per_minute_at_start.max)).toBe(true)
  })
})
