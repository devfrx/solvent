import { describe, expect, it } from 'vitest'

import { SAVE_VERSION, type SaveEnvelope, type SavePayload } from '@core/contracts/save'

/**
 * R08 · ADR 0004 — il contratto di salvataggio appartiene al main.
 *
 * Il difetto A07 era `version: 3` scritto a mano nel renderer. Qui non è vietato: è impossibile,
 * perché il tipo non ha quel campo. I test `@ts-expect-error` sono la prova che il tipo funziona
 * davvero — falliscono se l'errore di compilazione non c'è.
 */
const BALANCES = { cash: '0', card: '0', world: '0', sink: '0', fees: '0', house: '0' }

describe('SavePayload', () => {
  it('non ha un campo versione', () => {
    const payload: SavePayload = {
      ledger: { balances: BALANCES },
      rng: { seed: 1, cursors: {} },
      systems: {},
      // @ts-expect-error — R08: la versione la scrive il main, il renderer non ha dove metterla
      version: 1
    }
    expect(payload.rng.seed).toBe(1)
  })

  it('non ha un campo versione nemmeno annidato', () => {
    const payload: SavePayload = {
      ledger: {
        balances: BALANCES,
        // @ts-expect-error — R08: nemmeno di lato, nemmeno "per comodità di debug" (ADR 0004)
        version: 1
      },
      rng: { seed: 1, cursors: {} },
      systems: {}
    }
    expect(payload.ledger.balances.cash).toBe('0')
  })

  it('oltre il confine il denaro è una stringa decimale', () => {
    const payload: SavePayload = {
      ledger: {
        balances: {
          ...BALANCES,
          // @ts-expect-error — INV-04: mai un number, o la precisione si perde al round-trip
          cash: 0
        }
      },
      rng: { seed: 1, cursors: {} },
      systems: {}
    }
    expect(payload.ledger.balances.card).toBe('0')
  })

  it('lo stato dei sistemi è opaco: il Registry lo consegna a chi lo sa leggere', () => {
    const payload: SavePayload = {
      ledger: { balances: BALANCES },
      rng: { seed: 7, cursors: { income: 3 } },
      systems: { income: { level: 2 }, unknownSystem: { anything: true } }
    }
    expect(Object.keys(payload.systems)).toEqual(['income', 'unknownSystem'])
  })
})

describe('SaveEnvelope', () => {
  it('la versione e l’istante vivono nella busta, che costruisce solo il main', () => {
    const envelope: SaveEnvelope = {
      version: SAVE_VERSION,
      savedAt: 1_755_600_000_000,
      payload: { ledger: { balances: BALANCES }, rng: { seed: 1, cursors: {} }, systems: {} }
    }
    expect(envelope.version).toBe(1)
  })

  it('la versione 1 non ha nulla da cui migrare', () => {
    expect(SAVE_VERSION).toBe(1)
  })
})
