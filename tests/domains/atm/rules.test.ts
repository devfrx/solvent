import { describe, expect, it } from 'vitest'

import { fromString } from '@core/contracts/money'

import { BALANCE } from '@core/balance/constants'

import {
  atmFee,
  fitsIn,
  isFeeWithinAmount,
  isValidAmount,
  largestThatFits
} from '../../../src/core/domains/atm/rules'
import { capacityFor } from '../../../src/core/domains/vault/rules'

/**
 * Le regole pure del bancomat, provate senza kernel, senza Ledger e senza comandi: è esattamente
 * ciò che la loro purezza serve a comprare.
 */

const money = fromString

/** Le due direzioni, per non ricopiare i tassi in ogni asserzione. */
const IN = BALANCE.ATM_FEE_RATE_IN
const OUT = BALANCE.ATM_FEE_RATE_OUT

/**
 * La soglia in cui il pavimento cede il posto alla percentuale: **si misura** dai due numeri che
 * la producono, non si scrive. Scriverla sarebbe il difetto A04 — cambiare un tasso in
 * `constants.ts` lascerebbe qui una cifra che non vale più, e il test resterebbe verde.
 */
const crossover = (rate: typeof IN): typeof IN => BALANCE.ATM_FEE_FLOOR.div(rate)

describe('la commissione', () => {
  it('sotto la soglia è il pavimento dichiarato in constants.ts', () => {
    // A impedire che un numero di gioco nasca dentro `domains/` è un meccanismo, non
    // un'asserzione: `no-magic-numbers` per i numeri (D010, `.div(10)`), e per il denaro — che si
    // costruisce da una **stringa**, quindi passava indisturbato — `domains-no-money-literals`.
    // Questa riga dichiara *quale* costante è quella giusta, così cambiarla in `constants.ts` basta.
    expect(atmFee(money('10'), OUT).toString()).toBe(BALANCE.ATM_FEE_FLOOR.toString())
    expect(atmFee(money('100'), OUT).toString()).toBe(BALANCE.ATM_FEE_FLOOR.toString())
  })

  it('sopra la soglia è la percentuale, e allora i due versi non pagano lo stesso', () => {
    // 500,00 € sta sopra la soglia in tutte e due le direzioni, quindi qui l'asimmetria si vede:
    // versare costa l'1,5%, prelevare il 2%. Sotto la soglia sarebbero identici, ed è il motivo
    // per cui questo caso non si può provare con un importo piccolo.
    expect(atmFee(money('500'), IN).toString()).toBe('7.5')
    expect(atmFee(money('500'), OUT).toString()).toBe('10')
  })

  it('attraversa esattamente dove il pavimento diviso il tasso lo dice', () => {
    for (const rate of [IN, OUT]) {
      const at = crossover(rate)

      // Un centesimo sotto la soglia comanda ancora il pavimento; alla soglia i due coincidono,
      // e da lì in su comanda la percentuale. È il bordo, e sta qui perché è l'unico punto in cui
      // una delle due metà della formula può sparire senza che nulla diventi rosso.
      expect(atmFee(at.minus(money('0.01')), rate).toString()).toBe(
        BALANCE.ATM_FEE_FLOOR.toString()
      )
      expect(atmFee(at.plus(money('1')), rate).greaterThan(BALANCE.ATM_FEE_FLOOR)).toBe(true)
    }
  })

  it('non scende mai sotto il pavimento, per quanto piccolo sia l importo', () => {
    // È la meta' della formula che tiene in piedi la lezione vecchia: prelevare poco costa
    // proporzionalmente molto. Senza pavimento, l'1,5% di 1,00 € sarebbe un centesimo e mezzo.
    expect(atmFee(money('0.01'), IN).toString()).toBe(BALANCE.ATM_FEE_FLOOR.toString())
    expect(atmFee(money('1'), OUT).toString()).toBe(BALANCE.ATM_FEE_FLOOR.toString())
  })

  it('arrotonda ai centesimi per eccesso, mai a mezzo centesimo', () => {
    // 333,00 × 1,5% fa 4,995: il caso che ha fatto nascere `roundUpToCents`, e che con una
    // commissione fissa non poteva presentarsi. Per eccesso, quindi 5,00 e non 4,99.
    expect(atmFee(money('333'), IN).toString()).toBe('5')

    // Un caso che arrotonda **davvero**, cioè in cui la terza cifra non è un cinque tondo:
    // 1.234,56 × 2% fa 24,6912.
    expect(atmFee(money('1234.56'), OUT).toString()).toBe('24.7')
  })

  it('cresce con l importo, che è la ragione per cui questa delega esiste', () => {
    // 2,50 € su un milione non erano una commissione: erano un arrotondamento. Adesso il gesto
    // centrale del gioco costa qualcosa anche quando il giocatore è ricco.
    expect(atmFee(money('1000000'), OUT).toString()).toBe('20000')
  })
})

