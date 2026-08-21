# Qualità: i gate e la definizione di fatto

Un gate è un comando che, se è rosso, significa **non finito**. Non è un consiglio, non è un
"sistemiamo dopo", e non si aggira.

Questo documento dice quali sono, cosa garantisce ciascuno, e cosa nessuno di essi garantisce.

## I quattro gate veloci, più uno di rilascio

| #   | Comando                | Cosa garantisce                                                                                 | Tempo reale       |
| --- | ---------------------- | ----------------------------------------------------------------------------------------------- | ----------------- |
| G1  | `npm run typecheck`    | le regole imposte dai tipi: R04, R06, R07, R08, R09, R10, R11, R12, INV-13 + codice morto (C01) | ~13 s             |
| G2  | `npm run lint`         | le regole imposte da ESLint: R01, R03, R04, R05, R06, R10, INV-02, INV-03                       | ~9 s              |
| G3  | `npm run format:check` | il codice è formattato (C02)                                                                    | ~7 s              |
| G4  | `npm run test`         | comportamento, round-trip, parità i18n, bersagli, regole strutturali, meta-test del lint        | ~7 s              |
| G5  | `npm run build`        | l'applicazione si compila davvero, main e renderer                                              | decine di secondi |

**Misurati il 2026-08-20 su Windows**, a [D021](delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md):
i quattro gate fanno 13 + 9 + 7 + 7, e la catena intera **35,3 s** — che è meno della somma, e va
bene: `verify` non paga l'avvio di `npm` due volte per lo stesso gate. Sono tempi **di parete**,
quindi comprendono l'avvio di `npm` e di Node: `typecheck` ne paga tre, perché incatena tre
`npm run`.

**Rimisurata alla chiusura di [D030](delega/D030-il-contenuto-scorre-nel-telaio.md)**, il
2026-08-21 e sulla stessa macchina: la catena intera **51,6 s**, con **794 test**. Il salto è
grosso e va letto con prudenza: la misura è stata presa **mentre la finestra di sviluppo
dell'utente girava**, quindi una parte è contesa di macchina e non lavoro nuovo. Va rifatta a
macchina scarica prima di trattare 51,6 s come il numero vero — ma anche così è il primo valore che
si avvicina alla soglia del minuto, e il rimedio è già censito nel
[registro YAGNI](roadmap-fette.md): togliere l'avvio ripetuto di `npm`, non togliere un gate.

Prima, alla chiusura di [D018](delega/D018-la-scheda-di-dominio.md): **33,3 s** con **745 test**. Era 38,4 s con 726 test a
[D024](delega/D024-il-telaio.md) e [D025](delega/D025-il-tooltip.md), 36,4 s con 678 test a
[D017](delega/D017-il-caveau.md), 34,7 s con 564 test a
[D020](delega/D020-nessun-sistema-si-fida-del-salvataggio.md), 34,9 s con 558 a
[D019](delega/D019-il-pagamento.md), e prima ancora 35,3 s.

**La catena è scesa di cinque secondi mentre i test crescevano**, ed è la prova più netta che questa
pagina abbia dato finora della propria tesi: il tempo non lo pagano i test. Da D019 a qui sono
cresciuti di un terzo e la catena si muove dentro la variazione fra due esecuzioni. I quattro gate
misurati uno a uno, lo stesso giorno, dicono dove va il minuto — `typecheck` 13,5 s, `lint` 10,7 s,
`format:check` 9,8 s, `test` 8,3 s — e la somma è più della catena perché `verify` non paga
l'avvio di `npm` due volte.

**`format:check` è l'unico salito, e si sa di quanto e perché:** circa **0,8 s** sono il canvas di
Claude Design, che da D018 sta in `docs/design/mockups/` ed è un file di 315 kB. È un costo
dichiarato invece che scoperto, e la scelta è contestabile — l'alternativa era tenerlo fuori dalla
repo, dove nessun agente lo troverebbe.

