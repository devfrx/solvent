# D027 — Un grafico è una serie, e nessuno la tiene

- **Stato:** **Chiusa** — eseguita il 2026-08-21. Le due decisioni sono state prese con l'utente, e
  la seconda è stata presa **due volte**: prima CSS, poi — a grafico costruito e guardato —
  libreria, da cui l'[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md). Guardare l'applicazione
  ne ha aggiunte altre due che la delega non prevedeva. Vedi _Le decisioni prese_, _Le correzioni_ e
  _Il consuntivo_ in fondo
- **Dipende da:** [D026](D026-dove-si-attacca-un-dominio.md) — il cruscotto ha un posto solo da
  quando la home è la pagina del dominio `atm` e il cruscotto è la fascia sotto, che non appartiene
  a nessun dominio ([ADR 0033](../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)). Prima di
  D026 un grafico non aveva un indirizzo: sarebbe finito dove c'era posto, che è come il caveau è
  finito dentro i contanti
- **Sblocca:** il cruscotto che vale la pena riaprire, e il primo storico del progetto. Ogni
  dominio che dopo vorrà un grafico trova la serie già tenuta da qualcuno
- **ADR vincolanti:** [0018](../adr/0018-la-home-e-un-atm.md) — il tetto dei riquadri e l'ordine
  delle due zone —, [0010](../adr/0010-liste-storiche-limitate-alla-definizione.md), che è
  `Proposta` e che la decisione 1 può far diventare `Accettata`,
  [0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md) se si sceglie una libreria,
  [0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md) con **R15**, e
  [0014](../adr/0014-una-fetta-verticale-alla-volta.md). Uno nuovo **solo** nel ramo con la
  libreria: sarebbe **0034**, ed è la decisione 2
- **Regole:** nessuna nuova prevista se il grafico si disegna in CSS. Una libreria ne tocca due
  senza aggiungerne: **R15**, perché le librerie di grafici dipingono i propri colori, e
  `tests/rules/core-deps`, che elenca cosa può entrare
- **Budget:** ~120 righe di sorgente e ~60 di test **se** la serie sta in memoria e il grafico si
  disegna in CSS. Gli altri tre incroci non si stimano prima delle decisioni, ed è dichiarato
  invece che mediato: un budget solo nasconderebbe che le strade costano diverso. È lo stesso
  motivo per cui [D026](D026-dove-si-attacca-un-dominio.md) ne dichiarava due

## Obiettivo

Dare al cruscotto un grafico che dica **come è andata**, e non solo com'è adesso.

## Perché esiste, e perché adesso

L'[ADR 0018](../adr/0018-la-home-e-un-atm.md) dice una cosa che oggi il gioco non mantiene: «in un
idle game le statistiche _sono_ il contenuto», e sono l'unica ragione per riaprirlo. Il cruscotto
che quell'ADR ha prodotto è fatto di numeri **istantanei**: patrimonio, guadagnato, speso,
commissioni, reddito al secondo. Un numero istantaneo dice dove sei. Non dice se stai salendo, e
quindi non è una ragione per riaprire niente.

**E adesso c'è un posto dove metterlo.** [D026](D026-dove-si-attacca-un-dominio.md) ha deciso che il
cruscotto è la fascia sotto il bancomat e che non appartiene a nessun dominio — è, testualmente, il
solo pezzo di interfaccia del progetto che sta lì perché non è di nessuno. Prima di quella decisione
un grafico si sarebbe attaccato dove c'era spazio.

## Il fatto che decide tutto: la serie non esiste

Non è un'opinione ed è verificabile in tre righe di sorgente.

| Dove                              | Cosa c'è                                                        | Cosa non c'è                            |
| --------------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| `src/core/contracts/save.ts`      | `SavePayload` ha `ledger`, `rng` e `systems`                    | nessuno storico, di nessun tipo         |
| `src/renderer/stores/game.ts`     | `history`, un `boundedList` di transazioni, **solo in memoria** | niente che sopravviva a un riavvio      |
| `src/renderer/components/ledger/` | l'estratto conto, che legge quella lista                        | niente che aggreghi, campioni o ricordi |

