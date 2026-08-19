import { describe, expect, it } from 'vitest'

import { leggi, senzaCommenti } from '../helpers/sorgenti'

/**
 * R02 · A01 — nel Registry non esiste un caso speciale per un sistema.
 *
 * Cinque liste parallele non nascono in un giorno: nasce prima una funzione che fa "una cosa in
 * più solo per questo sistema". Il primo `if` su un id è quel momento, ed è l'unico punto in cui
 * fermarsi costa poco. La definizione di fatto di D006 lo chiedeva come controllo a occhio: qui è
 * permanente, perché a occhio lo si guarda una volta sola.
 */

const CASO_SPECIALE = /\bid\s*[!=]==\s*['"`]|\bcase\s+['"`]/

const primaOccorrenza = (codice: string): string | null => CASO_SPECIALE.exec(codice)?.[0] ?? null

describe('il Registry non ha casi speciali', () => {
  it('il rilevatore riconosce un ramo su un id e non un confronto qualunque', () => {
    expect(primaOccorrenza("if (system.id === 'income') return")).toBe("id === '")
    expect(primaOccorrenza("if (id !== 'income') return")).toBe("id !== '")
    expect(primaOccorrenza("switch (system.id) { case 'income':")).toBe("case '")
    expect(primaOccorrenza('if (registrato.id === system.id) throw')).toBeNull()
    expect(primaOccorrenza('if (system.save !== undefined) return')).toBeNull()
  })

  it('in Registry.ts non ce n è nessuno', () => {
    expect(primaOccorrenza(senzaCommenti(leggi('src/core/kernel/Registry.ts')))).toBeNull()
  })
})
