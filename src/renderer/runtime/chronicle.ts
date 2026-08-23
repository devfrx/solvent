import type { BoundedList } from '@core/contracts/bounded'
import { boundedList, pushBounded } from '@core/contracts/bounded'
import type { Money } from '@core/contracts/money'

import type { Bus } from '@core/kernel/Bus'
import type { Ticks } from '@core/kernel/Clock'
import { ticks } from '@core/kernel/Clock'

import type { Candle } from './candles'
import { nextCandle, openCandle, updateCandle } from './candles'
import { sampleOf } from './loop'

/**
 * D037 — la cronaca: ciò che il tempo di gioco lascia dietro di sé.
 *
 * **Il difetto che chiude.** Le tre serie del cruscotto vivevano nello store, con i propri
 * accumulatori, alimentate da `loop.onStep`. Ma `registry.tickAll` aveva **due** chiamanti — il
 * loop e il recupero all'avvio — e solo il primo campionava: riaprire il gioco dopo una notte
 * faceva passare fino a otto ore di gioco senza chiudere una candela e senza prendere un campione.
 * Non era una svista silenziosa, era una svista **dichiarata**: il commento di `sampleOf` in
 * `loop.ts` promette «il tetto del recupero produce un campione solo», e a quel codice il recupero
 * non arrivava mai. Adesso a chiamare la cronaca è `Game.advance`, che è l'unico modo in cui il
 * tempo di gioco avanza ([ADR 0043](../../../docs/adr/0043-il-tempo-che-avanza-e-un-operazione-del-gioco.md)).
 *
 * **Cosa questa cronaca non sa.** Non sa cosa sia un grafico, un patrimonio o uno strumento: sa
 * che qualcuno vuole guardare un numero ogni tanti tick e tenersi gli ultimi. Le tre registrazioni
 * che oggi esistono le dichiara il bootstrap, accanto ai sistemi che registra — che è l'unico
 * posto ad avere il Ledger e i numeri di gioco sotto mano insieme (ADR 0024).
 *
 * **Una lista sola, e nessun caso speciale.** È la forma del Registry
 * ([ADR 0002](../../../docs/adr/0002-registry-unica-lista-di-sistemi.md)) applicata a ciò che si
 * registra invece che a ciò che ticchetta: le quattro operazioni iterano lo stesso array, nessuna
 * guarda chi sia la registrazione che sta trattando, e le due forme — fotografia ed escursione —
 * si distinguono per **chiusura** e non per un `if`. Il primo `if (kind === …)` sarebbe il difetto
 * A01 che torna con un altro nome.
 *
 * Vive in `runtime/` per la ragione già scritta in `loop.ts` e in `candles.ts`: R01 vieta a uno
 * store di importare ciò che gli sta accanto, e `sampleOf`, `Candle` e questa cronaca sono la
 * stessa catena — dal frame al tick, dal tick all'intervallo, dall'intervallo alla serie.
 *
 * Qui non c'è economia: nessun importo viene sommato, cambiato di segno o ricalcolato. I numeri
 * arrivano già fatti da chi li possiede, e questo file si limita a fotografarli.
 */

/**
 * Cosa una registrazione guarda. È una funzione e non un valore perché il numero cambia sotto: la
 * cronaca la chiama quando le serve, e chi dichiara decide da dove viene.
 *
 * Ritorna `Money` e non un tipo qualunque, ed è una restrizione voluta: tutte e tre le
 * registrazioni di oggi guardano del denaro, e un generico che nessuno usa è un'astrazione
 * immaginata. Il giorno in cui qualcuno vorrà registrare un livello o un conteggio, questa riga è
 * il posto da cui si allarga.
 */
export type Observe = () => Money

/** Ciò che si dichiara per registrare qualcosa. */
export interface Recording {
  /**
   * Ogni quanti tick l'intervallo si chiude. Arriva da `balance/` e non da qui: chi bilancia
   * guarda i secondi, e la conversione è del Clock (ADR 0009).
   */
  readonly every: Ticks
  /** Quante se ne tengono. È il `max` della lista limitata, dichiarato dove si definisce (R09). */
  readonly keep: number
  readonly observe: Observe
}

/**
 * Ciò che si legge. È una funzione e non la lista, così chi legge non si tiene una fotografia
 * credendo di avere la serie: `pushBounded` ritorna una lista nuova a ogni chiusura e **la
 * stessa** in mezzo — che è ciò che permette a un mirror di non svegliare nessuno quando non è
 * successo niente.
 */
export interface Series<T> {
  readonly list: () => BoundedList<T>
}

/**
 * Le quattro cose che la cronaca chiede a una registrazione, e nient'altro. Due sono facoltative,
 * dove una delle forme non ha niente da fare: è la forma di `tick` e `stats` in un sistema — un
 * `?.()` è più corto di una funzione vuota, e dice che quella forma non partecipa invece di far
 * finta di partecipare.
 */
