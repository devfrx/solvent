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

|                         |                                                         |
| ----------------------- | ------------------------------------------------------- |
| STOP 1                  | **approvato** — nome, stile, dipendenze, architettura   |
| D001 — tooling e gate   | **chiusa**, commit `e275f59`                            |
| D002 — contratti        | **chiusa**, commit `288367e`                            |
| D003 — kernel: Clock    | **chiusa**, commit `f398a47`                            |
| D004 — kernel: Rng      | **chiusa**, commit `a87d8cf`                            |
| D005 — kernel: Bus      | **chiusa**, commit `e9cf441`                            |
| D006 — kernel: Registry | **chiusa**, commit `39b8520`                            |
| D007 — kernel: Ledger   | **chiusa**, commit `f9a0c59`                            |
| D008 — balance          | **chiusa**, commit `e01e885`                            |
| D009 — persistenza main | **chiusa**, commit `256f622`                            |
| D010 — dominio income   | **chiusa**, commit `b98f025`                            |
| D014 — dominio bancomat | **chiusa**, commit `a0b3b9f`                            |
| Kernel                  | **finito** — 535 righe, da D003 a D008                  |
| Persistenza nel main    | **finita** — 241 righe in `src/main/` e `src/preload/`  |
| Codice di dominio       | **`income` 102 righe, `atm` 65** — i due della fetta 01 |
| `npm run verify`        | **verde** — 334 test su 42 file                         |
| Prossimo passo          | **[D011 — Runtime e store](D011-runtime-e-store.md)**   |

I contratti sono in `src/core/contracts/`, Clock, Rng, Bus, Registry e Ledger in
`src/core/kernel/`, i numeri di gioco in `src/core/balance/`, lo schema del salvataggio e i tre
canali IPC in `src/main/save/`, i due domini in `src/core/domains/`. Ogni delega chiusa ha in fondo le
**correzioni** rispetto a com'era scritta: [D002](D002-contratti.md) ne ha sette,
[D003](D003-kernel-clock.md) cinque, [D004](D004-kernel-rng.md) sei,
[D005](D005-kernel-bus.md) cinque, [D006](D006-kernel-registry.md) sei,
[D007](D007-kernel-ledger.md) nove, [D008](D008-balance.md) otto,
[D009](D009-persistenza-main.md) dieci, [D010](D010-dominio-income.md) dieci,
[D014](D014-dominio-bancomat.md) undici. Leggile prima di fidarti del
testo di una delega ancora aperta — alcune di quelle correzioni riguardano proprio deleghe che non
sono ancora state eseguite.

### Cosa è già cambiato nelle deleghe ancora aperte

Diciotto cose che il testo di quelle deleghe **non** dice ancora, e che chi le esegue deve
sapere prima di iniziare. Sono qui perché una delega chiusa è un documento storico: nessuno la
rilegge.

**D014 è chiusa** e non è più in questa tabella. Le sue undici correzioni contano anche per chi
prende le deleghe che restano: due hanno prodotto meccanismi nuovi, e le ultime righe della tabella
qui sotto vengono da lì.

