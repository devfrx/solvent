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
| D015 — home e bancomat   | **chiusa**, commit `__COMMIT__`                                          |
| Kernel                   | **finito** — 535 righe, da D003 a D008                                   |
| Persistenza nel main     | **finita** — 244 righe in `src/main/` e `src/preload/`                   |
| Codice di dominio        | **`income` 104 righe, `atm` 64** — i due della fetta 01                  |
| Fetta 01                 | **giocabile**: guadagna in contanti, deposita, compra con la carta       |
| Renderer                 | **finito** — 1.725 righe, di cui 456 di CSS e 365 sotto `i18n/`          |
| `npm run verify`         | **verde** — 477 test su 52 file, ~28 s                                   |
| `npm run verify:release` | **verde** — il renderer compila: 88 moduli, 562 kB                       |
| Prossimo passo           | **[D013 — Verifica della fetta](D013-verifica-della-fetta.md)** — STOP 2 |

I conteggi di riga sono **righe di codice, commenti e righe vuote escluse**, e sono stati
rimisurati qui: il numero del kernel viene da D008 e usa un altro metodo.

I contratti sono in `src/core/contracts/`, Clock, Rng, Bus, Registry e Ledger in
`src/core/kernel/`, i numeri di gioco in `src/core/balance/`, lo schema del salvataggio e i tre
canali IPC in `src/main/save/`, i due domini in `src/core/domains/`. In `src/renderer/` ci sono il
bootstrap, il loop, l'unico store, il guscio `App.vue`, le due viste sotto `views/`, sette pezzi
sotto `components/` — cinque componenti e due moduli puri, la rotazione della carta e la scelta dei
movimenti da mostrare — e le parole del gioco sotto `i18n/`. Ogni delega chiusa ha in fondo le
**correzioni** rispetto a com'era scritta: [D002](D002-contratti.md) ne ha sette,
[D003](D003-kernel-clock.md) cinque, [D004](D004-kernel-rng.md) sei,
[D005](D005-kernel-bus.md) cinque, [D006](D006-kernel-registry.md) sei,
[D007](D007-kernel-ledger.md) nove, [D008](D008-balance.md) otto,
[D009](D009-persistenza-main.md) dieci, [D010](D010-dominio-income.md) dieci,
[D014](D014-dominio-bancomat.md) undici, [D011](D011-runtime-e-store.md) quattordici,
[D012](D012-ui-e-i18n.md) e [D015](D015-home-bancomat.md) diciassette. Leggile prima di fidarti del
testo di una delega ancora aperta — alcune di quelle correzioni riguardano proprio deleghe che non
sono ancora state eseguite.

### Cosa è già cambiato nelle deleghe ancora aperte

Undici cose che il testo di quella delega **non** dice ancora, e che chi la esegue deve sapere
prima di iniziare. Sono qui perché una delega chiusa è un documento storico: nessuno la rilegge.

**Resta aperta solo D013**, che è lo STOP 2. Quasi tutto ciò che la riguarda viene dalle correzioni
di [D015](D015-home-bancomat.md), che ha toccato la home, lo store, il dizionario e cinque
documenti di disegno.

| Delega | Cosa è cambiato                                                                                                                                                                                                                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D013   | **La fetta 01 è giocabile, ed è stata giocata**: guadagna, deposita, compra. Il giro è stato percorso a mano e i numeri sono scritti nella nota di chiusura di [D015](D015-home-bancomat.md) — 500 prelevati diventano 497,50 sui contanti e 2,50 di commissione, e le ultime operazioni lo mostrano     |
| D013   | **Il gioco si fa girare senza Electron**: bundle di produzione (`npm run build`), le tre funzioni di `SaveApi` finte al posto del preload, e un salvataggio con dei soldi dentro. In una finestra che non compone frame `requestAnimationFrame` non scatta e il reddito non entra mai — non è un difetto |
| D013   | **`failed` ha due cause e due uscite diverse**, e a distinguerle è `failedDuring`, non il codice dell'errore. Il diagramma di [ciclo-di-vita.md](../design/ciclo-di-vita.md) ha gli archi `Chiusura → Errore`, `Errore → Caricamento` ed `Errore → Chiusura`                                             |
| D013   | **jsdom non è entrato**, contro il grilletto che il registro YAGNI aveva scritto: la carta 3D e il pannello del bancomat esistono, ma la loro parte sbagliabile è uscita in due moduli puri — `components/rotation.ts` e `components/postings.ts`. Il grilletto è stato riscritto, non tirato            |
| D013   | **Il cruscotto ha cinque riquadri e il tetto è sei.** Il posto libero è voluto (INV-12 è un tetto, non una quota). `tests/rules/home-tiles` è ⚠️ parziale: conta i tag e rifiuta un `v-for` su un riquadro, ma un `v-for` su un contenitore che ne avvolge uno le sfugge                                 |
| D013   | **I cinque numeri del cruscotto si tengono fra loro**: guadagnato − speso − commissioni = patrimonio netto, sempre. È INV-08 vista dal lato del giocatore, e ha un test suo — se un giorno non tornasse, il difetto sarebbe nel Ledger                                                                   |
| D013   | **`store.deposit` e `store.withdraw` non esistono più**: c'è `preview(kind, amount)` e `confirm(kind, amount)`, e leggono la **stessa riga** di una tabella sola. Separati, un giorno «Deposita» mostrerebbe l'anteprima di un prelievo                                                                  |
| tutte  | **R05 vieta anche i tipi.** Un `.vue` non può scrivere `import type { IncomeError } from '@core/domains/income/commands'`: il lint usa la regola base, che non distingue un import di tipo. Le unioni che servono alla UI vivono in `renderer/i18n/index.ts`                                             |
| tutte  | **Il codice si scrive in inglese.** Identificatori in inglese; prosa — commenti, messaggi degli errori lanciati, descrizioni dei test — in italiano. È la regola C08 di [convenzioni.md](../convenzioni.md), imposta da `tests/rules/english-identifiers`, che è ⚠️ parziale e lo dichiara               |
| tutte  | **Un importo di gioco non può nascere dentro un dominio**: `no-magic-numbers` guarda i **numeri**, ma `Money` si costruisce da una **stringa**. Lo ferma `tests/rules/domains-no-money-literals` (D014, correzione 2)                                                                                    |
| tutte  | Un `eslint-disable` senza motivazione è un test rosso, non un appunto di review (C06)                                                                                                                                                                                                                    |

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

