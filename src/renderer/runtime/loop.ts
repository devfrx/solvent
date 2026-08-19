import type { Clock, Milliseconds, Ticks } from '@core/kernel/Clock'
import { milliseconds, ticks } from '@core/kernel/Clock'

/**
 * ADR 0009 — dal frame al tick. Il browser chiama a ~60 Hz, la simulazione avanza a 10 Hz, e
 * l'accumulatore fa da cuscinetto fra le due frequenze (docs/design/flusso-tick.md).
 *
 * Niente qui dentro tocca il browser: `now` e `schedule` arrivano per costruzione. È ciò che
 * permette di far scorrere il tempo a mano in un test e contare i tick uno per uno — che è il
 * solo modo di accorgersi dell'accumulatore che perde il resto, difetto invisibile a occhio e
 * impossibile da diagnosticare dopo.
 */

/** Quanti tick eseguire adesso, cosa resta nell'accumulatore, e cosa il tetto ha buttato via. */
export interface Step {
  readonly elapsed: Ticks
  readonly pending: Milliseconds
  /** Tick reali che il tetto ha scartato: è ciò che distingue un recupero da un tick normale. */
  readonly dropped: Ticks
}

const NOTHING: Ticks = ticks(0)

/**
 * La regola dell'accumulatore, pura. Riceve il tempo accumulato e ritorna il verdetto: nessun
 * effetto, nessun `now`, nessuno stato.
 *
 * **Il resto non si scarta e non si arrotonda**: torna in `pending` e verrà sommato al frame
 * successivo. Buttarlo via costa qualche percento di reddito al minuto, in modo che nessuno
 * noterebbe se non contando i tick.
 */
export const stepOf = (accumulated: Milliseconds, cap: Ticks, clock: Clock): Step => {
  const tickDuration = clock.ticksToMilliseconds(ticks(1))

  // Un orologio che torna indietro non è un caso teorico: un aggiustamento dell'ora di sistema
  // produce un delta negativo, e `Math.floor` lo trasformerebbe in un numero di tick **negativo**
  // — cioè in reddito al contrario. Sotto la durata di un tick non c'è niente da fare comunque.
  if (accumulated < tickDuration) {
    return { elapsed: NOTHING, pending: milliseconds(Math.max(0, accumulated)), dropped: NOTHING }
  }

  const whole = Math.floor(accumulated / tickDuration)
  const pending = milliseconds(accumulated - whole * tickDuration)

  // Il tetto è un dato di `balance/constants.ts` e arriva per argomento: riaprire il gioco dopo
  // giorni non deve bloccare l'avvio per minuti. Ciò che eccede è perso, e va detto a chi guarda.
  if (whole <= cap) return { elapsed: ticks(whole), pending, dropped: NOTHING }
  return { elapsed: cap, pending, dropped: ticks(whole - cap) }
}

export type Cancel = () => void

export interface LoopDeps {
  readonly clock: Clock
  /** Il tetto di recupero, in tick. Arriva da `BALANCE.RECOVERY_CAP`, non da qui. */
  readonly cap: Ticks
  readonly now: () => Milliseconds
  /** Programma il prossimo frame e ritorna come annullarlo. Nel browser è `requestAnimationFrame`. */
  readonly schedule: (run: () => void) => Cancel
  /** Chiamato solo quando c'è almeno un tick intero da eseguire. */
  readonly onStep: (step: Step) => void
}

export interface Loop {
  readonly start: () => void
  readonly stop: () => void
  readonly isRunning: () => boolean
}

export const createLoop = ({ clock, cap, now, schedule, onStep }: LoopDeps): Loop => {
  let accumulated = 0
  let last: Milliseconds | null = null
  let cancel: Cancel | null = null

  const frame = (): void => {
    const current = now()

    // Al primo frame non c'è un "prima": il delta è zero, e nessun tempo viene inventato. È anche
    // ciò che rende `start()` sicuro dopo una pausa lunga — il tempo fermo lo recupera chi sa
    // quanto è durato, non il loop.
    const delta = last === null ? 0 : current - last
    last = current
    accumulated += delta

    const step = stepOf(milliseconds(accumulated), cap, clock)
    accumulated = step.pending

    // A finestra nascosta il browser non chiama il frame: al ritorno questo delta copre tutto il
    // tempo passato e il tetto lo limita. `Sospeso → Recupero` non ha un codice suo — è lo stesso
    // percorso, ed è la ragione per cui non esiste una formula offline da bilanciare a parte.
    if (step.elapsed > 0) onStep(step)

    cancel = schedule(frame)
  }

  return {
    start: () => {
      if (cancel !== null) return
      last = null
      cancel = schedule(frame)
    },

    stop: () => {
      cancel?.()
      cancel = null
      last = null
    },

    isRunning: () => cancel !== null
  }
}
