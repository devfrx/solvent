import type { Balances, Transaction } from './ledger'

/**
 * L'unica interfaccia degli eventi del gioco. Un solo file, una sola interfaccia: se qualcuno la
 * estende con `declare module`, la regola è violata.
 *
 * ADR 0016 — il Bus è sincrono e fire-and-forget: un evento notifica, non chiede.
 *
 * Qui c'è **solo** ciò che la fetta 01 emette davvero. `GameEvents` cresce con i sistemi: un
 * evento dichiarato prima di avere chi lo emette è un contratto che nessuno verifica.
 */
export interface GameEvents {
  /**
   * ADR 0019 — porta una transazione, non un movimento, ed è emesso **una volta sola**, dopo che
   * tutti i saldi sono cambiati: `balances` è già lo stato nuovo, completo e coerente.
   */
  'money.posted': {
    readonly transaction: Transaction
    readonly balances: Balances
  }
}
