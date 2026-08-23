import { netWorthOf } from '@core/contracts/ledger'
import type { ResetScope } from '@core/contracts/lifecycle'
import type { Money } from '@core/contracts/money'
import { roomIn } from '@core/contracts/pools'
import type { Result } from '@core/contracts/result'
import { err } from '@core/contracts/result'
import type { SavePayload } from '@core/contracts/save'

import { BALANCE } from '@core/balance/constants'
import type { Modifiers } from '@core/balance/modifiers'
import { createModifiers } from '@core/balance/modifiers'
import { createAtm, type Atm } from '@core/domains/atm/commands'
import { createIncome, type Income } from '@core/domains/income/system'
import { VAULT_POOL } from '@core/domains/vault/rules'
import { createVault, type Vault } from '@core/domains/vault/system'
import { createBus } from '@core/kernel/Bus'
import { clock } from '@core/kernel/Clock'
import type { Ticks } from '@core/kernel/Clock'
import type { Capacities } from '@core/kernel/Ledger'
import { createLedger, poolCapacity } from '@core/kernel/Ledger'
import type { LoadReport, Registry, RegistryError, SystemContext } from '@core/kernel/Registry'
import { createRegistry } from '@core/kernel/Registry'
import { createRng, randomSeed } from '@core/kernel/Rng'

import type { Candle } from './candles'
import { createChronicle, type Series } from './chronicle'

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

/**
 * D037 — ciò che questa partita registra del proprio passato. Sono tre `Series` di sola lettura:
 * chi le guarda non può spingerci dentro niente, e non ne esiste una seconda copia da tenere
 * allineata.
 *
 * Perché sono qui e non nello store: la serie la alimenta il **tempo**, e il tempo passa in
 * `advance`. Tenerla dove si legge invece che dove si produce era la ragione per cui il recupero
 * all'avvio non la alimentava affatto (`chronicle.ts`).
 */
export interface GameSeries {
  readonly netWorth: Series<Money>
  readonly cash: Series<Candle>
  readonly card: Series<Candle>
}

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
  readonly vault: Vault
  readonly series: GameSeries
  /**
   * D037 · ADR 0043 — **il tempo di gioco avanza qui, e in nessun altro posto.**
   *
   * È la quarta operazione che riguarda tutta la partita, accanto a `save`, `load` e `reset`, e
   * fino a D037 era l'unica delle quattro senza un proprietario: `registry.tickAll` veniva chiamato
   * dal loop e dal recupero, due sequenze scritte a mano che facevano cose diverse. Da lì nasceva
   * il difetto delle serie, e da lì sarebbe nato il prossimo — un salvataggio a cadenza, il
   * calendario dell'[ADR 0023](../../../docs/adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md),
   * un cheat che salta un'ora.
   *
   * A tenerla una sola è `tests/rules/one-way-to-advance` (**R25**): fuori da questo file nessuno
   * del renderer nomina `tickAll`.
   */
  readonly advance: (elapsed: Ticks) => void
  readonly save: () => SavePayload
  readonly load: (payload: SavePayload) => Result<LoadReport, GameLoadError>
  readonly reset: (scope: ResetScope) => void
}