Ne discende che **il lavoro vero di questa delega non è il disegno: è chi tiene la serie.** Un
grafico attaccato a ciò che esiste oggi disegnerebbe numeri inventati, ed è precisamente la
correzione 1 di [D015](D015-home-bancomat.md) — il sesto riquadro rifiutato perché riempirlo voleva
dire inventarlo.

C'è anche una seconda ragione, ed è nel [registro YAGNI](../roadmap-fette.md): il reddito emette una
transazione per tick, quindi dopo due secondi la lista in memoria è tutta stipendio. Anche volendo
disegnare quella, si disegnerebbe una riga piatta fatta di una cosa sola.

## Cosa dice il mock, e va saputo prima di scegliere

L'utente ha consegnato il canvas di Claude Design — lo stesso file da cui è nato
[D023](D023-il-design-system.md), quindi i token, i due caratteri e i ruoli di colore che ne
discendono sono **già** nel codice. Il canvas disegna un grafico e lo chiama «Net worth · 30 days».
Letto nel sorgente invece che guardato:

- non usa **nessuna libreria**: sono trenta `<div>` in fila, con l'altezza scritta in percentuale;
- ogni barra ha **due segmenti** sovrapposti, cioè due serie impilate, con i colori presi dai token;
- l'asse in basso sono quattro etichette — `DAY 01`, `DAY 10`, `DAY 20`, `DAY 30` — e non un asse
  calcolato;
- sopra il grafico stanno una cifra grande e un delta, con accanto la frase «vs. last week»;
- in tutto il file, che comprende anche le schermate di black market, immobiliare, impresa, casinò e
  crypto, non compare **un solo** `<svg>`, `<canvas>` o `polyline`.

**Questo non chiude la decisione 2: la sposta.** Il disegno che si vuole copiare non chiede una
libreria, quindi una libreria non si prende per _questo_ grafico — si prende, semmai, per ciò che
verrà dopo, e allora va scelta contro quello e non contro il mock.

## Le decisioni aperte

Sono due, e non sono di chi scrive la delega. **Chi esegue le porta all'utente prima di scrivere una
riga**, con le strade e i costi, e scrive quale è stata scelta e perché — nella delega e, se il ramo
lo richiede, nell'ADR.

### Decisione 1 — chi tiene la serie

| Strada                                                                                                                                                                                       | Cosa costa                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **La serie sta in memoria.** Un `boundedList` nello store, un campione ogni N tick, niente nel salvataggio                                                                                   | poco, e il grafico **riparte vuoto a ogni avvio**: non può dire «rispetto a ieri», e il giocatore che riapre dopo otto ore trova un grafico più povero di quando ha chiuso — cioè il contrario di ciò per cui riapre                                                                                    |
| **La serie è di un sistema e si salva.** Un `boundedList` dentro `SystemsSave`, con il tetto scritto nella definizione ([ADR 0010](../adr/0010-liste-storiche-limitate-alla-definizione.md)) | un sistema che la tiene, una migrazione dello schema, e il **primo** `boundedList` che entra davvero nel salvataggio — che è una riga del [registro YAGNI](../roadmap-fette.md) con il suo grilletto, e farla scattare qui va detto invece che subito. In cambio l'ADR 0010 smette di essere `Proposta` |

**E c'è un vincolo che vale per tutte e due, e va guardato prima di scegliere.** «Trenta giorni»
vuol dire trenta **giorni di gioco**, e chi sa che giorno è non esiste: è il calendario dell'[ADR
0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md), che è `Proposta` e non ha una riga
di codice. Senza calendario l'asse di questo grafico è «gli ultimi N campioni», non «trenta giorni»
— ed è una differenza che il giocatore vede.

### Decisione 2 — libreria o CSS

