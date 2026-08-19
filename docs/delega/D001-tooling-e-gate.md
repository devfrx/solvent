# D001 — Tooling, regole e gate di qualità

- **Stato:** **Chiusa** — 2026-08-19, commit `e275f59` su `main` (fatto a posteriori: vedi in fondo)
- **Dipende da:** le tre decisioni approvate (nome, dipendenze, ADR 0001)
- **Sblocca:** tutto
- **ADR vincolanti:** 0008, 0012, 0013, 0015
- **Regole:** R01, R03, R04, R05, R06, R10, C01, C02, C03, C04, C05, P01, INV-01, INV-02, INV-03
- **Budget:** ~200 righe di configurazione → **consuntivo: 463 di configurazione + 371 di test**

## Obiettivo

Rendere le regole del progetto **eseguibili** prima che esista una riga di codice da governare.

## Prodotto

| File                      | Contenuto                                                               |
| ------------------------- | ----------------------------------------------------------------------- |
| `package.json`            | nome deciso, gate come script, `verify` e `verify:release`              |
| `tsconfig.base.json`      | le opzioni condivise, `noUnusedLocals` e `noUnusedParameters` inclusi   |
| `tsconfig.json`           | solution con i riferimenti ai tre progetti                              |
| `tsconfig.node.json`      | main, preload, `core/contracts`, i file di configurazione. Tipi: `node` |
| `tsconfig.web.json`       | renderer e `core`. **Nessun tipo `node`**                               |
| `tsconfig.test.json`      | i test. Tipi: `node`                                                    |
| `eslint.config.js`        | flat config con tutte le regole sotto                                   |
| `.prettierrc.json`        | la formattazione reale, `.vue` inclusi                                  |
| `.prettierignore`         | artefatti e lockfile                                                    |
| `.editorconfig`           | coerente con Prettier                                                   |
| `.gitignore`              | `node_modules/`, `dist/`, `out/`, `.vite/`, `*.tsbuildinfo`             |
| `electron.vite.config.ts` | alias `@core` e `@renderer`; nessun plugin non usato                    |
| `electron-builder.yml`    | `appId` e `productName`; **nessun** `publish`, **nessun** entitlement   |
| `vitest.config.ts`        | ambiente `node` per tutto; jsdom entrerà solo con i test di componente  |

Test prodotti: `tests/rules/lint-rules.test.ts`, `product-identity.test.ts`, `no-todo.test.ts`,
`core-deps.test.ts`, `gates.test.ts`, più `tests/helpers/sources.ts`.

## Le regole imposte, e da cosa

| Regola | Meccanismo                                                                                |
| ------ | ----------------------------------------------------------------------------------------- |
| R01    | `no-restricted-imports` su `src/renderer/stores/**`                                       |
| R03    | `no-restricted-properties` su `Math.random`, spenta solo in `src/core/kernel/Rng.ts`      |
| R04    | `@typescript-eslint/no-magic-numbers` su `core/domains/**` e `balance/modifiers.ts`       |
| R05    | `no-restricted-imports` su `**/*.vue`                                                     |
| R06    | `no-restricted-syntax` sugli assegnamenti a un saldo, spenta solo in `Ledger.ts`          |
| R10    | `no-restricted-syntax` sui literal con chiave `success` — attiva **anche** in `Ledger.ts` |
| C01    | `noUnusedLocals` e `noUnusedParameters` in `tsconfig.base.json`                           |
| C02    | `format:check` come gate                                                                  |
| C03    | `tests/rules/product-identity.test.ts`                                                    |
| P01    | `tests/rules/no-todo.test.ts`                                                             |
| INV-01 | `tests/rules/core-deps.test.ts` — **non** ESLint, vedi sotto                              |
| INV-02 | `no-restricted-imports` su `src/core/**`                                                  |
| INV-03 | `no-restricted-imports` su `src/main/**` e `src/preload/**`                               |
| INV-13 | `tsconfig.web.json` senza tipi `node`: il renderer non può usare le API di Node           |

## Quattro correzioni rispetto a com'era scritta questa delega

Documentate qui invece che nascoste, perché la delega descriveva un'intenzione e il codice ha
detto un'altra cosa.

