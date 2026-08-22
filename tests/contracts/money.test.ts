import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'

import {
  fromNumber,
  fromString,
  ONE,
  roundDownToCents,
  roundUpToCents,
  toDisplayNumber,
  toString,
  ZERO,
  type Money
} from '@core/contracts/money'

import { transfer } from '@core/kernel/Ledger'

/**
 * R11 · ADR 0006 — il denaro è `Decimal` end-to-end.
 *
 * Il difetto A11 era una pipeline che mescolava `number` e `Decimal`: bastava un passaggio
 * intermedio per perdere precisione, e la firma delle funzioni non lo mostrava.
 */
describe('Money', () => {
  it('ZERO è zero', () => {
    expect(toString(ZERO)).toBe('0')
  })

  it('andata e ritorno con la stringa non perde nulla', () => {
    const big = '123456789012345678.90123456789'
    expect(toString(fromString(big))).toBe(big)
  })

  it('0,1 più 0,2 fa esattamente 0,3', () => {
    expect(toString(fromString('0.1').plus(fromString('0.2')))).toBe('0.3')
    // La stessa somma in virgola mobile: è il difetto che Decimal esiste per togliere.
    expect(0.1 + 0.2).not.toBe(0.3)
  })

  it('un number non è assegnabile a Money', () => {
    // @ts-expect-error — R11: Money è Decimal, e una classe non accetta un number (ADR 0006)
    const money: Money = 5
    expect(money).toBe(5)
  })

  it('due Money non si sommano con `+`: la regola è gratis', () => {
    const a = fromString('1')
    const b = fromString('2')
    // @ts-expect-error — R11: `+` non è definito su Decimal, si scrive a.plus(b) (ADR 0006)
    const wrong: unknown = a + b

    expect(toString(a.plus(b))).toBe('3')
    // Senza il rifiuto del compilatore, questo sarebbe finito in un saldo.
    expect(wrong).toBe('12')
  })

  it('le conversioni di confine esistono, e sono queste due', () => {
    expect(toString(fromNumber(12.5))).toBe('12.5')
    expect(toDisplayNumber(fromString('12.5'))).toBe(12.5)
  })
})

/**
 * ADR 0026 — la precisione si dichiara. **Due** test e non uno, ed è l'ADR stesso a dirlo: il
 * primo impone la precisione e dice a quale numero i centesimi smettono di esistere; il secondo
 * copre il guasto vero, che è `transfer()` che smette di bilanciare. Scrivere solo il primo
 * lascerebbe scoperto proprio il caso che manda in crollo il gioco.
 *
 * I due numeri qui sotto sono **misurati** sulla libreria in uso, non ricopiati dall'ADR: se un
 * aggiornamento di decimal.js li spostasse, questi test lo direbbero prima di un giocatore.
 */
describe('la precisione', () => {
  it('è dichiarata, e a dichiararla è l importazione di money.ts', () => {
    // Importare `Money` basta a configurare il costruttore: è l'unico file che importi
    // `decimal.js` (INV-01), quindi non esiste un `Money` nato prima di quella riga.
    expect(Decimal.precision).toBe(40)
  })

  it('il centesimo esiste fino a 1e37, e da 1e38 non c è più', () => {
    // Non «il numero è grande»: il centesimo **sparisce**, cioè sommarlo non cambia niente. È il
    // difetto che si vedrebbe a schermo come un saldo che non si muove più di un centesimo.
    const survives = (exponent: number): boolean => {
      const base = fromString(`1e${exponent}`)
      return base.plus('0.01').greaterThan(base)
    }

    expect(survives(37)).toBe(true)
    expect(survives(38)).toBe(false)

    // Il bersaglio di scala della visione è ~1e30: sette ordini di margine sopra di lui, invece
    // dei **meno dieci** che le venti cifre predefinite lasciavano.
    expect(survives(30)).toBe(true)
  })

  it('transfer somma a zero fino a 1e39, e da 1e40 no', () => {
    // Il guasto vero, e non è una deriva silenziosa: sopra la soglia i tre movimenti non sommano
    // più a zero, il Ledger se ne accorge e **lancia** — cioè un giocatore che preme «Deposita»
    // con un saldo enorme riceve un'eccezione al posto di un `Result`.
    //
    // A sbilanciare è `value.minus(fee)`, che arrotonda: i costruttori speculari come `income`
    // reggono anche sopra, perché lì l'arrotondamento cade uguale dalle due parti.
    const imbalanceAt = (exponent: number): string => {
      const postings = transfer('card', 'cash', fromString(`1e${exponent}`), fromString('2.5'))
      return toString(postings.reduce((sum, posting) => sum.plus(posting.amount), ZERO))
    }

    expect(imbalanceAt(30)).toBe('0')
    expect(imbalanceAt(39)).toBe('0')
    expect(imbalanceAt(40)).not.toBe('0')
  })
})

/**
 * D032 — l'unico arrotondamento del progetto, nato con la commissione in percentuale.
 */
describe('l arrotondamento ai centesimi', () => {
  it('taglia a due decimali', () => {
    expect(toString(roundUpToCents(fromString('4.995')))).toBe('5')
    expect(toString(roundUpToCents(fromString('24.6912')))).toBe('24.7')
  })

  it('va per eccesso, non al più vicino', () => {
    // Al più vicino, 4,991 diventerebbe 4,99. La casa vince sempre un po', ed è una frase di
    // gioco: il verso dell'arrotondamento dice qualcosa, la cifra no.
    expect(toString(roundUpToCents(fromString('4.991')))).toBe('5')
    expect(toString(roundUpToCents(fromString('0.001')))).toBe('0.01')
  })

  it('non tocca ciò che è già ai centesimi', () => {
    // Va detto perche' e' la garanzia che applicarlo su un importo gia' arrotondato non lo sposti.
    // Applicarlo **due volte** resta comunque sbagliato — la prima volta puo' aver alzato di un
    // centesimo — ma un valore gia' tondo non si muove.
    expect(toString(roundUpToCents(fromString('2.5')))).toBe('2.5')
    expect(toString(roundUpToCents(ZERO))).toBe('0')
  })
})

/**
 * D033 — l'arrotondamento opposto, e il valore che serve a leggere un tasso al contrario.
 */
describe('l arrotondamento per difetto', () => {
  it('taglia a due decimali senza mai alzare', () => {
    expect(toString(roundDownToCents(fromString('4.999')))).toBe('4.99')
    expect(toString(roundDownToCents(fromString('132.65306122')))).toBe('132.65')
  })

  it('non è il gemello di quello per eccesso, ed è tutto il punto', () => {
    // Sullo stesso numero i due rispondono diverso: la commissione sale, ciò che si offre al
    // giocatore scende. Se un giorno coincidessero, uno dei due sarebbe di troppo.
    expect(toString(roundUpToCents(fromString('0.001')))).toBe('0.01')
    expect(toString(roundDownToCents(fromString('0.009')))).toBe('0')
  })

  it('non tocca ciò che è già ai centesimi', () => {
    expect(toString(roundDownToCents(fromString('2.5')))).toBe('2.5')
    expect(toString(roundDownToCents(ZERO))).toBe('0')
  })
})

describe('ONE', () => {
  it('è l intero, e serve a chiedere quanto resta dopo un tasso', () => {
    expect(toString(ONE)).toBe('1')
    expect(toString(ONE.minus(fromString('0.02')))).toBe('0.98')
  })
})
