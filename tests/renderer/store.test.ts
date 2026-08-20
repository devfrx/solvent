import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { toRaw } from 'vue'

import type { Balances } from '@core/contracts/ledger'
import { fromString, toString } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import type { LoadedSave, SavePayload, SaveResult } from '@core/contracts/save'

import { BALANCE } from '@core/balance/constants'
import { income } from '@core/kernel/Ledger'

import { createGame, type Game } from '../../src/renderer/runtime/createGame'
import { ATM_KINDS, provideRuntime, useGameStore } from '../../src/renderer/stores/game'
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

/**
 * INV-17 — il salvataggio si scrive solo da uno stato in cui il modello in memoria è quello vero.
 *
 * È il difetto che l'audit del 2026-08-20 ha trovato, ed è di quelli che nessuno vede finché non
 * succede a lui: davanti alla schermata d'errore il gesto naturale è chiudere la finestra, non
 * scegliere fra due pulsanti. Prima di questa delega quel gesto scriveva una partita azzerata
 * **sopra** il salvataggio del giocatore — mentre la schermata gli prometteva che il file non era
 * stato toccato.
 */
describe('chiudere da uno stato che non ha una partita da salvare', () => {
  const corrupt = (): Promise<SaveResult<LoadedSave>> =>
    Promise.resolve({ ok: false, error: { code: 'error.save.corrupt' } })

  it('dalla schermata d’errore non scrive niente, e la finestra si chiude lo stesso', async () => {
    const store = await start({ load: corrupt })
    expect(store.status).toBe('failed')
    expect(store.failedDuring).toBe('loading')

    stage.requestClose()
    await Promise.resolve()
    await Promise.resolve()

    expect(stage.written()).toEqual([])
    expect(stage.isClosed()).toBe(true)
  })

  it('e nemmeno mentre il caricamento è ancora in corso', async () => {
    // La finestra qui è ancora più stretta, ma il file su disco è **buono**: è la partita vera,
    // e la memoria non l'ha ancora vista.
    let release: (result: SaveResult<LoadedSave>) => void = () => undefined
    const pending = new Promise<SaveResult<LoadedSave>>((resolve) => {
      release = resolve
    })

    stage = createStage({ load: () => pending })
    provideRuntime({ game, host: stage.host })
    const store = useGameStore()
    const started = store.start()
    expect(store.status).toBe('loading')

    stage.requestClose()
    await Promise.resolve()
    await Promise.resolve()

    expect(stage.written()).toEqual([])
    expect(stage.isClosed()).toBe(true)

    release({ ok: true, value: { present: false } })
    await started
  })

  it('ma da un salvataggio fallito sì: lì la partita è in memoria e non è mai arrivata al disco', async () => {
    let attempts = 0
    const store = await start({
      save: () => {
        attempts += 1
        return Promise.resolve({
          ok: false,
          error: { code: 'error.save.io', cause: 'disco pieno' }
        })
      }
    })

    stage.requestClose()
    await Promise.resolve()
    await Promise.resolve()
    expect(store.status).toBe('failed')
    expect(store.failedDuring).toBe('saving')

    // Il giocatore chiude di nuovo invece di premere «Riprova»: è la stessa cosa, e deve riprovare.
    stage.requestClose()
    await Promise.resolve()
    await Promise.resolve()

    expect(attempts).toBe(2)
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

    const moved = store.confirm('deposit', fromString('500'))

    expect(moved.ok).toBe(true)
    expect(toString(store.balances.card)).toBe('497.5')
  })

  it('un comando rifiutato torna indietro con il suo codice, e niente si muove', async () => {
    const store = await start()

    const refused = store.confirm('withdraw', fromString('500'))

    expect(refused.ok).toBe(false)
    if (refused.ok) return
    expect(refused.error.code).toBe('error.ledger.insufficient_funds')
    expect(toString(store.balances.cash)).toBe('0')
  })
})