**[D013 — Verifica della fetta](D013-verifica-della-fetta.md)**, che è lo **STOP 2**: ~250 righe di
test, **nessun codice nuovo**, e la decisione sulla fetta 02.

La fetta 01 è completa e giocabile. Il giro si chiude a schermo — si guadagna in contanti, si
deposita al bancomat pagando la commissione, si compra l'upgrade con la carta, e il reddito sale da
12,00 a 18,00 €/s. D015 l'ha percorso a mano e ha scritto i numeri nella propria nota di chiusura:
D013 non parte da zero, ma è il suo mestiere rifarlo senza fidarsi.

Cinque cose che il testo di D013 non dice, e che cambiano da dove si parte:

1. **Il gioco si fa girare senza Electron**, ed è l'unico modo in un ambiente che non compone
   frame: `npm run build`, la pagina servita da `out/renderer/`, le tre funzioni di `SaveApi`
   finte al posto del preload, e un salvataggio con dei soldi dentro al posto del tempo che non
   passa. Senza frame `requestAnimationFrame` non scatta e il reddito non entra mai.
2. **jsdom continua a non esserci**, e il suo grilletto è stato riscritto per la seconda volta: non
   più «il primo componente con stato locale non banale» — la carta 3D e il pannello del bancomat
   esistono — ma il primo comportamento che **non** si riesce a estrarre in una funzione pura.
3. **`tests/rules/home-tiles` è ⚠️ parziale e lo dichiara.** Se D013 vuole chiudere il buco — un
   `v-for` su un contenitore — quella è la strada di jsdom, con il suo ADR.
4. **Il cruscotto ha un posto libero.** Cinque riquadri su sei: se la verifica della fetta fa
   nascere una statistica che manca, c'è dove metterla. Il settimo no.
5. **`verify` sta a ~28 s** e `verify:release` aggiunge la compilazione. La soglia dichiarata in
   [qualita.md](../qualita.md) è il minuto.

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

## Le decisioni contestabili

Ventuno, prese in autonomia. Le prime quattro sono **in vigore** da D007 e sono state usate da due
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

Le ultime cinque sono di **D015**, e costano la home. Due riguardano cosa il gioco **non** mostra —
i tre numeri del retro della carta e il sesto riquadro — e sono le meno costose da cambiare: i dati
arriveranno, e i posti sono lì ad aspettarli. La terza è un numero di gioco travestito da
interfaccia. La quarta torna sul tavolo a ogni componente nuovo, ed è giusto così.

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
| Il cruscotto ha **cinque** riquadri, non sei: il tetto è un tetto           | [D015](D015-home-bancomat.md) — correzione 1                                                                              | riempire il sesto posto con un numero inventato, che è anche il posto che la fetta 02 userà davvero                                                |
| Il retro della carta porta le affordance del pool, non tre numeri finti     | [D015](D015-home-bancomat.md) — correzione 3                                                                              | plafond, limite e punteggio di credito come li disegna il mockup: dati che nella fetta 01 non esistono                                             |
| L'importo si sceglie fra quattro, e il più piccolo è rifiutato apposta      | [D015](D015-home-bancomat.md) — correzione 5                                                                              | un campo di testo, che apre il confine «chi trasforma una stringa digitata in `Money`» e cosa succede quando non è un numero                       |
| jsdom resta fuori una **seconda** volta: si estrae invece di montare        | [D015](D015-home-bancomat.md) — correzione 13                                                                             | tirare il grilletto che il registro YAGNI aveva scritto: due dipendenze e un ADR per provare quattro funzioni pure                                 |
| Le righe di una transazione hanno il segno: nasce `signedMoney`             | [D015](D015-home-bancomat.md) — correzione 10                                                                             | un formato solo: «497,50» in un elenco di movimenti non dice da che parte va il denaro                                                             |

