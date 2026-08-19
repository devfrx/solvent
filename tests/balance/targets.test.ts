import { describe, expect, it } from 'vitest'

import { toString } from '@core/contracts/money'

import { createModifiers } from '@core/balance/modifiers'
import { TARGET_IDS, TARGETS } from '@core/balance/targets'
import { createBus } from '@core/kernel/Bus'
import { clock, seconds, ticks } from '@core/kernel/Clock'
import { createLedger } from '@core/kernel/Ledger'
import { createRegistry, type SystemContext } from '@core/kernel/Registry'
import { createRng } from '@core/kernel/Rng'

import { incomePerSecond, upgradeModifier } from '../../src/core/domains/income/rules'
import { createIncome } from '../../src/core/domains/income/system'

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

describe('i bersagli di bilanciamento', () => {
  it('sono intervalli, non valori singoli', () => {
    for (const id of TARGET_IDS) {
      expect(TARGETS[id].min.lessThan(TARGETS[id].max)).toBe(true)
    }
  })

  it('il reddito del primo minuto cade dentro income_per_minute_at_start', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    const modifiers = createModifiers()
    const registry = createRegistry()
    registry.register(createIncome(ledger, modifiers).system)
    const ctx: SystemContext = { clock, rng: createRng(1), bus, ledger }

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
    const bus = createBus()
    const ledger = createLedger(bus)
    const modifiers = createModifiers()
    const registry = createRegistry()
    registry.register(createIncome(ledger, modifiers).system)
    const ctx: SystemContext = { clock, rng: createRng(1), bus, ledger }

    const tickCount = clock.secondsToTicks(ONE_MINUTE)
    for (let elapsed = 0; elapsed < tickCount; elapsed += 1) registry.tickAll(ctx, ONE_TICK)

    expect(toString(ledger.balance('cash'))).toBe(
      toString(incomePerSecond(modifiers).mul(ONE_MINUTE))
    )
  })

  it('con l upgrade attivo il reddito esce dall intervallo di partenza', () => {
    const modifiers = createModifiers()
    modifiers.register(upgradeModifier())

    const perMinute = incomePerSecond(modifiers).mul(ONE_MINUTE)

    // Se ci restasse dentro, l'upgrade non sarebbe percepibile e l'intervallo sarebbe troppo largo.
    expect(perMinute.greaterThan(TARGETS.income_per_minute_at_start.max)).toBe(true)
  })
})
