import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ICONS } from '../../src/renderer/ui/icons'
import { glyphSheet, glyphSheetJson } from '../helpers/glyphs'
import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R28 · D038 · ADR 0046 — un'icona viene da un insieme solo, e nessuna resta senza chi la disegni.
 *
 * Due controlli, con due forze diverse e dichiarate — la stessa forma di `docs-facts`.
 *
 * Il primo è ✅ **esatto**: `src/renderer/ui/glyphs.json` non si scrive a mano, lo produce
 * `tests/helpers/glyphs.ts` leggendo `icons.ts` e l'insieme installato, e qui si pretende che il
 * file versionato coincida con ciò che la derivazione ritorna. Cambiare insieme, aggiungere un
 * nome o togliere il pacchetto rende rosso il gate finché il file non torna a dire il vero. È la
 * forma di `project-state`, applicata a un sorgente invece che a un documento, e la ragione è la
 * stessa: non si controlla che due cose coincidano, si fa in modo che ce ne sia una sola.
 *
 * Per rigenerarlo: `npx vitest run tests/rules/icons -u`.
 *
 * Il secondo è ⚠️ **parziale e lo dichiara**: ogni nome dichiarato deve essere disegnato da
 * qualcuno. Legge gli attributi scritti nel sorgente — `icon="swap"` su un pulsante, `name="swap"`
 * su un'icona — quindi un nome legato a runtime gli sfugge, come a `no-literal-in-template` sfugge
 * un attributo. Prende la forma con cui il difetto nasce davvero: un'icona aggiunta «che poi
 * servirà», che è il magazzino di roba morta che l'[ADR 0012](../../docs/adr/0012-controlli-sul-codice-morto-sempre-accesi.md)
 * esiste per non far crescere.
 *
 * **E un terzo, che vale come R15 applicata a un disegno di qualcun altro:** un corpo che porta un
 * colore proprio non entra. Le icone di un insieme serio dipingono con `currentColor` e prendono il
 * colore di chi le ospita — è la stessa proprietà per cui l'[ADR 0034](../../docs/adr/0034-il-grafico-e-una-libreria.md)
 * ha scelto una libreria che rende in SVG. Un'icona a colori fissi porterebbe una seconda tavolozza
 * dentro il pacchetto, dove `no-color-literals` non guarda perché il file è generato.
 */

const SHEET = 'src/renderer/ui/glyphs.json'

/** Gli stessi valori di `no-color-literals`: un colore scritto per esteso, in qualunque notazione. */
const COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\s*\(/gi

/** `icon="swap"` su un pulsante, `name="swap"` su un'icona. Solo statici: un legame dinamico ha i due punti. */
const REFERENCE = /\bicon="([a-z][a-z-]*)"|<UiIcon\b[^>]*\bname="([a-z][a-z-]*)"/g

const normalize = (path: string): string => path.split(sep).join('/')

export const colorsIn = (source: string): string[] => source.match(COLOR) ?? []

export const referencesIn = (source: string): string[] =>
  [...withoutComments(source).matchAll(REFERENCE)].flatMap((match) =>
    [match[1], match[2]].filter((name): name is string => name !== undefined)
  )

const components = sourceFiles('src/renderer', ['.vue']).map(normalize)

const referenced = new Set(components.flatMap((path) => referencesIn(read(path))))

const sheet = glyphSheet()

describe('il rilevatore dei riferimenti', () => {
  it('prende il nome scritto sul pulsante e quello scritto sull’icona', () => {
    expect(referencesIn('<UiButton icon="swap" :label="text(`atm.swap`)" />')).toEqual(['swap'])
    expect(referencesIn('<UiIcon name="theme" />')).toEqual(['theme'])
  })

  it('lascia stare ciò che icona non è', () => {
    expect(referencesIn('<input :name="group" type="radio" />')).toEqual([])
    expect(referencesIn('<UiPanel :title="text(`payment.title`)" />')).toEqual([])
  })

  it('e non legge un nome che sta dentro un commento', () => {
    expect(referencesIn('// un giorno servirà icon="wallet"')).toEqual([])
  })
})

describe('la derivazione', () => {
  it('estrae un glifo per ogni nome dichiarato, e nessuno in più', () => {
    expect(Object.keys(sheet.glyphs)).toEqual(Object.keys(ICONS))
  })

  it('dà a ognuno una cornice e un corpo che disegna qualcosa', () => {
    for (const [name, glyph] of Object.entries(sheet.glyphs)) {
      expect(glyph.viewBox, name).toMatch(/^0 0 \d+ \d+$/)
      expect(glyph.body.length, name).toBeGreaterThan(10)
    }
  })
})

describe('src/renderer/ui/glyphs.json', () => {
  it('coincide con ciò che la derivazione ritorna', async () => {
    await expect(glyphSheetJson()).toMatchFileSnapshot(`../../${SHEET}`)
  })
})

describe('nessuna icona porta un colore suo', () => {
  for (const [name, glyph] of Object.entries(sheet.glyphs)) {
    it(`${name} dipinge con il colore di chi la ospita`, () => {
      expect(colorsIn(glyph.body)).toEqual([])
    })
  }
})

describe('ogni icona dichiarata ha chi la disegna', () => {
  it('e i componenti da guardare esistono', () => {
    expect(components.length).toBeGreaterThan(2)
  })

  for (const name of Object.keys(ICONS)) {
    it(`${name} compare in almeno un componente`, () => {
      expect(referenced.has(name)).toBe(true)
    })
  }
})