Il numero di test sta qui e non in [stato.md](stato.md) per la stessa ragione del tempo: non è
derivabile dal repo senza eseguirli. Fino a D019 lo portava il
[passaggio di consegne](delega/PASSAGGIO-DI-CONSEGNE.md), che lo aveva scaduto di due deleghe;
adesso quella pagina punta qui invece di ricopiarlo. **E questa pagina lo ha scaduto a sua volta:**
D026 non l'ha rimisurata, quindi «726 test» è rimasto scritto per due deleghe. Nessun gate può
vederlo — è il buco dichiarato in cima a [stato.md](stato.md).

**Quanti siano i file, invece, questa pagina non lo dice più.** Fino a D019 diceva «558 test in 61
file», e i file di test [stato.md](stato.md) li **conta**: era un fatto contabile ripetuto in un
documento vivo, cioè la regola C11 violata in silenzio. Nessun gate poteva vederlo —
`tests/rules/docs-facts` cerca un numero accanto ad «ADR», «documenti» o «markdown», e «file» è
fuori da quell'elenco. Trovato rileggendo, a [D020](delega/D020-nessun-sistema-si-fida-del-salvataggio.md),
che quel conteggio lo faceva scadere.

**Questa è l'unica misura del progetto che resta affidata a un occhio, ed è dichiarato.** Un tempo
dipende dalla macchina, quindi non può stare in [stato.md](stato.md) con gli altri fatti contabili
(regola C11): nessun gate può verificarlo, e l'unica difesa è la data qui accanto. Se la data è
vecchia di molte deleghe, il numero è **sospetto per definizione** — è già successo due volte.

Le due cifre che stavano qui — «fra 42 e 45 s» a D016 e «41,4 s» a D013 — erano invecchiate
insieme, e a trovarle è stato l'audit dello STOP 2 (AUD-006). Prima ancora ce n'era una che diceva
26 s davanti a quattro gate che ne sommavano 34, cioè **meno della somma delle proprie parti**: era
già sbagliata quando è stata scritta. Tre volte lo stesso difetto sulla stessa riga è la ragione
per cui adesso porta una data.

Da D012 il **typecheck** copre anche R12: `Dictionary` è un `Record` totale sulle chiavi, quindi
una `Reason` o un codice d'errore senza traduzione non compila, in nessuna delle due lingue.

Due comandi, non uno, ed è deliberato:

    npm run verify          # G1..G4 — il ciclo che si esegue di continuo
    npm run verify:release  # verify + G5

**Perché separati.** Il tempo atteso è parte della specifica: un gate lento viene aggirato. I
quattro veloci stanno **sotto il minuto** — venticinque secondi a D006, trentuno a D007, fra
ventisette e trenta a D008, ventotto e ventinove a D009, trentacinque a D012, fra quarantadue e
quarantacinque a D016 e **quarantuno a D013** — e si eseguono a ogni modifica; la compilazione costa un ordine di
grandezza in più e serve prima di un rilascio, non prima di un salvataggio. Se `verify` supera il
minuto, è un problema da risolvere, non da tollerare, e il rimedio è già censito nel
[registro YAGNI](roadmap-fette.md): togliere l'avvio di `npm` ripetuto, non togliere un gate.

Il margine si è ristretto, e va guardato: sei `npm run` incatenati costano da soli qualche secondo
di avvio, e sono la prima cosa da togliere quando la soglia si avvicina — non un gate.

La crescita da D009 a D012 è quasi tutta di `typecheck` e `lint`, e ha una causa sola: il renderer
è entrato in tutti e due. `vue-tsc` compila anche i `.vue`, e ESLint ha adesso quattro componenti
in più da leggere con un parser diverso. I test, con 170 casi in più, sono cresciuti di mezzo
secondo.

Quella cifra è stata **misurata**, non stimata: a D001 il documento diceva otto secondi con 33
test, e ci è rimasto fino a D006 con 150. Un tempo dichiarato e mai più misurato è la stessa
categoria di bugia di un `TODO`. Da D006 a D007 sono cresciuti tutti e quattro i gate, non solo i
test: è l'andamento normale, e va guardato ogni volta invece che una volta sola. Da D007 a D008
non si sono mossi — la variazione fra due esecuzioni della stessa catena è ormai più grande della
crescita fra due deleghe, ed è per questo che qui c'è un intervallo e non una cifra. Da D008 a
D009 la stessa cosa, con 62 test in più: `lint` è persino sceso, il che dice quanto valga una
misura sola.

