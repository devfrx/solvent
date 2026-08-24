import { beforeEach, describe, expect, it } from 'vitest'

import type { GameEvents } from '@core/contracts/events'
import type { Money } from '@core/contracts/money'
import { fromString, toString, ZERO } from '@core/contracts/money'

import type { Bus } from '@core/kernel/Bus'
import { createBus } from '@core/kernel/Bus'
import { ticks } from '@core/kernel/Clock'

import type { Candle } from '../../src/renderer/runtime/candles'
import { createChronicle } from '../../src/renderer/runtime/chronicle'

/**
 * D037 — la cronaca, provata **da sola**: senza Pinia, senza Ledger, senza partita.
 *
 * È la prova che il pezzo non sa cosa siano un grafico, un patrimonio o uno strumento. Ciò che
 * osserva qui dentro è una variabile mossa a mano, e l'evento del Ledger arriva costruito: la
 * cronaca guarda un numero e ascolta una notizia, e non ha modo di sapere da dove vengano.
 */

/** L'evento del Ledger, nella forma minima: la cronaca non ne legge il contenuto, solo il fatto. */
const POSTED: GameEvents['money.posted'] = {
  transaction: { reason: 'reason.income.tick', postings: [] },
  balances: { cash: ZERO, card: ZERO, world: ZERO, sink: ZERO, fees: ZERO, house: ZERO, tax: ZERO }
}

const EVERY = ticks(10)
const KEEP = 3

let bus: Bus
/** Il numero osservato. Si muove a mano, come lo muoverebbe una transazione. */
let watched: Money

/** Muove il numero e annuncia il movimento, che è ciò che il Ledger fa in un colpo solo. */
const move = (to: string): void => {
  watched = fromString(to)
  bus.emit('money.posted', POSTED)
}

const numbersOf = (candle: Candle | undefined): readonly string[] =>
  candle === undefined
    ? []
    : [candle.open, candle.high, candle.low, candle.close].map((value) => toString(value))

beforeEach(() => {
  bus = createBus()
  watched = ZERO
})

describe('una fotografia', () => {
  it('non arriva prima della cadenza, e arriva a cadenza scaduta', () => {
    const chronicle = createChronicle(bus)
    const series = chronicle.samples({ every: EVERY, keep: KEEP, observe: () => watched })

    chronicle.advance(ticks(EVERY - 1))
    expect(series.list().items).toHaveLength(0)

    chronicle.advance(ticks(1))
    expect(series.list().items).toHaveLength(1)
  })

  it('porta il numero di quando l’intervallo si è chiuso, non quello di prima', () => {
    const chronicle = createChronicle(bus)
    const series = chronicle.samples({ every: EVERY, keep: KEEP, observe: () => watched })

    move('40')
    chronicle.advance(ticks(EVERY - 1))
    move('90')
    chronicle.advance(ticks(1))

    expect(series.list().items.map((value) => toString(value))).toEqual(['90'])
  })

  it('non guarda in mezzo: fra due chiusure il movimento non lascia traccia', () => {
    // È la differenza con una candela, ed è la ragione per cui esistono tutte e due le forme.
    const chronicle = createChronicle(bus)
    const series = chronicle.samples({ every: EVERY, keep: KEEP, observe: () => watched })

    move('1000')
    move('10')
    chronicle.advance(EVERY)

    expect(series.list().items.map((value) => toString(value))).toEqual(['10'])
  })

  it('tiene quante ne dichiara, e la lista porta il proprio limite', () => {
    const chronicle = createChronicle(bus)
    const series = chronicle.samples({ every: EVERY, keep: KEEP, observe: () => watched })

    for (let taken = 0; taken < KEEP + 2; taken += 1) chronicle.advance(EVERY)

    expect(series.list().max).toBe(KEEP)
    expect(series.list().items).toHaveLength(KEEP)
  })

  it('un passo enorme vale **un** campione, non uno per intervallo trascorso', () => {
    // È il recupero all'avvio, e la ragione per cui la cronaca sta dietro a `Game.advance`: di
    // saldi intermedi non ce n'è nessuno da disegnare — il reddito arretrato entra in una
    // transazione sola — quindi dividere quel salto in barre sarebbe disegnare numeri che nessuno
    // ha mai avuto.
    const chronicle = createChronicle(bus)
    const series = chronicle.samples({ every: EVERY, keep: KEEP, observe: () => watched })

    chronicle.advance(ticks(EVERY * 100))

    expect(series.list().items).toHaveLength(1)
  })
})