export const createGame = (seed: number = randomSeed()): Game => {
  const bus = createBus()

  /**
   * ADR 0025 — la capienza che il Ledger fa rispettare **si chiede**. Per il pool del caveau
   * risponde il caveau; per tutti gli altri risponde `poolCapacity`, cioè `POOLS` come prima.
   *
   * Questa funzione nomina `vault` prima che `vault` esista, e va bene: non viene **chiamata**
   * prima. La prima interrogazione arriva da una transazione, cioè dopo che il bootstrap è finito.
   * L'alternativa sarebbe costruire il caveau senza il Ledger e consegnarglielo dopo, cioè un
   * oggetto che per un istante non è ancora sé stesso.
   */
  const capacities: Capacities = (pool) =>
    pool === VAULT_POOL ? vault.capacity() : poolCapacity(pool)

  const ledger = createLedger(bus, capacities)
  const rng = createRng(seed)
  const modifiers = createModifiers()
  const registry = createRegistry()

  const ctx: SystemContext = { clock, rng, bus, ledger }

  const vault = createVault(ledger)

  /**
   * Il reddito riceve lo **spazio** per costruzione, non il caveau: `income` non sa che il caveau
   * esiste, e il caveau non sa che c'è uno stipendio. A collegarli è questa riga, che è l'unico
   * posto del progetto che ha entrambi sotto mano — nessun dominio impara il nome di un altro.
   */
  const income = createIncome(ledger, modifiers, (pool) =>
    roomIn(ledger.capacities(pool), ledger.balance(pool))
  )
  const atm = createAtm(ledger)

  registry.register(income.system)
  registry.register(vault.system)

  /**
   * D037 — le registrazioni della cronaca, dichiarate qui accanto ai sistemi e per la stessa
   * ragione: questo file è l'unico che ha il Ledger e i numeri di gioco sotto mano insieme
   * (ADR 0024). La cronaca non sa cosa siano un patrimonio o uno strumento — sa che c'è un numero
   * da guardare ogni tanti tick.
   *
   * **Il patrimonio netto lo somma `netWorthOf`**, la stessa funzione che il riquadro del cruscotto
   * legge attraverso lo store: due somme dello stesso patrimonio sono due patrimoni, ed è la
   * trappola che questo progetto ha già chiuso per la commissione del bancomat e per la capienza
   * del caveau.
   *
   * **Le due candele sono due dichiarazioni e non un ciclo su `POOLS[pool].player`**, che pure
   * sarebbe la regola vera: un ciclo pretenderebbe una chiave i18n costruita a runtime, e le chiavi
   * di questo progetto sono un'unione tipizzata (R12). Il grilletto è il terzo strumento del
   * giocatore, e sta nel registro YAGNI.
   */
  const chronicle = createChronicle(bus)

  const series: GameSeries = {
    netWorth: chronicle.samples({
      every: BALANCE.NET_WORTH_SAMPLE_EVERY,
      keep: BALANCE.NET_WORTH_SAMPLES,
      observe: () => netWorthOf(ledger.balances())
    }),
    cash: chronicle.candles({
      every: BALANCE.INSTRUMENT_CANDLE_EVERY,
      keep: BALANCE.INSTRUMENT_CANDLES,
      observe: () => ledger.balance('cash')
    }),
    card: chronicle.candles({
      every: BALANCE.INSTRUMENT_CANDLE_EVERY,
      keep: BALANCE.INSTRUMENT_CANDLES,
      observe: () => ledger.balance('card')
    })
  }

  return {
    ctx,
    registry,
    modifiers,
    income,
    atm,
    vault,
    series,

    /**
     * L'ordine è **prima i sistemi, poi la cronaca**, e non è indifferente: un campione preso
     * prima del tick porterebbe sempre il gioco di un passo fa. Il Bus è sincrono (ADR 0016),
     * quindi quando `tickAll` ritorna le transazioni del tick sono già state annunciate e le
     * escursioni in corso le hanno già viste.
     */
    advance: (elapsed) => {
      registry.tickAll(ctx, elapsed)
      chronicle.advance(elapsed)
    },

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
      const loaded = registry.loadAll(payload.systems)
      // I saldi sono cambiati e **nessun evento lo dice**: caricare non è un movimento economico.
      // Le escursioni in corso ripartono da qui, o la prima candela di una partita riaperta
      // salirebbe da zero al patrimonio caricato — una salita mai avvenuta, e per giunta quella
      // che decide la scala dell'asse. Solo se il caricamento è riuscito: da un salvataggio
      // rifiutato non si riparte, si va in `Errore`.
      if (loaded.ok) chronicle.reopen()
      return loaded
    },

    /**
     * `hard` è una partita nuova, e una partita nuova ha una casualità nuova: senza un seme
     * diverso il giocatore rigiocherebbe la stessa sequenza. `soft` è il prestige e il seme
     * resta — l'era cambia, la partita no (ADR 0005).
     */
    reset: (scope) => {
      ledger.reset(scope)
      registry.resetAll(scope)
      // **Dopo** il Ledger, non prima: azzerare una serie significa anche riaprire le escursioni
      // sui saldi che ci sono adesso, e adesso è dopo che i saldi sono stati azzerati.
      chronicle.reset()
      if (scope === 'hard') rng.reset(randomSeed())
    }
  }
}
