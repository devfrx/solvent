import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { COLOR_ROLES, SURFACES, TEXT_SIZES } from '../../src/renderer/ui/roles'
import { importsOf, read, sourceFiles } from '../helpers/sources'

/**
 * R14 · D023 · ADR 0028 — il kit UI non sa che gioco è.
 *
 * Un livello che non conosce dominio, stato dell'applicazione né parole è riusabile perché non ha
 * nulla **da** cui dipendere. Nel diagramma di `docs/architettura.md` è il primo nodo con sole
 * frecce entranti, e `import-graph` lo verifica nei due versi (C13): questo test guarda la stessa
 * cosa da vicino, e dice **quale** import ha rotto la regola invece di dire che una freccia manca.
 *
 * Il lint dice la stessa cosa per primo — `no-restricted-imports` su `src/renderer/ui/**` — e
 * questo è la rete: la regola vale anche per gli import relativi che escono dalla cartella, che a
 * ESLint sfuggono perché sono percorsi, non pacchetti.
 *
 * La seconda metà è **completezza**, ed è la parte che invecchia da sola se nessuno la guarda: ogni
 * ruolo dichiarato in `roles.ts` deve avere il proprio token in `tokens.css`. `toneVar` costruisce
 * il nome di una variabile CSS da una stringa, e senza questo confronto un ruolo scritto e mai
 * dichiarato darebbe un colore vuoto — invisibile in un tema e sbagliato nell'altro. È la forma del
 * Registry: una lista sola, e un test che la confronta con la realtà.
 */

const KIT = 'src/renderer/ui'
const TOKENS = `${KIT}/tokens.css`

/** Ciò che il kit non può conoscere: il dominio, lo stato, le parole. */
const FORBIDDEN = ['@core/', '@renderer/stores', '@renderer/i18n', '@renderer/runtime']

const normalize = (path: string): string => path.split(sep).join('/')

/**
 * Un import relativo che **esce** dalla cartella del kit. `./roles` va bene, `../stores/game` no —
 * ed è la forma che il lint non vede, perché per ESLint è un percorso e non un pacchetto.
 */
export const escapesKit = (from: string, specifier: string): boolean => {
  if (!specifier.startsWith('.')) return false
  const parts = `${from.split('/').slice(0, -1).join('/')}/${specifier}`.split('/')
  const resolved: string[] = []
  for (const part of parts) {
    if (part === '.' || part === '') continue
    if (part === '..') resolved.pop()
    else resolved.push(part)
  }
  return !resolved.join('/').startsWith(KIT)
}

export const forbiddenIn = (from: string, source: string): string[] =>
  importsOf(source).filter(
    (specifier) =>
      FORBIDDEN.some((banned) => specifier.startsWith(banned)) || escapesKit(from, specifier)
  )

const kitFiles = sourceFiles(KIT).map(normalize)
const tokens = read(TOKENS)

const declared = (name: string): boolean => tokens.includes(`--${name}:`)

describe('il rilevatore degli import del kit', () => {
  it('riconosce ciò che al kit è vietato conoscere', () => {
    const at = `${KIT}/UiPanel.vue`

    expect(forbiddenIn(at, "import { x } from '@core/contracts/money'")).toEqual([
      '@core/contracts/money'
    ])
    expect(forbiddenIn(at, "import { useGame } from '@renderer/stores/game'")).toEqual([
      '@renderer/stores/game'
    ])
    expect(forbiddenIn(at, "import { useTranslator } from '@renderer/i18n'")).toEqual([
      '@renderer/i18n'
    ])

    expect(forbiddenIn(at, "import UiLabel from './UiLabel.vue'")).toEqual([])
    expect(forbiddenIn(at, "import { computed } from 'vue'")).toEqual([])
  })

  it('e prende anche il percorso relativo che scappa dalla cartella, che al lint sfugge', () => {
    const at = `${KIT}/UiPanel.vue`

    expect(escapesKit(at, './roles')).toBe(false)
    expect(escapesKit(at, '../stores/game')).toBe(true)
    expect(escapesKit(at, '../../core/kernel/Ledger')).toBe(true)
    expect(escapesKit(at, 'vue')).toBe(false)
  })
})

describe('il kit UI non sa che gioco è', () => {
  it('e almeno un file esiste: senza, questo file sarebbe verde senza aver guardato niente', () => {
    expect(kitFiles.length).toBeGreaterThan(0)
  })

  for (const path of kitFiles) {
    it(`${path} non importa dominio, stato o parole`, () => {
      expect(forbiddenIn(path, read(path))).toEqual([])
    })
  }
})

/*
 * INV-21 — il kit non sa spegnere un pulsante — **stava qui e adesso sta altrove**.
 *
 * Guardava i file di `ui/`, e bastava finché un `<button>` poteva esistere in qualunque componente
 * senza che nessuno lo sapesse. Da D038 ne esiste uno solo (R26), quindi il controllo può guardare
 * tutti i componenti invece di una cartella — e deve, perché `UiButton` fa ricadere gli attributi
 * del chiamante sul pulsante vero. Vive in `tests/rules/buttons-pass-through-the-kit`, insieme alla
 * regola che lo rende possibile.
 */

describe('ogni ruolo dichiarato ha il suo token', () => {
  it('i colori', () => {
    expect(COLOR_ROLES.filter((role) => !declared(`color-${role}`))).toEqual([])
  })

  it('le misure del testo', () => {
    expect(TEXT_SIZES.filter((size) => !declared(`text-${size}`))).toEqual([])
  })

  it('e le superfici', () => {
    expect(SURFACES.filter((surface) => !declared(`color-${surface}`))).toEqual([])
  })
})
