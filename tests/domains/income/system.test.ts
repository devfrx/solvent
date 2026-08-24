import { beforeEach, describe, expect, it } from 'vitest'

import type { Money } from '@core/contracts/money'
import { fromString, toString, ZERO } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import { POOL_IDS, POOLS } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'
import { createModifiers, type Modifiers } from '@core/balance/modifiers'
import { createBus } from '@core/kernel/Bus'
import { clock, ticks } from '@core/kernel/Clock'
import { createLedger, income, type Ledger } from '@core/kernel/Ledger'
import { createRegistry, ORDER, type SystemContext } from '@core/kernel/Registry'
import { createRng } from '@core/kernel/Rng'

import {
  INCOME_TARGET,
  MAX_LEVEL,
  SOURCES,
  levelPriceFor,
  yieldAt,
  type IncomeSource
} from '../../../src/core/domains/income/rules'
import { createIncome, type Income } from '../../../src/core/domains/income/system'
import type { IncomeSave, IncomeSourceId } from '../../../src/core/domains/income/types'

/**
 * Il sistema intero, con i pezzi veri: nessun mock del kernel (convenzioni.md). Ciò che si
 * verifica qui è l'orchestrazione — chi chiede a chi, in che ordine — perché il calcolo ha già i
 * suoi test in `rules.test.ts`.
 */

const ONE_SECOND = ticks(10)

/** La resa con cui la partita si apre: il lavoro al primo livello, i lavoretti chiusi. */
const AT_START = BALANCE.INCOME_JOB_BASE_PER_SECOND

const sourceOf = (id: IncomeSourceId): IncomeSource => {
  const found = SOURCES.find((each) => each.id === id)
  if (found === undefined) throw new Error(`nessuna fonte '${id}' nell’elenco`)
  return found
}

const job = sourceOf('job')
const gigs = sourceOf('gigs')

const save = (levels: Partial<Record<IncomeSourceId, number>>, declared = false): IncomeSave => ({
  levels: { job: levels.job ?? 0, gigs: levels.gigs ?? 0 },
  declared
})

let ledger: Ledger
let modifiers: Modifiers
let subject: Income
let ctx: SystemContext

/**
 * Quanto spazio c'e' nel pool in arrivo. E' la variabile che D017 mette in mano al reddito, e sta
 * qui perche' quasi tutti i casi di questo file vogliono che non morda: `null` e' "nessun tetto",
 * cioe' il comportamento di prima.
 */
let room: Money | null

/**
 * A quale pool il tick ha chiesto lo spazio, e **in quale momento**. Da D043 il pool dipende dal
 * regime; da D044 le domande sono più d'una per tick, e il momento in cui arrivano è la cosa che
 * questo file deve vedere.
 */
let askedRoomOf: Pool[]
/** Quanto c'era sulla carta al momento di ciascuna domanda: è ciò che data ogni domanda. */
let cardWhenAsked: string[]

const tick = (elapsed = ONE_SECOND): void => subject.system.tick?.(ctx, elapsed)

const fund = (pool: 'cash' | 'card', amount: string): void => {
  ledger.transaction(income(pool, fromString(amount), ZERO), { reason: 'reason.income.tick' })
}

const total = (): string =>
  toString(POOL_IDS.reduce((sum, pool) => sum.plus(ledger.balance(pool)), fromString('0')))

/** Compra un livello passando dal comando vero, con lo strumento che quella fonte chiede. */
const buy = (source: IncomeSource): boolean =>
  subject.buyLevel({ source, pool: source.levelPool }).ok

beforeEach(() => {
  const bus = createBus()
  ledger = createLedger(bus, () => null)
  modifiers = createModifiers()
  room = null
  askedRoomOf = []
  cardWhenAsked = []
  // Lo spazio finto risponde come quello vero: un tetto ce l'ha solo chi lo dichiara, e la carta
  // non lo dichiara (`POOLS`). Rispondere `room` a chiunque renderebbe verdi anche i casi in cui
  // il tick interroga il pool sbagliato, che è precisamente ciò che questi test devono vedere.
  subject = createIncome(ledger, modifiers, (pool) => {
    askedRoomOf.push(pool)
    cardWhenAsked.push(toString(ledger.balance('card')))
    return POOLS[pool].capacity === null ? null : room
  })
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

    expect(toString(ledger.balance('cash'))).toBe(toString(AT_START))
  })
})