Sono contestabili anche i **numeri**: il moltiplicatore ×1,5 dell'upgrade, le otto ore di tetto al
recupero e l'intervallo 700–740 del primo minuto scelti da D008, più i 2,50 € di `ATM_FEE` scelti
da D014, e i quattro importi rapidi del bancomat — 1 · 10 · 100 · 500 — scelti da D015. Sono di
un'altra categoria: cambiarli costa una riga in `balance/constants.ts` e un test che diventa rosso
apposta. Reddito base e costo dell'upgrade vengono invece dai
[mockup](../design/mockups/), quindi erano già approvati.

## Prompt pronto per una sessione nuova

```markdown
Riprendi il progetto Solvent in questa repo ed esegui la delega D013 — che è lo STOP 2.

Leggi in quest'ordine, e non altro prima di aver finito:

1. `docs/delega/PASSAGGIO-DI-CONSEGNE.md` — stato, regole, prossimo passo
2. `docs/delega/D013-verifica-della-fetta.md` — la delega
3. La tabella "Cosa è già cambiato nelle deleghe ancora aperte" qui sopra: **sette righe**
   riguardano D013, e sono cose che il testo della delega non dice
4. `docs/delega/D015-home-bancomat.md`, sezione "Cosa deve sapere chi prende D013" e la nota di
   chiusura — il giro di gioco già percorso a mano, con i numeri
5. `docs/qualita.md` — cosa si prova e cosa no, e perché non ci sono test end-to-end
6. `docs/convenzioni.md` — nomi, commit, e la lingua del codice (C08)

Stato: STOP 1 approvato. Chiuse da D001 a D012, D014 e D015: resta aperta solo D013.
La fetta 01 è **completa e giocabile** — si guadagna in contanti, si deposita al bancomat pagando
la commissione, si compra l'upgrade con la carta e il reddito passa da 12,00 a 18,00 €/s.
`npm run verify` verde con 477 test su 52 file in ~28 s, e `npm run verify:release` è verde: un
renderer che non compila è una regressione.

D013 vale ~250 righe di **test**, e nessun codice nuovo. È l'ultima delega della fetta 01, ed è lo
STOP 2: alla fine si decide se la fetta 02 parte e con quale forma.

Come voglio che lavori:

- Un ramo per la delega: `git checkout -b d013-verifica-della-fetta`.
- Esegui D013 così com'è scritta. Se qualcosa si rivela sbagliato, correggilo e **scrivilo** nella
  sezione delle correzioni in fondo alla delega — non aggirarlo in silenzio. Ogni delega chiusa
  finora ne ha da cinque a diciassette: se la tua esce senza, o era perfetta o non l'hai letta.
- Fermati e presentami **2 opzioni** solo sulle decisioni strutturali. Il resto fallo.
- Identificatori in inglese, prosa in italiano (C08).
- Niente `TODO`, niente `any`, niente scorciatoie presentate come soluzioni.
- Un test che non hai mai visto fallire non è una rete: rompilo di proposito una volta.
- Nessun claim di completamento senza l'output reale di `npm run verify`.
- La documentazione toccata dal cambiamento si aggiorna nello stesso commit.
- Commit: Conventional Commits con lo scope uguale all'ID — `test(D013): …`.

Tre cose che il codice ti dà già e che non vanno riscritte:

- **La fetta è stata giocata a mano**, e i passaggi sono nella nota di chiusura di D015: rifalli,
  ma sapendo cosa devi vedere.
- **Il gioco gira senza Electron**: bundle di produzione, le tre funzioni di `SaveApi` finte al
  posto del preload, un salvataggio con dei soldi dentro. Senza frame comporti, il reddito non
  entra mai — e non è un difetto del gioco.
- **Le reti esistono già**: 477 test, e ognuna di quelle di D015 è stata vista rossa una volta.

Due trappole che le deleghe precedenti hanno già pagato:

- **Un selettore non può essere una `computed`** se legge qualcosa che vive in `core/` e che
  nessun evento annuncia: quel qualcosa non è reattivo. Sono mirror. I saldi invece **sì**, perché
  un evento li sostituisce interi.
- **Un `Money` esposto nudo da uno store Pinia** viene avvolto in un proxy alla lettura e smette
  di essere il `Decimal` che il dominio ha prodotto. Va dentro uno `shallowRef`.

Quando D013 è chiusa, fermati: marcala `Chiusa` con il commit, aggiorna il passaggio di consegne e
`tracciabilita.md` se hai cambiato un meccanismo, e mostrami l'output dei gate. Poi la fetta 01 è
finita, e la domanda successiva è la fetta 02.
```
