import type { Money } from '@core/contracts/money'
import { roundUpToCents, ZERO } from '@core/contracts/money'

import { BALANCE } from '@core/balance/constants'

/**
 * Le regole del bancomat. Tutte pure: nessun contesto, nessun effetto, nessuna lettura dell'ora.
 *
 * Da `kernel/` questo file non importa niente, nemmeno un tipo — non per rigore, ma perché non
 * gliene serve: la commissione e i suoi limiti sono aritmetica su `Money`. Il costruttore dei
 * movimenti, che invece dal kernel arriva, sta in `commands.ts`.
 */

/**
 * La commissione trattenuta da un'operazione: **il maggiore fra un pavimento e una percentuale**.
 *
 * Fino a D032 non prendeva argomenti, ed era motivato — con una commissione fissa un parametro
 * sarebbe rimasto inutilizzato, cioè un errore di compilazione (`noUnusedParameters`, C01). Adesso
 * ne prende due, e la ragione è che la commissione ha smesso di essere un numero: dipende da
 * quanto si sposta e da che verso.
 *
 * Il **tasso arriva per argomento** e non si legge qui dentro, ed è la stessa scelta di `fitsIn`
 * poche righe più sotto: chi conosce il verso è l'operazione (`DEPOSIT`, `WITHDRAW`), che lo porta
 * come dato. Leggerlo qui vorrebbe dire un `if` sulla direzione, e un `if` sulla direzione è
 * esattamente ciò che l'ADR 0017 ha tolto dal progetto una volta.
 *
 * Resta una funzione invece di un'espressione sparsa per la ragione di `upgradeCost()` (D010):
 * l'anteprima e l'esecuzione devono leggere lo **stesso** posto, e due letture che devono
 * coincidere prima o poi divergono.
 *
 * L'arrotondamento è qui e in nessun altro punto della catena: applicarlo di nuovo più avanti
 * farebbe salire la commissione di un centesimo per passaggio.
 */
export const atmFee = (amount: Money, rate: Money): Money => {
  const proportional = amount.mul(rate)
  return roundUpToCents(
    proportional.greaterThan(BALANCE.ATM_FEE_FLOOR) ? proportional : BALANCE.ATM_FEE_FLOOR
  )
}

/**
 * Zero non è un non-evento. `magnitude` lo lascia passare, quindi un trasferimento da 0,00 sarebbe
 * una transazione perfettamente valida che non muove niente ed emette un evento: il giocatore
 * vedrebbe una riga comparire nello storico per un'operazione che non ha fatto.
 *
 * Il negativo e il non finito `magnitude` li ferma, ma **lanciando** — e un numero sbagliato
 * digitato dal giocatore non è un programma scritto male. Qui diventano un esito.
 *
 * Il confronto è `> 0` e non `isPositive()`: in decimal.js lo zero ha segno positivo, quindi
 * `isPositive()` è **vero** per 0,00 e lascerebbe passare proprio il caso che questa funzione
 * esiste per fermare.
 */
export const isValidAmount = (amount: Money): boolean =>
  amount.isFinite() && amount.greaterThan(ZERO)

/**
 * Maggiore **o uguale** è un rifiuto, non solo maggiore. Una commissione pari all'importo fa
 * arrivare zero a destinazione: il Ledger l'accetterebbe — `transfer` lancia solo quando la
 * commissione *supera* l'importo — e il giocatore pagherebbe per non ricevere niente.
 */
export const isFeeWithinAmount = (amount: Money, fee: Money): boolean => fee.lessThan(amount)

/**
 * Se un importo in arrivo ci entra ancora. La capienza arriva **per argomento** invece di essere
 * letta qui dentro, e da D017 quella scelta si è ripagata due volte: permette di provare i bordi
 * con una capienza finta senza sostituire un modulo, e permette al bancomat di sapere del caveau
 * senza importarlo. La consegna chi ha entrambi sotto mano — lo store.
 *
 * `capacityOf` stava qui accanto e **non c'è più** (ADR 0025): rispondeva leggendo `POOLS`, cioè
 * la capienza di partenza, che dopo il primo ampliamento è la risposta sbagliata. Due funzioni che
 * rispondono alla stessa domanda con due valori diversi sono il difetto che INV-18 rende
 * impossibile, quindi è stata rifatta altrove invece che affiancata: adesso a rispondere è il
 * Ledger, con la stessa funzione che fa rispettare.
 *
 * Il confronto è lo stesso che fa il Ledger, che resta l'unico a decidere: qui si risponde alla
 * UI, che vuole saperlo **prima** di accendere un pulsante.
 */
export const fitsIn = (capacity: Money | null, current: Money, incoming: Money): boolean =>
  capacity === null || current.plus(incoming).lessThanOrEqualTo(capacity)
