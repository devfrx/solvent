import type { Money } from '@core/contracts/money'

/**
 * R04 · ADR 0009 — tutto ciò che il progetto sa del tempo sta qui.
 *
 * Il difetto A04 era il tick rate riscritto in cinque punti: cambiarlo voleva dire trovarli tutti,
 * e ogni omissione sbilanciava un sistema in silenzio. Qui la frequenza è dichiarata una volta, e
 * le unità sono nel tipo — così un `10` scritto dentro un sistema è un errore di compilazione,
 * non una svista invisibile.
 *
 * Il Clock **non ha stato**: non sa che ora è, non sa quanto tempo è passato. Converte e basta.
 * Il tempo che scorre è del loop (D011). Se il Clock avesse stato, ogni test di dominio dovrebbe
 * controllarlo, e il tempo tornerebbe a essere globale.
 */

/** L'unica occorrenza letterale di questo numero in tutto il progetto (ADR 0009). */
export const TICKS_PER_SECOND = 10

declare const brand: unique symbol

/** Un'unità di misura che vive solo nel compilatore: a runtime `Ticks` è un `number` e basta. */
type Branded<M extends string> = number & { readonly [brand]: M }

export type Ticks = Branded<'Ticks'>
export type Seconds = Branded<'Seconds'>

/**
 * I costruttori sono espliciti apposta: marchiare un numero è un gesto che si vede nel diff, non
 * qualcosa che succede da solo.
 */
export const ticks = (amount: number): Ticks => amount as Ticks

export const seconds = (amount: number): Seconds => amount as Seconds

export interface Clock {
  readonly secondsToTicks: (duration: Seconds) => Ticks
  readonly ticksToSeconds: (duration: Ticks) => Seconds
  /** Il denaro resta `Decimal` anche qui: un tasso convertito in `number` perderebbe (ADR 0006). */
  readonly perSecondToPerTick: (rate: Money) => Money
  readonly perTickToPerSecond: (rate: Money) => Money
}

export const clock: Clock = {
  secondsToTicks: (duration) => ticks(duration * TICKS_PER_SECOND),
  ticksToSeconds: (duration) => seconds(duration / TICKS_PER_SECOND),
  perSecondToPerTick: (rate) => rate.div(TICKS_PER_SECOND),
  perTickToPerSecond: (rate) => rate.mul(TICKS_PER_SECOND)
}
