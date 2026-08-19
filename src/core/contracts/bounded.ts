/**
 * R09 · ADR 0010 — una lista storica nasce già con il suo limite.
 *
 * `boundedList` è l'unico costruttore, e `max` è obbligatorio: non esiste una firma che permetta
 * di creare una history senza dichiarare quanto è lunga. Il limite sta nel punto di definizione,
 * dove lo legge chi apre quel file — non in una potatura nascosta altrove (difetto A10).
 *
 * Conseguenza: la dimensione massima del salvataggio è la somma dei `max` dichiarati (INV-06).
 */
export interface BoundedList<T> {
  readonly max: number
  readonly items: readonly T[]
}

export function boundedList<T>(max: number): BoundedList<T> {
  if (!Number.isInteger(max) || max < 1) {
    throw new RangeError(
      `R09 — il massimo di una lista limitata è un intero positivo, ricevuto: ${String(max)}`
    )
  }
  return { max, items: [] }
}

/** Aggiunge in coda e scarta i più vecchi. Ritorna una lista nuova: `lista` non viene toccata. */
export function pushBounded<T>(lista: BoundedList<T>, elemento: T): BoundedList<T> {
  return { max: lista.max, items: [...lista.items, elemento].slice(-lista.max) }
}
