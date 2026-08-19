import type { SaveResult } from '@core/contracts/save'

import type { RawEnvelope } from './schema'

/**
 * L'unico posto al mondo dove il salvataggio cambia forma (ADR 0004).
 *
 * Nel progetto precedente i sistemi di migrazione erano due, in parallelo. Qui la mappa è una, e
 * il **numero di versione lo scrive il runner, non la migrazione**: così "mai due salti in una
 * funzione" (docs/design/flusso-salvataggio.md) non è una regola da ricordare — una migrazione
 * non ha proprio dove sbagliare la versione.
 *
 * Una migrazione è **pura**: nessuna lettura di file, nessuna data corrente, nessun caso "se il
 * campo esiste". Prende il payload della versione N e ritorna quello della N+1.
 */
export type Migration = (payload: unknown) => unknown

/**
 * Vuota, e va bene: la versione 1 non ha nulla da cui migrare. La prima nasce con la versione 2,
 * cioè con i conti dinamici dell'ADR 0022 (registro YAGNI in docs/roadmap-fette.md).
 */
export const MIGRATIONS: ReadonlyMap<number, Migration> = new Map()

/**
 * Applica le migrazioni una alla volta, da `envelope.version` fino a `target`.
 *
 * `target` e `migrations` sono parametri e non costanti lette di nascosto perché oggi la mappa
 * vera è vuota e la versione corrente è la 1: senza poterli passare, questo runner sarebbe
 * codice che nessun test attraversa fino alla versione 2 — cioè codice mai provato il giorno in
 * cui serve. Con loro, la catena si prova adesso con migrazioni finte e passi veri.
 *
 * Il passo mancante non è raggiungibile con una mappa completa — `tests/save/migrations` verifica
 * che lo sia — e resta gestito lo stesso: per chi carica, un file che questa build non sa portare
 * fino alla versione corrente è un file che non può accettare.
 */
export const migrate = (
  envelope: RawEnvelope,
  target: number,
  migrations: ReadonlyMap<number, Migration> = MIGRATIONS
): SaveResult<RawEnvelope> => {
  let current = envelope

  while (current.version < target) {
    const step = migrations.get(current.version)
    if (step === undefined) {
      return { ok: false, error: { code: 'error.save.invalid', path: 'version' } }
    }
    current = {
      version: current.version + 1,
      savedAt: current.savedAt,
      payload: step(current.payload)
    }
  }

  return { ok: true, value: current }
}
