import type {
  Balances,
  LedgerError,
  Posting,
  Reason,
  Transaction,
  TransactionMeta
} from '@core/contracts/ledger'
import type { ResetScope } from '@core/contracts/lifecycle'
import type { Money } from '@core/contracts/money'
import { fromString, toString, ZERO } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import { POOL_IDS, POOLS } from '@core/contracts/pools'
import type { Result } from '@core/contracts/result'
import { err, ok } from '@core/contracts/result'
import type { LedgerSave } from '@core/contracts/save'

import type { Bus } from '@core/kernel/Bus'

/**
 * R06 · ADR 0003, 0017, 0019, 0020 — l'unica porta del denaro.
 *
 * Il difetto A05 erano i saldi scritti da più punti, tenuti insieme da due iniezioni di dipendenza
 * basate su variabili globali: "da dove arrivano questi soldi?" non aveva risposta se non leggendo
 * tutto il codice. Qui i saldi vivono in una `Map` privata nella closure — non c'è la superficie
 * per scriverli dall'esterno, il che è più robusto che toglierne il permesso.
 *
 * Tre decisioni si incastrano, e insieme fanno più di quanto farebbero da sole:
 *
 * - **ADR 0017** — il pool è una dimensione di prima classe, e ogni pool dichiara le proprie
 *   affordance come **dati**. Qui non c'è un solo `if` sul nome di un pool: si legge `POOLS`.
 * - **ADR 0019** — la primitiva è la transazione, non il movimento. La validazione avviene su
 *   tutti i movimenti prima che il primo saldo si muova, quindi non esistono applicazioni
 *   parziali (INV-09).
 * - **ADR 0020** — ogni transazione somma a zero, e accanto ai pool del giocatore esistono i
 *   conti `world`, `sink`, `fees` e `house`. Ne discende l'invariante più forte del progetto: la
 *   somma di tutti i conti è sempre zero (INV-08), dopo ogni transazione, dopo un caricamento e
 *   dopo un reset.
 *
 * Due tipi di torto, due meccanismi diversi. Un dato che non si può usare — un importo non finito,
 * fondi che non bastano, uno strumento non accettato — è un **esito**: torna dentro un `Result`,
 * con il contesto che serve alla UI per spiegarlo. Un programma scritto male — una transazione che
 * non bilancia, una transazione dentro un'altra — **lancia**: non c'è niente da spiegare al
 * giocatore, c'è una riga da correggere.
 */

/**
 * I costruttori prendono una **grandezza**, non un numero con segno: il verso lo decide la
 * funzione. Senza questo controllo `income(pool, -12)` sarebbe una transazione perfettamente
 * bilanciata che toglie denaro invece di darlo, e nessun invariante se ne accorgerebbe.
 */
const magnitude = (amount: Money, label: string): Money => {
  if (!amount.isFinite() || amount.isNegative()) {
    throw new RangeError(
      `Ledger — ${label} è una grandezza: un numero finito e non negativo, ricevuto ${toString(amount)}.`
    )
  }
  return amount
}

/**
 * ADR 0020 — una transazione che non somma a zero non è un esito di gioco: è un bug. Il messaggio
 * porta lo sbilancio, che è l'unica informazione che serve davvero a trovarlo.
 */
export class UnbalancedTransactionError extends Error {
  constructor(reason: Reason, imbalance: Money) {
    super(
      `ADR 0020 — la transazione '${reason}' non somma a zero: sbilancio di ` +
        `${toString(imbalance)}. Ogni movimento ha una contropartita, e income, spend e transfer ` +
        `la scrivono da soli.`
    )
    this.name = 'UnbalancedTransactionError'
  }
}

/**
 * ADR 0019 — le transazioni annidate non servono e complicano molto la garanzia atomica. La
 * guardia resta alzata anche durante l'emissione di `money.posted`: un handler che posta denaro
 * innescherebbe una catena di reazioni economiche, ed è esattamente ciò che il Bus fire-and-forget
 * non è (ADR 0016). Chi deve muovere denaro lo fa nel proprio `tick`, non dentro un evento.
 */
export class NestedTransactionError extends Error {
  constructor(outer: Reason, inner: Reason) {
    super(
      `ADR 0019 — transazione dentro una transazione: '${inner}' è partita mentre '${outer}' ` +
        `era ancora in corso. Significa che qualcuno sta orchestrando denaro fuori dal Ledger.`
    )
    this.name = 'NestedTransactionError'
  }
}

/**
 * INV-08 vale **anche dopo un caricamento**, e un salvataggio arriva da fuori. Lo schema del main
 * verifica la forma (ADR 0004) ma non l'invariante, che è del Ledger e non del contratto: se non
 * si controllasse qui, non lo controllerebbe nessuno.
 */
