/**
 * Lo stato del caveau, e la sua forma salvata.
 *
 * Un numero solo, e non è poco: è l'unica cosa che il caveau ricorda, perché tutto il resto — la
 * capienza, il costo del prossimo ampliamento, quanti livelli restano — si **calcola** da lì con
 * una regola pura. Salvare la capienza accanto al livello sarebbe salvare due volte lo stesso
 * fatto, e il giorno in cui la curva cambia le vecchie partite porterebbero in giro il numero
 * vecchio.
 *
 * Il livello parte da zero, che è il caveau con cui il giocatore comincia: il primo strumento del
 * gioco non ha requisiti e non si sblocca (docs/design/domini/vault.md).
 */
export interface VaultState {
  readonly level: number
}

/**
 * Ciò che finisce nel salvataggio sotto la chiave `vault`. Oggi coincide con lo stato, e i due nomi
 * restano distinti per la ragione di `income/types.ts`: `VaultState` è ciò che il sistema tiene in
 * memoria, `VaultSave` è il contratto con il file su disco. Gli oggetti — che il caveau conserverà
 * insieme ai contanti — arrivano col black market e con le aste di box, e il giorno in cui
 * arriveranno sarà `VaultSave` a crescere.
 */
export type VaultSave = VaultState
