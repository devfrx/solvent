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
 *
 * **Non tutti si misurano in euro**, e da D017 non è più un'ipotesi: un bersaglio è un intervallo
 * di `Decimal`, e ciò che quel numero conta lo dice il suo nome. `seconds_to_first_wall` conta
 * secondi, perché la domanda a cui risponde è *quando*, non *quanto*.
 */

export interface BalanceTarget {
  readonly min: Money
  readonly max: Money
}

export const TARGET_IDS = [
  'income_per_minute_at_start',
  'seconds_to_first_wall',
  'vault_card_discount'
] as const

export type BalanceTargetId = (typeof TARGET_IDS)[number]

export const TARGETS: Readonly<Record<BalanceTargetId, BalanceTarget>> = {
  /**
   * Quanto guadagna in un minuto un giocatore appena iniziato, senza upgrade: 12,00 €/s fanno
   * 720,00 € al minuto. L'intervallo lascia circa il 3% di gioco attorno a quel numero — abbastanza
   * per un ritocco, non abbastanza perché un raddoppio passi inosservato.
   */
  income_per_minute_at_start: { min: fromString('700'), max: fromString('740') },

  /**
   * Dopo quanti secondi di gioco un giocatore appena iniziato incontra il **muro** la prima volta:
   * la capienza di partenza divisa per il reddito al secondo, cioè 1.000,00 € a 12,00 €/s.
   *
   * Non è un dettaglio di taratura, è l'esperienza dei primi minuti. Sotto il minuto il muro
   * arriva prima che il giocatore abbia capito cos'è un caveau; sopra i due minuti la fetta 02
   * non si vede finché lui non ha già smesso di guardare.
   *
   * Lega due numeri che vivono in file diversi — la capienza sta in `POOLS`, il reddito qui
   * accanto — e questa è metà del suo lavoro: cambiarne uno solo rende il test rosso.
   */
  seconds_to_first_wall: { min: fromString('60'), max: fromString('120') },

  /**
   * Quanto si risparmia ampliando il caveau con la **carta** invece che con i contanti.
   *
   * L'intervallo sta tutto **sotto `ATM_FEE`**, e non è pignoleria: chi ha solo contanti, per
   * pagare con la carta, deve prima versarli e lasciare la commissione al bancomat. Se lo sconto
   * la superasse, convertire converrebbe sempre e i contanti sarebbero una voce di listino che
   * nessuno sceglie mai. Sopra lo zero perché a prezzi uguali la scelta non esiste.
   *
   * È il solo argine alla legge della non dominanza finché il calore non esiste: la carta lascia
   * tracce e oggi le tracce non costano niente. Quando costeranno (fetta 04), questo intervallo si
   * allarga — ed è il primo posto da guardare.
   */
  vault_card_discount: { min: fromString('0.50'), max: fromString('2.49') }
}
