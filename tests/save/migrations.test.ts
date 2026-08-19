import { describe, expect, it } from 'vitest'

import { SAVE_VERSION } from '@core/contracts/save'

import { MIGRATIONS, migrate, type Migration } from '../../src/main/save/migrations'

/**
 * La catena delle migrazioni, provata con migrazioni finte e passi veri.
 *
 * La mappa vera è vuota e resta vuota fino alla versione 2 (registro YAGNI). Provare il runner
 * solo con lei significherebbe non provarlo: la prima volta che qualcuno scrive una migrazione
 * scoprirebbe insieme se la migrazione è giusta e se il meccanismo che la applica funziona.
 */

const envelope = (
  version: number,
  payload: unknown
): { version: number; savedAt: number; payload: unknown } => ({
  version,
  savedAt: 1_755_600_000_000,
  payload
})

/** Una migrazione che lascia una traccia, così l'ordine di applicazione si vede nel risultato. */
const step =
  (mark: string): Migration =>
  (payload) =>
    `${String(payload)}>${mark}`

describe('la mappa vera', () => {
  it('è vuota: la versione 1 non ha nulla da cui migrare', () => {
    expect(SAVE_VERSION).toBe(1)
    expect(MIGRATIONS.size).toBe(0)
  })

  it('copre ogni versione sotto quella corrente, oggi e quando ce ne sarà più di una', () => {
    const uncovered = []
    for (let version = 1; version < SAVE_VERSION; version += 1) {
      if (!MIGRATIONS.has(version)) uncovered.push(version)
    }
    expect(uncovered).toEqual([])
  })
})

describe('il runner', () => {
  it('applica i passi in ordine, uno alla volta', () => {
    const migrations = new Map([
      [1, step('a')],
      [2, step('b')],
      [3, step('c')]
    ])

    const migrated = migrate(envelope(1, 'base'), 4, migrations)

    expect(migrated).toEqual({
      ok: true,
      value: { version: 4, savedAt: 1_755_600_000_000, payload: 'base>a>b>c' }
    })
  })

  it('parte dalla versione della busta, non dalla prima della mappa', () => {
    const migrations = new Map([
      [1, step('a')],
      [2, step('b')]
    ])

    const migrated = migrate(envelope(2, 'base'), 3, migrations)

    expect(migrated.ok && migrated.value.payload).toBe('base>b')
  })

  it('non tocca niente se la busta è già alla versione corrente', () => {
    const migrated = migrate(envelope(4, 'base'), 4, new Map())

    expect(migrated).toEqual({
      ok: true,
      value: { version: 4, savedAt: 1_755_600_000_000, payload: 'base' }
    })
  })

  it('una migrazione non può sbagliare la versione: non è lei a scriverla', () => {
    // La firma prende un payload e ritorna un payload. Il salto di versione è del runner, quindi
    // "mai due salti in una funzione" non è una regola da ricordare.
    const migrations = new Map([[1, (): unknown => 'nuovo']])

    const migrated = migrate(envelope(1, 'vecchio'), 2, migrations)

    expect(migrated.ok && migrated.value.version).toBe(2)
  })

  it('conserva l’istante del salvataggio: non è una migrazione a decidere quando fu salvato', () => {
    const migrated = migrate(envelope(1, 'base'), 2, new Map([[1, step('a')]]))

    expect(migrated.ok && migrated.value.savedAt).toBe(1_755_600_000_000)
  })

  it('un passo mancante è un file che questa build non sa portare avanti', () => {
    const migrations = new Map([[1, step('a')]])

    const migrated = migrate(envelope(1, 'base'), 3, migrations)

    expect(migrated).toEqual({
      ok: false,
      error: { code: 'error.save.invalid', path: 'version' }
    })
  })
})
