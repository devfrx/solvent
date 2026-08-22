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

/** Se adesso va preso un campione, e quanti tick restano sotto la soglia. */
export interface Sampling {
  readonly due: boolean
  readonly pending: Ticks
}

/**
 * D027 — dal tick al campione. È lo **stesso** accumulatore di `stepOf` un piano più su: là il
 * frame diventa tick, qui il tick diventa campione, e in tutti e due i casi il resto torna
 * indietro invece di essere buttato.
 *
 * Vive qui e non accanto a chi la usa per una ragione che è una regola: `no-restricted-imports`
 * vieta a uno store di importare qualunque cosa stia accanto a sé (R01), quindi una funzione pura
 * scritta in `stores/` non sarebbe raggiungibile dallo store. `stepOf` ha già questa forma — è
 * esportata da qui e chiamata da `recover()` — e questa la segue.
 *
 * **Il tetto del recupero produce un campione solo, non millecinquecento.** Tornare dopo otto ore
 * arriva qui come un `elapsed` enorme, e non ci sono valori intermedi da campionare: il reddito
 * arretrato entra in una transazione sola (`income/system.ts`), quindi di saldi ce n'è **uno**.
 * Dividere quel salto in barre finte sarebbe disegnare numeri che nessuno ha mai avuto — la
 * correzione 1 di D015 con un altro vestito.
 *
 * `every` è un intero positivo che arriva da `balance/`, quindi non c'è una guardia contro lo
 * zero: sarebbe un ramo che nessun test può raggiungere passando dal gioco, cioè codice che si
 * prova solo da sé stesso.
 */
export const sampleOf = (pending: Ticks, elapsed: Ticks, every: Ticks): Sampling => {
  const accumulated = pending + elapsed
  if (accumulated < every) return { due: false, pending: ticks(accumulated) }
  return { due: true, pending: ticks(accumulated % every) }
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
    // Il frame successivo si programma **prima** di `onStep`, e a imporlo sono due proprietà
    // opposte fra loro (D035, punto 8).
    //
    // Se `onStep` **lancia**, l'eccezione esce di qui. Programmando dopo, non verrebbe programmato
    // nessun frame nuovo, `cancel` resterebbe al valore vecchio — quindi `isRunning()` direbbe
    // `true` — e `start()` rifiuterebbe di ripartire, perché comincia con `if (cancel !== null)`.
    // La finestra vive, il saldo è fermo, e l'unica funzione che il progetto ha per chiedere «sta
    // girando?» risponde di sì.
    //
    // Se `onStep` chiama `stop()`, l'annullamento deve poter mordere: qui `cancel` porta già il
    // frame nuovo, quindi `stop()` lo annulla e il loop resta fermo. Un `try`/`finally` intorno a
    // `onStep` chiude il primo caso e non il secondo — riprogrammerebbe **dopo** lo `stop()`,
    // resuscitando un loop che qualcuno aveva appena fermato.
    //
    // In nessuno dei due casi l'errore viene preso: di qui esce come è entrato.
    cancel = schedule(frame)

    if (step.elapsed > 0) onStep(step)
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
