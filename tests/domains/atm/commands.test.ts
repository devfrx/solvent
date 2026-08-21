import { beforeEach, describe, expect, it } from 'vitest'

import type { Posting, Transaction } from '@core/contracts/ledger'
import { fromString, toString, ZERO } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import { POOL_IDS } from '@core/contracts/pools'

import { createBus } from '@core/kernel/Bus'
import { createLedger, income, transfer, type Ledger } from '@core/kernel/Ledger'

import {
  DEPOSIT,
  WITHDRAW,
  createAtm,
  previewOf,
  type Atm,
  type AtmOperation,
  type Destination
} from '../../../src/core/domains/atm/commands'
import { atmFee } from '../../../src/core/domains/atm/rules'

/**
 * Il gesto centrale del gioco. Due comandi con cause di fallimento diverse, un'anteprima che è
 * l'operazione stessa, e la partita doppia che deve reggere dopo ognuno dei due.
 */

const money = fromString

let ledger: Ledger
let atm: Atm
let posted: Transaction[]

/**
 * Mette denaro su un pool passando dal Ledger vero: nessun saldo si scrive a mano (R06). Azzera
 * anche le transazioni raccolte, cosi `posted` contiene solo l'operazione sotto esame.
 */
const fund = (pool: Pool, amount: string): void => {
  ledger.transaction(income(pool, money(amount)), { reason: 'reason.income.tick' })
  posted = []
}

const onlyTransaction = (): Transaction => {
  const [first] = posted
  if (first === undefined) throw new Error('nessuna transazione e stata emessa')
  return first
}

const sumOf = (postings: readonly Posting[]): string =>
  toString(postings.reduce((sum, posting) => sum.plus(posting.amount), ZERO))

const balanceOf = (pool: Pool): string => toString(ledger.balance(pool))

/**
 * Il pool in arrivo come lo vede lo store: tetto e saldo letti dal Ledger, che dopo D017 e'
 * l'unico a saperlo (INV-18). Scriverlo a mano in ogni chiamata sarebbe una seconda lettura.
 */
const into = (operation: AtmOperation): Destination => ({
  capacity: ledger.capacities(operation.to),
  current: ledger.balance(operation.to)
})

const totalOfAccounts = (): string =>
  toString(POOL_IDS.reduce((sum, pool) => sum.plus(ledger.balance(pool)), ZERO))

beforeEach(() => {
  const bus = createBus()
  posted = []
  bus.on('money.posted', ({ transaction }) => {
    posted.push(transaction)
  })
  // Nessun tetto, ed e' una scelta: questo file prova il **bancomat**, non il caveau. Con la
  // capienza di partenza dei contanti (D017) meta' dei casi si fermerebbe per una ragione che non
  // e' quella sotto esame, e a provare il tetto c'e' un blocco suo in fondo al file.
  ledger = createLedger(bus, () => null)
  atm = createAtm(ledger)
})

describe('un prelievo riuscito', () => {
  it('muove tre importi in una transazione sola, e la somma è zero', () => {
    fund('card', '1000')

    const done = atm.withdraw(money('500'))

    expect(done.ok).toBe(true)
    expect(posted).toHaveLength(1)
    expect(onlyTransaction().reason).toBe('reason.atm.withdraw')
    expect(onlyTransaction().postings).toHaveLength(3)
    expect(sumOf(onlyTransaction().postings)).toBe('0')
  })

  it('la carta scende dell’intero, i contanti salgono del netto, la differenza è trattenuta', () => {
    fund('card', '1000')

    atm.withdraw(money('500'))

    expect(balanceOf('card')).toBe('500')
    expect(balanceOf('cash')).toBe('497.5')
    expect(balanceOf('fees')).toBe('2.5')
    expect(totalOfAccounts()).toBe('0')
  })
})

describe('l’anteprima', () => {
  it('è lo stesso valore che il comando applica, non un calcolo parallelo', () => {
    // Non "danno lo stesso numero": sono lo **stesso** elenco di movimenti. È la forma più forte
    // che INV-11 possa avere, e rende "due formule per la commissione" impossibile.
    fund('card', '1000')
    const preview = previewOf(WITHDRAW, money('500'), into(WITHDRAW))
    expect(preview.ok).toBe(true)
    if (!preview.ok) return

    atm.withdraw(money('500'))

    expect(onlyTransaction().postings).toEqual(preview.value)
  })

  it('dice di no con lo stesso codice con cui dice di no il comando', () => {
    fund('card', '1000')

    for (const amount of ['0', '-5', '1', '2.50', '500']) {
      const preview = previewOf(WITHDRAW, money(amount), into(WITHDRAW))
      const done = atm.withdraw(money(amount))

      expect(done.ok).toBe(preview.ok)
      if (preview.ok || done.ok) continue
      expect(done.error.code).toBe(preview.error.code)
    }
  })
})