| Strada                                                                              | Cosa costa                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **In CSS, come il mock.** Barre in `flex`, altezze in percentuale, colori dai token | zero dipendenze, zero ADR, **R15 non si tocca** e i due temi funzionano da soli perché i colori sono già quelli del design. Non dà assi calcolati, tooltip sui punti, zoom, serie continue né interpolazione: il giorno in cui una di quelle cose serve davvero, si rifà                                                                           |
| **Una libreria di grafici**                                                         | una dipendenza di runtime, quindi un ADR ([0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md) ne detta il criterio) e il peso nel bundle del renderer, che sta in [qualita.md](../qualita.md) con la data accanto. Va pesata contro **R15**: una libreria che dipinge i propri colori non è configurabile in due temi senza combatterla |

**Una cosa che chi decide deve sapere, perché non è colpa di questa delega:** in questa repo
`npm install` non funziona — `electron-vite@5` regge `vite` fino alla 7 e il progetto è sulla 8 — e
l'unico comando che installa è `npm ci --legacy-peer-deps`, che però ignora i peer. È la correzione
8 di [D023](D023-il-design-system.md), ed è aperta. Aggiungere una dipendenza qui costa più che
altrove finché quella causa non è chiusa.

## Da produrre

La tabella non si può chiudere prima delle due decisioni. Quello che si può dichiarare è il
**perimetro**, e questo è vincolante:

| Cosa                              | Vincolo                                                                                                                                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| chi tiene la serie                | uno solo, e dichiarato: la decisione 1 dice se è lo store o un sistema                                                                                                                                                        |
| il componente del grafico         | sta in `src/renderer/components/`, in una cartella che l'[ADR 0033](../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md) ammette: non è di un dominio, quindi o è `shell/` o la lista chiusa si allarga con la sua ragione |
| `src/renderer/views/HomeView.vue` | il grafico entra nella fascia del cruscotto, **sotto** il bancomat: l'ordine dell'ADR 0018 non si tocca                                                                                                                       |
| `docs/adr/0034-*.md`              | **solo** se la decisione 2 sceglie la libreria                                                                                                                                                                                |
| `docs/architettura.md`            | l'albero e il diagramma nello stesso commit, se nasce una cartella o un sistema (C13)                                                                                                                                         |
| `docs/tracciabilita.md`           | toccato solo se nasce una regola                                                                                                                                                                                              |
| `docs/roadmap-fette.md`           | le righe del registro YAGNI il cui grilletto scatta qui **escono dal registro** e si dichiarano                                                                                                                               |
| `tests/`                          | il campionamento è una funzione pura e si prova da sola; se nasce una regola, il suo gate va rotto apposta                                                                                                                    |

## Invarianti

- **Il grafico non è un riquadro travestito.** INV-12 conta i `<StatTile>` di `views/HomeView.vue`,
  quindi un grafico gli è invisibile per costruzione. Il tetto dell'[ADR 0018](../adr/0018-la-home-e-un-atm.md)
  esiste per impedire al cruscotto di mangiarsi il bancomat: aggirarlo con un pezzo che il test non
  sa contare sarebbe rispettarne la lettera e violarne l'unico scopo.
- **Nessun numero di gioco nasce nella UI.** Ogni tetto — quanti campioni, ogni quanti tick — è un
  numero di bilanciamento e vive in `src/core/balance/`, non nel componente (R04).
- **Nessun colore fuori dai token** (R15). Vale anche per una libreria, e se una libreria non lo
  permette la risposta è che quella libreria non entra.
- **Una lista storica nasce con il suo limite** ([ADR 0010](../adr/0010-liste-storiche-limitate-alla-definizione.md)).
  Il difetto A10 del progetto precedente era un salvataggio senza dimensione massima calcolabile.
- **Il campionamento è puro e si prova senza montare niente.** «Quali campioni tenere» è una
  funzione da una lista a una lista: è la stessa forma di `components/ledger/postings.ts`, e si
  prova allo stesso modo — senza jsdom, che il progetto ha già lasciato fuori due volte.

