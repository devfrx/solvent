# D009 — Persistenza nel processo main

- **Stato:** Aperta — testo aggiornato il 2026-08-19, vedi _Cosa è cambiato_
- **Dipende da:** D002, D006
- **Sblocca:** D011
- **ADR vincolanti:** 0004, 0006, 0007, 0010, 0022
- **Regole:** R08, R09, R10, C08, INV-03, INV-04
- **Budget:** ~280 righe di sorgente (rimisurato: vedi _Cosa è cambiato_, punto 8)

## Obiettivo

Rendere il contratto di salvataggio un fatto verificato dal codice, non un documento che si
dichiara autorevole.

## Cosa è cambiato da quando è stata scritta

Otto cose. Le prime quattro erano già nel [passaggio di consegne](PASSAGGIO-DI-CONSEGNE.md) e da
oggi sono incorporate qui; le altre quattro nascono dal preparare la delega, cioè dal guardarla
con il codice del kernel già scritto davanti.

| #   | Cosa                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **`LedgerSave.balances` ha sei chiavi, non due.** I conti non-giocatore entrano nel salvataggio ([ADR 0020](../adr/0020-partita-doppia.md)), altrimenti al ricaricamento la somma non farebbe zero. Lo schema le vuole tutte e sei, come stringhe decimali                                                                                                                                 |
| 2   | **Il main non verifica la somma zero, e non deve.** Lo fa il Ledger quando carica, lanciando `UnbalancedSaveError`. Lo schema controlla la **forma**; l'invariante è del Ledger, non del contratto                                                                                                                                                                                         |
| 3   | **Il canale `reset` non porta un `ResetScope`.** Quel tipo vive in `contracts/lifecycle.ts`, e INV-03 lascia al main il solo `contracts/save.ts`. Il reset del main è "cancella il file di salvataggio"; l'ambito soft/hard resta del renderer ([flusso-salvataggio.md](../design/flusso-salvataggio.md))                                                                                  |
| 4   | **INV-03 ha già la sua rete**: `tests/rules/main-save-only` legge ogni import di `src/main/**` e `src/preload/**` e pretende `contracts/save` e nient'altro. È **più stretta della regola ESLint**, che si ferma a vietare `kernel/`, `domains/` e `balance/`: il test è la verità                                                                                                         |
| 5   | **`Result` non si può importare dal main.** È in `contracts/result.ts`, che INV-03 esclude. La via d'uscita non è allargare INV-03: è `contracts/save.ts` che dichiara i propri tipi d'esito e importa `Result` **dentro `core/`**, dove è lecito. Il main importa un file solo e continua a rispettare R10. Vedi _Il contratto cresce_                                                    |
| 6   | **`src/main/index.ts` è parte di questa delega.** Non era nella tabella dei file, ma gli invarianti su `contextIsolation`, `sandbox` e `nodeIntegration` parlano di una `BrowserWindow`, e la `BrowserWindow` sta lì. L'albero in [architettura.md](../architettura.md) lo prevedeva già                                                                                                   |
| 7   | **Il controllo sul `max` di una lista esce dalla definizione di fatto.** Nel payload della versione 1 non c'è **nessun array**: `LedgerSave.balances` e `RngSave.cursors` sono mappe, e `SystemsSave` è opaco per costruzione — quindi lo schema non può vederci dentro. Un test che verifica un meccanismo che nessun dato attraversa verifica il test. Il grilletto è nel registro YAGNI |
| 8   | **Il budget era ~180 righe ed era una stima di prima del kernel.** Con `main/index.ts`, i tipi d'esito e i sei conti, il conto onesto è ~280. Se esce molto sotto, probabilmente manca qualcosa                                                                                                                                                                                            |

## Da produrre

`src/main/`

| File                 | Contenuto                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `index.ts`           | `app`, la `BrowserWindow` con le tre difese accese, il montaggio dei canali IPC                    |
| `save/schema.ts`     | schema `zod` della busta e del payload — **eseguito**, non descrittivo                             |
| `save/SaveFile.ts`   | lettura e scrittura atomica (temporaneo, `fsync`, `rename`), percorso in `app.getPath('userData')` |
| `save/migrations.ts` | la mappa versione → versione+1. Per la versione 1: vuota, e va bene                                |
| `save/ipc.ts`        | i tre canali `save`, `load`, `reset`, tipizzati                                                    |

`src/preload/index.ts` — espone **solo** questi tre, nient'altro.

### Il contratto cresce

`src/core/contracts/save.ts` guadagna i tipi d'esito. È l'unico file di `core/` che questa delega
tocca, e la ragione è INV-03: il main può importare quello e nient'altro, quindi tutto ciò che
main e renderer si scambiano deve stare lì dentro.

    export type SaveError =
      | { readonly code: 'error.save.corrupt' }
      | { readonly code: 'error.save.invalid'; readonly path: string }
      | { readonly code: 'error.save.version_ahead'; readonly found: number; readonly supported: number }
      | { readonly code: 'error.save.io'; readonly cause: string }

    export type LoadedSave =
      | { readonly present: false }
      | { readonly present: true; readonly payload: SavePayload }

    export type SaveResult<T> = Result<T, SaveError>

    export interface SaveApi {
      readonly save: (payload: SavePayload) => Promise<SaveResult<number>>   // l'istante scritto
      readonly load: () => Promise<SaveResult<LoadedSave>>
      readonly reset: () => Promise<SaveResult<null>>
    }

Tre note che non si vedono dalla firma:

- **`cause` è una stringa, non un `unknown`.** Un `Error` non sopravvive alla clonazione
  strutturata dell'IPC: arriverebbe dall'altra parte come `{}`. Si passa il messaggio.
