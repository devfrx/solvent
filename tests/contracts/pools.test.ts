import { describe, expect, it } from 'vitest'

import { POOL_IDS, POOLS, type Pool } from '@core/contracts/pools'

/**
 * ADR 0017 — il denaro è plurale: le affordance di un pool sono dati, non `if` sparsi nei domini.
 * ADR 0020 — i conti non-giocatore esistono, altrimenti la somma di tutti i conti non farebbe zero.
 */
describe('POOLS', () => {
  it('ogni pool dichiarato ha le sue proprietà, e nessun pool in più', () => {
    expect(Object.keys(POOLS).sort()).toEqual([...POOL_IDS].sort())
  })

  it('i contanti non lasciano traccia, la carta sì', () => {
    expect(POOLS.cash.traceable).toBe(false)
    expect(POOLS.card.traceable).toBe(true)
  })

  it('i pool del giocatore per la fetta 01 sono contanti e carta', () => {
    const playerPools = POOL_IDS.filter((id) => POOLS[id].player)
    expect(playerPools).toEqual(['cash', 'card'])
  })

  it('i conti non-giocatore sono i quattro dell’ADR 0020', () => {
    const internalPools = POOL_IDS.filter((id) => !POOLS[id].player)
    expect(internalPools).toEqual(['world', 'sink', 'fees', 'house'])
  })

  it('nella fetta 01 la forma c’è e i valori no: nessuna capienza, nessun interesse', () => {
    for (const id of POOL_IDS) {
      expect(POOLS[id].capacity).toBeNull()
      expect(POOLS[id].yields).toBe(false)
    }
  })

  it('un pool inventato non è un Pool', () => {
    // @ts-expect-error — ADR 0017: i pool non sono stringhe libere, altrimenti nulla è verificabile
    const invented: Pool = 'crypto'
    expect(invented).toBe('crypto')
  })
})