describe('un importo valido', () => {
  it('è positivo e finito', () => {
    expect(isValidAmount(money('0.01'))).toBe(true)
    expect(isValidAmount(money('500'))).toBe(true)
  })

  it('non è zero: sarebbe una transazione valida che non fa niente ed emette un evento', () => {
    expect(isValidAmount(money('0'))).toBe(false)
  })

  it('non è negativo, e non è non finito', () => {
    expect(isValidAmount(money('-1'))).toBe(false)
    expect(isValidAmount(money('-0.01'))).toBe(false)
    expect(isValidAmount(money('NaN'))).toBe(false)
    expect(isValidAmount(money('Infinity'))).toBe(false)
  })
})

describe('la commissione ci sta dentro', () => {
  it('quando è minore dell’importo', () => {
    expect(isFeeWithinAmount(money('2.51'), money('2.50'))).toBe(true)
    expect(isFeeWithinAmount(money('500'), money('2.50'))).toBe(true)
  })

  it('ma non quando è uguale: arriverebbe zero a destinazione', () => {
    // Il Ledger l'accetterebbe — `transfer` lancia solo se la commissione *supera* l'importo — e
    // il giocatore pagherebbe per non ricevere niente. È il motivo del "maggiore o uguale".
    expect(isFeeWithinAmount(money('2.50'), money('2.50'))).toBe(false)
  })

  it('e nemmeno quando lo supera', () => {
    expect(isFeeWithinAmount(money('1'), money('2.50'))).toBe(false)
    expect(isFeeWithinAmount(money('2.49'), money('2.50'))).toBe(false)
  })
})

describe('la capienza di un pool', () => {
  it('il bancomat non la conosce più da sé, e quella che riceve è un numero vero', () => {
    // La fotografia di prima diceva «oggi è illimitata per i pool del giocatore», e la fetta 02 le
    // ha tolto la ragione. Sostituita da una fotografia, non da un buco: quella nuova dice che il
    // tetto dei contanti **esiste**, ed è quello del caveau al livello di partenza.
    //
    // `capacityOf` stava qui accanto e non c'è più: leggeva `POOLS`, cioè la capienza di partenza,
    // che dopo il primo ampliamento è la risposta sbagliata. È stata rifatta invece che affiancata
    // (INV-18, ADR 0025), e a rispondere adesso è il Ledger con la funzione del caveau.
    const capacity = capacityFor(0)

    expect(capacity.greaterThan(money('0'))).toBe(true)
    expect(fitsIn(capacity, money('0'), capacity)).toBe(true)
    expect(fitsIn(capacity, money('0'), capacity.plus(money('0.01')))).toBe(false)
  })

  it('senza tetto ci entra qualunque cosa', () => {
    expect(fitsIn(null, money('999999999'), money('999999999'))).toBe(true)
  })

  it('con un tetto finto, accetta e rifiuta ai bordi', () => {
    // La capienza arriva per argomento, quindi provare i bordi non richiede di sostituire `POOLS`:
    // la fetta 02 troverà la regola già provata invece di scriverla insieme al caveau.
    const capacity = money('1000')

    expect(fitsIn(capacity, money('700'), money('300'))).toBe(true)
    expect(fitsIn(capacity, money('700'), money('300.01'))).toBe(false)
    expect(fitsIn(capacity, money('0'), money('1000'))).toBe(true)
    expect(fitsIn(capacity, money('1000'), money('0.01'))).toBe(false)
  })
})

