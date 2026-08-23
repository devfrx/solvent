# D040 — Il recupero avanza a blocchi, e il tetto si misura in tempo di gioco

- **Stato:** **Chiusa** — ramo `d040-il-recupero-avanza-a-blocchi`, che parte da `main`. Scritta ed
  eseguita il 2026-08-23, in due sessioni diverse. Le tre decisioni aperte sono state prese in
  autonomia su direttiva generale dell'utente, e sono **contestabili**: vedi _Le correzioni_
- **Dipende da:** [D037](D037-il-tempo-che-avanza-e-un-operazione-del-gioco.md), che ha reso
  `Game.advance` l'unica via per far passare il tempo — senza quella, questa delega dovrebbe
  scrivere due volte lo stesso ciclo. E da [D017](D017-il-caveau.md), che ha dato al tetto un
  vincolo vero da incontrare
- **Sblocca:** il **salvataggio a intervalli**, che il
  [registro YAGNI](../roadmap-fette.md) dichiara «lo stesso problema» del progresso offline — ed è
  vero nel meccanismo: tutti e due vogliono che qualcosa succeda ogni N tick di gioco sulla via
  unica. Questa delega costruisce quel gancio; a consumarlo per il disco è la **seconda** delega
  della fetta
- **ADR vincolanti:** [0009](../adr/0009-passo-fisso-e-tipi-branded-per-il-tempo.md) — il recupero
  usa **lo stesso codice** del tempo reale, mai una formula offline;
  [0043](../adr/0043-il-tempo-che-avanza-e-un-operazione-del-gioco.md) — una sola via per avanzare;
  [0019](../adr/0019-transazioni-atomiche-nel-ledger.md) — una transazione è atomica;
  [0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md) — la capienza si chiede
- **Non tocca:** l'[ADR 0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md), che resta
  `Proposta`. Vedi _Trappole note_, punto 1: una **conversione** non è un calendario
- **Regole:** R04 (niente numeri di gioco fuori da `balance/`), R11, **R25** (una sola via per
  avanzare — questa delega la rafforza, non la aggira), INV-20
- **Budget:** dichiarato **per ramo** in _Le tre decisioni aperte_, ed è la lezione di
  [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md): dichiararne uno su tre e rimandare gli
  altri «a dopo le decisioni» produce un ramo consegnato senza un metro. Il ramo consigliato —
  1A + 2 + 3 — è **~120 righe**, di cui meno di venti in `runtime/` e il resto fra `balance/`,
  i test e i documenti vivi

## Obiettivo

Rendere vera la frase su cui poggia l'intera fetta: **il mondo va avanti anche contro di te.** Oggi
non lo è, e non per una svista — per un `advance` solo.

## Perché esiste

Tre problemi misurati, tutti e tre già scritti sotto la riga della fetta nel
[registro](../roadmap-fette.md). Non sono ipotesi, e nessuno dei tre chiede codice nuovo: chiedono
di ridiscutere codice che c'è.

**1 · Il recupero fa un `advance` solo, e le soglie diventano invisibili.**
`recover()` in `stores/game.ts` chiama `stepOf`, poi **una** volta
`game.advance(step.elapsed)`. Una margin call che sarebbe scattata alla seconda ora e si sarebbe
risanata alla sesta non scatta; il calore che sfonda e ridiscende non chiama nessuna indagine.
Finché i domini sono tre e nessuno ha una soglia che si attraversa e si rientra, il difetto non si
vede — ed è precisamente la ragione per cui va chiuso adesso, prima che il blocco A e il blocco B
ci costruiscano sopra.

**2 · Il tetto è tarato in ore reali su un gioco che non le usa.** `RECOVERY_HOURS = 8` in
`balance/constants.ts`. Con un giorno di gioco da due secondi — la [visione](../prodotto/visione.md),
_Il tempo: un giorno dura due secondi_ — otto ore di assenza valgono **quattordicimila giorni**, cioè
**trentanove anni** di gioco. La legge che la visione dichiara è che il progresso offline non batte
mai il gioco attivo; con questi numeri lo batte di tredici volte. Il tetto va dichiarato in **tempo
di gioco**, e il numero è di competenza di questa fetta.

