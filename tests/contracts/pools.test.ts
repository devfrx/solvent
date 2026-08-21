import { describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'
import { CASH_START_CAPACITY, POOL_IDS, POOLS, roomIn, type Pool } from '@core/contracts/pools'

const money = fromString

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

  it('un tetto ce l’ha solo il caveau, e nessuno matura interessi', () => {
    // La fotografia di prima diceva «nella fetta 01 la forma c'è e i valori no: nessuna capienza,
    // nessun interesse», ed era vera finché il caveau non esisteva. La fetta 02 gli ha dato un
    // valore: sostituita da una fotografia, non da un buco.
    //
    // I contanti sono l'unico pool con un tetto, e quello scritto qui è la capienza **di partenza**
    // (ADR 0025): dopo il primo ampliamento a rispondere è il caveau, non questa tabella.
    // `POOLS.yields` invece è ancora tutto `false`, ed è dichiarato fuori scope da D017.
    const capped = POOL_IDS.filter((id) => POOLS[id].capacity !== null)

    expect(capped).toEqual(['cash'])
    expect(POOLS.cash.capacity).toBe(CASH_START_CAPACITY)
    for (const id of POOL_IDS) expect(POOLS[id].yields).toBe(false)
  })

  it('un pool inventato non è un Pool', () => {
    // @ts-expect-error — ADR 0017: i pool non sono stringhe libere, altrimenti nulla è verificabile
    const invented: Pool = 'crypto'
    expect(invented).toBe('crypto')
  })
})

describe('quanto ci sta ancora', () => {
  it('è il tetto meno quello che c’è', () => {
    expect(toString(roomIn(money('1000'), money('300')) ?? money('0'))).toBe('700')
    expect(toString(roomIn(money('1000'), money('0')) ?? money('0'))).toBe('1000')
    expect(toString(roomIn(money('1000'), money('1000')) ?? money('0'))).toBe('0')
  })

  it('senza tetto non è un numero: è “nessun limite”', () => {
    // `null` e non un numero grandissimo: «ci sta tutto» e «ci stanno novanta miliardi» sono due
    // risposte diverse, e la seconda prima o poi diventa un tetto per sbaglio.
    expect(roomIn(null, money('999999999'))).toBeNull()
  })

  it('e non è mai negativo, nemmeno con un saldo sopra il tetto', () => {
    // Un saldo sopra il tetto non è impossibile: basta un salvataggio più vecchio della curva.
    // «Ci sta meno di niente» non è una quantità che qualcuno possa accreditare.
    expect(toString(roomIn(money('1000'), money('4000')) ?? money('0'))).toBe('0')
  })
})