| Delega | Cosa è cambiato                                                                                                                                                                                                                                                                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D011   | **Un handler di `money.posted` non può postare denaro**: la guardia contro l'annidamento resta alzata durante l'emissione. Chi reagisce muovendo denaro lo fa nel proprio `tick`                                                                                                                                                                                                                             |
| D011   | **`SystemContext` ha quattro campi** — `clock`, `rng`, `bus`, `ledger` — e **`ResetScope` si importa da `@core/contracts/lifecycle`**, non più dal Registry                                                                                                                                                                                                                                                  |
| D011   | **La persistenza esiste e ha una superficie precisa.** `window.solvent` con `save`, `load` e `reset`; `load()` ritorna `{ present: false }` quando il file non c'è, e non è un errore; `save(payload)` ritorna l'istante scritto. Il `declare global` che aggancia `SaveApi` a `window` è di D011. L'elenco completo è in fondo a [D009](D009-persistenza-main.md), sotto _Cosa deve sapere chi prende D011_ |
| D011   | **Il `reset` del main non è il `reset` del Registry.** Il primo cancella il file di salvataggio, il secondo azzera i sistemi con un `ResetScope`. Un prestige chiama il secondo e non il primo                                                                                                                                                                                                               |
| D011   | **`Bus.emit` può lanciare**: `EventCycleError` sui cicli, o l'errore di un handler (`AggregateError` se sono più d'uno). Un `tick` che emette non è un'operazione che non fallisce mai                                                                                                                                                                                                                       |
| D011   | **Anche il Ledger lancia**: `UnbalancedTransactionError` e `NestedTransactionError` dicono che il codice è scritto male, `UnbalancedSaveError` che il salvataggio è manomesso. E **`RECOVERY_CAP` è in tick**, non in secondi: il loop lo confronta con i tick interi da recuperare, senza conversioni proprie                                                                                               |
| D011   | Il loop deve decidere cosa fa quando `emit` o il Ledger lanciano. Fermare la simulazione è la risposta giusta: dicono che qualcosa è scritto male, non che il giocatore ha sbagliato. **`loadAll` ritorna `Result<LoadReport, RegistryError>`**, e quel caso va nello stato `Errore`, non ignorato                                                                                                           |
| D011   | **Un dominio espone una factory, non un sistema già costruito**: `createIncome(ledger, modifiers)` ritorna il sistema da registrare e i comandi già legati al contesto ([ADR 0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)). Il bootstrap costruisce le istanze condivise e le distribuisce, e ne discende una freccia `renderer/runtime → core/balance`              |
| D011   | **`tests/rules/registry-completeness` torna secco quando nasce `createGame.ts`**: finché quel file non esiste il test dichiara l'attesa, dal giorno dopo conta le registrazioni e ne pretende una per dominio                                                                                                                                                                                                |
| D011   | **`atm` non si registra.** `createAtm(ledger)` ritorna due comandi — `deposit` e `withdraw`, entrambi `CommandHandler<Money, Balances, AtmError>` — e nessun sistema: il bancomat non ha stato. `registry-completeness` conta **un** dominio registrato, non due                                                                                                                                             |
| D012   | **Tre codici d'errore di dominio sono nuovi** e vogliono la loro chiave i18n, come ogni `code` (INV-07): `error.income.already_upgraded` da D010, più `error.atm.amount_not_positive` e `error.atm.fee_exceeds_amount`, che da D014 esistono davvero. Anche `reason.atm.deposit` e `reason.atm.withdraw` sono chiavi                                                                                         |
| D012   | **Il riquadro "cosa succede" del mockup del bancomat è una chiamata sola**: `previewOf(operation, amount)` ritorna i tre movimenti da mostrare, che sono gli **stessi** che il comando applicherà. La UI non ricalcola niente, e se l'anteprima è un errore mostra il codice invece di spegnere il pulsante                                                                                                  |
| D012   | **Il budget di D012 era sbagliato in due modi diversi**: `~150` nella delega, `~230` nell'indice, entrambi dal commit di STOP 1 e mai misurati. Rimisurato sui mockup: **~1.150 righe**, di cui ~465 di CSS — che è la grandezza del difetto A14. La ripartizione sta nella delega, sotto _Il budget, rimisurato_                                                                                            |
| tutte  | **Il codice si scrive in inglese.** Identificatori — variabili, parametri, funzioni, tipi, costanti, chiavi di oggetto, nomi di file — in inglese; prosa — commenti, messaggi degli errori lanciati, descrizioni dei test — in italiano. È la regola C08 di [convenzioni.md](../convenzioni.md), imposta da `tests/rules/english-identifiers`, che è ⚠️ parziale e lo dichiara                               |
| tutte  | **Alcuni nomi sono cambiati con quel refactor.** L'helper dei test è `tests/helpers/sources.ts` e espone `read`, `withoutComments`, `sourceFiles`, `importsOf`. Cinque test di regola sono stati rinominati (`bus-synchronous`, `main-save-only`, `registry-no-special-cases`, `doc-links`, `ledger-capacity`). L'unica API pubblica che cambia nome è `seedCasuale` → **`randomSeed`**                      |
| tutte  | **Un importo di gioco non può nascere dentro un dominio, e adesso c'è un meccanismo.** `no-magic-numbers` guarda i **numeri**, ma `Money` si costruisce da una **stringa**: `fromString('2.50')` sotto `domains/` passava lint e test. Lo ferma `tests/rules/domains-no-money-literals` (D014, correzione 2)                                                                                                 |
| tutte  | **INV-10 non è più un `grep`, è un test**: `tests/rules/domains-no-internal-pools` deriva da `POOLS` i conti che un dominio non può nominare — sono **quattro**, `house` compreso — e toglie i commenti prima di guardare                                                                                                                                                                                    |
| tutte  | **`english-identifiers` ha un punto cieco che produce falsi positivi**, e ora lo dichiara: una classe di caratteri che elenca le virgolette dentro un `/regex/` manda fuori fase la sua scansione. L'aggiramento è costruire la classe come stringa e passarla a `new RegExp`                                                                                                                                |
| tutte  | Un `eslint-disable` senza motivazione è un test rosso, non un appunto di review (C06)                                                                                                                                                                                                                                                                                                                        |

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

