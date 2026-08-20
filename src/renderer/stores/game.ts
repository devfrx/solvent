import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

import type { BoundedList } from '@core/contracts/bounded'
import { boundedList, pushBounded } from '@core/contracts/bounded'
import type { Balances, Transaction } from '@core/contracts/ledger'
import type { Money } from '@core/contracts/money'
import type { Result } from '@core/contracts/result'
import type { SaveError } from '@core/contracts/save'

import { BALANCE } from '@core/balance/constants'
import type { AtmError } from '@core/domains/atm/commands'
import type { IncomeError } from '@core/domains/income/commands'
import { canBuyUpgrade, incomePerSecond, upgradeCost } from '@core/domains/income/rules'
import type { IncomeState } from '@core/domains/income/types'
import type { Milliseconds } from '@core/kernel/Clock'
import { milliseconds } from '@core/kernel/Clock'

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
 * R09 · ADR 0010 — la lista nasce con il suo limite, dichiarato qui dove si legge.
 *
 * **Non entra nel salvataggio**, quindi non entra nel conto di INV-06: è un mirror di ciò che il
 * Bus ha appena detto, e alla riapertura ricomincia vuoto. È anche la ragione per cui il registro
 * YAGNI colloca il primo `boundedList` *salvato* nella fetta 02.
 */
const HISTORY_MAX = 20

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
  const { game, host } = runtimeOrThrow()

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

  const readIncome = (): void => {
    upgrade.value = game.income.state()
    rate.value = incomePerSecond(game.modifiers)
  }

  /**
   * Il prezzo, letto dalla **stessa** funzione che il comando chiama quando paga (D010): non una
   * seconda lettura da tenere allineata.
   *
   * È un `shallowRef` pur non cambiando mai, e la ragione è la stessa dei saldi al contrario: un
   * `Money` esposto nudo da uno store Pinia viene avvolto in un proxy reattivo alla lettura, e da
   * lì in poi non è più il `Decimal` che il dominio ha prodotto.
   */
  const cost = shallowRef<Money>(upgradeCost())

  /**
   * L'anteprima del pulsante. Il saldo che guarda è quello della **carta**, l'unico strumento
   * che `UPGRADE_PAYMENT` accetta (D010): a decidere resta il Ledger quando il comando esegue,
   * e che i due diano la stessa risposta lo verifica un test — perché quando divergono si
   * spegne un pulsante che avrebbe funzionato.
   */
  const purchasable = computed<boolean>(() => canBuyUpgrade(upgrade.value, balances.value.card))

  /** Se l'upgrade è già stato comprato. Alla UI serve il fatto, non lo stato del sistema. */
  const owned = computed<boolean>(() => upgrade.value.upgraded)

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

  /** `Errore → InGioco`: il file illeggibile si cancella solo qui, e solo perché l'utente sceglie. */
  const newGame = async (): Promise<void> => {
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
   * `InGioco → Chiusura`: la finestra è già stata trattenuta da `onClosing`, e si chiude **dopo**
   * che il main ha confermato la scrittura.
   *
   * Se la scrittura fallisce la finestra **non** si chiude: si passa in `failed`, dove la partita
   * è ancora in memoria e ancora salvabile. Chiudere comunque sarebbe comodo e perderebbe l'unica
   * copia esistente, quindi è una scelta esplicita del giocatore: `closeWithoutSaving`.
   */
  const close = async (): Promise<void> => {
    if (status.value === 'closing') return
    status.value = 'closing'
    loop.stop()

    const written = await host.saveApi.save(game.save())
    if (!written.ok) return fail(written.error, 'saving')

    savedAt.value = written.value
    host.close()
  }

  /**
   * L'altra uscita dal salvataggio fallito, e l'unica che perde qualcosa: si chiude sapendo di
   * buttare via i progressi non scritti. Esiste perché la scelta sia del giocatore invece che
   * una conseguenza — la finestra è rimasta aperta apposta per lasciargliela.
   */
  const closeWithoutSaving = (): void => {
    loop.stop()
    host.close()
  }

  /**
   * «Riprova» è una parola sola davanti a due cause diverse: si ricarica se il caricamento è
   * fallito, si riscrive se è fallito il salvataggio. La scelta sta qui e non nel componente,
   * che altrimenti dovrebbe sapere cosa significa ciascuno stato.
   */
  const retry = async (): Promise<void> => {
    if (failedDuring.value !== 'saving') return start()
    // `close` si rifiuta di ripartire da `closing`, e da `failed` non saprebbe cosa fare: si
    // torna nello stato da cui la chiusura era partita, che è anche quello vero — la partita
    // non ha mai smesso di esistere.
    status.value = 'playing'
    return close()
  }

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

  const buyUpgrade = (): Result<IncomeState, IncomeError> => {
    const bought = game.income.buyUpgrade()
    // I saldi li rispecchia l'evento del Ledger; i modificatori no, perché registrarne uno non
    // è un movimento economico e nessuno lo annuncia.
    if (bought.ok) readIncome()
    return bought
  }
  const deposit = (amount: Money): Result<Balances, AtmError> => game.atm.deposit(amount)
  const withdraw = (amount: Money): Result<Balances, AtmError> => game.atm.withdraw(amount)

  return {
    status,
    failure,
    failedDuring,
    awayFor,
    balances,
    history,
    savedAt,
    upgraded: owned,
    incomePerSecond: rate,
    upgradeCost: cost,
    canBuyUpgrade: purchasable,
    start,
    newGame,
    retry,
    close,
    closeWithoutSaving,
    buyUpgrade,
    deposit,
    withdraw,
    isRunning: loop.isRunning
  }
})
