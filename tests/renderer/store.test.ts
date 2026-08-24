import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { toRaw } from 'vue'

import type { Balances } from '@core/contracts/ledger'
import { fromString, toString, ZERO } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import { CASH_START_CAPACITY } from '@core/contracts/pools'
import type { LoadedSave, SavePayload, SaveResult } from '@core/contracts/save'

import { BALANCE } from '@core/balance/constants'
import { DEPOSIT, WITHDRAW } from '@core/domains/atm/commands'
import { declarationPrices, upgradePrices } from '@core/domains/income/rules'
import { cashCapacityFor, expansionPrices, MAX_LEVEL } from '@core/domains/vault/rules'
import { clock, seconds, ticks } from '@core/kernel/Clock'
import { income } from '@core/kernel/Ledger'

import { cardOf } from '../../src/core/domains/atm/card'
import type { Candle } from '../../src/renderer/runtime/candles'
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

/**
 * Ciò che si consegna quando lo strumento è **al portatore**: niente. I contanti non chiedono una
 * prova (`POOLS.cash.bearer`), e scriverlo qui invece di passare il codice della carta è ciò che
 * rende la differenza visibile leggendo il test (ADR 0042).
 */
const NO_PROOF = ''

/** I quattro numeri di una candela. Una candela che non c'è ritorna niente, e il confronto lo dice. */
const numbersOf = (candle: Candle | undefined): readonly string[] =>
  candle === undefined
    ? []
    : [candle.open, candle.high, candle.low, candle.close].map((value) => toString(value))

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

  it('e non oltre il caveau: chi torna dopo una notte incassa quanto ci sta, non zero', async () => {
    // **Il caso che la preparazione di D017 ha trovato misurando**, e quello che senza un test
    // tornerebbe da solo. Il recupero fa **un** `tickAll` con tutti i tick arretrati, cioè una
    // transazione sola da otto ore di stipendio: il Ledger la rifiuterebbe intera, perché una
    // transazione è atomica (ADR 0019), e chi è stato via tornerebbe con zero euro **a caveau
    // vuoto**. Non un muro: un guasto travestito da regola.
    //
    // I due tetti restano visibili tutti e due, e sono diversi. Il caveau limita ciò che **entra**;
    // le otto ore di `RECOVERY_CAP` limitano ciò che **matura**, e da qui in avanti si vedono solo
    // in quello che resta fuori — se il recupero non fosse limitato, `incomeWithheld` sarebbe molto
    // più grande.
    const hundredHours = 100 * 3600 * SECOND
    const store = await start({
      load: found(freshPayload(), SAVED_AT),
      wallClock: SAVED_AT + hundredHours
    })

    const wall = cashCapacityFor(0)

    expect(store.status).toBe('playing')
    expect(toString(game.ctx.ledger.balance('cash'))).not.toBe('0')
    expect(toString(game.ctx.ledger.balance('cash'))).toBe(toString(wall))

    // **D040 — `incomeWithheld` è il trattenuto dell'**ultimo blocco**, non di tutta la notte.**
    // Prima di D040 il recupero era un `advance` solo, quindi «l'ultimo tick» e «tutto il
    // recupero» erano la stessa cosa e questa riga poteva chiedere `matured.minus(wall)`. Adesso
    // il mondo avanza a blocchi di un giorno di gioco: il caveau si riempie durante il
    // quarantaduesimo — 1.000,00 € a 1,20 €/tick sono 833 tick — e i blocchi che restano
    // trattengono ognuno il proprio stipendio intero.
    //
    // Non è una perdita di informazione, è la sua definizione: `withheld` risponde a «i soldi
    // stanno entrando **adesso**?», e lo dichiara in `income/types.ts` — «descrive l'ultimo tick,
    // non la partita». Un totale della notte sarebbe un'altra domanda, e avrebbe un altro nome.
    const lastBlock = BALANCE.INCOME_BASE_PER_SECOND.div(10).mul(BALANCE.ADVANCE_BLOCK)
    expect(toString(store.incomeWithheld)).toBe(toString(lastBlock))
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

    game.ctx.ledger.transaction(income('cash', fromString('120'), ZERO), {
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
      game.ctx.ledger.transaction(income('cash', fromString('1'), ZERO), {
        reason: 'reason.income.tick'
      })
    }

    expect(store.history.max).toBe(20)
    expect(store.history.items).toHaveLength(20)
  })
})

