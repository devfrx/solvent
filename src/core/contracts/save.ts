import type { Pool } from './pools'
import type { Result } from './result'

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

/**
 * La scrive solo il main (ADR 0004).
 *
 * **La 2 è la prima versione con una migrazione vera** (D044): lo stato del reddito è passato da
 * due booleani a un elenco di livelli, e una partita della versione 1 va portata avanti invece che
 * rifiutata. Il runner esiste da [D009](../../../docs/delega/D009-persistenza-main.md) ed era
 * provato con migrazioni finte; la mappa che aspettava questo giorno stava vuota da cinque fette.
 */
export const SAVE_VERSION = 2

export interface SaveEnvelope {
  readonly version: number
  readonly savedAt: number
  readonly payload: SavePayload
}

/**
 * Gli esiti che attraversano il confine (docs/design/flusso-salvataggio.md).
 *
 * Vivono qui e non in un file loro per una ragione sola: INV-03 lascia al main
 * `contracts/save.ts` **e nient'altro**, quindi un tipo d'esito scritto altrove non sarebbe
 * importabile da chi lo produce. La risposta sbagliata a quel problema è allargare INV-03: un
 * allowlist di un file diventerebbe un denylist da mantenere, cioè la regola che si apre da sola.
 *
 * `Result` invece si importa qui dentro senza problemi: siamo in `core/`, dove è lecito.
 */
export type SaveError =
  | { readonly code: 'error.save.corrupt' }
  | { readonly code: 'error.save.invalid'; readonly path: string }
  | {
      readonly code: 'error.save.version_ahead'
      readonly found: number
      readonly supported: number
    }
  /** Il **messaggio**, non l'`Error`: un `Error` non sopravvive alla clonazione dell'IPC. */
  | { readonly code: 'error.save.io'; readonly cause: string }

/**
 * Il file assente non è un errore: è una partita nuova (ADR 0004).
 *
 * `savedAt` esce insieme al payload perché senza di lui il recupero all'avvio non può esistere:
 * il renderer deve sapere **quanto tempo è passato** per chiedere al Registry i tick arretrati
 * (docs/design/ciclo-di-vita.md, transizione `Caricamento → Recupero`). Continua a scriverlo solo
 * il main (R08): qui il renderer lo **legge**, e non c'è una firma che gli permetta di produrlo.
 */
export type LoadedSave =
  | { readonly present: false }
  | { readonly present: true; readonly savedAt: number; readonly payload: SavePayload }

export type SaveResult<T> = Result<T, SaveError>

/**
 * Ciò che il preload espone al renderer. Le tre funzioni ritornano una `Promise` perché l'IPC è
 * asincrono e sta fuori da `core/`: l'ADR 0016 vieta l'asincronia nel **Bus**, non al confine con
 * il sistema operativo.
 *
 * Il `declare global` che aggancia questa API a `window` è del renderer, quindi di D011. Qui il
 * preload si limita a soddisfare l'interfaccia.
 */
export interface SaveApi {
  /** Ritorna l'istante scritto nella busta. */
  readonly save: (payload: SavePayload) => Promise<SaveResult<number>>
  readonly load: () => Promise<SaveResult<LoadedSave>>
  readonly reset: () => Promise<SaveResult<null>>
}
