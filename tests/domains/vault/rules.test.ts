import { describe, expect, it } from 'vitest'

import { fromString } from '@core/contracts/money'
import { CASH_START_CAPACITY } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'

import {
  canExpand,
  capacityFor,
  expansionPriceFor,
  expansionPrices,
  isMaxLevel,
  MAX_LEVEL,
  VAULT_POOL
} from '../../../src/core/domains/vault/rules'

/**
 * Le regole pure del caveau, provate senza kernel, senza Ledger e senza comandi: è esattamente ciò
 * che la loro purezza serve a comprare (R13).
 */

const money = fromString

describe('la capienza per livello', () => {
  it('parte da quella che il pool dichiara, e non è una seconda copia', () => {
    // Per identità: `CASH_START_CAPACITY` è scritto in un posto solo, e la curva **comincia da
    // lì**. Due dichiarazioni dello stesso primo gradino potrebbero divergere.
    expect(capacityFor(0)).toBe(CASH_START_CAPACITY)
  })

  it('cresce a ogni livello, e i livelli finiscono', () => {
    // «Il caveau arriva a un ultimo livello e lì si ferma», e il giocatore lo vede dal primo
    // secondo (docs/design/domini/vault.md). Un tetto dichiarato si verifica con un test e non si
    // ritara mai; una curva che si strozza da sola andrebbe ritarata a ogni cambio di reddito.
    expect(MAX_LEVEL).toBeGreaterThan(0)
    for (let level = 0; level < MAX_LEVEL; level += 1) {
      expect(capacityFor(level + 1).greaterThan(capacityFor(level))).toBe(true)
    }
  })

  it('stringe un livello che arriva da fuori invece di rispondere “nessun tetto”', () => {
    // Un livello fuori scala arriva da un salvataggio, cioè da fuori. Una capienza `undefined`
    // diventerebbe un tetto che non esiste, cioè il contrario del muro.
    expect(capacityFor(-5)).toBe(capacityFor(0))
    expect(capacityFor(MAX_LEVEL + 99)).toBe(capacityFor(MAX_LEVEL))
  })

  it('e l’ultimo livello si riconosce', () => {
    expect(isMaxLevel({ level: 0 })).toBe(false)
    expect(isMaxLevel({ level: MAX_LEVEL })).toBe(true)
  })

  it('il pool che il caveau tiene è dichiarato qui, non nel bootstrap', () => {
    expect(VAULT_POOL).toBe('cash')
  })
})

describe('il listino dell’ampliamento', () => {
  it('ha due voci, contanti e carta, e la carta costa meno', () => {
    // Il primo listino a due voci del gioco: è qui che «con cosa paghi» smette di essere una frase
    // dell'ADR 0017 e diventa una scelta.
    const prices = expansionPrices(0)

    expect(prices.map((option) => option.pool)).toEqual(['cash', 'card'])
    const [cash, card] = prices
    if (cash === undefined || card === undefined) throw new Error('due voci attese')
    expect(card.price.lessThan(cash.price)).toBe(true)
  })

  it('e ogni prezzo ci sta dentro il caveau da cui si paga', () => {
    // Per pagare in contanti bisogna **poterli tenere**: se il prezzo superasse la capienza del
    // livello da cui si parte, la voce «contanti» sarebbe impossibile invece che cara, e il
    // listino avrebbe due voci di cui una mai scelta.
    for (let level = 0; level < MAX_LEVEL; level += 1) {
      const cash = expansionPriceFor(level, 'cash')
      if (cash === null) throw new Error('il livello deve avere un prezzo in contanti')
      expect(cash.price.lessThanOrEqualTo(capacityFor(level))).toBe(true)
    }
  })

  it('è vuoto all’ultimo livello, che è una risposta e non un caso limite', () => {
    expect(expansionPrices(MAX_LEVEL)).toEqual([])
    expect(expansionPriceFor(MAX_LEVEL, 'cash')).toBeNull()
  })

  it('non offre uno strumento che non c’è', () => {
    expect(expansionPriceFor(0, 'world')).toBeNull()
    expect(expansionPriceFor(0, 'card')?.price).toBe(BALANCE.VAULT_PRICES_CARD[0])
  })
})

describe('l’anteprima dell’ampliamento', () => {
  it('dice di sì quando lo strumento basta', () => {
    const option = expansionPriceFor(0, 'cash')
    if (option === null) throw new Error('opzione attesa')

    expect(canExpand({ level: 0 }, option, option.price)).toBe(true)
    expect(canExpand({ level: 0 }, option, option.price.minus(money('0.01')))).toBe(false)
  })

  it('e dice di no all’ultimo livello, per quanto denaro ci sia', () => {
    const option = expansionPriceFor(0, 'cash')
    if (option === null) throw new Error('opzione attesa')

    expect(canExpand({ level: MAX_LEVEL }, option, money('99999999'))).toBe(false)
  })
})
