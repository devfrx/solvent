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

describe('la finestra è la serie, e nient’altro', () => {
  it('i due estremi dell’asse sono il campione più basso e il più alto, esatti', () => {
    // È la regola intera. Un margine in denaro finisce **dentro** i numeri che il giocatore legge,
    // uno in pixel no: il respiro sta in `grid.padding`, dove non può diventare un importo.
    expect(windowOf([100, 180, 200])).toEqual({ min: 100, max: 200 })
  })

  it('e non parte da zero: è il punto di tutta la decisione', () => {
    expect(windowOf([900_000, 901_800])).toEqual({ min: 900_000, max: 901_800 })
  })

  it('si legge anche su un patrimonio grande, che è il caso in cui un asse da zero muore', () => {
    // **Il numero che ha ribaltato la decisione.** Ancorata a zero, questa serie occupava lo 0,19%
    // dell’altezza. Qui la finestra è larga esattamente quanto la crescita, e non un centesimo di più.
    const window = windowOf([900_000, 900_600, 901_200, 901_800])

    expect(window.max - window.min).toBe(1800)
  })
})

/**
 * **Il margine era un importo, e adesso non c’è più.**
 *
 * Il difetto si vedeva nella finestra vera: una carta ferma a zero portava scritto `-1,00 €` sotto
 * l’asse, e un patrimonio partito da zero `-8.885,89 €`. In questo gioco un saldo negativo **non
 * esiste**, quindi non era un’approssimazione: era un importo mai avuto, scritto dove si leggono
 * quelli avuti. E anche quando il segno era giusto il numero non era di nessun campione.
 *
 * Nessuno dei test di prima poteva vederlo: chiedevano tutti che il margine ci **fosse**, e c’era.
 *
 * Il primo passaggio aveva messo un pavimento a zero: toglieva l’assurdo e lasciava la bugia.
 * Questi test chiedono la forma che toglie tutt’e due — non c’è niente da clampare, perché non si
 * sottrae più niente.
 */
describe('l’asse non porta un numero che non è mai esistito', () => {
  it('una serie partita da zero non ha bisogno di nessun pavimento', () => {
    expect(windowOf([0, 2500, 5000])).toEqual({ min: 0, max: 5000 })
  })

  it('e nemmeno una che sfiora lo zero senza toccarlo', () => {
    // Con il margine del 15% questa serie scendeva a -175: un saldo che non è mai stato.
    expect(windowOf([500, 5000])).toEqual({ min: 500, max: 5000 })
  })

  it('una serie che sotto zero ci scende davvero ci scende, e basta', () => {
    // La regola è del **dato** e non del denaro: il giorno in cui un dominio porterà un debito,
    // questo file non cambia e nessuno deve ricordarsi di rileggerlo.
    expect(windowOf([-100, 100])).toEqual({ min: -100, max: 100 })
  })
})

describe('quando niente si è mosso', () => {
  it('la finestra esiste lo stesso, e il valore vero è il fondo', () => {
    // Il caveau pieno blocca il reddito e il patrimonio si ferma: è un caso vero, non teorico. Un
    // asse che comincia e finisce sullo stesso numero non è un asse — è una divisione per zero
    // dentro la libreria. L’altezza si inventa **in su**, così il numero vero resta sulla riga su
    // cui la serie poggia.
    const window = windowOf([5000, 5000, 5000])

    expect(window.min).toBe(5000)
    expect(window.max).toBeGreaterThan(5000)
  })

  it('e un solo campione non è una salita', () => {
    const window = windowOf([42])

    expect(window.min).toBe(42)
    expect(window.max).toBeGreaterThan(42)
  })

  it('una partita appena nata, tutta a zero, ha comunque una finestra', () => {
    // Qui anche la frazione del livello è zero: senza il minimo assoluto l’asse sarebbe 0–0.
    const window = windowOf([0, 0])

    expect(window.min).toBe(0)
    expect(window.max).toBeGreaterThan(0)
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
    // qui sotto apre e chiude a 1.000,00 € e in mezzo è arrivata a 1.400,00 €. I due estremi sono
    // **esatti**: sono il massimo e il minimo toccati, non due numeri che li contengono.
    const window = candleWindowOf(candlePointsOf([candle('1000', '1400', '600', '1000')]))

    expect(window).toEqual({ min: 600, max: 1400 })
  })

  it('e su tutte le candele, non solo sull’ultima', () => {
    const window = candleWindowOf(
      candlePointsOf([candle('100', '900', '100', '900'), candle('900', '950', '900', '950')])
    )

    expect(window).toEqual({ min: 100, max: 950 })
  })

  it('una carta ferma a zero ha comunque una finestra', () => {
    // La serie della carta è piatta finché il giocatore non tocca il bancomat, ed è il caso in cui
    // un asse che comincia e finisce sullo stesso numero non sarebbe un asse.
    const window = candleWindowOf(candlePointsOf([candle('0', '0', '0', '0')]))

    expect(window.max).toBeGreaterThan(window.min)
  })

  it('e comincia da zero: le candele passano dalla stessa regola', () => {
    // È il caso della segnalazione, ed è quello che si vede per primo aprendo una partita nuova:
    // la carta è a zero, e sotto l'asse compariva `-1,00 €`.
    expect(candleWindowOf(candlePointsOf([candle('0', '0', '0', '0')])).min).toBe(0)
  })
})
