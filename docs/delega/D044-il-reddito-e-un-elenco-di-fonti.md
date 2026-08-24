# D044 — Il reddito è un elenco di fonti

- **Stato:** **Chiusa** — scritta **ed eseguita** il 2026-08-24 sul ramo
  `d044-il-reddito-e-un-elenco-di-fonti`, **fusa in `main` e spinta**. `npm run verify` e
  `npm run build` sono verdi — 1.399 test — e i punti 9 delle tre deleghe
  aperte — questa, [D042](D042-il-caveau-ha-uno-spazio-e-una-scala.md) e
  [D043](D043-il-reddito-si-mette-in-regola.md) — sono stati chiusi in una finestra sola. Il
  consuntivo è in fondo
- **Data:** 2026-08-24
- **Fetta:** 02 riaperta da una sessione di gioco, come [D043](D043-il-reddito-si-mette-in-regola.md).
  Non è un ritocco di bilanciamento: è il dominio che non aveva una scala
- **Decide:** [ADR 0053](../adr/0053-un-miglioramento-dichiara-il-tempo-in-cui-rientra.md) — un
  miglioramento dichiara il tempo in cui rientra
- **A monte:** [D043](D043-il-reddito-si-mette-in-regola.md) e
  l'[ADR 0052](../adr/0052-un-guadagno-dichiara-dove-atterra.md) (il regime),
  [D042](D042-il-caveau-ha-uno-spazio-e-una-scala.md) (la scala del caveau, che è la forma da
  copiare), [D019](D019-il-pagamento.md) e l'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
  (il listino), [D009](D009-persistenza-main.md) (il runner delle migrazioni)
- **Scheda di dominio:** [income.md](../design/domini/income.md), ricompilata prima di questa
  delega e **riletta contro `src/`** a esecuzione finita: tre righe smentite, elencate in fondo alla
  scheda e riassunte nel consuntivo
- **Budget di righe:** ~450 di codice, ~400 di test. Il grosso non è nel dominio: è nella catena che
  il cambio di forma dello stato attraversa — salvataggio, store, pagina

## Obiettivo

Dare al reddito la scala che non ha mai avuto: un **elenco di fonti** con nome, livello, resa e
prezzo, ciascuna che dichiara dove atterra ciò che produce, e un **plateau** oltre il quale il
denaro non compra più reddito attivo.

## Perché esiste

Il reddito ha un pulsante solo. Costa 800,00 €, si compra dopo tre quarti di minuto, moltiplica
×1,5 per sempre, e da lì il dominio non chiede più niente per il resto della partita. La sua stessa
[scheda](../design/domini/income.md) lo diceva: _«un acquisto in tutta la partita, e poi non chiede
più niente»_.

Il nome è la spia. «Straordinari» è una cosa che si fa, non una cosa che si compra, e sotto quel
nome non c'è una scala: ci sono tre numeri — un prezzo, un moltiplicatore, un booleano — che nessuna
regola lega fra loro. Il rapporto che la [visione](../prodotto/visione.md) chiama _«l'unico che
conta»_ lì non è violato: è **assente**, e un rapporto assente non può diventare rosso.

**E c'è un buco aperto ieri.** La regola 3 della visione pretende che ogni strumento dichiari come
muore il secondo milione. La risposta del reddito era «il caveau», e
l'[ADR 0052](../adr/0052-un-guadagno-dichiara-dove-atterra.md) quel legame l'ha sciolto per il
reddito in regola: sulla carta non c'è capienza. Da D043 in poi il reddito è un dominio che **non
satura**. Nessun test poteva dirlo — sono tutti verdi, e a ragione.

Le due cose si chiudono insieme, e non per comodità: il plateau **è** la scala vista da lontano.
Una scala finita è una saturazione; una saturazione dichiarata è la fine di una scala.

## Le quattro decisioni, con i conti che le hanno decise

### 1 · Il prezzo di un livello è il suo tempo di rientro

Il ragionamento sta per intero nell'[ADR 0053](../adr/0053-un-miglioramento-dichiara-il-tempo-in-cui-rientra.md).
Qui basta la formula e la conseguenza di gioco:

    prezzo del livello = (quanto rende in più) × INCOME_PAYBACK_SECONDS

