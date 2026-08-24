import { describe, expect, it } from 'vitest'

import { fromString } from '@core/contracts/money'
import type { PaymentOption } from '@core/contracts/payment'
import { POOL_IDS, POOLS } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'
import { createModifiers } from '@core/balance/modifiers'
import { clock, ticks } from '@core/kernel/Clock'

import {
  INCOME_TARGET,
  UPGRADE_MODIFIER_ID,
  canBuyUpgrade,
  canDeclare,
  declarationPriceFor,
  declarationPrices,
  incomeOver,
  incomePerSecond,
  regimeOf,
  upgradeModifier,
  upgradePriceFor,
  upgradePrices
} from '../../../src/core/domains/income/rules'
import type { IncomeState } from '../../../src/core/domains/income/types'
import { read } from '../../helpers/sources'

/**
 * Le regole pure del reddito, provate senza kernel, senza Ledger e senza sistema: è esattamente
 * ciò che la loro purezza serve a comprare.
 */

const noModifiers = createModifiers()

/** I due regimi, come stati: la partita appena nata, e quella di chi si è messo in regola. */
const inTheBlack: IncomeState = { upgraded: false, declared: false }
const declaredState: IncomeState = { upgraded: false, declared: true }

/**
 * L'opzione della carta, presa **dal listino** invece di essere scritta qui: un'opzione ricopiata
 * proverebbe che questo file è coerente con se stesso, che non è la domanda.
 */
const cardOption = (): PaymentOption => {
  const option = upgradePriceFor('card')
  if (option === null) throw new Error('il listino dell’upgrade non offre la carta')
  return option
}

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

describe('il listino dell’upgrade', () => {
  it('offre la carta, al prezzo che sta in constants.ts', () => {
    expect(upgradePrices()).toEqual([{ pool: 'card', price: BALANCE.UPGRADE_PRICE_CARD }])
  })

  it('e il prezzo è **lo stesso oggetto** della costante, non un numero uguale', () => {
    // Identità e non uguaglianza: una copia con lo stesso valore passerebbe un `toEqual` e
    // lascerebbe che le due si muovano separatamente. È la trappola pagata da D015 alla
    // correzione 14, ed è la forma in cui INV-19 può rompersi senza far rumore.
    expect(cardOption().price).toBe(BALANCE.UPGRADE_PRICE_CARD)
  })

  it('interrogato per uno strumento ritorna la sua voce, e null per gli altri', () => {
    expect(upgradePriceFor('card')).toEqual({ pool: 'card', price: BALANCE.UPGRADE_PRICE_CARD })
    expect(upgradePriceFor('cash')).toBeNull()
  })

  it('non offre nessuno dei conti che strumenti non sono (ADR 0020)', () => {
    // `world`, `sink`, `fees` e `house` sono contabilità interna e non si scelgono: un listino che
    // ne offrisse uno metterebbe un conto non-giocatore davanti agli occhi del giocatore.
    for (const pool of POOL_IDS.filter((id) => !POOLS[id].player)) {
      expect(upgradePriceFor(pool)).toBeNull()
    }
  })
})

describe('l’upgrade', () => {
  it('registra un mult su tutte le fonti, non un reddito base nuovo', () => {
    expect(upgradeModifier()).toEqual({
      id: UPGRADE_MODIFIER_ID,
      target: INCOME_TARGET,
      kind: 'mult',
      value: BALANCE.UPGRADE_MULTIPLIER
    })
  })

  it('è comprabile solo se non è già comprato e se lo strumento scelto basta', () => {
    const option = cardOption()
    const price = option.price
    const fresh = inTheBlack

    expect(canBuyUpgrade(fresh, option, price)).toBe(true)
    expect(canBuyUpgrade(fresh, option, price.plus(fromString('0.01')))).toBe(true)
    expect(canBuyUpgrade(fresh, option, price.minus(fromString('0.01')))).toBe(false)
    expect(canBuyUpgrade({ upgraded: true, declared: false }, option, price.mul(10))).toBe(false)
  })
})

describe('il regime', () => {
  it('in nero il reddito atterra nei contanti e non trattiene niente', () => {
    const regime = regimeOf(inTheBlack)

    expect(regime.pool).toBe('cash')
    expect(regime.withholdingRate.isZero()).toBe(true)
  })

  it('in regola il reddito atterra sulla carta, e la trattenuta è **la costante**', () => {
    const regime = regimeOf(declaredState)

    expect(regime.pool).toBe('card')
    // Identità e non uguaglianza, per la ragione del listino: una copia si muoverebbe da sola.
    expect(regime.withholdingRate).toBe(BALANCE.INCOME_TAX_RATE)
  })

  it('il pool del regime dichiarato non ha tetto: è la regola 3 dell’ADR 0052', () => {
    // Ciò che accade da solo non può essere rifiutato da una capienza. Oggi lo prova il regime
    // dichiarato; domani sarà la fonte automatica, e il controllo è già scritto.
    expect(POOLS[regimeOf(declaredState).pool].capacity).toBeNull()
  })
})

describe('il listino della dichiarazione', () => {
  it('offre la carta, al prezzo che sta in constants.ts', () => {
    expect(declarationPrices()).toEqual([
      { pool: 'card', price: BALANCE.INCOME_DECLARATION_PRICE_CARD }
    ])
  })

  it('interrogato per uno strumento ritorna la sua voce, e null per gli altri', () => {
    // Identità e non uguaglianza, per la ragione del listino dell'upgrade.
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

    expect(canDeclare(inTheBlack, option, price)).toBe(true)
    expect(canDeclare(inTheBlack, option, price.minus(fromString('0.01')))).toBe(false)
    expect(canDeclare(declaredState, option, price.mul(10))).toBe(false)
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
