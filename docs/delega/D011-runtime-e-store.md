# D011 — Runtime e store

- **Stato:** **Chiusa** — 2026-08-19, ramo `d011-runtime-e-store`
- **Dipende da:** D009, D010
- **Sblocca:** D012
- **ADR vincolanti:** 0001, 0009, 0016
- **Regole:** R01, R04
- **Budget:** ~120 righe → **consuntivo: 249 righe** sui tre file dichiarati, **379** con l'ingresso del renderer + 45 fuori dal renderer + 774 di test

## Obiettivo

Collegare il kernel puro a Vue senza che il kernel se ne accorga.

## Da produrre

`src/renderer/runtime/`

| File            | Contenuto                                                                         |
| --------------- | --------------------------------------------------------------------------------- |
| `createGame.ts` | costruisce il contesto, registra i sistemi, espone salva/carica/reset             |
| `loop.ts`       | `requestAnimationFrame` + accumulatore → tick a passo fisso; gestisce il recupero |

`src/renderer/stores/game.ts` — l'unico store della fetta.

Più tre file che la delega non elencava e che sono serviti lo stesso (correzione 6):

| File                    | Contenuto                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `runtime/host.ts`       | l'**unico** file che tocca il browser: `window`, `document`, `requestAnimationFrame`, `performance` |
| `main.ts`               | costruisce la partita, consegna il browser, monta                                                   |
| `App.vue`, `index.html` | il guscio: rende gli stati del ciclo di vita e il mirror, senza una parola di prosa                 |

## Invarianti

- `createGame.ts` è l'**unico** posto dove i sistemi vengono registrati. È la riga per sistema
  prevista dall'ADR 0002, ed è ciò che `registry-completeness` conta.
- Lo store **non calcola nulla**: riceve dal Bus e aggiorna un mirror reattivo. Se lo store
  calcolasse, il gioco non sarebbe simulabile senza Vue e cadrebbe l'ADR 0001.
- Lo store non importa altri store (R01). Per la fetta ce n'è uno solo, ma la regola vale da ora.
- Il loop non gira durante il caricamento: nessun tick prima che `loadAll` sia finito.
- Il tempo frazionario resta nell'accumulatore. Non si arrotonda, non si scarta.
- Il recupero è `tickAll` con un `n` grande, limitato dal tetto: **nessuna formula separata**
  (ADR 0009). Lo stesso percorso serve la riapertura del gioco e il ritorno da finestra nascosta.
- Il salvataggio avviene alla chiusura della finestra, e la finestra si chiude **dopo** che il
  main ha confermato la scrittura.
- Gli stati e le transizioni sono quelli di [ciclo-di-vita.md](../design/ciclo-di-vita.md): se il
  codice ne aggiunge uno, quel diagramma cambia nello stesso commit.

## Fuori scope

- Salvataggio automatico a intervalli: fetta 03, insieme al progresso offline.
- Progresso offline oltre il tetto: fetta 03, che è la fetta in cui il tetto nasce.
- Web Worker: grilletto = un profilo che mostri il tick che blocca il frame.
- Devtools o pannelli di debug che leggano stato privato.

## Definizione di fatto

- [x] test: il loop con un tempo simulato controllato produce **esattamente** il numero di tick
      atteso, e l'accumulatore conserva il resto — mille frame da 16 ms valgono 160 tick, e senza
      l'accumulatore ne varrebbero zero
- [x] test: un `n` oltre il tetto viene limitato al tetto, e dice quanto ha buttato via
- [x] test: nessun tick parte prima che il caricamento sia finito
- [x] test: lo store riflette il saldo dopo un `money.posted`, e non lo calcola — è **lo stesso
      oggetto** che il Ledger ha emesso, provato per identità
- [x] test: `createGame` registra tutti i sistemi previsti — `registry-completeness` è tornato
      secco: un sistema, una registrazione
- [~] verifica manuale: nascondere e riesporre la finestra recupera il tempo passato — vedi
  _Cosa non è stato verificato a mano_

Otto voci aggiunte all'elenco:

- [x] test: il Ledger passato alle factory è quello del `SystemContext` — la trappola che due
      deleghe annunciavano e nessun test copriva (correzione 11)
- [x] test: la finestra resta aperta finché il main non ha confermato la scrittura, provato con una
      scrittura che non si conclude (correzione 12)
- [x] test: se la scrittura finale fallisce la finestra **non** si chiude (correzione 13)
- [x] test: un orologio che torna indietro non produce tick negativi (correzione 14)
- [x] test: il recupero all'avvio esegue i tick arretrati e li limita al tetto, con lo **stesso**
      `stepOf` del loop
- [x] test: `Sospeso → Recupero → InGioco`, e il ritorno si chiude col primo frame
- [x] test: un salvataggio con i conti manomessi diventa `error.game.load_failed`, uno stato di
      dominio manomesso `error.registry.load_failed`
