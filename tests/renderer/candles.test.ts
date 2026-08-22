import { describe, expect, it } from 'vitest'

import { fromString } from '@core/contracts/money'

import type { Candle } from '../../src/renderer/runtime/candles'
import { nextCandle, openCandle, updateCandle } from '../../src/renderer/runtime/candles'

/**
 * D034 — l'accumulatore delle candele, e il motivo per cui non è un campionatore.
 *
 * Una fotografia ogni N tick sa **dov'era** il saldo in quell'istante; una candela sa cosa è
 * successo **in mezzo**. È tutta la differenza, ed è ciò che questi test tengono fermo: fra due
 * chiusure il saldo può salire, scendere e tornare, e nessuna delle due fotografie lo vedrebbe.
 *
 * Gira in `node` senza jsdom, come `loop` e `series`: qui non si monta niente, si passano dei
 * `Decimal` a delle funzioni e si guarda cosa tornano.
 *
 * **Che una serie non abbia buchi non si prova qui**, e non è una dimenticanza: un intervallo
 * senza movimento è una candela piatta, e a livello di accumulatore «piatta» è vera per qualunque
 * implementazione — anche per una che non chiude niente. Il test che discrimina sta in
 * `store.test.ts`, dove la serie esiste davvero e si può contare.
 */

const at = (amount: string): ReturnType<typeof fromString> => fromString(amount)

/** I quattro numeri di una candela, come stringhe, per confrontarli senza toccare i `Decimal`. */
const numbersOf = (candle: Candle): readonly string[] =>
  [candle.open, candle.high, candle.low, candle.close].map((value) => value.toString())

describe('una candela appena aperta', () => {
  it('porta lo stesso saldo quattro volte: non è ancora successo niente', () => {
    expect(numbersOf(openCandle(at('1000')))).toEqual(['1000', '1000', '1000', '1000'])
  })
})

describe("il saldo si muove dentro l'intervallo", () => {
  it('un saldo che sale alza il massimo e la chiusura, e lascia stare l’apertura', () => {
    const candle = updateCandle(openCandle(at('1000')), at('1200'))

    expect(numbersOf(candle)).toEqual(['1000', '1200', '1000', '1200'])
  })

  it('un saldo che scende abbassa il minimo, e l’apertura resta dov’era', () => {
    const candle = updateCandle(openCandle(at('1000')), at('800'))

    expect(numbersOf(candle)).toEqual(['1000', '1000', '800', '800'])
  })

  it('il massimo e il minimo sono quelli **dentro**, non i due estremi', () => {
    // È il caso che la delega chiede per nome, e il solo che distingue una candela da una
    // fotografia: il saldo sale, scende e torna dov'era, tutto fra due chiusure. Un campionatore
    // vedrebbe 1.000,00 € e 1.000,00 €, cioè «non è successo niente».
    const candle = [at('1400'), at('600'), at('1000')].reduce(updateCandle, openCandle(at('1000')))

    expect(numbersOf(candle)).toEqual(['1000', '1400', '600', '1000'])
  })

  it('non tocca la candela che riceve: ne ritorna una nuova', () => {
    const before = openCandle(at('1000'))
    updateCandle(before, at('9999'))

    expect(numbersOf(before)).toEqual(['1000', '1000', '1000', '1000'])
  })
})

describe("alla fine dell'intervallo", () => {
  it('la successiva apre dove questa ha chiuso, e non dove ha toccato', () => {
    const moved = [at('1400'), at('600'), at('1000')].reduce(updateCandle, openCandle(at('1000')))

    expect(numbersOf(nextCandle(moved))).toEqual(['1000', '1000', '1000', '1000'])
  })

  it('l’escursione non passa alla successiva: ogni candela misura il proprio intervallo', () => {
    // Se il massimo e il minimo si ereditassero, la prima oscillazione grande resterebbe disegnata
    // in tutte le candele successive — una serie che racconta sempre lo stesso momento.
    const moved = updateCandle(openCandle(at('1000')), at('5000'))
    const after = updateCandle(nextCandle(moved), at('5100'))

    expect(numbersOf(after)).toEqual(['5000', '5100', '5000', '5100'])
  })
})
