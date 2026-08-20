import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R15 · D023 · ADR 0028 — nessun colore vive fuori dai token.
 *
 * È la regola che impedisce al design system di scollarsi un pezzo alla volta. L'audit di
 * `D016` ha già trovato il caso: `.refusal` copiata in due pannelli, con il valore di `--danger`
 * **ricopiato a mano** in quattro righe di `rgba()`. Cambiare il token avrebbe spostato il testo e
 * lasciato indietro sfondo e bordo, e nessun gate poteva vederlo. Adesso può.
 *
 * L'eccezione è **una sola e non è configurabile**: `tokens.css`, che è il posto dove i colori
 * devono stare. Un elenco di file esenti diventerebbe una lista da mantenere, cioè la regola che si
 * apre da sola — è la stessa ragione per cui R03 non ha eccezioni di file.
 *
 * `color-mix()` non è un colore letterale e passa: deriva dal token invece di ricopiarlo, ed è
 * esattamente ciò che questa regola vuole al posto di un `rgba()` scritto a mano.
 *
 * ⚠️ **Un limite, dichiarato:** guarda i valori scritti nel sorgente, non un colore assemblato a
 * runtime. Una stringa costruita pezzo per pezzo gli sfugge, come a `no-literal-in-template` sfugge
 * un attributo. Prende la forma con cui il difetto è nato davvero, che è quella copiata a mano.
 */

const TOKENS = 'src/renderer/ui/tokens.css'

/**
 * Un colore scritto per esteso: esadecimale a tre, quattro, sei o otto cifre, oppure una funzione
 * di colore con i suoi canali. `color-mix` e `light-dark` non ci sono di proposito — non portano un
 * valore, lo compongono da altri.
 */
const COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\s*\(/gi

const normalize = (path: string): string => path.split(sep).join('/')

export const colorsIn = (source: string): string[] =>
  (withoutComments(source).match(COLOR) ?? []).map((found) => found.trim())

const sources = [
  ...sourceFiles('src/renderer', ['.ts', '.vue']),
  ...sourceFiles('src/renderer', ['.css'])
]
  .map(normalize)
  .filter((path) => path !== TOKENS)

describe('il rilevatore dei colori', () => {
  it('riconosce un colore scritto a mano', () => {
    expect(colorsIn('color: #f87171;')).toEqual(['#f87171'])
    expect(colorsIn('color: #FFF;')).toEqual(['#FFF'])
    expect(colorsIn('background: rgba(248, 113, 113, 0.1);')).toEqual(['rgba('])
    expect(colorsIn('border-color: hsl(0 84% 71%);')).toEqual(['hsl('])
  })

  it('e lascia passare ciò che dal token deriva invece di ricopiarlo', () => {
    expect(colorsIn('color: var(--color-loss);')).toEqual([])
    expect(colorsIn('background: color-mix(in srgb, var(--color-loss) 10%, transparent);')).toEqual(
      []
    )
    expect(colorsIn('--color-bg: light-dark(var(--a), var(--b));')).toEqual([])
  })

  it('e non inciampa in ciò che colore non è', () => {
    // Un commento che nomina un colore per spiegare la regola non deve renderla rossa: è la stessa
    // difesa che `withoutComments` dà a tutte le regole che cercano una forma vietata.
    expect(colorsIn('/* il vecchio valore era #f87171, e il difetto era quello */')).toEqual([])
    expect(colorsIn("const id = 'income'")).toEqual([])
  })
})

describe('nessun colore vive fuori dai token', () => {
  it('e i file da guardare esistono', () => {
    expect(sources.length).toBeGreaterThan(0)
  })

  for (const path of sources) {
    it(`${path} non scrive un colore`, () => {
      expect(colorsIn(read(path))).toEqual([])
    })
  }
})
