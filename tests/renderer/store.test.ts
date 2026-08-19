import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { toRaw } from 'vue'

import type { Balances } from '@core/contracts/ledger'
import { fromString, toString } from '@core/contracts/money'
import type { LoadedSave, SavePayload, SaveResult } from '@core/contracts/save'

import { BALANCE } from '@core/balance/constants'
import { income } from '@core/kernel/Ledger'

import { createGame, type Game } from '../../src/renderer/runtime/createGame'
import { provideRuntime, useGameStore } from '../../src/renderer/stores/game'
import { createStage, type Stage, type StageOptions } from '../helpers/host'

/**
 * Lo store: la macchina a stati di docs/design/ciclo-di-vita.md, e un mirror che **non calcola**.
 *
 * Gira in `node` senza jsdom perché il browser arriva per costruzione: è la prova che il confine
 * di `runtime/host.ts` regge. Se un giorno questo file avesse bisogno di un DOM, vorrebbe dire che
 * qualcosa ha ricominciato a nominare `window` fuori da lì.
 */

const SEED = 999
const SAVED_AT = 1_700_000_000_000
const SECOND = 1000

/** Il reddito base è 12,00 €/s (D008): cinque secondi di arretrati valgono 60,00 €. */
const FIVE_SECONDS = 5

let game: Game
let stage: Stage

const start = async (options: StageOptions = {}): Promise<ReturnType<typeof useGameStore>> => {
  stage = createStage(options)
  provideRuntime({ game, host: stage.host })
  const store = useGameStore()
  await store.start()
  return store
}

/** Un salvataggio valido: i conti di una partita appena nata sommano a zero. */
const freshPayload = (): SavePayload => createGame(SEED).save()

const found =
  (payload: SavePayload, savedAt: number): (() => Promise<SaveResult<LoadedSave>>) =>
  () =>
    Promise.resolve({ ok: true, value: { present: true, savedAt, payload } })

beforeEach(() => {
  setActivePinia(createPinia())
  game = createGame(SEED)
})

describe('l’avvio', () => {
  it('senza salvataggio è una partita nuova, e il loop parte', async () => {
    const store = await start()

    expect(store.status).toBe('playing')
    expect(store.isRunning()).toBe(true)
    expect(store.savedAt).toBeNull()
  })

  it('nessun tick parte prima che il caricamento sia finito', async () => {
    // Un tick su uno stato mezzo caricato produce numeri sbagliati che poi vengono salvati come
    // veri: è il difetto che questa transizione esiste per impedire.
    let release: (result: SaveResult<LoadedSave>) => void = () => undefined
    const pending = new Promise<SaveResult<LoadedSave>>((resolve) => {
      release = resolve
    })

    stage = createStage({ load: () => pending })
    provideRuntime({ game, host: stage.host })
    const store = useGameStore()
    const started = store.start()

    expect(store.status).toBe('loading')
    stage.advance(10 * SECOND)
    expect(stage.frame()).toBe(false)
    expect(toString(game.ctx.ledger.balance('cash'))).toBe('0')

    release({ ok: true, value: { present: false } })
    await started

    expect(store.status).toBe('playing')
  })

  it('un salvataggio illeggibile è uno stato, non un crollo', async () => {
    const store = await start({
      load: () => Promise.resolve({ ok: false, error: { code: 'error.save.corrupt' } })
    })

    expect(store.status).toBe('failed')
    expect(store.failure).toEqual({ code: 'error.save.corrupt' })
    expect(store.isRunning()).toBe(false)
  })

  it('un salvataggio con i conti manomessi finisce nello stesso stato', async () => {
    const payload = freshPayload()
    const tampered: SavePayload = {
      ...payload,
      ledger: { balances: { ...payload.ledger.balances, cash: '5000' } }
    }

    const store = await start({ load: found(tampered, SAVED_AT) })

    expect(store.status).toBe('failed')
    expect(store.failure?.code).toBe('error.game.load_failed')
  })
})

describe('il recupero all’avvio', () => {
  it('esegue i tick arretrati e poi gioca', async () => {
    const store = await start({
      load: found(freshPayload(), SAVED_AT),
      wallClock: SAVED_AT + FIVE_SECONDS * SECOND
    })

    expect(store.status).toBe('playing')
    expect(toString(game.ctx.ledger.balance('cash'))).toBe('60')
    expect(store.savedAt).toBe(SAVED_AT)
  })

  it('e non oltre il tetto, per quanto tempo sia passato', async () => {
    // Cento ore di assenza non devono bloccare l'avvio per minuti: il tetto è otto ore (D008), ed
    // è lo **stesso** `stepOf` del loop a limitarlo — non una formula offline scritta a parte.
    const hundredHours = 100 * 3600 * SECOND
    const store = await start({
      load: found(freshPayload(), SAVED_AT),
      wallClock: SAVED_AT + hundredHours
    })

    const capped = BALANCE.INCOME_BASE_PER_SECOND.div(10).mul(BALANCE.RECOVERY_CAP)
    expect(store.status).toBe('playing')
    expect(toString(game.ctx.ledger.balance('cash'))).toBe(toString(capped))
  })

  it('un salvataggio dal futuro non produce tick', async () => {
    const store = await start({
      load: found(freshPayload(), SAVED_AT),
      wallClock: SAVED_AT - 60 * SECOND
    })

    expect(store.status).toBe('playing')
    expect(toString(game.ctx.ledger.balance('cash'))).toBe('0')
  })
})

