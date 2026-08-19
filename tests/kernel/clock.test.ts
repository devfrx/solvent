import { describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'

import {
  clock,
  seconds,
  ticks,
  TICKS_PER_SECOND,
  type Seconds,
  type Ticks
} from '@core/kernel/Clock'

/**
 * R04 · ADR 0009 — passo fisso a 10 tick/s, e le unità nel tipo.
 *
 * Il difetto A04 era il tick rate in cinque posti. La difesa non è ricordarsene: è che un numero
 * senza unità non entra in un'API temporale, e che la frequenza è dichiarata una volta sola.
 */
describe('Clock', () => {
  it('un secondo vale dieci tick, un tick vale un decimo di secondo', () => {
    expect(clock.secondsToTicks(seconds(1))).toBe(10)
    expect(clock.ticksToSeconds(ticks(1))).toBe(0.1)
    expect(TICKS_PER_SECOND).toBe(10)
  })

  it('andata e ritorno non perde nulla, nemmeno sui frazionari', () => {
    for (const valore of [0, 1, 0.1, 0.25, 0.3, 3.7, 12.34, 60, 3600]) {
      const andata = clock.secondsToTicks(seconds(valore))
      expect(clock.ticksToSeconds(andata)).toBe(valore)
    }
  })

  it('non arrotonda: il tempo frazionario è affare del loop, non del Clock', () => {
    expect(clock.secondsToTicks(seconds(0.25))).toBe(2.5)
  })

  it('cento al secondo fanno dieci al tick, in Decimal', () => {
    expect(toString(clock.perSecondToPerTick(fromString('100')))).toBe('10')
  })

  it('il tasso resta esatto dove il float sbaglierebbe', () => {
    const alTick = clock.perSecondToPerTick(fromString('0.7'))
    expect(toString(alTick)).toBe('0.07')
    expect(toString(clock.perTickToPerSecond(alTick))).toBe('0.7')
    // La stessa divisione in virgola mobile: è il motivo per cui il denaro è Decimal (ADR 0006).
    expect(0.7 / 10).toBe(0.06999999999999999)
  })

  it('non ha stato: espone quattro conversioni e nient’altro', () => {
    expect(Object.keys(clock).sort()).toEqual([
      'perSecondToPerTick',
      'perTickToPerSecond',
      'secondsToTicks',
      'ticksToSeconds'
    ])
  })
})

describe('le unità del tempo', () => {
  it('un number nudo non è un Ticks', () => {
    // @ts-expect-error — R04: un numero senza unità non entra in un'API temporale (ADR 0009)
    const quanti: Ticks = 10
    expect(quanti).toBe(10)
  })

  it('Ticks e Seconds non sono intercambiabili', () => {
    const durata = ticks(30)
    // @ts-expect-error — R04: trenta tick non sono trenta secondi, e il compilatore lo sa
    const sbagliata: Seconds = durata
    expect(sbagliata).toBe(30)
  })

  it('passare dei secondi dove servono dei tick non compila', () => {
    // @ts-expect-error — R04: la conversione esiste apposta, non si salta
    const esito = clock.ticksToSeconds(seconds(3))
    expect(esito).toBe(0.3)
  })

  it('a runtime sono numeri e basta: il marchio non esiste', () => {
    expect(typeof ticks(3)).toBe('number')
    expect(ticks(3) + 1).toBe(4)
  })
})
