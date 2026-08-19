import type { Result } from './result'

/**
 * ADR 0007 — l'errore di un comando ha **sempre** un `code`, che è una chiave i18n: il componente
 * riceve un codice e lo traduce, non indovina una frase.
 */
export interface CodedError {
  readonly code: string
}

/**
 * R10 — un comando ritorna `Result`. Non è una convenzione: è la firma, e nei comandi la regola
 * è imposta dal compilatore.
 *
 * Il contesto non compare fra i parametri: un comando nasce già legato al proprio contesto,
 * costruito dal runtime (docs/design/flusso-tick.md).
 */
export type CommandHandler<A, T, E extends CodedError> = (args: A) => Result<T, E>
