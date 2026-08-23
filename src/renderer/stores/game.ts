import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

import type { BoundedList } from '@core/contracts/bounded'
import { boundedList, pushBounded } from '@core/contracts/bounded'
import type { Cheat, CheatId, CheatResult } from '@core/contracts/cheats'
import type { CommandHandler } from '@core/contracts/commands'
import type { Balances, Posting, Transaction } from '@core/contracts/ledger'
import { netWorthOf } from '@core/contracts/ledger'
import type { Money } from '@core/contracts/money'
import { ZERO } from '@core/contracts/money'
import type { PaymentError, PriceList } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'
import { POOLS, roomIn } from '@core/contracts/pools'
import type { Result } from '@core/contracts/result'
import type { SaveError } from '@core/contracts/save'

import { BALANCE } from '@core/balance/constants'
import type { Card } from '@core/domains/atm/card'
import { authorizes, cardOf } from '@core/domains/atm/card'
import type { AtmError, AtmOperation } from '@core/domains/atm/commands'
import { DEPOSIT, previewOf, WITHDRAW } from '@core/domains/atm/commands'
import { largestThatFits } from '@core/domains/atm/rules'
import type { IncomeError } from '@core/domains/income/commands'
import {
  canBuyUpgrade,
  incomePerSecond,
  upgradePriceFor,
  upgradePrices
} from '@core/domains/income/rules'
import type { IncomeState } from '@core/domains/income/types'
import {
  canExpand,
  expansionPriceFor,
  expansionPrices,
  MAX_LEVEL,
  VAULT_POOL
} from '@core/domains/vault/rules'
import type { VaultError } from '@core/domains/vault/system'
import type { VaultState } from '@core/domains/vault/types'
import type { Cheats } from '@core/kernel/Cheats'
import type { Milliseconds } from '@core/kernel/Clock'
import { clock, milliseconds } from '@core/kernel/Clock'

import type { Candle } from '@renderer/runtime/candles'
import type { Game, GameLoadError } from '@renderer/runtime/createGame'
import type { Host } from '@renderer/runtime/host'
import { createLoop, stepOf } from '@renderer/runtime/loop'

/**
 * L'unico store della fetta, e un **lettore**: riceve dal Bus e rispecchia. Non calcola niente.
 *
 * Se lo store calcolasse, il gioco non sarebbe più simulabile senza Vue e cadrebbe l'ADR 0001 —
 * il test di bilanciamento di D008 gira su `tickAll` e sul Ledger veri, senza che questo file
 * esista. Ciò che sta qui è la macchina a stati di docs/design/ciclo-di-vita.md, il collegamento
 * fra il loop e il Registry, e il mirror.
 *
 * Da D012 espone anche i **selettori**: `incomePerSecond`, `upgradeCost`, `canBuyUpgrade`. Non è
 * un'eccezione alla riga sopra — quei numeri non li calcola questo file, li chiedono alle regole
 * pure del dominio. Passano da qui perché un `.vue` non può importarle (R05), e perché due
 * anteprime che devono coincidere con il comando prima o poi divergono se sono in due posti.
 *
 * Da D015 espone anche quelli del bancomat e del cruscotto. Due sole cose qui dentro fanno
 * dell'aritmetica — il patrimonio netto e l'ordine delle ultime operazioni — e sono presentazione,
 * non gioco: un `.vue` non può sommare (R05), e il registro YAGNI diceva che quel selettore sarebbe
 * nato col pannello che lo consuma. È questo.
 *
 * Da D027 mostra anche le **serie**, e per due deleghe le ha anche tenute: erano l'unica cosa qui
 * dentro che non fosse un mirror — `history` rispecchia ciò che il Bus ha appena detto, mentre una
 * serie decideva **ogni quanto** guardare, cioè calcolava. Da D037 non più: a tenerle è la cronaca
 * della partita, che il tempo alimenta dentro `Game.advance` (ADR 0043), e qui restano tre
 * `shallowRef` che la rispecchiano come i saldi.
 */

/**
 * Gli stati del diagramma, con i nomi in inglese come ogni identificatore (C08). La corrispondenza
 * è uno a uno, e se qui ne nasce un settimo il diagramma cambia nello stesso commit.
 *
 * `startup` Avvio · `loading` Caricamento · `recovering` Recupero · `playing` InGioco
 * `suspended` Sospeso · `failed` Errore · `closing` Chiusura
 */
export type GameStatus =
  'startup' | 'loading' | 'recovering' | 'playing' | 'suspended' | 'failed' | 'closing'

/** Tutto ciò che può mandare la partita in `failed`, da qualunque confine arrivi. */
export type GameFailure = SaveError | GameLoadError

/**
 * `failed` è **uno** stato con due cause, e la via d'uscita non è la stessa: da un caricamento
 * fallito si esce ritentando o iniziando una partita nuova, da un salvataggio finale fallito si
 * esce ritentando o chiudendo lo stesso — e lì la partita è ancora tutta in memoria (D011,
 * correzione 13). Il codice dell'errore non basta a distinguerle: `error.save.io` le produce
 * entrambe.
 */
export type FailurePhase = 'loading' | 'saving'

/**
 * Le due direzioni del bancomat viste dalla UI. Un componente non può nominare `DEPOSIT` e
 * `WITHDRAW`, che vivono in `domains/atm/commands` e sono fuori dalla sua portata (R05, e il lint
 * non distingue un import di tipo): quello che può nominare è una di queste due parole, e la
 * traduzione in operazione la fa questo file.
 *
 * L'elenco è la definizione del tipo, non una copia da tenere allineata: chi disegna i due
 * pulsanti itera **questo**, e una terza direzione comparirebbe a schermo senza che nessuno se ne
 * ricordi.
 */
