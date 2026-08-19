import { describe, expect, it } from 'vitest'

import { createRng, seedCasuale } from '@core/kernel/Rng'

/**
 * R03 · ADR 0005 — casualità riproducibile, con stream separati.
 *
 * Il difetto A03 erano 176 sorgenti nate una alla volta, ognuna "solo questa". La difesa è che
 * esista una sorgente sola, che il suo stato entri nel salvataggio, e che ricaricare riproduca
 * la stessa sequenza — altrimenti il save-scum è gratis e i test di dominio non significano nulla.
 */

const SEME = 20260819

const prendi = (quante: number, estrai: () => number): number[] =>
  Array.from({ length: quante }, estrai)

describe('Rng', () => {
  it('stesso seme, stessa sequenza, su due istanze indipendenti', () => {
    const uno = createRng(SEME).stream('income')
    const due = createRng(SEME).stream('income')

    expect(prendi(5, uno.next)).toEqual(prendi(5, due.next))
  })

  it('semi diversi danno sequenze diverse', () => {
    const uno = prendi(5, createRng(SEME).stream('income').next)
    const due = prendi(5, createRng(SEME + 1).stream('income').next)

    expect(uno).not.toEqual(due)
  })

  it('ogni estrazione sta in [0, 1)', () => {
    const valori = prendi(1000, createRng(SEME).stream('income').next)

    expect(Math.min(...valori)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...valori)).toBeLessThan(1)
  })
})

describe('gli stream sono indipendenti', () => {
  it('cento estrazioni da uno stream non muovono la prima estrazione di un altro', () => {
    const conDisturbo = createRng(SEME)
    prendi(100, conDisturbo.stream('income').next)

    const pulito = createRng(SEME)

    expect(conDisturbo.stream('market').next()).toBe(pulito.stream('market').next())
  })

  it('due stream diversi non producono la stessa sequenza', () => {
    const rng = createRng(SEME)

    expect(prendi(5, rng.stream('income').next)).not.toEqual(prendi(5, rng.stream('market').next))
  })

  it('chiedere due volte lo stesso stream continua la sequenza, non la fa ripartire', () => {
    const rng = createRng(SEME)
    const primo = rng.stream('income').next()
    const secondo = rng.stream('income').next()

    expect(secondo).not.toBe(primo)
    expect(rng.save().cursors['income']).toBe(2)
  })
})

describe('salvataggio e ripresa', () => {
  it('load(save()) a metà sequenza continua identico', () => {
    const originale = createRng(SEME)
    prendi(7, originale.stream('income').next)
    prendi(3, originale.stream('market').next)

    const ripreso = createRng(0)
    ripreso.load(originale.save())

    expect(prendi(5, ripreso.stream('income').next)).toEqual(
      prendi(5, originale.stream('income').next)
    )
  })

  it('lo stato salvato sono due numeri: un seme e un cursore per stream', () => {
    const rng = createRng(SEME)
    prendi(3, rng.stream('income').next)

    expect(rng.save()).toEqual({ seed: SEME, cursors: { income: 3 } })
  })

  it('reset riporta i cursori a zero e riparte dal nuovo seme', () => {
    const rng = createRng(SEME)
    prendi(10, rng.stream('income').next)
    rng.reset(SEME)

    expect(rng.save()).toEqual({ seed: SEME, cursors: {} })
    expect(rng.stream('income').next()).toBe(createRng(SEME).stream('income').next())
  })
})

describe('la qualità della sequenza', () => {
  /**
   * Il test che si dimentica sempre, ed è l'unico che accorge se il PRNG è *sbagliato* invece
   * che solo deterministico: uno che ritornasse sempre `0.5` passerebbe tutti quelli sopra.
   */
  const ESTRAZIONI = 100_000
  const SECCHI = 10
  const valori = prendi(ESTRAZIONI, createRng(SEME).stream('statistica').next)

  it('la media sta attorno a un mezzo', () => {
    const media = valori.reduce((a, v) => a + v, 0) / ESTRAZIONI

    expect(media).toBeGreaterThan(0.495)
    expect(media).toBeLessThan(0.505)
  })

  it('la distribuzione è piatta: nessun secchio si discosta di più di un punto percentuale', () => {
    const secchi = new Array<number>(SECCHI).fill(0)
    for (const v of valori) {
      const indice = Math.min(SECCHI - 1, Math.floor(v * SECCHI))
      secchi[indice] = (secchi[indice] ?? 0) + 1
    }

    const atteso = ESTRAZIONI / SECCHI
    const tolleranza = ESTRAZIONI * 0.01

    for (const conteggio of secchi) {
      expect(Math.abs(conteggio - atteso)).toBeLessThan(tolleranza)
    }
  })
})

describe('il seme di una partita nuova', () => {
  it('è un intero a 32 bit, e non ripete', () => {
    const semi = prendi(100, seedCasuale)

    for (const seme of semi) expect(Number.isInteger(seme)).toBe(true)
    expect(new Set(semi).size).toBeGreaterThan(95)
  })
})