**[D011 — Runtime e store](D011-runtime-e-store.md).** Collegare il kernel puro a Vue senza che il
kernel se ne accorga: `src/renderer/runtime/createGame.ts` costruisce il contesto e registra i
sistemi, `loop.ts` fa il passo fisso con l'accumulatore e il recupero, e `stores/game.ts` è
l'unico store della fetta — un mirror che riceve dal Bus e **non calcola niente**. **~120 righe**.

È la delega che chiude le finestre lasciate aperte da tre deleghe prima di lei, e sono elencate una
per una nella tabella _Cosa è già cambiato_ qui sopra: nove righe la riguardano. Le due più facili
da sbagliare: `registry-completeness` diventa un confronto secco il giorno in cui `createGame.ts`
esiste — e conta **un** dominio registrato, `income`, perché `atm` non è un sistema; e il `Ledger`
costruito nel bootstrap deve essere lo **stesso** che va nel `SystemContext` e nelle due factory,
perché due istanze sono due partite e nessun tipo lo impedisce.

Con D011 `npm run verify:release` torna verde: è il renderer che oggi manca alla compilazione.

Poi si prosegue col grafo in [delega/README.md](README.md): D012 la UI e l'i18n, D013 la verifica
finale — che è lo **STOP 2**, dove ci si ferma di nuovo.

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
finito. `npm run verify:release` aggiunge la compilazione: da D009 `build` produce
`out/main/index.js` e `out/preload/index.cjs` senza errori e si ferma sul renderer, che manca.
Diventa verde con D011.

## Le decisioni contestabili

Dieci, prese in autonomia. Le prime quattro sono **in vigore** da D007 e sono state usate da due
domini: cambiarle costa il Ledger, i suoi test e i due domini. D014 era il momento buono per
contestarle ed è passato — nessuna delle quattro si è rivelata scomoda usandole.

La quinta e la sesta sono del 2026-08-19, nascono dalla revisione della visione e **non costano
ancora niente**: nessuna riga di codice le applica.

La settima è **in vigore da D009**: costa il main, il preload e i loro test.

L'ottava è **in vigore da D010** e ora anche da D014, che l'ha usata nella sua forma più scarna —
`createAtm(ledger)`, una dipendenza sola. Costa i due domini e il bootstrap che D011 non ha ancora
scritto.

La nona e la decima sono **in vigore da D014**, e fino a ieri non costavano niente. Adesso costano
il dominio e i suoi test — che sono poco, ma non più zero. La nona è quella che cambia una forma
del progetto: `atm` è il primo dominio senza `system.ts`.

