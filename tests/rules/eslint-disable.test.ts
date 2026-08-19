import { describe, expect, it } from 'vitest'

import { fileSorgente, leggi } from '../helpers/sorgenti'

/**
 * C06 — un `eslint-disable` senza motivazione non esiste.
 *
 * Le [convenzioni](../../docs/convenzioni.md) non vietano di spegnere una regola: vietarlo produce
 * aggiramenti peggiori, tipo riscrivere il codice in una forma che il lint non riconosce. Vietano
 * di spegnerla **in silenzio**. Finora era una riga di review, cioè una speranza; da D004 — che è
 * la prima delega a usarne uno davvero — è un test.
 */

const DISABILITAZIONE = /eslint-disable/
const MOTIVAZIONE = / -- \S/

const righeSenzaMotivo = (sorgente: string): string[] =>
  sorgente.split('\n').filter((riga) => DISABILITAZIONE.test(riga) && !MOTIVAZIONE.test(riga))

const sorgenti = fileSorgente('src')

describe('ogni eslint-disable porta la sua motivazione', () => {
  it('il rilevatore distingue la forma ammessa da quella muta', () => {
    expect(righeSenzaMotivo('// eslint-disable-next-line no-console -- ADR 0005')).toEqual([])
    expect(righeSenzaMotivo('// eslint-disable-next-line no-console')).toHaveLength(1)
    expect(righeSenzaMotivo('const a = 1')).toEqual([])
  })

  it('in src/ non ce n’è nemmeno uno muto', () => {
    const mute = sorgenti.flatMap((f) => righeSenzaMotivo(leggi(f)).map((riga) => `${f}: ${riga}`))
    expect(mute).toEqual([])
  })
})
