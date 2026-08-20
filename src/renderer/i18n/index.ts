import { createI18n, useI18n } from 'vue-i18n'

import type { Reason } from '@core/contracts/ledger'
import type { Money } from '@core/contracts/money'
import { toDisplayNumber } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import { POOLS } from '@core/contracts/pools'
import type { SaveError } from '@core/contracts/save'

import type { AtmError } from '@core/domains/atm/commands'
import type { IncomeError } from '@core/domains/income/commands'
import type { Milliseconds } from '@core/kernel/Clock'
import { MILLISECONDS_PER_SECOND } from '@core/kernel/Clock'

import type { GameLoadError } from '@renderer/runtime/createGame'

import { en } from './en'
import { it } from './it'

/**
 * R12 · ADR 0011 — le parole del gioco, e l'unico posto in cui esistono.
 *
 * Il difetto A13 erano venti chiavi mancanti nella lingua di default, e non era un problema di
 * traduzione: era che niente confrontava le lingue fra loro. Qui il confronto è **doppio** — il
 * tipo `Dictionary` obbliga il compilatore a pretendere ogni chiave in entrambe le lingue, e
 * `tests/i18n/parity` rilegge i codici dal sorgente per accorgersi di quelli che nascono dopo.
 *
 * Le chiavi sono **piatte**, con i punti dentro il nome invece che dentro una gerarchia di
 * oggetti, e sono due ragioni. La prima è che `atm.withdraw` è una chiave e `atm.withdraw.title`
 * è un'altra: in una gerarchia la seconda occuperebbe il posto della prima, che è un difetto
 * silenzioso e già presente nei mockup. La seconda è il tipo — `Record<MessageKey, string>` è
 * esatto e il compilatore lo controlla, mentre una gerarchia richiederebbe di ricostruire i
 * percorsi a mano.
 *
 * Non costa niente: vue-i18n 11 risolve una chiave piatta come una annidata, verificato.
 */

export const LOCALES = ['it', 'en'] as const

export type Locale = (typeof LOCALES)[number]

/**
 * La lingua con cui il gioco parte. Cambiarla qui cambia **tutta** la UI: è la verifica manuale
 * della definizione di fatto di D012, e resta un valore di codice finché non esiste una schermata
 * impostazioni che lo offra (docs/roadmap-fette.md).
 */
export const DEFAULT_LOCALE: Locale = 'it'

/**
 * Tutto ciò che può finire davanti al giocatore come esito negativo, da qualunque confine arrivi.
 * È l'unione che rende INV-07 un errore di **compilazione**: `messageOf` la percorre tutta con uno
 * `switch`, e un codice nato in un dominio nuovo non compila finché non ha la sua frase.
 */
export type GameError = SaveError | GameLoadError | IncomeError | AtmError

export type ErrorCode = GameError['code']

/**
 * Le chiavi che non vengono da un tipo del dominio: quelle scritte sui mockup, in giallo sotto
 * ogni schermata (docs/design/mockups/). Ci sono anche quelle che solo D015 mostrerà — il
 * dizionario si completa in un tempo solo, perché una lingua completata in due tempi è A13.
 */
export type ScreenKey =
  | 'app.nav.home'
  | 'app.nav.stats'
  | 'app.loading.title'
  | 'app.loading.catchup'
  | 'app.loading.away_for'
  | 'app.closing.saving'
  | 'app.error.retry'
  | 'app.error.new_game'
  | 'app.error.close_anyway'
  | 'app.error.load_hint'
  | 'app.error.save_hint'
  | 'app.duration.hours'
  | 'app.duration.minutes'
  | 'app.duration.and'
  | 'app.duration.under_a_minute'
  | 'common.buy'
  | 'common.level'
  | 'pool.cash'
  | 'pool.card'
  | 'pool.unlimited'
  | 'pool.traced'
  | 'pool.untraced'
  | 'pool.traceability'
  | 'pool.capacity'
  | 'income.per_second'
  | 'income.upgrade.overtime.name'
  | 'income.upgrade.overtime.desc'
  | 'income.upgrade.owned'
  | 'stats.saved_at.title'
  | 'stats.saved_at.never'
  | 'stats.operations.title'
  | 'stats.operations.empty'
  // La home (docs/design/mockups/home-atm.html). Le chiavi di questo blocco sono nate con D012,
  // che ha scritto il dizionario intero in un tempo solo perché una lingua completata in due
  // tempi è il difetto A13; D015 le ha usate, e dove il mockup si contraddiceva le ha corrette.
  | 'home.zone.atm'
  | 'home.zone.dashboard'
  | 'home.tile.income'
  | 'home.tile.net_worth'
  | 'home.tile.earned'
  | 'home.tile.spent'
  | 'home.tile.fees'
  | 'atm.account.title'
  | 'atm.cash.title'
  | 'atm.cash.capacity'
  | 'atm.deposit'
  | 'atm.withdraw'
  | 'atm.deposit.title'
  | 'atm.withdraw.title'
  | 'atm.breakdown'
  | 'atm.fee'
  | 'atm.fee.per_operation'
  | 'atm.deposit.confirm'
  | 'atm.withdraw.confirm'
  | 'atm.recent.title'
  | 'card.tier.gold'
  | 'card.hint.drag'

