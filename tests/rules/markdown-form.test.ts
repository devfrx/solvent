import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles } from '../helpers/sources'

/**
 * C12 — nessuna riga di tabella vive fuori da una tabella.
 *
 * Una riga che comincia con `|` e che non sta dentro una tabella non è un errore per nessuno:
 * Prettier la legge come prosa e quindi la lascia stare — anzi, il gate verde è la prova che la
 * legge così — e `tests/rules/doc-links` guarda i collegamenti, non la forma. Il risultato è una
 * riga resa con le barre verticali in mezzo al testo, invisibile nella tabella dove chi legge la
 * cercherebbe.
 *
 * L'audit del 2026-08-20 ne ha trovata una, ed era una voce del registro YAGNI:
 * `docs/roadmap-fette.md` aveva una tabella spezzata in due da un paragrafo inserito fra le sue
 * ultime righe (AUD-007, [D021](../../docs/delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md)).
 *
 * Il controllo guarda **i blocchi**, non le righe singole: una riga di tabella non è mai sola, e a
 * dire che un blocco è una tabella è la sua riga di separazione.
 */

/** L'apertura o la chiusura di un blocco recintato. Dentro, le barre verticali sono codice. */
const FENCE = /^\s*(?:```|~~~)/

/** La riga di separazione: solo barre, trattini, due punti e spazi. È ciò che fa di un blocco una tabella. */
const SEPARATOR = /^\|[\s:|-]+\|$/

/**
 * Una riga di tabella comincia con `|` e ha al massimo tre spazi davanti. Il quarto la trasforma in
 * un blocco di codice indentato, che è la forma in cui questo progetto scrive le unioni di
 * TypeScript nelle deleghe — dove `|` separa i casi e non le colonne. Senza questo limite il
 * rilevatore segnalerebbe [D009](../../docs/delega/D009-persistenza-main.md) e
 * [D014](../../docs/delega/D014-dominio-bancomat.md), che sono corretti.
 */
const isRow = (line: string): boolean => /^ {0,3}\|/.test(line)

/**
 * Le righe che cominciano con `|` e non appartengono a nessuna tabella, numerate da 1.
 *
 * Un blocco è l'insieme delle righe consecutive che cominciano con `|`. Se contiene una riga di
 * separazione è una tabella; altrimenti ogni sua riga è orfana — che prende sia il caso di questo
 * audit, una riga sola dopo un paragrafo, sia quello di una tabella a cui è stata tolta
 * l'intestazione.
 */
export const orphanRows = (markdown: string): number[] => {
  const lines = markdown.split('\n')
  const orphans: number[] = []

  let fenced = false
  let block: number[] = []

  const close = (): void => {
    if (block.length > 0 && !block.some((index) => SEPARATOR.test(lines[index]?.trim() ?? ''))) {
      orphans.push(...block.map((index) => index + 1))
    }
    block = []
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''

    if (FENCE.test(line)) {
      close()
      fenced = !fenced
      continue
    }
    if (fenced) continue

    if (isRow(line)) block.push(index)
    else close()
  }
  close()

  return orphans
}

const normalize = (path: string): string => path.split(sep).join('/')

const documents = [...sourceFiles('docs', ['.md']), 'README.md'].map(normalize)

describe('il rilevatore', () => {
  it('prende una riga di tabella rimasta sola dopo un paragrafo', () => {
    const broken = [
      'Una frase che chiude il discorso.',
      '| Una voce | il suo grilletto |',
      ''
    ].join('\n')

    expect(orphanRows(broken)).toEqual([2])
  })

  it('non tocca una tabella vera, intestazione e righe', () => {
    const table = ['| Cosa | Quando |', '| ---- | ------ |', '| una  | adesso |', ''].join('\n')

    expect(orphanRows(table)).toEqual([])
  })

  it('prende una tabella a cui manca la riga di separazione', () => {
    const headless = ['| Cosa | Quando |', '| una  | adesso |', ''].join('\n')

    expect(orphanRows(headless)).toEqual([1, 2])
  })

  it('non guarda dentro un blocco recintato, dove le barre sono codice', () => {
    const fenced = ['```bash', 'grep -c foo | wc -l', '| non è una tabella |', '```', ''].join('\n')

    expect(orphanRows(fenced)).toEqual([])
  })

  it('non guarda un blocco di codice indentato, dove `|` separa i casi di un tipo', () => {
    const union = [
      'Il dominio ne dichiara tre.',
      '',
      '    export type AtmError =',
      '      | LedgerError',
      "      | { readonly code: 'error.atm.amount_not_positive' }",
      ''
    ].join('\n')

    expect(orphanRows(union)).toEqual([])
  })

  it('due tabelle separate da prosa restano due tabelle', () => {
    const two = [
      '| A   | B   |',
      '| --- | --- |',
      '| 1   | 2   |',
      '',
      'In mezzo una frase.',
      '',
      '| C   | D   |',
      '| --- | --- |',
      '| 3   | 4   |',
      ''
    ].join('\n')

    expect(orphanRows(two)).toEqual([])
  })
})

describe('i documenti', () => {
  it('ce ne sono da guardare, altrimenti questo test non guarda niente', () => {
    expect(documents.length).toBeGreaterThan(50)
  })

  it('nessuno ha una riga di tabella fuori da una tabella', () => {
    const offenders = documents.flatMap((document) =>
      orphanRows(read(document)).map((line) => `${document}:${String(line)}`)
    )

    expect(offenders).toEqual([])
  })
})
