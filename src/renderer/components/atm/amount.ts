import type { Money } from '@core/contracts/money'
import { fromString, roundDownToCents, ZERO } from '@core/contracts/money'

/**
 * Da testo a `Money`, e sta qui invece che dentro `AtmPanel.vue` per la ragione di `rotation.ts`:
 * è l'unica parte davvero sbagliabile del campo, e così si prova senza montare niente. R05 lo
 * impone comunque — un `.vue` non decide quanto denaro si muove.
 *
 * **Il campo tiene testo, non un `Decimal`.** Un `ref` su `Money` legato con `v-model` sarebbe la
 * trappola di D012: Vue avvolgerebbe il `Decimal` in un proxy, e da lì il dominio non lo
 * riconoscerebbe più. Testo di qua, `Money` di là, e in mezzo questa funzione.
 *
 * **Ciò che non è un importo diventa zero**, e non un secondo tipo di errore: zero è già un
 * rifiuto che il gioco sa spiegare — `error.atm.amount_not_positive`, con dentro la cifra — e
 * inventare un «non è un numero» sarebbe un secondo modo di dire la stessa cosa, in una schermata
 * il cui punto è che ogni no ha un motivo solo.
 */

/**
 * Ciò che in un importo non è né cifra, né separatore, né segno: spazi, il simbolo dell'euro,
 * lettere. Si toglie invece di far fallire la lettura — chi incolla «1.200 €» ha scritto un
 * importo, e rifiutarglielo sarebbe pedanteria.
 */
const NOT_A_NUMBER = /[^\d.,-]/g

const SEPARATORS = /[.,]/g

const SIGN = /-/g

const A_DIGIT = /\d/

/**
 * Un intero raggruppato a migliaia, con lo **stesso** separatore ogni volta: `1.234`, `250.000`,
 * `1,234,567`. Il richiamo `\1` è ciò che pretende la coerenza, e serve a lasciar fuori `1.234,56`
 * — che è un importo con i decimali, non un intero.
 *
 * Il primo gruppo non può cominciare per zero, e quella cifra costa un caso: senza, `0,009` sarebbe
 * un intero raggruppato — nove — invece di nove millesimi arrotondati a niente.
 *
 * Qui vive l'unica ambiguità vera del campo, ed è dichiarata: `10,999` può essere diecimila o
 * dieci-e-spiccioli, e nessuna regola le distingue. Questa funzione legge **diecimila**, e il
 * motivo è che il gioco scrive sempre due decimali esatti: un terzo decimale non può venire da un
 * numero letto sullo schermo. Qualunque delle due letture, l'anteprima la mostra **prima** che si
 * confermi (INV-11), quindi l'errore si vede invece di essere pagato.
 */
const GROUPED = /^[1-9]\d{0,2}(?:([.,])\d{3})(?:\1\d{3})*$/

/**
 * L'ultimo separatore è quello dei decimali, gli altri sono di migliaia. Vale per tutte e due le
 * lingue senza sapere quale sia accesa: `1.234,56` e `1,234.56` arrivano allo stesso importo.
 */
const withLastSeparatorAsPoint = (digits: string): string => {
  const last = Math.max(digits.lastIndexOf(','), digits.lastIndexOf('.'))
  if (last < 0) return digits

  const whole = digits.slice(0, last).replace(SEPARATORS, '')
  const fraction = digits.slice(last + 1).replace(SEPARATORS, '')
  return fraction === '' ? whole : `${whole === '' ? '0' : whole}.${fraction}`
}

/**
 * Il segno resta, e non è una svista: un importo negativo digitato è un rifiuto con un motivo
 * (`error.atm.amount_not_positive`), non un valore da correggere di nascosto. Correggerlo
 * significherebbe che il campo decide al posto del giocatore.
 *
 * L'arrotondamento per difetto è l'ultima riga per un motivo: il terzo decimale non è denaro che
 * questo gioco sappia contare, e lasciarlo passare produrrebbe movimenti sotto il centesimo.
 */
export const readAmount = (typed: string): Money => {
  const cleaned = typed.replace(NOT_A_NUMBER, '')
  const digits = cleaned.replace(SIGN, '')
  if (!A_DIGIT.test(digits)) return ZERO

  const decimal = GROUPED.test(digits)
    ? digits.replace(SEPARATORS, '')
    : withLastSeparatorAsPoint(digits)

  const value = fromString(`${cleaned.startsWith('-') ? '-' : ''}${decimal}`)
  return value.isFinite() ? roundDownToCents(value) : ZERO
}
