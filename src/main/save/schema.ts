import { z } from 'zod'

import type { SaveEnvelope, SavePayload, SaveResult } from '@core/contracts/save'

/**
 * A08 · R08 · ADR 0004 — lo schema è **eseguito**, non descrittivo.
 *
 * Nel progetto precedente 915 righe di schema si dichiaravano "advisory": nessuno le eseguiva,
 * quindi erano già stale il giorno dopo. Qui ogni salvataggio e ogni caricamento ci passa dentro,
 * e i test lo mettono davanti a un payload sbagliato per davvero.
 *
 * Cosa questo schema **non** fa: non verifica che i saldi sommino a zero. Quella è l'invariante
 * del Ledger (INV-08), che la controlla quando carica lanciando `UnbalancedSaveError`. Il main
 * non conosce il Ledger e non deve: qui si controlla la **forma**.
 */

/**
 * INV-04 · ADR 0006 — oltre il confine il denaro è una stringa decimale, mai un `number`.
 *
 * Il controllo non si ferma a "è una stringa": `Decimal` accetta anche `1e9`, `Infinity` e `NaN`,
 * e una stringa qualunque lo fa **lanciare** dentro il Ledger, cioè fuori da ogni `Result`. Lo
 * schema è l'ultimo punto in cui un file manomesso è ancora un dato; dopo diventa un crollo.
 */
const DECIMAL = /^-?(0|[1-9]\d*)(\.\d+)?$/

const decimalString = z.string().regex(DECIMAL, 'atteso un decimale in forma di stringa')

/**
 * Tutte e sei le chiavi, e nessuna in più (ADR 0020): i conti non-giocatore stanno nel
 * salvataggio, altrimenti al ricaricamento la somma non farebbe zero.
 *
 * `POOL_IDS` non è importabile da qui — INV-03 concede al main il solo `contracts/save.ts` —
 * quindi l'elenco è ricopiato a mano. A impedire che si disallinei è `tests/save/schema`, che
 * costruisce i saldi **da** `POOL_IDS` e li passa di qui: un pool in più o in meno diventa rosso.
 */
const balancesSchema = z.strictObject({
  cash: decimalString,
  card: decimalString,
  world: decimalString,
  sink: decimalString,
  fees: decimalString,
  house: decimalString
})

/**
 * Lo stato dei sistemi resta **opaco** (ADR 0002): una mappa aperta di cui lo schema non guarda i
 * valori. Il contratto non può conoscere i domini, e un id sconosciuto non è un errore.
 */
const systemsSchema = z.record(z.string(), z.unknown())

const payloadSchema = z.strictObject({
  ledger: z.strictObject({ balances: balancesSchema }),
  rng: z.strictObject({
    // Il seme è un intero a 32 bit con segno (`Rng.ts`), i cursori contano le estrazioni.
    seed: z.int(),
    cursors: z.record(z.string(), z.int().nonnegative())
  }),
  systems: systemsSchema
})

/**
 * La busta prima della migrazione: `version` e `savedAt` validati, il payload ancora guardato
 * solo come "un oggetto". Validarlo qui fallirebbe sempre su un salvataggio vecchio, perché ha
 * la forma della sua versione e non di questa.
 */
const headerSchema = z.strictObject({
  version: z.int().positive(),
  savedAt: z.int().nonnegative(),
  payload: systemsSchema
})

const envelopeSchema = z.strictObject({
  version: z.int().positive(),
  savedAt: z.int().nonnegative(),
  payload: payloadSchema
})

/** La busta con il payload non ancora validato: è ciò che le migrazioni si passano di mano. */
export interface RawEnvelope {
  readonly version: number
  readonly savedAt: number
  readonly payload: unknown
}

/**
 * Il percorso del campo che ha fallito, come lo riceve il renderer.
 *
 * `unrecognized_keys` è l'unico caso in cui il percorso si ferma all'oggetto: la chiave di troppo
 * sta in `keys`, e senza questo ramo un settimo pool tornerebbe indietro come
 * `payload.ledger.balances`, cioè senza dire quale.
 */
const pathOf = (issue: z.core.$ZodIssue, prefix: string): string => {
  const segments = issue.path.map(String)
  if (issue.code === 'unrecognized_keys') {
    const [unrecognized] = issue.keys
    if (unrecognized !== undefined) segments.push(unrecognized)
  }
  return [prefix, ...segments].filter((segment) => segment !== '').join('.')
}

const first = (error: z.ZodError, prefix: string): string => {
  const issue = error.issues[0]
  return issue === undefined ? prefix : pathOf(issue, prefix)
}

/**
 * `ok` e `err` di `contracts/result` non sono importabili da qui (INV-03), quindi la forma del
 * `Result` è scritta a mano. È il prezzo dell'allowlist di un file, ed è più piccolo del prezzo
 * di allargarla.
 */
const parse = <T>(schema: z.ZodType<T>, raw: unknown, prefix: string): SaveResult<T> => {
  const parsed = schema.safeParse(raw)
  if (parsed.success) return { ok: true, value: parsed.data }
  return { ok: false, error: { code: 'error.save.invalid', path: first(parsed.error, prefix) } }
}

/** Il primo passo del caricamento: la busta, senza guardare dentro il payload. */
export const parseHeader = (raw: unknown): SaveResult<RawEnvelope> => parse(headerSchema, raw, '')

/** Il terzo passo del caricamento: il payload **dopo** le migrazioni. */
export const parsePayload = (raw: unknown): SaveResult<SavePayload> =>
  parse(payloadSchema, raw, 'payload')

/** Il salvataggio: busta e payload insieme, prima che qualcosa tocchi il disco. */
export const parseEnvelope = (raw: unknown): SaveResult<SaveEnvelope> =>
  parse(envelopeSchema, raw, '')