describe('la serie del patrimonio netto', () => {
  /*
   * Le tre durate si **derivano** dal Clock invece di essere riscritte: `5000` e `28800000` a mano
   * sarebbero il tick rate in un secondo posto, cioè il difetto A04 dentro un test.
   */
  const TICK = clock.ticksToMilliseconds(ticks(1))
  const EVERY = clock.ticksToMilliseconds(BALANCE.NET_WORTH_SAMPLE_EVERY)
  /** Il tetto del recupero, in millisecondi: la notte più lunga che il gioco riconosce. */
  const A_NIGHT = clock.ticksToMilliseconds(BALANCE.RECOVERY_CAP)

  /** Fa passare del tempo davvero, frame per frame, come farebbe il browser. */
  const run = (elapsed: number): void => {
    stage.advance(elapsed)
    stage.frame()
  }

  it('non prende niente prima della cadenza, e il primo campione arriva a cadenza scaduta', async () => {
    const store = await start()
    stage.frame()

    run(EVERY - TICK)
    expect(store.netWorthSeries.items).toHaveLength(0)

    run(TICK)
    expect(store.netWorthSeries.items).toHaveLength(1)
  })

  it('e il campione porta i saldi che il tick ha appena prodotto, non quelli di prima', async () => {
    // Cinque secondi di reddito base sono 60,00 €: il campione è **dopo** il tick, non prima.
    const store = await start()
    stage.frame()
    run(EVERY)

    expect(toString(store.netWorthSeries.items[0] ?? fromString('0'))).toBe('60')
  })

  it('ne prende uno per intervallo, e la lista ha un limite dichiarato', async () => {
    const store = await start()
    stage.frame()

    for (let taken = 0; taken < BALANCE.NET_WORTH_SAMPLES + 2; taken += 1) run(EVERY)

    expect(store.netWorthSeries.max).toBe(BALANCE.NET_WORTH_SAMPLES)
    expect(store.netWorthSeries.items).toHaveLength(BALANCE.NET_WORTH_SAMPLES)
  })

  it('una notte a finestra nascosta riempie la serie, e le barre non sono finte', async () => {
    // **D040 ha invertito questo test, e la ragione vale più dell'asserzione.**
    //
    // Fino a D040 chiedeva **un** campione, e aveva ragione: il recupero era un `advance` solo,
    // quindi il reddito arretrato entrava in una transazione sola e di saldi ne esisteva
    // letteralmente uno. Millecinquecento barre sarebbero state millecinquecento numeri che
    // nessuno aveva mai avuto — il commento di `sampleOf` lo diceva, ed era vero.
    //
    // Adesso il mondo avanza a blocchi di un giorno di gioco, quindi quei saldi intermedi
    // **esistono**: ognuno è stato il patrimonio del giocatore per un giorno di gioco. Le barre
    // non sono finte, e disegnarle è dire la verità invece di nasconderla — che è il punto della
    // fetta 03.
    const store = await start()
    stage.frame()

    stage.setVisible(false)
    stage.setVisible(true)
    run(A_NIGHT)

    // Il tetto di recupero copre 146 intervalli di campionamento, e la lista ne tiene 30: è il
    // `boundedList` che fa il suo lavoro, non un troncamento accidentale.
    expect(store.netWorthSeries.items).toHaveLength(BALANCE.NET_WORTH_SAMPLES)
  })

  it('una partita nuova la azzera: la scala non è quella della partita buttata via', async () => {
    const store = await start()
    stage.frame()
    run(EVERY)
    expect(store.netWorthSeries.items).toHaveLength(1)

    await store.newGame()

    expect(store.netWorthSeries.items).toEqual([])
  })
})

describe('le serie degli strumenti', () => {
  const TICK = clock.ticksToMilliseconds(ticks(1))
  const EVERY = clock.ticksToMilliseconds(BALANCE.INSTRUMENT_CANDLE_EVERY)

  const run = (elapsed: number): void => {
    stage.advance(elapsed)
    stage.frame()
  }

  it('non chiudono niente prima della cadenza, e la prima candela arriva a cadenza scaduta', async () => {
    const store = await start()
    stage.frame()

    run(EVERY - TICK)
    expect(store.cashCandles.items).toHaveLength(0)

    run(TICK)
    expect(store.cashCandles.items).toHaveLength(1)
  })

  it('un intervallo senza movimento è una candela piatta, non un buco nella serie', async () => {
    // La carta non si muove finché il giocatore non tocca il bancomat. Se la serie si aggiornasse
    // **solo** quando il Ledger posta, qui non ci sarebbe niente da disegnare — e un grafico vuoto
    // direbbe «non lo so» invece di «questo strumento è fermo», che è ciò che sta succedendo.
    const store = await start()
    stage.frame()

    run(EVERY)
    run(EVERY)

    expect(store.cardCandles.items.map(numbersOf)).toEqual([
      ['0', '0', '0', '0'],
      ['0', '0', '0', '0']
    ])
  })

  it('e i contanti portano il massimo e il minimo toccati **dentro**, non i due estremi', async () => {
    // Il caso che la definizione di fatto chiede per nome: un saldo che sale, scende e torna, tutto
    // fra due chiusure. Il reddito li alza a ogni tick, un deposito li abbassa, e i quattro numeri
    // della candela finiscono tutti e quattro diversi — che è la cosa che una fotografia non sa
    // dire nemmeno prendendola quattro volte.
    const store = await start()
    stage.frame()

    run(EVERY) // la prima candela chiude a 60,00 €, e la seconda apre lì
    store.confirm('deposit', fromString('10')) // scende a 50,00 €: il minimo
    run(EVERY - TICK) // risale a 108,80 €: il massimo
    store.confirm('deposit', fromString('10')) // e ridiscende
    run(TICK) // chiude a 100,00 €

    expect(numbersOf(store.cashCandles.items[1])).toEqual(['60', '108.8', '50', '100'])
  })

  it('la prima candela apre sul saldo caricato, non su zero', async () => {
    // Senza, riaprire una partita con 340,00 € in tasca disegnerebbe una prima candela che sale da
    // zero: una salita che non è mai successa, e per giunta quella che decide la scala dell'asse.
    const payload = freshPayload()
    const loaded: SavePayload = {
      ...payload,
      ledger: { balances: { ...payload.ledger.balances, cash: '340', world: '-340' } }
    }

    const store = await start({ load: found(loaded, SAVED_AT), wallClock: SAVED_AT })
    stage.frame()
    run(EVERY)

    expect(numbersOf(store.cashCandles.items[0])).toEqual(['340', '400', '340', '400'])
  })

  it('ne tengono una per intervallo, e le liste hanno il loro limite dichiarato', async () => {
    const store = await start()
    stage.frame()

    for (let closed = 0; closed < BALANCE.INSTRUMENT_CANDLES + 2; closed += 1) run(EVERY)

    expect(store.cashCandles.max).toBe(BALANCE.INSTRUMENT_CANDLES)
    expect(store.cashCandles.items).toHaveLength(BALANCE.INSTRUMENT_CANDLES)
    expect(store.cardCandles.max).toBe(BALANCE.INSTRUMENT_CANDLES)
    expect(store.cardCandles.items).toHaveLength(BALANCE.INSTRUMENT_CANDLES)
  })

  it('una partita nuova le azzera, come la serie del patrimonio', async () => {
    const store = await start()
    stage.frame()
    run(EVERY)
    expect(store.cashCandles.items).toHaveLength(1)

    await store.newGame()

    expect(store.cashCandles.items).toEqual([])
    expect(store.cardCandles.items).toEqual([])
  })
})

