# Passaggio di consegne

Per chi prende in mano Solvent adesso — persona o agente. Si legge in dieci minuti e basta a
ripartire senza fare domande.

## Cos'è Solvent

Idle/tycoon finanziario per desktop. Electron + Vue 3 + TypeScript + Pinia + Vitest.

È la ricostruzione da zero di un progetto precedente (`finanx`, ~104.000 righe) di cui esiste un
audit con **17 difetti misurati**. Quel repo si usa **solo come catalogo di idee di gioco**: mai
copiarne codice, struttura di cartelle o pattern — sono esattamente ciò che ha fallito.

Il gioco ruota attorno a una tensione sola: **contanti contro carta**. Anonimi ma limitati contro
tracciabili ma illimitati. Ogni dominio — black market, prestiti, casinò, immobiliare — è un modo
diverso di viverla. Senza quella tensione, diciassette domini sono diciassette pulsanti che alzano lo
stesso numero.

Non c'è un'attività principale e non c'è una progressione: è una **sandbox**. Nessun dominio si
sblocca — ognuno dichiara un requisito, e il giocatore lo soddisfa quando ci riesce, nell'ordine
che si costruisce da sé. A impedire che uno strumento diventi la risposta a ogni domanda non è una
fase del gioco: è che ognuno **satura**, e che ognuno paga in almeno una fra liquidità,
tracciabilità, varianza e attenzione.

La struttura che regge tutto questo — l'etichetta a nove voci, la legge della non dominanza, le
quattro forme di saturazione — e la profondità di ogni dominio stanno in
[prodotto/visione.md](../prodotto/visione.md), riscritta il 2026-08-20. **Se hai in mente le quattro
ere, quel documento è cambiato sotto di te:** le ere non esistono più come struttura di gioco, e
sopravvivono solo come lettura interna in [roadmap-fette.md](../roadmap-fette.md).

## Dove siamo, esattamente

|                          |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| STOP 1                   | **approvato** — nome, stile visivo, le tre dipendenze di runtime, la simulazione nel renderer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| STOP 2                   | **riportato** da [D013](D013-verifica-della-fetta.md): la fetta 01 è conclusa e verificata, otto passi manuali su otto                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Deleghe                  | quali sono chiuse e quali aperte lo dice [stato.md](../stato.md); **l'ordine in cui si eseguono** è il grafo in [README.md](README.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Kernel                   | **finito** (D003–D008) — le righe le conta [stato.md](../stato.md), con il metodo scritto nel codice che le conta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Persistenza nel main     | **finita** — lo schema eseguito, la scrittura atomica, i tre canali IPC                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Domini                   | tre: `income` ha stato e ticchetta, `vault` ha stato e **non** ticchetta, `atm` è due comandi. Da D026 ognuno ha la sua pagina, e da D033 il bancomat ha la **sua**: la `home` non esiste più, al suo posto ci sono `atm` e `board`                                                                                                                                                                                                                                                                                                                                                                      |
| Schede di dominio        | da D018 il modulo è [design/domini/README.md](../design/domini/README.md), e i tre domini che esistono l'hanno compilato                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Le regole                | la mappa completa, con la forza di ciascuna, è [tracciabilita.md](../tracciabilita.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `npm run verify`         | **verde**; i tempi, con la data accanto, stanno in [qualita.md](../qualita.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `npm run verify:release` | **verde** — il renderer compila; il peso, con la data accanto, sta in [qualita.md](../qualita.md) e non si ripete qui                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `main`                   | **è di nuovo l'unico ramo, e li ha tutti.** Il 2026-08-23, chiudendo la quinta sessione, sono stati fusi i due rami incatenati che aspettavano: `d038-cio-che-si-preme-e-cio-che-scorre` discendeva da `d037-il-tempo-che-avanza-e-un-operazione-del-gioco`, quindi è bastato un `--ff-only` sul secondo per portarli tutti e due. `verify` e `verify:release` sono stati girati **su `main` fuso**, non solo sui rami, e i due rami sono stati cancellati con `git branch -d` — quello che si rifiuta se resta lavoro non fuso: **nessuno dei due si è rifiutato**                                      |
| `origin/main`            | **si verifica, non si dichiara.** Un allineamento scritto qui lo invalida il primo commit che arriva dopo — compreso quello che lo scrive — e l'elenco di cosa si è spinto invecchia a ogni delega consegnata. Lo dice `git rev-list --count origin/main..main`: se non fa `0`, c'è del lavoro solo su questa macchina. Quando si spinge, i gate girano prima **su `main` fuso** e non solo sui rami                                                                                                                                                                                                     |
| Albero di lavoro         | non si scrive qui, per la ragione della riga sopra: lo dice `git status`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Prossimo passo           | **eseguire [D044](D044-il-reddito-e-un-elenco-di-fonti.md)**, che è `Aperta` e già scritta: il reddito diventa un elenco di fonti, con una scala e un plateau. Il ramo `d044-il-reddito-e-un-elenco-di-fonti` esiste e porta **solo documenti** — nessuna riga di codice. Restano `In corso` [D042](D042-il-caveau-ha-uno-spazio-e-una-scala.md) e [D043](D043-il-reddito-si-mette-in-regola.md) per lo stesso punto 9, guardare la pagina nella finestra vera: quella del **caveau** si può fare quando si vuole, quella del **reddito** conviene farla **dopo** D044, perché la pagina cambia comunque |

> **Il lavoro non è più solo su questa macchina.** Per due settimane `origin/main` è rimasto fermo
> al 2026-08-20, al commit `84dbe47`, e questa riga era un avvertimento. Il 2026-08-21 i
> **cinquantotto** commit che mancavano sono stati fusi e spinti in un colpo, dopo che
> `npm run verify` e `npm run verify:release` erano verdi **su `main` fuso**, non solo sul ramo di
> lavoro.
>
> Nello stesso passaggio i **trentasette** rami di lavoro sono stati cancellati con `git branch -d`,
> che si rifiuta di cancellare un ramo con lavoro non fuso: nessuno si è rifiutato, il che è la
> prova che non c'era lavoro unico da nessuna parte. Ne resta uno, `main`.
>
> **Perché la riga resta invece di sparire:** che il lavoro sia spinto è una condizione, non un
> fatto acquisito. Chi legge lo verifichi invece di crederci — costa un comando:
>
> ```bash
> git rev-list --count origin/main..main
> ```
>
> Se non è zero, siamo di nuovo nella situazione che questa riga descriveva. Un `push` è visibile
> agli altri e non si disfa pulendo: resta una di quelle cose che si chiedono.

## La **decima** sessione del 2026-08-24: D044, il reddito ha una scala e un tetto

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. **Questa è la più
recente**: tutte le sezioni sotto descrivono stati già superati, e si leggono come storia.

**Cosa è stato fatto — e non c'è una riga di codice.**

| Cosa                                                                         | Cos'era                                                                                                             |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [ADR 0053](../adr/0053-un-miglioramento-dichiara-il-tempo-in-cui-rientra.md) | `Proposta` — il prezzo di un miglioramento che compra resa non si dichiara: si dichiara il **tempo in cui rientra** |
| [La scheda del reddito](../design/domini/income.md)                          | **ricompilata da capo**, e dichiara in testa che descrive un dominio che non esiste ancora                          |
| [D044](D044-il-reddito-e-un-elenco-di-fonti.md)                              | scritta, `Aperta`, **non eseguita**. Il ramo esiste e porta solo documenti                                          |
| Il grafo delle deleghe in [README.md](README.md)                             | riacquista **D042 e D043**, che mancavano da due sessioni                                                           |

### Le sei cose che chi arriva adesso deve sapere

**1. La richiesta era «il dominio del reddito non ha senso — compro gli straordinari a 800 €?», e la
risposta non è stata inventare una meccanica.** È la terza volta di fila che una richiesta viene
verificata invece che obbedita, e stavolta l'argomento era vero per intero: il dominio ha un pulsante
solo, lo si compra dopo tre quarti di minuto, e poi non chiede più niente per il resto della partita.
Ma la profondità non è stata inventata — è stata **letta**. La stessa identica cosa la promettevano
già, e nessuno l'aveva costruita: la [mappa funzionale](../design/mappa-funzionale.md), blocco 1, con
«una manciata di fonti, ciascuna con nome, livello, effetto e costo»; il canvas, con «which sources
are active, and at what level»; la sezione 9 della scheda; e la regola 1
dell'[ADR 0052](../adr/0052-un-guadagno-dichiara-dove-atterra.md), «il giocatore sceglie quali fonti
aprire».

**2. Da D043 il reddito non satura, e nessun test poteva dirlo.** La regola 3 della
[visione](../prodotto/visione.md) pretende che ogni strumento dichiari come muore il secondo milione.
La risposta del reddito era «il caveau» — e l'ADR 0052 quel legame l'ha sciolto per il reddito in
regola, perché sulla carta non c'è capienza. Il buco è di un giorno, è uscito compilando la sezione 4
della scheda, e non si vede leggendo il codice: i gate sono verdi, e a ragione.

**3. L'ADR 0053 non parla di reddito: parla di prezzi.** Il prezzo di un miglioramento che compra
**resa** non si scrive — si scrive in quanti secondi rientra, e il prezzo si calcola. Il rapporto che
la visione chiama «l'unico che conta» diventa vero per costruzione invece che per taratura. **E la
conseguenza è ciò che rende la decisione interessante:** se ogni livello di ogni fonte rientra nello
stesso tempo, «quale compro?» smette di essere un confronto fra cartellini e diventa una domanda su
**in quale pozza atterrano i soldi** — cioè la tensione contanti contro carta, invece di
un'aritmetica.

**4. Due fonti e non «una manciata», e la ragione sta nell'etichetta.** Le monete con cui una fonte
può pagare sono quattro: liquidità, tracciabilità, varianza, attenzione. Il reddito dichiara
**varianza zero** e **l'attenzione più bassa del gioco**, e le deve mantenere — un dominio che
dichiara di essere silenzioso deve restare silenzioso. Restano liquidità e tracciabilità, cioè l'asse
contanti/carta, che regge due fonti e non tre. La terza è quella che si paga in **calore**, ed è
fetta 04: sta nel [registro](../roadmap-fette.md) con il suo grilletto invece di essere inventata
adesso.

**5. Il registro dei modificatori perde il suo unico cliente, e nessuno se n'era accorto.** Il ×1,5
degli straordinari è **l'unica** registrazione in tutto il gioco: togliendolo, `register` e `remove`
restano vivi solo nei propri test — cioè quel «campo provato e non usato» che nessun gate sa vedere e
che [D040](D040-il-recupero-avanza-a-blocchi.md) ha già pagato una volta. Trovato compilando la
domanda 5 della metà kernel, non leggendo il codice. La risposta è il devcheat, che passa da «inverti
il potenziamento» a «registra un ×2 su `income.all`».

**6. Il salvataggio passa alla versione 2, e il grilletto delle migrazioni scatta da dove nessuno se
lo aspettava.** Il registro YAGNI dichiarava «la versione 2 della busta, che arriverà con i conti
dinamici». Arriva invece con il reddito, perché lo stato cambia forma: due booleani diventano un
elenco di livelli. Il runner esiste da [D009](D009-persistenza-main.md), è provato con migrazioni
finte e passi veri, e la sua mappa è vuota da cinque fette.

### Cosa c'è nell'albero di lavoro alla chiusura

**Niente**: `git status` è pulito, e non c'è nessuno stash. Il ramo
`d044-il-reddito-e-un-elenco-di-fonti` ha **un** commit, `f3026e1`, che tocca **solo `docs/`** —
verificato con `git diff --name-only main..HEAD`, che non stampa niente fuori da quella cartella. Il
ramo non è fuso e non è spinto.

`npm run verify` è **verde**: 90 file di test, 1.343 test. `verify:release` non è stato rigirato, e
non serve: il diff non tocca una riga di `src/`.

### Due vicoli ciechi, per non ripercorrerli

**I livelli scritti come modificatori registrati.** Sarebbe la mossa che tiene vivo il registro dei
modificatori del punto 5, e per un po' è sembrata elegante: ogni livello registra un `mult` sul
bersaglio della propria fonte. Cade su una cosa sola, e vale la pena saperla prima di riprovarci: un
livello è **stato**, e registrarlo rende il registro uno **specchio dello stato** da risincronizzare
a ogni `load` e a ogni `reset`. È la fragilità che il codice di oggi ha già con **un** upgrade —
`syncUpgradeModifier` esiste per quello, con un commento che lo spiega — moltiplicata per il numero
delle fonti. I livelli restano aritmetica pura sullo stato.

**Cercare una terza fonte difendibile oggi.** Cercata, e non c'è. Con le sole liquidità e
tracciabilità a disposizione, una terza fonte si distinguerebbe dalle altre due solo per la resa
base, cioè per niente: finirebbe nell'etichetta come una riga che non discrimina, e la legge della
non dominanza lo direbbe al primo confronto. La differenza vera la porta il calore, e il calore è
fetta 04.

### Cosa questa sessione lascia indietro

- **Il codice di D044 non esiste.** La delega è `Aperta` e completa — file per file, i numeri, i
  bersagli, le trappole e la definizione di fatto. Chi riprende esegue quella.
- **D042 e D043 restano `In corso`**, per il punto 9 di sempre. Quello del caveau è indipendente;
  quello del reddito conviene farlo **dopo** D044, perché quella pagina cambia comunque.
- **INV-26 manca ancora in [tracciabilita.md](../tracciabilita.md)**: è di D042, che non ha chiuso.
  Adesso il buco è fra INV-25 e INV-27, e INV-28 è stata aggiunta in fondo da questa sessione.
- **I quattro commenti che citano costanti cancellate da D042 sono ancora lì**, verificati con un
  `grep` passando di qui: `VAULT_PRICES_CARD` in `src/core/balance/constants.ts` alle righe 200, 385
  e 400, e `VAULT_CAPACITIES` in `src/core/contracts/pools.ts:56`. Sono di quella delega.
- **Quattro rami esistono**: `d041-il-salvataggio-ha-una-cadenza`,
  `d042-il-caveau-ha-uno-spazio-e-una-scala` e `d043-il-reddito-si-mette-in-regola` in locale **e su
  `origin`**, `d044-il-reddito-e-un-elenco-di-fonti` **solo in locale**. Nessuno è stato cancellato,
  fuso o spinto: sono decisioni dell'utente.
- **Il plateau è un numero che nessuno ha ancora giocato.** 364,50 €/s è **derivato**, non provato:
  l'intervallo che lo tiene onesto è un bersaglio, la cifra dentro l'intervallo si sceglie giocando.

## La **nona** sessione del 2026-08-24: D043, il caveau smette di essere il tetto del gioco

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. Sopra c'è la decima,
che è la più recente: questa e tutte le sezioni sotto descrivono stati già superati, e si leggono
come storia.

**Cosa è stato fatto.**

| Cosa                                                         | Cos'era                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| [ADR 0052](../adr/0052-un-guadagno-dichiara-dove-atterra.md) | dove atterrano i soldi era una costante privata, `INCOME_POOL = 'cash'`, decisa da nessuno |
| [D043](D043-il-reddito-si-mette-in-regola.md)                | scritta **ed eseguita**, e non ancora chiusa: manca la prova a schermo, come D042          |
| `main`                                                       | D041, D042 e D043 fusi con `--ff-only` e **spinti**: `origin/main` è a `485fa8e`           |

### Le sei cose che chi arriva adesso deve sapere

**1. La richiesta era «il caveau è sbilanciato, a 250k si riempie ogni secondo», e la risposta non è
stata spostare il tetto.** È la seconda volta di fila — la sessione ottava aveva già rifiutato «togli
il cappello a 250k» — e la ragione è la stessa: **prima di muovere un numero di bilanciamento si
verifica l'argomento che lo sostiene.** Qui l'argomento era vero a metà. Il fastidio era reale e non
immaginato: con un reddito grande il caveau si riempie dentro un tick e l'unica valvola è un pulsante
da premere dieci volte al secondo. Ma la causa non era il tetto: era che **tutto** il reddito passava
di lì.

**2. Il difetto era una riga che nessun documento aveva deciso.** `const INCOME_POOL: Pool = 'cash'`
stava in `domains/income/system.ts` dalla fetta 01, quando la carta non aveva ancora niente da fare.
Ne discendeva che il tetto dei **contanti** fosse il tetto di **tutto il reddito del gioco** — che
non è ciò che il caveau dichiara di essere: la sua scheda dice «tiene i contanti **anonimi**, e ne
tiene pochi», e la visione dichiara la carta «illimitata». Il tetto doveva essere il prezzo
dell'anonimato ed era diventato il soffitto della partita.

**3. Il regime è un dato, e la regola vale per tutti.** L'ADR 0052 dice che ogni guadagno dichiara
dove atterra, e che a dichiararlo è la **fonte** — non un interruttore del giocatore. In nero →
`cash`, niente trattenute, il muro; in regola → `card`, che non ha tetto, e la parte dello Stato. Il
tick legge un regime e non nomina più nessun pool, che è la forma dell'ADR 0017: le affordance sono
dati, non un `if` sul nome.

C'è un corollario che oggi non ha ancora niente da sorvegliare e che vale la pena conoscere prima
della fetta 04: **ciò che accade da solo atterra in un pool senza tetto.** Uno stop-loss che scatta a
finestra chiusa non può chiedere dove mettere i soldi e non può essere rifiutato da una capienza. Il
grilletto è nel registro YAGNI.

**4. È un acquisto, e non si torna indietro — e le due cose sono la stessa.** Un interruttore
gratuito ha un gioco ottimale: in nero finché c'è spazio, in regola quando il caveau è pieno, in nero
appena si libera. Cioè la mansione di prima con un pulsante diverso. Una scelta che si paga e non si
disfa non ha quel gioco ottimale.

**5. Il 3% non è tarato sul realismo fiscale: è tarato sulla commissione del bancomat.** Chi resta in
nero e vuole i soldi sulla carta li versa a mano e paga `ATM_FEE_RATE_IN`, l'1,5%. Sotto quella cifra
la carta domina e i contanti muoiono; sopra il 5% restare in nero e cliccare verrebbe **pagato**
abbastanza da valere la pena — e avremmo scritto un'ADR per rendere ottimale la mansione che voleva
togliere. `income_tax_rate` sorveglia tutti e due i versi con lo stesso intervallo, ed è per questo
che è stretto.

**6. `income` ha guadagnato un terzo argomento obbligatorio, e ha toccato dodici file.** Era il prezzo
dichiarato: `income(pool, amount, withheld)` rende **INV-27 un errore di compilazione** invece di un
test — un reddito senza regime non compila. Le modifiche sono tutte `, ZERO` e nessuna è
interessante, ma sono il grosso delle 405 righe di test contate nell'indice: **le prove nuove sono
ventitré.** Chi legge quel numero senza questa riga si fa un'idea sbagliata di quanto sia coperta la
fetta.

### Le due cose che l'esecuzione ha corretto rispetto alla delega

**Il listino della dichiarazione non si svuota a chi è già in regola.** La delega diceva di copiare
la forma di `expansionPrices` del caveau — lista vuota all'ultimo livello, così non serve un ramo. È
sbagliato: quella forma vale per una **scala**, dove l'indice cade fuori da solo. Qui lo stato è un
booleano, e un listino che dipende dallo stato rende dipendente dallo stato anche `accepts`, cioè la
cosa che il Ledger deve poter sapere prima di guardare una partita. Il gemello che sta venti righe
sopra nello stesso file, `upgradePrices()`, rispondeva già bene.

**`declared` assente e `declared: undefined` non sono la stessa cosa.** La delega diceva «assente
vale `false`», e scritto come `loaded.declared !== undefined` avrebbe fatto passare anche uno stato
manomesso — cioè avrebbe bucato INV-20. A trovarlo è stato
`tests/rules/stateful-systems-reject-garbage`, che genera la spazzatura **dallo stato buono** e
quindi ha provato `declared: undefined` senza che nessuno glielo chiedesse. La distinzione giusta è
`'declared' in loaded`: JSON non sa produrre una chiave presente che vale `undefined`.

### Cosa questa sessione lascia indietro

- **D042 e D043 sono tutte e due `In corso`, per lo stesso punto 9.** La finestra vera non è stata
  aperta: la pagina del caveau di D042 e il pannello nuovo di D043 non li ha visti nessuno. Si
  chiudono in un colpo solo. Il punto 9 di D043 **è stato aggiunto dopo l'esecuzione**, e la sua
  assenza era il difetto: la delega aggiungeva un pannello nuovo e non si era chiesta di guardarlo.
- **`tracciabilita.md` ha un buco fra INV-25 e INV-27.** INV-26 è di D042, che non ha ancora chiuso.
- **Quattro commenti citano costanti che D042 ha cancellato** — `VAULT_CAPACITIES` e
  `VAULT_PRICES_CARD`, in `src/core/balance/constants.ts` e `src/core/contracts/pools.ts:56`.
  Trovati passando di qui e lasciati stare: sono di quella delega.
- **Il grafo delle deleghe in [README.md](README.md) non ha né D042 né D043.** Aggiungere solo la
  seconda avrebbe disegnato una freccia verso un nodo che non esiste.
- **I tre rami di lavoro non sono stati cancellati**, a differenza di come si è fatto nelle sessioni
  precedenti: `d041-il-salvataggio-ha-una-cadenza`, `d042-il-caveau-ha-uno-spazio-e-una-scala` e
  `d043-il-reddito-si-mette-in-regola` esistono in locale **e su `origin`**. Sono tutti antenati di
  `main`, quindi `git branch -d` li accetterebbe senza protestare — ma cancellare un ramo spinto si
  vede anche agli altri, ed è una di quelle cose che si chiedono.

### Cosa il giocatore vede, in una riga

Sulla pagina **Reddito** c'è un pannello nuovo, «Regime del reddito». Si parte in nero; l'acquisto
costa 50.000,00 € sulla carta, è irreversibile, e da lì lo stipendio arriva sulla carta al netto del
3%. Il muro del caveau smette di riguardare lo stipendio e resta dov'era per il denaro anonimo — che
è ciò che serve alla fetta 04.

## La **ottava** sessione del 2026-08-24: D042, lo spazio del caveau smette di essere denaro

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. Sopra c'è la nona, che
è la più recente: questa e tutte le sezioni sotto descrivono stati già superati, e si leggono come
storia.

**Cosa è stato fatto.**

| Cosa                                                                        | Cos'era                                                                                 |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [ADR 0051](../adr/0051-lo-spazio-di-un-caveau-non-e-una-somma-di-denaro.md) | l'ingombro di un oggetto era dichiarato in **euro**, come il denaro che gli sta accanto |
| [D042](D042-il-caveau-ha-uno-spazio-e-una-scala.md)                         | scritta **ed eseguita**, e non ancora chiusa: manca la prova a schermo                  |
| La scala del caveau                                                         | tredici cifre scritte a mano, di cui una già scivolata                                  |

### Le sei cose che chi arriva adesso deve sapere

**1. La richiesta era «togli il tetto a 250k», e la risposta è no — con la ragione scritta.**
L'utente ha chiesto una progressione «non cappata a 250k ma dinamica». Il primo argomento a favore
era **sbagliato**, ed è stato verificato invece che creduto: «un quadro da dieci milioni non entra
in un caveau da 250.000» è falso, perché l'ingombro di un oggetto **non è il suo valore** e la
scheda del dominio lo dichiara da sempre. Il tetto regge un numero qualunque di oggetti, a qualunque
scala. Toglierlo avrebbe tolto la forma 1 della saturazione, cioè la spina dorsale del gioco. Vale
come metodo: **prima di obbedire a una richiesta che sposta un numero di bilanciamento, si verifica
l'argomento che la sostiene.**

**2. Il difetto vero era l'unità, ed era più piccolo e più profondo.** Un euro che misura denaro e un
euro che misura ingombro sono la stessa unità su due grandezze che non si sommano. Oggi non si
sommano solo perché nessuno ha ancora provato: il giorno degli oggetti quella sottrazione si scrive,
il compilatore tace, e a valle esce una capienza sbagliata che il giocatore scopre come stipendio
che non arriva. Adesso `Space` è un tipo branded e il compilatore rifiuta un `Money` al suo posto —
**verificato togliendo `space()` da `SPACE_AT_ZERO`**, e l'errore è
`Type 'Decimal' is not assignable to type 'Space'`.

**3. `CASH_PER_SPACE` oggi non cambia niente, e va saputo prima di ritoccarlo.** La densità si
**cancella** fra la derivazione dello spazio di partenza e la moltiplicazione che ne ricava la
capienza: la scala in euro resta `CASH_START_CAPACITY × crescita^livello` qualunque valore abbia.
Misurato portandola da 100 a 200: cade **un** test solo, quello della colonna _Spazio_, e
`seconds_to_first_wall` resta verde. Chi la ritocca sperando di spostare il muro non sposta niente —
le leve sono `VAULT_LEVELS` e `VAULT_SPACE_GROWTH`. Diventerà un numero di bilanciamento vero il
giorno degli oggetti, perché il rapporto fra la loro densità e questa è **la** scelta del dominio.

