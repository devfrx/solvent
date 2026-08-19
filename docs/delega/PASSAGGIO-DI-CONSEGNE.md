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

|                         |                                                          |
| ----------------------- | -------------------------------------------------------- |
| STOP 1                  | **approvato** — nome, stile, dipendenze, architettura    |
| D001 — tooling e gate   | **chiusa**, commit `e275f59`                             |
| D002 — contratti        | **chiusa**, commit `288367e`                             |
| D003 — kernel: Clock    | **chiusa**, commit `f398a47`                             |
| D004 — kernel: Rng      | **chiusa**, commit `a87d8cf`                             |
| D005 — kernel: Bus      | **chiusa**, commit `e9cf441`                             |
| D006 — kernel: Registry | **chiusa**, commit `39b8520`                             |
| D007 — kernel: Ledger   | **chiusa**, commit `f9a0c59`                             |
| D008 — balance          | **chiusa**, commit `e01e885`                             |
| D009 — persistenza main | **chiusa**, commit `256f622`                             |
| D010 — dominio income   | **chiusa**, commit `b98f025`                             |
| Kernel                  | **finito** — 535 righe, da D003 a D008                   |
| Persistenza nel main    | **finita** — 241 righe in `src/main/` e `src/preload/`   |
| Codice di dominio       | **`income`, 102 righe** — il primo                       |
| `npm run verify`        | **verde** — 295 test su 38 file                          |
| Prossimo passo          | **[D014 — Dominio: bancomat](D014-dominio-bancomat.md)** |

I contratti sono in `src/core/contracts/`, Clock, Rng, Bus, Registry e Ledger in
`src/core/kernel/`, i numeri di gioco in `src/core/balance/`, lo schema del salvataggio e i tre
canali IPC in `src/main/save/`, il primo dominio in `src/core/domains/income/`. Ogni delega chiusa ha in fondo le
**correzioni** rispetto a com'era scritta: [D002](D002-contratti.md) ne ha sette,
[D003](D003-kernel-clock.md) cinque, [D004](D004-kernel-rng.md) sei,
[D005](D005-kernel-bus.md) cinque, [D006](D006-kernel-registry.md) sei,
[D007](D007-kernel-ledger.md) nove, [D008](D008-balance.md) otto,
[D009](D009-persistenza-main.md) dieci, [D010](D010-dominio-income.md) dieci. Leggile prima di fidarti del
testo di una delega ancora aperta — alcune di quelle correzioni riguardano proprio deleghe che non
sono ancora state eseguite.

### Cosa è già cambiato nelle deleghe ancora aperte

Tredici cose che il testo di quelle deleghe **non** dice ancora, e che chi le esegue deve
sapere prima di iniziare. Sono qui perché una delega chiusa è un documento storico: nessuno la
rilegge.

**D014 non è più in questa tabella**: la sua delega è stata preparata il 2026-08-19 e le sedici
cose che la riguardavano — le sei che stavano qui e altre dieci — vivono dentro di lei, nella
sezione _Cosa è cambiato_. Si esegue com'è.

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
| D012   | **Tre codici d'errore di dominio sono nuovi** e vogliono la loro chiave i18n, come ogni `code` (INV-07): `error.income.already_upgraded` da D010, più `error.atm.amount_not_positive` e `error.atm.fee_exceeds_amount`, dichiarati nella delega di D014                                                                                                                                                      |
| tutte  | **Il codice si scrive in inglese.** Identificatori — variabili, parametri, funzioni, tipi, costanti, chiavi di oggetto, nomi di file — in inglese; prosa — commenti, messaggi degli errori lanciati, descrizioni dei test — in italiano. È la regola C08 di [convenzioni.md](../convenzioni.md), imposta da `tests/rules/english-identifiers`, che è ⚠️ parziale e lo dichiara                               |
| tutte  | **Alcuni nomi sono cambiati con quel refactor.** L'helper dei test è `tests/helpers/sources.ts` e espone `read`, `withoutComments`, `sourceFiles`, `importsOf`. Cinque test di regola sono stati rinominati (`bus-synchronous`, `main-save-only`, `registry-no-special-cases`, `doc-links`, `ledger-capacity`). L'unica API pubblica che cambia nome è `seedCasuale` → **`randomSeed`**                      |
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

