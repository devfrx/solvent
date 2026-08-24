import { describe, expect, it } from 'vitest'

import type { GameEvents } from '@core/contracts/events'
import { ZERO } from '@core/contracts/money'

/**
 * `GameEvents` cresce con i sistemi. Se un evento entra qui prima di avere chi lo emette, è un
 * contratto che nessuno verifica — e questo test lo dice, perché `Record` li vuole tutti.
 */
const EVENTS: Record<keyof GameEvents, true> = { 'money.posted': true }

describe('GameEvents', () => {
  it('la fetta 01 emette un evento solo', () => {
    expect(Object.keys(EVENTS)).toEqual(['money.posted'])
  })

  it('un evento non dichiarato non esiste', () => {
    // @ts-expect-error — nessun sistema della fetta 01 emette il calore: entrerà con la fetta 04
    const key: keyof GameEvents = 'heat.raised'
    expect(key).toBe('heat.raised')
  })

  it('money.posted porta la transazione intera e tutti i saldi nuovi', () => {
    const payload: GameEvents['money.posted'] = {
      transaction: { reason: 'reason.income.tick', postings: [] },
      balances: {
        cash: ZERO,
        card: ZERO,
        world: ZERO,
        sink: ZERO,
        fees: ZERO,
        house: ZERO,
        tax: ZERO
      }
    }
    expect(payload.transaction.reason).toBe('reason.income.tick')
    expect(Object.keys(payload.balances)).toHaveLength(7)
  })
})
