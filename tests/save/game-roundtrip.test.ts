import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'
import { POOL_IDS } from '@core/contracts/pools'
import type { SavePayload } from '@core/contracts/save'

import { incomePerSecond, SOURCES } from '@core/domains/income/rules'
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
 * una partita giocata prova che sopravvive la **partita** — e da D044 le due cose divergono nel
 * punto in cui il salvataggio porta un **livello** e non una resa: la resa si ricalcola dalla
 * scala, e un round-trip che guardasse solo i byte non direbbe se il ricalcolo è tornato uguale.
 */

/** Il seme della partita giocata, e quello della partita che la rilegge: devono essere diversi. */
const SEED = 4242
const REOPENED_SEED = SEED + 1

const SAVED_AT = 1_755_600_000_000

/**
 * Quanti tick servono a guadagnare il secondo livello del lavoro **giocando**: a 12,00 €/s il
 * reddito è 1,20 € per tick, e 1.523 tick fanno 1.827,60 €. Il numero è scritto qui una volta sola
 * perché è una scelta di questo test, non del gioco.
 *
 * **Da dove viene.** Il livello costa 1.800,00 € — l'incremento di resa (6,00 €/s) per i cinque
 * minuti di rientro dell'ADR 0053 — e si paga con la carta, quindi i contanti vanno prima versati
 * lasciando l'1,5% al bancomat: servono 1.827,42 € perché ne arrivino 1.800,00. Il primo multiplo
 * di 1,20 € che ci sta sopra è 1.827,60.
 *
 * Erano 677 fino a D044, quando il reddito aveva un potenziamento solo da 800,00 €. **Che questo
 * numero sia più che raddoppiato è il punto della delega**: il prezzo non è più un cartellino, è
 * l'incremento per il tempo di rientro — e con i contanti sotto il muro del caveau, arrivarci
 * significa **prima** ampliare.
 */
const TICKS_TO_AFFORD = 1523

/**
 * Quanti tick servono ad ampliare il caveau **in contanti**: a 1,20 € per tick, 750 tick fanno
 * 900,00 €, che è il prezzo del primo ampliamento. È anche il numero che dimostra il muro senza
 * doverlo dire — 900,00 € stanno dentro il caveau di partenza, e 1.000,00 € no.
 */
const TICKS_TO_EXPAND = 750

/** Il lavoro dipendente, preso **dall'elenco**: una fonte ricostruita qui proverebbe altro. */
const JOB = SOURCES[0]
if (JOB === undefined) throw new Error('nessuna fonte nell’elenco del reddito')

let directory: string
let store: SaveStore
let game: Game

/**
 * La fetta 01, giocata dal suo primo tick: si amplia il caveau in contanti, si guadagna fino al
 * prezzo del livello, si deposita al bancomat pagando la commissione, si compra il livello con la
 * carta, e il reddito che segue è già quello del gradino nuovo. È il giro descritto nella nota di
 * chiusura di D015, percorso qui dal codice invece che dallo schermo.
 */
const play = (target: Game): void => {
  // Prima il caveau, e non per ordine alfabetico: da D017 i contanti hanno un tetto, quindi
  // ampliarlo è il primo gesto che il giocatore compie davvero — e da D044 è anche **necessario**,
  // perché 1.827,60 € in contanti nel caveau di partenza non ci starebbero.
  target.registry.tickAll(target.ctx, ticks(TICKS_TO_EXPAND))
  target.vault.expand('cash')

  target.registry.tickAll(target.ctx, ticks(TICKS_TO_AFFORD))
  target.atm.deposit(target.ctx.ledger.balance('cash'))
  target.income.buyLevel({ source: JOB, pool: 'card' })

  // Al secondo livello il lavoro rende 18,00 €/s: questi tick valgono più dei primi, e il
  // salvataggio deve poterlo dimostrare.
  target.registry.tickAll(target.ctx, ticks(7))

  // Un rifiuto fa parte del giocare, e non deve muovere un centesimo: il pavimento della
  // commissione si mangia 1,00 € intero (BALANCE.ATM_AMOUNTS — il primo importo esiste perché
  // fallisce, e da D032 è il pavimento a tenerlo raggiungibile).
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

    // Cinque conti su sette mossi, decimali compresi: il giro del bancomat li produce da solo.
    expect(payload.ledger.balances).toEqual({
      cash: '2.6',
      card: '7.68',
      world: '-2740.2',
      sink: '2700',
      fees: '29.92',
      house: '0',
      tax: '0'
    })

    // I due domini veri — il livello comprato e il caveau ampliato — non un sistema finto che
    // ritorna un oggetto. Da D044 lo stato del reddito è anche il primo del progetto che sia un
    // **oggetto annidato**, quindi il primo che un salvataggio manomesso possa sbagliare in
    // silenzio in più di un modo.
    expect(payload.systems).toEqual({
      income: { levels: { job: 2, gigs: 0 }, declared: false },
      vault: { level: 1 }
    })
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
  it('il livello non torna come reddito: torna come **numero**, e il reddito ne discende', () => {
    // Il salvataggio porta un livello, non una resa: la resa si ricalcola dalla scala. Salvarla
    // accanto sarebbe salvare due volte lo stesso fatto, e il giorno in cui la curva cambia le
    // vecchie partite porterebbero in giro il numero vecchio.
    const reopened = createGame(REOPENED_SEED)
    expect(toString(incomePerSecond(reopened.income.state(), reopened.modifiers))).toBe('12')

    reopened.load(game.save())

    expect(toString(incomePerSecond(reopened.income.state(), reopened.modifiers))).toBe('18')
  })

  it('e il reddito riletto si vede sul conto, non solo in una firma', async () => {
    const reopened = createGame(REOPENED_SEED)
    reopened.load(await saveAndReload(game.save()))
    const before = reopened.ctx.ledger.balance('cash')

    reopened.registry.tickAll(reopened.ctx, ticks(10))

    // Dieci tick sono un secondo (ADR 0009): al secondo livello valgono 18,00 €, al primo 12,00 €.
    expect(toString(reopened.ctx.ledger.balance('cash').minus(before))).toBe('18')
  })

  it('e il registro dei modificatori resta vuoto: da D044 nel dominio non registra più nessuno', () => {
    // Fino a D043 il `×1,5` dell'upgrade era l'unica registrazione del gioco, e questo file era il
    // solo posto che provava che `load` la rimettesse. Adesso i livelli sono aritmetica pura sullo
    // stato: il gancio `income.all` resta, e resta **senza clienti** fino all'albero delle abilità.
    expect(game.modifiers.sourcesFor('income.all')).toEqual([])
  })
})