**La conseguenza è che il prezzo smette di essere ciò che distingue due fonti.** Se ogni livello di
ogni fonte rientra negli stessi cinque minuti, «quale compro?» non è più un confronto fra cartellini:
è **in quale pozza voglio che atterrino i soldi**. La scelta si sposta dal prezzo al regime, che è
dove la [visione](../prodotto/visione.md) la vuole — contanti contro carta, non 1.800 € contro
3.000 €.

C'è un effetto che sembra strano e non lo è: **aprire una fonte costa più del livello successivo.**
Aprirla dà tutta la resa base, il livello dopo dà solo l'incremento. Per euro di reddito comprato il
prezzo è identico, ed è la regola vista da vicino.

### 2 · I livelli sono finiti, e la loro somma è il plateau

Il caveau ha già affrontato questa scelta in [D042](D042-il-caveau-ha-uno-spazio-e-una-scala.md), e
la risposta si prende così com'è: **livelli finiti con un tetto dichiarato**, non una curva che si
strozza da sola. In un idle «costa più di quanto renda» è un bersaglio mobile tarato contro la curva
del gioco; un tetto si verifica con un test e non si ritara mai.

Con otto livelli, una crescita di ×1,5 e due fonti da 12,00 e 20,00 €/s, il plateau è
**364,50 €/s**. La cifra non è scelta perché suona bene — è tarata su cosa deve **finire**:

| Cosa                                            | Quanto                           |
| ----------------------------------------------- | -------------------------------- |
| un anno di gioco (dodici minuti reali)          | 262.440,00 € di reddito attivo   |
| il caveau all'ultimo livello                    | 256.000,00 €                     |
| capitale immobiliare che renderebbe altrettanto | fra 5 e 9 milioni, al 3–5% netto |

**Al plateau un anno di gioco riempie esattamente un caveau pieno.** È la frase che dice al
giocatore che i contanti hanno finito il loro mestiere, e insieme il punto in cui il capitale deve
prendere il posto del reddito attivo — cioè la legge 6 della visione, in due numeri invece che in
una frase.

### 3 · Due fonti, non «una manciata», e la terza ha un grilletto

La [mappa funzionale](../design/mappa-funzionale.md) promette _«una manciata di fonti»_. Questa
delega ne costruisce **due**, e la ragione è che oggi non c'è con cosa distinguerne una terza.

Le nove voci dell'etichetta danno quattro monete con cui una fonte può pagare: liquidità,
tracciabilità, varianza, attenzione. Il reddito dichiara **varianza zero** e **l'attenzione più
bassa del gioco**, e le deve mantenere. Restano liquidità e tracciabilità, cioè l'asse contanti
contro carta — che regge due fonti e non tre.

| Fonte                 | Dove atterra                                                      | I livelli si pagano | Cosa paga in cambio                                                         |
| --------------------- | ----------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------- |
| **Lavoro dipendente** | in nero → contanti · in regola → carta, meno la parte dello Stato | **carta**           | in nero: una commissione a ogni livello. In regola: il 3%, per sempre       |
| **Lavoretti**         | sempre **contanti**, non si mette in regola                       | **contanti**        | il muro del caveau, due volte: su quello che incassa e su quello che spende |

La terza fonte è quella che rende di più e **si paga in calore**: è fetta 04, e va nel registro con
il suo grilletto invece di essere inventata adesso. La struttura la accoglie come una riga in un
elenco.

**Che nessuna delle due domini l'altra si vede sull'etichetta:** i lavoretti battono il lavoro in
regola sulla tracciabilità, il lavoro in regola batte i lavoretti sulla liquidità e sulla pozza.

### 4 · Il regime resta una scelta sola, e la fonte dichiara se la subisce

L'[ADR 0052](../adr/0052-un-guadagno-dichiara-dove-atterra.md) dice che a dichiarare dove atterrano
i soldi è la **fonte**. Qui la regola si applica per la prima volta a più di una, e va detto come,
perché la lettura ovvia è sbagliata.

