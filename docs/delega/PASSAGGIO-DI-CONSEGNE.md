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

|                          |                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| STOP 1                   | **approvato** — nome, stile, dipendenze, architettura                                                                               |
| D001 — tooling e gate    | **chiusa**, commit `e275f59`                                                                                                        |
| D002 — contratti         | **chiusa**, commit `288367e`                                                                                                        |
| D003 — kernel: Clock     | **chiusa**, commit `f398a47`                                                                                                        |
| D004 — kernel: Rng       | **chiusa**, commit `a87d8cf`                                                                                                        |
| D005 — kernel: Bus       | **chiusa**, commit `e9cf441`                                                                                                        |
| D006 — kernel: Registry  | **chiusa**, commit `39b8520`                                                                                                        |
| D007 — kernel: Ledger    | **chiusa**, commit `f9a0c59`                                                                                                        |
| D008 — balance           | **chiusa**, commit `e01e885`                                                                                                        |
| D009 — persistenza main  | **chiusa**, commit `256f622`                                                                                                        |
| D010 — dominio income    | **chiusa**, commit `b98f025`                                                                                                        |
| D014 — dominio bancomat  | **chiusa**, commit `a0b3b9f`                                                                                                        |
| D011 — runtime e store   | **chiusa**, commit `dbf821c`                                                                                                        |
| D012 — guscio e parole   | **chiusa**, commit `fb45d71`                                                                                                        |
| D015 — home e bancomat   | **chiusa**, commit `3aa3460`                                                                                                        |
| D016 — correzioni audit  | **chiusa**, commit `c648639`, unita a `main` da D013                                                                                |
| D013 — verifica, STOP 2  | **chiusa**, commit `c5d534c`                                                                                                        |
| D019 — il pagamento      | **aperta** — scritta il 2026-08-20, e viene **prima** di D017                                                                       |
| D020 — la validazione    | **aperta** — scritta il 2026-08-20, e viene **prima** di D017                                                                       |
| D017 — il caveau         | **aperta e preparata** — scritta e misurata allo STOP 2, non ancora eseguita                                                        |
| D018 — la scheda dominio | **aperta** — solo documenti, non tocca nessuna delle altre                                                                          |
| Kernel                   | **finito** — 471 righe in `kernel/`, **545 con `balance/`** (D003–D008)                                                             |
| Persistenza nel main     | **finita** — 246 righe in `src/main/` e `src/preload/`                                                                              |
| Codice di dominio        | **`income` 104 righe, `atm` 64** — i due della fetta 01                                                                             |
| Fetta 01                 | **conclusa** — verificata da D013, lo STOP 2, otto passi manuali su otto                                                            |
| Renderer                 | **1.729 righe**, di cui 439 di CSS e 369 sotto `i18n/`                                                                              |
| `npm run verify`         | **verde** — 503 test su 55 file, 41,4 s                                                                                             |
| `npm run verify:release` | **verde** — il renderer compila: 91 moduli, 564,89 kB                                                                               |
| Prossimo passo           | **[D019](D019-il-pagamento.md)** o **[D020](D020-nessun-sistema-si-fida-del-salvataggio.md)** — non si toccano, in qualunque ordine |

I conteggi di riga sono **righe di codice, commenti e righe vuote escluse**, ed è lo stesso metodo
per tutti: la riga che diceva che il kernel «usa un altro metodo» era sbagliata, e a scoprirlo è
stata D013. Il 535 di D008 e il budget di ~500 misurano le **sei deleghe D003–D008**, cioè i cinque
moduli di `kernel/` **più `balance/`**; oggi quell'insieme fa **545**, cresciuto di dieci righe —
sei al Clock per il loop di D011, quattro a `balance/` per il bancomat. La cartella
`src/core/kernel/` da sola fa 471, ed è un numero da non confrontare con ~500: sono due insiemi
diversi, entrambi veri.

