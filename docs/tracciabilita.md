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

| Difetto                                | Regola | ADR  | Meccanismo che lo impedisce                                                  | Verifica                                                     | Forza | Delega     |
| -------------------------------------- | ------ | ---- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ | ----- | ---------- |
| A01 5 liste di sistemi parallele       | R02    | 0002 | solo il `Registry` itera i sistemi, e senza casi speciali su un `id`         | `tests/rules/registry-completeness` + `-senza-casi-speciali` | ✅    | D006       |
| A02 74 archi store→store, 3 cicli      | R01    | 0001 | `no-restricted-imports` su `src/renderer/stores/**`                          | `npm run lint`                                               | ✅    | D001       |
| A03 176 `Math.random` diretti          | R03    | 0005 | `no-restricted-properties` globale; l'unica esenzione è una riga motivata    | `npm run lint` + `tests/kernel/rng`                          | ✅    | D001, D004 |
| A04 tick rate in 5 posti               | R04    | 0009 | `TICKS_PER_SECOND` solo in `Clock.ts`; tipi branded `Ticks`/`Seconds`        | `npm run typecheck` + `tests/rules/tick-rate`                | 🔒    | D003       |
| A05 denaro scritto da più punti        | R06    | 0003 | i saldi vivono in una `Map` privata nella closure del Ledger                 | `tests/kernel/ledger` + lint di rete                         | 🔒    | D007       |
| A06 persistenza a mano in 3 file       | R07    | 0002 | unione discriminata `System`: con `save`, `load` e `reset` sono obbligatori  | `npm run typecheck`                                          | 🔒    | D006       |
| A07 `version: 3` nel renderer          | R08    | 0004 | il tipo `SavePayload` **non ha** un campo versione                           | `npm run typecheck`                                          | 🔒    | D002, D009 |
| A08 schema "advisory" e stale          | R08    | 0004 | lo schema è `zod`, quindi **eseguito**: non può divergere senza rompere      | `tests/save/schema`                                          | ✅    | D009       |
| A09 logica di dominio nei `.vue`       | R05    | 0001 | ESLint su `**/*.vue` vieta `domains/*/rules` e `kernel/*`                    | `npm run lint` + `tests/rules/no-logic-in-vue`               | ✅    | D001, D012 |
| A10 liste storiche illimitate          | R09    | 0010 | `boundedList<T>(max)` è l'unico costruttore; `max` obbligatorio              | `npm run typecheck` + `tests/contracts/bounded`              | 🔒    | D002       |
| A11 pipeline mista `number`/`Decimal`  | R11    | 0006 | `Money = Decimal` è una classe + lint sulle conversioni sotto `domains/**`   | `npm run typecheck` + `npm run lint`                         | 🔒    | D002       |
| A12 62 `boolean` contro 35 `{success}` | R10    | 0007 | `CommandHandler` ritorna `Result` per tipo + lint contro i literal `success` | `npm run typecheck` + `npm run lint`                         | ⚠️    | D002       |
| A13 20 chiavi i18n mancanti            | R12    | 0011 | confronto degli insiemi di chiavi nelle due direzioni                        | `tests/i18n/parity`                                          | ✅    | D012       |
| A14 codice morto (CSS, API)            | C01    | 0012 | `noUnusedLocals` + `noUnusedParameters` in `tsconfig`                        | `npm run typecheck`                                          | ✅    | D001       |
| A15 4 nomi, `publish.url` finto        | C03    | 0008 | un solo identificatore, propagato; nessun metadato del template              | `tests/rules/product-identity`                               | ✅    | D001       |
| A16 154/156 file non formattati        | C02    | 0013 | `format:check` è un gate, non un suggerimento                                | `npm run format:check`                                       | ✅    | D001       |
| A17 24 sistemi prima del kernel        | P01    | 0014 | il registro delle fette; nessun `TODO` ammesso nel codice                    | `docs/roadmap-fette.md` + `tests/rules/no-todo`              | ✅    | tutte      |

## Le 12 regole, per ID

| ID  | Regola                                         | Forza   | Dove è configurata                                                           |
| --- | ---------------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| R01 | Nessuno store importa un altro store           | ✅      | `eslint.config.js`                                                           |
| R02 | Nessuna lista di sistemi scritta a mano        | ✅      | `Registry.ts` + `tests/rules/registry-completeness` e `-senza-casi-speciali` |
| R03 | `Math.random` solo in `Rng.ts`                 | ✅      | `eslint.config.js` — nessuna eccezione di file                               |
| R04 | Nessun numero magico di tempo                  | 🔒      | `Clock.ts` + `eslint.config.js` + `tests/rules/tick-rate`                    |
| R05 | Nessuna logica di dominio nei `.vue`           | ✅      | `eslint.config.js` + `tests/rules/no-logic-in-vue`                           |
| R06 | Nessun denaro fuori dal Ledger                 | 🔒      | `Ledger.ts` (closure) + `eslint.config.js`                                   |
| R07 | Se un sistema ha stato, ha save/load/reset     | 🔒      | `Registry.ts` (tipo)                                                         |
| R08 | Il contratto di salvataggio appartiene al main | 🔒      | `contracts/save.ts` + `main/save/schema.ts`                                  |
| R09 | Ogni lista storica ha un limite dichiarato     | 🔒      | `contracts/bounded.ts`                                                       |
| R10 | Un solo stile di esito                         | ⚠️      | `contracts/commands.ts` + `eslint.config.js`                                 |
| R11 | Denaro `Decimal` end-to-end                    | 🔒      | `contracts/money.ts` + `eslint.config.js`                                    |
| R12 | Nessuna stringa utente hardcoded               | ✅ / ⚠️ | `tests/i18n/parity` + `tests/rules/no-literal-in-template`                   |

