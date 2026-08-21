# Tracciabilità

Questo documento risponde a due domande, in entrambe le direzioni:

1. **Dato un difetto del progetto precedente**, cosa impedisce che si ripresenti — e dove lo vedo?
2. **Data una riga di configurazione o un test**, quale decisione sta proteggendo?

Una regola senza una riga in questa tabella è una buona intenzione. Se aggiungi una regola,
aggiungi la riga; se una riga non ha un meccanismo, la regola non esiste ancora.

## Legenda della forza

| Simbolo | Significato                                                                                 |
| ------- | ------------------------------------------------------------------------------------------- |
| 🔒      | **Impossibile**: il tipo o la struttura non permettono di scrivere la violazione            |
| ✅      | **Bloccato**: lint, typecheck o test falliscono in modo deterministico                      |
| ⚠️      | **Parziale**: euristica che copre il caso normale, non tutti i casi. Il limite è dichiarato |
| 👤      | **Umano**: dipende dalla review. Da evitare — ogni riga 👤 è debito di processo             |

## Catena principale: difetto → regola → decisione → meccanismo → verifica

| Difetto                                | Regola | ADR  | Meccanismo che lo impedisce                                                  | Verifica                                                  | Forza | Delega     |
| -------------------------------------- | ------ | ---- | ---------------------------------------------------------------------------- | --------------------------------------------------------- | ----- | ---------- |
| A01 5 liste di sistemi parallele       | R02    | 0002 | solo il `Registry` itera i sistemi, e senza casi speciali su un `id`         | `tests/rules/registry-completeness` + `-no-special-cases` | ✅    | D006       |
| A02 74 archi store→store, 3 cicli      | R01    | 0001 | `no-restricted-imports` su `src/renderer/stores/**`                          | `npm run lint`                                            | ✅    | D001       |
| A03 176 `Math.random` diretti          | R03    | 0005 | `no-restricted-properties` globale; l'unica esenzione è una riga motivata    | `npm run lint` + `tests/kernel/rng`                       | ✅    | D001, D004 |
| A04 tick rate in 5 posti               | R04    | 0009 | `TICKS_PER_SECOND` solo in `Clock.ts`; tipi branded `Ticks`/`Seconds`        | `npm run typecheck` + `tests/rules/tick-rate`             | 🔒    | D003       |
| A05 denaro scritto da più punti        | R06    | 0003 | i saldi vivono in una `Map` privata nella closure del Ledger                 | `tests/kernel/ledger` + lint di rete                      | 🔒    | D007       |
| A06 persistenza a mano in 3 file       | R07    | 0002 | unione discriminata `System`: con `save`, `load` e `reset` sono obbligatori  | `npm run typecheck`                                       | 🔒    | D006       |
| A07 `version: 3` nel renderer          | R08    | 0004 | il tipo `SavePayload` **non ha** un campo versione                           | `npm run typecheck`                                       | 🔒    | D002, D009 |
| A08 schema "advisory" e stale          | R08    | 0004 | lo schema è `zod`, quindi **eseguito**: non può divergere senza rompere      | `tests/save/schema` + `tests/save/kernel-roundtrip`       | ✅    | D009       |
| A09 logica di dominio nei `.vue`       | R05    | 0001 | ESLint su `**/*.vue` vieta `domains/*/rules` e `kernel/*`                    | `npm run lint` + `tests/rules/no-logic-in-vue`            | ✅    | D001, D012 |
| A10 liste storiche illimitate          | R09    | 0010 | `boundedList<T>(max)` è l'unico costruttore; `max` obbligatorio              | `npm run typecheck` + `tests/contracts/bounded`           | 🔒    | D002       |
| A11 pipeline mista `number`/`Decimal`  | R11    | 0006 | `Money = Decimal` è una classe + lint sulle conversioni sotto `domains/**`   | `npm run typecheck` + `npm run lint`                      | 🔒    | D002       |
| A12 62 `boolean` contro 35 `{success}` | R10    | 0007 | `CommandHandler` ritorna `Result` per tipo + lint contro i literal `success` | `npm run typecheck` + `npm run lint`                      | ⚠️    | D002       |
| A13 20 chiavi i18n mancanti            | R12    | 0011 | confronto degli insiemi di chiavi nelle due direzioni                        | `tests/i18n/parity`                                       | ✅    | D012       |
| A14 codice morto (CSS, API)            | C01    | 0012 | `noUnusedLocals` + `noUnusedParameters` in `tsconfig`                        | `npm run typecheck`                                       | ✅    | D001       |
| A15 4 nomi, `publish.url` finto        | C03    | 0008 | un solo identificatore, propagato; nessun metadato del template              | `tests/rules/product-identity`                            | ✅    | D001       |
| A16 154/156 file non formattati        | C02    | 0013 | `format:check` è un gate, non un suggerimento                                | `npm run format:check`                                    | ✅    | D001       |
| A17 24 sistemi prima del kernel        | P01    | 0014 | il registro delle fette; nessun `TODO` ammesso nel codice                    | `docs/roadmap-fette.md` + `tests/rules/no-todo`           | ✅    | tutte      |

