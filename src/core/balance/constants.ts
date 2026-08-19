import { fromString } from '@core/contracts/money'

import { clock, seconds } from '@core/kernel/Clock'

/**
 * R04 · R11 — tutti i numeri che decidono come si gioca, in un posto solo.
 *
 * Non c'è un meccanismo che impedisca di scrivere un numero di gioco altrove: c'è
 * `no-magic-numbers` sotto `domains/**`, che è dove il problema nasce davvero. Qui la difesa è
 * che il file esista e sia il primo posto dove si guarda — un numero che vive in due punti è un
 * bilanciamento che si sposta da solo.
 *
 * I valori sono `Money`, cioè `Decimal`: un tasso convertito in `number` perderebbe centesimi
 * lungo la catena (ADR 0006), e la partita doppia lo scoprirebbe come una somma che non fa zero.
 */

const RECOVERY_HOURS = 8
const SECONDS_PER_HOUR = 3600

export const BALANCE = {
  /**
   * Il reddito della prima fonte, prima di qualunque modificatore. È dichiarato **al secondo**
   * perché è così che il giocatore lo legge (`+ 12,00 € / s`); chi lo usa lo converte con il
   * Clock, che è l'unico a sapere quanti tick stanno in un secondo (ADR 0009).
   */
  INCOME_BASE_PER_SECOND: fromString('12'),

  /** L'unico upgrade della fetta 01. Si paga **solo** con la carta: è D010 a dichiararlo. */
  UPGRADE_COST: fromString('800'),

  /**
   * Di quanto l'upgrade moltiplica il reddito di tutte le fonti. È un `mult` su `income.all`, non
   * un nuovo reddito base: se modificasse la base, il registro dei modificatori sarebbe già
   * decorativo alla prima feature.
   */
  UPGRADE_MULTIPLIER: fromString('1.5'),

  /**
   * ADR 0009 — il tetto ai tick di recupero. Riaprire il gioco dopo giorni non deve bloccare
   * l'avvio per minuti, e il recupero usa lo **stesso** codice del tempo reale: non esiste una
   * formula offline separata da bilanciare a parte, che è la fonte classica di exploit negli idle.
   *
   * Il tetto è qui e non nel loop, e si scrive in ore convertite dal Clock: `288000` scritto a
   * mano sarebbe il difetto A04 con un altro nome.
   */
  RECOVERY_CAP: clock.secondsToTicks(seconds(RECOVERY_HOURS * SECONDS_PER_HOUR))
} as const