describe('lo stato iniziale', () => {
  it('ha una voce per **ogni** fonte: un livels parziale darebbe un importo non finito', () => {
    expect(Object.keys(subject.state().levels).sort()).toEqual(
      SOURCES.map((each) => each.id).sort()
    )
  })

  it('apre la partita identica a prima di D044: il lavoro a uno, i lavoretti chiusi', () => {
    expect(subject.state()).toEqual(save({ job: 1 }))

    tick()

    expect(toString(ledger.balance('cash'))).toBe(toString(AT_START))
  })
})

describe('il tick', () => {
  it('accredita in contanti il reddito dichiarato', () => {
    tick()

    expect(toString(ledger.balance('cash'))).toBe(toString(AT_START))
  })

  it('conta i tick che gli passa il loop, non uno alla volta', () => {
    tick(ticks(30))

    const perTick = clock.perSecondToPerTick(AT_START)
    expect(toString(ledger.balance('cash'))).toBe(toString(perTick.mul(30)))
  })

  it('il denaro esce da world: la somma di tutti i conti resta zero', () => {
    tick()

    expect(toString(ledger.balance('world'))).toBe(toString(AT_START.neg()))
    expect(total()).toBe('0')
  })

  it('con una seconda fonte aperta somma le due', () => {
    subject.system.load(save({ job: 1, gigs: 1 }))

    tick()

    expect(toString(ledger.balance('cash'))).toBe(
      toString(AT_START.plus(BALANCE.INCOME_GIGS_BASE_PER_SECOND))
    )
  })

  it('e con un livello comprato rende quello che la scala dice', () => {
    fund('card', '100000')
    expect(buy(job)).toBe(true)

    tick()

    expect(toString(ledger.balance('cash'))).toBe(toString(yieldAt(job, 2)))
  })

  it('un mult su income.all vale, ed è il gancio che l’albero delle abilità userà', () => {
    modifiers.register({
      id: 'test.mult',
      target: INCOME_TARGET,
      kind: 'mult',
      value: fromString('2')
    })

    tick()

    expect(toString(ledger.balance('cash'))).toBe(toString(AT_START.mul(2)))
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
    expect(toString(subject.blocked())).toBe(toString(AT_START))
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
    expect(toString(subject.blocked())).toBe('8')
    expect(total()).toBe('0')
  })

  it('e con lo spazio che avanza incassa tutto, senza fermare niente', () => {
    room = fromString('99999')

    tick()

    expect(toString(ledger.balance('cash'))).toBe(toString(AT_START))
    expect(toString(subject.blocked())).toBe('0')
  })

  it('quello che resta fuori descrive l’ultimo tick, non la partita', () => {
    room = ZERO
    tick()
    expect(toString(subject.blocked())).toBe(toString(AT_START))

    room = null
    tick()

    expect(toString(subject.blocked())).toBe('0')
  })

  it('e un caricamento lo azzera: l’ultimo tick era di un’altra sessione', () => {
    room = ZERO
    tick()

    subject.system.load(save({ job: 1 }))

    expect(toString(subject.blocked())).toBe('0')
  })

  it('lo stesso vale per un azzeramento', () => {
    room = ZERO
    tick()

    subject.system.reset('hard')

    expect(toString(subject.blocked())).toBe('0')
  })
})