## Le regole, per ID

| ID  | Regola                                         | Forza   | Dove è configurata                                                                                                                          |
| --- | ---------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 | Nessuno store importa un altro store           | ✅      | `eslint.config.js`                                                                                                                          |
| R02 | Nessuna lista di sistemi scritta a mano        | ✅      | `Registry.ts` + `tests/rules/registry-completeness` e `-no-special-cases`                                                                   |
| R03 | `Math.random` solo in `Rng.ts`                 | ✅      | `eslint.config.js` — nessuna eccezione di file                                                                                              |
| R04 | Nessun numero magico: di tempo e di denaro     | 🔒      | `Clock.ts` + `eslint.config.js` (domini, `balance/modifiers`, **e `renderer/**/*.ts` da D022**) + `tick-rate` e `domains-no-money-literals` |
| R05 | Nessuna logica di dominio nei `.vue`           | ✅      | `eslint.config.js` + `tests/rules/no-logic-in-vue`                                                                                          |
| R06 | Nessun denaro fuori dal Ledger                 | 🔒      | `Ledger.ts` (closure) + `eslint.config.js` — il selettore guarda il **lato sinistro** dell'assegnamento                                     |
| R07 | Se un sistema ha stato, ha save/load/reset     | 🔒      | `Registry.ts` (tipo)                                                                                                                        |
| R08 | Il contratto di salvataggio appartiene al main | 🔒      | `contracts/save.ts` + `main/save/schema.ts`                                                                                                 |
| R09 | Ogni lista storica ha un limite dichiarato     | 🔒      | `contracts/bounded.ts`                                                                                                                      |
| R10 | Un solo stile di esito                         | ⚠️      | `contracts/commands.ts` + `eslint.config.js`                                                                                                |
| R11 | Denaro `Decimal` end-to-end                    | 🔒      | `contracts/money.ts` + `eslint.config.js`                                                                                                   |
| R12 | Nessuna stringa utente hardcoded               | ✅ / ⚠️ | `tests/i18n/parity` + `tests/rules/no-literal-in-template`                                                                                  |
| R13 | Un file `rules.ts` contiene solo funzioni pure | ⚠️      | `tests/rules/pure-rules` — cerca le forme dell'impurità, non dimostra la purezza                                                            |
| R14 | Il kit UI non sa che gioco è                   | ✅      | `eslint.config.js` + `tests/rules/ui-kit-is-standalone` — che prende anche i percorsi relativi                                              |
| R15 | Nessun colore vive fuori dai token             | ✅      | `tests/rules/no-color-literals` — un'eccezione sola, `ui/tokens.css`, e non è configurabile                                                 |
| R16 | Un pezzo del kit non prende la geometria       | ⚠️      | `tests/rules/ui-kit-has-no-geometry` — legge i nomi delle proprietà, non ne indovina di nuovi (ADR 0030)                                    |
| R17 | Nessun tooltip nativo: se c'è, è `UiTooltip`   | ⚠️      | `tests/rules/no-native-tooltips` — l'attributo `title` su un elemento, distinto dalla proprietà di un componente (ADR 0032)                 |

Regole di configurazione e di processo, con la stessa dignità:

