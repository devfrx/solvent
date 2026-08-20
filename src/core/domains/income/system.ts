import type { CommandHandler } from '@core/contracts/commands'
import type { Pool } from '@core/contracts/pools'

import type { Modifiers } from '@core/balance/modifiers'
import { income, type Ledger } from '@core/kernel/Ledger'
import { defineSystem, ORDER, type Stateful } from '@core/kernel/Registry'

import { createBuyUpgrade, type IncomeError } from './commands'
import { incomeOver, upgradeModifier, UPGRADE_MODIFIER_ID } from './rules'
import type { IncomeSave, IncomeState } from './types'

/**
 * Il primo sistema del gioco. Non calcola: legge il proprio stato, chiama le regole pure e chiede
 * al Ledger di applicare. Il denaro non lo tocca mai, e `world` non lo nomina mai — lo scrive il
 * costruttore `income()` (INV-10).
 */

const INITIAL: IncomeState = { upgraded: false }

export interface Income {
  readonly system: Stateful<IncomeSave>
  /**
   * Lo stato, in sola lettura. Serve a chi deve **anticipare** l'esito di un acquisto —
   * `canBuyUpgrade` lo vuole per argomento — e non è `save()` travestito: `save()` è il contratto
   * con il disco, e i due nomi restano distinti proprio perché rispondono a domande diverse
   * (`types.ts`). Il giorno in cui lo stato guadagna un campo che non si salva, questa firma non
   * cambia e quella sì.
   */
  readonly state: () => IncomeState
  /**
   * ADR 0027 — l'argomento è lo **strumento**, non il prezzo. Chi chiama sceglie con cosa paga; a
   * dire quanto costa con quello resta il listino, che il comando interroga da sé.
   */
  readonly buyUpgrade: CommandHandler<Pool, IncomeState, IncomeError>
}

/**
 * `modifiers` arriva per costruzione perché non può stare nel `SystemContext`: vive in `balance/`,
 * e `kernel/` non può importare `balance/` (D008). `ledger` arriva per la stessa porta ma per una
 * ragione diversa: un comando parte dalla UI, fuori da ogni `tick`, quindi nasce già legato al
 * proprio contesto (docs/design/flusso-tick.md).
 *
 * **Deve essere lo stesso `Ledger` che il runtime mette nel `SystemContext`.** Due istanze diverse
 * sono due partite diverse, e nessun tipo lo impedisce: è il prezzo di avere i comandi fuori dal
 * tick, e sta al bootstrap (D011) pagarlo una volta sola.
 */
export const createIncome = (ledger: Ledger, modifiers: Modifiers): Income => {
  let state: IncomeState = INITIAL
  const purchase = createBuyUpgrade({ ledger, modifiers })

  /**
   * Il modificatore vive nel registro, non nello stato: dopo un `load` o un `reset` va rimesso
   * d'accordo con lo stato. `remove` prima di `register` perché `register` lancia sul duplicato, e
   * caricare due volte di fila è lecito.
   */
  const syncUpgradeModifier = (): void => {
    modifiers.remove(UPGRADE_MODIFIER_ID)
    if (state.upgraded) modifiers.register(upgradeModifier())
  }

  return {
    system: defineSystem<IncomeSave>({
      id: 'income',
      order: ORDER.INCOME,

      tick: (ctx, elapsed) => {
        // Il `Result` del Ledger non ha un ramo da gestire qui, e non è una svista: dopo il
        // posting il tick non fa altro, e l'unico fallimento possibile — la capienza del caveau —
        // non esiste prima della fetta 02. Quando esisterà, il reddito non incassato sarà un
        // esito da mostrare al giocatore, e questa riga crescerà di conseguenza.
        ctx.ledger.transaction(income('cash', incomeOver(ctx.clock, modifiers, elapsed)), {
          reason: 'reason.income.tick'
        })
      },

      save: () => state,

      load: (loaded) => {
        // `SystemsSave` è opaco per lo schema del main (ADR 0002, D009): un salvataggio manomesso
        // o prodotto da una versione bacata arriva fin qui intatto, e questo è l'unico punto che
        // può guardarlo. Un `load` che lancia è un esito — `loadAll` lo trasforma in
        // `error.registry.load_failed` — mentre accettarlo declasserebbe il giocatore in silenzio.
        if (typeof loaded?.upgraded !== 'boolean') {
          throw new TypeError(
            `income — stato salvato non valido: 'upgraded' deve essere un booleano.`
          )
        }
        state = { upgraded: loaded.upgraded }
        syncUpgradeModifier()
      },

      // `soft` e `hard` fanno la stessa cosa, e a dirlo è questo commento invece di un `if` che
      // finge una differenza: il prestige è la fetta 06, e nessun documento ha ancora deciso se un
      // upgrade comprato con i soldi sopravvive a un reset morbido. Sceglierlo qui adesso
      // significherebbe inventare una regola di gioco dentro una delega che non la riguarda.
      reset: () => {
        state = INITIAL
        syncUpgradeModifier()
      }
    }),

    state: () => state,

    buyUpgrade: (pool) => {
      const bought = purchase({ state, pool })
      if (bought.ok) state = bought.value
      return bought
    }
  }
}
