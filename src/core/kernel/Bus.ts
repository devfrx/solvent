import type { GameEvents } from '@core/contracts/events'

/**
 * ADR 0016 — il Bus è sincrono e fire-and-forget: un evento **notifica**, non chiede.
 *
 * `emit` esegue gli handler subito, sullo stesso stack, nell'ordine di registrazione, e ritorna
 * `void`. Chi ha bisogno di una risposta non usa il Bus: usa un comando, che ritorna `Result`.
 *
 * Il Bus non ha stato di gioco — nessuna coda, nessuno storico — quindi non entra nel salvataggio
 * e non si ricostruisce da nulla. Non è event sourcing, ed è una scelta, non una mancanza.
 *
 * Le due trappole di un bus scritto in fretta sono entrambe difese qui, perché si manifestano
 * mesi dopo: iterare l'array vivo mentre un handler si disiscrive, e il ciclo di emissioni che
 * arriva come uno stack overflow senza contesto.
 */

/**
 * Un handler che emette a sua volta è legittimo; otto livelli di annidamento no. L'annidamento
 * reale è di due o tre — un sistema reagisce e notifica il proprio esito. Oltre, è un ciclo.
 */
export const MAX_EMIT_DEPTH = 8

export type Unsubscribe = () => void

type Handler<E extends keyof GameEvents> = (payload: GameEvents[E]) => void

/**
 * Il tipo più largo possibile per un handler: `never` in ingresso lo rende compatibile con
 * qualunque `Handler<E>` senza cast. La conversione inversa, al momento della chiamata, è
 * l'unica del file ed è confinata a una riga.
 */
type HandlerOpaco = (payload: never) => void

/**
 * L'iscrizione, non la funzione, è l'unità che si toglie. Due iscrizioni della **stessa** funzione
 * sono due cose distinte: senza questa distinzione una `Unsubscribe` chiamata due volte toglie
 * l'omonima iscritta dopo, ed è un handler che sparisce senza che nessuno l'abbia chiesto.
 */
interface Iscrizione {
  readonly handler: HandlerOpaco
  attiva: boolean
}

/**
 * Un ciclo di eventi non si tollera e non si raccoglie insieme agli altri errori: si ferma subito.
 * Il messaggio porta la catena che lo ha causato, che è l'unica informazione che uno stack
 * overflow non dà.
 */
export class EventCycleError extends Error {
  constructor(catena: readonly string[]) {
    super(
      `Bus — ciclo di eventi: superata la profondità massima di ${MAX_EMIT_DEPTH} emissioni ` +
        `annidate. Catena: ${catena.join(' → ')}`
    )
    this.name = 'EventCycleError'
  }
}

export interface Bus {
  readonly on: <E extends keyof GameEvents>(event: E, handler: Handler<E>) => Unsubscribe
  readonly emit: <E extends keyof GameEvents>(event: E, payload: GameEvents[E]) => void
}

export const createBus = (): Bus => {
  const iscritti = new Map<keyof GameEvents, Iscrizione[]>()
  const catena: (keyof GameEvents)[] = []

  return {
    on: <E extends keyof GameEvents>(event: E, handler: Handler<E>): Unsubscribe => {
      const lista = iscritti.get(event) ?? []
      iscritti.set(event, lista)

      const iscrizione: Iscrizione = { handler, attiva: true }
      lista.push(iscrizione)

      return () => {
        if (!iscrizione.attiva) return
        iscrizione.attiva = false
        const indice = lista.indexOf(iscrizione)
        if (indice !== -1) lista.splice(indice, 1)
      }
    },

    emit: <E extends keyof GameEvents>(event: E, payload: GameEvents[E]): void => {
      catena.push(event)
      try {
        if (catena.length > MAX_EMIT_DEPTH) throw new EventCycleError(catena)

        const lista = iscritti.get(event)
        if (lista === undefined) return

        const errori: unknown[] = []

        // Si itera una copia, e si salta chi si è tolto nel frattempo: l'array vivo cambierebbe
        // sotto i piedi, e la copia da sola richiamerebbe un handler già disiscritto.
        for (const iscrizione of [...lista]) {
          if (!iscrizione.attiva) continue
          try {
            ;(iscrizione.handler as Handler<E>)(payload)
          } catch (errore) {
            // Un ciclo interrompe: continuare lo moltiplicherebbe a ogni livello, e la diagnosi
            // finirebbe sepolta sotto centinaia di errori identici.
            if (errore instanceof EventCycleError) throw errore
            errori.push(errore)
          }
        }

        // Un handler che lancia non ferma gli altri, ma il suo errore non si perde: emerge dopo.
        if (errori.length === 1) throw errori[0]
        if (errori.length > 1) {
          throw new AggregateError(
            errori,
            `Bus — ${errori.length} handler hanno lanciato su ${event}.`
          )
        }
      } finally {
        catena.pop()
      }
    }
  }
}
