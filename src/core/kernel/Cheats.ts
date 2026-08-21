import type { Cheat, CheatId, CheatResult } from '@core/contracts/cheats'
import type { Money } from '@core/contracts/money'
import { ZERO } from '@core/contracts/money'

/**
 * D029 · ADR 0036 · R20 — il registro dei cheat, e l'unica lista che esiste.
 *
 * È il `Registry` applicato a un secondo problema, e deliberatamente: il difetto A02 del progetto
 * precedente erano **cinque** liste di sistemi che dovevano coincidere, e la risposta dell'
 * [ADR 0002](../../../docs/adr/0002-registry-unica-lista-di-sistemi.md) non è stata «controlliamo
 * che coincidano» ma «facciamo che ce ne sia una sola». Un pannello di sviluppo è esattamente il
 * posto in cui quella lista tornerebbe a essere scritta a mano, perché sembra codice usa e getta.
 *
 * Questo file **non conosce un solo cheat**, ed è la proprietà che lo rende universale: non importa
 * un dominio, non nomina il denaro, non sa che esiste un caveau. Chi ha qualcosa da barare lo
 * dichiara nel proprio file — `kernel/LedgerCheats.ts`, `domains/vault/cheats.ts`,
 * `domains/income/cheats.ts` — e il bootstrap li consegna qui, che è l'unico posto del progetto che
 * ha tutti i capi sotto mano ([ADR 0024](../../../docs/adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)).
 *
 * **Non c'è nessun `if (dev)` qui dentro**, e non è una dimenticanza: il core non sa in che
 * ambiente gira ([ADR 0001](../../../docs/adr/0001-simulazione-nel-renderer-core-puro.md)). A non
 * costruire questo registro fuori dallo sviluppo è il bootstrap del renderer, che è l'unico che
 * può saperlo — e la conseguenza è che in un pacchetto di rilascio questo file non viene raggiunto
 * da nessuno e non entra nel bundle.
 */

/** Registrare due volte lo stesso id è un programma scritto male, non un esito: si lancia. */
export class DuplicateCheatError extends Error {
  constructor(id: CheatId) {
    super(
      `R20 — il cheat '${id}' è già registrato. Due dichiarazioni dello stesso id sono due ` +
        `pulsanti identici che fanno cose diverse, ed è il difetto A02 in miniatura.`
    )
    this.name = 'DuplicateCheatError'
  }
}

/** Eseguire un id che nessuno ha dichiarato è la stessa specie di errore. */
export class UnknownCheatError extends Error {
  constructor(id: CheatId) {
    super(`R20 — nessuno ha dichiarato il cheat '${id}'. Il registro è l'unica lista che esiste.`)
    this.name = 'UnknownCheatError'
  }
}

export interface Cheats {
  readonly register: (...cheats: readonly Cheat[]) => void
  /** In ordine di registrazione: il pannello li disegna così, e l'ordine è quello del bootstrap. */
  readonly all: () => readonly Cheat[]
  readonly run: (id: CheatId, amount?: Money) => CheatResult
}

export const createCheats = (): Cheats => {
  // Una `Map` e non un array: l'ordine di inserimento è garantito, e il doppione si vede in O(1).
  const registered = new Map<CheatId, Cheat>()

  return {
    register: (...cheats) => {
      for (const cheat of cheats) {
        if (registered.has(cheat.id)) throw new DuplicateCheatError(cheat.id)
        registered.set(cheat.id, cheat)
      }
    },

    all: () => [...registered.values()],

    /**
     * L'importo è opzionale perché metà dei cheat non ne vuole uno; a decidere non è il chiamante
     * ma la **forma** del cheat, quindi un importo passato a un `act` viene ignorato invece di
     * essere un errore. È la stessa indulgenza che `TransactionMeta.accepts` ha per chi non
     * dichiara vincoli di strumento: chi non dice niente non sta dimenticando qualcosa.
     */
    run: (id, amount = ZERO) => {
      const cheat = registered.get(id)
      if (cheat === undefined) throw new UnknownCheatError(id)
      return cheat.kind === 'amount' ? cheat.run(amount) : cheat.run()
    }
  }
}
