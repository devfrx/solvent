# Passaggio di consegne

Per chi prende in mano Solvent adesso — persona o agente. Si legge in dieci minuti e basta a
ripartire senza fare domande.

## Cos'è Solvent

Idle/tycoon finanziario per desktop. Electron + Vue 3 + TypeScript + Pinia + Vitest.

È la ricostruzione da zero di un progetto precedente (`finanx`, ~104.000 righe) di cui esiste un
audit con **17 difetti misurati**. Quel repo si usa **solo come catalogo di idee di gioco**: mai
copiarne codice, struttura di cartelle o pattern — sono esattamente ciò che ha fallito.

Il gioco ruota attorno a una tensione sola: **contanti contro carta**. Anonimi ma limitati contro
tracciabili ma illimitati. Ogni dominio — black market, prestiti, casinò, immobiliare — è un modo
diverso di viverla. Senza quella tensione, diciassette domini sono diciassette pulsanti che alzano lo
stesso numero.

Non c'è un'attività principale e non c'è una progressione: è una **sandbox**. Nessun dominio si
sblocca — ognuno dichiara un requisito, e il giocatore lo soddisfa quando ci riesce, nell'ordine
che si costruisce da sé. A impedire che uno strumento diventi la risposta a ogni domanda non è una
fase del gioco: è che ognuno **satura**, e che ognuno paga in almeno una fra liquidità,
tracciabilità, varianza e attenzione.

La struttura che regge tutto questo — l'etichetta a nove voci, la legge della non dominanza, le
quattro forme di saturazione — e la profondità di ogni dominio stanno in
[prodotto/visione.md](../prodotto/visione.md), riscritta il 2026-08-20. **Se hai in mente le quattro
ere, quel documento è cambiato sotto di te:** le ere non esistono più come struttura di gioco, e
sopravvivono solo come lettura interna in [roadmap-fette.md](../roadmap-fette.md).

## Dove siamo, esattamente

|                          |                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| STOP 1                   | **approvato** — nome, stile visivo, le tre dipendenze di runtime, la simulazione nel renderer                                          |
| STOP 2                   | **riportato** da [D013](D013-verifica-della-fetta.md): la fetta 01 è conclusa e verificata, otto passi manuali su otto                 |
| Deleghe                  | quali sono chiuse e quali aperte lo dice [stato.md](../stato.md); **l'ordine in cui si eseguono** è il grafo in [README.md](README.md) |
| Kernel                   | **finito** (D003–D008) — le righe le conta [stato.md](../stato.md), con il metodo scritto nel codice che le conta                      |
| Persistenza nel main     | **finita** — lo schema eseguito, la scrittura atomica, i tre canali IPC                                                                |
| Domini                   | tre: `income` ha stato e ticchetta, `vault` ha stato e **non** ticchetta, `atm` è due comandi. Da D026 ognuno ha la sua pagina         |
| Le regole                | la mappa completa, con la forza di ciascuna, è [tracciabilita.md](../tracciabilita.md)                                                 |
| `npm run verify`         | **verde**; i tempi, con la data accanto, stanno in [qualita.md](../qualita.md)                                                         |
| `npm run verify:release` | **verde** — il renderer compila; il peso, con la data accanto, sta in [qualita.md](../qualita.md) e non si ripete qui                  |
| `main`                   | **allineato**: `d026-dove-si-attacca-un-dominio` è stato fuso in un `--ff-only`. Il ramo nuovo parte da `main`                         |
| Albero di lavoro         | **pulito**                                                                                                                             |
| Prossimo passo           | [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md) — **non preparata**: porta due decisioni da prendere con l'utente             |

**Perché questa tabella non porta più i numeri.** Li portava, ed erano sbagliati: da
[D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) i fatti contabili stanno in un posto solo
e generato, [stato.md](../stato.md), e nessun documento vivo li ripete (regola C11). È la stessa
mossa del Registry contro le cinque liste: non si controlla che due cose coincidano, si fa in modo
che ce ne sia una sola.

I contratti sono in `src/core/contracts/`, Clock, Rng, Bus, Registry e Ledger in
`src/core/kernel/`, i numeri di gioco in `src/core/balance/`, lo schema del salvataggio e i tre
canali IPC in `src/main/save/`, i tre domini in `src/core/domains/`. In `src/renderer/` ci sono il
bootstrap, il loop, l'unico store, il guscio `App.vue`, le **quattro** viste sotto `views/` — una
per destinazione — e i componenti di gioco sotto `components/`, che da
[D026](D026-dove-si-attacca-un-dominio.md) **non è più piatta**: cinque cartelle, una per
proprietario, e zero file sciolti. Il kit che non sa che gioco è sta sotto `ui/`, e le parole del
gioco sotto `i18n/`. Da [D024](D024-il-telaio.md) il guscio non disegna più le
linguette: monta il **telaio** del kit e gli passa dentro la colonna e la testata. Ogni delega chiusa ha in fondo le
**correzioni** rispetto a com'era scritta: [D002](D002-contratti.md) ne ha sette,
[D003](D003-kernel-clock.md) cinque, [D004](D004-kernel-rng.md) sei,
[D005](D005-kernel-bus.md) cinque, [D006](D006-kernel-registry.md) sei,
[D007](D007-kernel-ledger.md) nove, [D008](D008-balance.md) otto,
[D009](D009-persistenza-main.md) dieci, [D010](D010-dominio-income.md) dieci,
[D014](D014-dominio-bancomat.md) undici, [D011](D011-runtime-e-store.md) quattordici,
[D012](D012-ui-e-i18n.md) e [D015](D015-home-bancomat.md) diciassette,
[D016](D016-correzioni-audit.md) sette,
[D019](D019-il-pagamento.md) tredici, [D020](D020-nessun-sistema-si-fida-del-salvataggio.md) nove,
[D023](D023-il-design-system.md) undici, [D017](D017-il-caveau.md) sedici,
[D024](D024-il-telaio.md) e [D025](D025-il-tooltip.md) quattro ciascuna,
[D026](D026-dove-si-attacca-un-dominio.md) dodici. Leggile prima di fidarti del
testo di una delega ancora aperta — alcune di quelle correzioni riguardano proprio deleghe che non
sono ancora state eseguite.

### Cosa vale per qualunque delega, e nessuna lo ripete

Le regole che non stanno nel testo di nessuna delega perché valgono per tutte. Sono qui perché una
delega chiusa è un documento storico: nessuno la rilegge.

Il numero non si scrive, ed è la lezione di [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md)
applicata a un punto cieco: qui diceva «quattro» e poco più sotto «sei», mentre le righe erano
**dodici**. `tests/rules/docs-facts` non poteva vederlo — «regole» è fuori dal suo elenco di cose
contate apposta, perché includerla produceva falsi positivi — quindi l'unica difesa è non scrivere
un numero che nessuno conta.

- **R05 vieta anche i tipi.** Un `.vue` non può scrivere
  `import type { IncomeError } from '@core/domains/income/commands'`: il lint usa la regola base,
  che non distingue un import di tipo. Le unioni che servono alla UI vivono in
  `renderer/i18n/index.ts`.
- **Il codice si scrive in inglese.** Identificatori in inglese; prosa — commenti, messaggi degli
  errori lanciati, descrizioni dei test — in italiano. È la regola C08 di
  [convenzioni.md](../convenzioni.md), imposta da `tests/rules/english-identifiers`, che è
  ⚠️ parziale e lo dichiara.
- **Un importo di gioco non può nascere dentro un dominio.** `no-magic-numbers` guarda i **numeri**,
  ma `Money` si costruisce da una **stringa**: a fermarlo è `tests/rules/domains-no-money-literals`
  (D014, correzione 2).
- **Un `eslint-disable` senza motivazione è un test rosso**, non un appunto di review (C06).
- **Il salvataggio si scrive solo da uno stato che ha una partita vera** (INV-17). `close()` ha una
  precondizione: da `Avvio`, da `Caricamento` e da `Errore` per un caricamento fallito la finestra
  si chiude **senza scrivere**, perché quello che c'è in memoria non è la partita di nessuno.
