# D016 — Le correzioni dell'audit

- **Stato:** Chiusa — commit `c648639`, ramo `d016-correzioni-audit`. Scritta ed eseguita il 2026-08-20
- **Dipende da:** D015 (cioè tutto il codice della fetta 01)
- **Sblocca:** [D013](D013-verifica-della-fetta.md), che è lo STOP 2
- **ADR vincolanti:** 0001, 0004, 0008, 0011, 0014, 0017, 0018
- **Regole:** nessuna regola nuova di prodotto. Due **meccanismi** nuovi per due regole che
  esistevano già solo come prosa (C09, C10), e un invariante nuovo (INV-17)
- **Budget:** ~130 righe di codice + ~190 di test → **misurato: 186 di codice e 326 di test**,
  più 253 righe di documenti. Lo sforamento è tutto nei test e ha una causa sola, dichiarata in
  fondo: i due test di regola nuovi portano ciascuno il proprio blocco «il rilevatore», che è la
  convenzione del progetto e vale circa metà del file

## Obiettivo

Chiudere i diciassette difetti trovati dall'audit del 2026-08-20, correggendoli alla radice.

## Perché esiste, e perché prima di D013

L'audit ha trovato un difetto **critico**: chiudere la finestra dalla schermata d'errore, o
mentre il gioco sta ancora caricando, scrive una partita vuota sopra il salvataggio del
giocatore. È perdita di dati, ed è il contrario di ciò che quella stessa schermata gli promette.

[D013](D013-verifica-della-fetta.md) è lo STOP 2: riporta che la fetta regge. Riportarlo con un
difetto di perdita dati aperto sarebbe riportare un verdetto falso — e il **passo 5 del percorso
manuale di D013 è «chiudo la finestra»**, cioè passa esattamente sopra il difetto senza vederlo,
perché lì il salvataggio è valido.

**Decisione contestabile:** questa delega si esegue **prima** di D013. L'alternativa — infilare le
correzioni dentro D013 — è stata scartata perché D013 dichiara «nessun codice nuovo» ed è una
delega di verifica: una delega che verifica e insieme corregge non può più dire quale delle due
cose ha fatto.

## Le due radici

I diciassette finding non sono diciassette problemi. Sono due.

**R-A — `close()` non ha una precondizione di stato.** [ciclo-di-vita.md](../design/ciclo-di-vita.md)
dichiara **un solo** arco entrante in `Chiusura`. Il codice aggancia `onClosing` a `close()` senza
guardare lo stato, quindi ne apre altri tre in silenzio. Da qui il difetto critico.

**R-B — niente lega un documento vivo a ciò che descrive, quando la cosa descritta è un
_conteggio_ o un _file_.** `tests/rules/doc-links` verifica che i collegamenti risolvano, non che
i numeri siano veri. Da qui otto finding: un file inesistente descritto da due documenti, due
regole senza meccanismo, e sette affermazioni numeriche stantie.

Il rimedio a R-B non è correggere i numeri — quello è il sintomo. È che le due regole scritte solo
in prosa **prendano un meccanismo**, e che i numeri che restano in prosa siano quelli che nessuna
macchina può contare.

## Da produrre

### Codice

