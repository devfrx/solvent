import type { Money } from '@core/contracts/money'
import { ZERO } from '@core/contracts/money'
import type { PaymentOption, PriceList } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'
import type { ModifierTarget, Modifiers } from '@core/balance/modifiers'
import type { Clock, Ticks } from '@core/kernel/Clock'

import type { IncomeSourceId, IncomeState } from './types'

/**
 * Le regole del reddito. Tutte pure: nessun contesto, nessun effetto, nessuna lettura dell'ora.
 *
 * Anche il `Clock` arriva per argomento, e non è pignoleria: da `kernel/` questo file importa
 * **solo tipi**, il che è ciò che gli permette di essere chiamato da un test di bilanciamento e
 * dalla UI con la stessa facilità con cui lo chiama il sistema. Il Clock non ha stato — converte
 * e basta (ADR 0009) — quindi passarlo non porta dentro niente.
 *
 * **Da [D044](../../../../docs/delega/D044-il-reddito-e-un-elenco-di-fonti.md) il reddito è un
 * elenco di fonti con una scala finita**, e la forma è quella del caveau (D042): la scala si
 * calcola una volta all'avvio del modulo, il livello si stringe fra zero e il massimo, e il
 * listino diventa **vuoto** in cima invece di rispondere con un ramo.
 */

/** Il bersaglio su cui agisce ogni modificatore del reddito, da qualunque dominio arrivi. */
export const INCOME_TARGET: ModifierTarget = 'income.all'

/**
 * ADR 0052 — **il regime di una fonte di guadagno**: dove atterra ciò che produce, e quale
 * frazione ne viene trattenuta lungo la strada.
 *
 * Le due cose stanno insieme perché non si scelgono separatamente: un pool senza tetto che non
 * trattiene niente domina sempre, e la legge della non dominanza cadrebbe al primo confronto.
 *
 * `withholdingRate` è una **frazione**, non un importo — il nome lo dice perché l'unità di un
 * `Money` non lo dice.
 */
export interface Regime {
  readonly pool: Pool
  readonly withholdingRate: Money
}

/**
 * I due regimi, dichiarati come **dati**.
 *
 * È la forma che i pool usano già per sé stessi (ADR 0017): un `if (declared) pool = 'card'`
 * dentro il tick sarebbe un ramo sul nome di un pool, cioè precisamente ciò che quell'ADR ha tolto
 * dal progetto una volta. Qui il tick legge un regime e non nomina nessuno strumento.
 *
 * **In nero**: contanti, anonimi, niente trattenute — e il tetto del caveau, che è il prezzo.
 * **In regola**: la carta, che non ha tetto, e la parte dello Stato.
 *
 * Sono due **costanti di modulo**, e da D044 l'identità conta: il tick raggruppa le fonti per
 * regime, e a raggruppare è l'oggetto stesso. Costruirne uno nuovo a ogni chiamata farebbe due
 * gruppi dove ce n'è uno, cioè due transazioni identiche dove ne basta una.
 */
const UNDECLARED: Regime = { pool: 'cash', withholdingRate: ZERO }
const DECLARED: Regime = { pool: 'card', withholdingRate: BALANCE.INCOME_TAX_RATE }

/**
 * L'ultimo livello, che è anche «di quanti» il giocatore vede scritto accanto al proprio. Si conta
 * come quello del caveau: il livello zero è una fonte chiusa, e fa parte della scala.
 */
export const MAX_LEVEL: number = BALANCE.INCOME_LEVELS - 1

/**
 * Il livello stretto fra zero e il massimo. Un livello fuori scala arriva da un salvataggio, cioè
 * da fuori, e una resa `undefined` diventerebbe un importo non finito che il Ledger scopre molto
 * più a valle.
 */
const withinScale = (level: number): number => Math.min(Math.max(level, 0), MAX_LEVEL)

/**
 * La scala delle rese di una fonte, **calcolata una volta sola** all'avvio del modulo: zero al
 * livello zero, la resa base al livello uno, e da lì il fattore di crescita a ogni gradino.
 *
 * Resta una **lista** anche se nasce da una formula, e per la ragione del caveau: è ciò che
 * permette al listino di rispondere «non si può» con una lista vuota invece che con un ramo.
 */
const yieldsOf = (basePerSecond: Money): readonly Money[] =>
  [...Array(BALANCE.INCOME_LEVELS).keys()].map((level) =>
    level === 0 ? ZERO : basePerSecond.times(BALANCE.INCOME_LEVEL_GROWTH.pow(level - 1))
  )

