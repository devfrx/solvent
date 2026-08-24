import { beforeEach, describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'

import { MAX_LEVEL } from '../../src/core/domains/vault/rules'
import type { Cheats } from '../../src/core/kernel/Cheats'
import { installCheats } from '../../src/renderer/runtime/cheats'
import { createGame, type Game } from '../../src/renderer/runtime/createGame'

/**
 * D029 — i cheat veri su una partita vera, che è l'unica prova che conti: il registro da solo non
 * dice se un cheat fa quello che promette, e un cheat da solo non dice se il bootstrap l'ha
 * collegato al pezzo giusto — due `Vault` sarebbero due caveau che non si vedono, ed è la stessa
 * trappola che `tests/renderer/createGame` sorveglia per i sistemi.
 *
 * L'ultimo caso è quello per cui questa delega esiste: una partita murata viva che si sblocca dal
 * pannello invece che dal disco.
 */

const SEED = 4242
const money = fromString

let game: Game
let cheats: Cheats

const cash = (): string => toString(game.ctx.ledger.balance('cash'))
const card = (): string => toString(game.ctx.ledger.balance('card'))

beforeEach(() => {
  game = createGame(SEED)
  cheats = installCheats(game)
})

describe('i cheat installati su una partita', () => {
  it('ci sono tutti, e una volta sola', () => {
    // Se `installCheats` dimenticasse una riga il pannello mostrerebbe meno pulsanti senza dirlo:
    // è la stessa classe di difetto di un sistema non registrato, e la stessa difesa.
    expect(cheats.all().map((cheat) => cheat.id)).toEqual([
      'cheat.ledger.grant_cash',
      'cheat.ledger.grant_card',
      'cheat.ledger.drain_cash',
      'cheat.ledger.drain_card',
      'cheat.vault.level_up',
      'cheat.vault.max_level',
      'cheat.vault.reset_level',
      'cheat.income.boost'
    ])
  })

  it('regalare denaro passa dal Ledger, quindi i conti restano a somma zero', () => {
    // INV-08 è l'invariante più forte del progetto, e un cheat è il posto più facile del mondo in
    // cui romperlo: basta scrivere un saldo. Qui la contropartita la scrive `income`, come per uno
    // stipendio, quindi `world` scende di quanto la carta sale.
    cheats.run('cheat.ledger.grant_card', money('10000'))

    expect(card()).toBe('10000')
    expect(toString(game.ctx.ledger.balance('world'))).toBe('-10000')
  })

  it('e rispetta la capienza invece di aggirarla', () => {
    // Il caveau di partenza tiene 1.000,00 €. Un cheat che passasse sopra ricostruirebbe da capo il
    // salvataggio incoerente che ha bloccato l'ambiente di sviluppo — cioè userebbe il pannello per
    // rifare il difetto che il pannello serve a studiare.
    const refused = cheats.run('cheat.ledger.grant_cash', money('10000'))

    expect(refused.ok).toBe(false)
    if (refused.ok) return
    expect(refused.error.code).toBe('error.ledger.capacity_exceeded')
    expect(cash()).toBe('0')
  })

  it('ampliare il caveau è ciò che apre la strada, come per il giocatore', () => {
    cheats.run('cheat.vault.max_level')

    expect(game.vault.state().level).toBe(MAX_LEVEL)
    expect(cheats.run('cheat.ledger.grant_cash', money('10000')).ok).toBe(true)
    expect(cash()).toBe('10000')
  })

  it('il livello del caveau sale di uno e non oltre l’ultimo', () => {
    cheats.run('cheat.vault.max_level')
    cheats.run('cheat.vault.level_up')

    expect(game.vault.state().level).toBe(MAX_LEVEL)

    cheats.run('cheat.vault.reset_level')
    cheats.run('cheat.vault.level_up')

    expect(game.vault.state().level).toBe(1)
  })

  it('il moltiplicatore del reddito si inverte, e premerlo due volte non lancia', () => {
    // Da D044 questo cheat è l'**unico** cliente di `income.all`: i livelli sono aritmetica pura
    // sullo stato, e nel registro dei modificatori non c'è più niente. È ciò che tiene il gancio
    // provato da qualcosa che non sia un test, finché l'albero delle abilità non arriva.
    //
    // `register` rifiuta il duplicato **lanciando**, quindi l'interruttore deve togliere prima di
    // rimettere: la seconda pressione è il caso che quel difetto farebbe crollare.
    const before = toString(game.modifiers.compose('income.all', money('100')))

    cheats.run('cheat.income.boost')

    expect(toString(game.modifiers.compose('income.all', money('100')))).not.toBe(before)

    cheats.run('cheat.income.boost')

    expect(toString(game.modifiers.compose('income.all', money('100')))).toBe(before)

    expect(() => cheats.run('cheat.income.boost')).not.toThrow()
  })

  it('e una partita murata viva si sblocca svuotando, senza toccare il file', () => {
    // Il caso vero: il salvataggio di sviluppo aveva 1.009.051,70 € di contanti contro un tetto di
    // 1.000,00 €. Con INV-23 quel saldo può scendere, quindi «svuota i contanti» lo riporta dentro
    // le regole — ed è l'unica strada, perché ampliare il caveau **spende** contanti e ampliare non
    // basterebbe comunque a coprire un milione.
    game.load({
      ledger: {
        balances: {
          cash: '9000',
          card: '0',
          world: '-9000',
          sink: '0',
          fees: '0',
          house: '0',
          tax: '0'
        }
      },
      rng: game.save().rng,
      systems: game.save().systems
    })

    expect(cheats.run('cheat.ledger.grant_cash', money('1000')).ok).toBe(false)

    cheats.run('cheat.ledger.drain_cash')

    expect(cash()).toBe('0')
    expect(cheats.run('cheat.ledger.grant_cash', money('1000')).ok).toBe(true)
  })
})
