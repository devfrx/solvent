import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { sourceFiles } from '../helpers/sources'

/**
 * C09 — nessun nome di file o di cartella sotto `src/` contiene una parola vietata dal
 * [glossario](../../docs/glossario.md).
 *
 * Sono parole che non descrivono niente, e la loro presenza è il segnale che una responsabilità
 * non è stata trovata: `utils.ts` cresce finché non c'è più un motivo per aprirlo, e `manager` è
 * il nome che si dà a una classe di cui non si sa dire cosa fa. Il glossario lo scriveva dal primo
 * giorno; fino a questa delega era una **speranza** — nessun meccanismo, nessuna riga in
 * `tracciabilita.md`, cioè per la regola del progetto stesso una regola che non esiste.
 *
 * **Perché solo `src/`, e non `tests/`.** Il divieto esiste perché quelle parole nascondono una
 * responsabilità mancante nel codice di prodotto. `tests/helpers/` non nasconde niente: la sua
 * responsabilità **è** aiutare i test, e la parola la descrive esattamente. Il glossario lo dice
 * insieme a questa riga, così la regola e il meccanismo dicono la stessa cosa.
 *
 * **⚠️ Parziale, e lo dichiara**: guarda i **nomi**, non gli identificatori. Dentro un
 * identificatore le stesse parole sono spesso legittime — `handler` è il nome standard di una
 * callback e compare in `Bus.ts` e in `host.ts` a ragione — e una regola che gridasse al lupo lì
 * verrebbe disattivata, dopodiché non proteggerebbe più niente.
 */

/** Vietate ovunque nel nome: `dataStore.ts` vale quanto `data.ts`. */
const FORBIDDEN_ANYWHERE = new Set([
  'utils',
  'helpers',
  'common',
  'misc',
  'shared',
  'data',
  'manager',
  'stuff',
  'temp'
])

/**
 * Vietate solo quando **sono** il nome intero. `handler` è vietato come nome di file, non come
 * parola: `CommandHandler` è un tipo del contratto. `service` è vietato senza un dominio davanti,
 * quindi `incomeService.ts` passa e `service.ts` no.
 */
const FORBIDDEN_ALONE = new Set(['handler', 'service'])

/** Vietate come **suffisso**: `LedgerOld.ts` è la forma in cui due versioni convivono per sempre. */
const FORBIDDEN_AS_SUFFIX = new Set(['new', 'old'])

/** `SaveFile.ts` → `save`, `file`. `store.test.ts` → `store`, `test`. */
const wordsIn = (name: string): string[] =>
  name
    .replace(/\.[^.]+$/, '')
    .split(/[^A-Za-z]+/)
    .flatMap((part) => part.split(/(?=[A-Z])/))
    .filter((part) => part !== '')
    .map((part) => part.toLowerCase())

const forbiddenIn = (name: string): string[] => {
  const words = wordsIn(name)
  const last = words[words.length - 1]

  const found = words.filter((word) => FORBIDDEN_ANYWHERE.has(word))
  if (words.length === 1 && last !== undefined && FORBIDDEN_ALONE.has(last)) found.push(last)
  if (last !== undefined && FORBIDDEN_AS_SUFFIX.has(last)) found.push(last)

  return [...new Set(found)]
}

const normalize = (path: string): string => path.split(sep).join('/')

/** Ogni segmento del percorso: le cartelle contano quanto i file. */
const segmentsOf = (path: string): string[] => normalize(path).split('/')

// D039 — anche `scripts/`: C09 parla di nomi di file e cartelle, e quella cartella ne ha.
const paths = [...sourceFiles('src'), ...sourceFiles('scripts', ['.mjs'])].map(normalize)

describe('il rilevatore', () => {
  it('spezza un nome nelle sue parole, in qualunque forma sia scritto', () => {
    expect(wordsIn('SaveFile.ts')).toEqual(['save', 'file'])
    expect(wordsIn('postings.ts')).toEqual(['postings'])
    expect(wordsIn('store.test.ts')).toEqual(['store', 'test'])
  })

  it('prende una parola vietata ovunque compaia nel nome', () => {
    expect(forbiddenIn('utils.ts')).toEqual(['utils'])
    expect(forbiddenIn('dataStore.ts')).toEqual(['data'])
    expect(forbiddenIn('SharedPanel.vue')).toEqual(['shared'])
  })

  it('prende `handler` e `service` solo quando sono il nome intero', () => {
    expect(forbiddenIn('handler.ts')).toEqual(['handler'])
    expect(forbiddenIn('service.ts')).toEqual(['service'])
    expect(forbiddenIn('commandHandler.ts')).toEqual([])
    expect(forbiddenIn('incomeService.ts')).toEqual([])
  })

  it('prende `new` e `old` solo in coda', () => {
    expect(forbiddenIn('LedgerOld.ts')).toEqual(['old'])
    expect(forbiddenIn('gameNew.ts')).toEqual(['new'])
    expect(forbiddenIn('newGame.ts')).toEqual([])
  })

  it('non grida al lupo sui nomi che il progetto usa davvero', () => {
    for (const name of ['Registry.ts', 'createGame.ts', 'BankCard3d.vue', 'contracts', 'kernel']) {
      expect(forbiddenIn(name)).toEqual([])
    }
  })
})

describe('i nomi di src/', () => {
  it('ce ne sono da guardare, altrimenti questo test non guarda niente', () => {
    expect(paths.length).toBeGreaterThan(30)
  })

  it('nessun file e nessuna cartella porta una parola vietata', () => {
    const offenders = [...new Set(paths.flatMap(segmentsOf))].flatMap((segment) =>
      forbiddenIn(segment).map((word) => `${segment}: ${word}`)
    )

    expect(offenders).toEqual([])
  })
})