| ID  | Regola                                                    | Forza   | Dove                                                                     |
| --- | --------------------------------------------------------- | ------- | ------------------------------------------------------------------------ |
| C01 | `noUnusedLocals` e `noUnusedParameters` sempre accesi     | ✅      | `tsconfig.base.json`                                                     |
| C02 | Il codice è sempre formattato                             | ✅      | `package.json` → `format:check`                                          |
| C03 | Un solo nome per il prodotto, ovunque                     | ✅      | `tests/rules/product-identity`                                           |
| C04 | `.gitignore` copre gli artefatti, `*.tsbuildinfo` incluso | 👤      | `.gitignore`                                                             |
| C05 | Nessun entitlement o permesso non usato                   | 👤      | `electron-builder.yml`                                                   |
| C06 | Ogni `eslint-disable` porta la propria motivazione        | ✅      | `tests/rules/eslint-disable`                                             |
| C07 | Ogni collegamento fra documenti risolve, ancore incluse   | ✅      | `tests/rules/doc-links`                                                  |
| C08 | Identificatori in inglese, prosa in italiano              | ⚠️      | `tests/rules/english-identifiers` — lista, non dizionario                |
| C09 | Nessuna parola vietata nei nomi di file e cartelle        | ⚠️      | `tests/rules/forbidden-words` — i nomi, non gli identificatori           |
| C10 | Nessun barrel: nessun file che si limiti a ri-esportare   | ✅      | `tests/rules/no-barrel` — guarda il contenuto, non il nome               |
| C11 | Un fatto contabile ha un posto solo, ed è generato        | ✅ / ⚠️ | `docs/stato.md` + `tests/rules/project-state` e `tests/rules/docs-facts` |
| C12 | Nessuna riga di tabella vive fuori da una tabella         | ✅      | `tests/rules/markdown-form`                                              |
| C13 | Il diagramma delle dipendenze coincide con il grafo reale | ✅      | `tests/rules/import-graph` — nei due versi, e nessun file orfano         |
| P01 | Una fetta verticale alla volta, nessun `TODO` nel codice  | ✅      | `docs/roadmap-fette.md` + `tests/rules/no-todo`                          |

## Invarianti derivati

Conseguenze delle decisioni che vale la pena verificare direttamente, perché la loro rottura
segnala che un confine si sta spostando.

