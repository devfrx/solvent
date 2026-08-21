# D029 — I devcheat

- **Stato:** Chiusa — commit `PENDING`, ramo `d029-i-devcheat`. Scritta ed eseguita il 2026-08-21
- **Dipende da:** [D028](D028-una-capienza-ferma-chi-sale.md). Senza INV-23 un cheat che regala
  denaro può portare un pool oltre il tetto e lasciarlo lì per sempre: lo strumento nato per
  sbloccare una partita la murerebbe da solo
- **Sblocca:** ogni verifica a occhio da qui in avanti, ed è la ragione per cui viene prima della
  rifinitura del bancomat: una schermata si guarda **negli stati che contano**, e finora ogni stato
  si aspettava invece di costruirlo
- **ADR vincolanti:** ne produce uno,
  [0036](../adr/0036-i-cheat-passano-dalle-porte-del-gioco.md). Ne applica cinque:
  [0002](../adr/0002-registry-unica-lista-di-sistemi.md) (la forma del registro),
  [0003](../adr/0003-ledger-unica-porta-del-denaro.md) (la porta del denaro),
  [0001](../adr/0001-simulazione-nel-renderer-core-puro.md) (il core non conosce l'ambiente),
  [0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md) (chi mette
  insieme) e [0032](../adr/0032-le-sovrapposizioni-stanno-nel-livello-superiore.md) (dove sta il
  pannello)
- **Regole:** una regola nuova, **R20**, con `tests/rules/cheats-are-dev-only`. Nessun invariante
  nuovo. Una lista chiusa si allunga di una voce: `dev` fra le cartelle di `components/` che non
  sono domini (R18)
- **Budget:** ~300 righe di sorgente e ~250 di test — misurate **318** e **249**

## Obiettivo

Dare al progetto uno strumento per **costruire** uno stato di gioco invece di aspettarlo, senza che
quello strumento possa mentire sullo stato che costruisce.

## Perché esiste

Provare un gioco idle costa tempo che non è tempo di sviluppo. Per vedere il muro del caveau
bisogna riempirlo; per vedere il potenziamento bisogna guadagnarselo; per vedere il rifiuto di una
capienza bisogna arrivarci. Ogni schermata si paga due volte — una a scriverla, una a metterla nello
stato in cui vale la pena guardarla — e il progetto ha appena dichiarato che le verifiche a occhio
sono **l'unica classe di verifica che nessun gate può dare**
([PASSAGGIO-DI-CONSEGNE](PASSAGGIO-DI-CONSEGNE.md), _Come si guarda l'applicazione senza toccarla_).

C'è una seconda ragione, ed è quella che ha fatto scattare il momento: la partita di sviluppo di
questa macchina era **murata viva**, e per due giorni il sintomo è stato scambiato per un difetto
del codice — prima il grafico del patrimonio, poi i pulsanti del bancomat. Uno strumento che
costruisce lo stato è anche uno strumento che lo **disfa**.

## Da produrre

| File                                       | Cosa è                                                       |
| ------------------------------------------ | ------------------------------------------------------------ |
| `src/core/contracts/cheats.ts`             | `CheatId`, `Cheat` nelle sue due forme, `CheatResult`        |
| `src/core/kernel/Cheats.ts`                | il registro, che non conosce un solo cheat                   |
| `src/core/kernel/LedgerCheats.ts`          | i cheat del denaro, dichiarati da chi il denaro ce l'ha      |
| `src/core/domains/vault/cheats.ts`         | il livello del caveau                                        |
| `src/core/domains/income/cheats.ts`        | l'interruttore del potenziamento                             |
| `src/renderer/runtime/cheats.ts`           | `installCheats` — l'unico posto che li nomina tutti          |
| `src/renderer/components/dev/DevPanel.vue` | il pannello, nel livello superiore                           |
| `src/renderer/main.ts`, `App.vue`          | l'interruttore, e il montaggio dietro lo stesso interruttore |
| `src/renderer/stores/game.ts`              | `devCheats` e `runCheat`                                     |
| `tests/rules/cheats-are-dev-only.test.ts`  | **R20**                                                      |
| `tests/kernel/cheats.test.ts`              | il registro, con cheat finti                                 |
| `tests/renderer/cheats.test.ts`            | i cheat veri su una partita vera                             |

## Invarianti

- Un cheat non ha più poteri di un comando di gioco: passa dal Ledger o dal `load` del proprio
  dominio, quindi INV-08 e INV-23 restano veri anche dopo averne premuti dieci.
- Ogni movimento di un cheat porta la propria ragione e compare nel registro delle operazioni.
  **Non c'è denaro invisibile.**
- **R20** — nessuno nomina un modulo dei cheat con un import di **valore** fuori dai posti
  dichiarati; `import.meta.env` è letto da due file soli; ogni `CheatId` dichiarato è registrato, e
  nessuno di più.

## Fuori scope

- **Il tempo.** «Salta un'ora» è il cheat più utile che non c'è, e non c'è perché tocca il recupero
  offline, che è il cuore della **fetta 03**: costruirlo adesso vorrebbe dire decidere lì com'è
  fatto il recupero a blocchi. Il grilletto è l'apertura della fetta 03.
- **Un campo di testo per l'importo.** Quattro ordini di grandezza in un clic bastano, e il grilletto
  è il primo cheat il cui valore utile non è un ordine di grandezza (ADR 0036, alternative).
- **Salvare quale cheat è stato premuto.** Un salvataggio che ricordasse di essere stato barato è
  una difesa contro il giocatore, e [rischi.md](../rischi.md) dichiara che quella difesa non si fa.
- **Cheat per domini che non esistono.** Black market, prestiti, immobiliare: ognuno porterà i
  propri, ed è il punto del registro. Dichiararli adesso sarebbe l'astrazione speculativa che
  l'[ADR 0014](../adr/0014-una-fetta-verticale-alla-volta.md) vieta.
- **La minificazione del pacchetto di rilascio.** La misura del bundle ha mostrato che il renderer
  compilato **non è minificato** — i commenti sono ancora dentro. È un fatto vero, è fuori da questa
  delega, e sta nel [registro YAGNI](../roadmap-fette.md) con il suo grilletto.

## Definizione di fatto

- [x] Il registro non conosce nessun cheat finché qualcuno non lo dichiara — test.
- [x] Le due forme di `Cheat` ricevono ciò che gli spetta, e non di più — test.
- [x] Un id doppio e un id sconosciuto **lanciano** — test.
- [x] Regalare denaro lascia i conti a somma zero e rispetta la capienza — test.
- [x] Il livello del caveau e il potenziamento del reddito si muovono, e il modificatore li segue.
- [x] Una partita oltre il tetto si sblocca dal pannello, senza toccare il file — test.
- [x] **R20 rotta di proposito tre volte**: lo store che importa un valore invece di un tipo, un
      secondo file che legge `import.meta.env`, un `CheatId` dichiarato e mai registrato. Tutte e
      tre diventano rosse.
- [x] Il pannello si apre e mostra i pulsanti — verificato a schermo dall'utente, e la prima volta
      **non** funzionava: vedi la correzione 1.
- [x] `npm run verify` verde, `npm run build` verde.
- [x] `docs/stato.md` rigenerato.

## La misura: cosa resta nel pacchetto di rilascio

Il metodo: `npm run build`, poi si cerca ogni nome dei cheat nel bundle compilato.

| Cosa si cerca                                  | Occorrenze | Cos'è                                             |
| ---------------------------------------------- | ---------- | ------------------------------------------------- |
| `createCheats`, `ledgerCheats`, `vaultCheats`  | **0**      | il codice dei cheat non c'è                       |
| `DuplicateCheatError`, `UnknownCheatError`     | **0**      | il registro non c'è                               |
| `DevPanel`                                     | 3          | `const DevPanel = null` e il suo `v-if`           |
| `installCheats`                                | 1          | **dentro un commento**, non una chiamata          |
| `cheat.ledger.grant_cash` e le altre etichette | 2 ciascuna | il dizionario, una per lingua — prezzo dichiarato |

Un solo chunk viene emesso: l'`import()` dinamico del pannello non produce nemmeno un file.

**Da rifare quando si tocca il bundler.** R20 guarda la forma del sorgente; questa tabella guarda i
byte, e sono due domande diverse. È scritto anche in testa a `tests/rules/cheats-are-dev-only`.

## Trappole note

1. **Il pannello che aggira le regole.** È il cheat che tutti scrivono per primo — «contanti =
   1.000.000» — e costruisce uno stato che il gioco non sa produrre. È lo stato che ha bloccato
   questa macchina per due giorni. Qui regalare contanti a caveau pieno viene **rifiutato**, e non è
   un limite: è l'utilità principale, perché quel rifiuto è il gioco.
2. **La seconda lista.** Un pannello che elenca i propri pulsanti a mano è il difetto A02 in
   miniatura, e con tre domini non si nota.
3. **La guardia ripetuta.** Un `if (dev)` in dieci file è una difesa che tiene finché qualcuno non
   ne dimentica una — e in sviluppo funziona comunque, quindi non se ne accorge nessuno. La difesa
   vera non è la guardia: è **chi può nominare** i moduli.
4. **Il `load` che dimentica il modificatore.** Un cheat che scrivesse `upgraded` senza passare da
   `system.load` lascerebbe il rendimento fermo e l'etichetta cambiata: due numeri che si
   contraddicono, cioè la classe di difetto che questo pannello serve a **trovare**.

## Correzioni rispetto a com'era scritta la delega

1. **Il pannello si è aperto vuoto, e nessun test lo vedeva.** `storeToRefs` estrae **solo** ciò che
   è `ref` o `computed`: `devCheats` era un array normale, quindi usciva `undefined` e il `v-for`
   non disegnava niente — senza un errore, senza un avviso. L'ha trovato l'utente guardando lo
   schermo. La correzione è una parola (`computed`), e la lezione è quella che il progetto ha già
   scritto due volte: **l'immagine dice se qualcosa c'è, il documento dice se funziona**, e qui non
   c'era né l'una né l'altro perché un pannello di sviluppo non ha test di componente. È anche il
   caso che il [registro YAGNI](../roadmap-fette.md) prevede per `jsdom`, e non fa scattare il
   grilletto: il comportamento era estraibile in una funzione pura, ed è che l'array andava
   avvolto.
2. **`roomIn` non c'entrava, ma il rifiuto sì.** La delega dava per scontato che i cheat del denaro
   avrebbero funzionato sempre. Il primo test scritto ha mostrato il contrario — regalare 10.000 €
   in contanti a caveau di partenza è un `capacity_exceeded` — e invece di essere corretto è
   diventato **il** caso di prova: è la dimostrazione che un cheat non ha poteri speciali.
3. **I `CheatId` sono un'unione centrale, e la delega non lo diceva.** La prima idea era una stringa
   libera, e sarebbe stata più comoda da espandere. È stata cambiata scrivendo l'ADR: un pannello di
   cheat è fatto di **etichette**, e con una stringa libera un cheat può nascere senza parole in una
   delle due lingue. Il baratto è lo stesso di `Reason`, ed è dichiarato nelle alternative.
4. **`git checkout --` su un file con lavoro non commesso l'ha cancellato**, e recuperarlo è costato
   dieci minuti. Non è una correzione della delega: è la ragione per cui le tre rotture di R20 sono
   state fatte, alla fine, copiando il file da parte prima di romperlo. Vale la pena scriverlo
   perché rompere una regola di proposito è una pratica **richiesta** dal progetto, e il modo
   sbagliato di farla ha un costo che non si vede finché non lo si paga.
5. **La misura del bundle ha trovato qualcos'altro.** Il renderer compilato **non è minificato** —
   `installCheats` compare una volta, dentro un commento sopravvissuto. Non cambia la conclusione
   della misura (il codice non c'è), e apre una domanda che questa delega non risponde: 2.437,92 kB
   sono un bundle non minificato, non un bundle grande. È nel registro YAGNI.