**4. Dei quattro prezzi scritti a mano, uno era già scivolato, e nessun test lo guardava.** La regola
«ogni prezzo sta appena sotto la capienza da cui si paga» era un commento: 900 su 1.000, 4.500 su
5.000 e 18.000 su 20.000 sono il 90,0% esatto, **68.000 su 75.000 è il 90,7%**. Adesso è una regola
con una costante sola. Vale come metodo: **una relazione fra numeri che vive in un commento è una
relazione che diverge, e la divergenza non fa rumore.**

**5. Il caveau non può diventare profondo, e non è pigrizia.** La richiesta diceva anche «i domini
devono essere profondi, non un pulsante». La sua etichetta dichiara **attenzione quasi zero** — «un
pulsante ogni tanto, nessuna entità da seguire» — ed è la sua identità. La sua profondità sono gli
**oggetti** e la **perquisizione**, e tutti e due arrivano da domini che non esistono. Chi vuole un
dominio profondo da costruire guardi il **blocco A** della [roadmap](../roadmap-fette.md): aste di
box e negozio, dove vive la decisione «cosa vale la pena tenere».

**6. Una meccanica è stata proposta, bocciata dall'utente, e la delega spiega perché aveva ragione.**
Era il **taglio delle banconote**: i contanti che occupano spazio secondo il taglio, e un
«consolidamento» che costa una commissione. Suonava profonda ed era invenzione: avrebbe costretto il
Ledger ad avere un **secondo depositario** del saldo dei contanti — la composizione in banconote —
cioè due dichiarazioni dello stesso fatto. Sta in _Fuori scope_ di D042 con il suo grilletto vero,
che è il calore.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **`npm run verify` verde** (90 file di test) e **`npm run verify:release` verde**.
- **L'albero di lavoro è pulito**: `git status` non ha niente. I due commit di D042 stanno sul ramo
  `d042-il-caveau-ha-uno-spazio-e-una-scala`, che parte da `d041-il-salvataggio-ha-una-cadenza` —
  **è un ramo incatenato**, come D030 → D032 → D031 e D037 → D038, e si scioglie con un `--ff-only`.
  Quanti commit siano non si scrive qui: lo dicono `git rev-list --count main..HEAD` e
  `git rev-list --count origin/main..main`.
- **Fondere e spingere sono decisioni dell'utente**, e questa sessione non le ha prese. La domanda è
  stata posta: la scelta è stata «ramo d042 da qui», non «fondi prima D041».
- **Otto rotture volute**, ognuna ripristinata con un `diff` che conferma l'identità — 5, 4, 8, 1, 2,
  1, 1 e 2 test caduti — più il typecheck rotto di proposito sul tipo branded. Il conto sta in fondo
  a D042.
- **Niente residui di debug**, nessun `TODO`, nessun file temporaneo nel repo.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto.

1. **Il punto 9 della definizione di fatto di D042 non è stato fatto**: la pagina del caveau **non è
   stata guardata nella finestra vera**. È la ragione per cui la delega è `In corso` e non `Chiusa`.
   Chi la chiude usi `--user-data-dir` su una cartella usa-e-getta: da D041 il gioco scrive **da sé**
   ogni trenta secondi, e la partita dell'utente è in pericolo senza che nessuno chiuda niente.
2. **INV-26 non è in [tracciabilita.md](../tracciabilita.md)**, e il suo test esiste già
   (`tests/rules/vault-space-is-not-money`). La riga si scrive insieme alla chiusura di D042.
3. **L'ADR 0051 è `Proposta`.** Il meccanismo che lo impone è scritto e verde; passa ad _Accettata_
   nello stesso commit che chiude D042, come il 0025 con D017.
4. **Nove livelli e fattore 2 sono bilanciamento, e sono contestabili.** Arrivare al muro finale
   costa 229.500,00 € contro i 91.400,00 € di prima — due volte e mezzo, cioè ~5,3 ore di gioco al
   reddito base invece di ~2,1. La leva è **una**, `VAULT_LEVELS`, e il conto sta nella decisione 2
   di D042.
5. **La quarta scheda di dominio non è stata compilata**, ed era il prossimo passo dichiarato dalla
   settima sessione. Questa sessione ha fatto un lavoro di specie diversa, chiesto dall'utente.

### Un vicolo cieco, per non ripercorrerlo

**Un accessore pubblico sull'ingombro non serve, e il typecheck lo dice in mezz'ora.** `spaceOf` è
nato come porta pubblica su `Space`, ed è morto appena le capienze sono state precalcolate: nessuno
lo chiamava. Il Ledger, il reddito, il bancomat e la UI vogliono **euro**, e il giorno degli oggetti
a chiamarlo sarà `CASH_CAPACITIES`, cioè lo stesso file. Tenerlo vivo per i propri test sarebbe
stato un campo provato e non usato — e nessun gate sa vedere la differenza. La riga che lo spiega sta
in `vault/rules.ts`, sotto `cashCapacityFor`.

## La **settima** sessione del 2026-08-24: D041 scritta ed eseguita, e la fetta 03 chiusa

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. **Questa è la più
recente**: tutte le sezioni sotto descrivono stati già superati, e si leggono come storia.

**Cosa è stato chiuso.**

| Cosa                                          | Cos'era                                                                                            |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [D041](D041-il-salvataggio-ha-una-cadenza.md) | il gioco scriveva su disco solo chiudendo la finestra, e chi non chiudeva perdeva la sessione      |
| La **fetta 03**                               | conclusa: il recupero avanza a blocchi (D040) e il gioco non aspetta più la chiusura per scriversi |
| Una divergenza del passaggio di consegne      | il registro dichiarava «lo stesso problema» una cosa che è vera solo a metà                        |

### Le sei cose che chi arriva adesso deve sapere

**1. Il gioco si salva da sé ogni trenta secondi**, e la cadenza sta **sulla via unica del tempo** —
dentro `Game.advance`, accanto alla cronaca — non in un timer e non nello store. È l'
[ADR 0050](../adr/0050-la-cadenza-sta-sulla-via-unica.md), e serve soprattutto perché nessuno la
«semplifichi» spostandola: R25 non la vedrebbe nemmeno, perché guarda chi nomina `tickAll` e una
cadenza non lo nomina. Sarebbe una regola verde con la sua ragione aggirata.

**2. «Salvataggio a intervalli e progresso offline sono lo stesso problema» è vero a metà, e la metà
falsa costa il primo ramo scritto.** Vero del **gancio**: c'è un posto solo dove passa ogni tick.
Falso dell'**unità**: la durabilità si misura in tempo reale, i blocchi in tempo di gioco. Mentre si
gioca coincidono — dieci tick sono un secondo — e durante un recupero no: 7.300 tick passano in meno
di tre millisecondi, quindi una cadenza da trenta secondi è dovuta **ventiquattro volte** in quei tre
millisecondi. Ne discende che ciò che si accumula è un `boolean` e non un numero.

**3. Non salvare durante un recupero non perde niente**, e l'istinto dice il contrario. Un recupero è
**ripetibile**: parte da `savedAt`, chiama `stepOf` e produce lo stesso stato ogni volta. Chi crolla
subito dopo riapre, recupera di nuovo dallo stesso istante, e torna dove era. Ciò che il recupero
ricostruisce non è gioco che si può perdere — è gioco che non è ancora stato giocato.

**4. Una scrittura a cadenza che fallisce non manda la partita in errore, e la chiusura sì.** Non è
incoerenza: là la finestra sta chiudendo e quella è l'unica copia, qui la partita è in memoria e la
chiusura riproverà comunque. Il sintomo esiste già senza disegnare niente — `savedAt` è a schermo
sotto «Ultimo salvataggio» — ed è dichiarato che è il **minimo** onesto, con un grilletto nel
registro YAGNI per quando servirà di più.

**5. Il salvataggio dell'utente adesso è in pericolo in un modo nuovo, e la vecchia precauzione non
basta.** D040 lo proteggeva **terminando** l'applicazione invece di chiuderla. Con una cadenza
attiva il gioco scrive **da sé**, senza che nessuno chiuda niente: l'unica difesa è
`--user-data-dir` su una cartella usa-e-getta. Questa sessione l'ha usata, e ha verificato dopo che
il `save.json` vero è rimasto al 22 agosto.

**6. `node node_modules/electron/install.js` è obsoleto davvero**, e questa è la prima sessione a
ripagare la riga invece di riscoprirla: `npm ci` non scarica il binario, e
`node -e "require('electron')"` lo scarica al primo `require`. Se `npm run dev` dice _Electron
uninstall_, è quello il comando.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **`npm run verify` verde** e **`npm run verify:release` verde**. Quanti siano i test e quanto duri
  la catena lo dice [qualita.md](../qualita.md), rimisurata in questa sessione dopo nove deleghe di
  numeri scaduti.
- **Il ramo `d041-il-salvataggio-ha-una-cadenza` è avanti a `main` di tre commit, e `main` è
  avanti a `origin/main` di uno** — il commit che _scrive_ la delega, fatto prima di ramificare.
  Fondere e spingere sono decisioni dell'utente, e questa sessione non le ha prese: la domanda è
  stata posta e non ha ancora risposta. I due numeri non si scrivono qui perché invecchiano al primo
  commit: li dicono `git rev-list --count main..HEAD` e `git rev-list --count origin/main..main`.
- **`npm ci` ha modificato `package-lock.json` e la modifica è stata annullata.** Toglieva 78 righe
  di dipendenze **opzionali** di `electron-builder` (`@electron/windows-sign` e i suoi). Non è
  lavoro di D041 e infilarla nel commit della delega l'avrebbe resa invisibile: è stata ripristinata
  con `git checkout --`. Se sia giusto tenerla è una decisione a sé, e nessuno l'ha presa.
- **Niente residui di debug**, e la cartella usa-e-getta della prova sta nello scratchpad, non nel
  repo.
- **Il ramo è stato provato rompendolo sei volte**, con il conto in fondo alla delega — 3, 3, 2, 1,
  1 e 5 test caduti — più un **controllo** che doveva restare verde ed è restato.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto.

1. **La misura della catena a macchina scarica è stata presa**, dopo otto sessioni in cui era il
   primo punto di questo elenco. Sta in [qualita.md](../qualita.md) con la data e le condizioni.
2. **La posizione di `saveCadence.advance` dentro il ciclo dei blocchi non è provata da nessun
   test.** Spostarla fuori lascia tutti i test verdi — misurato di proposito. È un argomento di
   disegno, non una proprietà verificata, e la correzione 9 di D041 dice quando comincerà a esserlo.
3. **La guardia di INV-17 in `writeAtCadence` non è raggiungibile da nessuno stato.** Resta, per la
   ragione che `close()` porta accanto alla propria, e il codice lo dichiara invece di lasciarla
   sembrare una difesa attiva. Vedi la correzione 6.
4. **Le tre decisioni di D041 sono contestabili**, e i conti che le hanno decise stanno in fondo alla
   delega. Quella dei trenta secondi in particolare è bilanciamento: se giocandoci sembra troppo o
   troppo poco, il numero si sposta in una riga e la derivazione accanto dice cosa si sta cambiando.

### Un vicolo cieco, per non ripercorrerlo

**Guardare la cadenza a finestra nascosta non funziona, ed è il contrario del recupero.** Con la
porta di ispezione aperta la pagina è `hidden`: non passano tick, quindi la cadenza non scatta, e lo
schermo sembra fermo per un difetto che non c'è. Misurato invece che creduto — il saldo è rimasto a
387,60 € per quindici secondi di orologio vero, campionato tre volte. Il recupero si guarda proprio
lì perché non passa dal frame (D040); questa no.

## La **sesta** sessione del 2026-08-23: `npm install` alla causa, e la fetta 03 comincia

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione.

**Cosa è stato chiuso.**

| Cosa                                         | Cos'era                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| [D040](D040-il-recupero-avanza-a-blocchi.md) | il recupero era un `advance` solo, quindi le soglie erano invisibili           |
| `npm install`                                | non funzionava da due mesi, e cinque deleghe lo scrivevano come una proprietà  |
| Due divergenze di **questa** pagina          | mandava a eseguire una delega chiusa, e confondeva la fetta 03 con il blocco A |

### Le sei cose che chi arriva adesso deve sapere

**1. `npm install` funziona, senza flag, e se un giorno ne chiede uno è un segnale.** La causa era
una versione sola: `vite` dichiarato alla 8 mentre `electron-vite@5` — l'ultima **stabile** — regge
fino alla 7, ed era l'unico fra i pacchetti che dipendono da Vite a rifiutarla. Sceso alla 7,
`npm ci` gira nudo. Il grilletto per risalire è una **stabile** di `electron-vite` che dichiari
`vite ^8`, e sta nel [registro YAGNI](../roadmap-fette.md); il perché sta
nell'[ADR 0048](../adr/0048-la-catena-di-build-si-muove-insieme.md), che esiste soprattutto perché
nessuno alzi quel numero senza alzare l'altro.

**2. Il flag aveva già lasciato due sintomi catalogati come requisiti.** `--legacy-peer-deps` non
spegne un controllo: spegne la **risoluzione** dei peer. Da lì `@vue/devtools-api` e
`vue-eslint-parser` erano finiti a mano nelle `devDependencies` con la motivazione «senza cui il
build non compila». Nessuno dei due è importato da una riga del progetto — sono dipendenze di
`pinia`, `vue-i18n` ed `eslint-plugin-vue` — e sono usciti. Vale come metodo: **quando un rimedio
ne richiede altri, il primo non era un rimedio.**

**3. `node node_modules/electron/install.js` è obsoleto**, e lo era da sette sessioni. Electron ha
tolto il proprio `postinstall` alla versione **42** — la 41 ce l'aveva ancora, verificato sul
registry — e `index.js` scarica il binario **al primo `require`**. Provato su una `node_modules`
cancellata: `npm ci` non lo scarica, il primo avvio sì. Chi lo esegue a mano rifà un lavoro che il
gioco farebbe da solo.

**4. Il mondo avanza a blocchi, e il blocco è dell'operazione.** `Game.advance` cammina l'intervallo
a blocchi di un giorno di gioco invece di consegnarlo in un colpo, quindi una soglia attraversata e
rientrata mentre non guardavi adesso scatta. Il ciclo sta **dentro** `advance` e non in `recover()`:
se fosse del chiamante, ogni chiamante nuovo potrebbe dimenticarsene e **R25 resterebbe verde mentre
la sua ragione viene aggirata**. Ha il suo [ADR 0049](../adr/0049-il-mondo-avanza-a-blocchi.md)
perché nessuno lo «semplifichi» spostandolo.

**5. Il tetto di recupero adesso si misura in giorni di gioco, ed è un anno.** Erano otto **ore
reali**, cioè trentanove anni di gioco: dormire rendeva tredici volte più che giocare. Con un anno —
dodici minuti reali — un'ora di gioco attivo ne vale cinque, quindi giocare batte dormire di cinque
volte e la strategia «chiudi la finestra» non esiste più. `SECONDS_PER_GAME_DAY` entra in `balance/`
come **conversione**, e non è il calendario
dell'[ADR 0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md), che resta `Proposta`:
quello ha stato e fa scattare scadenze, questo è un cambio come `TICKS_PER_SECOND`.

**6. Quattro test sono stati invertiti, e vanno guardati con più sospetto di tutto il resto.**
Chiedevano **un** campione dopo un recupero, e avevano ragione: senza blocchi i valori intermedi non
esistevano, e il commento di `sampleOf` lo diceva. Adesso ne chiedono trenta. Ognuno dei quattro
porta scritto perché l'attesa vecchia era giusta allora e sbagliata adesso — **un test cambiato
senza quella riga è indistinguibile da un test indebolito**, e chi rilegge non ha modo di
distinguerli.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **`npm run verify` verde** (88 file di test) e **`npm run verify:release` verde**, girati su `main`
  **fuso** e non solo sul ramo. Quanti siano i test lo dice [qualita.md](../qualita.md).
- **`main` è l'unico ramo.** `d040-il-recupero-avanza-a-blocchi` è stato fuso con `--ff-only` e
  cancellato con `git branch -d`, quello che si rifiuta se resta lavoro non fuso: **non si è
  rifiutato**. Il push è stato chiesto e fatto.
- **Niente residui di debug**, e nessun file temporaneo nel repo. Il test usa-e-getta che ha preso la
  misura del recupero è stato rimosso: la misura vive in [qualita.md](../qualita.md), che è dove
  serviva.
- **Il ciclo dei blocchi è stato rotto di proposito**: un `for` che salta l'ultimo blocco parziale fa
  cadere **sei** test. Il file è stato copiato prima e ripristinato con un `diff` che conferma
  l'identità.
- **La finestra vera è stata guardata** con `scripts/cdp.mjs`, che è la prima delega a usarlo dopo
  D039.

> **Il salvataggio del giocatore è stato toccato, ed è stato rimesso a posto.** Per vedere un
> recupero vero serviva una partita vecchia: il `save.json` in `%APPDATA%/solvent/` è stato copiato,
> retrodatato di un'ora, e **ripristinato identico** a fine prova — verificato, `savedAt`
> `1787442416634`, contanti `59899.2`, caveau livello 4. L'app è stata **terminata** invece che
> chiusa, perché chiuderla avrebbe salvato la partita di prova sopra quella dell'utente. Chi rifà
> questa prova lo sappia prima, non dopo.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto.

1. **Nessuna misura della catena a macchina scarica.** Aperta da otto sessioni.
2. **`withheld` descrive l'ultimo blocco, non il recupero.** È la definizione del campo — un mirror
   del presente, e `income/types.ts` lo dichiara — ma dopo una notte risponde a «i soldi entrano
   adesso?» e non a «quanto ho perso». Se serve la seconda risposta è un campo nuovo con un nome
   nuovo, non questo allargato.
3. **Le tre decisioni di D040 sono contestabili**, e il conto che le ha decise sta in fondo alla
   delega. Il tetto a un anno di gioco in particolare è bilanciamento: se giocandoci è troppo severo,
   il numero si sposta in una riga, e la derivazione accanto dice cosa si sta cambiando.
4. **`components/atm/BankCard3d.vue` ha due lettori**, e il secondo è `components/payment/`. Il
   grilletto per spostarla sta nella decisione 6 di D036, ed è ancora fermo lì.
5. **Le due candele degli strumenti sono due dichiarazioni e non un ciclo su `POOLS[pool].player`.**
   Grilletto: il terzo strumento del giocatore.
6. **`incomeThatFits` ha perso la ragione che lo rendeva indispensabile, e resta.** Con i blocchi la
   transazione gigante non esiste più; il ramo serve ancora al tempo reale, quindi non si tocca.
   Rimuoverlo è un'altra decisione, non un residuo da smaltire.

### Due vicoli ciechi, per non ripercorrerli

1. **`overrides` in `package.json` per tenere Vite 8 non è una soluzione**, ed è la prima cosa che
   viene in mente. Non rimuove la contraddizione: la rende invisibile a npm. È `--legacy-peer-deps`
   con un vestito più rispettabile, con l'aggravante che **sembra** una decisione presa. Anche
   `electron-vite@6.0.0-beta.1` è stato valutato: accetta Vite 8 davvero, ma una beta come strumento
   di build dell'intero progetto è una migrazione che si sa già di dover rifare.
2. **Il velo del recupero non si fotografa.** Dura tre millisecondi, e il loop rimette `playing` al
   frame dopo — è la riga `if (status.value === 'recovering') status.value = 'playing'` in
   `stores/game.ts`. Forzare lo stato da fuori e poi scattare non funziona: al momento dello scatto è
   già tornato. Si legge il DOM **dentro** la stessa `Runtime.evaluate` che forza lo stato, dopo un
   `setTimeout(0)`, e allora la riga si vede.

## La **quinta** sessione del 2026-08-23: D038 e D039, il kit e lo strumento per guardarlo

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. Descrive uno stato già
superato, e si legge come storia.

**Cosa è stato chiuso.**

| Delega                                                  | Cos'era                                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| [D038](D038-cio-che-si-preme-e-cio-che-scorre.md)       | i pulsanti erano sei, le aree che scorrevano sei, e le icone non esistevano |
| [D039](D039-lo-strumento-per-guardare-vive-nel-repo.md) | lo strumento per guardare la finestra vera moriva con la sessione           |

Tutte e due scritte **ed eseguite** nella stessa sessione, come D036 e D037 e per la stessa ragione:
la richiesta è arrivata dall'utente come feature — «CTA unificati come componenti UI universali…
idem per le scrollbar» — ed è risultata essere un difetto misurabile. D039 è venuta dopo, ed è la
decisione che sette passaggi di consegne avevano rimandato: l'utente l'ha presa quando gliel'è stata
posta con il suo prezzo accanto.

### Le sette cose che chi arriva adesso deve sapere

**1. La richiesta era una feature e ha trovato due difetti.** Il primo: **nessuno dei sei pulsanti
del progetto aveva un anello di fuoco**, quindi chi girava con il tabulatore riceveva il contorno
del motore, che dei due temi non sa niente. Il secondo, più insidioso: `AppNav` dichiarava
`flex: 1` e `overflow-y: auto` sulla lista delle destinazioni **senza `min-height: 0`**, quindi
quella lista non si restringeva — spingeva — e a scorrere finiva la colonna intera del telaio,
marchio e interruttore del tema compresi. Vale come metodo: **prima di trattare una richiesta di
unificazione come estetica, si conta quante copie ci sono e si guarda se hanno già divergiuto.**
Due dei sei pulsanti avevano uno stato al puntatore e quattro no.

**2. INV-21 era difeso su una cartella, non sull'applicazione.** Il controllo cercava `disabled` nei
file di `ui/`; qualunque componente poteva scrivere `<button disabled>` e nessun gate lo avrebbe
visto. Adesso R26 tiene i `<button>` a uno e il controllo guarda **tutti** i `.vue`. Non è un
dettaglio di copertura: `UiButton` fa ricadere gli attributi del chiamante sul pulsante vero — serve
a `popovertarget` — quindi senza quell'allargamento la ricaduta avrebbe portato a destinazione anche
un `disabled`.

**3. Il vestito della barra è due dichiarazioni, e le frecce restano quelle di Windows.**
`scrollbar-width` e `scrollbar-color` sono standard ed **ereditate**; i pseudo-elementi
`::-webkit-scrollbar` darebbero il controllo completo, ma il motore li **ignora** appena una
proprietà standard è dichiarata — è un aut aut. Le frecce restano perché è la stessa scelta che D036
ha già fatto per il pallino della scelta nel pagamento: **il congegno è del motore, il colore è del
tema.**

**4. `scrollbar-gutter: stable` è un vicolo cieco, e la misura lo dice.** Scritto, guardato nella
finestra vera, tolto: riserva lo spazio della barra anche quando non c'è, e lascia
**24 px a sinistra contro 34 a destra** nel contenuto e **21 px** invece di 8 nella colonna. Dieci
pixel sono `--space-4`. Tolto quello, le due aree annidate della colonna non costano niente.

**5. Le icone entrano generate, non importate.** `@iconify-json/lucide` è **1.844 icone in 554 kB**
e il gioco ne disegna **due**: importarlo sarebbe il difetto A14 con un'altra estensione. Il
pacchetto sta nelle `devDependencies` e non è mai importato da `src/`; a leggerlo è
`tests/helpers/glyphs.ts`, che produce `src/renderer/ui/glyphs.json` con i soli tracciati nominati.
È la forma di `docs/stato.md`, applicata a un sorgente: si rigenera con
`npx vitest run tests/rules/icons -u`, e chi lo modifica a mano trova il gate rosso.

**6. Un rilevatore di questo repo non vedeva i commenti di un template**, e nessuno lo sapeva.
`withoutComments` e la costante `NOISE` di `english-identifiers` toglievano `/* */` e `//` e non
`<!-- -->`: la prosa italiana dentro un `<template>` veniva letta come codice. `UiPopover.vue` ne ha
uno da D031 e passava **per fortuna**, perché nessuna delle sue parole era in elenco. Corretto in
tutti e due i posti. E una trappola gemella: `eslint-disable-next-line` dentro un template **non
spegne niente** se il tag occupa più righe, perché la violazione viene segnalata dove sta
l'attributo — serve la forma a blocco con `eslint-enable`.

**7. `scripts/` è il quinto confine alla radice, e non è esente da niente.** Ci vive un solo file,
`cdp.mjs`, che apre la finestra vera dalla porta di ispezione. Non entra nel pacchetto — la lista di
`electron-builder.yml` è di **esclusioni**, quindi una cartella nuova ci finirebbe dentro per
difetto — e le quattro regole che dicevano «nel codice» adesso guardano anche lì: P01, C06, C08,
C09. Una cartella esente sarebbe il posto dove le regole si aggirano, cioè la ragione per non
crearla.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **`npm run verify` verde** e **`npm run verify:release` verde**. Quanti siano i test non si scrive
  qui: lo dice [stato.md](../stato.md), e la riga che lo scrivesse sarebbe il difetto di D021.
