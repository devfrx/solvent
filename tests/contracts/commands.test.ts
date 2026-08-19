import { describe, expect, it } from 'vitest'

import type { CommandHandler } from '@core/contracts/commands'
import type { LedgerError } from '@core/contracts/ledger'
import { fromString } from '@core/contracts/money'
import { err, ok } from '@core/contracts/result'

/**
 * R10 · ADR 0007 — nei comandi la regola è imposta dal compilatore: la firma ritorna `Result`,
 * e l'errore deve avere un `code`, cioè una chiave che la UI sa tradurre.
 */
const compra: CommandHandler<{ disponibile: string }, string, LedgerError> = ({ disponibile }) => {
  const costo = fromString('100')
  const saldo = fromString(disponibile)

  if (saldo.lessThan(costo)) {
    return err({
      code: 'error.ledger.insufficient_funds',
      pool: 'card',
      required: costo,
      available: saldo
    })
  }
  return ok('upgrade')
}

describe('CommandHandler', () => {
  it('un comando riuscito ritorna il valore', () => {
    expect(compra({ disponibile: '250' })).toEqual({ ok: true, value: 'upgrade' })
  })

  it('un comando fallito ritorna un codice, non un false', () => {
    const esito = compra({ disponibile: '10' })
    expect(esito.ok).toBe(false)
    expect(esito.ok ? null : esito.error.code).toBe('error.ledger.insufficient_funds')
  })

  it('un errore senza `code` non è ammesso dalla firma', () => {
    // @ts-expect-error — ADR 0007: l'errore ha sempre un `code`, altrimenti la UI indovina
    const rotto: CommandHandler<void, number, { motivo: string }> = () => err({ motivo: 'boh' })
    expect(rotto).toBeTypeOf('function')
  })

  it('un comando che ritorna un booleano non compila', () => {
    // @ts-expect-error — R10: il difetto A12 erano 62 funzioni che ritornavano un boolean nudo
    const rotto: CommandHandler<void, number, LedgerError> = () => true
    expect(rotto).toBeTypeOf('function')
  })
})