- **Nessun barrel** (C10) e **nessuna parola vietata nei nomi** (C09): due regole che stavano solo
  in prosa e adesso hanno un test — `tests/rules/no-barrel` e `tests/rules/forbidden-words`.
- **Se apri o chiudi una delega, o aggiungi un ADR, `docs/stato.md` va rigenerato** — altrimenti il
  gate è rosso, ed è voluto (C11). Il comando è `npx vitest run tests/rules/project-state -u`. Quel
  file **non si scrive a mano**: lo produce `tests/helpers/projectState.ts` leggendo il repo.
- **Non scrivere in un documento vivo un numero che `stato.md` conta.** Quanti ADR ci sono, quali
  sono `Proposta`, quante deleghe sono aperte, quanti documenti: se ti serve dirlo, **linka**
  invece di ricopiare (C11). Vale per i documenti vivi, non per ADR e deleghe, che raccontano il
  momento in cui sono stati scritti.
- **Se sposti un confine fra livelli, il diagramma di [architettura.md](../architettura.md) cambia
  nello stesso commit** — e adesso non è più disciplina: `tests/rules/import-graph` confronta il
  disegno con il grafo di import vero **nei due versi**, e pretende che ogni file di `src/`
  appartenga a un nodo (C13). Una cartella nuova va aggiunta anche alla mappa dentro quel test.
- **Un file `rules.ts` è puro, e c'è un test** (R13): niente `ctx`, niente `Date.now`, niente
  `emit`, niente import di valore da `Bus`, `Ledger` o `Registry`. Gli import di **soli tipi**
  passano.
- **`no-magic-numbers` copre adesso anche `src/renderer/**/*.ts`** (R04). Un numero di gioco nella
  UI va in `balance/`; un numero di presentazione prende un nome.
- **L'interfaccia di un dominio vive in `components/<dominio>/`, e da nessun'altra parte** (R18,
  [ADR 0033](../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)). Un dominio nuovo è una
  cartella lì **più** una riga in `DOMAIN_SCREENS`, che può dire `null` — e `tests/rules/domain-ui`
  è rosso finché non le hai scritte tutte e due. Le cartelle di `components/` che non sono domini
  sono una lista chiusa di due, `shell/` e `ledger/`: allungarla è una riga in quel test.
- **Nessuna riga che comincia con `|` fuori da una tabella** (C12). Sembra pedante finché non
  spezzi una tabella in due con un paragrafo e la voce diventa invisibile: è successo.

**Le deleghe aperte sono quelle che [stato.md](../stato.md) elenca**, e l'ordine in cui si
eseguono è il grafo in [README.md](README.md). [D013](D013-verifica-della-fetta.md) è chiusa e la
fetta 01 è conclusa: il progetto è allo **STOP 2**, e la fetta 02 è già scritta — vedi _Il prossimo
passo_ in fondo.

Il rapporto dello STOP 2 sta in fondo a quella delega, insieme a undici correzioni. Le quattro cose
che chi arriva adesso deve sapere, e che nessun'altra pagina dice:

1. **Il kernel non è sotto budget: è sopra di circa il 9%**, e va saputo perché la prima risposta
   di D013 diceva il contrario. Il budget di ~500 righe misurava le **sei** deleghe D003–D008, cioè
   `kernel/` **più** `balance/`: la sola cartella `kernel/` è un altro insieme, e confrontarla con
   ~500 è l'errore che è già stato fatto una volta. Le due misure stanno in
   [stato.md](../stato.md), e lo sforamento è dichiarato riga per riga in [README.md](README.md).
2. **Le ultime operazioni sono sommerse dallo stipendio.** Il reddito emette una transazione per
   tick, dieci al secondo: un deposito resta visibile meno di mezzo secondo sulla home, e il
   registro da venti della schermata Statistiche è tutto stipendio dopo due secondi. Ogni test
   è verde, e a ragione — nessuno di loro guarda lo schermo mentre il tempo passa. È nel
   [registro YAGNI](../roadmap-fette.md) con il grilletto della fetta 02.
3. **Le regole che dipendono da un occhio sono sei, ed erano sette.** «I file `rules.ts`
   contengono solo funzioni pure» era l'unica regola scritta senza ID e senza meccanismo: adesso è
   **R13**, con `tests/rules/pure-rules`
   ([D022](D022-il-confine-disegnato-e-il-confine-vero.md)). Le sei che restano sono C04, C05 e i
   quattro nomi di file che [convenzioni.md](../convenzioni.md) affida alla review; sono elencate
   in fondo a [tracciabilita.md](../tracciabilita.md), sotto _Cosa questa tabella non copre_. Se
   diventano sette, è un segnale.
4. **Uno stato `Proposta` non è una dimenticanza: è una decisione che il codice non impone
   ancora.** Quali siano in questo momento lo dice [stato.md](../stato.md), che li conta; il
   perché di ciascuna sta nel suo ADR. Gli altri sono `Accettata`, e ognuno ha accanto il rosso
   che l'ha dimostrato. Il numero **non** si scrive qui: è stato sbagliato per un giorno intero
   prima che [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) togliesse a questa pagina
   il compito di ricordarlo.

Prima di lei c'è stata [D016](D016-correzioni-audit.md), nata da un **audit della codebase** fatto
il 2026-08-20: diciassette difetti, di cui uno critico — chiudere la finestra dalla schermata
d'errore scriveva una partita vuota sopra il salvataggio del giocatore. Le due radici sono nella
delega, e la seconda vale la pena saperla anche senza aprirla: `tests/rules/doc-links` verifica che
i collegamenti fra documenti risolvano, **non che i numeri scritti in prosa siano veri**. Sei
affermazioni numeriche di documenti vivi erano invecchiate senza far rumore.

### Quanto ci si può fidare di questi documenti

Sono stati **auditati per intero** dopo D005: tutti e cinquanta i markdown, collegamenti e ancore
inclusi. Sono usciti quindici disallineamenti, corretti tutti tranne uno — il `post(posting)` di
D007, lasciato aperto perché la decisione spettava a chi avrebbe scritto quel Ledger. È stata
presa: `post()` non esiste ([ADR 0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)). Il
dettaglio di cosa è stato trovato sta in `git log` (`docs: audit di coerenza`) e la lezione in
[rischi.md](../rischi.md), sotto N07.

D007 ne ha trovato un sedicesimo che l'audit non aveva visto: l'[ADR 0003](../adr/0003-ledger-unica-porta-del-denaro.md)
conteneva ancora la firma `Ledger.post({ … })`, superata dall'ADR 0019 lo stesso giorno. Gli ADR
sono append-only, quindi il corpo resta e a dichiararlo è l'intestazione.

Da lì in avanti valgono due cose:

- **I collegamenti non si rompono più in silenzio**: `tests/rules/doc-links` verifica ogni
  link e ogni ancora fra i documenti, ed è un gate come gli altri (regola C07).
- **E dal terzo audit, nemmeno i conteggi**: quanti ADR, quali `Proposta`, quante deleghe, quanti
  documenti stanno in [stato.md](../stato.md), che è **generato** e verificato (C11). Un documento
  vivo che li ripete è rosso, e nessuna riga di tabella può vivere fuori da una tabella (C12).
- **I documenti non appartengono tutti alla stessa specie, e non è un difetto.** Alcuni descrivono ciò che c'è
  (architettura, tracciabilità, glossario); altri **vincolano** ciò che verrà
  ([design/flusso-tick.md](../design/flusso-tick.md), le deleghe aperte). I secondi parlano di
  codice che non esiste ancora, e lo dichiarano in testa. Se ne trovi uno che non lo dichiara, è
  quello il difetto.

Quel primo audit **non** copriva ciò che è cambiato dopo D008. Il secondo — 2026-08-20, tutta la
codebase e tutti i documenti — è quello che ha prodotto [D016](D016-correzioni-audit.md).

