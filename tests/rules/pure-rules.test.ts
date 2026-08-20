import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R13 — un file `rules.ts` contiene **solo** funzioni pure.
 *
 * Nessun accesso al contesto, nessun `ctx` fra i parametri, nessun effetto, nessuna lettura
 * dell'ora: tutto ciò che serve arriva per argomento e ritorna nel valore
 * ([convenzioni.md](../../docs/convenzioni.md)). È il confine che rende un dominio provabile con un
 * seme fisso e senza impalcature, ed è ciò che permette a `incomeOver` di essere chiamata da un
 * test di bilanciamento, dalla UI e dal sistema con la stessa facilità.
 *
 * Fino a [D022](../../docs/delega/D022-il-confine-disegnato-e-il-confine-vero.md) era **l'unica
 * regola scritta del progetto senza un ID e senza una riga in
 * [tracciabilita.md](../../docs/tracciabilita.md)**: la teneva la review, su due file. Il registro
 * YAGNI ne fissava il grilletto al terzo `rules.ts`, che nasce con
 * [D017](../../docs/delega/D017-il-caveau.md) — cioè dentro la delega che il meccanismo dovrebbe
 * sorvegliare, che è lo schema che D001 e D020 hanno già respinto due volte.
 *
 * ⚠️ **Parziale, e lo dichiara.** Cerca le forme in cui l'impurità entra davvero; non dimostra la
 * purezza, che richiederebbe l'analisi del flusso. Una funzione che muta un array ricevuto per
 * argomento gli sfugge. È lo stesso patto di `english-identifiers` e `no-literal-in-template`.
 */

/** Le forme che rendono impura una regola, ognuna con il motivo per cui è vietata. */
const IMPURITIES: readonly (readonly [RegExp, string])[] = [
  [/\bctx\b/, 'prende o usa il contesto'],
  [/\bSystemContext\b/, 'nomina il contesto'],
  [/\bDate\s*\.\s*now\b/, "legge l'ora"],
  [/\bperformance\s*\.\s*now\b/, "legge l'ora"],
  [/\bMath\s*\.\s*random\b/, 'estrae un numero a caso (R03)'],
  [/\.\s*emit\s*\(/, 'emette un evento'],
  [/\.\s*transaction\s*\(/, 'muove denaro'],
  [
    /^import\s+\{[^}]*\}\s+from\s+'@core\/kernel\/(?:Bus|Ledger|Registry)'/m,
    'importa un modulo del kernel che ha effetti'
  ]
]

const normalize = (path: string): string => path.split(sep).join('/')

const rules = sourceFiles('src/core/domains', ['.ts'])
  .map(normalize)
  .filter((path) => path.endsWith('/rules.ts'))

/** Le impurità di un sorgente, spiegate. I commenti non si guardano: un `rules.ts` spiega perché è puro. */
export const impuritiesIn = (source: string): string[] => {
  const code = withoutComments(source)
  return IMPURITIES.filter(([pattern]) => pattern.test(code)).map(([, why]) => why)
}

describe('il rilevatore', () => {
  it('prende un contesto fra i parametri, comunque sia scritto', () => {
    expect(impuritiesIn('export const f = (ctx: X): number => 1')).toContain(
      'prende o usa il contesto'
    )
    expect(impuritiesIn('const g = (c: SystemContext): void => {}')).toContain('nomina il contesto')
  })

  it("prende la lettura dell'ora e la casualità", () => {
    expect(impuritiesIn('const t = Date.now()')).toContain("legge l'ora")
    expect(impuritiesIn('const r = Math.random()')).toContain('estrae un numero a caso (R03)')
  })

  it('prende un effetto: emettere un evento o muovere denaro', () => {
    expect(impuritiesIn('bus.emit("money.posted", p)')).toContain('emette un evento')
    expect(impuritiesIn('ledger.transaction(postings, meta)')).toContain('muove denaro')
  })

  it('prende un import di valore dal kernel che ha effetti', () => {
    expect(impuritiesIn("import { createBus } from '@core/kernel/Bus'\n")).toContain(
      'importa un modulo del kernel che ha effetti'
    )
  })

  it('lascia passare un import di soli tipi, che non porta dentro niente', () => {
    expect(impuritiesIn("import type { Clock, Ticks } from '@core/kernel/Clock'\n")).toEqual([])
  })

  it('non guarda i commenti, o il file che spiega la regola sarebbe il primo a violarla', () => {
    expect(
      impuritiesIn('// nessun ctx fra i parametri, e nessun Date.now()\nexport const f = 1')
    ).toEqual([])
  })
})

describe('i file rules.ts', () => {
  it('ce ne sono da guardare, altrimenti questo test non guarda niente', () => {
    expect(rules.length).toBeGreaterThan(1)
  })

  it('sono tutti puri', () => {
    const offenders = rules.flatMap((path) =>
      impuritiesIn(read(path)).map((why) => `${path}: ${why}`)
    )

    expect(offenders).toEqual([])
  })
})
