# Passaggio di consegne

Per chi prende in mano Solvent adesso — persona o agente. Si legge in dieci minuti e basta a
ripartire senza fare domande.

## Cos'è Solvent

Idle/tycoon finanziario per desktop. Electron + Vue 3 + TypeScript + Pinia + Vitest.

È la ricostruzione da zero di un progetto precedente (`finanx`, ~104.000 righe) di cui esiste un
audit con **17 difetti misurati**. Quel repo si usa **solo come catalogo di idee di gioco**: mai
copiarne codice, struttura di cartelle o pattern — sono esattamente ciò che ha fallito.

Il gioco ruota attorno a una tensione sola: **contanti contro carta**. Anonimi ma limitati contro
tracciabili ma illimitati. Ogni dominio — mercato nero, prestiti, casinò, immobiliare — è un modo
diverso di viverla. Senza quella tensione, tredici domini sono tredici pulsanti che alzano lo
stesso numero.

Non c'è un'attività principale: è un **ecosistema** in quattro ere, e ogni era rende insufficiente
la strategia della precedente con un muro che il denaro non compra — il caveau, il punteggio di
credito, l'attenzione, il calore accumulato. Le ere, la profondità di ogni dominio e le cinque
leggi che tengono il gioco bilanciato stanno in [prodotto/visione.md](../prodotto/visione.md).

## Dove siamo, esattamente

|                          |                                                                   |
| ------------------------ | ----------------------------------------------------------------- |
| STOP 1                   | **approvato** — nome, stile, dipendenze, architettura             |
| D001 — tooling e gate    | **chiusa**, commit `e275f59`                                      |
| D002 — contratti         | **chiusa**, commit `288367e`                                      |
| D003 — kernel: Clock     | **chiusa**, commit `f398a47`                                      |
| D004 — kernel: Rng       | **chiusa**, commit `a87d8cf`                                      |
| D005 — kernel: Bus       | **chiusa**, commit `e9cf441`                                      |
| D006 — kernel: Registry  | **chiusa**, commit `39b8520`                                      |
| D007 — kernel: Ledger    | **chiusa**, commit `f9a0c59`                                      |
| D008 — balance           | **chiusa**, commit `e01e885`                                      |
| D009 — persistenza main  | **chiusa**, commit `256f622`                                      |
| D010 — dominio income    | **chiusa**, commit `b98f025`                                      |
| D014 — dominio bancomat  | **chiusa**, commit `a0b3b9f`                                      |
| D011 — runtime e store   | **chiusa**, commit `dbf821c`                                      |
| Kernel                   | **finito** — 535 righe, da D003 a D008                            |
| Persistenza nel main     | **finita** — 241 righe in `src/main/` e `src/preload/`            |
| Codice di dominio        | **`income` 102 righe, `atm` 65** — i due della fetta 01           |
| `npm run verify`         | **verde** — 382 test su 45 file                                   |
| `npm run verify:release` | **verde** — da D011 compila anche il renderer                     |
| Prossimo passo           | **[D012 — Il guscio, le parole e il reddito](D012-ui-e-i18n.md)** |

I contratti sono in `src/core/contracts/`, Clock, Rng, Bus, Registry e Ledger in
`src/core/kernel/`, i numeri di gioco in `src/core/balance/`, lo schema del salvataggio e i tre
canali IPC in `src/main/save/`, i due domini in `src/core/domains/`, il bootstrap, il loop e
l'unico store in `src/renderer/`. Ogni delega chiusa ha in fondo le
**correzioni** rispetto a com'era scritta: [D002](D002-contratti.md) ne ha sette,
[D003](D003-kernel-clock.md) cinque, [D004](D004-kernel-rng.md) sei,
[D005](D005-kernel-bus.md) cinque, [D006](D006-kernel-registry.md) sei,
[D007](D007-kernel-ledger.md) nove, [D008](D008-balance.md) otto,
[D009](D009-persistenza-main.md) dieci, [D010](D010-dominio-income.md) dieci,
[D014](D014-dominio-bancomat.md) undici, [D011](D011-runtime-e-store.md) quattordici. Leggile
prima di fidarti del
testo di una delega ancora aperta — alcune di quelle correzioni riguardano proprio deleghe che non
sono ancora state eseguite.

