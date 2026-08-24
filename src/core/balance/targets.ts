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
  'vault_max_cash',
  'vault_card_discount',
  'income_tax_rate',
  'income_declaration_price'
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
   * Quanti contanti tiene il caveau **all'ultimo livello**: il muro definitivo del gioco.
   *
   * È il numero da cui dipende la **forma 1** della saturazione — sopra quella cifra i contanti
   * smettono di essere una scelta possibile, non una scelta cara — cioè la spina dorsale della
   * dualità contanti/carta. Per due fette è stato l'unico numero del caveau che nessun test
   * guardava, ed è entrato qui con [D042](../../../docs/delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md).
   *
   * **Che sia ridicolo a fine partita è il funzionamento, non la scadenza.** Con un patrimonio a
   * 1e12 questo tetto è un arrotondamento, ed è precisamente il momento in cui il gioco vuole che i
   * contanti smettano di essere una risposta. Chi arriva qui perché la cifra «sembra bassa» stia
   * togliendo la tensione che regge diciassette domini, e lo faccia sapendolo.
   *
   * L'intervallo è stretto attorno ai 256.000,00 € che la scala produce, e la strettezza è il suo
   * lavoro: un livello in più o in meno raddoppia o dimezza quella cifra e cade fuori, e un fattore
   * di crescita diverso pure. Tollera solo un ritocco della densità dei contanti, che è l'unica
   * delle tre leve a non cambiare quante volte il giocatore incontra la decisione.
   */
  vault_max_cash: { min: fromString('220000'), max: fromString('290000') },

  /**
   * Quanto si risparmia ampliando il caveau con la **carta** invece che con i contanti.
   *
   * L'intervallo sta tutto **sotto `ATM_FEE_FLOOR`**, e non è pignoleria: chi ha solo contanti,
   * per pagare con la carta, deve prima versarli e lasciare la commissione al bancomat. Se lo
   * sconto la superasse, convertire converrebbe sempre e i contanti sarebbero una voce di listino
   * che nessuno sceglie mai. Sopra lo zero perché a prezzi uguali la scelta non esiste.
   *
   * Il confronto è con il **pavimento** e non con la commissione, perché da D032 la commissione
   * non è un numero: è `max(pavimento, importo × tasso)`. Il pavimento è la più bassa che possa
   * mai esistere, quindi uno sconto che sta sotto di lui sta sotto qualunque commissione — ed è il
   * confronto più severo dei due, non una scorciatoia.
   *
   * È il solo argine alla legge della non dominanza finché il calore non esiste: la carta lascia
   * tracce e oggi le tracce non costano niente. Quando costeranno (fetta 04), questo intervallo si
   * allarga — ed è il primo posto da guardare.
   */
  vault_card_discount: { min: fromString('0.50'), max: fromString('2.49') },

  /**
   * Quanto lo Stato trattiene su un reddito **dichiarato** (ADR 0052). È una frazione, non euro —
   * ed è il secondo bersaglio del progetto a non misurarsi in denaro, dopo `seconds_to_first_wall`.
   *
   * **L'intervallo sta tutto sopra `ATM_FEE_RATE_IN`**, ed è la legge della non dominanza applicata
   * al regime. Chi resta in nero e vuole i soldi sulla carta li versa a mano e paga l'1,5%: se
   * dichiarare costasse meno, la carta sarebbe migliore sotto ogni aspetto e i contanti
   * smetterebbero di essere una scelta — il caveau resterebbe un dominio senza clienti.
   *
   * **E il massimo è basso apposta.** Sopra il 5% l'alternativa manuale — restare in nero e premere
   * «deposita» a ogni riempimento — verrebbe pagata abbastanza da valere la pena, e il gioco
   * ottimale tornerebbe a essere la mansione che l'ADR 0052 esiste per togliere. È il bersaglio che
   * sorveglia **due** difetti opposti con lo stesso intervallo, ed è il motivo per cui è stretto.
   *
   * Quando il calore arriverà (fetta 04), la carta comincerà a pagare due prezzi invece di uno e
   * questo intervallo si sposta verso il basso: è il primo posto da guardare.
   */
  income_tax_rate: { min: fromString('0.016'), max: fromString('0.05') },

  /**
   * Quanto costa **mettersi in regola**, e la sua posizione nella scala del caveau è la meccanica.
   *
   * L'intervallo sta fra il quinto gradino (32.000,00 €) e il sesto (64.000,00 €), e quello che
   * verifica non è la cifra: è che il prezzo cada **dentro** la scala. Sotto il primo gradino la
   * dichiarazione si comprerebbe prima di aver mai incontrato il muro, e la fetta 02 diventerebbe
   * un tutorial da saltare; oltre l'ultimo arriverebbe quando i contanti non danno più fastidio a
   * nessuno, cioè quando non serve più. Il test lo confronta con `cashCapacityFor`, non con questi
   * due numeri: cambiare la scala del caveau deve rendere rosso lì.
   */
  income_declaration_price: { min: fromString('30000'), max: fromString('70000') }
}
