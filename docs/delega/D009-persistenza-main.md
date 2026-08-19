# D009 — Persistenza nel processo main

- **Stato:** **Chiusa** — 2026-08-19, commit `256f622`, ramo `d009-persistenza-main`
- **Dipende da:** D002, D006
- **Sblocca:** D011
- **ADR vincolanti:** 0004, 0006, 0007, 0010, 0022
- **Regole:** R08, R09, R10, C08, INV-03, INV-04
- **Budget:** ~280 righe di sorgente → **consuntivo: 257 righe di codice** (438 con i commenti) + 456 di test

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
| `save/channels.ts`   | i nomi dei tre canali, in un file senza import — non era in tabella: correzione 1                  |

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

## Nove correzioni rispetto a com'era scritta questa delega

**1. Il preload e il main hanno bisogno degli stessi tre nomi, e la tabella dei file non aveva
dove metterli.** I nomi dei canali non possono stare in `ipc.ts`: quel file importa `zod`, e un
preload in **sandbox** non può caricare un pacchetto esterno — importarli da lì trascinerebbe
`zod` dentro il bundle del preload. L'altra alternativa è scriverli due volte, cioè due costanti
che devono coincidere e nessuno che lo verifichi. `save/channels.ts` è una foglia senza un solo
import, ed è l'unica forma che regge entrambi i vincoli.