### Cosa è già cambiato nelle deleghe ancora aperte

Quindici cose che il testo di quelle deleghe **non** dice ancora, e che chi le esegue deve
sapere prima di iniziare. Sono qui perché una delega chiusa è un documento storico: nessuno la
rilegge.

**D014 e D011 sono chiuse** e non sono più in questa tabella. Restano D012, D015 e D013, e quasi tutto
ciò che le riguarda viene dalle correzioni di D011 — che ha toccato il Clock, il Ledger, il
contratto di salvataggio e una regola di lint.

| Delega    | Cosa è cambiato                                                                                                                                                                                                                                                                                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D012      | **Tre codici d'errore di dominio sono nuovi** e vogliono la loro chiave i18n, come ogni `code` (INV-07): `error.income.already_upgraded` da D010, più `error.atm.amount_not_positive` e `error.atm.fee_exceeds_amount`, che da D014 esistono davvero. Anche `reason.atm.deposit` e `reason.atm.withdraw` sono chiavi                                                                    |
| D015      | **Il riquadro "cosa succede" del mockup del bancomat è una chiamata sola**: `previewOf(operation, amount)` ritorna i tre movimenti da mostrare, che sono gli **stessi** che il comando applicherà. La UI non ricalcola niente, e se l'anteprima è un errore mostra il codice invece di spegnere il pulsante                                                                             |
| D012      | **D012 è stata spezzata il 2026-08-19**, e il perché sta nella delega sotto _Perché è stata spezzata_: valeva ~1.150 righe, più del kernel intero, e a metà strada non era verificabile. Il taglio passa fra i due mockup — gli **stati** e il reddito qui, la **home** col bancomat in [D015](D015-home-bancomat.md)                                                                   |
| D012+D015 | **`Ledger.balances()` esiste**: tutti i saldi insieme, nella forma che `money.posted` porta. Lo store lo usa dopo un caricamento, che non emette niente perché caricare non è un movimento economico (D011, correzione 4)                                                                                                                                                               |
| D012      | **Il Clock conosce i millisecondi**: `MILLISECONDS_PER_SECOND`, il tipo `Milliseconds` e `ticksToMilliseconds`. Sono l'unità del confine col browser e non escono da lì (D011, correzione 2)                                                                                                                                                                                            |
| D012      | **`error.game.load_failed` è un codice nuovo** e vuole la sua chiave (INV-07): lo produce `createGame().load` quando il kernel rifiuta un salvataggio manomesso                                                                                                                                                                                                                         |
| D012+D015 | **Lo store non ha selettori, e non è una dimenticanza**: espone stato e comandi. `incomePerSecond`, `upgradeCost`, `canBuyUpgrade`, `atmFee` e `previewOf` si aggiungono quando esiste il componente che li consuma — un `.vue` non può importare le regole (R05), quindi li chiama lo store                                                                                            |
| D012      | **Il guscio esiste già** — `App.vue`, `main.ts`, `index.html`, 81 righe — e rende i sette stati del ciclo di vita senza una parola di prosa. D012 lo riempie invece di crearlo, e quelle righe sono **dentro** il conto delle ~1.150                                                                                                                                                    |
| D012      | **Lo stato `failed` ha due cause e una sola schermata**: caricamento fallito, dove la via d'uscita è `newGame()`, e **salvataggio finale** fallito, dove la partita è ancora in memoria e la finestra è rimasta aperta apposta. La seconda non ha ancora un pulsante                                                                                                                    |
| tutte     | **Il codice si scrive in inglese.** Identificatori — variabili, parametri, funzioni, tipi, costanti, chiavi di oggetto, nomi di file — in inglese; prosa — commenti, messaggi degli errori lanciati, descrizioni dei test — in italiano. È la regola C08 di [convenzioni.md](../convenzioni.md), imposta da `tests/rules/english-identifiers`, che è ⚠️ parziale e lo dichiara          |
| tutte     | **Alcuni nomi sono cambiati con quel refactor.** L'helper dei test è `tests/helpers/sources.ts` e espone `read`, `withoutComments`, `sourceFiles`, `importsOf`. Cinque test di regola sono stati rinominati (`bus-synchronous`, `main-save-only`, `registry-no-special-cases`, `doc-links`, `ledger-capacity`). L'unica API pubblica che cambia nome è `seedCasuale` → **`randomSeed`** |
| tutte     | **Un importo di gioco non può nascere dentro un dominio, e adesso c'è un meccanismo.** `no-magic-numbers` guarda i **numeri**, ma `Money` si costruisce da una **stringa**: `fromString('2.50')` sotto `domains/` passava lint e test. Lo ferma `tests/rules/domains-no-money-literals` (D014, correzione 2)                                                                            |
| tutte     | **INV-10 non è più un `grep`, è un test**: `tests/rules/domains-no-internal-pools` deriva da `POOLS` i conti che un dominio non può nominare — sono **quattro**, `house` compreso — e toglie i commenti prima di guardare                                                                                                                                                               |
| tutte     | **`english-identifiers` ha un punto cieco che produce falsi positivi**, e ora lo dichiara: una classe di caratteri che elenca le virgolette dentro un `/regex/` manda fuori fase la sua scansione. L'aggiramento è costruire la classe come stringa e passarla a `new RegExp`                                                                                                           |
| tutte     | **R06 guarda il lato sinistro dell'assegnamento.** Il selettore prendeva anche il destro, e rispecchiare un `.balances` era una violazione: nessuno se n'era accorto perché fino a D011 nessun codice leggeva un saldo per rispecchiarlo                                                                                                                                                |
| tutte     | **`runtime/host.ts` è l'unico file che tocca il browser**, ed è l'unico senza test. Tutto ciò che sta sopra riceve `now`, `schedule`, la visibilità e la chiusura per costruzione, e per questo gira in `node` senza jsdom. jsdom entra con i test di componente, cioè con D012                                                                                                         |
| tutte     | Un `eslint-disable` senza motivazione è un test rosso, non un appunto di review (C06)                                                                                                                                                                                                                                                                                                   |

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

