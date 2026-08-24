import type { Money } from '@core/contracts/money'
import { ZERO } from '@core/contracts/money'
import type { PaymentOption, PriceList } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'
import type { Modifier, ModifierTarget, Modifiers } from '@core/balance/modifiers'
import type { Clock, Ticks } from '@core/kernel/Clock'

import type { IncomeState } from './types'

/**
 * Le regole del reddito. Tutte pure: nessun contesto, nessun effetto, nessuna lettura dell'ora.
 *
 * Anche il `Clock` arriva per argomento, e non è pignoleria: da `kernel/` questo file importa
 * **solo tipi**, il che è ciò che gli permette di essere chiamato da un test di bilanciamento e
 * dalla UI con la stessa facilità con cui lo chiama il sistema. Il Clock non ha stato — converte
 * e basta (ADR 0009) — quindi passarlo non porta dentro niente.
 */

/** Il bersaglio su cui agisce ogni modificatore del reddito, da qualunque dominio arrivi. */
export const INCOME_TARGET: ModifierTarget = 'income.all'

/** L'id della sorgente che l'upgrade registra. È anche la radice delle sue chiavi i18n. */
export const UPGRADE_MODIFIER_ID = 'income.upgrade.overtime'

/**
 * Il reddito **al secondo**, modificatori inclusi. È anche il numero che la UI mostra
 * (`+ 12,00 € / s`), quindi la UI non lo ricalcola.
 *
 * La composizione avviene sulla base al secondo, e la conversione a tick viene **dopo**. È
 * l'ordine che dà un'unità sola ai modificatori: al contrario, un `add` di 8 verrebbe letto come
 * "8 per tick" e varrebbe dieci volte tanto, mentre un `mult` darebbe lo stesso numero. Il difetto
 * resterebbe invisibile fino al primo `add`.
 */
export const incomePerSecond = (modifiers: Modifiers): Money =>
  modifiers.compose(INCOME_TARGET, BALANCE.INCOME_BASE_PER_SECOND)

/** Quanto si guadagna in `elapsed` tick. Quanti tick stanno in un secondo lo sa solo il Clock (R04). */
export const incomeOver = (clock: Clock, modifiers: Modifiers, elapsed: Ticks): Money =>
  clock.perSecondToPerTick(incomePerSecond(modifiers)).mul(elapsed)

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
 */
const UNDECLARED: Regime = { pool: 'cash', withholdingRate: ZERO }
const DECLARED: Regime = { pool: 'card', withholdingRate: BALANCE.INCOME_TAX_RATE }

/**
 * Il regime che vale, dato lo stato. Due valori fermi e una scelta fra loro: non costruisce niente
 * a ogni chiamata, quindi il tick può interrogarla dieci volte al secondo senza allocare.
 */
export const regimeOf = (state: IncomeState): Regime => (state.declared ? DECLARED : UNDECLARED)

/**
 * Il listino della **dichiarazione**: con quali strumenti si compra il passaggio in regola, e a
 * quanto con ognuno (ADR 0027). Una voce sola, la carta, per la ragione di `UPGRADE_PRICE_CARD`:
 * la carta si riempie solo dal bancomat, quindi il prezzo obbliga a passare dal ponte.
 *
 * **Non si svuota a chi è già in regola**, e la scelta è deliberata: la forma del caveau — un
 * listino che diventa vuoto all'ultimo livello — vale per una **scala**, dove l'indice cade fuori
 * da solo. Qui lo stato è un booleano, e il gemello che gli sta venti righe sopra risponde già
 * così: il listino dichiara cosa si può comprare e con cosa, «l'hai già comprato» lo dicono
 * `canDeclare` e il comando. Renderlo dipendente dallo stato renderebbe anche `accepts`
 * dipendente dallo stato, e `accepts` è ciò che il Ledger deve poter sapere prima di guardare
 * una partita.
 */
export const declarationPrices = (): PriceList => [
  { pool: 'card', price: BALANCE.INCOME_DECLARATION_PRICE_CARD }
]

/**
 * L'opzione del listino per uno strumento, `null` se il listino non lo offre. È la gemella di
 * `upgradePriceFor`, e per la stessa ragione: la UI la chiama prima di mostrare un prezzo, il
 * comando prima di pagarlo, e leggono lo **stesso** posto (INV-19).
 */
export const declarationPriceFor = (pool: Pool): PaymentOption | null =>
  declarationPrices().find((option) => option.pool === pool) ?? null

/**
 * L'anteprima del pulsante: si può se non lo si è già e se quello strumento basta. Il prezzo
 * arriva **per argomento**, dentro l'opzione, e l'opzione viene dal listino: ripescarlo qui
 * sarebbe una seconda lettura da tenere allineata a quella del comando, che è ciò che INV-19
 * vieta.
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

/**
 * Il listino dell'upgrade: per ogni strumento che lo compra, quanto costa con quello (ADR 0027).
 *
 * Oggi ha **una** voce, e va bene così: un listino di uno non è un caso speciale. È anche la prova
 * che la forma regge il caso più stretto — chi legge non trova un ramo che distingue "un'opzione"
 * da "più opzioni", trova una lista.
 *
 * È una funzione e non la costante nuda per la ragione di sempre in questo dominio: l'anteprima
 * della UI e il comando che paga devono leggere lo **stesso** posto, e due letture che devono
 * coincidere prima o poi divergono. Qui vale doppio, perché adesso quel posto genera anche
 * `accepts` (INV-19).
 */
export const upgradePrices = (): PriceList => [{ pool: 'card', price: BALANCE.UPGRADE_PRICE_CARD }]

/**
 * L'opzione del listino per uno strumento, `null` se il listino non lo offre.
 *
 * Il `null` è un esito e non un guasto: «con questo non si paga» è una risposta legittima sia alla
 * domanda che la UI fa prima di mostrare un prezzo, sia a quella che il comando fa prima di pagare.
 */
export const upgradePriceFor = (pool: Pool): PaymentOption | null =>
  upgradePrices().find((option) => option.pool === pool) ?? null

/**
 * L'anteprima del pulsante: comprabile se non è già stato comprato e se quello strumento basta.
 *
 * Il prezzo arriva **per argomento**, dentro l'opzione, e l'opzione viene dal listino. Se questa
 * funzione se lo ripescasse da sola sarebbe una seconda lettura da tenere allineata con quella del
 * comando, che è esattamente ciò che INV-19 vieta. `available` è il saldo di quello stesso pool.
 *
 * Il confronto sui fondi resta un'anteprima, non la decisione: a decidere è il Ledger quando il
 * comando esegue, e c'è un test che mette i due uno di fronte all'altro.
 */
export const canBuyUpgrade = (
  state: IncomeState,
  option: PaymentOption,
  available: Money
): boolean => !state.upgraded && available.greaterThanOrEqualTo(option.price)

/**
 * Il modificatore che l'upgrade registra: un `mult` su **tutte** le fonti di reddito, non un
 * reddito base nuovo. Se modificasse la base, il registro dei modificatori sarebbe decorativo già
 * alla prima feature.
 */
export const upgradeModifier = (): Modifier => ({
  id: UPGRADE_MODIFIER_ID,
  target: INCOME_TARGET,
  kind: 'mult',
  value: BALANCE.UPGRADE_MULTIPLIER
})