`verify:release` è **verde** da D011: `build` compila `out/main/index.js`, `out/preload/index.cjs`
e `out/renderer/`.

**Il peso del renderer, rimisurato a [D017](delega/D017-il-caveau.md).** Il modulo compilato è
**601,78 kB** e il foglio di stile **20,46 kB** — erano 574,99 e 19,20 a
[D023](delega/D023-il-design-system.md), e la differenza è il caveau: un dominio, un pannello con la
sua barra, sei chiavi in due lingue. Accanto ci sono **cinque file di carattere**
in `woff2`, **116 kB** in tutto, che prima non c'erano ([ADR 0029](adr/0029-due-caratteri-e-stanno-nel-bundle.md)).
Solo `woff2` e solo il sottoinsieme `latin`: presi come i pacchetti li offrono sarebbero stati nove
file, perché ognuno dichiara anche un `woff` per i motori che il `woff2` non lo leggono — e qui il
motore è uno solo. La misura sta qui e non in [stato.md](stato.md) per la stessa ragione del tempo:
non è derivabile dal repo senza compilarlo. Da D009 a D010 era rosso e non era una regressione — il renderer non esisteva —
ma da qui in avanti ogni delega deve tenerlo verde.
`tests/rules/gates.test.ts` impedisce che un gate sparisca da una delle due catene (INV-14).

**Il peso, rimisurato a [D018](delega/D018-la-scheda-di-dominio.md), il 2026-08-21.** Il modulo
compilato è **622,87 kB** e il foglio di stile **27,50 kB** — erano 619,60 e 26,64 a
[D024](delega/D024-il-telaio.md) e [D025](delega/D025-il-tooltip.md), e 601,78 e 20,46 a
[D017](delega/D017-il-caveau.md). La differenza fra le ultime due misure è **tutta di
[D026](delega/D026-dove-si-attacca-un-dominio.md)** — due viste nuove, l'allarme del caveau e le
parole che li accompagnano — perché D018 non ha toccato una riga di `src/`. I cinque file di
carattere non si muovono.

**Il peso, rimisurato a [D027](delega/D027-un-grafico-e-una-serie-che-nessuno-tiene.md), il
2026-08-21 — e questa volta la differenza non è un arrotondamento.** Il modulo compilato è
**2.437,92 kB** e il foglio di stile **28,83 kB**, contro 622,87 e 27,50 a
[D018](delega/D018-la-scheda-di-dominio.md). Il modulo è **quasi quadruplicato**, e la causa è una
sola: `apexcharts` ([ADR 0034](adr/0034-il-grafico-e-una-libreria.md)). Circa 1.815 kB per un
grafico a barre.

Va scritto qui perché è il numero che rende contestabile quella decisione invece che opinabile.
Tre cose che chi lo rilegge deve sapere:

- **Non si tratta di configurare meglio il bundler.** ApexCharts non ha una build modulare: si
  importa intera o non si importa, e il grafico usa un tipo su una ventina.
- **È un'applicazione desktop**, quindi il peso non si paga in rete a ogni apertura come su un sito:
  si paga una volta nell'installatore e poi in memoria. È la ragione per cui il numero è accettabile
  e non un difetto.
- **Il grilletto per rimetterla in discussione è scritto**: la prima misura in cui l'avvio della
  finestra si fa sentire, oppure il giorno in cui i candlestick del blocco C **non** arrivano — se
  quella metà della giustificazione non si spende, resta una libreria intera per un grafico a barre.

I cinque file di carattere non si muovono.

**Il motore, misurato invece che supposto.** L'[ADR 0032](adr/0032-le-sovrapposizioni-stanno-nel-livello-superiore.md)
poggia su due funzionalità del motore — il livello superiore e l'ancoraggio CSS — e la sua premessa è
che il motore sia uno solo e recente. Chiesto a lui invece che al changelog:

| Cosa                        | Valore, il 2026-08-21 |
| --------------------------- | --------------------- |
| `process.versions.electron` | 43.4.1                |
| `process.versions.chrome`   | 150.0.7871.224        |

