import { describe, expect, it } from 'vitest'

import { fileSorgente, leggi } from '../helpers/sorgenti'

/**
 * P01 — nel codice non esistono marcatori di lavoro non finito (ADR 0014).
 *
 * Ciò che manca vive in docs/roadmap-fette.md, dove si vede senza aprire quel file. Un marcatore
 * sepolto in un sorgente è una scorciatoia mascherata.
 */

const MARCATORE = /\b(TODO|FIXME|XXX|HACK)\b/

const sorgenti = fileSorgente('src')

describe('nessun marcatore di lavoro non finito', () => {
  it('il rilevatore funziona', () => {
    expect(MARCATORE.test('// TODO: sistemare')).toBe(true)
    expect(MARCATORE.test('// FIXME')).toBe(true)
    expect(MARCATORE.test('const todoList = []')).toBe(false)
  })

  it('src/ non contiene marcatori', () => {
    const colpevoli = sorgenti.filter((f) => MARCATORE.test(leggi(f)))
    expect(colpevoli).toEqual([])
  })
})
