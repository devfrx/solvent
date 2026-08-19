import { describe, expect, it } from 'vitest'

import { read, sourceFiles } from '../helpers/sources'

/**
 * P01 — nel codice non esistono marcatori di lavoro non finito (ADR 0014).
 *
 * Ciò che manca vive in docs/roadmap-fette.md, dove si vede senza aprire quel file. Un marcatore
 * sepolto in un sorgente è una scorciatoia mascherata.
 */

const MARKER = /\b(TODO|FIXME|XXX|HACK)\b/

const sources = sourceFiles('src')

describe('nessun marcatore di lavoro non finito', () => {
  it('il rilevatore funziona', () => {
    expect(MARKER.test('// TODO: sistemare')).toBe(true)
    expect(MARKER.test('// FIXME')).toBe(true)
    expect(MARKER.test('const todoList = []')).toBe(false)
  })

  it('src/ non contiene marcatori', () => {
    const offenders = sources.filter((f) => MARKER.test(read(f)))
    expect(offenders).toEqual([])
  })
})
