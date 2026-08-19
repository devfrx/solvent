import { describe, expect, it } from 'vitest'

import { read, withoutComments } from '../helpers/sources'

/**
 * R02 · A01 — nel Registry non esiste un caso speciale per un sistema.
 *
 * Cinque liste parallele non nascono in un giorno: nasce prima una funzione che fa "una cosa in
 * più solo per questo sistema". Il primo `if` su un id è quel momento, ed è l'unico punto in cui
 * fermarsi costa poco. La definizione di fatto di D006 lo chiedeva come controllo a occhio: qui è
 * permanente, perché a occhio lo si guarda una volta sola.
 */

const SPECIAL_CASE = /\bid\s*[!=]==\s*['"`]|\bcase\s+['"`]/

const firstMatch = (code: string): string | null => SPECIAL_CASE.exec(code)?.[0] ?? null

describe('il Registry non ha casi speciali', () => {
  it('il rilevatore riconosce un ramo su un id e non un confronto qualunque', () => {
    expect(firstMatch("if (system.id === 'income') return")).toBe("id === '")
    expect(firstMatch("if (id !== 'income') return")).toBe("id !== '")
    expect(firstMatch("switch (system.id) { case 'income':")).toBe("case '")
    expect(firstMatch('if (existing.id === system.id) throw')).toBeNull()
    expect(firstMatch('if (system.save !== undefined) return')).toBeNull()
  })

  it('in Registry.ts non ce n è nessuno', () => {
    expect(firstMatch(withoutComments(read('src/core/kernel/Registry.ts')))).toBeNull()
  })
})
