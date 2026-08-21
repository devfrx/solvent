import { describe, expect, it } from 'vitest'

import { fromString } from '@core/contracts/money'

import { BALANCE } from '@core/balance/constants'

import {
  atmFee,
  fitsIn,
  isFeeWithinAmount,
  isValidAmount
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