**[D014 — Dominio: bancomat](D014-dominio-bancomat.md).** Il gesto centrale del gioco:
`src/core/domains/atm/` con `rules.ts` puro e `commands.ts`, più una riga in
`balance/constants.ts`. **~110 righe**: è la delega più piccola rimasta, ed è quella che rende la
dualità contanti/carta una scelta invece che un'etichetta.

Il grafo lo mette accanto a D010, prima di D011: ha il numero più alto solo perché è nato dopo.

Il testo della delega è stato **preparato il 2026-08-19**: contiene già le sedici cose cambiate da
quando fu scritta, i tre codici d'errore per esteso e il budget rimisurato. Si esegue com'è, e la
sezione _Cosa è cambiato_ si legge per prima.

Due cose sono decise **dentro** la delega, in autonomia, e sono **contestabili**. Costano zero
adesso perché nessuna riga di codice le applica, e il momento per dire che non convincono è prima
che qualcuno scriva quel codice:

1. **Il bancomat non ha stato**, quindi non ha un `system.ts`. Le soglie sono fuori scopo per
   dichiarazione della delega stessa, e le "ultime operazioni" del mockup contengono anche lo
   stipendio: sono il flusso di `money.posted`, cioè un mirror dello store, non lo stato di un
   dominio.
2. **La commissione è un importo fisso** — `ATM_FEE = 2,50 €` — e non una percentuale. Non è una
   scelta di gusto: la definizione di fatto pretende il caso "commissione superiore all'importo",
   che una percentuale non produce mai.

E una trappola nuova, trovata preparando: **`accepts` non si dichiara in un trasferimento.** Il
Ledger controlla ogni movimento su un pool del giocatore, quindi `accepts: ['card']` su un prelievo
farebbe rifiutare il movimento in **arrivo** sui contanti. È il contrario del caso dell'upgrade di
D010, dove il pool del giocatore era uno solo.

Poi si prosegue col grafo in [delega/README.md](README.md): D011 e D012 il runtime e la UI, D013 la
verifica finale — che è lo **STOP 2**, dove ci si ferma di nuovo.

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

Otto, prese in autonomia. Le prime quattro sono **in vigore** da D007: il Ledger le scrive.
Cambiarle non costa più zero — costa il Ledger e i suoi test, che è ancora poco ma non è più
niente. Il prossimo momento buono per contestarle è prima di D014, il primo dominio che le usa.

La quinta e la sesta sono del 2026-08-19, nascono dalla revisione della visione e **non costano
ancora niente**: nessuna riga di codice le applica.

La settima è **in vigore da D009**, ed è stata sollevata prima di scrivere il main come una
decisione contestabile: costa il main, il preload e i loro test.

L'ottava è **in vigore da D010** ed è la più giovane: costa il primo dominio e il bootstrap che
D011 non ha ancora scritto. È il momento più economico per contestarla, e non lo resterà a lungo —
D014 la userà per il secondo dominio.

