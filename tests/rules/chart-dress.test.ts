import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R23 · ADR 0034 — il vestito della libreria di grafici vive in un file solo.
 *
 * L'[ADR 0034](../../docs/adr/0034-il-grafico-e-una-libreria.md) ha fatto entrare ApexCharts
 * dichiarandone il prezzo: «quelle classi non sono nostre, e un aggiornamento della libreria può
 * spostarle. **Nessun gate lo vedrebbe** — `no-color-literals` guarda il nostro sorgente, non il
 * DOM che una libreria produce». Finché il grafico era uno solo, il prezzo era una riga di ADR.
 * Con [D034](../../docs/delega/D034-le-serie-degli-strumenti.md) i grafici sono diventati due, e
 * il vestito è stato ricopiato: due blocchi `:deep()` che bersagliano le stesse classi altrui,
 * indistinguibili da un gate perché **entrambi** usavano i token, quindi R15 li lasciava passare
 * tutti e due.
 *
 * È la forma esatta del difetto che l'audit di [D016](../../docs/delega/D016-correzioni-audit.md)
 * trovò mesi dopo con `.refusal`, e non è rimasta un'ipotesi: le due copie **avevano già
 * cominciato a divergere** — la bolla del secondo grafico era diventata una griglia e la prima no —
 * nella stessa delega che le ha create.
 *
 * **La regola è esatta e non parziale**, e lo è per una scelta di forma: la bolla scritta a mano
 * del grafico a candele porta una classe **nostra**, quindi vestirla non richiede di nominare una
 * classe della libreria. Senza quella scelta il massimo onesto sarebbe stato un test ⚠️ parziale,
 * perché un componente avrebbe continuato a tenersi qualche selettore suo.
 *
 * ⚠️ **Un limite, dichiarato:** guarda i **nomi delle classi scritti nel sorgente**. Un selettore
 * costruito pezzo per pezzo a runtime le sfugge, come sfugge a `no-color-literals` un colore
 * assemblato. Prende la forma con cui il difetto è nato davvero, che è quella ricopiata a mano.
 */

/** L'unico file che ha il diritto di nominare le classi della libreria. */
const DRESSER = 'src/renderer/components/shell/ChartPanel.vue'

/**
 * Il prefisso con cui ApexCharts nomina **ogni** classe del proprio DOM. Il trattino finale è ciò
 * che distingue una classe dal nome del pacchetto: `import ApexCharts from 'apexcharts'` non è un
 * vestito, e un componente che monta la libreria deve poterla importare.
 */
const LIBRARY_CLASS = /apexcharts-[a-z-]+/g

const normalize = (path: string): string => path.split(sep).join('/')

export const libraryClassesIn = (source: string): string[] =>
  withoutComments(source).match(LIBRARY_CLASS) ?? []

const sources = [...sourceFiles('src', ['.ts', '.vue']), ...sourceFiles('src', ['.css'])]
  .map(normalize)
  .filter((path) => path !== DRESSER)

describe('il rilevatore del vestito', () => {
  it('riconosce un selettore che bersaglia una classe della libreria', () => {
    expect(libraryClassesIn(':deep(.apexcharts-tooltip) {\n  color: var(--color-ink);\n}')).toEqual(
      ['apexcharts-tooltip']
    )
    expect(
      libraryClassesIn(':deep(.apexcharts-yaxis text) {\n  fill: var(--color-ink-3);\n}')
    ).toEqual(['apexcharts-yaxis'])
  })

  it("lascia passare l'import della libreria, che non è un vestito", () => {
    expect(libraryClassesIn(`import ApexCharts from 'apexcharts'`)).toEqual([])
    expect(libraryClassesIn(`const wrapper = 'vue3-apexcharts'`)).toEqual([])
  })

  it('e non rende rosso il commento che spiega la regola', () => {
    // È la stessa difesa che `withoutComments` dà a `no-color-literals`: una regola deve poter
    // nominare ciò che vieta, o non può spiegare se stessa.
    expect(libraryClassesIn('/* il vestito di .apexcharts-tooltip sta altrove */')).toEqual([])
  })
})

describe('il vestito della libreria di grafici vive in un file solo', () => {
  it('e i file da guardare esistono', () => {
    expect(sources.length).toBeGreaterThan(0)
  })

  it('e il file che lo tiene lo tiene davvero', () => {
    // Senza questa riga la regola passerebbe anche il giorno in cui il vestito sparisce del tutto,
    // che è un modo di essere verdi senza voler dire niente.
    expect(libraryClassesIn(read(DRESSER)).length).toBeGreaterThan(0)
  })

  for (const path of sources) {
    it(`${path} non nomina una classe della libreria`, () => {
      expect(libraryClassesIn(read(path))).toEqual([])
    })
  }
})
