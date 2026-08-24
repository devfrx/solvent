/**
 * Lo stato del sistema `income`, e la sua forma salvata.
 *
 * Un upgrade solo, quindi un booleano e non un contatore di livelli: più di un livello è fuori
 * scopo per la fetta 01 (D010), e un `number` che vale sempre 0 o 1 è un'astrazione che chiede di
 * essere riempita.
 */
export interface IncomeState {
  readonly upgraded: boolean
  /**
   * Se il giocatore ha messo in regola la propria fonte di reddito (ADR 0052). Da qui discende il
   * **regime**: dove atterra lo stipendio, e quanto ne trattiene lo Stato.
   *
   * Un booleano e non un livello, per la ragione di `upgraded`: i regimi sono due, e un `number`
   * che vale sempre 0 o 1 è un'astrazione che chiede di essere riempita.
   *
   * **Non torna mai a `false`.** L'irreversibilità non è severità: un regime che si cambia quando
   * conviene è un interruttore, e il gioco ottimale di un interruttore è premerlo a ogni
   * oscillazione del saldo — cioè la mansione che l'ADR 0052 esiste per togliere.
   */
  readonly declared: boolean
}

/**
 * Ciò che finisce nel salvataggio sotto la chiave `income`. **Da D043 non coincide più con lo
 * stato**, e la separazione che i due nomi tenevano in vita da D010 serve qui per la prima volta:
 * `declared` è obbligatorio in memoria e **opzionale sul disco**.
 *
 * Non è lassismo, ed è il contrario di fidarsi del salvataggio (INV-20). Una partita scritta prima
 * di D043 è una partita in cui il regime non esisteva, cioè in cui il giocatore era
 * necessariamente in nero: il campo **assente significa qualcosa**, e dichiararlo nel tipo è ciò
 * che permette a `load` di leggerlo senza un cast. Un `declared` **presente e non booleano** resta
 * una manomissione, e `load` la rifiuta come rifiuta un `upgraded` non booleano.
 *
 * È anche la ragione per cui il payload resta alla versione 1: non c'è niente da migrare, c'è un
 * campo il cui significato in assenza è dichiarato.
 */
export type IncomeSave = Omit<IncomeState, 'declared'> & { readonly declared?: boolean }
