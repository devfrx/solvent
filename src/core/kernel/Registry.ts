import type { Result } from '@core/contracts/result'
import { err, ok } from '@core/contracts/result'
import type { SystemsSave } from '@core/contracts/save'

import type { Bus } from '@core/kernel/Bus'
import type { Clock, Ticks } from '@core/kernel/Clock'
import type { Rng } from '@core/kernel/Rng'

/**
 * R02 · A01 · ADR 0002 — il Registry è l'**unica** lista di sistemi che esiste.
 *
 * Il difetto A01 erano cinque liste parallele — tick, save, load, reset, stats — mantenute a mano.
 * Aggiungere un sistema voleva dire cinque modifiche coordinate, e quella dimenticata falliva in
 * silenzio: quasi sempre `reset`, che si scopre al primo prestige, mesi dopo.
 *
 * Qui le cinque operazioni iterano lo **stesso array**, e nessuna di esse guarda l'`id` di un
 * sistema per fare qualcosa di diverso. Il primo `if (system.id === …)` è il momento in cui il
 * difetto sta tornando con un altro nome: lo vieta `tests/rules/registry-senza-casi-speciali`.
 *
 * Il Registry non conosce Vue, Pinia, il disco, né alcun dominio.
 */

/**
 * Le fasi. `order` è una risorsa **globale** (rischio N02): senza fasi nominate, il numero di un
 * sistema si sceglie guardando quello degli altri, ed è un accoppiamento fra sistemi che non si
 * conoscono.
 *
 * Ciò che protegge da N02 non è **quante** fasi sono dichiarate, ma il passo di 100 e il pareggio
 * per `id`: insieme rendono l'inserimento di una fase nuova una riga, senza rinumerare niente e
 * senza spostare l'ordine di nessun sistema esistente. Per questo qui ci sono solo le due che la
 * fetta 01 abita davvero — i nomi sono quelli dell'ADR 0002. Le prossime hanno un grilletto nel
 * registro YAGNI di docs/roadmap-fette.md: il primo sistema che non sta in nessuna delle due.
 */
export const ORDER = {
  /** L'infrastruttura economica: chi sposta denaro fra i pool su richiesta. Fetta 01: `atm`. */
  ECONOMY: 100,
  /** Chi produce denaro col passare del tempo. Fetta 01: `income`. */
  INCOME: 200
} as const

/**
 * Minuscolo, puntato se annidato: `income`, `income.salary` (convenzioni.md). È un nome, non un
 * vincolo: restringerlo a un'unione di id noti obbligherebbe il kernel a conoscere i domini, che è
 * esattamente ciò che l'ADR 0002 vieta.
 */
export type SystemId = string

/** `soft` = prestige, ogni sistema decide cosa conserva. `hard` = partita nuova, tutti azzerano. */
export type ResetScope = 'soft' | 'hard'

/**
 * Il kernel non sa cosa sia una statistica, per la stessa ragione per cui non sa cosa sia lo stato
 * di un sistema: lo sa il dominio che la produce e la schermata che la mostra.
 */
export type SystemStats = Readonly<Record<string, unknown>>

/** Arriva per parametro a ogni `tick`, mai come singleton: è il prezzo di un `core/` puro. */
export interface SystemContext {
  readonly clock: Clock
  readonly rng: Rng
  readonly bus: Bus
}

interface SystemBase {
  readonly id: SystemId
  readonly order: number
  readonly tick?: (ctx: SystemContext, quanti: Ticks) => void
  readonly stats?: () => SystemStats
}

/** Un sistema senza stato. I tre campi a `never` sono ciò che rende `load` senza `save` un errore. */
export interface Stateless extends SystemBase {
  readonly save?: never
  readonly load?: never
  readonly reset?: never
}

/**
 * R07 · A06 — se un sistema ha `save`, ha per forza `load` e `reset`. Non è una convenzione da
 * ricordare: è l'unico modo in cui il tipo si lascia scrivere.
 */
export interface Stateful<S> extends SystemBase {
  readonly save: () => S
  readonly load: (stato: S) => void
  readonly reset: (scope: ResetScope) => void
}

/**
 * La forma che il Registry conserva: `S` è sparito, perché una lista di sistemi con stati diversi
 * non è esprimibile mantenendo il legame fra `save` e `load`. `unknown` in uscita e `never` in
 * ingresso sono i due estremi che accettano **ogni** `Stateful<S>` senza cast in registrazione; il
 * cast, uno solo, sta in `loadAll`.
 */
