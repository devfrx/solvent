import type { Money } from '@core/contracts/money'
import { fromString } from '@core/contracts/money'

/**
 * I bersagli di bilanciamento, come **dati**. Un bersaglio dice cosa ci si aspetta che il gioco
 * faccia, e `tests/balance/targets.test.ts` lo verifica simulando: senza quel test questo file
 * sarebbe documentazione, cioè un'opinione che invecchia senza far rumore.
 *
 * Sono **intervalli**, mai valori singoli. Un bilanciamento espresso come uguaglianza esatta è un
 * test che si rompe a ogni ritocco di un decimale, e un test che si rompe per niente viene
 * disattivato — dopodiché non protegge più nulla.
 *
 * Stretti, però. Un intervallo largo passa sempre e non dimostra niente: il suo lavoro è dirti
 * che hai cambiato un numero, non lasciartelo cambiare in pace.
 */

export interface BalanceTarget {
  readonly min: Money
  readonly max: Money
}

/** Uno solo, e vero. Ne nasce un altro quando esiste un comportamento nuovo da tenere fermo. */
export const TARGET_IDS = ['income_per_minute_at_start'] as const

export type BalanceTargetId = (typeof TARGET_IDS)[number]

export const TARGETS: Readonly<Record<BalanceTargetId, BalanceTarget>> = {
  /**
   * Quanto guadagna in un minuto un giocatore appena iniziato, senza upgrade: 12,00 €/s fanno
   * 720,00 € al minuto. L'intervallo lascia circa il 3% di gioco attorno a quel numero — abbastanza
   * per un ritocco, non abbastanza perché un raddoppio passi inosservato.
   */
  income_per_minute_at_start: { min: fromString('700'), max: fromString('740') }
}
