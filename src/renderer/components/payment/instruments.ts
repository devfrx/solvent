import type { Pool } from '@core/contracts/pools'
import { POOLS } from '@core/contracts/pools'

import type { MessageKey } from '@renderer/i18n'

/**
 * D036 · ADR 0042 — le due domande che la finestra del pagamento fa su uno strumento, pure e fuori
 * dal `.vue`.
 *
 * Stanno qui e non nel componente per la ragione di sempre — un `.vue` non calcola (R05) — e in un
 * `.ts` accanto a lui come `postings.ts` sta accanto a `PostingRows.vue`: sono le due righe
 * sbagliabili di questo pezzo, e provarle non costa di montare niente.
 */

/**
 * Se questo strumento chiede una prova prima di pagarci.
 *
 * Legge l'affordance del pool, non il suo **nome**: un `if (pool === 'card')` scritto qui avrebbe
 * centralizzato il disegno del pagamento e sparso la regola, che è precisamente ciò che l'ADR 0017
 * esiste per non avere. Il giorno in cui entrano le fiches e la crypto, dichiarano il proprio
 * `bearer` e questa funzione non cambia.
 */
export const needsProof = (pool: Pool): boolean => !POOLS[pool].bearer

/**
 * Cosa si legge sopra un'opzione: con **una** voce non c'è una scelta da etichettare, c'è una
 * ragione da dare — il nome dello strumento da solo direbbe al giocatore *quale* senza dirgli
 * *perché non gli altri*.
 *
 * Era la stessa funzione scritta due volte, in `IncomePanel` e in `VaultPanel`, con il commento
 * della seconda che lo dichiarava: è il grilletto di D023 — un pezzo entra dove sta chi lo disegna
 * quando a disegnarlo sono due — e questa riga è ciò che resta di quelle due.
 */
export const instrumentKey = (options: number): MessageKey =>
  options === 1 ? 'payment.only_with' : 'payment.with'