/**
 * La carta, ri-esportata perché un `.vue` la riceva senza importare un dominio: R05 vieta a un
 * componente le regole e i comandi di un dominio, e la disciplina che ci sta dietro vale anche per
 * gli altri file di quella cartella. È la stessa strada di `AtmOperationKind`, qui sotto.
 */
export type { Card } from '@core/domains/atm/card'

export const ATM_KINDS = ['deposit', 'withdraw'] as const

export type AtmOperationKind = (typeof ATM_KINDS)[number]

/**
 * L'operazione e il comando che le corrisponde, **appaiati una volta sola**. Se anteprima e
 * comando leggessero due tabelle diverse, un giorno il pulsante «Deposita» mostrerebbe l'anteprima
 * di un prelievo: due letture che devono coincidere prima o poi divergono, ed è la stessa ragione
 * per cui `atmFee` è una funzione invece di un numero (D014).
 */
interface AtmDirection {
  readonly operation: AtmOperation
  readonly command: CommandHandler<Money, Balances, AtmError>
}

/**
 * Quante operazioni mostra la pagina del bancomat. Poche righe (ADR 0018): il registro intero è
 * della schermata Statistiche, che ha spazio per tutte e venti.
 */
const RECENT_ON_ATM = 4

/**
 * R09 · ADR 0010 — la lista nasce con il suo limite, dichiarato qui dove si legge.
 *
 * **Non entra nel salvataggio**, quindi non entra nel conto di INV-06: è un mirror di ciò che il
 * Bus ha appena detto, e alla riapertura ricomincia vuoto. È anche la ragione per cui il registro
 * YAGNI colloca il primo `boundedList` *salvato* nella fetta 02.
 */
const HISTORY_MAX = 20

/** Da frazione a percentuale: la barra della capienza si disegna con una larghezza in `%`. */
const FULL_BAR = 100

/**
 * Ciò che lo store non può costruire da sé: il gioco e il browser.
 *
 * Uno store Pinia si definisce senza parametri, quindi il bootstrap li consegna qui prima del
 * primo `useGameStore()`. È una casella sola, tipizzata, riempita una volta — e in cambio ogni
 * test costruisce la propria partita e il proprio finto browser senza montare un'applicazione Vue.
 */
export interface Runtime {
  readonly game: Game
  readonly host: Host
  /**
   * D029 — i cheat di sviluppo, oppure niente. Opzionale e non `Cheats | null` perché un test che
   * non li usa non deve scrivere `cheats: null` per compilare: chi non li consegna non li ha, ed è
   * lo stesso verso di `TransactionMeta.accepts`.
   */
  readonly cheats?: Cheats
}

let provided: Runtime | null = null

export const provideRuntime = (runtime: Runtime): void => {
  provided = runtime
}

const runtimeOrThrow = (): Runtime => {
  if (provided === null) {
    throw new Error('runtime non consegnato: chiamare provideRuntime prima di useGameStore')
  }
  return provided
}