I contratti sono in `src/core/contracts/`, Clock, Rng, Bus, Registry e Ledger in
`src/core/kernel/`, i numeri di gioco in `src/core/balance/`, lo schema del salvataggio e i tre
canali IPC in `src/main/save/`, i due domini in `src/core/domains/`. In `src/renderer/` ci sono il
bootstrap, il loop, l'unico store, il guscio `App.vue`, le due viste sotto `views/`, nove pezzi
sotto `components/` — sette componenti e due moduli puri, la rotazione della carta e la scelta dei
movimenti da mostrare — e le parole del gioco sotto `i18n/`. Ogni delega chiusa ha in fondo le
**correzioni** rispetto a com'era scritta: [D002](D002-contratti.md) ne ha sette,
[D003](D003-kernel-clock.md) cinque, [D004](D004-kernel-rng.md) sei,
[D005](D005-kernel-bus.md) cinque, [D006](D006-kernel-registry.md) sei,
[D007](D007-kernel-ledger.md) nove, [D008](D008-balance.md) otto,
[D009](D009-persistenza-main.md) dieci, [D010](D010-dominio-income.md) dieci,
[D014](D014-dominio-bancomat.md) undici, [D011](D011-runtime-e-store.md) quattordici,
[D012](D012-ui-e-i18n.md) e [D015](D015-home-bancomat.md) diciassette,
[D016](D016-correzioni-audit.md) sette. Leggile prima di fidarti del
testo di una delega ancora aperta — alcune di quelle correzioni riguardano proprio deleghe che non
sono ancora state eseguite.

### Cosa vale per qualunque delega, e nessuna lo ripete

Quattro regole che non stanno nel testo di nessuna delega perché valgono per tutte. Sono qui perché
una delega chiusa è un documento storico: nessuno la rilegge.

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

**Non resta aperta nessuna delega.** [D013](D013-verifica-della-fetta.md) è chiusa, la fetta 01 è
conclusa, e il progetto è allo **STOP 2**: la domanda sul tavolo è se la fetta 02 parte e con quale
forma.

Il rapporto dello STOP 2 sta in fondo a quella delega, insieme a undici correzioni. Le quattro cose
che chi arriva adesso deve sapere, e che nessun'altra pagina dice:

1. **Il kernel non è sotto budget: è il 9% sopra**, e va saputo perché la prima risposta di D013
   diceva il contrario. 545 righe contro ~500 per le sei deleghe D003–D008; le 471 di
   `src/core/kernel/` sono un altro insieme, senza `balance/`. Lo sforamento è dichiarato riga per
   riga in [README.md](README.md).
2. **Le ultime operazioni sono sommerse dallo stipendio.** Il reddito emette una transazione per
   tick, dieci al secondo: un deposito resta visibile meno di mezzo secondo sulla home, e il
   registro da venti della schermata Statistiche è tutto stipendio dopo due secondi. Ogni test
   è verde, e a ragione — nessuno di loro guarda lo schermo mentre il tempo passa. È nel
   [registro YAGNI](../roadmap-fette.md) con il grilletto della fetta 02.
3. **Una regola del progetto non ha ancora un meccanismo.** «I file `rules.ts` contengono solo
   funzioni pure» ([convenzioni.md](../convenzioni.md)) è un confine vero, senza ID e senza riga in
   [tracciabilita.md](../tracciabilita.md): la tiene la review, su due file. Il grilletto è il
   terzo `rules.ts`.
4. **Gli ADR `Proposta` sono tre**, non otto: **0022** e **0023** descrivono cose non costruite,
   **0010** ha metà meccanismo. Tutti gli altri sono `Accettata`, e ciascuno ha accanto il rosso
   che l'ha dimostrato.

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
- **I documenti sono di due tipi, e non è un difetto.** Alcuni descrivono ciò che c'è
  (architettura, tracciabilità, glossario); altri **vincolano** ciò che verrà
  ([design/flusso-tick.md](../design/flusso-tick.md), le deleghe aperte). I secondi parlano di
  codice che non esiste ancora, e lo dichiarano in testa. Se ne trovi uno che non lo dichiara, è
  quello il difetto.

Quel primo audit **non** copriva ciò che è cambiato dopo D008. Il secondo — 2026-08-20, tutta la
codebase e tutti i documenti — è quello che ha prodotto [D016](D016-correzioni-audit.md), e la sua
copertura è dichiarata lì. Da lì in poi vale la stessa avvertenza di sempre: quello che è cambiato
dopo, nessuno l'ha ancora guardato.

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