## Fuori scope

- **La plancia con i riquadri riordinabili.** È nel [registro YAGNI](../roadmap-fette.md) con il suo
  grilletto — la prima schermata che ha più riquadri di quanti ne stiano fermi — e un grafico non lo
  fa scattare.
- **Il calendario.** Se la decisione 1 pretende i giorni di gioco, il calendario è una **delega sua**
  ([ADR 0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)): è un dominio con stato,
  salvataggio ed eventi sul Bus, e infilarlo qui sarebbe costruire due cose insieme
  ([ADR 0014](../adr/0014-una-fetta-verticale-alla-volta.md)).
- **I grafici degli altri domini.** Immobiliare con distretti e mercato azionario sono il blocco C
  della [roadmap](../roadmap-fette.md), ed è lì che nascono «le prime serie storiche vere».
- **Il raggruppamento dello stipendio.** Il suo grilletto è la prima delega che tocca
  `components/ledger/postings.ts`. Se questa lo tocca, scatta; se non lo tocca, resta dov'è.
- **Le altre schermate del canvas.** Board riordinabile, scadenze, eventi attivi, calore,
  attenzione: il canvas le disegna e il codice non ne ha nessuna. Il grilletto di ognuna è nel
  registro.

## Definizione di fatto

- [ ] Le due decisioni sono state prese **con l'utente**, e ognuna è scritta con l'alternativa
      scartata e il suo costo
- [ ] `npm run verify` verde, con l'**output incollato**
- [ ] `npm run verify:release` verde
- [ ] Il grafico disegna una serie **vera**: si è guardato il gioco girare abbastanza a lungo perché
      la serie avesse più di un campione, e il numero di campioni visti è scritto
- [ ] Se nasce una regola, è stata **rotta di proposito** e cosa diventa rosso è scritto
- [ ] Se la decisione 2 sceglie la libreria: `docs/adr/0034-*.md` esiste, è `Accettata` nel commit
      che la installa, e dichiara come i suoi colori diventano token
- [ ] Se la decisione 1 salva la serie: l'[ADR 0010](../adr/0010-liste-storiche-limitate-alla-definizione.md)
      passa da `Proposta` ad `Accettata` nell'intestazione, e il corpo resta — gli ADR sono
      append-only
- [ ] `docs/architettura.md`: albero e diagramma aggiornati se un confine si è mosso, e
      `tests/rules/import-graph` verde nei due versi
- [ ] La home è stata **guardata a occhio nei due temi**, con l'interruttore in fondo alla colonna.
      Il modo sta in [PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md), sotto _Come si guarda
      l'applicazione senza toccarla_
- [ ] `docs/delega/README.md`: questa delega nell'indice, con il consuntivo delle righe contro il
      budget
- [ ] `docs/stato.md` rigenerato con `npx vitest run tests/rules/project-state -u`
- [ ] In fondo alla delega: le **correzioni** rispetto a com'era scritta

## Trappole note

- **Il grafico che disegna il campione e lo chiama giorno.** Se la serie è campionata ogni N tick e
  l'asse dice «giorni», il grafico mente — e mente in un gioco che parla di soldi. O c'è il
  calendario, o l'asse dice cosa è davvero.
- **Il settimo riquadro travestito.** Un grafico che occupa mezzo cruscotto e porta tre numeri è il
  settimo riquadro con un vestito che il test non riconosce. Il tetto dell'ADR 0018 va rispettato
  nello **scopo**, non nel conteggio.
- **La libreria che porta il proprio tema.** Si sceglie guardando se i colori si possono passare
  come variabili CSS. Se la risposta è «con un po' di lavoro», la risposta vera è no: R15 non è una
  preferenza, è un test.
- **Lo storico che entra nel salvataggio senza tetto.** È il difetto A10, e il progetto ha già un
  ADR che lo vieta prima ancora di averlo commesso.