- **Le tre regole nuove sono state rotte di proposito**, una per una, e ogni file rotto è stato
  **copiato prima** e ripristinato con un `diff` che conferma l'identità: un `<button>` rimesso in
  `AppNav`, un `:disabled` su un `<UiButton>` in `AtmPanel`, un `overflow-y: auto` e uno
  `scrollbar-color` in `AppNav`, un tracciato modificato a mano in `glyphs.json`, un nome mai
  disegnato e uno assente dall'insieme in `icons.ts`.
- **Il ramo partiva da `d037-…` e non da `main`**, perché D037 non era ancora fusa — lo stesso
  incatenamento che D030 → D032 → D031 avevano già avuto. **Si è sciolto nella stessa sessione**: un
  `--ff-only` sul secondo ha portato tutti e due, i gate sono stati girati su `main` fuso, il `push`
  è stato chiesto e fatto, e i due rami sono stati cancellati con `git branch -d`. Resta `main`.
- **Niente residui di debug**: nessun `console.log`, nessun `TODO`.
- **La finestra vera è stata guardata, nei due temi**, e l'anello di fuoco è stato provato con il
  tabulatore vero: un `element.focus()` **non** fa scattare `:focus-visible`, quindi quella prova
  vale solo passando da `Input.dispatchKeyEvent`.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto.

1. **Nessuna misura della catena a macchina scarica.** Aperta da sette sessioni.
2. ~~Gli script CDP non sopravvivono a questa sessione~~ — **chiusa**, ed era aperta da sette
   sessioni. La decisione è stata posta all'utente con il suo prezzo accanto — una riscrittura a
   sessione, sette volte — ed è stata presa: `scripts/cdp.mjs` esiste, e con lui
   l'[ADR 0047](../adr/0047-uno-strumento-che-non-e-il-prodotto-vive-in-scripts.md) che dice cosa può
   viverci dentro. Le quattro cose imparate a caro prezzo stanno scritte in testa a quel file, dove
   chi lo apre le legge comunque.
3. ~~`npm install` continua a non funzionare~~ — **chiusa alla causa**, ed era la correzione 8 di
   D023 alla seconda ricorrenza. `vite` è sceso alla 7, che è la versione più alta che
   `electron-vite@5` — l'ultima stabile — dichiara di reggere: `npm ci` gira senza flag, provato su
   una `node_modules` cancellata. Sono usciti anche `@vue/devtools-api` e `vue-eslint-parser`, che
   nessun file del progetto importa ed erano lì solo perché il flag impediva a npm di risolverli.
   Il perché e il grilletto per risalire alla 8 stanno
   nell'[ADR 0048](../adr/0048-la-catena-di-build-si-muove-insieme.md).
4. **`components/atm/BankCard3d.vue` ha due lettori**, e il secondo è `components/payment/`. Il
   grilletto per spostarla sta nella decisione 6 di D036, ed è ancora fermo lì.
5. **Le due candele degli strumenti sono due dichiarazioni e non un ciclo su `POOLS[pool].player`.**
   Grilletto: il terzo strumento del giocatore.

## La **quarta** sessione del 2026-08-23: D037, il tempo che avanza ha un proprietario

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. Descrive uno stato già
superato, e si legge come storia — come tutte le sezioni sotto.

**Cosa è stato chiuso.**

| Delega                                                        | Cos'era                                                        |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| [D037](D037-il-tempo-che-avanza-e-un-operazione-del-gioco.md) | il tempo di gioco avanzava da due punti, e solo uno registrava |

Scritta **e** eseguita nella stessa sessione, come D036 e per la stessa ragione: la richiesta è
arrivata dall'utente come feature — «i grafici usano un metodo di aggiornamento a sé stante, che
ignora i tick del kernel» — ed è risultata essere un difetto misurabile.

### Le cinque cose che chi arriva adesso deve sapere

**1. Il difetto era vero, e più preciso di come era descritto.** La cadenza delle serie era già in
tick: nessun cronometro parallelo. Ma `registry.tickAll` aveva **due** chiamanti nello store — il
passo del loop e `recover()` — e solo il primo campionava. Chi chiudeva il gioco e lo riapriva dopo
una notte incassava fino a otto ore di stipendio arretrato e ritrovava i grafici vuoti. Nascondere
la finestra invece funzionava, perché quella strada passa dal loop: **due situazioni che il progetto
descrive come «la stessa cosa» avevano copertura diversa**, ed è il posto dove cercare quando un
difetto sembra impossibile.

**2. Il commento diceva il contrario del codice, e nessun gate poteva vederlo.** `sampleOf` in
`loop.ts` prometteva «il tetto del recupero produce un campione solo… tornare dopo otto ore arriva
qui come un `elapsed` enorme», e a quel codice il recupero non arrivava mai. Vale come metodo: **un
commento che descrive un percorso è una cosa da verificare, non da credere** — soprattutto quando
descrive un chiamante che non è quello sotto gli occhi.

**3. La radice non era il campionamento.** `Game` aveva `save`, `load` e `reset` — le tre operazioni
che riguardano tutta la partita — e non aveva la quarta, quella che succede dieci volte al secondo.
Senza un proprietario, «il tempo è passato» è stato scritto due volte e in modo diverso. Adesso c'è
`Game.advance`, e **R25** (`tests/rules/one-way-to-advance`) tiene i chiamanti a uno.

**4. La correzione si è vista nella finestra vera, con dei numeri.** Riaperto il gioco su un
salvataggio vecchio di **dieci ore e mezza**, il grafico dei contanti porta una candela che apre a
**59.899,20 €** — il saldo salvato — e chiude a **250.000,00 €**, il tetto del caveau: è la notte
intera, disegnata. Prima di D037 quel grafico sarebbe partito piatto a 250.000,00 €, perché
`mirror()` riapriva l'escursione **dopo** il recupero e ne cancellava il salto. Le altre due serie
sono piatte, e lo dicono onestamente: il caveau è pieno, quindi il reddito non entra più.

**5. Il pezzo nuovo non sa cosa sia un grafico.** `runtime/chronicle.ts` è una lista di
**registrazioni** — cosa osservare, ogni quanti tick, quante tenerne — con due forme, fotografia ed
escursione, che si distinguono per chiusura e non per un `if`. Registrare «le commissioni nel tempo»
o «il livello del caveau» è una riga nel bootstrap, non una modifica alla cronaca. Se domani i
grafici sparissero, `advance` e la cronaca resterebbero sensati.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **`npm run verify` verde**, e i test sono 1.111 su 85 file. **`npm run build` verde.** Ogni test
  nuovo è stato visto rosso di proposito: per i quattro della riapertura il rosso è stato costruito
  **rimettendo il difetto** — `registry.tickAll` dentro `recover()` — e per i quattordici della
  cronaca rompendo a turno l'iterazione della lista, l'iscrizione al Bus, `reopen` e la cadenza.
  Ogni file rotto è stato **copiato prima** e ripristinato con un `diff` che conferma l'identità: è
  la trappola che D036 aveva pagato con mezz'ora di lavoro.
- **Il ramo è `d037-il-tempo-che-avanza-e-un-operazione-del-gioco`, e parte da `main`.** Il codice e
  i documenti vivi viaggiano **insieme**, in `6f245e0`, e la forma non è una scelta di comodo: la
  regola 1 di [docs/README.md](../README.md) vuole che un confine che si sposta cambi il documento
  che lo descrive **nello stesso commit**, e qui i documenti vivi che si spostano sono sei. Spezzare
  per tipo — `feat` e poi `docs` — avrebbe lasciato un commit in cui `architettura.md` descrive un
  confine che il codice ha già cambiato. Quanti commit ci siano sopra **non si scrive qui**: lo dice
  `git log main..HEAD`, e la riga che lo scrivesse sarebbe uno di loro — questa riga infatti diceva
  «tutto sta in un commit solo» ed è nata dentro il secondo, che è il difetto di D021 alla terza
  ricorrenza.
- **Il ramo non è fuso in `main` e non è spinto.** Non è stato chiesto, e un `push` è visibile agli
  altri: resta una di quelle cose che si chiedono. Dove sia adesso lo dicono `git branch` e
  `git rev-list --count origin/main..main`.
- **Niente residui di debug**: nessun `console.log`, nessun `TODO`.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto.

1. **Nessuna misura della catena a macchina scarica.** Aperta da sei sessioni.
2. **Gli script CDP non sopravvivono a questa sessione**, ed è la sesta riscrittura. Vivono nello
   scratchpad, che è **della sessione**. Stavolta è costato poco, perché il punto 5 della sessione
   precedente aveva annotato la riga che apre la porta di ispezione; resta però una cosa in più da
   sapere, che il progetto adesso conosce: **`ws` non è installato e non serve**, perché Node 24 ha
   `WebSocket` fra i globali. Metterli in `scripts/` resta una decisione che nessuno ha preso, e
   adesso si sa quanto costa non prenderla: una riscrittura a sessione, sei volte finora.
3. **`components/atm/BankCard3d.vue` ha due lettori**, e il secondo è `components/payment/`. Il
   grilletto per spostarla sta nella decisione 6 di D036, ed è ancora fermo lì.
4. **Le due candele degli strumenti sono due dichiarazioni e non un ciclo su `POOLS[pool].player`.**
   Il ciclo sarebbe la regola vera, e pretende una chiave i18n costruita a runtime contro un'unione
   tipizzata (R12). Grilletto: il terzo strumento del giocatore.

### Un vicolo cieco, per non ripercorrerlo

**`nextCandle(open)` e `openCandle(observe())` sono indistinguibili da un test.** Alla chiusura di un
intervallo il valore osservato **è** la chiusura, quindi le due scritture danno lo stesso risultato in
ogni caso raggiungibile dal gioco. Provato scambiandole: nessun test è diventato rosso. Non è un buco
nella copertura — è che la differenza non esiste. Resta `nextCandle`, che è la semantica dichiarata
in `candles.ts` e non chiede una seconda osservazione.

## La **terza** sessione del 2026-08-23: i rami fusi, e D036 scritta ed eseguita

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. Descrive uno stato
già superato, e si legge come storia — come tutte le sezioni sotto.

**Cosa è stato chiuso.**

| Delega                                        | Cos'era                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| [D036](D036-il-pagamento-e-un-flusso-solo.md) | «con cosa pago» si chiedeva in due posti, e la carta aveva dei dati finti |

Più i **tre rami** che aspettavano, fusi. D036 è stata scritta **e** eseguita nella stessa sessione,
il che è insolito per questo progetto: la richiesta è arrivata dall'utente come feature, ed è
risultata essere un debito già dichiarato — vedi il punto 1.

### Le sei cose che chi arriva adesso deve sapere

**1. La richiesta dell'utente coincideva con una conseguenza scritta e mai costruita.**
L'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) elencava fra le
proprie conseguenze «la UI acquisisce un componente che non aveva: la scelta dello strumento, con il
prezzo di ognuno», e per due deleghe al suo posto ogni pannello ha disegnato un pulsante per
strumento. Vale come metodo: **prima di trattare una richiesta come feature nuova, si cerca se un
ADR l'ha già promessa** — il controllo costa una lettura, e il guadagno è che la cosa nasce dove era
già stata decisa invece che accanto.

**2. I rami da fondere erano due, non tre.** `guscio-condiviso-dei-grafici` conteneva già per intero
`d034-le-serie-degli-strumenti` — `git merge-base --is-ancestor` lo dice in un comando — quindi il
primo è stato un `--ff-only` e il secondo un commit di soli documenti. Delle due sessioni parallele
che il passaggio di consegne dichiarava, quella che rifaceva la scheda del bancomat **non ha
lasciato un ramo**: non c'era niente da recuperare.

**3. Il numero di carta che il gioco stampava non era un numero di carta.** `4913 2201 0067 5540`
non passa il controllo di Luhn: la somma fa **53**. Adesso la carta è una funzione del seme e la
cifra di controllo è calcolata — quella della partita usata per guardare è `4693 2605 9004 2390`,
somma 70. È la prima cosa del gioco che distingua una partita da un'altra a schermo, ed era il
grilletto scritto dentro `BankCard3d.vue` da D033.

**4. Due difetti sono stati trovati guardando, e nessun test poteva vederli.** Il primo: nella
finestra del pagamento la carta arriva senza i tre fatti del bancomat — sono suoi — e il titolo
«Cosa fa questo strumento» restava stampato sopra un elenco **vuoto**. Il secondo: il pallino della
scelta prendeva il blu di sistema, ed era l'unico blu dell'applicazione. Nessuno dei due è una
regola che si possa scrivere; tutti e due si vedono in due secondi aprendo la finestra.

**5. La porta di ispezione si apre, e finora nessuno aveva scritto come.** Quattro sessioni hanno
riscritto gli script CDP senza mai annotare la riga che li rende possibili:

```bash
npx electron-vite dev -- --remote-debugging-port=9222
```

Gli argomenti dopo `--` arrivano a Electron. Poi `http://localhost:9222/json/list` elenca i
bersagli, e si filtra su `localhost` e non sul numero di porta — 5173 può essere occupata e Vite
passa alla 5174 in silenzio.

**6. Il peso del renderer è cresciuto di quattro chilobyte e mezzo**, e i numeri con la data stanno
in [qualita.md](../qualita.md). Non c'è niente da cercare altrove: è tutto codice nostro, e
`apexcharts` non è stata toccata.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **`npm run verify` e `npm run verify:release` verdi**, e i test sono 1.028 su 83 file. Ogni test
  nuovo è stato visto rosso di proposito, e per R24 e R22 il rosso è stato costruito **rimettendo il
  difetto**: l'import di `PaymentOption` e il ciclo sul listino in `VaultPanel`, un `<dialog>` in
  `AtmPanel`. La guardia dello store è stata disattivata apposta, e tre test sono diventati rossi.
- **`main` ha D036 ed è spinto.** La delega è stata fusa con un `--ff-only`, `verify` e
  `verify:release` sono stati girati **su `main` fuso** — 83 file, 1.028 test — e poi tutto ciò
  che mancava è stato spinto in un colpo. Quanti commit fossero non si scrive: il commit che lo
  scriverebbe è uno di loro, ed è il difetto che D021 esiste per fermare. I quattro rami di lavoro sono stati cancellati
  con `git branch -d`, che si rifiuta se resta lavoro non fuso: nessuno si è rifiutato, ed è la
  prova che non c'è lavoro unico da nessuna parte. Resta `main`.
- **Niente fuori dai commit**, nessun residuo di debug: nessun `console.log`, nessun `TODO`.
- **La finestra vera è stata guardata**, e cosa ha risposto sta in fondo alla _Definizione di fatto_
  di [D036](D036-il-pagamento-e-un-flusso-solo.md) invece che qui.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto.

1. ~~La tabella delle regole in [architettura.md](../architettura.md) si ferma a R19~~ — **chiusa**.
   Era aperta da cinque sessioni, e questa delega la peggiorava aggiungendo R24: adesso arriva a
   R24, cinque righe.
2. **Nessuna misura della catena a macchina scarica.** Aperta da cinque sessioni.
3. **Gli script CDP non sopravvivono a questa sessione**, ed è la quinta riscrittura. Vivono nello
   scratchpad, che è **della sessione**: chi arriva dopo non li trova, e li riscrive da zero come hanno
   fatto le quattro sessioni prima. Stavolta però il punto 5 qui sopra annota la riga che apre la
   porta di ispezione, che era la parte davvero costosa da riscoprire — il resto sono venti righe di
   `WebSocket` e `Runtime.evaluate`. Metterli in `scripts/` resta una decisione che nessuno ha preso,
   e adesso si sa quanto costa non prenderla: una riscrittura a sessione, cinque volte finora.
4. **[ADR 0019](../adr/0019-transazioni-atomiche-nel-ledger.md) e
   [ADR 0020](../adr/0020-partita-doppia.md) illustrano ancora un prelievo che costa 2,50 €**,
   mentre dopo D032 ne costa 10,00. Non corretto di proposito: gli ADR sono record datati.
5. **`components/atm/BankCard3d.vue` ha due lettori**, e il secondo è `components/payment/`. Il
   grilletto per spostarla è il **terzo**, e sta nella decisione 6 di D036.

### Due vicoli ciechi, per non ripercorrerli

1. **`git checkout -- <file>` su un lavoro non committato lo cancella, e non c'è ripiego.** È
   successo qui, per rimettere a posto una guardia disattivata di proposito: il file non era
   committato, e mezz'ora di modifiche allo store è tornata a `HEAD`. Il modo giusto è **copiare il
   file prima**, oppure committare prima di rompere qualcosa apposta. Il costo è stato riscrivere le
   stesse nove modifiche, e la lezione non è «fare attenzione»: è che rompere una cosa di proposito
   — che questo progetto chiede a ogni test — va fatto su un albero **pulito**, così il ripristino è
   gratis.

2. **Modificare un `.vue` mentre una finestra modale è aperta manda in errore il ricaricamento a
   caldo di Vite.** Vue prova a smontare un albero che non c'è più e lancia
   `Cannot read properties of null`, e la pagina resta rotta finché non si riavvia. Non è un difetto
   del componente — verificato riavviando e rifacendo lo stesso giro, che è passato intero. Per
   guardare dopo una modifica conviene chiudere la finestra dal suo pulsante, o riavviare.

**E una trappola dello strumento, la stessa di sempre con una faccia nuova:** i caratteri di escape
scritti dentro un documento intermedio arrivano **dimezzati**, e una sequenza come quella del
confine di parola diventa un carattere di controllo invisibile dentro un `/regex/`. Il rilevatore
sembrava scritto bene e non trovava niente. Si vede solo con `od -c`, e si evita costruendo la
stringa dal codice del carattere oppure scrivendo il file con uno strumento che non interpreta.

## La sessione del 2026-08-23: D034 eseguita, e due rami che aspettano

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. Tutte le sezioni
sotto descrivono stati già superati, e si leggono come storia.

> **I tre rami sono stati fusi**, in una sessione successiva dello stesso giorno, e il blocco qui
> sotto è quindi storia: si legge per il metodo, non per lo stato. Ciò che ha reso la fusione più
> corta di come è descritta è che `guscio-condiviso-dei-grafici` conteneva già per intero
> `d034-le-serie-degli-strumenti` — quindi i rami da fondere erano **due**, non tre, e il primo era
> un `--ff-only`. Delle due sessioni parallele, quella che rifaceva la correzione della scheda del
> bancomat non ha lasciato un ramo: `git branch` ne mostrava quattro, e nessuno è andato perso.

> **La prima cosa, perché se si perde fa danno.** Questa sessione **non ha fuso niente**, e non per
> dimenticanza: fondere è una di quelle cose che si chiedono. `main` è ancora al 2026-08-22 e non ha
> D034. I due rami sono `d034-le-serie-degli-strumenti` (3 commit) e `correzione-scheda-bancomat`
> (1 commit), e si fondono **puliti** — verificato senza toccare niente:
>
> ```bash
> git merge-tree --write-tree d034-le-serie-degli-strumenti correzione-scheda-bancomat
> ```
>
> **E due sessioni parallele sono state avviate lo stesso giorno sugli stessi file.** Da qui non si
> vedono: `git worktree list` ne mostra uno solo. Cosa abbiano prodotto va guardato **prima** di
> fondere, o si sovrascrivono a vicenda. Una delle due rifà una cosa che il ramo
> `correzione-scheda-bancomat` ha già fatto.

**Cosa è stato chiuso.**

| Delega                                   | Cos'era                                                           |
| ---------------------------------------- | ----------------------------------------------------------------- |
| [D034](D034-le-serie-degli-strumenti.md) | una serie di candele per strumento, e il cruscotto che la disegna |

Tre commit su un ramo (`12f7e45`, `23306a1`, `4bbe738`), **nove** correzioni rispetto a com'era
scritta, e la _Trappole note_ che le mancava. Più un quarto commit su un ramo suo (`c70bea0`), che
non è di nessuna delega: due punti invecchiati nella scheda del bancomat.

### Le sei cose che chi arriva adesso deve sapere

**1. Le due decisioni aperte di D034 sono state prese sulla direttiva generale**, la stessa di D035:
due grafici a **candele** invece di candele più linea, e il patrimonio netto da barre ad **area**.
Stanno in fondo, nella tabella _Decisioni contestabili_. Il metro della prima non è il gusto: nello
stesso cruscotto `StatTile` è già lo stesso pezzo montato cinque volte.

**2. Una libreria porta la propria lingua, e nessun gate se ne accorge.** ApexCharts ha
`["Open","High","","Low","Close"]` scritto nel proprio sorgente per la bolla delle candele, e
scriverebbe i numeri senza formattarli: R12 e l'ADR 0006 rotti da una dipendenza invece che da noi.
Non è configurabile — o si scrive `tooltip.custom`, o si accetta. Vale la pena **guardare nel
`dist`** prima di scegliere una forma di grafico, non dopo.

**3. Un gradiente cuoce un colore dentro l'SVG.** Per il primo stop ApexCharts risolve il colore e
lo scrive come letterale — `stop-color="rgba(21,20,15,0.28)"`, visto nella finestra vera. Un valore
cotto non cambia con il tema, e la sola ragione per cui questa libreria è entrata è che non serva
ridisegnare niente ([ADR 0034](../adr/0034-il-grafico-e-una-libreria.md)). Il riempimento **pieno**
invece resta un token, avvolto in `color-mix`. Trovata **nel documento, non nell'immagine**:
un'immagine non dice da dove viene un colore.

**4. Il colore di una candela lo decide `apertura < chiusura`, non `≤`**, ed è nel sorgente della
libreria. Quindi una candela **piatta** cade sul secondo colore. Con verde e inchiostro le candele
ferme della carta sono neutre — con verde e rosso sarebbero una fila di allarmi rossi per «non è
successo niente». Misurato sulla partita usata per guardare: 23 candele su 30 della carta sono
piatte, e 17 su 30 dei contanti sono salite di meno di un pixel e mezzo.

**5. Il peso del renderer è stato rimisurato minificato**, e i numeri con la data stanno in
[qualita.md](../qualita.md). Quello che conta e non si ripete lì: i quattro chilobyte in più sono
**tutti codice nostro** — `apexcharts` è identica al chilobyte — e spendono metà della
giustificazione dell'ADR 0034. Il grilletto scritto lì, «il giorno in cui i candlestick del blocco C
non arrivano», **non scatterà più**: sono arrivati.

**6. Il binario di Electron non era scaricato**, e `npx electron-vite dev` moriva con
`Error: Electron uninstall`. Non è electron-vite: `node_modules/electron/dist` e `path.txt` erano
vuoti. Si ripara con `node node_modules/electron/install.js`, ci mette qualche minuto, e torna a
mancare dopo un `npm ci`. Senza finestra vera non si spunta nessuna verifica a occhio, e questo
progetto ne chiede in quasi ogni delega.

### Il guscio condiviso dei due grafici: valutato **ed eseguito**

**L'analisi che stava qui diceva «valutato, non eseguito», e adesso è eseguito**: il ramo
`guscio-condiviso-dei-grafici` porta `ChartPanel.vue`, `apex.ts` e la regola **R23**. Resta scritta
qui la parte che serve a chi arriva, cioè cosa è stato deciso e **cosa quell'analisi aveva
sbagliato**.

La domanda era se il grilletto di [D023](D023-il-design-system.md) — «un pezzo entra nel kit quando
lo disegnano **due** componenti» — fosse scattato adesso che i componenti-grafico sono due. Sì, ed è
scattato **due volte**, per due regole scritte indipendenti:

1. Quella di D023, per analogia: R14 chiude `ui/` — serve l'i18n — quindi il pezzo entra dove
   `StatTile` è già entrato per la stessa ragione, `components/shell/`.
2. Quella dell'[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md), **alla lettera**, e la vecchia
   analisi non l'aveva vista: fra le sue conseguenze c'è scritto «se un secondo grafico nascesse,
   quelle venti righe [del ciclo di vita] sono ciò che si estrae». Il secondo grafico è nato con
   [D034](D034-le-serie-degli-strumenti.md). Quella riga concludeva invece che il ciclo di vita
   dovesse **restare** nei due grafici, che è il contrario di ciò che l'ADR aveva promesso.

**Cosa è uscito, e cosa no.**

- **`ChartPanel.vue`** — riquadro, titolo, spiegazione, i due capi dell'asse, e il **vestito**
  `:deep()`. Il punto di innesto del grafico entra per **slot**: la disposizione è scritta nel file,
  quindi è una forma e non un contenitore ([ADR 0030](../adr/0030-il-telaio-e-una-forma-non-un-contenitore.md)).
- **`apex.ts`** — le venti righe di ciclo di vita, come una **funzione** e non come un componente
  che riceve `ApexOptions`: quell'oggetto contiene `height`, quindi un componente che lo ricevesse
  sarebbe un contenitore secondo il criterio dell'ADR 0030, e sarebbe `vue3-apexcharts` riscritto in
  casa — che l'ADR 0034 elenca fra le alternative **provate e disfatte**.