- [x] test: `reset('hard')` è una partita nuova, quindi anche una casualità nuova

## Quattordici correzioni rispetto a com'era scritta questa delega

**1. `LoadedSave` non portava `savedAt`, e senza non c'è recupero all'avvio.** La transizione
`Caricamento → Recupero` di [ciclo-di-vita.md](../design/ciclo-di-vita.md) chiede quanto tempo è
passato, e il renderer non aveva modo di saperlo: il main validava `savedAt` in `parseHeader` e poi
lo buttava via. È stato aggiunto al contratto, in uscita e basta — a scriverlo resta il main (R08),
e non esiste una firma che permetta al renderer di produrlo.

**2. Il Clock non sapeva cosa fosse un millisecondo**, e il browser non conosce altra unità:
`requestAnimationFrame` e `Date.now()` misurano in millisecondi. Un `1000` dentro `loop.ts` sarebbe
stato il difetto A04 con un altro numero e un altro posto. Nascono `MILLISECONDS_PER_SECOND`, il
tipo `Milliseconds` e `ticksToMilliseconds` — l'unica conversione verso quell'unità che esista, e
il loop la chiama **una volta**, per sapere quanto dura un passo.

**3. R06 scattava su una lettura.** Il selettore era
`AssignmentExpression > MemberExpression[property.name=/…balances…/]`, e un `>` prende **entrambi**
i figli di un assegnamento: rispecchiare `evento.balances` era una violazione della regola che
protegge i saldi. Nessuno se n'era accorto perché fino a qui nessun codice del progetto **leggeva**
un saldo per rispecchiarlo — lo store è il primo mirror. Aggiunto `.left`, più il caso che prova
che una lettura passa.

**4. Il Ledger non sapeva dire tutti i saldi insieme.** Dopo un `load` i saldi sono cambiati e
**nessun evento** lo dice, perché caricare non è un movimento economico: il mirror va riletto. Senza
`Ledger.balances()` lo store avrebbe dovuto ricomporre la mappa a mano, con lo stesso cast che il
Ledger ha già al suo interno — cioè copiare un cast fuori dal file che lo giustifica.

**5. `ref` avvolge in un proxy anche il contenuto, cioè i `Decimal`.** Il mirror smetteva di essere
l'oggetto emesso dal Ledger e diventava una copia proxata: il test che prova "lo store non
ricalcola" per **identità** falliva pur essendo il codice giusto. `shallowRef` è la forma corretta
per due valori che vengono sostituiti interi e mai modificati sul posto — e in cambio l'identità
torna a essere verificabile.

**6. D011 produce anche l'ingresso del renderer**, che la delega non elenca. La sua stessa
definizione di fatto chiede una verifica manuale a finestra nascosta: senza `index.html`, `main.ts`
e un `App.vue`, non c'è niente da nascondere — e il gate `verify:release`, che due documenti danno
per verde con D011, non lo sarebbe diventato. Il guscio rende gli stati del ciclo di vita e il
mirror, **senza una parola di prosa**: ogni etichetta è una chiave i18n, e l'i18n è di
[D012](D012-ui-e-i18n.md), che riempie questo guscio invece di crearlo.

**7. Il browser sta in un file solo.** `runtime/host.ts` è l'unico posto che nomina `window`,
`document`, `requestAnimationFrame` e `performance`; loop, bootstrap e store li ricevono per
costruzione. Non è eleganza: è ciò che fa girare i test in `node` senza jsdom, e che permette a un
test di far passare **otto ore** in un millisecondo. Se un secondo file inizia a nominare `window`,
quella proprietà è finita.

**8. Due orologi, non uno.** Il loop usa un orologio **monotono** (`performance.now`), che non
salta quando l'ora di sistema cambia; il recupero all'avvio usa l'ora del mondo (`Date.now`),
l'unica confrontabile con `savedAt`. Sono due campi diversi dell'`Host` apposta: usare il secondo
nel loop significherebbe un salto di tick a ogni aggiustamento dell'ora.

**9. La chiusura non ha avuto bisogno di canali IPC nuovi.** La stretta di mano fra main e renderer
— il main intercetta `close`, avvisa il renderer, aspetta la conferma — avrebbe voluto due canali e
la riscrittura di INV-16, _il preload espone tre funzioni_. In Electron assegnare `returnValue`
dentro `beforeunload` annulla la chiusura **senza** il dialogo che un browser mostrerebbe: il tempo
per salvare si prende lì, e il confine di [D009](D009-persistenza-main.md) resta intatto.