describe('i selettori del reddito', () => {
  /** L'upgrade si paga **solo** con la carta (D010), e il reddito entra in contanti. */
  const fundCard = (amount: string): void => {
    game.ctx.ledger.transaction(income('card', fromString(amount)), {
      reason: 'reason.income.tick'
    })
  }

  it('il prezzo è quello del dominio, non un numero ricopiato', async () => {
    const store = await start()

    expect(toString(store.upgradeCost)).toBe(toString(BALANCE.UPGRADE_COST))
  })

  it('il reddito al secondo è quello base finché non si compra', async () => {
    const store = await start()

    expect(toString(store.incomePerSecond)).toBe(toString(BALANCE.INCOME_BASE_PER_SECOND))
  })

  it('e cresce quando l’acquisto riesce: i modificatori non annunciano niente', async () => {
    // Registrare un modificatore non è un movimento economico, quindi il Bus tace: se lo store
    // non rileggesse, il pannello resterebbe a 12,00 €/s per sempre dopo un acquisto riuscito.
    const store = await start()
    fundCard('800')

    expect(store.buyUpgrade().ok).toBe(true)

    const boosted = BALANCE.INCOME_BASE_PER_SECOND.mul(BALANCE.UPGRADE_MULTIPLIER)
    expect(toString(store.incomePerSecond)).toBe(toString(boosted))
    expect(store.upgraded).toBe(true)
  })

  it('un caricamento con l’upgrade già comprato arriva con i numeri giusti', async () => {
    // Il mirror va riletto a mano anche qui: caricare non emette, e il registro dei modificatori
    // lo rimette a posto il sistema durante `load`.
    const payload = freshPayload()
    const upgraded: SavePayload = { ...payload, systems: { income: { upgraded: true } } }

    const store = await start({ load: found(upgraded, SAVED_AT), wallClock: SAVED_AT })

    expect(store.upgraded).toBe(true)
    expect(store.canBuyUpgrade).toBe(false)
    const boosted = BALANCE.INCOME_BASE_PER_SECOND.mul(BALANCE.UPGRADE_MULTIPLIER)
    expect(toString(store.incomePerSecond)).toBe(toString(boosted))
  })

  it('una partita nuova riporta indietro anche il reddito', async () => {
    const store = await start()
    fundCard('800')
    store.buyUpgrade()

    await store.newGame()

    expect(store.upgraded).toBe(false)
    expect(toString(store.incomePerSecond)).toBe(toString(BALANCE.INCOME_BASE_PER_SECOND))
  })
})

describe('l’anteprima e il comando dicono la stessa cosa', () => {
  const fundCard = (amount: string): void => {
    game.ctx.ledger.transaction(income('card', fromString(amount)), {
      reason: 'reason.income.tick'
    })
  }

  /** Quando i due divergono si spegne un pulsante che avrebbe funzionato, o viceversa. */
  const agreeOn = (store: ReturnType<typeof useGameStore>): boolean => {
    const foreseen = store.canBuyUpgrade
    const actual = store.buyUpgrade()
    expect(actual.ok).toBe(foreseen)
    return foreseen
  }

  it('con la carta vuota: no, e il Ledger dice perché', async () => {
    const store = await start()

    expect(agreeOn(store)).toBe(false)
  })

  it('con un centesimo in meno del prezzo: ancora no', async () => {
    const store = await start()
    fundCard(toString(BALANCE.UPGRADE_COST.minus(fromString('0.01'))))

    expect(agreeOn(store)).toBe(false)
  })

  it('con il prezzo esatto: sì', async () => {
    const store = await start()
    fundCard(toString(BALANCE.UPGRADE_COST))

    expect(agreeOn(store)).toBe(true)
  })

  it('con i soldi in contanti invece che sulla carta: no, e non è il saldo totale a decidere', async () => {
    // È la trappola della fetta: il reddito entra in contanti, l'upgrade si paga con la carta, e
    // il ponte fra i due è il bancomat. Un selettore che guardasse la somma direbbe di sì.
    const store = await start()
    game.ctx.ledger.transaction(income('cash', fromString('5000')), {
      reason: 'reason.income.tick'
    })

    expect(agreeOn(store)).toBe(false)
  })

  it('la seconda volta: no da entrambe le parti', async () => {
    const store = await start()
    fundCard('2000')
    expect(agreeOn(store)).toBe(true)

    expect(agreeOn(store)).toBe(false)
  })
})

