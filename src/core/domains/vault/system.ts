import type { CommandHandler } from '@core/contracts/commands'
import type { LedgerError, TransactionMeta } from '@core/contracts/ledger'
import type { Money } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import { err, ok } from '@core/contracts/result'

import { spend, type Ledger } from '@core/kernel/Ledger'
import { defineSystem, ORDER, type Stateful } from '@core/kernel/Registry'

import { cashCapacityFor, expansionPriceFor, expansionPrices, isMaxLevel, MAX_LEVEL } from './rules'
import type { VaultSave, VaultState } from './types'

/**
 * Il primo muro del gioco: i contanti occupano spazio, e quando lo spazio finisce l'unica via è la
 * carta — che lascia tracce. È la prima volta che la dualità dell'ADR 0017 smette di essere una
 * descrizione e diventa una costrizione.
 *
 * Il caveau **ha stato** — il livello — quindi ha un `system.ts` e si registra, al contrario di
 * `atm` (D014, decisione 1). E **non ticchetta**: `tick` resta assente, il tipo lo permette, e
 * discende dalla varianza zero — senza furto casuale non c'è niente che debba accadere da solo.
 *
 * Il suo `order` è `ECONOMY`, e la scelta pesa meno di quanto sembri: senza `tick`, l'ordine decide
 * solo quello di salvataggio e caricamento. Pesa però in un punto preciso, ed è la ragione vera per
 * cui `ECONOMY` è giusto e non solo comodo: `ECONOMY` viene **prima** di `INCOME`, quindi al
 * ricaricamento il caveau ritrova il proprio livello prima che il recupero faccia ticchettare il
 * reddito. Con l'ordine opposto, otto ore di stipendio arretrato si misurerebbero contro la
 * capienza di una partita appena nata. Aprire una fase nuova per un sistema che non ticchetta
 * sarebbe l'astrazione speculativa che l'ADR 0014 vieta.
 */

const INITIAL: VaultState = { level: 0 }

export type VaultError =
  | LedgerError
  /**
   * L'ultimo livello è un esito, non un guasto: il caveau finisce, e il giocatore lo sa dal primo
   * secondo. Un doppio clic sull'ultimo ampliamento non è un programma scritto male.
   */
  | { readonly code: 'error.vault.max_level' }

const AT_MAX_LEVEL: VaultError = { code: 'error.vault.max_level' }

/**
 * ADR 0027 — `accepts` **si genera dal listino**, non gli sta accanto, ed è per livello perché il
 * listino è per livello. Affiancare le due dichiarazioni e verificarle con un test proteggerebbe
 * da metà del problema; derivarne una dall'altra toglie il problema.
 */
const paymentFor = (level: number): TransactionMeta => ({
  reason: 'reason.vault.expand',
  accepts: expansionPrices(level).map((option) => option.pool)
})

/**
 * Uno strumento che il listino non offre, detto con il codice del Ledger invece che con uno nuovo:
 * è lo stesso fatto e porta le stesse due informazioni, quindi il giocatore legge la stessa frase
 * da qualunque delle due strade arrivi (D019, correzione 3).
 */
const notInPriceList = (level: number, pool: Pool): LedgerError => ({
  code: 'error.ledger.pool_not_accepted',
  pool,
  accepted: expansionPrices(level).map((option) => option.pool)
})

export interface Vault {
  readonly system: Stateful<VaultSave>
  /** Lo stato, in sola lettura. Serve a chi deve **anticipare** l'esito di un ampliamento. */
  readonly state: () => VaultState
  /**
   * Quanti **contanti** ci stanno adesso. È questa funzione che il bootstrap consegna al Ledger
   * (ADR 0025) e che la UI interroga: **una sola**, non due che devono coincidere (INV-18).
   *
   * Fino a D042 si chiamava `capacity`, e il nome bastava perché di capienze ce n'era una. Adesso
   * ce ne sono due — l'**ingombro**, che è la grandezza fisica del caveau, e quanti euro di
   * contanti ci stiano dentro (ADR 0051) — e chi riceve questa funzione riceve la seconda: euro,
   * come prima, calcolati diversamente.
   */
  readonly cashCapacity: () => Money
  /**
   * ADR 0027 — l'argomento è lo **strumento**, non il prezzo. Chi chiama sceglie con cosa paga; a
   * dire quanto costa con quello resta il listino, che il comando interroga da sé.
   */
  readonly expand: CommandHandler<Pool, VaultState, VaultError>
}

/**
 * `ledger` arriva per costruzione e non dal contesto: un comando parte dalla UI, fuori da ogni
 * `tick` (ADR 0024). **Deve essere lo stesso `Ledger` che il runtime mette nel `SystemContext`**:
 * due istanze sono due partite, e nessun tipo lo impedisce.
 */
export const createVault = (ledger: Ledger): Vault => {
  let state: VaultState = INITIAL

  return {
    system: defineSystem<VaultSave>({
      id: 'vault',
      order: ORDER.ECONOMY,

      save: () => state,

      /**
       * INV-20 · D020 — **campo per campo**, non «è un oggetto».
       *
       * `SystemsSave` è opaco per lo schema del main (ADR 0002, D009): un salvataggio manomesso o
       * prodotto da una versione bacata arriva fin qui intatto, e questo è l'unico punto che può
       * guardarlo. Qui il controllo pigro costerebbe caro più che altrove: un livello frazionario
       * o fuori scala non fa rumore — produce una capienza sbagliata, che il Ledger fa rispettare
       * e che il giocatore scopre come stipendio che non arriva.
       */
      load: (loaded) => {
        const level: unknown = loaded?.level
        if (
          typeof level !== 'number' ||
          !Number.isInteger(level) ||
          level < 0 ||
          level > MAX_LEVEL
        ) {
          throw new TypeError(
            `vault — stato salvato non valido: 'level' deve essere un intero fra 0 e ${MAX_LEVEL}.`
          )
        }
        state = { level }
      },

      // `soft` e `hard` fanno la stessa cosa, e a dirlo è questo commento invece di un `if` che
      // finge una differenza: il prestige non esiste più come struttura di gioco, e cosa un reset
      // morbido conservi del caveau non l'ha ancora deciso nessun documento.
      reset: () => {
        state = INITIAL
      }
    }),

    state: () => state,

    cashCapacity: () => cashCapacityFor(state.level),

    /**
     * Ritorna lo stato **nuovo** invece di scriverlo prima di pagare: se il Ledger rifiuta, un
     * livello nuovo non esiste proprio. L'ordine inverso — alzare il livello e poi pagare —
     * lascerebbe un caveau più grande di quello che il giocatore ha comprato.
     */
    expand: (pool) => {
      if (isMaxLevel(state)) return err(AT_MAX_LEVEL)

      const chosen = expansionPriceFor(state.level, pool)
      if (chosen === null) return err(notInPriceList(state.level, pool))

      const paid = ledger.transaction(spend(chosen.pool, chosen.price), paymentFor(state.level))
      if (!paid.ok) return paid

      state = { level: state.level + 1 }
      return ok(state)
    }
  }
}
