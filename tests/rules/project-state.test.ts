import { describe, expect, it } from 'vitest'

import { projectStateMarkdown } from '../helpers/projectState'

/**
 * C11 — un fatto contabile ha un posto solo, ed è generato.
 *
 * `docs/stato.md` non si scrive a mano: lo produce `tests/helpers/projectState.ts` leggendo il
 * repo, e questo test pretende che il file versionato coincida con ciò che la derivazione
 * ritorna. Se
 * qualcuno aggiunge un ADR, apre una delega o sposta un file, il gate diventa rosso finché il
 * documento non torna a dire il vero.
 *
 * Non è «i documenti sono aggiornati», che è una speranza: è la stessa forma del Registry contro
 * le cinque liste (A01) e di `previewOf` contro le due formule della commissione (INV-11). Non si
 * controlla che due cose coincidano — si fa in modo che ce ne sia una sola.
 *
 * Per rigenerarlo: `npx vitest run tests/rules/project-state -u`.
 */

const state = projectStateMarkdown()

describe('la derivazione', () => {
  it('produce qualcosa, altrimenti il confronto sarebbe verde sul vuoto', () => {
    expect(state.length).toBeGreaterThan(500)
  })

  it('conta gli ADR e li divide per stato, senza perderne nessuno', () => {
    const total = /\*\*(\d+)\*\* ADR: (\d+) `Accettata`, (\d+) `Proposta`, (\d+) `Superata`/.exec(
      state
    )

    expect(total).not.toBeNull()
    const [, all, accepted, proposed, superseded] = (total ?? []).map(Number)
    expect(Number(accepted) + Number(proposed) + Number(superseded)).toBe(Number(all))
    expect(Number(all)).toBeGreaterThan(20)
  })

  it('conta le deleghe e le divide per stato, senza perderne nessuna', () => {
    const total = /\*\*(\d+)\*\* deleghe: (\d+) `Chiusa`, (\d+) `In corso`, (\d+) `Aperta`/.exec(
      state
    )

    expect(total).not.toBeNull()
    const [, all, closed, running, open] = (total ?? []).map(Number)
    expect(Number(closed) + Number(running) + Number(open)).toBe(Number(all))
    expect(Number(all)).toBeGreaterThan(20)
  })

  it('elenca gli ADR `Proposta` per numero, non solo quanti sono', () => {
    expect(state).toMatch(/- `Proposta`: \d{4}(, \d{4})*/)
  })

  it('nessuna riga di tabella resta fuori dalla sua tabella (C12 su ciò che genera)', () => {
    const rows = state.split('\n').filter((line) => line.startsWith('|'))

    expect(rows.length).toBeGreaterThan(2)
    expect(rows[1]).toMatch(/^\|[\s:|-]+\|$/)
  })
})

describe('docs/stato.md', () => {
  it('coincide con ciò che il repo dice di sé', async () => {
    await expect(state).toMatchFileSnapshot('../../docs/stato.md')
  })
})
