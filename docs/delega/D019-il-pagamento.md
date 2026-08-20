# D019 — Il pagamento: il listino di un'azione, e chi lo sceglie

- **Stato:** **Chiusa** — scritta il 2026-08-20 ragionando sul sistema di pagamento **prima** di
  eseguire [D017](D017-il-caveau.md), ed eseguita lo stesso giorno: commit `a7c5e85`, ramo `d019-il-pagamento`.
  Vedi _Come è andata_ in fondo
- **Dipende da:** D013 (tutta la fetta 01)
- **Sblocca:** [D017](D017-il-caveau.md), che senza di questa nascerebbe con un pool fisso da
  correggere dopo. E ogni dominio futuro che spende
- **ADR vincolanti:** [0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
  (nuovo), 0003, 0007, 0011, 0017, 0024
- **Regole:** nessuna nuova. Un invariante nuovo: **INV-19**
- **Budget:** ~140 righe di sorgente e ~220 di test. È piccola perché il kernel non si tocca: la
  metà del sistema che sembrava mancare era già lì

## Obiettivo

Togliere dal codice la risposta alla domanda **«con cosa pago?»**, e darla al giocatore — con il
prezzo di ogni strumento scritto accanto.

## Perché esiste, e perché non è dentro D017

L'[ADR 0017](../adr/0017-il-denaro-e-plurale.md) dice che «la scelta _con cosa pago_ è il
meccanismo centrale del gioco». Oggi quella scelta non esiste: `income` compra il suo upgrade con
`spend('card', upgradeCost())`, e il pool è scritto nel sorgente.

I comandi che spendono stanno per diventare due — l'upgrade e l'ampliamento del caveau — e questo
è l'unico momento in cui la domanda si può rispondere senza rifare niente. Prima non si poneva;
dopo, D017 avrebbe già scelto per conto suo, e una meccanica che riguarda tutti i domini disegnata
dentro uno nasce storta. È il difetto A05 con un altro nome.

**Metà del lavoro era già fatta e non si vedeva.** `TransactionMeta.accepts` esiste, il Ledger
rifiuta con `error.ledger.pool_not_accepted` portando l'elenco valido dentro l'errore, e
`error.ledger.insufficient_funds` porta già `pool`, `required` e `available`. Il kernel non ha
bisogno di una riga: quello che manca sta sopra di lui.

## Cosa trovi già fatto

- **`accepts`** ([contracts/ledger.ts](../../src/core/contracts/ledger.ts)) e il rifiuto tipizzato
  con l'elenco dei pool ammessi. Resta **esattamente com'è**.
- **`error.ledger.insufficient_funds` con `pool`, `required`, `available`**: «ti mancano 200 € sulla
  carta» si può già dire, e nessuno lo dice.
- **`UPGRADE_PAYMENT`** in `income/commands.ts`, che è già la dichiarazione esportata di come si
  paga quell'azione — con un commento che spiega perché sta lì. Diventa un listino: cambia forma,
  non intenzione.
- **Il pattern dell'anteprima**: `previewOf` del bancomat costruisce i movimenti che la UI mostra e
  che il comando applica, e il comando **la richiama** invece di riceverli. Il listino si comporta
  allo stesso modo, e non c'è niente da inventare.

## Da produrre

### Contratti

| File                            | Contenuto                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/core/contracts/payment.ts` | `PaymentOption { pool, price }` e il tipo del listino. Nessuna funzione: è vocabolario, e va dove sta il vocabolario condiviso |

Il campo `heat` **non** si scrive: nessuno lo leggerebbe fino alla fetta 04, e arriverà additivo.
Il perché sta nell'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md), fra
le alternative scartate.

### Dominio

| File                                  | Cosa cambia                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/domains/income/rules.ts`    | il listino dell'upgrade: una funzione pura che ritorna le opzioni. Oggi ne ritorna **una** — la carta — e va bene così                            |
| `src/core/domains/income/commands.ts` | `buyUpgrade` riceve il **pool scelto**, ricalcola dal listino e paga quello. `UPGRADE_PAYMENT` diventa il `TransactionMeta` costruito dal listino |
| `src/core/balance/constants.ts`       | il prezzo per strumento dell'upgrade. Oggi un numero solo, ma passa da qui: un importo di gioco non nasce dentro un dominio                       |

### Applicazione

| File                               | Cosa cambia                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/renderer/stores/game.ts`      | il listino esposto ai componenti, e `buyUpgrade` che porta il pool scelto                                                             |
| `src/renderer/components/`         | il pagamento si **vede prima di premere**: con quale strumento, a che prezzo. Con un'opzione sola non c'è selettore, c'è la ragione   |
| `src/renderer/i18n/it.ts`, `en.ts` | le chiavi nuove in **entrambe** le lingue, o il test di parità è rosso. Servono anche le due frasi di `insufficient_funds` arricchito |

## Il selettore vero è di D017, e non è pigrizia

Oggi **nessuna azione accetta due strumenti**. L'upgrade del reddito si paga solo con la carta, e
non è una svista: è la prima volta che il gioco dice «per questo ti serve il conto», e la
[mappa funzionale](../design/mappa-funzionale.md) la elenca fra le cose che possono andare male.

Ne discende che un componente di **scelta** costruito qui non avrebbe nessun caso da servire, e
sarebbe provato solo da un test che si inventa un listino finto. Il primo listino a due voci è
l'ampliamento del caveau, e nasce con [D017](D017-il-caveau.md).

Questa delega costruisce quindi **il listino e la sua lettura**: il giocatore vede con cosa paga e
quanto costa, e quando l'opzione è una sola vede **perché**. D017 estende lo stesso componente al
caso con due, che è una delega più grossa di quanto dicesse — vedi _Cosa lascia a D017_.

## Invarianti

- **INV-19 — il prezzo che il giocatore vede e quello che il Ledger addebita vengono dalla stessa
  funzione.** Non due formule allineate a mano: il listino, interrogato dalla UI per mostrare e dal
  comando per applicare. È INV-11 applicata al pagamento, ed è la stessa forma che `previewOf` ha
  già nel bancomat.
- **Il comando riceve il pool, mai il prezzo.** Un prezzo che arriva dalla UI è un prezzo che la UI
  può cambiare, e INV-19 diventerebbe una promessa invece di una proprietà.
- **`accepts` continua a essere l'ultima parola.** Il listino è ciò che il giocatore vede; il
  rifiuto del Ledger resta la rete sotto. Un listino che offre un pool non dichiarato in `accepts`
  è un difetto, e un test lo prova.
- **Nessun importo nasce dentro il dominio** (regola del progetto): i prezzi del listino vengono da
  `balance/`.

## Fuori scope

- **Il campo `heat` del listino.** Fetta 04. Additivo, e l'ADR 0027 dichiara perché aspettare non
  costa niente.
- **`convertibleTo`** ([ADR 0017](../adr/0017-il-denaro-e-plurale.md)). Con due pool il grafo è un
  arco solo e quell'arco è il bancomat. Grilletto: il terzo pool, le fiches del casinò.
- **La conversione automatica quando i fondi non bastano.** Decisa contro nell'ADR 0027: il gioco
  spiega e offre la via per il bancomat, non converte di nascosto.
- **Il selettore a due o più opzioni.** Di [D017](D017-il-caveau.md), che è dove nasce il primo
  caso.
- **Prezzi diversi per strumento su azioni esistenti.** L'upgrade resta a un prezzo, perché ha uno
  strumento. Il primo listino con due prezzi è quello del caveau.

## Definizione di fatto

- [x] `npm run verify` verde, con l'**output incollato**
- [x] `npm run verify:release` verde
- [x] test: il listino dell'upgrade offre esattamente i pool che `accepts` dichiara — provato
      confrontando le due liste, non ricopiandole
- [x] test: il prezzo mostrato e quello addebitato vengono dalla **stessa** funzione (INV-19),
      verificato per identità e non per uguaglianza — è la trappola che
      [D015](D015-home-bancomat.md) ha pagato alla correzione 14
- [x] test: `buyUpgrade` con un pool **fuori** dal listino è rifiutato, e l'errore dice quali
      andavano bene
- [x] test: con fondi insufficienti l'errore porta `pool`, `required` e `available`, e la UI li
      mostra tutti e tre — oggi ne mostra zero
- [x] test di parità i18n verde: ogni chiave nuova esiste in italiano e in inglese
- [x] ogni test nuovo è stato rotto di proposito almeno una volta
- [x] verifica a mano: si compra l'upgrade, si vede **prima** con cosa si paga e quanto costa, e
      con la carta vuota il gioco dice cosa manca invece di non fare niente
- [x] [ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) passa ad
      `Accettata`
- [x] `docs/tracciabilita.md`: INV-19 ha la sua riga e il suo meccanismo
- [x] la voce «con cosa si paga» esce dal [registro YAGNI](../roadmap-fette.md): non è più una cosa
      che manca

## Cosa lascia a D017

Da scrivere nella delega del caveau prima di eseguirla, perché ne cambia il budget:

- l'ampliamento nasce con un listino a **due** voci, contanti e carta, a prezzi diversi;
- il **selettore** vero — quello con più di un'opzione — è suo, e con esso la scelta di cosa fare
  quando il giocatore ha lo strumento ma non abbastanza;
- il bilanciamento delle due voci non ha ancora il calore, quindi la differenza di prezzo va tarata
  contro **la commissione del bancomat**: pagare con la carta conviene solo se lo sconto supera
  quanto costa portarci i contanti. È un compromesso vero e verificabile oggi, e la fetta 04 gli
  aggiungerà il calore senza smontarlo.

## Trappole note

- **`accepts` e il listino possono divergere in silenzio.** Sono due dichiarazioni della stessa
  cosa, e il giorno in cui una cambia senza l'altra il giocatore vede un'opzione che il Ledger
  rifiuta. Il listino deve **generare** il `TransactionMeta`, non affiancarlo — se il test del
  primo punto della definizione di fatto si scrive ricopiando le due liste, non prova niente.
- **Il listino di uno sembra inutile finché non lo si guarda dalla UI.** La tentazione è saltarlo e
  tenere `spend('card', ...)` finché non ci sono due opzioni. Costerebbe che l'upgrade continui a
  non dire con cosa si paga — che è l'informazione che l'ADR 0017 voleva dare fin dall'inizio — e
  che D017 lo debba convertire mentre fa altro.
- **L'errore ricco è metà lavoro nella UI, non nel dominio.** `insufficient_funds` porta già tutto
  il necessario da D007. Se questa delega finisce senza aver toccato un componente, ha costruito
  un contratto e non un'esperienza.
- **A17.** È una delega piccola che tocca un contratto condiviso, cioè la forma in cui la voglia di
  «già che ci sono» fa più danni. `heat`, `convertibleTo` e il selettore multiplo sono fuori scope
  per ragioni scritte: aggiungerli qui costa poche righe e toglie a chi verrà dopo il caso reale su
  cui provarli.

## Come è andata

Eseguita il 2026-08-20, sul ramo `d019-il-pagamento`.

**Budget.** Dichiarati ~140 righe di sorgente e ~220 di test. Misurate **87 righe di sorgente** e
**204 di test** — righe di codice scritte, commenti e righe vuote escluse, con il metodo di
`codeLines`. Sotto il budget in tutte e due le colonne, e la ragione è quella che la delega
dichiarava: il kernel non si è toccato. Le righe **nette** sono meno ancora, 55 e 146, perché metà
del lavoro è stato sostituire codice esistente invece di aggiungerne.

### Correzioni rispetto a com'era scritta

**1. «Oggi ne mostra zero» era falso, e toglieva lavoro invece di aggiungerne.** La definizione di
fatto diceva che con fondi insufficienti la UI non mostra nessuna delle tre informazioni. Non è
così da [D012](D012-ui-e-i18n.md): la frase è «Ti servono {required} su {pool}, ne hai
{available}.» in tutte e due le lingue, e `IncomePanel.vue` la mostra da allora. Ne discende che le
«due frasi di `insufficient_funds` arricchito» della tabella _Applicazione_ non esistevano da
scrivere. La stessa affermazione sta nell'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
— «si può già dire, e nessuno lo dice» — ed è invecchiata allo stesso modo: l'ADR è append-only, la
riga resta, e a correggerla è questa.

**2. `UPGRADE_COST` diventa `UPGRADE_PRICE_CARD`.** La delega chiedeva a `constants.ts` «il prezzo
per strumento»: se lo strumento non sta nel nome, non c'è un prezzo per strumento — c'è un prezzo e
un commento. Il caveau ne dichiarerà due, e due costanti che si chiamassero entrambe «costo»
sarebbero distinguibili solo leggendo chi le usa.

**3. Il pool fuori listino è rifiutato con `error.ledger.pool_not_accepted`, non con un codice
nuovo.** È lo stesso fatto e porta le stesse due informazioni — quale strumento, quali andavano
bene — quindi il giocatore legge una frase sola. Scrivendo il test è emerso un fatto che vale la
pena sapere: quel rifiuto è **indistinguibile** da quello che il Ledger darebbe da solo, proprio
perché `accepts` è generato dal listino. La guardia dentro il comando non è quindi una seconda
regola: è ciò che permette al comando di compilare quando un prezzo non esiste. A dimostrare che le
due strade coincidono c'è un test che confronta il listino con il **comportamento** del Ledger,
pool per pool.

**4. `canBuyUpgrade` riceve l'opzione, non il prezzo nudo.** Con la firma `(state, price,
available)` chiunque avrebbe potuto passare un numero preso altrove; con `(state, option,
available)` il prezzo può venire solo da una voce del listino. È la stessa ragione per cui il
comando riceve il pool e non il prezzo, applicata all'anteprima.

**5. Lo store espone una funzione, non una `computed`.** `canBuyUpgrade` guardava la carta perché
la carta era l'unica risposta possibile; adesso la domanda ha un argomento, e la risposta è
`canBuyUpgradeWith(pool)`. Con un'opzione sola la differenza non si vede — ed è esattamente il
genere di cosa che, non fatta adesso, [D017](D017-il-caveau.md) dovrebbe disfare.

**6. `contracts/payment.ts` ha un test, anche se non ha funzioni.** Ogni altro file di
`contracts/` ce l'ha, e un file di soli tipi senza test è un contratto di cui nessuno ha mai
verificato che dica quello che crede di dire. Quattro casi su sei sono `@ts-expect-error`, fra cui
quello che tiene il **calore** fuori dal tipo: scriverlo prima della fetta 04 rende rossa una
direttiva inutilizzata, cioè mette il grilletto del [registro YAGNI](../roadmap-fette.md) davanti
al compilatore invece che davanti alla buona volontà.

**7. Due di quei test dichiarano il proprio limite invece di nasconderlo.** `readonly` è una difesa
**di compilazione**: a runtime l'assegnazione avviene e il `push` allunga l'array davvero. I due
casi verificano quello che succede per davvero e lo spiegano, invece di far credere che il tipo
congeli qualcosa. È lo stesso patto delle regole ⚠️ parziali del progetto.

**8. Il pulsante non ha perso il prezzo.** L'alternativa considerata era spostare l'importo nel
riquadro del pagamento e lasciare «Compra» nudo, per non scrivere 800,00 € due volte. Il
[mockup](../design/mockups/fetta-01-primo-stipendio.html) dice «Compra — 800,00 €» ed è approvato
dallo STOP 1, quindi la riga del pagamento porta lo **strumento e la ragione** e il pulsante porta
il prezzo: detto una volta sola, senza toccare una scelta visiva già presa.

**9. `payment.only_with` è una chiave sola, non due.** L'ADR 0027 prevedeva che «ogni prezzo
diventi due chiavi i18n invece di una, perché va detto anche _con cosa_ si paga e _perché_
un'opzione non c'è». Con un listino di uno le due cose sono la stessa frase — «Si paga solo con:
Carta» — e la seconda chiave nasce insieme al primo listino a due voci.

**10. Il buco fra INV-17 e INV-19 adesso ha una spiegazione scritta.** INV-18 è di
[D017](D017-il-caveau.md), che è stata **scritta** prima e viene **eseguita** dopo:
[tracciabilita.md](../tracciabilita.md) lo dice, invece di lasciare un numero mancante che sembra
una dimenticanza.

**11. D017 aveva una riga di budget invecchiata, ed è stata corretta qui.** L'intestazione dice
~330 righe di sorgente e ~410 di test, alzate proprio per il selettore che questa delega le lascia;
la sezione _Cosa ne discende per il budget_ diceva ancora «la stima resta ~250 e ~330». Correggerla
è compito di questa delega, che è quella che quel budget lo ha cambiato.

**12. `architettura.md` cambia in tre punti, pur non spostando nessun confine.** `payment.ts` nasce
dentro un nodo che esiste già (`CON`) e non aggiunge nessun arco, quindi `tests/rules/import-graph`
sarebbe rimasto verde comunque. Ma tre righe elencano i file dei contratti per nome — il nodo del
diagramma, l'albero delle cartelle e la riga di `tests/contracts/` — e lasciarle indietro avrebbe
prodotto un disegno esatto sopra una prosa scaduta.

**13. La misura del renderer è cambiata, e si riscrive invece di ricopiarla.** `verify:release`
compila **91 moduli e 569,02 kB**; allo STOP 2 erano 91 e 565,00 kB.

### Cosa è stato verificato a mano, e come

Il gioco è stato **giocato**, con il metodo di
[D015](D015-home-bancomat.md#cosa-è-stato-verificato-a-mano-e-come): bundle di produzione
(`npm run build`) servito da un server statico, le tre funzioni di `SaveApi` finte al posto del
preload, e un salvataggio con una cifra decisa sulla carta al posto del tempo che in questo
ambiente non passa. Store, Ledger e componenti sono quelli veri.

- **Il pagamento si vede prima di premere.** Il pannello legge _Straordinari · liv. 0 · Aumenta il
  reddito di tutte le fonti. · **Si paga solo con: Carta** · Compra — 800,00 €_. Prima di questa
  delega la riga in grassetto non c'era, e con quale strumento si pagasse si scopriva sbagliando.
- **Con la carta vuota il gioco dice cosa manca.** Il pulsante **non** è disabilitato
  (`disabled === false`, classe `primary amount dim`) e premerlo risponde _«Ti servono 800,00 € su
  Carta, ne hai 0,00 €.»_: tutte e tre le informazioni, come `insufficient_funds` le porta da D007.
- **Con 1.000,00 € sulla carta il giro si chiude.** Il pulsante perde la classe `dim`, l'acquisto
  riesce, il pannello passa a _liv. 1 · Già in funzione_, il riquadro «Reddito» da `+ 12,00 € / s` a
  `+ 18,00 € / s`, «Speso in totale» a 800,00 € e «Sul conto» da 1.000,00 € a 200,00 €.
- **In inglese dice le stesse cose.** Con 100,00 € sulla carta: _Overtime · lv. 0 · **Paid with Card
  only** · Buy — €800.00_, e premendo _«You need €800.00 on Card, you have €100.00.»_

### Le reti sono state rotte una alla volta

Undici rotture indotte, una per volta e con il ripristino subito dopo, raccolte qui in sette righe:
le ultime quattro rompono il contratto in quattro modi diversi e vanno a segno sullo stesso file.
Ogni test nuovo compare almeno una volta in questa tabella.

| Rottura indotta                                                                                                        | Cosa è diventato rosso                                                                      |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| il prezzo del listino diventa una **copia** (`.plus(0)`)                                                               | i **tre** test di identità — e nessuno di quelli di uguaglianza                             |
| `accepts` scritto a mano come «carta e contanti»                                                                       | `domains/income/commands` — 2 casi                                                          |
| il listino risponde con la carta per **qualunque** strumento                                                           | `domains/income` — 5 casi · `renderer/store` — 2 casi                                       |
| il listino offre i contanti invece della carta                                                                         | `domains/income/rules` — 4 casi                                                             |
| `canBuyUpgrade` guarda metà del prezzo dell'opzione                                                                    | `domains/income` — 2 casi · `renderer/store` — 1 caso                                       |
| lo store si costruisce il listino da solo, come lista vuota                                                            | `renderer/store` — 2 casi                                                                   |
| `PaymentOption` perde `readonly` · prende il calore · apre il pool a una stringa · il listino diventa una tupla di uno | il **typecheck**: tre `@ts-expect-error` inutilizzate, e un `TS2322` sul listino a due voci |

La prima riga è la più utile, ed è la lezione della correzione 14 di
[D015](D015-home-bancomat.md): un prezzo copiato passa `toEqual` e rompe INV-19 lo stesso. Sono
tre i test che se ne accorgono, e nessuno dei tre lo farebbe scritto con l'uguaglianza.

L'ultima riga è di un genere diverso: lì il rosso non è un test che fallisce, è il **typecheck**.
Un errore atteso che smette di esserlo — una direttiva `@ts-expect-error` inutilizzata — è
esattamente la forma in cui un contratto si allarga senza che nessuno se ne accorga.

### Cosa deve sapere chi prende D017

- **Il listino c'è, e cosa lascia pronto sta scritto in [D017](D017-il-caveau.md)**, nella sezione
  _L'ampliamento ha un listino_. Non si riscrive: si usa.
- **`accepts` non si scrive più a mano.** Se l'ampliamento del caveau lo scrivesse, le due
  dichiarazioni tornerebbero a poter divergere — e sarebbe il primo caso in cui il giocatore può
  vedere un'opzione che il Ledger rifiuta, perché è il primo listino con più di una voce.
- **La decisione di gioco che resta aperta** è cosa fa la UI quando il giocatore ha lo strumento ma
  non abbastanza. Con un'opzione sola il rifiuto del Ledger è la risposta giusta; con due non basta
  più, e l'ADR 0027 esclude una sola delle vie possibili.
