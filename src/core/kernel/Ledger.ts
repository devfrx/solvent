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
const grandezza = (importo: Money, cosa: string): Money => {
  if (!importo.isFinite() || importo.isNegative()) {
    throw new RangeError(
      `Ledger — ${cosa} è una grandezza: un numero finito e non negativo, ricevuto ${toString(importo)}.`
    )
  }
  return importo
}

/**
 * ADR 0020 — una transazione che non somma a zero non è un esito di gioco: è un bug. Il messaggio
 * porta lo sbilancio, che è l'unica informazione che serve davvero a trovarlo.
 */
export class UnbalancedTransactionError extends Error {
  constructor(reason: Reason, sbilancio: Money) {
    super(
      `ADR 0020 — la transazione '${reason}' non somma a zero: sbilancio di ` +
        `${toString(sbilancio)}. Ogni movimento ha una contropartita, e income, spend e transfer ` +
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
  constructor(esterna: Reason, interna: Reason) {
    super(
      `ADR 0019 — transazione dentro una transazione: '${interna}' è partita mentre '${esterna}' ` +
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
  constructor(sbilancio: Money) {
    super(
      `INV-08 — i conti del salvataggio non sommano a zero: sbilancio di ${toString(sbilancio)}. ` +
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
export const income = (pool: Pool, importo: Money): readonly Posting[] => {
  const quanto = grandezza(importo, 'un reddito')
  return [
    { pool: 'world', amount: quanto.neg(), category: 'income' },
    { pool, amount: quanto, category: 'income' }
  ]
}

export const spend = (pool: Pool, importo: Money): readonly Posting[] => {
  const quanto = grandezza(importo, 'una spesa')
  return [
    { pool, amount: quanto.neg(), category: 'purchase' },
    { pool: 'sink', amount: quanto, category: 'purchase' }
  ]
}

/**
 * La commissione è **trattenuta**, non aggiunta: chi trasferisce 500 con 2,50 di commissione vede
 * uscire 500 e arrivare 497,50. È la forma del prelievo al bancomat, dello spread delle fiches e
 * della percentuale del black market — un movimento in più, un meccanismo solo (ADR 0020).
 */
export const transfer = (
  da: Pool,
  a: Pool,
  importo: Money,
  commissione: Money
): readonly Posting[] => {
  const quanto = grandezza(importo, 'un trasferimento')
  const trattenuta = grandezza(commissione, 'una commissione')
  if (trattenuta.greaterThan(quanto)) {
    throw new RangeError(
      `Ledger — la commissione (${toString(trattenuta)}) non può superare il trasferimento ` +
        `(${toString(quanto)}): il destinatario riceverebbe meno di zero.`
    )
  }
  return [
    { pool: da, amount: quanto.neg(), category: 'transfer' },
    { pool: a, amount: quanto.minus(trattenuta), category: 'transfer' },
    { pool: 'fees', amount: trattenuta, category: 'fee' }
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
  readonly load: (stato: LedgerSave) => void
  readonly reset: (scope: ResetScope) => void
}

export const createLedger = (bus: Bus): Ledger => {
  // A05 — l'unica copia dei saldi che esiste. Non è esportata, non è ritornata da nulla, e non
  // compare in nessun campo del `Ledger`: dall'esterno non c'è niente a cui assegnare.
  const saldi = new Map<Pool, Money>()

  /** La ragione della transazione in corso, se ce n'è una. È la guardia contro l'annidamento. */
  let inCorso: Reason | null = null

  const leggi = (pool: Pool): Money => saldi.get(pool) ?? ZERO

  /**
   * L'unico cast del file. `Object.fromEntries` perde la chiave tipizzata; `POOL_IDS` è l'elenco
   * completo dei pool, quindi la mappa che ne esce le ha tutte davvero.
   */
  const perPool = <T>(valore: (pool: Pool) => T): Readonly<Record<Pool, T>> =>
    Object.fromEntries(POOL_IDS.map((pool) => [pool, valore(pool)])) as Record<Pool, T>

  const sommaDi = (importi: Iterable<Money>): Money => {
    let totale = ZERO
    for (const importo of importi) totale = totale.plus(importo)
    return totale
  }

  /**
   * Valida **tutti** i movimenti e ritorna i saldi che ne risulterebbero, senza toccarne nessuno.
   * È la separazione su cui poggia l'atomicità: chi applica riceve un risultato già verificato, e
   * non ha più modo di fallire a metà strada.
   */
  const verifica = (
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

    const sbilancio = sommaDi(postings.map((posting) => posting.amount))
    if (!sbilancio.isZero()) throw new UnbalancedTransactionError(meta.reason, sbilancio)

    // L'affordance riguarda gli strumenti del giocatore: `world`, `sink` e `fees` non sono
    // strumenti ma contabilità, e non li sceglie il chiamante — li scrivono i costruttori.
    const accettati = meta.accepts
    if (accettati !== undefined) {
      for (const posting of postings) {
        if (POOLS[posting.pool].player && !accettati.includes(posting.pool)) {
          return err({
            code: 'error.ledger.pool_not_accepted',
            pool: posting.pool,
            accepted: accettati
          })
        }
      }
    }

    // Si somma per pool prima di guardare i limiti: due movimenti sullo stesso pool nella stessa
    // transazione contano una volta sola, ed è il loro effetto netto a dover stare in piedi.
    const nuovi = new Map<Pool, Money>()
    for (const posting of postings) {
      nuovi.set(posting.pool, (nuovi.get(posting.pool) ?? leggi(posting.pool)).plus(posting.amount))
    }

    // In ordine di `POOL_IDS`, non di movimento: la stessa transazione riporta sempre lo stesso
    // errore, e non dipende dall'ordine in cui il chiamante ha scritto le righe.
    for (const pool of POOL_IDS) {
      const nuovo = nuovi.get(pool)
      if (nuovo === undefined) continue
      const props = POOLS[pool]
      const attuale = leggi(pool)

      // Solo i pool del giocatore hanno un fondo: `world` è normalmente negativo, ed è corretto.
      if (props.player && nuovo.isNegative()) {
        return err({
          code: 'error.ledger.insufficient_funds',
          pool,
          required: nuovo.minus(attuale).abs(),
          available: attuale
        })
      }

      if (props.capacity !== null && nuovo.greaterThan(props.capacity)) {
        return err({
          code: 'error.ledger.capacity_exceeded',
          pool,
          capacity: props.capacity,
          fits: props.capacity.minus(attuale)
        })
      }
    }

    return ok(nuovi)
  }

  return {
    transaction: (postings, meta) => {
      if (inCorso !== null) throw new NestedTransactionError(inCorso, meta.reason)

      inCorso = meta.reason
      try {
        const verificati = verifica(postings, meta)
        if (!verificati.ok) return verificati

        for (const [pool, nuovo] of verificati.value) saldi.set(pool, nuovo)

        // Una copia dei movimenti: la lista resta del chiamante, e ciò che gira nell'evento non
        // può cambiare sotto i piedi di chi lo sta leggendo.
        const transazione: Transaction = { reason: meta.reason, postings: [...postings] }
        const balances = perPool(leggi)

        // Una volta sola, e dopo che tutti i saldi sono cambiati: un handler vede sempre uno
        // stato coerente, mai uno stato intermedio che non è mai realmente esistito. Se un
        // handler lancia, l'errore esce di qui — la transazione però è avvenuta, ed è giusto:
        // era già valida e già applicata prima che qualcuno venisse avvisato.
        bus.emit('money.posted', { transaction: transazione, balances })

        return ok(balances)
      } finally {
        inCorso = null
      }
    },

    balance: leggi,

    // INV-04 — oltre il confine di persistenza il denaro è una stringa decimale. I conti
    // non-giocatore entrano nel salvataggio: senza, la somma non farebbe zero al ricaricamento.
    save: () => ({ balances: perPool((pool) => toString(leggi(pool))) }),

    load: (stato) => {
      const caricati = new Map<Pool, Money>(
        POOL_IDS.map((pool) => [pool, fromString(stato.balances[pool])])
      )
      if (!sommaDi(caricati.values()).isZero()) {
        throw new UnbalancedSaveError(sommaDi(caricati.values()))
      }

      // Si scrive solo dopo aver verificato: un salvataggio rifiutato non lascia il Ledger a metà.
      for (const [pool, saldo] of caricati) saldi.set(pool, saldo)
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
        for (const pool of POOL_IDS) saldi.set(pool, ZERO)
      }
    }
  }
}
