/**
 * Lo stato del sistema `income`, e la sua forma salvata.
 *
 * Un upgrade solo, quindi un booleano e non un contatore di livelli: più di un livello è fuori
 * scopo per la fetta 01 (D010), e un `number` che vale sempre 0 o 1 è un'astrazione che chiede di
 * essere riempita.
 */
export interface IncomeState {
  readonly upgraded: boolean
}

/**
 * Ciò che finisce nel salvataggio sotto la chiave `income`. Oggi coincide con lo stato, e i due
 * nomi restano distinti perché rispondono a domande diverse: `IncomeState` è ciò che il sistema
 * tiene in memoria, `IncomeSave` è il contratto con il file su disco. Il giorno in cui lo stato
 * guadagna un campo derivato — che non va salvato — la separazione esiste già.
 */
export type IncomeSave = IncomeState