**0. Il budget era sbagliato di più del doppio.** ~200 righe previste, 463 scritte. Non è
sforamento: è che il preventivo contava solo `eslint.config.js` e `package.json`, e ignorava
quattro `tsconfig`, cinque dotfile e i due file di configurazione di Vite. Le righe ci sono tutte
per una ragione — nessun blocco è ornamentale — ma il preventivo delle prossime deleghe va fatto
elencando i file, non a occhio.

**1. INV-01 è un test, non una regola ESLint.** `no-restricted-imports` esprime bene le _denylist_
(INV-02) e male le _allowlist_. Un test che elenca gli import esterni di `core/` e li confronta con
`{ decimal.js }` è più corto, più leggibile e dà un errore che dice quale pacchetto è entrato.

**2. I gate veloci sono quattro, non cinque.** `npm run verify` incatena typecheck, lint,
format:check e test — otto secondi, il ciclo che si esegue di continuo. `npm run verify:release`
aggiunge la compilazione, che oggi non può essere verde perché non esiste sorgente: diventa
eseguibile con D011.

**3. `typecheck:web` è fuori dalla catena finché il progetto web è vuoto.** `tsc` fallisce su un
progetto senza input. Invece di un `TODO`, `tests/rules/gates.test.ts` verifica che _nel momento
in cui esiste un file sotto `src/core` o `src/renderer`_, `typecheck` **deve** includere
`typecheck:web`. Il primo file di D002 farà diventare quel test rosso, e la catena si aggiornerà
perché è obbligatorio, non perché qualcuno se ne ricorda.

## Fuori scope

- CI. Il grilletto è il primo collaboratore o il primo rilascio ([roadmap](../roadmap-fette.md)).
- Firma del binario e canale di distribuzione.
- Tool per il codice morto non visto da TypeScript: grilletto alla fetta 02 (ADR 0012).
- Qualunque plugin Vite non richiesto dalla fetta 01.

## Definizione di fatto

- [x] i quattro gate veloci girano su un repo con solo questi file e sono verdi
- [x] ogni regola è verificata **in modo permanente** da `tests/rules/lint-rules.test.ts`, che
      scrive la violazione e pretende il rosso — 16 casi, eccezioni dichiarate incluse
- [x] il meta-test è stato provato a rovescio: indebolendo R03 in `eslint.config.js`, diventa rosso
- [x] `tests/rules/product-identity.test.ts` verifica `name`, `productName`, `appId`, l'assenza di
      metadati del template e l'assenza di un blocco `publish`. Provato a rovescio cambiando il nome
- [x] `tests/rules/no-todo.test.ts` cerca i marcatori in `src/**`, e verifica il proprio rilevatore
- [x] `tests/rules/gates.test.ts` impedisce che un gate sparisca dalla catena
- [x] [tracciabilita.md](../tracciabilita.md) aggiornata: nessuna riga con un meccanismo inesistente
- [x] commit — `e275f59`, fatto a posteriori: quando D001 si è chiusa il repo non era ancora sotto
      git, e l'inizializzazione è avvenuta prima di D002 (vedi la nota di chiusura)

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 33 test su 5 file, 8 secondi.

Alla chiusura il repo **non era un repository git**, e questa delega restò senza commit. Le
[convenzioni](../convenzioni.md) prevedono un ramo e dei commit per delega, quindi
l'inizializzazione è stata fatta subito dopo, prima di D002: il contenuto di D001 è entrato con
`e275f59` (`chore(D001): tooling, regole e gate eseguibili`), direttamente su `main` perché il ramo
per delega esiste da D002 in poi.

## Trappole note

- **A16.** Il formattatore configurato ma non eseguito è peggio di nessun formattatore. Prettier è
  stato eseguito una volta su tutto il repo: nasce formattato, e il gate nasce verde.
- **A15.** Il nome finisce in cinque posti. Se ne aggiungi un sesto, aggiorna il test nello stesso
  commit.
- Una regola di lint scritta e mai verificata contro una violazione reale è quasi sempre una regola
  che non funziona. È successo davvero: il primo caso di prova per R04 usava `const a = 3600`, che
  **non** è una violazione — dare un nome a un numero è la correzione, non il difetto. Senza il
  meta-test, R04 sarebbe passata per funzionante.
