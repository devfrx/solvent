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
 * **Finché il bootstrap non esiste, non c'è dove mettere quella riga.** Il grafo delle deleghe
 * mette [D010](../../docs/delega/D010-dominio-income.md) e
 * [D014](../../docs/delega/D014-dominio-bancomat.md) — i due domini — **prima** di
 * [D011](../../docs/delega/D011-runtime-e-store.md), che scrive `createGame.ts`: c'è una finestra
 * in cui i sistemi esistono e il bootstrap no. Il verdetto la riconosce e la dichiara, come
 * `gates.test.ts` fa con `typecheck:web`; dal giorno in cui il file nasce, il confronto è secco.
 */

const BOOTSTRAP = 'src/renderer/runtime/createGame.ts'
const REGISTRATION = /\.register\(/g
const DOMAIN_SYSTEM = /^src\/core\/domains\/[^/]+\/system\.ts$/

/** `sourceFiles` usa i separatori del sistema: qui i percorsi si confrontano in una forma sola. */
const normalize = (path: string): string => path.split(sep).join('/')

/**
 * Il verdetto è una funzione pura di tre numeri, e non della cartella: è ciò che permette di
 * provarlo su tutti e quattro i casi, compreso quello che oggi non si presenta. Un confronto
 * scritto direttamente dentro `it` si può provare solo nello stato in cui il repo si trova.
 */
type Verdict =
  | { readonly kind: 'waiting'; readonly systems: number }
  | { readonly kind: 'matched' }
  | { readonly kind: 'mismatch'; readonly systems: number; readonly registrations: number }

export const verdictOf = (
  systems: number,
  registrations: number,
  hasBootstrap: boolean
): Verdict => {
  if (!hasBootstrap) return { kind: 'waiting', systems }
  if (systems === registrations) return { kind: 'matched' }
  return { kind: 'mismatch', systems, registrations }
}

const systems = sourceFiles('src/core/domains')
  .map(normalize)
  .filter((path) => DOMAIN_SYSTEM.test(path))

const hasBootstrap = existsSync(BOOTSTRAP)
const registrations = hasBootstrap ? (read(BOOTSTRAP).match(REGISTRATION) ?? []).length : 0
const verdict = verdictOf(systems.length, registrations, hasBootstrap)

describe('ogni sistema di dominio è registrato, e una volta sola', () => {
  it('il rilevatore conta le registrazioni e riconosce una cartella di dominio', () => {
    expect('registry.register(income)\nregistry.register(atm)'.match(REGISTRATION)).toHaveLength(2)
    expect('const n = registrare(1)'.match(REGISTRATION)).toBeNull()

    expect(DOMAIN_SYSTEM.test('src/core/domains/income/system.ts')).toBe(true)
    expect(DOMAIN_SYSTEM.test('src/core/domains/income/rules.ts')).toBe(false)
    expect(DOMAIN_SYSTEM.test('src/core/kernel/Registry.ts')).toBe(false)
  })

  it('il verdetto distingue i quattro casi, compresi i due che oggi non si presentano', () => {
    expect(verdictOf(0, 0, false)).toEqual({ kind: 'waiting', systems: 0 })
    expect(verdictOf(2, 0, false)).toEqual({ kind: 'waiting', systems: 2 })
    expect(verdictOf(2, 2, true)).toEqual({ kind: 'matched' })
    expect(verdictOf(2, 1, true)).toEqual({ kind: 'mismatch', systems: 2, registrations: 1 })
  })

  it(
    verdict.kind === 'waiting'
      ? `${verdict.systems} sistemi aspettano il bootstrap: ${BOOTSTRAP} nasce con D011`
      : `${systems.length} sistemi di dominio contro ${registrations} registrazioni in ${BOOTSTRAP}`,
    () => {
      expect(verdict.kind).not.toBe('mismatch')
    }
  )
})
