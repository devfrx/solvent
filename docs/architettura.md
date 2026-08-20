# Architettura

Documento di riferimento sullo stato **corrente** dell'architettura. Se il codice cambia i
confini, questo file cambia nello stesso task.

Mappa completa della documentazione: [README.md](README.md).
Il **perché** di ogni scelta qui sotto sta nel [compendio delle decisioni](adr/README.md); il
legame fra ogni regola e il difetto che la giustifica sta in [tracciabilita.md](tracciabilita.md).

## I livelli e le direzioni consentite

Una freccia `A --> B` significa: **A può importare B**. Non esistono frecce all'insù.

```mermaid
flowchart TD
  subgraph PLAT["main + preload — Electron"]
    MAIN["main/index.ts<br/>la finestra e le tre difese"]
    SAVE["main/save/*<br/>SaveFile · SaveStore · schema<br/>migrations · channels · ipc"]
    PRE["preload/index.ts"]
  end

  subgraph REND["renderer — Vue 3 + Pinia"]
    BOOT["main.ts<br/>il bootstrap"]
    APP["App.vue<br/>il guscio: i sette stati"]
    VIEWS["views/*.vue<br/>HomeView · StatsView"]
    CMP["components/*<br/>sette componenti · rotation · postings"]
    UI["ui/*<br/>tokens · roles · sei pezzi<br/>non sa che gioco è"]
    I18N["i18n/*"]
    ST["stores/*"]
    RT["runtime/*<br/>createGame · loop · host"]
  end

  subgraph CORE["core — nessun Vue, Pinia o Electron"]
    DOM["domains/*<br/>rules · system"]
    BAL["balance/*<br/>constants · modifiers · targets"]
    KER["kernel/*<br/>Clock · Rng · Bus · Registry · Ledger"]
    CON["contracts/*<br/>result · money · pools · ledger · lifecycle<br/>bounded · events · save · commands · payment"]
  end

  BOOT --> APP
  BOOT --> ST
  BOOT --> RT
  BOOT --> I18N
  APP --> VIEWS
  APP --> ST
  APP --> I18N
  VIEWS --> CMP
  VIEWS --> ST
  VIEWS --> I18N
  CMP --> ST
  CMP --> I18N
  APP --> UI
  VIEWS --> UI
  CMP --> UI
  CMP --> CON
  I18N --> CON
  I18N --> DOM
  I18N --> KER
  I18N --> RT
  ST  --> RT
  ST  --> DOM
  ST  --> KER
  ST  --> BAL
  ST  --> CON
  RT  --> DOM
  RT  --> KER
  RT  --> BAL
  RT  --> CON
  DOM --> BAL
  DOM --> KER
  DOM --> CON
  BAL --> KER
  BAL --> CON
  KER --> CON
  MAIN --> SAVE
  SAVE --> CON
  PRE --> CON
  PRE -->|solo channels.ts| SAVE
```

`CMP --> CON` è di soli **dati**, e non contraddice R05: un componente che mostra i pool li deriva
da `POOLS` invece di elencarli a mano, e uno che mostra i movimenti di una transazione ne nomina il
tipo. Le regole restano fuori portata — `domains/*/rules`, `kernel/*` e `balance/*` sono vietati
dal lint. La freccia esisteva già da [D012](delega/D012-ui-e-i18n.md) e non era disegnata; a
disegnarla è [D015](delega/D015-home-bancomat.md), che l'ha usata due volte.

### Frecce vietate — e chi le impedisce

| Freccia vietata                                   | Perché                                             | Chi la blocca                  |
| ------------------------------------------------- | -------------------------------------------------- | ------------------------------ |
| `stores/* --> stores/*`                           | 74 archi diretti e 3 cicli nel progetto precedente | ESLint `no-restricted-imports` |
| `*.vue --> domains/*/rules`, `*.vue --> kernel/*` | la logica di dominio scappa nei componenti         | ESLint + test di backstop      |
| `core/* --> vue` / `pinia` / `electron`           | `core/` deve girare in Node                        | ESLint `no-restricted-imports` |
| `core/* --> renderer/*`, `core/* --> main/*`      | inversione di dipendenza                           | ESLint                         |
| `main/* --> kernel/*`, `main/* --> domains/*`     | il main conosce il contratto, non il motore        | ESLint                         |

Il main tocca **solo** `core/contracts/save.ts`. È un arco stretto e voluto.