Il livello superiore è disponibile da Chromium 114, l'ancoraggio da 125, `position-area` da 129 e
`justify-self: anchor-center` da 130: il margine è largo, e il giorno in cui non lo fosse
`verify:release` non se ne accorgerebbe — a dirlo sarebbe la spunta a occhio della definizione di
fatto, che è il motivo per cui esiste.

## Cosa copre ciascun livello di test

| Livello                | Dove             | Cosa dimostra                                                                                                                                                                                                                                                       | Cosa **non** dimostra                                           |
| ---------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Kernel**             | `tests/kernel/`  | Clock, Rng, Bus, Registry, Ledger si comportano come dichiarato, isolatamente                                                                                                                                                                                       | che i sistemi li usino bene                                     |
| **Dominio**            | `tests/domains/` | le regole pure producono i numeri attesi, con seed fisso                                                                                                                                                                                                            | che la UI mostri quei numeri                                    |
| **Round-trip**         | `tests/save/`    | stato → salva → ricarica → identico. Attraversa payload, busta, validazione                                                                                                                                                                                         | che una migrazione futura funzioni                              |
| **Bilanciamento**      | `tests/balance/` | i numeri stanno negli intervalli dichiarati in `targets.ts`                                                                                                                                                                                                         | che il gioco sia divertente                                     |
| **i18n**               | `tests/i18n/`    | nessuna chiave manca in nessuna lingua, i segnaposto coincidono, ogni chiave si risolve                                                                                                                                                                             | che le traduzioni siano corrette                                |
| **Regole strutturali** | `tests/rules/`   | Registry completo, nessuna logica nei `.vue`, identità del prodotto coerente, nessun `TODO`, nessun barrel, nessuna parola vietata nei nomi, nessun sistema che si fida del proprio salvataggio, il kit UI che non conosce il gioco e nessun colore fuori dai token | ciò che è dichiarato ⚠️ in [tracciabilita.md](tracciabilita.md) |

**Non esistono test end-to-end sulla UI in questa fetta.** Quanti siano i `.vue` questa pagina non
lo dice più, e li conta [stato.md](stato.md): la riga che stava qui ne diceva due, poi dieci, e
tutte e due le volte era una misura ferma a una delega prima — la seconda ha attraversato
[D023](delega/D023-il-design-system.md), che di componenti ne ha aggiunti sei in un colpo solo.
È la regola C11 applicata a un conteggio che nessun gate guarda: `tests/rules/docs-facts` cerca un
numero accanto ad «ADR», «documenti» o «markdown», e «`.vue`» è fuori da quell'elenco.

Il numero è cambiato due volte, la decisione no, e vale la pena dire perché. Non è la quantità di
componenti a rendere utile uno strumento E2E: è lo **stato proprio** che hanno. Qui leggono un
selettore e inviano un comando, e le sole parti davvero sbagliabili — la matematica della
rotazione della carta e la scelta di quali movimenti mostrare — sono uscite in
`components/rotation.ts` e `components/postings.ts`, pure e provate senza montare niente. Il caveau
non ha fatto eccezione: la percentuale della barra della capienza è nata **nello store**, non nel
template, perché un `.vue` non calcola (R05). Il
grilletto resta quello del [registro YAGNI](roadmap-fette.md): il primo comportamento di un
componente che **non** si riesce a estrarre in una funzione pura. Allora sarà un ADR.

## Il test round-trip, e perché è il più importante

    costruisci uno stato non banale
      → registry.saveAll()
      → il main avvolge, valida, scrive
      → rileggi, valida, migra
      → registry.loadAll()
      → confronta con lo stato di partenza

Metà dei difetti di persistenza del progetto precedente sarebbero morti qui. La condizione perché
funzioni davvero è una sola: lo stato costruito deve essere **non banale**. Un round-trip su uno
stato vuoto passa sempre e non dimostra niente.

Lo stato di prova deve contenere, come minimo: un saldo con decimali, un sistema con stato, lo
stato dell'Rng con almeno uno stream avanzato, e una lista limitata con almeno un elemento.

Da D009 il giro esiste, in `tests/save/kernel-roundtrip`, e c'è un caso che verifica che lo stato
di partenza sia davvero non banale — cinque conti su sei mossi, due stream avanzati di quantità
diverse, un sistema con stato.

