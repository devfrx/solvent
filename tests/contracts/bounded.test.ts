import { describe, expect, it } from 'vitest'

import { boundedList, pushBounded } from '@core/contracts/bounded'

/**
 * R09 · ADR 0010 — una lista storica nasce già con il suo limite.
 *
 * Il difetto A10 erano due history senza tetto dentro il salvataggio: il file cresceva finché il
 * giocatore giocava, e il limite era previsto "quando servirà", cioè mai.
 */
describe('boundedList', () => {
  it('oltre il max scarta l’elemento più vecchio', () => {
    let list = boundedList<number>(3)
    for (const n of [1, 2, 3, 4, 5]) list = pushBounded(list, n)

    expect(list.items).toEqual([3, 4, 5])
    expect(list.max).toBe(3)
  })

  it('sotto il max tiene tutto, in ordine di inserimento', () => {
    const list = pushBounded(pushBounded(boundedList<string>(10), 'a'), 'b')
    expect(list.items).toEqual(['a', 'b'])
  })

  it('pushBounded non tocca la lista che riceve', () => {
    const before = pushBounded(boundedList<number>(2), 1)
    const after = pushBounded(before, 2)

    expect(before.items).toEqual([1])
    expect(after.items).toEqual([1, 2])
  })

  it('senza max non compila, e a runtime rifiuta', () => {
    expect(() =>
      // @ts-expect-error — R09: `max` è obbligatorio, non esiste una firma senza (ADR 0010)
      boundedList<number>()
    ).toThrow(RangeError)
  })

  it('un max che non è un intero positivo è un errore del programmatore', () => {
    expect(() => boundedList<number>(0)).toThrow(RangeError)
    expect(() => boundedList<number>(-1)).toThrow(RangeError)
    expect(() => boundedList<number>(2.5)).toThrow(RangeError)
  })
})
