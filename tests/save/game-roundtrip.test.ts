import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'
import { POOL_IDS } from '@core/contracts/pools'
import type { SavePayload } from '@core/contracts/save'

import { incomePerSecond } from '@core/domains/income/rules'
import { ticks } from '@core/kernel/Clock'

import { createSaveFile } from '../../src/main/save/SaveFile'
import { createSaveStore, type SaveStore } from '../../src/main/save/SaveStore'
import { createGame, type Game } from '../../src/renderer/runtime/createGame'

/**
 * D013 — il terzo round-trip, e l'unico che gioca.
 *
 * Gli altri due di questa cartella rispondono ad altre domande, e nessuno dei tre copre gli altri:
 * `roundtrip` prova il confine del main con payload scritti a mano, `kernel-roundtrip` prova che
 * lo schema accetti ciò che il kernel produce — ma con un **sistema finto** al posto di `income`,
 * perché a D009 il dominio non esisteva. Qui il sistema è quello vero, i comandi sono quelli che
 * la UI invia, e lo stato di partenza nessuno lo scrive: lo **guadagna**.
 *
 * È la differenza che conta. Uno stato costruito a mano prova che il formato sopravvive al disco;
 * una partita giocata prova che sopravvive la **partita** — e le due cose divergono nel punto in
 * cui `IncomeState.upgraded` torna indietro come dato ma il moltiplicatore che quel dato comanda
 * vive nel registro dei modificatori, che nel salvataggio non c'è.
 */

/** Il seme della partita giocata, e quello della partita che la rilegge: devono essere diversi. */
const SEED = 4242
const REOPENED_SEED = SEED + 1

const SAVED_AT = 1_755_600_000_000

/**
 * Quanti tick servono a guadagnare il prezzo dell'upgrade **giocando**: a 12,00 €/s il reddito è
 * 1,20 € per tick, e 669 tick fanno 802,80 € — l'upgrade più la commissione, con del resto. Il
 * numero è scritto qui una volta sola perché è una scelta di questo test, non del gioco.
 */
const TICKS_TO_AFFORD = 669

let directory: string
let store: SaveStore
let game: Game

/**
 * La fetta 01, giocata dal suo primo tick: si guadagna in contanti, si deposita al bancomat
 * pagando la commissione, si compra l'upgrade con la carta, e il reddito che segue è già quello
 * moltiplicato. È il giro descritto nella nota di chiusura di D015, percorso qui dal codice
 * invece che dallo schermo.
 */
const play = (target: Game): void => {
  target.registry.tickAll(target.ctx, ticks(TICKS_TO_AFFORD))
  target.atm.deposit(target.ctx.ledger.balance('cash'))
  target.income.buyUpgrade('card')

  // Dopo l'upgrade il reddito è 18,00 €/s: questi tick valgono più dei primi, e il salvataggio
  // deve poterlo dimostrare.
  target.registry.tickAll(target.ctx, ticks(7))

  // Un rifiuto fa parte del giocare, e non deve muovere un centesimo: la commissione fissa si
  // mangia 1,00 € intero (D014, BALANCE.ATM_AMOUNTS — il primo importo esiste perché fallisce).
  target.atm.withdraw(fromString('1'))

  target.atm.deposit(fromString('10'))

  // Nella fetta 01 nessun dominio pesca: `income` non usa la casualità e `atm` non ha stato. I
  // cursori restano quindi vuoti in una partita giocata, e uno stato dell'Rng vuoto non prova che
  // i cursori attraversino il disco — che è invece ciò che questo file deve dimostrare
  // (docs/qualita.md, «lo stato di prova deve essere non banale»). La pescata sta al posto del
  // dominio che pescherà, e resta l'unica riga di questo giro che non è un gesto del giocatore.
  for (let draw = 0; draw < 3; draw += 1) target.ctx.rng.stream('income').next()
}

const totalOf = (target: Game): string =>
  toString(
    POOL_IDS.reduce((sum, pool) => sum.plus(target.ctx.ledger.balance(pool)), fromString('0'))
  )

/** Il payload che la seconda partita legge viene **dal disco**, non dalla memoria della prima. */
const saveAndReload = async (payload: SavePayload): Promise<SavePayload> => {
  const written = await store.save(payload)
  expect(written).toEqual({ ok: true, value: SAVED_AT })

  const loaded = await store.load()
  if (!loaded.ok || !loaded.value.present) throw new Error('il caricamento doveva riuscire')
  return loaded.value.payload
}

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'solvent-game-'))
  store = createSaveStore(createSaveFile(directory), () => SAVED_AT)
  game = createGame(SEED)
  play(game)
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

describe('la partita giocata, dal disco e ritorno', () => {
  it('lo stato di partenza è una partita giocata, non uno stato costruito a mano', () => {
    const payload = game.save()

    // Cinque conti su sei mossi, decimali compresi: il giro del bancomat li produce da solo.
    expect(payload.ledger.balances).toEqual({
      cash: '2.6',
      card: '7.8',
      world: '-815.4',
      sink: '800',
      fees: '5',
      house: '0'
    })

    // Il dominio vero, con l'upgrade comprato — non un sistema finto che ritorna un oggetto.
    expect(payload.systems).toEqual({ income: { upgraded: true } })
    expect(payload.rng.cursors).toEqual({ income: 3 })
  })

  it('lo schema del main accetta ciò che una partita vera produce', async () => {
    expect(await store.save(game.save())).toEqual({ ok: true, value: SAVED_AT })
  })

  it('una partita nuova rilegge dal disco uno stato identico, campo per campo', async () => {
    const saved = game.save()
    const reopened = createGame(REOPENED_SEED)

    expect(reopened.load(await saveAndReload(saved)).ok).toBe(true)

    // Uguaglianza profonda sull'intero payload, non su qualche campo scelto: saldi, seme, cursori
    // e stato dei domini in un confronto solo. Il seme di partenza era diverso apposta.
    expect(reopened.save()).toEqual(saved)
  })

  it('e i conti della partita riletta sommano ancora zero', async () => {
    const reopened = createGame(REOPENED_SEED)
    reopened.load(await saveAndReload(game.save()))

    expect(totalOf(reopened)).toBe('0')
    expect(totalOf(reopened)).toBe(totalOf(game))
  })
})

describe('ciò che nel salvataggio non c’è', () => {
  it('l’upgrade non torna come dato: torna come reddito', async () => {
    // Il moltiplicatore vive nel registro dei modificatori, che il payload non contiene: a
    // rimetterlo è `load` del sistema. Un round-trip che guardasse solo i byte direbbe verde
    // anche su una partita che ha ricomprato il diritto all'upgrade senza il suo effetto.
    const reopened = createGame(REOPENED_SEED)
    expect(toString(incomePerSecond(reopened.modifiers))).toBe('12')

    reopened.load(await saveAndReload(game.save()))

    expect(toString(incomePerSecond(reopened.modifiers))).toBe('18')
  })

  it('e il reddito riletto si vede sul conto, non solo in una firma', async () => {
    const reopened = createGame(REOPENED_SEED)
    reopened.load(await saveAndReload(game.save()))
    const before = reopened.ctx.ledger.balance('cash')

    reopened.registry.tickAll(reopened.ctx, ticks(10))

    // Dieci tick sono un secondo (ADR 0009): con l'upgrade valgono 18,00 €, senza ne varrebbero 12.
    expect(toString(reopened.ctx.ledger.balance('cash').minus(before))).toBe('18')
  })
})