- **Le funzioni ritornano `Promise`.** L'IPC è asincrono e sta fuori da `core/`: l'ADR 0016 vieta
  l'asincronia nel **Bus**, non nel confine con il sistema operativo.
- **`SaveApi` non è la dichiarazione di `window`.** Il `declare global` che aggancia l'API alla
  finestra è del renderer, quindi di [D011](D011-runtime-e-store.md). Qui il preload si limita a
  soddisfare l'interfaccia.

Questa forma è una **decisione presa in autonomia e contestabile**: l'alternativa era allargare
INV-03 a tutto `contracts/`, che è più corto da scrivere e trasforma un allowlist di un file in un
denylist da mantenere — cioè la regola che si apre da sola, in silenzio.

## Invarianti

- Il main è l'unico che scrive `version` e `savedAt` (R08).
- **Non si scrive mai un payload non valido.** In caso di fallimento, il file precedente resta
  intatto e l'errore torna al renderer con il percorso del campo che ha fallito.
- Scrittura atomica: temporaneo, `fsync`, `rename`. Un crollo a metà non lascia un file troncato.
- In caricamento: si valida la busta, **poi** si migra, **poi** si valida il payload migrato.
  Validare prima di migrare fallisce sempre, e chi lo sistema di solito lo sistema togliendo la
  validazione.
- Lo schema rifiuta un numero dove il contratto vuole una stringa decimale (INV-04).
- Lo schema pretende **tutte e sei** le chiavi di `balances`, e nessuna in più.
- Lo schema **non** controlla che i saldi sommino a zero: lo fa il Ledger quando carica.
- Lo stato dei sistemi resta **opaco**: lo schema lo accetta come `Record<string, unknown>` e non
  guarda dentro. Il contratto non può conoscere i domini (ADR 0002).
- `contextIsolation` acceso, `nodeIntegration` spento, `sandbox` acceso. Il preload espone tre
  funzioni, non `ipcRenderer`.
- Il main non importa nulla da `core/` a parte `contracts/save.ts` (INV-03, verificato da
  `tests/rules/main-save-only`).
- Ogni esito che può fallire è un `Result` (R10). Nessun `boolean`, nessun `null` come "non c'è".
- Identificatori in inglese, prosa in italiano (C08). Questa è la prima delega che scrive codice
  fuori da `core/`, e la regola vale da subito: `tests/rules/english-identifiers` la impone.

## Fuori scope

- Migrazioni vere: non esistono per la versione 1 ([roadmap](../roadmap-fette.md)). La **versione
  2** nascerà con i conti dinamici dell'[ADR 0022](../adr/0022-il-ledger-ha-conti-non-solo-pool.md),
  e quella prima migrazione è l'identità: `balances` da record chiuso a mappa aperta.
- Salvataggi multipli, slot, backup a rotazione.
- Cifratura o firma del salvataggio: è un singleplayer offline (vedi [rischi](../rischi.md), parte 3).
- Salvataggio automatico a intervalli: fetta 03, insieme al progresso offline.
- **Le chiavi i18n di `error.save.*`**: arrivano con [D012](D012-ui-e-i18n.md), insieme al test di
  parità. Qui si dichiarano i codici, non le traduzioni.
- **`npm run verify:release` resta rosso** anche a delega chiusa: `electron-vite build` vuole anche
  il renderer, che nasce con D011. Non è una regressione e non va "sistemato".

## Definizione di fatto

- [ ] test: busta valida → scritta → riletta → identica
- [ ] test: payload non valido → **nessuna** scrittura, file precedente intatto, errore col
      percorso del campo
- [ ] test: file assente → `ok` con `{ present: false }`, non un errore
- [ ] test: JSON illeggibile → `error.save.corrupt`, e il file **non** viene toccato
- [ ] test: un `number` al posto di una stringa decimale viene rifiutato
- [ ] test: `balances` con cinque chiavi su sei viene rifiutato, e con una settima anche
- [ ] test: la busta con una versione **futura** viene rifiutata con `error.save.version_ahead` —
      un salvataggio di una versione più nuova non va migrato all'indietro né aperto a forza
- [ ] test: lo stato di un sistema sconosciuto attraversa lo schema senza essere guardato
- [ ] test: `reset` cancella il file, e un `reset` senza file è `ok`, non un errore
- [ ] test: `tests/rules/main-save-only` resta verde con il main che ora esiste davvero — è la
      prima volta che quel conteggio non è zero a zero
- [ ] verifica manuale: uccidere il processo durante la scrittura non lascia un file troncato

## Trappole note

- **A08.** Le 915 righe di schema "advisory" erano nate valide. Sono diventate stale perché nessuno
  le eseguiva. Uno schema che non fallisce mai non sta validando: sta decorando.
- **A07.** La versione tende a filtrare nel payload attraverso un campo "meta" o "info". Ogni
  campo aggiunto alla busta va guardato con sospetto.
- La versione futura è il caso che nessuno gestisce e che si presenta al primo utente che apre una
  build vecchia dopo aver provato una nuova. Il comportamento corretto è rifiutare e dirlo.
- `fsync` prima del `rename` sembra eccessivo finché non capita una perdita di corrente.
- **`zod` è una dipendenza di runtime già installata** (4.4.x) ed è vietata dentro `core/`: il lint
  la blocca lì (INV-02). Vive nel main, ed è l'unico posto dove può vivere.
- **Il primo import sbagliato nel main passa il lint e fallisce il test.** ESLint vieta `kernel/`,
  `domains/` e `balance/`; `contracts/money` passerebbe da lì e verrebbe fermato solo da
  `tests/rules/main-save-only`. Se il rosso arriva da lì, la correzione non è indebolire il test.