/**
 * I prezzi dei livelli, uno per ogni livello **da cui si parte**: dall'ultimo non si va da nessuna
 * parte, e a dirlo è la lunghezza di questa lista invece di un `if`.
 *
 * **INV-28 · [ADR 0053](../../../../docs/adr/0053-un-miglioramento-dichiara-il-tempo-in-cui-rientra.md)
 * — il prezzo non si dichiara, si calcola**: è l'incremento di resa che quel livello compra, per i
 * secondi di rientro dichiarati. Ne discende che ogni livello di ogni fonte si ripaga nello stesso
 * tempo, per costruzione e non per taratura: non ci sono due curve da tenere allineate, perché la
 * seconda non esiste.
 *
 * **Aprire una fonte costa più del livello successivo**, e non è un difetto: aprirla dà tutta la
 * resa base, il livello dopo dà solo l'incremento. Per euro di reddito comprato il prezzo è
 * identico — è la regola vista da vicino.
 *
 * Si calcola una volta sola, e vale la ragione di INV-19: la UI legge un prezzo prima di mostrarlo
 * e il comando lo rilegge prima di pagarlo, e devono essere **lo stesso oggetto**, non due valori
 * uguali.
 */
const pricesOf = (yields: readonly Money[]): readonly Money[] =>
  yields
    .slice(1)
    .map((reached, from) =>
      reached.minus(yields[from] ?? ZERO).times(BALANCE.INCOME_PAYBACK_SECONDS)
    )

/**
 * Una fonte di reddito: cosa rende, dove atterra ciò che produce, e con che cosa si comprano i suoi
 * livelli.
 *
 * **Dichiara due regimi**, ed è la regola 1 dell'ADR 0052 applicata per la prima volta a più di
 * una fonte: quello di base, e quello che vale se il giocatore si è messo in regola — oppure
 * `null`, che significa «questa fonte in regola non ci va». La lettura ovvia sarebbe che mettersi
 * in regola sia una proprietà della fonte, e sarebbe sbagliata: è lo stato di una **persona**, e
 * la fonte dichiara soltanto cosa le succede quando quello stato cambia.
 */
export interface IncomeSource {
  readonly id: IncomeSourceId
  /** Dove atterra ciò che produce finché il giocatore non si è messo in regola. */
  readonly base: Regime
  /** Dove atterra quando il giocatore si è messo in regola, `null` se la cosa non la riguarda. */
  readonly declared: Regime | null
  /** Con quale strumento si comprano i suoi livelli. Uno solo: il listino è a una voce. */
  readonly levelPool: Pool
  /** La scala delle rese, un valore per livello. Non si legge da fuori: si passa da `yieldAt`. */
  readonly yields: readonly Money[]
  /** I prezzi, uno per livello di partenza. Non si legge da fuori: si passa da `levelPrices`. */
  readonly prices: readonly Money[]
}

const source = (
  id: IncomeSourceId,
  basePerSecond: Money,
  declared: Regime | null,
  levelPool: Pool
): IncomeSource => {
  const yields = yieldsOf(basePerSecond)
  return { id, base: UNDECLARED, declared, levelPool, yields, prices: pricesOf(yields) }
}

/**
 * L'elenco delle fonti, **dichiarato e fisso**. Nessuna cifra qui dentro: le rese arrivano da
 * `BALANCE`, perché R04 vieta un importo di gioco dentro un dominio e
 * `domains-no-money-literals` lo fa rispettare.
 *
 * **Due, e non «una manciata».** Le nove voci dell'etichetta danno quattro monete con cui una
 * fonte può pagare — liquidità, tracciabilità, varianza, attenzione — e il reddito dichiara
 * varianza zero e l'attenzione più bassa del gioco, che deve mantenere. Restano liquidità e
 * tracciabilità, cioè l'asse contanti contro carta: regge due fonti, non tre (D044, decisione 3).
 *
 * **I lavoretti dichiarano `null` per costruzione**: sono pagati a mano, e nessun atto burocratico
 * li rende tracciabili. Ne discende che i loro livelli si pagano in contanti — cioè sotto il muro
 * del caveau, una seconda volta dopo quello che il muro fa a ciò che incassano.
 */
export const SOURCES: readonly IncomeSource[] = [
  source('job', BALANCE.INCOME_JOB_BASE_PER_SECOND, DECLARED, 'card'),
  source('gigs', BALANCE.INCOME_GIGS_BASE_PER_SECOND, null, 'cash')
]

/** Il livello a cui sta una fonte. Zero è chiusa. */
export const levelOf = (state: IncomeState, from: IncomeSource): number => state.levels[from.id]

/** Se da qui non si va più da nessuna parte per quella fonte. */
export const isMaxLevel = (state: IncomeState, from: IncomeSource): boolean =>
  levelOf(state, from) >= MAX_LEVEL

/**
 * Quanto rende una fonte a un certo livello, **al secondo**: zero al livello zero, la resa base al
 * livello uno, e il fattore di crescita a ogni gradino successivo.
 */
export const yieldAt = (from: IncomeSource, level: number): Money =>
  from.yields[withinScale(level)] ?? ZERO