describe('fondi insufficienti', () => {
  it('nulla si muove, e l’errore dice quanto serviva e quanto c’era', () => {
    fund('card', '100')

    const done = atm.withdraw(money('500'))

    expect(done).toEqual({
      ok: false,
      error: {
        code: 'error.ledger.insufficient_funds',
        pool: 'card',
        required: money('500'),
        available: money('100')
      }
    })
    expect(posted).toHaveLength(0)
    expect(balanceOf('card')).toBe('100')
    expect(balanceOf('cash')).toBe('0')
    expect(balanceOf('fees')).toBe('0')
  })
})

describe('la commissione supera l’importo', () => {
  it('è un codice suo, diverso da quello dei fondi, e nessuna transazione parte', () => {
    fund('card', '1000')

    const done = atm.withdraw(money('1'))

    expect(done).toEqual({
      ok: false,
      error: { code: 'error.atm.fee_exceeds_amount', amount: money('1'), fee: atmFee() }
    })
    expect(posted).toHaveLength(0)
    expect(balanceOf('card')).toBe('1000')
  })

  it('e il controllo deve stare prima, perché transfer lancerebbe', () => {
    // Chiamare il Ledger e poi `try`/`catch` non sarebbe la stessa cosa: un `RangeError` dice che
    // il programma è scritto male, e qui invece è il giocatore che ha chiesto un prelievo da 1,00.
    expect(() => transfer('card', 'cash', money('1'), atmFee())).toThrow(RangeError)
  })

  it('uguale è già troppo: il Ledger lo accetterebbe e arriverebbe zero', () => {
    fund('card', '1000')

    const done = atm.withdraw(atmFee())

    expect(done.ok).toBe(false)
    if (done.ok) return
    expect(done.error.code).toBe('error.atm.fee_exceeds_amount')

    // La prova che il "maggiore o uguale" serve: qui `transfer` non lancia affatto, costruisce una
    // transazione valida in cui il giocatore paga e riceve 0,00.
    expect(transfer('card', 'cash', atmFee(), atmFee()).map((p) => toString(p.amount))).toEqual([
      '-2.5',
      '0',
      '2.5'
    ])
  })
})

describe('un importo che non si può prelevare', () => {
  it('zero, negativo o non finito è un errore, non un non-evento', () => {
    fund('card', '1000')

    for (const amount of ['0', '-0.01', '-500', 'NaN', 'Infinity']) {
      const done = atm.withdraw(money(amount))

      expect(done.ok).toBe(false)
      if (done.ok) continue
      expect(done.error.code).toBe('error.atm.amount_not_positive')
    }

    expect(posted).toHaveLength(0)
    expect(balanceOf('card')).toBe('1000')
  })

  it('lo zero è proprio il caso che il kernel non fermerebbe', () => {
    // `magnitude` accetta lo zero: con una commissione di zero ne uscirebbe una transazione
    // valida, bilanciata, che non muove niente — e che emetterebbe comunque `money.posted`.
    const nothing = transfer('card', 'cash', ZERO, ZERO)

    expect(nothing).toHaveLength(3)
    expect(sumOf(nothing)).toBe('0')
  })

  it('e sullo zero vince il codice dell’importo, non quello della commissione', () => {
    // Con 0,00 sarebbero veri entrambi i rifiuti: a decidere è l'ordine dei controlli, e la causa
    // giusta da mostrare al giocatore è che l'importo non è un importo.
    fund('card', '1000')

    const done = atm.withdraw(ZERO)

    expect(done.ok).toBe(false)
    if (done.ok) return
    expect(done.error.code).toBe('error.atm.amount_not_positive')
  })
})

describe('un deposito riuscito', () => {
  it('i contanti scendono, il conto sale del netto, le commissioni crescono', () => {
    fund('cash', '1000')

    const done = atm.deposit(money('500'))

    expect(done.ok).toBe(true)
    expect(onlyTransaction().reason).toBe('reason.atm.deposit')
    expect(balanceOf('cash')).toBe('500')
    expect(balanceOf('card')).toBe('497.5')
    expect(balanceOf('fees')).toBe('2.5')
  })

  it('fallisce per una causa sua: i contanti che non bastano', () => {
    fund('cash', '10')

    const done = atm.deposit(money('500'))

    expect(done.ok).toBe(false)
    if (done.ok) return
    expect(done.error.code).toBe('error.ledger.insufficient_funds')
    if (done.error.code !== 'error.ledger.insufficient_funds') return
    expect(done.error.pool).toBe('cash')
  })
})

