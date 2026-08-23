# Bancomat — scheda di dominio

- **Stato:** compilata il 2026-08-21 da [D018](../../delega/D018-la-scheda-di-dominio.md), leggendo
  `src/core/domains/atm/`
- **Costruito da:** [D014](../../delega/D014-dominio-bancomat.md), fetta 01; l'anteprima sa della
  capienza da [D017](../../delega/D017-il-caveau.md)
- **Perché è un caso di prova:** **non** ha stato e **non** ticchetta. È il caso più povero
  possibile — soli comandi — e se la scheda non lo regge è la scheda a essere sbagliata
- **A monte:** il blocco 2 della [mappa funzionale](../mappa-funzionale.md)

---

## Metà di gioco

### 1 · L'etichetta

| #   | Voce              | Bancomat                                                                                                       |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | **Rendimento**    | **negativo**, sempre. Ogni operazione lascia alle commissioni **almeno** 2,50 €: è il pavimento, non l'importo |
| 2   | **Varianza**      | **zero**. Non usa l'Rng: dato un importo e un verso, la commissione è sempre la stessa                         |
| 3   | **Liquidità**     | **è la liquidità**. Non la possiede: la converte, ed è l'unico che sa farlo                                    |
| 4   | **Tracciabilità** | **è il punto in cui si sceglie**. Depositare rende il denaro tracciabile, e non si torna indietro gratis       |
| 5   | **Calore**        | **zero**, oggi. Sarà il primo a guadagnarne quando arriverà la fetta 04                                        |
| 6   | **Attenzione**    | bassa per gesto, **la più alta per frequenza**: è il gesto più ripetuto del gioco                              |
| 7   | **Pozza**         | forma 1, **presa in prestito**. Vedi _Come muore_: da solo non satura affatto                                  |
| 8   | **Pagamento**     | **nessun listino**, ed è l'unica azione del gioco senza. Vedi _Cosa questa compilazione ha trovato_            |
| 9   | **Requisito**     | **una carta**. Dichiarato nella visione, non ancora imposto dal codice: oggi nessun dominio si sblocca         |

**La riga 2 adesso si guarda, e non solo si legge.** Da
[D034](../../delega/D034-le-serie-degli-strumenti.md) il cruscotto porta una candela ogni cinque
secondi per i contanti e una per la carta, e in quelle serie non c'è un movimento che non abbia una
causa: o è un tick di reddito, o è un gesto al bancomat. Una voce dell'etichetta che finora si
verificava aprendo `rules.ts` si verifica anche a occhio.

### 2 · Il ciclo

Deposita contanti sul conto, preleva contanti dal conto. Ogni operazione trattiene una commissione:
il maggiore fra un pavimento e una percentuale dell'importo, e la percentuale non è la stessa nei
due versi ([D032](../../delega/D032-la-commissione-scala-il-pavimento-no.md)).

### 3 · Deve vedere, deve decidere, può andare male

**Deve vedere:** i due saldi affiancati; l'importo che sta muovendo; e **prima di confermare**, la
scomposizione esatta — quanto esce, quanto entra, quanto se ne va in commissione.

**Deve decidere:** quanto spostare e in che direzione, sapendo che il contante non scala e la carta
lascia tracce.

**Può andare male:** fondi insufficienti; importo zero o negativo; commissione che si mangia
l'intero importo; capienza del caveau superata in prelievo.

L'ultimo caso è l'unico che il bancomat non poteva conoscere da solo, ed è quello che
[D017](../../delega/D017-il-caveau.md) gli ha insegnato: senza, l'anteprima mostrerebbe la
scomposizione esatta di un'operazione che il Ledger poi rifiuta.

### 4 · Come muore il secondo milione

**Forma 1 — non ci sta. E non è sua:** è la capienza del caveau, che rifiuta il prelievo quando i
contanti in arrivo non entrano.

Da solo, il bancomat **non satura — e oltre una soglia smette anche di migliorare.** Fino alla
soglia di attraversamento, che è il pavimento diviso il tasso — 125,00 € prelevando, 166,67 €
versando — comanda il pavimento e il costo relativo scende: 10,00 € prelevati ne perdono un quarto,
100,00 € il 2,5%. Sopra comanda la percentuale, e il costo resta **piatto al 2%** qualunque sia
l'importo: il 2% di un milione sono 20.000 €. Raddoppiare non dimezza più niente.

**Fino a [D032](../../delega/D032-la-commissione-scala-il-pavimento-no.md) questa riga diceva il
contrario**, e vale la pena tenerlo scritto. Con la commissione fissa il bancomat _migliorava_ con
la scala, e su un milione 2,50 € non li notava nessuno: non uno squilibrio, ma il gesto centrale del
gioco che diventava gratuito esattamente quando la scelta cominciava a contare qualcosa
([ADR 0038](../../adr/0038-la-commissione-scala-il-pavimento-no.md)).

