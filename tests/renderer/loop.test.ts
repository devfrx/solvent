import { describe, expect, it } from 'vitest'

import { clock, milliseconds, ticks } from '@core/kernel/Clock'

import { createLoop, sampleOf, stepOf, type Step } from '../../src/renderer/runtime/loop'
import { createStage } from '../helpers/host'

/**
 * ADR 0009 — dal frame al tick. Il difetto che questo file esiste per prendere è l'accumulatore
 * che scarta il resto: costa qualche percento di reddito al minuto, non si vede a occhio e non si
 * diagnostica senza contare i tick uno per uno.
 */

const TICK = 100
const CAP = ticks(50)

describe('la regola dell’accumulatore', () => {
  it('sotto la durata di un tick non succede niente, e il tempo resta', () => {
    expect(stepOf(milliseconds(99), CAP, clock)).toEqual({
      elapsed: 0,
      pending: 99,
      dropped: 0
    })
  })

  it('un tick esatto non lascia resto', () => {
    expect(stepOf(milliseconds(TICK), CAP, clock)).toEqual({ elapsed: 1, pending: 0, dropped: 0 })
  })

  it('tre tick e mezzo sono tre tick e mezzo tick di resto', () => {
    expect(stepOf(milliseconds(350), CAP, clock)).toEqual({ elapsed: 3, pending: 50, dropped: 0 })
  })

  it('oltre il tetto esegue il tetto e dice quanto ha buttato via', () => {
    // Cento tick chiesti, cinquanta di tetto: il resto è perso ed è giusto che si sappia.
    expect(stepOf(milliseconds(100 * TICK), CAP, clock)).toEqual({
      elapsed: 50,
      pending: 0,
      dropped: 50
    })
  })

  it('un orologio che torna indietro non produce tick negativi', () => {
    // Un aggiustamento dell'ora di sistema dà un delta negativo, e `Math.floor(-0.5)` è `-1`:
    // sarebbe reddito al contrario, cioè denaro che sparisce senza una transazione.
    expect(stepOf(milliseconds(-5000), CAP, clock)).toEqual({
      elapsed: 0,
      pending: 0,
      dropped: 0
    })
  })
})

describe('la cadenza dei campioni', () => {
  /** Cinque secondi a dieci tick al secondo, come `BALANCE.NET_WORTH_SAMPLE_EVERY`. */
  const EVERY = ticks(50)

  it('sotto la soglia non c’è niente da campionare, e il tempo resta', () => {
    expect(sampleOf(ticks(0), ticks(49), EVERY)).toEqual({ due: false, pending: 49 })
  })

  it('la soglia esatta chiede un campione e non lascia resto', () => {
    expect(sampleOf(ticks(0), ticks(50), EVERY)).toEqual({ due: true, pending: 0 })
  })

  it('oltre la soglia il resto sopravvive, altrimenti la cadenza slitta', () => {
    // Venticinque tick avanzati: il prossimo campione arriva dopo venticinque, non dopo
    // cinquanta. Buttarli via allungherebbe di poco ogni intervallo, cioè in modo invisibile.
    expect(sampleOf(ticks(0), ticks(75), EVERY)).toEqual({ due: true, pending: 25 })
  })

  it('e l’accumulatore di prima si somma a quello che arriva', () => {
    expect(sampleOf(ticks(40), ticks(45), EVERY)).toEqual({ due: true, pending: 35 })
  })

  it('otto ore di assenza valgono un campione, non uno per ogni soglia attraversata', () => {
    // Il recupero arriva qui come un `elapsed` enorme, e di saldi ne esiste **uno**: il reddito
    // arretrato entra in una transazione sola. Che i campioni non possano essere più d'uno lo
    // dice il tipo — `due` è un booleano — e questo test dice che il resto non ci sopravvive.
    expect(sampleOf(ticks(0), ticks(288_000), EVERY)).toEqual({ due: true, pending: 0 })
  })

  it('il resto non supera mai la soglia, per quanto lungo sia il passo', () => {
    const long = sampleOf(ticks(49), ticks(1_000_003), EVERY)
    expect(long.pending).toBeLessThan(EVERY)
  })
})

describe('il loop', () => {
  const withStage = (): {
    readonly stage: ReturnType<typeof createStage>
    readonly steps: Step[]
  } => {
    const stage = createStage()
    const steps: Step[] = []
    const loop = createLoop({
      clock,
      cap: CAP,
      now: stage.host.now,
      schedule: stage.host.schedule,
      onStep: (step) => steps.push(step)
    })
    loop.start()
    return { stage, steps }
  }

  it('al primo frame non inventa tempo', () => {
    const { stage, steps } = withStage()

    stage.frame()

    expect(steps).toEqual([])
  })

  it('produce esattamente i tick attesi, e il resto sopravvive fra i frame', () => {
    // Due frame da 250 ms sono cinque tick, non quattro: senza l'accumulatore ogni frame
    // perderebbe 50 ms, cioè mezzo tick — il 20% del reddito, invisibile.
    const { stage, steps } = withStage()
    stage.frame()

    stage.advance(250)
    stage.frame()
    stage.advance(250)
    stage.frame()

    expect(steps.map((step) => step.elapsed)).toEqual([2, 3])
  })

  it('mille frame da 16 ms valgono il tempo che è passato, al tick', () => {
    const { stage, steps } = withStage()
    stage.frame()

    for (let frame = 0; frame < 1000; frame += 1) {
      stage.advance(16)
      stage.frame()
    }

    // 16.000 ms sono 160 tick esatti. Un accumulatore che arrotonda ne darebbe zero: 16 ms non
    // arrivano mai a 100, quindi nessun frame supererebbe la soglia da solo.
    const total = steps.reduce((sum, step) => sum + step.elapsed, 0)
    expect(total).toBe(160)
  })

  it('un frame lunghissimo viene limitato dal tetto', () => {
    const { stage, steps } = withStage()
    stage.frame()

    stage.advance(60 * 60 * 1000)
    stage.frame()

    expect(steps).toHaveLength(1)
    expect(steps[0]?.elapsed).toBe(CAP)
    expect(steps[0]?.dropped).toBeGreaterThan(0)
  })

  it('si ferma e non chiede più frame', () => {
    const stage = createStage()
    const steps: Step[] = []
    const loop = createLoop({
      clock,
      cap: CAP,
      now: stage.host.now,
      schedule: stage.host.schedule,
      onStep: (step) => steps.push(step)
    })

    loop.start()
    expect(loop.isRunning()).toBe(true)
    stage.frame()
    loop.stop()

    expect(loop.isRunning()).toBe(false)
    expect(stage.frame()).toBe(false)

    stage.advance(1000)
    expect(steps).toEqual([])
  })

  it('start due volte non raddoppia i frame', () => {
    const stage = createStage()
    const steps: Step[] = []
    const loop = createLoop({
      clock,
      cap: CAP,
      now: stage.host.now,
      schedule: stage.host.schedule,
      onStep: (step) => steps.push(step)
    })

    loop.start()
    loop.start()
    stage.frame()
    stage.advance(1000)
    stage.frame()

    expect(steps.map((step) => step.elapsed)).toEqual([10])
  })
})