/**
 * **Il plateau**: quanto rende il gioco con tutte le fonti all'ultimo livello. È il tetto del
 * reddito attivo, ed è **calcolato** — non scritto.
 *
 * È la legge 6 della visione in un numero: _«il reddito attivo ha un tetto; il capitale no»_. Oltre
 * questa cifra il denaro non compra più reddito attivo, perché i listini sono vuoti — che è la
 * stessa saturazione del caveau in cima alla sua scala. Una scala finita **è** una saturazione, e
 * una saturazione dichiarata è la fine di una scala.
 *
 * A tenerlo onesto è `income_plateau`, con un intervallo stretto: un livello in più o in meno, o
 * un fattore di crescita diverso, ci cadono fuori.
 */
export const INCOME_PLATEAU: Money = SOURCES.reduce(
  (total, each) => total.plus(yieldAt(each, MAX_LEVEL)),
  ZERO
)

/**
 * Il regime che vale per una fonte, dato lo stato. Due argomenti e non uno: da D044 «dove atterrano
 * i soldi» non è una proprietà del dominio ma della **fonte**, e il booleano del giocatore dice
 * soltanto quale delle due dichiarazioni della fonte leggere.
 *
 * Una fonte che in regola non ci va — i lavoretti — resta sul proprio regime di base, e a dirlo è
 * il `null` invece di un `if` sul suo id.
 */
export const regimeOf = (from: IncomeSource, state: IncomeState): Regime =>
  (state.declared ? from.declared : null) ?? from.base

/**
 * Quanto rende **ogni regime** al secondo, modificatori inclusi.
 *
 * È la funzione da cui discendono tutte le altre, e raggruppa **per regime e non per pool**: due
 * regimi possono condividere un pool con trattenute diverse, e allora la trattenuta di una
 * transazione sola andrebbe scalata sul parziale — cioè una divisione fra `Decimal`, cioè
 * precisione che se ne va e INV-08 che si rompe in silenzio. Raggruppando per regime la trattenuta
 * resta `entrato × tasso`.
 *
 * **I modificatori si compongono per regime, e vale la pena dire perché.** La composizione avviene
 * sulla base al secondo e la conversione a tick viene **dopo**, che è l'ordine di sempre: al
 * contrario, un `add` di 8 verrebbe letto come «8 per tick» e varrebbe dieci volte tanto. Comporre
 * qui, dentro il gruppo, invece che sulla somma di tutti i gruppi è ciò che permette al tick di non
 * dividere niente per ripartire il totale. Per un `mult` — l'unico tipo che qualcuno registri oggi
 * su `income.all` — i due risultati sono identici, perché moltiplicare è distributivo. Per un `add`
 * no: si sommerebbe a **ogni** regime. È la riga da rileggere il giorno in cui `income.all`
 * guadagna il suo primo cliente vero, che sarà l'albero delle abilità.
 */
export interface RegimeIncome {
  readonly regime: Regime
  readonly amount: Money
}

export const incomeByRegime = (
  state: IncomeState,
  modifiers: Modifiers
): readonly RegimeIncome[] => {
  const bases = new Map<Regime, Money>()
  for (const each of SOURCES) {
    const regime = regimeOf(each, state)
    bases.set(regime, (bases.get(regime) ?? ZERO).plus(yieldAt(each, levelOf(state, each))))
  }
  return [...bases].map(([regime, base]) => ({
    regime,
    amount: modifiers.compose(INCOME_TARGET, base)
  }))
}

/**
 * Il reddito **al secondo**, tutte le fonti insieme. È anche il numero che la UI mostra
 * (`+ 12,00 € / s`), quindi la UI non lo ricalcola.
 *
 * Somma ciò che `incomeByRegime` ha già composto invece di comporre una seconda volta: due letture
 * che devono coincidere prima o poi divergono, e qui la prima è quella che il Ledger applica.
 */
export const incomePerSecond = (state: IncomeState, modifiers: Modifiers): Money =>
  incomeByRegime(state, modifiers).reduce((total, each) => total.plus(each.amount), ZERO)

/**
 * Quanto si guadagna in `elapsed` tick, **per regime**. Quanti tick stanno in un secondo lo sa solo
 * il Clock (R04).
 */
export const incomeOver = (
  clock: Clock,
  state: IncomeState,
  modifiers: Modifiers,
  elapsed: Ticks
): readonly RegimeIncome[] =>
  incomeByRegime(state, modifiers).map((each) => ({
    regime: each.regime,
    amount: clock.perSecondToPerTick(each.amount).mul(elapsed)
  }))