**Non è un difetto, ed è la ragione per cui questa domanda va posta anche a chi non produce niente.**
Il bancomat non è una fonte di guadagno: è una **valvola**. Una valvola che peggiorasse con la scala
renderebbe il gioco più piccolo invece che più difficile — e la scelta «quanto sposto» sparirebbe,
perché la risposta sarebbe sempre «poco». Una che resta proporzionale si fa sentire per sempre senza
chiudersi mai, ed è il pareggio che D032 ha scelto.

Quello che lo tiene onesto è il caveau: si può prelevare grosso solo se si ha dove metterlo.

### 5 · Il requisito, e di che tipo è

**Una carta** — requisito di tipo _strumento_. Oggi la carta esiste dal primo secondo e nessun
codice la pretende: il requisito è **dichiarato e non imposto**, e lo resterà finché la visione non
avrà un dominio che si apre davvero.

Va scritto invece che lasciato intendere, perché è la differenza fra «non serve» e «non è ancora
stato costruito».

**Da [D036](../../delega/D036-il-pagamento-e-un-flusso-solo.md) la carta ha però dei dati veri**, e
uno di essi ha uno scopo. Numero, scadenza e codice non sono più una costante dentro `BankCard3d`:
li deriva `cardOf(seed)` dal seme della partita, quindi **la carta è diversa in ogni partita** — ed
è la prima cosa del gioco a distinguerne una da un'altra guardando lo schermo. Il numero passa il
controllo di Luhn; quello di prima non lo passava.

Il **codice di tre cifre** è la prova che la carta chiede prima di pagarci
([ADR 0042](../../adr/0042-il-pagamento-e-un-flusso-solo.md)): la carta non è uno strumento al
portatore, e chi paga con lei la gira e legge il retro. **Non vale qui**: prelevare non è pagare,
non c'è una scelta di strumento da fare, e la cerimonia di questo dominio è già l'anteprima dei
movimenti. Il grilletto per estenderla è il primo strumento non al portatore che si prelevi senza
passare da un'anteprima.

### 6 · A quali due domini si collega, e come

| Dominio     | Come si collegano                                                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Caveau**  | il caveau decide quanto si può prelevare. L'anteprima gli chiede il tetto **per argomento** e rifiuta con la stessa frase del Ledger |
| **Reddito** | il potenziamento si paga solo con la carta, e la carta si riempie solo qui: senza bancomat il reddito non cresce                     |
| **Calore**  | futuro: depositare grosso sarà ciò che fa notare. Oggi la traccia non costa niente, ed è il buco dichiarato di `vault_card_discount` |

### 7 · Cosa succede a finestra chiusa

**Niente.** È l'unico dei tre a cui non succede assolutamente nulla: non ticchetta, e nessun altro
lo interroga mentre il tempo passa.

Non ha nemmeno un rischio di deriva: non avendo stato, non c'è niente che possa disallinearsi
rispetto ai saldi mentre la finestra è chiusa.

### 8 · Cosa prende in prestito, e cosa presta

**Prende in prestito:** i due pool `cash` e `card` (`contracts/pools.ts`), il conto `fees` — che
però non nomina mai, perché la riga la scrive `transfer` (INV-10) — e il **tetto del pool in
arrivo**, che gli arriva per argomento dallo store.

**Presta:** la propria commissione come **unità di misura**. `ATM_FEE_FLOOR` è il metro contro cui
è tarato lo sconto della carta del caveau: uno sconto che superasse la commissione renderebbe i
contanti una voce di listino che nessuno sceglie mai. Il metro è il **pavimento** e non la
commissione intera, perché è il caso peggiore per i contanti — la commissione più bassa che il
bancomat possa chiedere. Il bancomat non sa di essere quel metro, e il bersaglio che lo usa è di un
altro dominio.

### 9 · Questo dominio si amministra?

**Sì — e la sua pagina è `atm`, che porta il suo nome.** Da
[D033](../../delega/D033-il-bancomat-e-una-pagina.md) è una destinazione sua: due colonne, a
sinistra ciò che si fa e a destra ciò che si guarda
([ADR 0040](../../adr/0040-il-bancomat-e-il-cruscotto-sono-due-pagine.md)).

**Fino a D033 la risposta era un'altra**, e vale la pena tenerla scritta perché spiega una forma
del codice: il bancomat stava sulla `home` insieme al cruscotto, ed era l'unico dei tre domini a non
avere una destinazione col proprio nome. Da lì la ragione per cui `DOMAIN_SCREENS` è una **mappa**
e non l'elenco delle cartelle — il nome del dominio e il nome della destinazione possono non
coincidere. Quella libertà resta utile e resta usata al contrario: `board` e `stats` sono
destinazioni che non hanno un dominio dietro. Semplicemente non è più il bancomat a dimostrarlo.

---

## Metà kernel

