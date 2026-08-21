# D027 — Un grafico è una serie, e nessuno la tiene

- **Stato:** Aperta — scritta il 2026-08-21, subito dopo la chiusura di
  [D026](D026-dove-si-attacca-un-dominio.md), su richiesta dell'utente: il cruscotto della home
  deve avere dei grafici, e la libreria con cui disegnarli va scelta. **Non è preparata per
  l'esecuzione**, e non è una dimenticanza: porta due decisioni che non spettano a chi la scrive.
  Vedi _Le decisioni aperte_
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