describe('un’escursione', () => {
  it('chiude sul tempo anche se nessuno ha mosso niente, e la candela è piatta', () => {
    // Una candela piatta non è rumore: dice «questo strumento è fermo». Aspettare un movimento
    // lascerebbe un buco nella serie ogni volta che il giocatore non tocca niente.
    const chronicle = createChronicle(bus)
    const series = chronicle.candles({ every: EVERY, keep: KEEP, observe: () => watched })

    chronicle.advance(EVERY)
    chronicle.advance(EVERY)

    expect(series.list().items.map(numbersOf)).toEqual([
      ['0', '0', '0', '0'],
      ['0', '0', '0', '0']
    ])
  })

  it('porta il massimo e il minimo toccati **dentro**, non i due estremi', () => {
    const chronicle = createChronicle(bus)
    const series = chronicle.candles({ every: EVERY, keep: KEEP, observe: () => watched })

    move('50')
    move('120')
    move('30')
    move('80')
    chronicle.advance(EVERY)

    expect(numbersOf(series.list().items[0])).toEqual(['0', '120', '0', '80'])
  })

  it('e la successiva apre dove questa ha chiuso, senza un salto in mezzo', () => {
    const chronicle = createChronicle(bus)
    const series = chronicle.candles({ every: EVERY, keep: KEEP, observe: () => watched })

    move('80')
    chronicle.advance(EVERY)
    chronicle.advance(EVERY)

    expect(numbersOf(series.list().items[1])).toEqual(['80', '80', '80', '80'])
  })

  it('non eredita massimo e minimo, o direbbe sempre lo stesso momento', () => {
    const chronicle = createChronicle(bus)
    const series = chronicle.candles({ every: EVERY, keep: KEEP, observe: () => watched })

    move('500')
    move('10')
    chronicle.advance(EVERY)
    chronicle.advance(EVERY)

    expect(numbersOf(series.list().items[1])).toEqual(['10', '10', '10', '10'])
  })

  it('riaperta, riparte dal numero di adesso invece che dal salto', () => {
    // Serve dove un saldo cambia **senza** un movimento: dopo un caricamento. Senza, la prima
    // candela di una partita riaperta salirebbe da zero al patrimonio caricato — una salita mai
    // avvenuta, e per giunta quella che decide la scala dell'asse.
    const chronicle = createChronicle(bus)
    const series = chronicle.candles({ every: EVERY, keep: KEEP, observe: () => watched })

    watched = fromString('340')
    chronicle.reopen()
    chronicle.advance(EVERY)

    expect(numbersOf(series.list().items[0])).toEqual(['340', '340', '340', '340'])
  })
})

describe('la cronaca intera', () => {
  it('azzerata, svuota ogni serie e riapre le escursioni sul numero di adesso', () => {
    const chronicle = createChronicle(bus)
    const samples = chronicle.samples({ every: EVERY, keep: KEEP, observe: () => watched })
    const candles = chronicle.candles({ every: EVERY, keep: KEEP, observe: () => watched })

    move('700')
    chronicle.advance(EVERY)
    expect(samples.list().items).toHaveLength(1)
    expect(candles.list().items).toHaveLength(1)

    watched = ZERO
    chronicle.reset()

    expect(samples.list().items).toEqual([])
    expect(candles.list().items).toEqual([])

    chronicle.advance(EVERY)
    expect(numbersOf(candles.list().items[0])).toEqual(['0', '0', '0', '0'])
  })

  it('azzerata, riparte anche la cadenza: la prima chiusura è un intervallo intero dopo', () => {
    const chronicle = createChronicle(bus)
    const series = chronicle.samples({ every: EVERY, keep: KEEP, observe: () => watched })

    chronicle.advance(ticks(EVERY - 1))
    chronicle.reset()

    chronicle.advance(ticks(1))
    expect(series.list().items).toHaveLength(0)

    chronicle.advance(ticks(EVERY - 1))
    expect(series.list().items).toHaveLength(1)
  })

  it('due cadenze diverse non si disturbano, e nessuna sa dell’altra', () => {
    // È la prova che la lista è una sola e che nessuna operazione guarda chi sta trattando: la
    // registrazione lenta non vede passare quella veloce.
    const chronicle = createChronicle(bus)
    const fast = chronicle.samples({ every: ticks(2), keep: KEEP, observe: () => watched })
    const slow = chronicle.samples({ every: ticks(6), keep: KEEP, observe: () => watched })

    chronicle.advance(ticks(6))

    expect(fast.list().items).toHaveLength(1)
    expect(slow.list().items).toHaveLength(1)

    chronicle.advance(ticks(2))

    expect(fast.list().items).toHaveLength(2)
    expect(slow.list().items).toHaveLength(1)
  })

  it('la lista che ritorna è **la stessa** finché non si chiude niente', () => {
    // È ciò su cui poggia il mirror dello store: rileggere dieci volte al secondo costa un
    // confronto, e un `shallowRef` riscritto con lo stesso oggetto non sveglia nessuno.
    const chronicle = createChronicle(bus)
    const series = chronicle.samples({ every: EVERY, keep: KEEP, observe: () => watched })

    const before = series.list()
    chronicle.advance(ticks(EVERY - 1))
    expect(series.list()).toBe(before)

    chronicle.advance(ticks(1))
    expect(series.list()).not.toBe(before)
  })
})
