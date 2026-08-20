import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { COLOR_ROLES, SURFACES, TEXT_SIZES } from '../../src/renderer/ui/roles'
import { importsOf, read, sourceFiles, withoutComments } from '../helpers/sources'

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

/** `disabled` o `:disabled` come **attributo**, non la parola dentro un commento o una classe. */
export const disablesIn = (source: string): string[] =>
  (withoutComments(source).match(/(?<=[\s(]):?disabled(?=[\s=>])/g) ?? []).map((f) => f.trim())

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

/**
 * INV-21 — il kit non sa spegnere un pulsante.
 *
 * Nella prima stesura questo era 🔒, imposto dal tipo: `UiButton` non aveva `disabled` fra le
 * proprietà. Non bastava, e a scoprirlo è stata la migrazione: il componente **scriveva**
 * `:disabled` sul pulsante quando arrivava una ragione, e nessun tipo lo vedeva. Una proprietà che
 * non esiste nell'API non impedisce all'attributo di esistere nel template — sono due cose, e solo
 * la seconda è quella che il giocatore vede.
 */
describe('nessun pulsante del kit si spegne', () => {
  it('il rilevatore trova l’attributo, non la parola', () => {
    expect(disablesIn('<button :disabled="refused">')).toEqual([':disabled'])
    expect(disablesIn('<button disabled>')).toEqual(['disabled'])
    expect(disablesIn('// un pulsante spento è un rifiuto senza motivo')).toEqual([])
    expect(disablesIn('.muted { opacity: 0.5 }')).toEqual([])
  })

  for (const path of kitFiles) {
    it(`${path} non spegne niente`, () => {
      expect(disablesIn(read(path))).toEqual([])
    })
  }
})

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
