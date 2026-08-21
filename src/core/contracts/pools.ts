import type { Money } from './money'
import { fromString, ZERO } from './money'

/**
 * ADR 0017 — il denaro è plurale: `Pool` è una dimensione di prima classe, non un'etichetta
 * della UI. Ogni pool dichiara le proprie affordance come **dati**, così nessun dominio contiene
 * un `if` sul nome del pool.
 *
 * ADR 0020 — accanto ai pool del giocatore esistono i conti non-giocatore. Senza di loro la somma
 * di tutti i conti non farebbe zero, e la partita doppia sarebbe una decorazione.
 *
 * L'ordine di questa lista è l'ordine con cui i saldi finiscono nel salvataggio: è stabile.
 */
export const POOL_IDS = ['cash', 'card', 'world', 'sink', 'fees', 'house'] as const

export type Pool = (typeof POOL_IDS)[number]

export interface PoolProps {
  /** Se i movimenti lasciano traccia: i contanti no, la carta sì. */
  readonly traceable: boolean
  /**
   * Il tetto fisico del pool **quando nessuno l'ha ancora ampliato**. `null` = nessun tetto.
   *
   * Da ADR 0025 non è più l'ultima parola: il Ledger riceve una funzione, e per i contanti
   * quella funzione la possiede il caveau. Questo dato resta la **dichiarazione di partenza** —
   * ciò che vale in una partita appena nata, e ciò che vale per chi costruisce un Ledger senza
   * consegnargli niente.
   */
  readonly capacity: Money | null
  /** Se il saldo fermo produce interessi. */
  readonly yields: boolean
  /** Se il pool è del giocatore. I conti dell'ADR 0020 non compaiono mai nella UI. */
  readonly player: boolean
}

/**
 * La capienza del caveau al livello zero, ed è un numero di gioco che vive qui invece che in
 * `balance/` per una ragione sola: `contracts/` non può importare `balance/` (il verso della
 * freccia è `BAL --> CON`), e la dichiarazione di un pool è fatta di dati suoi (ADR 0017).
 *
 * Non è una seconda dichiarazione della curva: `BALANCE.VAULT_CAPACITIES` **comincia da questa
 * costante**, quindi il livello zero è scritto in un posto solo e letto da due — che è la forma
 * di INV-18 applicata al primo gradino.
 */
export const CASH_START_CAPACITY: Money = fromString('1000')

export const POOLS: Readonly<Record<Pool, PoolProps>> = {
  cash: { traceable: false, capacity: CASH_START_CAPACITY, yields: false, player: true },
  card: { traceable: true, capacity: null, yields: false, player: true },

  // Conti non-giocatore (ADR 0020): contabilità interna. Tutto ciò che li attraversa è
  // registrato, nessuno ha un tetto e nessuno matura interessi. `world` è normalmente negativo.
  world: { traceable: true, capacity: null, yields: false, player: false },
  sink: { traceable: true, capacity: null, yields: false, player: false },
  fees: { traceable: true, capacity: null, yields: false, player: false },
  house: { traceable: true, capacity: null, yields: false, player: false }
}

/**
 * Quanto ci sta **ancora**, `null` se non c'è tetto. È il fratello di `fitsIn`, che risponde «sì o
 * no» alla stessa domanda, ed è ciò che permette al reddito di accreditare il parziale invece di
 * incassare un rifiuto intero.
 *
 * Senza di lui il recupero dopo un'assenza tornerebbe **zero**: `recover()` fa un solo `tickAll`
 * con tutti i tick arretrati, cioè una transazione sola da otto ore di reddito, e il Ledger la
 * rifiuta intera perché una transazione è atomica (ADR 0019). Non sarebbe un muro: sarebbe un
 * guasto travestito da regola.
 *
 * Mai negativo. Un saldo sopra il tetto non è impossibile — basta un ampliamento che un giorno
 * riducesse la capienza, o un salvataggio più vecchio della curva — e «ci sta meno di niente» non
 * è una quantità che qualcuno possa accreditare.
 */
export const roomIn = (capacity: Money | null, current: Money): Money | null => {
  if (capacity === null) return null
  const left = capacity.minus(current)
  return left.isNegative() ? ZERO : left
}
