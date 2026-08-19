import { open, readFile, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'

import type { SaveResult } from '@core/contracts/save'

/**
 * Il salvataggio sul disco, e nient'altro: qui non si sa cosa contenga il file.
 *
 * La cartella arriva per parametro invece di venire da `app.getPath('userData')` letta qui
 * dentro. Non è astrazione gratis: è ciò che permette ai test di scrivere davvero su disco, in
 * una cartella temporanea, invece di simulare `node:fs` — e un test che simula il filesystem non
 * dice niente su `fsync` e `rename`, che sono esattamente le due cose che questo file deve fare
 * bene.
 */

/** R10 — l'assenza del file è un esito, non un `null` da indovinare. */
export type FileContents =
  { readonly present: false } | { readonly present: true; readonly text: string }

export interface SaveFile {
  readonly path: string
  readonly read: () => Promise<SaveResult<FileContents>>
  readonly write: (text: string) => Promise<SaveResult<null>>
  readonly remove: () => Promise<SaveResult<null>>
}

export const SAVE_FILE_NAME = 'save.json'

/** Il messaggio, non l'`Error`: oltre l'IPC un `Error` arriverebbe come `{}`. */
const messageOf = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause)

const codeOf = (cause: unknown): string =>
  cause instanceof Error && 'code' in cause && typeof cause.code === 'string' ? cause.code : ''

export const createSaveFile = (directory: string): SaveFile => {
  const path = join(directory, SAVE_FILE_NAME)
  const temporary = `${path}.tmp`

  return {
    path,

    read: async () => {
      try {
        return { ok: true, value: { present: true, text: await readFile(path, 'utf8') } }
      } catch (cause) {
        if (codeOf(cause) === 'ENOENT') return { ok: true, value: { present: false } }
        return { ok: false, error: { code: 'error.save.io', cause: messageOf(cause) } }
      }
    },

    /**
     * Temporaneo, `fsync`, `rename`. Le tre parti servono tutte e tre: senza il temporaneo un
     * crollo a metà lascia il file reale troncato; senza `fsync` il `rename` può arrivare prima
     * che il contenuto abbia lasciato la cache del sistema operativo, e una mancanza di corrente
     * lascia un file di zero byte con il nome giusto.
     */
    write: async (text) => {
      try {
        const handle = await open(temporary, 'w')
        try {
          await handle.writeFile(text, 'utf8')
          await handle.sync()
        } finally {
          await handle.close()
        }
        await rename(temporary, path)
        return { ok: true, value: null }
      } catch (cause) {
        // Il temporaneo di un tentativo fallito non deve restare a occupare il posto del
        // prossimo. Se anche questo fallisce non c'è niente da dire in più: l'errore vero è
        // quello che stiamo già tornando indietro.
        await rm(temporary, { force: true }).catch(() => undefined)
        return { ok: false, error: { code: 'error.save.io', cause: messageOf(cause) } }
      }
    },

    /** `force` rende `ok` la cancellazione di un file che non c'è: non è un guasto. */
    remove: async () => {
      try {
        await rm(path, { force: true })
        return { ok: true, value: null }
      } catch (cause) {
        return { ok: false, error: { code: 'error.save.io', cause: messageOf(cause) } }
      }
    }
  }
}
