# ADR 0038 — La commissione scala, il pavimento no

- **Stato:** **Accettata** — [D032](../delega/D032-la-commissione-scala-il-pavimento-no.md): la
  commissione del bancomat è `max(pavimento, importo × tasso)`, con due tassi asimmetrici e
  l'arrotondamento ai centesimi per eccesso. `ATM_FEE` non esiste più
- **Data:** 2026-08-21
- **Origine:** una domanda dell'utente — «quando si arriva ai milioni a chi frega di 2 €?»

## Contesto

[D014](../delega/D014-dominio-bancomat.md) aveva scelto una commissione **fissa**, 2,50 €, uguale
nei due versi, e l'aveva motivata bene:

> con una percentuale il caso "la commissione supera l'importo" non si presenterebbe mai, e con
> esso sparirebbe la dinamica che il caveau della fetta 02 userà — prelevare poco costa
> proporzionalmente molto, quindi conviene prelevare grosso, ma i contanti hanno una capienza.

È vero, ed è ancora vero. Quella scelta però aveva un difetto che nessuno aveva guardato: **una
commissione fissa smette di esistere.** 2,50 € su 500 € sono lo 0,5% e si sentono; su un milione
sono lo 0,00025% e non li nota nessuno.

Ne discende una cosa peggiore di uno squilibrio: il **gesto centrale del gioco diventa gratuito**.
Il bancomat è il posto in cui la dualità contanti/carta smette di essere un'etichetta e diventa una
scelta ([ADR 0017](0017-il-denaro-e-plurale.md)), e lo è perché spostare denaro **costa**. Con una
commissione fissa il costo evapora esattamente nel momento in cui il giocatore ha abbastanza denaro
perché la scelta cominci a contare qualcosa.

Le due strade ovvie sono tutte e due sbagliate:

- **Alzare il numero fisso.** Sposta la soglia in cui evapora, non la toglie. E rende impraticabili
  le operazioni piccole, che sono quelle con cui il gioco comincia.
- **Una percentuale nuda.** Fa sparire la lezione di D014: con la percentuale prelevare poco costa
  proporzionalmente **uguale** a prelevare tanto, quindi «prelevare grosso conviene» smette di
  essere vero. E rende irraggiungibile `error.atm.fee_exceeds_amount`, cioè un ramo di codice che
  esiste e che nessuno può più vedere a schermo — un ramo che marcisce.

## Decisione

**La commissione è il maggiore fra un pavimento e una percentuale dell'importo, e la percentuale è
diversa nei due versi.**

```
commissione(importo, tasso) = max(ATM_FEE_FLOOR, importo × tasso)   arrotondata ai centesimi per eccesso
```

| Costante           | Valore | Cosa dice                                                    |
| ------------------ | ------ | ------------------------------------------------------------ |
| `ATM_FEE_FLOOR`    | 2,50 € | quanto costa un'operazione piccola, qualunque cosa dica il % |
| `ATM_FEE_RATE_IN`  | 1,5%   | depositare, cioè **entrare** nel tracciabile                 |
| `ATM_FEE_RATE_OUT` | 2,0%   | prelevare, cioè **uscirne**                                  |

Tre conseguenze, e ognuna era una delle due strade scartate:

1. **Sotto la soglia di attraversamento la lezione di D014 vale intatta.** La soglia è il pavimento
   diviso il tasso — 166,67 € versando, 125,00 € prelevando — e sotto di lei la commissione è
   piatta, quindi prelevare poco costa proporzionalmente molto.
2. **Sopra, la commissione scala e continua a mordere.** Il 2% di un milione sono 20.000 €.
3. **`error.atm.fee_exceeds_amount` resta raggiungibile premendo un pulsante**, perché il pavimento
   supera 1,00 €, che è il primo degli importi rapidi ed esiste apposta per fallire.

**L'asimmetria dei due tassi è una frase di gioco**, non una taratura: uscire dal sistema
tracciabile costa più che entrarci. È la stessa cosa che il gioco dice in ogni dominio —
l'anonimato si paga — detta dal lato del bancomat. Viene dal canvas di Claude Design, che aveva già
questa forma nel proprio codice (`Math.max(1, importo × tasso)`) e che era stato letto come se
avesse una percentuale nuda.

**Il tasso vive nell'operazione, non nella funzione.** `DEPOSIT` e `WITHDRAW` sono già una tabella
di dati e portano il proprio, così non esiste un `if` sulla direzione da nessuna parte — che è la
stessa ragione per cui `accepts` e `meta` stanno lì dentro (ADR 0017).

**Il pavimento resta 2,50 € e non 1,00 € come il canvas.** `vault_card_discount` confronta lo
sconto della carta del caveau con la commissione **più bassa che possa esistere**, cioè con il
pavimento: se lo sconto sta sotto quello, sta sotto qualunque commissione. A 2,50 € l'intervallo
già in vigore (0,50 – 2,49 €) resta valido e i quattro prezzi di `VAULT_PRICES_CARD` non si
toccano. Il canvas è l'autorità su come una schermata si **vede**, non sui numeri di gioco — è la
stessa distinzione già fatta per il suo `z-index` ([ADR 0037](0037-il-telaio-non-scorre-il-contenuto-si.md)).

