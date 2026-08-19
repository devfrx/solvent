import { existsSync } from 'node:fs'
import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { fileSorgente, leggi } from '../helpers/sorgenti'

/**
 * R02 · INV-05 · ADR 0002 — aggiungere un sistema è una cartella più **una** riga nel bootstrap.
 *
 * La riga nel bootstrap è il prezzo che l'ADR 0002 accetta per avere un ordine dichiarato invece
 * che deciso dal bundler. Il prezzo si paga una volta sola se qualcuno se ne accorge: questo test
 * conta le cartelle di dominio e le registrazioni, e pretende che coincidano.
 *
 * Vale già adesso che il conto è zero a zero, come `gates.test.ts` per `typecheck:web`: il
 * controllo entra in funzione da solo il giorno in cui nasce il primo sistema, senza che nessuno
 * debba ricordarsene — che è il sostituto meccanico del `TODO` vietato dall'ADR 0014.
 */

const BOOTSTRAP = 'src/renderer/runtime/createGame.ts'
const REGISTRAZIONE = /\.register\(/g
const SISTEMA_DI_DOMINIO = /^src\/core\/domains\/[^/]+\/system\.ts$/

/** `fileSorgente` usa i separatori del sistema: qui i percorsi si confrontano in una forma sola. */
const normalizza = (percorso: string): string => percorso.split(sep).join('/')

const sistemi = fileSorgente('src/core/domains')
  .map(normalizza)
  .filter((percorso) => SISTEMA_DI_DOMINIO.test(percorso))

const registrazioni = existsSync(BOOTSTRAP)
  ? (leggi(BOOTSTRAP).match(REGISTRAZIONE) ?? []).length
  : 0

describe('ogni sistema di dominio è registrato, e una volta sola', () => {
  it('il rilevatore conta le registrazioni e riconosce una cartella di dominio', () => {
    expect('registry.register(income)\nregistry.register(atm)'.match(REGISTRAZIONE)).toHaveLength(2)
    expect('const n = registrare(1)'.match(REGISTRAZIONE)).toBeNull()

    expect(SISTEMA_DI_DOMINIO.test('src/core/domains/income/system.ts')).toBe(true)
    expect(SISTEMA_DI_DOMINIO.test('src/core/domains/income/rules.ts')).toBe(false)
    expect(SISTEMA_DI_DOMINIO.test('src/core/kernel/Registry.ts')).toBe(false)
  })

  it(
    sistemi.length === 0 && !existsSync(BOOTSTRAP)
      ? 'nessun dominio e nessun bootstrap: zero a zero, ed è corretto'
      : `${sistemi.length} sistemi di dominio contro ${registrazioni} registrazioni in ${BOOTSTRAP}`,
    () => {
      expect(registrazioni).toBe(sistemi.length)
    }
  )
})
