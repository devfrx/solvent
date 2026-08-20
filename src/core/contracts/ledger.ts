import type { Money } from './money'
import type { Pool } from './pools'

/**
 * Il vocabolario del denaro. Il Ledger che lo usa è D007: qui ci sono solo i tipi.
 *
 * ADR 0019 — la primitiva è la **transazione**, non il movimento: un prelievo al bancomat muove
 * tre importi insieme, e una sequenza di movimenti singoli può interrompersi a metà.
 * ADR 0020 — ogni transazione somma a zero.
 */

/**
 * Perché è avvenuta una transazione. È una chiave i18n tipizzata, non una stringa libera: la UI
 * traduce un codice, non riceve una frase. Cresce con i domini, come `GameEvents`.
 */
export type Reason =
  | 'reason.income.tick'
  | 'reason.income.upgrade'
  | 'reason.atm.deposit'
  | 'reason.atm.withdraw'
  | 'reason.vault.expand'

/** Il raggruppamento per la telemetria economica. Cresce quando una schermata lo mostra. */
export type Category = 'income' | 'purchase' | 'transfer' | 'fee'

/** Una riga di una transazione. Importo negativo = uscita dal pool. */
export interface Posting {
  readonly pool: Pool
  readonly amount: Money
  readonly category: Category
}

/**
 * Un insieme di movimenti applicato tutto o niente. La ragione sta qui e non sul movimento:
 * un prelievo è **un** evento economico con tre righe, non tre eventi.
 */
export interface Transaction {
  readonly reason: Reason
  readonly postings: readonly Posting[]
}

/**
 * Ciò che una transazione dichiara oltre alle proprie righe.
 *
 * ADR 0017 — `accepts` è l'affordance vista dal Ledger: un'azione che si paga solo con la carta lo
 * dice qui, e un movimento su un pool del giocatore fuori dall'elenco viene rifiutato con
 * `error.ledger.pool_not_accepted`, che porta l'elenco con sé. Assente significa che l'azione non
 * pone vincoli di strumento — non che li pone e li ha dimenticati: chi non dichiara nulla accetta
 * tutto, ed è la forma giusta per il reddito, che non è una scelta del giocatore.
 */
export interface TransactionMeta {
  readonly reason: Reason
  readonly accepts?: readonly Pool[]
}

/** I saldi di tutti i conti, giocatore e non. La somma è sempre zero (ADR 0020). */
export type Balances = Readonly<Record<Pool, Money>>

/**
 * ADR 0007 — ogni errore ha un `code` (chiave i18n) e un contesto tipizzato, così la UI può
 * spiegare *perché* invece di spegnere un pulsante.
 */
export type LedgerError =
  | {
      readonly code: 'error.ledger.insufficient_funds'
      readonly pool: Pool
      readonly required: Money
      readonly available: Money
    }
  | {
      readonly code: 'error.ledger.capacity_exceeded'
      readonly pool: Pool
      readonly capacity: Money
      /** Quanto ci starebbe ancora: è ciò che la UI mostra al giocatore. */
      readonly fits: Money
    }
  | {
      readonly code: 'error.ledger.pool_not_accepted'
      readonly pool: Pool
      /** Quali pool sarebbero andati bene. Senza questo, l'errore non è spiegabile. */
      readonly accepted: readonly Pool[]
    }
  | {
      readonly code: 'error.ledger.invalid_amount'
      readonly pool: Pool
      readonly amount: Money
    }