| ID     | Invariante                                                                | Da       | Verifica                                                                                                                  |
| ------ | ------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| INV-01 | `src/core/**` dipende solo da `decimal.js`                                | ADR 0015 | `tests/rules/core-deps` — allowlist, non esprimibile in ESLint                                                            |
| INV-02 | `src/core/**` non importa mai `vue`, `pinia`, `electron`                  | ADR 0001 | `no-restricted-imports`                                                                                                   |
| INV-03 | `src/main/**` importa da `core/` solo `contracts/save.ts`                 | ADR 0004 | `no-restricted-imports` + `tests/rules/main-save-only`                                                                    |
| INV-04 | Il denaro attraversa il confine di persistenza come stringa               | ADR 0006 | schema `zod` + `tests/save/roundtrip`                                                                                     |
| INV-05 | Ogni `System` registrato compare in save, load, reset e stats             | ADR 0002 | `tests/rules/registry-completeness`                                                                                       |
| INV-06 | La dimensione massima del salvataggio è calcolabile a priori              | ADR 0010 | somma dei `max` dichiarati                                                                                                |
| INV-07 | Ogni `Reason` e ogni `code` di errore ha una chiave in ogni lingua        | ADR 0011 | `tests/i18n/parity`                                                                                                       |
| INV-08 | **La somma di tutti i conti è sempre zero**, anche dopo un caricamento    | ADR 0020 | `tests/kernel/ledger` (invariante su 1.000 transazioni)                                                                   |
| INV-09 | Nessuna transazione è mai applicata parzialmente                          | ADR 0019 | `tests/kernel/ledger` (fallimento indotto sull'ultimo movimento)                                                          |
| INV-10 | Nessun dominio nomina a mano i pool non-giocatore                         | ADR 0020 | `tests/rules/domains-no-internal-pools` — i conti si derivano da `POOLS`                                                  |
| INV-11 | La commissione in anteprima è lo **stesso valore** che il comando applica | ADR 0018 | `tests/domains/atm` — l'anteprima è l'elenco dei movimenti                                                                |
| INV-12 | Il cruscotto della home non supera i **sei** riquadri                     | ADR 0018 | `tests/rules/home-tiles` — ⚠️ conta i tag, e rifiuta un `v-for` su uno                                                    |
| INV-13 | Il renderer non può usare le API di Node                                  | ADR 0001 | `tsconfig.web.json` senza tipi `node` — 🔒, non compila                                                                   |
| INV-14 | Nessun gate sparisce dalla catena `verify`                                | ADR 0013 | `tests/rules/gates`                                                                                                       |
| INV-15 | Il Bus è sincrono: nessuna attesa, nessuna coda dentro `emit`             | ADR 0016 | `tests/rules/bus-synchronous` — la firma `void` da sola non basta                                                         |
| INV-16 | Il preload espone tre funzioni, non `ipcRenderer`                         | ADR 0004 | `tests/save/preload` — guarda l'oggetto esposto, non il sorgente                                                          |
| INV-17 | Il salvataggio si scrive **solo** da uno stato che ha una partita vera    | ADR 0004 | `tests/renderer/store` — chiudere da `Errore` o da `Caricamento` non scrive                                               |
| INV-18 | La capienza che il Ledger fa rispettare è la stessa che la UI mostra      | ADR 0025 | `tests/kernel/ledger-capacity` + `tests/renderer/store` — confronto per identità                                          |
| INV-19 | Il prezzo mostrato e quello addebitato vengono dalla **stessa** funzione  | ADR 0027 | `tests/domains/income` + `tests/renderer/store` — confronto per identità                                                  |
| INV-20 | Nessun sistema con stato accetta un salvataggio che non riconosce         | ADR 0002 | `tests/rules/stateful-systems-reject-garbage` — deriva la spazzatura dallo stato buono, e la passa sotto l'id del sistema |
| INV-21 | Un pulsante non si spegne mai: se non si può, c'è una frase               | ADR 0028 | `tests/rules/ui-kit-is-standalone` — nessun `disabled` scritto nel kit                                                    |
| INV-22 | Ogni voce della colonna ha la sua schermata                               | ADR 0030 | 🔒 `Record<Screen, Component>` in `App.vue`: una destinazione senza vista non compila                                     |

Il buco fra INV-17 e INV-19 **è stato chiuso** da [D017](delega/D017-il-caveau.md): i numeri si
assegnano quando si scrive la delega, e D019 si era infilata dopo D017 nell'ordine di scrittura ma
prima in quello di esecuzione. INV-18 ha adesso il suo meccanismo, ed è la forma più forte che
potesse avere: non due letture confrontate da un test, ma **una funzione sola** che il Ledger
riceve, fa rispettare ed espone — quindi il confronto è per identità e non per uguaglianza.

## Le regole di lint si verificano da sole

`tests/rules/lint-rules.test.ts` scrive una violazione per **ogni** regola ESLint del progetto e
pretende che scatti, più i tre casi di eccezione dichiarata che devono **non** scattare. Se qualcuno
indebolisce `eslint.config.js`, il test diventa rosso.

È la risposta alla domanda "chi controlla il controllore": una regola configurata e mai provata
contro una violazione reale è quasi sempre una regola che non funziona.

## Cosa questa tabella NON copre

Le sette righe oneste, perché una matrice di tracciabilità che si dichiara completa è la prima
cosa che invecchia male. Erano «tre» davanti a un elenco di quattro fin da prima di D015, sei a
[D016](delega/D016-correzioni-audit.md) e sette da [D013](delega/D013-verifica-della-fetta.md): è
esattamente il difetto che questo documento avverte di cercare — un numero scritto una volta e mai
più rimisurato.

1. **R10 fuori dai comandi.** Il lint vieta i literal con chiave `success`, ma non impedisce a una
   funzione qualsiasi di ritornare `boolean`. Copre la seconda convenzione, non il degrado.
2. **R12 fuori dai nodi di testo.** `tests/rules/no-literal-in-template` cerca testo letterale
   nei template `.vue` togliendo tag, commenti e interpolazioni: prende `<p>Compra</p>` e non vede
   né una stringa assemblata a runtime né un attributo — un `placeholder="Importo"` le sfugge.
   Quello che la parità **non** poteva vedere, e che ora vede, è un segnaposto perso in una
   traduzione sola: `tests/i18n/parity` confronta anche i `{nomi}` fra le due lingue.
3. **INV-12 fuori dai tag.** `tests/rules/home-tiles` conta i `<StatTile>` nel template della home
   e rifiuta un `v-for` sullo stesso tag — la scorciatoia che trasformerebbe sei riquadri in sedici
   lasciando il conto a uno. Un `v-for` su un **contenitore** che ne avvolge uno le sfugge ancora:
   per prenderlo servirebbe rendere il componente, cioè jsdom ([registro YAGNI](roadmap-fette.md)).
4. **C09 fuori dai nomi.** `tests/rules/forbidden-words` guarda i nomi di file e cartelle sotto
   `src/`, non gli identificatori: dentro un identificatore le stesse parole sono spesso
   legittime — `handler` è il nome standard di una callback e compare in `Bus.ts` e in `host.ts` a
   ragione — e una regola che gridasse al lupo lì verrebbe disattivata. Non copre nemmeno
   `tests/`, e la ragione sta nel [glossario](glossario.md#parole-vietate).
5. **C04 e C05** dipendono dalla review. Sono le due sole righe 👤 del progetto, ed è deliberato:
   meccanizzarle costerebbe più di quanto valgano. Se diventano tre, è un segnale. Le due che
   erano righe 👤 **senza nemmeno il simbolo** — le parole vietate e il divieto di barrel, scritte
   in prosa e mai messe in tabella — hanno preso un meccanismo con
   [D016](delega/D016-correzioni-audit.md): erano quattro, e il contatore non le vedeva perché
   contava solo ciò che era già in tabella.
6. **Tre file non hanno test**, e sono la stessa cosa tre volte: il guscio esterno che tocca la
   piattaforma. `src/renderer/runtime/host.ts` **è** il browser — `window`, `document`,
   `requestAnimationFrame`, `performance` — e tutto ciò che sta sopra lo riceve per costruzione,
   quindi gira in `node` senza jsdom. `src/renderer/main.ts` e `src/main/index.ts` sono i due
   bootstrap: montano Vue e aprono la finestra di Electron, cioè fanno esattamente le cose che un
   test non può osservare senza diventare l'applicazione. Che gli eventi giusti siano agganciati lo
   dice la lettura, non un test.

   Fino a [D016](delega/D016-correzioni-audit.md) questa riga diceva «è l'unico file del progetto
   senza», e ne contava uno su tre. Non cambia la scelta: cambia quanto è grande la superficie che
   quella scelta lascia scoperta, che è la sola cosa che una riga onesta debba dire.

   La riga che stava qui diceva che il grilletto era D012 — «jsdom entra con i test di
   componente». **Non è successo**, e la ragione è buona: la definizione di fatto di D012 non
   chiede di montare un componente, e montarlo costa due dipendenze nuove, cioè un ADR. Le due
   verifiche a occhio di quella delega sono diventate test per un'altra strada, estraendo
   `createTranslator(wording)` dal composable — lo stesso confine di `host.ts`, applicato alle
   parole. Il grilletto vero è ora nel [registro YAGNI](roadmap-fette.md), e non è una data: è il
   primo componente con stato locale non banale.

   La riga che stava qui — _R02 finché il bootstrap non esiste_ — **è chiusa**: `createGame.ts`
   esiste da D011, e `registry-completeness` fa un confronto secco.

7. **La tabella censisce ciò che qualcuno ha messo in tabella.** È la lezione di
   [D016](delega/D016-correzioni-audit.md), e [D013](delega/D013-verifica-della-fetta.md) l'ha
   applicata come verifica invece che come racconto, in tre direzioni.

   Le prime due sono verdi e meccanizzabili, e sono state eseguite: ogni meccanismo nominato qui
   esiste come file — nessuna riga punta al vuoto — e ognuno dei quaranta identificatori `R`, `C`,
   `INV` e `P` usati in **qualunque** documento ha la sua riga qui. Quaranta contro quaranta.

   La terza non è meccanizzabile e ha trovato qualcosa: una regola scritta in prosa **senza un
   ID**, che per costruzione nessun conteggio poteva vedere: «I file `rules.ts` contengono solo
   funzioni pure — nessun `ctx`, nessun effetto, nessuna lettura dell'ora»
   ([convenzioni.md](convenzioni.md)). **Adesso ce l'ha**: è la regola **R13**, e il meccanismo è
   `tests/rules/pure-rules` ([D022](delega/D022-il-confine-disegnato-e-il-confine-vero.md)). Il
   grilletto del registro YAGNI diceva «il terzo `rules.ts`», che nasce dentro
   [D017](delega/D017-il-caveau.md): era giusto su quando il problema diventa reale e sbagliato su
   quando il meccanismo può ancora essere scritto da chi non ha interesse a passarlo.

   La stessa domanda inversa, rifatta all'audit dello STOP 2, ne ha trovato un secondo: le
   **frecce** di [architettura.md](architettura.md) — «A può importare B» — non avevano nessun
   meccanismo che confrontasse il disegno con il grafo vero, e il disegno ne aveva persi sei più
   quattro nodi. È la regola **C13**.

   Restano i **quattro nomi di file** che [convenzioni.md](convenzioni.md) affida alla review —
   `PascalCase.ts` per il kernel, `camelCase.ts` per i moduli puri, `NNNN-slug` per gli ADR,
   `DNNN-slug` per le deleghe. Il punto 5 qui sopra dice che C04 e C05 sono «le due sole righe 👤
   del progetto»: è vero delle **righe**, e questa è precisamente la distinzione che D016
   avvertiva di non confondere. Del progetto, le regole che dipendono da un occhio sono **sei**:
   erano sette, e R13 ne ha tolta una.
