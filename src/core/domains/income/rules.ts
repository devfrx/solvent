import type { Money } from '@core/contracts/money'
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