export type MessageKey = Reason | ErrorCode | ScreenKey

/**
 * Il dizionario di una lingua. `Record` e non una forma parziale: aggiungere una `Reason` o un
 * codice d'errore senza tradurlo **non compila**, in entrambe le lingue (ADR 0011).
 */
export type Dictionary = Readonly<Record<MessageKey, string>>

/**
 * Il nome visibile di un pool. I quattro conti non-giocatore non ne hanno uno, e il `null` lo
 * dichiara invece di lasciarlo intendere: non compaiono mai nella UI (ADR 0017).
 *
 * È un `Record` su `Pool` e non una coppia di chiavi sciolte perché il giorno in cui nasce un
 * pool nuovo — `chips` è già nel glossario — questa riga non compila finché qualcuno non decide
 * se quel pool si mostra.
 */
const POOL_KEYS: Readonly<Record<Pool, MessageKey | null>> = {
  cash: 'pool.cash',
  card: 'pool.card',
  world: null,
  sink: null,
  fees: null,
  house: null
}

/**
 * Se i movimenti di un pool lasciano traccia, detto a parole. È la metà visibile di P4 — la
 * dualità contanti/carta — e sta qui invece che in due componenti perché le due frasi sono le due
 * facce della stessa dichiarazione: `POOLS[pool].traceable`. Scritte in due posti, prima o poi una
 * delle due resterebbe indietro.
 */
export const traceabilityKey = (pool: Pool): MessageKey =>
  POOLS[pool].traceable ? 'pool.traced' : 'pool.untraced'

/** Le due unità che servono a dire "3 ore e 12 minuti", e non hanno niente a che fare coi tick. */
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

/**
 * `useGrouping: 'always'` non è un vezzo: in italiano CLDR dichiara `minimumGroupingDigits = 2`,
 * quindi 1284,60 esce **senza** separatore e 18.402,15 con — la stessa colonna di importi con due
 * regole diverse a seconda della cifra. I mockup raggruppano sempre, e un gioco finanziario si
 * legge per numeri (P2).
 */
const CURRENCY = {
  currency: { style: 'currency', currency: 'EUR', useGrouping: 'always' },
  /**
   * Lo stesso formato con il segno **sempre** davanti, zero escluso. Serve alle righe di una
   * transazione, dove il verso è l'informazione: «497,50» non dice se sono arrivati o partiti,
   * «+ 497,50» sì. Fuori di lì un saldo con il più davanti sarebbe rumore, quindi sono due
   * formati e non uno.
   */
  signed: {
    style: 'currency',
    currency: 'EUR',
    useGrouping: 'always',
    signDisplay: 'exceptZero'
  }
} as const

const TIMESTAMP = {
  short: {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }
} as const

/**
 * Il plugin. `legacy: false` perché il resto del renderer è già API di composizione.
 *
 * **Nessuna lingua di ripiego**, ed è una scelta: una lingua di ripiego serve a coprire le chiavi
 * che mancano, e qui non ne possono mancare — `Dictionary` è un `Record` totale e il compilatore
 * lo pretende. Configurarla lo stesso sarebbe una rete sotto un pavimento senza buchi, e nessun
 * test potrebbe mai vederla scattare.
 */
// Il tipo di ritorno è **inferito** e non dichiarato, che in questo progetto è l'eccezione: la
// firma di `createI18n` deduce da `legacy: false` che `global` è un `Composer`, e scrivere
// `ReturnType<typeof createI18n>` butterebbe via proprio quella deduzione, lasciando un'unione con
// l'API legacy che nessun chiamante può usare.
export const createTranslations = () =>
  createI18n({
    legacy: false,
    locale: DEFAULT_LOCALE,
    messages: { it, en },
    numberFormats: { it: CURRENCY, en: CURRENCY },
    datetimeFormats: { it: TIMESTAMP, en: TIMESTAMP }
  })

/**
 * Ciò che un componente riceve per parlare. Nient'altro: un `.vue` non compone frasi, non formatta
 * numeri a mano e non conosce la parola "insufficiente" — chiede una chiave e riceve un testo.
 */
export interface Translator {
  readonly text: (key: MessageKey, values?: Readonly<Record<string, unknown>>) => string
  /** La forma plurale, scelta dalla lingua e non da un `if` nel componente. */
  readonly count: (key: MessageKey, amount: number) => string
  /** ADR 0006 — il confine di presentazione, l'unico posto autorizzato a convertire un `Money`. */
  readonly money: (amount: Money) => string
  /** Lo stesso importo con il proprio verso davanti: è la riga di una transazione, non un saldo. */
  readonly signedMoney: (amount: Money) => string
  readonly instant: (at: number) => string
  readonly duration: (elapsed: Milliseconds) => string
  readonly poolName: (pool: Pool) => string
  /** Il codice di un `Result` fallito diventa una frase, con dentro i numeri che l'errore porta. */
  readonly failure: (error: GameError) => string
}

