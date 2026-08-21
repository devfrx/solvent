import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R17 · D025 · ADR 0032 — nessun tooltip nativo: se c'è una spiegazione, è `UiTooltip`.
 *
 * L'attributo `title` del browser costa zero e risolve il problema per finta: non si può vestire,
 * appare dopo circa un secondo, non si vede col tocco, non si raggiunge con la tastiera, e sarebbe
 * l'unico pezzo di interfaccia del progetto che non passa dal design system. Il guaio però non è che
 * sia brutto — è che è **gratis**, quindi il primo che lo scrive non fa niente di male e il secondo
 * lo copia. Da lì in poi ci sono due sistemi di spiegazione e nessuno dei due si può cambiare senza
 * toccare l'altro: è la forma esatta con cui `.refusal` si era duplicata prima di
 * [D016](../../docs/delega/D016-correzioni-audit.md).
 *
 * **Il rilevatore distingue l'attributo dalla proprietà**, e non è un dettaglio: `UiPanel` e
 * `UiHeading` hanno una proprietà che si chiama `title`, e `<UiPanel :title="…">` è legittimo. A
 * separarli è l'iniziale del tag — minuscola è un elemento del documento, maiuscola è un componente
 * — che è la stessa convenzione con cui Vue stesso li distingue.
 *
 * L'elemento `<title>` non è un attributo e passa: vive in `index.html`, che non è un `.vue`, e in
 * un eventuale `<svg>`, dove è il modo corretto di dare un nome a un disegno.
 *
 * **⚠️ Parziale, e lo dichiara** (docs/tracciabilita.md): guarda l'attributo scritto nel sorgente.
 * Un `title` messo a runtime con `setAttribute` le sfugge, come a `no-literal-in-template` sfugge
 * una frase assemblata. Prende la forma con cui il difetto nasce davvero, che è quella comoda.
 */

/**
 * Un tag con i suoi attributi. La classe di caratteri elenca le virgolette — un attributo può
 * contenere una parentesi angolare, `v-if="a > b"` — quindi la regex si costruisce da una stringa:
 * un `/regex/` letterale con dentro un apice manda fuori fase la scansione di
 * `tests/rules/english-identifiers`, che lo dichiara fra i propri limiti.
 */
const TAG = new RegExp(`<([A-Za-z][^\\s>/]*)((?:[^>"']|"[^"]*"|'[^']*')*)>`, 'g')

/** `title=`, `:title=` o `v-bind:title=` fra gli attributi, e non dentro il valore di un altro. */
const TITLE_ATTRIBUTE = /(?:^|\s)(?::|v-bind:)?title\s*=/

const isElement = (tag: string): boolean => tag[0] === tag[0]?.toLowerCase()

export const nativeTitlesIn = (source: string): string[] =>
  [...withoutComments(source).matchAll(TAG)]
    .filter((match) => isElement(match[1] ?? '') && TITLE_ATTRIBUTE.test(match[2] ?? ''))
    .map((match) => match[1] ?? '')

const normalize = (path: string): string => path.split(sep).join('/')

const components = sourceFiles('src', ['.vue']).map(normalize)

describe('il rilevatore', () => {
  it('prende il tooltip del browser su un elemento', () => {
    expect(nativeTitlesIn('<span title="La commissione">…</span>')).toEqual(['span'])
    expect(nativeTitlesIn('<abbr :title="text(`atm.fee`)">FEE</abbr>')).toEqual(['abbr'])
    expect(nativeTitlesIn('<span v-bind:title="hint"></span>')).toEqual(['span'])
  })

  it('e lascia stare la proprietà di un componente, che si chiama title a ragione', () => {
    expect(nativeTitlesIn('<UiPanel :title="text(`atm.recent.title`)">')).toEqual([])
    expect(nativeTitlesIn('<UiHeading title="Home" description="…" />')).toEqual([])
  })

  it('non scambia per un attributo una parola dentro il valore di un altro', () => {
    expect(nativeTitlesIn('<span class="subtitle=big">…</span>')).toEqual([])
    expect(nativeTitlesIn('<p>{{ text(`stats.operations.title`) }}</p>')).toEqual([])
  })

  it("non tocca l'elemento title, che non è un attributo", () => {
    expect(nativeTitlesIn('<svg><title>Una carta</title></svg>')).toEqual([])
  })

  it('non si perde su un attributo che contiene una parentesi angolare', () => {
    expect(nativeTitlesIn('<span v-if="a > b" title="x"></span>')).toEqual(['span'])
    expect(nativeTitlesIn('<span v-if="a > b" class="y"></span>')).toEqual([])
  })

  it('non guarda i commenti', () => {
    expect(nativeTitlesIn('// un giorno qualcuno scriverà <span title="x">')).toEqual([])
  })
})

describe('i componenti', () => {
  it('ce ne sono da guardare, altrimenti questo test non guarda niente', () => {
    expect(components.length).toBeGreaterThan(2)
  })

  it('nessuno usa il tooltip del browser', () => {
    const offenders = components.flatMap((file) =>
      nativeTitlesIn(read(file)).map((tag) => `${file}: <${tag} title=…>`)
    )

    expect(offenders).toEqual([])
  })
})