describe('due regimi nello stesso tick', () => {
  /** Il lavoro in regola sulla carta, i lavoretti in nero nei contanti: i due regimi insieme. */
  const both = (): void => subject.system.load(save({ job: 1, gigs: 1 }, true))

  it('producono **due** transazioni, una per regime', () => {
    both()
    const reasons: string[] = []
    ctx.bus.on('money.posted', (posted) => reasons.push(posted.transaction.reason))

    tick()

    expect(reasons).toEqual(['reason.income.tick', 'reason.income.tick'])
  })

  it('e ciascuna atterra dove il regime della sua fonte dice', () => {
    both()

    tick()

    const gross = BALANCE.INCOME_JOB_BASE_PER_SECOND
    const taxed = gross.mul(BALANCE.INCOME_TAX_RATE)
    expect(toString(ledger.balance('card'))).toBe(toString(gross.minus(taxed)))
    expect(toString(ledger.balance('cash'))).toBe(toString(BALANCE.INCOME_GIGS_BASE_PER_SECOND))
    expect(toString(ledger.balance('tax'))).toBe(toString(taxed))
  })

  it('e la somma di tutti i conti resta zero — INV-08', () => {
    both()

    tick(ticks(37))

    expect(total()).toBe('0')
  })

  it('la trattenuta è entrato × tasso, non una divisione su un parziale', () => {
    // È la trappola di D044: con una transazione sola per due regimi la trattenuta andrebbe
    // scalata sul parziale, cioè divisa fra `Decimal` — precisione che se ne va, INV-08 che si
    // rompe in silenzio. Trentasette tick sono un numero che non divide bene apposta.
    both()

    tick(ticks(37))

    const gross = clock.perSecondToPerTick(BALANCE.INCOME_JOB_BASE_PER_SECOND).mul(37)
    expect(toString(ledger.balance('tax'))).toBe(toString(gross.mul(BALANCE.INCOME_TAX_RATE)))
  })

  it('lo spazio si chiede **prima di ciascuna**, non una volta per tick', () => {
    // Il modo di vederlo senza due regimi sullo stesso pool: la seconda domanda arriva quando la
    // prima transazione è **già** passata, e il saldo della carta lo data. Chiesto una volta sola
    // in cima al tick, la seconda osservazione direbbe ancora zero.
    both()

    tick()

    expect(askedRoomOf).toEqual(['card', 'cash'])
    expect(cardWhenAsked[0]).toBe('0')
    expect(cardWhenAsked[1]).not.toBe('0')
  })

  it('una fonte in nero si ferma a caveau pieno, e quella in regola no', () => {
    both()
    room = ZERO

    tick()

    expect(toString(ledger.balance('cash'))).toBe('0')
    expect(ledger.balance('card').isZero()).toBe(false)
    expect(toString(subject.blocked())).toBe(toString(BALANCE.INCOME_GIGS_BASE_PER_SECOND))
  })
})

describe('salvare e ricaricare', () => {
  const earnedInOneSecond = (target: Income): string => {
    const before = ledger.balance('cash')
    target.system.tick?.(ctx, ONE_SECOND)
    return toString(ledger.balance('cash').minus(before))
  }

  it('riproduce lo stesso reddito per tick, livelli compresi', () => {
    fund('card', '100000')
    buy(job)
    const saved: IncomeSave = subject.system.save()
    const expected = earnedInOneSecond(subject)

    const reloaded = createIncome(ledger, createModifiers(), () => room)
    reloaded.system.load(saved)

    expect(earnedInOneSecond(reloaded)).toBe(expected)
  })

  it('caricare due volte di fila resta lecito', () => {
    const saved = save({ job: 2, gigs: 1 })

    subject.system.load(saved)

    expect(() => subject.system.load(saved)).not.toThrow()
  })

  it('non adotta le chiavi che non conosce: si ricostruisce fonte per fonte', () => {
    // Copiare `levels` intero porterebbe dentro le chiavi sconosciute, che al primo `save` si
    // salverebbero da sole — cioè spazzatura che diventa parte del formato senza che nessuno lo
    // decida.
    subject.system.load({ levels: { job: 1, gigs: 0, ghost: 4 }, declared: false } as IncomeSave)

    expect(subject.system.save()).toEqual(save({ job: 1 }))
  })

  it('uno stato salvato manomesso è un esito, non un declassamento in silenzio', () => {
    const registry = createRegistry()
    registry.register(subject.system)

    const loaded = registry.loadAll({ income: { levels: 'sì', declared: false } })

    expect(loaded.ok).toBe(false)
    if (loaded.ok) return
    expect(loaded.error.code).toBe('error.registry.load_failed')
    expect(loaded.error.id).toBe('income')
  })
})

describe('un salvataggio della versione 2 manomesso — INV-20', () => {
  const rejects = (state: unknown): void => {
    expect(() => subject.system.load(state as IncomeSave)).toThrow(TypeError)
  }

  it('rifiuta un livello frazionario', () => {
    rejects({ levels: { job: 1.5, gigs: 0 }, declared: false })
  })

  it('rifiuta un livello negativo', () => {
    rejects({ levels: { job: -1, gigs: 0 }, declared: false })
  })

  it('rifiuta un livello oltre la scala', () => {
    rejects({ levels: { job: MAX_LEVEL + 1, gigs: 0 }, declared: false })
  })

  it('rifiuta una fonte **mancante**: è spazzatura, non un valore predefinito', () => {
    // Un livello assente diventerebbe `undefined`, e da lì un importo non finito che il Ledger
    // scopre molto più a valle: lontano da dove è nato, e senza più niente da cui risalire.
    rejects({ levels: { job: 1 }, declared: false })
  })

  it('rifiuta un livello che non è nemmeno un numero', () => {
    rejects({ levels: { job: 1, gigs: 'tre' }, declared: false })
  })

  it('rifiuta un `declared` che non è un booleano', () => {
    rejects({ levels: { job: 1, gigs: 0 }, declared: 'sì' })
  })

  it('rifiuta un salvataggio della versione 1: qui non arriva mai già migrato', () => {
    // La forma vecchia — `{ upgraded, declared }` — non ha `levels`. Se arriva fin qui vuol dire
    // che la migrazione non è passata, e accettarla vorrebbe dire aprire una partita a zero.
    rejects({ upgraded: true, declared: false })
  })
})

