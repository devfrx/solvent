import { describe, expect, it } from 'vitest'

import { err, ok, type Result } from '@core/contracts/result'

/**
 * R10 · ADR 0007 — un solo stile di esito.
 *
 * Il difetto A12 erano 62 funzioni che ritornavano `boolean` e 35 che ritornavano `{ success }`.
 * Un `false` non dice perché: qui l'errore viaggia con l'esito, e il tipo obbliga a guardarlo.
 */
describe('Result', () => {
  it('ok porta il valore', () => {
    expect(ok(42)).toEqual({ ok: true, value: 42 })
  })

  it('err porta l’errore', () => {
    expect(err({ code: 'error.ledger.invalid_amount' })).toEqual({
      ok: false,
      error: { code: 'error.ledger.invalid_amount' }
    })
  })

  it('l’unione discriminata separa i due rami', () => {
    const esiti: Result<number, string>[] = [ok(1), err('rotto')]
    const letti = esiti.map((e) => (e.ok ? `valore ${e.value}` : `errore ${e.error}`))
    expect(letti).toEqual(['valore 1', 'errore rotto'])
  })

  it('leggere il valore senza aver guardato `ok` non compila', () => {
    const esito: Result<number, string> = ok(1)
    // @ts-expect-error — `value` non esiste sul ramo di errore: va prima ristretto con `ok`
    const valore: number = esito.value
    expect(valore).toBe(1)
  })
})