Il **terzo** è dello stesso giorno, poche ore dopo, e ha prodotto
[D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) e
[D022](D022-il-confine-disegnato-e-il-confine-vero.md). Ha trovato dodici difetti, **nessuno nel
codice sorgente**: sette erano conteggi invecchiati — la stessa classe che D016 aveva appena
corretto a mano — e tre erano confini architetturali che nessun meccanismo verificava. La lezione
sta tutta in questo: la correzione di D016 era un **aggiornamento**, e un aggiornamento protegge il
giorno in cui lo si esegue e nessun altro. Le coperture sono dichiarate in fondo a D021.

Da lì in poi vale la stessa avvertenza di sempre: quello che è cambiato dopo, nessuno l'ha ancora
guardato — con una differenza, adesso: sette delle dodici classi trovate non possono più tornare in
silenzio, perché un gate le vede.

**E la classe che resta scoperta ha appena colpito di nuovo.** [D019](D019-il-pagamento.md) è stata
chiusa con tutti i gate verdi — collegamenti, conteggi, `stato.md` rigenerato — e alcuni fra i
**documenti vivi** descrivevano ancora il meccanismo di prima: il glossario non conosceva `PriceList` e la parola
«listino» era già presa dalla visione per un'altra cosa, `flusso-tick.md` disegnava un `buyUpgrade()`
senza argomento, `mappa-funzionale.md` diceva che con cosa si paga «si scopre sbagliando».
Trovati solo rileggendoli. `doc-links` guarda i **collegamenti** e `docs-facts` i **conteggi**:
nessuno dei due sa dire se una frase descrive ancora il codice di ieri, e non è chiaro che qualcosa
possa saperlo. Finché non lo sa nessuno, chiudere una delega vuol dire anche **rileggere i documenti
vivi che nominano ciò che hai cambiato** — non solo quelli che la delega elencava.

## Le sei cose da non fare

Sono le regole che, violate, riportano il progetto a com'era. Tutte hanno un meccanismo che le
impone; il meccanismo sta in [tracciabilita.md](../tracciabilita.md).

1. **Non scrivere una lista di sistemi a mano.** Il `Registry` è l'unica che esiste.
2. **Non toccare un saldo.** Solo `Ledger.transaction`, che applica tutto o niente e somma a zero.
3. **Non mettere logica di dominio in un `.vue`.** I componenti leggono selettori e inviano comandi.
4. **Non scrivere `TODO`.** Ciò che manca sta in [roadmap-fette.md](../roadmap-fette.md), con il
   grilletto preciso che lo farà entrare.
5. **Non costruire due domini insieme.** Una fetta verticale alla volta, finita e verde. È il
   difetto A17, quello che ha generato tutti gli altri.
6. **Non aggiornare la documentazione "dopo".** Se una modifica sposta un confine, il documento che
   descrive quel confine cambia nello stesso commit.

## Cosa leggere, in quest'ordine

| Quando                        | Documento                                         | Tempo |
| ----------------------------- | ------------------------------------------------- | ----- |
| sempre, per primo             | [docs/README.md](../README.md) — la mappa         | 2 min |
| per capire la forma           | [architettura.md](../architettura.md)             | 5 min |
| per non inventare parole      | [glossario.md](../glossario.md)                   | 3 min |
| prima di discutere una scelta | [adr/README.md](../adr/README.md) — solo i titoli | 3 min |
| prima di scrivere codice      | la delega che stai eseguendo                      | 5 min |
| quando dubiti che regga       | [rischi.md](../rischi.md), parti 2 e 3            | 5 min |

Non serve leggerli tutti, gli ADR. Servono quando stai per contraddirne uno: allora leggi
**quello**, e riparti dalle alternative già scartate invece che da zero.

## Il prossimo passo, in concreto

**[D024](D024-il-telaio.md) e [D025](D025-il-tooltip.md) sono chiuse**, ed è la prima volta che due
deleghe si chiudono in un commit solo: le due spunte che restavano — l'interruttore premuto, il
tooltip toccato col tabulatore — si pagavano nella **stessa** sessione a occhio, e separarle avrebbe
voluto dire aprire due volte la stessa finestra.

Cosa c'è adesso: il **telaio** del design — colonna a sinistra, testata appiccicata, striscia degli
strumenti — l'**interruttore del tema**, e il **tooltip**, che da R17 è l'unico modo di spiegare
qualcosa. Tre regole nuove, R16, R17 e INV-22, rotte di proposito una per una.

**Le due verifiche a occhio non hanno trovato niente da correggere**, e vale la pena dire cosa hanno
guardato, perché «guardato» da solo non è una misura: quattro combinazioni di schermata e tema, con
`data-theme` e i colori calcolati letti a ogni clic; la bolla aperta col puntatore e col tabulatore,
centrata sull'ancora al mezzo pixel; `Esc` che la chiude lasciando il fuoco dov'è. Le tabelle stanno
in fondo alle due deleghe.

### Come si guarda l'applicazione senza toccarla

**Tre trappole del guardare, e la terza è anche la via d'uscita.** Le prime due sono state pagate
scrivendo D024 e D025; la terza le risolve tutte.

1. Una cattura della finestra può **non dipingere l'ultima banda** in fondo, e per venti minuti il
   piede della colonna è sembrato assente mentre c'era. A dirlo è stata una misura presa **dentro**
   la pagina, non un'altra occhiata.
2. L'applicazione di sviluppo **si chiude** se le si porta la finestra in primo piano da fuori — per
   esempio con uno script che la va a cercare.
3. Non serve portarla in primo piano. `npm run dev` accetta `--remoteDebuggingPort`, e da lì la
   finestra vera si interroga e si comanda dal di dentro:

```bash
npx electron-vite dev --remoteDebuggingPort 9222
```

Con la porta aperta, `http://127.0.0.1:9222/json/list` dice quale pagina è il renderer, e sul suo
WebSocket passano `Runtime.evaluate` — per **chiedere al documento** invece che all'immagine —
`Input.dispatchMouseEvent` e `Input.dispatchKeyEvent` per premere e tabulare, e
`Page.captureScreenshot` per l'immagine. La finestra resta dov'è e non si chiude.

**Perché è scritto qui e non in una delega:** è il modo in cui questo progetto pagherà **ogni**
spunta a occhio da adesso in poi, e le spunte a occhio sono l'unica classe di verifica che nessun
gate può dare. Serve anche l'altra metà, ed è la lezione della prima trappola: l'immagine dice se
qualcosa è bello, il documento dice se c'è. Le due domande sono diverse e vogliono due strumenti.

### E da lì è nata [D026](D026-dove-si-attacca-un-dominio.md), che è chiusa

Guardare l'applicazione ha prodotto una domanda dell'utente che nessun documento del progetto
rispondeva: **dove vive l'interfaccia di un dominio?** Il caveau è la prova che la regola manca —
`components/CashPanel.vue` è due domini in un file, il pool e il caveau, e non per decisione: il
pannello dei contanti c'era già e il caveau ci è cresciuto dentro.

Due cose vanno sapute da chi prende D026, e sono le due che hanno rischiato di far partire quella
delega sbagliata.

1. **Il caveau con solo denaro non è un difetto, è una scelta scritta.** La visione dice «conserva
   contanti **e oggetti**», e il [registro](../roadmap-fette.md) dice perché gli oggetti non ci sono:
   nascono col black market e con le aste di box, e un inventario senza oggetti dentro è
   l'astrazione speculativa che l'[ADR 0014](../adr/0014-una-fetta-verticale-alla-volta.md) vieta. Il
   grilletto è il blocco A.
2. **«Quando UI e quando componente» era già deciso**, e chi credesse di doverlo decidere rifarebbe
   [D023](D023-il-design-system.md): il kit non sa che gioco è (ADR 0028, R14), una forma non è un
   contenitore (ADR 0030, R16), e un pezzo entra nel kit quando lo disegnano **due** componenti.
   Quello che manca è l'ordine **dentro** `components/`, che oggi è piatta.