L'unica freccia dentro il riquadro `main + preload` è `preload --> main/save/channels.ts`, e porta
tre stringhe: i nomi dei canali IPC. Non passa da `ipc.ts` perché quel file importa `zod`, e un
preload in **sandbox** non carica pacchetti esterni; non è duplicata perché due costanti che devono
coincidere, e che nessuno confronta, prima o poi non coincidono più.

## Albero delle cartelle — la forma della fetta 01

Questo è l'albero **a fetta 01 finita**, non quello di oggi: serve a sapere dove va una cosa prima
di scriverla. Cosa esiste già lo dice `git ls-files`; a che punto siamo lo dice
[delega/PASSAGGIO-DI-CONSEGNE.md](delega/PASSAGGIO-DI-CONSEGNE.md).

```
solvent/
├─ .editorconfig
├─ .gitignore                     # dist/ out/ node_modules/ *.tsbuildinfo
├─ .prettierrc.json
├─ eslint.config.js               # flat config — qui vivono le regole 1,3,4,5,6,10,11
├─ electron.vite.config.ts
├─ electron-builder.yml           # appId, productName — nessun publish finto
├─ package.json
├─ tsconfig.json                  # solution: references a node/web/test
├─ tsconfig.base.json             # le opzioni comuni, strict incluso
├─ tsconfig.node.json             # main + preload
├─ tsconfig.web.json              # renderer + core
├─ tsconfig.test.json             # tests/
├─ vitest.config.ts
├─ docs/
│  ├─ architettura.md             # questo file
│  └─ adr/NNNN-*.md               # uno per decisione; l'elenco e gli stati stanno in stato.md
├─ src/
│  ├─ main/
│  │  ├─ index.ts
│  │  └─ save/
│  │     ├─ SaveFile.ts           # lettura/scrittura atomica su disco
│  │     ├─ schema.ts             # validazione ESEGUIBILE del SaveEnvelope
│  │     ├─ SaveStore.ts          # salva / carica / azzera: l'ordine dei passi
│  │     ├─ migrations.ts         # unico posto al mondo
│  │     ├─ channels.ts           # i nomi dei tre canali - condivisi col preload
│  │     └─ ipc.ts                # attacca i tre canali allo SaveStore
│  ├─ preload/
│  │  └─ index.ts                 # espone solo il contratto di persistenza
│  ├─ core/                       # NESSUN import di vue / pinia / electron
│  │  ├─ kernel/
│  │  │  ├─ Clock.ts              # TICKS_PER_SECOND vive SOLO qui
│  │  │  ├─ Rng.ts                # unico posto dove Math.random e' consentito
│  │  │  ├─ Bus.ts                # sincrono: niente code, niente storico, niente attese
│  │  │  ├─ Registry.ts
│  │  │  └─ Ledger.ts
│  │  ├─ balance/
│  │  │  ├─ constants.ts
│  │  │  ├─ modifiers.ts          # unico registro dei moltiplicatori
│  │  │  └─ targets.ts            # bersagli di bilanciamento come DATI
│  │  ├─ contracts/
│  │  │  ├─ result.ts             # Result<T, E>
│  │  │  ├─ money.ts              # Money = Decimal + le uniche conversioni
│  │  │  ├─ pools.ts              # Pool · PoolProps · POOLS come dati
│  │  │  ├─ ledger.ts             # Posting · Transaction · TransactionMeta · Balances · LedgerError
│  │  │  ├─ payment.ts            # PaymentOption · PriceList — il listino di un'azione (ADR 0027)
│  │  │  ├─ lifecycle.ts          # ResetScope — la parola che Registry e Ledger si scambiano
│  │  │  ├─ bounded.ts            # boundedList<T>(max) — regola 9
│  │  │  ├─ events.ts             # interface GameEvents — unico file
│  │  │  ├─ save.ts               # SavePayload · SaveEnvelope
│  │  │  └─ commands.ts           # CommandHandler — ritorna Result
│  │  └─ domains/
│  │     ├─ income/
│  │     │  ├─ types.ts
│  │     │  ├─ rules.ts           # funzioni pure, nessun effetto
│  │     │  ├─ commands.ts        # l'acquisto dell'upgrade, ritorna Result
│  │     │  └─ system.ts          # createIncome(ledger, modifiers) - ADR 0024
│  │     └─ atm/                  # senza system.ts: non ha stato e non ticchetta (D014)
│  │        ├─ rules.ts           # commissione, importo valido, capienza
│  │        └─ commands.ts        # previewOf + i due comandi, ritornano Result
│  └─ renderer/
│     ├─ index.html
│     ├─ main.ts
│     ├─ App.vue                  # il guscio: i 7 stati, la navigazione, i token e le primitive
│     ├─ runtime/
│     │  ├─ createGame.ts         # registra i sistemi, monta il contesto
│     │  ├─ host.ts               # l'unico file che tocca il browser
│     │  └─ loop.ts               # rAF + accumulatore -> tick a passo fisso
│     ├─ stores/
│     │  └─ game.ts               # unico store della fetta: stato, comandi, selettori
│     ├─ views/
│     │  ├─ HomeView.vue          # bancomat, upgrade, cruscotto, ultime operazioni
│     │  └─ StatsView.vue
│     ├─ components/
│     │  ├─ IncomePanel.vue       # l'upgrade: il listino letto prima di premere, un comando, un rifiuto
│     │  ├─ BankCard3d.vue        # la carta: CSS 3D puro, zero logica
│     │  ├─ rotation.ts           # la matematica della rotazione, pura e provata a parte
│     │  ├─ CashPanel.vue         # contanti, capienza, tracciabilita
│     │  ├─ AtmPanel.vue          # importo, importi rapidi, anteprima, conferma
│     │  ├─ PostingRows.vue       # i movimenti di una transazione, riga per riga
│     │  ├─ postings.ts           # quali movimenti il giocatore vede - pura
│     │  ├─ OperationList.vue     # l'estratto conto: le due viste ne mostrano quantita' diverse
│     │  └─ StatTile.vue          # il riquadro del cruscotto: e' cio' che il test conta
│     └─ i18n/
│        ├─ index.ts              # chiavi tipizzate, Translator, GameError
│        ├─ it.ts
│        └─ en.ts
└─ tests/
   ├─ helpers/         sources (lettura dei sorgenti per i test di regola) - host (il finto browser)
   ├─ contracts/       result · money · pools · ledger · bounded · events · save · commands · payment
   ├─ kernel/          clock · rng · bus · registry · ledger
   ├─ domains/         income/ rules - commands - system
   ├─ save/            schema - roundtrip - kernel-roundtrip - migrations - ipc - preload
   ├─ balance/         modifiers · targets
   ├─ i18n/            parity · translator
   ├─ renderer/        createGame · loop · store · postings · rotation
   └─ rules/           lint-rules · gates · core-deps · product-identity · no-todo · tick-rate
                       eslint-disable · bus-synchronous · main-save-only · home-tiles
                       no-logic-in-vue · no-literal-in-template · english-identifiers · doc-links
                       domains-no-internal-pools · domains-no-money-literals
                       registry-completeness · registry-no-special-cases
                       doc-links · english-identifiers
                       no-logic-in-vue · no-literal-in-template
```

