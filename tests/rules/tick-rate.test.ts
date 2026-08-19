import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles } from '../helpers/sources'

/**
 * A04 · R04 — `TICKS_PER_SECOND` è definito in un posto solo.
 *
 * La definizione di fatto di D003 chiedeva un `grep`. Un grep fatto una volta non protegge niente:
 * qui la verifica è permanente, come per le regole di lint. La seconda definizione nascerebbe il
 * giorno in cui a qualcuno serve "un secondo" dentro un sistema — ed è esattamente il difetto.
 */

const DEFINITION = /\bTICKS_PER_SECOND\s*=/

/** `sourceFiles` usa i separatori del sistema: qui i percorsi si confrontano in una forma sola. */
const normalize = (path: string): string => path.split(sep).join('/')

const sources = sourceFiles('src')

describe('il tick rate', () => {
  it('il rilevatore riconosce una definizione e non un uso', () => {
    expect(DEFINITION.test('export const TICKS_PER_SECOND = 10')).toBe(true)
    expect(DEFINITION.test('const n = x * TICKS_PER_SECOND')).toBe(false)
  })

  it('è definito una volta sola, e in Clock.ts', () => {
    const definitions = sources.filter((f) => DEFINITION.test(read(f))).map(normalize)
    expect(definitions).toEqual(['src/core/kernel/Clock.ts'])
  })
})
