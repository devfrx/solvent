/**
 * Il vocabolario del ciclo di vita di una partita: le parole che usa chiunque possieda uno stato.
 *
 * Sta in `contracts/` e non dentro il Registry o il Ledger perché serve a entrambi, e un tipo che
 * abita in uno dei due costringe l'altro a importare all'insù. La direzione è già fissata: il
 * Registry conosce il Ledger — glielo consegna nel contesto di ogni `tick` — quindi il Ledger non
 * può conoscere il Registry (docs/architettura.md).
 */

/**
 * `soft` è il prestige: ogni possessore di stato decide **cosa conserva**, e lo decide nel proprio
 * file — mai in una lista di eccezioni centralizzata, che è la forma in cui questo degrada.
 * `hard` è una partita nuova: tutti azzerano (docs/design/flusso-salvataggio.md).
 */
export type ResetScope = 'soft' | 'hard'