Quello che l'audit **non** copre è tutto ciò che è cambiato dopo D008, cioè da ora in poi.

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

Non serve leggere tutti i 20 ADR. Servono quando stai per contraddirne uno: allora leggi
**quello**, e riparti dalle alternative già scartate invece che da zero.

## Il prossimo passo, in concreto

**[D012 — Il guscio, le parole e il reddito](D012-ui-e-i18n.md).** ~430 righe di sorgente più ~150
di test di regola. Vestire i quattro stati che il ciclo di vita già produce, dare al gioco le sue
parole in due lingue, e far comprare l'upgrade.

Specifica visiva: **[fetta-01-primo-stipendio.html](../design/mockups/fetta-01-primo-stipendio.html)**,
il mockup che di sé dice _mostra gli stati, che sono la parte che conta_. Ogni testo visibile lì
dentro ha già la sua chiave i18n scritta sotto, in giallo.

Dopo D012 il gioco è una cosa che si guarda: parte, dice cosa sta facendo, mostra il saldo che sale
e lascia comprare l'upgrade — in italiano e in inglese.

**D012 è stata spezzata il 2026-08-19.** Valeva ~1.150 righe, più del kernel intero, e il numero era
una misura fatta sui mockup, non una stima. Una delega di quella dimensione non è verificabile a
metà strada: la definizione di fatto arriva tutta insieme alla fine. Il taglio passa fra i due
mockup, che non sono due schermate ma due momenti:

| Delega                        | Cosa copre                                                    | Righe |
| ----------------------------- | ------------------------------------------------------------- | ----- |
| [D012](D012-ui-e-i18n.md)     | gli **stati**, le parole, il saldo, l'upgrade                 | ~430  |
| [D015](D015-home-bancomat.md) | la **home**: carta 3D, bancomat, cruscotto, ultime operazioni | ~720  |

**Tutto l'i18n sta in D012**, chiavi del bancomat comprese. Una lingua che si completa in due tempi
è il difetto A13, e il test di parità esiste per togliere il "poi traduco".

Tre cose che il testo della delega non dice, e che cambiano da dove si parte:

1. **Il guscio esiste già.** `App.vue`, `main.ts` e `index.html` rendono i sette stati del ciclo di
   vita e il mirror, senza una parola di prosa: 81 righe, di cui una ventina di CSS. D012 le veste
   invece di crearle.
