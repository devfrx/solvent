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

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Il livello a cui si ritrova il lavoro dipendente chi aveva comprato **gli straordinari**.
 *
 * Due, e la cifra è la sola cosa da capire di questa migrazione: l'upgrade della versione 1 era un
 * `×1,5` sul reddito base, e il secondo livello della scala vale esattamente `base × 1,5`. Chi
 * l'aveva comprato torna a guadagnare quello che guadagnava, al centesimo.
 */
const JOB_WITH_OVERTIME = 2

/** Il livello di chi non l'aveva: il primo, cioè la resa base con cui la partita si apre. */
const JOB_WITHOUT_OVERTIME = 1

/** I lavoretti non esistevano, quindi nessuno li aveva aperti: zero è una fonte chiusa. */
const GIGS_CLOSED = 0

/**
 * Dalla 1 alla 2 — **la prima migrazione vera del progetto** (D044).
 *
 * Alla versione 1 il reddito era `{ upgraded, declared? }`: un booleano per l'unico potenziamento
 * che il gioco vendeva, e un regime che alla versione 1,0 non esisteva ancora — assente voleva dire
 * «in nero», e quel significato era dichiarato nel tipo. Alla 2 è un elenco di livelli, uno per
 * fonte.
 *
 * **È letterale, e non può essere altro.** Non importa il dominio — INV-03 lascia al main
 * `contracts/save.ts` e nient'altro — e non dovrebbe nemmeno potendo: una migrazione congela la
 * forma della versione 2 **per sempre**, e il giorno in cui una fonte nuova entrerà sarà una
 * migrazione in più, non questa riscritta. Un `SOURCES` importato la farebbe invecchiare da sola,
 * in silenzio, portando partite vecchie in una forma che a quel punto non è più la versione 2.
 *
 * **Cosa non fa: validare.** Un `upgraded` manomesso diventa il livello uno invece di essere
 * rifiutato, e la scelta è deliberata — il posto in cui un salvataggio viene guardato campo per
 * campo è il `load` del dominio (INV-20), che vede la forma di **adesso**. Ciò che qui non è
 * nemmeno un oggetto passa intatto, così arriva laggiù e viene rifiutato lì.
 */
const incomeToVersion2 = (income: unknown): unknown =>
  isRecord(income)
    ? {
        levels: {
          job: income.upgraded === true ? JOB_WITH_OVERTIME : JOB_WITHOUT_OVERTIME,
          gigs: GIGS_CLOSED
        },
        declared: income.declared === true
      }
    : income

/** Il payload della 1 con il solo `systems.income` riscritto: il resto della partita non cambia. */
const toVersion2: Migration = (payload) => {
  if (!isRecord(payload) || !isRecord(payload.systems)) return payload
  return {
    ...payload,
    systems: { ...payload.systems, income: incomeToVersion2(payload.systems.income) }
  }
}

/**
 * La mappa vera. È rimasta **vuota per cinque fette** con il proprio grilletto scritto nel registro
 * YAGNI, e con D044 il grilletto è scattato: lo stato del reddito ha cambiato forma.
 */
export const MIGRATIONS: ReadonlyMap<number, Migration> = new Map([[1, toVersion2]])

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
