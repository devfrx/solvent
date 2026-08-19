import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { fileSorgente, leggi } from '../helpers/sorgenti'

/**
 * A04 · R04 — `TICKS_PER_SECOND` è definito in un posto solo.
 *
 * La definizione di fatto di D003 chiedeva un `grep`. Un grep fatto una volta non protegge niente:
 * qui la verifica è permanente, come per le regole di lint. La seconda definizione nascerebbe il
 * giorno in cui a qualcuno serve "un secondo" dentro un sistema — ed è esattamente il difetto.
 */

const DEFINIZIONE = /\bTICKS_PER_SECOND\s*=/

/** `fileSorgente` usa i separatori del sistema: qui i percorsi si confrontano in una forma sola. */
const normalizza = (percorso: string): string => percorso.split(sep).join('/')

const sorgenti = fileSorgente('src')

describe('il tick rate', () => {
  it('il rilevatore riconosce una definizione e non un uso', () => {
    expect(DEFINIZIONE.test('export const TICKS_PER_SECOND = 10')).toBe(true)
    expect(DEFINIZIONE.test('const n = x * TICKS_PER_SECOND')).toBe(false)
  })

  it('è definito una volta sola, e in Clock.ts', () => {
    const definizioni = sorgenti.filter((f) => DEFINIZIONE.test(leggi(f))).map(normalizza)
    expect(definizioni).toEqual(['src/core/kernel/Clock.ts'])
  })
})
