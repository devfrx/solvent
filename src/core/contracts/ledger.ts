import type { Money } from './money'
import { ZERO } from './money'
import type { Pool } from './pools'
import { POOL_IDS, POOLS } from './pools'

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
  // D029 — un cheat di sviluppo muove denaro come tutti gli altri, quindi ha una ragione sua e
  // compare nel registro delle operazioni. Non c'è denaro invisibile: nascondere un movimento
  // renderebbe il registro una fonte di cui non ci si può più fidare, che è il difetto A05 visto
  // dal lato di chi legge invece che di chi scrive.
  | 'reason.cheat.grant'
  | 'reason.cheat.drain'

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
 * Le pozze che sono del giocatore, derivate da `POOLS` invece che elencate. I quattro conti
 * dell'ADR 0020 non compaiono mai nella UI, e il giorno in cui nascesse un terzo strumento questa
 * riga non cambierebbe.
 */
const PLAYER_POOLS = POOL_IDS.filter((pool) => POOLS[pool].player)

/**
 * Il **patrimonio netto**: la somma delle pozze che sono del giocatore.
 *
 * Sta qui e non in due punti perché due somme dello stesso patrimonio sono due patrimoni — la
 * stessa trappola già chiusa per la commissione del bancomat (INV-11) e per la capienza del caveau
 * (INV-18), qui applicata al numero più visibile del gioco. Lo leggono il riquadro del cruscotto,
 * la serie che ne registra l'andamento, e chiunque altro arriverà: **la stessa funzione**, non due
 * che oggi rispondono uguale.
 *
 * Vive in `contracts/ledger.ts` e non in `pools.ts` perché il suo argomento è `Balances`, e la
 * freccia fra i due file va in quel verso: `ledger` importa `pools`, quindi il contrario sarebbe
 * un ciclo.
 *
 * Il rovescio dell'identità INV-08 vista dal giocatore: `earned - spent - feesPaid` è **sempre**
 * questo numero, perché la somma di tutti i conti fa zero.
 */
export const netWorthOf = (balances: Balances): Money =>
  PLAYER_POOLS.reduce((total, pool) => total.plus(balances[pool]), ZERO)

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
