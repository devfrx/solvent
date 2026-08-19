import { beforeEach, describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'
import { POOL_IDS } from '@core/contracts/pools'
import type { SavePayload } from '@core/contracts/save'

import { ticks } from '@core/kernel/Clock'
import { income } from '@core/kernel/Ledger'

import { createGame, type Game } from '../../src/renderer/runtime/createGame'

/**
 * R02 · ADR 0002 · ADR 0024 — il bootstrap: l'unica lista di sistemi, e l'unica partita.
 *
 * La cosa che questi test proteggono davvero non è che `createGame` compili: è che le istanze
 * siano **le stesse**. Due `Ledger` sono due partite che non si vedono, e nessun tipo lo impedisce.
 */

const SEED = 12345

let game: Game

const total = (): string =>
  toString(POOL_IDS.reduce((sum, pool) => sum.plus(game.ctx.ledger.balance(pool)), fromString('0')))

beforeEach(() => {
  game = createGame(SEED)
})

describe('la registrazione dei sistemi', () => {
  it('registra income, e una volta sola', () => {
    expect(game.registry.systems().map((system) => system.id)).toEqual(['income'])
  })

  it('non registra atm, che non è un sistema: non ha stato e non ticchetta', () => {
    // La riga per dominio dell'ADR 0002 vale per i **sistemi**. Il bancomat è due comandi (D014):
    // registrarlo aggiungerebbe una riga al bootstrap e zero comportamento.
    expect(game.registry.systems().map((system) => system.id)).not.toContain('atm')
    expect(game.atm.deposit).toBeTypeOf('function')
    expect(game.atm.withdraw).toBeTypeOf('function')
  })
})

describe('una partita è un’istanza sola di ciascuna cosa', () => {
  it('il Ledger del contesto è quello che i due domini usano', () => {
    game.ctx.ledger.transaction(income('cash', fromString('1000')), {
      reason: 'reason.income.tick'
    })

    const moved = game.atm.deposit(fromString('500'))

    expect(moved.ok).toBe(true)
    expect(toString(game.ctx.ledger.balance('cash'))).toBe('500')
    expect(toString(game.ctx.ledger.balance('card'))).toBe('497.5')
  })

  it('anche il comando dell’upgrade paga da quel Ledger, non da uno suo', () => {
    // `createIncome(ledger, modifiers)` riceve il Ledger per costruzione (ADR 0024), e il `tick`
    // invece usa quello del `SystemContext`: sono due porte diverse per la stessa istanza, e
    // niente **obbliga** il bootstrap a passare la stessa. Provato mettendone una seconda: tutto
    // restava verde. Questo caso è l'unica rete che c'è.
    game.ctx.ledger.transaction(income('card', fromString('1000')), {
      reason: 'reason.income.tick'
    })

    const bought = game.income.buyUpgrade()

    expect(bought.ok).toBe(true)
    expect(toString(game.ctx.ledger.balance('card'))).toBe('200')
    expect(total()).toBe('0')
  })

  it('e senza fondi su quel Ledger l’upgrade non si compra', () => {
    const bought = game.income.buyUpgrade()

    expect(bought.ok).toBe(false)
    if (bought.ok) return
    expect(bought.error.code).toBe('error.ledger.insufficient_funds')
  })

  it('il tick del Registry accredita sullo stesso Ledger che l’upgrade paga', () => {
    game.registry.tickAll(game.ctx, ticks(100))
    const earned = game.ctx.ledger.balance('cash')

    expect(earned.isPositive()).toBe(true)
    expect(total()).toBe('0')
  })
})

describe('il salvataggio', () => {
  it('save → load riproduce saldi, seme e stato dei domini', () => {
    game.ctx.ledger.transaction(income('card', fromString('900')), {
      reason: 'reason.income.tick'
    })
    game.income.buyUpgrade()
    game.ctx.rng.stream('income').next()

    const saved: SavePayload = game.save()
    const reopened = createGame(SEED + 1)

    expect(reopened.load(saved).ok).toBe(true)
    expect(reopened.save()).toEqual(saved)
  })

  it('un salvataggio con i conti sbilanciati è un esito, non un crollo', () => {
    // `Ledger.load` **lancia** su INV-08: qui quel lancio diventa uno stato `Errore` da mostrare.
    const tampered: SavePayload = {
      ...game.save(),
      ledger: { balances: { ...game.save().ledger.balances, cash: '9999' } }
    }

    const loaded = game.load(tampered)

    expect(loaded.ok).toBe(false)
    if (loaded.ok) return
    expect(loaded.error.code).toBe('error.game.load_failed')
  })

  it('e non lascia il gioco a metà: il Ledger valida prima di scrivere', () => {
    const before = total()
    const tampered: SavePayload = {
      ...game.save(),
      ledger: { balances: { ...game.save().ledger.balances, cash: '9999' } }
    }

    game.load(tampered)

    expect(total()).toBe(before)
  })

  it('uno stato di dominio manomesso è colpa del dominio, e lo dice il codice', () => {
    const tampered: SavePayload = { ...game.save(), systems: { income: { upgraded: 'sì' } } }

    const loaded = game.load(tampered)

    expect(loaded.ok).toBe(false)
    if (loaded.ok) return
    expect(loaded.error.code).toBe('error.registry.load_failed')
  })
})

describe('il reset', () => {
  it('hard azzera i conti e riporta i domini all’inizio', () => {
    game.ctx.ledger.transaction(income('card', fromString('900')), {
      reason: 'reason.income.tick'
    })
    game.income.buyUpgrade()

    game.reset('hard')

    expect(total()).toBe('0')
    expect(toString(game.ctx.ledger.balance('card'))).toBe('0')
    expect(game.registry.saveAll()).toEqual({ income: { upgraded: false } })
  })

  it('hard è una partita nuova, quindi una casualità nuova', () => {
    // Senza un seme diverso il giocatore rigiocherebbe la stessa sequenza: una partita nuova che
    // non è nuova. I cursori tornano a zero perché il seme è cambiato sotto di loro.
    game.ctx.rng.stream('income').next()
    expect(game.save().rng.cursors).toEqual({ income: 1 })

    game.reset('hard')

    expect(game.save().rng.cursors).toEqual({})
  })

  it('soft è il prestige: il seme resta, perché la partita è la stessa', () => {
    game.reset('soft')

    expect(game.save().rng.seed).toBe(SEED)
  })
})