**2. Non è solo `Result` a non essere importabile: sono anche `ok` e `err`.** La delega risolve il
tipo e non i suoi due costruttori, che vivono nello stesso `contracts/result.ts` che INV-03
esclude. Nel main la forma `{ ok: true, value }` / `{ ok: false, error }` si scrive a mano: sono
diciotto letterali, ognuno più corto di due righe. L'alternativa era ri-esportare i due helper da
`contracts/save.ts` — un barrel, che le [convenzioni](../convenzioni.md#nomi-di-file) ammettono in
un solo punto del progetto, e non è questo.

**3. Lo schema controlla la forma della stringa decimale, non solo che sia una stringa.** La
definizione di fatto chiede di rifiutare un `number`, e `z.string()` basterebbe. Non basta:
`Decimal` accetta `1e9`, `Infinity` e `NaN`, e su `'prendi tutto'` **lancia** — dentro il Ledger,
cioè fuori da ogni `Result` e fuori da ogni schermata che sappia dirlo. Lo schema è l'ultimo punto
in cui un file manomesso è ancora un dato; dopo diventa un crollo.

**4. La versione la scrive il runner, non la migrazione.** Il
[flusso](../design/flusso-salvataggio.md) dice che una migrazione "prende la busta della versione N
e ritorna quella della N+1". Firmata così, ogni migrazione deve ricordarsi di scrivere `version:
n + 1`, e "mai due salti in una funzione" resta una regola da ricordare. La firma è invece
`(payload: unknown) => unknown`: il salto di versione è del runner, e sbagliarlo non è più
possibile. È lo stesso movimento con cui `SavePayload` non ha un campo versione (difetto A07). Il
documento di disegno è stato aggiornato nello stesso commit.

**5. Il runner riceve la versione di arrivo e la mappa per parametro.** Con `SAVE_VERSION` a 1 e
la mappa vuota, un runner che leggesse entrambe da costanti sarebbe codice che nessun test
attraversa fino alla versione 2 — cioè codice provato per la prima volta il giorno in cui serve.
Con i due parametri, `tests/save/migrations` prova la catena vera con migrazioni finte: ordine,
partenza, passo mancante, `savedAt` conservato.

**6. I quattro codici d'errore non ne hanno uno per "manca un passo di migrazione".** Il caso non
è raggiungibile con una mappa completa — c'è un test che verifica la copertura — e resta gestito
lo stesso, come `error.save.invalid` con `path: 'version'`: per chi carica, un file che questa
build non sa portare fino alla versione corrente è un file che non può accettare. Aggiungere un
quinto codice avrebbe cambiato il tipo che la delega scrive per esteso, e quella era una decisione
da sollevare **prima**, non da prendere a metà strada.

**7. `sandbox: true` ha costretto a toccare `electron.vite.config.ts`.** Un preload in sandbox non
può essere un modulo ES: Electron lo carica come CommonJS semplice. Con `"type": "module"` nel
`package.json`, l'unica cosa che lo dichiara è l'estensione, quindi il preload si compila in
`out/preload/index.cjs` ed è quello che `main/index.ts` punta. Senza questa riga l'invariante
sarebbe stato scritto e non funzionante, e a scoprirlo sarebbe stata [D011](D011-runtime-e-store.md).

Il `main`, invece, **non** andava toccato: il preset di `electron-vite` rinomina in `.mjs` solo il
preload, quindi `out/main/index.js` è ESM ed è già ciò che `package.json` punta. È stato cambiato
e poi rimesso com'era, dopo aver guardato l'output del `build` invece di dedurlo.

**8. Nella configurazione del preload `external` va ripetuto.** `mergeConfig` **sostituisce**
`rollupOptions` invece di sommarlo: dichiarare il formato senza ridichiarare `external` fa finire
il pacchetto `electron` — installatore compreso — dentro il bundle del preload. Il comando non lo
dice: `build` resta verde su main e preload, e il difetto si vede solo aprendo il file prodotto.

**9. La definizione di fatto non elencava il giro completo dal kernel al disco.** I suoi undici
casi guardano tutti il main con payload scritti a mano, e sono i suoi casi limite. Manca l'altra
metà: che lo schema accetti **ciò che il kernel produce davvero**. Uno schema corretto e un kernel
corretto che non si parlano sono due cose corrette e una partita persa — ed è la rete che
l'[ADR 0004](../adr/0004-il-main-e-proprietario-del-contratto-di-salvataggio.md) chiama per nome.
`tests/save/kernel-roundtrip` la stende, con lo stato non banale che
[qualita.md](../qualita.md#il-test-round-trip-e-perché-è-il-più-importante) descrive.

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

- [x] test: busta valida → scritta → riletta → identica
- [x] test: payload non valido → **nessuna** scrittura, file precedente intatto, errore col
      percorso del campo
- [x] test: file assente → `ok` con `{ present: false }`, non un errore
- [x] test: JSON illeggibile → `error.save.corrupt`, e il file **non** viene toccato
- [x] test: un `number` al posto di una stringa decimale viene rifiutato
- [x] test: `balances` con cinque chiavi su sei viene rifiutato, e con una settima anche
- [x] test: la busta con una versione **futura** viene rifiutata con `error.save.version_ahead` —
      un salvataggio di una versione più nuova non va migrato all'indietro né aperto a forza
- [x] test: lo stato di un sistema sconosciuto attraversa lo schema senza essere guardato
- [x] test: `reset` cancella il file, e un `reset` senza file è `ok`, non un errore
- [x] test: `tests/rules/main-save-only` resta verde con il main che ora esiste davvero — è la
      prima volta che quel conteggio non è zero a zero: sette file letti fra main e preload, un
      import solo da `core/`, ed è `contracts/save`
- [x] verifica manuale: uccidere il processo durante la scrittura non lascia un file troncato.
      L'esito è nella nota di chiusura, insieme al controllo che dimostra che il controllo funziona

Quattro voci aggiunte all'elenco (correzione 9):

- [x] test: il giro completo dal kernel al disco e ritorno — saldi con decimali, due stream
      dell'Rng, lo stato di un sistema
- [x] test: un file manomesso che non somma zero passa la **forma** ed è il Ledger a fermarlo
- [x] test: la scrittura passa davvero da un temporaneo, e un temporaneo rimasto da un crollo
      precedente non blocca il salvataggio successivo
- [x] test: il preload espone tre funzioni e non `ipcRenderer`

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 266 test su 35 file (erano 213
su 29). I quattro gate stanno fra 28 e 29 secondi su due misure consecutive, dentro lo stesso
intervallo di D007 e D008: i 53 test in più non li hanno spostati.

`npm run verify:release` resta **rosso**, e non è una regressione: `electron-vite build` compila
`out/main/index.js` e `out/preload/index.cjs` senza un errore, poi si ferma su
`index.html file is not found in /src/renderer`. Il renderer nasce con
[D011](D011-runtime-e-store.md).

### Le reti sono state rotte una alla volta

| Rottura indotta                                    | Cosa è diventato rosso                                     |
| -------------------------------------------------- | ---------------------------------------------------------- |
| `balances` da `strictObject` a `object`            | il settimo pool                                            |
| il decimale torna una `z.string()` qualunque       | le sette stringhe che non sono decimali                    |
| lo schema dimentica `house`                        | **16 casi su 45** — è il confronto con `POOL_IDS`          |
| il seme non può più essere negativo                | 10 casi, fra schema e giro completo                        |
| lo schema azzera i cursori mentre li valida        | l'Rng che riprende da dove era rimasto, e il giro completo |
| si scrive prima di validare                        | i 2 casi "non viene scritto"                               |
| il file assente diventa un errore                  | la partita nuova, e il reset che la prepara                |
| via il temporaneo, si scrive dritto sul file reale | "la scrittura passa davvero da un temporaneo"              |
| il caricamento cancella il file corrotto           | il JSON illeggibile che non va toccato                     |
| la versione futura viene aperta lo stesso          | `error.save.version_ahead`                                 |
| il preload espone anche `ipcRenderer`              | i 2 casi sulla superficie del ponte                        |
| un canale non viene montato                        | i 2 casi sui tre canali                                    |
| il main importa `@core/contracts/money`            | **il lint resta verde**, `tests/rules/main-save-only` no   |

L'ultima riga è la trappola che la delega annunciava, verificata: `npx eslint` non dice niente,
perché la sua regola vieta `kernel/`, `domains/` e `balance/` e `contracts/money` non è in
quell'elenco. A fermarlo è il test, che è un allowlist. Se il rosso arriva da lì, la correzione non
è indebolire il test.

La terza riga merita una nota: togliere un conto dallo schema fa cadere un terzo della suite. Non è
ridondanza — è che lo schema del main e `POOL_IDS` di `core/` sono la stessa lista scritta due
volte per forza (INV-03), e quel confronto è l'unica cosa che le tiene insieme.

### La verifica manuale: uccidere il processo durante la scrittura

Un processo figlio scrive 120 MB sopra un salvataggio già esistente e valido; il padre lo uccide
con `SIGKILL` dopo un ritardo, poi confronta il file con com'era. Il **controllo** è la stessa
prova con la scrittura fatta dritta sul file reale, cioè con l'implementazione che sarebbe venuta
naturale senza `fsync` e `rename`.

| Ritardo prima del `SIGKILL` | temporaneo + `fsync` + `rename` | scrittura diretta (controllo)  |
| --------------------------- | ------------------------------- | ------------------------------ |
| 200 ms                      | intatto, 232 byte               | intatto, 232 byte              |
| 240 ms                      | intatto, 232 byte               | intatto, 232 byte              |
| 280 ms                      | intatto, 232 byte               | **20.447.232 byte, non JSON**  |
| 320 ms                      | intatto, 232 byte               | **100.139.008 byte, non JSON** |

Nella colonna atomica il salvataggio precedente è byte per byte quello di prima, a ogni ritardo.
Resta sul disco un `save.json.tmp` mai rinominato: è innocuo, e la scrittura successiva lo riapre
in `w` — c'è un test anche per quello. Nella colonna di controllo il file è la partita persa, e le
prime due righe dicono perché una prova sola non sarebbe bastata: prima dei 280 ms il figlio sta
ancora convertendo la stringa, e la scrittura diretta sembra sicura.

### Il budget

~280 righe dichiarate, **257 scritte**: `main` e `preload` ne fanno 239, i tipi d'esito in
`contracts/save.ts` altre 18. Con i commenti sono 438. I test sono 456, su sei file.

La delega diceva "se esce molto sotto, probabilmente manca qualcosa". Ventitré righe sotto non è
molto sotto, e le due voci che l'avrebbero fatta sforare — il controllo sul `max` di una lista e le
migrazioni vere — sono entrambe fuori scopo per una ragione scritta.

### Gli ADR

L'[ADR 0004](../adr/0004-il-main-e-proprietario-del-contratto-di-salvataggio.md) passa da
_Proposta_ ad **Accettata**: lo schema è eseguito a ogni salvataggio e a ogni caricamento, la
scrittura è atomica, le migrazioni hanno un posto solo e il renderer non ha dove mettere una
versione.

Il [0010](../adr/0010-liste-storiche-limitate-alla-definizione.md) resta _Proposta_, ed è
deliberato: dice che il validatore rifiuta un array più lungo del `max` dichiarato, e nel payload
della versione 1 non c'è nessun array. Metà meccanismo non è una decisione in vigore.

Il [0006](../adr/0006-decimal-end-to-end-per-il-denaro.md) e il
[0007](../adr/0007-result-come-unico-stile-di-esito.md) erano già _Accettate_ con D002: questa
delega li porta oltre il confine di persistenza per la prima volta.

## Cosa deve sapere chi prende D011

- **L'API si chiama `window.solvent`**, e ha tre funzioni: `save`, `load`, `reset`. La chiave sta
  in `src/main/save/channels.ts` come `SAVE_API_KEY`. Il `declare global` che la aggancia a
  `window` è del renderer, quindi di D011: qui il preload si limita a soddisfare `SaveApi`.
- **`load()` ritorna `{ present: false }`, non un errore, quando il file non c'è.** Confonderli è
  il modo più veloce di mostrare una schermata di errore a chi ha appena installato il gioco.
- **`save(payload)` ritorna l'istante scritto.** È l'unico modo che il renderer ha di sapere
  quando è stato salvato: `savedAt` non entra nel payload e non deve (R08).
- **Il `reset` del main non è il `reset` del Registry.** Il primo cancella il file, il secondo
  azzera i sistemi con un `ResetScope`. Un prestige chiama il secondo e non il primo.
- **`UnbalancedSaveError` arriva da `Ledger.load`, non dall'IPC.** Il caricamento può tornare `ok`
  con un payload dalla forma giusta e i saldi manomessi: la somma zero la verifica il Ledger, e
  quel lancio va nello stato `Errore` del loop, non ignorato. C'è un test che lo dimostra.
- **`loadAll` ritorna `Result<LoadReport, RegistryError>`**, e anche quello è un caso da mostrare.
- **L'ordine di caricamento è: busta, migrazioni, payload.** Non è verificabile alla versione 1 —
  con una sola versione l'ordine sbagliato dà lo stesso risultato — quindi chi scriverà la
  versione 2 non ha una rete che lo protegga da quell'inversione. È la prima cosa da guardare
  quando quella migrazione esisterà.

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
