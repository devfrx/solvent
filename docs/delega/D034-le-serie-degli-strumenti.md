# D034 — Le serie degli strumenti

- **Stato:** **Chiusa** — ramo `d034-le-serie-degli-strumenti`, che parte da `main`. Scritta il
  2026-08-21, eseguita il 2026-08-23. La decisione aperta è stata posta all'utente, che ha risposto
  con la **direttiva generale**: decisa in autonomia su tutte e due le metà, e marcata come
  contestabile. Le correzioni rispetto a com'era scritta sono in fondo, e la prima sposta un file
  di cartella
- **Dipende da:** [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md), che ha portato la prima
  serie e la libreria; [D033](D033-il-bancomat-e-una-pagina.md), che porta la pagina dove questi
  grafici stanno
- **Sblocca:** niente di scritto. È la delega che chiude la rifinitura del cruscotto
- **ADR vincolanti:** [0034](../adr/0034-il-grafico-e-una-libreria.md) (il disegno è di
  ApexCharts), [0010](../adr/0010-liste-storiche-limitate-alla-definizione.md) (R09 — una lista
  nasce col suo limite), [0006](../adr/0006-decimal-end-to-end-per-il-denaro.md) (il confine di
  presentazione)
- **Regole:** R05, R09, R11, INV-06 (la dimensione del salvataggio è la somma dei limiti dichiarati)
- **Budget:** ~200 righe, di cui più della metà nell'accumulatore e nei suoi test. I grafici sono la
  parte corta: la libreria c'è già e sa fare le candele
- **Aveva una decisione aperta.** È stata presa prima di eseguire: vedi _La decisione aperta_, e
  le due righe nuove in fondo a [PASSAGGIO-DI-CONSEGNE](PASSAGGIO-DI-CONSEGNE.md)

## Obiettivo

Tenere una serie per ogni strumento, e mostrare con essa come si è mosso invece che solo dov'è
adesso.

## Perché esiste

Il cruscotto dice **com'è adesso**: cinque riquadri, cinque numeri. Il grafico del patrimonio
([D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md)) dice **come è andata**, ed è l'unica
ragione per riaprire un idle — lo dice l'[ADR 0018](../adr/0018-la-home-e-un-atm.md), che su questo
punto resta in piedi anche dopo essere stata superata da D033.

Ma dice come è andato **il totale**, e il totale è la cosa meno interessante di questo gioco. La
tensione è fra due strumenti che si comportano in modo opposto — i contanti salgono da soli e
sbattono contro un tetto, la carta non si muove finché non decidi tu — e un patrimonio netto che
sale liscio nasconde esattamente quella differenza.

Una serie per strumento la rende visibile. E la **candela** la rende visibile meglio di una linea,
perché una candela non porta un valore per intervallo: ne porta quattro — dove ha aperto, quanto è
salito, quanto è sceso, dove ha chiuso. È la forma che descrive un'oscillazione, ed è quello che i
contanti fanno fra un tick di reddito e un deposito.

## La forma

### 1 · Una candela non si campiona, si accumula

La serie di oggi prende **una fotografia** ogni cinque secondi di gioco (`NET_WORTH_SAMPLE_EVERY`)
e la accoda. È giusto per una linea e **non basta** per una candela: fra due fotografie il saldo
può essere salito e ridisceso, e nessuna delle due lo sa.

Una candela vuole quattro numeri per intervallo:

|              |                                                                       |
| ------------ | --------------------------------------------------------------------- |
| **apertura** | il saldo quando l'intervallo comincia                                 |
| **massimo**  | il più alto che ha toccato dentro                                     |
| **minimo**   | il più basso                                                          |
| **chiusura** | il saldo quando l'intervallo finisce, che è l'apertura del successivo |

Quindi serve un **accumulatore**, non un campionatore: qualcosa che guarda il saldo a ogni
cambiamento, tiene aggiornati massimo e minimo, e **chiude** la candela quando l'intervallo scade.

