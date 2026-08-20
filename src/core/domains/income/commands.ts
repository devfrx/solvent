import type { CommandHandler } from '@core/contracts/commands'
import type { LedgerError, TransactionMeta } from '@core/contracts/ledger'
import type { Pool } from '@core/contracts/pools'
import { err, ok } from '@core/contracts/result'

import type { Modifiers } from '@core/balance/modifiers'
import { spend, type Ledger } from '@core/kernel/Ledger'

import { upgradeModifier, upgradePriceFor, upgradePrices } from './rules'
import type { IncomeState } from './types'

/**
 * L'acquisto dell'upgrade, e la ragione per cui `Result` esiste (ADR 0007): "non hai abbastanza
 * soldi" è un esito di gioco da spiegare, non un guasto da nascondere dietro un pulsante spento.
 */

export type IncomeError =
  | LedgerError
  /**
   * Comprare due volte non è un raddoppio legittimo: il registro dei modificatori lo rifiuterebbe
   * **lanciando**, e un doppio clic non è un programma scritto male. Qui diventa un esito.
   */
  | { readonly code: 'error.income.already_upgraded' }

const ALREADY_UPGRADED: IncomeError = { code: 'error.income.already_upgraded' }

/**
 * ADR 0027 — `accepts` **si genera dal listino**, non gli sta accanto.
 *
 * Sono due dichiarazioni della stessa cosa — con quali strumenti si compra questo upgrade — e il
 * giorno in cui una cambiasse senza l'altra il giocatore vedrebbe un'opzione che il Ledger
 * rifiuta. Affiancarle e verificarle con un test proteggerebbe da metà del problema; derivarne una
 * dall'altra toglie il problema, ed è la stessa mossa del Registry contro le cinque liste.
 *
 * Resta esportata perché è la dichiarazione del dominio, non un dettaglio del comando: un test la
 * mette davanti a un pagamento in contanti per verificare che il Ledger la faccia valere davvero.
 */
export const UPGRADE_PAYMENT: TransactionMeta = {
  reason: 'reason.income.upgrade',
  accepts: upgradePrices().map((option) => option.pool)
}

/**
 * Uno strumento che il listino non offre, detto con il codice del Ledger invece che con uno nuovo.
 *
 * È lo stesso fatto e porta le stesse due informazioni — quale pool, e quali andavano bene — quindi
 * il giocatore legge la stessa frase da qualunque delle due strade arrivi. Un codice nuovo sarebbe
 * una seconda frase per una situazione sola.
 *
 * Il rifiuto arriva **prima** del Ledger, e non lo scavalca: `transaction` è raggiungibile solo con
 * un prezzo, e un pool fuori listino un prezzo non ce l'ha. Per i pool che il listino offre,
 * l'ultima parola resta di `accepts`.
 */
const notInPriceList = (pool: Pool): LedgerError => ({
  code: 'error.ledger.pool_not_accepted',
  pool,
  accepted: upgradePrices().map((option) => option.pool)
})

export interface UpgradeDeps {
  readonly ledger: Ledger
  readonly modifiers: Modifiers
}

/**
 * Ciò che serve per comprare: lo stato di partenza, e lo **strumento scelto dal giocatore**.
 *
 * Il prezzo non è qui, ed è la decisione centrale dell'ADR 0027. Se arrivasse da fuori, chi lo
 * consegna potrebbe consegnarne uno diverso da quello mostrato, e la garanzia che il prezzo visto
 * e quello addebitato coincidano (INV-19) sarebbe una speranza invece di una proprietà. Il comando
 * riceve il pool e **ricalcola** dal listino.
 */
export interface UpgradePurchase {
  readonly state: IncomeState
  readonly pool: Pool
}

/**
 * Ritorna lo stato **nuovo** invece di scriverlo. Chi possiede lo stato lo assegna solo quando il
 * `Result` è `ok`, e "prima il denaro, poi lo stato" smette di essere una cosa da ricordare: se il
 * Ledger rifiuta, uno stato nuovo non esiste proprio.
 *
 * L'ordine inverso — scalare lo stato e poi pagare — è la trappola nota di questa delega: il
 * Ledger rifiuterebbe lo stesso, ma sistema e saldi resterebbero disallineati.
 */
export const createBuyUpgrade =
  ({ ledger, modifiers }: UpgradeDeps): CommandHandler<UpgradePurchase, IncomeState, IncomeError> =>
  ({ state, pool }) => {
    if (state.upgraded) return err(ALREADY_UPGRADED)

    const chosen = upgradePriceFor(pool)
    if (chosen === null) return err(notInPriceList(pool))

    const paid = ledger.transaction(spend(chosen.pool, chosen.price), UPGRADE_PAYMENT)
    if (!paid.ok) return paid

    modifiers.register(upgradeModifier())
    return ok({ upgraded: true })
  }