describe('il pool in arrivo, quando ha un tetto', () => {
  /** Un caveau finto: il bancomat non sa da dove venga la risposta, e non deve saperlo (D017). */
  const withCeiling = (capacity: string, current: string): Destination => ({
    capacity: money(capacity),
    current: money(current)
  })

  it('l’anteprima dice di no prima di premere, con la frase del Ledger', () => {
    // Un prelievo porta denaro **verso** i contanti: fino a D017 l'anteprima mostrava un elenco di
    // movimenti che il Ledger avrebbe poi rifiutato. Adesso dice di no subito, con lo **stesso**
    // codice e le stesse due cifre — non una seconda spiegazione da tenere allineata.
    const refused = previewOf(WITHDRAW, money('500'), withCeiling('1000', '900'))

    expect(refused.ok).toBe(false)
    if (refused.ok || refused.error.code !== 'error.ledger.capacity_exceeded') return
    expect(refused.error.pool).toBe('cash')
    expect(toString(refused.error.capacity)).toBe('1000')
    expect(toString(refused.error.fits)).toBe('100')
  })

  it('e sopra il tetto non promette spazio negativo', () => {
    // D028 — la stessa risposta del Ledger, e per la stessa ragione: «ci stanno ancora
    // -8.000,00 €» era la frase che la partita di sviluppo mostrava sotto ogni pulsante. INV-18
    // vale anche sui numeri del rifiuto, non solo sul tetto.
    const refused = previewOf(WITHDRAW, money('500'), withCeiling('1000', '9000'))

    expect(refused.ok).toBe(false)
    if (refused.ok || refused.error.code !== 'error.ledger.capacity_exceeded') return
    expect(toString(refused.error.fits)).toBe('0')
  })

  it('e guarda quello che **arriva**, non quello che si è digitato', () => {
    // La commissione è trattenuta: chi preleva 500,00 € ne riceve 497,50. Con 497,50 € di spazio
    // l'operazione ci sta, e chiedere sull'importo lordo la rifiuterebbe per due euro e mezzo che
    // non arrivano mai a destinazione.
    const fee = toString(atmFee())

    expect(previewOf(WITHDRAW, money('500'), withCeiling('497.5', '0')).ok).toBe(true)
    expect(previewOf(WITHDRAW, money('500'), withCeiling('497.49', '0')).ok).toBe(false)
    expect(fee).toBe('2.5')
  })

  it('senza tetto non chiede niente a nessuno', () => {
    expect(previewOf(WITHDRAW, money('500'), { capacity: null, current: money('0') }).ok).toBe(true)
  })

  it('e il comando dice di no allo stesso modo, perché legge il tetto dal Ledger', () => {
    // INV-18: la capienza che il comando guarda è quella del Ledger, cioè la stessa che il Ledger
    // fa rispettare. Qui il Ledger ne ha una vera, non quella del `beforeEach` senza tetto.
    const bus = createBus()
    const capped = createLedger(bus, (pool) => (pool === 'cash' ? money('1000') : null))
    capped.transaction(income('cash', money('900')), { reason: 'reason.income.tick' })
    capped.transaction(income('card', money('1000')), { reason: 'reason.income.tick' })

    const done = createAtm(capped).withdraw(money('500'))

    expect(done.ok).toBe(false)
    if (done.ok) return
    expect(done.error.code).toBe('error.ledger.capacity_exceeded')
    expect(toString(capped.balance('cash'))).toBe('900')
  })
})

describe('depositi e prelievi mescolati', () => {
  it('la somma di tutti i conti resta zero, e i rifiuti non la spostano', () => {
    fund('cash', '2000')
    fund('card', '2000')

    atm.deposit(money('300.33'))
    atm.withdraw(money('150.07'))
    atm.deposit(money('7.77'))
    atm.withdraw(money('999999'))
    atm.deposit(money('1'))
    atm.withdraw(money('0.01'))
    atm.deposit(money('2.51'))

    expect(totalOfAccounts()).toBe('0')
    expect(posted).toHaveLength(4)
  })
})

describe('con cosa si paga', () => {
  it('un trasferimento non dichiara accepts, e l’assenza è dichiarata invece che dimenticata', () => {
    expect(WITHDRAW.meta.accepts).toBeUndefined()
    expect(DEPOSIT.meta.accepts).toBeUndefined()
  })

  it('perché la carta sola farebbe rifiutare il movimento in arrivo sui contanti', () => {
    // La trappola resa visibile: sull'upgrade di D010 la stessa dichiarazione era giusta, perché
    // il pool del giocatore coinvolto era uno solo. Qui ce ne sono due, e l'elenco parziale morde
    // proprio quello che il giocatore voleva riempire.
    fund('card', '1000')
    const preview = previewOf(WITHDRAW, money('500'), into(WITHDRAW))
    if (!preview.ok) return

    const refused = ledger.transaction(preview.value, {
      reason: 'reason.atm.withdraw',
      accepts: ['card']
    })

    expect(refused).toEqual({
      ok: false,
      error: { code: 'error.ledger.pool_not_accepted', pool: 'cash', accepted: ['card'] }
    })

    // Lo stesso elenco di movimenti, con la dichiarazione vera del dominio, passa.
    expect(ledger.transaction(preview.value, WITHDRAW.meta).ok).toBe(true)
  })
})