/**
 * Il minimo che vue-i18n deve offrire perché una frase si componga: una chiave con dei valori, una
 * chiave con un numero per il plurale, un numero da formattare, una data da formattare.
 *
 * Esiste per una ragione precisa: `useTranslator()` funziona solo dentro un componente, e senza
 * questa separazione le due verifiche che contano — che il messaggio porti davvero le due cifre, e
 * che cambiando lingua cambi tutto — resterebbero verifiche a occhio. Con essa `createTranslator`
 * si prova a mano, senza montare niente e senza un DOM finto.
 */
export interface Wording {
  readonly text: (key: MessageKey, values: Readonly<Record<string, unknown>>) => string
  readonly count: (key: MessageKey, amount: number) => string
  readonly number: (value: number, format: string) => string
  readonly date: (value: Date, format: string) => string
}

export const createTranslator = (wording: Wording): Translator => {
  const text = (key: MessageKey, values: Readonly<Record<string, unknown>> = {}): string =>
    wording.text(key, values)

  const count = (key: MessageKey, amount: number): string => wording.count(key, amount)

  const money = (amount: Money): string => wording.number(toDisplayNumber(amount), 'currency')

  const signedMoney = (amount: Money): string => wording.number(toDisplayNumber(amount), 'signed')

  const instant = (at: number): string => wording.date(new Date(at), 'short')

  /**
   * Una durata detta come la direbbe una persona: i due zeri hanno una frase loro invece di
   * comparire dentro quella generale.
   *
   * Sotto il minuto non si dice «0 minuti» — è la risposta che si legge a ogni ritorno da una
   * finestra nascosta per due secondi — e alle ore tonde non si dice «3 ore e 0 minuti». Sono due
   * casi che l'aritmetica produce e che nessuna lingua pronuncia.
   */
  const duration = (elapsed: Milliseconds): string => {
    const totalMinutes = Math.floor(elapsed / (MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE))
    if (totalMinutes === 0) return text('app.duration.under_a_minute')

    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
    const minutes = totalMinutes % MINUTES_PER_HOUR
    if (hours === 0) return count('app.duration.minutes', minutes)
    if (minutes === 0) return count('app.duration.hours', hours)

    return text('app.duration.and', {
      first: count('app.duration.hours', hours),
      second: count('app.duration.minutes', minutes)
    })
  }

  const poolName = (pool: Pool): string => {
    const key = POOL_KEYS[pool]
    // Se un conto non-giocatore arriva fin qui il difetto è a monte, non nella traduzione: si
    // mostra il suo id invece di inventargli un nome che nessuno ha deciso.
    return key === null ? pool : text(key)
  }

  const failure = (error: GameError): string => {
    switch (error.code) {
      case 'error.ledger.insufficient_funds':
        return text(error.code, {
          pool: poolName(error.pool),
          required: money(error.required),
          available: money(error.available)
        })
      case 'error.ledger.capacity_exceeded':
        return text(error.code, {
          pool: poolName(error.pool),
          capacity: money(error.capacity),
          fits: money(error.fits)
        })
      case 'error.ledger.pool_not_accepted':
        return text(error.code, {
          pool: poolName(error.pool),
          accepted: error.accepted.map(poolName).join(', ')
        })
      case 'error.ledger.invalid_amount':
        return text(error.code, { pool: poolName(error.pool), amount: money(error.amount) })
      case 'error.income.already_upgraded':
        return text(error.code)
      case 'error.atm.amount_not_positive':
        return text(error.code, { amount: money(error.amount) })
      case 'error.atm.fee_exceeds_amount':
        return text(error.code, { amount: money(error.amount), fee: money(error.fee) })
      case 'error.save.corrupt':
        return text(error.code)
      case 'error.save.invalid':
        return text(error.code, { path: error.path })
      case 'error.save.version_ahead':
        return text(error.code, { found: error.found, supported: error.supported })
      case 'error.save.io':
        return text(error.code, { cause: error.cause })
      case 'error.registry.load_failed':
        return text(error.code, { id: error.id })
      case 'error.game.load_failed':
        return text(error.code)
      default: {
        // INV-07 diventa un errore di compilazione: un codice nato in un dominio nuovo e mai
        // tradotto rende questa riga rossa, mesi prima che qualcuno lo veda a schermo.
        const unhandled: never = error
        return String(unhandled)
      }
    }
  }

  return { text, count, money, signedMoney, instant, duration, poolName, failure }
}

/** Dentro un componente, le quattro funzioni le porta `useI18n()`. Fuori, le porta un test. */
export const useTranslator = (): Translator => {
  const { t, n, d } = useI18n()

  return createTranslator({
    text: (key, values) => t(key, values),
    count: (key, amount) => t(key, amount),
    number: (value, format) => n(value, format),
    date: (value, format) => d(value, format)
  })
}
