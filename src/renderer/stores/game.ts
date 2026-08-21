import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

import type { BoundedList } from '@core/contracts/bounded'
import { boundedList, pushBounded } from '@core/contracts/bounded'
import type { Cheat, CheatId, CheatResult } from '@core/contracts/cheats'
import type { CommandHandler } from '@core/contracts/commands'
import type { Balances, Posting, Transaction } from '@core/contracts/ledger'
import type { Money } from '@core/contracts/money'
import { ZERO } from '@core/contracts/money'
import type { PriceList } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'
import { POOL_IDS, POOLS, roomIn } from '@core/contracts/pools'
import type { Result } from '@core/contracts/result'
import type { SaveError } from '@core/contracts/save'

import { BALANCE } from '@core/balance/constants'
import type { AtmError, AtmOperation } from '@core/domains/atm/commands'
import { DEPOSIT, previewOf, WITHDRAW } from '@core/domains/atm/commands'
import { atmFee } from '@core/domains/atm/rules'
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
import type { Milliseconds, Ticks } from '@core/kernel/Clock'
import { clock, milliseconds, ticks } from '@core/kernel/Clock'

import type { Game, GameLoadError } from '@renderer/runtime/createGame'
import type { Host } from '@renderer/runtime/host'
import { createLoop, sampleOf, stepOf } from '@renderer/runtime/loop'

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
 * Da D027 tiene anche la **serie** del patrimonio netto, ed è la prima lista di questo file che non
 * è un mirror: `history` rispecchia ciò che il Bus ha appena detto, `netWorthSeries` decide **ogni
 * quanto** guardare. La regola che lo decide è pura e sta in `runtime/loop.ts`, accanto a quella
 * che trasforma i frame in tick — è lo stesso accumulatore un piano più su.
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
export const ATM_KINDS = ['deposit', 'withdraw'] as const

export type AtmOperationKind = (typeof ATM_KINDS)[number]

/**
 * L'operazione e il comando che le corrisponde, **appaiati una volta sola**. Se anteprima e
 * comando leggessero due tabelle diverse, un giorno il pulsante «Deposita» mostrerebbe l'anteprima
 * di un prelievo: due letture che devono coincidere prima o poi divergono, ed è la stessa ragione
 * per cui `atmFee()` è una funzione invece di un numero (D014).
 */
interface AtmDirection {
  readonly operation: AtmOperation
  readonly command: CommandHandler<Money, Balances, AtmError>
}

/**
 * Quante operazioni mostra la home. Poche righe (ADR 0018): il registro intero è della schermata
 * Statistiche, che ha spazio per tutte e venti.
 */
