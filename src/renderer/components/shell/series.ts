import type { Money } from '@core/contracts/money'
import { toDisplayNumber } from '@core/contracts/money'

import type { Candle } from '@renderer/runtime/candles'

/**
 * D027 — da una serie di patrimoni ai due numeri che il grafico non sa dedurre da sé.
 *
 * Il disegno lo fa ApexCharts ([ADR 0034](../../../../docs/adr/0034-il-grafico-e-una-libreria.md)).
 * Quello che resta qui è ciò che una libreria di grafici **non** può decidere al posto nostro: dove
 * comincia e dove finisce l'asse. È una funzione pura in un `.ts` per la ragione di
 * `components/ledger/postings.ts` — si prova senza montare niente, e un `.vue` non calcola (R05).
 *
 * Qui non c'è economia: nessun importo viene sommato, cambiato di segno o ricalcolato. Il
 * patrimonio netto lo somma lo store, una volta sola, e da lì lo leggono sia il riquadro del
 * cruscotto sia questa serie — due somme dello stesso patrimonio sono due patrimoni.
 */

/**
 * ADR 0006 — il confine di presentazione, e l'unico posto di questo grafico che lo attraversa.
 * `toDisplayNumber` è una delle due sole conversioni del progetto, e vive qui invece che nel
 * componente perché la conversione è una decisione, non un dettaglio del template.
 *
 * Un `Decimal` in un `number` perde precisione oltre i quindici significativi. Per un'altezza in
 * pixel non cambia niente; per un saldo cambierebbe tutto, ed è la ragione per cui questa riga sta
 * dopo il Ledger e mai prima.
 */
export const pointsOf = (samples: readonly Money[]): readonly number[] =>
  samples.map((sample) => toDisplayNumber(sample))

/** L'asse verticale: dove comincia e dove finisce. */
export interface Window {
  readonly min: number
  readonly max: number
}

/**
 * Quanto respiro lasciare sopra e sotto la serie, in frazione della sua escursione. Senza, il
 * campione più basso poggia esattamente sul fondo dell'asse e il più alto tocca il bordo: due barre
 * che si leggono come «zero» e «massimo» invece che come i due estremi di ciò che è successo.
 */
const PAD_SHARE = 0.15

/**
 * Il respiro quando la serie è **piatta**, in frazione del livello. Serve perché con escursione
 * zero non c'è niente da cui ricavare un margine, e un asse che comincia e finisce sullo stesso
 * numero non è un asse.
 *
 * Il minimo assoluto esiste per l'unico caso in cui anche quella frazione è zero: una partita
 * appena nata, con il patrimonio ancora a zero.
 */
const FLAT_SHARE = 0.05
const FLAT_LEAST = 1

/**
 * **La finestra si adatta alla serie, e non parte da zero.** È la decisione che guardare
 * l'applicazione ha ribaltato, ed è stata misurata invece che immaginata: con un asse ancorato a
 * zero, trenta campioni di crescita normale muovono l'intera altezza in una partita nuova, un
 * quarto a 5.000,00 €, l'1,7% a 100.000,00 € e lo 0,19% a 900.000,00 €. Il caveau arriva a
 * 250.000,00 €, quindi il cruscotto porterebbe un rettangolo pieno per la maggior parte della
 * partita — vero e inutile.
 *
 * Il prezzo è che l'altezza di una barra non è più «quanti soldi»: è **dove sei nell'intervallo
 * osservato**. A dirlo al giocatore ci sono due cose che senza libreria non avevamo — l'asse con i
 * suoi numeri e il valore che compare toccando una barra — ed è metà della ragione per cui la
 * libreria è entrata.
 *
 * Una serie vuota non ha finestra e nessuno gliela chiede: il componente non disegna niente finché
 * il primo campione non arriva.
 */
export const windowOf = (points: readonly number[]): Window => {
  const lowest = Math.min(...points)
  const highest = Math.max(...points)
  const span = highest - lowest
  const pad = span > 0 ? span * PAD_SHARE : Math.max(Math.abs(highest) * FLAT_SHARE, FLAT_LEAST)

  return { min: lowest - pad, max: highest + pad }
}

/**
 * D034 — un punto del grafico a candele, nella forma che ApexCharts vuole: una `x` e i quattro
 * numeri in `y`, nell'ordine **apertura, massimo, minimo, chiusura**. L'ordine è della libreria e
 * non nostro: scambiarne due disegnerebbe candele plausibili e sbagliate.
 *
 * La `x` è la posizione della candela nella serie, e non un istante: senza il calendario
 * dell'[ADR 0023](../../../../docs/adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md) una
 * candela non sa **quando** ha chiuso, e un asse con delle date sopra sarebbe la stessa bugia che
 * D027 ha già rifiutato per le barre del patrimonio. L'asse orizzontale infatti non si disegna.
 */
export interface CandlePoint {
  readonly x: number
  readonly y: readonly number[]
}

/**
 * ADR 0006 — lo stesso confine di `pointsOf`, attraversato quattro volte per candela invece di una
 * per campione. Vale la stessa riga: `toDisplayNumber` sta qui perché la conversione è una
 * decisione, e non nel componente.
 */
export const candlePointsOf = (candles: readonly Candle[]): readonly CandlePoint[] =>
  candles.map((candle, index) => ({
    x: index,
    y: [candle.open, candle.high, candle.low, candle.close].map((value) => toDisplayNumber(value))
  }))

/**
 * La finestra di un grafico a candele, che è `windowOf` su **tutti** i numeri invece che sulle sole
 * chiusure. Guardare solo apertura e chiusura lascerebbe gli stoppini fuori dall'asse — cioè
 * taglierebbe via esattamente ciò per cui una candela esiste.
 *
 * Apertura e chiusura stanno dentro l'escursione per costruzione (`runtime/candles.ts`), quindi
 * passarle non cambia il risultato: si passano lo stesso perché «tutti e quattro» è una regola più
 * corta da leggere di «il secondo e il terzo».
 */
export const candleWindowOf = (points: readonly CandlePoint[]): Window =>
  windowOf(points.flatMap((point) => point.y))