**3 · Il tetto non morde: morde il caveau.** Al primo livello il giocatore recupera 1.000,00 € su
345.600,00 € maturati — lo 0,3% di ciò che `RECOVERY_CAP` permetterebbe; all'ultimo, il 72%. Non è
un difetto ed è la fetta 02 che funziona, ma sposta la domanda di due ordini di grandezza a seconda
di quanto ha ampliato, e va saputo prima di scegliere il numero del punto 2.

### E un quarto, che non è nel registro e va saputo prima di cominciare

**Il singolo `advance` ha già costretto un compenso, e sta scritto in `income/system.ts`.** Il
commento del `tick` dichiara perché non chiede al Ledger e incassa il rifiuto:

> il recupero, che è **un solo** `advance` con tutti i tick arretrati — cioè una transazione sola da
> otto ore di stipendio, e il Ledger la rifiuterebbe intera perché una transazione è atomica
> (ADR 0019). Chi è stato via una notte tornerebbe con **zero**, a caveau vuoto.

Quel `incomeThatFits` esiste per compensare l'assenza dei blocchi. Con il recupero a blocchi la
pressione che l'ha prodotto **si abbassa**: il caveau si riempie progressivamente e la transazione
gigante non esiste più. Non va rimosso — resta corretto e serve al tempo reale — ma va saputo che
questa delega toglie il motivo che lo rendeva indispensabile, invece di stratificarci sopra. È la
differenza fra una toppa e una modifica al centro.

## Le tre decisioni aperte

Nessuna si prende dentro questa delega senza dirlo. Ognuna porta il suo budget, e la prima cambia la
forma di tutto il resto.

### Decisione 1 — dove vive il blocco

**Ramo 1A (consigliato) — il blocco è una proprietà di `Game.advance`.** `advance(elapsed)` cammina
`elapsed` in blocchi di al più `ADVANCE_BLOCK` tick, ripetendo la sequenza che oggi esegue una volta.

- Chi chiama non cambia: `recover()` resta la riga che è, e il loop del frame non se ne accorge —
  con uno o due tick per frame il ciclo gira una volta sola.
- **Ogni** futuro chiamante eredita le soglie: il calendario dell'ADR 0023, un cheat che salta
  un'ora, il salvataggio a cadenza. Nessuno di loro dovrà ricordarsi di spezzare.
- R25 si **rafforza**: continua a esserci una sola via, e adesso quella via sa anche a che
  granularità il mondo può cambiare.
- Budget: **~120 righe** in tutto, di cui **meno di venti** in `createGame.ts`.

**Ramo 1B — il ciclo sta in `recover()`.** Il chiamante spezza, `advance` resta com'è.

- È meno codice **oggi** — cinque righe — e più codice a ogni chiamante nuovo.
- Crea un secondo posto che sa come si fa passare il tempo, che è esattamente ciò che D037 ha
  eliminato: il difetto delle serie nasceva da due sequenze scritte a mano che facevano cose
  diverse. R25 resterebbe verde e la sua ragione sarebbe aggirata.
- Budget: ~70 righe, e un debito che si paga alla prima soglia di un dominio nuovo.

**Perché 1A.** La domanda non è «dove costa meno scrivere il ciclo», è «di chi è la responsabilità
di sapere che il mondo cambia a grana fine». Se è del chiamante, ogni chiamante può sbagliarla in
silenzio, e nessun gate lo vedrà — è la forma esatta del difetto che D037 ha chiuso tre settimane
fa.

### Decisione 2 — il numero del tetto, in giorni di gioco

La visione dà il criterio e non il numero: _«scelto perché quel numero, giocato attivamente, costa
più tempo di quello che è costato dormirci sopra»_. Il numero va **derivato** da lì e scritto con la
derivazione accanto, non scelto perché suona bene. Chi esegue la delega lo propone all'utente con i
conti in mano; il tetto di otto ore reali **non** si conserva, perché è il difetto.

