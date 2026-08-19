import { SAVE_VERSION, type LoadedSave, type SaveResult } from '@core/contracts/save'

import { migrate } from './migrations'
import type { SaveFile } from './SaveFile'
import { parseEnvelope, parseHeader, parsePayload } from './schema'

/**
 * Il salvataggio come operazione, e l'ordine esatto in cui le cose succedono
 * (docs/design/flusso-salvataggio.md). Sotto c'è il disco, sopra ci sono i canali IPC: qui in
 * mezzo non si sa né da dove arriva la richiesta né dove finiscono i byte.
 *
 * Non importa `electron`, nemmeno come tipo. È ciò che permette di provare caricamento e
 * salvataggio con file veri senza avviare Electron — l'unica forma in cui questi test verranno
 * eseguiti a ogni commit invece che una volta.
 */
export interface SaveStore {
  /** Il payload arriva dal renderer: è `unknown` finché lo schema non dice altro. */
  readonly save: (payload: unknown) => Promise<SaveResult<number>>
  readonly load: () => Promise<SaveResult<LoadedSave>>
  readonly reset: () => Promise<SaveResult<null>>
}

export const createSaveStore = (file: SaveFile, now: () => number = Date.now): SaveStore => ({
  /**
   * R08 — `version` e `savedAt` li scrive solo il main, qui e in nessun altro punto.
   *
   * Si scrive il valore **uscito** dallo schema, non quello entrato: strict rifiuta le chiavi di
   * troppo, quindi ciò che finisce sul disco è esattamente ciò che lo schema descrive.
   */
  save: async (payload) => {
    const validated = parseEnvelope({ version: SAVE_VERSION, savedAt: now(), payload })
    if (!validated.ok) return validated

    const written = await file.write(JSON.stringify(validated.value))
    return written.ok ? { ok: true, value: validated.value.savedAt } : written
  },

  load: async () => {
    const contents = await file.read()
    if (!contents.ok) return contents
    if (!contents.value.present) return { ok: true, value: { present: false } }

    let raw: unknown
    try {
      raw = JSON.parse(contents.value.text)
    } catch {
      // Il file resta dov'è: un salvataggio illeggibile è ancora l'unica copia che il giocatore
      // ha, e cancellarlo qui toglierebbe l'unica possibilità di recuperarlo a mano.
      return { ok: false, error: { code: 'error.save.corrupt' } }
    }

    const header = parseHeader(raw)
    if (!header.ok) return header

    // Un salvataggio più nuovo del programma non si migra all'indietro e non si apre a forza:
    // è il caso che si presenta al primo giocatore che riapre una build vecchia.
    if (header.value.version > SAVE_VERSION) {
      return {
        ok: false,
        error: {
          code: 'error.save.version_ahead',
          found: header.value.version,
          supported: SAVE_VERSION
        }
      }
    }

    const migrated = migrate(header.value, SAVE_VERSION)
    if (!migrated.ok) return migrated

    const payload = parsePayload(migrated.value.payload)
    if (!payload.ok) return payload

    return { ok: true, value: { present: true, payload: payload.value } }
  },

  /**
   * Il reset del main cancella il file, e basta. L'ambito `soft`/`hard` è del renderer, che passa
   * dal Registry: `ResetScope` vive in `contracts/lifecycle.ts`, che INV-03 non concede a qui.
   * Sono due operazioni con lo stesso nome, e un prestige chiama solo la prima.
   */
  reset: () => file.remove()
})