| #   | Domanda                               | Bancomat                                                                                                                                                                   |
| --- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Ha stato?                             | **no**, e quindi non ha `system.ts` e non si registra ([D014](../../delega/D014-dominio-bancomat.md), decisione 1). Le soglie giornaliere gli daranno il primo             |
| 2   | Ticchetta? In quale `ORDER`?          | **no**, e non essendo un sistema non ha un `ORDER`. Lo slot `ECONOMY` che gli era stato immaginato è oggi del caveau                                                       |
| 3   | Cosa fa con un `elapsed` grande?      | **niente, e da nessuna parte**: non ticchetta e **nessuno lo interroga dentro il tick di un altro**. È qui che si distingue dal caveau                                     |
| 4   | Soglie che si attraversano?           | **no**. Quelle giornaliere sono future, e saranno il suo primo stato                                                                                                       |
| 5   | Cosa serve fuori dal `SystemContext`? | `ledger` per costruzione (ADR 0024), e la coppia tetto/saldo del pool in arrivo **per argomento**, consegnata dallo store                                                  |
| 6   | Eventi, e domini importati?           | **nessun evento**. **Non importa nessun dominio**, e la scelta è stata fatta due volte: la capienza del caveau arriva per argomento                                        |
| 7   | Quali `Reason` introduce?             | `reason.atm.deposit` e `reason.atm.withdraw`. Più due codici suoi, `error.atm.amount_not_positive` e `error.atm.fee_exceeds_amount`                                        |
| 8   | Tocca il denaro? Quali pool?          | **sì**: `transfer` fra `cash` e `card`, tre movimenti, il terzo su `fees`. **`accepts` è deliberatamente assente**, e l'assenza è esportata perché un test possa guardarla |
| 9   | Conti propri per entità?              | **no**                                                                                                                                                                     |
| 10  | Liste storiche?                       | **no**. Lo storico delle operazioni è dello store, non suo                                                                                                                 |
| 11  | Sapere che giorno è?                  | **no — e sarà il primo a chiederlo.** Le soglie giornaliere sono il grilletto del calendario                                                                               |
| 12  | Usa l'Rng?                            | **no**                                                                                                                                                                     |

**Numeri di gioco introdotti:** `ATM_FEE_FLOOR` (2,50 €), `ATM_FEE_RATE_IN` (1,5%),
`ATM_FEE_RATE_OUT` (2,0%), `ATM_AMOUNTS` (1 · 10 · 100 · 500 €) e `ATM_DEFAULT_AMOUNT`. Il primo
importo esiste **perché fallisce**: senza, il rifiuto dell'anteprima sarebbe raggiungibile solo da
un test — ed è il pavimento a tenerlo raggiungibile, perché una percentuale nuda non arriverebbe
mai a mangiarsi 1,00 €.

I quattro importi rapidi, prelevando, disegnano la curva da soli: 1,00 € rifiutato, 10,00 € al 25%,
100,00 € al 2,5%, 500,00 € al 2% — che è il tasso nudo, cioè il punto in cui il vantaggio di
prelevare grosso **finisce**.

**Bersaglio lasciato:** **nessuno**, e vedi qui sotto.

---

## Cosa questa compilazione ha trovato

**1. Il bancomat non lascia un bersaglio di bilanciamento.** La scheda dice che un dominio senza
bersaglio è un dominio il cui bilanciamento è un'opinione, e il bancomat è il primo caso: la
commissione non è verificata da nessun intervallo suo. È tarata **di rimbalzo**, da `vault_card_discount`, che
è del caveau — quindi cambiare la commissione rende rosso un test che parla d'altro, e chi lo
leggesse non capirebbe subito perché.

Non si corregge qui — [D018](../../delega/D018-la-scheda-di-dominio.md) non tocca `src/` — ma è
esattamente il tipo di cosa che la scheda esiste per far emergere.

**2. Il bancomat è l'unica azione del gioco senza listino.** Ogni altra azione che costa dichiara,
per ogni strumento che accetta, quanto costa con quello
([ADR 0027](../../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)). Il bancomat no, e
la ragione regge: non **compra** niente. La commissione è trattenuta dall'importo che si muove, non
pagata a parte, e non c'è nessuna scelta di strumento da offrire — lo strumento è la direzione.

Ne discende che la voce 8 dell'etichetta ha tre risposte possibili e non due: un listino, un listino
di una voce sola, oppure **nessun listino perché non è un acquisto**.

**3. La risposta alla domanda 3 discrimina, ma non per la ragione che sembrava.** Bancomat e caveau
rispondono tutti e due «non ticchetto». La differenza vera è che il caveau **viene interrogato dentro
il tick di un altro** — è la sua capienza a decidere quanto dell'`elapsed` diventa denaro — mentre il
bancomat è inerte per davvero. La domanda va letta come _cosa gli succede mentre il tempo passa_, non
_cosa fa_.