**10. `atm` non si registra, e la delega non poteva saperlo**: è stata scritta prima di
[D014](D014-dominio-bancomat.md). `createGame` ha **una** riga di `register`, non due, e
`tests/rules/registry-completeness` conta un dominio — perché conta i `system.ts`, non le cartelle.

**11. La trappola annunciata da due deleghe non aveva una rete.** [D010](D010-dominio-income.md) e
D014 dicono entrambe che il `Ledger` passato alle factory **deve** essere quello del
`SystemContext`, e che nessun tipo lo impedisce. Provato a passarne uno diverso a `createIncome`:
**quaranta test verdi**. Il `tick` usa `ctx.ledger`, il comando usa quello iniettato, e nessun test
faceva pagare l'upgrade attraverso il bootstrap. Adesso c'è, ed è l'unica rete che quella trappola
abbia.

**12. Il primo test sulla chiusura non provava l'ordine.** Diceva "ha salvato" e "si è chiusa", che
sono vere anche invertendo i due gesti — e invertirli perde l'ultima partita di gioco. Riscritto con
una scrittura che non si conclude: la finestra deve restare aperta finché il main non conferma.

**13. Se il salvataggio finale fallisce, la finestra non si chiude.** Il ciclo di vita dice
_Chiusura → \[\*\]: salvataggio completato_ e non dice cosa fare quando non si completa. Chiudere
comunque sarebbe comodo e perderebbe l'unica copia esistente: si passa in `Errore`, con la partita
ancora in memoria e ancora salvabile. La schermata che offrirà "chiudi lo stesso" è di D012.

**14. Un orologio che torna indietro produrrebbe tick negativi.** Un aggiustamento dell'ora di
sistema dà un delta negativo, e `Math.floor(-0.5)` è `-1`: reddito al contrario, cioè denaro che
sparisce senza una transazione. Guardato in `stepOf`, e provato.

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 382 test su 45 file (erano 334
su 42).

**`npm run verify:release` è verde**, e per la prima volta: `build` compila `out/main/index.js`,
`out/preload/index.cjs` e adesso anche `out/renderer/` — 41 moduli, 272 kB di JavaScript e 0,6 kB
di CSS. È l'unica delega del progetto in cui quel gate cambia colore, e da qui in avanti ogni
delega deve tenerlo verde.

### Cosa non è stato verificato a mano

La definizione di fatto chiede di **nascondere e riesporre la finestra**. L'applicazione è stata
avviata davvero — `npm run dev`, finestra aperta, nessun errore — ma minimizzare e ripristinare a
mano non è stato possibile da questa sessione. Quello che c'è al suo posto:

- il test `Sospeso → Recupero → InGioco` fa esattamente quella sequenza con un tempo controllato, e
  verifica che i tick arretrati vengano eseguiti al ritorno;
- il test del tetto fa passare **cento ore** e controlla che ne vengano recuperate otto.

Quello che nessuno dei due copre è che `runtime/host.ts` **agganci gli eventi giusti** —
`visibilitychange`, `beforeunload`, `requestAnimationFrame`. È l'unico file del progetto senza test,
ed è una conseguenza dichiarata del confine: quel file **è** il browser. Il grilletto per coprirlo è
già scritto altrove — `vitest.config.ts` dice che jsdom entrerà con i test di componente, cioè con
D012, e quel giorno il collegamento si prova gratis.

**Trovato per strada:** il binario di Electron non era installato in questa macchina
(`node_modules/electron/dist` mancante), quindi `npm run dev` falliva con _Electron uninstall_ per
chiunque. Completato con `node node_modules/electron/install.js`.

### Le reti sono state rotte una alla volta

| Rottura indotta                                              | Cosa è diventato rosso                                  |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| l'accumulatore scarta il resto                               | 3 casi, fra cui i mille frame da 16 ms                  |
| il tetto di recupero sparisce                                | 3 casi, loop e avvio insieme                            |
| l'orologio all'indietro non è guardato                       | il tick negativo                                        |
| il bootstrap costruisce un **secondo** Ledger                | **niente**, prima — un test nuovo, dopo (correzione 11) |
| la registrazione sparisce da `createGame`                    | 8 casi, e `registry-completeness` per primo             |
| il loop parte prima che il caricamento finisca               | 2 casi                                                  |
| il mirror ricalcola invece di prendere l'oggetto emesso      | l'identità del mirror                                   |
| la chiusura chiude prima di aver salvato                     | **1 caso su 2**, prima — il test non provava l'ordine   |
| lo stesso, dopo aver riscritto il test                       | 2 casi (correzione 12)                                  |
| il recupero all'avvio usa una formula sua invece di `stepOf` | il tetto delle cento ore                                |
| la sospensione non cambia stato                              | `Sospeso → Recupero → InGioco`                          |
| R06 torna al selettore largo                                 | il caso della lettura, e il lint su `stores/game.ts`    |
| `savedAt` smette di attraversare il confine                  | il round-trip di D009                                   |