È una funzione pura — riceve la candela in corso e il saldo nuovo, ritorna la candela aggiornata —
e vive in un `.ts` provato senza montare niente, per la stessa ragione di
[series.ts](../../src/renderer/components/shell/series.ts) e di
[postings.ts](../../src/renderer/components/ledger/postings.ts).

**Dove guarda:** il saldo cambia solo quando il Ledger posta una transazione, e lo store lo sa già
— `history` si aggiorna proprio lì. L'accumulatore si attacca allo stesso punto, e non ha bisogno
di un secondo giro sul Bus.

**Un intervallo senza movimento non è un buco:** è una candela in cui i quattro numeri coincidono.
Vale per la carta ogni volta che il giocatore non tocca il bancomat, e dice una cosa vera —
«questo strumento è fermo, e restare fermo è ciò che fa».

### 2 · Quanto lunga, e quanto fitta

Gli stessi due numeri della serie del patrimonio, e per la ragione già scritta in `constants.ts`:
sono **due** decisioni diverse — quanto è lunga la finestra e quanto è fitta — e legarle vorrebbe
dire non poterne cambiare una sola.

Non si riusano `NET_WORTH_SAMPLES` e `NET_WORTH_SAMPLE_EVERY`: un intervallo di candela e una
cadenza di campionamento sono cose diverse, e la prima volta che si vorrà una candela più larga si
scoprirebbe di stare spostando anche il grafico del patrimonio. Due costanti nuove, in `balance/`.

### 3 · Le serie non si salvano

Come `netWorthSeries` oggi: nascono vuote a ogni caricamento, e il grafico non disegna finché la
prima candela non chiude.

**Non è una dimenticanza ed è la scelta più economica che regge:** il
[registro YAGNI](../roadmap-fette.md) colloca il primo `boundedList` **salvato** in una fetta sua,
perché salvarne uno significa portarlo nello schema, nella validazione che non si fida
([D020](D020-nessun-sistema-si-fida-del-salvataggio.md)) e in INV-06. Tre serie salvate come primo
caso sarebbero il caso peggiore per inaugurare quel meccanismo.

Va detto al giocatore invece di lasciarlo scoprire: un grafico vuoto dopo aver riaperto la partita
sembra un difetto. Lo dice il tooltip del grafico, che R17 impone comunque.

## Da produrre

| File                                                | Cosa                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| `src/renderer/components/shell/candles.ts`          | l'accumulatore: apri, aggiorna, chiudi. Puro                       |
| `src/renderer/components/shell/InstrumentChart.vue` | il grafico a candele di uno strumento                              |
| `src/renderer/components/shell/NetWorthChart.vue`   | da barre ad area — vedi _La decisione aperta_                      |
| `src/core/balance/constants.ts`                     | quanto è lungo un intervallo, e quante candele si tengono          |
| `src/renderer/stores/game.ts`                       | le due serie di candele, aggiornate dove si aggiorna `history`     |
| `src/renderer/views/BoardView.vue`                  | dove i grafici stanno                                              |
| `src/renderer/i18n/it.ts` · `en.ts`                 | i titoli, le spiegazioni, e la frase sul perché ricomincia da capo |
| `tests/renderer/shell/candles.test.ts`              | l'accumulatore, e i bordi che rompono                              |
| `docs/design/domini/atm.md` · `vault.md`            | se una scheda dice qualcosa sulla varianza, adesso si vede         |

## Invarianti

- **R05 resta**: l'accumulatore è puro e sta fuori dai `.vue`. Il componente monta e disegna.
- **R09 resta**: le due serie nascono con il loro limite dichiarato, come `boundedList` impone.
- **ADR 0006 resta**: `Decimal` fino al bordo, `toDisplayNumber` **una volta sola** e nel punto
  dove la conversione è una decisione — che è `series.ts`, non il componente.
- **ADR 0034 resta**: il disegno è della libreria. Qui si decide solo ciò che una libreria non può
  decidere: dove comincia l'asse, e cosa è una candela.
- **Il salvataggio non cresce**: nessuna serie ci entra, quindi INV-06 non si muove.

## Fuori scope