- **Le opzioni restano nei due grafici**, ed è la sola delle tre forme proposte che è stata
  scartata. La ragione non è la lunghezza: ogni opzione di quei blocchi porta accanto il commento
  che dice **perché** è quella — curva dritta, riempimento pieno invece che sfumato, pallino senza
  contorno, il colore che cade sull'inchiostro quando la candela è piatta. Un `baseOptions()` da
  spandere separerebbe la decisione dalla sua ragione, che è il contrario di come questo repo
  scrive. E il vestito è diverso da loro in un modo che conta: **sono selettori di qualcun altro**,
  che un aggiornamento della libreria può spostare, mentre le opzioni sono nostre e le scriviamo
  contro un'API documentata.

**La misura, presa e non stimata:** `src/renderer/` passa da 3.718 a **3.698** righe di codice, e il
CSS dentro i `.vue` da 979 a **957** — venti righe nette in meno con due file in più. La vecchia
analisi diceva «~27 righe nette», e la differenza non conta: la ragione non erano le righe.

**Le due cose che quell'analisi dava per aperte sono chiuse, e una delle due si è rivelata
sbagliata.**

- **Il passo non verificato è stato verificato.** Che il `:deep()` di `ChartPanel` raggiunga
  contenuto arrivato per **slot** funziona, e non per deduzione: nella finestra vera l'etichetta
  dell'asse rende `fill: rgb(156, 149, 132)` — cioè `--color-ink-3` — con JetBrains Mono a 9,5px, e
  la bolla rende fondo `--color-raised`, bordo `--color-line` e raggio `--radius-sm`. Il ripiego
  `ui/apexcharts.css` non è servito.
- **Il gate esatto esiste**, e quella riga diceva di no. Diceva il vero **dato com'era scritta la
  bolla a candele**: nominava le classi della libreria, quindi «nessun `.apexcharts-` fuori da
  `ChartPanel`» sarebbe stato falso. La bolla però la scriviamo **noi**, e adesso porta una classe
  **nostra** — `.candle-bubble` — quindi non resta un solo selettore altrui fuori dal riquadro. R23
  è ✅ e non ⚠️: `tests/rules/chart-dress`, visto rosso di proposito rimettendo un
  `:deep(.apexcharts-tooltip)` in `InstrumentChart`.

**E una cosa che nessuno aveva notato**, perché nessun gate poteva: le due copie del vestito
**avevano già cominciato a divergere** nella stessa delega che le ha create — la bolla del secondo
grafico era diventata una griglia e la prima no. Non era un rischio futuro: era già successo.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **`npm run verify` verde su tutti e due i rami**, e i due numeri sono diversi apposta:
  **79 file / 878 test** su `d034-…`, **78 / 857** su `correzione-…`, che parte da `main` e quindi
  non ha i test nuovi di D034.
- **Non verificato: `verify` su `main` fuso**, perché la fusione non è stata fatta. È la procedura
  che questa pagina prescrive prima di spingere, e resta da fare.
- **Non verificato: `npm run verify:release`.** `npm run build` è stato girato — serviva a misurare
  il peso — ed è verde; la catena intera no.
- **Niente fuori dai commit**: `git status --porcelain --untracked-files=all` vuoto,
  `git stash list` vuoto, `out/` ignorato da `.gitignore`.
- **Nessun residuo di debug** nel diff: nessun `console.log`, nessun `TODO`, nessun `.only(`. La
  configurazione temporanea che isola ApexCharts in un chunk suo — `electron.vite.measure.config.ts`
  — è stata cancellata dopo la misura, come aveva fatto D035.
- **Ogni test nuovo è stato visto rosso di proposito**, e due volte è servito davvero: vedi i vicoli
  ciechi qui sotto.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto. I primi due erano già aperti prima, e restano.

1. **La tabella delle regole in [architettura.md](../architettura.md) si ferma a R19**, indietro di
   tre righe da quattro sessioni. L'elenco autorevole è [tracciabilita.md](../tracciabilita.md).
2. **Nessuna misura della catena a macchina scarica.** Aperta da quattro sessioni.
3. **Gli script CDP vivono ancora nello scratchpad, e questa sessione li ha riscritti da zero per la
   quarta volta** — stavolta usandoli davvero, e pagando due trappole nuove (vedi i vicoli ciechi).
   Metterli in `scripts/` resta una decisione che nessuno ha preso, e adesso costa una sessione ogni
   volta invece che zero.
4. **[ADR 0019](../adr/0019-transazioni-atomiche-nel-ledger.md) e
   [ADR 0020](../adr/0020-partita-doppia.md) illustrano l'atomicità e la partita doppia con un
   prelievo di 500,00 € che costa 2,50 € di commissione.** Dopo D032 quel prelievo costa **10,00 €**.
   Le somme continuano a fare zero e il punto che quei documenti illustrano sopravvive intatto: è
   solo il coefficiente a essere di prima. **Non corretto di proposito:** questo progetto tratta gli ADR come record
   datati, e l'ADR 0018 è stato marcato `Superata` invece che riscritto. È una decisione, non un
   dimenticato.
5. ~~Il guscio condiviso dei due grafici~~ — **chiuso** dal ramo
   `guscio-condiviso-dei-grafici`, che è il **terzo** non fuso. La sezione qui sopra dice cosa è
   stato deciso e cosa la vecchia analisi aveva sbagliato.

### Tre vicoli ciechi, per non ripercorrerli

1. **Un test su una candela piatta non prova niente.** Quando i quattro numeri coincidono,
   coincidono per qualunque implementazione — anche per una che non chiude niente: quel test è
   passato al primo colpo contro un `nextCandle` che ritornava l'identità. Il posto dove discrimina
   è lo **store**, dove la serie esiste e si può contare. È la seconda volta che questo progetto
   scopre una regola che non regge vedendola verde quando doveva essere rossa.
2. **`Page.reload` via CDP termina il processo Electron**, non ricarica la finestra: la sessione
   muore e il socket con lei. Per guardare uno stato iniziale bisogna riavviare l'applicazione, e la
   corsa contro i cinque secondi della prima candela **non si vince** — l'avvio è più lento. Il ramo
   «serie vuota» si è provato rendendo un grafico vuoto **dentro** la pagina con le stesse opzioni
   del componente, importando la libreria via `/@fs/…` perché Vite non serve `node_modules` per
   percorso.