Non serve leggere tutti i 27 ADR. Servono quando stai per contraddirne uno: allora leggi
**quello**, e riparti dalle alternative già scartate invece che da zero.

## Il prossimo passo, in concreto

**Lo STOP 2 è stato riportato, e la fetta 02 ha due deleghe scritte e nessuna eseguita.**
La fetta 01 è conclusa e verificata. Nessuna delle due parte finché l'utente non dà il via.

**Prima [D019 — Il pagamento](D019-il-pagamento.md).** Non c'era, ed è nata da una domanda posta
prima di eseguire il caveau: come sceglie il giocatore con cosa paga? La risposta è che non sceglie
— `income` compra il suo upgrade con il pool scritto nel sorgente — e che
l'[ADR 0017](../adr/0017-il-denaro-e-plurale.md) prometteva il contrario dalla fetta 01. Il caveau
sarebbe stato il **secondo** comando a spendere, cioè l'ultimo momento per rispondere senza
disfare niente. Da lì l'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
e il **listino**: ogni azione dichiara, per ogni strumento che accetta, quanto costa con quello.
Il kernel non cambia di una riga.

**Poi [D017 — Il caveau](D017-il-caveau.md).** È **Aperta** e **preparata per l'esecuzione**: il
costo del cambiamento è stato misurato mettendo davvero una capienza a `POOLS.cash` e guardando
cosa diventa rosso, e la misura ha trovato un difetto nella delega stessa — il recupero dopo
un'assenza incassava **zero** invece di quanto ci sta. La decisione di gioco è stata riscritta
prima che esistesse una riga di codice. Gli otto punti stanno in [D017](D017-il-caveau.md), sotto
_Cosa la preparazione ha verificato_.

Il caveau è anche l'unico dominio con una **[scheda](../design/domini/vault.md)** già compilata, ed
è servita: compilarla ha aggiunto la nona voce all'etichetta della visione — la **tracciabilità**,
che la legge 1 nominava e l'etichetta non misurava.

Il rapporto è in fondo a [D013](D013-verifica-della-fetta.md), nei cinque punti che lo STOP 2
chiede. Non si riparte da zero: si riparte da lì.

Tre cose che chi apre la fetta 02 deve avere in mente prima di scrivere una riga:

1. **A17 comincia adesso.** Il kernel è pagato, tutto sembra facile, e la tentazione è aprire
   cinque domini insieme. È esattamente così che sono nati i ventiquattro sistemi del progetto
   precedente. Una fetta alla volta ([ADR 0014](../adr/0014-una-fetta-verticale-alla-volta.md),
   adesso `Accettata`).
2. **La fetta 02 chiude tre voci che aspettano lei**, e vale la pena saperlo prima di scoprirle
   una alla volta: il primo `boundedList` che entra davvero nel salvataggio — e con esso
   [ADR 0010](../adr/0010-liste-storiche-limitate-alla-definizione.md), che ha metà meccanismo —
   la capienza vera dei pool, che `capacityOf` interroga già senza sapere la risposta, e il
   raggruppamento dello stipendio nelle ultime operazioni.
3. **Il gioco si fa girare senza Electron**, e adesso si sa che è una strada buona: `npm run build`,
   la pagina di `out/renderer/` servita da un server statico, le tre funzioni di `SaveApi` finte al
   posto del preload. In una pagina di browser il loop **gira**, quindi il saldo sale davvero — la
   finestra di Electron in questo ambiente non compone frame, ma non è una proprietà
   dell'ambiente. Il modo esatto è nella nota di chiusura di
   [D013](D013-verifica-della-fetta.md).

`verify` sta a **41,4 s** con 503 test, `verify:release` aggiunge la compilazione. La soglia
dichiarata in [qualita.md](../qualita.md) è il minuto: è il margine più stretto del progetto, e il
rimedio è già censito nel [registro YAGNI](../roadmap-fette.md) — togliere l'avvio ripetuto di
`npm`, non togliere un gate.

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

Ventisette, prese in autonomia. Le prime quattro sono **in vigore** da D007 e sono state usate da due
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