- **Salvare le serie.** Ha il suo grilletto scritto nel registro YAGNI, e non è questo.
- **Aggregare le candele** in intervalli più larghi quando la serie si riempie. Un limite
  dichiarato e una finestra che scorre bastano; l'aggregazione è la cosa che si aggiunge quando
  qualcuno vuole guardare un'ora, e nessuno l'ha chiesto.
- **Zoom, pan, selezione di intervallo.** ApexCharts li sa fare e si accendono con una riga: è
  esattamente per questo che vanno lasciati spenti finché non servono.
- **Una serie per il caveau o per il reddito.** Due strumenti, due serie. Il reddito avrà la sua
  fetta.

## Definizione di fatto

- [x] Ogni strumento ha la sua serie, e una candela porta i quattro numeri veri — non una
      fotografia ripetuta quattro volte. `tests/renderer/candles`, e nella finestra vera una candela
      dei contanti dice _Apre 11.080,00 € · Massimo 11.125,60 € · Minimo 0,00 € · Chiude 14,40 €_.
- [x] Un intervallo senza movimento produce una candela piatta, non un buco nella serie. Provato
      **nello store** e non nell'accumulatore: vedi la correzione 6.
- [x] Il massimo e il minimo sono quelli **dentro** l'intervallo: provato con un saldo che sale,
      scende e torna, tutto fra due chiusure, in tutti e due i livelli — `candles.test.ts` sulla
      funzione pura, `store.test.ts` sul gioco vero, dove i quattro numeri escono tutti diversi.
- [x] Le costanti nuove sono due e stanno in `balance/`, separate da quelle del patrimonio.
      Portano lo **stesso** valore, e la coincidenza è voluta: vedi la correzione 7.
- [x] Il grafico non disegna finché la prima candela non chiude, e il tooltip dice perché. Il ramo
      «serie vuota» reso nella finestra vera con le opzioni del componente: nessuna eccezione,
      nessuna candela, l'asse resta quello che la libreria sceglie da sé.
- [x] I due temi guardati **nella finestra vera** via CDP. Gli attributi resi restano
      `var(--color-gain)` e `var(--color-ink)`, e il browser li risolve in
      `rgb(111, 190, 146)` / `rgb(241, 237, 226)` a tema scuro e `rgb(44, 110, 75)` /
      `rgb(21, 20, 15)` a tema chiaro, **senza ridisegnare niente**. Due cose sono state trovate
      guardando, e sono le correzioni 3 e 4.
- [x] `npm run verify` verde, `docs/stato.md` rigenerato.

## La decisione aperta

Va presa con l'utente prima di eseguire, perché cambia cosa si costruisce.

**La carta si muove poco, e una candela lo dice guardandolo.** I contanti oscillano davvero: il
reddito li alza a ogni tick, il tetto del caveau li ferma, il bancomat li abbassa. La carta invece
cambia **solo** quando il giocatore agisce — deposita, preleva, compra un potenziamento — quindi la
maggior parte delle sue candele sarà piatta.

- **A — due grafici a candele, contanti e carta.** Simmetrico, ed è ciò che l'utente ha chiesto con
  parole sue. Le candele piatte della carta non sono rumore: dicono «qui non è successo niente», e
  in un gioco sulla tracciabilità «non è successo niente sulla carta» è un'informazione. Costa un
  componente usato due volte.
- **B — candele per i contanti, linea per la carta.** Ogni strumento nella forma che descrive come
  si comporta davvero: uno oscilla, l'altro fa gradini. Più onesto a guardarsi, e costa **due**
  componenti invece di uno — cioè la duplicazione che il progetto ha appena tolto altrove.

Chi scrive propende per **A**: la simmetria è ciò che rende confrontabili due strumenti, e una
serie piatta accanto a una che oscilla è il modo più diretto di far vedere che sono diversi. Ma è
una decisione dell'utente.

**E la seconda metà della stessa domanda:** il patrimonio netto oggi è a **barre**, come il canvas
lo disegna. L'utente ha chiesto «linea con area per l'andamento generale». Le due cose non possono
convivere sullo stesso grafico, e il canvas su questo non è l'autorità — il grafico è nato dopo di
lui ([D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md)). Passare ad area è una riga di
opzioni e nessun cambiamento alla serie.

