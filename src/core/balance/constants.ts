import { fromString } from '@core/contracts/money'
import { CASH_START_CAPACITY } from '@core/contracts/pools'

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

  /**
   * Quanto costa l'upgrade **con la carta**, che è l'unico strumento che il suo listino offre
   * (ADR 0027). Lo strumento sta nel nome perché il prezzo è per strumento: il caveau della fetta
   * 02 ne avrà due, uno in contanti e uno sulla carta, e saranno due costanti — non una con uno
   * sconto calcolato da qualche parte.
   *
   * Fino a D019 si chiamava `UPGRADE_COST` e il commento diceva «si paga solo con la carta»: era
   * vero, e a dirlo era una frase. Adesso lo dice il listino, e questo numero è una delle sue voci.
   */
  UPGRADE_PRICE_CARD: fromString('800'),

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
   * Le capienze del caveau, **una per livello**, dal livello zero all'ultimo. Quanti livelli
   * esistano non è un numero a parte: è la lunghezza di questo elenco, e `MAX_LEVEL` la legge.
   *
   * Livelli **finiti** con un tetto dichiarato, e non una curva che si strozza da sola: in un idle
   * «costa più di quanto renda» è un bersaglio mobile, tarato contro la curva del gioco, mentre un
   * tetto si verifica con un test e non si ritara mai (docs/design/domini/vault.md).
   *
   * L'ultima cifra è il muro definitivo: sopra 250.000,00 € i contanti smettono di essere una
   * scelta possibile, non una scelta cara — ed è la forma 1 della saturazione, l'unica in cui la
   * pozza di uno strumento **coincide** con il suo tetto.
   *
   * Il primo elemento non è scritto qui: è `CASH_START_CAPACITY`, che il pool dichiara da sé
   * (ADR 0017). Riscriverlo sarebbe la stessa cifra in due posti.
   */
  VAULT_CAPACITIES: [
    CASH_START_CAPACITY,
    fromString('5000'),
    fromString('20000'),
    fromString('75000'),
    fromString('250000')
  ],

  /**
   * Quanto costa passare al livello successivo pagando in **contanti**, indicizzato dal livello da
   * cui si parte. Un elemento in meno delle capienze: dall'ultimo livello non si va da nessuna
   * parte, e a dirlo è la lunghezza invece di un `if`.
   *
   * Ogni prezzo sta appena sotto la capienza del livello da cui si paga — 900 su 1.000, 4.500 su
   * 5.000 — e non è un caso: per pagare in contanti bisogna **poterli tenere**, quindi il caveau
   * va quasi riempito prima di potersi ampliare. È il muro che insegna sé stesso.
   */
  VAULT_PRICES_CASH: [
    fromString('900'),
    fromString('4500'),
    fromString('18000'),
    fromString('68000')
  ],

  /**
   * Gli stessi ampliamenti pagati con la **carta**, e sono due euro in meno ciascuno.
   *
   * Due euro sembrano nulla, e sono l'unico numero possibile finché il calore non esiste. Chi ha
   * solo contanti, per pagare con la carta, deve prima versarli e lasciare `ATM_FEE` al bancomat:
   * lo sconto conviene **solo se supera la commissione**. Con uno sconto di 50,00 € i contanti
   * diventerebbero una voce di listino che nessuno sceglie mai — arredamento con dentro del codice
   * — perché la carta non paga ancora niente in cambio della traccia che lascia.
   *
   * Sono quattro costanti loro, non una sottrazione applicata alle prime: due dichiarazioni della
   * stessa cosa possono divergere, un prezzo derivato da un altro non è un prezzo. Che la
   * differenza resti sotto la commissione lo verifica `tests/balance/targets`, non questo commento.
   *
   * Quando il calore arriverà (fetta 04), questo elenco è il primo posto da ritarare.
   */
  VAULT_PRICES_CARD: [
    fromString('898'),
    fromString('4498'),
    fromString('17998'),
    fromString('67998')
  ],

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
