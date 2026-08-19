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

|                          |                                                                          |
| ------------------------ | ------------------------------------------------------------------------ |
| STOP 1                   | **approvato** — nome, stile, dipendenze, architettura                    |
| D001 — tooling e gate    | **chiusa**, commit `e275f59`                                             |
| D002 — contratti         | **chiusa**, commit `288367e`                                             |
| D003 — kernel: Clock     | **chiusa**, commit `f398a47`                                             |
| D004 — kernel: Rng       | **chiusa**, commit `a87d8cf`                                             |
| D005 — kernel: Bus       | **chiusa**, commit `e9cf441`                                             |
| D006 — kernel: Registry  | **chiusa**, commit `39b8520`                                             |
| D007 — kernel: Ledger    | **chiusa**, commit `f9a0c59`                                             |
| D008 — balance           | **chiusa**, commit `e01e885`                                             |
| D009 — persistenza main  | **chiusa**, commit `256f622`                                             |
| D010 — dominio income    | **chiusa**, commit `b98f025`                                             |
| D014 — dominio bancomat  | **chiusa**, commit `a0b3b9f`                                             |
| D011 — runtime e store   | **chiusa**, commit `dbf821c`                                             |
| D012 — guscio e parole   | **chiusa**, commit `fb45d71`                                             |
| Kernel                   | **finito** — 535 righe, da D003 a D008                                   |
| Persistenza nel main     | **finita** — 244 righe in `src/main/` e `src/preload/`                   |
| Codice di dominio        | **`income` 104 righe, `atm` 64** — i due della fetta 01                  |
| Renderer                 | **vestito** — 1.070 righe, di cui 318 di parole                          |
| `npm run verify`         | **verde** — 436 test su 49 file, ~35 s                                   |
| `npm run verify:release` | **verde** — il renderer compila: 71 moduli, 536 kB                       |
| Prossimo passo           | **[D015 — La home: bancomat, carta e cruscotto](D015-home-bancomat.md)** |

I conteggi di riga sono **righe di codice, commenti e righe vuote escluse**, e sono stati
rimisurati qui: il numero del kernel viene da D008 e usa un altro metodo.

I contratti sono in `src/core/contracts/`, Clock, Rng, Bus, Registry e Ledger in
`src/core/kernel/`, i numeri di gioco in `src/core/balance/`, lo schema del salvataggio e i tre
canali IPC in `src/main/save/`, i due domini in `src/core/domains/`. In `src/renderer/` ci sono il
bootstrap, il loop, l'unico store, il guscio `App.vue`, le due viste sotto `views/`, il pannello
dell'upgrade sotto `components/` e le parole del gioco sotto `i18n/`. Ogni delega chiusa ha in
fondo le
**correzioni** rispetto a com'era scritta: [D002](D002-contratti.md) ne ha sette,
[D003](D003-kernel-clock.md) cinque, [D004](D004-kernel-rng.md) sei,
[D005](D005-kernel-bus.md) cinque, [D006](D006-kernel-registry.md) sei,
[D007](D007-kernel-ledger.md) nove, [D008](D008-balance.md) otto,
[D009](D009-persistenza-main.md) dieci, [D010](D010-dominio-income.md) dieci,
[D014](D014-dominio-bancomat.md) undici, [D011](D011-runtime-e-store.md) quattordici,
[D012](D012-ui-e-i18n.md) diciassette. Leggile prima di fidarti del
testo di una delega ancora aperta — alcune di quelle correzioni riguardano proprio deleghe che non
sono ancora state eseguite.

### Cosa è già cambiato nelle deleghe ancora aperte

Diciotto cose che il testo di quelle deleghe **non** dice ancora, e che chi le esegue deve sapere
prima di iniziare. Sono qui perché una delega chiusa è un documento storico: nessuno la rilegge.

**D012 è chiusa** e non è più in questa tabella. Restano D015 e D013, e quasi tutto ciò che le
riguarda viene dalle correzioni di D012 — che ha toccato lo store, il dominio `income`,
l'architettura del renderer e due documenti di disegno.

