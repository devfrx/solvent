import { describe, expect, it } from 'vitest'

import { fromString } from '@core/contracts/money'

import {
  candlePointsOf,
  candleWindowOf,
  pointsOf,
  windowOf
} from '../../src/renderer/components/shell/series'
import type { Candle } from '../../src/renderer/runtime/candles'

/**
 * I due numeri che ApexCharts non sa dedurre da sé: dove comincia e dove finisce l'asse.
 *
 * Gira in `node` senza jsdom, come `postings` e `rotation`. Il grafico ha una libreria dietro
 * ([ADR 0034](../../docs/adr/0034-il-grafico-e-una-libreria.md)) e la libreria non si prova qui:
 * quello che si prova è ciò che le passiamo, che è l'unica parte che possiamo sbagliare noi.
 */

const money = (...amounts: readonly string[]): ReturnType<typeof fromString>[] =>
  amounts.map((amount) => fromString(amount))

describe('il confine di presentazione', () => {
  it('porta i decimali fuori dal Ledger una volta sola, e solo qui', () => {
    expect(pointsOf(money('0', '60', '1234.56'))).toEqual([0, 60, 1234.56])
  })

  it('una serie vuota non produce punti', () => {
    expect(pointsOf([])).toEqual([])
  })
})

describe('la finestra si adatta alla serie', () => {
  it('lascia respiro sotto il campione più basso e sopra il più alto', () => {
    // Senza margine il più basso poggia sul fondo e si legge come «zero», che non è quello che è.
    const window = windowOf([100, 200])
    expect(window.min).toBeLessThan(100)
    expect(window.max).toBeGreaterThan(200)
  })

  it('il respiro è proporzionale a quanto è successo, non una cifra fissa', () => {
    const small = windowOf([100, 200])
    const large = windowOf([1000, 2000])
    expect(large.max - large.min).toBeCloseTo((small.max - small.min) * 10, 6)
  })

  it('si legge anche su un patrimonio grande, che è il caso in cui un asse da zero muore', () => {
    // **Il numero che ha ribaltato la decisione.** Ancorata a zero, questa serie occupava lo 0,19%
    // dell'altezza. Qui la finestra è larga quanto la crescita, più il margine.
    const window = windowOf([900_000, 900_600, 901_200, 901_800])
    expect(window.max - window.min).toBeCloseTo(1800 * 1.3, 6)
  })

  it('e non parte da zero: è il punto di tutta la decisione', () => {
    expect(windowOf([900_000, 901_800]).min).toBeGreaterThan(0)
  })
})

describe('quando niente si è mosso', () => {
  it('la finestra esiste lo stesso, e la serie ci sta in mezzo', () => {
    // Il caveau pieno blocca il reddito e il patrimonio si ferma: è un caso vero, non teorico. Un
    // asse che comincia e finisce sullo stesso numero non è un asse.
    const window = windowOf([5000, 5000, 5000])
    expect(window.min).toBeLessThan(5000)
    expect(window.max).toBeGreaterThan(5000)
  })

  it('e un solo campione non è una salita', () => {
    const window = windowOf([42])
    expect(window.min).toBeLessThan(42)
    expect(window.max).toBeGreaterThan(42)
  })

  it('una partita appena nata, tutta a zero, ha comunque una finestra', () => {
    // Qui anche la frazione del livello è zero: senza il minimo assoluto l'asse sarebbe 0–0, cioè
    // una divisione per zero dentro la libreria invece che dentro il nostro codice.
    const window = windowOf([0, 0])
    expect(window.max).toBeGreaterThan(window.min)
  })
})

/** Una candela scritta come quattro stringhe, nell'ordine in cui si legge: apre, tocca, chiude. */
const candle = (open: string, high: string, low: string, close: string): Candle => ({
  open: fromString(open),
  high: fromString(high),
  low: fromString(low),
  close: fromString(close)
})

describe('le candele attraversano lo stesso confine', () => {
  it('portano fuori tutti e quattro i numeri, e nell’ordine che la libreria vuole', () => {
    // ApexCharts legge `y` come apertura, massimo, minimo, chiusura. Scambiarne due disegnerebbe
    // candele plausibili e sbagliate, che è il difetto peggiore di questa famiglia.
    expect(candlePointsOf([candle('1000', '1400', '600', '1200')])).toEqual([
      { x: 0, y: [1000, 1400, 600, 1200] }
    ])
  })

  it('le numera nell’ordine in cui hanno chiuso: la prima è la più vecchia', () => {
    const points = candlePointsOf([
      candle('1', '1', '1', '1'),
      candle('2', '2', '2', '2'),
      candle('3', '3', '3', '3')
    ])

    expect(points.map((point) => point.x)).toEqual([0, 1, 2])
  })

  it('una serie vuota non produce candele', () => {
    expect(candlePointsOf([])).toEqual([])
  })
})

describe('la finestra di un grafico a candele', () => {
  it('si misura su ciò che le candele hanno toccato, non su dove hanno chiuso', () => {
    // Se l'asse guardasse solo apertura e chiusura, lo stoppino uscirebbe dal grafico: la candela
    // qui sotto apre e chiude a 1.000,00 € e in mezzo è arrivata a 1.400,00 €.
    const window = candleWindowOf(candlePointsOf([candle('1000', '1400', '600', '1000')]))

    expect(window.max).toBeGreaterThan(1400)
    expect(window.min).toBeLessThan(600)
  })

  it('e su tutte le candele, non solo sull’ultima', () => {
    const window = candleWindowOf(
      candlePointsOf([candle('100', '900', '100', '900'), candle('900', '950', '900', '950')])
    )

    expect(window.min).toBeLessThan(100)
    expect(window.max).toBeGreaterThan(950)
  })

  it('una carta ferma a zero ha comunque una finestra', () => {
    // La serie della carta è piatta finché il giocatore non tocca il bancomat, ed è il caso in cui
    // un asse che comincia e finisce sullo stesso numero non sarebbe un asse.
    const window = candleWindowOf(candlePointsOf([candle('0', '0', '0', '0')]))

    expect(window.max).toBeGreaterThan(window.min)
  })
})