export class UnbalancedSaveError extends Error {
  constructor(imbalance: Money) {
    super(
      `INV-08 — i conti del salvataggio non sommano a zero: sbilancio di ${toString(imbalance)}. ` +
        `Caricarlo romperebbe l'invariante più forte del progetto, quindi non si carica.`
    )
    this.name = 'UnbalancedSaveError'
  }
}

/**
 * I tre costruttori esistono perché nessun dominio nomini a mano `world`, `sink` o `fees`
 * (INV-10): chi scrive un sistema dichiara una grandezza e un pool del giocatore, la contropartita
 * la scrive il kernel.
 *
 * Sono puri: **costruiscono** i movimenti, non li applicano. Applicare è `transaction`, che resta
 * l'unico punto in cui un saldo cambia — e resta anche l'unico punto da leggere per sapere quando
 * un saldo può cambiare.
 */
export const income = (pool: Pool, amount: Money): readonly Posting[] => {
  const value = magnitude(amount, 'un reddito')
  return [
    { pool: 'world', amount: value.neg(), category: 'income' },
    { pool, amount: value, category: 'income' }
  ]
}

export const spend = (pool: Pool, amount: Money): readonly Posting[] => {
  const value = magnitude(amount, 'una spesa')
  return [
    { pool, amount: value.neg(), category: 'purchase' },
    { pool: 'sink', amount: value, category: 'purchase' }
  ]
}

/**
 * La commissione è **trattenuta**, non aggiunta: chi trasferisce 500 con 2,50 di commissione vede
 * uscire 500 e arrivare 497,50. È la forma del prelievo al bancomat, dello spread delle fiches e
 * della percentuale del black market — un movimento in più, un meccanismo solo (ADR 0020).
 */
export const transfer = (from: Pool, to: Pool, amount: Money, fee: Money): readonly Posting[] => {
  const value = magnitude(amount, 'un trasferimento')
  const withheld = magnitude(fee, 'una commissione')
  if (withheld.greaterThan(value)) {
    throw new RangeError(
      `Ledger — la commissione (${toString(withheld)}) non può superare il trasferimento ` +
        `(${toString(value)}): il destinatario riceverebbe meno di zero.`
    )
  }
  return [
    { pool: from, amount: value.neg(), category: 'transfer' },
    { pool: to, amount: value.minus(withheld), category: 'transfer' },
    { pool: 'fees', amount: withheld, category: 'fee' }
  ]
}

export interface Ledger {
  /**
   * La primitiva. Tutto o niente: se un movimento non regge, nessun saldo si muove e nessun
   * evento viene emesso.
   */
  readonly transaction: (
    postings: readonly Posting[],
    meta: TransactionMeta
  ) => Result<Balances, LedgerError>
  readonly balance: (pool: Pool) => Money
  readonly save: () => LedgerSave
  readonly load: (state: LedgerSave) => void
  readonly reset: (scope: ResetScope) => void
}