interface StatefulOpaco extends SystemBase {
  readonly save: () => unknown
  readonly load: (stato: never) => void
  readonly reset: (scope: ResetScope) => void
}

export type AnySystem = Stateless | StatefulOpaco

/** L'esito di `loadAll` quando il salvataggio è più vecchio dei sistemi registrati. */
export interface LoadReport {
  /** Id presenti nel salvataggio e non registrati: sistemi rimossi in una versione più nuova. */
  readonly ignored: readonly SystemId[]
}

export interface RegistryError {
  readonly code: 'error.registry.load_failed'
  readonly id: SystemId
  /** Ciò che il `load` ha lanciato. Non è tipizzabile: arriva da un salvataggio, cioè da fuori. */
  readonly cause: unknown
}

export class DuplicateSystemError extends Error {
  constructor(id: SystemId) {
    super(
      `R02 — sistema già registrato: '${id}'. Due sistemi con lo stesso id sono un salvataggio ` +
        `che si sovrascrive da solo.`
    )
    this.name = 'DuplicateSystemError'
  }
}

export function defineSystem(system: Stateless): Stateless
export function defineSystem<S>(system: Stateful<S>): Stateful<S>
export function defineSystem(system: AnySystem): AnySystem {
  return system
}

export interface Registry {
  readonly register: (system: AnySystem) => void
  readonly systems: () => readonly AnySystem[]
  readonly tickAll: (ctx: SystemContext, quanti: Ticks) => void
  readonly saveAll: () => SystemsSave
  readonly loadAll: (stato: SystemsSave) => Result<LoadReport, RegistryError>
  readonly resetAll: (scope: ResetScope) => void
  readonly statsAll: () => Readonly<Record<SystemId, SystemStats>>
}

const conStato = (system: AnySystem): system is StatefulOpaco => system.save !== undefined

/**
 * A parità di `order` decide l'`id`. Senza il secondo criterio l'ordine dipenderebbe da quello di
 * registrazione, cioè dal bootstrap: due sistemi nella stessa fase gireranno sempre nello stesso
 * ordine, e quell'ordine è leggibile senza aprire `createGame.ts`.
 */
const perOrdine = (a: AnySystem, b: AnySystem): number =>
  a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

export const createRegistry = (): Registry => {
  // L'unica lista. Le cinque operazioni qui sotto iterano questa, e nient'altro.
  const registrati: AnySystem[] = []

  return {
    register: (system) => {
      if (registrati.some((registrato) => registrato.id === system.id)) {
        throw new DuplicateSystemError(system.id)
      }
      registrati.push(system)
      registrati.sort(perOrdine)
    },

    systems: () => registrati,

    tickAll: (ctx, quanti) => {
      for (const system of registrati) system.tick?.(ctx, quanti)
    },

    saveAll: () => {
      const salvato: Record<SystemId, unknown> = {}
      for (const system of registrati) {
        if (conStato(system)) salvato[system.id] = system.save()
      }
      return salvato
    },

    loadAll: (stato) => {
      const noti = new Set(registrati.filter(conStato).map((system) => system.id))
      const ignored = Object.keys(stato).filter((id) => !noti.has(id))

      for (const system of registrati) {
        if (!conStato(system) || !Object.hasOwn(stato, system.id)) continue
        try {
          // L'unico cast del file, ed è il punto in cui uno stato opaco torna al sistema che lo
          // ha prodotto. Che la forma corrisponda non è verificabile qui: `SystemsSave` è opaco
          // anche per lo schema del main, quindi un salvataggio manomesso arriva fin qui. Per
          // questo un `load` che lancia è un esito, non un crollo.
          ;(system.load as (stato: unknown) => void)(stato[system.id])
        } catch (cause) {
          const errore: RegistryError = { code: 'error.registry.load_failed', id: system.id, cause }
          return err(errore)
        }
      }

      return ok({ ignored })
    },

    resetAll: (scope) => {
      for (const system of registrati) {
        if (conStato(system)) system.reset(scope)
      }
    },

    statsAll: () => {
      const raccolte: Record<SystemId, SystemStats> = {}
      for (const system of registrati) {
        const stats = system.stats?.()
        if (stats !== undefined) raccolte[system.id] = stats
      }
      return raccolte
    }
  }
}