- **Il grafico piatto.** La prima cosa che il campionamento vedrà è lo stipendio che sale in linea
  retta, perché è l'unica cosa che oggi succede da sola. Se il grafico è bello solo con dei dati
  finti, non è pronto: si dice, invece di riempirlo.

---

## Le decisioni prese

Erano due sulla carta. Sono diventate **quattro**, e le due in più sono nate guardando
l'applicazione — che è la stessa strada da cui è nata [D026](D026-dove-si-attacca-un-dominio.md).

### 1 — chi tiene la serie: **lo store, in memoria**

L'alternativa scartata era salvarla dentro un sistema, e con lei l'[ADR 0010](../adr/0010-liste-storiche-limitate-alla-definizione.md)
sarebbe passato ad `Accettata`. Costa più di come la delega lo dipingeva — un sistema con stato vive
sotto `src/core/domains/`, quindi sarebbe stato un **dominio nuovo**, con la sua riga in
`DOMAIN_SCREENS` e la sua [scheda](../design/domini/README.md) compilata prima di scriverne una riga
(D018) — ma non è il costo ad aver deciso.

**Ha deciso il calendario che non c'è.** Senza l'[ADR 0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)
un campione non sa **quando** è stato preso: due barre affiancate possono distare un tick o otto
ore, e il grafico le disegnerebbe uguali. Una serie che riparte a ogni avvio dice meno ed è vera;
una salvata direbbe di più e mentirebbe. Il grilletto dell'ADR 0010 resta quello che il
[registro YAGNI](../roadmap-fette.md) gli aveva già dato: il primo dominio che possiede **cose**.

### 2 — libreria o CSS: **prima CSS, poi la libreria**

La prima risposta è stata CSS, e non per pigrizia: il criterio dell'[ADR 0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md)
rifiuta una dipendenza quando la definizione di «corretto» è ovvia, e l'altezza di una barra è una
divisione. Il grafico in CSS è stato **costruito, provato e guardato** nella finestra vera.

Poi l'utente ha chiesto una libreria, e la domanda è cambiata: non più «serve», ma «quale può
entrare senza disfare R15». La risposta è ApexCharts e sta nell'[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md),
con le quattro scartate e il perché di ciascuna.

### 3 — la scala del grafico: **la finestra si adatta alla serie**

Non era nella delega. È nata da una misura presa guardando: con un asse ancorato a zero, trenta
campioni di crescita normale muovono tutta l'altezza in una partita nuova, un quarto a 5.000,00 €,
l'1,7% a 100.000,00 € e lo **0,19%** a 900.000,00 €. Il caveau arriva a 250.000,00 €, quindi il
cruscotto avrebbe portato un rettangolo pieno per la maggior parte della partita: vero e inutile.

Il prezzo è dichiarato: l'altezza di una barra non è «quanti soldi», è «dove sei nell'intervallo
osservato». A renderlo leggibile ci sono l'asse con i suoi numeri e il valore che compare toccando
una barra — ed è metà della ragione per cui la libreria si ripaga.

### 4 — l'involucro Vue della libreria: **tolto**

`vue3-apexcharts` è stato installato e disinstallato nella stessa sessione. Clona le opzioni con
`JSON.parse(JSON.stringify(…))` a ogni aggiornamento, e `JSON.stringify` **cancella le funzioni**:
l'asse scriveva `948627.0` invece di `948.627,00 €`. Visto succedere nella finestra vera, poi
confermato nel suo sorgente. La libreria si monta a mano: venti righe di ciclo di vita, e una
dipendenza in meno.

## Le correzioni, rispetto a com'era scritta

