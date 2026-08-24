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

/**
 * Quanto dura un giorno di gioco, in secondi reali (D040).
 *
 * Fino a D040 questo numero viveva **solo** nella prosa della
 * [visione](../../../docs/prodotto/visione.md) — _«il tempo: un giorno dura due secondi»_ — e
 * nessuna riga di codice lo conosceva. Il tetto di recupero si scriveva in ore reali, cioè
 * nell'unità sbagliata, e nessuno poteva accorgersene contando.
 *
 * **Non è il calendario dell'ADR 0023**, e la distinzione va tenuta: quello è un dominio con
 * stato, che sa che giorno è e fa scattare scadenze. Questo è un **cambio**, senza stato e senza
 * eventi, della stessa specie di `TICKS_PER_SECOND`.
 */
const SECONDS_PER_GAME_DAY = 2

/**
 * Il tetto di recupero, in **giorni di gioco** (D040). Un anno di gioco.
 *
 * **Da dove viene.** La legge della visione è che il progresso offline non batta mai il gioco
 * attivo, e il criterio che ne discende è che ciò che si recupera valga meno di quello che una
 * sessione di gioco vera produce. Un anno di gioco sono dodici minuti reali — è il cambio che la
 * visione dichiara — quindi un'ora di gioco attivo ne vale **cinque**: giocare batte dormire di
 * cinque volte, in qualunque momento, e la strategia «chiudi la finestra» non esiste più.
 *
 * **Cosa sostituisce, e perché era rotto.** Erano otto **ore reali**, cioè 14.400 giorni di gioco,
 * cioè trentanove anni: con un rendimento annuo dell'8% una notte moltiplicava il portafoglio per
 * venti, mentre un'ora di gioco attivo lo moltiplicava per uno e mezzo. Dormire rendeva tredici
 * volte più che giocare — il numero non era sbagliato quando è stato scelto, era stato scelto per
 * un gioco senza mercati.
 *
 * **Un anno e non un mese o un decennio.** L'anno è l'unità in cui la visione ragiona di
 * rendimenti, quindi è l'unica scala su cui si può dire se un recupero è tanto o poco. Sotto,
 * chiudere la finestra per un caffè non lascerebbe niente; sopra, si torna a poter dormire per
 * guadagnare.
 */
const RECOVERY_GAME_DAYS = 365

/**
 * Ogni quanto la serie del patrimonio netto prende un campione, in secondi di gioco.
 *
 * Si scrive in secondi e si converte con il Clock, come `RECOVERY_HOURS`: `50` scritto a mano
 * sarebbe il difetto A04 con un altro nome — la frequenza dei tick riscritta in un secondo posto.
 */
const NET_WORTH_SAMPLE_SECONDS = 5

/**
 * Quanto dura un intervallo di candela, in secondi di gioco (D034).
 *
 * Sta in una costante sua e **non** riusa `NET_WORTH_SAMPLE_SECONDS`, che oggi porta lo stesso
 * numero: un intervallo di candela e una cadenza di campionamento sono due cose diverse, e la
 * prima volta che si vorrà una candela più larga si scoprirebbe di stare spostando anche il
 * grafico del patrimonio.
 */
const INSTRUMENT_CANDLE_SECONDS = 5

/**
 * Ogni quanti secondi la partita si scrive su disco **mentre si gioca** (D041).
 *
 * **Da dove viene, invece di essere scelto perché suona bene.** Il criterio è che ciò che si può
 * perdere resti sotto la cosa più economica che il gioco vende: se una scrittura mancata non costa
 * mai un acquisto, non c'è un momento in cui il giocatore perde una **decisione** invece che del
 * tempo. La cosa più economica è l'upgrade del reddito, `UPGRADE_PRICE_CARD`, a 800,00 €.
 *
 * Il reddito massimo che questo gioco raggiunge oggi è **18,00 €/s** — la base di 12,00 € per il
 * ×1,5 dell'upgrade, che si compra **una volta sola** (`upgraded` è un booleano, non un livello).
 * Ne discende la soglia: 800,00 € a 18,00 €/s sono **44 secondi**, e qualunque cadenza sotto quel
 * numero mantiene il criterio a **qualunque** momento della partita.
 *
 * **Trenta e non quarantacinque**, che sarebbe il limite: al reddito massimo trenta secondi valgono
 * 540,00 € e al reddito base 360,00 €, cioè due terzi e meno della metà dell'acquisto più
 * economico. Il margine non è prudenza generica — è ciò che tiene il criterio in piedi il giorno in
 * cui un moltiplicatore nuovo entra nel gioco, invece di farlo scadere in silenzio come è successo
 * al tetto di recupero tarato in ore reali.
 *
 * **Cosa si paga.** Una scrittura è un round-trip IPC più un `rename` su un payload di poche
 * centinaia di byte: a trenta secondi sono **120 scritture in un'ora** di gioco, contro le sessanta
 * di un minuto. È il lato economico della scelta, e a trenta secondi non morde.
 *
 * Non è un tempo di **gioco** contro un tempo reale: mentre si gioca dieci tick sono un secondo, e
 * i due coincidono. Non coincidono durante un recupero, e quella è la ragione per cui la cadenza
 * coalizza invece di scattare dodici volte (`renderer/runtime/cadence.ts`).
 */
