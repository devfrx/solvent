import { readFileSync } from 'node:fs'

import { ICON_SET, ICONS } from '../../src/renderer/ui/icons'

/**
 * La derivazione di `src/renderer/ui/glyphs.json`: prende i nomi dichiarati in `icons.ts` e ne
 * estrae i tracciati dall'insieme di Iconify installato.
 *
 * **Perché un file generato e non l'insieme importato.** `@iconify-json/lucide` porta 1.844 icone
 * in 554 kB di JSON, e il gioco ne disegna due: importarlo così com'è metterebbe nel pacchetto
 * mezzo megabyte che nessuno guarda, che è il difetto **A14** — 1.067 righe di CSS morto — con
 * un'altra estensione. Un JSON annidato non si sfronda da solo: chi lo importa se lo porta intero.
 *
 * **Perché generato invece che copiato a mano.** Un tracciato copiato è un tracciato che nessuno
 * sa più da dove viene, e cambiare insieme tornerebbe a essere un lavoro di copiatura. Così
 * cambiare insieme è cambiare `ICON_SET`, e il gate dice se il nome esiste davvero là dentro.
 *
 * È la forma di `projectState.ts`, applicata a un sorgente invece che a un documento: non si
 * controlla che due cose coincidano — si fa in modo che ce ne sia una sola, e la seconda la
 * riscriva la macchina (`npx vitest run tests/rules/icons -u`).
 *
 * Qui non si giudica niente e non si sceglie niente: si estrae. Quali icone servano, e come si
 * chiamino da noi, sta in `icons.ts`, che lo scrivono le persone.
 */

/** Un'icona come Iconify la scrive: il corpo, e le misure solo se differiscono da quelle dell'insieme. */
interface RawIcon {
  readonly body: string
  readonly width?: number
  readonly height?: number
  readonly rotate?: number
  readonly hFlip?: boolean
  readonly vFlip?: boolean
}

/** Un rimando: un nome che ne indica un altro, eventualmente girandolo. */
interface RawAlias {
  readonly parent: string
  readonly rotate?: number
  readonly hFlip?: boolean
  readonly vFlip?: boolean
}

interface RawSet {
  readonly prefix: string
  readonly width?: number
  readonly height?: number
  readonly icons: Readonly<Record<string, RawIcon>>
  readonly aliases?: Readonly<Record<string, RawAlias>>
}

/** Il glifo come lo vuole il kit: una cornice e un corpo, e niente altro da sapere. */
export interface Glyph {
  readonly viewBox: string
  readonly body: string
}

export interface GlyphSheet {
  readonly set: string
  readonly glyphs: Readonly<Record<string, Glyph>>
}

/**
 * I messaggi degli errori lanciati sono in italiano (C08) e stanno in stringhe invece che dentro un
 * template: il rilevatore di `english-identifiers` legge dentro i template literal e non distingue
 * una parola italiana di prosa da un identificatore. Stessa difesa di `projectState.ts`.
 */
const NO_SET = 'icone — insieme non installato: '
const NO_ICON = 'icone — nome assente dall’insieme: '
const NO_SIZE = 'icone — l’insieme non dichiara una misura per: '
const TRANSFORMED = 'icone — questo nome è un rimando girato, e la rotazione non è supportata: '

/**
 * Dove Iconify tiene i dati. Il percorso si compone dal prefisso invece di essere scritto: è ciò
 * che rende `ICON_SET` la sola riga da cambiare per cambiare insieme.
 */
const setPath = (prefix: string): string => `node_modules/@iconify-json/${prefix}/icons.json`

const loadSet = (prefix: string): RawSet => {
  try {
    return JSON.parse(readFileSync(setPath(prefix), 'utf8')) as RawSet
  } catch {
    throw new Error(NO_SET + prefix)
  }
}

/**
 * Un rimando si segue fino all'icona vera. Le rotazioni e i ribaltamenti si **rifiutano** invece di
 * essere ignorati: applicarli vorrebbe dire scrivere una matrice dentro il corpo, e ignorarli
 * darebbe un'icona girata dalla parte sbagliata senza che nessuno lo veda. Il rimedio è scegliere
 * il nome dritto, che in un insieme serio esiste sempre.
 */
const resolve = (set: RawSet, name: string): RawIcon => {
  const direct = set.icons[name]
  if (direct !== undefined) return direct

  const alias = set.aliases?.[name]
  if (alias === undefined) throw new Error(NO_ICON + name)
  if (alias.rotate !== undefined || alias.hFlip === true || alias.vFlip === true) {
    throw new Error(TRANSFORMED + name)
  }
  return resolve(set, alias.parent)
}

export const glyphSheet = (): GlyphSheet => {
  const set = loadSet(ICON_SET)
  const glyphs: Record<string, Glyph> = {}

  for (const [ours, theirs] of Object.entries(ICONS)) {
    const icon = resolve(set, theirs)
    if (icon.rotate !== undefined || icon.hFlip === true || icon.vFlip === true) {
      throw new Error(TRANSFORMED + theirs)
    }

    const width = icon.width ?? set.width
    const height = icon.height ?? set.height
    if (width === undefined || height === undefined) throw new Error(NO_SIZE + theirs)

    glyphs[ours] = { viewBox: `0 0 ${width} ${height}`, body: icon.body }
  }

  return { set: ICON_SET, glyphs }
}

/**
 * Il testo del file, già come Prettier lo scriverebbe: due spazi di rientro e un a capo finale.
 * Se divergesse, `format:check` sarebbe rosso subito dopo la rigenerazione — e un generatore che
 * produce un file che il gate rifiuta è un generatore che nessuno userà.
 */
export const glyphSheetJson = (): string => `${JSON.stringify(glyphSheet(), null, 2)}\n`
