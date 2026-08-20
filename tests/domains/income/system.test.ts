import { beforeEach, describe, expect, it } from 'vitest'

import type { Money } from '@core/contracts/money'
import { fromString, toString, ZERO } from '@core/contracts/money'
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

/**
 * Quanto spazio c'e' nel pool in arrivo. E' la variabile che D017 mette in mano al reddito, e sta
 * qui perche' quasi tutti i casi di questo file vogliono che non morda: `null` e' "nessun tetto",
 * cioe' il comportamento di prima, ed e' l'unica risposta che non cambia cio' che i test di D010
 * misuravano.
 */
let room: Money | null

const tick = (elapsed = ONE_SECOND): void => subject.system.tick?.(ctx, elapsed)

const fund = (pool: 'cash' | 'card', amount: string): void => {
  ledger.transaction(income(pool, fromString(amount)), { reason: 'reason.income.tick' })
}

const total = (): string =>
  toString(POOL_IDS.reduce((sum, pool) => sum.plus(ledger.balance(pool)), fromString('0')))

beforeEach(() => {
  const bus = createBus()
  ledger = createLedger(bus, () => null)
  modifiers = createModifiers()
  room = null
  subject = createIncome(ledger, modifiers, () => room)
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

/**
 * D017 — il pezzo che nessuno si aspetta: il reddito può non entrare.
 *
 * È il cuore della fetta, non un dettaglio. Un idle in cui i soldi smettono di arrivare **senza
 * dirlo** è un idle rotto, e la differenza fra «tutto o niente» e «quanto ci sta» è tutta nel
 * recupero: `recover()` fa un solo `tickAll`, cioè una transazione sola da otto ore di stipendio,
 * e il Ledger la rifiuterebbe intera perché una transazione è atomica (ADR 0019).
 */
describe('il tick quando il caveau non tiene tutto', () => {
  it('con il caveau pieno non muove un centesimo, e lo dice', () => {
    room = ZERO

    tick()

    expect(toString(ledger.balance('cash'))).toBe('0')
    expect(toString(ledger.balance('world'))).toBe('0')
    // «E lo dice»: il muro senza il messaggio è un numero che smette di salire, e il giocatore
    // scoprirebbe da solo che il gioco è fermo — se lo scoprisse.
    expect(toString(subject.withheld())).toBe(BALANCE.INCOME_BASE_PER_SECOND.toString())
    expect(total()).toBe('0')
  })

  it('e non emette una transazione da zero euro', () => {
    // Zero non è un non-evento: sarebbe una transazione valida che non muove niente ed emette lo
    // stesso, e lo storico si riempirebbe di stipendi da 0,00 € proprio mentre si dice che il
    // caveau è pieno.
    room = ZERO
    let emitted = 0
    ctx.bus.on('money.posted', () => {
      emitted += 1
    })

    tick()

    expect(emitted).toBe(0)
  })

  it('con il caveau quasi pieno accredita quanto ci sta, e la somma resta zero', () => {
    // 4,00 € di spazio contro 12,00 € maturati: ne entrano quattro, otto restano fuori. È il caso
    // che rende «quanto ci sta» diverso da «tutto o niente» anche fuori dal recupero.
    room = fromString('4')

    tick()

    expect(toString(ledger.balance('cash'))).toBe('4')
    expect(toString(ledger.balance('world'))).toBe('-4')
    expect(toString(subject.withheld())).toBe('8')
    expect(total()).toBe('0')
  })

  it('e con lo spazio che avanza incassa tutto, senza trattenere niente', () => {
    room = fromString('99999')

    tick()

    expect(toString(ledger.balance('cash'))).toBe(BALANCE.INCOME_BASE_PER_SECOND.toString())
    expect(toString(subject.withheld())).toBe('0')
  })

  it('quello che resta fuori descrive l’ultimo tick, non la partita', () => {
    room = ZERO
    tick()
    expect(toString(subject.withheld())).toBe(BALANCE.INCOME_BASE_PER_SECOND.toString())

    room = null
    tick()

    expect(toString(subject.withheld())).toBe('0')
  })

  it('e un caricamento lo azzera: l’ultimo tick era di un’altra sessione', () => {
    room = ZERO
    tick()

    subject.system.load({ upgraded: false })

    expect(toString(subject.withheld())).toBe('0')
  })

  it('lo stesso vale per un azzeramento', () => {
    room = ZERO
    tick()

    subject.system.reset('hard')

    expect(toString(subject.withheld())).toBe('0')
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
    const reloaded = createIncome(ledger, reloadedModifiers, () => room)
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
