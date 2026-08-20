import { describe, expect, it } from 'vitest'

import { fromString } from '@core/contracts/money'

import { milliseconds } from '@core/kernel/Clock'

import type { Locale, MessageKey, Wording } from '../../src/renderer/i18n'
import {
  createTranslations,
  createTranslator,
  LOCALES,
  traceabilityKey
} from '../../src/renderer/i18n'
import { it as italian } from '../../src/renderer/i18n/it'

/**
 * Le due verifiche che D012 elencava come «a occhio», rese permanenti: che il rifiuto di un
 * acquisto arrivi al giocatore come una **frase con dentro le due cifre**, e che cambiando lingua
 * cambi davvero tutto.
 *
 * Gira senza montare niente e senza un DOM finto perché `createTranslator` riceve le quattro
 * funzioni di vue-i18n per costruzione, esattamente come il renderer riceve il browser da
 * `runtime/host.ts`. È lo stesso confine, applicato alle parole.
 *
 * Copre anche il **cablaggio** di vue-i18n, che nient'altro tocca: chiavi piatte, formati di
 * valuta e di data, plurali. Se una di queste tre cose smettesse di funzionare, la libreria non
 * lancerebbe — restituirebbe la chiave, o un numero senza separatori — e il difetto si vedrebbe
 * solo a schermo.
 */

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

/**
 * Fra la cifra e il simbolo di valuta ICU mette uno spazio unificatore, normale o stretto a
 * seconda della versione. Qui contano le parole e le cifre, non quale dei due sia.
 */
const plain = (text: string): string => text.replace(/\s/g, ' ')

const translations = createTranslations()
const composer = translations.global

const wording: Wording = {
  text: (key, values) => composer.t(key, values),
  count: (key, amount) => composer.t(key, amount),
  number: (value, format) => composer.n(value, format),
  date: (value, format) => composer.d(value, format)
}

const words = createTranslator(wording)

const speaking = (locale: Locale): void => {
  composer.locale.value = locale
}

const INSUFFICIENT = {
  code: 'error.ledger.insufficient_funds',
  pool: 'card',
  required: fromString('800'),
  available: fromString('412.05')
} as const

describe('il rifiuto di un acquisto', () => {
  it('arriva con le due cifre, non con un codice', () => {
    speaking('it')

    const said = plain(words.failure(INSUFFICIENT))

    expect(said).toContain('800,00 €')
    expect(said).toContain('412,05 €')
    expect(said).not.toContain('error.')
  })

  it('dice anche **dove** mancano, perché il reddito entra altrove', () => {
    // Senza il nome del pool la frase contraddirebbe il saldo che il giocatore ha davanti: i
    // contanti salgono, la carta è vuota, e l'upgrade si paga con la carta (D010).
    speaking('it')

    expect(words.failure(INSUFFICIENT)).toContain('Carta')
  })

  it('e cambia lingua insieme a tutto il resto', () => {
    speaking('en')
    const said = plain(words.failure(INSUFFICIENT))

    expect(said).toContain('€800.00')
    expect(said).toContain('Card')
    expect(said).not.toContain('Carta')
  })
})

describe('cambiare lingua', () => {
  it('cambia ogni testo, non solo quelli che qualcuno ha ricordato', () => {
    const keys = Object.keys(italian) as MessageKey[]

    speaking('it')
    const before = keys.map((key) => words.text(key))
    speaking('en')
    const after = keys.map((key) => words.text(key))

    // Non tutte le frasi cambiano — «Home» e «Gold» sono uguali in entrambe — ma la grande
    // maggioranza sì, e se il cambio di lingua non arrivasse questo numero crollerebbe a zero.
    const changed = keys.filter((_, index) => before[index] !== after[index])
    expect(changed.length).toBeGreaterThan(keys.length / 2)
  })

  it('e nessuna chiave resta senza frase, in nessuna delle due lingue', () => {
    // Una chiave che non si risolve non lancia: vue-i18n ritorna la chiave stessa, e a schermo
    // compare `app.error.retry` al posto di «Riprova». È l'unico modo in cui si vedrebbe.
    const unresolved = LOCALES.flatMap((locale) => {
      speaking(locale)
      return (Object.keys(italian) as MessageKey[])
        .filter((key) => words.text(key) === key)
        .map((key) => `${locale}: ${key}`)
    })

    expect(unresolved).toEqual([])
  })
})

