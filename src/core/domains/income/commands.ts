import type { CommandHandler } from '@core/contracts/commands'
import type { LedgerError, TransactionMeta } from '@core/contracts/ledger'
import type { PriceList } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'
import { err, ok } from '@core/contracts/result'

import { spend, type Ledger } from '@core/kernel/Ledger'

import {
  declarationPriceFor,
  declarationPrices,
  isMaxLevel,
  levelOf,
  levelPriceFor,
  levelPrices,
  type IncomeSource
} from './rules'
import type { IncomeState } from './types'

/**
 * Gli acquisti del reddito, e la ragione per cui `Result` esiste (ADR 0007): "non hai abbastanza
 * soldi" è un esito di gioco da spiegare, non un guasto da nascondere dietro un pulsante spento.
 */

export type IncomeError =
  | LedgerError
  /**
   * L'ultimo livello è un esito, non un guasto: la scala di una fonte finisce, e il giocatore lo sa
   * dal primo secondo perché legge «livello 3 di 8». Un doppio clic sull'ultimo gradino non è un
   * programma scritto male.
   *
   * Fino a D044 si chiamava `error.income.already_upgraded`, e la differenza non è di nome: allora
   * la fine era «l'hai già comprato», adesso è «da qui non si va più da nessuna parte».
   */
  | { readonly code: 'error.income.max_level' }
  /**
   * Mettersi in regola due volte: un esito e non un guasto. Ed è anche il meccanismo
   * dell'irreversibilità dichiarata dall'ADR 0052 — non esiste un comando che riporti `declared` a
   * `false`, quindi il regime si sceglie una volta e resta.
   */
  | { readonly code: 'error.income.already_declared' }

const AT_MAX_LEVEL: IncomeError = { code: 'error.income.max_level' }
const ALREADY_DECLARED: IncomeError = { code: 'error.income.already_declared' }

/**
 * ADR 0027 — `accepts` **si genera dal listino**, non gli sta accanto, ed è **per livello** perché
 * il listino è per livello.
 *
 * Sono due dichiarazioni della stessa cosa — con quali strumenti si compra questo gradino — e il
 * giorno in cui una cambiasse senza l'altra il giocatore vedrebbe un'opzione che il Ledger
 * rifiuta. Affiancarle e verificarle con un test proteggerebbe da metà del problema; derivarne una
 * dall'altra toglie il problema, ed è la stessa mossa del Registry contro le cinque liste.
 *
 * È il gemello di `paymentFor` del caveau, e qui è corretto per la stessa ragione per cui in D043
 * sarebbe stato sbagliato: il listino si svuota perché la **scala è finita**, cioè per un indice
 * che cade fuori — non perché un booleano dice «l'hai già comprato». Un `accepts` che dipende da un
 * booleano rende variabile ciò che il Ledger deve poter sapere prima di guardare una partita.
 */
export const levelPaymentFor = (from: IncomeSource, level: number): TransactionMeta => ({
  reason: 'reason.income.level',
  accepts: levelPrices(from, level).map((option) => option.pool)
})

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
const notInPriceList = (pool: Pool, prices: PriceList): LedgerError => ({
  code: 'error.ledger.pool_not_accepted',
  pool,
  accepted: prices.map((option) => option.pool)
})

export interface LevelDeps {
  readonly ledger: Ledger
}

/**
 * Ciò che serve per comprare un livello: lo stato di partenza, **quale fonte** si sta migliorando,
 * e lo strumento scelto dal giocatore.
 *
 * Il prezzo non è qui, ed è la decisione centrale dell'ADR 0027. Se arrivasse da fuori, chi lo
 * consegna potrebbe consegnarne uno diverso da quello mostrato, e la garanzia che il prezzo visto
 * e quello addebitato coincidano (INV-19) sarebbe una speranza invece di una proprietà. Il comando
 * riceve la fonte e il pool, e **ricalcola** dal listino.
 */
export interface LevelPurchase {
  readonly state: IncomeState
  readonly source: IncomeSource
  readonly pool: Pool
}

/**
 * Ritorna lo stato **nuovo** invece di scriverlo. Chi possiede lo stato lo assegna solo quando il
 * `Result` è `ok`, e "prima il denaro, poi lo stato" smette di essere una cosa da ricordare: se il
 * Ledger rifiuta, uno stato nuovo non esiste proprio.
 *
 * L'ordine inverso — alzare il livello e poi pagare — lascerebbe una fonte che rende più di quanto
 * il giocatore abbia comprato.
 *
 * **Non registra nessun modificatore**, e da D044 è una differenza che si vede nella firma: i
 * livelli sono aritmetica pura sullo stato, non sorgenti nel registro. Il `mult` che l'upgrade
 * registrava era l'unica registrazione di tutto il gioco, e tenerlo in vita per un solo caso
 * avrebbe voluto dire scrivere la resa in due posti — la scala e il registro — che prima o poi non
 * coincidono.
 */
export const createBuyLevel =
  ({ ledger }: LevelDeps): CommandHandler<LevelPurchase, IncomeState, IncomeError> =>
  ({ state, source, pool }) => {
    if (isMaxLevel(state, source)) return err(AT_MAX_LEVEL)

    const level = levelOf(state, source)
    const chosen = levelPriceFor(source, level, pool)
    if (chosen === null) return err(notInPriceList(pool, levelPrices(source, level)))

    const paid = ledger.transaction(
      spend(chosen.pool, chosen.price),
      levelPaymentFor(source, level)
    )
    if (!paid.ok) return paid

    return ok({ ...state, levels: { ...state.levels, [source.id]: level + 1 } })
  }

/**
 * Il pagamento della dichiarazione, con `accepts` **generato dal listino** per la ragione scritta
 * su `levelPaymentFor`: sono due dichiarazioni della stessa cosa, e derivarne una dall'altra toglie
 * il problema invece di sorvegliarlo.
 */
export const DECLARATION_PAYMENT: TransactionMeta = {
  reason: 'reason.income.declare',
  accepts: declarationPrices().map((option) => option.pool)
}

/**
 * Mettersi in regola non registra nessun modificatore — il reddito non cambia di un centesimo, ne
 * cambia la **destinazione** — quindi questo comando ha bisogno del solo Ledger.
 */
export interface DeclareDeps {
  readonly ledger: Ledger
}

/** Come `LevelPurchase`: lo stato di partenza e lo strumento scelto. Il prezzo no (ADR 0027). */
export interface Declaration {
  readonly state: IncomeState
  readonly pool: Pool
}

/**
 * ADR 0052 — il comando che cambia il regime del reddito.
 *
 * Ritorna lo stato **nuovo** invece di scriverlo, come il suo gemello, e lo ritorna **a partire da
 * quello vecchio**: `{ ...state, declared: true }` e non un oggetto costruito da zero, o
 * dichiararsi cancellerebbe i livelli già comprati. Da D044 quel difetto costerebbe più di prima —
 * non un booleano, un elenco.
 */
export const createDeclare =
  ({ ledger }: DeclareDeps): CommandHandler<Declaration, IncomeState, IncomeError> =>
  ({ state, pool }) => {
    if (state.declared) return err(ALREADY_DECLARED)

    const chosen = declarationPriceFor(pool)
    if (chosen === null) return err(notInPriceList(pool, declarationPrices()))

    const paid = ledger.transaction(spend(chosen.pool, chosen.price), DECLARATION_PAYMENT)
    if (!paid.ok) return paid

    return ok({ ...state, declared: true })
  }