Regole di configurazione e di processo, con la stessa dignità:

| ID  | Regola                                                    | Forza | Dove                                            |
| --- | --------------------------------------------------------- | ----- | ----------------------------------------------- |
| C01 | `noUnusedLocals` e `noUnusedParameters` sempre accesi     | ✅    | `tsconfig.base.json`                            |
| C02 | Il codice è sempre formattato                             | ✅    | `package.json` → `format:check`                 |
| C03 | Un solo nome per il prodotto, ovunque                     | ✅    | `tests/rules/product-identity`                  |
| C04 | `.gitignore` copre gli artefatti, `*.tsbuildinfo` incluso | 👤    | `.gitignore`                                    |
| C05 | Nessun entitlement o permesso non usato                   | 👤    | `electron-builder.yml`                          |
| C06 | Ogni `eslint-disable` porta la propria motivazione        | ✅    | `tests/rules/eslint-disable`                    |
| C07 | Ogni collegamento fra documenti risolve, ancore incluse   | ✅    | `tests/rules/link-documenti`                    |
| P01 | Una fetta verticale alla volta, nessun `TODO` nel codice  | ✅    | `docs/roadmap-fette.md` + `tests/rules/no-todo` |

## Invarianti derivati

Conseguenze delle decisioni che vale la pena verificare direttamente, perché la loro rottura
segnala che un confine si sta spostando.

| ID     | Invariante                                                                        | Da       | Verifica                                                         |
| ------ | --------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| INV-01 | `src/core/**` dipende solo da `decimal.js`                                        | ADR 0015 | `tests/rules/core-deps` — allowlist, non esprimibile in ESLint   |
| INV-02 | `src/core/**` non importa mai `vue`, `pinia`, `electron`                          | ADR 0001 | `no-restricted-imports`                                          |
| INV-03 | `src/main/**` importa da `core/` solo `contracts/save.ts`                         | ADR 0004 | `no-restricted-imports` + `tests/rules/main-solo-save`           |
| INV-04 | Il denaro attraversa il confine di persistenza come stringa                       | ADR 0006 | schema `zod` + `tests/save/roundtrip`                            |
| INV-05 | Ogni `System` registrato compare in save, load, reset e stats                     | ADR 0002 | `tests/rules/registry-completeness`                              |
| INV-06 | La dimensione massima del salvataggio è calcolabile a priori                      | ADR 0010 | somma dei `max` dichiarati                                       |
| INV-07 | Ogni `Reason` e ogni `code` di errore ha una chiave in ogni lingua                | ADR 0011 | `tests/i18n/parity`                                              |
| INV-08 | **La somma di tutti i conti è sempre zero**, anche dopo un caricamento            | ADR 0020 | `tests/kernel/ledger` (invariante su 1.000 transazioni)          |
| INV-09 | Nessuna transazione è mai applicata parzialmente                                  | ADR 0019 | `tests/kernel/ledger` (fallimento indotto sull'ultimo movimento) |
| INV-10 | Nessun dominio nomina a mano i pool non-giocatore                                 | ADR 0020 | `grep` di `world`/`sink`/`fees` sotto `domains/`                 |
| INV-11 | La commissione mostrata in anteprima è calcolata dalla stessa funzione che esegue | ADR 0018 | `tests/domains/atm`                                              |
| INV-12 | Il cruscotto della home non supera i **sei** riquadri                             | ADR 0018 | `tests/rules/home-tiles`                                         |
| INV-13 | Il renderer non può usare le API di Node                                          | ADR 0001 | `tsconfig.web.json` senza tipi `node` — 🔒, non compila          |
| INV-14 | Nessun gate sparisce dalla catena `verify`                                        | ADR 0013 | `tests/rules/gates`                                              |
| INV-15 | Il Bus è sincrono: nessuna attesa, nessuna coda dentro `emit`                     | ADR 0016 | `tests/rules/bus-sincrono` — la firma `void` da sola non basta   |

## Le regole di lint si verificano da sole

`tests/rules/lint-rules.test.ts` scrive una violazione per **ogni** regola ESLint del progetto e
pretende che scatti, più i tre casi di eccezione dichiarata che devono **non** scattare. Se qualcuno
indebolisce `eslint.config.js`, il test diventa rosso.

È la risposta alla domanda "chi controlla il controllore": una regola configurata e mai provata
contro una violazione reale è quasi sempre una regola che non funziona.

## Cosa questa tabella NON copre

Le tre righe oneste, perché una matrice di tracciabilità che si dichiara completa è la prima cosa
che invecchia male:

1. **R10 fuori dai comandi.** Il lint vieta i literal con chiave `success`, ma non impedisce a una
   funzione qualsiasi di ritornare `boolean`. Copre la seconda convenzione, non il degrado.
2. **R12 sulle stringhe costruite dinamicamente.** Il test cerca testo letterale nei template
   `.vue` con una regex: non vede una stringa assemblata a runtime.
3. **C04 e C05** dipendono dalla review. Sono le due sole righe 👤 del progetto, ed è deliberato:
   meccanizzarle costerebbe più di quanto valgano. Se diventano tre, è un segnale.
