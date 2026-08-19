import { describe, expect, it, vi } from 'vitest'

import { fromString } from '@core/contracts/money'

import { createBus } from '@core/kernel/Bus'
import { createLedger, income } from '@core/kernel/Ledger'

/**
 * ADR 0017 — la capienza è una proprietà del pool, dichiarata come **dato**. Nella fetta 01
 * nessun pool ne ha una: la forma c'è, i valori arrivano con il caveau (fetta 02).
 *
 * Il meccanismo però esiste già, e un meccanismo mai eseguito è un meccanismo che non funziona.
 * Qui la tabella dei pool è sostituita da una che dichiara una capienza: il codice sotto test è
 * quello vero, i dati no. È l'unico file di test del progetto che sostituisce un modulo, ed è
 * per questo che sta da solo — negli altri `POOLS` deve restare quello di produzione.
 */
vi.mock('@core/contracts/pools', async (original) => {
  const actual = await original<typeof import('@core/contracts/pools')>()
  const { fromString: money } = await import('@core/contracts/money')
  return {
    ...actual,
    POOLS: { ...actual.POOLS, cash: { ...actual.POOLS.cash, capacity: money('1000') } }
  }
})

const money = fromString

describe('la capienza di un pool', () => {
  it('accetta ciò che ci sta esattamente', () => {
    const ledger = createLedger(createBus())

    const result = ledger.transaction(income('cash', money('1000')), {
      reason: 'reason.income.tick'
    })

    expect(result.ok).toBe(true)
    expect(ledger.balance('cash').toString()).toBe('1000')
  })

  it('rifiuta ciò che la supererebbe, e dice quanto ci starebbe ancora', () => {
    const ledger = createLedger(createBus())
    ledger.transaction(income('cash', money('700')), { reason: 'reason.income.tick' })

    const result = ledger.transaction(income('cash', money('400')), {
      reason: 'reason.income.tick'
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('error.ledger.capacity_exceeded')
    if (result.error.code !== 'error.ledger.capacity_exceeded') return
    expect(result.error.pool).toBe('cash')
    expect(result.error.capacity.toString()).toBe('1000')
    expect(result.error.fits.toString()).toBe('300')
  })

  it('il rifiuto non muove niente, nemmeno il conto sorgente', () => {
    const bus = createBus()
    const ledger = createLedger(bus)
    let emitted = 0
    bus.on('money.posted', () => {
      emitted += 1
    })
    ledger.transaction(income('cash', money('700')), { reason: 'reason.income.tick' })
    emitted = 0

    ledger.transaction(income('cash', money('400')), { reason: 'reason.income.tick' })

    expect(ledger.balance('cash').toString()).toBe('700')
    expect(ledger.balance('world').toString()).toBe('-700')
    expect(emitted).toBe(0)
  })

  it('un pool senza capienza non ha tetto', () => {
    const ledger = createLedger(createBus())

    const result = ledger.transaction(income('card', money('999999999')), {
      reason: 'reason.income.tick'
    })

    expect(result.ok).toBe(true)
  })
})