describe('riaprire il gioco dopo una notte', () => {
  /** Il tetto del recupero, in millisecondi: la notte più lunga che il gioco riconosce. */
  const A_NIGHT = clock.ticksToMilliseconds(BALANCE.RECOVERY_CAP)

  /**
   * D037 — il difetto che questa delega chiude, e l'unica strada che lo mostrava.
   *
   * A finestra **nascosta** il recupero passa dal loop, e le serie lo vedevano già: è il test qui
   * sopra, «una notte a finestra nascosta vale un campione». A gioco **chiuso e riaperto** passa da
   * `recover()`, che chiamava `registry.tickAll` per conto suo — quindi otto ore di gioco
   * arrivavano ai domini e non alle serie, e i tre grafici ripartivano vuoti come se non fosse
   * successo niente. Le due strade sono lo stesso fatto — *è passato del tempo mentre non
   * guardavamo* — e adesso sono la stessa funzione.
   */
  const reopened = async (): Promise<ReturnType<typeof useGameStore>> =>
    start({ load: found(freshPayload(), SAVED_AT), wallClock: SAVED_AT + A_NIGHT })

  it('lascia una serie piena e una candela per intervallo, non zero e non una', async () => {
    // D037 aveva portato questo numero da **zero** a **uno**: il recupero chiamava `tickAll` per
    // conto suo, quindi il tempo arrivava ai domini e non alle serie. D040 lo porta da uno a
    // trenta, ed è la stessa verità detta a grana più fine — il tempo passato ha una **forma**,
    // non solo un totale.
    const store = await reopened()

    expect(store.netWorthSeries.items).toHaveLength(BALANCE.NET_WORTH_SAMPLES)
    expect(store.cashCandles.items).toHaveLength(BALANCE.INSTRUMENT_CANDLES)
    expect(store.cardCandles.items).toHaveLength(BALANCE.INSTRUMENT_CANDLES)
  })

  it('e il campione porta il patrimonio che il recupero ha appena prodotto', async () => {
    // Otto ore di stipendio contro il caveau di partenza: entra quello che ci sta, e il campione
    // porta quello. È lo stesso numero che il riquadro del cruscotto mostra, perché a sommarlo è
    // la stessa funzione.
    const store = await reopened()

    expect(toString(store.netWorthSeries.items[0] ?? fromString('0'))).toBe(
      toString(CASH_START_CAPACITY)
    )
  })

  it('e a notte intera le ultime candele sono piatte sul muro, che è la verità', async () => {
    // Prima di D040 questa candela apriva a zero e chiudeva sul caveau pieno: **una** candela per
    // tutta la notte, perché di saldi ce n'era uno. Adesso la salita c'è davvero, e finisce
    // presto — il caveau di partenza si riempie all'ottocentotrentatreesimo tick su 7.300 — quindi
    // la finestra di trenta candele che il grafico tiene è **tutta dopo** il muro.
    //
    // Piatte sul muro non è un difetto, è il referto: il giocatore torna e vede che per quasi
    // tutta la notte non è entrato niente. A dire quanto sono `incomeWithheld` e il tempo scartato
    // dal tetto, non una candela che finge una salita che era già finita.
    const store = await reopened()
    const wall = toString(CASH_START_CAPACITY)

    expect(numbersOf(store.cashCandles.items[0])).toEqual([wall, wall, wall, wall])
  })

  it('e a recupero corto disegna la salita, che prima era un salto solo', async () => {
    // **È la prova che D040 serviva.** Cinquecento tick di arretrati — sotto gli 833 che riempiono
    // il caveau, quindi nessun muro di mezzo — sono dieci intervalli di candela.
    //
    // Con il recupero a passo unico questa serie avrebbe **una** candela: apertura a zero,
    // chiusura a 600,00 €, e in mezzo il nulla. Con i blocchi ha dieci candele che salgono, e
    // ognuna è un saldo che il giocatore ha davvero avuto per cinque secondi di gioco. È la
    // differenza fra sapere il totale e vedere cosa è successo — cioè fra un mondo che va avanti
    // e un mondo che salta.
    const RECOVERED = ticks(500)
    const store = await start({
      load: found(freshPayload(), SAVED_AT),
      wallClock: SAVED_AT + clock.ticksToMilliseconds(RECOVERED)
    })

    const every = BALANCE.INSTRUMENT_CANDLE_EVERY
    const closes = store.cashCandles.items.map((candle) => Number(toString(candle.close)))

    expect(store.cashCandles.items).toHaveLength(RECOVERED / every)
    expect(closes).toEqual([...closes].sort((first, second) => first - second))
    expect(new Set(closes).size).toBe(closes.length)

    // E il totale è quello di sempre: spezzare il tempo non crea né distrugge denaro. È
    // l'invariante 3 della delega, e il difetto che chiuderebbe è un ciclo che perde l'ultimo
    // blocco parziale.
    const earned = BALANCE.INCOME_BASE_PER_SECOND.div(10).mul(RECOVERED)
    expect(toString(game.ctx.ledger.balance('cash'))).toBe(toString(earned))
  })

  it('e la carta, che nessuno ha toccato, porta una candela piatta', async () => {
    const store = await reopened()

    expect(numbersOf(store.cardCandles.items[0])).toEqual(['0', '0', '0', '0'])
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
    game.ctx.ledger.transaction(income('cash', fromString('1000'), ZERO), {
      reason: 'reason.income.tick'
    })

    const moved = store.confirm('deposit', fromString('500'))

    expect(moved.ok).toBe(true)
    expect(toString(store.balances.card)).toBe('492.5')
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

describe('il massimo del bancomat', () => {
  const fund = (pool: Pool, amount: string): void => {
    game.ctx.ledger.transaction(income(pool, fromString(amount), ZERO), {
      reason: 'reason.income.tick'
    })
  }

  it('depositando è tutto il contante che c’è: la carta non ha un tetto', async () => {
    const store = await start()
    fund('cash', '750')

    expect(toString(store.atmMaximums.deposit)).toBe('750')
  })

  it('prelevando tiene conto del caveau, e non è il saldo della carta', async () => {
    // Caveau di partenza da 1.000,00 € con 900,00 € dentro: sulla carta ce ne sono diecimila, ma
    // a decidere è lo spazio rimasto — cento euro, più il pavimento che la commissione trattiene.
    const store = await start()
    fund('card', '10000')
    fund('cash', '900')

    expect(toString(store.atmMaximums.withdraw)).toBe('102.5')
  })

  it('e ciò che propone passa davvero, che è la sola ragione per cui esiste', async () => {
    // Il caso in cui la sottrazione ingenua sbaglia: il caveau quasi pieno. Premere `MAX` e
    // vedersi rifiutare è il difetto che questa riga esiste per rendere impossibile.
    const store = await start()
    fund('card', '10000')
    fund('cash', '900')

    const moved = store.confirm('withdraw', store.atmMaximums.withdraw)

    expect(moved.ok).toBe(true)
    expect(toString(store.balances.cash)).toBe('1000')
  })

  it('si muove quando il caveau si amplia, perché il tetto è cambiato', async () => {
    // Se leggesse la capienza una volta sola alla costruzione, la nota «massimo» resterebbe quella
    // del livello zero per tutta la partita. È la trappola che D017 ha già pagato una volta.
    const store = await start()
    fund('card', '100000')
    fund('cash', '900')
    const before = toString(store.atmMaximums.withdraw)

    // L'ampliamento si paga con la carta, che qui è larga: quello che cambia è il **tetto**.
    expect(store.expandVault('card', store.card.code).ok).toBe(true)

    expect(toString(store.atmMaximums.withdraw)).not.toBe(before)
    expect(store.confirm('withdraw', store.atmMaximums.withdraw).ok).toBe(true)
  })

  it('è zero quando non c’è un importo che passa, invece di proporne uno rifiutato', async () => {
    const store = await start()
    fund('cash', '1000')

    // Caveau pieno: prelevare non ha dove mettere il contante. E depositando, con il caveau che
    // trattiene tutto, il massimo resta il saldo — è il prelievo a non avere risposta.
    expect(toString(store.atmMaximums.withdraw)).toBe('0')
  })
})

describe('i selettori del reddito', () => {
  /** Il listino dell'upgrade offre **solo** la carta (ADR 0027), e il reddito entra in contanti. */
  const fundCard = (amount: string): void => {
    game.ctx.ledger.transaction(income('card', fromString(amount), ZERO), {
      reason: 'reason.income.tick'
    })
  }

  it('il listino è quello del dominio, non una tabella ricopiata', async () => {
    const store = await start()

    expect(store.upgradePrices).toEqual(upgradePrices())
  })

  it('e i suoi prezzi sono **gli stessi oggetti**, non copie proxate da Pinia', async () => {
    // Il punto di INV-19: se lo store consegnasse alla UI una copia reattiva del `Decimal`, il
    // prezzo mostrato e quello addebitato sarebbero due valori uguali con due vite separate. È
    // anche la ragione per cui questo campo è uno `shallowRef` invece di un `ref`.
    const store = await start()

    expect(store.upgradePrices[0]?.price).toBe(BALANCE.UPGRADE_PRICE_CARD)
  })

  it('l’anteprima è per strumento: la carta sì, i contanti mai', async () => {
    const store = await start()
    game.ctx.ledger.transaction(income('cash', fromString('5000'), ZERO), {
      reason: 'reason.income.tick'
    })

    // Cinquemila euro in contanti non comprano un upgrade che il listino non offre in contanti:
    // non è il saldo a decidere, è con cosa si paga.
    expect(store.canBuyUpgradeWith('cash')).toBe(false)
    expect(store.canBuyUpgradeWith('card')).toBe(false)

    fundCard('800')
    expect(store.canBuyUpgradeWith('card')).toBe(true)
  })

  it('e comprare con uno strumento fuori dal listino è rifiutato con l’elenco giusto', async () => {
    const store = await start()
    game.ctx.ledger.transaction(income('cash', fromString('5000'), ZERO), {
      reason: 'reason.income.tick'
    })

    const bought = store.buyUpgrade('cash', NO_PROOF)

    expect(bought.ok).toBe(false)
    if (bought.ok) return
    expect(bought.error).toEqual({
      code: 'error.ledger.pool_not_accepted',
      pool: 'cash',
      accepted: upgradePrices().map((option) => option.pool)
    })
    expect(store.upgraded).toBe(false)
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

    expect(store.buyUpgrade('card', store.card.code).ok).toBe(true)

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
    expect(store.canBuyUpgradeWith('card')).toBe(false)
    const boosted = BALANCE.INCOME_BASE_PER_SECOND.mul(BALANCE.UPGRADE_MULTIPLIER)
    expect(toString(store.incomePerSecond)).toBe(toString(boosted))
  })

  it('una partita nuova riporta indietro anche il reddito', async () => {
    const store = await start()
    fundCard('800')
    store.buyUpgrade('card', store.card.code)

    await store.newGame()

    expect(store.upgraded).toBe(false)
    expect(toString(store.incomePerSecond)).toBe(toString(BALANCE.INCOME_BASE_PER_SECOND))
  })
})

describe('l’anteprima e il comando dicono la stessa cosa', () => {
  const fundCard = (amount: string): void => {
    game.ctx.ledger.transaction(income('card', fromString(amount), ZERO), {
      reason: 'reason.income.tick'
    })
  }

  /** Quando i due divergono si spegne un pulsante che avrebbe funzionato, o viceversa. */
  const agreeOn = (store: ReturnType<typeof useGameStore>): boolean => {
    const foreseen = store.canBuyUpgradeWith('card')
    const actual = store.buyUpgrade('card', store.card.code)
    expect(actual.ok).toBe(foreseen)
    return foreseen
  }

  it('con la carta vuota: no, e il Ledger dice perché', async () => {
    const store = await start()

    expect(agreeOn(store)).toBe(false)
  })

  it('con un centesimo in meno del prezzo: ancora no', async () => {
    const store = await start()
    fundCard(toString(BALANCE.UPGRADE_PRICE_CARD.minus(fromString('0.01'))))

    expect(agreeOn(store)).toBe(false)
  })

  it('con il prezzo esatto: sì', async () => {
    const store = await start()
    fundCard(toString(BALANCE.UPGRADE_PRICE_CARD))

    expect(agreeOn(store)).toBe(true)
  })

  it('con i soldi in contanti invece che sulla carta: no, e non è il saldo totale a decidere', async () => {
    // È la trappola della fetta: il reddito entra in contanti, l'upgrade si paga con la carta, e
    // il ponte fra i due è il bancomat. Un selettore che guardasse la somma direbbe di sì.
    const store = await start()
    game.ctx.ledger.transaction(income('cash', fromString('5000'), ZERO), {
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
  game.ctx.ledger.transaction(income(pool, fromString(amount), ZERO), {
    reason: 'reason.income.tick'
  })
}

describe('i selettori del bancomat', () => {
  it('i tassi sono quelli del dominio, non i numeri copiati dal canvas', async () => {
    const store = await start()

    expect(toString(store.atmFeeRates.deposit)).toBe(toString(BALANCE.ATM_FEE_RATE_IN))
    expect(toString(store.atmFeeRates.withdraw)).toBe(toString(BALANCE.ATM_FEE_RATE_OUT))
  })

  it('i due strumenti per direzione vengono dal dominio, non da una tabella del componente', async () => {
    const store = await start()

    // Stessa forma del test qui sopra, stesso difetto: `AtmPanel.vue` teneva una costante `SIDES`
    // che ridiceva questi quattro pool, e niente la legava a `DEPOSIT` e `WITHDRAW`. Il test
    // passava **anche** con `SIDES` al suo posto, ed è la prova che non proteggeva nessuno: a non
    // esistere era il selettore, non il controllo.
    expect(store.atmSides.deposit).toEqual({ from: DEPOSIT.from, to: DEPOSIT.to })
    expect(store.atmSides.withdraw).toEqual({ from: WITHDRAW.from, to: WITHDRAW.to })

    // E le due direzioni sono l'una il contrario dell'altra: senza questo, un selettore derivato
    // da una sola operazione passerebbe metà del test di sopra.
    expect(store.atmSides.deposit.from).toBe(store.atmSides.withdraw.to)
    expect(store.atmSides.deposit.to).toBe(store.atmSides.withdraw.from)
  })

  it('non espone piu una commissione, perche da D032 non e piu un numero', async () => {
    const store = await start()

    // La riga che questa delega ha tolto. Un `Money` catturato alla costruzione funzionava finche'
    // la commissione era fissa; adesso dipende dall'importo e dal verso, quindi chiederla vuol dire
    // chiedere un'anteprima. Se qualcuno la rimettesse, questo test lo direbbe.
    expect('atmFee' in store).toBe(false)
  })

  it('gli importi rapidi ci sono, e la schermata si apre sul più grande', async () => {
    const store = await start()
    const largest = store.atmAmounts.reduce((high, amount) =>
      amount.greaterThan(high) ? amount : high
    )

    expect(store.atmAmounts.length).toBeGreaterThan(1)
    expect(toString(store.atmDefaultAmount)).toBe(toString(largest))
  })

  it('il caveau un tetto ce l’ha, e la schermata legge quello che il Ledger fa rispettare', async () => {
    // La fotografia di prima diceva «il caveau non ha ancora un tetto, e la schermata lo dice
    // invece di inventarlo». La fetta 02 gliene ha dato uno: sostituita da una fotografia, non da
    // un buco. La carta resta senza, e per lei è definitivo.
    //
    // **Per identità e non per uguaglianza** (INV-18): non due numeri che oggi coincidono, ma lo
    // **stesso** `Decimal`, prodotto da una funzione sola. Due letture che devono coincidere prima
    // o poi divergono, ed è la trappola che D015 ha pagato alla correzione 14.
    const store = await start()

    expect(store.cashCapacity).toBe(game.ctx.ledger.capacities('cash'))
    expect(store.cashCapacity).toBe(cashCapacityFor(0))
    expect(store.cardCapacity).toBeNull()
  })
})

describe('i selettori del caveau', () => {
  const fund = (pool: Pool, amount: string): void => {
    game.ctx.ledger.transaction(income(pool, fromString(amount), ZERO), {
      reason: 'reason.income.tick'
    })
  }

  it('il listino è quello del dominio, e ha due voci: è il primo del gioco', async () => {
    const store = await start()

    expect(store.expansionPrices).toEqual(expansionPrices(0))
    expect(store.expansionPrices).toHaveLength(2)
  })

  it('lo spazio libero è il tetto meno quello che c’è', async () => {
    const store = await start()
    fund('cash', '400')

    expect(toString(store.vaultRoom ?? fromString('-1'))).toBe(
      toString(cashCapacityFor(0).minus(fromString('400')))
    )
  })

  it('e la barra è una percentuale già pronta, perché un .vue non calcola', async () => {
    const store = await start()
    expect(store.vaultFill).toBe('0%')

    fund('cash', toString(cashCapacityFor(0).div(2)))

    expect(store.vaultFill).toBe('50%')
  })

  it('ampliare sposta il tetto, e lo store se ne accorge: nessun evento lo annuncia', async () => {
    // La trappola dei mirror, nella sua versione più cara: ampliare **non è** un movimento
    // economico, quindi il Bus tace. Fino a D017 `cashCapacity` era letto una volta sola alla
    // costruzione, ed era corretto perché il numero non si muoveva mai.
    const store = await start()
    fund('cash', toString(cashCapacityFor(0)))

    expect(store.expandVault('cash', NO_PROOF).ok).toBe(true)

    expect(store.vaultProgress.level).toBe(2)
    expect(store.cashCapacity).toBe(cashCapacityFor(1))
    expect(store.cashCapacity).toBe(game.ctx.ledger.capacities('cash'))
    expect(store.expansionPrices).toEqual(expansionPrices(1))
  })

  it('e l’anteprima per strumento dice quello che il comando poi fa', async () => {
    const store = await start()

    expect(store.canExpandWith('cash')).toBe(false)
    expect(store.canExpandWith('card')).toBe(false)

    fund('card', toString(cashCapacityFor(0)))

    expect(store.canExpandWith('cash')).toBe(false)
    expect(store.canExpandWith('card')).toBe(true)
    expect(store.expandVault('card', store.card.code).ok).toBe(true)
  })

  it('uno strumento fuori listino non è comprabile, e non è un errore diverso', async () => {
    const store = await start()

    expect(store.canExpandWith('world')).toBe(false)
  })

  it('il caveau pieno è uno stato del gioco, e la schermata lo sa', async () => {
    // «Il caveau pieno è uno stato in cui il giocatore vive», non un errore: se finisse nella
    // schermata d'errore la fetta sarebbe sbagliata (D017, trappole note).
    const store = await start()
    expect(store.vaultIsFull).toBe(false)

    fund('cash', toString(cashCapacityFor(0)))

    expect(store.vaultIsFull).toBe(true)
    expect(store.vaultFill).toBe('100%')
    expect(store.status).toBe('playing')
  })

  it('e un saldo sopra il tetto non disegna una barra fuori dal proprio riquadro', async () => {
    // Non è teorico: un salvataggio più vecchio della curva delle capienze porta dentro un saldo
    // che oggi non ci starebbe. «Ci sta meno di niente» non è una quantità, e una barra al 500%
    // esce dal pannello.
    const payload = freshPayload()
    const overflowing: SavePayload = {
      ...payload,
      ledger: {
        ...payload.ledger,
        balances: { ...payload.ledger.balances, cash: '5000', world: '-5000' }
      }
    }

    const store = await start({ load: found(overflowing, SAVED_AT), wallClock: SAVED_AT })

    expect(toString(store.balances.cash)).toBe('5000')
    expect(store.vaultFill).toBe('100%')
    expect(toString(store.vaultRoom ?? fromString('-1'))).toBe('0')
    expect(store.vaultIsFull).toBe(true)
  })

  it('il livello si conta come lo conta il giocatore, e dice quanti ampliamenti restano', async () => {
    // «Restano otto ampliamenti» è la cifra su cui si decide; «Caveau 1 di 9» è dove sei. Sono due
    // domande diverse, e finora la seconda costringeva a fare la sottrazione a mente.
    const store = await start()

    expect(store.vaultProgress).toEqual({ level: 1, total: MAX_LEVEL + 1, left: MAX_LEVEL })
  })

  it('e cosa compra il prossimo ampliamento, che è la cosa su cui si decide', async () => {
    // Non **quanto costa**: il prezzo vive nel flusso di pagamento, e fuori da lì nessun `.vue` lo
    // nomina (R24, ADR 0042). Quello che la pagina può dire è cosa ci si porta a casa — e lo legge
    // dalla stessa funzione che il Ledger farà rispettare dopo l'acquisto (INV-18).
    const store = await start()

    expect(store.vaultNextCapacity).toBe(cashCapacityFor(1))
  })

  it('e all’ultimo livello non compra più niente', async () => {
    const played = createGame(SEED)
    played.vault.system.load({ level: MAX_LEVEL })

    const store = await start({ load: found(played.save(), SAVED_AT), wallClock: SAVED_AT })

    expect(store.vaultNextCapacity).toBeNull()
    expect(store.vaultProgress.left).toBe(0)
    expect(store.vaultAtMax).toBe(true)
  })

  it('il caveau ampliato attraversa il salvataggio', async () => {
    const played = createGame(SEED)
    played.ctx.ledger.transaction(income('cash', cashCapacityFor(0), ZERO), {
      reason: 'reason.income.tick'
    })
    expect(played.vault.expand('cash').ok).toBe(true)

    const store = await start({ load: found(played.save(), SAVED_AT), wallClock: SAVED_AT })

    expect(store.vaultProgress.level).toBe(2)
    expect(store.cashCapacity).toBe(cashCapacityFor(1))
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

  it('un prelievo di 500 sposta 490,00 sui contanti e 10,00 alle commissioni', async () => {
    const store = await start()
    fund('card', '1000')

    store.confirm('withdraw', fromString('500'))

    expect(toString(store.balances.cash)).toBe('490')
    expect(toString(store.balances.card)).toBe('500')
    expect(toString(store.feesPaid)).toBe('10')
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
    // 900,00 e non 2.000,00: da D017 i contanti hanno un tetto, e un versamento che non ci sta
    // verrebbe rifiutato per una ragione che non e' quella sotto esame.
    const store = await start()
    fund('cash', '900')
    fund('card', '1000')

    expect(store.buyUpgrade('card', store.card.code).ok).toBe(true)
    expect(store.confirm('withdraw', fromString('100')).ok).toBe(true)

    expect(toString(store.earned)).toBe('1900')
    expect(toString(store.spent)).toBe(toString(BALANCE.UPGRADE_PRICE_CARD))
  })

  it('i numeri si tengono fra loro: guadagnato meno speso meno commissioni fa il patrimonio', async () => {
    // Non è una coincidenza da verificare: è INV-08 — la somma di tutti i conti fa zero —
    // guardata dal lato del giocatore. Se un giorno non tornasse, il difetto sarebbe nel Ledger.
    const store = await start()
    fund('cash', '900')
    fund('card', '1000')
    store.buyUpgrade('card', store.card.code)
    store.confirm('withdraw', fromString('100'))

    const held = store.earned.minus(store.spent).minus(store.feesPaid)

    expect(toString(store.netWorth)).toBe(toString(held))
    expect(toString(store.netWorth)).toBe('1097.5')
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

/**
 * D036 · ADR 0042 — la prova che uno strumento non al portatore chiede prima di pagare, e il posto
 * in cui si verifica. Lo store è l'unico: dentro un dominio non si può — il codice viene dalla
 * carta, la carta sta in `atm`, e un dominio non ne importa un altro (R19) — e nel componente
 * sarebbe «si è ricordato di controllare» invece di una proprietà.
 */
describe('la prova del pagamento', () => {
  const fundCard = (amount: string): void => {
    game.ctx.ledger.transaction(income('card', fromString(amount), ZERO), {
      reason: 'reason.income.tick'
    })
  }

  const balanceOf = (store: ReturnType<typeof useGameStore>, pool: Pool): string =>
    toString(store.balances[pool])

  it('la carta chiede il codice, e con quello sbagliato non si compra', async () => {
    const store = await start()
    fundCard('800')
    const before = balanceOf(store, 'card')

    const bought = store.buyUpgrade('card', '000')

    expect(bought.ok).toBe(false)
    if (bought.ok) return
    expect(bought.error.code).toBe('error.payment.unauthorized')
    expect(store.upgraded).toBe(false)
    // Il rifiuto arriva **prima** del Ledger: non c'è nessuna transazione da annullare.
    expect(balanceOf(store, 'card')).toBe(before)
  })

  it('e con quello giusto si compra: senza questo, il caso qui sopra passerebbe da solo', async () => {
    // La lezione della candela piatta di D034: «il saldo non è cambiato» è vero anche per un
    // comando che non è mai stato chiamato. A discriminare è avere accanto il caso verde.
    const store = await start()
    fundCard('800')
    const before = balanceOf(store, 'card')

    expect(store.buyUpgrade('card', store.card.code).ok).toBe(true)

    expect(store.upgraded).toBe(true)
    expect(balanceOf(store, 'card')).not.toBe(before)
  })

  it('un codice vuoto è un codice sbagliato, non un permesso', async () => {
    const store = await start()
    fundCard('800')

    expect(store.buyUpgrade('card', NO_PROOF).ok).toBe(false)
  })

  it('i contanti non chiedono niente: sono al portatore', async () => {
    // `POOLS.cash.bearer` è `true`, quindi il codice non viene nemmeno guardato. Se la prova
    // dipendesse dal nome del pool invece che dall'affordance, questa riga sarebbe l'unica a
    // dirlo.
    const store = await start()
    // Novecentocinquanta e non duemila: al livello zero il caveau tiene mille euro, e una
    // transazione che sfonda il tetto la rifiuta il Ledger prima che questo test cominci.
    fund('cash', '950')
    const before = balanceOf(store, 'cash')

    expect(store.expandVault('cash', NO_PROOF).ok).toBe(true)

    expect(balanceOf(store, 'cash')).not.toBe(before)
  })

  it('l’ampliamento con la carta chiede il codice come l’upgrade: la regola è dello strumento', async () => {
    const store = await start()
    fundCard('2000')

    expect(store.expandVault('card', '000').ok).toBe(false)
    expect(store.expandVault('card', store.card.code).ok).toBe(true)
  })
})

/**
 * D036 · ADR 0042 — la carta è una funzione del **seme**, quindi cambia quando cambia la partita.
 * Nessuno lo annuncia sul Bus: a rileggerla è `mirror()`, e senza quella riga la partita nuova
 * porterebbe la carta di quella buttata via.
 */
describe('la carta di questa partita', () => {
  it('è quella del seme, e non cambia guardandola due volte', async () => {
    const store = await start()

    expect(store.card).toEqual(cardOf(SEED))
    expect(store.card).toEqual(store.card)
  })

  it('cambia quando la partita ricomincia', async () => {
    const store = await start()
    const first = store.card

    await store.newGame()

    // `reset('hard')` ridà il seme all'Rng: se `mirror()` non rileggesse, questa resterebbe uguale.
    expect(store.card).not.toEqual(first)
  })

  it('e un caricamento porta quella della partita caricata', async () => {
    const other = createGame(SEED + 1).save()

    const store = await start({ load: found(other, SAVED_AT), wallClock: SAVED_AT })

    expect(store.card).toEqual(cardOf(SEED + 1))
  })
})

/**
 * D041 · ADR 0050 — il salvataggio a cadenza.
 *
 * Fino a D041 il gioco scriveva in **un** momento solo, la chiusura della finestra, e chi non
 * chiudeva — un crollo, un processo terminato — perdeva la sessione intera. Qui le scritture si
 * **contano**, che è l'unico modo di provare la coalizione: che la cadenza sia dovuta è di
 * `cadence.test.ts`, che il disco venga toccato una volta e non ventiquattro è di questo file.
 */
describe('il salvataggio a cadenza', () => {
  const TICK = clock.ticksToMilliseconds(ticks(1))
  const EVERY = clock.ticksToMilliseconds(BALANCE.AUTOSAVE_EVERY)
  /** Il tetto del recupero, in millisecondi: la notte più lunga che il gioco riconosce. */
  const A_NIGHT = clock.ticksToMilliseconds(BALANCE.RECOVERY_CAP)

  /** Fa passare del tempo davvero, frame per frame, come farebbe il browser. */
  const run = (elapsed: number): void => {
    stage.advance(elapsed)
    stage.frame()
  }

  /**
   * Lascia atterrare la scrittura in volo. `writeAtCadence` azzera `writing` in un `finally`, cioè
   * in un microtask: senza aspettarlo, la cadenza successiva troverebbe una scrittura ancora in
   * volo e salterebbe il giro. Nel gioco non succede — fra due cadenze passano trenta secondi
   * veri — e qui succederebbe sempre, perché passano zero millisecondi.
   */
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

  it('non scrive niente prima della cadenza, e alla cadenza scaduta scrive una volta', async () => {
    await start()
    stage.frame()

    run(EVERY - TICK)
    expect(stage.written()).toHaveLength(0)

    run(TICK)
    expect(stage.written()).toHaveLength(1)
  })

  it('scrive una volta per cadenza, non una per frame', async () => {
    await start()
    stage.frame()

    run(EVERY)
    await settle()
    run(EVERY)
    await settle()
    run(EVERY)
    await settle()

    expect(stage.written()).toHaveLength(3)
  })

  it('e fa avanzare l’istante che la schermata Statistiche mostra, senza che nessuno chiuda', async () => {
    // È la spia di questa delega: `savedAt` è già a schermo sotto «Ultimo salvataggio», e prima di
    // D041 poteva muoversi solo caricando o chiudendo.
    const store = await start({ savedAt: SAVED_AT })
    stage.frame()
    expect(store.savedAt).toBeNull()

    run(EVERY)
    await settle()

    expect(store.savedAt).toBe(SAVED_AT)
  })

  it('un recupero al tetto pieno produce UNA scrittura, non una per soglia attraversata', async () => {
    // Il recupero fa passare 7.300 tick in un colpo: a trecento tick di cadenza sono ventiquattro
    // soglie. È il test che giustifica la coalizione — senza, sarebbero ventiquattro round-trip IPC
    // dentro il caricamento, cioè il tempo di avvio che il tetto di recupero esiste per proteggere.
    await start({ load: found(freshPayload(), SAVED_AT), wallClock: SAVED_AT + A_NIGHT })

    // Il primo frame ha delta zero e non chiama `onStep`: il dovuto resta lì e aspetta.
    stage.frame()
    expect(stage.written()).toHaveLength(0)

    run(TICK)
    expect(stage.written()).toHaveLength(1)
  })

  it('una partita nuova riparte da zero, invece di ereditare il conto di quella buttata via', async () => {
    const store = await start()
    stage.frame()

    // Un tick dalla scadenza.
    run(EVERY - TICK)
    expect(stage.written()).toHaveLength(0)

    await store.newGame()
    stage.frame()

    // Il tick che avrebbe fatto scattare la cadenza vecchia: adesso non fa scattare niente.
    run(TICK)
    expect(stage.written()).toHaveLength(0)
  })

  it('una scrittura a cadenza che fallisce non interrompe la partita', async () => {
    // La differenza con `close()` non è incoerenza: là una scrittura mancata **ha** perso qualcosa,
    // perché la finestra sta chiudendo e quella è l'unica copia. Qui la partita è in memoria e la
    // chiusura riproverà comunque, quindi interromperla sarebbe il contrario di ciò che INV-17
    // protegge. Il sintomo è `savedAt` che non avanza.
    const store = await start({
      save: () =>
        Promise.resolve({ ok: false, error: { code: 'error.save.io', cause: 'disco pieno' } })
    })
    stage.frame()

    run(EVERY)
    await settle()

    expect(store.status).toBe('playing')
    expect(store.failure).toBeNull()
    expect(store.savedAt).toBeNull()
  })

  it('la chiusura aspetta la scrittura in volo, invece di affiancarle la propria', async () => {
    // Due scritture in volo insieme arrivano sul disco in un ordine che nessuno garantisce: il
    // `rename` atomico del main protegge dal file troncato, non dal payload più vecchio che vince
    // perché è arrivato secondo.
    const started: SavePayload[] = []

    // Il deferred si costruisce **prima**, e `release` nasce con una funzione dentro: assegnarla
    // solo dentro l'esecutore la farebbe restringere a `null` per il resto del test, che e' un
    // limite dell'analisi di flusso e non un difetto del test.
    let release = (): void => undefined
    const slowDisk = new Promise<SaveResult<number>>((resolve) => {
      release = () => resolve({ ok: true, value: SAVED_AT })
    })

    const store = await start({
      save: (payload): Promise<SaveResult<number>> => {
        started.push(payload)
        if (started.length > 1) return Promise.resolve({ ok: true, value: SAVED_AT })
        return slowDisk
      }
    })
    stage.frame()

    run(EVERY)
    expect(started).toHaveLength(1)

    const closing = store.close()
    await settle()

    // La scrittura della chiusura **non** è partita: sta aspettando la prima.
    expect(started).toHaveLength(1)
    expect(stage.isClosed()).toBe(false)

    release()
    await closing

    expect(started).toHaveLength(2)
    expect(stage.isClosed()).toBe(true)
  })

  it('e dopo la chiusura nessun frame scrive più, perché il loop è fermo', async () => {
    // È il meccanismo vero per cui non si scrive da uno stato che non è la partita vera: la guardia
    // di INV-17 in `writeAtCadence` esiste, ma nessuno stato raggiungibile la fa scattare — ci si
    // arriva solo da `onStep`, e `close()` ferma il loop prima di scrivere.
    const store = await start()
    stage.frame()
    await store.close()

    const written = stage.written().length
    expect(stage.frame()).toBe(false)

    run(EVERY)
    expect(stage.written()).toHaveLength(written)
  })
})

describe('il regime del reddito', () => {
  const fundCard = (amount: string): void => {
    game.ctx.ledger.transaction(income('card', fromString(amount), ZERO), {
      reason: 'reason.income.tick'
    })
  }

  const price = (): string => toString(BALANCE.INCOME_DECLARATION_PRICE_CARD)

  it('una partita nuova nasce in nero', async () => {
    const store = await start()

    expect(store.declared).toBe(false)
    expect(store.declarationPrices).toEqual(declarationPrices())
  })

  it('e il prezzo è **lo stesso oggetto**, non una copia proxata da Pinia', async () => {
    const store = await start()

    expect(store.declarationPrices[0]?.price).toBe(BALANCE.INCOME_DECLARATION_PRICE_CARD)
  })

  it('l’anteprima è per strumento: la carta si, i contanti mai', async () => {
    const store = await start()
    game.ctx.ledger.transaction(income('cash', fromString('99999'), ZERO), {
      reason: 'reason.income.tick'
    })

    expect(store.canDeclareWith('cash')).toBe(false)
    expect(store.canDeclareWith('card')).toBe(false)

    fundCard(price())
    expect(store.canDeclareWith('card')).toBe(true)
  })

  it('mettersi in regola cambia dove atterra lo stipendio, e il mirror se ne accorge', async () => {
    // Nessun evento annuncia un cambio di regime: se lo store non rileggesse, la pagina direbbe
    // «in nero» mentre i soldi arrivano gia sulla carta.
    const store = await start()
    fundCard(price())

    expect(store.declareIncome('card', store.card.code).ok).toBe(true)

    expect(store.declared).toBe(true)
    expect(store.canDeclareWith('card')).toBe(false)
  })

  it('e da li in avanti i contanti non si riempiono piu', async () => {
    const store = await start()
    fundCard(price())
    store.declareIncome('card', store.card.code)
    const cashBefore = toString(store.balances.cash)

    game.advance(clock.secondsToTicks(seconds(10)))

    expect(toString(store.balances.cash)).toBe(cashBefore)
    expect(store.balances.tax.isZero()).toBe(false)
  })

  it('quanto trattiene lo Stato è quello del regime, non un numero riscritto', async () => {
    const store = await start()

    expect(store.declaredWithholding).toBe(BALANCE.INCOME_TAX_RATE)
  })
})
