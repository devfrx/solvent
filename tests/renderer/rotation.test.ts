import { describe, expect, it } from 'vitest'

import {
  draggedTo,
  facing,
  releasedOn,
  restingAt,
  transformOf
} from '../../src/renderer/components/atm/rotation'

/**
 * La carta che gira, senza la carta.
 *
 * P5 chiede due cose che si possono sbagliare in silenzio: che il gesto sia un gesto — trascinare
 * porta la carta dove la mano la porta — e che girarla sia **facile**, perché il retro è la metà
 * utile. Nessuna delle due si vede leggendo il componente: si vedono qui, dove la matematica è
 * uscita apposta (docs/roadmap-fette.md — il grilletto di jsdom resta non tirato).
 */

const FRONT = restingAt('front')

describe('il trascinamento', () => {
  it('gira la carta nella direzione della mano', () => {
    const turned = draggedTo(FRONT, 100, 0)

    expect(turned.y).toBeGreaterThan(FRONT.y)
    expect(draggedTo(FRONT, -100, 0).y).toBeLessThan(FRONT.y)
  })

  it('inclina verso l’alto quando la mano scende, e viceversa', () => {
    expect(draggedTo(FRONT, 0, 100).x).toBeLessThan(FRONT.x)
    expect(draggedTo(FRONT, 0, -100).x).toBeGreaterThan(FRONT.x)
  })

  it('ma l’inclinazione si ferma: di taglio la carta sparisce', () => {
    // Senza il limite, un trascinamento verticale lungo porta la carta a 90 gradi e la fa
    // scomparire: `backface-visibility: hidden` nasconde una faccia che nessuno ha girato.
    expect(draggedTo(FRONT, 0, 10_000).x).toBeGreaterThanOrEqual(-28)
    expect(draggedTo(FRONT, 0, -10_000).x).toBeLessThanOrEqual(28)
  })

  it('parte sempre da dove la carta era, non da zero', () => {
    const back = restingAt('back')

    expect(draggedTo(back, 0, 0)).toEqual(back)
  })
})

describe('quale faccia si sta guardando', () => {
  it('è il fronte finché la carta non ha passato il quarto di giro', () => {
    expect(facing({ x: 0, y: 0 })).toBe('front')
    expect(facing({ x: 0, y: 89 })).toBe('front')
    expect(facing({ x: 0, y: -14 })).toBe('front')
  })

  it('ed è il retro dall’altra parte', () => {
    expect(facing({ x: 0, y: 180 })).toBe('back')
    expect(facing({ x: 0, y: 91 })).toBe('back')
  })

  it('anche girando all’indietro, dove il resto di JavaScript è negativo', () => {
    // `-200 % 360` fa `-200`, non `160`: con un modulo solo la carta trascinata a sinistra
    // mostrerebbe la faccia sbagliata, e sarebbe un difetto che si vede solo a mano.
    expect(facing({ x: 0, y: -180 })).toBe('back')
    expect(facing({ x: 0, y: -200 })).toBe('back')
    expect(facing({ x: 0, y: -370 })).toBe('front')
  })
})

describe('quando si lascia la carta', () => {
  it('un clic secco la gira, in entrambi i versi', () => {
    expect(releasedOn('front', FRONT, 0)).toBe('back')
    expect(releasedOn('back', restingAt('back'), 3)).toBe('front')
  })

  it('un trascinamento vero la lascia dalla parte in cui è stata portata', () => {
    expect(releasedOn('front', { x: 0, y: 170 }, 300)).toBe('back')
    expect(releasedOn('front', { x: 0, y: 30 }, 300)).toBe('front')
  })

  it('e si ferma in una delle due posizioni di riposo, mai a metà', () => {
    const settled = releasedOn('front', { x: 12, y: 170 }, 300)

    expect(restingAt(settled)).toEqual(restingAt('back'))
  })
})

describe('il transform', () => {
  it('porta i due assi in gradi, che è tutto ciò che il componente scrive', () => {
    expect(transformOf({ x: 6, y: -14 })).toBe('rotateX(6deg) rotateY(-14deg)')
  })
})
