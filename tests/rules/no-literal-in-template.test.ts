import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles } from '../helpers/sources'

/**
 * R12 · ADR 0011 — nessuna frase rivolta al giocatore vive dentro un componente.
 *
 * È l'altra metà di `tests/i18n/parity`: quello verifica che ogni chiave esista in ogni lingua,
 * questo che il testo passi davvero da una chiave. Senza il secondo, la parità sarebbe verde su un
 * dizionario che nessuno usa.
 *
 * **⚠️ Parziale, e lo dichiara** (docs/tracciabilita.md): è una regex sui nodi di testo, quindi
 * vede `<p>Compra</p>` e non vede una frase assemblata a runtime né un attributo — un
 * `placeholder="Importo"` le sfugge. Meglio di niente, e onesta su cosa non copre.
 */

/**
 * Il blocco `<template>` di primo livello. Ancorata a inizio riga perché i `<template v-if>`
 * annidati sono indentati e hanno degli attributi: il loro `</template>` non sta mai in colonna 1.
 */
const ROOT_TEMPLATE = /^<template>([\s\S]*?)^<\/template>/m

const COMMENT = /<!--[\s\S]*?-->/g

/** Interpolazioni e direttive: `{{ … }}` è già una chiave, non testo scritto a mano. */
const INTERPOLATION = /\{\{[\s\S]*?\}\}/g

/**
 * Un tag, con i suoi attributi. La classe di caratteri elenca le virgolette, quindi la regex si
 * costruisce da una stringa: un `/regex/` letterale con dentro un apice manda fuori fase la
 * scansione di `tests/rules/english-identifiers`, che lo dichiara fra i propri limiti.
 */
const TAG = new RegExp(`<[^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>`, 'g')

const LETTER = /\p{L}/u

const normalize = (path: string): string => path.split(sep).join('/')

const components = sourceFiles('src', ['.vue']).map(normalize)

/** Ciò che resta di un template quando si tolgono tag, commenti e interpolazioni: il testo nudo. */
const bareTextOf = (template: string): string[] =>
  template
    .replace(COMMENT, ' ')
    .replace(INTERPOLATION, ' ')
    .replace(TAG, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => LETTER.test(line))

const literalsIn = (source: string): string[] => {
  const template = ROOT_TEMPLATE.exec(source)?.[1]
  return template === undefined ? [] : bareTextOf(template)
}

describe('il rilevatore', () => {
  it('prende un nodo di testo scritto a mano', () => {
    expect(bareTextOf('<p>Compra</p>')).toEqual(['Compra'])
    expect(bareTextOf('<button class="buy">Partita nuova</button>')).toEqual(['Partita nuova'])
  })

  it('prende anche il testo che sta accanto a una interpolazione', () => {
    expect(bareTextOf('<p>Ti servono {{ money(cost) }}</p>')).toEqual(['Ti servono'])
  })

  it('non grida al lupo su un template fatto di sole chiavi', () => {
    expect(bareTextOf('<p>{{ text(`common.buy`) }}</p>')).toEqual([])
    expect(bareTextOf('<dd class="amount">{{ money(balances[pool]) }}</dd>')).toEqual([])
  })

  it('non si perde su un attributo che contiene una parentesi angolare', () => {
    // `v-if="a > b"` dentro un tag: una regex ingenua taglierebbe il tag a metà e leggerebbe il
    // resto come testo. La classe di caratteri consuma prima le virgolette, poi il tag.
    expect(bareTextOf('<p v-if="left > right">{{ text(`common.buy`) }}</p>')).toEqual([])
  })

  it('non guarda i commenti del template', () => {
    expect(bareTextOf('<!-- qui andrebbe una frase -->')).toEqual([])
  })

  it('prende il blocco di primo livello e non si ferma al primo template annidato', () => {
    const component = [
      '<template>',
      '  <template v-if="on">',
      '    Ciao',
      '  </template>',
      '</template>'
    ].join('\n')

    expect(literalsIn(component)).toEqual(['Ciao'])
  })
})

describe('i template', () => {
  it('ci sono dei componenti da guardare, altrimenti questo test non guarda niente', () => {
    expect(components.length).toBeGreaterThan(2)
  })

  it('nessuno contiene testo letterale', () => {
    const offenders = components.flatMap((file) =>
      literalsIn(read(file)).map((line) => `${file}: ${line}`)
    )

    expect(offenders).toEqual([])
  })
})
