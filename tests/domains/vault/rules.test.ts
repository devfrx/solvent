import { describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'
import { CASH_START_CAPACITY } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'

import {
  canExpand,
  cashCapacityFor,
  expansionPriceFor,
  expansionPrices,
  isMaxLevel,
  MAX_LEVEL,
  VAULT_POOL
} from '../../../src/core/domains/vault/rules'

/**
 * Le regole pure del caveau, provate senza kernel, senza Ledger e senza comandi: è esattamente ciò
 * che la loro purezza serve a comprare (R13).
 *
 * Da [D042](../../../docs/delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md) la scala non è più
 * un elenco: si **calcola** da cinque costanti. Ne discende che questi test non possono più
 * limitarsi a confrontare due letture della stessa lista — devono provare **la curva**, e la
 * tabella qui sotto è la stessa che sta nella delega. Se una delle due cambia senza l'altra, uno
 * dei due è invecchiato e questo test dice quale riga.
 */

const money = fromString

/**
 * La scala dichiarata, riga per riga, presa da D042 — _La scala che ne esce_. Vive qui e non
 * dentro un `for` che la ricalcola: un test che ricostruisce la formula del codice sotto test non
 * prova la formula, prova sé stesso.
 */
const SCALE = [
  { space: '10', capacity: '1000', cash: '900', card: '898' },
  { space: '20', capacity: '2000', cash: '1800', card: '1798' },
  { space: '40', capacity: '4000', cash: '3600', card: '3598' },
  { space: '80', capacity: '8000', cash: '7200', card: '7198' },
  { space: '160', capacity: '16000', cash: '14400', card: '14398' },
  { space: '320', capacity: '32000', cash: '28800', card: '28798' },
  { space: '640', capacity: '64000', cash: '57600', card: '57598' },
  { space: '1280', capacity: '128000', cash: '115200', card: '115198' },
  { space: '2560', capacity: '256000', cash: null, card: null }
] as const

describe('lo spazio per livello', () => {
  // L'ingombro non ha una porta pubblica, e non deve averla finché nessuno ha un ingombro da
  // dichiarare (vedi il commento su `spaceOf`). Si guarda da dove il gioco lo guarda: dividendo la
  // capienza per la densità dei contanti. È la stessa informazione, e non costringe il dominio ad
  // aprire una superficie con un consumatore solo.
  const spaceAt = (level: number) => cashCapacityFor(level).div(BALANCE.CASH_PER_SPACE)

  it('ha tanti gradini quanti la costante ne dichiara', () => {
    // Quanti livelli esistano è **una costante sola**, non la lunghezza di un elenco che qualcuno
    // tiene allineato a mano: allungare la scala è cambiare un numero (D042).
    expect(MAX_LEVEL).toBe(BALANCE.VAULT_LEVELS - 1)
    expect(SCALE.length).toBe(BALANCE.VAULT_LEVELS)
  })

  it('cresce del fattore dichiarato a ogni gradino', () => {
    for (let level = 0; level < MAX_LEVEL; level += 1) {
      expect(toString(spaceAt(level + 1))).toBe(
        toString(spaceAt(level).times(BALANCE.VAULT_SPACE_GROWTH))
      )
    }
  })

  it('e coincide, gradino per gradino, con la scala che la delega dichiara', () => {
    SCALE.forEach((step, level) => {
      expect(toString(spaceAt(level))).toBe(toString(money(step.space)))
    })
  })
})

describe('la capienza in contanti per livello', () => {
  it('al livello zero è quella che il pool dichiara, e non è una seconda copia', () => {
    // Fino a D042 il confronto era per **identità**, perché l'elenco cominciava letteralmente da
    // quella costante. Adesso la capienza si **calcola** — spazio per densità — quindi l'identità
    // non c'è più e il confronto è per valore. È un indebolimento apparente: la cifra dichiarata
    // resta una sola, perché lo spazio del livello zero è a sua volta derivato **da lei**.
    expect(toString(cashCapacityFor(0))).toBe(toString(CASH_START_CAPACITY))
  })

  it('e coincide, gradino per gradino, con la scala che la delega dichiara', () => {
    SCALE.forEach((step, level) => {
      expect(toString(cashCapacityFor(level))).toBe(toString(money(step.capacity)))
    })
  })

  it('cresce a ogni livello, e i livelli finiscono', () => {
    // «Il caveau arriva a un ultimo livello e lì si ferma», e il giocatore lo vede dal primo
    // secondo (docs/design/domini/vault.md). Un tetto dichiarato si verifica con un test e non si
    // ritara mai; una curva che si strozza da sola andrebbe ritarata a ogni cambio di reddito.
    expect(MAX_LEVEL).toBeGreaterThan(0)
    for (let level = 0; level < MAX_LEVEL; level += 1) {
      expect(cashCapacityFor(level + 1).greaterThan(cashCapacityFor(level))).toBe(true)
    }
  })

  it('stringe un livello che arriva da fuori invece di rispondere “nessun tetto”', () => {
    expect(toString(cashCapacityFor(-5))).toBe(toString(cashCapacityFor(0)))
    expect(toString(cashCapacityFor(MAX_LEVEL + 99))).toBe(toString(cashCapacityFor(MAX_LEVEL)))
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

  it('e coincide, gradino per gradino, con la scala che la delega dichiara', () => {
    SCALE.forEach((step, level) => {
      const cash = expansionPriceFor(level, 'cash')
      const card = expansionPriceFor(level, 'card')

      if (step.cash === null || step.card === null) {
        expect(cash).toBeNull()
        expect(card).toBeNull()
        return
      }
      expect(toString(cash?.price ?? money('-1'))).toBe(toString(money(step.cash)))
      expect(toString(card?.price ?? money('-1'))).toBe(toString(money(step.card)))
    })
  })

  it('il prezzo in contanti è la frazione dichiarata della capienza da cui si paga', () => {
    // È **il muro che insegna sé stesso**, e da D042 è una regola invece di quattro numeri
    // allineati a mano: per pagare in contanti bisogna poterli tenere, quindi il caveau va quasi
    // riempito prima di potersi ampliare. Dei quattro numeri vecchi, uno era già scivolato al
    // 90,7% e nessun test lo guardava.
    for (let level = 0; level < MAX_LEVEL; level += 1) {
      const cash = expansionPriceFor(level, 'cash')
      if (cash === null) throw new Error('il livello deve avere un prezzo in contanti')

      expect(toString(cash.price)).toBe(
        toString(cashCapacityFor(level).times(BALANCE.VAULT_EXPANSION_PRICE_RATIO))
      )
    }
  })

  it('e ogni prezzo ci sta dentro il caveau da cui si paga', () => {
    // La conseguenza della riga qui sopra, detta come la vive il giocatore: se il prezzo superasse
    // la capienza del livello da cui si parte, la voce «contanti» sarebbe impossibile invece che
    // cara, e il listino avrebbe due voci di cui una mai scelta.
    for (let level = 0; level < MAX_LEVEL; level += 1) {
      const cash = expansionPriceFor(level, 'cash')
      if (cash === null) throw new Error('il livello deve avere un prezzo in contanti')
      expect(cash.price.lessThanOrEqualTo(cashCapacityFor(level))).toBe(true)
    }
  })

  it('lo sconto della carta è lo stesso a ogni livello, ed è dichiarato una volta sola', () => {
    // Fino a D042 erano quattro costanti che portavano lo stesso numero. Due dichiarazioni della
    // stessa cosa possono divergere; una sola no — ed è la stessa leva che `vault_card_discount`
    // sorveglia.
    for (let level = 0; level < MAX_LEVEL; level += 1) {
      const [cash, card] = expansionPrices(level)
      if (cash === undefined || card === undefined) throw new Error('listino a due voci atteso')

      expect(toString(cash.price.minus(card.price))).toBe(toString(BALANCE.VAULT_CARD_DISCOUNT))
    }
  })

  it('è vuoto all’ultimo livello, che è una risposta e non un caso limite', () => {
    expect(expansionPrices(MAX_LEVEL)).toEqual([])
    expect(expansionPriceFor(MAX_LEVEL, 'cash')).toBeNull()
  })

  it('non offre uno strumento che non c’è', () => {
    expect(expansionPriceFor(0, 'world')).toBeNull()
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