describe('le forme che una lingua decide da sé', () => {
  it('il plurale del tempo passato', () => {
    speaking('it')

    expect(words.duration(milliseconds(3 * HOUR + 12 * MINUTE))).toBe('3 ore e 12 minuti')
    expect(words.duration(milliseconds(HOUR + MINUTE))).toBe('1 ora e 1 minuto')
    expect(words.duration(milliseconds(45 * MINUTE))).toBe('45 minuti')
  })

  it('e in inglese non è la stessa frase con le stesse parole', () => {
    speaking('en')

    expect(words.duration(milliseconds(3 * HOUR + 12 * MINUTE))).toBe('3 hours and 12 minutes')
    expect(words.duration(milliseconds(HOUR + MINUTE))).toBe('1 hour and 1 minute')
  })

  it('il denaro si scrive come lo scrive la lingua', () => {
    speaking('it')
    expect(plain(words.money(fromString('1284.6')))).toBe('1.284,60 €')

    speaking('en')
    expect(plain(words.money(fromString('1284.6')))).toBe('€1,284.60')
  })

  it('la data di un salvataggio è una data, non un numero', () => {
    speaking('it')

    expect(words.instant(Date.UTC(2026, 5, 12, 10, 30))).toContain('2026')
  })
})

describe('i nomi dei pool', () => {
  it('i due del giocatore hanno un nome tradotto', () => {
    speaking('it')
    expect(words.poolName('cash')).toBe('Contanti')

    speaking('en')
    expect(words.poolName('cash')).toBe('Cash')
  })

  it('i conti non-giocatore no, e mostrano il proprio id invece di un nome inventato', () => {
    // ADR 0017 — non compaiono mai nella UI. Se uno arriva fin qui il difetto è a monte, e va
    // visto: una traduzione gentile lo nasconderebbe.
    speaking('it')

    expect(words.poolName('fees')).toBe('fees')
    expect(words.poolName('world')).toBe('world')
  })
})

describe('le righe di una transazione', () => {
  it('portano il proprio verso davanti: un importo senza segno non dice da che parte va', () => {
    // Il riquadro «cosa succede» mostra tre movimenti che sommano a zero: «497,50» non dice se
    // sono arrivati o partiti, «+ 497,50» sì. È il motivo per cui i formati sono due.
    speaking('it')

    expect(plain(words.signedMoney(fromString('497.5')))).toBe('+497,50 €')
    expect(plain(words.signedMoney(fromString('-500')))).toBe('-500,00 €')
  })

  it('ma non davanti allo zero, che non va da nessuna parte', () => {
    speaking('it')

    expect(plain(words.signedMoney(fromString('0')))).toBe('0,00 €')
  })

  it('e un saldo resta senza segno: il più davanti al patrimonio sarebbe rumore', () => {
    speaking('it')

    expect(plain(words.money(fromString('1284.6')))).toBe('1.284,60 €')
  })
})

describe('il rifiuto del bancomat', () => {
  it('dice quanto costa e quanto ci sarebbe stato, non un codice', () => {
    // ADR 0018 — sopra la capienza, o sotto la commissione, il prelievo viene rifiutato **con un
    // motivo**. Il motivo è questa frase, e senza le due cifre non spiega niente.
    speaking('it')

    const said = plain(
      words.failure({
        code: 'error.atm.fee_exceeds_amount',
        amount: fromString('1'),
        fee: fromString('2.50')
      })
    )

    expect(said).toContain('1,00 €')
    expect(said).toContain('2,50 €')
    expect(said).not.toContain('error.')
  })
})

describe('la tracciabilità di un pool', () => {
  it('sono le due facce della stessa dichiarazione, non due frasi scritte a mano', () => {
    // P4 — la carta è tracciabile, i contanti no. A dirlo è `POOLS`, e questa funzione lo traduce:
    // il giorno in cui un pool cambia dichiarazione, la frase cambia da sola.
    speaking('it')

    expect(words.text(traceabilityKey('card'))).toBe('Ogni movimento è registrato')
    expect(words.text(traceabilityKey('cash'))).toBe('Nessuna traccia')
  })
})
