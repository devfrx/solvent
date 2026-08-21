import type { Money } from '@core/contracts/money'
import type { PaymentOption, PriceList } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'
import { CASH_START_CAPACITY } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'

import type { VaultState } from './types'

/**
 * Le regole del caveau. Tutte pure (R13): nessun contesto, nessun effetto, nessuna lettura
 * dell'ora, nessuna casualità — il caveau non ticchetta e non usa l'Rng, e discende dalla varianza
 * zero decisa nella scheda del dominio.
 *
 * Da `kernel/` questo file non importa niente, nemmeno un tipo: capienze, prezzi e livelli sono
 * aritmetica su `Money` e un indice.
 */

/**
 * Il pool che il caveau tiene, dichiarato **qui** invece che scritto nel bootstrap.
 *
 * È il nome che `createGame` usa per decidere a chi consegnare la capienza variabile (ADR 0025).
 * Scriverlo lì sarebbe un `if` sul nome di un pool in un file che non è del caveau, cioè la forma
 * che l'ADR 0017 esiste per non avere: il dominio dichiara di cosa parla, il bootstrap collega.
 */
export const VAULT_POOL: Pool = 'cash'

/**
 * L'ultimo livello, che è anche «di quanti» il giocatore vede scritto accanto al proprio.
 *
 * Si **conta**, non si dichiara: un numero accanto a un elenco è un numero che invecchia quando
 * l'elenco cambia, ed è il difetto che D021 ha tolto ai documenti. Vale qui per la stessa ragione.
 */
export const MAX_LEVEL: number = BALANCE.VAULT_CAPACITIES.length - 1

/**
 * Quanto ci sta nel caveau a un certo livello. È la funzione che il Ledger fa rispettare e che la
 * UI mostra: una sola, interrogata da entrambi (INV-18).
 *
 * Il livello si stringe fra zero e il massimo invece di fidarsi di chi chiama: un livello fuori
 * scala arriva da un salvataggio, cioè da fuori, e una capienza `undefined` diventerebbe un tetto
 * che non esiste — cioè nessun tetto, cioè il contrario del muro.
 *
 * Il ripiego dopo il `??` è ciò che `noUncheckedIndexedAccess` pretende da un accesso indicizzato.
 * Non si raggiunge — l'indice è già stretto — e la capienza di partenza è l'unico valore che
 * abbia senso mettere lì: se l'elenco fosse vuoto, il caveau sarebbe quello del primo secondo.
 *
 * **La capienza è misurata in euro**, e resterà così: il giorno in cui il caveau conterrà anche
 * oggetti, il loro ingombro — dichiarato nella stessa unità — si sottrae **dentro questa
 * funzione** e nient'altro si muove (docs/design/domini/vault.md, _Lo spazio_).
 */
export const capacityFor = (level: number): Money =>
  BALANCE.VAULT_CAPACITIES[Math.min(Math.max(level, 0), MAX_LEVEL)] ?? CASH_START_CAPACITY

/** Se da qui non si va più da nessuna parte. Il caveau finisce, e il giocatore lo sa dall'inizio. */
export const isMaxLevel = (state: VaultState): boolean => state.level >= MAX_LEVEL

/**
 * Il listino dell'ampliamento: per ogni strumento che lo compra, quanto costa con quello
 * (ADR 0027). È il **primo listino a due voci** del gioco.
 *
 * All'ultimo livello è **vuoto**, e non è un caso limite trattato a parte: gli elenchi dei prezzi
 * hanno un elemento in meno delle capienze, quindi l'indice cade fuori da solo. Chi legge non
 * trova un ramo che distingue «si può» da «non si può» — trova una lista, e una lista vuota è una
 * risposta.
 */
export const expansionPrices = (level: number): PriceList => {
  const cash = BALANCE.VAULT_PRICES_CASH[level]
  const card = BALANCE.VAULT_PRICES_CARD[level]
  return cash === undefined || card === undefined
    ? []
    : [
        { pool: VAULT_POOL, price: cash },
        { pool: 'card', price: card }
      ]
}

/**
 * L'opzione del listino per uno strumento, `null` se il listino non lo offre — o se il listino non
 * c'è più. È la gemella di `upgradePriceFor`, e per la stessa ragione: la UI la chiama prima di
 * mostrare un prezzo, il comando prima di pagarlo, e leggono lo **stesso** posto (INV-19).
 */
export const expansionPriceFor = (level: number, pool: Pool): PaymentOption | null =>
  expansionPrices(level).find((option) => option.pool === pool) ?? null

/**
 * L'anteprima del pulsante: ampliabile se non si è già all'ultimo livello e se quello strumento
 * basta. Il prezzo arriva **per argomento**, dentro l'opzione, e l'opzione viene dal listino: se
 * questa funzione se lo ripescasse da sola sarebbe una seconda lettura da tenere allineata a
 * quella del comando, che è ciò che INV-19 vieta.
 *
 * A decidere resta il Ledger quando il comando esegue: qui si risponde alla UI, che vuole saperlo
 * **prima** di smorzare un pulsante — non di spegnerlo (INV-21).
 */
export const canExpand = (state: VaultState, option: PaymentOption, available: Money): boolean =>
  !isMaxLevel(state) && available.greaterThanOrEqualTo(option.price)
