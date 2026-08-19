import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'
import { POOL_IDS } from '@core/contracts/pools'
import type { SavePayload } from '@core/contracts/save'

import { createBus } from '@core/kernel/Bus'
import { createLedger, income, spend, transfer, UnbalancedSaveError } from '@core/kernel/Ledger'
import { createRegistry, defineSystem, ORDER } from '@core/kernel/Registry'
import { createRng } from '@core/kernel/Rng'

import { createSaveStore, type SaveStore } from '../../src/main/save/ipc'
import { createSaveFile, SAVE_FILE_NAME } from '../../src/main/save/SaveFile'

/**
 * Il giro completo che l'ADR 0004 chiama "la rete che impedisce a metà dei difetti di persistenza
 * di nascere": stato vero del kernel → busta → disco → busta → stato vero del kernel.
 *
 * Gli altri file di questa cartella provano il main con payload scritti a mano, ed è giusto: sono
 * i suoi casi limite. Questo prova l'altra metà, quella che nessun payload scritto a mano prende
 * — che lo schema accetti **ciò che il kernel produce davvero**. Uno schema corretto e un kernel
 * corretto che non si parlano sono due cose corrette e una partita persa.
 *
 * Lo stato di partenza è non banale apposta (docs/qualita.md): saldi con decimali su cinque conti
 * su sei, due stream dell'Rng avanzati di quantità diverse, un sistema con stato.
 */

interface UpgradeState {
  readonly level: number
  readonly bought: readonly string[]
}

const SAVED_AT = 1_755_600_000_000

let directory: string
let store: SaveStore

const buildState = (): SavePayload => {
  const ledger = createLedger(createBus())
  ledger.transaction(income('cash', fromString('1234.56')), { reason: 'reason.income.tick' })
  ledger.transaction(transfer('cash', 'card', fromString('400'), fromString('2.50')), {
    reason: 'reason.atm.deposit'
  })
  ledger.transaction(spend('card', fromString('100.25')), { reason: 'reason.income.upgrade' })

  const rng = createRng(-987_654)
  for (let draw = 0; draw < 5; draw += 1) rng.stream('income').next()
  rng.stream('atm').next()

  const registry = createRegistry()
  let state: UpgradeState = { level: 3, bought: ['desk', 'chair'] }
  registry.register(
    defineSystem<UpgradeState>({
      id: 'income',
      order: ORDER.INCOME,
      save: () => state,
      load: (loaded) => {
        state = loaded
      },
      reset: () => {
        state = { level: 0, bought: [] }
      }
    })
  )

  return { ledger: ledger.save(), rng: rng.save(), systems: registry.saveAll() }
}

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'solvent-kernel-'))
  store = createSaveStore(createSaveFile(directory), () => SAVED_AT)
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('dal kernel al disco e ritorno', () => {
  it('lo stato di partenza è non banale, altrimenti il giro non dimostra niente', () => {
    const payload = buildState()

    const moved = POOL_IDS.filter((pool) => payload.ledger.balances[pool] !== '0')
    expect(moved.length).toBeGreaterThanOrEqual(5)
    expect(payload.ledger.balances.cash).toContain('.')
    expect(Object.keys(payload.rng.cursors).length).toBe(2)
    expect(Object.keys(payload.systems)).toEqual(['income'])
  })

  it('lo schema accetta ciò che il kernel produce davvero', async () => {
    expect(await store.save(buildState())).toEqual({ ok: true, value: SAVED_AT })
  })

  it('i saldi tornano identici, decimali compresi', async () => {
    const payload = buildState()
    await store.save(payload)
    const loaded = await store.load()
    expect(loaded.ok && loaded.value.present).toBe(true)
    if (!loaded.ok || !loaded.value.present) return

    const ledger = createLedger(createBus())
    ledger.load(loaded.value.payload.ledger)

    for (const pool of POOL_IDS) {
      expect(toString(ledger.balance(pool))).toBe(payload.ledger.balances[pool])
    }
  })

  it('l’Rng riprende esattamente da dove era rimasto', async () => {
    const before = createRng(-987_654)
    for (let draw = 0; draw < 5; draw += 1) before.stream('income').next()
    before.stream('atm').next()
    const expected = [before.stream('income').next(), before.stream('atm').next()]

    await store.save(buildState())
    const loaded = await store.load()
    if (!loaded.ok || !loaded.value.present) throw new Error('il caricamento doveva riuscire')

    const after = createRng(0)
    after.load(loaded.value.payload.rng)

    expect([after.stream('income').next(), after.stream('atm').next()]).toEqual(expected)
  })

  it('lo stato del sistema torna al sistema che lo sa leggere', async () => {
    await store.save(buildState())
    const loaded = await store.load()
    if (!loaded.ok || !loaded.value.present) throw new Error('il caricamento doveva riuscire')

    let state: UpgradeState = { level: 0, bought: [] }
    const registry = createRegistry()
    registry.register(
      defineSystem<UpgradeState>({
        id: 'income',
        order: ORDER.INCOME,
        save: () => state,
        load: (incoming) => {
          state = incoming
        },
        reset: () => undefined
      })
    )

    const report = registry.loadAll(loaded.value.payload.systems)

    expect(report).toEqual({ ok: true, value: { ignored: [] } })
    expect(state).toEqual({ level: 3, bought: ['desk', 'chair'] })
  })
})

describe('la somma zero non è dello schema', () => {
  it('un file manomesso passa la forma e lo ferma il Ledger', async () => {
    const payload = buildState()
    const tampered = {
      ...payload,
      ledger: { balances: { ...payload.ledger.balances, cash: '99999.99' } }
    }
    await writeFile(
      join(directory, SAVE_FILE_NAME),
      JSON.stringify({ version: 1, savedAt: SAVED_AT, payload: tampered }),
      'utf8'
    )

    // Lo schema controlla la forma, e la forma è a posto: sei stringhe decimali.
    const loaded = await store.load()
    expect(loaded.ok).toBe(true)
    if (!loaded.ok || !loaded.value.present) return

    // L'invariante è del Ledger (INV-08), e il Ledger la fa valere quando carica.
    const { payload: accepted } = loaded.value
    expect(() => createLedger(createBus()).load(accepted.ledger)).toThrow(UnbalancedSaveError)
  })

  it('il file scritto dal main somma zero, perché ci somma il kernel', async () => {
    await store.save(buildState())

    const written = JSON.parse(await readFile(join(directory, SAVE_FILE_NAME), 'utf8')) as {
      payload: SavePayload
    }
    const total = POOL_IDS.map((pool) => fromString(written.payload.ledger.balances[pool])).reduce(
      (sum, amount) => sum.plus(amount)
    )

    expect(total.isZero()).toBe(true)
  })
})
