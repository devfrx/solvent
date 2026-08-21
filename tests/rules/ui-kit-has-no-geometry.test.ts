import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R16 · D024 · ADR 0030 — un pezzo del kit non prende la geometria per proprietà.
 *
 * L'[ADR 0028](../../docs/adr/0028-il-kit-ui-non-sa-che-gioco-e.md) ha scartato `UiRow` e `UiStack`
 * con una ragione precisa: «nascono con due proprietà e ne hanno dodici dopo tre schermate». La
 * ragione però non era il fatto di impaginare — era la **parametrizzazione**: chi chiama decide
 * ogni volta lo spazio, la direzione, l'allineamento, e ogni decisione nuova diventa una proprietà.
 *
 * L'ADR 0030 trasforma quella ragione in un criterio verificabile: se puoi cambiare la disposizione
 * passando una proprietà, è un contenitore; se la disposizione è scritta nel file, è una forma. Il
 * kit accetta le forme — `UiShell` — e rifiuta i contenitori.
 *
 * Senza questo test il criterio sarebbe una convenzione da ricordare, ed è la classe di regola che
 * questo progetto ha visto rompersi in silenzio tre volte (D001, D021, D022).
 *
 * **⚠️ Parziale, e lo dichiara** (docs/tracciabilita.md): legge i **nomi** delle proprietà nel
 * sorgente. Un nome inventato per aggirarla — `spacing`, `layout` — le sfugge, come a
 * `no-literal-in-template` sfugge un attributo. Prende la forma con cui il difetto nasce davvero,
 * che è quella coi nomi consueti: la prima proprietà scritta in fretta si chiama `gap`.
 */

const KIT = 'src/renderer/ui'

/**
 * Le parole che rendono una proprietà «geometria». Sono i nomi con cui la disposizione entra
 * davvero da fuori, non un elenco di tutto ciò che il CSS sa fare: una lista lunga produrrebbe falsi
 * positivi, e un test che grida al lupo viene disattivato.
 */
const GEOMETRY = new Set([
  'gap',
  'direction',
  'align',
  'justify',
  'width',
  'height',
  'padding',
  'margin',
  'inset',
  'span'
])

/**
 * Il blocco fra `defineProps<{` e `}>(`. Non greedy: si ferma alla prima chiusura, che è quella
 * giusta finché nessuna proprietà dichiara un oggetto annidato — e una proprietà che lo facesse
 * sarebbe un altro problema, non questo.
 */
const PROPS_BLOCK = /defineProps<\{([\s\S]*?)\}>\(/

/** `readonly gap?: number` → `gap`. Il nome di una proprietà è ciò che sta prima dei due punti. */
const PROPERTY = /(?:readonly\s+)?([A-Za-z][A-Za-z0-9]*)\??\s*:/g

/** `navWidth` → `nav`, `width`. Stessa scomposizione di `tests/rules/forbidden-words`. */
const wordsIn = (name: string): string[] =>
  name
    .split(/(?=[A-Z])/)
    .filter((part) => part !== '')
    .map((part) => part.toLowerCase())

export const propertiesIn = (source: string): string[] => {
  const block = PROPS_BLOCK.exec(withoutComments(source))?.[1]
  if (block === undefined) return []

  return [...block.matchAll(PROPERTY)].map((match) => match[1] ?? '')
}

export const geometryIn = (source: string): string[] =>
  propertiesIn(source).filter((name) => wordsIn(name).some((word) => GEOMETRY.has(word)))

const normalize = (path: string): string => path.split(sep).join('/')

const kitFiles = sourceFiles(KIT, ['.vue']).map(normalize)

const componentWith = (props: string): string =>
  ['<script setup lang="ts">', `defineProps<{${props}}>()`, '</script>', ''].join('\n')

describe('il rilevatore', () => {
  it('legge i nomi delle proprietà, non i loro tipi', () => {
    expect(
      propertiesIn(componentWith('readonly label: string; readonly tone?: ColorRole'))
    ).toEqual(['label', 'tone'])
  })

  it('prende la geometria scritta com’è', () => {
    expect(geometryIn(componentWith('readonly gap: number'))).toEqual(['gap'])
    expect(geometryIn(componentWith('readonly align?: string'))).toEqual(['align'])
  })

  it('e anche quella nascosta dentro un nome composto', () => {
    expect(geometryIn(componentWith('readonly navWidth: string'))).toEqual(['navWidth'])
  })

  it('lascia stare ciò che geometria non è', () => {
    expect(geometryIn(componentWith('readonly label: string; readonly size?: TextSize'))).toEqual(
      []
    )
    expect(geometryIn(componentWith('readonly side?: Side'))).toEqual([])
  })

  it('non guarda una proprietà nominata in un commento', () => {
    expect(geometryIn('// un giorno qualcuno chiederà gap: number')).toEqual([])
  })

  it('e non inventa proprietà dove non ce ne sono', () => {
    expect(propertiesIn('<script setup lang="ts"></script>')).toEqual([])
  })
})

describe('nessun pezzo del kit prende la geometria', () => {
  it('e almeno uno esiste: senza, questo file sarebbe verde senza aver guardato niente', () => {
    expect(kitFiles.length).toBeGreaterThan(0)
  })

  for (const path of kitFiles) {
    it(`${path} non la prende`, () => {
      expect(geometryIn(read(path))).toEqual([])
    })
  }
})