3. **Scrivere un file con Python in modalità testo su Windows converte i fine riga in CRLF**, e il
   rilevatore del blocco `mermaid` di `tests/rules/import-graph` cerca ` `mermaid\n ``` : con
   CRLF non trova più niente e il test dice che **zero** archi sono disegnati. Sembra un difetto del
   diagramma e non lo è. Si scrive con `newline=''`, oppure in binario.

## La seconda sessione del 2026-08-22: D035 eseguita, e la delega contraddetta due volte

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. **Non è più la più
recente:** sopra c'è la sessione del 2026-08-23. Tutte le sezioni sotto descrivono stati già
superati, e si leggono come storia.

**Cosa è stato chiuso.**

| Delega                                                      | Cos'era                                                                     |
| ----------------------------------------------------------- | --------------------------------------------------------------------------- |
| [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md) | i sette difetti correggibili dell'audit del 2026-08-22, più quello sul loop |

Tutti e otto i punti, in sette commit su un ramo, fuso su `main` con un `--ff-only` e spinto. Ha
prodotto l'[ADR 0041](../adr/0041-la-rappresentazione-del-denaro-e-dichiarata.md), l'invariante
**INV-24** e **undici** correzioni rispetto a com'era scritta. Prima della delega, una correzione a
questa pagina: due righe dichiaravano non committato un lavoro che il commit stesso che le conteneva
aveva committato (`fb35bef`).

### Le sei cose che chi arriva adesso deve sapere

**1. Il renderer si compila minificato, e il pacchetto dimezza.** `electron.vite.config.ts` dichiara
`minify: 'oxc'`. I pesi, con la data accanto, stanno in [qualita.md](../qualita.md) e non si
ripetono qui — ma il rapporto sì, perché è ciò che conta: **ApexCharts pesa più del triplo di tutto
il resto dell'applicazione messo insieme**, Vue e Pinia e il gioco intero compresi. Il grilletto
dell'[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md) poggia su quel numero, e adesso è quello
vero. **D034 va eseguita dopo questa** proprio per questo: rimisura il peso del renderer, e adesso
misura una volta sola un numero che vuol dire qualcosa.

**2. Una delega può essere sbagliata nel punto in cui sembra più ragionata, e questa lo era.** Il
punto 8 prescriveva un `try`/`finally` intorno a `onStep`, e scartava «riprogrammare prima»
motivando che avrebbe aperto il caso di un `onStep` che chiama `stop()`. **Misurato, quel caso è il
buco del `finally`**, non dell'altra strada — e nel codice come stava esisteva già. La correzione è
una riga spostata invece di tre aggiunte, e c'è un test che vede rosso lo `stop()` chiamato da
dentro `onStep` in tutte e due le forme scartate. La lezione di metodo è più grande del difetto: una
motivazione scritta in una delega ha lo stesso statuto di un numero scritto in un documento vivo —
si rimisura, non si ricopia. Costa un test scoprirlo.

**3. `minify: 'esbuild'` non compila su questa Vite**, e vale la pena saperlo perché è il valore che
verrebbe in mente per primo. Vite 8 non porta più esbuild con sé: `transformWithEsbuild` è deprecata
e pretende il pacchetto installato a parte, quindi `build` fallisce con «Cannot find package
'esbuild'». Il minificatore di questa Vite è `oxc`.

**4. Le occorrenze di `home` nei documenti vivi erano dieci, non le sette che l'audit aveva
contato**, ed è la trappola 4 della delega applicata all'audit che l'aveva scritta. Le tre in più —
nel racconto di [docs/README.md](../README.md) e in due righe del
[registro delle fette](../roadmap-fette.md) — non contengono nessuna delle parole che quella
trappola suggeriva di cercare. Si trovano solo rileggendo le righe **intorno** a quelle già note, ed
è l'unica tecnica che ha funzionato.

**5. Spostare una dipendenza tocca anche `package-lock.json`, e la delega non lo diceva.** Senza,
`npm ci --legacy-peer-deps` — l'unico comando che installa in questa repo — fallirebbe per
disallineamento fra i due file. Si rigenera con
`npm install --package-lock-only --legacy-peer-deps`, che non cambia nessuna versione.

**6. Due decisioni sono state prese in autonomia su direttiva generale**, e stanno in fondo alle
_Decisioni contestabili_. Il grilletto del router **non** è scattato — la gerarchia è nella colonna,
non nella navigazione, e nessuna delle destinazioni è raggiungibile da fuori, ha uno stato nell'URL
o ne contiene un'altra — quindi `vue-router` resta nel registro con un grilletto detto meglio e
**senza conteggio**. L'altra è quella del punto 2 qui sopra, ed è l'unica decisione contestabile del
progetto che contraddica la delega che la conteneva.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **`npm run verify` e `npm run verify:release` verdi su `main` fuso**, non solo sul ramo, ed è la
  procedura che questa pagina prescrive prima di spingere. I test nuovi di D035 sono dieci, e tutti
  sono stati visti rossi di proposito prima di essere resi verdi.
- **`main` è spinto e allineato**, e il ramo `d035-…` è stato cancellato con `git branch -d`, che si
  rifiuta di cancellare un ramo con lavoro non fuso. Ne resta uno.
- **Niente fuori dai commit**: `git status` pulito, `git stash list` vuoto, `git clean -nd` senza
  candidati. `npm audit` a zero.
- **Nessun residuo di debug** in `src/`: nessun `console.log`, nessun `TODO`. Le sonde di misura —
  la configurazione temporanea che isola ApexCharts in un chunk suo — sono state disfatte, e la
  configurazione vera è tornata quella di prima più la riga della minificazione.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto. I primi tre erano già aperti prima, e restano.

1. **La tabella delle regole in [architettura.md](../architettura.md) si ferma a R19**, e adesso è
   indietro di tre righe da tre sessioni. R20, R21 e R22 stanno in
   [tracciabilita.md](../tracciabilita.md), che è l'elenco autorevole. Costa tre righe.
2. **Nessuna misura della catena a macchina scarica.** Aperta da tre sessioni. Va rimisurata con
   metodo e scritta una volta, non dedotta.
3. **Gli script CDP vivono ancora nello scratchpad**, e questa sessione non li ha usati — il lavoro
   non aveva niente da guardare a occhio. Metterli in `scripts/` resta una decisione che nessuno ha
   preso.
4. **Il peso dei cinque caratteri diceva 116 kB e sono 103,63.** Corretto in
   [qualita.md](../qualita.md) rimisurandolo, ma è il segnale che quella pagina ha altri numeri
   della stessa età che nessuno ha guardato: le misure di D017 e D018 non sono state ricontrollate,
   e non erano nello scopo.
5. **Il difetto del punto 8 non ha un gate.** È stato chiuso con due test sul comportamento, e va
   bene così; ma «un frame si riprogramma prima dell'effetto» è una proprietà che nessuna regola
   sorveglia, e il loop è l'unico posto del progetto in cui vive. Se ne nascesse un secondo, la
   classe tornerebbe scoperta.

### Un vicolo cieco, per non ripercorrerlo

**Per misurare ApexCharts da sola serve un `manualChunks`, e scriverlo nel blocco `renderer` rompe
il build.** `mergeConfig` **sostituisce** `rollupOptions` invece di sommarlo, quindi con quel blocco
sparisce anche l'`input` che il preset di electron-vite mette da sé, e il comando muore con
«build.rollupOptions.input option is required». Va rimesso a mano —
`input: resolve(renderer, 'index.html')` — e il commento del blocco `preload`, in quello stesso
file, documentava già la stessa trappola per `external` da prima. Leggerlo sarebbe costato meno che
scoprirla.

## La **prima** sessione del 2026-08-22: D033 chiusa, un audit, D035 scritta

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. Il giorno è lo stesso
della sezione qui sopra, ed è la ragione per cui portano un numero. **Non è più la più recente:**
sopra c'è la seconda sessione dello stesso giorno, che ha eseguito D035, e questa descrive uno stato
già superato.

**Cosa è stato chiuso.**

| Delega                                   | Cos'era                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| [D033](D033-il-bancomat-e-una-pagina.md) | la home faceva due lavori; adesso il bancomat è una pagina e il cruscotto un'altra |

**Non spezzata**, e la sua intestazione chiedeva di dichiararlo: non esiste uno stato intermedio che
compili — `home` sparisce solo se `atm` e `board` esistono nello stesso commit. Ha portato l'
[ADR 0040](../adr/0040-il-bancomat-e-il-cruscotto-sono-due-pagine.md) e **il primo `Superata` del
progetto**, l'[ADR 0018](../adr/0018-la-home-e-un-atm.md), più diciassette correzioni rispetto a
com'era scritta.

Poi la sessione ha fatto una cosa di specie diversa: **un audit dell'intera codebase**, da cui è
nata [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md), scritta e non eseguita.

### Le sei cose che chi arriva adesso deve sapere

**1. Il salvataggio ha un tetto, ed è a 1e21 €.** `decimal.js` ha `toExpPos = 21`: oltre quella
cifra `toString()` scrive `1e+21`, e il regex dello schema di salvataggio rifiuta quella forma.
`SaveStore` torna `error.save.invalid` **prima** di toccare il disco, la partita va in `failed` con
fase `saving`, e da lì la finestra non si chiude. Misurato attraverso Ledger e schema veri; a 1e20
passa. **Non si incontra giocando** — a 18,00 €/s servirebbero 5,5e19 secondi — ma la
[visione](../prodotto/visione.md) dichiara un bersaglio a ~1e30, e l'
[ADR 0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md) certifica come misurata una soglia
di 1e37. È il punto 1 di D035.

**2. Il renderer non era minificato, e la causa non era nostra.** `electron-vite` imposta
`minify: false` come default del preset del renderer, e chi non lo scrive lo eredita. **Il dubbio
che [D030](D030-il-contenuto-scorre-nel-telaio.md) aveva aperto e che tre deleghe si sono passate
è chiuso**, e non era una configurazione del bundler da trovare: era un default da dichiarare.
Misurato, il pacchetto **dimezza**. E il numero che conta: ApexCharts pesa **931 kB**, non i ~1.815
che [qualita.md](../qualita.md) dichiara — cioè più del triplo di tutto il resto
dell'applicazione messo insieme. È il punto 2 di D035, e rende la decisione dell'
[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md) più contestabile di prima, non meno.

**3. Il pacchetto di rilascio porterebbe due volte ciò che è già nel bundle.** `apexcharts`,
`decimal.js` e i due `@fontsource` stanno in `dependencies` ma il renderer li impacchetta tutti:
solo `zod` è davvero esterna, e a dirlo è l'output compilato del main, non il sorgente. Sono circa
22 MB. `vue`, `pinia` e `vue-i18n` stanno **già** in `devDependencies` per questa ragione, quindi è
un'incoerenza dentro lo stesso file. È il punto 3 di D035.

**4. La classe di difetto che questo progetto dichiara scoperta ha colpito di nuovo, subito.**
D033 ha cancellato la schermata `home` e ha ripulito il codice con un commit apposta — e i
documenti vivi la nominano ancora in sette punti. Il peggiore: in
[preferenze.md](../prodotto/preferenze.md) D033 ha riscritto il **corpo** di P3 e ha lasciato in
piedi il **titolo** che afferma il contrario. Nessun gate può vederlo, ed è scritto in fondo a
questa pagina da prima. Sono i punti 4, 5 e 6 di D035.

**5. Una decisione è stata rimandata dall'utente, e non è dimenticata.** Il confine di
presentazione converte `Money` in `number`, cioè in float64: da ~1e14 € gli importi a schermo
perdono il centesimo — `99999999999999,99` esce come `…,98` — mentre il Ledger resta in equilibrio.
Le tre strade sono un formattatore proprio sulla stringa, `BigInt` con i centesimi, o una notazione
compatta oltre una soglia; la terza cambia come il gioco si legge, quindi è una decisione di
prodotto. Sta in _Fuori scope_ di D035 con scritto che è rimandata: **chi esegue quella delega non
la riapra di iniziativa propria.**

**6. Cosa l'audit NON ha trovato, che vale quanto ciò che ha trovato.** Zero problemi di sicurezza,
verificati invece che supposti: le tre difese di Electron accese, il preload a tre funzioni, nessun
`innerHTML`, nessun `v-html`, nessun `eval`, nessun collegamento esterno, la scrittura
temporaneo-`fsync`-`rename`, lo schema `zod` eseguito, `npm audit` a zero. E il kernel, i contratti,
i domini e la persistenza non hanno prodotto **un solo** reperto di correttezza oltre a quello sulla
scala. Sei reperti su nove stanno fuori da `src/`.

### Come è stato fatto l'audit, e perché conta per il prossimo

Il metodo è la parte riusabile, e senza di essa il prossimo audit ricomincia da zero.

**Non si cercano le classi che un gate già sorveglia.** Questa codebase ha una cintura di test di
regola strutturale — l'elenco sta in [tracciabilita.md](../tracciabilita.md) — e cercarci dentro le
classi che quei test impediscono è tempo speso a riscoprire che funzionano. L'audit ha guardato
**solo** dove nessun gate guarda: la semantica, i confini numerici, la configurazione di rilascio, e
la coerenza fra i documenti vivi e il codice. È la ragione per cui sei reperti su nove stanno fuori
da `src/`.

**Ogni reperto è stato dimostrato eseguendo, non leggendo.** Il tetto del salvataggio con una sonda
che attraversa Ledger e schema veri; la minificazione compilando due volte e confrontando; il peso
di ApexCharts isolandola in un chunk suo; il difetto del loop con un `schedule` finto. Le sonde
vivevano in file temporanei sotto `tests/`, cancellati alla fine — l'albero è tornato pulito e la
suite è tornata al conto di partenza.

**E una trappola dello strumento che vale la prossima volta:** `npm run verify 2>&1 | tail -40`
restituisce il codice d'uscita di `tail`, non di `verify`. La prima esecuzione dell'audit è sembrata
verde mentre `tsc` non era nemmeno installato. Si redirige su file e si legge `$?`, oppure non si
mette niente dopo la pipe.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **`npm run verify` verde**, e il conto dei test è quello di partenza: le sonde dell'audit sono
  state cancellate. `npm run build` verde. `npm audit` a zero vulnerabilità.
- **Nessun residuo di debug**, nessun file temporaneo: `git status` vede solo il lavoro voluto.
- **D035 è scritta e non eseguita**, insieme all'aggiornamento del grafo e dell'indice in
  [README.md](README.md) e a [stato.md](../stato.md) rigenerato. Sta in `78de846`.
- **Dopo D033 sono stati fatti due commit di documentazione**: `78de846` porta D035, il grafo e
  `stato.md`; `b7e050a` porta questa pagina. Queste due righe dicevano il contrario — sono state
  scritte mentre l'albero era ancora sporco, e committate nello stesso commit che le smentiva.
- **Il codice di gioco non è stato toccato dall'audit.** Nessun fix è stato applicato: D035 li
  descrive tutti e non ne esegue nessuno.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto.

1. **La tabella delle regole in [architettura.md](../architettura.md) si ferma a R19**, e adesso è
   indietro di tre righe da due sessioni. R20, R21 e R22 stanno in
   [tracciabilita.md](../tracciabilita.md), che è l'elenco autorevole. **D035 non la copre**, ed è
   una scelta: quella delega raccoglie i reperti dell'audit, e questo era già censito prima. Costa
   tre righe e sta bene accanto al suo punto 4, se chi esegue vuole prendersela.
2. **Nessuna misura della catena a macchina scarica.** Resta aperta da due sessioni. Il numero
   preso oggi — a macchina scarica, senza finestra di sviluppo — è nettamente più basso di quello
   in [qualita.md](../qualita.md), il che conferma la diagnosi scritta lì: il minuto non lo pagavano
   i test. Va rimisurato con metodo e scritto una volta, non dedotto da qui.
3. **Gli script CDP vivono ancora nello scratchpad**, quindi la prossima sessione li riscrive per
   la terza volta. Metterli in `scripts/` è una decisione che nessuno ha ancora preso.
4. **Il peso del renderer in [qualita.md](../qualita.md) è di D027 e non è stato rimisurato da
   D033.** Non è stato corretto qui perché il punto 2 di D035 lo rimisura comunque, e farlo due
   volte vorrebbe dire scriverci sopra un numero che vive un giorno.

### Due decisioni prese scrivendo D035, e perché

- **Sette reperti in una delega sola, non tre.** Il precedente è [D016](D016-correzioni-audit.md),
  che ne assorbì diciassette da un audit; l'alternativa era spezzare per radice, come fecero D021 e
  D022. Il titolo dice la ragione: tutti e sette sono «una decisione che nessuno ha preso l'ha presa
  qualcun altro», e separarli avrebbe nascosto proprio la cosa che li rende un problema solo.
- **La decisione del router è rimasta aperta dentro la delega**, con le due opzioni e il trade-off,
  invece di essere risolta scrivendo. La riga del registro YAGNI porta un grilletto — «la terza
  destinazione con una gerarchia» — che potrebbe essere scattato tre destinazioni fa, e deciderlo
  scrivendo una delega sarebbe prendere in autonomia una decisione sull'architettura del renderer.

## La seconda sessione del 2026-08-21: due deleghe chiuse, tre scritte

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. Il giorno è lo stesso
della sezione qui sotto, ed è la ragione per cui portano un numero. **Non è più la più recente:**
sopra c'è la sessione del 2026-08-22, e questa descrive uno stato già superato.

**Cosa è stato chiuso.**

| Delega                                                | Cos'era                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| [D032](D032-la-commissione-scala-il-pavimento-no.md)  | la commissione del bancomat era fissa, e a certe cifre smetteva di esistere       |
| [D031](D031-la-sovrapposizione-e-un-pezzo-del-kit.md) | il pannello dei cheat non si chiudeva, e la sovrapposizione era scritta due volte |

Più **tre deleghe nuove scritte**: D032 (poi eseguita), [D033](D033-il-bancomat-e-una-pagina.md) e
[D034](D034-le-serie-degli-strumenti.md). Ognuna delle due chiuse ha portato il proprio ADR —
[0038](../adr/0038-la-commissione-scala-il-pavimento-no.md) e
[0039](../adr/0039-una-sovrapposizione-passa-dal-kit.md) — più l'accettazione dell'
[ADR 0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md), che aspettava un grilletto da
agosto, e la regola **R22**, rotta di proposito.

### Le cinque cose che chi arriva adesso deve sapere

**1. Le tre domande sul bancomat hanno risposta.** Non vanno più poste: stanno qui sotto, in _Le tre
domande, e cosa ha risposto l'utente_. Riproporle sarebbe far rifare una decisione già presa.

**2. Il pannello dei cheat si chiude, e la causa era una riga di CSS.** `.panel { display: flex }`
su un elemento con `popover`: una regola d'autore vince su quella del motore a qualunque
specificità, quindi il riquadro restava visibile anche chiuso. Per due stesure la colpa era stata
data alla meccanica di apertura, che era giusta tutte e due le volte. Adesso la meccanica vive in
`UiPopover`, e **R22 impedisce a chiunque altro di avere in mano un elemento con `popover`**.

**3. La commissione del bancomat non è più un numero.** È `max(pavimento, importo × tasso)`, con due
tassi asimmetrici — 1,5% versando, 2,0% prelevando — e un pavimento a 2,50 €. Ne discende che
`store.atmFee` **non esiste più**: chi vuole sapere quanto costa un'operazione chiede un'anteprima.
Un test verifica l'**assenza**, perché rimetterlo in buona fede è facile.

**4. La precisione del denaro è passata da 20 a 40 cifre**, ed è l'ADR 0026 eseguito come era
scritto. Non ha reso rosso nessuno degli ottocento test esistenti — misurato, non sperato — e le due
soglie che quell'ADR prevedeva sono esatte: il centesimo esiste fino a 1e37, `transfer()` smette di
bilanciare da 1e40.

**5. La catena dei gate ha passato il minuto.** 66 s con 814 test, contro i 51,6 s con 794 di D030.
**Il minuto non lo pagano i venti test nuovi**: sono cresciuti del 2,5% e la catena del 28%. Le due
misure sono state prese con la finestra di sviluppo aperta, e nessuna delle due è il numero a
macchina scarica — che nessuno ha ancora preso. Il dettaglio è in [qualita.md](../qualita.md).

### Le tre domande, e cosa ha risposto l'utente

Erano le tre che la sessione precedente aveva lasciato aperte. **Sono chiuse**, e le risposte hanno
già prodotto D033 e D034.

| Domanda                                   | Risposta                                                                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| La home fa due lavori: restano insieme?   | **No.** Si segue l'artboard `ATM` del canvas, funzionalità **e** disegno. L'ADR 0018 va superato — è D033                                          |
| Si adotta la carta del canvas?            | **Sì**, quella nera con numero, intestatario e scadenza                                                                                            |
| Si prepara la forma del gioco più grande? | **No**, non la striscia a sei voci. Ma i **grafici** sì, e più di quanti il canvas ne disegni: candele per contanti e carta, un'area per il totale |

**Una quarta risposta, non richiesta e più importante delle tre:** _«quando si arriva ai milioni a
chi frega di 2 €?»_ — è la frase da cui è nata D032, e ha corretto un difetto di gioco che nessun
documento aveva visto.

**Una quinta, sul reddito:** «va studiato bene perché porta funzionalità e/o guadagni potenzialmente
core, quindi sarà fatto a parte in un futuro vicino». Non si tocca finché non arriva la sua fetta.

### Le due decisioni prese dentro D031, e perché

Erano dichiarate «da non risolvere in autonomia». L'utente le ha delegate con dei criteri —
«coerenza, zero debiti futuri, professionalità, stato dell'arte, non pigrizia, non necessariamente
la soluzione più invasiva» — e sono state prese così:

- **Un pezzo solo, `UiPopover`, e `UiTooltip` ci si appoggia sopra.** La ragione decisiva non è
  quella che la delega prevedeva («se restano due, fra sei mesi sono quattro»): è che `UiTooltip`
  non era rotto **per fortuna** — non gli era servito scrivere `display`. Una regola rispettata per
  caso non è una regola.
- **Niente `UiMenu`.** Avrebbe **zero** chiamanti contro i due che il kit richiede (D023): il
  pannello dei cheat è un elenco di pulsanti, e il menu contestuale del canvas non ha una riga di
  codice. Il grilletto è scritto nell'ADR 0039: il primo menu vero.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **Niente di non commesso**: `git status` è vuoto, `git stash list` è vuoto, nessun file non
  tracciato.
- **`npm run verify` verde** — 77 file, **814 test**. **`npm run verify:release` verde**, renderer a
  2.450,46 kB (sempre non minificato: il dubbio di D030 resta aperto e non è stato toccato).
- **Nessun residuo di debug** nel diff della sessione: `console.log`, `debugger`, `TODO` — zero.
- **Cinque commit** su `d031-la-sovrapposizione-e-un-pezzo-del-kit`, che discendeva da
  `d032-la-commissione-scala-il-pavimento-no`, che discendeva da
  `d030-il-contenuto-scorre-nel-telaio`. **Quei rami non esistono più**: vedi il punto qui sotto.
- **Tutto è stato fuso in `main` e spinto**, ed è l'ultima cosa fatta in questa sessione. Un
  `--ff-only`, `verify` e `verify:release` verdi **su `main` fuso**, poi il `push`. Poi i
  trentasette rami di lavoro cancellati con `git branch -d` — quello che si rifiuta se il lavoro
  non è fuso: **nessuno si è rifiutato**, e questa è la prova che non c'era lavoro unico da nessuna
  parte. Resta `main`, allineato con `origin/main`.
- **Il ramo `d030-il-contenuto-scorre-nel-telaio` non punta più al commit di chiusura di D030.** I
  documenti delle tre deleghe nuove sono stati commessi stando su di lui, quindi l'etichetta è
  avanzata a `383c94b`. La delega D030 dichiara `1f3a0e1`, che è ancora nella storia ed è il commit
  giusto: è l'etichetta a essersi spostata, non il commit a essersi perso.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto.

1. **La tabella delle regole in [architettura.md](../architettura.md) si ferma a R19.** R20, R21 e
   R22 non ci sono. Le prime due mancavano già prima di questa sessione, la terza è di oggi.
   L'elenco autorevole è [tracciabilita.md](../tracciabilita.md), che le ha tutte e tre: quella
   tabella è un riassunto, e adesso è indietro di tre righe. Non è stato corretto qui perché
   riguarda anche lavoro non di questa sessione, e correggerlo durante una chiusura è lavoro nuovo.
2. **Gli script CDP vivono nello scratchpad, quindi la prossima sessione li riscrive.** Questa li ha
   riscritti da zero e ha ripagato due volte le stesse trappole. Il **metodo** è descritto in _Come
   si guarda l'applicazione senza toccarla_; il **codice** no. Metterli in `scripts/` è una
   decisione che nessuno ha preso.
3. **Nessuna misura della catena a macchina scarica.** Vedi il punto 5 qui sopra: prima di
   ottimizzare qualcosa serve un numero preso senza la finestra di sviluppo aperta.

### Due vicoli ciechi, per non ripercorrerli

1. **Lo `Spazio` sintetico non attivava il pannello, e sembrava un difetto di accessibilità.** Non
   lo era: l'evento CDP mandava `key: 'Space'` invece di `key: ' '`, quindi il motore non
   sintetizzava il clic. A dirlo è stato un controllo preso **nello stesso ambiente** — lo stesso
   `Spazio` non attivava nemmeno l'interruttore del tema, che nessuno aveva toccato. È la lezione di
   [D030](D030-il-contenuto-scorre-nel-telaio.md) con un'altra faccia: una misura strana va
   confrontata con un controllo preso allo stesso modo.
2. **`Page.reload` via CDP chiude l'applicazione di sviluppo.** Provato una volta, il server è
   uscito con codice 0. Per rileggere lo stato dopo una modifica conviene riavviare `npm run dev`,
   non ricaricare la pagina da fuori.

**E una trappola dello strumento che costa dieci minuti se non la si sa:** la porta 5173 può restare
occupata da un'istanza precedente, e allora `electron-vite` passa alla 5174 **in silenzio**. Uno
script CDP che filtra i bersagli sul numero di porta non trova più niente, e sembra che
l'applicazione non sia partita. Si filtra su `localhost`, non sul numero.

## La **prima** sessione del 2026-08-21: tre deleghe chiuse, due cose aperte

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione.

**Cosa è stato chiuso, e perché ognuna esisteva.**

| Delega                                         | Cos'era                                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [D028](D028-una-capienza-ferma-chi-sale.md)    | un pool oltre la capienza rifiutava **ogni** transazione, comprese quelle che lo facevano scendere      |
| [D029](D029-i-devcheat.md)                     | i devcheat: costruire uno stato di gioco invece di aspettarlo, senza poter mentire su di esso           |
| [D030](D030-il-contenuto-scorre-nel-telaio.md) | la carta 3D passava sopra la testata scorrendo; adesso scorre solo il contenuto, dentro la propria area |

Ognuna ha portato il proprio ADR — [0035](../adr/0035-una-capienza-ferma-chi-sale.md),
[0036](../adr/0036-i-cheat-passano-dalle-porte-del-gioco.md),
[0037](../adr/0037-il-telaio-non-scorre-il-contenuto-si.md) — più l'invariante **INV-23** e le
regole **R20** e **R21**, ciascuna con il proprio test e ciascuna rotta di proposito almeno una
volta. `npm run verify` è **verde**; il conto dei test e il tempo della catena stanno in
[qualita.md](../qualita.md), con la data accanto, ed è l'unico posto in cui si scrivono.

**Le tre cose che chi arriva adesso deve sapere, e che nessun'altra pagina dice:**

1. **La partita di sviluppo non è più murata viva.** L'avvertenza in fondo a
   [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md) — 903.359,30 € di contanti contro una
   capienza di 1.000,00 €, quindi ogni transazione rifiutata e ogni grafico piatto — **non vale
   più**: con INV-23 quel saldo può scendere, quindi deposito, prelievo e ampliamento funzionano di
   nuovo, e il cheat «svuota i contanti» lo riporta dentro le regole senza toccare il file.
2. ~~**Il pannello dei cheat esiste e ha un difetto aperto.**~~ **Superato.** Il pannello si
   chiude da D031, e la causa era `.panel { display: flex }` su un elemento con `popover`. Il
   dettaglio sta nella sezione della seconda sessione, qui sopra.
3. **Il bancomat è rimasto a metà, ed è deliberato.** L'utente aveva chiesto di rifinire la home
   «secondo il canvas», poi di **non toccarla** finché non avesse puntualizzato lui. **Ha
   puntualizzato**: le tre domande qui sotto hanno risposta, e da lì è nata
   [D033](D033-il-bancomat-e-una-pagina.md). Non sono più «la prima cosa da chiedergli».

### Le tre domande aperte sul bancomat

> **Chiuse.** L'utente ha risposto a tutte e tre nella seconda sessione del 2026-08-21, e da quelle
> risposte sono nate [D033](D033-il-bancomat-e-una-pagina.md) e
> [D034](D034-le-serie-degli-strumenti.md). Le risposte stanno qui sopra, in _Le tre domande, e cosa
> ha risposto l'utente_. **Non vanno riproposte.** Il testo che segue resta perché le domande, come
> erano poste, spiegano perché quelle deleghe hanno la forma che hanno.

Nessuna era stata decisa, e nessuna andava decisa in autonomia: cambiano la forma di una schermata e
di un ADR in vigore.

1. **La home fa due lavori** — è la pagina del bancomat (carta, contanti, deposita/preleva) **e** il
   cruscotto (cinque riquadri, grafico, operazioni recenti). Il canvas invece tiene le due cose
   separate: la sua pagina `ATM` è a due colonne — a sinistra l'operazione, a destra la carta e le
   operazioni — e il cruscotto è una pagina a sé, `Board`. Restano insieme, e allora l'
   [ADR 0018](../adr/0018-la-home-e-un-atm.md) resta in vigore, oppure si separano e quell'ADR va
   superato?
2. **La carta del canvas è un'altra carta.** Nera con l'accento, numero, intestatario, scadenza, e
   sul retro «cosa fa questo strumento». Quella nel codice è oro e porta il solo saldo. Si adotta
   quella del canvas?
3. **Il canvas disegna un gioco più grande di quello che esiste** — una striscia di risorse in
   testa con sei voci (contanti, carta, fiche, crypto, calore, attenzione) e una colonna a cinque
   gruppi. Il codice ha due pool e quattro destinazioni. Ci si ferma a ciò che esiste, oppure si
   prepara la forma?

**Il canvas è già nel repo**, ed è lo stesso file che l'utente ha riconsegnato in quella sessione:
[design/mockups/solvent-canvas.dc.html](../design/mockups/solvent-canvas.dc.html) — verificato byte
per byte dopo la formattazione. Si legge **nel sorgente**, non solo guardandolo, ed è il metodo che
[il suo README](../design/mockups/README.md) descrive.

**Una cosa sul canvas che vale la pena sapere prima di aprirlo:** la sua testata usa `z-index: 20`.
Da R21 quel numero **non si può scrivere** in `src/`, e non è una contraddizione: il canvas è
l'autorità su come una schermata si **vede**, non su come è fatto il telaio. La ragione per esteso
sta nelle alternative scartate dell'[ADR 0037](../adr/0037-il-telaio-non-scorre-il-contenuto-si.md).

### Cosa c'è nell'albero di lavoro, e cosa non c'è

- **Niente di non commesso**: `git status` è pulito, `git stash list` è vuoto.
- **Sei commit su rami impilati**, e `main` non li ha. `d030-il-contenuto-scorre-nel-telaio` li
  contiene tutti: `git merge --ff-only d030-il-contenuto-scorre-nel-telaio` da `main` li porta a
  casa in un colpo. **Non è stato fatto**, perché fondere e spingere sono decisioni dell'utente.
- **`out/` contiene un `index.html` manomesso**: durante D030 ci è stato iniettato un `window.solvent`
  finto per guardare la schermata senza Electron. `out/` è ignorato da git e si rifà con
  `npm run build`, quindi non è un residuo — ma chi apre quel file e lo trova strano adesso sa
  perché.

### Un dubbio che questa sessione non ha sciolto — **e che l'audit ha sciolto**

`npm run build` produce un renderer **non minificato** — i commenti del sorgente sono ancora dentro
il bundle, ed è così che si è scoperto. Ne discende che i 2.437,92 kB dichiarati in
[qualita.md](../qualita.md) sono il peso di un pacchetto non minificato, non il peso di ApexCharts.
Non è stato toccato: è nel [registro YAGNI](../roadmap-fette.md) con il suo grilletto, e prima di
stringere qualcosa va saputo quanto pesa davvero la libreria, o si ottimizza il file sbagliato.

> **Sciolto il 2026-08-22.** Non era una configurazione del bundler da trovare: `electron-vite`
> imposta `minify: false` come **default del preset del renderer**, e chi non lo scrive lo eredita.
> Misurato, il pacchetto dimezza; ApexCharts pesa 931 kB e non i ~1.815 che quella sottrazione
> lasciava credere. Il dubbio è durato tre deleghe perché la domanda era posta al file sbagliato —
> si guardava l'output invece delle opzioni con cui era prodotto. Il rimedio è il punto 2 di
> [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md).

**Perché questa tabella non porta più i numeri.** Li portava, ed erano sbagliati: da
[D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) i fatti contabili stanno in un posto solo
e generato, [stato.md](../stato.md), e nessun documento vivo li ripete (regola C11). È la stessa
mossa del Registry contro le cinque liste: non si controlla che due cose coincidano, si fa in modo
che ce ne sia una sola.

I contratti sono in `src/core/contracts/`, Clock, Rng, Bus, Registry e Ledger in
`src/core/kernel/`, i numeri di gioco in `src/core/balance/`, lo schema del salvataggio e i tre
canali IPC in `src/main/save/`, i tre domini in `src/core/domains/`. In `src/renderer/` ci sono il
bootstrap, il loop, l'unico store, il guscio `App.vue`, le viste sotto `views/` — **una per
destinazione**, e INV-22 non ne ammette una in meno — e i componenti di gioco sotto `components/`,
che da [D026](D026-dove-si-attacca-un-dominio.md) **non è più piatta**: una cartella per
proprietario, e zero file sciolti. Quante siano non si scrive qui, ed è la lezione di
[D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) applicata a un punto in cui aveva già
morso due volte: questa riga ha detto «quattro viste» dopo che D033 ne aveva fatte cinque, e
«cinque cartelle» dopo che D029 ne aveva aggiunta una sesta. La regola non invecchia, il conto sì —
e a tenerlo è `tests/rules/domain-ui`. Il kit che non sa che gioco è sta sotto `ui/`, e le parole del
gioco sotto `i18n/`. Da [D024](D024-il-telaio.md) il guscio non disegna più le
linguette: monta il **telaio** del kit e gli passa dentro la colonna e la testata. Ogni delega chiusa ha in fondo le
**correzioni** rispetto a com'era scritta: [D002](D002-contratti.md) ne ha sette,
[D003](D003-kernel-clock.md) cinque, [D004](D004-kernel-rng.md) sei,
[D005](D005-kernel-bus.md) cinque, [D006](D006-kernel-registry.md) sei,
[D007](D007-kernel-ledger.md) nove, [D008](D008-balance.md) otto,
[D009](D009-persistenza-main.md) dieci, [D010](D010-dominio-income.md) dieci,
[D014](D014-dominio-bancomat.md) undici, [D011](D011-runtime-e-store.md) quattordici,
[D012](D012-ui-e-i18n.md) e [D015](D015-home-bancomat.md) diciassette,
[D016](D016-correzioni-audit.md) sette,
[D019](D019-il-pagamento.md) tredici, [D020](D020-nessun-sistema-si-fida-del-salvataggio.md) nove,
[D023](D023-il-design-system.md) undici, [D017](D017-il-caveau.md) sedici,
[D024](D024-il-telaio.md) e [D025](D025-il-tooltip.md) quattro ciascuna,
[D026](D026-dove-si-attacca-un-dominio.md) e
[D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md) dodici ciascuna. Leggile prima di fidarti del
testo di una delega ancora aperta — alcune di quelle correzioni riguardano proprio deleghe che non
sono ancora state eseguite.

### Cosa vale per qualunque delega, e nessuna lo ripete

Le regole che non stanno nel testo di nessuna delega perché valgono per tutte. Sono qui perché una
delega chiusa è un documento storico: nessuno la rilegge.

Il numero non si scrive, ed è la lezione di [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md)
applicata a un punto cieco: qui diceva «quattro» e poco più sotto «sei», mentre le righe erano
**dodici**. `tests/rules/docs-facts` non poteva vederlo — «regole» è fuori dal suo elenco di cose
contate apposta, perché includerla produceva falsi positivi — quindi l'unica difesa è non scrivere
un numero che nessuno conta.

- **R05 vieta anche i tipi.** Un `.vue` non può scrivere
  `import type { IncomeError } from '@core/domains/income/commands'`: il lint usa la regola base,
  che non distingue un import di tipo. Le unioni che servono alla UI vivono in
  `renderer/i18n/index.ts`.
- **Il codice si scrive in inglese.** Identificatori in inglese; prosa — commenti, messaggi degli
  errori lanciati, descrizioni dei test — in italiano. È la regola C08 di
  [convenzioni.md](../convenzioni.md), imposta da `tests/rules/english-identifiers`, che è
  ⚠️ parziale e lo dichiara.
- **Un importo di gioco non può nascere dentro un dominio.** `no-magic-numbers` guarda i **numeri**,
  ma `Money` si costruisce da una **stringa**: a fermarlo è `tests/rules/domains-no-money-literals`
  (D014, correzione 2).
- **Un `eslint-disable` senza motivazione è un test rosso**, non un appunto di review (C06).
- **Il salvataggio si scrive solo da uno stato che ha una partita vera** (INV-17). `close()` ha una
  precondizione: da `Avvio`, da `Caricamento` e da `Errore` per un caricamento fallito la finestra
  si chiude **senza scrivere**, perché quello che c'è in memoria non è la partita di nessuno.
- **Nessun barrel** (C10) e **nessuna parola vietata nei nomi** (C09): due regole che stavano solo
  in prosa e adesso hanno un test — `tests/rules/no-barrel` e `tests/rules/forbidden-words`.
- **Se apri o chiudi una delega, o aggiungi un ADR, `docs/stato.md` va rigenerato** — altrimenti il
  gate è rosso, ed è voluto (C11). Il comando è `npx vitest run tests/rules/project-state -u`. Quel
  file **non si scrive a mano**: lo produce `tests/helpers/projectState.ts` leggendo il repo.
- **Non scrivere in un documento vivo un numero che `stato.md` conta.** Quanti ADR ci sono, quali
  sono `Proposta`, quante deleghe sono aperte, quanti documenti: se ti serve dirlo, **linka**
  invece di ricopiare (C11). Vale per i documenti vivi, non per ADR e deleghe, che raccontano il
  momento in cui sono stati scritti.
- **Se sposti un confine fra livelli, il diagramma di [architettura.md](../architettura.md) cambia
  nello stesso commit** — e adesso non è più disciplina: `tests/rules/import-graph` confronta il
  disegno con il grafo di import vero **nei due versi**, e pretende che ogni file di `src/`
  appartenga a un nodo (C13). Una cartella nuova va aggiunta anche alla mappa dentro quel test.
- **Un file `rules.ts` è puro, e c'è un test** (R13): niente `ctx`, niente `Date.now`, niente
  `emit`, niente import di valore da `Bus`, `Ledger` o `Registry`. Gli import di **soli tipi**
  passano.
- **Un dominio non importa un altro dominio** (R19, da D018), e qui gli import di soli tipi **non**
  passano: `tests/rules/domains-are-independent` risolve l'alias e i percorsi relativi. Ciò che un
  dominio deve sapere di un altro arriva **per argomento**, e a consegnarlo è chi ha entrambi i capi
  sotto mano — il bootstrap o lo store ([ADR 0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)).
- **Un dominio nuovo compila la sua [scheda](../design/domini/README.md) prima che qualcuno ne
  scriva una riga** (D018), e la scheda si compila **leggendo `src/`**, non ricordandolo. Se il
  dominio non esiste ancora, la scheda va riletta contro il codice il giorno dopo: è successo al
  caveau, e ha smentito tre delle proprie righe.
- **`no-magic-numbers` copre adesso anche `src/renderer/**/*.ts`** (R04). Un numero di gioco nella
  UI va in `balance/`; un numero di presentazione prende un nome.
- **L'interfaccia di un dominio vive in `components/<dominio>/`, e da nessun'altra parte** (R18,
  [ADR 0033](../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)). Un dominio nuovo è una
  cartella lì **più** una riga in `DOMAIN_SCREENS`, che può dire `null` — e `tests/rules/domain-ui`
  è rosso finché non le hai scritte tutte e due. Le cartelle di `components/` che non sono domini
  sono una lista chiusa di due, `shell/` e `ledger/`: allungarla è una riga in quel test.
- **Nessuna riga che comincia con `|` fuori da una tabella** (C12). Sembra pedante finché non
  spezzi una tabella in due con un paragrafo e la voce diventa invisibile: è successo.

**Le deleghe aperte sono quelle che [stato.md](../stato.md) elenca**, e l'ordine in cui si
eseguono è il grafo in [README.md](README.md). [D013](D013-verifica-della-fetta.md) è chiusa e la
fetta 01 è conclusa: il progetto è allo **STOP 2**, e la fetta 02 è già scritta — vedi _Il prossimo
passo_ in fondo.

Il rapporto dello STOP 2 sta in fondo a quella delega, insieme a undici correzioni. Le quattro cose
che chi arriva adesso deve sapere, e che nessun'altra pagina dice:

1. **Il kernel non è sotto budget: è sopra di circa il 9%**, e va saputo perché la prima risposta
   di D013 diceva il contrario. Il budget di ~500 righe misurava le **sei** deleghe D003–D008, cioè
   `kernel/` **più** `balance/`: la sola cartella `kernel/` è un altro insieme, e confrontarla con
   ~500 è l'errore che è già stato fatto una volta. Le due misure stanno in
   [stato.md](../stato.md), e lo sforamento è dichiarato riga per riga in [README.md](README.md).
2. **Le ultime operazioni sono sommerse dallo stipendio.** Il reddito emette una transazione per
   tick, dieci al secondo: un deposito resta visibile meno di mezzo secondo sulla home, e il
   registro da venti della schermata Statistiche è tutto stipendio dopo due secondi. Ogni test
   è verde, e a ragione — nessuno di loro guarda lo schermo mentre il tempo passa. È nel
   [registro YAGNI](../roadmap-fette.md) con il grilletto della fetta 02.
3. **Le regole che dipendono da un occhio sono sei, ed erano sette.** «I file `rules.ts`
   contengono solo funzioni pure» era l'unica regola scritta senza ID e senza meccanismo: adesso è
   **R13**, con `tests/rules/pure-rules`
   ([D022](D022-il-confine-disegnato-e-il-confine-vero.md)). Le sei che restano sono C04, C05 e i
   quattro nomi di file che [convenzioni.md](../convenzioni.md) affida alla review; sono elencate
   in fondo a [tracciabilita.md](../tracciabilita.md), sotto _Cosa questa tabella non copre_. Se
   diventano sette, è un segnale.
4. **Uno stato `Proposta` non è una dimenticanza: è una decisione che il codice non impone
   ancora.** Quali siano in questo momento lo dice [stato.md](../stato.md), che li conta; il
   perché di ciascuna sta nel suo ADR. Gli altri sono `Accettata`, e ognuno ha accanto il rosso
   che l'ha dimostrato. Il numero **non** si scrive qui: è stato sbagliato per un giorno intero
   prima che [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) togliesse a questa pagina
   il compito di ricordarlo.

Prima di lei c'è stata [D016](D016-correzioni-audit.md), nata da un **audit della codebase** fatto
il 2026-08-20: diciassette difetti, di cui uno critico — chiudere la finestra dalla schermata
d'errore scriveva una partita vuota sopra il salvataggio del giocatore. Le due radici sono nella
delega, e la seconda vale la pena saperla anche senza aprirla: `tests/rules/doc-links` verifica che
i collegamenti fra documenti risolvano, **non che i numeri scritti in prosa siano veri**. Sei
affermazioni numeriche di documenti vivi erano invecchiate senza far rumore.

### Quanto ci si può fidare di questi documenti

Sono stati **auditati per intero** dopo D005: tutti e cinquanta i markdown, collegamenti e ancore
inclusi. Sono usciti quindici disallineamenti, corretti tutti tranne uno — il `post(posting)` di
D007, lasciato aperto perché la decisione spettava a chi avrebbe scritto quel Ledger. È stata
presa: `post()` non esiste ([ADR 0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)). Il
dettaglio di cosa è stato trovato sta in `git log` (`docs: audit di coerenza`) e la lezione in
[rischi.md](../rischi.md), sotto N07.

D007 ne ha trovato un sedicesimo che l'audit non aveva visto: l'[ADR 0003](../adr/0003-ledger-unica-porta-del-denaro.md)
conteneva ancora la firma `Ledger.post({ … })`, superata dall'ADR 0019 lo stesso giorno. Gli ADR
sono append-only, quindi il corpo resta e a dichiararlo è l'intestazione.

Da lì in avanti valgono due cose:

- **I collegamenti non si rompono più in silenzio**: `tests/rules/doc-links` verifica ogni
  link e ogni ancora fra i documenti, ed è un gate come gli altri (regola C07).
- **E dal terzo audit, nemmeno i conteggi**: quanti ADR, quali `Proposta`, quante deleghe, quanti
  documenti stanno in [stato.md](../stato.md), che è **generato** e verificato (C11). Un documento
  vivo che li ripete è rosso, e nessuna riga di tabella può vivere fuori da una tabella (C12).
- **I documenti non appartengono tutti alla stessa specie, e non è un difetto.** Alcuni descrivono ciò che c'è
  (architettura, tracciabilità, glossario); altri **vincolano** ciò che verrà
  ([design/flusso-tick.md](../design/flusso-tick.md), le deleghe aperte). I secondi parlano di
  codice che non esiste ancora, e lo dichiarano in testa. Se ne trovi uno che non lo dichiara, è
  quello il difetto.

Quel primo audit **non** copriva ciò che è cambiato dopo D008. Il secondo — 2026-08-20, tutta la
codebase e tutti i documenti — è quello che ha prodotto [D016](D016-correzioni-audit.md).

Il **terzo** è dello stesso giorno, poche ore dopo, e ha prodotto
[D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) e
[D022](D022-il-confine-disegnato-e-il-confine-vero.md). Ha trovato dodici difetti, **nessuno nel
codice sorgente**: sette erano conteggi invecchiati — la stessa classe che D016 aveva appena
corretto a mano — e tre erano confini architetturali che nessun meccanismo verificava. La lezione
sta tutta in questo: la correzione di D016 era un **aggiornamento**, e un aggiornamento protegge il
giorno in cui lo si esegue e nessun altro. Le coperture sono dichiarate in fondo a D021.

Da lì in poi vale la stessa avvertenza di sempre: quello che è cambiato dopo, nessuno l'ha ancora
guardato — con una differenza, adesso: sette delle dodici classi trovate non possono più tornare in
silenzio, perché un gate le vede.

**E la classe che resta scoperta ha appena colpito di nuovo.** [D019](D019-il-pagamento.md) è stata
chiusa con tutti i gate verdi — collegamenti, conteggi, `stato.md` rigenerato — e alcuni fra i
**documenti vivi** descrivevano ancora il meccanismo di prima: il glossario non conosceva `PriceList` e la parola
«listino» era già presa dalla visione per un'altra cosa, `flusso-tick.md` disegnava un `buyUpgrade()`
senza argomento, `mappa-funzionale.md` diceva che con cosa si paga «si scopre sbagliando».
Trovati solo rileggendoli. `doc-links` guarda i **collegamenti** e `docs-facts` i **conteggi**:
nessuno dei due sa dire se una frase descrive ancora il codice di ieri, e non è chiaro che qualcosa
possa saperlo. Finché non lo sa nessuno, chiudere una delega vuol dire anche **rileggere i documenti
vivi che nominano ciò che hai cambiato** — non solo quelli che la delega elencava.

## Le sei cose da non fare

Sono le regole che, violate, riportano il progetto a com'era. Tutte hanno un meccanismo che le
impone; il meccanismo sta in [tracciabilita.md](../tracciabilita.md).

1. **Non scrivere una lista di sistemi a mano.** Il `Registry` è l'unica che esiste.
2. **Non toccare un saldo.** Solo `Ledger.transaction`, che applica tutto o niente e somma a zero.
3. **Non mettere logica di dominio in un `.vue`.** I componenti leggono selettori e inviano comandi.
4. **Non scrivere `TODO`.** Ciò che manca sta in [roadmap-fette.md](../roadmap-fette.md), con il
   grilletto preciso che lo farà entrare.
5. **Non costruire due domini insieme.** Una fetta verticale alla volta, finita e verde. È il
   difetto A17, quello che ha generato tutti gli altri.
6. **Non aggiornare la documentazione "dopo".** Se una modifica sposta un confine, il documento che
   descrive quel confine cambia nello stesso commit.

## Cosa leggere, in quest'ordine

| Quando                        | Documento                                         | Tempo |
| ----------------------------- | ------------------------------------------------- | ----- |
| sempre, per primo             | [docs/README.md](../README.md) — la mappa         | 2 min |
| per capire la forma           | [architettura.md](../architettura.md)             | 5 min |
| per non inventare parole      | [glossario.md](../glossario.md)                   | 3 min |
| prima di discutere una scelta | [adr/README.md](../adr/README.md) — solo i titoli | 3 min |
| prima di scrivere codice      | la delega che stai eseguendo                      | 5 min |
| quando dubiti che regga       | [rischi.md](../rischi.md), parti 2 e 3            | 5 min |

Non serve leggerli tutti, gli ADR. Servono quando stai per contraddirne uno: allora leggi
**quello**, e riparti dalle alternative già scartate invece che da zero.

## Il prossimo passo, in concreto

**C'è una delega da eseguire, e si chiama [D044](D044-il-reddito-e-un-elenco-di-fonti.md).** Quante
ne siano aperte lo dice [stato.md](../stato.md), che le conta. Il reddito diventa un elenco di fonti
con una scala e un plateau: il ramo `d044-il-reddito-e-un-elenco-di-fonti` esiste già e porta **solo
documenti**, quindi chi riprende non deve creare niente — si legge la delega e si scrive il codice.

**Si legge in quest'ordine, ed è corto:** la [scheda del reddito](../design/domini/income.md), che
dichiara in testa di descrivere un dominio che **non esiste ancora**; poi
l'[ADR 0053](../adr/0053-un-miglioramento-dichiara-il-tempo-in-cui-rientra.md); poi la delega. **La
forma da copiare è il caveau di [D042](D042-il-caveau-ha-uno-spazio-e-una-scala.md)**, non il reddito
di oggi: `domains/vault/rules.ts` ha già la scala calcolata una volta all'avvio del modulo, il
livello stretto fra zero e il massimo, il listino che diventa vuoto in cima invece di rispondere con
un ramo, e `accepts` generato dal listino **per livello**.

**E il bersaglio che non deve diventare rosso è `income_per_minute_at_start`:** la partita si apre
identica a oggi, 12,00 €/s con i lavoretti chiusi. Se diventa rosso non è il bersaglio a essere
invecchiato — è la partita che non si apre più come prima.

### E dopo D044, la fetta 04

**Comincia da una scheda, non da una schermata**, ed è la differenza che
[D018](D018-la-scheda-di-dominio.md) è servita a fare: il modulo sta in
[design/domini/README.md](../design/domini/README.md), e un dominio nuovo lo compila **prima** che
qualcuno ne scriva una riga. Sarà la **quarta** compilata, quindi è anche il momento in cui la forma
della scheda va rivista: due sezioni oggi non discriminano, e con tre casi non si poteva sapere se
fosse un difetto della forma o del campione.

**Il calore è il primo sistema che ascolta invece di importare**, ed è la ragione per cui la fetta
04 viene adesso: il [registro](../roadmap-fette.md) lo dice nella riga della fetta — il primo
consumatore reale dell'Rng con stream separati, e il primo dominio che reagisce a eventi di altri
domini senza conoscerli. La regola che glielo impedisce esiste già ed è R19, con il suo test.

**Due cose che la fetta 03 lascia in eredità e che vale la pena avere in mente**, perché la fetta 04
è la prima a poterle usare davvero:

- **Il mondo avanza a blocchi di un giorno di gioco** ([ADR 0049](../adr/0049-il-mondo-avanza-a-blocchi.md)),
  quindi una soglia attraversata e rientrata durante un'assenza adesso **scatta**. Il calore è
  esattamente quel genere di cosa — sfonda e ridiscende — ed è il primo dominio che rende visibile
  ciò che D040 ha costruito. Fino a oggi nessuno dei tre domini aveva una soglia da attraversare.
- **Qualunque cosa debba succedere ogni N tick ha dove attaccarsi**
  ([ADR 0050](../adr/0050-la-cadenza-sta-sulla-via-unica.md)): una `Cadence` in `runtime/`,
  alimentata da `Game.advance`. Se il calore dovrà raffreddarsi a intervalli, non serve inventare
  niente — e soprattutto non serve un secondo posto che conti il tempo.

**E il blocco A non è la fetta 04**, benché il black market compaia in tutte e due. Il blocco A —
black market **e aste di box** — è un segnaposto **oltre la fetta 06** nel
[registro delle fette](../roadmap-fette.md), che lo dice a chiare lettere: «un blocco non è una
fetta». Questa pagina le ha confuse una volta, il 2026-08-23, ed è il motivo per cui il paragrafo
esiste. Ne discende che l'[ADR 0010](../adr/0010-liste-storiche-limitate-alla-definizione.md) non
può cambiare stato con questa fetta: a farlo passare sono gli **oggetti**, e gli oggetti sono del
blocco A.

### Come si guarda l'applicazione senza toccarla

**Quattro trappole del guardare, e la terza è anche la via d'uscita.** Le prime due sono state pagate
scrivendo D024 e D025; la terza le risolve tutte.

1. Una cattura della finestra può **non dipingere l'ultima banda** in fondo, e per venti minuti il
   piede della colonna è sembrato assente mentre c'era. A dirlo è stata una misura presa **dentro**
   la pagina, non un'altra occhiata.
2. L'applicazione di sviluppo **si chiude** se le si porta la finestra in primo piano da fuori — per
   esempio con uno script che la va a cercare.
3. Non serve portarla in primo piano. `npm run dev` accetta `--remoteDebuggingPort`, e da lì la
   finestra vera si interroga e si comanda dal di dentro:

```bash
npx electron-vite dev --remoteDebuggingPort 9222
```

Con la porta aperta, `http://127.0.0.1:9222/json/list` dice quale pagina è il renderer, e sul suo
WebSocket passano `Runtime.evaluate` — per **chiedere al documento** invece che all'immagine —
`Input.dispatchMouseEvent` e `Input.dispatchKeyEvent` per premere e tabulare, e
`Page.captureScreenshot` per l'immagine. La finestra resta dov'è e non si chiude.

