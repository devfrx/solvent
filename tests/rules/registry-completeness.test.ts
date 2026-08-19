import { existsSync } from 'node:fs'
import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles } from '../helpers/sources'

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
const REGISTRATION = /\.register\(/g
const DOMAIN_SYSTEM = /^src\/core\/domains\/[^/]+\/system\.ts$/

/** `sourceFiles` usa i separatori del sistema: qui i percorsi si confrontano in una forma sola. */
const normalize = (path: string): string => path.split(sep).join('/')

const systems = sourceFiles('src/core/domains')
  .map(normalize)
  .filter((path) => DOMAIN_SYSTEM.test(path))

const registrations = existsSync(BOOTSTRAP) ? (read(BOOTSTRAP).match(REGISTRATION) ?? []).length : 0

describe('ogni sistema di dominio è registrato, e una volta sola', () => {
  it('il rilevatore conta le registrazioni e riconosce una cartella di dominio', () => {
    expect('registry.register(income)\nregistry.register(atm)'.match(REGISTRATION)).toHaveLength(2)
    expect('const n = registrare(1)'.match(REGISTRATION)).toBeNull()

    expect(DOMAIN_SYSTEM.test('src/core/domains/income/system.ts')).toBe(true)
    expect(DOMAIN_SYSTEM.test('src/core/domains/income/rules.ts')).toBe(false)
    expect(DOMAIN_SYSTEM.test('src/core/kernel/Registry.ts')).toBe(false)
  })

  it(
    systems.length === 0 && !existsSync(BOOTSTRAP)
      ? 'nessun dominio e nessun bootstrap: zero a zero, ed è corretto'
      : `${systems.length} sistemi di dominio contro ${registrations} registrazioni in ${BOOTSTRAP}`,
    () => {
      expect(registrations).toBe(systems.length)
    }
  )
})