1. **«Un `boundedList` dentro `SystemsSave`» non è un `boundedList` dentro `SystemsSave`: è un
   dominio nuovo.** La tabella della decisione 1 lo dipingeva come una struttura da aggiungere. Un
   sistema con stato vive sotto `src/core/domains/`, e da lì discendono `tests/rules/domain-ui`, una
   riga in `DOMAIN_SCREENS` e la scheda di dominio di D018 — nove sezioni di gioco e dodici domande
   kernel, per un campionatore che non è un dominio di gioco. Il costo vero della strada B non era
   scritto.
2. **La delega non dice che il grafico va guardato contro un patrimonio grande, ed è l'unica cosa
   che contava.** Le sue trappole prevedevano il grafico piatto per mancanza di dati; il difetto
   vero è l'opposto — con **troppi** dati e una scala da zero, un patrimonio che cresce diventa
   invisibile. Nessuna delle cinque trappole lo prevedeva, e nessun test poteva vederlo.
3. **La decisione 2 non era una decisione sola.** Scelta la libreria, restava «quale», e il vincolo
   che decide non è nella delega: R15 è un test, quindi una libreria a `<canvas>` è fuori a
   prescindere dal merito. La delega lo diceva in prosa — «una libreria che dipinge i propri colori
   non è configurabile in due temi senza combatterla» — senza trarne la conseguenza operativa, che è
   **SVG o niente**.
4. **`tests/rules/core-deps` non è la lista di cosa può entrare.** La delega lo nomina come «ciò che
   elenca cosa può entrare». Guarda solo `src/core/**` (INV-01): una dipendenza del renderer non lo
   attraversa mai. Nessun gate del progetto elenca le dipendenze di runtime — a fermarle è l'ADR
   0015, che è una regola di review.
5. **Il costo dell'installazione non era quello previsto.** La delega avvisava che `npm install` è
   rotto e che «l'installazione è parte del lavoro». È vero e non è bastato: `npm install` fallisce
   con `ERESOLVE`, ma `npm install <pacchetto> --legacy-peer-deps` funziona, e il conflitto
   `vite`/`electron-vite` **non c'entra niente** con una libreria di grafici. Costo reale:
   trascurabile. Il costo vero era altrove — l'involucro Vue rotto, che nessuno poteva prevedere.
6. **Il peso nel bundle è di un altro ordine di grandezza rispetto a quanto la delega lasciava
   intendere.** «Il peso nel bundle del renderer, che sta in qualita.md con la data accanto»
   suggerisce un aggiornamento di misura. Il modulo passa da **622,87 kB a 2.437,92 kB**: quasi
   quadruplicato, per un grafico a barre. Sta in [qualita.md](../qualita.md) con il grilletto per
   rimetterlo in discussione.
7. **Il cruscotto guadagna dei numeri, e la delega li vietava.** L'invariante «il grafico non è un
   riquadro travestito» resta rispettato — nessun `<StatTile>` nuovo, nessuna cifra grande, nessun
   delta — ma l'asse porta due importi e il puntatore ne rivela un terzo. Non sono statistiche in
   più: sono ciò che rende leggibile un asse che non parte da zero, e senza la decisione 3 non
   esisterebbero.
8. **R17 si incrina, e nessun gate lo vede.** ApexCharts scrive un elemento `<title>` dentro l'SVG
   delle etichette dell'asse, cioè un tooltip nativo del browser — quello che
   [D025](D025-il-tooltip.md) aveva tolto. `tests/rules/no-native-tooltips` guarda l'attributo
   `title` nel **sorgente**, quindi non può prenderlo. Sono due, portano lo stesso testo già
   visibile accanto, e restano dichiarati nell'[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md)
   invece che scoperti fra tre deleghe.
9. **La riga del registro YAGNI che sarebbe scattata non è scattata.** «Gli stati vuoti, e i loro
   sette significati» ha come grilletto «il primo elenco che può essere vuoto in un modo che
   significa qualcosa». Il grafico è vuoto per i primi secondi di ogni partita, ed è un vuoto che
   significa «aspetta» — ma dura cinque secondi e non è uno stato in cui il giocatore sosta.
   Dichiarato invece che tirato.
