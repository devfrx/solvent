import { beforeEach, describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'
import { POOL_IDS } from '@core/contracts/pools'

import { createModifiers, type Modifiers } from '@core/balance/modifiers'
import { createBus } from '@core/kernel/Bus'
import { createLedger, income, spend, type Ledger } from '@core/kernel/Ledger'

import { UPGRADE_PAYMENT, createBuyUpgrade } from '../../../src/core/domains/income/commands'
import {
  INCOME_TARGET,
  UPGRADE_MODIFIER_ID,
  canBuyUpgrade,
  upgradeCost
} from '../../../src/core/domains/income/rules'
import type { IncomeState } from '../../../src/core/domains/income/types'

/**
 * L'acquisto: un comando che può fallire per due ragioni diverse, e che non deve lasciare mai
 * saldi e stato disallineati.
 */

const FRESH: IncomeState = { upgraded: false }

let ledger: Ledger
let modifiers: Modifiers

/** Mette soldi sulla carta passando dal Ledger vero: nessun saldo si scrive a mano (R06). */
const fund = (amount: string): void => {
  ledger.transaction(income('card', fromString(amount)), { reason: 'reason.income.tick' })
}

const buy = (state: IncomeState = FRESH): ReturnType<ReturnType<typeof createBuyUpgrade>> =>
  createBuyUpgrade({ ledger, modifiers })(state)

const total = (): string =>
  toString(POOL_IDS.reduce((sum, pool) => sum.plus(ledger.balance(pool)), fromString('0')))

beforeEach(() => {
  ledger = createLedger(createBus())
  modifiers = createModifiers()
})

describe('comprare con i fondi che bastano', () => {
  it('riesce, scala il costo dalla carta e registra il modificatore', () => {
    fund('1000')

    const bought = buy()

    expect(bought).toEqual({ ok: true, value: { upgraded: true } })
    expect(toString(ledger.balance('card'))).toBe('200')
    expect(modifiers.sourcesFor(INCOME_TARGET).map((source) => source.id)).toEqual([
      UPGRADE_MODIFIER_ID
    ])
  })

  it('il costo finisce in sink, e la somma di tutti i conti resta zero', () => {
    fund('1000')

    buy()

    expect(toString(ledger.balance('sink'))).toBe(toString(upgradeCost()))
    expect(total()).toBe('0')
  })
})

describe('comprare senza fondi', () => {
  it('fallisce con quanto serviva e quanto c’era, e non muove niente', () => {
    fund('799.99')

    const bought = buy()

    expect(bought).toEqual({
      ok: false,
      error: {
        code: 'error.ledger.insufficient_funds',
        pool: 'card',
        required: upgradeCost(),
        available: fromString('799.99')
      }
    })
    expect(toString(ledger.balance('card'))).toBe('799.99')
    expect(toString(ledger.balance('sink'))).toBe('0')
    expect(modifiers.sourcesFor(INCOME_TARGET)).toEqual([])
  })

  it('l’anteprima e l’esecuzione danno la stessa risposta, al centesimo', () => {
    // Sono due letture diverse dello stesso fatto — una nella UI, una nel Ledger — ed è
    // esattamente la coppia che, quando diverge, spegne un pulsante che avrebbe funzionato.
    for (const funds of ['799.99', '800', '800.01']) {
      ledger = createLedger(createBus())
      modifiers = createModifiers()
      fund(funds)

      const preview = canBuyUpgrade(FRESH, ledger.balance('card'))
      expect(buy().ok).toBe(preview)
    }
  })
})

describe('comprare due volte', () => {
  it('è un esito, non un lancio: il registro dei modificatori non viene toccato', () => {
    fund('2000')
    const first = buy()
    expect(first.ok).toBe(true)

    const again = buy({ upgraded: true })

    expect(again).toEqual({ ok: false, error: { code: 'error.income.already_upgraded' } })
    expect(modifiers.sourcesFor(INCOME_TARGET)).toHaveLength(1)
  })

  it('e non paga una seconda volta', () => {
    fund('2000')
    buy()
    const afterFirst = toString(ledger.balance('card'))

    buy({ upgraded: true })

    expect(toString(ledger.balance('card'))).toBe(afterFirst)
  })
})

describe('con cosa si paga', () => {
  it('la dichiarazione dice carta, e il Ledger la fa valere', () => {
    // `createBuyUpgrade` passa sempre dalla carta, quindi il rifiuto non è raggiungibile dal
    // comando: qui la stessa dichiarazione che il comando usa viene messa davanti a un pagamento
    // in contanti. Senza questo caso, `accepts` sarebbe una decorazione.
    fund('1000')
    ledger.transaction(income('cash', fromString('1000')), { reason: 'reason.income.tick' })

    const paid = ledger.transaction(spend('cash', upgradeCost()), UPGRADE_PAYMENT)

    expect(paid).toEqual({
      ok: false,
      error: { code: 'error.ledger.pool_not_accepted', pool: 'cash', accepted: ['card'] }
    })
  })
})