const AUTOSAVE_SECONDS = 30

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
   * Il **pavimento** della commissione del bancomat: quanto trattiene un'operazione piccola,
   * qualunque cosa dica la percentuale.
   *
   * Fino a D032 era tutta la commissione, un importo fisso, con questa ragione di gioco:
   * «prelevare poco costa proporzionalmente molto, quindi conviene prelevare grosso, ma i contanti
   * hanno una capienza». **Quella ragione regge ancora**, ed è esattamente ciò che il pavimento
   * tiene in piedi. Ne mancava un'altra: 2,50 € su un milione non sono una commissione, sono un
   * arrotondamento — il gesto centrale del gioco diventava gratuito proprio quando la scelta
   * cominciava a contare qualcosa.
   *
   * `max(pavimento, importo × tasso)` tiene tutte e due. Sotto la soglia di attraversamento — il
   * pavimento diviso il tasso — la commissione è piatta e vale la lezione vecchia; sopra, scala.
   *
   * **Resta 2,50 € e non 1,00 € come il canvas**, e non è pigrizia: `vault_card_discount`
   * confronta lo sconto della carta con la commissione più bassa che possa esistere, cioè con
   * questo numero. A 2,50 € i quattro prezzi del caveau non si ritarano; più in basso sì, e sarebbe
   * un cantiere in un altro dominio aperto per una cifra che nessuno ha chiesto.
   *
   * Sta qui e non in `domains/atm/` perché `no-magic-numbers` sotto `domains/**` lo impedisce, ed
   * è proprio il punto: un numero di gioco scritto dentro un dominio è un bilanciamento che si
   * sposta da solo.
   */
  ATM_FEE_FLOOR: fromString('2.50'),

  /**
   * I due tassi della commissione, uno per verso, e l'asimmetria è una frase di gioco invece di
   * una taratura: **uscire dal tracciabile costa più che entrarci**. Vengono dal canvas e si
   * prendono così come sono.
   *
   * Sono due costanti e non una con un ricarico calcolato, per la ragione di `VAULT_PRICES_CARD`:
   * un prezzo derivato da un altro non è un prezzo, ed è un numero che non si può cambiare da solo.
   *
   * `Decimal` come tutto il resto di questo file: `0.015` scritto come letterale JavaScript è
   * proprio la perdita di centesimi lungo la catena che l'intestazione dichiara di voler evitare.
   */
  ATM_FEE_RATE_IN: fromString('0.015'),
  ATM_FEE_RATE_OUT: fromString('0.02'),

  /**
   * Gli importi che il bancomat offre. Non è una comodità dell'interfaccia: **sono l'unico modo di
   * scegliere un importo** nella fetta 01, e la scala che hanno decide quanto la commissione si fa
   * sentire. Letti in fila raccontano da soli la regola del bancomat, prelevando: 1,00 € è
   * rifiutato perché la commissione se lo mangia, 10,00 € ne perde un quarto, 100,00 € il 2,5% —
   * e 500,00 € il 2%, che è il tasso nudo. È il punto in cui la curva **smette di scendere**,
   * cioè dove il pavimento finisce e la percentuale prende il suo posto.
   *
   * Da D032 quei quattro numeri dicono una cosa in più di prima: non solo "prelevare grosso
   * conviene", ma **fino a dove** conviene. Oltre la soglia il vantaggio finisce, e il gioco lo fa
   * vedere con quattro pulsanti invece che con una nota nel manuale.
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
   * solo contanti, per pagare con la carta, deve prima versarli e lasciare la commissione al
   * bancomat: lo sconto conviene **solo se supera la commissione**, e da D032 la commissione più
   * bassa che possa esistere è `ATM_FEE_FLOOR` — è contro **quel** numero che questi sono tarati,
   * perché è il caso peggiore per i contanti. Con uno sconto di 50,00 € i contanti
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
   * Il tetto è qui e non nel loop, e si deriva dal Clock invece di essere scritto: `7300` a mano
   * sarebbe il difetto A04 con un altro nome. **L'unità è il giorno di gioco** e non l'ora reale
   * (D040): il perché sta su `RECOVERY_GAME_DAYS`, che è dove il numero si discute.
   */
  RECOVERY_CAP: clock.secondsToTicks(seconds(RECOVERY_GAME_DAYS * SECONDS_PER_GAME_DAY)),

  /**
   * Di quanto al massimo il mondo avanza in un colpo solo, in tick (D040).
   *
   * **Un giorno di gioco.** `Game.advance` cammina l'intervallo che riceve in blocchi di questa
   * lunghezza, e ne discende che una soglia attraversata e rientrata **dentro** un blocco resta
   * invisibile: il blocco è la grana con cui il mondo può cambiare idea. Il giorno è la soglia più
   * stretta che questo gioco nomina — un affitto, una scadenza, un interesse maturano per giorni,
   * mai per frazioni di giorno — quindi è la risoluzione giusta, e non serve pagarne una più fine.
   *
   * **Cosa si paga.** Il costo non è la durata di un blocco ma il loro **numero**: `income.tick` è
   * O(1) in `elapsed` — calcola tasso × elapsed ed emette **una** transazione — quindi N blocchi
   * sono N transazioni invece di una. Al tetto pieno sono 365 blocchi, cioè meno di quanti il
   * gioco ne esegue in un minuto di partita normale a dieci tick al secondo.
   *
   * **Non tocca il tempo reale.** Un frame porta uno o due tick, molto sotto i venti di un blocco:
   * il ciclo gira una volta e il percorso di gioco è identico a prima. È voluto — questa costante
   * cambia il recupero, non la partita.
   */
  ADVANCE_BLOCK: clock.secondsToTicks(seconds(SECONDS_PER_GAME_DAY)),

  /**
   * Ogni quanti tick la partita è dovuta al disco (D041). Il numero è in `AUTOSAVE_SECONDS`, qui
   * c'è solo la conversione: chi bilancia guarda i secondi, non i tick.
   *
   * Fino a D041 il gioco scriveva in **un** momento solo, la chiusura della finestra, e chi non
   * chiudeva — un crollo, un processo terminato — perdeva la sessione intera. La cadenza non
   * sostituisce quella scrittura: le si aggiunge, e la chiusura resta l'unica autoritativa.
   */
  AUTOSAVE_EVERY: clock.secondsToTicks(seconds(AUTOSAVE_SECONDS)),

  /**
   * Quanti campioni tiene la serie del patrimonio netto (D027). È il tetto della lista limitata,
   * quindi anche quante barre il grafico disegna quando la serie è piena: una barra per campione,
   * senza aggregare niente.
   *
   * **Trenta come il canvas**, che disegna trenta barre — è l'unico numero di quel grafico che si
   * può prendere così com'è, perché è un conteggio e non una durata. La sua etichetta «30 days»
   * invece non si può: i giorni di gioco non esistono, e non esisteranno finché non nasce il
   * calendario dell'ADR 0023, che è ancora `Proposta` e non ha una riga di codice.
   *
   * Trenta campioni a uno ogni cinque secondi fanno due minuti e mezzo, e la finestra è scelta per
   * quello che ci sta dentro: il reddito base riempie il caveau di partenza — 1.000,00 € a
   * 12,00 €/s — in poco più di ottanta secondi. Il giocatore vede la salita, il muro che la
   * appiattisce, e cosa succede dopo. Una finestra più corta mostrerebbe solo la salita, che è la
   * metà noiosa.
   */
  NET_WORTH_SAMPLES: 30,

  /**
   * Ogni quanti tick si prende un campione. Il numero è in `NET_WORTH_SAMPLE_SECONDS`, qui c'è
   * solo la conversione: chi bilancia guarda i secondi, non i tick.
   *
   * Un tetto e una cadenza sono **due** numeri e non uno derivato dall'altro, per la ragione di
   * `VAULT_PRICES_CARD`: cambiare quanto è lunga la finestra e cambiare quanto è fitta sono due
   * decisioni diverse, e legarle vorrebbe dire non poterne cambiare una sola.
   */
  NET_WORTH_SAMPLE_EVERY: clock.secondsToTicks(seconds(NET_WORTH_SAMPLE_SECONDS)),

  /**
   * Quante candele tiene la serie di **uno** strumento (D034). È il tetto della lista limitata, e
   * anche quante candele il grafico disegna quando la serie è piena.
   *
   * **Trenta, come la serie del patrimonio, e la coincidenza è voluta**: i tre grafici stanno sulla
   * stessa pagina, quindi coprono la stessa finestra — due minuti e mezzo — e si possono leggere
   * uno accanto all'altro. Se coprissero finestre diverse, confrontare la salita dei contanti con
   * l'andamento del patrimonio sarebbe confrontare due momenti, cioè una bugia disegnata bene.
   *
   * Che siano due costanti e non una è la ragione scritta sopra a `INSTRUMENT_CANDLE_SECONDS`, ed è
   * la stessa di `VAULT_PRICES_CARD`: due valori uguali si possono cambiare uno alla volta, un
   * valore riusato no.
   */
  INSTRUMENT_CANDLES: 30,

  /**
   * Ogni quanti tick una candela chiude e comincia la successiva. Il numero è in
   * `INSTRUMENT_CANDLE_SECONDS`, qui c'è solo la conversione: chi bilancia guarda i secondi.
   *
   * Cinque secondi sono cinquanta tick, cioè fino a cinquanta movimenti del saldo dentro una
   * candela sola: abbastanza perché l'oscillazione dei contanti — il reddito che sale, il tetto del
   * caveau che ferma, il bancomat che abbassa — ci stia dentro tutta.
   */
  INSTRUMENT_CANDLE_EVERY: clock.secondsToTicks(seconds(INSTRUMENT_CANDLE_SECONDS))
} as const
