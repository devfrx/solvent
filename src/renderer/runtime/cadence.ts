import type { Ticks } from '@core/kernel/Clock'
import { ticks } from '@core/kernel/Clock'

import { sampleOf } from './loop'

/**
 * D041 — una cadenza: qualcosa che diventa **dovuto** ogni tanti tick di gioco.
 *
 * **Cosa la distingue dalla cronaca.** La cronaca guarda un numero e se lo tiene (`chronicle.ts`);
 * questa non guarda niente e non tiene niente — dice soltanto che è passato abbastanza tempo. È la
 * forma minima che serve a chi deve **fare** qualcosa, non a chi deve registrarla, e l'unica cosa
 * che fa è contare.
 *
 * **Perché vive qui e non nello store.** Per la ragione già scritta in `loop.ts` e in `candles.ts`:
 * R01 vieta a uno store di importare ciò che gli sta accanto, quindi una funzione di questa catena
 * scritta in `stores/` non sarebbe raggiungibile dallo store. E per una ragione in più, che è
 * l'[ADR 0050](../../../docs/adr/0050-la-cadenza-sta-sulla-via-unica.md): a farla avanzare è
 * `Game.advance`, cioè l'unica via per cui passa il tempo di gioco (ADR 0043, R25). Se contasse
 * altrove, il prossimo che fa passare del tempo senza passare dal frame — il calendario
 * dell'ADR 0023, un cheat che salta un'ora — non la muoverebbe, e **nessun gate lo vedrebbe**: R25
 * guarda chi nomina `tickAll`, e una cadenza non lo nomina.
 *
 * **La coalizione, che è la ragione per cui `take` esiste invece di un contatore.** Durante un
 * recupero al tetto pieno passano 7.300 tick in meno di tre millisecondi (D040, in
 * `docs/qualita.md`): una cadenza da trenta secondi — trecento tick — scatta **ventiquattro volte**
 * in quei tre millisecondi. Ventiquattro cose dovute sono **una** cosa da fare, e a dirlo è che ciò
 * che si accumula è un `boolean` e non un numero. Ventiquattro scritture su disco dentro il
 * caricamento sarebbero precisamente il tempo di avvio che il tetto di recupero esiste per
 * proteggere.
 *
 * Qui non c'è economia e non c'è browser: nessun importo, nessun `Date.now`, nessun `setInterval`.
 * Riceve tick e risponde `sì` o `no`, e per questo si prova contando invece che aspettando.
 */
export interface Cadence {
  /** Il tempo di gioco è avanzato di `elapsed` tick. Lo chiama `Game.advance`, e nessun altro. */
  readonly advance: (elapsed: Ticks) => void
  /**
   * Se la cadenza è scattata almeno una volta da quando gliel'hanno chiesto, e **azzera** la
   * risposta prendendola.
   *
   * Il nome dice che consuma, perché è l'unica cosa importante da sapere: due chiamate di fila non
   * danno due volte `true`, e chi la chiama si sta impegnando a fare la cosa. Una lettura pura
   * lascerebbe a chi legge il compito di azzerare, cioè una seconda riga da ricordarsi in un file
   * diverso — che è la forma del difetto che l'ADR 0050 esiste per chiudere.
   */
  readonly take: () => boolean
  /**
   * Il conto riparte da zero, e non è un dettaglio: `reset` e `load` cambiano la partita sotto la
   * cadenza. Una cadenza ereditata farebbe arrivare la prima scadenza di una partita nuova a un
   * istante deciso da quella buttata via.
   */
  readonly clear: () => void
}

/**
 * `every` arriva da `balance/` in tick, come per la cronaca: chi bilancia guarda i secondi, la
 * conversione è del Clock (ADR 0009), e un numero di tick scritto a mano sarebbe la frequenza dei
 * tick riscritta in un secondo posto — il difetto A04.
 *
 * Non c'è una guardia contro `every` a zero, per la ragione scritta su `sampleOf`: sarebbe un ramo
 * che nessun test può raggiungere passando dal gioco, cioè codice che si prova solo da sé stesso.
 */
export const createCadence = (every: Ticks): Cadence => {
  let pending: Ticks = ticks(0)
  let owed = false

  return {
    // **Lo stesso accumulatore della cronaca**, e non una copia: `sampleOf` è la regola che decide
    // se una soglia è stata attraversata, e il resto torna in `pending` invece di essere buttato.
    // Scriverne una seconda qui vorrebbe dire due regole che devono coincidere.
    advance: (elapsed) => {
      const reached = sampleOf(pending, elapsed, every)
      pending = reached.pending
      // `||` e non `=`: se era già dovuto e nessuno l'ha preso, resta dovuto. È la coalizione, e
      // sta in questo carattere.
      owed = owed || reached.due
    },

    take: () => {
      const due = owed
      owed = false
      return due
    },

    clear: () => {
      pending = ticks(0)
      owed = false
    }
  }
}