describe('il mirror', () => {
  it('è l’oggetto che il Ledger ha emesso, non uno che lo store ha ricomposto', async () => {
    const store = await start()
    let emitted: Balances | null = null
    game.ctx.bus.on('money.posted', (posted) => {
      emitted = posted.balances
    })

    game.ctx.ledger.transaction(income('cash', fromString('120')), {
      reason: 'reason.income.tick'
    })

    // Identità, non uguaglianza: se lo store calcolasse, sarebbe un oggetto diverso con gli
    // stessi numeri — e il gioco non sarebbe più simulabile senza Vue (ADR 0001).
    expect(toRaw(store.balances)).toBe(emitted)
    expect(toString(store.balances.cash)).toBe('120')
  })

  it('si rilegge dopo un caricamento, che non emette niente', async () => {
    const payload = freshPayload()
    const loaded: SavePayload = {
      ...payload,
      ledger: { balances: { ...payload.ledger.balances, cash: '340', world: '-340' } }
    }

    const store = await start({ load: found(loaded, SAVED_AT), wallClock: SAVED_AT })

    expect(toString(store.balances.cash)).toBe('340')
  })

  it('raccoglie le operazioni, e la lista ha un limite dichiarato', async () => {
    const store = await start()

    for (let posted = 0; posted < 25; posted += 1) {
      game.ctx.ledger.transaction(income('cash', fromString('1')), {
        reason: 'reason.income.tick'
      })
    }

    expect(store.history.max).toBe(20)
    expect(store.history.items).toHaveLength(20)
  })
})

describe('nascondere e riesporre la finestra', () => {
  it('passa per Sospeso e Recupero, e torna a giocare col primo frame', async () => {
    const store = await start()
    stage.frame()

    stage.setVisible(false)
    expect(store.status).toBe('suspended')

    stage.setVisible(true)
    expect(store.status).toBe('recovering')

    // Il loop non si era fermato: il browser semplicemente non chiamava il frame, e adesso il
    // delta copre tutto il tempo passato. Un solo meccanismo per due situazioni uguali.
    stage.advance(3 * SECOND)
    stage.frame()

    expect(store.status).toBe('playing')
    expect(toString(game.ctx.ledger.balance('cash'))).toBe('36')
  })

  it('nascondere una partita in errore non la fa diventare sospesa', async () => {
    const store = await start({
      load: () => Promise.resolve({ ok: false, error: { code: 'error.save.corrupt' } })
    })

    stage.setVisible(false)

    expect(store.status).toBe('failed')
  })
})

describe('la chiusura', () => {
  it('salva, e la finestra resta aperta finché il main non ha confermato', async () => {
    // L'ordine è l'invariante, non il fatto che entrambe le cose avvengano: chiudere e poi
    // salvare perde l'ultima partita di gioco, e i due gesti da fuori si somigliano.
    const seen: SavePayload[] = []
    let confirm: (written: SaveResult<number>) => void = () => undefined
    const pending = new Promise<SaveResult<number>>((resolve) => {
      confirm = resolve
    })

    const store = await start({
      save: (payload) => {
        seen.push(payload)
        return pending
      }
    })
    stage.frame()
    stage.advance(SECOND)
    stage.frame()

    stage.requestClose()
    await Promise.resolve()

    expect(seen).toHaveLength(1)
    expect(seen[0]?.ledger.balances.cash).toBe('12')
    expect(stage.isClosed()).toBe(false)

    confirm({ ok: true, value: SAVED_AT })
    await Promise.resolve()
    await Promise.resolve()

    expect(stage.isClosed()).toBe(true)
    expect(store.savedAt).toBe(SAVED_AT)
  })

  it('ferma il loop: nessun tick dopo che il payload è stato costruito', async () => {
    const store = await start()

    stage.requestClose()
    await Promise.resolve()
    await Promise.resolve()

    expect(store.isRunning()).toBe(false)
  })

  it('se la scrittura fallisce la finestra non si chiude, e la partita è ancora in memoria', async () => {
    // Chiudere comunque sarebbe comodo e perderebbe l'unica copia esistente. La schermata che
    // offrirà "chiudi lo stesso" è di D012: qui lo stato è già quello giusto da mostrare.
    const store = await start({
      save: () =>
        Promise.resolve({ ok: false, error: { code: 'error.save.io', cause: 'disco pieno' } })
    })

    stage.requestClose()
    await Promise.resolve()
    await Promise.resolve()

    expect(stage.isClosed()).toBe(false)
    expect(store.status).toBe('failed')
    expect(store.failure).toEqual({ code: 'error.save.io', cause: 'disco pieno' })
  })
})

describe('una partita nuova dopo un errore', () => {
  it('azzera, cancella il file e riparte', async () => {
    const store = await start({
      load: () => Promise.resolve({ ok: false, error: { code: 'error.save.corrupt' } })
    })
    expect(store.status).toBe('failed')

    await store.newGame()

    expect(store.status).toBe('playing')
    expect(store.failure).toBeNull()
    expect(toString(store.balances.cash)).toBe('0')
  })
})

describe('i comandi', () => {
  it('passano dal gioco, e il mirror li vede', async () => {
    const store = await start()
    game.ctx.ledger.transaction(income('cash', fromString('1000')), {
      reason: 'reason.income.tick'
    })

    const moved = store.deposit(fromString('500'))

    expect(moved.ok).toBe(true)
    expect(toString(store.balances.card)).toBe('497.5')
  })

  it('un comando rifiutato torna indietro con il suo codice, e niente si muove', async () => {
    const store = await start()

    const refused = store.withdraw(fromString('500'))

    expect(refused.ok).toBe(false)
    if (refused.ok) return
    expect(refused.error.code).toBe('error.ledger.insufficient_funds')
    expect(toString(store.balances.cash)).toBe('0')
  })
})