| Delega    | Cosa è cambiato                                                                                                                                                                                                                                                                                                 |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D015      | **Il riquadro "cosa succede" del mockup del bancomat è una chiamata sola**: `previewOf(operation, amount)` ritorna i tre movimenti da mostrare, che sono gli **stessi** che il comando applicherà. La UI non ricalcola niente, e se l'anteprima è un errore mostra il codice invece di spegnere il pulsante     |
| D015      | **Il dizionario è completo**, chiavi `atm.*` e `card.*` comprese: si usano, non si aggiungono. Le uniche che mancano davvero sono le etichette dei **sei riquadri del cruscotto**, lasciate a chi decide quali sono i sei (INV-12)                                                                              |
| D015      | **Le parole si chiedono a `useTranslator()`**, che dà `text`, `count`, `money`, `instant`, `duration`, `poolName` e `failure`. `money` è l'unico posto autorizzato a convertire un `Money` in numero (ADR 0006): un `.vue` che chiama `toDisplayNumber` da sé sta aprendo il secondo                            |
| D015      | **`failure(error)` è uno `switch` esaustivo** su `GameError`. Un codice nuovo **non compila** finché non ha la sua frase: è INV-07 diventato un errore del compilatore. Aggiungerlo significa il `case`, la chiave e i due testi                                                                                |
| D015      | **I selettori sono mirror, non `computed`.** Il registro dei modificatori vive in `core/` e non è reattivo (ADR 0001): una `computed` costruita su di lui non si ricalcolerebbe mai. E un `Money` esposto **nudo** da uno store Pinia viene avvolto in un proxy alla lettura, quindi va dentro uno `shallowRef` |
| D015      | **I token di stile esistono**, in un blocco `<style>` non scoped dentro `App.vue`: `--panel`, `--line`, `--accent`, `--danger`, più le classi `panel`, `caption`, `amount`, `primary`, `ghost`. Il resto del CSS sta attaccato al componente che lo usa (difetto A14)                                           |
| D015      | **La navigazione è un `ref`, non un router**, e le destinazioni sono due: `home` e `stats`. Il grilletto per `vue-router` è nel [registro YAGNI](../roadmap-fette.md)                                                                                                                                           |
| D015      | **`store.history` porta la `Transaction` intera** ma nessuno ne mostra ancora gli importi: sommare i movimenti è un calcolo, e un calcolo non si fa in un `.vue` (R05). Serve un selettore, e nasce con il pannello che lo consuma                                                                              |
| D015+D013 | **Con la sola D012 l'upgrade non si compra dallo schermo**: il reddito entra in contanti, l'upgrade si paga con la carta, e il ponte è il bancomat. Chiude D015, ed è la prima cosa che D013 deve provare a mano — guadagna, deposita, compra                                                                   |
| D015+D013 | **`Ledger.balances()` esiste**: tutti i saldi insieme, nella forma che `money.posted` porta. Lo store lo usa dopo un caricamento, che non emette niente perché caricare non è un movimento economico (D011, correzione 4)                                                                                       |
| D013      | **`failed` ha due cause e due uscite diverse**, e a distinguerle è `failedDuring`, non il codice dell'errore. Il diagramma di [ciclo-di-vita.md](../design/ciclo-di-vita.md) ha adesso gli archi `Chiusura → Errore`, `Errore → Caricamento` ed `Errore → Chiusura`                                             |
| D013      | **jsdom non è entrato con D012**, contro ciò che `tracciabilita.md` dichiarava: nessun test monta un componente, e `runtime/host.ts` resta l'unico file senza test. Il grilletto è stato riscritto nel registro YAGNI                                                                                           |
| tutte     | **R05 vieta anche i tipi.** Un `.vue` non può scrivere `import type { IncomeError } from '@core/domains/income/commands'`: il lint usa la regola base, che non distingue un import di tipo. Le unioni che servono alla UI vivono in `renderer/i18n/index.ts`                                                    |
| tutte     | **Il codice si scrive in inglese.** Identificatori in inglese; prosa — commenti, messaggi degli errori lanciati, descrizioni dei test — in italiano. È la regola C08 di [convenzioni.md](../convenzioni.md), imposta da `tests/rules/english-identifiers`, che è ⚠️ parziale e lo dichiara                      |
| tutte     | **`english-identifiers` ha un punto cieco che produce falsi positivi**, e ora lo dichiara: una classe di caratteri che elenca le virgolette dentro un `/regex/` manda fuori fase la sua scansione. L'aggiramento è costruire la classe come stringa e passarla a `new RegExp` — `no-literal-in-template` lo fa  |
| tutte     | **Un importo di gioco non può nascere dentro un dominio**: `no-magic-numbers` guarda i **numeri**, ma `Money` si costruisce da una **stringa**. Lo ferma `tests/rules/domains-no-money-literals` (D014, correzione 2)                                                                                           |
| tutte     | **INV-10 non è più un `grep`, è un test**: `tests/rules/domains-no-internal-pools` deriva da `POOLS` i conti che un dominio non può nominare — sono **quattro**, `house` compreso — e toglie i commenti prima di guardare                                                                                       |
| tutte     | Un `eslint-disable` senza motivazione è un test rosso, non un appunto di review (C06)                                                                                                                                                                                                                           |

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