**D026 è stata eseguita e chiusa lo stesso giorno.** Le tre decisioni sono state prese con
l'utente: la home **resta il bancomat** — l'ADR 0018 è stato confermato invece che superato, e
adesso si sa perché: la home _è_ la pagina del dominio `atm` — ogni dominio ha la sua pagina salvo
dichiarare `null`, e `components/` si divide in cinque cartelle per proprietario. Ne è uscito
l'[ADR 0033](../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md), la regola **R18** e
`tests/rules/domain-ui`, rotta di proposito quattro volte. Le destinazioni sono quattro, quindi il
grilletto dei **gruppi nella colonna** è scattato ed è uscito dal registro.

Tre cose che chi arriva adesso deve sapere, e che le dodici correzioni di D026 spiegano per esteso:

1. **Una sottocartella di `components/` non fa rosso `import-graph`**, contro ciò che D026 dava per
   certo: quel test sceglie il nodo per **prefisso**. È la ragione per cui R18 ha dovuto essere un
   test suo invece di appoggiarsi a C13.
2. **`CashPanel.vue` si è spezzato in tre**, non in due: il caveau lascia sulla home il proprio
   allarme, e quel pezzo sta in `components/vault/`. È la clausola dell'ADR 0033 — un dominio può
   comparire fuori dalla sua pagina, ma esce dalla sua cartella — e senza di essa il muro sarebbe
   invisibile proprio dove il giocatore lo incontra.
3. **`income` ha preso una pagina anche lui**, e oggi ci sta dentro un pulsante solo. È scritto nel
   file: una pagina nasce stretta una volta sola e cresce col dominio, mentre un pannello ospitato
   nella pagina di un altro non se ne va più.

**Una cosa è stata chiesta e dichiarata fuori scope: il cruscotto con i grafici.** Non c'è una serie
storica da disegnare — `history` sono venti transazioni in memoria e `SavePayload` non contiene
nessuno storico — e una libreria di grafici è una dipendenza, quindi un ADR
([ADR 0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md)). Il suo posto è una delega sua,
che decide **chi salva la serie** prima di **come si disegna**.

**La domanda gemella — cosa è trasversale e cosa è di dominio — non sta in D026 ed è deliberato.**
Le valute, gli oggetti, il calore, l'attenzione, l'etichetta: generalizzarli adesso vorrebbe dire
generalizzare da un dominio solo, che è ciò che la [visione](../prodotto/visione.md) vieta con parole
sue. Il suo posto è la sezione 8 della scheda di [D018](D018-la-scheda-di-dominio.md), aggiunta lo
stesso giorno, più i grilletti che il registro ha già.

**Lo STOP 2 è stato riportato, e le regole che governano la fetta 02 sono già in vigore.**
La fetta 01 è conclusa e verificata. [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) e
[D022](D022-il-confine-disegnato-e-il-confine-vero.md) sono **chiuse**: sono nate da un audit
dell'intera codebase e di tutti i documenti, e hanno messo un meccanismo sotto cinque confini che
prima teneva la review. Non costruiscono gioco — costruiscono il pavimento su cui la fetta 02
cammina, e la ragione per cui vengono prima è quella di D001 e D020: le regole devono esistere
prima del codice che governano.

Quello che ne discende per chi esegue adesso sta in _Cosa vale per qualunque delega_, e la più
facile da dimenticare è quella su `docs/stato.md`: chiudere una delega significa **rigenerarlo**, o
il gate è rosso. Vale anche per una delega che non tocca `src/`, perché i file di test si contano.

**Il codice di gioco non è stato toccato**: cinque righe in tutto, in `eslint.config.js` e in
`rotation.ts`. Le deleghe della fetta 02 partono esattamente da dove le ha lasciate lo STOP 2, e
nessuna delle loro misure è cambiata.

**[D019 — Il pagamento](D019-il-pagamento.md) è chiusa**, e questa è la sua storia: non c'era, ed è nata da una domanda posta
prima di eseguire il caveau: come sceglie il giocatore con cosa paga? La risposta è che non sceglie
— `income` compra il suo upgrade con il pool scritto nel sorgente — e che
l'[ADR 0017](../adr/0017-il-denaro-e-plurale.md) prometteva il contrario dalla fetta 01. Il caveau
sarebbe stato il **secondo** comando a spendere, cioè l'ultimo momento per rispondere senza
disfare niente. Da lì l'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
e il **listino**: ogni azione dichiara, per ogni strumento che accetta, quanto costa con quello.
Il kernel non cambia di una riga.

**[D020 — Nessun sistema si fida del proprio salvataggio](D020-nessun-sistema-si-fida-del-salvataggio.md)
è chiusa**, e con lei il pavimento su cui il caveau cammina. Zero righe di sorgente, 70 di test,
esattamente il budget: ogni sistema con stato deve rifiutare un salvataggio che non riconosce
(**INV-20**), e a pretenderlo è `tests/rules/stateful-systems-reject-garbage` — il primo test di
quella cartella che costruisce una partita invece di leggere i sorgenti, il che è dichiarato in
testa al file. Veniva prima del caveau per la ragione di D001: la regola deve esistere prima del
codice che governa, e il caveau è il **secondo** dominio con stato.

Ne discende una cosa per chi prende D017: **non c'è niente da aggiungere a quel test.** I sistemi
si derivano dal Registry, quindi registrare il caveau lo mette sotto la regola da solo. Ciò che il
caveau deve fare è che il suo `load` rifiuti i tipi sbagliati **campo per campo** — il controllo
pigro «è un oggetto» non basta, ed è misurato.

**[D023 — Il design system](D023-il-design-system.md) è chiusa**, ed è arrivata da fuori: l'utente
ha consegnato un canvas di Claude Design, fatto a foglio bianco. Si è infilata prima del caveau per
la ragione di D001 — il caveau è la prima schermata nuova dopo la fetta 01, e una schermata
disegnata prima che il sistema esista è una schermata da rifare.

Le quattro cose che chi arriva adesso deve sapere:

1. **`src/renderer/ui/` è un livello, non una cartella.** Non importa `@core`, non importa lo store,
   non importa le parole: nel diagramma è l'unico nodo **senza frecce in uscita**. Lo tengono due
   regole con un test, **R14** e **R15**, e il blocco `<style>` non scoped di `App.vue` — l'unico
   che il progetto aveva — non esiste più.
2. **[P2](../prodotto/preferenze.md) è stata sostituita.** Tre cose cambiano: il fondo non è più
   solo scuro (due temi completi, sceglie il sistema operativo), l'accento non è più verde — il
   verde adesso vuol dire **solo** guadagno — e i caratteri si caricano e sono due, dal bundle.
3. **Un pulsante non si spegne, e adesso non può.** `UiButton` non sa scrivere `disabled`
   (**INV-21**). La regola c'era già da D019, in prosa; la prima stesura del componente la stava
   disfacendo senza che nessun gate lo vedesse.
4. **`npm install` non funziona in questa repo**, e non per colpa di D023: `electron-vite@5` regge
   `vite` fino alla 7 e il progetto è sulla 8. L'unico comando che installa è
   `npm ci --legacy-peer-deps`, che però **ignora i peer** — per questo `@vue/devtools-api` e
   `vue-eslint-parser` sono adesso dichiarati a mano. La causa vera è aperta, ed è la correzione 8
   di [D023](D023-il-design-system.md).

**[D017 — Il caveau](D017-il-caveau.md) è chiusa, e con lei la fetta 02.** Il primo muro del gioco è
acceso: i contanti hanno una capienza, la capienza si sposta, e quando è piena il reddito **non
entra e lo dice**. Le sedici correzioni stanno in fondo alla delega; le quattro che chi arriva
adesso deve sapere sono queste:

1. **Il Ledger non legge più la capienza: la chiede, e la espone.** `createLedger(bus, capacities)`
   riceve una funzione ([ADR 0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md), ora
   `Accettata`), e `Ledger.capacities` è **la stessa** che la UI interroga — quindi INV-18 si
   verifica per identità e non confrontando due numeri che oggi coincidono. `capacityOf` in
   `domains/atm/rules.ts` **non esiste più**: leggeva `POOLS`, cioè la capienza di partenza, che
   dopo il primo ampliamento è la risposta sbagliata.