Due righe meritano una nota, e sono le due in grassetto.

La **quarta** è la più importante di tutta la delega: la trappola che D010 e D014 dichiarano
entrambe — _deve essere lo stesso Ledger_ — non aveva una rete, e passare al bootstrap un'istanza
diversa lasciava quaranta test verdi. Un avvertimento scritto in due documenti e verificato da zero
test è un avvertimento che verrà ignorato.

L'**ottava** è la stessa lezione in piccolo: il test diceva "ha salvato" e "si è chiusa", che sono
vere anche facendo le due cose nell'ordine sbagliato. Un test che non guarda l'ordine non protegge
un invariante che parla di ordine.

### Il budget

~120 righe dichiarate. **249** sui tre file che la delega elenca, **379** contando l'ingresso del
renderer (correzione 6), più 45 fuori dal renderer — Clock, Ledger, contratto di salvataggio — e 774
di test.

Le 129 righe in più sui file dichiarati hanno un nome, e sono tutte negli **invarianti della delega
stessa**: la macchina a stati completa (sette stati, sei transizioni), la stretta di mano della
chiusura, il recupero all'avvio e la sospensione. La stima le elencava senza prezzarle.

### Gli ADR

Passano ad **Accettata** due decisioni che aspettavano proprio questa delega:

- **[0001](../adr/0001-simulazione-nel-renderer-core-puro.md)** — la simulazione gira nel renderer e
  `core/` è puro. Fino a ieri era una regola di lint senza un renderer da guardare; adesso il gioco
  gira lì, e i suoi test girano in `node` senza Vue.
- **[0009](../adr/0009-passo-fisso-e-tipi-branded-per-il-tempo.md)** — il passo fisso con
  accumulatore esiste, e con lui i `Milliseconds`. L'indice degli ADR dichiarava "aspetta D011,
  perché i tipi branded ci sono ma il passo fisso con accumulatore è nel loop": il loop c'è.

Il **[0010](../adr/0010-liste-storiche-limitate-alla-definizione.md)** resta _Proposta_: la lista
delle ultime operazioni ha il suo limite dichiarato, ma **non entra nel salvataggio** — è un mirror
che riparte vuoto. Il primo `boundedList` salvato resta il caveau della fetta 02.

## Cosa deve sapere chi prende D012

- **Il guscio esiste già**: `App.vue`, `main.ts` e `index.html`, 81 righe in tutto di cui ~20 di
  CSS. Rende i sette stati del ciclo di vita e il mirror, senza una parola di prosa. Sono **dentro**
  il conto delle ~1.150 righe di D012, non in più: quella delega aggiunge la navigazione, le viste e
  le etichette, non riparte da zero.
- **Lo store espone stato e comandi, non selettori.** `status`, `failure`, `balances`, `history`,
  `savedAt`, più `start`, `newGame`, `close`, `buyUpgrade`, `deposit`, `withdraw`. I **numeri** per
  la UI — `incomePerSecond`, `upgradeCost`, `canBuyUpgrade`, `atmFee`, `previewOf` — non ci sono
  ancora, ed è deliberato: si aggiungono quando esiste il componente che li consuma, e li aggiunge
  D012 chiamando le regole pure (un `.vue` non può importarle, R05).
- **`modifiers` non esce da `createGame`.** Serve a `incomePerSecond`, quindi D012 lo esporrà: è una
  riga in `createGame.ts`, e vale la pena aggiungerla insieme al selettore che la usa.
- **Un codice d'errore nuovo vuole la sua chiave**: `error.game.load_failed` (INV-07), oltre ai
  dodici già contati nel budget rimisurato.
- **Lo stato `failed` ha due cause diverse e una sola schermata**: un caricamento fallito — dove
  "partita nuova" (`newGame()`) è la via d'uscita — e un **salvataggio finale** fallito, dove la
  partita è ancora in memoria e la via d'uscita è riprovare o chiudere lo stesso. La seconda oggi
  non ha un pulsante, ed è la voce più concreta che D012 eredita.
- **jsdom entra con te.** `vitest.config.ts` lo dichiara: quando arrivano i test di componente,
  `runtime/host.ts` — l'unico file senza test — può finalmente averne uno.

## Trappole note

- **A02.** Il primo import fra store nasce sempre come "mi serve solo un valore da lì". Il valore
  si prende da un selettore o da un evento.
- L'accumulatore che scarta il resto è il difetto per cui il gioco perde qualche percento di
  reddito al minuto, in modo invisibile e impossibile da diagnosticare senza un test dedicato.
- Chiudere la finestra senza attendere la conferma del main perde l'ultima partita di gioco. Su
  Windows, `before-quit` va gestito esplicitamente.
