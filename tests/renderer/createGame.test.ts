import { beforeEach, describe, expect, it } from 'vitest'

import { fromString, toString, ZERO } from '@core/contracts/money'
import { POOL_IDS } from '@core/contracts/pools'
import type { SavePayload } from '@core/contracts/save'

import { BALANCE } from '@core/balance/constants'
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
  it('registra i due sistemi con stato, ognuno una volta sola e nel proprio ordine', () => {
    // L'ordine non e' quello di registrazione: e' `ORDER`, e il caveau sta in `ECONOMY` (100),
    // prima di `INCOME` (200). Non e' una preferenza — il caveau non ticchetta, quindi il suo
    // `order` decide solo salvataggio e caricamento, ed e' li' che conta: al ricaricamento il
    // livello torna **prima** che il recupero faccia ticchettare otto ore di stipendio contro la
    // capienza di una partita appena nata.
    expect(game.registry.systems().map((system) => system.id)).toEqual(['vault', 'income'])
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
    game.ctx.ledger.transaction(income('cash', fromString('1000'), ZERO), {
      reason: 'reason.income.tick'
    })

    const moved = game.atm.deposit(fromString('500'))

    expect(moved.ok).toBe(true)
    expect(toString(game.ctx.ledger.balance('cash'))).toBe('500')
    expect(toString(game.ctx.ledger.balance('card'))).toBe('492.5')
  })

  it('anche il comando dell’upgrade paga da quel Ledger, non da uno suo', () => {
    // `createIncome(ledger, modifiers)` riceve il Ledger per costruzione (ADR 0024), e il `tick`
    // invece usa quello del `SystemContext`: sono due porte diverse per la stessa istanza, e
    // niente **obbliga** il bootstrap a passare la stessa. Provato mettendone una seconda: tutto
    // restava verde. Questo caso è l'unica rete che c'è.
    game.ctx.ledger.transaction(income('card', fromString('1000'), ZERO), {
      reason: 'reason.income.tick'
    })

    const bought = game.income.buyUpgrade('card')

    expect(bought.ok).toBe(true)
    expect(toString(game.ctx.ledger.balance('card'))).toBe('200')
    expect(total()).toBe('0')
  })

  it('e senza fondi su quel Ledger l’upgrade non si compra', () => {
    const bought = game.income.buyUpgrade('card')

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

describe('il tempo che avanza', () => {
  /** Un intervallo di serie, in tick: quanto basta perché una registrazione chiuda. */
  const AN_INTERVAL = BALANCE.INSTRUMENT_CANDLE_EVERY

  it('ticchetta i sistemi e registra, in un gesto solo', () => {
    // D037 · ADR 0043 — è ciò che rende impossibile un secondo percorso che ticchetti senza
    // registrare. Fino a D037 i due gesti erano scritti a mano in due punti, e uno dei due si era
    // già dimenticato la metà che registra.
    game.advance(AN_INTERVAL)

    expect(game.ctx.ledger.balance('cash').isPositive()).toBe(true)
    expect(game.series.netWorth.list().items).toHaveLength(1)
    expect(game.series.cash.list().items).toHaveLength(1)
    expect(game.series.card.list().items).toHaveLength(1)
  })

  it('e la cronaca vede i saldi che il tick ha appena prodotto, non quelli di prima', () => {
    // L'ordine dentro `advance` non è indifferente: prima i sistemi, poi la cronaca. Al contrario,
    // ogni campione porterebbe il gioco di un passo fa.
    game.advance(AN_INTERVAL)

    const sampled = game.series.netWorth.list().items[0]

    expect(sampled).toBeDefined()
    expect(toString(sampled ?? fromString('-1'))).toBe(toString(game.ctx.ledger.balance('cash')))
  })

  it('un passo che non chiude niente non lascia niente, e la lista resta la stessa', () => {
    const before = game.series.netWorth.list()

    game.advance(ticks(1))

    expect(game.series.netWorth.list()).toBe(before)
  })

  /**
   * D040 — l'intervallo si cammina a blocchi, e i due modi in cui un ciclo può sbagliare.
   *
   * Il primo è perdere il resto: un `for` che avanza di `ADVANCE_BLOCK` e si ferma prima
   * dell'ultimo blocco parziale sottrae fino a un giorno di gioco di reddito a ogni recupero, ed è
   * il difetto che `stepOf` documenta un piano più giù — «nessuno lo noterebbe se non contando i
   * tick». Il secondo è contare due volte lo stesso blocco.
   *
   * Tutti e due si prendono nello stesso modo: il denaro prodotto da `advance(n)` dipende **solo**
   * da `n`, e non da come `n` si spezza.
   */
  describe('a blocchi', () => {
    const earnedOver = (elapsed: number): string => {
      const fresh = createGame(SEED)
      fresh.advance(ticks(elapsed))
      return toString(fresh.ctx.ledger.balance('cash'))
    }

    it('non perde il resto: un intervallo che non è multiplo del blocco vale per intero', () => {
      const odd = BALANCE.ADVANCE_BLOCK * 2 + 7
      const expected = BALANCE.INCOME_BASE_PER_SECOND.div(10).mul(odd)

      expect(earnedOver(odd)).toBe(toString(expected))
    })

    it('e un intervallo più corto di un blocco intero vale sé stesso, non un blocco', () => {
      const short = 7
      const expected = BALANCE.INCOME_BASE_PER_SECOND.div(10).mul(short)

      expect(earnedOver(short)).toBe(toString(expected))
    })

    it('spezzare non crea né distrugge denaro: il totale dipende da quanto, non da come', () => {
      const whole = BALANCE.ADVANCE_BLOCK * 5

      const split = createGame(SEED)
      split.advance(ticks(BALANCE.ADVANCE_BLOCK * 2))
      split.advance(ticks(BALANCE.ADVANCE_BLOCK * 3))

      expect(toString(split.ctx.ledger.balance('cash'))).toBe(earnedOver(whole))
    })

    it('e ogni blocco somma a zero, non solo il recupero intero', () => {
      // N blocchi sono N transazioni invece di una, quindi N occasioni di sbagliare. La partita
      // doppia è l'invariante più profondo del progetto e vale a ogni passo, non a fine giornata.
      game.advance(ticks(BALANCE.ADVANCE_BLOCK * 3 + 1))

      expect(total()).toBe('0')
    })
  })
})

describe('il salvataggio', () => {
  it('save → load riproduce saldi, seme e stato dei domini', () => {
    game.ctx.ledger.transaction(income('card', fromString('900'), ZERO), {
      reason: 'reason.income.tick'
    })
    game.income.buyUpgrade('card')
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
    game.ctx.ledger.transaction(income('card', fromString('900'), ZERO), {
      reason: 'reason.income.tick'
    })
    game.income.buyUpgrade('card')

    game.reset('hard')

    expect(total()).toBe('0')
    expect(toString(game.ctx.ledger.balance('card'))).toBe('0')
    expect(game.registry.saveAll()).toEqual({
      income: { upgraded: false, declared: false },
      vault: { level: 0 }
    })
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

  it('azzera anche le serie, in tutti e due gli scopi: sono di questa partita', () => {
    // D037 — prima erano sei righe scritte a mano nello store, cioè sei righe da ricordarsi.
    // Tenerle farebbe cominciare i grafici della partita nuova con il patrimonio di quella buttata
    // via, cioè con la sua scala.
    game.advance(BALANCE.INSTRUMENT_CANDLE_EVERY)
    expect(game.series.cash.list().items).toHaveLength(1)

    game.reset('soft')
    expect(game.series.cash.list().items).toEqual([])

    game.advance(BALANCE.INSTRUMENT_CANDLE_EVERY)
    game.reset('hard')
    expect(game.series.cash.list().items).toEqual([])
  })
})

describe('caricare non è un movimento economico', () => {
  it('e le escursioni ripartono dai saldi caricati, non da zero', () => {
    // Senza, la prima candela di una partita riaperta salirebbe da zero al patrimonio caricato:
    // una salita mai avvenuta, e per giunta quella che decide la scala dell'asse. Nessun evento lo
    // annuncia — caricare non posta — quindi a dirlo è `Game.load`.
    game.ctx.ledger.transaction(income('card', fromString('340'), ZERO), {
      reason: 'reason.income.tick'
    })
    const saved: SavePayload = game.save()

    const reopened = createGame(SEED + 1)
    expect(reopened.load(saved).ok).toBe(true)
    reopened.advance(BALANCE.INSTRUMENT_CANDLE_EVERY)

    const candle = reopened.series.card.list().items[0]

    expect(candle).toBeDefined()
    expect(toString(candle?.open ?? fromString('-1'))).toBe('340')
    expect(toString(candle?.low ?? fromString('-1'))).toBe('340')
  })
})
