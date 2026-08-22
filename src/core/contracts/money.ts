import Decimal from 'decimal.js'

/**
 * R11 · ADR 0006 — il denaro è `Decimal` dal primo all'ultimo passaggio.
 *
 * La regola è gratis: `Decimal` è una classe, quindi TypeScript rifiuta da solo un `number` dove
 * serve `Money`, e rifiuta anche `a + b` e `a * b`. Il costo accettato è scrivere `a.plus(b)`.
 *
 * Questo è l'unico file di confine: `fromNumber` e `toDisplayNumber` sono le **uniche**
 * conversioni del progetto, e il lint le vieta sotto `src/core/domains/**` — le conversioni
 * stanno al livello di presentazione, mai in mezzo a una catena economica (difetto A11).
 */
export type Money = Decimal

/**
 * ADR 0026 — la precisione del denaro è **dichiarata**, non ereditata.
 *
 * Fino a D032 erano le venti cifre predefinite di decimal.js: nessuno le aveva scelte, nessun
 * documento le nominava, e sarebbe bastato un aggiornamento del pacchetto per spostarle in
 * silenzio. Le regole sono due, misurate sulla libreria in uso:
 *
 * | Precisione | I centesimi reggono fino a | `transfer()` smette di bilanciare da |
 * | ---------- | -------------------------- | ------------------------------------ |
 * | 20         | 1e17 €                     | 1e20 €                               |
 * | **40**     | **1e37 €**                 | **1e40 €**                           |
 *
 * **Quaranta e non venti**, perché la [visione](../../../docs/prodotto/visione.md) dichiara un
 * bersaglio di scala di ~1e30 €: con il predefinito il gioco si romperebbe **dieci ordini di
 * grandezza prima** del bersaglio che si è dato, e già da 1e18 mostrerebbe importi senza
 * centesimi. Quaranta lascia sette ordini di margine sopra quel bersaglio.
 *
 * Il guasto che questo numero previene è **un crollo, non una deriva**: sopra la soglia i tre
 * movimenti di `transfer()` non sommano più a zero — `value.minus(fee)` arrotonda — e il Ledger
 * lancia `UnbalancedTransactionError`, che per costruzione vuol dire «c'è una riga sbagliata».
 * Lì invece non c'è nessuna riga sbagliata: c'è un giocatore che ha premuto «Deposita».
 *
 * Configura il **costruttore**, quindi vale per ogni operazione di questo processo. Sta in testa a
 * questo file perché è l'unico che possa fabbricare un `Money`: nessun altro modulo importa
 * `decimal.js` (INV-01), quindi non esiste un valore nato prima di questa riga.
 */
const SIGNIFICANT_DIGITS = 40

/**
 * ADR 0041 — la **rappresentazione** del denaro è dichiarata come la sua precisione. È la seconda
 * metà del commento qui sopra, e riguarda la stessa libreria.
 *
 * La precisione dice **quante cifre** ha un importo; la notazione dice **come si scrivono**. La
 * seconda è quella che attraversa il disco: oltre il confine il denaro è ciò che `toString()`
 * produce (INV-04), e lo schema di salvataggio accetta solo la forma decimale piena.
 *
 * Ereditata, decimal.js la fissa a `toExpPos = 21`: da 1e21 in su `toString()` restituisce
 * `1e+21`, il regex di `main/save/schema.ts` lo rifiuta, e il salvataggio fallisce **prima** che
 * il disco venga toccato. Da lì la partita va in `failed` con fase `saving`, e la finestra non si
 * chiude (correzione 13 di D011): riprovare fallisce in modo deterministico, e l'unica uscita è
 * chiudere perdendo la partita. Non è una deriva, è un arresto.
 *
 * **Derivata dalla precisione, non scelta a parte**, e non per simmetria: non ha senso scrivere in
 * forma esponenziale un importo che il progetto sa ancora rappresentare per intero. Le due soglie
 * coincidono per costruzione — a 1e40 `transfer()` smette di sommare a zero, ed è esattamente lì
 * che la forma decimale piena finisce.
 *
 * **Il verso negativo si dichiara insieme all'altro** anche se oggi non morde: `toExpNeg = -7` è
 * lo stesso default ereditato, e non morde solo perché tutto arrotonda ai centesimi — cioè per una
 * proprietà che vale adesso, non per una regola.
 */
