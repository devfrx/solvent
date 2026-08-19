/**
 * R10 · ADR 0007 — l'unico stile di esito del progetto.
 *
 * Un `boolean` non dice *perché*, e la UI finisce per indovinare il messaggio. Qui l'errore
 * viaggia insieme all'esito, e il compilatore obbliga a guardarlo prima di leggere `value`.
 *
 * Gli helper (`map`, `andThen`, `unwrap`) non ci sono di proposito: il grilletto è il terzo
 * punto in cui servono davvero (docs/roadmap-fette.md). Con due, si scrive a mano.
 */
export type Result<T, E> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })
