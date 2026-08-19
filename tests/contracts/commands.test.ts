import { describe, expect, it } from 'vitest'

import type { CommandHandler } from '@core/contracts/commands'
import type { LedgerError } from '@core/contracts/ledger'
import { fromString } from '@core/contracts/money'
import { err, ok } from '@core/contracts/result'

/**
 * R10 · ADR 0007 — nei comandi la regola è imposta dal compilatore: la firma ritorna `Result`,
 * e l'errore deve avere un `code`, cioè una chiave che la UI sa tradurre.
 */
const buy: CommandHandler<{ available: string }, string, LedgerError> = ({ available }) => {
  const cost = fromString('100')
  const balance = fromString(available)

  if (balance.lessThan(cost)) {
    return err({
      code: 'error.ledger.insufficient_funds',
      pool: 'card',
      required: cost,
      available: balance
    })
  }
  return ok('upgrade')
}

describe('CommandHandler', () => {
  it('un comando riuscito ritorna il valore', () => {
    expect(buy({ available: '250' })).toEqual({ ok: true, value: 'upgrade' })
  })

  it('un comando fallito ritorna un codice, non un false', () => {
    const result = buy({ available: '10' })
    expect(result.ok).toBe(false)
    expect(result.ok ? null : result.error.code).toBe('error.ledger.insufficient_funds')
  })

  it('un errore senza `code` non è ammesso dalla firma', () => {
    // @ts-expect-error — ADR 0007: l'errore ha sempre un `code`, altrimenti la UI indovina
    const broken: CommandHandler<void, number, { reason: string }> = () => err({ reason: 'boh' })
    expect(broken).toBeTypeOf('function')
  })

  it('un comando che ritorna un booleano non compila', () => {
    // @ts-expect-error — R10: il difetto A12 erano 62 funzioni che ritornavano un boolean nudo
    const broken: CommandHandler<void, number, LedgerError> = () => true
    expect(broken).toBeTypeOf('function')
  })
})
