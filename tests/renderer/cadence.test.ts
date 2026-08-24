import { describe, expect, it } from 'vitest'

import { ticks } from '@core/kernel/Clock'

import { createCadence } from '../../src/renderer/runtime/cadence'

/**
 * D041 — la cadenza, e la sola cosa che sa fare: dire che è passato abbastanza tempo.
 *
 * Gira in `node` senza jsdom come `loop`, `candles` e `series`: qui non si monta niente e non si
 * aspetta niente. È il punto — una cadenza che dipendesse da un orologio vero si proverebbe
 * aspettando, cioè con un test lento e non deterministico, e non si potrebbe far passare una notte.
 *
 * **Due proprietà si provano qui e non altrove**, perché a questo livello sono contabili: che il
 * resto non si perda, e che ventiquattro soglie attraversate valgano **una** cosa da fare. Che il
 * gioco poi scriva davvero su disco è di `store.test.ts`, dove le scritture si contano.
 */

/** Dieci tick, per fare i conti a mente. Il numero vero è in `balance/`, e qui non serve. */
const EVERY = ticks(10)

describe('una cadenza appena nata', () => {
  it('non è dovuta: non è ancora passato niente', () => {
    expect(createCadence(EVERY).take()).toBe(false)
  })
})

describe('la soglia', () => {
  it('non scatta un tick prima', () => {
    const cadence = createCadence(EVERY)
    cadence.advance(ticks(9))

    expect(cadence.take()).toBe(false)
  })

  it('scatta esattamente sulla soglia', () => {
    const cadence = createCadence(EVERY)
    cadence.advance(ticks(10))

    expect(cadence.take()).toBe(true)
  })
})

describe('il resto, che è il difetto che `stepOf` documenta un piano più giù', () => {
  it('due passi che sommati superano la soglia la fanno scattare una volta', () => {
    const cadence = createCadence(EVERY)

    cadence.advance(ticks(6))
    expect(cadence.take()).toBe(false)

    cadence.advance(ticks(6))
    expect(cadence.take()).toBe(true)
  })

  it('e ciò che avanza torna indietro invece di essere buttato', () => {
    const cadence = createCadence(EVERY)
    cadence.advance(ticks(6))
    cadence.advance(ticks(6))
    cadence.take()

    // Dopo 6+6 sono rimasti 2 tick: ne bastano 8, non 10. Un accumulatore che buttasse il resto
    // chiederebbe dieci tick pieni ogni volta, e nessuno lo noterebbe senza contarli.
    cadence.advance(ticks(7))
    expect(cadence.take()).toBe(false)

    cadence.advance(ticks(1))
    expect(cadence.take()).toBe(true)
  })
})

describe('la coalizione, che è la ragione per cui questa cosa esiste', () => {
  it('un passo che vale dodici soglie è dovuto una volta, non dodici', () => {
    const cadence = createCadence(EVERY)
    cadence.advance(ticks(120))

    expect(cadence.take()).toBe(true)
    expect(cadence.take()).toBe(false)
  })

  it('e centoventicinque passi da un tick lasciano lo stesso resto di un passo da centoventicinque', () => {
    // È la prova che avanzare a blocchi e avanzare in un colpo danno la **stessa** cadenza: se non
    // fosse vero, mettere `saveCadence.advance` dentro il ciclo dei blocchi di `Game.advance`
    // invece che fuori cambierebbe quando il gioco scrive.
    const many = createCadence(EVERY)
    for (let step = 0; step < 125; step += 1) many.advance(ticks(1))

    const one = createCadence(EVERY)
    one.advance(ticks(125))

    expect([many.take(), one.take()]).toEqual([true, true])

    // Da tutte e due le parti restano 5 tick: quattro non bastano, il quinto sì.
    many.advance(ticks(4))
    one.advance(ticks(4))
    expect([many.take(), one.take()]).toEqual([false, false])

    many.advance(ticks(1))
    one.advance(ticks(1))
    expect([many.take(), one.take()]).toEqual([true, true])
  })

  it('un dovuto che nessuno prende resta dovuto, e non lo cancella il passo dopo', () => {
    // È la prova del `||` in `advance`. Con un `=` al suo posto il secondo passo — che non
    // attraversa nessuna soglia — spegnerebbe il dovuto del primo, e la scrittura sparirebbe.
    const cadence = createCadence(EVERY)
    cadence.advance(ticks(10))
    cadence.advance(ticks(1))

    expect(cadence.take()).toBe(true)
  })
})

describe('azzerarla', () => {
  it('toglie il dovuto', () => {
    const cadence = createCadence(EVERY)
    cadence.advance(ticks(10))
    cadence.clear()

    expect(cadence.take()).toBe(false)
  })

  it('e toglie anche il resto, che è la metà che si dimentica', () => {
    const cadence = createCadence(EVERY)
    cadence.advance(ticks(9))
    cadence.clear()

    // Senza azzerare il resto, questi nove si sommerebbero ai nove di prima e la soglia
    // scatterebbe: la partita nuova scriverebbe a un istante deciso da quella buttata via.
    cadence.advance(ticks(9))
    expect(cadence.take()).toBe(false)
  })
})