Budget: ~15 righe in `balance/constants.ts`, in tutti i rami. Il numero non cambia la forma del
codice — cambia il gioco, ed è per questo che è una decisione e non un dettaglio.

### Decisione 3 — quanto è lungo un blocco

È l'unico vero compromesso di questa delega, e ha due estremi entrambi sbagliati.

- **Blocco corto** — un blocco di un tick significa che il recupero esegue fino a `RECOVERY_CAP`
  iterazioni. Il tetto esiste perché _«riaprire il gioco dopo giorni non deve bloccare l'avvio per
  minuti»_ (`loop.ts`), e un blocco troppo corto se lo rimangia.
- **Blocco lungo** — un blocco che copre l'intero recupero è lo stato di oggi, con un nome nuovo.

**Il costo si misura, e non è teorico:** `income.tick` è **O(1) in `elapsed`** — calcola tasso ×
elapsed ed emette **una** transazione. Spezzare in N blocchi significa N transazioni nel Ledger e N
emissioni sul Bus invece di una. Il numero di blocchi, non la loro durata, è ciò che si paga.

Il blocco va scelto **misurando** il tempo di un recupero al tetto pieno, non stimandolo, e il
criterio è la soglia più stretta che il gioco deve poter vedere. Budget: identico nei due rami —
è una costante in `balance/` più la misura da allegare alla delega chiusa.

## Da produrre

### 1 · `ADVANCE_BLOCK` e il tetto in giorni di gioco, in `balance/constants.ts`

`RECOVERY_HOURS` esce. Al suo posto:

- `SECONDS_PER_GAME_DAY`, la conversione fra secondo reale e giorno di gioco, che oggi vive solo
  nella prosa della visione e in nessuna riga di codice;
- `RECOVERY_GAME_DAYS`, il tetto **dichiarato in giorni di gioco**, da cui `RECOVERY_CAP` si deriva
  con il `Clock` come si deriva adesso;
- `ADVANCE_BLOCK`, in tick, con la misura che l'ha scelto scritta accanto.

Tutti e tre con il commento che dice **perché quel numero**, come già fanno `NET_WORTH_SAMPLE_SECONDS`
e `INSTRUMENT_CANDLE_SECONDS`.

### 2 · `Game.advance` cammina a blocchi

Nel ramo 1A. La sequenza interna resta quella che è — `registry.tickAll` e poi `chronicle.advance`,
in quest'ordine, che è l'ordine su cui poggia il campionamento — e a cambiare è quante volte gira.
`ADVANCE_BLOCK` arriva **per costruzione**, non importato: `createGame` già riceve ciò che
`balance/` gli dà, ed è l'[ADR 0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md).

### 3 · `Step.dropped` smette di essere ignorato

Il campo esiste dal loop di [D011](D011-runtime-e-store.md), è provato, e **nessuno lo consuma**: lo
store lo riceve e lo butta. Il [registro](../roadmap-fette.md) dichiara questa fetta come il suo
grilletto, perché è la prima in cui il tetto morde davvero e «quanto tempo hai perso» diventa
un'informazione di gioco. Va esposto dallo store accanto ad `awayFor`, e detto al giocatore in due
lingue.

### 4 · Il commento di `sampleOf` va riscritto, perché questa delega lo smentisce

In `runtime/loop.ts` sta scritto:

> **Il tetto del recupero produce un campione solo, non millecinquecento.** […] non ci sono valori
> intermedi da campionare […] Dividere quel salto in barre finte sarebbe disegnare numeri che
> nessuno ha mai avuto.

Era vero e smette di esserlo: con i blocchi quei valori intermedi **esistono davvero**, e le barre
non sono finte. È il punto in cui si verifica che la delega abbia funzionato — dopo un recupero il
grafico deve disegnare una **curva**, non un salto — e la prova sta lì.

### 5 · I documenti vivi che nominano ciò che cambia