2. **Il valore predefinito di `createLedger` è additivo e ha morso lo stesso.** Tre file di test
   costruivano un Ledger nudo e ci mettevano più denaro di quanto il caveau tenga: hanno smesso di
   provare quello che provavano, e due su tre restavano **verdi**. Dove il tetto non è l'oggetto del
   test si passa `() => null`, con scritto perché. «Additivo» significa _compila_, non _prova ancora
   la stessa cosa_.
3. **`domains/* --> domains/*` non è ancora mai stata disegnata, e D017 ha scelto due volte di non
   aprirla.** Il reddito ha bisogno di sapere quanto spazio c'è nel caveau e il bancomat se un
   prelievo ci sta: in tutti e due i casi la risposta arriva **per argomento**, e a consegnarla è
   chi ha entrambi sotto mano — il bootstrap e lo store. Nessun lint lo impedirebbe, quindi è una
   cosa che si sceglie ogni volta: è scritta in prosa in [architettura.md](../architettura.md),
   sotto _Frecce vietate_.
4. **Il raggruppamento dello stipendio non è stato costruito, e il suo grilletto era «la fetta
   02».** Non stava nella tabella _Da produrre_ di D017 né nella sua definizione di fatto, e il
   caveau non è il posto dove si decide quali righe una schermata mostra. La voce è ancora nel
   [registro YAGNI](../roadmap-fette.md), con un grilletto nuovo — la prima delega che tocca
   `components/postings.ts` — e con un argomento in più: a caveau pieno il reddito **si ferma**,
   quindi lo storico smette di riempirsi di stipendio proprio quando c'è qualcos'altro da leggerci.

**[D018 — La scheda di dominio](D018-la-scheda-di-dominio.md) è chiusa**, e con lei il progetto ha
una cosa che prima non aveva: un **modulo che nessun dominio futuro può lasciare vuoto**. Sta in
[design/domini/README.md](../design/domini/README.md) — nove sezioni di gioco e dodici domande sul
kernel, ognuna con dietro un ADR, un invariante o un test — e le tre schede compilate
([reddito](../design/domini/income.md), [bancomat](../design/domini/atm.md),
[caveau](../design/domini/vault.md)) sono la prova che regge tre domini fatti apposta diversi.

Le quattro cose che chi arriva adesso deve sapere:

1. **`domains/* --> domains/*` adesso è vietata da un test.** Era vera e non imposta da niente: il
   lint sotto `domains/**` vieta `vue`, `pinia`, `electron` e le conversioni di `Money`, non un
   dominio che ne importa un altro, e `import-graph` la salta perché è un arco **interno** a un
   livello. Adesso è **R19**, `tests/rules/domains-are-independent`, e non fa sconti all'
   `import type`. D018 dichiarava «nessuna regola nuova»: è la sua correzione 1, e la ragione è che
   senza quel test D018 violava un proprio invariante nella riga stessa che lo enuncia.
2. **La scheda del bancomat ha trovato che `ATM_FEE` non ha un bersaglio suo.** È tarata di
   rimbalzo da `vault_card_discount`, che è del caveau: cambiare la commissione rende rosso un test
   che parla d'altro. Non è stato corretto — D018 non tocca `src/` — ed è annotato in
   [atm.md](../design/domini/atm.md).
3. **Una domanda manca alla forma, e si sa già quale.** `withheld` del reddito non è stato, non è
   una lista e non è un evento: è un numero che spiega **perché il tick ha fatto meno di quanto
   poteva**. La metà kernel non ha una casella dove metterlo, e ce ne sarà uno per ogni dominio che
   può fallire parzialmente. Va posta alla quarta scheda, non prima.
4. **Due sezioni non discriminano ancora, e la scheda lo dichiara invece di lasciarlo intendere.**
   La 9 — _questo dominio si amministra?_ — riceve tre «sì»: il primo `null` sarà il calendario.
   Cinque delle dodici domande kernel rispondono «no» per tutti e tre. Non è un difetto: è il
   numero di partenza del controllo che la scheda si è data — se una sezione non ha mai cambiato
   una decisione va tolta, e la prova si fa alla **quarta** compilata.

Tre cose che chi apre la fetta 03 deve avere in mente prima di scrivere una riga:

1. **A17 non è finita con la fetta 02.** Il caveau apre il black market, le aste e il calore, e
   nessuno dei tre si è toccato. Una fetta alla volta
   ([ADR 0014](../adr/0014-una-fetta-verticale-alla-volta.md)).
2. **La fetta 03 ha una domanda in meno e una risposta diversa.** «Il progresso offline è limitato
   dal caveau, non dal tetto» era un'ipotesi con un numero inventato; adesso è una misura: otto ore
   di assenza valgono 1.000,00 € al primo livello e 250.000,00 € all'ultimo, contro i 345.600,00 €
   che `RECOVERY_CAP` permetterebbe. Il tetto di otto ore va ri-derivato **in tempo di gioco**, e il
   recupero deve avanzare a blocchi invece che in un `tickAll` solo — ma quel `tickAll` solo adesso
   non fa più tornare a casa con zero, ed è il motivo per cui `roomIn` esiste.
3. **Il gioco si fa girare senza Electron**, e D017 l'ha rifatto per guardare la schermata nei due
   temi: `npm run build`, la pagina di `out/renderer/` servita da un server statico, le tre funzioni
   di `SaveApi` finte al posto del preload — con dentro un salvataggio che ha già dei soldi, così
   ogni stato si **costruisce** invece di aspettarlo. In questo ambiente la finestra non compone
   frame, quindi il loop non gira: i colori si rileggono dal DOM, che è più severo di un occhio. Il
   modo esatto è nella nota di chiusura di [D017](D017-il-caveau.md).

Quanto ci mette `verify`, e con quanti test, lo dice [qualita.md](../qualita.md) con la data
accanto: è l'unico posto del progetto in cui un tempo si scrive, e questa pagina lo ripeteva
scaduto di due deleghe. La soglia è il minuto, è il margine più stretto del progetto, e il rimedio
è già censito nel [registro YAGNI](../roadmap-fette.md) — togliere l'avvio ripetuto di `npm`, non
togliere un gate.

## Come si lavora

- **Ci si ferma sulle decisioni strutturali.** Nuova dipendenza, cambio di pattern, confine
  spostato: due opzioni con i compromessi, e si aspetta. Le cose piccole e reversibili si fanno.
- **Se l'utente dà una direttiva generale** ("la soluzione più professionale"), si decide in
  autonomia e si marca la decisione come contestabile — non ci si ferma di nuovo.
- **Nessun claim senza output.** "Funziona" si dice incollando i test verdi.
- **Un test che non si è mai visto fallire non è una rete, è una decorazione.** Rompilo di proposito
  una volta: costa trenta secondi. È così che si è scoperto che il primo caso di prova per R04 era
  sbagliato, e che la regola sembrava funzionare senza funzionare.
- **Commit:** Conventional Commits con lo scope uguale all'ID della delega —
  `feat(D007): il ledger a partita doppia`. Un ramo per delega: `d007-kernel-ledger`.
- **Il ramo si fonde su `main` quando la fetta è conclusa, non a ogni delega.** Per quattro deleghe
  di fila i rami si sono impilati uno sull'altro e `main` è rimasto alla fetta 01: funzionava, e
  costava una riga di avvertimento in ogni prompt — «parti dal ramo, non da `main`» — cioè
  esattamente il tipo di istruzione che prima o poi qualcuno salta. Alla chiusura della fetta 02
  sono state fuse tutte e quattro, in un `--ff-only` senza conflitti. Le deleghe chiuse continuano a
  dire da quale ramo partivano, ed è giusto: raccontano il giorno in cui sono state scritte, non
  dove si sta adesso.
- **Quando una delega è finita:** marcala `Chiusa` con il commit, aggiorna
  [tracciabilita.md](../tracciabilita.md) se hai cambiato un meccanismo, e scrivi le **correzioni
  rispetto a com'era scritta la delega** — ogni delega chiusa finora ne ha da cinque a diciassette, e
  sono scritte lì invece che nascoste. Se una delega esce senza correzioni, o era perfetta o non
  è stata letta con attenzione.