export const createLedger = (bus: Bus): Ledger => {
  // A05 — l'unica copia dei saldi che esiste. Non è esportata, non è ritornata da nulla, e non
  // compare in nessun campo del `Ledger`: dall'esterno non c'è niente a cui assegnare.
  const balances = new Map<Pool, Money>()

  /** La ragione della transazione in corso, se ce n'è una. È la guardia contro l'annidamento. */
  let inProgress: Reason | null = null

  const read = (pool: Pool): Money => balances.get(pool) ?? ZERO

  /**
   * L'unico cast del file. `Object.fromEntries` perde la chiave tipizzata; `POOL_IDS` è l'elenco
   * completo dei pool, quindi la mappa che ne esce le ha tutte davvero.
   */
  const perPool = <T>(value: (pool: Pool) => T): Readonly<Record<Pool, T>> =>
    Object.fromEntries(POOL_IDS.map((pool) => [pool, value(pool)])) as Record<Pool, T>

  const sumOf = (amounts: Iterable<Money>): Money => {
    let total = ZERO
    for (const amount of amounts) total = total.plus(amount)
    return total
  }

  /**
   * Valida **tutti** i movimenti e ritorna i saldi che ne risulterebbero, senza toccarne nessuno.
   * È la separazione su cui poggia l'atomicità: chi applica riceve un risultato già verificato, e
   * non ha più modo di fallire a metà strada.
   */
  const validate = (
    postings: readonly Posting[],
    meta: TransactionMeta
  ): Result<Map<Pool, Money>, LedgerError> => {
    // Gli importi per primi: un importo non finito renderebbe non finita anche la somma, e la
    // transazione verrebbe segnalata come sbilanciata invece che per la sua causa vera.
    for (const posting of postings) {
      if (!posting.amount.isFinite()) {
        return err({
          code: 'error.ledger.invalid_amount',
          pool: posting.pool,
          amount: posting.amount
        })
      }
    }

    const imbalance = sumOf(postings.map((posting) => posting.amount))
    if (!imbalance.isZero()) throw new UnbalancedTransactionError(meta.reason, imbalance)

    // L'affordance riguarda gli strumenti del giocatore: `world`, `sink` e `fees` non sono
    // strumenti ma contabilità, e non li sceglie il chiamante — li scrivono i costruttori.
    const accepted = meta.accepts
    if (accepted !== undefined) {
      for (const posting of postings) {
        if (POOLS[posting.pool].player && !accepted.includes(posting.pool)) {
          return err({
            code: 'error.ledger.pool_not_accepted',
            pool: posting.pool,
            accepted
          })
        }
      }
    }

    // Si somma per pool prima di guardare i limiti: due movimenti sullo stesso pool nella stessa
    // transazione contano una volta sola, ed è il loro effetto netto a dover stare in piedi.
    const updated = new Map<Pool, Money>()
    for (const posting of postings) {
      updated.set(
        posting.pool,
        (updated.get(posting.pool) ?? read(posting.pool)).plus(posting.amount)
      )
    }

    // In ordine di `POOL_IDS`, non di movimento: la stessa transazione riporta sempre lo stesso
    // errore, e non dipende dall'ordine in cui il chiamante ha scritto le righe.
    for (const pool of POOL_IDS) {
      const next = updated.get(pool)
      if (next === undefined) continue
      const props = POOLS[pool]
      const current = read(pool)

      // Solo i pool del giocatore hanno un fondo: `world` è normalmente negativo, ed è corretto.
      if (props.player && next.isNegative()) {
        return err({
          code: 'error.ledger.insufficient_funds',
          pool,
          required: next.minus(current).abs(),
          available: current
        })
      }

      if (props.capacity !== null && next.greaterThan(props.capacity)) {
        return err({
          code: 'error.ledger.capacity_exceeded',
          pool,
          capacity: props.capacity,
          fits: props.capacity.minus(current)
        })
      }
    }

    return ok(updated)
  }

  return {
    transaction: (postings, meta) => {
      if (inProgress !== null) throw new NestedTransactionError(inProgress, meta.reason)

      inProgress = meta.reason
      try {
        const validated = validate(postings, meta)
        if (!validated.ok) return validated

        for (const [pool, next] of validated.value) balances.set(pool, next)

        // Una copia dei movimenti: la lista resta del chiamante, e ciò che gira nell'evento non
        // può cambiare sotto i piedi di chi lo sta leggendo.
        const applied: Transaction = { reason: meta.reason, postings: [...postings] }
        const snapshot = perPool(read)

        // Una volta sola, e dopo che tutti i saldi sono cambiati: un handler vede sempre uno
        // stato coerente, mai uno stato intermedio che non è mai realmente esistito. Se un
        // handler lancia, l'errore esce di qui — la transazione però è avvenuta, ed è giusto:
        // era già valida e già applicata prima che qualcuno venisse avvisato.
        bus.emit('money.posted', { transaction: applied, balances: snapshot })

        return ok(snapshot)
      } finally {
        inProgress = null
      }
    },

    balance: read,

    // INV-04 — oltre il confine di persistenza il denaro è una stringa decimale. I conti
    // non-giocatore entrano nel salvataggio: senza, la somma non farebbe zero al ricaricamento.
    save: () => ({ balances: perPool((pool) => toString(read(pool))) }),

    load: (state) => {
      const loaded = new Map<Pool, Money>(
        POOL_IDS.map((pool) => [pool, fromString(state.balances[pool])])
      )
      if (!sumOf(loaded.values()).isZero()) {
        throw new UnbalancedSaveError(sumOf(loaded.values()))
      }

      // Si scrive solo dopo aver verificato: un salvataggio rifiutato non lascia il Ledger a metà.
      for (const [pool, balance] of loaded) balances.set(pool, balance)
    },

    /**
     * `hard` è una partita nuova: tutti i conti tornano a zero, e zero conti sommano a zero.
     *
     * `soft` è il prestige e **non tocca i saldi**. Non è un `hard` più leggero e non è una
     * dimenticanza: azzerare il denaro di un'era è un evento economico con la sua ragione, quindi
     * è una `transaction` del dominio che governa il prestige (ADR 0003). Il Ledger non sa cosa
     * un'era conserva — lo sa quel dominio, e lo dirà nel proprio file, che è dove
     * docs/design/flusso-salvataggio.md vuole che stia.
     */
    reset: (scope) => {
      if (scope === 'hard') {
        for (const pool of POOL_IDS) balances.set(pool, ZERO)
      }
    }
  }
}