| File                                        | Cosa cambia                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/renderer/stores/game.ts`               | `close()` scrive solo da uno stato autoritativo (INV-17); `newGame()` passa da `loading` |
| `src/renderer/runtime/host.ts`              | `setLanguage`: la lingua del documento, che vive fuori da Vue                            |
| `src/renderer/main.ts`                      | dichiara la lingua all'avvio                                                             |
| `src/main/index.ts`                         | `setAppUserModelId` con l'`appId` di ADR 0008                                            |
| `src/renderer/components/OperationList.vue` | **nuovo**: l'elenco delle operazioni, oggi copiato in due viste                          |
| `src/renderer/views/HomeView.vue`           | usa `OperationList`                                                                      |
| `src/renderer/views/StatsView.vue`          | usa `OperationList`                                                                      |
| `src/renderer/App.vue`                      | `.refusal` fra le primitive condivise; `Recupero` è un velo, non una schermata           |
| `src/renderer/components/AtmPanel.vue`      | usa `.refusal` condivisa                                                                 |
| `src/renderer/components/IncomePanel.vue`   | usa `.refusal` condivisa                                                                 |
| `src/renderer/i18n/index.ts`                | `duration` sotto il minuto e alle ore tonde; `POOL_KEYS` non è più esportata             |
| `src/renderer/i18n/it.ts`, `en.ts`          | la chiave nuova, e il titolo del registro che diceva «Ultime»                            |
| `src/core/kernel/Registry.ts`               | `systems()` ritorna una copia, come fa il Ledger con i movimenti                         |

### Test

| File                                   | Cosa dimostra                                                                |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `tests/renderer/store.test.ts`         | INV-17: chiudere da `Errore(caricamento)` e da `Caricamento` **non** scrive  |
| `tests/rules/no-barrel.test.ts`        | **nuovo**: C10 — nessun file di solo ri-export in `src/`                     |
| `tests/rules/forbidden-words.test.ts`  | **nuovo**: C09 — le parole vietate del glossario nei nomi di file e cartelle |
| `tests/rules/product-identity.test.ts` | l'`appId` del main è quello di `electron-builder.yml`, e arriva a runtime    |
| `tests/i18n/translator.test.ts`        | la durata sotto il minuto e quella alle ore tonde                            |

### Documenti

| File                                   | Cosa cambia                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `docs/design/ciclo-di-vita.md`         | gli archi di chiusura che il codice apre davvero, e la regola che li governa |
| `docs/design/flusso-salvataggio.md`    | `loadAll` non è atomico, e chi fornisce l'atomicità al posto suo             |
| `docs/tracciabilita.md`                | C09, C10, INV-17; la riga dei file senza test corretta                       |
| `docs/architettura.md`                 | l'albero non promette più un barrel che non esiste; il conteggio degli ADR   |
| `docs/convenzioni.md`                  | nessun barrel, mai — con il meccanismo accanto                               |
| `docs/glossario.md`                    | le parole vietate rimandano al meccanismo                                    |
| `docs/qualita.md`, `docs/rischi.md`    | «due componenti» rimisurato, e la conclusione che ne discendeva riesaminata  |
| `docs/prodotto/preferenze.md`          | P5: l'inerzia non è stata costruita, e perché                                |
| `docs/roadmap-fette.md`                | il grilletto di `Step.dropped` e quello dell'inerzia                         |
| `docs/delega/PASSAGGIO-DI-CONSEGNE.md` | i conteggi rimisurati, e lo stato dopo questa delega                         |
| `docs/delega/README.md`                | l'indice e il grafo                                                          |

## Invarianti

- **INV-17 — il salvataggio si scrive solo da uno stato in cui il modello in memoria è quello
  vero.** `playing`, `suspended`, `recovering`, e `failed` quando a fallire è stato un
  **salvataggio** (lì la partita è in memoria e non è mai arrivata sul disco). Da `startup`,
  `loading` e `failed` per un **caricamento** la finestra si chiude senza scrivere: il modello non
  è mai stato caricato, quindi non rappresenta nessuna partita.
- **C09 — nessun nome di file o di cartella contiene una parola vietata dal glossario.**
- **C10 — nessun file di `src/` è un barrel**, cioè un file il cui unico contenuto sono ri-export.
- Tutto ciò che era vero prima resta vero: i 477 test esistenti restano verdi.

## Fuori scope

- **L'inerzia della carta** (P5). È codice nuovo dentro una delega di correzione, e ADR 0014 non
  lo ammette. Qui si corregge il **documento**, che promette una cosa che non c'è, e il grilletto
  va nel registro YAGNI.
- **Rendere `Registry.loadAll` atomico.** Oggi c'è un solo sistema con stato e lo store va comunque
  in `Errore`: costruire due fasi adesso è l'astrazione speculativa che ADR 0014 vieta. Qui si
  **dichiara** il limite, e il rimedio resta agganciato alla voce YAGNI che già esiste.
- **`Step.dropped` mostrato a schermo.** È la fetta 03. Qui prende solo il suo grilletto.
- **Un test per `main.ts` e per `main/index.ts`.** Sono il guscio esterno che tocca la
  piattaforma, come `host.ts`: la scelta di non provarli è la stessa e resta. Qui si corregge la
  riga che diceva che il file senza test era uno solo.
- **La promozione degli ADR `Proposta` e il `README.md` alla radice.** Sono di D013.
- **Test di componente / jsdom.** Il grilletto è nel registro YAGNI e non è scattato.

## Definizione di fatto

- [ ] `npm run verify` verde, con l'**output incollato** — non riassunto
- [ ] `npm run verify:release` verde
- [ ] i due casi nuovi di INV-17 falliscono se si toglie la guardia da `close()`
- [ ] `tests/rules/no-barrel` diventa rosso se si crea un file di solo ri-export
- [ ] `tests/rules/forbidden-words` diventa rosso se si crea `src/core/utils.ts`
- [ ] nessuna riga di `tracciabilita.md` punta a un meccanismo che non esiste
- [ ] nessun documento vivo contiene un conteggio smentito dal repo
- [ ] la delega è marcata `Chiusa` con il riferimento al commit

## Trappole note

- **Correggere il sintomo invece della radice.** Il difetto critico si può «chiudere» anche
  mettendo una guardia dentro `onClosing`. Sarebbe la stessa omissione spostata di un file: la
  precondizione appartiene a `close()`, che è l'unico posto che sa cosa sta per scrivere.
- **Meccanizzare troppo.** Le parole vietate dentro un **identificatore** non sono meccanizzabili
  senza falsi positivi: `handler` è il nome standard di una callback e compare in `Bus.ts` e in
  `host.ts` a ragione. Il meccanismo copre i nomi di file e cartelle, e il resto si dichiara ⚠️
  invece di essere finto ✅.
- **Correggere i numeri e non le conclusioni.** «Con due componenti il CSS morto non è un
  problema» non si corregge scrivendo «con nove». Quel numero regge una **decisione**, e la
  decisione va riguardata.

## Come è andata

`npm run verify` **verde**, output reale:

    Test Files  54 passed (54)
         Tests  497 passed (497)

`npm run verify:release` **verde**: `out/main/index.js` 12,23 kB, `out/preload/index.cjs` 1,00 kB,
`out/renderer/` 91 moduli e 564,89 kB.

I gate, rimisurati su questa macchina: `typecheck` 15,8 s · `lint` 9,7 s · `format:check` 6,3 s ·
`test` 7,1 s. `verify` intero fra 42 e 45 s su due esecuzioni — [qualita.md](../qualita.md) diceva
26 s davanti a quattro gate che ne sommavano 34, cioè meno della somma delle proprie parti. Adesso
le due misure stanno una accanto all'altra.

### Le reti nuove, viste rosse

Un test che non è mai stato visto fallire è una decorazione. Tutte e sei sono state rotte di
proposito, una alla volta, e ripristinate.

| Rete                                      | Rottura indotta                                                    | Rosso ottenuto                                               |
| ----------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| INV-17, chiusura da `Errore(caricamento)` | tolta la guardia `if (!isAuthoritative())` da `close()`            | `expected [ { …(3) } ] to have a length of +0 but got 1`     |
| INV-17, chiusura durante `Caricamento`    | la stessa                                                          | idem                                                         |
| C10, nessun barrel                        | creato `src/core/kernel/index.ts` con un solo `export … from`      | `expected [ 'src/core/kernel/index.ts' ] to deeply equal []` |
| C09, parole vietate                       | creato `src/core/utils.ts`                                         | `expected [ 'utils.ts: utils' ] to deeply equal []`          |
| C03, l'`appId` del main                   | messo `com.electron.app`, il metadato del template del difetto A15 | `expected 'com.electron.app' to be 'com.solvent.game'`       |
| La durata sotto il minuto                 | tolto il ramo `totalMinutes === 0` da `duration()`                 | `expected '0 minuti' to be 'meno di un minuto'`              |

L'ultimo rosso è anche la prova del difetto che chiude: `0 minuti` è la frase che la schermata di
recupero diceva davvero a ogni alt-tab.

### Il velo, guardato a schermo

L'unica correzione che nessun test può vedere è la forma del guscio. È stata verificata
riproducendo il CSS esatto di `App.vue` in una pagina statica e **misurandola**: il velo è
`1180 × 760` a `(0, 0)` su una finestra `1180 × 760`, il messaggio è centrato a `y = 371,7`, e il
tavolo da gioco resta visibile sotto — che è tutto il punto. La verifica **integrata**, dentro
l'applicazione vera, resta il percorso manuale di [D013](D013-verifica-della-fetta.md).

## Correzioni rispetto a com'era scritta

1. **`retry()` ha perso una riga invece di guadagnarne una.** Portava lo stato a `playing` prima di
   chiamare `close()`, e il commento diceva perché: «da `failed` non saprebbe cosa fare». Con
   INV-17 `close()` **sa** cosa fare da `failed`, quindi quella riga era diventata una cerimonia
   che diceva il contrario della regola nuova. Un fix di radice che toglie codice invece di
   aggiungerlo è il segnale che la radice era quella giusta.

2. **`newGame()` è passata da `Errore` a `Caricamento`, e il diagramma si è accorciato.** La
   correzione sembrava dover **aggiungere** un arco; invece ne toglie uno: il percorso
   `Errore → Caricamento → InGioco` esisteva già per intero, e `Caricamento → InGioco: nessun