| Cosa                                                                | ADR                                                                                                                       | Alternativa scartata                                                                                                                               |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ogni transazione somma a zero (partita doppia)                      | [0020](../adr/0020-partita-doppia.md)                                                                                     | movimenti singoli con categoria                                                                                                                    |
| Il Ledger espone transazioni, non movimenti                         | [0019](../adr/0019-transazioni-atomiche-nel-ledger.md)                                                                    | due `post()` con rollback nel chiamante                                                                                                            |
| I pool dichiarano le proprie affordance come dati                   | [0017](../adr/0017-il-denaro-e-plurale.md)                                                                                | un saldo unico con etichette nella UI                                                                                                              |
| `post()` non esiste: una primitiva sola                             | [0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)                                                                   | zucchero a due movimenti, che però rimette `world` e `sink` nei domini                                                                             |
| Il Ledger avrà conti dinamici, non solo sei pool                    | [0022](../adr/0022-il-ledger-ha-conti-non-solo-pool.md)                                                                   | il budget di un'attività tenuto come stato del dominio                                                                                             |
| Il tempo di gioco è un dominio, non il kernel                       | [0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                                                          | un `now` nel `SystemContext`, che aggiunge una chiave al salvataggio                                                                               |
| I tipi d'esito del salvataggio stanno in `contracts/save.ts`        | [D009](D009-persistenza-main.md#il-contratto-cresce) — non ha un ADR: è una conseguenza di INV-03, non una decisione a sé | allargare INV-03 a tutto `contracts/`, cioè un allowlist di un file che diventa un denylist da mantenere                                           |
| Un sistema riceve per costruzione ciò che il contesto non porta     | [0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)                                     | un singleton in `balance/`: nessun parametro in più, e una dipendenza che sparisce dalle firme                                                     |
| Un dominio senza stato non ha un `system.ts` e non si registra      | [D014](D014-dominio-bancomat.md) — decisione 1                                                                            | inventargli uno stato per riempire il file: un contatore che nessuna schermata mostra, più una migrazione il giorno in cui la forma giusta si vede |
| La commissione del bancomat è un importo fisso, non una percentuale | [D014](D014-dominio-bancomat.md) — decisione 2                                                                            | una percentuale, che però non produce **mai** il caso "commissione superiore all'importo" — e quel caso è metà del valore della fetta              |

Sono contestabili anche i **numeri**: il moltiplicatore ×1,5 dell'upgrade, le otto ore di tetto al
recupero e l'intervallo 700–740 del primo minuto scelti da D008, più i 2,50 € di `ATM_FEE` scelti
da D014. Sono di un'altra categoria: cambiarli costa una riga in `balance/constants.ts` e un test
che diventa rosso apposta. Reddito
base e costo dell'upgrade vengono invece dai [mockup](../design/mockups/), quindi erano già
approvati.

## Prompt pronto per una sessione nuova

```markdown
Riprendi il progetto Solvent in questa repo ed esegui la delega D011.

Leggi in quest'ordine, e non altro prima di aver finito:

1. `docs/delega/PASSAGGIO-DI-CONSEGNE.md` — stato, regole, prossimo passo
2. `docs/delega/D011-runtime-e-store.md` — la delega
3. La tabella "Cosa è già cambiato nelle deleghe ancora aperte" qui sopra: **nove righe**
   riguardano D011, e sono cose che il testo della delega non dice
4. `docs/delega/D010-dominio-income.md` e `docs/delega/D014-dominio-bancomat.md`, sezioni "Cosa
   deve sapere chi prende D011" — i due domini che il bootstrap deve montare
5. `docs/design/ciclo-di-vita.md` e `docs/design/flusso-tick.md` — gli stati e il passo fisso
6. `docs/convenzioni.md` — nomi, commit, e la lingua del codice (C08)

Stato: STOP 1 approvato, da D001 a D010 e D014 chiuse, kernel finito (535 righe), persistenza nel
main finita, i due domini della fetta 01 finiti (`income` 102 righe, `atm` 65), `npm run verify`
verde con 334 test su 42 file.

Le due trappole più facili da sbagliare:

- `tests/rules/registry-completeness` **torna secco** il giorno in cui `createGame.ts` esiste, e
  conta **un** dominio registrato — `income`. `atm` non è un sistema: non ha stato e non ticchetta.
- Il `Ledger` costruito nel bootstrap deve essere lo **stesso** che finisce nel `SystemContext` e
  quello passato a `createIncome` e `createAtm`. Due istanze sono due partite, e nessun tipo lo
  impedisce.

Come voglio che lavori:

- Un ramo per la delega: `git checkout -b d011-runtime-e-store`.
- Esegui D011 così com'è scritta. Se qualcosa si rivela sbagliato, correggilo e **scrivilo** nella
  sezione delle correzioni in fondo alla delega — non aggirarlo in silenzio. Ogni delega chiusa
  finora ne ha da cinque a undici: se la tua esce senza, o era perfetta o non l'hai letta.
- Fermati e presentami **2 opzioni** solo sulle decisioni strutturali. Il resto fallo.
- Identificatori in inglese, prosa in italiano (C08).
- Niente `TODO`, niente `any`, niente scorciatoie presentate come soluzioni.
- Un test che non hai mai visto fallire non è una rete: rompilo di proposito una volta.
- Nessun claim di completamento senza l'output reale di `npm run verify`.
- La documentazione toccata dal cambiamento si aggiorna nello stesso commit.
- Commit: Conventional Commits con lo scope uguale all'ID — `feat(D011): …`.

Con D011 `npm run verify:release` deve tornare **verde**: oggi `build` compila main e preload e si
ferma sul renderer, che nasce qui. È l'unica delega in cui quel gate cambia colore.

Quando D011 è chiusa, fermati: marcala `Chiusa` con il commit, aggiorna il passaggio di consegne
e `tracciabilita.md` se hai cambiato un meccanismo, e mostrami l'output dei gate prima di passare
alla successiva.
```