describe('le due cause di un errore', () => {
  it('un caricamento fallito si dichiara tale', async () => {
    const store = await start({
      load: () => Promise.resolve({ ok: false, error: { code: 'error.save.corrupt' } })
    })

    expect(store.status).toBe('failed')
    expect(store.failedDuring).toBe('loading')
  })

  it('un salvataggio finale fallito no, e lo stesso codice non basta a distinguerli', async () => {
    const store = await start({
      save: () =>
        Promise.resolve({ ok: false, error: { code: 'error.save.io', cause: 'disco pieno' } })
    })

    stage.requestClose()
    await Promise.resolve()
    await Promise.resolve()

    expect(store.failure?.code).toBe('error.save.io')
    expect(store.failedDuring).toBe('saving')
  })

  it('riprovare dopo un salvataggio fallito riscrive, e allora la finestra si chiude', async () => {
    const written: SavePayload[] = []
    let broken = true
    const store = await start({
      save: (payload) => {
        written.push(payload)
        if (broken) {
          return Promise.resolve({ ok: false, error: { code: 'error.save.io', cause: 'pieno' } })
        }
        return Promise.resolve({ ok: true, value: SAVED_AT })
      }
    })

    stage.requestClose()
    await Promise.resolve()
    await Promise.resolve()
    expect(stage.isClosed()).toBe(false)

    broken = false
    await store.retry()

    expect(written).toHaveLength(2)
    expect(stage.isClosed()).toBe(true)
    expect(store.savedAt).toBe(SAVED_AT)
  })

  it('riprovare dopo un caricamento fallito ricarica', async () => {
    let broken = true
    const store = await start({
      load: () => {
        if (broken) return Promise.resolve({ ok: false, error: { code: 'error.save.corrupt' } })
        return Promise.resolve({ ok: true, value: { present: false } })
      }
    })
    expect(store.status).toBe('failed')

    broken = false
    await store.retry()

    expect(store.status).toBe('playing')
    expect(store.failedDuring).toBeNull()
  })

  it('chiudere lo stesso non riscrive niente: è la scelta di perdere qualcosa', async () => {
    const written: SavePayload[] = []
    const store = await start({
      save: (payload) => {
        written.push(payload)
        return Promise.resolve({ ok: false, error: { code: 'error.save.io', cause: 'pieno' } })
      }
    })

    stage.requestClose()
    await Promise.resolve()
    await Promise.resolve()
    expect(store.status).toBe('failed')

    store.closeWithoutSaving()

    expect(stage.isClosed()).toBe(true)
    expect(written).toHaveLength(1)
  })
})

describe('il tempo passato che la schermata di recupero mostra', () => {
  it("all'avvio è la distanza dall'ultimo salvataggio", async () => {
    const store = await start({
      load: found(freshPayload(), SAVED_AT),
      wallClock: SAVED_AT + FIVE_SECONDS * SECOND
    })

    expect(store.awayFor).toBe(FIVE_SECONDS * SECOND)
  })

  it('un salvataggio dal futuro non produce un tempo negativo', async () => {
    const store = await start({
      load: found(freshPayload(), SAVED_AT),
      wallClock: SAVED_AT - 60 * SECOND
    })

    expect(store.awayFor).toBe(0)
  })

  it('al ritorno da Sospeso è quanto la finestra è stata nascosta', async () => {
    const hidden = 3 * 60 * SECOND
    const store = await start({ wallClock: SAVED_AT })
    stage.frame()

    stage.setVisible(false)
    stage.setWallClock(SAVED_AT + hidden)
    stage.setVisible(true)

    expect(store.status).toBe('recovering')
    expect(store.awayFor).toBe(hidden)
  })
})

/** Denaro vero, dalla porta vera: nessun saldo si scrive a mano (R06). */
const fund = (pool: Pool, amount: string): void => {
  game.ctx.ledger.transaction(income(pool, fromString(amount)), { reason: 'reason.income.tick' })
}

describe('i selettori del bancomat', () => {
  it('la commissione è quella del dominio, non il numero copiato dal mockup', async () => {
    const store = await start()

    expect(toString(store.atmFee)).toBe(toString(BALANCE.ATM_FEE))
  })

  it('gli importi rapidi ci sono, e la schermata si apre sul più grande', async () => {
    const store = await start()
    const largest = store.atmAmounts.reduce((high, amount) =>
      amount.greaterThan(high) ? amount : high
    )

    expect(store.atmAmounts.length).toBeGreaterThan(1)
    expect(toString(store.atmDefaultAmount)).toBe(toString(largest))
  })

  it('il caveau non ha ancora un tetto, e la schermata lo dice invece di inventarlo', async () => {
    // Quando la fetta 02 gli darà un valore, questa riga diventerà rossa: è il punto in cui
    // qualcuno deve decidere cosa disegna la capienza, invece di scoprirlo a schermo.
    const store = await start()

    expect(store.cashCapacity).toBeNull()
    expect(store.cardCapacity).toBeNull()
  })
})

