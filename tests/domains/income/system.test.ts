import { beforeEach, describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'
import { POOL_IDS } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'
import { createModifiers, type Modifiers } from '@core/balance/modifiers'
import { createBus } from '@core/kernel/Bus'
import { clock, ticks } from '@core/kernel/Clock'
import { createLedger, income, type Ledger } from '@core/kernel/Ledger'
import { createRegistry, ORDER, type SystemContext } from '@core/kernel/Registry'
import { createRng } from '@core/kernel/Rng'

import { createIncome, type Income } from '../../../src/core/domains/income/system'
import type { IncomeSave } from '../../../src/core/domains/income/types'

/**
 * Il sistema intero, con i pezzi veri: nessun mock del kernel (convenzioni.md). Ciò che si
 * verifica qui è l'orchestrazione — chi chiede a chi, in che ordine — perché il calcolo ha già i
 * suoi test in `rules.test.ts`.
 */

const ONE_SECOND = ticks(10)

let ledger: Ledger
let modifiers: Modifiers
let subject: Income
let ctx: SystemContext

const tick = (elapsed = ONE_SECOND): void => subject.system.tick?.(ctx, elapsed)

const fund = (pool: 'cash' | 'card', amount: string): void => {
  ledger.transaction(income(pool, fromString(amount)), { reason: 'reason.income.tick' })
}

const total = (): string =>
  toString(POOL_IDS.reduce((sum, pool) => sum.plus(ledger.balance(pool)), fromString('0')))

beforeEach(() => {
  const bus = createBus()
  ledger = createLedger(bus)
  modifiers = createModifiers()
  subject = createIncome(ledger, modifiers)
  ctx = { clock, rng: createRng(1), bus, ledger }
})

describe('come si presenta al Registry', () => {
  it('ha l’id e la fase dichiarati, e il tipo gli impone save, load e reset', () => {
    expect(subject.system.id).toBe('income')
    expect(subject.system.order).toBe(ORDER.INCOME)
    expect(typeof subject.system.save).toBe('function')
    expect(typeof subject.system.load).toBe('function')
    expect(typeof subject.system.reset).toBe('function')
  })

  it('gira dentro tickAll come qualunque altro sistema', () => {
    const registry = createRegistry()
    registry.register(subject.system)

    registry.tickAll(ctx, ONE_SECOND)

    expect(toString(ledger.balance('cash'))).toBe(BALANCE.INCOME_BASE_PER_SECOND.toString())
  })
})

describe('il tick', () => {
  it('accredita in contanti il reddito dichiarato', () => {
    tick()

    expect(toString(ledger.balance('cash'))).toBe(BALANCE.INCOME_BASE_PER_SECOND.toString())
  })

  it('conta i tick che gli passa il loop, non uno alla volta', () => {
    tick(ticks(30))

    const perTick = clock.perSecondToPerTick(BALANCE.INCOME_BASE_PER_SECOND)
    expect(toString(ledger.balance('cash'))).toBe(perTick.mul(30).toString())
  })

  it('il denaro esce da world: la somma di tutti i conti resta zero', () => {
    tick()

    expect(toString(ledger.balance('world'))).toBe(BALANCE.INCOME_BASE_PER_SECOND.neg().toString())
    expect(total()).toBe('0')
  })

  it('con l’upgrade comprato passa dal modificatore', () => {
    fund('card', '1000')
    expect(subject.buyUpgrade('card').ok).toBe(true)

    tick()

    const expected = BALANCE.INCOME_BASE_PER_SECOND.mul(BALANCE.UPGRADE_MULTIPLIER)
    expect(toString(ledger.balance('cash'))).toBe(expected.toString())
  })
})

describe('salvare e ricaricare', () => {
  const earnedInOneSecond = (target: Income): string => {
    const before = ledger.balance('cash')
    target.system.tick?.(ctx, ONE_SECOND)
    return toString(ledger.balance('cash').minus(before))
  }

  it('riproduce lo stesso reddito per tick, upgrade compreso', () => {
    fund('card', '1000')
    subject.buyUpgrade('card')
    const saved: IncomeSave = subject.system.save()
    const expected = earnedInOneSecond(subject)

    const reloadedModifiers = createModifiers()
    const reloaded = createIncome(ledger, reloadedModifiers)
    reloaded.system.load(saved)
    modifiers = reloadedModifiers

    expect(earnedInOneSecond(reloaded)).toBe(expected)
  })

  it('caricare due volte di fila non fa esplodere il registro dei modificatori', () => {
    const saved: IncomeSave = { upgraded: true }

    subject.system.load(saved)

    expect(() => subject.system.load(saved)).not.toThrow()
  })

  it('uno stato salvato manomesso è un esito, non un declassamento in silenzio', () => {
    const registry = createRegistry()
    registry.register(subject.system)

    const loaded = registry.loadAll({ income: { upgraded: 'sì' } })

    expect(loaded.ok).toBe(false)
    if (loaded.ok) return
    expect(loaded.error.code).toBe('error.registry.load_failed')
    expect(loaded.error.id).toBe('income')
  })
})

describe('azzerare', () => {
  it('riporta il reddito al valore iniziale, upgrade incluso', () => {
    fund('card', '1000')
    subject.buyUpgrade('card')

    subject.system.reset('hard')
    tick()

    expect(toString(ledger.balance('cash'))).toBe(BALANCE.INCOME_BASE_PER_SECOND.toString())
    expect(subject.system.save()).toEqual({ upgraded: false })
  })

  it('toglie la propria sorgente dal registro, non l’intero registro', () => {
    fund('card', '1000')
    subject.buyUpgrade('card')
    modifiers.register({
      id: 'altro.dominio',
      target: 'other.all',
      kind: 'add',
      value: fromString('1')
    })

    subject.system.reset('hard')

    expect(modifiers.sourcesFor('other.all')).toHaveLength(1)
  })
})