| Cosa                                                            | ADR                                                                                                                       | Alternativa scartata                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Ogni transazione somma a zero (partita doppia)                  | [0020](../adr/0020-partita-doppia.md)                                                                                     | movimenti singoli con categoria                                                                          |
| Il Ledger espone transazioni, non movimenti                     | [0019](../adr/0019-transazioni-atomiche-nel-ledger.md)                                                                    | due `post()` con rollback nel chiamante                                                                  |
| I pool dichiarano le proprie affordance come dati               | [0017](../adr/0017-il-denaro-e-plurale.md)                                                                                | un saldo unico con etichette nella UI                                                                    |
| `post()` non esiste: una primitiva sola                         | [0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)                                                                   | zucchero a due movimenti, che però rimette `world` e `sink` nei domini                                   |
| Il Ledger avrà conti dinamici, non solo sei pool                | [0022](../adr/0022-il-ledger-ha-conti-non-solo-pool.md)                                                                   | il budget di un'attività tenuto come stato del dominio                                                   |
| Il tempo di gioco è un dominio, non il kernel                   | [0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                                                          | un `now` nel `SystemContext`, che aggiunge una chiave al salvataggio                                     |
| I tipi d'esito del salvataggio stanno in `contracts/save.ts`    | [D009](D009-persistenza-main.md#il-contratto-cresce) — non ha un ADR: è una conseguenza di INV-03, non una decisione a sé | allargare INV-03 a tutto `contracts/`, cioè un allowlist di un file che diventa un denylist da mantenere |
| Un sistema riceve per costruzione ciò che il contesto non porta | [0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)                                     | un singleton in `balance/`: nessun parametro in più, e una dipendenza che sparisce dalle firme           |

Sono contestabili anche i **numeri** scelti da D008 — il moltiplicatore ×1,5 dell'upgrade, le otto
ore di tetto al recupero, l'intervallo 700–740 del primo minuto — ma sono di un'altra categoria:
cambiarli costa una riga in `balance/constants.ts` e un test che diventa rosso apposta. Reddito
base e costo dell'upgrade vengono invece dai [mockup](../design/mockups/), quindi erano già
approvati.

## Prompt pronto per una sessione nuova

```markdown
Riprendi il progetto Solvent in questa repo ed esegui la delega D014.

Leggi in quest'ordine, e non altro prima di aver finito:

1. `docs/delega/PASSAGGIO-DI-CONSEGNE.md` — stato, regole, prossimo passo
2. `docs/delega/D014-dominio-bancomat.md` — la delega, **sezione "Cosa è cambiato" per prima**
3. `docs/delega/D010-dominio-income.md`, sezione "Cosa deve sapere chi prende D014" — il primo
   dominio è già scritto, e la forma di un dominio è decisa lì
4. `docs/convenzioni.md` — nomi, commit, e la lingua del codice (C08)

Stato: STOP 1 approvato, da D001 a D010 chiuse, kernel finito (535 righe), persistenza nel main
finita, primo dominio (`income`) finito, `npm run verify` verde con 295 test su 38 file.

La delega è stata **preparata il 2026-08-19**: contiene già le sedici cose cambiate da quando fu
scritta, i tre codici d'errore per esteso e il budget rimisurato (~110 righe). Si esegue com'è.

Due decisioni prese in autonomia ti aspettano dentro, e sono **contestabili** — stanno sotto "Le
due decisioni prese qui":

- il bancomat **non ha stato**, quindi niente `types.ts` e niente `system.ts`;
- la commissione è un **importo fisso** (`ATM_FEE = 2,50 €`), non una percentuale.

Se non ti convincono, dillo **prima** di scrivere codice: dopo costa il dominio e i suoi test.

Come voglio che lavori:

- Un ramo per la delega: `git checkout -b d014-dominio-bancomat`.
- Esegui D014 così com'è scritta. Se qualcosa si rivela sbagliato, correggilo e **scrivilo** nella
  sezione delle correzioni in fondo alla delega — non aggirarlo in silenzio. Ogni delega chiusa
  finora ne ha da cinque a dieci: se la tua esce senza, o era perfetta o non l'hai letta.
- Fermati e presentami **2 opzioni** solo sulle decisioni strutturali. Il resto fallo.
- Identificatori in inglese, prosa in italiano (C08).
- Niente `TODO`, niente `any`, niente scorciatoie presentate come soluzioni.
- Un test che non hai mai visto fallire non è una rete: rompilo di proposito una volta.
- Nessun claim di completamento senza l'output reale di `npm run verify`.
- La documentazione toccata dal cambiamento si aggiorna nello stesso commit.
- Commit: Conventional Commits con lo scope uguale all'ID — `feat(D014): …`.

Aspettati che `npm run verify:release` resti rosso: `build` compila main e preload e si ferma sul
renderer, che nasce con D011. Non è una regressione e non va sistemata.

Quando D014 è chiusa, fermati: marcala `Chiusa` con il commit, aggiorna il passaggio di consegne
e `tracciabilita.md` se hai cambiato un meccanismo, e mostrami l'output dei gate prima di passare
alla successiva.
```