[flusso-tick.md](../design/flusso-tick.md) disegna il percorso dal frame al tick e va riletto contro
il codice nuovo; [ciclo-di-vita.md](../design/ciclo-di-vita.md) descrive lo stato `Recupero`;
[qualita.md](../qualita.md) prende la misura del recupero al tetto pieno. Non è un elenco da
obbedire alla cieca: è dove guardare, e la regola resta _rileggere i documenti vivi che nominano ciò
che hai cambiato_, non solo quelli che la delega elencava.

## Invarianti

1. **Nessuna formula offline.** Il recupero esegue lo stesso `advance` del tempo reale, più volte.
   Se compare una funzione che calcola il guadagno di N tick senza eseguirli, l'ADR 0009 è stato
   violato e la delega è da rifare.
2. **Una sola via per avanzare.** R25 resta verde **e** la sua ragione resta intatta: fuori da
   `createGame.ts` nessuno del renderer nomina `tickAll`, e nel ramo 1A nessuno spezza il tempo per
   conto proprio.
3. **Il totale non cambia.** A parità di tick recuperati, la somma incassata a blocchi deve
   coincidere con quella a passo unico **quando nessuna soglia è di mezzo**. È il test che dice se
   il ciclo perde un resto — lo stesso difetto che `stepOf` evita restituendo `pending`.
4. **La partita doppia regge a ogni blocco.** N transazioni invece di una sono N occasioni di
   sbagliare: ogni blocco somma a zero, e la prova è quella che il Ledger già impone.
5. **Nessun numero di gioco fuori da `balance/`** (R04): tetto, conversione e blocco stanno lì, e il
   `Clock` resta l'unico posto che conosce `TICKS_PER_SECOND`.

## Fuori scope

- **Il calendario dell'ADR 0023.** Una conversione fra secondi e giorni non sa che giorno è, non ha
  stato e non fa scattare niente. Vedi _Trappole note_, punto 1.
- **Il salvataggio a intervalli.** Stesso problema, seconda delega della fetta: questa costruisce il
  gancio, quella lo usa. Costruirli insieme mescolerebbe correttezza della simulazione e durabilità
  del dato in un unico verde, e non si saprebbe quale delle due ha funzionato.
- **Soglie vere da attraversare.** Non ce ne sono ancora: nessuno dei tre domini ha una condizione
  che scatta e rientra. Questa delega costruisce la **possibilità** di vederle, e la prova che
  funzioni sta nel test, non in un dominio nuovo inventato per l'occasione.
- **Rimuovere `incomeThatFits`.** Resta corretto per il tempo reale. Questa delega toglie la
  pressione che lo rendeva indispensabile e lo dichiara; toglierlo è un'altra decisione.
- **Una velocità di gioco regolabile.** Non esiste, e non nasce qui.

## Definizione di fatto

- [ ] `npm run verify` e `npm run verify:release` verdi.
- [ ] Un test che recupera N tick a blocchi e N tick in un passo solo e confronta il **totale**, con
      nessuna soglia di mezzo: identico al centesimo.
- [ ] Un test con una soglia in mezzo — il caveau che si riempie a metà recupero — che a passo unico
      dà un risultato e a blocchi ne dà un altro, **e il secondo è quello giusto**. È il test che
      giustifica l'intera delega: se non si riesce a scriverlo, la delega non serviva.
- [ ] Le tre costanti nuove hanno accanto la derivazione, non il valore soltanto.
- [ ] **La misura del recupero al tetto pieno**, presa e scritta in [qualita.md](../qualita.md) con
      la data: è il numero che giustifica `ADVANCE_BLOCK`, e senza è una scelta a sentimento.
- [ ] `Step.dropped` arriva al giocatore, in italiano e in inglese, o il test di parità è rosso.
- [ ] Il commento di `sampleOf` dice il vero.
- [ ] La finestra vera guardata con `scripts/cdp.mjs`: dopo un recupero il grafico disegna una
      curva. Un `Runtime.evaluate` dice **se c'è**, un'immagine dice **se è bella** — servono tutte
      e due.
