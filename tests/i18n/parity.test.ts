import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import type { Dictionary } from '../../src/renderer/i18n'
import { en as english } from '../../src/renderer/i18n/en'
import { it as italian } from '../../src/renderer/i18n/it'
import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R12 · INV-07 · ADR 0011 — nessuna lingua diverge dall'altra, e nessun codice resta senza frase.
 *
 * Il difetto A13 erano venti chiavi mancanti nella lingua di default. Non era un problema di
 * traduzione: era che **niente confrontava** le lingue fra loro, quindi nessuno poteva accorgersene.
 *
 * Qui ci sono tre reti, e fanno tre lavori diversi:
 *
 * 1. la **parità**, nelle due direzioni: una chiave che sta in `it` e non in `en`, e il contrario;
 * 2. i **segnaposto**: `{required}` che sparisce in una traduzione fa sparire un numero, e la frase
 *    resta plausibile — è la forma di errore che una parità di sole chiavi non vede;
 * 3. la **copertura dei codici**, letta dal sorgente. Un elenco di codici scritto a mano qui dentro
 *    sarebbe già scaduto il giorno in cui nasce il quattordicesimo, e ne sono nati tre in tre
 *    deleghe: `error.income.already_upgraded` (D010), i due del bancomat (D014) e
 *    `error.game.load_failed` (D011).
 */

/**
 * Un codice di dominio scritto come stringa: `'error.ledger.insufficient_funds'`, con qualunque
 * virgoletta. Costruita da una stringa e non come `/regex/` letterale, perché una classe di
 * caratteri che elenca le virgolette manda fuori fase la scansione di
 * `tests/rules/english-identifiers` — è un limite dichiarato lì dentro, e questo è l'aggiramento.
 */
const CODE = new RegExp(`['"\`]((?:reason|error)\\.[a-z0-9_]+(?:\\.[a-z0-9_]+)+)['"\`]`, 'g')

/** `{required}` e `{n}`: ciò che una frase promette di ricevere da chi la mostra. */
const PLACEHOLDER = /\{([a-z]+)\}/g

const normalize = (path: string): string => path.split(sep).join('/')

/**
 * Il dizionario si esclude da sé: se un codice si giustificasse con la propria traduzione, il test
 * direbbe soltanto che il file è scritto in modo coerente con se stesso.
 */
const DICTIONARIES = 'src/renderer/i18n/'

const sources = sourceFiles('src')
  .map(normalize)
  .filter((path) => !path.startsWith(DICTIONARIES))

const codesIn = (source: string): string[] =>
  [...withoutComments(source).matchAll(CODE)].map((match) => match[1] ?? '')

const placeholdersIn = (message: string): string[] =>
  [...message.matchAll(PLACEHOLDER)].map((match) => match[1] ?? '').sort()

const sorted = (values: Iterable<string>): string[] => [...new Set(values)].sort()

const keysOf = (dictionary: Dictionary): string[] => sorted(Object.keys(dictionary))

const missingFrom = (present: Dictionary, expected: Dictionary): string[] =>
  keysOf(expected).filter((key) => !Object.hasOwn(present, key))

/** I codici che il **codice** produce, raccolti leggendo `src/` e non ricopiando un elenco. */
const codesInSource = sorted(sources.flatMap((file) => codesIn(read(file))))

/** I codici che il **dizionario** traduce. */
const codesInDictionary = keysOf(italian).filter(
  (key) => key.startsWith('reason.') || key.startsWith('error.')
)

describe('il rilevatore di codici', () => {
  it('prende una ragione e un codice di errore, con qualunque virgoletta', () => {
    expect(codesIn(`reason: 'reason.atm.deposit'`)).toEqual(['reason.atm.deposit'])
    expect(codesIn('{ code: "error.save.io" }')).toEqual(['error.save.io'])
    expect(codesIn('const key = `reason.income.tick`')).toEqual(['reason.income.tick'])
  })

  it('non prende un prefisso senza il suo suffisso, né una parola che ci somiglia', () => {
    expect(codesIn(`const family = 'error'`)).toEqual([])
    expect(codesIn(`const partial = 'error.save'`)).toEqual([])
    expect(codesIn('const reasoning = 1')).toEqual([])
  })

  it('non guarda i commenti, altrimenti sarebbe rosso su chi spiega la regola', () => {
    expect(codesIn(`// vietato scrivere 'error.finto.codice'\nconst ok = 1`)).toEqual([])
  })
})

describe('la parità fra le due lingue', () => {
  it('ci sono delle chiavi da confrontare, altrimenti il test non confronta niente', () => {
    expect(keysOf(italian).length).toBeGreaterThan(40)
  })

  it('ogni chiave di it esiste in en', () => {
    expect(missingFrom(english, italian)).toEqual([])
  })

  it('ogni chiave di en esiste in it', () => {
    expect(missingFrom(italian, english)).toEqual([])
  })

  it('nessuna traduzione è vuota', () => {
    const empty = Object.entries({ it: italian, en: english }).flatMap(([locale, dictionary]) =>
      Object.entries(dictionary)
        .filter(([, message]) => message.trim() === '')
        .map(([key]) => `${locale}: ${key}`)
    )

    expect(empty).toEqual([])
  })

  it('le due lingue promettono gli stessi segnaposto', () => {
    const diverging = keysOf(italian).filter((key) => {
      const here = placeholdersIn(italian[key as keyof Dictionary])
      const there = placeholdersIn(english[key as keyof Dictionary])
      return here.join() !== there.join()
    })

    expect(diverging).toEqual([])
  })
})

describe('INV-07 — ogni ragione e ogni codice di errore ha una chiave', () => {
  it('ci sono dei file da leggere, altrimenti la copertura è vuota', () => {
    expect(sources.length).toBeGreaterThan(20)
    expect(codesInSource.length).toBeGreaterThan(12)
  })

  it('i codici che il sorgente produce sono esattamente quelli che il dizionario traduce', () => {
    // Il confronto è secco e non «contiene»: dice anche il contrario, cioè una frase rimasta
    // dietro a un codice che non esiste più. Una chiave morta non fa rumore, e sopravvive
    // esattamente come sopravvive un codice non tradotto.
    expect(codesInSource).toEqual(codesInDictionary)
  })

  it('e li traduce in entrambe le lingue', () => {
    const untranslated = codesInSource.filter(
      (code) => !Object.hasOwn(italian, code) || !Object.hasOwn(english, code)
    )

    expect(untranslated).toEqual([])
  })
})