interface Tracked {
  /** Il tempo di gioco è avanzato: la cadenza decide se l'intervallo si chiude. */
  readonly advance: (elapsed: Ticks) => void
  /** Un saldo si è mosso fuori dal tick: chi tiene un'escursione la allarga. */
  readonly moved?: () => void
  /** I saldi sono cambiati senza un movimento economico: si riparte da quelli. */
  readonly reopen?: () => void
  readonly clear: () => void
}

export interface Chronicle {
  /**
   * **Una fotografia ogni `every` tick.** Sa dov'era il numero in quell'istante, e non sa niente
   * di cosa è successo in mezzo.
   */
  readonly samples: (recording: Recording) => Series<Money>
  /**
   * **Un'escursione ogni `every` tick**: apertura, massimo, minimo, chiusura. È la forma che
   * descrive un'oscillazione, cioè l'unica cosa che una fotografia non può portare (`candles.ts`).
   */
  readonly candles: (recording: Recording) => Series<Candle>
  /** Il tempo di gioco è avanzato di `elapsed` tick. Lo chiama `Game.advance`, e nessun altro. */
  readonly advance: (elapsed: Ticks) => void
  /** I saldi sono cambiati senza che nessun evento lo dicesse: succede dopo un caricamento. */
  readonly reopen: () => void
  /**
   * Le serie sono di **questa** partita. Non riceve lo `scope`, e non è una dimenticanza: `soft` e
   * `hard` cambiano tutti e due i saldi sotto la serie, quindi tenerla disegnerebbe in tutti e due
   * i casi un salto mai avvenuto — e per giunta quello che decide la scala dell'asse. Un parametro
   * che non cambia niente sarebbe una differenza dichiarata e non mantenuta.
   */
  readonly reset: () => void
}

/**
 * `bus` arriva per costruzione, come al Ledger. La cronaca si iscrive **da sé** a `money.posted`
 * invece di farsi svegliare da chi la possiede: un'escursione che dipendesse da una riga scritta
 * nello store sarebbe di nuovo una cosa da ricordarsi, cioè il difetto che questo file chiude.
 *
 * L'iscrizione non si disfa, perché la cronaca vive quanto la partita: una `Unsubscribe` che
 * nessuno chiama è una promessa che nessuno mantiene.
 */
export const createChronicle = (bus: Bus): Chronicle => {
  // L'unica lista. Le quattro operazioni qui sotto iterano questa, e nient'altro.
  const tracked: Tracked[] = []

  bus.on('money.posted', () => {
    for (const recording of tracked) recording.moved?.()
  })

  return {
    samples: ({ every, keep, observe }) => {
      let list = boundedList<Money>(keep)
      let pending: Ticks = ticks(0)

      tracked.push({
        // Il campione si prende **dopo** il tick, e a garantirlo è l'ordine dentro `Game.advance`:
        // i saldi che porta sono quelli che il tick ha appena prodotto, non quelli di un passo fa.
        advance: (elapsed) => {
          const sampling = sampleOf(pending, elapsed, every)
          pending = sampling.pending
          if (sampling.due) list = pushBounded(list, observe())
        },

        // `moved` e `reopen` non ci sono: una fotografia non guarda in mezzo, e non ha un
        // intervallo aperto da far ripartire.

        clear: () => {
          list = boundedList<Money>(keep)
          pending = ticks(0)
        }
      })

      return { list: () => list }
    },

    candles: ({ every, keep, observe }) => {
      let list = boundedList<Candle>(keep)
      let pending: Ticks = ticks(0)
      let open = openCandle(observe())

      tracked.push({
        // A chiudere un intervallo è il **tempo**, non un movimento: un intervallo in cui nessuno
        // ha mosso niente produce una candela piatta, che dice «questo strumento è fermo».
        // Aspettare un movimento lascerebbe un buco nella serie della carta ogni volta che il
        // giocatore non tocca il bancomat.
        advance: (elapsed) => {
          const closing = sampleOf(pending, elapsed, every)
          pending = closing.pending
          if (!closing.due) return
          list = pushBounded(list, open)
          open = nextCandle(open)
        },

        // Fra due chiusure possono passare decine di movimenti, e ciascuno può spostare il massimo
        // o il minimo: è l'informazione che una fotografia presa a intervalli non avrebbe mai.
        moved: () => {
          open = updateCandle(open, observe())
        },

        reopen: () => {
          open = openCandle(observe())
        },

        clear: () => {
          list = boundedList<Candle>(keep)
          pending = ticks(0)
          open = openCandle(observe())
        }
      })

      return { list: () => list }
    },

    advance: (elapsed) => {
      for (const recording of tracked) recording.advance(elapsed)
    },

    reopen: () => {
      for (const recording of tracked) recording.reopen?.()
    },

    reset: () => {
      for (const recording of tracked) recording.clear()
    }
  }
}