- [ ] Le correzioni rispetto a com'era scritta questa delega, in fondo. Se esce senza, o era
      perfetta o non è stata letta.

## Trappole note

1. **Una conversione non è un calendario, e qualcuno dirà di sì.** `constants.ts` porta scritto che
   «i giorni di gioco non esistono, e non esisteranno finché non nasce il calendario dell'ADR 0023».
   Resta vero: quell'ADR riguarda un dominio con **stato**, che sa che giorno è e fa scattare
   scadenze. `SECONDS_PER_GAME_DAY` è un cambio, senza stato e senza eventi, della stessa specie di
   `TICKS_PER_SECOND`. Se questa distinzione non viene scritta nella delega chiusa, la prossima
   sessione la rifarà da capo o la «correggerà».
2. **Il ciclo che perde il resto.** È il difetto che `stepOf` documenta e che _«nessuno noterebbe se
   non contando i tick»_. Un `for` che avanza a blocchi di `ADVANCE_BLOCK` e dimentica l'ultimo
   blocco parziale perde fino a un blocco intero di reddito a ogni recupero. L'invariante 3 esiste
   per questo, e va rotto di proposito una volta.
3. **`withheld` descrive l'ultimo blocco, non il recupero.** È un mirror per tick — «Zero quando
   tutto entra» — e con i blocchi diventa lo stato dell'**ultimo**. Dopo un recupero che ha riempito
   il caveau a metà strada, dirà la verità sull'ultimo blocco e non su quanto è stato trattenuto in
   tutto. Va deciso se basta, non scoperto dopo.
4. **La finestra nascosta non compone frame.** È la quarta trappola del guardare, in
   PASSAGGIO-DI-CONSEGNE: con la porta di ispezione aperta la pagina è `hidden`, e
   `requestAnimationFrame` non arriva. Un recupero però **non** passa dal frame — parte dal
   caricamento — quindi è l'unica cosa di questo progetto che si può guardare a finestra nascosta.
   Vale il contrario di ciò che si è imparato finora, ed è facile perderci mezz'ora.
5. **Il tempo di avvio è un requisito, non una conseguenza.** Se il recupero al tetto pieno blocca
   l'avvio più di quanto blocchi oggi in modo percepibile, `ADVANCE_BLOCK` è sbagliato — non è il
   prezzo della correttezza. Il tetto esiste proprio per quello, e questa delega non ha il permesso
   di spenderlo.

## Le correzioni rispetto a com'era scritta

Nove, e le prime tre sono le decisioni che la delega lasciava aperte. Sono state prese **in
autonomia** su direttiva generale dell'utente — «coerenza, zero debiti futuri, professionalità,
stato dell'arte, non pigrizia» — e per la regola di _Come si lavora_ sono **contestabili**: chi
vuole ridiscuterle trova qui il conto che le ha decise.

1. **Decisione 1 — ramo 1A, il blocco dentro `Game.advance`.** È quello che la delega consigliava, e
   non è stato scelto per obbedienza: il ramo 1B lasciava R25 verde mentre la sua ragione veniva
   aggirata, che è la forma peggiore di debito — una regola che passa mentre il difetto che
   impedisce è tornato. La decisione ha il suo
   [ADR 0049](../adr/0049-il-mondo-avanza-a-blocchi.md), perché senza qualcuno la «semplificherà»
   spostando il ciclo nel chiamante.
2. **Decisione 2 — il tetto è un anno di gioco**, cioè dodici minuti reali, `RECOVERY_GAME_DAYS =
365`. Derivato dal criterio della visione invece che scelto: un'ora di gioco attivo vale cinque
   anni, quindi giocare batte dormire di **cinque volte** in qualunque momento, e la strategia
   «chiudi la finestra» smette di esistere. Erano otto ore reali, cioè trentanove anni, cioè dormire
   che rendeva tredici volte più che giocare. L'anno e non il mese o il decennio perché è l'unità in
   cui la visione ragiona di rendimenti.