- **Un numero scritto in un documento è una misura scaduta.** Conteggi, tempi, righe: quando ne
  incontri uno che riguarda ciò che stai toccando, rimisuralo invece di ricopiarlo. `verify` ha
  dichiarato otto secondi da D001 a D006, quando erano venticinque; `rischi.md` ha detto "i quattro
  difetti" davanti a un elenco di cinque per altrettanto tempo.
- **Quando correggi un fatto sbagliato, cerca il concetto, non la frase.** Un `grep` sulla frase
  intera trova le copie identiche e lascia indietro le parafrasi — è successo davvero, con
  "progresso offline" scritto in quattro punti e corretto in due.

## Come verificare di non aver rotto niente

```bash
npm run verify
```

Quattro gate in una trentina di secondi: typecheck, lint, format:check, test. Se è rosso, non è
finito.

`npm run verify:release` aggiunge la compilazione, ed è **verde da D011**: `build` produce
`out/main/index.js`, `out/preload/index.cjs` e `out/renderer/`. Da D009 a D010 era rosso e non era
una regressione — il renderer non esisteva ancora — ma da qui in avanti non ha più scuse.

Per vedere il gioco girare davvero serve il binario di Electron, che l'installazione di `npm` non
sempre scarica: se `npm run dev` dice _Electron uninstall_, si completa con
`node node_modules/electron/install.js`.