Ogni fonte dichiara **due** regimi: quello di base, e quello che vale se il giocatore si è messo in
regola — oppure `null`, che significa «questa fonte in regola non ci va». I lavoretti dichiarano
`null` per costruzione: sono pagati a mano, e nessun atto burocratico li rende tracciabili.

**Mettersi in regola resta una cosa sola, del giocatore e non della fonte**, e resta l'acquisto che
D043 ha costruito: 50.000,00 € sulla carta, una volta, senza ritorno. È lo stato di una persona, non
di un lavoro. La fonte dichiara cosa le succede quando quello stato cambia; non è lei a cambiarlo.

## Cosa trovi già fatto

- **Il regime come dato.** `Regime`, `regimeOf`, i due valori dichiarati e
  `income(pool, amount, withheld)` sono di D043. Questa delega li generalizza, non li inventa.
- **La scala come forma.** [D042](D042-il-caveau-ha-uno-spazio-e-una-scala.md) ha già scritto tutto:
  la lista calcolata una volta all'avvio del modulo, il livello stretto fra zero e il massimo, il
  listino che diventa **vuoto** in cima invece di rispondere con un ramo, `accepts` generato dal
  listino **per livello**, e il `load` che valida campo per campo. Si copia la forma, non il
  significato.
- **Il runner delle migrazioni.** Esiste da [D009](D009-persistenza-main.md), è provato con
  migrazioni finte e passi veri, e la sua mappa è **vuota** in attesa della versione 2.
- **Il flusso del pagamento.** `PaymentDialog`, `PriceList`, R24: il secondo listino con due pool
  diversi non inventa niente.

## Da produrre

### Dominio — `src/core/domains/income/`

- **`types.ts`**: `IncomeSourceId` (`'job' | 'gigs'`), `IncomeState` con i livelli per fonte e il
  booleano del regime, `IncomeSave` che **torna a coincidere** con lo stato — la migrazione toglie
  la ragione per cui D043 aveva reso `declared` opzionale sul disco.
- **`rules.ts`**:
  - `IncomeSource` — id, resa base, regime di base, regime dichiarato (`null` se non si applica),
    strumento con cui si comprano i livelli.
  - `SOURCES`, l'elenco dichiarato. I numeri arrivano da `BALANCE`: R04 vieta un importo di gioco
    dentro un dominio, e `domains-no-money-literals` lo fa rispettare.
  - `MAX_LEVEL`, `yieldAt(source, level)` — zero al livello zero, `base × crescita^(livello−1)` da
    uno in su.
  - `levelPrices(source, level)` e `levelPriceFor(source, level, pool)`, gemelli di
    `expansionPrices`: **vuoto** all'ultimo livello, perché l'indice cade fuori da solo.
  - `canBuyLevel(state, source, option, available)`, anteprima per la UI.
  - `incomePerSecond(state, modifiers)` — la somma delle fonti, poi i modificatori su `income.all`.
    L'ordine è quello di oggi e non cambia: si compone sulla base al secondo, e la conversione a
    tick viene dopo.
  - `INCOME_PLATEAU`, la somma delle fonti al livello massimo. Calcolata, non scritta.
  - `regimeOf(source, state)` prende **due** argomenti invece di uno.
  - `incomeThatFits` non si tocca.
- **`commands.ts`**: `createBuyLevel` al posto di `createBuyUpgrade`, con
  `error.income.max_level` al posto di `error.income.already_upgraded`. `createDeclare` resta.
  `upgradeModifier` e `UPGRADE_MODIFIER_ID` **spariscono**.
- **`system.ts`**: `buyLevel(source, pool)` al posto di `buyUpgrade(pool)`. Il tick raggruppa **per
  regime** (vedi _Trappole note_). `syncUpgradeModifier` sparisce. `withheld()` diventa `blocked()`.
- **`cheats.ts`**: `cheat.income.boost` al posto di `cheat.income.toggle_upgrade` — registra e
  toglie un `mult` su `income.all`. È il gancio che l'albero delle abilità userà, e questo cheat è
  ciò che lo tiene provato da qualcosa che non sia un test.

