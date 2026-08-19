import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { POOL_IDS } from '@core/contracts/pools'
import { SAVE_VERSION, type SavePayload } from '@core/contracts/save'

import { createSaveFile, SAVE_FILE_NAME } from '../../src/main/save/SaveFile'
import { createSaveStore, type SaveStore } from '../../src/main/save/SaveStore'

/**
 * Il confine intero, su file veri: costruisci → salva → ricarica → confronta.
 *
 * Niente mock di `node:fs`. Le tre cose che questo file deve provare — che una scrittura non
 * valida non tocca il disco, che un file illeggibile non viene cancellato, che il temporaneo non
 * sopravvive — sono tutte proprietà del filesystem, e un filesystem finto le concede per
 * costruzione invece di verificarle.
 */

const balances = Object.fromEntries(
  POOL_IDS.map((pool) => [pool, '0'])
) as SavePayload['ledger']['balances']

const PAYLOAD: SavePayload = {
  ledger: { balances: { ...balances, cash: '1200.50', world: '-1200.50' } },
  rng: { seed: -12345, cursors: { income: 7 } },
  systems: { income: { level: 2 }, unknownSystem: { nested: [1, 'due', null] } }
}

const SAVED_AT = 1_755_600_000_000

let directory: string
let store: SaveStore
let path: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'solvent-save-'))
  path = join(directory, SAVE_FILE_NAME)
  store = createSaveStore(createSaveFile(directory), () => SAVED_AT)
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('il giro completo', () => {
  it('una busta valida viene scritta e riletta identica', async () => {
    const saved = await store.save(PAYLOAD)
    expect(saved).toEqual({ ok: true, value: SAVED_AT })

    const loaded = await store.load()
    expect(loaded).toEqual({ ok: true, value: { present: true, payload: PAYLOAD } })
  })

  it('la versione e l’istante li scrive il main, e stanno solo nella busta (R08)', async () => {
    await store.save(PAYLOAD)

    const written: unknown = JSON.parse(await readFile(path, 'utf8'))

    expect(written).toEqual({ version: SAVE_VERSION, savedAt: SAVED_AT, payload: PAYLOAD })
  })

  it('lo stato di un sistema sconosciuto torna indietro com’era', async () => {
    await store.save(PAYLOAD)
    const loaded = await store.load()

    expect(loaded.ok && loaded.value.present && loaded.value.payload.systems).toEqual(
      PAYLOAD.systems
    )
  })

  it('il temporaneo non sopravvive a una scrittura riuscita', async () => {
    await store.save(PAYLOAD)

    expect(await readdir(directory)).toEqual([SAVE_FILE_NAME])
  })

  it('un temporaneo rimasto da un crollo precedente non blocca il salvataggio dopo', async () => {
    await writeFile(`${path}.tmp`, 'meta scrittura di ieri', 'utf8')

    expect(await store.save(PAYLOAD)).toEqual({ ok: true, value: SAVED_AT })
    expect(await readdir(directory)).toEqual([SAVE_FILE_NAME])
  })

  it('la scrittura passa davvero da un temporaneo', async () => {
    // Occupare il nome del temporaneo con una cartella rende impossibile aprirlo. Se qualcuno
    // togliesse il passaggio intermedio e scrivesse dritto sul file reale, questo salvataggio
    // riuscirebbe — ed è l'unico modo di accorgersene senza staccare la corrente.
    await mkdir(`${path}.tmp`)

    const saved = await store.save(PAYLOAD)

    expect(saved.ok).toBe(false)
    expect(saved.ok || saved.error.code).toBe('error.save.io')
    expect(await readdir(directory)).toEqual([`${SAVE_FILE_NAME}.tmp`])
  })
})

describe('il file assente', () => {
  it('non è un errore: è una partita nuova', async () => {
    expect(await store.load()).toEqual({ ok: true, value: { present: false } })
  })

  it('e cancellarlo è comunque ok', async () => {
    expect(await store.reset()).toEqual({ ok: true, value: null })
  })
})

describe('quando qualcosa non va, il file precedente resta dov’è', () => {
  it('un payload non valido non viene scritto, e l’errore dice quale campo', async () => {
    await store.save(PAYLOAD)
    const before = await readFile(path, 'utf8')

    const broken = { ...PAYLOAD, ledger: { balances: { ...PAYLOAD.ledger.balances, cash: 999 } } }
    const saved = await store.save(broken)

    expect(saved).toEqual({
      ok: false,
      error: { code: 'error.save.invalid', path: 'payload.ledger.balances.cash' }
    })
    expect(await readFile(path, 'utf8')).toBe(before)
    expect(await readdir(directory)).toEqual([SAVE_FILE_NAME])
  })

  it('un payload senza uno dei sei conti non viene scritto', async () => {
    const { house: _house, ...five } = PAYLOAD.ledger.balances
    const saved = await store.save({ ...PAYLOAD, ledger: { balances: five } })

    expect(saved).toEqual({
      ok: false,
      error: { code: 'error.save.invalid', path: 'payload.ledger.balances.house' }
    })
    expect(await readdir(directory)).toEqual([])
  })

  it('un JSON illeggibile è corrupt, e il file non viene toccato', async () => {
    await writeFile(path, '{ questo non è json', 'utf8')

    expect(await store.load()).toEqual({ ok: false, error: { code: 'error.save.corrupt' } })
    expect(await readFile(path, 'utf8')).toBe('{ questo non è json')
  })

  it('una busta valida con un payload rotto è invalid, e il file non viene toccato', async () => {
    const tampered = JSON.stringify({
      version: SAVE_VERSION,
      savedAt: SAVED_AT,
      payload: { ...PAYLOAD, rng: { seed: 1, cursors: { income: -3 } } }
    })
    await writeFile(path, tampered, 'utf8')

    expect(await store.load()).toEqual({
      ok: false,
      error: { code: 'error.save.invalid', path: 'payload.rng.cursors.income' }
    })
    expect(await readFile(path, 'utf8')).toBe(tampered)
  })

  it('una lettura impossibile è un errore di I/O col messaggio, non con l’Error', async () => {
    const missing = createSaveStore(createSaveFile(join(directory, 'nessuna-cartella')))

    const saved = await missing.save(PAYLOAD)

    expect(saved.ok).toBe(false)
    if (saved.ok) return
    expect(saved.error.code).toBe('error.save.io')
    expect(saved.error).toHaveProperty('cause', expect.stringContaining('ENOENT'))
  })
})

describe('una versione più nuova del programma', () => {
  it('viene rifiutata invece di essere aperta a forza', async () => {
    const future = SAVE_VERSION + 1
    await writeFile(
      path,
      JSON.stringify({ version: future, savedAt: SAVED_AT, payload: PAYLOAD }),
      'utf8'
    )

    expect(await store.load()).toEqual({
      ok: false,
      error: { code: 'error.save.version_ahead', found: future, supported: SAVE_VERSION }
    })
  })
})

describe('il reset del main', () => {
  it('cancella il file, e dopo il caricamento è una partita nuova', async () => {
    await store.save(PAYLOAD)

    expect(await store.reset()).toEqual({ ok: true, value: null })
    expect(await readdir(directory)).toEqual([])
    expect(await store.load()).toEqual({ ok: true, value: { present: false } })
  })

  it('due volte di fila resta ok', async () => {
    await store.save(PAYLOAD)

    expect(await store.reset()).toEqual({ ok: true, value: null })
    expect(await store.reset()).toEqual({ ok: true, value: null })
  })
})