Se la finestra non c'è — o non compone frame, e allora il saldo non sale mai — il gioco si guarda
lo stesso: `npm run build`, la pagina di `out/renderer/` servita da un server statico qualunque, e
al posto del preload le tre funzioni di `SaveApi` scritte a mano, con dentro un salvataggio che ha
già dei soldi. Il modo esatto è nella nota di chiusura di
[D015](D015-home-bancomat.md#cosa-è-stato-verificato-a-mano-e-come).

## Le decisioni contestabili

Prese in autonomia; quante siano non si scrive, perché nessuno le conta. **Le righe nuove si
aggiungono in fondo**: la prosa qui sotto indicizza la tabella per posizione — «le prime quattro»,
«la ventiduesima» — e una riga infilata in mezzo sposta tutto ciò che viene dopo senza che nessun
gate se ne accorga.

**È già successo, e in due modi.** Il primo: questo paragrafo diceva «Trenta» davanti a trentasei
righe. Il secondo è più insidioso e riguarda le righe **aggiunte in fondo**, che erano la mossa
sicura: le sei di D017 hanno spinto in avanti la fine della tabella, e le due frasi che ci si
appoggiavano da dietro — «le cinque che precedono l'ultima», «le ultime cinque» — hanno smesso di
puntare a ciò che nominavano. Adesso quelle due dicono di **quale delega** parlano invece di dove
stanno, che è l'unica ancora che non si sposta.

Le prime quattro sono **in vigore** da D007 e sono state usate da due
domini: cambiarle costa il Ledger, i suoi test e i due domini. D014 era il momento buono per
contestarle ed è passato — nessuna delle quattro si è rivelata scomoda usandole.

La quinta e la sesta sono del 2026-08-19, nascono dalla revisione della visione e **non costano
ancora niente**: nessuna riga di codice le applica.

La settima è **in vigore da D009**: costa il main, il preload e i loro test.

L'ottava è **in vigore da D010**, da D014 e ora dal bootstrap che le distribuisce entrambe. Costa i
due domini e `createGame.ts` — e D011 ha scoperto che l'unica cosa che rende quella scelta sicura è
un test: passare al bootstrap un `Ledger` diverso da quello del contesto lasciava **quaranta test
verdi**. Adesso non più.

La nona e la decima sono **in vigore da D014**. Costano il dominio e i suoi test — poco, ma non più
zero. La nona è quella che cambia una forma del progetto: `atm` è il primo dominio senza
`system.ts`, e il bootstrap di D011 lo conferma con una riga di `register` invece di due.

L'undicesima e la dodicesima sono di **D011**, e costano il renderer e i suoi test.

La tredicesima, la quattordicesima, la quindicesima e la sedicesima sono di **D012**. Costano il
dizionario, il guscio e le schermate — e D015 le ha ereditate senza contestarne nessuna: le chiavi
piatte hanno retto una decina di chiavi nuove, i mirror hanno retto i selettori del bancomat.

Le cinque righe che portano **D015** costano la home. Due riguardano cosa il gioco **non** mostra —
i tre numeri del retro della carta e il sesto riquadro — e sono le meno costose da cambiare: i dati
arriveranno, e i posti sono lì ad aspettarli. La terza è un numero di gioco travestito da
interfaccia. La quarta torna sul tavolo a ogni componente nuovo, ed è giusto così.

| Cosa                                                                         | ADR                                                                                                                       | Alternativa scartata                                                                                                                                                    |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ogni transazione somma a zero (partita doppia)                               | [0020](../adr/0020-partita-doppia.md)                                                                                     | movimenti singoli con categoria                                                                                                                                         |
| Il Ledger espone transazioni, non movimenti                                  | [0019](../adr/0019-transazioni-atomiche-nel-ledger.md)                                                                    | due `post()` con rollback nel chiamante                                                                                                                                 |
| I pool dichiarano le proprie affordance come dati                            | [0017](../adr/0017-il-denaro-e-plurale.md)                                                                                | un saldo unico con etichette nella UI                                                                                                                                   |
| `post()` non esiste: una primitiva sola                                      | [0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)                                                                   | zucchero a due movimenti, che però rimette `world` e `sink` nei domini                                                                                                  |
| Il Ledger avrà conti dinamici, non solo sei pool                             | [0022](../adr/0022-il-ledger-ha-conti-non-solo-pool.md)                                                                   | il budget di un'attività tenuto come stato del dominio                                                                                                                  |
| Il tempo di gioco è un dominio, non il kernel                                | [0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                                                          | un `now` nel `SystemContext`, che aggiunge una chiave al salvataggio                                                                                                    |
| I tipi d'esito del salvataggio stanno in `contracts/save.ts`                 | [D009](D009-persistenza-main.md#il-contratto-cresce) — non ha un ADR: è una conseguenza di INV-03, non una decisione a sé | allargare INV-03 a tutto `contracts/`, cioè un allowlist di un file che diventa un denylist da mantenere                                                                |
| Un sistema riceve per costruzione ciò che il contesto non porta              | [0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)                                     | un singleton in `balance/`: nessun parametro in più, e una dipendenza che sparisce dalle firme                                                                          |
| Un dominio senza stato non ha un `system.ts` e non si registra               | [D014](D014-dominio-bancomat.md) — decisione 1                                                                            | inventargli uno stato per riempire il file: un contatore che nessuna schermata mostra, più una migrazione il giorno in cui la forma giusta si vede                      |
| La commissione del bancomat è un importo fisso, non una percentuale          | [D014](D014-dominio-bancomat.md) — decisione 2                                                                            | una percentuale, che però non produce **mai** il caso "commissione superiore all'importo" — e quel caso è metà del valore della fetta                                   |
| D011 produce anche l'ingresso del renderer, non solo i tre file dichiarati   | [D011](D011-runtime-e-store.md) — correzione 6                                                                            | lasciare `verify:release` rosso fino a D012, e chiudere D011 senza aver mai eseguito il proprio loop                                                                    |
| Se il salvataggio finale fallisce, la finestra **non** si chiude             | [D011](D011-runtime-e-store.md) — correzione 13                                                                           | chiudere comunque: comodo, e perde l'unica copia esistente della partita                                                                                                |
| Il saldo della home mostra i **due pool del giocatore**, non una cifra sola  | [D012](D012-ui-e-i18n.md) — correzione 7                                                                                  | la cifra sola del mockup, sotto cui il messaggio «ti servono 800,00 €, ne hai 0,00 €» è incomprensibile                                                                 |
| Le chiavi i18n sono **piatte**, non una gerarchia di oggetti                 | [D012](D012-ui-e-i18n.md) — correzione 9                                                                                  | l'annidamento, in cui `atm.withdraw.title` prende il posto di `atm.withdraw` senza che nulla lo dica                                                                    |
| La navigazione è un `ref`, non un router                                     | [D012](D012-ui-e-i18n.md) — [registro YAGNI](../roadmap-fette.md)                                                         | `vue-router`: una dipendenza, quindi un ADR (ADR 0015), per due destinazioni senza indirizzo                                                                            |
| jsdom resta fuori: le verifiche a occhio diventano test per un'altra strada  | [D012](D012-ui-e-i18n.md) — correzione 15                                                                                 | `jsdom` + `@vue/test-utils`, cioè due dipendenze e un ADR, per montare componenti che la definizione di fatto non chiede di montare                                     |
| Il cruscotto ha **cinque** riquadri, non sei: il tetto è un tetto            | [D015](D015-home-bancomat.md) — correzione 1                                                                              | riempire il sesto posto con un numero inventato, che è anche il posto che la fetta 02 userà davvero                                                                     |
| Il retro della carta porta le affordance del pool, non tre numeri finti      | [D015](D015-home-bancomat.md) — correzione 3                                                                              | plafond, limite e punteggio di credito come li disegna il mockup: dati che nella fetta 01 non esistono                                                                  |
| L'importo si sceglie fra quattro, e il più piccolo è rifiutato apposta       | [D015](D015-home-bancomat.md) — correzione 5                                                                              | un campo di testo, che apre il confine «chi trasforma una stringa digitata in `Money`» e cosa succede quando non è un numero                                            |
| jsdom resta fuori una **seconda** volta: si estrae invece di montare         | [D015](D015-home-bancomat.md) — correzione 13                                                                             | tirare il grilletto che il registro YAGNI aveva scritto: due dipendenze e un ADR per provare quattro funzioni pure                                                      |
| Le righe di una transazione hanno il segno: nasce `signedMoney`              | [D015](D015-home-bancomat.md) — correzione 10                                                                             | un formato solo: «497,50» in un elenco di movimenti non dice da che parte va il denaro                                                                                  |
| `doc-links` guarda anche il `README.md` della radice, non solo `docs/`       | [D013](D013-verifica-della-fetta.md) — correzione 7                                                                       | lasciarlo scoperto perché «non è un documento di `docs/`»: sarebbe l'unico del progetto con i collegamenti liberi di marcire, e l'unico che un estraneo legge per primo |
| Il listino sta nell'**azione**, non in una tabella globale in `balance/`     | [ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)                                               | una regola sola per tutti — coerente per costruzione, e per questo sbagliata: il black market sconta i contanti, l'immobiliare li penalizza                             |
| Il **selettore** del pagamento è di D017, non di D019                        | [D019](D019-il-pagamento.md) — _Il selettore vero è di D017_                                                              | costruirlo in D019, dove nessuna azione accetta due strumenti: sarebbe provato solo contro un listino finto                                                             |
| `heat` e `convertibleTo` restano fuori dal listino, con il grilletto scritto | [ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) — alternative scartate                        | dichiararli subito: un campo che nessuno legge per tre fette, e un grafo di conversioni per un arco solo                                                                |
| La validazione dello stato salvato è un **test**, non un tipo né un aiutante | [D020](D020-nessun-sistema-si-fida-del-salvataggio.md)                                                                    | `defineSystem` che chiede un validatore: garantisce che il campo esista, non che funzioni — e cambia il kernel per una regola che il kernel non deve conoscere          |
| D019 e D020 vanno **prima** di D017, non dentro                              | [README](README.md) — il grafo                                                                                            | infilarle nel caveau: la regola sarebbe scritta dalla stessa persona che scrive il codice da sorvegliare, nello stesso momento                                          |
| Un pool fuori listino è rifiutato col codice del Ledger, non con uno nuovo   | [D019](D019-il-pagamento.md) — correzione 3                                                                               | un `error.income.*` suo: due frasi per una situazione sola, e il giocatore ne leggerebbe una diversa a seconda di quale delle due strade lo rifiuta                     |
| Il prezzo resta sul pulsante; la riga sopra porta strumento e ragione        | [D019](D019-il-pagamento.md) — correzione 8                                                                               | l'importo nel riquadro del pagamento e «Compra» nudo: toglie la ripetizione e contraddice il mockup approvato allo STOP 1                                               |
| Con un'opzione sola il pagamento è **una** chiave i18n, non due              | [D019](D019-il-pagamento.md) — correzione 9                                                                               | le due che l'ADR 0027 prevedeva — _con cosa si paga_ e _perché non gli altri_ — che con un listino di uno sono la stessa frase                                          |
| Il caveau ha **cinque** livelli, da 1.000,00 € a 250.000,00 €                | [D017](D017-il-caveau.md) — `balance/constants.ts`                                                                        | una curva senza tetto che si strozza da sola: in un idle «costa più di quanto renda» è un bersaglio mobile, da ritarare a ogni cambio di reddito                        |
| Lo sconto della carta è **sotto** la commissione del bancomat                | [D017](D017-il-caveau.md) — `targets.ts`, `vault_card_discount`                                                           | uno sconto più grande: senza il calore la carta non paga niente in cambio della traccia, e i contanti diventerebbero una voce di listino che nessuno sceglie mai        |
| Il Ledger **espone** la funzione delle capienze, non la riceve soltanto      | [D017](D017-il-caveau.md) — correzione 5                                                                                  | lasciarla solo in ingresso: INV-18 tornerebbe un confronto fra due numeri che oggi coincidono, che è la forma debole che la definizione di fatto vieta                  |
| Il reddito riceve lo **spazio** per costruzione, non importa il caveau       | [D017](D017-il-caveau.md) — correzione 3                                                                                  | `income` che importa `vault/rules`: nessun gate lo fermerebbe, e sarebbe il primo accoppiamento fra domini in un gioco che ne ha diciassette                            |
| Il caveau sta in `ORDER.ECONOMY`, e non apre una fase nuova                  | [D017](D017-il-caveau.md) — correzione 9                                                                                  | una terza fase per un sistema che non ticchetta; e l'ordine conta davvero in un punto — `ECONOMY` carica prima di `INCOME`, cioè prima che il recupero ticchetti        |
| Quanto resta fuori dal tick è un **importo**, non un `sì/no`                 | [D017](D017-il-caveau.md) — correzione 7                                                                                  | un booleano: farebbe sparire il caveau **quasi** pieno, che è il caso che il giocatore incontra per primo                                                               |

La ventiduesima è di **D013** e costa una riga di un test: è anche l'unica riga non di test che
quella delega abbia toccato.

**Le cinque righe del 2026-08-20 — quelle di [D019](D019-il-pagamento.md) e
[D020](D020-nessun-sistema-si-fida-del-salvataggio.md) — e tre di loro sono entrate in vigore con D019.** Il listino dentro l'azione, il selettore rimandato a D017, il calore e `convertibleTo` lasciati fuori: adesso costano `contracts/payment.ts`, il dominio `income`, lo store e un componente — poco, ma non più zero. Le altre due, quelle di D020, sono entrate in vigore con [D020](D020-nessun-sistema-si-fida-del-salvataggio.md) e non costano quasi niente lo stesso: la validazione come **test** costa un file di `tests/rules/` e zero righe di `src/` — contestarla vuol dire cancellare quel file, non disfare il kernel — e l'ordine «prima di D017, non dentro» è ormai speso, perché D017 le trova entrambe già fatte. Nascono tutte dalle due domande poste prima di eseguire D017 — come si sceglie con cosa si paga, e chi controlla lo stato che arriva dal disco. Le scelte **di gioco** di quelle sessioni non sono qui perché non sono state prese in autonomia: lo spazio unico del caveau, il tetto a livelli finiti, la varianza zero e la nona voce dell'etichetta sono state decise dall'utente, e stanno nella [scheda del caveau](../design/domini/vault.md) con le alternative scartate.

**Le sei righe in fondo sono di [D017](D017-il-caveau.md)**, e sono quelle che chiudono la fetta 02:
i cinque livelli del caveau, lo sconto della carta sotto la commissione, la funzione delle capienze
esposta invece che solo ricevuta, lo spazio passato al reddito per costruzione, il caveau in
`ORDER.ECONOMY`, e l'importo — non il `sì/no` — che resta fuori dal tick. Costano il dominio, il
Ledger e i loro test. **D024, D025 e D026 non ne hanno aggiunte**: le loro scelte in autonomia sono
diventate ADR — 0030, 0031, 0032 e 0033 — e un ADR è già il posto dove una decisione si contesta.
Le due di D026 stanno nella tabella _Decisioni prese in autonomia_ dell'[indice ADR](../adr/README.md),
e sono la prima riga di quella tabella che nasce già **in vigore**.

Sono contestabili anche i **numeri**: il moltiplicatore ×1,5 dell'upgrade, le otto ore di tetto al
recupero e l'intervallo 700–740 del primo minuto scelti da D008, più i 2,50 € di `ATM_FEE` scelti
da D014, e i quattro importi rapidi del bancomat — 1 · 10 · 100 · 500 — scelti da D015. Sono di
un'altra categoria: cambiarli costa una riga in `balance/constants.ts` e un test che diventa rosso
apposta. Reddito base e costo dell'upgrade vengono invece dai
[mockup](../design/mockups/), quindi erano già approvati.

## Prompt pronto per una sessione nuova

Questo prompt **consegna una delega**, e una sola per volta. Con
[D018](D018-la-scheda-di-dominio.md) chiusa ne resta **una** aperta:
[D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md), i grafici del cruscotto — scritta il
2026-08-21 e **non preparata**. I prompt che consegnavano D026 e D018 stanno nel `git log` di questo
file: si recuperano da lì invece di tenerne tre in vita, che è la stessa ragione per cui i numeri
stanno in un posto solo.

**D027 comincia con due decisioni, non con del codice.** Chi la esegue le porta all'utente prima di
toccare un file, e il prompt lo dice apertamente: la prima decide chi tiene la serie storica — che
oggi **non esiste** — e la seconda se entra una dipendenza nuova.

```markdown
Esegui la delega D027 nel progetto Solvent, in questa repo.

Leggi in quest'ordine, e non scrivere niente prima di aver finito:

1. `docs/delega/PASSAGGIO-DI-CONSEGNE.md` — stato, regole, e le cose che sa solo lui. In
   particolare _Cosa vale per qualunque delega_ e _Le decisioni contestabili_
2. `docs/stato.md` — quanti sono gli ADR, le deleghe e i documenti, e in che stato. È **generato**:
   non si scrive a mano, si rigenera con `npx vitest run tests/rules/project-state -u`
3. `docs/delega/D027-un-grafico-e-una-serie-che-nessuno-tiene.md` — la delega che esegui.
   Interamente, e in particolare _Il fatto che decide tutto: la serie non esiste_ e _Le decisioni
   aperte_: sono due, non spettano a te, e vanno portate a me prima di scrivere una riga
4. `docs/adr/0010-liste-storiche-limitate-alla-definizione.md` — è `Proposta`, e la decisione 1 può
   farlo diventare `Accettata`. Una serie storica è esattamente ciò di cui parla
5. `docs/adr/0015-criterio-di-ammissione-delle-dipendenze.md` — il criterio con cui una libreria
   entra. La decisione 2 si pesa contro questo, non contro il gusto
6. `docs/adr/0018-la-home-e-un-atm.md` — il tetto di sei riquadri e l'ordine delle due zone. Un
   grafico che occupa il posto di un riquadro lo tocca
7. `docs/adr/0028-il-kit-ui-non-sa-che-gioco-e.md` — **R15**: nessun colore vive fuori dai token, e
   le librerie di grafici dipingono i propri
8. `src/renderer/views/HomeView.vue`, `src/renderer/components/shell/StatTile.vue` e
   `src/renderer/stores/game.ts` — dove il grafico andrebbe, e cosa lo store sa davvero

Stato: `npm run verify` e `npm run verify:release` **verdi**. Quali deleghe siano aperte lo dice
`docs/stato.md`, che le conta.

Come si comincia, ed è l'unica cosa che non puoi saltare:

1. **Portami le due decisioni**, una alla volta, con due opzioni e i compromessi. Non decidere al
   posto mio: la 1 crea il primo storico del progetto e tocca il salvataggio, la 2 può far entrare
   una dipendenza — e una dipendenza è un ADR
2. **Poi** il codice, con i gate che servono e ogni test nuovo rotto di proposito

Attenzione a tre cose del punto di partenza:

- **La serie non esiste, ed è il fatto che decide tutto.** `history` è una lista di venti
  transazioni tenuta **solo in memoria**, e `SavePayload` contiene `ledger`, `rng` e `systems` —
  nessuno storico. Un grafico disegnato oggi disegnerebbe numeri inventati, che è la correzione 1
  di `docs/delega/D015-home-bancomat.md` con un altro vestito
- **`main` è allineato**, e il ramo nuovo parte da lì. Se una delega chiusa ti dice di partire da un
  altro ramo, quella è la cronaca del giorno in cui è stata scritta
- **`npm install` non funziona in questa repo**, e non è colpa tua: `electron-vite@5` regge `vite`
  fino alla 7 e il progetto è sulla 8. L'unico comando che installa è `npm ci --legacy-peer-deps`,
  che però ignora i peer. È la correzione 8 di `docs/delega/D023-il-design-system.md`. Vale doppio
  qui: se la decisione 2 sceglie una libreria, l'installazione è parte del lavoro, non un dettaglio

Come lavoro:

- **Un ramo `d027-un-grafico-e-una-serie`.** Non si commetta su `main`
- **La delega si esegue, non si riscrive.** Se il testo è invecchiato o sbagliato, fermati e
  dimmelo: è successo sei volte e ogni volta ha tolto lavoro invece di aggiungerlo
- **Il budget di righe è un allarme, non un limite.** Se lo stai raddoppiando, stai risolvendo un
  problema diverso da quello descritto: dillo invece di continuare
- **Fuori scope vuol dire fuori scope**
- **Ogni test nuovo va rotto di proposito almeno una volta.** Un test che non si è mai visto
  fallire non è una rete, è una decorazione
- `npm run verify` verde alla fine, con l'**output incollato**. Non «dovrebbe passare»
- **Le schermate che tocchi vanno guardate**, nei due temi, con l'interruttore in fondo alla
  colonna. Il modo sta in _Come si guarda l'applicazione senza toccarla_
- Niente `TODO`, niente `any`, niente scorciatoie presentate come soluzioni. Identificatori in
  inglese, prosa in italiano
- **Chiudere la delega significa rigenerare `docs/stato.md`**:
  `npx vitest run tests/rules/project-state -u`. Se non lo fai, il gate è rosso — ed è voluto (C11)
- **Se sposti un confine fra livelli, il diagramma di `docs/architettura.md` cambia nello stesso
  commit**, e `tests/rules/import-graph` lo verifica nei due versi (C13)
- Alla fine, in fondo alla delega: le **correzioni** rispetto a com'era scritta, e il consuntivo di
  righe contro il budget. Ogni delega chiusa ne ha da quattro a diciassette
```

### E dopo, la fetta 03

La fetta 03 comincia da una **scheda compilata** invece che da una schermata immaginata, ed è la
differenza che [D018](D018-la-scheda-di-dominio.md) è servita a fare: il modulo sta in
[design/domini/README.md](../design/domini/README.md), e un dominio nuovo lo compila **prima** che
qualcuno ne scriva una riga.

Le tre cose da avere in mente prima di scrivere quella riga stanno qui sopra, in fondo a _Il
prossimo passo_. Una quarta è arrivata con D018 e va tenuta con le altre: **la forma va rivista alla
quarta scheda compilata**, non prima — due sezioni oggi non discriminano, e con tre casi non si può
sapere se sia un difetto della forma o il campione.