### Kernel e contratti

- `contracts/ledger.ts`: `reason.income.upgrade` → `reason.income.level`.
- `contracts/save.ts`: `SAVE_VERSION` passa a **2**.

### Salvataggio — `src/main/save/migrations.ts`

- La prima migrazione vera, da 1 a 2: `{ upgraded, declared? }` diventa
  `{ levels: { job: upgraded ? 2 : 1, gigs: 0 }, declared: declared ?? false }`.
- È **letterale**: non può importare il dominio (INV-03) e non deve. Una migrazione congela la
  forma della versione 2 per sempre, e il giorno in cui una fonte nuova entrerà sarà una migrazione
  in più, non questa riscritta.

### Bilanciamento — `src/core/balance/constants.ts`

- `INCOME_LEVELS: 8`, `INCOME_LEVEL_GROWTH: 1.5`, `INCOME_PAYBACK_SECONDS: 300`,
  `INCOME_JOB_BASE_PER_SECOND: 12`, `INCOME_GIGS_BASE_PER_SECOND: 20`.
- `INCOME_BASE_PER_SECOND`, `UPGRADE_PRICE_CARD` e `UPGRADE_MULTIPLIER` **spariscono**.
- `AUTOSAVE_SECONDS`: il valore resta **30**, il commento si riscrive. La derivazione vecchia dice
  «il reddito massimo che questo gioco raggiunge oggi è 18,00 €/s», e da qui non è più vero. Il
  criterio sopravvive perché i prezzi crescono **insieme** a ciò che una scrittura mancata fa
  perdere: il caso peggiore è l'ultimo livello del lavoro, dove trenta secondi valgono 9.568,00 €
  contro un prezzo di 13.668,75 €. Il margine passa da circa 2,2× a 1,4×, e va scritto.

### Bersagli — `src/core/balance/targets.ts`

- `income_plateau`: fra 320,00 e 410,00 €/s. Stretto apposta — un livello in più o in meno, o un
  fattore di crescita diverso, cadono fuori. Si misura **dalle regole**, non dalle costanti.
- `income_level_payback`: fra 240 e 360 secondi, verificato su **ogni** livello di **ogni** fonte,
  calcolando il prezzo dal listino e l'incremento da `yieldAt`. È il bersaglio che rende l'ADR 0053
  una proprietà invece di un'intenzione.
- `income_per_minute_at_start` non si tocca e **deve restare verde**: la partita si apre identica a
  oggi, 12,00 €/s con i lavoretti chiusi.

### Applicazione — `src/renderer/`

- `components/income/IncomeSourcePanel.vue` al posto di `IncomePanel.vue`: **una** fonte — nome,
  livello su quanti, quanto rende adesso, dove atterra, e la CTA del livello successivo. In cima
  alla scala mostra che è finita.
- `IncomeView.vue` disegna un pannello per fonte, in ciclo sull'elenco.
- `IncomeRegimePanel.vue` non si tocca.
- Lo store: i selettori del reddito passano da «l'upgrade» a «le fonti». Il plateau è un selettore,
  perché la pagina deve poter dire quanto manca.
- `i18n/it.ts` e `i18n/en.ts`: i nomi e le descrizioni delle due fonti, il livello massimo, il
  plateau, la ragione e l'errore nuovi. Parità verificata.

### Documenti

- La [scheda del reddito](../design/domini/income.md) è già ricompilata: va **riletta contro `src/`**
  dopo l'esecuzione, e le righe che il codice smentisce vanno corrette.
- La [scheda del caveau](../design/domini/vault.md): riacquista un cliente, e va detto.
- [mappa-funzionale.md](../design/mappa-funzionale.md), blocco 1: il ciclo non è più «si compra un
  potenziamento».
- [tracciabilita.md](../tracciabilita.md): **INV-28**.
- Il registro YAGNI in [roadmap-fette.md](../roadmap-fette.md): la riga delle migrazioni **esce**
  (il grilletto è scattato), entrano la terza fonte con il grilletto della fetta 04 e la forma
  condivisa dei miglioramenti a rientro con il grilletto del secondo dominio che vende resa.