const RECENT_ON_HOME = 4

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
   * D027 — la serie del patrimonio netto, cioè **lo stesso numero** che il riquadro del cruscotto
   * mostra, preso a intervalli regolari.
   *
   * Un campione è un `Money` e non l'intero `Balances`, ed è la conseguenza di una decisione di
   * disegno: il grafico ha una scala che si adatta alla finestra, e su una scala che taglia il
   * fondo una barra impilata direbbe una bugia sulla composizione (`components/shell/series.ts`).
   * Tenere qui i sei saldi per disegnarne uno solo sarebbe conservare per un grafico che non
   * esiste.
   *
   * A sommare è `netWorth`, la **stessa** `computed` che il riquadro legge: due somme del
   * patrimonio in due punti sono due patrimoni, ed è la trappola che questo progetto ha già chiuso
   * per la commissione del bancomat e per la capienza del caveau.
   *
   * **Non entra nel salvataggio**, come `history`, e per una ragione in più: senza il calendario
   * dell'ADR 0023 un campione non sa **quando** è stato preso, quindi due barre affiancate
   * potrebbero distare un tick o otto ore e il grafico le disegnerebbe uguali. Una serie che
   * riparte a ogni avvio dice meno ed è vera; una salvata direbbe di più e mentirebbe. Il giorno in
   * cui il calendario esiste, questa riga è il primo posto da rileggere — e allora l'ADR 0010 avrà
   * il suo meccanismo intero.
   */
  const netWorthSeries = shallowRef<BoundedList<Money>>(
    boundedList<Money>(BALANCE.NET_WORTH_SAMPLES)
  )

  /**
   * Quanti tick sono passati dall'ultimo campione. È l'accumulatore di `sampleOf`, e vive qui come
   * `hiddenAt`: un valore che nessuna schermata guarda non ha ragione di essere reattivo.
   */
  let sinceSample: Ticks = ticks(0)

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

  /** Se l'upgrade è già stato comprato. Alla UI serve il fatto, non lo stato del sistema. */
  const owned = computed<boolean>(() => upgrade.value.upgraded)

  /**
   * I numeri del bancomat. Tutti costanti per tutta la partita, tutti dentro uno `shallowRef` per
   * la ragione di `cost`: un `Money` esposto **nudo** da uno store Pinia viene proxato alla
   * lettura, e da lì in poi non è più il `Decimal` che il dominio ha prodotto.
   *
   * `fee` non è il 2,50 copiato dal mockup: è `atmFee()`, la stessa funzione che l'anteprima e il
   * comando leggono. Due letture della commissione sarebbero due commissioni.
   */
  const fee = shallowRef<Money>(atmFee())
  const amounts = shallowRef(BALANCE.ATM_AMOUNTS)
  const defaultAmount = shallowRef<Money>(BALANCE.ATM_DEFAULT_AMOUNT)

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

  const expandVault = (pool: Pool): Result<VaultState, VaultError> => {
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
  const netWorth = computed<Money>(() =>
    POOL_IDS.filter((pool) => POOLS[pool].player).reduce(
      (total, pool) => total.plus(balances.value[pool]),
      ZERO
    )
  )
  // `ZERO.minus(...)` e non `.neg()`: l'opposto di zero, in decimal.js come in JavaScript, è
  // **meno zero** — e una partita appena nata mostrerebbe «-0,00 €» sul primo riquadro.
  const earned = computed<Money>(() => ZERO.minus(balances.value.world))
  const spent = computed<Money>(() => balances.value.sink)
  const feesPaid = computed<Money>(() => balances.value.fees)

  /**
   * Le operazioni dalla più recente: un estratto conto si legge dall'alto, e `pushBounded` accoda
   * in fondo. La home ne mostra poche, la schermata Statistiche tutte quelle che ci sono.
   */
  const operations = computed<readonly Transaction[]>(() => [...history.value.items].reverse())
  const recentOperations = computed<readonly Transaction[]>(() =>
    operations.value.slice(0, RECENT_ON_HOME)
  )

  /**
   * Il mirror. `balances` arriva già completo e coerente dentro l'evento: il Ledger lo emette una
   * volta sola, dopo che tutti i saldi sono cambiati (ADR 0019), quindi qui non c'è niente da
   * ricomporre e niente da sommare.
   */
  game.ctx.bus.on('money.posted', (posted) => {
    balances.value = posted.balances
    history.value = pushBounded(history.value, posted.transaction)
  })

  /** Caricare non è un movimento economico, quindi non emette: il mirror va riletto a mano. */
  const mirror = (): void => {
    balances.value = game.ctx.ledger.balances()
    readIncome()
    readVault()
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
      game.registry.tickAll(game.ctx, step.elapsed)
      // Un tick che non incassa **non emette niente**, quindi nessun evento porta questa notizia:
      // è l'unico mirror che va riletto a ogni passo. Con il caveau che ha spazio è `ZERO` contro
      // `ZERO`, cioè lo stesso oggetto, e il `ref` non sveglia nessuno.
      withheld.value = game.income.withheld()

      // Il campione si prende **dopo** il tick, quindi porta i saldi che il tick ha appena
      // prodotto: l'evento del Ledger è già passato di qui sopra, perché il Bus è sincrono
      // (ADR 0016). Prenderlo prima disegnerebbe sempre il gioco di un passo fa.
      const sampling = sampleOf(sinceSample, step.elapsed, BALANCE.NET_WORTH_SAMPLE_EVERY)
      sinceSample = sampling.pending
      if (sampling.due) netWorthSeries.value = pushBounded(netWorthSeries.value, netWorth.value)

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
   * `Caricamento → Recupero`: i tick arretrati sono `tickAll` con un `n` grande, limitato dal
   * tetto. La regola che decide `n` è **la stessa** del loop (`stepOf`), non una formula offline
   * scritta a parte — che è la fonte classica di exploit negli idle game (ADR 0009).
   */
  const recover = (since: number): void => {
    status.value = 'recovering'
    const away = milliseconds(Math.max(0, host.wallClock() - since))
    awayFor.value = away
    const step = stepOf(away, BALANCE.RECOVERY_CAP, game.ctx.clock)
    if (step.elapsed > 0) game.registry.tickAll(game.ctx, step.elapsed)
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
    game.reset('hard')
    history.value = boundedList<Transaction>(HISTORY_MAX)
    // La serie è di **questa** partita: tenerla farebbe cominciare il grafico della partita nuova
    // con il patrimonio di quella buttata via, cioè con la sua scala.
    netWorthSeries.value = boundedList<Money>(BALANCE.NET_WORTH_SAMPLES)
    sinceSample = ticks(0)
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

  const buyUpgrade = (pool: Pool): Result<IncomeState, IncomeError> => {
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
    atmFee: fee,
    atmAmounts: amounts,
    atmDefaultAmount: defaultAmount,
    cashCapacity,
    cardCapacity,
    vaultProgress: progress,
    vaultRoom: room,
    vaultFill: fill,
    vaultIsFull: isFull,
    expansionPrices: expansionOptions,
    canExpandWith,
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
    start,
    newGame,
    retry,
    close,
    closeWithoutSaving,
    buyUpgrade,
    isRunning: loop.isRunning
  }
})
