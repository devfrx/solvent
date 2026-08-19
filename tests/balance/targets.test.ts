import { describe, expect, it } from 'vitest'

import { BALANCE } from '@core/balance/constants'
import { createModifiers } from '@core/balance/modifiers'
import { TARGET_IDS, TARGETS } from '@core/balance/targets'
import { createBus } from '@core/kernel/Bus'
import { clock, seconds } from '@core/kernel/Clock'
import { createLedger, income } from '@core/kernel/Ledger'

/**
 * I bersagli di bilanciamento sono **dati**, e questo è il test che li rende tali: senza,
 * `targets.ts` sarebbe un file di documentazione, cioè esattamente ciò che non deve essere.
 *
 * Il primo minuto di gioco è simulato con i pezzi veri — il Clock che converte il tasso, il
 * registro dei modificatori che compone, il Ledger che applica — e non con una moltiplicazione
 * scritta qui. Il sistema `income` non esiste ancora (è D010): quando esisterà, il loop qui sotto
 * diventa una riga di `tickAll` e il bersaglio resta lo stesso.
 */

const UN_MINUTO = seconds(60)

describe('i bersagli di bilanciamento', () => {
  it('sono intervalli, non valori singoli', () => {
    for (const id of TARGET_IDS) {
      expect(TARGETS[id].min.lessThan(TARGETS[id].max)).toBe(true)
    }
  })

  it('il reddito del primo minuto cade dentro income_per_minute_at_start', () => {
    const ledger = createLedger(createBus())
    const modifiers = createModifiers()
    const perTick = clock.perSecondToPerTick(BALANCE.INCOME_BASE_PER_SECOND)
    const quanti = clock.secondsToTicks(UN_MINUTO)

    for (let tick = 0; tick < quanti; tick += 1) {
      ledger.transaction(income('cash', modifiers.compose('income.all', perTick)), {
        reason: 'reason.income.tick'
      })
    }

    const guadagnato = ledger.balance('cash')
    const bersaglio = TARGETS.income_per_minute_at_start
    expect(guadagnato.greaterThanOrEqualTo(bersaglio.min)).toBe(true)
    expect(guadagnato.lessThanOrEqualTo(bersaglio.max)).toBe(true)
  })

  it('con l upgrade attivo il reddito esce dall intervallo di partenza', () => {
    const modifiers = createModifiers()
    modifiers.register({
      id: 'income.upgrade.overtime',
      target: 'income.all',
      kind: 'mult',
      value: BALANCE.UPGRADE_MULTIPLIER
    })
    const perTick = clock.perSecondToPerTick(BALANCE.INCOME_BASE_PER_SECOND)
    const quanti = clock.secondsToTicks(UN_MINUTO)

    const alMinuto = modifiers.compose('income.all', perTick).mul(quanti)

    // Se ci restasse dentro, l'upgrade non sarebbe percepibile e l'intervallo sarebbe troppo largo.
    expect(alMinuto.greaterThan(TARGETS.income_per_minute_at_start.max)).toBe(true)
  })
})
