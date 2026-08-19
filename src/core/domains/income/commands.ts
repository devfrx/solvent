import type { CommandHandler } from '@core/contracts/commands'
import type { LedgerError, TransactionMeta } from '@core/contracts/ledger'
import { err, ok } from '@core/contracts/result'

import type { Modifiers } from '@core/balance/modifiers'
import { spend, type Ledger } from '@core/kernel/Ledger'

import { upgradeCost, upgradeModifier } from './rules'
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
 * ADR 0017 — l'upgrade si paga **solo** con la carta, e lo dichiara qui invece che in un `if`: il
 * Ledger rifiuta con `error.ledger.pool_not_accepted` ogni movimento su un pool del giocatore
 * fuori dall'elenco, e l'elenco viaggia dentro l'errore, così la UI può dire con cosa si paga.
 *
 * È esportata perché è la dichiarazione del dominio, non un dettaglio del comando: chi vuole
 * sapere con quali strumenti si compra questo upgrade legge questa costante, e un test la mette
 * davanti a un pagamento in contanti per verificare che morda davvero.
 */
export const UPGRADE_PAYMENT: TransactionMeta = {
  reason: 'reason.income.upgrade',
  accepts: ['card']
}

export interface UpgradeDeps {
  readonly ledger: Ledger
  readonly modifiers: Modifiers
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
  ({ ledger, modifiers }: UpgradeDeps): CommandHandler<IncomeState, IncomeState, IncomeError> =>
  (state) => {
    if (state.upgraded) return err(ALREADY_UPGRADED)

    const paid = ledger.transaction(spend('card', upgradeCost()), UPGRADE_PAYMENT)
    if (!paid.ok) return paid

    modifiers.register(upgradeModifier())
    return ok({ upgraded: true })
  }