10. **Il canvas è stato letto e poi contraddetto tre volte.** Non usa librerie (e ne abbiamo presa
    una), impila due segmenti contanti/carta (e il grafico ha un colore solo, perché su una scala
    che taglia il fondo una barra impilata mente sulla composizione), e porta una cifra grande con
    un delta (che è il settimo riquadro travestito). Il canvas resta la fonte del **disegno**, non
    l'arbitro delle decisioni.
11. **La partita di sviluppo su questa macchina è bloccata, e va saputo prima di guardare.** Il
    salvataggio ha 903.359,30 € di contanti contro una capienza di 1.000,00 €: è fatto a mano e
    viola l'invariante, quindi il Ledger rifiuta ogni transazione che tocchi i contanti e il reddito
    è fermo. Il patrimonio **non può muoversi**, e un grafico piatto lì è la verità — non un difetto
    del grafico. Chi vuole vedere una serie che sale deve costruirsi un'altra partita.
12. **La delega dice «~60 righe di test» e ne servono quasi il triplo.** Non per prolissità: la
    cadenza dei campioni ha un caso che nessun budget prevedeva — il ritorno da otto ore vale **un**
    campione, non millecinquecento — e provarlo richiede il finto browser, non una funzione pura.

## Il consuntivo, contro il budget

Il budget era **~120 righe di sorgente e ~60 di test**, e valeva dichiaratamente per **un solo
incrocio**: serie in memoria e grafico in CSS. Quell'incrocio è stato costruito. Poi la decisione 2
è cambiata, e la delega diceva che gli altri tre non si stimano prima delle decisioni — quindi il
ramo effettivamente consegnato **non ha un budget** contro cui misurarsi.

| Cosa                | Misura   | Contro                                                   |
| ------------------- | -------- | -------------------------------------------------------- |
| `src/renderer/`     | **+167** | il budget di ~120 valeva per il ramo CSS, non per questo |
| `src/core/balance/` | **+3**   | i due numeri della cadenza                               |
| Sorgente, in tutto  | **+170** | +42% sul budget di un ramo che non è stato consegnato    |
| Test                | **+158** | ~60 dichiarate, e il ritorno da otto ore ne è la causa   |

Il metodo è `codeLines` di `tests/helpers/projectState.ts`, lo stesso di [stato.md](../stato.md):
commenti e righe vuote escluse.

**Il numero che conta però non è nessuno di questi, ed è nel bundle:** +1.815 kB, in
[qualita.md](../qualita.md).

## Cosa è stato verificato a occhio, e come

Con la porta di debug aperta (`npx electron-vite dev --remoteDebuggingPort 9222`), interrogando il
documento invece dell'immagine — il metodo del [passaggio di consegne](PASSAGGIO-DI-CONSEGNE.md).

| Cosa                        | Come, e cosa si è visto                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| La serie è **vera**         | vista riempirsi campione per campione: 1, 3, 6, 8, **11** barre nella versione CSS, e 3 → 4 in quella con la libreria |
| La cadenza                  | il primo campione arriva a cadenza scaduta e non prima, misurato nel finto browser prima che a schermo                |
| Il colore viene dai token   | `fill` reso: `color-mix(in srgb, var(--color-ink) 85%, transparent)` — un token, non un colore della libreria         |
| I due temi                  | il riempimento passa da `srgb 0.945…` a `srgb 0.082…` premendo l'interruttore, **senza ridisegnare il grafico**       |
| L'asse è in lingua          | `948.627,00 €` e `858.281,60 €`, non `948627.0` — ed è la prova che il formattatore sopravvive senza l'involucro Vue  |
| Il tooltip nativo che resta | **2** elementi `<title>` dentro l'SVG, contati nel documento: è la correzione 8                                       |
| La finestra che si adatta   | con un campione solo l'asse è 858.281,60–948.627,00 attorno a 903.454,30, cioè ciò che `windowOf` ha calcolato        |
