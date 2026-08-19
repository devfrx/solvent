import type { Pool } from './pools'

/**
 * R08 · ADR 0004 — il contratto di salvataggio appartiene al processo main.
 *
 * `SavePayload` **non ha** un campo versione, né direttamente né annidato: il renderer non può
 * scrivere la versione sbagliata perché il tipo non gliene dà la possibilità. Non è una
 * convenzione da ricordare, è una cosa che non si può scrivere (difetto A07).
 *
 * `SAVE_VERSION` è esportata da qui ma la usa **solo** il main, che è l'unico a costruire la
 * busta, a validarla e a migrarla.
 */

/** ADR 0006 · INV-04 — oltre il confine di persistenza il denaro è una stringa decimale. */
export interface LedgerSave {
  readonly balances: Readonly<Record<Pool, string>>
}

/** ADR 0005 — lo stato di ogni stream è due numeri: serializzabile senza cerimonie. */
export interface RngSave {
  readonly seed: number
  readonly cursors: Readonly<Record<string, number>>
}

/**
 * Lo stato di un sistema è opaco per il contratto: il Registry lo consegna al sistema che lo sa
 * leggere (ADR 0002). La mappa è aperta perché un id sconosciuto al caricamento non è un errore —
 * un sistema rimosso in una versione nuova non deve impedire di aprire una partita vecchia.
 */
export type SystemsSave = Readonly<Record<string, unknown>>

export interface SavePayload {
  readonly ledger: LedgerSave
  readonly rng: RngSave
  readonly systems: SystemsSave
}

/** La scrive solo il main (ADR 0004). La versione 1 non ha migrazioni: non ha nulla da cui migrare. */
export const SAVE_VERSION = 1

export interface SaveEnvelope {
  readonly version: number
  readonly savedAt: number
  readonly payload: SavePayload
}
