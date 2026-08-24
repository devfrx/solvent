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
   * Quanto lo Stato trattiene su un reddito **dichiarato** (ADR 0052).
   *
   * **Non è tarato sul realismo fiscale: è tarato sulla commissione del bancomat.** Chi resta in
   * nero e vuole comunque i soldi sulla carta li versa a mano e paga `ATM_FEE_RATE_IN`, cioè
   * l'1,5%. È quello il confronto vero, perché è l'alternativa che il giocatore ha davvero.
   *
   * **Sotto l'1,5%** dichiarare costerebbe meno che versare, la carta diventerebbe migliore sotto
   * ogni aspetto e i contanti smetterebbero di essere una scelta — il caveau resterebbe un dominio
   * senza clienti, che è ciò che D017 ha già evitato una volta tarando lo sconto della carta.
   *
   * **Sopra il 5%** il verso opposto, ed è il difetto peggiore dei due: restare in nero e premere
   * «deposita» a ogni riempimento verrebbe pagato abbastanza da valere la pena, e avremmo scritto
   * un'ADR per rendere ottimale proprio la mansione che voleva togliere.
   *
   * **Il 3%, cioè il doppio della commissione.** Un punto e mezzo di reddito è il prezzo di non
   * dover guardare il caveau mai più. A sorvegliarlo è `income_tax_rate` in `targets.ts`, non
   * questo commento.
   *
   * **Quando il calore arriverà (fetta 04) questo è il primo numero da rileggere**, perché la
   * carta comincerà a pagare due prezzi invece di uno e l'equilibrio si sposta tutto.
   */
  INCOME_TAX_RATE: fromString('0.03'),

  /**
   * Quanto costa **mettersi in regola**, e si paga solo con la carta — come l'upgrade, e per la
   * stessa ragione: la carta si riempie solo dal bancomat, quindi il prezzo obbliga a passare dal
   * ponte invece di aggirarlo.
   *
   * **50.000,00 € sta fra il quinto livello del caveau (32.000,00 €) e il sesto (64.000,00 €)**, e
   * la posizione è la meccanica: per accumulare questa cifra senza passare la serata al bancomat
   * bisogna prima ampliare, quindi la scala che D042 ha costruito si **attraversa** invece di
   * essere saltata. Un prezzo molto più basso renderebbe la fetta 02 un tutorial da saltare; molto
   * più alto farebbe arrivare la dichiarazione quando il muro non dà più fastidio a nessuno.
   */
  INCOME_DECLARATION_PRICE_CARD: fromString('50000'),

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
   * Quanti euro di contanti stanno in **un'unità di ingombro** (D042, ADR 0051).
   *
   * È la densità dei contanti, ed è il numero che tiene in piedi il muro per sempre: lo spazio del
   * caveau è finito e dichiarato, quindi con una densità ferma la cifra massima che i contanti
   * possano raggiungere è ferma anche lei. Un oggetto — il giorno in cui esisterà — dichiara la
   * **propria** densità e non questa: è per quello che un diamante porta dentro molto valore senza
   * togliere spazio a nessuno, e i contanti no.
   *
   * **Oggi questo numero non cambia niente, ed è la prova che il cambio di unità è stato neutro.**
   * Lo spazio del livello zero si deriva da `CASH_START_CAPACITY` dividendola per questa densità, e
   * la capienza si ottiene rimoltiplicando: la densità **si cancella**, e la scala in euro resta
   * `CASH_START_CAPACITY × crescita^livello` qualunque valore abbia. Misurato portandola a 200: la
   * scala in euro non si muove e `seconds_to_first_wall` resta verde.
   *
   * Ne discendono due avvertimenti, e valgono più del numero. Il primo: **chi la ritocca sperando di
   * spostare il muro non sposta niente** — le leve del muro sono `VAULT_LEVELS` e
   * `VAULT_SPACE_GROWTH`. Il secondo: **diventerà un numero di bilanciamento vero il giorno degli
   * oggetti**, perché il rapporto fra la densità di un oggetto e questa è ciò che deciderà se
   * conviene tenere dentro un quadro o del denaro — cioè la scelta centrale del dominio.
   *
   * Cento, e non un altro numero, per una ragione di leggibilità: il caveau di partenza viene
   * **10 unità** e l'ultimo **2.560**, cifre che si potranno scrivere accanto a un oggetto senza
   * sembrare un codice.
   */
  CASH_PER_SPACE: fromString('100'),

  /**
   * Di quanto lo spazio del caveau cresce a ogni livello.
   *
   * Sostituisce l'elenco delle capienze che stava qui fino a D042. **Una curva e non una lista**
   * per la ragione che la [visione](../../../docs/prodotto/visione.md) dà ai miglioramenti: la
   * scala è un **rapporto**, e un rapporto scritto come cinque cifre è un rapporto che nessuno
   * verifica. Le cifre vecchie andavano ×5, ×4, ×3,75 e ×3,33 — quattro fattori diversi che
   * nessuno aveva scelto.
   *
   * Livelli **finiti** con un tetto dichiarato, e non una curva che si strozza da sola: in un idle
   * «costa più di quanto renda» è un bersaglio mobile, tarato contro la curva del gioco, mentre un
   * tetto si verifica con un test e non si ritara mai (docs/design/domini/vault.md).
   */
  VAULT_SPACE_GROWTH: fromString('2'),

  /**
   * Quanti livelli ha il caveau, contando lo zero. `MAX_LEVEL` è questo numero meno uno.
   *
   * **È la leva della scala, ed è una sola.** Da D042 allungare o accorciare la progressione è
   * cambiare questa cifra: prima erano tredici numeri in tre elenchi, e allungarla voleva dire
   * scriverne altri tre allineati a mano.
   *
   * **Nove, contro i cinque di D017**, e il muro finale resta dov'era — 256.000,00 € contro
   * 250.000,00 €, che è ciò che `vault_max_cash` sorveglia. Cosa cambia è **quante volte** il
   * giocatore incontra la decisione: otto ampliamenti invece di quattro. È bilanciamento, ed è
   * contestabile: arrivare in fondo costa 229.500,00 € contro i 91.400,00 € di prima, cioè due
   * volte e mezzo. Un caveau è un pozzo dove il denaro esce dal gioco, e un pozzo più profondo è
   * ciò che un idle vuole — ma se giocandoci la scala sembra lunga, è **questo** il numero da
   * spostare.
   */
  VAULT_LEVELS: 9,

  /**
   * Il prezzo di un ampliamento, come frazione della capienza del livello **da cui si paga**.
   *
   * È il muro che insegna sé stesso: per pagare in contanti bisogna **poterli tenere**, quindi il
   * caveau va quasi riempito prima di potersi ampliare. Fino a D042 quella frase era un commento, e
   * a renderla vera erano quattro numeri allineati a mano — 900 su 1.000, 4.500 su 5.000, 18.000 su
   * 20.000 e 68.000 su 75.000. I primi tre sono il 90,0% esatto; **il quarto è il 90,7%**, cioè
   * era già scivolato, e nessun test lo guardava. Adesso è una regola.
   */
  VAULT_EXPANSION_PRICE_RATIO: fromString('0.90'),

  /**
   * Quanto si risparmia pagando un ampliamento con la **carta** invece che in contanti.
   *
   * Due euro sembrano nulla, e sono l'unico numero possibile finché il calore non esiste. Chi ha
   * solo contanti, per pagare con la carta, deve prima versarli e lasciare la commissione al
   * bancomat: lo sconto conviene **solo se supera la commissione**, e da D032 la commissione più
   * bassa che possa esistere è `ATM_FEE_FLOOR` — è contro **quel** numero che questo è tarato,
   * perché è il caso peggiore per i contanti. Con uno sconto di 50,00 € i contanti diventerebbero
   * una voce di listino che nessuno sceglie mai — arredamento con dentro del codice — perché la
   * carta non paga ancora niente in cambio della traccia che lascia.
   *
   * **Uno e non quattro.** Fino a D042 erano quattro costanti che portavano tutte lo stesso numero,
   * con scritto accanto che due dichiarazioni della stessa cosa possono divergere: era l'argomento
   * giusto applicato al verso sbagliato, perché a divergere erano proprio loro. Lo sconto è una
   * leva di gioco, e una leva si tiene con una mano sola. Che resti sotto la commissione lo
   * verifica `tests/balance/targets`, non questo commento.
   *
   * Quando il calore arriverà (fetta 04), questo numero è il primo posto da ritarare.
   */
  VAULT_CARD_DISCOUNT: fromString('2.00'),

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