- [adr/README.md](../adr/README.md): la voce dell'ADR 0053.

## Invarianti

- **INV-28** — il prezzo di un livello di reddito è il suo incremento di resa per il tempo di
  rientro dichiarato. A farlo rispettare è `income_level_payback`, che lo misura dal listino e
  dalle rese, non dalla costante.

## Fuori scope

- **Il calore, e la terza fonte.** Fetta 04. È dichiarato nel registro, e quando arriverà
  `INCOME_TAX_RATE` è il primo numero da rileggere: la carta comincerà a pagare due prezzi.
- **Le fonti create dal giocatore.** L'elenco è dichiarato e fisso. Un'entità con ciclo di vita e
  conti propri è l'impresa, blocco D, e il grilletto dei conti dinamici resta lì.
- **La delega e l'attenzione.** La visione promette «poche cose curate al 100% o tante delegate
  all'80%». Il reddito dichiara l'attenzione più bassa del gioco: non ha niente da delegare, e
  dargliene sarebbe contraddire la sua etichetta.
- **Un contratto condiviso per i miglioramenti a rientro.** Il grilletto è il secondo dominio che
  vende resa. Con un uso solo sarebbe la generalizzazione da un caso solo, come `Space` e `Regime`.
- **Il raggruppamento dello stipendio nelle ultime operazioni.** Resta nel registro con il suo
  grilletto. Questa delega non lo peggiora: il tick raggruppa per regime, quindi al minuto zero
  emette **una** transazione come oggi.
- **Il caveau.** Non si tocca una riga. Riacquista un cliente per via del listino dei lavoretti, non
  perché qualcuno lo modifichi.

## Definizione di fatto

- [x] Il gioco si apre identico a oggi: 12,00 €/s, i lavoretti chiusi e visibili con il loro prezzo,
      il muro del caveau dopo circa ottantatré secondi.
- [x] Ogni livello di ogni fonte rientra nel tempo dichiarato, misurato dal listino e dalle rese:
      `income_level_payback` verde, e rosso se qualcuno scrive un prezzo a mano.
- [x] Il plateau è raggiungibile, e in cima **entrambi** i listini sono vuoti: comprare è un esito
      rifiutato con `error.income.max_level`, non un pulsante spento.
- [x] Una fonte in nero si ferma a caveau pieno; una in regola no. `blocked()` lo dice, e distingue
      «ne entra una parte» da «non entra niente».
- [x] Due regimi in gioco insieme producono due transazioni per tick, e lo spazio del caveau è
      chiesto **prima di ciascuna**.
- [x] La somma di tutti i conti fa zero con più fonti e più regimi (INV-08).
- [x] Un salvataggio scritto prima di questa delega si apre: chi aveva l'upgrade si ritrova il
      lavoro al livello 2, chi non l'aveva al livello 1, e il regime resta quello che era.
- [x] Un salvataggio della versione 2 manomesso è rifiutato campo per campo: un livello frazionario,
      negativo, fuori scala o su una fonte che non esiste (INV-20).
- [x] `AUTOSAVE_SECONDS` ha una derivazione nuova scritta accanto, con i numeri di adesso.
- [x] Il devcheat registra e toglie un modificatore su `income.all`, e premerlo due volte non lancia.
- [x] Parità i18n, gate verdi, `docs/stato.md` rigenerato.
- [x] **La pagina del reddito guardata nella finestra vera**: i due pannelli si disegnano, i
      lavoretti chiusi mostrano il prezzo di apertura, e dopo un acquisto il livello avanza a
      schermo. È il punto che D043 aveva dimenticato, e qui c'è dall'inizio.

## Trappole note

- **`accepts` per livello è giusto qui, e in D043 era sbagliato.** La differenza non è di gusto: un
  listino che si svuota perché la **scala è finita** ha un indice che cade fuori da solo, mentre uno
  che si svuota perché «l'hai già comprato» rende `accepts` dipendente da un booleano, cioè rende
  variabile ciò che il Ledger deve poter sapere prima di guardare una partita. Il modello da copiare
  è `paymentFor(level)` del caveau.