describe('azzerare', () => {
  it('riporta il reddito al valore iniziale, livelli inclusi', () => {
    fund('card', '100000')
    buy(job)

    subject.system.reset('hard')
    tick()

    expect(toString(ledger.balance('cash'))).toBe(toString(AT_START))
    expect(subject.system.save()).toEqual(save({ job: 1 }))
  })

  it('non tocca il registro dei modificatori: dentro il dominio non vi registra più nessuno', () => {
    // Il `mult` dell'upgrade era l'unica registrazione di tutto il gioco, e da D044 non c'è più: i
    // livelli sono aritmetica pura sullo stato. Ciò che altri hanno registrato resta dov'era.
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

describe('il regime (ADR 0052)', () => {
  const declare = (): void => subject.system.load(save({ job: 1 }, true))

  it('in nero atterra nei contanti, non trattiene niente e non tocca il conto dello Stato', () => {
    tick()

    expect(askedRoomOf).toEqual(['cash'])
    expect(toString(ledger.balance('cash'))).toBe(toString(AT_START))
    expect(ledger.balance('tax').isZero()).toBe(true)
  })

  it('in regola atterra sulla carta, al netto della parte dello Stato', () => {
    declare()

    tick()

    const withheld = AT_START.mul(BALANCE.INCOME_TAX_RATE)
    expect(toString(ledger.balance('card'))).toBe(toString(AT_START.minus(withheld)))
    expect(toString(ledger.balance('tax'))).toBe(toString(withheld))
    expect(ledger.balance('cash').isZero()).toBe(true)
    expect(total()).toBe('0')
  })

  it('in regola chiede lo spazio alla carta, non ai contanti', () => {
    declare()

    tick()

    expect(askedRoomOf).toEqual(['card'])
  })

  it('in regola il muro del caveau non riguarda più il lavoro, nemmeno a spazio zero', () => {
    declare()
    room = ZERO

    tick()

    expect(subject.blocked().isZero()).toBe(true)
    expect(ledger.balance('card').isZero()).toBe(false)
  })

  it('ma i lavoretti restano in nero: la dichiarazione non li riguarda', () => {
    subject.system.load(save({ job: 0, gigs: 1 }, true))

    tick()

    expect(askedRoomOf).toEqual(['cash'])
    expect(toString(ledger.balance('cash'))).toBe(toString(BALANCE.INCOME_GIGS_BASE_PER_SECOND))
  })

  it('mettersi in regola non cancella i livelli comprati', () => {
    subject.system.load(save({ job: 3, gigs: 2 }))
    fund('card', toString(levelPriceFor(job, 3, 'card')?.price ?? ZERO))
    expect(subject.declare('card').ok).toBe(false)

    fund('card', '100000')
    expect(subject.declare('card').ok).toBe(true)
    expect(subject.state().levels).toEqual({ job: 3, gigs: 2 })
  })

  it('azzerare riporta in nero', () => {
    declare()

    subject.system.reset('hard')
    tick()

    expect(askedRoomOf).toEqual(['cash'])
  })

  it('il regime sopravvive a un giro di salvataggio', () => {
    declare()

    subject.system.load(subject.system.save())
    tick()

    expect(askedRoomOf).toEqual(['card'])
  })
})

describe('in cima al plateau', () => {
  it('comprare è un esito rifiutato, non un pulsante spento', () => {
    subject.system.load(save({ job: MAX_LEVEL, gigs: MAX_LEVEL }))
    fund('card', '100000000')

    const bought = subject.buyLevel({ source: job, pool: 'card' })

    expect(bought).toEqual({ ok: false, error: { code: 'error.income.max_level' } })
  })

  it('e vale per **entrambe** le fonti', () => {
    subject.system.load(save({ job: MAX_LEVEL, gigs: MAX_LEVEL }))

    expect(subject.buyLevel({ source: gigs, pool: 'cash' }).ok).toBe(false)
  })
})