3. **Decisione 3 — il blocco è un giorno di gioco**, venti tick. Il giorno è la soglia più stretta
   che il gioco nomina: niente matura per frazioni di giorno. **Misurato e non stimato**, come la
   delega pretendeva: 365 blocchi in 2,7 · 1,8 · 0,9 ms, in [qualita.md](../qualita.md) con la data.
   Il margine sul vincolo — «non bloccare l'avvio per minuti» — è di tre ordini di grandezza.
4. **Il primo dei tre problemi non è stato risolto: è cambiato di natura**, e la delega non lo
   prevedeva. Con il tetto a un anno di gioco il recupero matura 8.760,00 € al reddito base, meno
   del caveau di partenza: a mordere adesso è il **tetto**, a ogni livello del caveau. Il registro
   diceva «il tetto non morde, morde il caveau», e adesso è il contrario — che è ciò che un tetto
   deve fare.
5. **`Step.dropped` è uscito in millisecondi, non in tick.** La delega diceva «va esposto dallo store
   accanto ad `awayFor`», e accanto vuol dire nella stessa frase: due unità diverse avrebbero
   costretto il `.vue` a convertirne una, cioè a calcolare (R05). La conversione è del Clock e sta
   nello store; il campo si chiama `droppedFor` per assonanza con `awayFor`.
6. **Quattro test sono stati invertiti, non cancellati**, ed è la parte che va guardata con più
   sospetto di tutte. Chiedevano **un** campione dopo un recupero, e avevano ragione: senza blocchi
   i valori intermedi non esistevano. Adesso chiedono trenta, e ognuno dei quattro porta scritto
   perché l'attesa vecchia era giusta allora e sbagliata adesso — un test cambiato senza quella riga
   è indistinguibile da un test indebolito.
7. **Il test che giustifica la delega non c'era nella definizione di fatto nella forma in cui è
   finito.** Chiedeva «una soglia in mezzo che a passo unico dà un risultato diverso», ma con tre
   domini e nessuna soglia che si attraversa e si rientra i **totali** coincidono: a differire è la
   **forma**. Il test scritto prova quello — un recupero corto disegna dieci candele crescenti e
   tutte distinte, dove prima ce ne sarebbe stata una — ed è una prova più onesta di quella promessa.
8. **La misura del tempo di avvio ha reso la decisione 3 quasi indolore, e va detto.** La delega la
   presentava come «l'unico vero compromesso». Misurata, non lo è: a tre millisecondi il compromesso
   non morde, e sarebbe stato possibile scegliere un blocco molto più fine. Non è stato fatto perché
   nessuna soglia del gioco matura sotto il giorno — la ragione è il dominio, non la prestazione.
9. **Il ramo è stato provato rompendolo**, e il conto sta qui: un ciclo che salta l'ultimo blocco
   parziale fa cadere **sei** test, fra cui i due che contano il resto. Il file è stato copiato
   prima e ripristinato con un `diff` che conferma l'identità.

### Cosa è stato guardato nella finestra vera

Con `scripts/cdp.mjs`, che è la prima delega a usarlo dopo D039. Il recupero dura tre millisecondi,
quindi non si fotografa: si è retrodatato il salvataggio di un'ora e riaperto il gioco.

- **Trenta campioni e trenta candele al caricamento**, tutte distinte e crescenti, da 67.219,20 € a
  68.959,20 €. Prima di D040 sarebbe stato **uno**.
- **Il grafico del patrimonio disegna una curva continua** da 70.978,70 € a 72.706,70 €, e l'immagine
  è stata guardata: è la differenza fra sapere il totale e vedere cosa è successo.
- **La riga del tempo scartato è stata letta forzando lo stato dal di dentro**, perché il velo del
  recupero vive tre millisecondi e il loop rimette `playing` al frame dopo: «Sei stato via 1 ora. Il
  tetto di recupero ne ha scartati 47 minuti.»
- **Il salvataggio dell'utente è stato copiato prima e ripristinato identico dopo**, e l'app è stata
  **terminata** invece che chiusa: chiudendola avrebbe salvato la partita di prova sopra la sua.