describe('quanto ci sta', () => {
  const CENT = money('0.01')

  /** Ciò che arriva davvero a destinazione: l'importo meno la commissione che l'operazione trattiene. */
  const arriving = (amount: typeof IN, rate: typeof IN): typeof IN =>
    amount.minus(atmFee(amount, rate))

  /** Un caveau con dentro `used` e un tetto a `cap`, e sulla carta abbastanza da non essere il limite. */
  const withdrawable = (cap: string, used: string, rate: typeof IN): typeof IN =>
    largestThatFits(money(cap), money(used), rate, money('99999999'))

  it('senza tetto è tutto quello che c’è alla partenza: depositando la carta non ne ha uno', () => {
    expect(largestThatFits(null, money('0'), IN, money('812.34')).toString()).toBe('812.34')
  })

  it('non propone mai più di quanto ce n’è da spostare', () => {
    // Il tetto della destinazione è larghissimo: a comandare è il saldo di partenza.
    expect(largestThatFits(money('1000000'), money('0'), OUT, money('40')).toString()).toBe('40')
  })

  it('sotto la soglia è lo spazio più il pavimento, ed è esatto al centesimo', () => {
    // Qui la commissione non scala, quindi la relazione è una somma e il bordo è netto: il netto
    // riempie il caveau **esattamente**, e un centesimo in più non ci sta più.
    const largest = withdrawable('1000', '900', OUT)

    expect(largest.toString()).toBe(BALANCE.ATM_FEE_FLOOR.plus(money('100')).toString())
    expect(arriving(largest, OUT).toString()).toBe('100')
    expect(arriving(largest.plus(CENT), OUT).greaterThan(money('100'))).toBe(true)
  })

  it('sopra la soglia non è una sottrazione: è lo spazio diviso ciò che resta del tasso', () => {
    // Il caveau quasi pieno è il caso che la sottrazione ingenua sbaglia: `spazio + pavimento`
    // proporrebbe 5.002,50 €, che di commissione ne paga 100,05 e ne fa arrivare 4.902,45 —
    // cioè quasi cento euro di spazio lasciati vuoti, non un centesimo di troppo.
    const largest = withdrawable('20000', '15000', OUT)

    expect(largest.toString()).toBe('5102.04')
    expect(arriving(largest, OUT).lessThanOrEqualTo(money('5000'))).toBe(true)
  })

  it('e ciò che ne arriva ci sta sempre, in tutti e due i versi e a ogni riempimento', () => {
    // La proprietà che questa funzione promette, provata invece che raccontata: qualunque sia lo
    // spazio rimasto, ciò che il massimo fa arrivare entra — e la commissione non se lo mangia.
    const capacity = money('20000')

    for (const rate of [IN, OUT]) {
      for (let filled = 0; filled <= 20000; filled += 137) {
        const used = money(String(filled))
        const largest = withdrawable('20000', String(filled), rate)
        if (largest.isZero()) continue

        expect(fitsIn(capacity, used, arriving(largest, rate))).toBe(true)
        expect(isFeeWithinAmount(largest, atmFee(largest, rate))).toBe(true)
      }
    }
  })

  it('sopra la soglia resta al più un centesimo sotto il massimo assoluto, e la ragione è l arrotondamento', () => {
    // Misurato, non supposto: la commissione arrotonda **per eccesso**, e quel mezzo centesimo
    // restituisce un centesimo di gioco all'importo. Prenderlo vorrebbe dire risalire di un
    // centesimo per volta dentro una regola pura; lasciarlo costa un centesimo che nessuno vede.
    const largest = withdrawable('20000', '15000', OUT)

    expect(arriving(largest.plus(CENT), OUT).lessThanOrEqualTo(money('5000'))).toBe(true)
    expect(arriving(largest.plus(CENT).plus(CENT), OUT).greaterThan(money('5000'))).toBe(true)
  })

  it('è zero quando non esiste un importo che passa, invece di proporne uno che verrà rifiutato', () => {
    // Caveau pieno: qualunque cifra arrivi, non c'è dove metterla.
    expect(withdrawable('1000', '1000', OUT).toString()).toBe('0')

    // E depositando meno del pavimento: la commissione se lo mangerebbe, quindi non c'è un
    // massimo da offrire. È il patto di questa funzione — un `MAX` che propone un rifiuto è
    // peggio di un `MAX` che dice zero.
    expect(largestThatFits(null, money('0'), IN, BALANCE.ATM_FEE_FLOOR).toString()).toBe('0')
    expect(largestThatFits(null, money('0'), IN, BALANCE.ATM_FEE_FLOOR.plus(CENT)).toString()).toBe(
      BALANCE.ATM_FEE_FLOOR.plus(CENT).toString()
    )
  })
})