**Perché è scritto qui e non in una delega:** è il modo in cui questo progetto pagherà **ogni**
spunta a occhio da adesso in poi, e le spunte a occhio sono l'unica classe di verifica che nessun
gate può dare. Serve anche l'altra metà, ed è la lezione della prima trappola: l'immagine dice se
qualcosa è bello, il documento dice se c'è. Le due domande sono diverse e vogliono due strumenti.

**La quarta, pagata il 2026-08-23 estraendo il guscio dei grafici: con la porta aperta la finestra
c'è, ma è `hidden` — e allora il gioco non gira.** Il ciclo di gioco è su
`requestAnimationFrame` (`runtime/host.ts`), e Chromium non lo consegna a una pagina non visibile:
il saldo resta fermo, nessuna candela chiude, e sembra che ciò che hai appena scritto non aggiorni
niente. Non è un difetto tuo. A dirlo in un colpo:

```js
;({ visibilita: document.visibilityState, frame: 'chiedilo a requestAnimationFrame' })
```

`Page.captureScreenshot` **forza un frame**, quindi fra due catture il gioco avanza di un passo: è
la ragione per cui i saldi in due immagini sono diversi mentre fra due `Runtime.evaluate` sono
identici. Non serve a far girare il gioco, serve a non farsi ingannare dalle immagini.

**La via d'uscita è non aspettare il gioco: si muove lo stato a mano, dal di dentro.** Lo store è
raggiungibile dalla pagina, e da lì una serie si sostituisce invece di aspettare che si riempia —
che è anche più severo, perché prova il ramo che vuoi provare invece di quello che capita:

```js
const store = document
  .querySelector('#app')
  .__vue_app__._context.config.globalProperties.$pinia._s.get('game')
store.cashCandles = { ...store.cashCandles, items: [...store.cashCandles.items, candelaNuova] }
```

Due avvertenze, e la prima è costata mezz'ora: le serie sono `shallowRef`, quindi **spingere dentro
`items` non aggiorna niente** — si sostituisce il valore intero, che è quello che fa lo store. E
quello che tocchi va rimesso a posto: `store.cashCandles = originale`, o stai guardando una partita
che non esiste.

### E da lì è nata [D026](D026-dove-si-attacca-un-dominio.md), che è chiusa

Guardare l'applicazione ha prodotto una domanda dell'utente che nessun documento del progetto
rispondeva: **dove vive l'interfaccia di un dominio?** Il caveau è la prova che la regola manca —
`components/CashPanel.vue` è due domini in un file, il pool e il caveau, e non per decisione: il
pannello dei contanti c'era già e il caveau ci è cresciuto dentro.

Due cose vanno sapute da chi prende D026, e sono le due che hanno rischiato di far partire quella
delega sbagliata.

1. **Il caveau con solo denaro non è un difetto, è una scelta scritta.** La visione dice «conserva
   contanti **e oggetti**», e il [registro](../roadmap-fette.md) dice perché gli oggetti non ci sono:
   nascono col black market e con le aste di box, e un inventario senza oggetti dentro è
   l'astrazione speculativa che l'[ADR 0014](../adr/0014-una-fetta-verticale-alla-volta.md) vieta. Il
   grilletto è il blocco A.
2. **«Quando UI e quando componente» era già deciso**, e chi credesse di doverlo decidere rifarebbe
   [D023](D023-il-design-system.md): il kit non sa che gioco è (ADR 0028, R14), una forma non è un
   contenitore (ADR 0030, R16), e un pezzo entra nel kit quando lo disegnano **due** componenti.
   Quello che manca è l'ordine **dentro** `components/`, che oggi è piatta.

**D026 è stata eseguita e chiusa lo stesso giorno.** Le tre decisioni sono state prese con
l'utente: la home **restava il bancomat** — l'ADR 0018 fu confermato invece che superato, e la home
_era_ la pagina del dominio `atm`; **quella metà non vale più, ed è D033 ad averla superata** —
ogni dominio ha la sua pagina salvo dichiarare `null`, e `components/` si divide per proprietario,
una cartella ciascuno. Ne è uscito
l'[ADR 0033](../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md), la regola **R18** e
`tests/rules/domain-ui`, rotta di proposito quattro volte. Le destinazioni sono quattro, quindi il
grilletto dei **gruppi nella colonna** è scattato ed è uscito dal registro.

Tre cose che chi arriva adesso deve sapere, e che le dodici correzioni di D026 spiegano per esteso:

1. **Una sottocartella di `components/` non fa rosso `import-graph`**, contro ciò che D026 dava per
   certo: quel test sceglie il nodo per **prefisso**. È la ragione per cui R18 ha dovuto essere un
   test suo invece di appoggiarsi a C13.
2. **`CashPanel.vue` si è spezzato in tre**, non in due: il caveau lascia sulla home il proprio
   allarme, e quel pezzo sta in `components/vault/`. È la clausola dell'ADR 0033 — un dominio può
   comparire fuori dalla sua pagina, ma esce dalla sua cartella — e senza di essa il muro sarebbe
   invisibile proprio dove il giocatore lo incontra.
3. **`income` ha preso una pagina anche lui**, e oggi ci sta dentro un pulsante solo. È scritto nel
   file: una pagina nasce stretta una volta sola e cresce col dominio, mentre un pannello ospitato
   nella pagina di un altro non se ne va più.

**Una cosa è stata chiesta e dichiarata fuori scope: il cruscotto con i grafici.** Non c'è una serie
storica da disegnare — `history` sono venti transazioni in memoria e `SavePayload` non contiene
nessuno storico — e una libreria di grafici è una dipendenza, quindi un ADR
([ADR 0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md)). Il suo posto è una delega sua,
che decide **chi salva la serie** prima di **come si disegna**.

**La domanda gemella — cosa è trasversale e cosa è di dominio — non sta in D026 ed è deliberato.**
Le valute, gli oggetti, il calore, l'attenzione, l'etichetta: generalizzarli adesso vorrebbe dire
generalizzare da un dominio solo, che è ciò che la [visione](../prodotto/visione.md) vieta con parole
sue. Il suo posto è la sezione 8 della scheda di [D018](D018-la-scheda-di-dominio.md), aggiunta lo
stesso giorno, più i grilletti che il registro ha già.

**Lo STOP 2 è stato riportato, e le regole che governano la fetta 02 sono già in vigore.**
La fetta 01 è conclusa e verificata. [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) e
[D022](D022-il-confine-disegnato-e-il-confine-vero.md) sono **chiuse**: sono nate da un audit
dell'intera codebase e di tutti i documenti, e hanno messo un meccanismo sotto cinque confini che
prima teneva la review. Non costruiscono gioco — costruiscono il pavimento su cui la fetta 02
cammina, e la ragione per cui vengono prima è quella di D001 e D020: le regole devono esistere
prima del codice che governano.

Quello che ne discende per chi esegue adesso sta in _Cosa vale per qualunque delega_, e la più
facile da dimenticare è quella su `docs/stato.md`: chiudere una delega significa **rigenerarlo**, o
il gate è rosso. Vale anche per una delega che non tocca `src/`, perché i file di test si contano.

**Il codice di gioco non è stato toccato**: cinque righe in tutto, in `eslint.config.js` e in
`rotation.ts`. Le deleghe della fetta 02 partono esattamente da dove le ha lasciate lo STOP 2, e
nessuna delle loro misure è cambiata.

**[D019 — Il pagamento](D019-il-pagamento.md) è chiusa**, e questa è la sua storia: non c'era, ed è nata da una domanda posta
prima di eseguire il caveau: come sceglie il giocatore con cosa paga? La risposta è che non sceglie
— `income` compra il suo upgrade con il pool scritto nel sorgente — e che
l'[ADR 0017](../adr/0017-il-denaro-e-plurale.md) prometteva il contrario dalla fetta 01. Il caveau
sarebbe stato il **secondo** comando a spendere, cioè l'ultimo momento per rispondere senza
disfare niente. Da lì l'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
e il **listino**: ogni azione dichiara, per ogni strumento che accetta, quanto costa con quello.
Il kernel non cambia di una riga.

**[D020 — Nessun sistema si fida del proprio salvataggio](D020-nessun-sistema-si-fida-del-salvataggio.md)
è chiusa**, e con lei il pavimento su cui il caveau cammina. Zero righe di sorgente, 70 di test,
esattamente il budget: ogni sistema con stato deve rifiutare un salvataggio che non riconosce
(**INV-20**), e a pretenderlo è `tests/rules/stateful-systems-reject-garbage` — il primo test di
quella cartella che costruisce una partita invece di leggere i sorgenti, il che è dichiarato in
testa al file. Veniva prima del caveau per la ragione di D001: la regola deve esistere prima del
codice che governa, e il caveau è il **secondo** dominio con stato.

Ne discende una cosa per chi prende D017: **non c'è niente da aggiungere a quel test.** I sistemi
si derivano dal Registry, quindi registrare il caveau lo mette sotto la regola da solo. Ciò che il
caveau deve fare è che il suo `load` rifiuti i tipi sbagliati **campo per campo** — il controllo
pigro «è un oggetto» non basta, ed è misurato.

**[D023 — Il design system](D023-il-design-system.md) è chiusa**, ed è arrivata da fuori: l'utente
ha consegnato un canvas di Claude Design, fatto a foglio bianco. Si è infilata prima del caveau per
la ragione di D001 — il caveau è la prima schermata nuova dopo la fetta 01, e una schermata
disegnata prima che il sistema esista è una schermata da rifare.

Le quattro cose che chi arriva adesso deve sapere:

1. **`src/renderer/ui/` è un livello, non una cartella.** Non importa `@core`, non importa lo store,
   non importa le parole: nel diagramma è l'unico nodo **senza frecce in uscita**. Lo tengono due
   regole con un test, **R14** e **R15**, e il blocco `<style>` non scoped di `App.vue` — l'unico
   che il progetto aveva — non esiste più.
2. **[P2](../prodotto/preferenze.md) è stata sostituita.** Tre cose cambiano: il fondo non è più
   solo scuro (due temi completi, sceglie il sistema operativo), l'accento non è più verde — il
   verde adesso vuol dire **solo** guadagno — e i caratteri si caricano e sono due, dal bundle.
3. **Un pulsante non si spegne, e adesso non può.** `UiButton` non sa scrivere `disabled`
   (**INV-21**). La regola c'era già da D019, in prosa; la prima stesura del componente la stava
   disfacendo senza che nessun gate lo vedesse.
4. **`npm install` non funzionava in questa repo**, e non per colpa di D023: `electron-vite@5` regge
   `vite` fino alla 7 e il progetto era sulla 8. Per due mesi l'unico comando che installava è stato
   `npm ci --legacy-peer-deps`, che però **ignora i peer** — da lì `@vue/devtools-api` e
   `vue-eslint-parser` dichiarati a mano. **Chiusa il 2026-08-23** scendendo alla 7
   ([ADR 0048](../adr/0048-la-catena-di-build-si-muove-insieme.md)); la riga resta perché la lezione
   non è la versione, è che un difetto documentato quattro volte non diventa una scelta.

**[D017 — Il caveau](D017-il-caveau.md) è chiusa, e con lei la fetta 02.** Il primo muro del gioco è
acceso: i contanti hanno una capienza, la capienza si sposta, e quando è piena il reddito **non
entra e lo dice**. Le sedici correzioni stanno in fondo alla delega; le quattro che chi arriva
adesso deve sapere sono queste:

1. **Il Ledger non legge più la capienza: la chiede, e la espone.** `createLedger(bus, capacities)`
   riceve una funzione ([ADR 0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md), ora
   `Accettata`), e `Ledger.capacities` è **la stessa** che la UI interroga — quindi INV-18 si
   verifica per identità e non confrontando due numeri che oggi coincidono. `capacityOf` in
   `domains/atm/rules.ts` **non esiste più**: leggeva `POOLS`, cioè la capienza di partenza, che
   dopo il primo ampliamento è la risposta sbagliata.
2. **Il valore predefinito di `createLedger` è additivo e ha morso lo stesso.** Tre file di test
   costruivano un Ledger nudo e ci mettevano più denaro di quanto il caveau tenga: hanno smesso di
   provare quello che provavano, e due su tre restavano **verdi**. Dove il tetto non è l'oggetto del
   test si passa `() => null`, con scritto perché. «Additivo» significa _compila_, non _prova ancora
   la stessa cosa_.
3. **`domains/* --> domains/*` non è ancora mai stata disegnata, e D017 ha scelto due volte di non
   aprirla.** Il reddito ha bisogno di sapere quanto spazio c'è nel caveau e il bancomat se un
   prelievo ci sta: in tutti e due i casi la risposta arriva **per argomento**, e a consegnarla è
   chi ha entrambi sotto mano — il bootstrap e lo store. Nessun lint lo impedirebbe, quindi è una
   cosa che si sceglie ogni volta: è scritta in prosa in [architettura.md](../architettura.md),
   sotto _Frecce vietate_.
4. **Il raggruppamento dello stipendio non è stato costruito, e il suo grilletto era «la fetta
   02».** Non stava nella tabella _Da produrre_ di D017 né nella sua definizione di fatto, e il
   caveau non è il posto dove si decide quali righe una schermata mostra. La voce è ancora nel
   [registro YAGNI](../roadmap-fette.md), con un grilletto nuovo — la prima delega che tocca
   `components/postings.ts` — e con un argomento in più: a caveau pieno il reddito **si ferma**,
   quindi lo storico smette di riempirsi di stipendio proprio quando c'è qualcos'altro da leggerci.

**[D018 — La scheda di dominio](D018-la-scheda-di-dominio.md) è chiusa**, e con lei il progetto ha
una cosa che prima non aveva: un **modulo che nessun dominio futuro può lasciare vuoto**. Sta in
[design/domini/README.md](../design/domini/README.md) — nove sezioni di gioco e dodici domande sul
kernel, ognuna con dietro un ADR, un invariante o un test — e le tre schede compilate
([reddito](../design/domini/income.md), [bancomat](../design/domini/atm.md),
[caveau](../design/domini/vault.md)) sono la prova che regge tre domini fatti apposta diversi.