/**
 * Il listino di un livello: con quale strumento si compra il gradino successivo, e a quanto
 * (ADR 0027). Una voce sola per fonte, e va bene così: un listino di uno non è un caso speciale.
 *
 * All'ultimo livello è **vuoto**, e non è un caso limite trattato a parte: i prezzi hanno un
 * elemento in meno della scala, quindi l'indice cade fuori da solo. Chi legge non trova un ramo che
 * distingue «si può» da «non si può» — trova una lista, e una lista vuota è una risposta.
 *
 * **Che si svuoti perché la scala è finita è ciò che rende `accepts` per livello corretto qui**,
 * mentre in D043 sarebbe stato sbagliato: un listino che si svuota perché «l'hai già comprato»
 * renderebbe `accepts` dipendente da un booleano, cioè renderebbe variabile ciò che il Ledger deve
 * poter sapere prima di guardare una partita.
 */
export const levelPrices = (from: IncomeSource, level: number): PriceList => {
  const price = from.prices[level]
  return price === undefined ? [] : [{ pool: from.levelPool, price }]
}

/**
 * L'opzione del listino per uno strumento, `null` se il listino non lo offre — o se il listino non
 * c'è più. La UI la chiama prima di mostrare un prezzo, il comando prima di pagarlo, e leggono lo
 * **stesso** posto (INV-19).
 */
export const levelPriceFor = (
  from: IncomeSource,
  level: number,
  pool: Pool
): PaymentOption | null => levelPrices(from, level).find((option) => option.pool === pool) ?? null

/**
 * L'anteprima del pulsante: comprabile se non si è già all'ultimo livello e se quello strumento
 * basta. Il prezzo arriva **per argomento**, dentro l'opzione, e l'opzione viene dal listino: se
 * questa funzione se lo ripescasse da sola sarebbe una seconda lettura da tenere allineata a quella
 * del comando, che è ciò che INV-19 vieta.
 *
 * A decidere resta il Ledger quando il comando esegue: qui si risponde alla UI, che vuole saperlo
 * **prima** di smorzare un pulsante — non di spegnerlo (INV-21).
 */
export const canBuyLevel = (
  state: IncomeState,
  from: IncomeSource,
  option: PaymentOption,
  available: Money
): boolean => !isMaxLevel(state, from) && available.greaterThanOrEqualTo(option.price)

/**
 * Il listino della **dichiarazione**: con quali strumenti si compra il passaggio in regola, e a
 * quanto con ognuno (ADR 0027). Una voce sola, la carta, perché la carta si riempie solo dal
 * bancomat: il prezzo obbliga a passare dal ponte invece di aggirarlo.
 *
 * **Non si svuota a chi è già in regola**, e la scelta è deliberata: la forma dei livelli — un
 * listino che diventa vuoto in cima — vale per una **scala**, dove l'indice cade fuori da solo. Qui
 * lo stato è un booleano: il listino dichiara cosa si può comprare e con cosa, «l'hai già
 * comprato» lo dicono `canDeclare` e il comando. Renderlo dipendente dallo stato renderebbe anche
 * `accepts` dipendente dallo stato, e `accepts` è ciò che il Ledger deve poter sapere prima di
 * guardare una partita.
 */
export const declarationPrices = (): PriceList => [
  { pool: 'card', price: BALANCE.INCOME_DECLARATION_PRICE_CARD }
]

/**
 * L'opzione del listino per uno strumento, `null` se il listino non lo offre. È la gemella di
 * `levelPriceFor`, e per la stessa ragione (INV-19).
 */
export const declarationPriceFor = (pool: Pool): PaymentOption | null =>
  declarationPrices().find((option) => option.pool === pool) ?? null

/**
 * L'anteprima del pulsante: si può se non lo si è già e se quello strumento basta. Il prezzo arriva
 * **per argomento**, dentro l'opzione, e l'opzione viene dal listino: ripescarlo qui sarebbe una
 * seconda lettura da tenere allineata a quella del comando, che è ciò che INV-19 vieta.
 */
export const canDeclare = (state: IncomeState, option: PaymentOption, available: Money): boolean =>
  !state.declared && available.greaterThanOrEqualTo(option.price)

/**
 * Quanto del reddito maturato entra davvero: **quanto ci sta**, e il resto non entra. Non «tutto o
 * niente» (D017).
 *
 * Lo spazio arriva per argomento e non si calcola qui: a rispondere «quanto ci sta ancora» è
 * `roomIn`, che è del caveau, e il reddito non deve sapere che il caveau esiste. `null` significa
 * nessun tetto, e allora entra tutto.
 *
 * Il muro resta un muro: a caveau pieno lo spazio vale zero, quindi il reddito vale zero e si
 * ferma del tutto. La differenza fra fermarsi e essere rifiutati è tutta nel recupero — un
 * rifiuto è atomico e farebbe tornare a casa con **niente** chi è stato via una notte.
 */
export const incomeThatFits = (earned: Money, room: Money | null): Money =>
  room === null || earned.lessThanOrEqualTo(room) ? earned : room