---

## Come è stata presa, e cosa è uscito

L'utente ha risposto con la **direttiva generale** — «seguo le tue raccomandazioni purché rispettino
i principi di coerenza, zero debiti futuri, professionalità e stato dell'arte odierno, non pigrizia»
— che è la stessa con cui erano state prese le due decisioni di
[D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md). Quindi: decise, motivate con una misura
invece che con un'opinione, e marcate come contestabili in fondo a
[PASSAGGIO-DI-CONSEGNE](PASSAGGIO-DI-CONSEGNE.md).

### 1 — due grafici a candele: **A**

Un componente montato due volte, non due componenti. Il metro non è un'opinione sul gusto: nel
cruscotto `StatTile` è già lo stesso pezzo montato **cinque** volte, e la duplicazione fra due
componenti quasi uguali è quella che D033 ha appena tolto altrove. B costava un secondo file per
disegnare la stessa cosa in un modo diverso.

E la simmetria ha pagato guardando: i due grafici affiancati mostrano trenta candele ciascuno, e la
differenza fra gli strumenti si legge senza spiegazioni. Contato nel documento sulla partita usata
per guardare: **17 candele su 30** dei contanti sono alte meno di un pixel e mezzo — sono i tick di
reddito, che salgono sempre, quindi verdi — mentre **23 su 30** della carta sono piatte davvero, e
piatte prendono il colore dell'inchiostro. Le candele piatte non sono rumore: sono metà
dell'informazione.

### 2 — il patrimonio netto: **area**

Costa due righe di opzioni, zero righe di serie e zero test toccati. La ragione non è il gusto ed è
la stessa della decisione 1: adesso il patrimonio **non è più solo** sulla pagina, e tre serie di
rettangoli affiancati direbbero che le tre cose sono la stessa. Un'area continua dice «questo è
l'andamento generale», che è il lavoro che gli resta.

La linea è **dritta e non morbida**: una curva interpolata disegnerebbe patrimoni fra un campione e
il successivo, cioè numeri che nessuno ha mai avuto — la correzione 1 di
[D015](D015-home-bancomat.md) con un altro vestito.

## Trappole note — scritte dopo, perché la delega non ne aveva

D034 è l'unica delega del progetto senza questa sezione, ed è la correzione 5. Quelle qui sotto non
sono «cosa è andato storto nel progetto precedente»: sono **cosa è andato storto eseguendo questa**,
che è l'informazione che il prossimo lettore può ancora usare.

- **La libreria porta la propria lingua.** ApexCharts ha `["Open","High","","Low","Close"]` scritto
  dentro il proprio sorgente per la bolla delle candele. Non è configurabile con un'opzione: o si
  scrive `tooltip.custom`, o R12 la rompe una dipendenza al posto nostro. Vale la pena guardare nel
  `dist` **prima** di scegliere una forma di grafico, non dopo.
- **Un gradiente cuoce un colore.** Per costruire il primo stop ApexCharts risolve il colore e lo
  scrive nell'SVG come letterale — `stop-color="rgba(21,20,15,0.28)"`, visto nella finestra vera. Un
  valore cotto non cambia con il tema, e la sola ragione per cui questa libreria è entrata è che non
  serva ridisegnare niente (ADR 0034). Il riempimento **pieno** invece resta un token, avvolto in
  `color-mix`: è la forma già misurata a D027 per le barre.
- **Un test su una candela piatta non prova niente.** Quando i quattro numeri coincidono, coincidono
  per qualunque implementazione — anche per una che non chiude niente. Quel test è passato al primo
  colpo contro un `nextCandle` che ritornava l'identità. Il posto dove discrimina è lo store, dove
  la serie esiste e si può contare.
- **Il colore di una candela lo decide `apertura < chiusura`, non `≤`.** È nel sorgente della
  libreria (`A.o < A.c ? [upward] : [downward]`), e cambia tutto per questo gioco: una candela
  piatta cade sul **secondo** colore. Se i due colori fossero verde e rosso, la carta ferma sarebbe
  una fila di trattini rossi; con verde e inchiostro è una fila di trattini neutri, che è la verità.