**[D015 — La home: bancomat, carta e cruscotto](D015-home-bancomat.md).** ~720 righe di sorgente.
La schermata che rende la dualità contanti/carta una cosa che si tocca: la carta si gira, il
bancomat mostra la commissione **prima** della conferma, e il cruscotto dice come sta andando.

Specifica visiva: **[home-atm.html](../design/mockups/home-atm.html)**. Il budget è misurato su di
lui: 407 righe di CSS non vuote in tre blocchi, 216 di markup. Attenzione, però: la stessa misura
fatta su D012 si è rivelata **due volte e mezzo più bassa** del consuntivo, perché contava la
schermata e non ciò che la delega si portava dentro. Qui il rischio è minore — il dizionario è già
scritto — ma il numero resta una misura, non una promessa.

Quando D015 chiude, la fetta 01 è completa e si passa a
**[D013 — Verifica della fetta](D013-verifica-della-fetta.md)**, che è lo **STOP 2**: ~250 righe di
test, nessun codice nuovo, e la decisione sulla fetta 02.

Quattro cose che il testo di D015 non dice, e che cambiano da dove si parte:

1. **Il dizionario è completo.** Le chiavi `atm.*` e `card.*` esistono in entrambe le lingue: qui si
   usano. Mancano solo le sei etichette del cruscotto, perché quali siano i sei lo decide D015.
2. **Le parole si chiedono a `useTranslator()`**, e `money()` è l'unico posto autorizzato a
   convertire un `Money` in numero. `failure(error)` traduce il codice di un `Result` fallito con
   dentro i suoi numeri, ed è uno `switch` esaustivo: un codice nuovo non compila senza la frase.
3. **I selettori sono mirror, non `computed`**, e un `Money` non si espone nudo da uno store Pinia.
   Le due ragioni sono le correzioni 5 e 6 di [D012](D012-ui-e-i18n.md), e valgono uguali per
   `atmFee` e per l'anteprima.
4. **La fetta 01 diventa giocabile solo qui.** Il reddito entra in contanti, l'upgrade si paga con
   la carta: finché il bancomat non ha una schermata, a schermo l'acquisto può solo essere rifiutato.

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

Sedici, prese in autonomia. Le prime quattro sono **in vigore** da D007 e sono state usate da due
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

Le ultime quattro sono di **D012**. Costano il dizionario, il guscio e le quattro schermate: poco
oggi, perché D015 non è ancora scritta, e molto il giorno dopo — le chiavi piatte e i mirror sono
la forma che D015 erediterà senza discutere.

