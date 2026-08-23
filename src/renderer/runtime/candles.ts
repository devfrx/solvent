import type { Money } from '@core/contracts/money'

/**
 * D034 — dal saldo alla candela. È lo **stesso** accumulatore di `stepOf` e `sampleOf` un piano più
 * su: là il frame diventa tick e il tick diventa campione, qui i saldi che passano dentro un
 * intervallo diventano i quattro numeri che lo riassumono.
 *
 * Vive qui e non accanto a chi la usa per la ragione già scritta in `loop.ts`, ed è una regola:
 * `no-restricted-imports` vieta a uno store di importare qualunque cosa stia accanto a sé (R01),
 * quindi una funzione pura scritta in `stores/` non sarebbe raggiungibile dallo store. `sampleOf`
 * ha già questa forma, e questa la segue.
 *
 * **Perché non basta un campionatore.** La serie del patrimonio ([D027](../../../docs/delega/D027-un-grafico-e-una-serie-che-nessuno-tiene.md))
 * prende una fotografia ogni N tick e la accoda: sa **dov'era** il saldo in quell'istante, e non sa
 * niente di cosa è successo in mezzo. Fra due fotografie i contanti possono salire con il reddito,
 * sbattere contro il tetto del caveau e ridiscendere con un prelievo, e nessuna delle due lo
 * vedrebbe. Una candela porta quattro numeri invece di uno — apertura, massimo, minimo, chiusura —
 * ed è la forma che descrive un'oscillazione.
 *
 * Qui non c'è economia: nessun importo viene sommato, cambiato di segno o ricalcolato. I saldi
 * arrivano dal Ledger già fatti, e queste funzioni si limitano a confrontarli — `Decimal` fino in
 * fondo, perché la conversione a `number` è una decisione che sta al confine di presentazione
 * (ADR 0006) e non qui.
 */

/**
 * Un intervallo, riassunto. `open` è il saldo con cui l'intervallo è cominciato, `close` quello con
 * cui finisce; `high` e `low` sono gli estremi **toccati dentro**, che è l'unica informazione che
 * una fotografia non può portare.
 *
 * Per costruzione `low ≤ open ≤ high` e `low ≤ close ≤ high`: apertura e chiusura sono due dei
 * valori osservati, quindi stanno sempre dentro l'escursione. È ciò che permette a chi disegna di
 * misurare l'asse su tutti e quattro senza doverli distinguere.
 */
export interface Candle {
  readonly open: Money
  readonly high: Money
  readonly low: Money
  readonly close: Money
}

/**
 * **Apri.** Un intervallo comincia dove il precedente ha lasciato il saldo, e finché non succede
 * niente i suoi quattro numeri coincidono — che è la definizione di «questo strumento è fermo».
 */
export const openCandle = (at: Money): Candle => ({ open: at, high: at, low: at, close: at })

/**
 * **Aggiorna.** Un saldo nuovo sposta la chiusura sempre, e gli estremi solo se li supera.
 * L'apertura non si tocca mai: è il saldo di quando l'intervallo è cominciato, e riscriverla
 * trasformerebbe la candela nella fotografia che non vogliamo.
 *
 * Ritorna una candela nuova e non tocca quella che riceve, come `pushBounded`: la cronaca la tiene
 * in una variabile che sostituisce, e una mutazione sul posto renderebbe indistinguibili la candela
 * in corso e quelle già accodate.
 */
export const updateCandle = (candle: Candle, at: Money): Candle => ({
  open: candle.open,
  high: at.greaterThan(candle.high) ? at : candle.high,
  low: at.lessThan(candle.low) ? at : candle.low,
  close: at
})

/**
 * **Chiudi.** Chiudere un intervallo è aprire il successivo dove questo ha lasciato il saldo: la
 * chiusura di una candela è l'apertura della seguente, e non c'è un salto in mezzo.
 *
 * Ciò che **non** passa oltre sono il massimo e il minimo. Ereditarli lascerebbe la prima
 * oscillazione grande disegnata in tutte le candele successive, cioè una serie che racconta sempre
 * lo stesso momento — ed è il modo in cui una serie di candele smette di dire quando le cose sono
 * successe.
 */
export const nextCandle = (candle: Candle): Candle => openCandle(candle.close)
