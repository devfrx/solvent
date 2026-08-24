import { createI18n, useI18n } from 'vue-i18n'

import type { CheatId } from '@core/contracts/cheats'
import type { Reason } from '@core/contracts/ledger'
import type { Money } from '@core/contracts/money'
import { toDisplayNumber } from '@core/contracts/money'
import type { PaymentError } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'
import { POOLS } from '@core/contracts/pools'
import type { SaveError } from '@core/contracts/save'

import type { AtmError } from '@core/domains/atm/commands'
import type { IncomeError } from '@core/domains/income/commands'
import type { VaultError } from '@core/domains/vault/system'
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
export type GameError =
  SaveError | GameLoadError | IncomeError | AtmError | VaultError | PaymentError

export type ErrorCode = GameError['code']

/**
 * Le chiavi che non vengono da un tipo del dominio: quelle scritte sui mockup, in giallo sotto
 * ogni schermata (docs/design/mockups/). Ci sono anche quelle che solo D015 mostrerà — il
 * dizionario si completa in un tempo solo, perché una lingua completata in due tempi è A13.
 */
export type ScreenKey =
  // Il nome del prodotto. È **una parola davanti al giocatore**, quindi passa da qui come tutte le
  // altre — e non si traduce: le due lingue dicono la stessa cosa, e `tests/rules/product-identity`
  // lo verifica insieme agli altri posti in cui il nome vive (C03, ADR 0008).
  | 'app.name'
  // Le destinazioni (D024, D026, D033). Ognuna ha il nome di ciò che ci si amministra, e da D033
  // sono cinque: `home` faceva due lavori e adesso sono due pagine (ADR 0040). `board` è l'unica
  // che non porta il nome di un dominio insieme a `stats` — il cruscotto non è di nessuno.
  | 'app.nav.atm'
  | 'app.nav.income'
  | 'app.nav.vault'
  | 'app.nav.board'
  | 'app.nav.stats'
  // I gruppi della colonna (D026). Due, e dicono il verbo: dove si **fa** qualcosa, e dove si
  // **guarda** ciò che è successo. È la distinzione dell'ADR 0018 portata un piano sopra.
  | 'app.nav.group.act'
  | 'app.nav.group.look'
  // Il telaio (D024). L'interruttore del tema dice **quale tema è acceso**, non cosa succede
  // premendolo: è un interruttore a due posizioni, e la posizione è l'informazione (ADR 0031).
  | 'app.theme.light'
  | 'app.theme.dark'
  | 'app.loading.title'
  | 'app.loading.catchup'
  | 'app.loading.away_for'
  | 'app.loading.dropped'
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
  // Le spiegazioni (D025). Sono la prosa dietro una parola corta, e vivono in un tooltip: la
  // striscia della testata e il cruscotto non hanno posto per una frase, e la frase serve.
  | 'pool.cash.explained'
  | 'pool.card.explained'
  | 'pool.traceability.explained'
  // Il pannello di sviluppo (D029). Non lo vede un giocatore, e le sue parole stanno qui lo stesso:
  // un secondo posto in cui nascono le parole è il difetto A13 con un'altra etichetta.
  | 'dev.title'
  | 'dev.subtitle'
  | 'dev.amount'
  | 'income.per_second'
  // Le fonti di reddito (D044). Il nome e la descrizione sono per fonte, il resto è la scala: a
  // che livello si sta su quanti, quanto rende adesso, quanto renderebbe dopo, e dove atterra.
  // `income.source.at_max` e' cio' che una scala finita dice invece di un pulsante spento.
  | 'income.source.job.name'
  | 'income.source.job.desc'
  | 'income.source.gigs.name'
  | 'income.source.gigs.desc'
  | 'income.source.level'
  | 'income.source.closed'
  | 'income.source.open'
  | 'income.source.yields'
  | 'income.source.next_level'
  | 'income.source.lands_in'
  | 'income.source.at_max'
  // Il plateau: il tetto del reddito attivo, e quanto ne manca. E' la legge 6 della visione
  // detta al giocatore mentre gioca, invece che in un documento.
  | 'income.plateau'
  | 'income.to_plateau'
  // Il regime del reddito (ADR 0052). `income.regime.buys` dice cosa l'acquisto compra **prima**
  // che si apra il flusso del pagamento: la trattenuta e l'irreversibilità non sono un prezzo — e
  // un acquisto senza ritorno che si scopre dopo non è una decisione.
  | 'income.regime.name'
  | 'income.regime.black'
  | 'income.regime.declared'
  | 'income.regime.desc'
  | 'income.regime.buys'
  | 'income.regime.declare'
  // Il pagamento (ADR 0027). `payment.only_with` è nata con un listino di una voce sola, dove non
  // c'era una scelta da etichettare ma una ragione da dare. Il caveau porta il primo listino a
  // **due** voci, e con esso la parola che manca: il nome dello strumento non basta più, perché
  // adesso i due prezzi sono diversi e la differenza è la scelta.
  | 'payment.only_with'
  | 'payment.with'
  // Il flusso del pagamento (D036, ADR 0042). Il titolo della finestra, la conferma con il prezzo
  // — che da qui in poi sta **qui** invece che sul pulsante che apre, perché prima di scegliere
  // uno strumento un prezzo solo non esiste — e le due parole della prova.
  | 'payment.title'
  | 'payment.confirm'
  | 'payment.cancel'
  | 'payment.code.title'
  | 'payment.code.hint'
  // Il caveau (D017). La capienza vera, quanti livelli restano, e — la più importante — che il
  // reddito si è fermato: un idle in cui i soldi smettono di arrivare senza dirlo è un idle rotto.
  | 'vault.level'
  | 'vault.room'
  | 'vault.next_holds'
  | 'vault.expansions_left'
  | 'vault.expand'
  | 'vault.at_max'
  | 'vault.full'
  | 'vault.blocked'
  | 'stats.saved_at.title'
  | 'stats.saved_at.never'
  | 'stats.operations.title'
  | 'stats.operations.empty'
  // La frase che apre una schermata (D024). Una per destinazione, e `SCREEN_WORDING` le pretende
  // tutte: una schermata nuova non compila finché non sa dire a cosa serve.
  | 'stats.description'
  | 'atm.description'
  | 'board.description'
  | 'income.description'
  | 'vault.description'
  // Il cruscotto (D012, D015, D033). Erano le chiavi `home.*`, e la rinomina non è cosmetica: il
  // prefisso diceva su quale pagina stavano, e la pagina non esiste più. Una chiave `home.` viva
  // dopo D033 sarebbe una parola senza schermata — a impedirlo è la parità (R13), che non vede una
  // chiave dimenticata **in tutte e due** le lingue: quel controllo è un `grep`, non un gate.
  | 'board.tile.income'
  | 'board.tile.net_worth'
  | 'board.tile.earned'
  | 'board.tile.spent'
  | 'board.tile.fees'
  | 'board.tile.income.explained'
  | 'board.tile.net_worth.explained'
  | 'board.tile.earned.explained'
  | 'board.tile.spent.explained'
  | 'board.tile.fees.explained'
  // Il grafico del cruscotto (D027). Il canvas chiama il suo «Net worth · 30 days», e quella
  // seconda meta' non si puo' tradurre: i giorni di gioco non esistono finche' non nasce il
  // calendario dell'ADR 0023. Le chiavi qui sotto dicono cio' che il grafico e' davvero.
  | 'board.chart.title'
  | 'board.chart.explained'
  | 'board.chart.how_to_read'
  | 'board.chart.oldest'
  | 'board.chart.newest'
  | 'board.candles.cash.title'
  | 'board.candles.card.title'
  | 'board.candles.explained'
  | 'board.candles.open'
  | 'board.candles.high'
  | 'board.candles.low'
  | 'board.candles.close'
  // La pagina del bancomat (D033, artboard `ATM` del canvas). Le frasi vengono dal disegno, che è
  // in inglese: è la fonte del **contenuto**, non del testo — ognuna entra in tutte e due le
  // lingue, perché la parità è un gate.
  | 'atm.from'
  | 'atm.to'
  | 'atm.note.cash'
  | 'atm.note.card'
  | 'atm.swap'
  | 'atm.amount'
  | 'atm.max'
  // Il minimo e il massimo si **derivano** — dal pavimento della commissione e da
  // `largestThatFits` — invece di essere scritti: il «min €10» del canvas è un numero a mano, e
  // copiarlo spegnerebbe la lezione degli importi rapidi.
  | 'atm.limits'
  | 'atm.breakdown'
  | 'atm.breakdown.aside'
  | 'atm.breakdown.explained'
  | 'atm.refused'
  | 'atm.confirm.note'
  | 'atm.confirm.note.refused'
  | 'atm.fee'
  | 'atm.fee.per_operation'
  | 'atm.fee.rates'
  | 'atm.deposit.confirm'
  | 'atm.withdraw.confirm'
  | 'atm.recent.title'
  | 'atm.card.title'
  | 'atm.cash.note'
  | 'card.back.title'
  | 'card.hint.drag'