describe('l’anteprima del bancomat e il comando', () => {
  it('mostrano lo stesso elenco di movimenti, in tutte e due le direzioni', async () => {
    // Non "danno lo stesso numero": è lo **stesso** elenco, costruito una volta sola da
    // `previewOf` (INV-11). Se anteprima e comando leggessero due tabelle, un giorno «Deposita»
    // mostrerebbe l'anteprima di un prelievo.
    const store = await start()
    fund('cash', '1000')
    fund('card', '1000')

    for (const kind of ATM_KINDS) {
      const foreseen = store.preview(kind, fromString('500'))
      expect(foreseen.ok).toBe(true)
      if (!foreseen.ok) return

      const done = store.confirm(kind, fromString('500'))

      expect(done.ok).toBe(true)
      expect(store.operations[0]?.postings).toEqual(foreseen.value)
    }
  })

  it('un prelievo di 500 sposta 497,50 sui contanti e 2,50 alle commissioni', async () => {
    const store = await start()
    fund('card', '1000')

    store.confirm('withdraw', fromString('500'))

    expect(toString(store.balances.cash)).toBe('497.5')
    expect(toString(store.balances.card)).toBe('500')
    expect(toString(store.feesPaid)).toBe('2.5')
  })

  it('un importo che la commissione si mangia è un no spiegato, non un pulsante spento', async () => {
    const store = await start()
    fund('card', '1000')

    const foreseen = store.preview('withdraw', fromString('1'))
    expect(foreseen.ok).toBe(false)
    if (foreseen.ok) return
    expect(foreseen.error.code).toBe('error.atm.fee_exceeds_amount')

    // Il pulsante resta premibile, e premerlo dà lo stesso codice: a rispondere è la stessa
    // funzione. Un pulsante spento sarebbe un rifiuto senza motivo (ADR 0018).
    const done = store.confirm('withdraw', fromString('1'))

    expect(done.ok).toBe(false)
    if (done.ok) return
    expect(done.error).toEqual(foreseen.error)
    expect(toString(store.balances.card)).toBe('1000')
  })

  it('e quel no si raggiunge dallo schermo: il più piccolo degli importi rapidi è quello', async () => {
    // Senza un importo rapido sotto la commissione, il rifiuto dell'anteprima esisterebbe solo
    // qui dentro — e un ramo che nessuno può vedere a schermo è un ramo che marcisce.
    const store = await start()
    const smallest = store.atmAmounts.reduce((low, amount) => (amount.lessThan(low) ? amount : low))

    expect(store.preview('withdraw', smallest).ok).toBe(false)
  })
})

describe('il cruscotto', () => {
  it('legge le commissioni pagate da un saldo, non da un contatore', async () => {
    // È la differenza che si vede solo al **caricamento**: un contatore tenuto in memoria
    // ripartirebbe da zero, un saldo no — la partita doppia l'ha già contato (ADR 0020).
    const payload = freshPayload()
    const carried: SavePayload = {
      ...payload,
      ledger: { balances: { ...payload.ledger.balances, fees: '40', world: '-40' } }
    }

    const store = await start({ load: found(carried, SAVED_AT), wallClock: SAVED_AT })

    expect(toString(store.feesPaid)).toBe('40')
  })

  it('e legge allo stesso modo guadagnato e speso, che nessuno conta', async () => {
    const store = await start()
    fund('cash', '2000')
    fund('card', '1000')

    expect(store.buyUpgrade().ok).toBe(true)
    expect(store.confirm('withdraw', fromString('100')).ok).toBe(true)

    expect(toString(store.earned)).toBe('3000')
    expect(toString(store.spent)).toBe(toString(BALANCE.UPGRADE_COST))
  })

  it('i numeri si tengono fra loro: guadagnato meno speso meno commissioni fa il patrimonio', async () => {
    // Non è una coincidenza da verificare: è INV-08 — la somma di tutti i conti fa zero —
    // guardata dal lato del giocatore. Se un giorno non tornasse, il difetto sarebbe nel Ledger.
    const store = await start()
    fund('cash', '2000')
    fund('card', '1000')
    store.buyUpgrade()
    store.confirm('withdraw', fromString('100'))

    const held = store.earned.minus(store.spent).minus(store.feesPaid)

    expect(toString(store.netWorth)).toBe(toString(held))
    expect(toString(store.netWorth)).toBe('2197.5')
  })
})

describe('le ultime operazioni', () => {
  it('arrivano dalla più recente, come un estratto conto', async () => {
    const store = await start()
    fund('cash', '100')
    fund('card', '900')
    store.confirm('withdraw', fromString('500'))

    expect(store.operations[0]?.reason).toBe('reason.atm.withdraw')
    expect(store.operations.at(-1)?.reason).toBe('reason.income.tick')
  })

  it('la home ne mostra poche, la schermata Statistiche tutte quelle che ci sono', async () => {
    const store = await start()
    for (let posted = 0; posted < 10; posted += 1) fund('cash', '1')

    expect(store.operations).toHaveLength(10)
    expect(store.recentOperations.length).toBeLessThan(store.operations.length)
    expect(store.recentOperations[0]).toBe(store.operations[0])
  })
})
