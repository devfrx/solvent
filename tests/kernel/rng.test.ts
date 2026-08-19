import { describe, expect, it } from 'vitest'

import { createRng, randomSeed } from '@core/kernel/Rng'

/**
 * R03 · ADR 0005 — casualità riproducibile, con stream separati.
 *
 * Il difetto A03 erano 176 sorgenti nate una alla volta, ognuna "solo questa". La difesa è che
 * esista una sorgente sola, che il suo stato entri nel salvataggio, e che ricaricare riproduca
 * la stessa sequenza — altrimenti il save-scum è gratis e i test di dominio non significano nulla.
 */

const SEED = 20260819

const take = (count: number, draw: () => number): number[] => Array.from({ length: count }, draw)

describe('Rng', () => {
  it('stesso seme, stessa sequenza, su due istanze indipendenti', () => {
    const first = createRng(SEED).stream('income')
    const second = createRng(SEED).stream('income')

    expect(take(5, first.next)).toEqual(take(5, second.next))
  })

  it('semi diversi danno sequenze diverse', () => {
    const first = take(5, createRng(SEED).stream('income').next)
    const second = take(5, createRng(SEED + 1).stream('income').next)

    expect(first).not.toEqual(second)
  })

  it('ogni estrazione sta in [0, 1)', () => {
    const values = take(1000, createRng(SEED).stream('income').next)

    expect(Math.min(...values)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...values)).toBeLessThan(1)
  })
})

describe('gli stream sono indipendenti', () => {
  it('cento estrazioni da uno stream non muovono la prima estrazione di un altro', () => {
    const disturbed = createRng(SEED)
    take(100, disturbed.stream('income').next)

    const clean = createRng(SEED)

    expect(disturbed.stream('market').next()).toBe(clean.stream('market').next())
  })

  it('due stream diversi non producono la stessa sequenza', () => {
    const rng = createRng(SEED)

    expect(take(5, rng.stream('income').next)).not.toEqual(take(5, rng.stream('market').next))
  })

  it('chiedere due volte lo stesso stream continua la sequenza, non la fa ripartire', () => {
    const rng = createRng(SEED)
    const first = rng.stream('income').next()
    const second = rng.stream('income').next()

    expect(second).not.toBe(first)
    expect(rng.save().cursors['income']).toBe(2)
  })
})

describe('salvataggio e ripresa', () => {
  it('load(save()) a metà sequenza continua identico', () => {
    const original = createRng(SEED)
    take(7, original.stream('income').next)
    take(3, original.stream('market').next)

    const resumed = createRng(0)
    resumed.load(original.save())

    expect(take(5, resumed.stream('income').next)).toEqual(take(5, original.stream('income').next))
  })

  it('lo stato salvato sono due numeri: un seme e un cursore per stream', () => {
    const rng = createRng(SEED)
    take(3, rng.stream('income').next)

    expect(rng.save()).toEqual({ seed: SEED, cursors: { income: 3 } })
  })

  it('reset riporta i cursori a zero e riparte dal nuovo seme', () => {
    const rng = createRng(SEED)
    take(10, rng.stream('income').next)
    rng.reset(SEED)

    expect(rng.save()).toEqual({ seed: SEED, cursors: {} })
    expect(rng.stream('income').next()).toBe(createRng(SEED).stream('income').next())
  })
})

describe('la qualità della sequenza', () => {
  /**
   * Il test che si dimentica sempre, ed è l'unico che accorge se il PRNG è *sbagliato* invece
   * che solo deterministico: uno che ritornasse sempre `0.5` passerebbe tutti quelli sopra.
   */
  const DRAWS = 100_000
  const BUCKETS = 10
  const values = take(DRAWS, createRng(SEED).stream('statistica').next)

  it('la media sta attorno a un mezzo', () => {
    const mean = values.reduce((a, v) => a + v, 0) / DRAWS

    expect(mean).toBeGreaterThan(0.495)
    expect(mean).toBeLessThan(0.505)
  })

  it('la distribuzione è piatta: nessun secchio si discosta di più di un punto percentuale', () => {
    const buckets = new Array<number>(BUCKETS).fill(0)
    for (const v of values) {
      const index = Math.min(BUCKETS - 1, Math.floor(v * BUCKETS))
      buckets[index] = (buckets[index] ?? 0) + 1
    }

    const expected = DRAWS / BUCKETS
    const tolerance = DRAWS * 0.01

    for (const count of buckets) {
      expect(Math.abs(count - expected)).toBeLessThan(tolerance)
    }
  })
})

describe('il seme di una partita nuova', () => {
  it('è un intero a 32 bit, e non ripete', () => {
    const seeds = take(100, randomSeed)

    for (const seed of seeds) expect(Number.isInteger(seed)).toBe(true)
    expect(new Set(seeds).size).toBeGreaterThan(95)
  })
})