- **Il tick raggruppa per regime, non per pool.** Sembra la stessa cosa e non lo è: due regimi
  possono condividere un pool con trattenute diverse, e allora la trattenuta di una transazione sola
  andrebbe scalata sul parziale — cioè una divisione fra `Decimal`, cioè precisione che se ne va e
  INV-08 che si rompe in silenzio. Raggruppando per regime la trattenuta resta `entrato × tasso`,
  come oggi.
- **Lo spazio si chiede prima di ogni transazione, non una volta per tick.** Se due regimi atterrano
  nello stesso pool, il primo ne ha già consumato una parte. `room` è una funzione apposta.
- **`INITIAL` deve avere una voce per ogni fonte.** Un `levels` parziale dà `undefined`, e
  `yieldAt` ci costruirebbe sopra un importo non finito che il Ledger scopre molto più a valle.
  Vale anche per il `load`: una fonte mancante nel salvataggio è spazzatura, non un valore
  predefinito.
- **La migrazione non importa il dominio.** INV-03 lascia al main `contracts/save.ts` e nient'altro,
  e comunque una migrazione deve restare **letterale**: descrive la forma di allora, non quella di
  adesso.
- **Il nome `blocked`, e perché il cambio non è cosmetico.** Oggi `withheld()` è quanto il caveau non
  ha fatto entrare e `withholdingRate` è la parte dello Stato: due cose diverse con lo stesso nome
  nello stesso dominio. Con due fonti e due regimi la confusione smette di essere teorica.
- **`income_per_minute_at_start` è la rete dell'apertura.** Se diventa rosso non è il bersaglio a
  essere invecchiato: è la partita che non si apre più come prima.
- **Nessun numero di gioco dentro `domains/`.** `SOURCES` dichiara la forma; le cifre vengono da
  `BALANCE`, e `domains-no-money-literals` è il gate.
- **Il devcheat che registra due volte lancia.** `register` rifiuta il duplicato: l'interruttore
  deve togliere prima di rimettere, come faceva `syncUpgradeModifier`.

## Cosa questa delega lascia indietro

- **Il gancio `income.all` resta senza clienti veri.** Dentro il dominio non lo usa più nessuno, e
  fuori non c'è ancora niente: il primo cliente è l'albero delle abilità. Il devcheat è ciò che lo
  tiene provato nel frattempo, e va detto invece che lasciato intendere.
- **La voce «calore» dell'etichetta resta a zero.** È l'unica delle nove su cui questo dominio non
  ha niente da dire, e la fonte che la riempirà è di fetta 04.
- **Il plateau è un numero che nessuno ha ancora giocato.** L'intervallo che lo tiene onesto è un
  bersaglio; la cifra dentro l'intervallo si sceglie giocando, ed è la prima cosa da rimisurare
  quando la fetta 04 aggiunge una fonte.
- **La forma della scheda di dominio non viene rivista qui.** Il controllo che
  [D018](D018-la-scheda-di-dominio.md) si è prenotato — due sezioni che non discriminano — vale alla
  **quarta scheda compilata**, che è quella del black market. Questa è una ricompilazione della
  prima.

---

## Consuntivo

Eseguita il 2026-08-24. `npm run verify` verde: **1.399 test**, cinquantasei in più di quelli con
cui la sessione era cominciata.

### Le cinque cose che l'esecuzione ha cambiato rispetto a com'erano scritte

**1. I modificatori si compongono per regime, non sulla somma delle fonti.** La delega chiedeva
«`incomePerSecond` — la somma delle fonti, poi i modificatori su `income.all`», e il tick ha bisogno
di un importo **per regime**. Ripartire un totale già composto vuol dire dividere fra `Decimal`, che
è la trappola che questa stessa delega vietava due paragrafi più in là. La composizione è quindi
scesa dentro il gruppo, e `incomePerSecond` somma ciò che i gruppi hanno già composto: **una formula
sola, letta da due parti**, invece di due che devono coincidere. Per un `mult` i due risultati sono
identici — moltiplicare è distributivo — e `mult` è l'unico tipo che qualcuno registri oggi su
`income.all`. Per un `add` no, e la riga è commentata dov'è il codice.

