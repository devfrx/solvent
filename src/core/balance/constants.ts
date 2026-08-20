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

/**
 * Il più grande degli importi rapidi del bancomat, che è anche quello con cui la schermata si
 * apre. Sta in una costante sua invece di essere ripescato in fondo alla lista: due letture dello
 * stesso numero sono due letture che prima o poi divergono.
 */
const ATM_LARGEST = fromString('500')

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
   * La commissione che il bancomat trattiene su ogni operazione, deposito o prelievo che sia
   * (D014). È un **importo fisso** e non una percentuale, ed è una scelta di gioco prima che di
   * forma: con una percentuale il caso "la commissione supera l'importo" non si presenterebbe mai,
   * e con esso sparirebbe la dinamica che il caveau della fetta 02 userà — prelevare poco costa
   * proporzionalmente molto, quindi conviene prelevare grosso, ma i contanti hanno una capienza.
   *
   * Sta qui e non in `domains/atm/` perché `no-magic-numbers` sotto `domains/**` lo impedisce, ed
   * è proprio il punto: un numero di gioco scritto dentro un dominio è un bilanciamento che si
   * sposta da solo.
   */
  ATM_FEE: fromString('2.50'),

  /**
   * Gli importi che il bancomat offre. Non è una comodità dell'interfaccia: **sono l'unico modo di
   * scegliere un importo** nella fetta 01, e la scala che hanno decide quanto la commissione fissa
   * si fa sentire. Letti in fila raccontano da soli la regola del bancomat — 1,00 € è rifiutato
   * perché la commissione se lo mangia, 10,00 € ne perde un quarto, 500,00 € lo 0,5% — che è ciò
   * che rende "prelevare grosso conviene" una cosa che si vede invece di una nota nel manuale.
   *
   * Il primo esiste **perché fallisce**: senza, il rifiuto dell'anteprima (ADR 0018 — con un
   * motivo, non con un pulsante spento) sarebbe raggiungibile solo da un test, e un ramo che
   * nessuno può vedere a schermo è un ramo che marcisce.
   */
  ATM_AMOUNTS: [fromString('1'), fromString('10'), fromString('100'), ATM_LARGEST],

  /** Un bancomat non si apre sulla propria opzione peggiore. */
  ATM_DEFAULT_AMOUNT: ATM_LARGEST,

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
