import type { Money } from '@core/contracts/money'
import { ONE, roundDownToCents, roundUpToCents, ZERO } from '@core/contracts/money'

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

/** Il minore dei due. `Math.min` non sa niente di `Decimal`, e `decimal.js` non entra qui (INV-01). */
const smaller = (left: Money, right: Money): Money => (left.lessThan(right) ? left : right)

/**
 * Il più grande importo il cui **netto** entra in `room`, senza guardare quanto ce n'è alla
 * partenza: è la metà della risposta che riguarda la destinazione.
 *
 * Il candidato piatto — `room` più il pavimento — vale finché la sua percentuale non supera il
 * pavimento: da lì in poi la commissione ha smesso di essere fissa, e con essa quella formula.
 */
const upTo = (room: Money, rate: Money): Money => {
  if (!room.greaterThan(ZERO)) return ZERO

  const flat = room.plus(BALANCE.ATM_FEE_FLOOR)
  return flat.mul(rate).greaterThan(BALANCE.ATM_FEE_FLOOR)
    ? roundDownToCents(room.div(ONE.minus(rate)))
    : flat
}

/**
 * La domanda gemella di `fitsIn`: quello dice «ci sta?», questa dice **«quanto ci sta?»**.
 *
 * È lo stesso paio di `roomIn` e `capacityOf` in `contracts/pools.ts`, e non è un caso: è la forma
 * che l'[ADR 0025](../../../../docs/adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md) ha
 * già scelto una volta. Esiste perché un pulsante `MAX` che propone una cifra e poi la fa
 * rifiutare è peggio di un pulsante che non c'è.
 *
 * **Non è `spazio + commissione`.** Con la commissione in percentuale ciò che arriva è
 * `importo × (1 − tasso)`, quindi il più grande importo che ci sta è `spazio ÷ (1 − tasso)` —
 * e va arrotondato **per difetto**, perché un centesimo in più è proprio il rifiuto che questa
 * funzione esiste per evitare. Sotto la soglia di attraversamento la commissione è il pavimento e
 * non scala, quindi lì la relazione torna a essere una somma: a scegliere fra le due è il
 * candidato stesso, confrontato con il pavimento — le due formule non hanno bisogno di sapere
 * dov'è la soglia, perché la soglia è dove smettono di essere d'accordo.
 *
 * L'ultima riga è il patto: se nemmeno il più grande importo possibile riesce a coprire la propria
 * commissione, la risposta è **zero** — non c'è un importo che passa, e proporne uno sarebbe la
 * bugia da cui tutto questo è partito. A dirlo sono le due funzioni qui sopra, non un secondo
 * confronto che le somiglia.
 *
 * Come `fitsIn`, la capienza e i saldi arrivano **per argomento**: il bancomat non conosce il
 * caveau, e a mettergli in mano entrambi i capi è lo store (ADR 0024).
 */
export const largestThatFits = (
  capacity: Money | null,
  current: Money,
  rate: Money,
  available: Money
): Money => {
  const largest =
    capacity === null ? available : smaller(available, upTo(capacity.minus(current), rate))
  return isFeeWithinAmount(largest, atmFee(largest, rate)) ? largest : ZERO
}