const NOTATION_EXPONENT = SIGNIFICANT_DIGITS

Decimal.set({
  precision: SIGNIFICANT_DIGITS,
  toExpPos: NOTATION_EXPONENT,
  toExpNeg: -NOTATION_EXPONENT
})

/** I centesimi: la moneta più piccola che questo gioco sa contare. */
const CENTS = 2

export const ZERO: Money = new Decimal(0)

/**
 * L'intero, cioè il cento per cento. Sta accanto a `ZERO` per la stessa ragione: sono i due valori
 * che nessun bilanciamento decide, e che quindi non hanno niente da fare in `balance/`.
 *
 * Serve a trasformare un tasso nel suo **complemento** — quanto resta di un importo dopo che la
 * commissione ha preso la sua parte — ed è l'unica operazione del progetto in cui un tasso e un
 * importo si incontrano senza moltiplicarsi ([D033](../../../docs/delega/D033-il-bancomat-e-una-pagina.md)).
 */
export const ONE: Money = new Decimal(1)

/** Il denaro attraversa il confine di persistenza come stringa decimale (INV-04). */
export const fromString = (value: string): Money => new Decimal(value)

export const toString = (money: Money): string => money.toString()

export const fromNumber = (value: number): Money => new Decimal(value)

export const toDisplayNumber = (money: Money): number => money.toNumber()

/**
 * Arrotonda ai centesimi **per eccesso**, ed è l'unico arrotondamento del progetto.
 *
 * Nasce con la commissione in percentuale (D032): `333,00 € × 1,5%` fa `4,995 €`, e mezzo
 * centesimo non è una cifra che una banca scrive. Fino ad allora non serviva a nessuno, perché
 * niente moltiplicava del denaro per un tasso.
 *
 * **Per eccesso e non al più vicino**, e il verso è una frase di gioco invece di un dettaglio:
 * la casa vince sempre un po'. Mezzo centesimo per operazione non sposta un bilanciamento — la
 * direzione dell'arrotondamento sposta ciò che il gioco dice di sé.
 *
 * Non rompe INV-08: `transfer` costruisce i suoi tre movimenti a partire dalla commissione **già**
 * arrotondata, quindi sommano a zero per costruzione, qualunque cifra essa abbia. L'arrotondamento
 * cade prima della transazione, mai dentro.
 *
 * `ROUND_UP` in decimal.js è «lontano da zero», che su un importo positivo coincide con «verso
 * l'alto». Su un negativo farebbe il contrario di ciò che il nome promette: qui non capita, perché
 * una commissione negativa non esiste — e se un giorno servisse arrotondare un'uscita, quella è
 * un'altra funzione con un altro nome.
 */
export const roundUpToCents = (money: Money): Money =>
  money.toDecimalPlaces(CENTS, Decimal.ROUND_UP)

/**
 * Arrotonda ai centesimi **per difetto**, ed è l'arrotondamento opposto a quello qui sopra.
 *
 * Nasce con [D033](../../../docs/delega/D033-il-bancomat-e-una-pagina.md), dove serve due volte e
 * per lo stesso motivo: **non promettere un centesimo che non c'è**. Il massimo prelevabile lo
 * propone un pulsante, quindi un centesimo di troppo diventa un rifiuto subito dopo aver premuto;
 * l'importo digitato può avere tre decimali, e il terzo non è denaro che questo gioco sappia
 * contare.
 *
 * `roundUpToCents` lo dichiarava già: «se un giorno servisse arrotondare un'uscita, quella è
 * un'altra funzione con un altro nome». È questa, e le due **non si condividono** — la commissione
 * sale, ciò che si offre al giocatore scende, e sono due frasi diverse sullo stesso gioco.
 *
 * `ROUND_DOWN` in decimal.js è «verso zero», che su un importo positivo coincide con «verso il
 * basso». Su un negativo lascia il valore **più vicino** a zero: qui capita solo con un importo
 * digitato col segno meno, che è un rifiuto in ogni caso, e nessuna delle due letture lo salva.
 */
export const roundDownToCents = (money: Money): Money =>
  money.toDecimalPlaces(CENTS, Decimal.ROUND_DOWN)
