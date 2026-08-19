import { describe, expect, it } from 'vitest'

import type { LedgerError, Reason, Transaction } from '@core/contracts/ledger'
import { fromString, ZERO } from '@core/contracts/money'

/**
 * I tipi del denaro. Il Ledger che li usa è D007: qui si verifica che il vocabolario copra i casi
 * che le deleghe dichiarano, e che non ne copra di più.
 */

// Se a `LedgerError` si aggiunge un caso, questa mappa smette di compilare: `Record` li vuole tutti.
const CASES: Record<LedgerError['code'], true> = {
  'error.ledger.insufficient_funds': true,
  'error.ledger.capacity_exceeded': true,
  'error.ledger.pool_not_accepted': true,
  'error.ledger.invalid_amount': true
}

describe('LedgerError', () => {
  it('copre i quattro casi della delega, e nessun altro', () => {
    expect(Object.keys(CASES).sort()).toEqual([
      'error.ledger.capacity_exceeded',
      'error.ledger.insufficient_funds',
      'error.ledger.invalid_amount',
      'error.ledger.pool_not_accepted'
    ])
  })

  it('ogni codice segue error.<dominio>.<causa>', () => {
    for (const code of Object.keys(CASES)) {
      expect(code).toMatch(/^error\.ledger\.[a-z_]+$/)
    }
  })

  it('l’errore porta con sé il contesto che serve a spiegarlo', () => {
    const funds: LedgerError = {
      code: 'error.ledger.insufficient_funds',
      pool: 'cash',
      required: fromString('500'),
      available: fromString('12.50')
    }
    const instrument: LedgerError = {
      code: 'error.ledger.pool_not_accepted',
      pool: 'cash',
      accepted: ['card']
    }

    expect(funds.code === 'error.ledger.insufficient_funds' && funds.available.toString()).toBe(
      '12.5'
    )
    expect(instrument.code === 'error.ledger.pool_not_accepted' && instrument.accepted).toEqual([
      'card'
    ])
  })
})

describe('Transaction', () => {
  it('è un evento economico solo, con la sua ragione e le sue righe', () => {
    const withdrawal: Transaction = {
      reason: 'reason.atm.withdraw',
      postings: [
        { pool: 'card', amount: fromString('-500'), category: 'transfer' },
        { pool: 'cash', amount: fromString('497.50'), category: 'transfer' },
        { pool: 'fees', amount: fromString('2.50'), category: 'fee' }
      ]
    }

    const sum = withdrawal.postings.reduce((acc, p) => acc.plus(p.amount), ZERO)
    expect(sum.toString()).toBe('0')
  })

  it('una ragione inventata non è una Reason', () => {
    // @ts-expect-error — la ragione è una chiave i18n tipizzata, non una stringa libera
    const invented: Reason = 'reason.casino.spin'
    expect(invented).toBe('reason.casino.spin')
  })
})
