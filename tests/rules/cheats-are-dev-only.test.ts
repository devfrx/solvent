import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { installCheats } from '../../src/renderer/runtime/cheats'
import { createGame } from '../../src/renderer/runtime/createGame'
import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R20 · ADR 0036 — i cheat esistono solo in sviluppo, e la regola che lo rende vero non è una
 * guardia: è **chi può nominarli**.
 *
 * Un `if (dev)` sparso in dieci file è una difesa che tiene finché qualcuno non ne dimentica uno, e
 * quel qualcuno non se ne accorge perché in sviluppo funziona tutto. La difesa vera è che i moduli
 * dei cheat siano raggiungibili da **un solo ramo**, che il compilatore sa spegnere: se nessuno li
 * nomina fuori da lì, spegnere il ramo li toglie dal pacchetto insieme a tutto ciò che portano.
 *
 * Questo test guarda la **forma**, non i byte. A guardare i byte è la misura di `npm run build` in
 * fondo a D029, che si rifà quando si tocca il bundler — un test che eseguisse una compilazione
 * dentro `verify` costerebbe più dei quattro gate messi insieme, ed è dichiarato invece che
 * nascosto.
 */

const normalize = (path: string): string => path.split(sep).join('/')

/** I moduli che esistono per i cheat: nominarli è ciò che questa regola razionalizza. */
const CHEAT_MODULES = [
  'kernel/Cheats',
  'kernel/LedgerCheats',
  'domains/vault/cheats',
  'domains/income/cheats',
  'runtime/cheats',
  'components/dev/'
]

/**
 * Chi può nominarli, e perché ciascuno.
 *
 * `main.ts` tiene l'interruttore; `App.vue` monta il pannello dietro lo stesso interruttore;
 * `runtime/cheats.ts` è il posto che li mette insieme; i tre file che li dichiarano si nominano fra
 * loro; il pannello li disegna. **Lo store non è in questa lista**, ed è la voce che vale: riceve
 * l'oggetto già costruito e ne importa il solo **tipo**, che sparisce a compilazione.
 */
const MAY_NAME_THEM = [
  'src/renderer/main.ts',
  'src/renderer/App.vue',
  'src/renderer/runtime/cheats.ts',
  'src/core/kernel/Cheats.ts',
  'src/core/kernel/LedgerCheats.ts',
  'src/core/domains/vault/cheats.ts',
  'src/core/domains/income/cheats.ts',
  'src/renderer/components/dev/'
]

const sources = sourceFiles('src').map(normalize)

/**
 * Gli import di **valore** di un sorgente: quelli che sopravvivono alla compilazione e tengono in
 * vita il modulo. `import type { X } from` e `import { type X } from` non ci sono, e la differenza
 * è tutto — lo store nomina `Cheats` e non lo tiene in vita, mentre chiunque ne importi una
 * funzione sì. Una prima stesura di questo test guardava la riga invece dell'istruzione, e non
 * vedeva un import di valore accanto a uno di tipo dallo stesso modulo.
 */
const valueImportsOf = (source: string): string[] => {
  const statement = /(?:^|\n)\s*import\s+([\s\S]*?)\s+from\s*['"]([^'"]+)['"]/g
  const found: string[] = []

  for (const match of source.matchAll(statement)) {
    const clause = (match[1] ?? '').trim()
    const specifier = match[2] ?? ''
    if (clause.startsWith('type ')) continue

    const braced = /\{([\s\S]*)\}/.exec(clause)
    const outside = clause
      .replace(/\{[\s\S]*\}/, '')
      .replace(/,/g, '')
      .trim()
    const bindings = (braced?.[1] ?? '')
      .split(',')
      .map((binding) => binding.trim())
      .filter((binding) => binding.length > 0)

    if (braced !== null && outside.length === 0 && bindings.every((b) => b.startsWith('type '))) {
      continue
    }
    found.push(specifier)
  }

  return found
}

const namesACheatModule = (path: string): boolean =>
  valueImportsOf(withoutComments(read(path))).some((specifier) =>
    CHEAT_MODULES.some((module) => specifier.includes(module))
  )

const mayNameThem = (path: string): boolean =>
  MAY_NAME_THEM.some((allowed) => path === allowed || path.startsWith(allowed))

describe('i cheat sono raggiungibili solo dallo sviluppo', () => {
  it('c’è qualcosa da guardare', () => {
    expect(sources.length).toBeGreaterThan(0)
    expect(sources).toContain('src/renderer/runtime/cheats.ts')
  })

  it('nessun file li nomina fuori dai posti dichiarati', () => {
    expect(sources.filter((path) => namesACheatModule(path) && !mayNameThem(path))).toEqual([])
  })

  it('l’interruttore è uno solo, ed è `import.meta.env.DEV`', () => {
    // Non «ce n'è almeno uno»: **quali** file lo leggono. Il giorno in cui un terzo file chiedesse
    // se siamo in sviluppo, la domanda avrebbe due risposte da tenere allineate — che è la forma
    // con cui tornano i difetti di questo progetto.
    const asking = sources.filter((path) => withoutComments(read(path)).includes('import.meta.env'))

    expect(asking.sort()).toEqual(['src/renderer/App.vue', 'src/renderer/main.ts'])
  })

  it('ogni cheat dichiarato è anche registrato, e nessuno di più', () => {
    // La stessa domanda di `registry-completeness`, sull'altro registro: un `CheatId` che nessuno
    // registra è un pulsante che non esiste, e un cheat registrato con un id non dichiarato non
    // compila. Le due metà insieme fanno l'elenco chiuso.
    //
    // L'elenco atteso si rilegge dal **sorgente** dell'unione, non si ricopia qui: ricopiarlo
    // sarebbe la seconda lista, cioè esattamente ciò contro cui il registro esiste.
    const union = read('src/core/contracts/cheats.ts')
    const declared = [...withoutComments(union).matchAll(/'(cheat\.[a-z0-9_.]+)'/g)]
      .map((match) => match[1] ?? '')
      .sort()

    const registered = installCheats(createGame())
      .all()
      .map((cheat) => cheat.id)
      .sort()

    expect(declared.length).toBeGreaterThan(0)
    expect(registered).toEqual(declared)
  })
})