/**
 * D029 — `CheatId` entra qui come `Reason`: un cheat è **fatto** della propria etichetta, e
 * `Dictionary` è un `Record` totale, quindi un cheat senza parole in tutte e due le lingue non
 * compila. Le etichette restano nel dizionario di rilascio — sono otto stringhe — ed è il prezzo
 * dichiarato per non avere un secondo dizionario che vive solo in sviluppo e invecchia da solo.
 */
export type MessageKey = Reason | ErrorCode | ScreenKey | CheatId

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
  house: null,
  // Il conto dello Stato (ADR 0052). Non si mostra per la ragione degli altri quattro: è
  // contabilità, non uno strumento, e nessun listino lo offre.
  tax: null
}

/**
 * Se i movimenti di un pool lasciano traccia, detto a parole. È la metà visibile di P4 — la
 * dualità contanti/carta — e sta qui invece che in due componenti perché le due frasi sono le due
 * facce della stessa dichiarazione: `POOLS[pool].traceable`. Scritte in due posti, prima o poi una
 * delle due resterebbe indietro.
 */
export const traceabilityKey = (pool: Pool): MessageKey =>
  POOLS[pool].traceable ? 'pool.traced' : 'pool.untraced'

/**
 * Il codice di un rifiuto, come lo stampa un terminale bancario: `ATM · FEE EXCEEDS AMOUNT`.
 *
 * Il canvas ne disegna quattro scritti a mano — `INVALID AMOUNT`, `CAPACITY EXCEEDED` — e questa
 * funzione li **ricava** dal codice che l'errore porta già con sé, invece di aggiungere al
 * dizionario una seconda etichetta per ogni codice: due nomi per lo stesso rifiuto sono due nomi
 * che prima o poi non coincidono, ed è la forma del difetto A13.
 *
 * **Non si traduce, ed è una scelta**: R12 riguarda le frasi rivolte al giocatore, e la frase c'è
 * — è quella sotto, che `failure` compone. Questo è l'identificativo, e un identificativo che
 * cambia con la lingua non serve a niente a chi lo cerca.
 */
