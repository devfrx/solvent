import { describe, expect, it } from 'vitest'

import { leggi } from '../helpers/sorgenti'

/**
 * INV-15 · ADR 0016 — il Bus è sincrono.
 *
 * Che `emit` ritorni `void` non basta: un `queueMicrotask` dentro l'iterazione rispetterebbe la
 * firma e romperebbe il determinismo dell'ordine dentro un tick — e con esso metà del valore del
 * seed fisso dell'ADR 0005. La firma è un tipo; questo è il meccanismo.
 */

const ASINCRONIA =
  /\b(?:async|await|Promise|queueMicrotask|setTimeout|setInterval|setImmediate|requestAnimationFrame)\b/

/** Un commento che spiega perché l'asincronia è vietata la nomina senza usarla. */
const senzaCommenti = (sorgente: string): string =>
  sorgente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

const primaOccorrenza = (codice: string): string | null => ASINCRONIA.exec(codice)?.[0] ?? null

describe('il Bus è sincrono', () => {
  it('il rilevatore guarda il codice, non i commenti', () => {
    expect(primaOccorrenza(senzaCommenti('// niente Promise qui\nconst x = 1'))).toBeNull()
    expect(primaOccorrenza(senzaCommenti('/* niente await */\nconst x = 1'))).toBeNull()
    expect(primaOccorrenza(senzaCommenti('queueMicrotask(() => {})'))).toBe('queueMicrotask')
  })

  it('in Bus.ts non c è niente di asincrono', () => {
    expect(primaOccorrenza(senzaCommenti(leggi('src/core/kernel/Bus.ts')))).toBeNull()
  })
})