2. **Lo store non ha selettori**, e va bene così: si aggiungono con il componente che li consuma. Un
   `.vue` non può importare `domains/*/rules` (R05), quindi a chiamarli è lo store.
3. **`runtime/host.ts` è l'unico file del progetto senza test**, ed è dichiarato: è il file che _è_
   il browser. `vitest.config.ts` dice che jsdom entra con i test di componente — cioè con D012, che
   è quindi anche il momento in cui quel file può finalmente averne uno.

Poi **[D015](D015-home-bancomat.md)**, e infine
**[D013 — Verifica della fetta](D013-verifica-della-fetta.md)**, che è lo **STOP 2**: ~250 righe di
test, nessun codice nuovo, e la decisione sulla fetta 02.

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
  rispetto a com'era scritta la delega** — ogni delega chiusa finora ne ha da cinque a sette, e
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

## Le decisioni contestabili

Dodici, prese in autonomia. Le prime quattro sono **in vigore** da D007 e sono state usate da due
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

| Cosa                                                                       | ADR                                                                                                                       | Alternativa scartata                                                                                                                               |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ogni transazione somma a zero (partita doppia)                             | [0020](../adr/0020-partita-doppia.md)                                                                                     | movimenti singoli con categoria                                                                                                                    |
| Il Ledger espone transazioni, non movimenti                                | [0019](../adr/0019-transazioni-atomiche-nel-ledger.md)                                                                    | due `post()` con rollback nel chiamante                                                                                                            |
| I pool dichiarano le proprie affordance come dati                          | [0017](../adr/0017-il-denaro-e-plurale.md)                                                                                | un saldo unico con etichette nella UI                                                                                                              |
| `post()` non esiste: una primitiva sola                                    | [0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)                                                                   | zucchero a due movimenti, che però rimette `world` e `sink` nei domini                                                                             |
| Il Ledger avrà conti dinamici, non solo sei pool                           | [0022](../adr/0022-il-ledger-ha-conti-non-solo-pool.md)                                                                   | il budget di un'attività tenuto come stato del dominio                                                                                             |
| Il tempo di gioco è un dominio, non il kernel                              | [0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                                                          | un `now` nel `SystemContext`, che aggiunge una chiave al salvataggio                                                                               |
| I tipi d'esito del salvataggio stanno in `contracts/save.ts`               | [D009](D009-persistenza-main.md#il-contratto-cresce) — non ha un ADR: è una conseguenza di INV-03, non una decisione a sé | allargare INV-03 a tutto `contracts/`, cioè un allowlist di un file che diventa un denylist da mantenere                                           |
| Un sistema riceve per costruzione ciò che il contesto non porta            | [0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)                                     | un singleton in `balance/`: nessun parametro in più, e una dipendenza che sparisce dalle firme                                                     |
| Un dominio senza stato non ha un `system.ts` e non si registra             | [D014](D014-dominio-bancomat.md) — decisione 1                                                                            | inventargli uno stato per riempire il file: un contatore che nessuna schermata mostra, più una migrazione il giorno in cui la forma giusta si vede |
| La commissione del bancomat è un importo fisso, non una percentuale        | [D014](D014-dominio-bancomat.md) — decisione 2                                                                            | una percentuale, che però non produce **mai** il caso "commissione superiore all'importo" — e quel caso è metà del valore della fetta              |
| D011 produce anche l'ingresso del renderer, non solo i tre file dichiarati | [D011](D011-runtime-e-store.md) — correzione 6                                                                            | lasciare `verify:release` rosso fino a D012, e chiudere D011 senza aver mai eseguito il proprio loop                                               |
| Se il salvataggio finale fallisce, la finestra **non** si chiude           | [D011](D011-runtime-e-store.md) — correzione 13                                                                           | chiudere comunque: comodo, e perde l'unica copia esistente della partita                                                                           |

Sono contestabili anche i **numeri**: il moltiplicatore ×1,5 dell'upgrade, le otto ore di tetto al
recupero e l'intervallo 700–740 del primo minuto scelti da D008, più i 2,50 € di `ATM_FEE` scelti
da D014. Sono di un'altra categoria: cambiarli costa una riga in `balance/constants.ts` e un test
che diventa rosso apposta. Reddito
base e costo dell'upgrade vengono invece dai [mockup](../design/mockups/), quindi erano già
approvati.

## Prompt pronto per una sessione nuova

```markdown
Riprendi il progetto Solvent in questa repo ed esegui la delega D012.

Leggi in quest'ordine, e non altro prima di aver finito:

1. `docs/delega/PASSAGGIO-DI-CONSEGNE.md` — stato, regole, prossimo passo
2. `docs/delega/D012-ui-e-i18n.md` — la delega, **sezione "Perché è stata spezzata" per prima**
3. La tabella "Cosa è già cambiato nelle deleghe ancora aperte" qui sopra: **otto righe**
   riguardano D012, e sono cose che il testo della delega non dice
4. `docs/delega/D011-runtime-e-store.md`, sezione "Cosa deve sapere chi prende D012" — il guscio,
   lo store, e ciò che manca di proposito
5. `docs/design/mockups/fetta-01-primo-stipendio.html` — è la specifica, e ogni testo visibile ha
   già la sua chiave i18n scritta sotto
6. `docs/convenzioni.md` — nomi, commit, e la lingua del codice (C08)

Stato: STOP 1 approvato, da D001 a D011 e D014 chiuse, kernel finito (535 righe), persistenza nel
main finita, i due domini della fetta 01 finiti, runtime e store finiti (379 righe).
`npm run verify` verde con 382 test su 45 file, e **`npm run verify:release` è verde**: da D011
compila anche il renderer, e da qui in avanti un renderer che non compila è una regressione.

D012 era ~1.150 righe ed è stata **spezzata il 2026-08-19**: la home col bancomat è D015. Quella
che esegui adesso vale ~430 righe più ~150 di test di regola. Non riportarci dentro il bancomat.

Come voglio che lavori:

- Un ramo per la delega: `git checkout -b d012-guscio-parole-reddito`.
- Esegui D012 così com'è scritta. Se qualcosa si rivela sbagliato, correggilo e **scrivilo** nella
  sezione delle correzioni in fondo alla delega — non aggirarlo in silenzio. Ogni delega chiusa
  finora ne ha da cinque a quattordici: se la tua esce senza, o era perfetta o non l'hai letta.
- Fermati e presentami **2 opzioni** solo sulle decisioni strutturali. Il resto fallo.
- Identificatori in inglese, prosa in italiano (C08).
- Niente `TODO`, niente `any`, niente scorciatoie presentate come soluzioni.
- Un test che non hai mai visto fallire non è una rete: rompilo di proposito una volta.
- Nessun claim di completamento senza l'output reale di `npm run verify`.
- La documentazione toccata dal cambiamento si aggiorna nello stesso commit.
- Commit: Conventional Commits con lo scope uguale all'ID — `feat(D012): …`.

Tre cose che il codice ti dà già e che non vanno riscritte:

- **Il guscio esiste**: `App.vue`, `main.ts`, `index.html` rendono i sette stati del ciclo di vita
  senza una parola di prosa. Vestilo, non ricrearlo.
- **Lo store espone stato e comandi**: `status`, `failure`, `balances`, `history`, `savedAt`, più
  `start`, `newGame`, `close`, `buyUpgrade`, `deposit`, `withdraw`.
- **I numeri si leggono dalle regole pure** — `incomePerSecond`, `upgradeCost`, `canBuyUpgrade` —
  e li chiama lo store, perché un `.vue` non può importarle (R05).

Il test delle chiavi va scritto **leggendo il sorgente**, non ricopiando i tredici codici d'errore:
una lista a mano è già scaduta il giorno in cui nasce il quattordicesimo, e ne sono nati tre in tre
deleghe.

Per vedere il gioco girare: `npm run dev`. Se dice _Electron uninstall_, completa il binario con
`node node_modules/electron/install.js`.

Quando D012 è chiusa, fermati: marcala `Chiusa` con il commit, aggiorna il passaggio di consegne e
`tracciabilita.md` se hai cambiato un meccanismo, e mostrami l'output dei gate prima di passare
alla successiva — che è D015, la home col bancomat.
```