Le quattro cose che chi arriva adesso deve sapere:

1. **`domains/* --> domains/*` adesso è vietata da un test.** Era vera e non imposta da niente: il
   lint sotto `domains/**` vieta `vue`, `pinia`, `electron` e le conversioni di `Money`, non un
   dominio che ne importa un altro, e `import-graph` la salta perché è un arco **interno** a un
   livello. Adesso è **R19**, `tests/rules/domains-are-independent`, e non fa sconti all'
   `import type`. D018 dichiarava «nessuna regola nuova»: è la sua correzione 1, e la ragione è che
   senza quel test D018 violava un proprio invariante nella riga stessa che lo enuncia.
2. **La scheda del bancomat ha trovato che la commissione non ha un bersaglio suo.** È tarata di
   rimbalzo da `vault_card_discount`, che è del caveau: cambiare la commissione rende rosso un test
   che parla d'altro. Non è stato corretto — D018 non tocca `src/` — ed è annotato in
   [atm.md](../design/domini/atm.md).
3. **Una domanda manca alla forma, e si sa già quale.** `withheld` del reddito non è stato, non è
   una lista e non è un evento: è un numero che spiega **perché il tick ha fatto meno di quanto
   poteva**. La metà kernel non ha una casella dove metterlo, e ce ne sarà uno per ogni dominio che
   può fallire parzialmente. Va posta alla quarta scheda, non prima.
4. **Due sezioni non discriminano ancora, e la scheda lo dichiara invece di lasciarlo intendere.**
   La 9 — _questo dominio si amministra?_ — riceve tre «sì»: il primo `null` sarà il calendario.
   Cinque delle dodici domande kernel rispondono «no» per tutti e tre. Non è un difetto: è il
   numero di partenza del controllo che la scheda si è data — se una sezione non ha mai cambiato
   una decisione va tolta, e la prova si fa alla **quarta** compilata.

**[D027 — Un grafico è una serie](D027-un-grafico-e-una-serie-che-nessuno-tiene.md) è chiusa**, e il
cruscotto ha smesso di dire solo com'è adesso. Sotto c'è la prima **serie storica** del progetto: un
campione del patrimonio netto ogni cinque secondi di gioco, trenta in tutto, tenuti in memoria dallo
store. La cadenza è una funzione pura accanto a quella che trasforma i frame in tick — `sampleOf` di
fianco a `stepOf` in `runtime/loop.ts` — perché uno store non può importare un file che gli sta
accanto (R01).

Cinque cose che chi arriva adesso deve sapere, e le prime due sono le più costose da riscoprire:

1. **La serie non si salva, e l'[ADR 0010](../adr/0010-liste-storiche-limitate-alla-definizione.md)
   resta `Proposta` per la terza fetta di fila.** Non è pigrizia: senza il calendario dell'ADR 0023
   un campione non sa **quando** è stato preso, quindi due barre affiancate possono distare un tick
   o otto ore e il grafico le disegnerebbe uguali. Salvarla direbbe di più e mentirebbe.
2. **È entrata una libreria, ed è la prima dipendenza di runtime dopo l'origine.** ApexCharts, con
   l'[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md). Il criterio dell'ADR 0015 **non la
   promuoverebbe da solo** — l'altezza di una barra è una divisione — ed è scritto nell'ADR invece
   che lasciato intendere: è entrata su richiesta dell'utente, a grafico in CSS già costruito e
   guardato. Il modulo compilato passa da 622,87 kB a **2.437,92 kB**, in
   [qualita.md](../qualita.md) con il grilletto per rimetterla in discussione.
3. **La libreria si monta a mano, e c'è una ragione precisa.** `vue3-apexcharts` clona le opzioni
   con `JSON.parse(JSON.stringify(…))`, e `JSON.stringify` cancella le funzioni: i formattatori
   sparivano e l'asse scriveva `948627.0`. Chi pensasse di «semplificare» rimettendo l'involucro
   rifarebbe quel giro.
4. **R17 si è incrinata e nessun gate lo vede.** ApexCharts scrive elementi `<title>` dentro l'SVG
   delle etichette dell'asse, cioè tooltip nativi del browser — quelli che
   [D025](D025-il-tooltip.md) aveva tolto. `tests/rules/no-native-tooltips` guarda l'attributo nel
   **sorgente**, quindi non può prenderli. Sono due, dichiarati nell'ADR 0034 e in
   [rischi.md](../rischi.md).
5. **L'asse del grafico non parte da zero**, ed è una misura: ancorato a zero, due minuti e mezzo di
   gioco valgono **2 pixel su 120** a 100.000,00 €. Il caveau arriva a 250.000,00 €, quindi il
   cruscotto avrebbe portato un rettangolo pieno per la maggior parte della partita.

**E una cosa sull'ambiente, che è costata tempo:** la partita di sviluppo su questa macchina ha
903.359,30 € di contanti contro una capienza di 1.000,00 €. È fatta a mano e viola l'invariante,
quindi il Ledger rifiuta **ogni** transazione che tocchi i contanti e il reddito è fermo: il
patrimonio non può muoversi, e qualunque grafico lì dentro appare piatto senza essere rotto. Per
vedere una serie che sale serve un'altra partita — l'app accetta `--user-data-dir`, così il
salvataggio vero non si tocca.

Tre cose che chi apre la fetta 03 deve avere in mente prima di scrivere una riga:

1. **A17 non è finita con la fetta 02.** Il caveau apre il black market, le aste e il calore, e
   nessuno dei tre si è toccato. Una fetta alla volta
   ([ADR 0014](../adr/0014-una-fetta-verticale-alla-volta.md)).
2. **La fetta 03 ha una domanda in meno e una risposta diversa.** «Il progresso offline è limitato
   dal caveau, non dal tetto» era un'ipotesi con un numero inventato; adesso è una misura: otto ore
   di assenza valgono 1.000,00 € al primo livello e 250.000,00 € all'ultimo, contro i 345.600,00 €
   che `RECOVERY_CAP` permetterebbe. Il tetto di otto ore va ri-derivato **in tempo di gioco**, e il
   recupero deve avanzare a blocchi invece che in un `tickAll` solo — ma quel `tickAll` solo adesso
   non fa più tornare a casa con zero, ed è il motivo per cui `roomIn` esiste.
3. **Il gioco si fa girare senza Electron**, e D017 l'ha rifatto per guardare la schermata nei due
   temi: `npm run build`, la pagina di `out/renderer/` servita da un server statico, le tre funzioni
   di `SaveApi` finte al posto del preload — con dentro un salvataggio che ha già dei soldi, così
   ogni stato si **costruisce** invece di aspettarlo. In questo ambiente la finestra non compone
   frame, quindi il loop non gira: i colori si rileggono dal DOM, che è più severo di un occhio. Il
   modo esatto è nella nota di chiusura di [D017](D017-il-caveau.md).

Quanto ci mette `verify`, e con quanti test, lo dice [qualita.md](../qualita.md) con la data
accanto: è l'unico posto del progetto in cui un tempo si scrive, e questa pagina lo ripeteva
scaduto di due deleghe. La soglia è il minuto, è il margine più stretto del progetto, e il rimedio
è già censito nel [registro YAGNI](../roadmap-fette.md) — togliere l'avvio ripetuto di `npm`, non
togliere un gate.

## Come si lavora

- **Ci si ferma sulle decisioni strutturali.** Nuova dipendenza, cambio di pattern, confine
  spostato: due opzioni con i compromessi, e si aspetta. Le cose piccole e reversibili si fanno.
- **Se l'utente dà una direttiva generale** ("la soluzione più professionale"), si decide in
  autonomia e si marca la decisione come contestabile — non ci si ferma di nuovo.
- **Nessun claim senza output.** "Funziona" si dice incollando i test verdi.
- **Un test che non si è mai visto fallire non è una rete, è una decorazione.** Rompilo di proposito
  una volta: costa trenta secondi. È così che si è scoperto che il primo caso di prova per R04 era
  sbagliato, e che la regola sembrava funzionare senza funzionare.
- **Commit:** Conventional Commits con lo scope uguale all'ID della delega —
  `feat(D007): il ledger a partita doppia`. Un ramo per delega: `d007-kernel-ledger`.
- **Il ramo si fonde su `main` quando la fetta è conclusa, non a ogni delega.** Per quattro deleghe
  di fila i rami si sono impilati uno sull'altro e `main` è rimasto alla fetta 01: funzionava, e
  costava una riga di avvertimento in ogni prompt — «parti dal ramo, non da `main`» — cioè
  esattamente il tipo di istruzione che prima o poi qualcuno salta. Alla chiusura della fetta 02
  sono state fuse tutte e quattro, in un `--ff-only` senza conflitti. Le deleghe chiuse continuano a
  dire da quale ramo partivano, ed è giusto: raccontano il giorno in cui sono state scritte, non
  dove si sta adesso.
- **Quando una delega è finita:** marcala `Chiusa` con il commit, aggiorna
  [tracciabilita.md](../tracciabilita.md) se hai cambiato un meccanismo, e scrivi le **correzioni
  rispetto a com'era scritta la delega** — ogni delega chiusa finora ne ha da cinque a diciassette, e
  sono scritte lì invece che nascoste. Se una delega esce senza correzioni, o era perfetta o non
  è stata letta con attenzione.
- **Un numero scritto in un documento è una misura scaduta.** Conteggi, tempi, righe: quando ne
  incontri uno che riguarda ciò che stai toccando, rimisuralo invece di ricopiarlo. `verify` ha
  dichiarato otto secondi da D001 a D006, quando erano venticinque; `rischi.md` ha detto "i quattro
  difetti" davanti a un elenco di cinque per altrettanto tempo.
- **Quando correggi un fatto sbagliato, cerca il concetto, non la frase.** Un `grep` sulla frase
  intera trova le copie identiche e lascia indietro le parafrasi — è successo davvero, con
  "progresso offline" scritto in quattro punti e corretto in due.

## Come tornare operativi, da zero

Una riga, e nessuna avvertenza:

```bash
npm ci
```

**Se hai in mente `--legacy-peer-deps`, quella pagina è cambiata sotto di te.** Per due mesi era
l'unico comando che installava, ed è stato scritto in cinque deleghe come se fosse una proprietà del
progetto. Era un difetto con una causa sola: `vite` dichiarato alla 8 mentre `electron-vite@5` —
l'ultima stabile — regge fino alla 7. Il 2026-08-23 `vite` è sceso alla 7, il flag è sparito, e con
lui i due pacchetti che erano stati dichiarati a mano solo perché il flag impediva a npm di
risolverli. Il perché, e il grilletto per risalire alla 8, stanno
nell'[ADR 0048](../adr/0048-la-catena-di-build-si-muove-insieme.md): **non alzare `vite` senza alzare
`electron-vite`**, o il flag torna.

**E se hai in mente `node node_modules/electron/install.js`, è obsoleto.** Electron ha tolto il
proprio `postinstall` alla versione 42 — la 41 ce l'aveva ancora — e al suo posto `index.js` scarica
il binario **al primo `require`**. Provato su una `node_modules` cancellata: `npm ci` non lo scarica,
il primo avvio sì, e stampa `Downloading Electron binary...` mentre lo fa. Non c'è niente da
completare a mano.

Per guardare l'applicazione senza portarla in primo piano, vedi _Come si guarda l'applicazione senza
toccarla_ — lo strumento è `scripts/cdp.mjs`, da D039.

## Come verificare di non aver rotto niente

```bash
npm run verify
```

Quattro gate in una trentina di secondi: typecheck, lint, format:check, test. Se è rosso, non è
finito.

`npm run verify:release` aggiunge la compilazione, ed è **verde da D011**: `build` produce
`out/main/index.js`, `out/preload/index.cjs` e `out/renderer/`. Da D009 a D010 era rosso e non era
una regressione — il renderer non esisteva ancora — ma da qui in avanti non ha più scuse.

Per vedere il gioco girare davvero serve il binario di Electron, che l'installazione di `npm` non
sempre scarica: se `npm run dev` dice _Electron uninstall_, si completa con
`node node_modules/electron/install.js`.