Le cinque che precedono l'ultima sono di **D015**, e costano la home. Due riguardano cosa il gioco **non** mostra —
i tre numeri del retro della carta e il sesto riquadro — e sono le meno costose da cambiare: i dati
arriveranno, e i posti sono lì ad aspettarli. La terza è un numero di gioco travestito da
interfaccia. La quarta torna sul tavolo a ogni componente nuovo, ed è giusto così.

| Cosa                                                                         | ADR                                                                                                                       | Alternativa scartata                                                                                                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ogni transazione somma a zero (partita doppia)                               | [0020](../adr/0020-partita-doppia.md)                                                                                     | movimenti singoli con categoria                                                                                                                                         |
| Il Ledger espone transazioni, non movimenti                                  | [0019](../adr/0019-transazioni-atomiche-nel-ledger.md)                                                                    | due `post()` con rollback nel chiamante                                                                                                                                 |
| I pool dichiarano le proprie affordance come dati                            | [0017](../adr/0017-il-denaro-e-plurale.md)                                                                                | un saldo unico con etichette nella UI                                                                                                                                   |
| `post()` non esiste: una primitiva sola                                      | [0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)                                                                   | zucchero a due movimenti, che però rimette `world` e `sink` nei domini                                                                                                  |
| Il Ledger avrà conti dinamici, non solo sei pool                             | [0022](../adr/0022-il-ledger-ha-conti-non-solo-pool.md)                                                                   | il budget di un'attività tenuto come stato del dominio                                                                                                                  |
| Il tempo di gioco è un dominio, non il kernel                                | [0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                                                          | un `now` nel `SystemContext`, che aggiunge una chiave al salvataggio                                                                                                    |
| I tipi d'esito del salvataggio stanno in `contracts/save.ts`                 | [D009](D009-persistenza-main.md#il-contratto-cresce) — non ha un ADR: è una conseguenza di INV-03, non una decisione a sé | allargare INV-03 a tutto `contracts/`, cioè un allowlist di un file che diventa un denylist da mantenere                                                                |
| Un sistema riceve per costruzione ciò che il contesto non porta              | [0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)                                     | un singleton in `balance/`: nessun parametro in più, e una dipendenza che sparisce dalle firme                                                                          |
| Un dominio senza stato non ha un `system.ts` e non si registra               | [D014](D014-dominio-bancomat.md) — decisione 1                                                                            | inventargli uno stato per riempire il file: un contatore che nessuna schermata mostra, più una migrazione il giorno in cui la forma giusta si vede                      |
| La commissione del bancomat è un importo fisso, non una percentuale          | [D014](D014-dominio-bancomat.md) — decisione 2                                                                            | una percentuale, che però non produce **mai** il caso "commissione superiore all'importo" — e quel caso è metà del valore della fetta                                   |
| D011 produce anche l'ingresso del renderer, non solo i tre file dichiarati   | [D011](D011-runtime-e-store.md) — correzione 6                                                                            | lasciare `verify:release` rosso fino a D012, e chiudere D011 senza aver mai eseguito il proprio loop                                                                    |
| Se il salvataggio finale fallisce, la finestra **non** si chiude             | [D011](D011-runtime-e-store.md) — correzione 13                                                                           | chiudere comunque: comodo, e perde l'unica copia esistente della partita                                                                                                |
| Il saldo della home mostra i **due pool del giocatore**, non una cifra sola  | [D012](D012-ui-e-i18n.md) — correzione 7                                                                                  | la cifra sola del mockup, sotto cui il messaggio «ti servono 800,00 €, ne hai 0,00 €» è incomprensibile                                                                 |
| Le chiavi i18n sono **piatte**, non una gerarchia di oggetti                 | [D012](D012-ui-e-i18n.md) — correzione 9                                                                                  | l'annidamento, in cui `atm.withdraw.title` prende il posto di `atm.withdraw` senza che nulla lo dica                                                                    |
| La navigazione è un `ref`, non un router                                     | [D012](D012-ui-e-i18n.md) — [registro YAGNI](../roadmap-fette.md)                                                         | `vue-router`: una dipendenza, quindi un ADR (ADR 0015), per due destinazioni senza indirizzo                                                                            |
| jsdom resta fuori: le verifiche a occhio diventano test per un'altra strada  | [D012](D012-ui-e-i18n.md) — correzione 15                                                                                 | `jsdom` + `@vue/test-utils`, cioè due dipendenze e un ADR, per montare componenti che la definizione di fatto non chiede di montare                                     |
| Il cruscotto ha **cinque** riquadri, non sei: il tetto è un tetto            | [D015](D015-home-bancomat.md) — correzione 1                                                                              | riempire il sesto posto con un numero inventato, che è anche il posto che la fetta 02 userà davvero                                                                     |
| Il retro della carta porta le affordance del pool, non tre numeri finti      | [D015](D015-home-bancomat.md) — correzione 3                                                                              | plafond, limite e punteggio di credito come li disegna il mockup: dati che nella fetta 01 non esistono                                                                  |
| L'importo si sceglie fra quattro, e il più piccolo è rifiutato apposta       | [D015](D015-home-bancomat.md) — correzione 5                                                                              | un campo di testo, che apre il confine «chi trasforma una stringa digitata in `Money`» e cosa succede quando non è un numero                                            |
| jsdom resta fuori una **seconda** volta: si estrae invece di montare         | [D015](D015-home-bancomat.md) — correzione 13                                                                             | tirare il grilletto che il registro YAGNI aveva scritto: due dipendenze e un ADR per provare quattro funzioni pure                                                      |
| Le righe di una transazione hanno il segno: nasce `signedMoney`              | [D015](D015-home-bancomat.md) — correzione 10                                                                             | un formato solo: «497,50» in un elenco di movimenti non dice da che parte va il denaro                                                                                  |
| `doc-links` guarda anche il `README.md` della radice, non solo `docs/`       | [D013](D013-verifica-della-fetta.md) — correzione 7                                                                       | lasciarlo scoperto perché «non è un documento di `docs/`»: sarebbe l'unico del progetto con i collegamenti liberi di marcire, e l'unico che un estraneo legge per primo |
| Il listino sta nell'**azione**, non in una tabella globale in `balance/`     | [ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)                                               | una regola sola per tutti — coerente per costruzione, e per questo sbagliata: il black market sconta i contanti, l'immobiliare li penalizza                             |
| Il **selettore** del pagamento è di D017, non di D019                        | [D019](D019-il-pagamento.md) — _Il selettore vero è di D017_                                                              | costruirlo in D019, dove nessuna azione accetta due strumenti: sarebbe provato solo contro un listino finto                                                             |
| `heat` e `convertibleTo` restano fuori dal listino, con il grilletto scritto | [ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) — alternative scartate                        | dichiararli subito: un campo che nessuno legge per tre fette, e un grafo di conversioni per un arco solo                                                                |
| La validazione dello stato salvato è un **test**, non un tipo né un aiutante | [D020](D020-nessun-sistema-si-fida-del-salvataggio.md)                                                                    | `defineSystem` che chiede un validatore: garantisce che il campo esista, non che funzioni — e cambia il kernel per una regola che il kernel non deve conoscere          |
| D019 e D020 vanno **prima** di D017, non dentro                              | [README](README.md) — il grafo                                                                                            | infilarle nel caveau: la regola sarebbe scritta dalla stessa persona che scrive il codice da sorvegliare, nello stesso momento                                          |

La ventiduesima è di **D013** e costa una riga di un test: è anche l'unica riga non di test che
quella delega abbia toccato.

**Le ultime cinque sono del 2026-08-20 e non costano ancora niente**: nessuna riga di codice le applica, e questo è il momento in cui contestarle è gratis. Nascono tutte dalle due domande poste prima di eseguire D017 — come si sceglie con cosa si paga, e chi controlla lo stato che arriva dal disco. Le scelte **di gioco** di quelle sessioni non sono qui perché non sono state prese in autonomia: lo spazio unico del caveau, il tetto a livelli finiti, la varianza zero e la nona voce dell'etichetta sono state decise dall'utente, e stanno nella [scheda del caveau](../design/domini/vault.md) con le alternative scartate.

Sono contestabili anche i **numeri**: il moltiplicatore ×1,5 dell'upgrade, le otto ore di tetto al
recupero e l'intervallo 700–740 del primo minuto scelti da D008, più i 2,50 € di `ATM_FEE` scelti
da D014, e i quattro importi rapidi del bancomat — 1 · 10 · 100 · 500 — scelti da D015. Sono di
un'altra categoria: cambiarli costa una riga in `balance/constants.ts` e un test che diventa rosso
apposta. Reddito base e costo dell'upgrade vengono invece dai
[mockup](../design/mockups/), quindi erano già approvati.

## Prompt pronto per una sessione nuova

Lo STOP 2 è superato e la fetta 02 è decisa: questo prompt **consegna una delega**. Ne consegna
una sola per volta, e l'ID va scelto prima di incollarlo — `D019` o `D020`, che non si toccano.

```markdown
Esegui la delega D019 nel progetto Solvent, in questa repo.

(Se preferisci partire dall'altra, sostituisci D019 con D020 ovunque: sono indipendenti e
possono essere fatte in qualunque ordine. Entrambe vanno chiuse prima di D017.)

Leggi in quest'ordine, e non scrivere niente prima di aver finito:

1. `docs/delega/PASSAGGIO-DI-CONSEGNE.md` — stato, regole, e le quattro cose che sa solo lui.
   In particolare _Cosa vale per qualunque delega_ e _Le decisioni contestabili_
2. `docs/delega/D019-il-pagamento.md` — la delega che esegui. Interamente, trappole comprese
3. `docs/adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md` — l'ADR che la vincola,
   con le cinque alternative già scartate. Se stai per contraddirne una, la risposta è lì
4. `docs/roadmap-fette.md`, il **registro YAGNI** — dice cosa è stato deliberatamente lasciato
   fuori e cosa lo farà entrare. È il documento che ti impedisce di costruire troppo
5. `docs/qualita.md` e `docs/convenzioni.md` — i gate, e la lingua del codice (C08)

Stato misurato il 2026-08-20: da D001 a D016 tutte `Chiusa` e unite a `main`, più D013.
`npm run verify` verde — **503 test su 55 file**. `npm run build` verde — 91 moduli, 564,89 kB.
Il kernel è 471 righe in `kernel/`, 545 con `balance/`. Ventisette ADR, di cui **sei
`Proposta`**: 0010, 0022, 0023, 0025, 0026, 0027. Per ognuno è scritto perché.

Aperte ci sono quattro deleghe, e l'ordine conta:

- **D019 — il pagamento** e **D020 — la validazione dello stato salvato**: indipendenti fra
  loro, entrambe prima di D017
- **D017 — il caveau**: la fetta 02 vera, aspetta le altre due
- **D018 — la scheda di dominio**: solo documenti, non tocca nessuna delle altre

D019 vale ~140 righe di sorgente e ~220 di test. **Il kernel non si tocca**: metà del sistema
esisteva già — `accepts`, il rifiuto tipizzato con l'elenco dei pool, e
`error.ledger.insufficient_funds` che porta già `pool`, `required` e `available`.

Come lavoro:

- **Un ramo `d019-il-pagamento`.** Non si commetta su `main`
- **La delega si esegue, non si riscrive.** Se il testo è invecchiato o sbagliato, fermati e
  dimmelo: è successo tre volte e ogni volta ha tolto lavoro invece di aggiungerlo
- **Il budget di righe è un allarme, non un limite.** Se lo stai raddoppiando, stai risolvendo
  un problema diverso da quello descritto: dillo invece di continuare
- **Fuori scope vuol dire fuori scope.** `heat`, `convertibleTo` e il selettore a più opzioni
  hanno un grilletto scritto e non è scattato
- **Ogni test nuovo va rotto di proposito almeno una volta.** Un test che non si è mai visto
  fallire non è una rete, è una decorazione
- `npm run verify` verde alla fine, con l'**output incollato**. Non «dovrebbe passare»
- Niente `TODO`, niente `any`, niente scorciatoie presentate come soluzioni. Identificatori in
  inglese, prosa in italiano
- Alla fine, in fondo alla delega: le **correzioni** rispetto a com'era scritta, e il consuntivo
  di righe contro il budget. Ogni delega chiusa ne ha da cinque a diciassette
```
