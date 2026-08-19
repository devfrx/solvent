import { describe, expect, it } from 'vitest'

import { read, withoutComments } from '../helpers/sources'

/**
 * INV-15 · ADR 0016 — il Bus è sincrono.
 *
 * Che `emit` ritorni `void` non basta: un `queueMicrotask` dentro l'iterazione rispetterebbe la
 * firma e romperebbe il determinismo dell'ordine dentro un tick — e con esso metà del valore del
 * seed fisso dell'ADR 0005. La firma è un tipo; questo è il meccanismo.
 */

const ASYNC_MARKERS =
  /\b(?:async|await|Promise|queueMicrotask|setTimeout|setInterval|setImmediate|requestAnimationFrame)\b/

const firstMatch = (code: string): string | null => ASYNC_MARKERS.exec(code)?.[0] ?? null

describe('il Bus è sincrono', () => {
  it('il rilevatore guarda il codice, non i commenti', () => {
    expect(firstMatch(withoutComments('// niente Promise qui\nconst x = 1'))).toBeNull()
    expect(firstMatch(withoutComments('/* niente await */\nconst x = 1'))).toBeNull()
    expect(firstMatch(withoutComments('queueMicrotask(() => {})'))).toBe('queueMicrotask')
  })

  it('in Bus.ts non c è niente di asincrono', () => {
    expect(firstMatch(withoutComments(read('src/core/kernel/Bus.ts')))).toBeNull()
  })
})
