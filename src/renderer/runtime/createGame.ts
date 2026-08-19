import type { ResetScope } from '@core/contracts/lifecycle'
import type { Result } from '@core/contracts/result'
import { err } from '@core/contracts/result'
import type { SavePayload } from '@core/contracts/save'

import type { Modifiers } from '@core/balance/modifiers'
import { createModifiers } from '@core/balance/modifiers'
import { createAtm, type Atm } from '@core/domains/atm/commands'
import { createIncome, type Income } from '@core/domains/income/system'
import { createBus } from '@core/kernel/Bus'
import { clock } from '@core/kernel/Clock'
import { createLedger } from '@core/kernel/Ledger'
import type { LoadReport, Registry, RegistryError, SystemContext } from '@core/kernel/Registry'
import { createRegistry } from '@core/kernel/Registry'
import { createRng, randomSeed } from '@core/kernel/Rng'

/**
 * R02 · INV-05 · ADR 0002 — il bootstrap, e l'**unico** posto in cui un sistema viene registrato.
 *
 * Aggiungere un dominio è una cartella più **una riga** qui dentro: è il prezzo che l'ADR 0002
 * accetta per avere un ordine dichiarato invece che deciso dal bundler, e a contare che il prezzo
 * sia stato pagato è `tests/rules/registry-completeness`.
 *
 * Non tutti i domini si registrano. `atm` non ha stato e non ticchetta, quindi non è un sistema:
 * `createAtm` ritorna due comandi e basta (D014). Le registrazioni contano i `system.ts`, non le
 * cartelle.
 *
 * **Una partita è un'istanza sola di ciascuna cosa.** Il `Ledger` che finisce nel `SystemContext`
 * è lo stesso che riceve `createIncome` e lo stesso che riceve `createAtm`: due istanze sarebbero
 * due partite che non si vedono, e nessun tipo lo impedisce (ADR 0024). È il motivo per cui la
 * composizione sta tutta in questo file e non è distribuita fra chi ne ha bisogno.
 */

/**
 * Un caricamento può fallire in due modi, e nessuno dei due è un crollo.
 *
 * `error.registry.load_failed` viene da un dominio che rifiuta il proprio stato salvato.
 * `error.game.load_failed` viene dal kernel: `Ledger.load` **lancia** `UnbalancedSaveError` se i
 * conti del salvataggio non sommano a zero (INV-08), e un file manomesso non è un programma
 * scritto male — è uno stato `Errore` da mostrare al giocatore.
 */
export type GameLoadError =
  RegistryError | { readonly code: 'error.game.load_failed'; readonly cause: unknown }

export interface Game {
  readonly ctx: SystemContext
  readonly registry: Registry
  /**
   * Il registro dei modificatori. Non sta nel `SystemContext` — vive in `balance/`, e `kernel/`
   * non può importarlo (D008) — ma esce di qui perché `incomePerSecond` lo vuole: è il numero che
   * la UI mostra, e a leggerlo è lo store, non un `.vue` (R05).
   */
  readonly modifiers: Modifiers
  readonly income: Income
  readonly atm: Atm
  readonly save: () => SavePayload
  readonly load: (payload: SavePayload) => Result<LoadReport, GameLoadError>
  readonly reset: (scope: ResetScope) => void
}

export const createGame = (seed: number = randomSeed()): Game => {
  const bus = createBus()
  const ledger = createLedger(bus)
  const rng = createRng(seed)
  const modifiers = createModifiers()
  const registry = createRegistry()

  const ctx: SystemContext = { clock, rng, bus, ledger }

  const income = createIncome(ledger, modifiers)
  const atm = createAtm(ledger)

  registry.register(income.system)

  return {
    ctx,
    registry,
    modifiers,
    income,
    atm,

    save: () => ({ ledger: ledger.save(), rng: rng.save(), systems: registry.saveAll() }),

    /**
     * L'ordine è kernel prima, domini dopo: se i saldi non reggono non ha senso consegnare uno
     * stato ai sistemi. `Ledger.load` valida **prima** di scrivere, quindi un salvataggio
     * rifiutato non lascia il gioco a metà.
     */
    load: (payload) => {
      try {
        ledger.load(payload.ledger)
        rng.load(payload.rng)
      } catch (cause) {
        return err({ code: 'error.game.load_failed', cause })
      }
      return registry.loadAll(payload.systems)
    },

    /**
     * `hard` è una partita nuova, e una partita nuova ha una casualità nuova: senza un seme
     * diverso il giocatore rigiocherebbe la stessa sequenza. `soft` è il prestige e il seme
     * resta — l'era cambia, la partita no (ADR 0005).
     */
    reset: (scope) => {
      ledger.reset(scope)
      registry.resetAll(scope)
      if (scope === 'hard') rng.reset(randomSeed())
    }
  }
}