| Cosa                                                                        | ADR                                                                                                                       | Alternativa scartata                                                                                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ogni transazione somma a zero (partita doppia)                              | [0020](../adr/0020-partita-doppia.md)                                                                                     | movimenti singoli con categoria                                                                                                                    |
| Il Ledger espone transazioni, non movimenti                                 | [0019](../adr/0019-transazioni-atomiche-nel-ledger.md)                                                                    | due `post()` con rollback nel chiamante                                                                                                            |
| I pool dichiarano le proprie affordance come dati                           | [0017](../adr/0017-il-denaro-e-plurale.md)                                                                                | un saldo unico con etichette nella UI                                                                                                              |
| `post()` non esiste: una primitiva sola                                     | [0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)                                                                   | zucchero a due movimenti, che però rimette `world` e `sink` nei domini                                                                             |
| Il Ledger avrà conti dinamici, non solo sei pool                            | [0022](../adr/0022-il-ledger-ha-conti-non-solo-pool.md)                                                                   | il budget di un'attività tenuto come stato del dominio                                                                                             |
| Il tempo di gioco è un dominio, non il kernel                               | [0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                                                          | un `now` nel `SystemContext`, che aggiunge una chiave al salvataggio                                                                               |
| I tipi d'esito del salvataggio stanno in `contracts/save.ts`                | [D009](D009-persistenza-main.md#il-contratto-cresce) — non ha un ADR: è una conseguenza di INV-03, non una decisione a sé | allargare INV-03 a tutto `contracts/`, cioè un allowlist di un file che diventa un denylist da mantenere                                           |
| Un sistema riceve per costruzione ciò che il contesto non porta             | [0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)                                     | un singleton in `balance/`: nessun parametro in più, e una dipendenza che sparisce dalle firme                                                     |
| Un dominio senza stato non ha un `system.ts` e non si registra              | [D014](D014-dominio-bancomat.md) — decisione 1                                                                            | inventargli uno stato per riempire il file: un contatore che nessuna schermata mostra, più una migrazione il giorno in cui la forma giusta si vede |
| La commissione del bancomat è un importo fisso, non una percentuale         | [D014](D014-dominio-bancomat.md) — decisione 2                                                                            | una percentuale, che però non produce **mai** il caso "commissione superiore all'importo" — e quel caso è metà del valore della fetta              |
| D011 produce anche l'ingresso del renderer, non solo i tre file dichiarati  | [D011](D011-runtime-e-store.md) — correzione 6                                                                            | lasciare `verify:release` rosso fino a D012, e chiudere D011 senza aver mai eseguito il proprio loop                                               |
| Se il salvataggio finale fallisce, la finestra **non** si chiude            | [D011](D011-runtime-e-store.md) — correzione 13                                                                           | chiudere comunque: comodo, e perde l'unica copia esistente della partita                                                                           |
| Il saldo della home mostra i **due pool del giocatore**, non una cifra sola | [D012](D012-ui-e-i18n.md) — correzione 7                                                                                  | la cifra sola del mockup, sotto cui il messaggio «ti servono 800,00 €, ne hai 0,00 €» è incomprensibile                                            |
| Le chiavi i18n sono **piatte**, non una gerarchia di oggetti                | [D012](D012-ui-e-i18n.md) — correzione 9                                                                                  | l'annidamento, in cui `atm.withdraw.title` prende il posto di `atm.withdraw` senza che nulla lo dica                                               |
| La navigazione è un `ref`, non un router                                    | [D012](D012-ui-e-i18n.md) — [registro YAGNI](../roadmap-fette.md)                                                         | `vue-router`: una dipendenza, quindi un ADR (ADR 0015), per due destinazioni senza indirizzo                                                       |
| jsdom resta fuori: le verifiche a occhio diventano test per un'altra strada | [D012](D012-ui-e-i18n.md) — correzione 15                                                                                 | `jsdom` + `@vue/test-utils`, cioè due dipendenze e un ADR, per montare componenti che la definizione di fatto non chiede di montare                |

Sono contestabili anche i **numeri**: il moltiplicatore ×1,5 dell'upgrade, le otto ore di tetto al
recupero e l'intervallo 700–740 del primo minuto scelti da D008, più i 2,50 € di `ATM_FEE` scelti
da D014. Sono di un'altra categoria: cambiarli costa una riga in `balance/constants.ts` e un test
che diventa rosso apposta. Reddito
base e costo dell'upgrade vengono invece dai [mockup](../design/mockups/), quindi erano già
approvati.

## Prompt pronto per una sessione nuova

```markdown
Riprendi il progetto Solvent in questa repo ed esegui la delega D015.

Leggi in quest'ordine, e non altro prima di aver finito:

1. `docs/delega/PASSAGGIO-DI-CONSEGNE.md` — stato, regole, prossimo passo
2. `docs/delega/D015-home-bancomat.md` — la delega, **sezione "Cosa trovi già fatto" per prima**
3. La tabella "Cosa è già cambiato nelle deleghe ancora aperte" qui sopra: **dieci righe**
   riguardano D015, e sono cose che il testo della delega non dice
4. `docs/delega/D012-ui-e-i18n.md`, sezione "Cosa deve sapere chi prende D015" — le parole, i
   selettori, i token di stile, e le diciassette correzioni che stanno sopra
5. `docs/design/mockups/home-atm.html` — è la specifica, e ogni testo visibile ha già la sua
   chiave i18n scritta sotto
6. `docs/convenzioni.md` — nomi, commit, e la lingua del codice (C08)

Stato: STOP 1 approvato. Chiuse da D001 a D012 e D014; restano aperte solo D015 e D013.
Kernel finito,
persistenza nel main finita, i due domini della fetta 01 finiti, runtime e store finiti, e da D012
il renderer è vestito: guscio, navigazione, saldo, upgrade, due dizionari completi.
`npm run verify` verde con 436 test su 49 file in ~35 s, e **`npm run verify:release` è verde**:
un renderer che non compila è una regressione.

D015 vale ~720 righe di sorgente. È l'ultima delega di codice della fetta 01: dopo di lei c'è
D013, che è lo STOP 2.

Come voglio che lavori:

- Un ramo per la delega: `git checkout -b d015-home-bancomat`.
- Esegui D015 così com'è scritta. Se qualcosa si rivela sbagliato, correggilo e **scrivilo** nella
  sezione delle correzioni in fondo alla delega — non aggirarlo in silenzio. Ogni delega chiusa
  finora ne ha da cinque a diciassette: se la tua esce senza, o era perfetta o non l'hai letta.
- Fermati e presentami **2 opzioni** solo sulle decisioni strutturali. Il resto fallo.
- Identificatori in inglese, prosa in italiano (C08).
- Niente `TODO`, niente `any`, niente scorciatoie presentate come soluzioni.
- Un test che non hai mai visto fallire non è una rete: rompilo di proposito una volta.
- Nessun claim di completamento senza l'output reale di `npm run verify`.
- La documentazione toccata dal cambiamento si aggiorna nello stesso commit.
- Commit: Conventional Commits con lo scope uguale all'ID — `feat(D015): …`.

Quattro cose che il codice ti dà già e che non vanno riscritte:

- **`previewOf(operation, amount)`** ritorna i tre movimenti del riquadro _cosa succede_, e sono
  gli **stessi** che il comando applica. Non ricalcolare la commissione: `atmFee()` esiste.
- **Il dizionario è completo**, chiavi `atm.*` e `card.*` comprese. Mancano solo le sei etichette
  del cruscotto, perché quali siano i sei lo decidi tu (INV-12: il settimo sostituisce).
- **Le parole si chiedono a `useTranslator()`** — `text`, `count`, `money`, `instant`, `duration`,
  `poolName`, `failure`. `money` è l'unico posto autorizzato a convertire un `Money` (ADR 0006).
- **I token di stile esistono**, in un `<style>` non scoped dentro `App.vue`, con le classi
  `panel`, `caption`, `amount`, `primary`, `ghost`.

Due trappole che D012 ha già pagato, e che qui si ripresentano identiche:

- **Un selettore non può essere una `computed`** se legge qualcosa che vive in `core/`: quel
  qualcosa non è reattivo, e la `computed` non si ricalcolerebbe mai. Sono mirror.
- **Un `Money` esposto nudo da uno store Pinia** viene avvolto in un proxy alla lettura e smette
  di essere il `Decimal` che il dominio ha prodotto. Va dentro uno `shallowRef`.

Il test del cruscotto (`tests/rules/home-tiles`) va scritto **prima** dei riquadri, non dopo: è il
punto in cui sei riquadri diventano otto senza che nessuno decida.

Per vedere il gioco girare: `npm run dev`. Se dice _Electron uninstall_, completa il binario con
`node node_modules/electron/install.js`.

Quando D015 è chiusa, fermati: marcala `Chiusa` con il commit, aggiorna il passaggio di consegne e
`tracciabilita.md` se hai cambiato un meccanismo, e mostrami l'output dei gate prima di passare
alla successiva — che è D013, lo STOP 2.
```