## Le regole e chi le fa rispettare

Legenda: **🔒 impossibile** = il tipo o la struttura non permettono di scriverlo.
**✅ bloccato** = lint o test falliscono. **⚠️ parziale** = euristica, spiegata sotto.

| #   | Regola                                     | Come è imposta                                                                                                                                                                                                                        | Forza   |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1   | Nessuno store importa un altro store       | ESLint `no-restricted-imports` su `src/renderer/stores/**`                                                                                                                                                                            | ✅      |
| 2   | Nessuna lista di sistemi scritta a mano    | Solo il Registry itera + test: sistemi registrati == file `domains/*/system.ts`                                                                                                                                                       | ✅      |
| 3   | `Math.random` solo in `Rng.ts`             | ESLint `no-restricted-properties` globale, **senza eccezioni di file**: l'unica riga esente si motiva                                                                                                                                 | ✅      |
| 4   | Nessun numero magico di tempo              | Tipi branded `Ticks` / `Seconds`: un `number` nudo non è assegnabile. + `no-magic-numbers` su `domains/**`                                                                                                                            | 🔒      |
| 5   | Nessuna logica di dominio nei `.vue`       | ESLint su `**/*.vue` vieta `domains/*/rules` e `kernel/*` + test grep di backstop                                                                                                                                                     | ✅      |
| 6   | Nessun denaro fuori dal Ledger             | I saldi vivono in una Map privata nella closure: non c'è nulla da assegnare. + lint di rete                                                                                                                                           | 🔒      |
| 7   | Se un sistema ha stato, ha save/load/reset | Unione discriminata `System`: con `save` presente, `load` e `reset` sono obbligatori. Il tipo garantisce che un `load` **esista**, non quale stato accetti: quello è INV-20, e lo prova `tests/rules/stateful-systems-reject-garbage` | 🔒 / ✅ |
| 8   | Il main scrive la versione del salvataggio | Il tipo `SavePayload` del renderer non ha un campo `version`                                                                                                                                                                          | 🔒      |
| 9   | Ogni lista storica ha un limite dichiarato | `boundedList<T>(max)` è l'unico costruttore + il validatore rifiuta array oltre `max`                                                                                                                                                 | 🔒      |
| 10  | Un solo stile di esito                     | `CommandHandler` ritorna `Result` per tipo + lint contro i literal con chiave `success`                                                                                                                                               | ⚠️      |
| 11  | Denaro `Decimal` end-to-end                | `Money = Decimal` è una classe + lint sulle conversioni nei domini                                                                                                                                                                    | 🔒      |
| 12  | Nessuna stringa utente hardcoded           | Test di parità i18n (✅) + test euristico sui template `.vue` (⚠️)                                                                                                                                                                    | ✅ / ⚠️ |
| 13  | Un file `rules.ts` è puro                  | `tests/rules/pure-rules`: nessun `ctx`, nessun effetto, nessuna lettura dell'ora                                                                                                                                                      | ⚠️      |
| 14  | Il kit UI non sa che gioco è               | ESLint `no-restricted-imports` su `src/renderer/ui/**` + `tests/rules/ui-kit-is-standalone`, che risolve anche i percorsi relativi                                                                                                    | ✅      |
| 15  | Nessun colore fuori dai token              | `tests/rules/no-color-literals`: un'eccezione sola, `ui/tokens.css`, e non è configurabile                                                                                                                                            | ✅      |

