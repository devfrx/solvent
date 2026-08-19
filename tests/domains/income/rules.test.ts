import { describe, expect, it } from 'vitest'

import { fromString } from '@core/contracts/money'

import { BALANCE } from '@core/balance/constants'
import { createModifiers } from '@core/balance/modifiers'
import { clock, ticks } from '@core/kernel/Clock'

import {
  INCOME_TARGET,
  UPGRADE_MODIFIER_ID,
  canBuyUpgrade,
  incomeOver,
  incomePerSecond,
  upgradeCost,
  upgradeModifier
} from '../../../src/core/domains/income/rules'
import { read } from '../../helpers/sources'

/**
 * Le regole pure del reddito, provate senza kernel, senza Ledger e senza sistema: è esattamente
 * ciò che la loro purezza serve a comprare.
 */

const noModifiers = createModifiers()

describe('il reddito', () => {
  it('senza modificatori è quello dichiarato in constants.ts', () => {
    expect(incomePerSecond(noModifiers).toString()).toBe(BALANCE.INCOME_BASE_PER_SECOND.toString())
  })

  it('su più tick è il tasso al tick moltiplicato per quanti ne sono passati', () => {
    const perTick = clock.perSecondToPerTick(BALANCE.INCOME_BASE_PER_SECOND)

    expect(incomeOver(clock, noModifiers, ticks(1)).toString()).toBe(perTick.toString())
    expect(incomeOver(clock, noModifiers, ticks(30)).toString()).toBe(perTick.mul(30).toString())
  })

  it('un secondo di tick vale esattamente il reddito al secondo', () => {
    const oneSecond = clock.secondsToTicks(clock.ticksToSeconds(ticks(10)))

    expect(incomeOver(clock, noModifiers, oneSecond).toString()).toBe(
      BALANCE.INCOME_BASE_PER_SECOND.toString()
    )
  })

  it('con l’upgrade attivo passa dal modificatore, non da un numero riscritto', () => {
    const modifiers = createModifiers()
    modifiers.register(upgradeModifier())

    const expected = BALANCE.INCOME_BASE_PER_SECOND.mul(BALANCE.UPGRADE_MULTIPLIER)
    expect(incomePerSecond(modifiers).toString()).toBe(expected.toString())
  })

  it('i modificatori sono al secondo, come la base: un add non vale dieci volte tanto', () => {
    // Comporre dopo la conversione a tick darebbe 1,2 + 8 = 9,2 al tick, cioè 92,00 €/s: il
    // `mult` non se ne accorgerebbe e il difetto resterebbe invisibile fino al primo `add`.
    const modifiers = createModifiers()
    modifiers.register({
      id: 'test.add',
      target: INCOME_TARGET,
      kind: 'add',
      value: fromString('8')
    })

    expect(incomePerSecond(modifiers).toString()).toBe('20')
    expect(incomeOver(clock, modifiers, ticks(10)).toString()).toBe('20')
  })
})

describe('l’upgrade', () => {
  it('costa quanto dice constants.ts', () => {
    expect(upgradeCost().toString()).toBe(BALANCE.UPGRADE_COST.toString())
  })

  it('registra un mult su tutte le fonti, non un reddito base nuovo', () => {
    expect(upgradeModifier()).toEqual({
      id: UPGRADE_MODIFIER_ID,
      target: INCOME_TARGET,
      kind: 'mult',
      value: BALANCE.UPGRADE_MULTIPLIER
    })
  })

  it('è comprabile solo se non è già comprato e se la carta basta', () => {
    const cost = upgradeCost()
    const fresh = { upgraded: false }

    expect(canBuyUpgrade(fresh, cost)).toBe(true)
    expect(canBuyUpgrade(fresh, cost.plus(fromString('0.01')))).toBe(true)
    expect(canBuyUpgrade(fresh, cost.minus(fromString('0.01')))).toBe(false)
    expect(canBuyUpgrade({ upgraded: true }, cost.mul(10))).toBe(false)
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
