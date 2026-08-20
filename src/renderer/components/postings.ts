import type { Posting } from '@core/contracts/ledger'
import type { Money } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import { POOLS } from '@core/contracts/pools'

import type { ColorRole } from '@renderer/ui/roles'

/**
 * Quali movimenti di una transazione il giocatore vede, e come.
 *
 * È una funzione pura in un `.ts` e non tre righe dentro un template per due ragioni. La prima è
 * che si prova senza montare niente, come `createTranslator` di D012 (docs/roadmap-fette.md). La
 * seconda è che la regola è **una sola** e viene usata in due posti — l'anteprima del bancomat,
 * prima della conferma, e le ultime operazioni, dopo — che è esattamente ciò che INV-11 chiede di
 * non duplicare: il riquadro "cosa succede" e la riga nello storico mostrano lo stesso elenco di
 * movimenti perché a costruirlo è la stessa funzione.
 *
 * Qui non c'è economia: nessun importo viene sommato, cambiato di segno o ricalcolato. Si decide
 * cosa si mostra, il che è presentazione (R05).
 */

/**
 * Il colore di una riga, che è anche il suo significato. Sono tre e non quattro: P2 riserva il
 * verde al denaro che entra, l'ambra al costo, e tutto il resto resta del colore del testo.
 */
export type PostingTone = 'in' | 'out' | 'fee'

/**
 * Il ponte fra un significato di dominio e un ruolo di colore, e **vive qui** invece che nel kit:
 * `ui/` non sa cosa sia un movimento, e non deve saperlo (R14, ADR 0028). È una funzione pura di
 * tre casi, quindi si prova senza montare niente.
 */
export const roleOf = (tone: PostingTone): ColorRole =>
  tone === 'in' ? 'gain' : tone === 'fee' ? 'heat' : 'ink'

export interface PostingRow {
  /**
   * Lo strumento toccato, oppure `null` per la commissione: quel movimento finisce su un conto
   * non-giocatore, che nella UI non ha un nome e non deve averne uno (ADR 0017). Chi mostra la
   * riga la etichetta con `atm.fee`, che è una parola, non un conto.
   */
  readonly pool: Pool | null
  readonly amount: Money
  readonly tone: PostingTone
}

/**
 * ADR 0020 — una transazione ha sempre una contropartita, e la contropartita non è un movimento
 * del giocatore: `world` da cui arriva lo stipendio e `sink` in cui finisce una spesa non si
 * mostrano, perché mostrarli vorrebbe dire spiegare la partita doppia a chi voleva solo prelevare.
 *
 * La commissione invece **si mostra**, ed è tutto il punto della fetta: la si vede prima della
 * conferma (ADR 0018) e la si ritrova nello storico dopo. A distinguerla dalla contropartita non è
 * il nome del suo conto ma la sua `category`, che è un dato del movimento.
 */
export const visibleRows = (postings: readonly Posting[]): readonly PostingRow[] =>
  postings.flatMap((posting): readonly PostingRow[] => {
    if (POOLS[posting.pool].player) {
      const tone: PostingTone = posting.amount.isNegative() ? 'out' : 'in'
      return [{ pool: posting.pool, amount: posting.amount, tone }]
    }
    if (posting.category === 'fee') return [{ pool: null, amount: posting.amount, tone: 'fee' }]
    return []
  })