**Quando entra ciascun meccanismo.** Alcune di queste regole sono già in vigore, altre nascono con
la delega che le usa: la colonna _Delega_ di [tracciabilita.md](tracciabilita.md) dice quale, per
ognuna. Qui c'è la forma finale del meccanismo, non la data.

Il diagramma qui sopra non è un disegno: `tests/rules/import-graph` ricostruisce il grafo di
import da `src/` e lo confronta con le sue frecce **nei due versi** — un arco reale non disegnato è
rosso, un arco disegnato che non esiste è rosso, e un file che non appartiene a nessun nodo è rosso
(regola C13, [D022](delega/D022-il-confine-disegnato-e-il-confine-vero.md)). Modella i **passaggi
di livello**: un modulo che importa un fratello dello stesso livello è coesione interna, e non si
disegna.

### Le tre regole non meccanizzabili al 100%

**Regola 10 — `Result` ovunque.** Il tipo copre i comandi, ma non impedisce a una funzione
qualunque di ritornare `boolean`. Il lint `no-restricted-syntax` vieta i literal di oggetto con
chiave `success` (in vigore da D001, verificato in `tests/rules/lint-rules`). Non copre il
`boolean` nudo, ma elimina la seconda convenzione — che è esattamente il difetto misurato
(62 contro 35). Resta ⚠️ per quello che non copre, ed è dichiarato in
[tracciabilita.md](tracciabilita.md#cosa-questa-tabella-non-copre).

**Regola 12 — nessuna stringa hardcoded.** La parità fra lingue è un test esatto. Il "nessun
testo letterale nei template" è un test a regex sui nodi di testo dei `.vue`: cattura il caso
normale, non le stringhe costruite dinamicamente. Meglio di niente, e onesto su cosa non vede.

**Regola 13 — un `rules.ts` è puro.** Il test cerca le forme in cui l'impurità entra — un `ctx` fra
i parametri, `Date.now`, un `emit`, un import di valore dal kernel — e non dimostra la purezza, che
richiederebbe l'analisi del flusso. Una funzione che muta un array ricevuto per argomento gli
sfugge. Fino a D022 questa regola non aveva nemmeno un ID.

## Configurazione non negoziabile

- `tsconfig`: `strict`, **`noUnusedLocals`**, **`noUnusedParameters`**. Sono i due interruttori
  che intercettano gratis il codice morto. Non si spengono mai.
- Prettier ed EditorConfig descrivono l'indentazione che il progetto usa davvero, `.vue` inclusi.
  `npm run format` gira dal primo giorno, a costo zero.
- Un solo nome per il prodotto, ovunque (ADR 0008), verificato da un test.
- `.gitignore` include `dist/`, `out/`, `node_modules/`, `*.tsbuildinfo`.
- Nessun entitlement o permesso di sistema che il gioco non usa davvero.
