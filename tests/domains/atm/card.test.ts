import { describe, expect, it } from 'vitest'

import { authorizes, cardOf } from '@core/domains/atm/card'

/**
 * ADR 0042 — la carta è una funzione del **seme**, non di uno stream dell'Rng: un'estrazione
 * avanzerebbe un cursore che finisce nel salvataggio, e `cardOf` chiamata due volte darebbe due
 * carte. È la ragione per cui qui si può chiedere la stessa carta quante volte si vuole.
 */

/** Il gruppo di quattro, ripetuto quattro volte: com'è stampato. */
const PRINTED = /^\d{4} \d{4} \d{4} \d{4}$/

const MONTH_AND_YEAR = /^(\d{2}) \/ (\d{2})$/

/**
 * La somma di Luhn, scritta qui invece che importata: un test che riusasse la funzione del
 * sorgente direbbe solo che quella funzione è coerente con se stessa. Questa è la trascrizione
 * dell'algoritmo pubblicato, e il caso negativo qui sotto è ciò che dimostra che discrimina.
 */
const luhnSum = (printed: string): number =>
  [...printed.replace(/\D/g, '')]
    .reverse()
    .map(Number)
    .reduce((sum, digit, index) => {
      if (index % 2 === 0) return sum + digit
      const doubled = digit * 2
      return sum + (doubled > 9 ? doubled - 9 : doubled)
    }, 0)

const passesLuhn = (printed: string): boolean => luhnSum(printed) % 10 === 0

describe('il controllo di Luhn di questo test', () => {
  it('boccia il numero che la carta portava prima di essere derivata', () => {
    // `4913 2201 0067 5540` era la decorazione di D033, e la sua somma fa 53. È il controllo
    // negativo senza il quale «il numero passa Luhn» sarebbe vero anche per un rilevatore che
    // dice sempre di sì — la lezione della candela piatta di D034.
    expect(luhnSum('4913 2201 0067 5540')).toBe(53)
    expect(passesLuhn('4913 2201 0067 5540')).toBe(false)
  })

  it('promuove un numero valido', () => {
    expect(passesLuhn('4539 1488 0343 6467')).toBe(true)
  })
})

describe('la carta di una partita', () => {
  it('è la stessa ogni volta che si chiede', () => {
    expect(cardOf(1234)).toEqual(cardOf(1234))
    expect(cardOf(-7)).toEqual(cardOf(-7))
  })

  it('è diversa in due partite diverse', () => {
    // Il seme è ciò che distingue una partita da un'altra, e questa è la prima cosa del gioco che
    // lo fa vedere a schermo. Semi vicini apposta: se le cifre venissero da un incremento invece
    // che da un mescolatore, `1` e `2` darebbero due carte quasi uguali.
    const first = cardOf(1)
    const second = cardOf(2)

    expect(first.number).not.toBe(second.number)
    expect(first.code).not.toBe(second.code)
  })

  it('porta un numero stampato in quattro gruppi di quattro', () => {
    for (const seed of [0, 1, 42, -1, 2147483647, -2147483648]) {
      expect(cardOf(seed).number).toMatch(PRINTED)
    }
  })

  it('porta un numero che passa il controllo di Luhn', () => {
    for (const seed of [0, 1, 42, 99999, -1, -2024, 2147483647, -2147483648]) {
      expect(passesLuhn(cardOf(seed).number)).toBe(true)
    }
  })

  it('e la cifra di controllo è calcolata: cambiarne una qualunque lo rompe', () => {
    // Senza questo, «passa Luhn» resterebbe vero anche per un numero in cui l'ultima cifra fosse
    // estratta e per caso giusta. Qui ogni cifra viene spostata di uno, e nessuna delle sedici
    // sopravvive.
    const printed = cardOf(2026).number
    const digits = [...printed.replace(/\D/g, '')]

    for (let index = 0; index < digits.length; index += 1) {
      const mutated = [...digits]
      mutated[index] = String((Number(digits[index]) + 1) % 10)
      expect(passesLuhn(mutated.join(''))).toBe(false)
    }
  })

  it('porta una scadenza con un mese che esiste', () => {
    for (const seed of [0, 1, 42, -1, 7, 13, 2147483647]) {
      const found = MONTH_AND_YEAR.exec(cardOf(seed).expiry)

      expect(found).not.toBeNull()
      const month = Number(found?.[1])
      expect(month).toBeGreaterThanOrEqual(1)
      expect(month).toBeLessThanOrEqual(12)
    }
  })

  it('porta un codice di tre cifre, e lo zero iniziale resta', () => {
    for (const seed of [0, 1, 42, -1, 2147483647, -2147483648]) {
      expect(cardOf(seed).code).toMatch(/^\d{3}$/)
    }
  })
})

describe('la prova', () => {
  const card = cardOf(2026)

  it('passa con il codice della carta', () => {
    expect(authorizes(card, card.code)).toBe(true)
  })

  it('non passa con un altro codice', () => {
    const other = String((Number(card.code) + 1) % 1000).padStart(3, '0')

    expect(authorizes(card, other)).toBe(false)
  })

  it('non passa con niente', () => {
    expect(authorizes(card, '')).toBe(false)
    expect(authorizes(card, '   ')).toBe(false)
  })

  it('tollera gli spazi intorno, perché li tollera chi digita', () => {
    expect(authorizes(card, ` ${card.code} `)).toBe(true)
  })

  it('non tollera uno zero mancante', () => {
    // Il campo tiene testo e non un numero, ed è la ragione: `041` non è `41`, e un confronto
    // fatto su numeri li direbbe uguali.
    const zeroLed = cardOf(findSeedWithLeadingZero())

    expect(zeroLed.code.startsWith('0')).toBe(true)
    expect(authorizes(zeroLed, zeroLed.code.slice(1))).toBe(false)
  })
})

/** Il primo seme la cui carta ha un codice che comincia per zero. Ne esiste uno vicino. */
const findSeedWithLeadingZero = (): number => {
  for (let seed = 0; seed < 1000; seed += 1) {
    if (cardOf(seed).code.startsWith('0')) return seed
  }
  throw new Error('nessun seme sotto mille produce un codice con lo zero iniziale')
}
