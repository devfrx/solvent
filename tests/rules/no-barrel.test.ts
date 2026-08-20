import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * C10 — in `src/` non esiste un file che si limiti a ri-esportare.
 *
 * Un barrel nasconde le dipendenze reali: da `import { x } from '@core/kernel'` non si vede quale
 * modulo si sta tirando dentro, e con esso sparisce metà del valore di `import-x/order` e delle
 * `no-restricted-imports` che governano i confini (docs/architettura.md). È il motivo per cui
 * [convenzioni.md](../../docs/convenzioni.md) lo vieta.
 *
 * Fino a questa delega il divieto aveva un'eccezione — `core/kernel/index.ts` — descritta da due
 * documenti vivi e mai esistita: un permesso che puntava al vuoto, e che chiunque avrebbe potuto
 * riempire «per allinearsi al documento». L'audit del 2026-08-20 l'ha trovata, e la regola è
 * diventata quella senza eccezioni, che è anche l'unica meccanizzabile.
 *
 * Il controllo guarda **cosa c'è dentro**, non come si chiama il file: `index.ts` è un nome
 * legittimo per un punto d'ingresso — `main/index.ts`, `preload/index.ts` e `i18n/index.ts` hanno
 * tutti del contenuto vero — e vietare il nome invece della forma prenderebbe loro e lascerebbe
 * passare un `kernel/all.ts`.
 */

/**
 * Un `export … from '…'`, nelle sue forme: `*`, `* as nome`, `{ … }`, con o senza `type`. La
 * classe di caratteri elenca le virgolette, quindi si costruisce da una stringa: un `/regex/`
 * letterale con dentro un apice manda fuori fase la scansione di `english-identifiers`, che lo
 * dichiara fra i propri limiti.
 */
const QUOTE = '[\'"`]'
const RE_EXPORT = new RegExp(
  `export\\s+(?:type\\s+)?(?:\\*(?:\\s+as\\s+\\w+)?|\\{[^}]*\\})\\s*from\\s*${QUOTE}[^\\s]*?${QUOTE};?`,
  'g'
)

/** Un file è un barrel se, tolti i commenti, non resta niente oltre ai ri-export. */
const isBarrel = (source: string): boolean => {
  const code = withoutComments(source).trim()
  return code !== '' && code.replace(RE_EXPORT, '').trim() === ''
}

const normalize = (path: string): string => path.split(sep).join('/')

const sources = sourceFiles('src').map(normalize)

describe('il rilevatore', () => {
  it('prende un file che ri-esporta e basta, in tutte le forme', () => {
    expect(isBarrel(`export * from './Bus'\n`)).toBe(true)
    expect(isBarrel(`export * as bus from './Bus'\n`)).toBe(true)
    expect(isBarrel(`export { createBus } from './Bus'\nexport { clock } from './Clock'\n`)).toBe(
      true
    )
    expect(isBarrel(`export type { Bus } from './Bus'\n`)).toBe(true)
  })

  it('prende anche il ri-export scritto su più righe', () => {
    expect(isBarrel(`export {\n  createBus,\n  type Bus\n} from './Bus'\n`)).toBe(true)
  })

  it('non prende un file che ha del contenuto suo', () => {
    expect(isBarrel(`export const TICKS_PER_SECOND = 10\n`)).toBe(false)
    expect(isBarrel(`export { createBus } from './Bus'\nexport const MAX = 8\n`)).toBe(false)
    expect(isBarrel(`import { x } from './x'\n\nexport const y = x\n`)).toBe(false)
  })

  it('non guarda i commenti, altrimenti un barrel commentato sfuggirebbe', () => {
    expect(isBarrel(`/** il kernel */\nexport * from './Bus'\n`)).toBe(true)
  })

  it('un file vuoto non è un barrel: è un file vuoto', () => {
    expect(isBarrel('')).toBe(false)
    expect(isBarrel('/** niente qui */\n')).toBe(false)
  })
})

describe('i file di src/', () => {
  it('ce ne sono da guardare, altrimenti questo test non guarda niente', () => {
    expect(sources.length).toBeGreaterThan(30)
  })

  it('nessuno è un barrel', () => {
    const offenders = sources.filter((file) => isBarrel(read(file)))

    expect(offenders).toEqual([])
  })
})
