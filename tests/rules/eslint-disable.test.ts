import { describe, expect, it } from 'vitest'

import { read, sourceFiles } from '../helpers/sources'

/**
 * C06 — un `eslint-disable` senza motivazione non esiste.
 *
 * Le [convenzioni](../../docs/convenzioni.md) non vietano di spegnere una regola: vietarlo produce
 * aggiramenti peggiori, tipo riscrivere il codice in una forma che il lint non riconosce. Vietano
 * di spegnerla **in silenzio**. Finora era una riga di review, cioè una speranza; da D004 — che è
 * la prima delega a usarne uno davvero — è un test.
 */

const DISABLE = /eslint-disable/
const REASON = / -- \S/

const linesWithoutReason = (source: string): string[] =>
  source.split('\n').filter((line) => DISABLE.test(line) && !REASON.test(line))

// D039 — anche `scripts/`: una regola spenta in silenzio lo e' ovunque, non solo in `src/`.
const sources = [...sourceFiles('src'), ...sourceFiles('scripts', ['.mjs'])]

describe('ogni eslint-disable porta la sua motivazione', () => {
  it('il rilevatore distingue la forma ammessa da quella muta', () => {
    expect(linesWithoutReason('// eslint-disable-next-line no-console -- ADR 0005')).toEqual([])
    expect(linesWithoutReason('// eslint-disable-next-line no-console')).toHaveLength(1)
    expect(linesWithoutReason('const a = 1')).toEqual([])
  })

  it('in src/ non ce n’è nemmeno uno muto', () => {
    const silent = sources.flatMap((f) =>
      linesWithoutReason(read(f)).map((line) => `${f}: ${line}`)
    )
    expect(silent).toEqual([])
  })
})