Da [D013](delega/D013-verifica-della-fetta.md) i round-trip sono **tre**, e rispondono a tre
domande che non si coprono a vicenda: `roundtrip` prova il confine del main con payload scritti a
mano, `kernel-roundtrip` prova che lo schema accetti ciò che il kernel produce — con un sistema
finto, perché a D009 nessun dominio esisteva — e `game-roundtrip` prova **la partita**: un
`createGame()` che gioca davvero, il disco vero, e un secondo `createGame()` che rilegge. L'ultimo
è l'unico che vede la differenza fra «i byte sono tornati» e «il gioco è tornato»: lo stato salvato
è dato, e il gioco è quel dato **più** ciò che il `load` ricostruisce — qui il moltiplicatore
dell'upgrade, che nel salvataggio non c'è. **La lista limitata manca**, e non per dimenticanza: nel payload
della versione 1 non c'è nessun array, e la voce ha un grilletto nel
[registro YAGNI](roadmap-fette.md). Questa riga diceva «entra con il caveau della fetta 02», e il
caveau è arrivato senza portarla: [D017](delega/D017-il-caveau.md) gli dà una **capienza**, non un
inventario, e senza oggetti da conservare non c'è nessun array. Il grilletto è il primo dominio che
possiede **cose** — black market o aste di box.

Quello che il caveau ha portato è un'altra cosa, e vale la pena saperlo qui: `game-roundtrip` gioca
adesso una partita che **amplia il caveau**, quindi il primo stato di dominio salvato che non sia un
booleano attraversa il disco. È anche il primo che un salvataggio manomesso possa sbagliare in
silenzio — un livello frazionario non fa rumore, produce una capienza sbagliata — ed è la ragione
per cui il suo `load` guarda più del `typeof`.

## Definizione di fatto

Vale per ogni delega. Tutte le voci, non alcune.

- [ ] `npm run verify` verde, con l'output mostrato — non riassunto
- [ ] i test nuovi falliscono se si rompe di proposito il codice che coprono
- [ ] nessun `TODO`, nessun `any`, nessun `eslint-disable` senza motivazione accanto
- [ ] la documentazione toccata dal cambiamento è aggiornata **nello stesso commit**
- [ ] se una decisione strutturale è cambiata, l'ADR è aggiornato o ne esiste uno nuovo
- [ ] la delega è marcata `Chiusa` con il riferimento al commit

## Definizione di fatto dello STOP 2

Oltre a tutto quanto sopra:

- [ ] output reale, incollato, di `typecheck`, `lint` e `test` — non una dichiarazione
- [ ] la fetta gira: si guadagna, si compra, si salva, si chiude, si riapre, si ritrova tutto
- [ ] il reset azzera davvero, verificato da un test e a mano
- [ ] `docs/tracciabilita.md` non ha righe con un meccanismo che non esiste
- [ ] gli ADR che il codice ora impone passano da `Proposta` ad `Accettata`

## Cosa nessun gate garantisce

Detto qui perché un elenco di gate produce l'illusione opposta:

- **Che il gioco sia bilanciato.** `targets.ts` verifica intervalli che abbiamo scelto noi. Se
  l'intervallo è sbagliato, il test è verde e il gioco è noioso.
- **Che la UI sia usabile.** Nessun test lo misura, e
  [D013](delega/D013-verifica-della-fetta.md) ha riscosso questa riga con un caso preciso: le
  ultime operazioni mostrano davvero i tre movimenti di un deposito — INV-11 è verde, e a ragione —
  ma il reddito emette una transazione ogni tick, dieci al secondo, quindi quei tre movimenti
  restano visibili meno di mezzo secondo. Ogni test che li riguarda passa. A vederlo è servito
  guardare lo schermo mentre il tempo passava, che è la cosa che nessun gate fa.
- **Che le traduzioni siano giuste.** Il test verifica che ci siano, non che vogliano dire qualcosa.
- **Che l'architettura regga alla decima fetta.** Lo dimostra solo la decima fetta. È il motivo per
  cui la prima è una sola (ADR 0014).
