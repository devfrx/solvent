import { describe, expect, it } from 'vitest'

import type { LedgerError, Reason, Transaction } from '@core/contracts/ledger'
import { fromString, ZERO } from '@core/contracts/money'

/**
 * I tipi del denaro. Il Ledger che li usa è D007: qui si verifica che il vocabolario copra i casi
 * che le deleghe dichiarano, e che non ne copra di più.
 */

// Se a `LedgerError` si aggiunge un caso, questa mappa smette di compilare: `Record` li vuole tutti.
const CASI: Record<LedgerError['code'], true> = {
  'error.ledger.insufficient_funds': true,
  'error.ledger.capacity_exceeded': true,
  'error.ledger.pool_not_accepted': true,
  'error.ledger.invalid_amount': true
}

describe('LedgerError', () => {
  it('copre i quattro casi della delega, e nessun altro', () => {
    expect(Object.keys(CASI).sort()).toEqual([
      'error.ledger.capacity_exceeded',
      'error.ledger.insufficient_funds',
      'error.ledger.invalid_amount',
      'error.ledger.pool_not_accepted'
    ])
  })

  it('ogni codice segue error.<dominio>.<causa>', () => {
    for (const codice of Object.keys(CASI)) {
      expect(codice).toMatch(/^error\.ledger\.[a-z_]+$/)
    }
  })

  it('l’errore porta con sé il contesto che serve a spiegarlo', () => {
    const fondi: LedgerError = {
      code: 'error.ledger.insufficient_funds',
      pool: 'cash',
      required: fromString('500'),
      available: fromString('12.50')
    }
    const strumento: LedgerError = {
      code: 'error.ledger.pool_not_accepted',
      pool: 'cash',
      accepted: ['card']
    }

    expect(fondi.code === 'error.ledger.insufficient_funds' && fondi.available.toString()).toBe(
      '12.5'
    )
    expect(strumento.code === 'error.ledger.pool_not_accepted' && strumento.accepted).toEqual([
      'card'
    ])
  })
})

describe('Transaction', () => {
  it('è un evento economico solo, con la sua ragione e le sue righe', () => {
    const prelievo: Transaction = {
      reason: 'reason.atm.withdraw',
      postings: [
        { pool: 'card', amount: fromString('-500'), category: 'transfer' },
        { pool: 'cash', amount: fromString('497.50'), category: 'transfer' },
        { pool: 'fees', amount: fromString('2.50'), category: 'fee' }
      ]
    }

    const somma = prelievo.postings.reduce((acc, p) => acc.plus(p.amount), ZERO)
    expect(somma.toString()).toBe('0')
  })

  it('una ragione inventata non è una Reason', () => {
    // @ts-expect-error — la ragione è una chiave i18n tipizzata, non una stringa libera
    const inventata: Reason = 'reason.casino.spin'
    expect(inventata).toBe('reason.casino.spin')
  })
})