export const refusalCode = (error: GameError): string =>
  error.code
    .split('.')
    .slice(1)
    .map((part) => part.replace(/_/g, ' ').toUpperCase())
    .join(' · ')

/** Le due unità che servono a dire "3 ore e 12 minuti", e non hanno niente a che fare coi tick. */
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

/**
 * `useGrouping: 'always'` non è un vezzo: in italiano CLDR dichiara `minimumGroupingDigits = 2`,
 * quindi 1284,60 esce **senza** separatore e 18.402,15 con — la stessa colonna di importi con due
 * regole diverse a seconda della cifra. I mockup raggruppano sempre, e un gioco finanziario si
 * legge per numeri (P2).
 */
const NUMBERS = {
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
  },
  /**
   * Un tasso, che da D032 è il modo in cui si dice la commissione del bancomat. `style: 'percent'`
   * moltiplica per cento da sé: riceve `0,015` e scrive `1,5%`, quindi il fattore cento non compare
   * da nessuna parte nel nostro codice — che è l'unico posto dove potrebbe sbagliarsi.
   *
   * Una cifra decimale fissa, minima **e** massima: senza la minima `0,02` uscirebbe come «2%» e
   * `0,015` come «1,5%», cioè due tassi accostati nella stessa riga con due forme diverse. È la
   * stessa ragione per cui `useGrouping` è `always` qui sopra.
   */
  rate: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 },
  /**
   * Lo stesso importo **senza il simbolo**: è ciò che sta dentro un campo che si digita, dove il
   * simbolo è già stampato accanto alla casella (D033).
   *
   * Le due cifre decimali sono fisse per la ragione di `rate`, e i separatori sono quelli della
   * lingua accesa — quindi ciò che i pulsanti rapidi scrivono nel campo è esattamente ciò che il
   * giocatore scriverebbe a mano, e `readAmount` lo rilegge in tutte e due le lingue.
   */
  plain: {
    style: 'decimal',
    useGrouping: 'always',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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
    numberFormats: { it: NUMBERS, en: NUMBERS },
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
  /** Un tasso in percentuale. Attraversa lo stesso confine di `money`, e per la stessa ragione. */
  readonly rate: (value: Money) => string
  /** L'importo senza il simbolo: quello che si digita, non quello che si legge. */
  readonly plainMoney: (amount: Money) => string
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

  const rate = (value: Money): string => wording.number(toDisplayNumber(value), 'rate')

  const plainMoney = (amount: Money): string => wording.number(toDisplayNumber(amount), 'plain')

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
      case 'error.payment.unauthorized':
        return text(error.code, { pool: poolName(error.pool) })
      case 'error.income.max_level':
      case 'error.income.already_declared':
      case 'error.vault.max_level':
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

  return {
    text,
    count,
    money,
    signedMoney,
    rate,
    plainMoney,
    instant,
    duration,
    poolName,
    failure
  }
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