## Conseguenze

**È nato il primo arrotondamento del progetto**, e ha fatto scattare un ADR che aspettava.
`333,00 € × 1,5%` fa `4,995 €`, mezzo centesimo: una cifra che nessuna banca scrive, e che con una
commissione fissa non poteva presentarsi perché niente moltiplicava del denaro per un tasso.

`roundUpToCents` vive in `contracts/money.ts` accanto alla primitiva
([ADR 0021](0021-una-sola-primitiva-per-il-denaro.md)), che è **il grilletto scritto
nell'[ADR 0026](0026-la-precisione-del-denaro-e-dichiarata.md)**: _«il meccanismo nasce con la prima
delega che tocca `contracts/money.ts`»_. Quell'ADR è passato ad `Accettata` nello stesso commit, e
la sua decisione è stata **eseguita come era scritta**: `precision: 40`, non le venti cifre
predefinite. La prima stesura di questa delega proponeva di dichiarare il valore che c'era già —
sarebbe stato un ADR eseguito a metà, e il numero non era arbitrario: la
[visione](../prodotto/visione.md) dichiara un bersaglio di scala di ~1e30 €, e con venti cifre il
gioco si romperebbe a 1e20, cioè dieci ordini di grandezza **prima** del bersaglio che si è dato.

Alzarla non ha reso rosso un solo test degli ottocento esistenti, ed era la conseguenza che
l'ADR 0026 temeva di più — `precision` governa anche l'arrotondamento delle divisioni. Le due
soglie che quell'ADR prevedeva sono state misurate e sono esatte: il centesimo esiste fino a 1e37,
`transfer` smette di bilanciare da 1e40.

**Per eccesso e non al più vicino**, e il verso è una decisione: la casa vince sempre un po'. Mezzo
centesimo per operazione non sposta un bilanciamento — la direzione dell'arrotondamento sposta ciò
che il gioco dice di sé.

**INV-08 non si è mossa, e vale la pena dire perché invece di sperarlo.** `transfer` costruisce i
suoi tre movimenti a partire dalla commissione **già** arrotondata, quindi sommano a zero per
costruzione qualunque cifra essa abbia. L'arrotondamento cade prima della transazione, mai dentro.

**Lo store ha perso un selettore, e l'assenza è la parte interessante.** `atmFee` era un `Money`
letto una volta alla costruzione e passato alla carta: funzionava finché la commissione era un
numero. Adesso dipende dall'importo e dal verso, quindi **non è più una cosa che uno store possa
tenere** — chiederla vuol dire chiedere un'anteprima, ed è ciò che `preview` fa già (INV-11). Al
suo posto ci sono i due tassi, che sono l'unica cosa costante rimasta, e la carta dichiara quelli.

**Una partita giocata è cambiata sotto il test che la registra.** `game-roundtrip` compra l'upgrade
da 800 € versando tutto il contante guadagnato: con la commissione fissa bastavano 669 tick, adesso
ne servono 677, perché versare 812,40 € ne costa 12,19 invece di 2,50. **Che quel numero abbia
dovuto salire è la misura di questo ADR**: la commissione ha ricominciato a farsi sentire su un
importo grande.

**Il bancomat continua a non avere un bersaglio di bilanciamento suo.** La
[scheda del dominio](../design/domini/atm.md) lo aveva già trovato con la commissione fissa, e resta
vero adesso: la commissione è tarata **di rimbalzo** da `vault_card_discount`, che è del caveau.
Ritoccare un tasso oggi non rende rosso nessun intervallo. Non si corregge qui — sarebbe un
bersaglio inventato per chiudere una casella — ma la delega che darà al bancomat le sue soglie
giornaliere è il momento in cui va guardato.

## Alternative scartate

**Un tasso solo, uguale nei due versi.** Un numero in meno da bilanciare, e una frase in meno che
il gioco dice. L'asimmetria costa una costante e dichiara che i due versi non sono lo stesso gesto:
è esattamente il tipo di cosa per cui esistono i numeri di gioco.

**Un pavimento a 1,00 € come il canvas.** Avrebbe voluto dire stringere `vault_card_discount` e
ritarare i quattro prezzi della carta del caveau — un cantiere in un altro dominio, aperto dentro
una delega che parla del bancomat ([ADR 0014](0014-una-fetta-verticale-alla-volta.md)).

**Un tetto oltre al pavimento.** «Non più di N €», che è ciò che fanno le banche vere. Nessuno lo
ha chiesto, e un tetto rimetterebbe il difetto da cui questo ADR nasce: sopra la sua soglia la
commissione tornerebbe a evaporare.

**Una commissione che dipende dal calore o dal livello del conto.** È la direzione naturale quando
il calore esisterà (fetta 04), ed è per questo che oggi sarebbe l'astrazione speculativa che l'ADR
0014 vieta. Due tassi costanti e un pavimento sono ciò che il gioco sa dire adesso.
