# D034 — Le serie degli strumenti

- **Stato:** **Aperta** — scritta il 2026-08-21, non eseguita. Il ramo si chiami
  `d034-le-serie-degli-strumenti` e parta da [D033](D033-il-bancomat-e-una-pagina.md)
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
- **Ha una decisione aperta.** Vedi in fondo: non si esegue prima di averla presa

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

- [ ] Ogni strumento ha la sua serie, e una candela porta i quattro numeri veri — non una
      fotografia ripetuta quattro volte.
- [ ] Un intervallo senza movimento produce una candela piatta, non un buco nella serie.
- [ ] Il massimo e il minimo sono quelli **dentro** l'intervallo: provato con un saldo che sale,
      scende e torna, tutto fra due chiusure.
- [ ] Le costanti nuove sono due e stanno in `balance/`, separate da quelle del patrimonio.
- [ ] Il grafico non disegna finché la prima candela non chiude, e il tooltip dice perché.
- [ ] I due temi guardati **nella finestra vera** via CDP: la libreria disegna in SVG e prende i
      colori dalle variabili, quindi un tema che non si aggiorna si vede solo lì.
- [ ] `npm run verify` verde, `docs/stato.md` rigenerato.

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
