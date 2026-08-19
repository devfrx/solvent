import type { Money } from './money'

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
  /** Il tetto fisico del pool. `null` = nessun tetto; il caveau arriva con la fetta 02. */
  readonly capacity: Money | null
  /** Se il saldo fermo produce interessi. */
  readonly yields: boolean
  /** Se il pool è del giocatore. I conti dell'ADR 0020 non compaiono mai nella UI. */
  readonly player: boolean
}

export const POOLS: Readonly<Record<Pool, PoolProps>> = {
  cash: { traceable: false, capacity: null, yields: false, player: true },
  card: { traceable: true, capacity: null, yields: false, player: true },

  // Conti non-giocatore (ADR 0020): contabilità interna. Tutto ciò che li attraversa è
  // registrato, nessuno ha un tetto e nessuno matura interessi. `world` è normalmente negativo.
  world: { traceable: true, capacity: null, yields: false, player: false },
  sink: { traceable: true, capacity: null, yields: false, player: false },
  fees: { traceable: true, capacity: null, yields: false, player: false },
  house: { traceable: true, capacity: null, yields: false, player: false }
}
