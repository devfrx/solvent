import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { toRaw } from 'vue'

import type { Balances } from '@core/contracts/ledger'
import { fromString, toString } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import type { LoadedSave, SavePayload, SaveResult } from '@core/contracts/save'

import { BALANCE } from '@core/balance/constants'
import { upgradePrices } from '@core/domains/income/rules'
import { capacityFor, expansionPrices, MAX_LEVEL } from '@core/domains/vault/rules'
import { clock, ticks } from '@core/kernel/Clock'
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

    const matured = BALANCE.INCOME_BASE_PER_SECOND.div(10).mul(BALANCE.RECOVERY_CAP)
    const wall = capacityFor(0)

    expect(store.status).toBe('playing')
    expect(toString(game.ctx.ledger.balance('cash'))).not.toBe('0')
    expect(toString(game.ctx.ledger.balance('cash'))).toBe(toString(wall))
    expect(toString(store.incomeWithheld)).toBe(toString(matured.minus(wall)))
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

  it('una notte a finestra nascosta vale **un** campione, non uno per intervallo trascorso', async () => {
    // È il caso che il grafico deve dire invece di nascondere: di saldi ne esiste uno solo,
    // perché il reddito arretrato entra in una transazione sola. Millecinquecento barre finte
    // sarebbero millecinquecento numeri che nessuno ha mai avuto.
    const store = await start()
    stage.frame()

    stage.setVisible(false)
    stage.setVisible(true)
    run(A_NIGHT)

    expect(store.netWorthSeries.items).toHaveLength(1)
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
    game.ctx.ledger.transaction(income(pool, fromString(amount)), { reason: 'reason.income.tick' })
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
    expect(store.expandVault('card').ok).toBe(true)

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
    game.ctx.ledger.transaction(income('card', fromString(amount)), {
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
    game.ctx.ledger.transaction(income('cash', fromString('5000')), {
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
    game.ctx.ledger.transaction(income('cash', fromString('5000')), {
      reason: 'reason.income.tick'
    })

    const bought = store.buyUpgrade('cash')

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

    expect(store.buyUpgrade('card').ok).toBe(true)

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
    store.buyUpgrade('card')

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
    const foreseen = store.canBuyUpgradeWith('card')
    const actual = store.buyUpgrade('card')
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
  it('i tassi sono quelli del dominio, non i numeri copiati dal canvas', async () => {
    const store = await start()

    expect(toString(store.atmFeeRates.deposit)).toBe(toString(BALANCE.ATM_FEE_RATE_IN))
    expect(toString(store.atmFeeRates.withdraw)).toBe(toString(BALANCE.ATM_FEE_RATE_OUT))
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
    expect(store.cashCapacity).toBe(capacityFor(0))
    expect(store.cardCapacity).toBeNull()
  })
})

describe('i selettori del caveau', () => {
  const fund = (pool: Pool, amount: string): void => {
    game.ctx.ledger.transaction(income(pool, fromString(amount)), {
      reason: 'reason.income.tick'
    })
  }

  it('il listino è quello del dominio, e ha due voci: è il primo del gioco', async () => {
    const store = await start()

    expect(store.expansionPrices).toEqual(expansionPrices(0))
    expect(store.expansionPrices).toHaveLength(2)
  })

  it('il livello si conta come lo conta il giocatore, e i livelli finiscono', async () => {
    const store = await start()

    expect(store.vaultProgress).toEqual({ level: 1, total: MAX_LEVEL + 1 })
  })

  it('lo spazio libero è il tetto meno quello che c’è', async () => {
    const store = await start()
    fund('cash', '400')

    expect(toString(store.vaultRoom ?? fromString('-1'))).toBe(
      toString(capacityFor(0).minus(fromString('400')))
    )
  })

  it('e la barra è una percentuale già pronta, perché un .vue non calcola', async () => {
    const store = await start()
    expect(store.vaultFill).toBe('0%')

    fund('cash', toString(capacityFor(0).div(2)))

    expect(store.vaultFill).toBe('50%')
  })

  it('ampliare sposta il tetto, e lo store se ne accorge: nessun evento lo annuncia', async () => {
    // La trappola dei mirror, nella sua versione più cara: ampliare **non è** un movimento
    // economico, quindi il Bus tace. Fino a D017 `cashCapacity` era letto una volta sola alla
    // costruzione, ed era corretto perché il numero non si muoveva mai.
    const store = await start()
    fund('cash', toString(capacityFor(0)))

    expect(store.expandVault('cash').ok).toBe(true)

    expect(store.vaultProgress.level).toBe(2)
    expect(store.cashCapacity).toBe(capacityFor(1))
    expect(store.cashCapacity).toBe(game.ctx.ledger.capacities('cash'))
    expect(store.expansionPrices).toEqual(expansionPrices(1))
  })

  it('e l’anteprima per strumento dice quello che il comando poi fa', async () => {
    const store = await start()

    expect(store.canExpandWith('cash')).toBe(false)
    expect(store.canExpandWith('card')).toBe(false)

    fund('card', toString(capacityFor(0)))

    expect(store.canExpandWith('cash')).toBe(false)
    expect(store.canExpandWith('card')).toBe(true)
    expect(store.expandVault('card').ok).toBe(true)
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

    fund('cash', toString(capacityFor(0)))

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

  it('il caveau ampliato attraversa il salvataggio', async () => {
    const played = createGame(SEED)
    played.ctx.ledger.transaction(income('cash', capacityFor(0)), {
      reason: 'reason.income.tick'
    })
    expect(played.vault.expand('cash').ok).toBe(true)

    const store = await start({ load: found(played.save(), SAVED_AT), wallClock: SAVED_AT })

    expect(store.vaultProgress.level).toBe(2)
    expect(store.cashCapacity).toBe(capacityFor(1))
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

    expect(store.buyUpgrade('card').ok).toBe(true)
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
    store.buyUpgrade('card')
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