salvataggio` descrive esattamente una partita nuova. L'arco `Errore → InGioco` era una
   scorciatoia disegnata.

3. **La lingua del documento è finita in `Host`, non in `main.ts`.** Sembrava una riga da bootstrap
   — `document.documentElement.lang = DEFAULT_LOCALE` — e `document` sta in **un** file solo
   (ADR 0001). Scriverla in `main.ts` avrebbe aperto il secondo, che è esattamente il modo in cui
   quel confine finisce. Il costo è una funzione in più su `Host`, che non ha test: dichiarato al
   punto 6 di [tracciabilita.md](../tracciabilita.md).

4. **C09 non copre `tests/`, e non è una scorciatoia.** Meccanizzare le parole vietate ovunque
   avrebbe reso rossa `tests/helpers/`, che è la prima cosa che il test avrebbe trovato. La
   risposta pigra era rinominare la cartella; quella giusta è che il divieto esiste perché quelle
   parole nascondono una responsabilità mancante **nel codice di prodotto**, e `helpers` descrive
   esattamente ciò che quella cartella fa. Il [glossario](../glossario.md#parole-vietate) adesso lo
   dice, così la regola e il meccanismo non si contraddicono.

5. **Il divieto di barrel guarda il contenuto, non il nome.** Vietare `index.ts` sarebbe stato più
   corto e avrebbe preso `main/index.ts`, `preload/index.ts` e `i18n/index.ts` — tre punti
   d'ingresso legittimi — lasciando passare un `kernel/all.ts`. La regola è «un file che si limita
   a ri-esportare», e il rilevatore toglie i ri-export e guarda cosa resta.

6. **`duration()` aveva due zeri, non uno.** L'audit ne aveva visto uno — «0 minuti» sotto il
   minuto. Scrivendo il ramo è emerso il gemello: alle ore tonde la frase era «3 ore e 0 minuti».
   Stessa funzione, stessa causa, corretti insieme.

7. **Il budget dei test è sforato di 136 righe**, ed è dichiarato invece di essere nascosto. La
   causa è la convenzione del progetto: ogni test di regola porta il proprio blocco «il
   rilevatore», che prova l'euristica prima di applicarla al repo. Nei due file nuovi vale
   rispettivamente 33 e 45 righe su 88 e 123. Non è lo scopo che è cresciuto: è che il budget era
   stato stimato sul solo controllo, non sulla forma completa che il repo usa da D001.

## Trappole per chi legge dopo

- **INV-17 non è «non salvare quando c'è un errore».** È «non salvare quando il modello in memoria
  non è una partita». La differenza si vede su `failed` per un **salvataggio** fallito, che è uno
  stato d'errore in cui si salva eccome — perché lì la partita c'è ed è l'unica copia.
- **Il velo non cambia la macchina a stati.** `Sospeso → Recupero → InGioco` resta il percorso
  unico. A cambiare è solo come il guscio veste `Recupero`: prima al posto della schermata, adesso
  sopra.