Se la finestra non c'è — o non compone frame, e allora il saldo non sale mai — il gioco si guarda
lo stesso: `npm run build`, la pagina di `out/renderer/` servita da un server statico qualunque, e
al posto del preload le tre funzioni di `SaveApi` scritte a mano, con dentro un salvataggio che ha
già dei soldi. Il modo esatto è nella nota di chiusura di
[D015](D015-home-bancomat.md#cosa-è-stato-verificato-a-mano-e-come).

## Le decisioni contestabili

Prese in autonomia; quante siano non si scrive, perché nessuno le conta. **Le righe nuove si
aggiungono in fondo**: la prosa qui sotto indicizza la tabella per posizione — «le prime quattro»,
«la ventiduesima» — e una riga infilata in mezzo sposta tutto ciò che viene dopo senza che nessun
gate se ne accorga.

**È già successo, e in due modi.** Il primo: questo paragrafo diceva «Trenta» davanti a trentasei
righe. Il secondo è più insidioso e riguarda le righe **aggiunte in fondo**, che erano la mossa
sicura: le sei di D017 hanno spinto in avanti la fine della tabella, e le due frasi che ci si
appoggiavano da dietro — «le cinque che precedono l'ultima», «le ultime cinque» — hanno smesso di
puntare a ciò che nominavano. Adesso quelle due dicono di **quale delega** parlano invece di dove
stanno, che è l'unica ancora che non si sposta.

Le prime quattro sono **in vigore** da D007 e sono state usate da due
domini: cambiarle costa il Ledger, i suoi test e i due domini. D014 era il momento buono per
contestarle ed è passato — nessuna delle quattro si è rivelata scomoda usandole.

La quinta e la sesta sono del 2026-08-19, nascono dalla revisione della visione e **non costano
ancora niente**: nessuna riga di codice le applica.

La settima è **in vigore da D009**: costa il main, il preload e i loro test.

L'ottava è **in vigore da D010**, da D014 e ora dal bootstrap che le distribuisce entrambe. Costa i
due domini e `createGame.ts` — e D011 ha scoperto che l'unica cosa che rende quella scelta sicura è
un test: passare al bootstrap un `Ledger` diverso da quello del contesto lasciava **quaranta test
verdi**. Adesso non più.

La nona e la decima sono **in vigore da D014**. Costano il dominio e i suoi test — poco, ma non più
zero. La nona è quella che cambia una forma del progetto: `atm` è il primo dominio senza
`system.ts`, e il bootstrap di D011 lo conferma con una riga di `register` invece di due.

L'undicesima e la dodicesima sono di **D011**, e costano il renderer e i suoi test.

La tredicesima, la quattordicesima, la quindicesima e la sedicesima sono di **D012**. Costano il
dizionario, il guscio e le schermate — e D015 le ha ereditate senza contestarne nessuna: le chiavi
piatte hanno retto una decina di chiavi nuove, i mirror hanno retto i selettori del bancomat.

Le cinque righe che portano **D015** costano la home. Due riguardano cosa il gioco **non** mostra —
i tre numeri del retro della carta e il sesto riquadro — e sono le meno costose da cambiare: i dati
arriveranno, e i posti sono lì ad aspettarli. La terza è un numero di gioco travestito da
interfaccia. La quarta torna sul tavolo a ogni componente nuovo, ed è giusto così.

| Cosa                                                                                                 | ADR                                                                                                                       | Alternativa scartata                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ogni transazione somma a zero (partita doppia)                                                       | [0020](../adr/0020-partita-doppia.md)                                                                                     | movimenti singoli con categoria                                                                                                                                                                                                                                |
| Il Ledger espone transazioni, non movimenti                                                          | [0019](../adr/0019-transazioni-atomiche-nel-ledger.md)                                                                    | due `post()` con rollback nel chiamante                                                                                                                                                                                                                        |
| I pool dichiarano le proprie affordance come dati                                                    | [0017](../adr/0017-il-denaro-e-plurale.md)                                                                                | un saldo unico con etichette nella UI                                                                                                                                                                                                                          |
| `post()` non esiste: una primitiva sola                                                              | [0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)                                                                   | zucchero a due movimenti, che però rimette `world` e `sink` nei domini                                                                                                                                                                                         |
| Il Ledger avrà conti dinamici, non solo sei pool                                                     | [0022](../adr/0022-il-ledger-ha-conti-non-solo-pool.md)                                                                   | il budget di un'attività tenuto come stato del dominio                                                                                                                                                                                                         |
| Il tempo di gioco è un dominio, non il kernel                                                        | [0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                                                          | un `now` nel `SystemContext`, che aggiunge una chiave al salvataggio                                                                                                                                                                                           |
| I tipi d'esito del salvataggio stanno in `contracts/save.ts`                                         | [D009](D009-persistenza-main.md#il-contratto-cresce) — non ha un ADR: è una conseguenza di INV-03, non una decisione a sé | allargare INV-03 a tutto `contracts/`, cioè un allowlist di un file che diventa un denylist da mantenere                                                                                                                                                       |
| Un sistema riceve per costruzione ciò che il contesto non porta                                      | [0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)                                     | un singleton in `balance/`: nessun parametro in più, e una dipendenza che sparisce dalle firme                                                                                                                                                                 |
| Un dominio senza stato non ha un `system.ts` e non si registra                                       | [D014](D014-dominio-bancomat.md) — decisione 1                                                                            | inventargli uno stato per riempire il file: un contatore che nessuna schermata mostra, più una migrazione il giorno in cui la forma giusta si vede                                                                                                             |
| La commissione del bancomat è un importo fisso, non una percentuale                                  | [D014](D014-dominio-bancomat.md) — decisione 2                                                                            | una percentuale, che però non produce **mai** il caso "commissione superiore all'importo" — e quel caso è metà del valore della fetta                                                                                                                          |
| D011 produce anche l'ingresso del renderer, non solo i tre file dichiarati                           | [D011](D011-runtime-e-store.md) — correzione 6                                                                            | lasciare `verify:release` rosso fino a D012, e chiudere D011 senza aver mai eseguito il proprio loop                                                                                                                                                           |
| Se il salvataggio finale fallisce, la finestra **non** si chiude                                     | [D011](D011-runtime-e-store.md) — correzione 13                                                                           | chiudere comunque: comodo, e perde l'unica copia esistente della partita                                                                                                                                                                                       |
| Il saldo della home mostra i **due pool del giocatore**, non una cifra sola                          | [D012](D012-ui-e-i18n.md) — correzione 7                                                                                  | la cifra sola del mockup, sotto cui il messaggio «ti servono 800,00 €, ne hai 0,00 €» è incomprensibile                                                                                                                                                        |
| Le chiavi i18n sono **piatte**, non una gerarchia di oggetti                                         | [D012](D012-ui-e-i18n.md) — correzione 9                                                                                  | l'annidamento, in cui `atm.withdraw.title` prende il posto di `atm.withdraw` senza che nulla lo dica                                                                                                                                                           |
| La navigazione è un `ref`, non un router                                                             | [D012](D012-ui-e-i18n.md) — [registro YAGNI](../roadmap-fette.md)                                                         | `vue-router`: una dipendenza, quindi un ADR (ADR 0015), per due destinazioni senza indirizzo                                                                                                                                                                   |
| jsdom resta fuori: le verifiche a occhio diventano test per un'altra strada                          | [D012](D012-ui-e-i18n.md) — correzione 15                                                                                 | `jsdom` + `@vue/test-utils`, cioè due dipendenze e un ADR, per montare componenti che la definizione di fatto non chiede di montare                                                                                                                            |
| Il cruscotto ha **cinque** riquadri, non sei: il tetto è un tetto                                    | [D015](D015-home-bancomat.md) — correzione 1                                                                              | riempire il sesto posto con un numero inventato, che è anche il posto che la fetta 02 userà davvero                                                                                                                                                            |
| Il retro della carta porta le affordance del pool, non tre numeri finti                              | [D015](D015-home-bancomat.md) — correzione 3                                                                              | plafond, limite e punteggio di credito come li disegna il mockup: dati che nella fetta 01 non esistono                                                                                                                                                         |
| L'importo si sceglie fra quattro, e il più piccolo è rifiutato apposta                               | [D015](D015-home-bancomat.md) — correzione 5                                                                              | un campo di testo, che apre il confine «chi trasforma una stringa digitata in `Money`» e cosa succede quando non è un numero                                                                                                                                   |
| jsdom resta fuori una **seconda** volta: si estrae invece di montare                                 | [D015](D015-home-bancomat.md) — correzione 13                                                                             | tirare il grilletto che il registro YAGNI aveva scritto: due dipendenze e un ADR per provare quattro funzioni pure                                                                                                                                             |
| Le righe di una transazione hanno il segno: nasce `signedMoney`                                      | [D015](D015-home-bancomat.md) — correzione 10                                                                             | un formato solo: «497,50» in un elenco di movimenti non dice da che parte va il denaro                                                                                                                                                                         |
| `doc-links` guarda anche il `README.md` della radice, non solo `docs/`                               | [D013](D013-verifica-della-fetta.md) — correzione 7                                                                       | lasciarlo scoperto perché «non è un documento di `docs/`»: sarebbe l'unico del progetto con i collegamenti liberi di marcire, e l'unico che un estraneo legge per primo                                                                                        |
| Il listino sta nell'**azione**, non in una tabella globale in `balance/`                             | [ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)                                               | una regola sola per tutti — coerente per costruzione, e per questo sbagliata: il black market sconta i contanti, l'immobiliare li penalizza                                                                                                                    |
| Il **selettore** del pagamento è di D017, non di D019                                                | [D019](D019-il-pagamento.md) — _Il selettore vero è di D017_                                                              | costruirlo in D019, dove nessuna azione accetta due strumenti: sarebbe provato solo contro un listino finto                                                                                                                                                    |
| `heat` e `convertibleTo` restano fuori dal listino, con il grilletto scritto                         | [ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) — alternative scartate                        | dichiararli subito: un campo che nessuno legge per tre fette, e un grafo di conversioni per un arco solo                                                                                                                                                       |
| La validazione dello stato salvato è un **test**, non un tipo né un aiutante                         | [D020](D020-nessun-sistema-si-fida-del-salvataggio.md)                                                                    | `defineSystem` che chiede un validatore: garantisce che il campo esista, non che funzioni — e cambia il kernel per una regola che il kernel non deve conoscere                                                                                                 |
| D019 e D020 vanno **prima** di D017, non dentro                                                      | [README](README.md) — il grafo                                                                                            | infilarle nel caveau: la regola sarebbe scritta dalla stessa persona che scrive il codice da sorvegliare, nello stesso momento                                                                                                                                 |
| Un pool fuori listino è rifiutato col codice del Ledger, non con uno nuovo                           | [D019](D019-il-pagamento.md) — correzione 3                                                                               | un `error.income.*` suo: due frasi per una situazione sola, e il giocatore ne leggerebbe una diversa a seconda di quale delle due strade lo rifiuta                                                                                                            |
| Il prezzo resta sul pulsante; la riga sopra porta strumento e ragione                                | [D019](D019-il-pagamento.md) — correzione 8                                                                               | l'importo nel riquadro del pagamento e «Compra» nudo: toglie la ripetizione e contraddice il mockup approvato allo STOP 1                                                                                                                                      |
| Con un'opzione sola il pagamento è **una** chiave i18n, non due                                      | [D019](D019-il-pagamento.md) — correzione 9                                                                               | le due che l'ADR 0027 prevedeva — _con cosa si paga_ e _perché non gli altri_ — che con un listino di uno sono la stessa frase                                                                                                                                 |
| Il caveau ha **cinque** livelli, da 1.000,00 € a 250.000,00 €                                        | [D017](D017-il-caveau.md) — `balance/constants.ts`                                                                        | una curva senza tetto che si strozza da sola: in un idle «costa più di quanto renda» è un bersaglio mobile, da ritarare a ogni cambio di reddito                                                                                                               |
| Lo sconto della carta è **sotto** la commissione del bancomat                                        | [D017](D017-il-caveau.md) — `targets.ts`, `vault_card_discount`                                                           | uno sconto più grande: senza il calore la carta non paga niente in cambio della traccia, e i contanti diventerebbero una voce di listino che nessuno sceglie mai                                                                                               |
| Il Ledger **espone** la funzione delle capienze, non la riceve soltanto                              | [D017](D017-il-caveau.md) — correzione 5                                                                                  | lasciarla solo in ingresso: INV-18 tornerebbe un confronto fra due numeri che oggi coincidono, che è la forma debole che la definizione di fatto vieta                                                                                                         |
| Il reddito riceve lo **spazio** per costruzione, non importa il caveau                               | [D017](D017-il-caveau.md) — correzione 3                                                                                  | `income` che importa `vault/rules`: nessun gate lo fermerebbe, e sarebbe il primo accoppiamento fra domini in un gioco che ne ha diciassette                                                                                                                   |
| Il caveau sta in `ORDER.ECONOMY`, e non apre una fase nuova                                          | [D017](D017-il-caveau.md) — correzione 9                                                                                  | una terza fase per un sistema che non ticchetta; e l'ordine conta davvero in un punto — `ECONOMY` carica prima di `INCOME`, cioè prima che il recupero ticchetti                                                                                               |
| Quanto resta fuori dal tick è un **importo**, non un `sì/no`                                         | [D017](D017-il-caveau.md) — correzione 7                                                                                  | un booleano: farebbe sparire il caveau **quasi** pieno, che è il caso che il giocatore incontra per primo                                                                                                                                                      |
| «Nessun dominio importa un altro dominio» diventa un test, non una nota                              | [D018](D018-la-scheda-di-dominio.md) — correzione 1                                                                       | dichiararla 👤 di review: costa zero e lascia in piedi l'unica riga della metà kernel che promette più di quanto mantiene                                                                                                                                      |
| Il canvas del design entra nella repo, formattato da Prettier                                        | [D018](D018-la-scheda-di-dominio.md) — `docs/design/mockups/`                                                             | tenerlo fuori: nessun agente lo troverebbe, e i documenti dovrebbero portare un percorso della scrivania di qualcuno                                                                                                                                           |
| La serie del patrimonio netto sta in **memoria**, non nel salvataggio                                | [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md) — decisione 1                                                    | un dominio nuovo che la salva, e con lui l'ADR 0010 ad `Accettata`: senza il calendario dell'ADR 0023 un campione non sa quando è stato preso, quindi due barre affiancate possono distare un tick o otto ore                                                  |
| L'asse del grafico **non parte da zero**: la finestra si adatta alla serie                           | [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md) — decisione 3                                                    | l'asse ancorato a zero, che è la verità più stretta e diventa illeggibile presto: misurato, a 100.000,00 € due minuti e mezzo di gioco valgono 2 pixel su 120                                                                                                  |
| Il grilletto del router **non** è scattato: la gerarchia è nella colonna                             | [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md) — _La decisione aperta_                                       | dichiararlo scattato e aprire una delega per `vue-router`: una dipendenza e un ADR per cinque destinazioni piatte, nessuna raggiungibile da fuori, nessuna con uno stato nell'URL, nessuna dentro un'altra                                                     |
| Il frame si riprogramma **prima** di `onStep`, non dentro un `finally`                               | [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md) — correzione 1                                                | il `try`/`finally` che la delega prescriveva: chiude il lancio e lascia in piedi lo `stop()` chiamato da dentro `onStep`, che si vedrebbe riprogrammare il frame subito dopo l'annullamento                                                                    |
| I due strumenti hanno **due grafici a candele**, non uno a candele e uno a linea                     | [D034](D034-le-serie-degli-strumenti.md) — decisione 1                                                                    | il grafico su misura per ciascuno: `StatTile` è già lo stesso pezzo montato cinque volte nello stesso cruscotto, e un secondo componente per disegnare la stessa cosa è la duplicazione che D033 ha appena tolto                                               |
| Il patrimonio netto passa **da barre ad area**, e la linea è dritta                                  | [D034](D034-le-serie-degli-strumenti.md) — decisione 2                                                                    | le barre del canvas: il grafico è nato dopo di lui, e adesso non è più solo sulla pagina — tre serie di rettangoli affiancati direbbero che le tre cose sono la stessa                                                                                         |
| Il guscio dei grafici esce in `ChartPanel.vue`, le **opzioni** restano nei due componenti            | il guscio condiviso dei due grafici — 2026-08-23                                                                          | un `chart.ts` con le opzioni comuni: ogni opzione porta accanto il commento che dice perché è quella, e spanderle da un `baseOptions()` separerebbe la decisione dalla sua ragione                                                                             |
| Il ciclo di vita esce in una **funzione** (`apex.ts`), non in un componente che riceve `ApexOptions` | il guscio condiviso dei due grafici — 2026-08-23                                                                          | un `<ChartPanel :options>`: dentro quell'oggetto c'è `height`, quindi sarebbe un contenitore per il criterio dell'ADR 0030 — e sarebbe `vue3-apexcharts` riscritto in casa                                                                                     |
| La bolla a candele porta una **classe nostra**, e da lì R23 è esatta invece che parziale             | il guscio condiviso dei due grafici — 2026-08-23                                                                          | lasciarle i selettori della libreria e accettare un gate ⚠️ parziale: è cambiare l'HTML reso per rendere verificabile una regola, ed è lecito chiedersi se valga                                                                                               |
| Il respiro dell'asse è in **pixel** e non in denaro: la finestra è la serie e basta                  | l'asse sotto zero — 2026-08-23                                                                                            | il pavimento a zero, che è stato scritto per primo e poi tolto: toglie l'assurdo e lascia la bugia, perché i due numeri restano i bordi di un margine invece che due campioni. Oppure ancorare l'asse a zero, che l'ADR di D027 ha già scartato con una misura |
| Il flusso del pagamento è una **finestra modale**, non un menù contestuale                           | [D036](D036-il-pagamento-e-un-flusso-solo.md) — decisione 1                                                               | `UiPopover` con `on="press"`, che esiste già e costerebbe zero: non è modale — il gioco resta cliccabile dietro — e non regge un listino, una carta da girare e un campo                                                                                       |
| Il permesso di pagare è un'affordance del **pool** (`bearer`), non dell'azione                       | [D036](D036-il-pagamento-e-un-flusso-solo.md) — decisione 2                                                               | una proprietà del listino, o un `if (pool === 'card')` dentro il flusso: centralizza il disegno e sparge la regola, che è ciò che l'ADR 0017 vieta                                                                                                             |
| Il flusso si apre **anche** con un listino di una voce sola                                          | [D036](D036-il-pagamento-e-un-flusso-solo.md) — decisione 3                                                               | saltarlo e confermare al volo: risparmia un clic e rimette il caso speciale che l'ADR 0027 ha già tolto, più il posto dove stanno la ragione e la prova                                                                                                        |
| Il numero della carta passa il controllo di **Luhn**                                                 | [D036](D036-il-pagamento-e-un-flusso-solo.md) — decisione 4                                                               | sedici cifre estratte e basta: costa otto righe in meno e lascia «il numero è vero» senza niente che lo sostenga. Quello di oggi non lo passa, e la somma fa 53                                                                                                |
| Il bancomat **non** chiede il codice della carta                                                     | [D036](D036-il-pagamento-e-un-flusso-solo.md) — decisione 5                                                               | chiederlo anche lì, che è più uniforme: prelevare non ha una scelta di strumento, ha già la sua cerimonia, ed è l'unico gesto ripetuto del gioco                                                                                                               |
| `BankCard3d` **resta** in `components/atm/`, e `payment/` la importa                                 | [D036](D036-il-pagamento-e-un-flusso-solo.md) — decisione 6                                                               | spostarla, o duplicarne una versione ridotta dentro la finestra: la prima è un `git mv` per una purezza che nessuna regola esprime, la seconda è la duplicazione che questa delega esiste per togliere                                                         |
| La cronaca vive in `runtime/` e non in `core/kernel/` né come sistema registrato                     | [D037](D037-il-tempo-che-avanza-e-un-operazione-del-gioco.md) — decisione 1                                               | un sistema registrato: la forma più pura secondo l'ADR 0002, e costa una terza forma di sistema nel Registry — ticchetta e si azzera ma non si salva, che oggi il tipo esclude                                                                                 |
| `Game.advance` compone a mano, invece di far ticchettare la cronaca dentro `tickAll`                 | [D037](D037-il-tempo-che-avanza-e-un-operazione-del-gioco.md) — decisione 2                                               | il Registry che itera anche le registrazioni: una lista sola davvero, e il kernel imparerebbe cosa sia una serie                                                                                                                                               |
| `netWorthOf` entra in `contracts/ledger.ts` invece di restare una somma dello store                  | [D037](D037-il-tempo-che-avanza-e-un-operazione-del-gioco.md) — decisione 3                                               | lasciare due somme: quella dello store e quella della registrazione, che oggi rispondono uguale e un giorno no                                                                                                                                                 |
| La cronaca si iscrive **da sé** al Bus, invece di farsi svegliare da chi la possiede                 | [D037](D037-il-tempo-che-avanza-e-un-operazione-del-gioco.md) — decisione 4                                               | una riga nell'handler dello store: più visibile, e di nuovo una cosa da ricordarsi — cioè il difetto che la delega chiude                                                                                                                                      |
| `Chronicle.reset()` non riceve lo `scope`, perché `soft` e `hard` farebbero la stessa cosa           | [D037](D037-il-tempo-che-avanza-e-un-operazione-del-gioco.md) — decisione 5                                               | accettarlo e ignorarlo, cioè una differenza dichiarata e non mantenuta                                                                                                                                                                                         |

La ventiduesima è di **D013** e costa una riga di un test: è anche l'unica riga non di test che
quella delega abbia toccato.

**Le cinque righe del 2026-08-20 — quelle di [D019](D019-il-pagamento.md) e
[D020](D020-nessun-sistema-si-fida-del-salvataggio.md) — e tre di loro sono entrate in vigore con D019.** Il listino dentro l'azione, il selettore rimandato a D017, il calore e `convertibleTo` lasciati fuori: adesso costano `contracts/payment.ts`, il dominio `income`, lo store e un componente — poco, ma non più zero. Le altre due, quelle di D020, sono entrate in vigore con [D020](D020-nessun-sistema-si-fida-del-salvataggio.md) e non costano quasi niente lo stesso: la validazione come **test** costa un file di `tests/rules/` e zero righe di `src/` — contestarla vuol dire cancellare quel file, non disfare il kernel — e l'ordine «prima di D017, non dentro» è ormai speso, perché D017 le trova entrambe già fatte. Nascono tutte dalle due domande poste prima di eseguire D017 — come si sceglie con cosa si paga, e chi controlla lo stato che arriva dal disco. Le scelte **di gioco** di quelle sessioni non sono qui perché non sono state prese in autonomia: lo spazio unico del caveau, il tetto a livelli finiti, la varianza zero e la nona voce dell'etichetta sono state decise dall'utente, e stanno nella [scheda del caveau](../design/domini/vault.md) con le alternative scartate.

**Le sei righe in fondo sono di [D017](D017-il-caveau.md)**, e sono quelle che chiudono la fetta 02:
i cinque livelli del caveau, lo sconto della carta sotto la commissione, la funzione delle capienze
esposta invece che solo ricevuta, lo spazio passato al reddito per costruzione, il caveau in
`ORDER.ECONOMY`, e l'importo — non il `sì/no` — che resta fuori dal tick. Costano il dominio, il
Ledger e i loro test. **D024, D025 e D026 non ne hanno aggiunte**: le loro scelte in autonomia sono
diventate ADR — 0030, 0031, 0032 e 0033 — e un ADR è già il posto dove una decisione si contesta.
Le due di D026 stanno nella tabella _Decisioni prese in autonomia_ dell'[indice ADR](../adr/README.md),
e sono la prima riga di quella tabella che nasce già **in vigore**.

**Le due righe di [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md)**, e sono
le prime del progetto prese su una **direttiva generale** invece che su una domanda: l'utente ha
risposto «segui le tue raccomandazioni» a tutte e due le decisioni della delega, e questa pagina
dice che in quel caso si decide e si marca. Costano lo store, un componente e una funzione pura, e
la seconda ha un numero dietro invece di un'opinione — l'escursione del grafico misurata a quattro
livelli di patrimonio, che sta nella delega. La scelta della **libreria** invece non è qui: è
diventata l'[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md), e un ADR è già il posto dove una
decisione si contesta.

**Le due righe di [D018](D018-la-scheda-di-dominio.md) non sono diventate un ADR, e la differenza è
di specie.** La prima — la regola sui domini scritta come test invece che dichiarata di review — è
in vigore da subito e costa un file di `tests/rules/` e una riga in
[tracciabilita.md](../tracciabilita.md): contestarla vuol dire cancellare quel file, non disfare
niente. Non è un ADR perché non decide **cosa** il progetto fa: decide che una cosa già decisa venga
imposta, ed è la stessa forma della validazione-come-test di
[D020](D020-nessun-sistema-si-fida-del-salvataggio.md).

La seconda è più piccola e ha un prezzo misurato: il canvas nella repo costa circa **0,8 s** di
`format:check` ogni volta che qualcuno esegue `verify`, e il numero sta in
[qualita.md](../qualita.md) con la data accanto invece che in questa riga. È la prima decisione del
progetto in cui il costo di un documento si paga in un gate.

**Le due righe di [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md)** sono le seconde del
progetto prese su una **direttiva generale** — «seguo le tue raccomandazioni» — dopo quelle di D027,
e questa pagina dice che in quel caso si decide e si marca. La prima non costa ancora niente:
nessuna riga di codice la applica, e contestarla vuol dire riaprire una voce del registro YAGNI. La
seconda costa `runtime/loop.ts` e i suoi test, ed è l'unica del progetto che **contraddica la delega
che la conteneva** — la ragione sta nella correzione 1 di D035, ed è una misura invece di
un'opinione: c'è un test che vede rosso lo `stop()` chiamato da dentro `onStep`, sia con il codice
di prima sia con il `finally` che la delega prescriveva.

**Le sei righe di [D036](D036-il-pagamento-e-un-flusso-solo.md)** sono le terze prese su una
**direttiva generale**, dopo quelle di D027 e di D035, e sono le prime prese **scrivendo** una
delega invece che eseguendola: oggi non costano una riga di codice, e contestarle vuol dire
riscrivere una delega aperta invece di disfare qualcosa. Due meritano di essere guardate per prime.
La seconda — il permesso come affordance del pool — è quella che decide se fra tre domini il
pagamento resta un flusso solo o torna a essere un `if`, ed è l'unica delle sei che tocchi
`contracts/`. La quarta ha un numero dietro invece di un'opinione: il numero stampato oggi sulla
carta non passa il controllo di Luhn, e la somma fa 53 — misurata, non dedotta.

**Le cinque righe di [D037](D037-il-tempo-che-avanza-e-un-operazione-del-gioco.md)** sono le quarte
prese su una **direttiva generale**, dopo quelle di D027, D035 e D036, e sono le prime prese su una
domanda che l'utente ha **rilanciato** invece di rimandare: «questa cosa è specifica solo per i
grafici o riutilizzabile?». La risposta ha cambiato il disegno — la cronaca è diventata dichiarativa
invece di avere tre campi cablati — ed è la ragione per cui la prima riga è quella da guardare per
prima. Costano `runtime/chronicle.ts`, `Game.advance` e i loro test; contestarne una vuol dire
spostare un file e cambiare due firme, non disfare del comportamento.

Sono contestabili anche i **numeri**: i 30 secondi di `AUTOSAVE_SECONDS` scelti da D041 — derivati dall'acquisto più economico del gioco al reddito massimo, e la derivazione sta accanto alla costante —
il moltiplicatore ×1,5 dell'upgrade, le otto ore di tetto al
recupero e l'intervallo 700–740 del primo minuto scelti da D008, più i 2,50 € di `ATM_FEE_FLOOR` scelti
da D014, e i quattro importi rapidi del bancomat — 1 · 10 · 100 · 500 — scelti da D015. Sono di
un'altra categoria: cambiarli costa una riga in `balance/constants.ts` e un test che diventa rosso
apposta. Reddito base e costo dell'upgrade vengono invece dai
[mockup](../design/mockups/), quindi erano già approvati.

## Prompt pronto per una sessione nuova

**Non c'è niente da fondere in `main` che l'utente non abbia deciso, e c'è una delega da eseguire:
[D044](D044-il-reddito-e-un-elenco-di-fonti.md), sul ramo che porta il suo nome.** Quante ne restino
aperte lo dice [stato.md](../stato.md), che le conta.

```
C'e' una delega da ESEGUIRE: docs/delega/D044-il-reddito-e-un-elenco-di-fonti.md.
E' `Aperta`, e' completa, e il suo ramo esiste gia' con dentro solo documenti.

Prima pero' si controlla che il punto di partenza sia quello che il passaggio di
consegne dichiara, perche' un handoff si verifica invece di crederci — e il
primo comando non basta senza il fetch, che e' la lezione del 2026-08-24:

  git fetch --all --prune
  git branch                              # d044-... esiste ed e' SOLO locale
  git log --oneline main..d044-il-reddito-e-un-elenco-di-fonti   # un commit
  git status                              # deve essere pulito
  npm run verify                          # verde, 1.343 test

Se non torna, vale la realta' e non il documento.

SI LEGGE IN QUEST'ORDINE, ed e' corto:
  1. docs/design/domini/income.md — la scheda ricompilata. Dichiara in testa che
     descrive un dominio che NON ESISTE ANCORA: e' un vincolo, non una foto.
     Va RILETTA CONTRO src/ dopo l'esecuzione, e le righe che il codice smentisce
     vanno corrette — e' successo alla scheda del caveau, che ne ha smentite tre.
  2. docs/adr/0053-un-miglioramento-dichiara-il-tempo-in-cui-rientra.md
  3. docs/delega/D044-il-reddito-e-un-elenco-di-fonti.md — le istruzioni

LA FORMA DA COPIARE E' IL CAVEAU DI D042, non il reddito di oggi.
src/core/domains/vault/rules.ts ha gia' tutto: la scala calcolata una volta
all'avvio del modulo, il livello stretto fra zero e il massimo, il listino che
diventa VUOTO in cima invece di rispondere con un ramo. E `accepts` generato dal
listino PER LIVELLO sta in vault/system.ts, funzione `paymentFor`.

TRE TRAPPOLE CHE COSTANO CARO, e stanno tutte scritte nella delega:
- il tick raggruppa per REGIME, non per pool. Due regimi sullo stesso pool
  avrebbero trattenute diverse, e scalare la trattenuta sul parziale vuol dire
  una divisione fra Decimal — cioe' precisione persa e INV-08 rotta in silenzio
- lo spazio del caveau si chiede PRIMA DI OGNI transazione, non una volta per
  tick: se due regimi atterrano nello stesso pool, il primo ne ha gia' consumato
- INITIAL deve avere una voce per OGNI fonte. Un `levels` parziale da'
  `undefined`, e yieldAt ci costruisce sopra un importo non finito che il Ledger
  scopre molto piu' a valle

IL BERSAGLIO CHE NON DEVE DIVENTARE ROSSO e' income_per_minute_at_start: la
partita si apre identica a oggi, 12,00 EUR/s con i lavoretti chiusi. Se diventa
rosso non e' il bersaglio a essere invecchiato — e' la partita che non si apre
piu' come prima.

IL PUNTO 9 C'E' DALL'INIZIO, ed e' quello che a D043 mancava: guardare la pagina
nella finestra vera. Lo strumento e' scripts/cdp.mjs (D039). Se dice «Electron
uninstall», il binario si scarica con `node -e "require('electron')"` — NON con
install.js, che e' obsoleto dalla versione 42. E da D041 il gioco SCRIVE DA SE'
ogni trenta secondi: si usa --user-data-dir su una cartella usa-e-getta, o si
sovrascrive il salvataggio dell'utente senza chiudere niente.

Nello stesso giro conviene chiudere anche il punto 9 di D042 (la pagina del
caveau) e di D043 (il pannello del regime): una finestra, tre pagine.

Tre regole per qualunque schermata nuova, da D038: un pulsante si scrive
`<UiButton>` e non `<button>` (R26), un'area che scorre si scrive `<UiScroll>`
(R27), e un'icona si aggiunge con una riga in ui/icons.ts piu'
`npx vitest run tests/rules/icons -u` (R28). Sono rosse prima che qualcuno se ne
accorga a occhio, quindi non c'e' niente da ricordare.

E se apri o chiudi una delega, o aggiungi un ADR, docs/stato.md va rigenerato:
`npx vitest run tests/rules/project-state -u`. Quel file non si scrive a mano.
```

I prompt delle deleghe già consegnate stanno nel `git log` di questo file: si recuperano da lì
invece di tenerli tutti in vita, che è la stessa ragione per cui i numeri stanno in un posto solo.
Questa riga li elencava per nome, ed era un elenco che invecchiava a ogni delega consegnata.

**Dopo D044 il lavoro torna di specie diversa: si scrive**, ed è la prima delega della fetta 04. Il
materiale c'è tutto e non va inventato:

- il [registro delle fette](../roadmap-fette.md) dice cosa viene dopo e in che ordine: la **fetta
  04** è il calore e il black market, e la riga dice cosa quella fetta deve dimostrare del kernel —
  il primo sistema che **ascolta** invece di importare, e il primo consumatore reale dell'Rng con
  stream separati;
- il [registro YAGNI](../roadmap-fette.md) ha i grilletti già scritti, e si guarda **quali sono
  scattati** invece di decidere a sentimento cosa costruire. Le due voci che avevano la fetta 03 per
  grilletto sono state obbedite tutte e due — i tick scartati dal tetto (D040) e il salvataggio a
  intervalli (D041) — e restano barrate invece di sparire, perché la lezione è in quello che
  dicevano;
- la [scheda di dominio](../design/domini/README.md) **serve, e stavolta è il punto**: la fetta 04
  porta un dominio nuovo, il calore, e un dominio nuovo compila la sua scheda prima che qualcuno ne
  scriva una riga. Sarà la **quarta** compilata, cioè quella su cui la forma della scheda va rivista:
  due sezioni non discriminano ancora, e con tre casi non si poteva sapere se fosse un difetto della
  forma o del campione.

Una delega di questo progetto si riconosce dalla forma: dipendenze, ADR vincolanti, budget dichiarato
per **ogni** ramo che le decisioni aperte producono, _Da produrre_, _Invarianti_, _Fuori scope_,
_Definizione di fatto_ e _Trappole note_. Quelle già scritte servono da modello — quante siano lo
dice [stato.md](../stato.md), e questa riga ne ha dichiarate ventisette per due deleghe di fila —
e due sono da leggere per ragioni diverse: [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md)
per come si scrive una delega che porta decisioni **non** ancora prese, e
[D016](D016-correzioni-audit.md) per come si scrive una delega che raccoglie i reperti di un audit
sotto le loro radici invece che in un elenco.

**Una cosa che vale la pena sapere prima di scriverne una nuova**, ed è la lezione di D027: il budget
va dichiarato per ramo, e i rami vanno **contati**. D027 ne dichiarava uno su quattro e prometteva
che gli altri tre si sarebbero stimati dopo le decisioni; quel dopo non è mai arrivato, e il ramo
consegnato è finito senza un metro contro cui misurarsi. Non è un difetto grave — è la forma in cui
un budget smette di servire.

### E dopo, la fetta 03

La fetta 03 è il **progresso offline**, e la sua domanda non è quella che il nome suggerisce: non
chiede «di quanto alziamo il tetto», chiede **«cosa vuol dire offline quando il mondo va avanti
anche contro di te»**. I problemi che la portano lì — il tetto limitato dal caveau invece che da sé
stesso, le ore reali contro un giorno di gioco che dura due secondi, e il recupero che avanza in un
passo solo — stanno misurati sotto la riga della fetta nel [registro](../roadmap-fette.md), e sono
usciti rileggendo il kernel **dopo** aver riscritto la visione. Dove sta oggi quel codice è scritto
in _Il prossimo passo_, qui sopra.

**La prima delega è chiusa**, ed è [D040](D040-il-recupero-avanza-a-blocchi.md): due dei tre
problemi non ci sono più, e il terzo è cambiato di natura invece di essere risolto — con il tetto a
un anno di gioco a mordere è il **tetto**, non più il caveau, che è ciò che un tetto deve fare.

**Una cosa che il registro non dice, e che spiega perché non era una toppa:** il singolo `advance`
aveva **già** costretto un compenso nel codice. Il `tick` del reddito non chiede al Ledger e incassa
il rifiuto — calcola prima quanto ci sta — e il suo commento dice che la ragione è «il recupero, che
è un solo `advance` con tutti i tick arretrati». Con i blocchi quella pressione si è abbassata, e il
ramo **resta** perché serve al tempo reale: D040 ha tolto il motivo che lo rendeva indispensabile,
non il meccanismo.

**Il salvataggio a intervalli è la seconda delega della fetta.** Il registro dice che è «lo stesso
problema» del progresso offline, ed è vero nel meccanismo — tutti e due vogliono che qualcosa
succeda ogni N tick sulla via unica — ma sono due rischi diversi, la correttezza della simulazione e
la durabilità del dato. Costruirli insieme darebbe un verde solo per due cose, e non si saprebbe
quale ha funzionato.

**Non porta un dominio nuovo, quindi non comincia da una scheda compilata.** La scheda resta il modo
in cui comincia un **dominio**, ed è la differenza che [D018](D018-la-scheda-di-dominio.md) è
servita a fare: il modulo sta in [design/domini/README.md](../design/domini/README.md), un dominio
nuovo lo compila **prima** che qualcuno ne scriva una riga, e la sua forma va rivista alla
**quarta** compilata — che sarà quella del blocco A, non questa. Due sezioni oggi non discriminano,
e con tre casi non si può sapere se sia un difetto della forma o il campione.