export const useGameStore = defineStore('game', () => {
  const { game, host, cheats } = runtimeOrThrow()

  const status = ref<GameStatus>('startup')
  const failure = ref<GameFailure | null>(null)
  const failedDuring = ref<FailurePhase | null>(null)
  /** Quanto tempo è passato mentre non guardavamo. Lo mostra la schermata di recupero. */
  const awayFor = ref<Milliseconds>(milliseconds(0))
  /**
   * `shallowRef` e non `ref`, e non è un'ottimizzazione: `ref` avvolge in un proxy anche il
   * contenuto, cioè i `Decimal`. Questi due valori vengono **sostituiti interi** a ogni evento e
   * non vengono mai modificati sul posto, quindi la reattività profonda non serve — e in cambio
   * il mirror resta **lo stesso oggetto** che il Ledger ha emesso, invece di una copia proxata.
   */
  const balances = shallowRef<Balances>(game.ctx.ledger.balances())
  const history = shallowRef<BoundedList<Transaction>>(boundedList<Transaction>(HISTORY_MAX))
  const savedAt = ref<number | null>(null)

  /**
   * D037 — le tre serie del cruscotto, **rispecchiate**. A tenerle è la cronaca della partita, che
   * il tempo di gioco alimenta dentro `Game.advance` (`runtime/chronicle.ts`).
   *
   * Fino a D037 le costruiva questo file, con i propri accumulatori: cioè **calcolava**, che è
   * esattamente ciò che la prima riga qui sopra dichiara di non fare. Il prezzo di quella riga
   * scritta e non mantenuta era misurabile — `registry.tickAll` aveva due chiamanti qui dentro e
   * solo uno campionava, quindi riaprire il gioco dopo una notte faceva passare fino a otto ore di
   * gioco senza lasciare un campione né una candela.
   *
   * **Non entrano nel salvataggio**, come `history`, e per una ragione in più: senza il calendario
   * dell'ADR 0023 un campione non sa **quando** è stato preso, quindi due punti affiancati
   * potrebbero distare un tick o otto ore e il grafico li disegnerebbe uguali. Una serie che
   * riparte a ogni avvio dice meno ed è vera; una salvata direbbe di più e mentirebbe. INV-06 non
   * si muove.
   *
   * Sono `shallowRef` come i saldi e per la stessa ragione, che qui vale doppio: `pushBounded`
   * ritorna una lista nuova a ogni chiusura e **la stessa** in mezzo, quindi rileggerle a ogni
   * passo del loop costa un confronto e non sveglia nessuno finché non è successo niente.
   */
  const netWorthSeries = shallowRef<BoundedList<Money>>(game.series.netWorth.list())
  const cashCandles = shallowRef<BoundedList<Candle>>(game.series.cash.list())
  const cardCandles = shallowRef<BoundedList<Candle>>(game.series.card.list())

  /**
   * Il mirror delle serie. Va riletto dove il tempo è passato e dove la partita è cambiata sotto —
   * cioè dopo `advance` e dentro `mirror` — e non a ogni transazione: una serie cambia quando un
   * intervallo si chiude, e a chiudere un intervallo è il tempo.
   */
  const readSeries = (): void => {
    netWorthSeries.value = game.series.netWorth.list()
    cashCandles.value = game.series.cash.list()
    cardCandles.value = game.series.card.list()
  }

  /**
   * I numeri del reddito che la UI mostra e non può calcolare: un `.vue` non importa
   * le regole di un dominio (R05), quindi le chiama lo store e il componente riceve il
   * valore già pronto.
   *
   * Sono un **mirror**, come i saldi, e non delle `computed`: il registro dei modificatori vive
   * in `core/` e non è reattivo (ADR 0001), quindi non c'è niente da osservare. A dire
   * «rileggi» è chi lo cambia — l'acquisto, il caricamento, l'azzeramento — e passa tutto da
   * `readIncome`.
   */
  const upgrade = shallowRef<IncomeState>(game.income.state())
  const rate = shallowRef<Money>(incomePerSecond(game.modifiers))
  /**
   * Quanto dell'ultimo tick non è entrato perché il caveau non lo teneva. È l'unica cosa che dice
   * al giocatore che il reddito si è fermato: un idle in cui i soldi smettono di arrivare **senza
   * dirlo** è un idle rotto, e nessun numero che sale lo racconta — è un numero che *non* sale.
   *
   * Va riletto a ogni passo del loop, e non è un mirror come gli altri: nessun evento lo annuncia,
   * perché il tick che non incassa **non emette niente**. Un `ref` riscritto con lo stesso valore
   * non sveglia nessuno, quindi rileggerlo dieci volte al secondo costa un confronto.
   */
  const withheld = shallowRef<Money>(game.income.withheld())

  const readIncome = (): void => {
    upgrade.value = game.income.state()
    rate.value = incomePerSecond(game.modifiers)
    withheld.value = game.income.withheld()
  }

  /**
   * Il listino dell'upgrade — con quali strumenti si compra, e a che prezzo con ognuno — letto
   * dalla **stessa** funzione che il comando interroga quando paga (INV-19, ADR 0027). Non una
   * seconda tabella da tenere allineata: la stessa, chiamata da due parti.
   *
   * È un `shallowRef` pur non cambiando mai, e qui la ragione vale doppio: un `Money` esposto nudo
   * da uno store Pinia viene avvolto in un proxy reattivo alla lettura, e da lì in poi non è più
   * **lo stesso oggetto** che il dominio ha prodotto — che è esattamente ciò che INV-19 pretende.
   */
  const prices = shallowRef<PriceList>(upgradePrices())

  /**
   * L'anteprima del pulsante, **per strumento**. Il prezzo non lo decide questa funzione: lo prende
   * dal listino, cioè dallo stesso posto da cui lo prende il comando. Un pool che il listino non
   * offre risponde `false`, perché con quello non c'è niente da comprare.
   *
   * È una funzione e non una `computed` perché la domanda ha un argomento. Con un'opzione sola la
   * differenza non si vede; con le due del caveau sì, e allora servirà una risposta per ciascuna.
   *
   * A decidere resta il Ledger quando il comando esegue, e che i due diano la stessa risposta lo
   * verifica un test: quando divergono si spegne un pulsante che avrebbe funzionato.
   */
  const canBuyUpgradeWith = (pool: Pool): boolean => {
    const option = upgradePriceFor(pool)
    return option !== null && canBuyUpgrade(upgrade.value, option, balances.value[pool])
  }

  /**
   * Se **almeno uno** degli strumenti del listino basta. È ciò che smorza il pulsante che apre il
   * flusso del pagamento (D036): la domanda per strumento resta `canBuyUpgradeWith`, e la fa la
   * finestra voce per voce.
   *
   * Sta qui e non nel pannello perché un `.vue` non calcola (R05) — e perché contare le voci di un
   * listino dentro un componente è precisamente la forma che R24 vieta.
   */
  const canAffordUpgrade = computed<boolean>(() =>
    prices.value.some((each) => canBuyUpgradeWith(each.pool))
  )

  /** Se l'upgrade è già stato comprato. Alla UI serve il fatto, non lo stato del sistema. */
  const owned = computed<boolean>(() => upgrade.value.upgraded)

  /**
   * I numeri del bancomat. Tutti costanti per tutta la partita, tutti dentro uno `shallowRef` per
   * la ragione di `cost`: un `Money` esposto **nudo** da uno store Pinia viene proxato alla
   * lettura, e da lì in poi non è più il `Decimal` che il dominio ha prodotto.
   *
   * **`fee` non c'è più, e la sua assenza è la delega D032.** Era un `Money` letto una volta alla
   * costruzione, e funzionava finché la commissione era un importo fisso. Adesso dipende
   * dall'importo e dal verso, quindi non è più un numero che uno store possa tenere: chiederla
   * vuol dire chiedere un'anteprima, ed è ciò che `preview` fa già.
   *
   * Al suo posto ci sono i due **tassi**, che sono l'unica cosa costante rimasta — e si leggono
   * dalle operazioni, non da `BALANCE`. Vedi `feeRates`, più sotto accanto a `directions`.
   */
  const amounts = shallowRef(BALANCE.ATM_AMOUNTS)
  const defaultAmount = shallowRef<Money>(BALANCE.ATM_DEFAULT_AMOUNT)

  /**
   * Il pavimento della commissione (D032). Passa da qui perché un `.vue` non può importare
   * `balance/` (R05), e alla pagina serve per **derivare** il minimo invece di scriverlo: sotto
   * quella cifra la commissione si mangia l'importo, e cambiarla in `constants.ts` cambia la nota
   * a schermo. Il minimo del canvas — «min €10» — è un numero scritto a mano, e questo è il motivo
   * per cui non si copia.
   */
  const feeFloor = shallowRef<Money>(BALANCE.ATM_FEE_FLOOR)

  /**
   * ADR 0042 — la carta di **questa** partita: numero, scadenza e codice, derivati dal seme.
   *
   * È un mirror come gli altri e per la stessa ragione: il seme cambia quando si carica una partita
   * e quando se ne comincia una nuova, e nessuno dei due lo annuncia sul Bus. A rileggerlo è
   * `mirror()`, che entrambi chiamano già — senza, la partita nuova porterebbe la carta di quella
   * buttata via.
   *
   * `shallowRef` come tutto il resto qui dentro: un oggetto nudo esposto da uno store Pinia non
   * esce da `storeToRefs`, e la finestra del pagamento si aprirebbe senza carta — senza un errore
   * e senza un avviso (D029).
   */
  const card = shallowRef<Card>(cardOf(game.ctx.rng.save().seed))

  /**
   * La prova, e l'**unico** posto in cui si verifica: uno strumento non al portatore chiede di
   * dimostrare di averlo in mano prima di pagarci (ADR 0042).
   *
   * Sta qui e non nella finestra perché lì la garanzia sarebbe «si è ricordata di controllare»
   * invece di una proprietà, e chiunque chiamasse il comando la scavalcherebbe — è la decisione 3
   * dell'ADR 0027 applicata alla prova invece che al prezzo. E non sta dentro un dominio perché il
   * codice viene dalla carta, la carta sta in `atm`, e un dominio non ne importa un altro (R19):
   * lo store è il punto che ha entrambi i capi sotto mano (ADR 0024).
   *
   * **È una sola**, chiamata da tutti e due i comandi che spendono: due copie della stessa domanda
   * prima o poi divergono, ed è la ragione per cui `atmFee` è una funzione e non un numero (D014).
   *
   * Il `null` è il sì. Torna **prima** del Ledger, quindi non c'è nessuna transazione da annullare.
   */
  const unauthorized = (pool: Pool, code: string): PaymentError | null =>
    POOLS[pool].bearer || authorizes(card.value, code)
      ? null
      : { code: 'error.payment.unauthorized', pool }

  /**
   * INV-18 — il tetto dei due strumenti, letto dalla **stessa** funzione che il Ledger fa
   * rispettare (ADR 0025). Non una seconda lettura da tenere allineata: la stessa, chiamata da due
   * parti. La carta risponde "illimitato", e per lei è la risposta definitiva.
   *
   * Sono **mirror**, non `computed`, e adesso vale davvero: la capienza del caveau cambia quando
   * il giocatore amplia, e niente in `core/` è reattivo (ADR 0001). Fino a D017 erano letti una
   * volta sola alla costruzione, ed era corretto perché il numero non si muoveva mai — quella riga
   * era una trappola che aspettava questa delega.
   */
  const cashCapacity = shallowRef<Money | null>(null)
  const cardCapacity = shallowRef<Money | null>(game.ctx.ledger.capacities('card'))

  /** Il livello del caveau, e il listino del prossimo ampliamento: **vuoto** all'ultimo livello. */
  const vault = shallowRef<VaultState>(game.vault.state())
  const expansionOptions = shallowRef<PriceList>([])

  /**
   * L'**unico** posto che legge il caveau, e i tre valori si rileggono insieme perché insieme
   * cambiano: ampliare li sposta tutti e tre. I `ref` nascono vuoti e questa funzione li riempie
   * subito — una seconda lettura per inizializzarli sarebbe una seconda lettura da tenere
   * allineata, cioè la forma del difetto che INV-18 esiste per rendere impossibile.
   */
  const readVault = (): void => {
    vault.value = game.vault.state()
    cashCapacity.value = game.ctx.ledger.capacities(VAULT_POOL)
    expansionOptions.value = expansionPrices(vault.value.level)
  }

  readVault()

  /**
   * Quanto spazio resta nel caveau, `null` se non c'è tetto. È una `computed` e non un mirror
   * perché entrambe le sorgenti lo sono già: i saldi arrivano dall'evento del Ledger, la capienza
   * da `readVault`.
   *
   * A rispondere è `roomIn`, cioè la **stessa** funzione da cui il reddito sa quanto accreditare:
   * il numero che il giocatore legge è quello che decide se lo stipendio entra.
   */
  const room = computed<Money | null>(() => roomIn(cashCapacity.value, balances.value[VAULT_POOL]))

  /**
   * «Caveau 1 di 5»: il livello come lo conta il giocatore, non come lo conta un indice.
   *
   * Lo scarto di uno vive qui e non nel template per la regola di sempre — un `.vue` non calcola
   * (R05) — e i due numeri viaggiano insieme perché insieme vanno nella stessa frase. Che i
   * livelli finiscano il giocatore lo vede dal primo secondo: è metà del dominio.
   */
  const progress = computed<{ readonly level: number; readonly total: number }>(() => ({
    level: vault.value.level + 1,
    total: MAX_LEVEL + 1
  }))

  /**
   * Il muro, detto come booleano: non c'è più spazio, e lo stipendio non entra affatto. È diverso
   * da «ne entra una parte», che il giocatore vive in un altro modo — e con un solo messaggio per
   * tutti e due i casi la differenza sparirebbe proprio quando conta.
   */
  const isFull = computed<boolean>(() => room.value !== null && room.value.isZero())

  /**
   * Quanto è pieno il caveau, già in percentuale e già come stringa: è la larghezza della barra.
   *
   * La sottrazione la farebbe anche un template, e proprio per questo sta qui: un `.vue` non
   * calcola (R05), e una percentuale calcolata in due schermate è una percentuale che diverge. Si
   * ferma a cento perché un saldo sopra il tetto — possibile con un salvataggio più vecchio della
   * curva — disegnerebbe una barra fuori dal proprio riquadro.
   */
  const fill = computed<string>(() => {
    const capacity = cashCapacity.value
    if (capacity === null || capacity.isZero()) return `${FULL_BAR}%`
    const share = balances.value[VAULT_POOL].div(capacity).mul(FULL_BAR)
    return `${share.greaterThan(FULL_BAR) ? FULL_BAR : share.toFixed(0)}%`
  })

  /**
   * L'anteprima del pulsante «amplia», **per strumento** — il primo listino a due voci del gioco,
   * e la prima volta che «con cosa paghi» è una domanda vera.
   *
   * Il prezzo non lo decide questa funzione: lo prende dal listino, cioè dallo stesso posto da cui
   * lo prende il comando (INV-19). All'ultimo livello il listino è vuoto e la risposta è `false`
   * per chiunque, perché non c'è niente da comprare.
   */
  const canExpandWith = (pool: Pool): boolean => {
    const option = expansionPriceFor(vault.value.level, pool)
    return option !== null && canExpand(vault.value, option, balances.value[pool])
  }

  /** Come `canAffordUpgrade`, per l'ampliamento: almeno uno dei due strumenti ci arriva. */
  const canAffordExpansion = computed<boolean>(() =>
    expansionOptions.value.some((each) => canExpandWith(each.pool))
  )

  /**
   * Se il caveau è arrivato in fondo, detto come booleano. Il listino vuoto **è** la risposta
   * (`expansionPrices`), e chi disegna non deve contarne le voci per scoprirlo.
   */
  const atMax = computed<boolean>(() => expansionOptions.value.length === 0)

  const expandVault = (pool: Pool, code: string): Result<VaultState, VaultError | PaymentError> => {
    const refused = unauthorized(pool, code)
    if (refused !== null) return { ok: false, error: refused }

    const expanded = game.vault.expand(pool)
    // I saldi li rispecchia l'evento del Ledger; la capienza no, perché ampliare non è un
    // movimento economico e nessuno lo annuncia. È la stessa trappola dei modificatori (D011).
    if (expanded.ok) readVault()
    return expanded
  }

  const directions: Readonly<Record<AtmOperationKind, AtmDirection>> = {
    deposit: { operation: DEPOSIT, command: game.atm.deposit },
    withdraw: { operation: WITHDRAW, command: game.atm.withdraw }
  }

  /**
   * I due tassi della commissione, per direzione (D032). Si leggono **dalle operazioni**, che sono
   * le stesse che `preview` e `confirm` usano: `BALANCE.ATM_FEE_RATE_IN` scritto qui sarebbe una
   * seconda lettura dello stesso numero di gioco, cioè il difetto A04 con un altro nome.
   *
   * Sono l'unica cosa del bancomat che resti un numero fisso, e servono a una cosa sola: la carta
   * dichiara sul retro cosa costa usarla. Quanto costa **questa** operazione lo dice l'anteprima,
   * e non si ricava da qui.
   */
  const feeRates = shallowRef<Readonly<Record<AtmOperationKind, Money>>>({
    deposit: directions.deposit.operation.feeRate,
    withdraw: directions.withdraw.operation.feeRate
  })

  /**
   * I due strumenti che ciascuna direzione muove: da dove parte il denaro e dove arriva.
   *
   * Derivato da `directions` esattamente come `feeRates` qui sopra, e nato dallo stesso difetto
   * (D035, punto 7). La pagina del bancomat si era riscritta questa tabella in una costante sua,
   * perché R05 le impedisce di importare `domains/atm/commands` — nemmeno per un tipo. Due
   * dichiarazioni dello stesso fatto e **niente** che le legasse: divergendo, la pagina avrebbe
   * mostrato due strumenti in alto e i movimenti di altri due sotto, nello stesso riquadro, con
   * ogni test verde — INV-11 lega l'anteprima al comando, non l'anteprima a ciò che le sta sopra.
   *
   * La radice non era distrazione: era un'API di modulo incompleta. Mancava questo selettore, e
   * il componente ha fatto l'unica cosa che poteva.
   *
   * **Non è uno `shallowRef`**, e la differenza dai vicini sta nella ragione, non nella forma:
   * quelli avvolgono un `Money`, che Pinia proxerebbe alla lettura. Qui ci sono due stringhe, e
   * un valore che non cambia per tutta la partita.
   */
  const sides: Readonly<Record<AtmOperationKind, { readonly from: Pool; readonly to: Pool }>> = {
    deposit: { from: directions.deposit.operation.from, to: directions.deposit.operation.to },
    withdraw: { from: directions.withdraw.operation.from, to: directions.withdraw.operation.to }
  }

  /**
   * Il più grande importo che **passa**, per direzione: è ciò che il pulsante `MAX` propone, e la
   * seconda metà della nota «minimo · massimo».
   *
   * A rispondere è `largestThatFits`, la gemella di `fitsIn` (D033): questo file non fa la
   * sottrazione, la consegna soltanto — il tetto della destinazione, quanto ci sta già dentro, il
   * tasso del verso e quanto c'è alla partenza. Il bancomat non conosce il caveau, e chi ha
   * entrambi i capi sotto mano è lo store (ADR 0024).
   *
   * È una `computed`, e le sue sorgenti devono essere **reattive**: i saldi lo sono per l'evento
   * del Ledger, il tetto del caveau per `readVault`. Chiederlo al Ledger come fa `preview` sarebbe
   * corretto una volta sola — `preview` risponde a un gesto, questa alimenta una riga che sta a
   * schermo mentre il caveau si riempie.
   */
  const maximums = computed<Readonly<Record<AtmOperationKind, Money>>>(() => {
    const current = balances.value
    const largestFor = (kind: AtmOperationKind): Money => {
      const { operation } = directions[kind]
      return largestThatFits(
        operation.to === VAULT_POOL ? cashCapacity.value : cardCapacity.value,
        current[operation.to],
        operation.feeRate,
        current[operation.from]
      )
    }

    return { deposit: largestFor('deposit'), withdraw: largestFor('withdraw') }
  })

  /**
   * INV-11 nella sua forma più forte: l'anteprima **è** l'operazione. Questa funzione non calcola
   * niente e non conosce la commissione — chiama `previewOf`, che costruisce i movimenti che il
   * comando applicherà. Non due elenchi da tenere allineati: uno solo.
   *
   * Ritorna un `Result` perché l'anteprima sa già dire di no, e allora la UI mostra il codice
   * tradotto invece di spegnere un pulsante (ADR 0018).
   */
  const preview = (kind: AtmOperationKind, amount: Money): Result<readonly Posting[], AtmError> => {
    const { operation } = directions[kind]
    // Il pool in arrivo, con il suo tetto e il suo saldo. Il bancomat non conosce il caveau: a
    // consegnarglielo è questo file, che ha entrambi sotto mano (D017).
    return previewOf(operation, amount, {
      capacity: game.ctx.ledger.capacities(operation.to),
      current: balances.value[operation.to]
    })
  }

  /** L'altra metà della coppia, dalla stessa riga della tabella: qui il denaro si muove davvero. */
  const confirm = (kind: AtmOperationKind, amount: Money): Result<Balances, AtmError> =>
    directions[kind].command(amount)

  /**
   * I numeri del cruscotto, e sono **saldi letti**, non contatori tenuti da qualcuno: la partita
   * doppia li ha già contati tutti (ADR 0020). Quanto è entrato nel gioco sta in `world` col segno
   * opposto, quanto è uscito in `sink`, quanto è stato trattenuto in `fees` — tre conti che la UI
   * non nomina mai e non vede mai (ADR 0017), ma il cui saldo è esattamente la domanda che il
   * giocatore si fa.
   *
   * Sono `computed` e non mirror, e la differenza conta: qui la sorgente è `balances`, che un
   * evento sostituisce intero a ogni transazione. Il registro dei modificatori, che nessun evento
   * annuncia, resta un mirror (`readIncome`).
   *
   * I tre reggono un'identità che vale la pena conoscere: `earned - spent - feesPaid` è
   * `netWorth`, sempre, ed è INV-08 vista dal cruscotto.
   */
  // A sommare è `netWorthOf`, che vive nel contratto del Ledger: da D037 la **stessa** funzione
  // risponde a questo riquadro e alla serie che ne registra l'andamento. Due somme dello stesso
  // patrimonio sono due patrimoni, ed è la trappola già chiusa per la commissione del bancomat e
  // per la capienza del caveau.
  const netWorth = computed<Money>(() => netWorthOf(balances.value))
  // `ZERO.minus(...)` e non `.neg()`: l'opposto di zero, in decimal.js come in JavaScript, è
  // **meno zero** — e una partita appena nata mostrerebbe «-0,00 €» sul primo riquadro.
  const earned = computed<Money>(() => ZERO.minus(balances.value.world))
  const spent = computed<Money>(() => balances.value.sink)
  const feesPaid = computed<Money>(() => balances.value.fees)

  /**
   * Le operazioni dalla più recente: un estratto conto si legge dall'alto, e `pushBounded` accoda
   * in fondo. Il bancomat ne mostra poche, la schermata Statistiche tutte quelle che ci sono.
   */
  const operations = computed<readonly Transaction[]>(() => [...history.value.items].reverse())
  const recentOperations = computed<readonly Transaction[]>(() =>
    operations.value.slice(0, RECENT_ON_ATM)
  )

  /**
   * Il mirror. `balances` arriva già completo e coerente dentro l'evento: il Ledger lo emette una
   * volta sola, dopo che tutti i saldi sono cambiati (ADR 0019), quindi qui non c'è niente da
   * ricomporre e niente da sommare.
   */
  game.ctx.bus.on('money.posted', (posted) => {
    balances.value = posted.balances
    history.value = pushBounded(history.value, posted.transaction)
    // Le escursioni in corso non si aggiornano qui: da D037 è la cronaca a iscriversi a questo
    // evento, dentro `runtime/chronicle.ts`. Una serie alimentata da una riga scritta qui sarebbe
    // di nuovo una cosa da ricordarsi, e questo store ne ha già dimenticata una.
  })

  /** Caricare non è un movimento economico, quindi non emette: il mirror va riletto a mano. */
  const mirror = (): void => {
    balances.value = game.ctx.ledger.balances()
    card.value = cardOf(game.ctx.rng.save().seed)
    readIncome()
    readVault()
    readSeries()
  }

  const fail = (cause: GameFailure, phase: FailurePhase): void => {
    failure.value = cause
    failedDuring.value = phase
    status.value = 'failed'
  }

  const loop = createLoop({
    clock: game.ctx.clock,
    cap: BALANCE.RECOVERY_CAP,
    now: host.now,
    schedule: host.schedule,
    onStep: (step) => {
      // Il tempo di gioco avanza **qui e nel recupero**, e da D037 le due strade sono la stessa
      // funzione: `advance` ticchetta i sistemi e poi fa passare lo stesso `elapsed` sulla cronaca
      // (ADR 0043). Finché erano due sequenze scritte a mano, una delle due registrava e l'altra no.
      game.advance(step.elapsed)

      // Un tick che non incassa **non emette niente**, quindi nessun evento porta questa notizia:
      // è l'unico mirror che va riletto a ogni passo. Con il caveau che ha spazio è `ZERO` contro
      // `ZERO`, cioè lo stesso oggetto, e il `ref` non sveglia nessuno.
      withheld.value = game.income.withheld()
      readSeries()

      // Il primo frame dopo il ritorno dal nascondimento porta con sé tutto il tempo passato: è
      // quello che chiude `Recupero`, e non c'è un secondo percorso che lo faccia.
      if (status.value === 'recovering') status.value = 'playing'
    }
  })

  const play = (): void => {
    status.value = 'playing'
    loop.start()
  }

  /**
   * `Caricamento → Recupero`: i tick arretrati sono un `advance` con un `n` grande, limitato dal
   * tetto. La regola che decide `n` è **la stessa** del loop (`stepOf`), non una formula offline
   * scritta a parte — che è la fonte classica di exploit negli idle game (ADR 0009).
   *
   * E da D037 anche **ciò che fa quel passo** è lo stesso: fino ad allora questa riga chiamava
   * `registry.tickAll` per conto proprio, quindi una notte intera passava senza lasciare un
   * campione né una candela. Adesso ne lascia esattamente uno per serie, che è ciò che `sampleOf`
   * prometteva già in `loop.ts`: di saldi intermedi non ce n'è nessuno da disegnare, perché il
   * reddito arretrato entra in una transazione sola.
   */
  const recover = (since: number): void => {
    status.value = 'recovering'
    const away = milliseconds(Math.max(0, host.wallClock() - since))
    awayFor.value = away
    const step = stepOf(away, BALANCE.RECOVERY_CAP, game.ctx.clock)
    if (step.elapsed > 0) game.advance(step.elapsed)
    mirror()
  }

  /**
   * L'avvio, e l'unico posto da cui si entra in partita. Il loop **non** parte prima che il
   * caricamento sia finito: un tick su uno stato mezzo caricato produce numeri sbagliati che poi
   * vengono salvati come veri.
   */
  const start = async (): Promise<void> => {
    if (status.value !== 'startup' && status.value !== 'failed') return
    status.value = 'loading'
    failure.value = null
    failedDuring.value = null

    const loaded = await host.saveApi.load()
    if (!loaded.ok) return fail(loaded.error, 'loading')

    // Il file assente non è un errore: è una partita nuova (ADR 0004).
    if (!loaded.value.present) return play()

    const applied = game.load(loaded.value.payload)
    if (!applied.ok) return fail(applied.error, 'loading')

    savedAt.value = loaded.value.savedAt
    mirror()
    recover(loaded.value.savedAt)
    play()
  }

  /**
   * `Errore → Caricamento → InGioco`: il file illeggibile si cancella solo qui, e solo perché
   * l'utente sceglie.
   *
   * Si passa da `loading` invece di restare in `failed` con un `failure` già azzerato: quella
   * combinazione non sta nel diagramma, e il guscio — che rende la schermata d'errore su
   * `failed && failure !== null` — cadeva nel ramo finale mostrando comunque il caricamento. Ora
   * è lo stato a dirlo, invece di essere il guscio a indovinarlo.
   */
  const newGame = async (): Promise<void> => {
    status.value = 'loading'
    // Le serie sono di **questa** partita, e ad azzerarle è `game.reset` insieme a tutto il resto
    // (`chronicle.ts`): tenerle farebbe cominciare i grafici della partita nuova con il patrimonio
    // di quella buttata via, cioè con la sua scala. Sei righe scritte qui erano sei righe da
    // ricordarsi, che è la forma esatta del difetto A01 — le liste parallele mantenute a mano.
    game.reset('hard')
    history.value = boundedList<Transaction>(HISTORY_MAX)
    savedAt.value = null
    failure.value = null
    failedDuring.value = null
    awayFor.value = milliseconds(0)
    mirror()

    const cleared = await host.saveApi.reset()
    if (!cleared.ok) return fail(cleared.error, 'loading')
    play()
  }

  /**
   * Chiudere **senza** scrivere. Ci si arriva da due strade, e fanno lo stesso gesto: il giocatore
   * sceglie di perdere i progressi non salvati, oppure non c'è nessuna partita da salvare
   * (INV-17). La prima è una scelta e ha un pulsante suo — la finestra è rimasta aperta apposta
   * per lasciargliela; la seconda non si vede, perché non c'è niente da decidere.
   */
  const closeWithoutSaving = (): void => {
    loop.stop()
    host.close()
  }

  /**
   * INV-17 — se il `Game` in memoria è la partita **vera**, cioè l'unica da cui valga la pena
   * scrivere.
   *
   * In `startup`, in `loading` e in `failed` per un **caricamento** il gioco non è mai stato
   * caricato: quello che c'è in memoria è una partita nuova, azzerata, che non rappresenta
   * nessuno. Scriverla sul disco cancellerebbe il salvataggio del giocatore — proprio mentre la
   * schermata d'errore gli sta promettendo che il file non è stato toccato.
   *
   * `failed` per un **salvataggio** invece è autoritativo, e per la ragione opposta: lì la partita
   * è tutta in memoria e non è mai arrivata sul disco. È lo stesso stato da cui riparte `retry`.
   */
  const isAuthoritative = (): boolean =>
    status.value === 'playing' ||
    status.value === 'suspended' ||
    status.value === 'recovering' ||
    (status.value === 'failed' && failedDuring.value === 'saving')

  /**
   * `InGioco → Chiusura`: la finestra è già stata trattenuta da `onClosing`, e si chiude **dopo**
   * che il main ha confermato la scrittura.
   *
   * Se la scrittura fallisce la finestra **non** si chiude: si passa in `failed`, dove la partita
   * è ancora in memoria e ancora salvabile. Chiudere comunque sarebbe comodo e perderebbe l'unica
   * copia esistente, quindi è una scelta esplicita del giocatore: `closeWithoutSaving`.
   *
   * La precondizione sta qui e non in `onClosing`: è questa funzione l'unica che sa **cosa** sta
   * per scrivere, e una guardia messa in chi la chiama sarebbe la stessa omissione spostata di un
   * file — il giorno in cui un secondo chiamante compare, la guardia non lo copre.
   */
  const close = async (): Promise<void> => {
    if (status.value === 'closing') return
    if (!isAuthoritative()) return closeWithoutSaving()

    status.value = 'closing'
    loop.stop()

    const written = await host.saveApi.save(game.save())
    if (!written.ok) return fail(written.error, 'saving')

    savedAt.value = written.value
    host.close()
  }

  /**
   * «Riprova» è una parola sola davanti a due cause diverse: si ricarica se il caricamento è
   * fallito, si riscrive se è fallito il salvataggio. La scelta sta qui e non nel componente,
   * che altrimenti dovrebbe sapere cosa significa ciascuno stato.
   *
   * Il secondo ramo è `close()` e basta: da `failed` per un salvataggio la partita in memoria è
   * quella vera, e adesso a saperlo è `isAuthoritative` invece di una riga che riportava lo stato
   * a `playing` per convincere `close` a scrivere.
   */
  const retry = async (): Promise<void> => (failedDuring.value === 'saving' ? close() : start())

  /**
   * `InGioco → Sospeso → Recupero`. Il loop **non** si ferma: a finestra nascosta il browser
   * semplicemente non chiama il frame, e al ritorno il delta copre tutto il tempo passato. Un solo
   * meccanismo per le due situazioni che sono la stessa cosa — *è passato del tempo mentre non
   * guardavamo*.
   */
  /** L'ora del mondo in cui la finestra è sparita: senza, `Recupero` non sa quanto dire. */
  let hiddenAt: number | null = null

  host.onVisibilityChange((visible) => {
    if (!visible) {
      if (status.value === 'playing') {
        hiddenAt = host.wallClock()
        status.value = 'suspended'
      }
      return
    }
    if (status.value !== 'suspended') return
    awayFor.value = milliseconds(Math.max(0, host.wallClock() - (hiddenAt ?? host.wallClock())))
    hiddenAt = null
    status.value = 'recovering'
  })

  host.onClosing(() => {
    void close()
  })

  const buyUpgrade = (
    pool: Pool,
    code: string
  ): Result<IncomeState, IncomeError | PaymentError> => {
    const refused = unauthorized(pool, code)
    if (refused !== null) return { ok: false, error: refused }

    const bought = game.income.buyUpgrade(pool)
    // I saldi li rispecchia l'evento del Ledger; i modificatori no, perché registrarne uno non
    // è un movimento economico e nessuno lo annuncia.
    if (bought.ok) readIncome()
    return bought
  }

  /**
   * D029 — eseguire un cheat, e rispecchiare ciò che il Ledger non annuncia.
   *
   * I saldi arrivano da soli con `money.posted`; il livello del caveau e il potenziamento del
   * reddito no, perché caricare uno stato non è un movimento economico e nessuno lo dice — è la
   * stessa trappola di `expandVault` e di `buyUpgrade`. Rileggerli entrambi dopo **qualunque**
   * cheat costa due letture e toglie la classe di difetto in cui il pannello funziona e lo schermo
   * resta indietro.
   *
   * Il rifiuto torna al chiamante invece di essere ingoiato: un cheat che dice di no ha le stesse
   * ragioni di un comando di gioco, e vederle è metà del motivo per cui il pannello esiste.
   */
  const runCheat = (id: CheatId, amount?: Money): CheatResult => {
    if (cheats === undefined) throw new Error('nessun cheat consegnato a questo runtime')
    const done = cheats.run(id, amount)
    readVault()
    readIncome()
    return done
  }

  /**
   * L'elenco dei cheat, vuoto fuori dallo sviluppo: è ciò che decide se il pannello ha qualcosa da
   * disegnare.
   *
   * `computed` e non un array nudo, ed è costato una prova a schermo: `storeToRefs` estrae **solo**
   * ciò che è un `ref` o un `computed`, quindi un array normale esce `undefined` e il `v-for` non
   * disegna niente — senza un errore, senza un avviso, con il pannello che si apre vuoto. Il valore
   * non cambia mai durante una partita, il che è esattamente ciò che rendeva l'array nudo
   * plausibile.
   */
  const devCheats = computed<readonly Cheat[]>(() => cheats?.all() ?? [])

  return {
    devCheats,
    runCheat,
    status,
    failure,
    failedDuring,
    awayFor,
    balances,
    history,
    savedAt,
    upgraded: owned,
    incomePerSecond: rate,
    upgradePrices: prices,
    canBuyUpgradeWith,
    canAffordUpgrade,
    atmFeeRates: feeRates,
    atmSides: sides,
    atmAmounts: amounts,
    atmDefaultAmount: defaultAmount,
    atmFeeFloor: feeFloor,
    card,
    atmMaximums: maximums,
    cashCapacity,
    cardCapacity,
    vaultProgress: progress,
    vaultRoom: room,
    vaultFill: fill,
    vaultIsFull: isFull,
    expansionPrices: expansionOptions,
    canExpandWith,
    canAffordExpansion,
    vaultAtMax: atMax,
    expandVault,
    incomeWithheld: withheld,
    preview,
    confirm,
    netWorth,
    earned,
    spent,
    feesPaid,
    operations,
    recentOperations,
    netWorthSeries,
    /**
     * Ogni quanti secondi di gioco la serie prende un campione. Il grafico lo **dice** al
     * giocatore, perché senza quel numero non sa quanto larga è la finestra che sta guardando.
     *
     * È un numero nudo e non un `ref`: non cambia mai durante una partita, e avvolgerlo
     * suggerirebbe il contrario. Passa da qui perché un `.vue` non può importare né `balance/` né
     * il Clock (R05), e sono i due che servono a rispondere.
     */
    netWorthSampleSeconds: clock.ticksToSeconds(BALANCE.NET_WORTH_SAMPLE_EVERY),
    cashCandles,
    cardCandles,
    /** Quanto dura un intervallo di candela, in secondi di gioco, e per la ragione qui sopra. */
    instrumentCandleSeconds: clock.ticksToSeconds(BALANCE.INSTRUMENT_CANDLE_EVERY),
    start,
    newGame,
    retry,
    close,
    closeWithoutSaving,
    buyUpgrade,
    isRunning: loop.isRunning
  }
})