- **L'app di sviluppo si chiude anche da dentro.** `Page.reload` via CDP termina il processo
  Electron, non ricarica la finestra. Per guardare uno stato iniziale bisogna riavviare, e la corsa
  contro i cinque secondi della prima candela non si vince: il ramo «serie vuota» si è provato
  rendendo un grafico vuoto **dentro** la pagina con le stesse opzioni del componente.

## Correzioni rispetto a com'era scritta la delega

1. **`candles.ts` non sta in `components/shell/`: sta in `runtime/`.** La delega lo metteva accanto
   a `series.ts` per analogia — pura, provata senza montare niente — e l'analogia salta su chi lo
   **usa**: `series.ts` la legge un componente, l'accumulatore lo guida lo **store**. Un
   `ST --> CMP` sarebbe la freccia al contrario, cioè un ciclo con `CMP --> ST`, che esiste già. È
   la ragione già scritta in `runtime/loop.ts` per `sampleOf`, e questa la segue. Di conseguenza il
   test è `tests/renderer/candles.test.ts`, non `tests/renderer/shell/`.
2. **Ne è nato un arco nuovo, `CMP --> RT`**, disegnato in [architettura.md](../architettura.md):
   il grafico nomina il tipo `Candle` per convertirlo. È di **soli tipi** ed è in avanti, quindi non
   chiude cicli. A trovarlo non è stata una review: `tests/rules/import-graph` è diventato rosso da
   solo, che è esattamente il lavoro per cui D022 lo ha scritto.
3. **La bolla del valore è scritta da noi, e la delega non la nominava.** Vedi la prima trappola.
   Costa `tooltip.custom`, quattro chiavi i18n e due righe di CSS — ed è metà della ragione per cui
   il componente è più lungo di quanto il budget diceva.
4. **L'area del patrimonio non è un gradiente**, e il pallino dell'area nasce con `stroke: #fff`
   dalla libreria — spento con `strokeWidth: 0`. Tutte e due trovate **nella finestra vera**, e nel
   documento invece che nell'immagine: un'immagine non dice da dove viene un colore.
5. **La delega non aveva _Trappole note_**, unica fra quelle scritte. È stata aggiunta qui sopra,
   con quello che ha morso davvero e con l'etichetta che dice quando è stata scritta.
6. **Il test sulla candela piatta è passato dallo store, non dall'accumulatore.** Vedi la terza
   trappola: al livello della funzione pura era una tautologia, e l'ha dimostrato passando contro
   un'implementazione sbagliata.
7. **Le due costanti portano lo stesso valore di quelle del patrimonio, e la coincidenza è
   dichiarata.** La delega diceva solo di tenerle separate; separate lo sono, ma il valore è lo
   stesso apposta — i tre grafici stanno sulla stessa pagina, e se coprissero finestre diverse
   confrontarli sarebbe confrontare due momenti.
8. **`mirror()` riapre le candele in corso**, e non era nella delega. Dopo un caricamento e dopo il
   recupero il saldo cambia **senza** una transazione: senza quella riga la prima candela di una
   partita riaperta salirebbe da zero al patrimonio caricato, cioè disegnerebbe una salita mai
   avvenuta — e per giunta quella che decide la scala dell'asse. C'è un test che la vede rossa.
9. **Il budget aveva la forma invertita.** Diceva «~200 righe, di cui più della metà
   nell'accumulatore e nei suoi test. I grafici sono la parte corta». L'accumulatore è **15** righe
   più 42 di test; il componente ne è **145**. Il consuntivo è **244 di sorgente e 160 di test**,
   contati con il metodo di `tests/helpers/projectState.ts`. Le tre voci che spiegano la differenza:
   la bolla scritta a mano (correzione 3), il fatto che in un `.vue` si contano anche template e
   CSS — `NetWorthChart.vue` ne ha 112 da solo, ed esisteva già — e settanta righe di test dello
   store che la delega non aveva previsto affatto.
