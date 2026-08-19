import { describe, expect, it } from 'vitest'

import { fromString } from '@core/contracts/money'

import { BALANCE } from '@core/balance/constants'

import {
  atmFee,
  capacityOf,
  fitsIn,
  isFeeWithinAmount,
  isValidAmount
} from '../../../src/core/domains/atm/rules'

/**
 * Le regole pure del bancomat, provate senza kernel, senza Ledger e senza comandi: è esattamente
 * ciò che la loro purezza serve a comprare.
 */

const money = fromString

describe('la commissione', () => {
  it('è quella dichiarata in constants.ts, non un numero del dominio', () => {
    // Da sola questa riga è quasi una tautologia, e va detto: a impedire che un numero di gioco
    // nasca dentro `domains/` è un meccanismo, non un'asserzione. Per i numeri è
    // `no-magic-numbers` (D010, `.div(10)`); per il denaro — che si costruisce da una **stringa**,
    // e quindi passava indisturbato — è `tests/rules/domains-no-money-literals`, nato qui.
    // Questa riga dichiara *quale* costante è quella giusta, così cambiarla in `constants.ts` basta.
    expect(atmFee().toString()).toBe(BALANCE.ATM_FEE.toString())
  })

  it('è la stessa per il deposito e per il prelievo', () => {
    // Una costante sola finché non c'è una ragione di gioco per due: la funzione non ha un
    // parametro che possa distinguerli, quindi la simmetria non è una promessa ma una firma.
    expect(atmFee().toString()).toBe(atmFee().toString())
    expect(atmFee().toString()).toBe('2.5')
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
  it('oggi è illimitata per i pool del giocatore — è una fotografia, non un’assunzione', () => {
    // Quando il caveau della fetta 02 darà una capienza ai contanti, questo test diventa rosso ed
    // è il modo giusto per accorgersene: la riga qui sotto va aggiornata, non il dominio.
    expect(capacityOf('cash')).toBeNull()
    expect(capacityOf('card')).toBeNull()
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
