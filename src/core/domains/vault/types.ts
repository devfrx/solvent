import type { Money } from '@core/contracts/money'

/**
 * Lo stato del caveau, e la sua forma salvata.
 *
 * Un numero solo, e non è poco: è l'unica cosa che il caveau ricorda, perché tutto il resto — lo
 * spazio, la capienza in contanti, il costo del prossimo ampliamento, quanti livelli restano — si
 * **calcola** da lì con una regola pura. Salvare la capienza accanto al livello sarebbe salvare
 * due volte lo stesso fatto, e il giorno in cui la curva cambia le vecchie partite porterebbero in
 * giro il numero vecchio.
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

declare const brand: unique symbol

/**
 * ADR 0051 — **l'ingombro non è una somma di denaro**, e questo tipo è il meccanismo che lo impone.
 *
 * Un caveau contiene contanti **e** oggetti, e l'ingombro di un oggetto per disegno **non è il suo
 * valore**: un quadro da 5.000,00 € può ingombrare 4.000, un diamante da 50.000,00 € può
 * ingombrarne 500 (docs/design/domini/vault.md). Fino a D042 le due grandezze portavano la stessa
 * unità — l'euro — e non si sommavano solo perché nessuno aveva ancora provato: il giorno degli
 * oggetti quella sottrazione si scrive, il compilatore tace, e a valle esce una capienza sbagliata
 * che il giocatore scopre come stipendio che non arriva.
 *
 * È lo stesso marchio che `Ticks` e `Seconds` mettono su un `number` (ADR 0009), e con lo **stesso
 * limite dichiarato**: `Space` è un `Money` con un marchio in più, quindi il compilatore rifiuta un
 * `Money` dove serve uno `Space` — che è il verso in cui l'errore capita — e non il contrario. Vale
 * per la ragione per cui vale nel Clock: prende la forma con cui il difetto nasce davvero.
 *
 * A runtime non esiste: uno `Space` è un `Decimal` e basta.
 */
export type Space = Money & { readonly [brand]: 'Space' }

/**
 * Il costruttore è esplicito apposta, come quelli del Clock: marchiare un valore è un gesto che si
 * vede nel diff, non qualcosa che succede da solo.
 */
export const space = (amount: Money): Space => amount as Space
