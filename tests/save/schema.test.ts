import { describe, expect, it } from 'vitest'

import { POOL_IDS } from '@core/contracts/pools'
import { SAVE_VERSION } from '@core/contracts/save'

import { parseEnvelope, parseHeader, parsePayload } from '../../src/main/save/schema'

/**
 * A08 — lo schema è eseguito, quindi qui gli si passa davanti roba sbagliata per davvero.
 *
 * Il test più importante del file è il primo: costruisce i saldi **da** `POOL_IDS` invece di
 * ricopiare i sei nomi. Lo schema non può importare quella costante (INV-03) e li ha scritti a
 * mano; questo è il punto in cui le due liste si guardano in faccia.
 */

const balancesOf = (value: string): Record<string, string> =>
  Object.fromEntries(POOL_IDS.map((pool) => [pool, value]))

const payloadWith = (balances: Record<string, unknown>): Record<string, unknown> => ({
  ledger: { balances },
  rng: { seed: -12, cursors: { income: 3 } },
  systems: {}
})

const VALID = payloadWith(balancesOf('0'))

describe('i saldi nel payload', () => {
  it('accetta esattamente i pool dichiarati dal contratto', () => {
    const parsed = parsePayload(VALID)
    expect(parsed.ok).toBe(true)
  })

  it('rifiuta una lista di saldi a cui manca un pool, e dice quale', () => {
    for (const missing of POOL_IDS) {
      const balances = balancesOf('0')
      delete balances[missing]

      const parsed = parsePayload(payloadWith(balances))
      expect(parsed.ok).toBe(false)
      if (parsed.ok) continue
      expect(parsed.error).toEqual({
        code: 'error.save.invalid',
        path: `payload.ledger.balances.${missing}`
      })
    }
  })

  it('rifiuta un settimo pool, e dice qual è', () => {
    const parsed = parsePayload(payloadWith({ ...balancesOf('0'), chips: '10' }))

    expect(parsed).toEqual({
      ok: false,
      error: { code: 'error.save.invalid', path: 'payload.ledger.balances.chips' }
    })
  })

  it('rifiuta un number dove il contratto vuole una stringa decimale (INV-04)', () => {
    const parsed = parsePayload(payloadWith({ ...balancesOf('0'), cash: 0 }))

    expect(parsed).toEqual({
      ok: false,
      error: { code: 'error.save.invalid', path: 'payload.ledger.balances.cash' }
    })
  })

  it('accetta le forme decimali che il denaro produce davvero', () => {
    for (const amount of ['0', '-0.5', '1234.56', '-9007199254740993.000001']) {
      expect(parsePayload(payloadWith(balancesOf(amount))).ok).toBe(true)
    }
  })

  it('rifiuta una stringa che non è un decimale', () => {
    // `Decimal` accetterebbe le prime tre e lancerebbe sull'ultima, cioè fuori da ogni `Result`.
    for (const amount of ['1e9', 'Infinity', 'NaN', 'prendi tutto', '', '01', '1.']) {
      expect(parsePayload(payloadWith(balancesOf(amount))).ok).toBe(false)
    }
  })
})

describe('lo stato dei sistemi', () => {
  it('attraversa lo schema senza essere guardato', () => {
    const systems = {
      income: { level: 2, upgrades: ['first'] },
      unknownSystem: { nested: { deep: [1, null, false] } }
    }

    const parsed = parsePayload({ ...VALID, systems })

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.systems).toEqual(systems)
  })

  it('ma deve essere una mappa, non un array', () => {
    expect(parsePayload({ ...VALID, systems: [] }).ok).toBe(false)
  })
})

describe('lo stato dell’Rng', () => {
  it('il seme è un intero, anche negativo', () => {
    expect(parsePayload({ ...VALID, rng: { seed: -2147483648, cursors: {} } }).ok).toBe(true)
    expect(parsePayload({ ...VALID, rng: { seed: 1.5, cursors: {} } }).ok).toBe(false)
  })

  it('un cursore non torna indietro né è frazionario', () => {
    expect(parsePayload({ ...VALID, rng: { seed: 1, cursors: { a: -1 } } }).ok).toBe(false)
    expect(parsePayload({ ...VALID, rng: { seed: 1, cursors: { a: 0.5 } } }).ok).toBe(false)
  })
})

describe('la busta', () => {
  it('non guarda dentro il payload: è il passo prima delle migrazioni', () => {
    const parsed = parseHeader({ version: 7, savedAt: 0, payload: { qualunque: 'cosa' } })

    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.value.version).toBe(7)
  })

  it('pretende comunque una versione intera e positiva', () => {
    for (const version of [0, -1, 1.5, '1']) {
      expect(parseHeader({ version, savedAt: 0, payload: {} })).toEqual({
        ok: false,
        error: { code: 'error.save.invalid', path: 'version' }
      })
    }
  })

  it('rifiuta un campo in più: la versione non filtra nel payload da un lato (A07)', () => {
    const parsed = parseHeader({ version: 1, savedAt: 0, payload: {}, meta: { version: 2 } })

    expect(parsed).toEqual({
      ok: false,
      error: { code: 'error.save.invalid', path: 'meta' }
    })
  })
})

describe('la busta completa, quella che si scrive', () => {
  it('accetta la busta corrente', () => {
    expect(parseEnvelope({ version: SAVE_VERSION, savedAt: 1, payload: VALID }).ok).toBe(true)
  })

  it('rifiuta la busta se il payload è sbagliato, e il percorso arriva dalla radice', () => {
    const broken = { ...VALID, ledger: { balances: { ...balancesOf('0'), card: 12 } } }

    expect(parseEnvelope({ version: SAVE_VERSION, savedAt: 1, payload: broken })).toEqual({
      ok: false,
      error: { code: 'error.save.invalid', path: 'payload.ledger.balances.card' }
    })
  })
})