**2. Il tick salta i regimi che non hanno maturato niente, prima di chiedere lo spazio.** Non era
scritto, e senza si vede subito: a lavoretti chiusi il tick chiedeva la capienza dei contanti per
accreditare zero. Non è un difetto di correttezza — `incomeThatFits(0, room)` fa zero comunque — ma
è una domanda su un accredito che non esiste, e i test sull'ordine delle domande la vedevano.

**3. Il boost del devcheat vale un livello, e il numero non è suo.** `cheat.income.boost` registra
un `mult` pari a `INCOME_LEVEL_GROWTH`. Un moltiplicatore proprio sarebbe stato un numero di gioco
in più da tarare per una cosa che nel pacchetto di rilascio non esiste.

**4. Il caveau del test dei comandi è stato allargato apposta.** I livelli dei lavoretti si pagano
in contanti, e con la capienza di partenza — 1.000,00 € — nemmeno finanziare il caso di prova
riusciva: ogni asserzione avrebbe misurato il caveau invece del comando. Il muro ha i propri test, e
la loro sede è `system`.

**5. `income_per_minute_at_start` non è mai diventato rosso.** Era la rete dell'apertura, ed è
rimasta verde dal primo commit all'ultimo: `INITIAL` è `{ job: 1, gigs: 0 }`, cioè 12,00 €/s.

### Cosa la rilettura della scheda contro `src/` ha trovato

Tre righe smentite, elencate in fondo alla [scheda](../design/domini/income.md): il tick raggruppa
**per regime** e non «per pozza»; il pannello **non** dice il prezzo, perché R24 lo vieta fuori dal
flusso di pagamento (è la stessa correzione che la scheda del caveau aveva già preso, con la stessa
causa: una scheda scritta prima di un'ADR che le è passata sopra); e il gancio `income.all` **ha** un
cliente, il devcheat, che è ciò che lo tiene percorso.

Nessuna delle tre cambia una decisione di gioco, ed è il punto: una scheda che sbaglia sul come e
non sul cosa ha fatto il proprio lavoro.

### Il punto 9, per tre deleghe in una finestra sola

Aperta con `--user-data-dir` su una cartella usa-e-getta (D041: il gioco scrive da sé ogni trenta
secondi), guidata da `scripts/cdp.mjs` (D039).

- **D044 — la pagina del reddito.** I due pannelli si disegnano; il lavoro apre a «liv. 1 di 7» con
  12,00 €/s, i lavoretti a «Chiusa» con la CTA «Apri»; il plateau dice 364,50 €/s e quanto manca.
  Comprato un livello, il pannello passa a «liv. 2 di 7», la resa a 18,00 €/s, «al livello dopo» a
  27,00 €/s e «manca al plateau» a 346,50 €/s — **a schermo, senza ricaricare**.
- **D043 — il pannello del regime.** Dichiara il 3,0% e l'irreversibilità **prima** del flusso di
  pagamento. Messo in regola, la riga «Atterra su» del lavoro passa da _Contanti_ a _Carta_ e quella
  dei lavoretti resta _Contanti_: è l'ADR 0052 applicata a più di una fonte, vista a occhio.
- **D042 — la pagina del caveau.** Barra, «CAVEAU 1 DI 9», capienza, spazio libero, quanto tiene il
  prossimo livello, quanti ampliamenti restano, e la CTA. Nessun prezzo fuori dal flusso.

E una cosa vista solo guardando: **il prezzo compare una volta sola, dentro `PaymentDialog`** —
«Si paga solo con: Carta 1.800,00 €» per il lavoro, 6.000,00 € per aprire i lavoretti. Sono i due
numeri che l'ADR 0053 produce, letti dove il giocatore li legge.

### Cosa resta com'era

Tutto ciò che la sezione _Cosa questa delega lascia indietro_ dichiarava: il gancio `income.all`
senza clienti veri fuori dal devcheat, la voce «calore» a zero, il plateau come cifra che nessuno ha
ancora giocato, e la forma della scheda di dominio da rivedere alla quarta compilazione.
