import type { Money } from '@core/contracts/money'

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
 * Il prezzo dell'upgrade. Una funzione e non la costante nuda perché l'anteprima della UI e il
 * comando che esegue devono leggere lo **stesso** posto: due letture che devono coincidere sono
 * due letture che prima o poi divergono.
 */
export const upgradeCost = (): Money => BALANCE.UPGRADE_COST

/**
 * L'anteprima del pulsante: comprabile se non è già stato comprato e se la carta basta.
 *
 * `available` è il saldo della **carta**, l'unico strumento accettato. Il confronto sui fondi è
 * un'anteprima, non la decisione: a decidere è il Ledger quando il comando esegue. I due devono
 * dare la stessa risposta, e c'è un test che li mette uno di fronte all'altro.
 */
export const canBuyUpgrade = (state: IncomeState, available: Money): boolean =>
  !state.upgraded && available.greaterThanOrEqualTo(upgradeCost())

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
