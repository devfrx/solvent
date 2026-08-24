# D041 — Il salvataggio ha una cadenza, e non è un secondo orologio

- **Stato:** **Chiusa** — commit `a351000`, ramo `d041-il-salvataggio-ha-una-cadenza`, che parte da
  `main`. Scritta ed
  eseguita il 2026-08-24, nella stessa sessione. Le tre decisioni aperte sono state prese **in
  autonomia** su direttiva generale dell'utente, e sono **contestabili**: vedi _Le correzioni_
- **Stato precedente:** **Aperta** — scritta il 2026-08-24, non eseguita. Il ramo parte da `main`:
  dal 2026-08-21 i rami di lavoro si fondono e si cancellano, quindi il punto di partenza è `main`
  appena la delega a monte è chiusa, e [D040](D040-il-recupero-avanza-a-blocchi.md) lo è
- **Dipende da:** [D040](D040-il-recupero-avanza-a-blocchi.md), che ha costruito il gancio — una via
  unica che cammina a blocchi; [D009](D009-persistenza-main.md), che ha portato la scrittura atomica
  e i tre canali IPC; [D011](D011-runtime-e-store.md), che ha portato il loop e l'unico chiamante
  che oggi scrive
- **Sblocca:** niente di scritto. È la delega che **chiude la fetta 03**
- **ADR vincolanti:** [0004](../adr/0004-il-main-e-proprietario-del-contratto-di-salvataggio.md) — il
  contratto del salvataggio è del main, e questa delega non lo tocca;
  [0049](../adr/0049-il-mondo-avanza-a-blocchi.md) — il blocco è dell'operazione;
  [0043](../adr/0043-il-tempo-che-avanza-e-un-operazione-del-gioco.md) — una sola via per avanzare;
  [0001](../adr/0001-simulazione-nel-renderer-core-puro.md) — un solo file tocca il browser;
  [0016](../adr/0016-il-bus-e-sincrono-e-fire-and-forget.md) — l'asincronia sta al confine col
  sistema operativo, non dentro
- **Non tocca:** l'[ADR 0010](../adr/0010-liste-storiche-limitate-alla-definizione.md), che resta
  `Proposta` per la quarta fetta di fila — una cadenza non è una lista storica, e nessuna serie
  entra nel salvataggio; e l'[ADR 0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md),
  che resta `Proposta`
- **Produce:** l'[ADR 0050](../adr/0050-la-cadenza-sta-sulla-via-unica.md) — _la cadenza sta sulla
  via unica, e si consuma in un posto solo_ — e l'invariante **INV-25**, _mai due scritture in volo
  insieme_. L'ADR serve per la ragione dell'ADR 0049: senza, qualcuno la «semplificherà» spostandola
  nel chiamante
- **Regole:** R01 (nessuno store importa ciò che gli sta accanto), R04 (niente numeri di gioco fuori
  da `balance/`), R05, R08 (il contratto è del main), R25 (una sola via per avanzare), INV-03,
  INV-16 (il preload resta tre funzioni), INV-17 (si scrive solo da una partita vera)
- **Budget:** dichiarato **per ramo** in _Le tre decisioni aperte_, ed è la lezione di
  [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md). Dichiarato ~200 righe per il ramo
  consigliato, **misurato 234** — 52 di codice e 182 di test. Lo sforamento e la riga sbagliata
  dentro questa dichiarazione stanno nella correzione 8

## Obiettivo

Che chiudere male la finestra non costi la partita.

## Perché esiste

**Oggi c'è un solo momento di salvataggio, e la tabella lo dice a chiare lettere.** In
[ciclo-di-vita.md](../design/ciclo-di-vita.md), sotto _Quando si salva_: «a intervalli regolari —
no — fetta 03, insieme al progresso offline: sono lo stesso problema». Quella riga aspetta questa
delega. Nella tabella ce ne sono **due** che dicono `no`, e la differenza conta: l'altra — il
salvataggio su richiesta — aspetta «una schermata che lo offre», cioè qualcosa che nessuno ha
ancora deciso di disegnare, mentre questa aspetta una fetta che è **in corso**.

**Il salvataggio unico non è un difetto della fetta 01: era una scelta**, e la sua motivazione sta
scritta accanto alla tabella — _«rende il round-trip un percorso unico e verificabile, invece di tre
percorsi che devono coincidere»_. Il percorso è stato costruito, provato e attraversato per otto
fette di lavoro. Adesso ce ne può essere un secondo, perché il primo esiste e funziona.

**Cosa si perde oggi, esattamente.** `close()` in [stores/game.ts](../../src/renderer/stores/game.ts)
è l'unico posto che scrive, e a chiamarlo è `host.onClosing`, che è un `beforeunload`. Copre la
chiusura della finestra. Non copre un crollo del renderer, un processo terminato, un blackout, né
un `Termina attività`: in tutti quei casi `beforeunload` non arriva affatto, e l'intera sessione di
gioco resta in memoria e sparisce con lei.

**E il progetto pratica già il caso cattivo, di proposito.** Chiudendo
[D040](D040-il-recupero-avanza-a-blocchi.md) l'applicazione è stata **terminata** invece che chiusa,
per non salvare la partita di prova sopra quella dell'utente. È scritto nel passaggio di consegne
come una precauzione, ed è anche una misura: il progetto sa che l'applicazione si termina, e sa che
in quel caso la partita si perde.

## Il gancio che D040 ha costruito, e cosa esattamente ci sta sopra

Questa sezione esiste perché il [registro YAGNI](../roadmap-fette.md) dichiara che salvataggio a
intervalli e progresso offline sono «lo stesso problema», e la frase è vera a metà. Sapere **quale
metà** cambia cosa si costruisce, e non saperlo costa il primo ramo scritto.

**È vera del gancio.** `Game.advance` è l'unica via per far passare il tempo (ADR 0043, R25) e da
D040 cammina a blocchi (ADR 0049): c'è un posto solo dove passa ogni tick di questa partita, e
qualunque cosa debba succedere «ogni N tick» ha già dove attaccarsi. La primitiva della cadenza
esiste anche lei, ed è pura: `sampleOf(pending, elapsed, every)` in
[runtime/loop.ts](../../src/renderer/runtime/loop.ts), lo stesso accumulatore di `stepOf` un piano
più su, già usato da tutte e tre le registrazioni della cronaca.

**È falsa dell'unità, e va saputo prima di scegliere il ramo.** La durabilità si misura in **tempo
reale** — «se il gioco muore adesso, quanto gioco ho perso» — e i blocchi sono **tempo di gioco**.
Mentre si gioca le due cose sono proporzionali: dieci tick sono un secondo reale, quindi una cadenza
contata sui tick è una cadenza contata sui secondi. Durante un recupero non lo sono più: al tetto
pieno passano 7.300 tick in **meno di tre millisecondi** (misurato da D040, in
[qualita.md](../qualita.md)). Una cadenza da un minuto, contata sui tick, sarebbe «ora» **dodici
volte in tre millisecondi**.

Ne discendono due cose, e la seconda sembra una perdita e non lo è.

**1 · Qualunque ramo conti i tick deve coalizzare.** Dodici «è ora» sono **un** salvataggio, non
dodici. Non è un'ottimizzazione: dodici round-trip IPC dentro il caricamento sono precisamente il
tempo di avvio che il tetto di recupero esiste per proteggere, e questa delega non ha il permesso di
spenderlo — è la trappola 5 di D040 con un altro vestito.

**2 · Non salvare durante un recupero non perde niente**, e va scritto perché l'istinto dice il
contrario. Un recupero è **ripetibile**: parte da `savedAt`, chiama `stepOf` e produce lo stesso
stato ogni volta che lo si rifà. Chi crolla subito dopo un recupero riapre, recupera di nuovo dallo
stesso istante, e torna dove era. Ciò che il recupero ricostruisce non è gioco che si può perdere:
è gioco che non è ancora stato giocato.

**E una proprietà che vale un ramo intero: a finestra nascosta il gioco è fermo.** Il browser non
chiama il frame, quindi non passano tick, quindi non cambia niente. Una cadenza contata sui tick si
**mette in pausa da sé**, esattamente quando non c'è nulla di nuovo da scrivere. Un timer di
orologio reale no: continuerebbe a scrivere sul disco lo stesso salvataggio identico, tutta la notte.

## Le tre decisioni aperte

Nessuna si prende dentro questa delega senza dirlo. Ognuna porta il suo budget, e la prima cambia la
forma di tutto il resto.

### Decisione 1 — dove vive la cadenza, e quale orologio conta

**Ramo 1A (consigliato) — la cadenza sta sulla via unica.** Una primitiva piccola in `runtime/` che
riceve i tick e risponde a una domanda sola — _è ora?_ — alimentata da `Game.advance` accanto alla
cronaca, e **consumata** dallo store, che è l'unico che ha `saveApi` sotto mano.

- La coalizione è gratis: _è ora_ è un booleano, e dodici volte vero è vero una volta. Il recupero
  produce **una** scrittura, e arriva al primo frame dopo — lo stesso in cui `recovering` diventa
  `playing`.
- Ogni chiamante futuro la eredita senza saperlo: il calendario dell'ADR 0023, un cheat che salta
  un'ora, qualunque cosa faccia passare del tempo.
- `advance` resta **sincrono** e non impara cosa sia un disco: la cadenza dice _quando_, e il
  payload si costruisce dove si scrive. È la stessa divisione della cronaca, che sa che c'è un
  numero da guardare e non sa cosa sia un grafico.
- Budget: **~200 righe**, di cui ~25 in `runtime/cadence.ts`, ~10 in `createGame.ts`, ~15 in
  `balance/`, ~30 nello store, il resto test.

**Ramo 1B — la cadenza sta nello store, sui tick che il loop consegna.** `loop.onStep` riceve già
`step.elapsed` a ogni frame: la cadenza si conta lì, e `advance` non cambia di una riga.

- Più corto oggi, e per il paragrafo _2_ qui sopra **non perde niente**: non copre il recupero, e il
  recupero non è gioco che si può perdere.
- Costa la proprietà, non la correttezza: è un secondo posto che sa una cadenza, e il giorno in cui
  qualcuno fa passare del tempo **senza** passare dal frame — un cheat che salta un'ora, il
  calendario — quel posto non lo vede. **E nessun gate lo vedrebbe**: R25 guarda chi nomina
  `tickAll`, e una cadenza non lo nomina. È la forma esatta del difetto che D037 ha chiuso — due
  sequenze scritte a mano che facevano cose diverse — con l'aggravante che qui la regola che
  dovrebbe accorgersene resta verde.
- Budget: **~150 righe**.

**Ramo 1C — un timer di orologio reale.** Scartato, e scritto per non riproporlo. `setInterval` vive
nel browser, e il browser sta in un file solo (ADR 0001): sarebbe un ingresso nuovo in `host.ts` per
una cosa che il gioco sa già contare. A finestra nascosta scriverebbe salvataggi identici mentre il
gioco è fermo. E due orologi che misurano la stessa partita prima o poi divergono, che è la ragione
per cui `now` e `wallClock` sono due funzioni con due commenti che spiegano perché non si scambiano.

**Perché 1A.** La domanda non è dove costa meno scrivere la cadenza: è di chi è la responsabilità di
sapere che il tempo è passato. Se è del chiamante, ogni chiamante può dimenticarsela in silenzio, e
la regola che dovrebbe accorgersene — R25 — resterebbe **verde** mentre la sua ragione viene
aggirata. È il ragionamento con cui D040 ha scelto il proprio ramo 1A, applicato alla cosa che D040
ha dichiarato di sbloccare.

### Decisione 2 — ogni quanto

**Il numero va derivato, non scelto.** Il criterio è uno: quanto gioco è accettabile perdere se il
gioco muore adesso. Chi esegue lo propone all'utente con i conti in mano, come D040 ha fatto per il
tetto di recupero.

I conti che servono, e sono corti. Al reddito base di 12,00 €/s un minuto di gioco vale
**720,00 €** — cioè meno del caveau di partenza, quindi un minuto perso è meno di un ampliamento;
trenta secondi ne valgono 360,00 €. Dall'altro lato una scrittura è un round-trip IPC più un
`rename`: a un minuto sono sessanta scritture in un'ora di gioco, a trenta secondi centoventi.

Il numero sta in `balance/` (R04) ed è dichiarato in **secondi**, convertito con il Clock come già
fanno `NET_WORTH_SAMPLE_SECONDS` e `INSTRUMENT_CANDLE_SECONDS`: scritto in tick a mano sarebbe la
frequenza dei tick riscritta in un secondo posto, cioè il difetto A04.

Budget: ~15 righe, identico in tutti i rami. Il numero non cambia la forma del codice — cambia
quanto si perde, ed è per questo che è una decisione e non un dettaglio.

### Decisione 3 — cosa succede se una scrittura a cadenza fallisce

**Ramo 3A (consigliato) — non si va in `failed`.** Si riprova alla cadenza successiva, e la partita
non si interrompe.

- La ragione è la stessa che rende `close()` severo: là una scrittura fallita **ha** perso qualcosa,
  perché la finestra sta chiudendo e quella è l'unica copia. Qui non ha perso niente — la partita è
  in memoria, il gioco continua, e la chiusura riproverà comunque.
- Il giocatore lo vede già senza che si disegni niente: `savedAt` è a schermo, in
  [StatsView.vue](../../src/renderer/views/StatsView.vue) sotto il riquadro «Ultimo salvataggio»
  (`stats.saved_at.*`). Se smette di avanzare, quel riquadro **è** il sintomo.
- **Il rischio va dichiarato invece di scoprirlo:** un fallimento silenzioso e ripetuto è peggio di
  nessun salvataggio a cadenza, perché il giocatore crede di essere protetto. Il minimo onesto è
  che `savedAt` non avanzi, e quello si vede. Se serve di più — un'indicazione nella testata — è una
  decisione sull'interfaccia e non su questa cadenza: si pone prima di disegnarla, non dopo.

**Ramo 3B — si va in `failed` come alla chiusura.** Un percorso solo per tutti gli errori di
scrittura, e nessuna decisione da prendere. Interrompe la partita per un guasto che non ha ancora
perso niente, e il primo disco pieno butta il giocatore in una schermata d'errore mentre stava
giocando.

Budget: ~20 righe, identico nei due rami.

## Da produrre

| File                                     | Cosa                                                                              |
| ---------------------------------------- | --------------------------------------------------------------------------------- |
| `src/renderer/runtime/cadence.ts`        | la cadenza: riceve tick, dice se è ora, si azzera. Pura (ramo 1A)                 |
| `src/renderer/runtime/createGame.ts`     | `advance` la alimenta, `Game` la espone, `reset` e `load` la azzerano (ramo 1A)   |
| `src/core/balance/constants.ts`          | ogni quanto, in secondi, con la derivazione accanto e non il solo valore          |
| `src/renderer/stores/game.ts`            | chi consuma la cadenza e scrive, la guardia di INV-17 e quella contro la corsa    |
| `tests/renderer/runtime/cadence.test.ts` | la cadenza: il resto, la coalizione, l'azzeramento                                |
| `tests/renderer/store.test.ts`           | che si scriva a cadenza, mai da uno stato non autoritativo, mai due volte insieme |
| `docs/design/ciclo-di-vita.md`           | la riga «a intervalli regolari» della tabella _Quando si salva_ diventa **sì**    |
| `docs/design/flusso-salvataggio.md`      | il salvataggio ha due momenti, e quel documento ne descrive uno                   |
| `docs/roadmap-fette.md`                  | la voce del registro YAGNI e la riga della fetta 03                               |

**Nessun file nuovo sotto `src/main/`, e non è una dimenticanza.** Il contratto del salvataggio è del
main (ADR 0004, R08) e questa delega non lo tocca: `SavePayload` resta quello che è, la busta pure,
lo schema pure. Il main non sa se lo stanno chiamando alla chiusura o a metà partita, e non deve
saperlo — riceve un payload e lo scrive. **Il preload resta tre funzioni** (INV-16): non serve un
quarto canale, perché `save` è già quello giusto.

## Invarianti

1. **Non si scrive se non è la partita vera** (INV-17). `isAuthoritative()` esiste già ed è la stessa
   guardia di `close()`: non se ne scrive una seconda. Da `startup`, da `loading` e da `failed` per
   un caricamento fallito, quello che c'è in memoria non è la partita di nessuno — e scriverlo
   cancellerebbe il salvataggio del giocatore proprio mentre la schermata d'errore gli promette che
   il file non è stato toccato.
2. **Mai due scritture in volo.** Una cadenza che scatta mentre `close()` sta scrivendo manda sul
   disco due payload in un ordine che nessuno garantisce. Il `rename` atomico del main protegge dal
   file troncato, **non** dal payload più vecchio che arriva secondo. Se questa merita un ID globale
   è INV-25, e a deciderlo è se il test che la prova esiste davvero — non questa riga.
3. **Il salvataggio non cambia forma.** Nessun campo nuovo, nessuna migrazione, `SAVE_VERSION` non si
   muove. La politica di versionamento in [flusso-salvataggio.md](../design/flusso-salvataggio.md) ha
   sei righe e questa delega non ricade in nessuna: non aggiunge, non rinomina, non cambia tipi, non
   toglie, non registra un sistema nuovo.
4. **Nessun numero di gioco fuori da `balance/`** (R04), e la conversione resta del Clock.
5. **Una sola via per avanzare** (R25) resta verde **e** la sua ragione resta intatta: nel ramo 1A la
   cadenza sta sulla via, non accanto.
6. **Il tempo reale non rallenta.** Una scrittura è asincrona e non blocca il frame. Se il loop perde
   tick quando la cadenza scatta, il ramo è sbagliato — e a dirlo è un conto dei tick, non un'occhiata.

## Fuori scope

- **Salvare su richiesta dell'utente.** La tabella di [ciclo-di-vita.md](../design/ciclo-di-vita.md)
  la mette a «quando esisterà una schermata che lo offre», e questa delega non la crea.
- **Salvare a ogni transazione.** «Mai» nella stessa tabella, e la ragione è nella stessa riga:
  dieci scritture al secondo.
- **Le serie nel salvataggio.** L'ADR 0010 resta `Proposta`: a farlo passare sono gli oggetti del
  blocco A, e una cadenza non è una lista storica.
- **La prima migrazione.** Il payload non cambia, quindi non c'è nulla da migrare. Il runner esiste
  già da D009 e si prova con migrazioni finte.
- **Un indicatore nuovo nell'interfaccia.** Vedi decisione 3: `savedAt` è già a schermo, e disegnare
  una spia nuova è una decisione sull'interfaccia che va posta, non presa qui.
- **Salvataggi multipli o slot.** Registro YAGNI, con il suo grilletto: «una ragione di gioco per più
  partite parallele».
- **Recuperare da un crollo a metà scrittura.** Il file temporaneo più `rename` lo copre da D009, e
  questa delega non lo ridiscute.
- **Rendere `loadAll` atomico.** Ha il suo grilletto nel registro YAGNI e non è questo: una cadenza
  scrive, non carica.

## Definizione di fatto

- [ ] `npm run verify` e `npm run verify:release` verdi, `docs/stato.md` rigenerato.
- [ ] Un test che fa passare N secondi di gioco e **conta le scritture**: N diviso la cadenza, non
      una in più.
- [ ] Un test che il resto non si perde: due avanzamenti che sommati superano la cadenza la fanno
      scattare una volta, e ciò che avanza torna indietro. È il difetto che `stepOf` documenta, un
      piano più su.
- [ ] Un test che un recupero al tetto pieno produce **una** scrittura, non dodici. È il test che
      giustifica la coalizione: senza di lui il ramo 1A è un difetto invece di una scelta.
- [ ] Un test che da `startup`, da `loading` e da `failed`-per-caricamento **non si scrive**, e che
      usa la stessa guardia di `close()` invece di una copia (INV-17).
- [ ] Un test che una cadenza che scatta mentre `close()` è in volo non produce una seconda scrittura.
- [ ] La costante nuova ha accanto la **derivazione**, non il valore soltanto.
- [ ] La cadenza è azzerata da `reset` e da `load`, e c'è un test: la prima scrittura di una partita
      nuova non arriva a un istante ereditato da quella prima.
- [ ] La tabella _Quando si salva_ dice il vero, e `flusso-salvataggio.md` non descrive più un solo
      momento.
- [ ] La finestra vera guardata con `scripts/cdp.mjs`: il riquadro «Ultimo salvataggio» della schermata Statistiche
      **avanza da sé** mentre si gioca, senza chiudere niente. È la prima verifica a occhio di questo
      progetto che si fa **non** facendo un gesto — e per questo va letta nel documento, non in
      un'immagine.
- [ ] Le correzioni rispetto a com'era scritta questa delega, in fondo. Se esce senza, o era
      perfetta o non è stata letta con attenzione.

## Trappole note

1. **La cadenza in tick e la durabilità in secondi coincidono solo mentre si gioca.** Dieci tick sono
   un secondo reale a partita in corso, e non lo sono in un recupero: 7.300 tick passano in meno di
   tre millisecondi. Ne discende una cosa sui test: chi prova la cadenza con **un** `advance` grande
   misura la coalizione e non la cadenza; chi la prova con tanti `advance` piccoli misura la cadenza e
   non la coalizione. Servono tutti e due, e sono due test.
2. **`beforeunload` non arriva sempre, ed è il motivo per cui questa delega esiste.** `host.onClosing`
   è un `beforeunload`: copre la chiusura della finestra e nient'altro. Chi pensasse «tanto si salva
   alla chiusura» sta descrivendo il caso buono, e il progetto ha già praticato quello cattivo di
   proposito — vedi _Perché esiste_.
3. **Una scrittura è asincrona dentro un ciclo sincrono.** `Game.advance` è sincrono, `saveApi.save`
   ritorna una `Promise`. Se il payload si costruisse dentro `advance` e si scrivesse dopo, il tempo
   continuerebbe a passare nel frattempo e sul disco finirebbe uno stato che non è né quello di prima
   né quello di dopo. La cadenza dice **quando**; il payload si costruisce **dove si scrive**, in una
   riga sola.
4. **`savedAt` è già a schermo, e diventa la spia di questa delega.** È anche l'unica verifica che si
   fa stando fermi: si apre il gioco, non si tocca niente, e quel numero deve muoversi. Un
   `Runtime.evaluate` lo dice, un'immagine no.
5. **Il salvataggio dell'utente su questa macchina è vero, e questa delega lo sovrascrive da sé.**
   `%APPDATA%/solvent/save.json`. D040 lo ha copiato, retrodatato e ripristinato identico, e ha
   **terminato** l'applicazione invece di chiuderla per non scriverci sopra. Con una cadenza attiva
   quella precauzione non basta più: si scrive **senza** che nessuno chiuda niente. Si prova con
   `--user-data-dir`, e qui non è un consiglio.
6. **La cadenza sopravvive a un reset se nessuno la azzera.** `reset(scope)` azzera il Ledger, il
   Registry e la cronaca, in quell'ordine e per ragioni scritte accanto a ciascuno. Una cadenza
   dimenticata farebbe arrivare la prima scrittura di una partita nuova a un istante ereditato dalla
   partita di prima. Vale anche per `load`: la riga va scritta insieme alle altre tre, non dopo — ed
   è lo stesso posto in cui la cronaca era stata dimenticata prima di D037.
7. **La finestra nascosta non compone frame**, ed è la trappola che vale al contrario di come si è
   imparata. Con la porta di ispezione aperta la pagina è `hidden`, quindi non passano tick e la
   cadenza **non scatta**: guardare questa delega a finestra nascosta darebbe zero scritture e
   sembrerebbe un difetto. È l'opposto del recupero, che si guarda proprio lì perché non passa dal
   frame (D040, trappola 4).

## Le correzioni rispetto a com'era scritta

Undici, e le prime tre sono le decisioni che la delega lasciava aperte. Sono state prese **in
autonomia** su direttiva generale dell'utente — «coerenza, zero debiti futuri, professionalità, stato
dell'arte odierno, non pigrizia, non necessariamente la soluzione più invasiva» — e per la regola di
_Come si lavora_ sono **contestabili**: chi vuole ridiscuterle trova qui il conto che le ha decise.

1. **Decisione 1 — ramo 1A, la cadenza sulla via unica.** È quello che la delega consigliava, e non
   per obbedienza: il ramo 1B lasciava R25 verde mentre la sua ragione veniva aggirata, e questa
   volta in modo peggiore del solito — R25 guarda chi nomina `tickAll`, e una cadenza non lo nomina,
   quindi non c'era nemmeno un gate a cui mentire. Il costo del ramo consigliato è **28 righe** di
   `runtime/cadence.ts` più sette di `createGame.ts`: la parola «invasiva» non si applica. La
   decisione ha il suo [ADR 0050](../adr/0050-la-cadenza-sta-sulla-via-unica.md).
2. **Decisione 2 — trenta secondi**, `AUTOSAVE_SECONDS = 30`. Derivato invece che scelto: il criterio
   è che ciò che si può perdere resti sotto la cosa più economica che il gioco vende — 800,00 €,
   l'upgrade del reddito — al reddito **massimo** che il gioco raggiunge. Il massimo è 18,00 €/s e
   non 12,00 €, perché l'upgrade è un `boolean` e si compra una volta sola: la soglia è **44
   secondi**. Trenta ci stanno con margine — 540,00 € al massimo, 360,00 € alla base — e il margine
   non è prudenza generica: è ciò che tiene il criterio in piedi quando entrerà un moltiplicatore
   nuovo, invece di farlo scadere in silenzio come è successo al tetto tarato in ore reali. Costa
   120 scritture in un'ora di gioco.
3. **Decisione 3 — ramo 3A, una scrittura a cadenza che fallisce non interrompe la partita.** Il
   sintomo esiste già e non si è disegnato niente: `savedAt` è a schermo sotto «Ultimo salvataggio».
   Il rischio dichiarato — un fallimento silenzioso e ripetuto è peggio di nessuna cadenza — è
   diventato una **voce nuova del [registro YAGNI](../roadmap-fette.md)** con un grilletto che non è
   un'ipotesi: _il primo fallimento visto davvero_. Prima di allora non si sa se il caso da coprire è
   il disco pieno, il permesso negato o il file in uso, e sono tre frasi diverse.
4. **Ventiquattro soglie, non dodici.** La delega faceva il conto su una cadenza da un minuto —
   7.300 tick diviso 600 — e con trenta secondi diventa 7.300 diviso 300. Il numero nella prosa della
   delega era un'ipotesi e resta corretto come tale; nei commenti del codice e nell'ADR è
   **ventiquattro**, perché là descrive ciò che il codice fa davvero.
5. **Il percorso del test non era quello.** La delega diceva `tests/renderer/runtime/cadence.test.ts`;
   il repo tiene i test dei file di `runtime/` **piatti** in `tests/renderer/` — `chronicle.test.ts`,
   `candles.test.ts`, `loop.test.ts`. È `tests/renderer/cadence.test.ts`, e la convenzione del repo
   vince su quella che la delega aveva immaginato.
6. **La guardia di INV-17 non è raggiungibile da nessuno stato, e resta.** La definizione di fatto
   chiedeva un test che da `startup`, `loading` e `failed`-per-caricamento non si scrivesse: quel test
   **non si può scrivere passando dal gioco**, perché a `writeAtCadence` ci si arriva solo da
   `loop.onStep`, e il loop gira solo dopo `play()` — `playing`, `suspended` e `recovering` sono tutti
   e tre autoritativi, e da `closing` il loop è già fermo. La guardia è scritta comunque, per la
   ragione che `close()` porta accanto alla propria: la precondizione appartiene a chi sa **cosa** sta
   per scrivere. Al posto del test impossibile ce n'è uno che prova il meccanismo vero — dopo
   `close()` nessun frame scrive più, perché il loop è fermo — e il codice porta scritto che la
   guardia oggi non scatta, invece di lasciarla sembrare una difesa attiva.
7. **`Game` espone una funzione, non l'oggetto `Cadence`.** Non era nella delega e discende da una
   regola che il progetto ha già: `Series` espone `list()` e non la lista, «così chi legge non si
   tiene una fotografia credendo di avere la serie». Con la `Cadence` in mano, una riga scritta nello
   store la desincronizzerebbe dal tempo di gioco senza che nulla lo dica.
8. **Il budget: 234 righe contro ~200 dichiarate, e una riga della dichiarazione era sbagliata in
   partenza.** Misurato col metodo di `projectState.ts` — commenti e righe vuote escluse — sono **52
   di codice e 182 di test**. Lo sforamento è dei test, ed è il genere giusto. La riga sbagliata è
   «di cui meno di quaranta fuori dai test»: contraddiceva la ripartizione scritta quattro righe più
   sotto nella stessa delega, che ne prevedeva ottanta. Il vero è 52 — `cadence.ts` 28, lo store 15,
   `createGame.ts` 7, `balance/` 2 — quindi le stime per lo store e per `balance/` erano il doppio
   del necessario.
9. **La posizione di `saveCadence.advance` dentro il ciclo dei blocchi non è provata da nessun test, e
   va detto.** Spostarla fuori, con un `advance(elapsed)` dopo il ciclo, lascia **tutti** i 113 test
   verdi: è stato misurato di proposito. I due sono equivalenti per un booleano, e c'è un test che
   asserisce proprio quell'equivalenza. Sta dentro il ciclo per un argomento di disegno — la cadenza
   vede esattamente il tempo che vedono i sistemi e la cronaca, e non una seconda idea di quanto tempo
   è passato — non per una proprietà verificata. Il giorno in cui una cadenza dovrà contare **quante**
   volte è scattata, la posizione comincerà a contare e il test comincerà a discriminare.
10. **`ciclo-di-vita.md` ha perso una colonna che era diventata falsa.** La tabella _Quando si salva_
    intestava «In questa fetta», scritto quando le fette erano una: con una riga che passa a `sì`
    nella fetta 03 quella colonna non voleva più dire niente. Adesso è «Esiste». Non era nella lista
    dei file da toccare, ed è la regola di sempre — si rileggono i documenti vivi che **nominano** ciò
    che hai cambiato, non solo quelli che la delega elencava.
11. **Il ramo è stato provato rompendolo sei volte, e il conto sta qui.** Il `||` della coalizione
    ridotto a `=`: 3 test. Il `take` che non azzera: 3. Il `clear` che dimentica il resto: 2. Il
    `reset` che non azzera la cadenza: 1. La chiusura che non aspetta la scrittura in volo: 1. La
    cadenza mai alimentata: 5. Più un **controllo** che doveva restare verde ed è restato — la
    posizione fuori dal ciclo, correzione 9. I tre file sono stati copiati prima e ripristinati con un
    `diff` che conferma l'identità.

12. **Due documenti di struttura non nominavano il file nuovo, e nessun gate poteva vederlo.**
    `architettura.md` elencava i file di `runtime/` in due punti — il nodo del diagramma e l'albero
    delle cartelle — e `cadence.ts` non c'era in nessuno dei due; `flusso-tick.md` disegnava il
    blocco di `advance` con due nodi invece di tre. `tests/rules/import-graph` era **verde e aveva
    ragione**: sceglie il nodo per **prefisso**, quindi un file nuovo dentro una cartella già
    mappata non lo fa diventare rosso — è la correzione 1 di
    [D026](D026-dove-si-attacca-un-dominio.md) che torna. Trovati rileggendo, non da un gate, e
    corretti chiudendo. È la stessa classe della correzione 10, e il fatto che siano due in una
    delega sola dice che è la classe più facile da lasciare indietro.

### Cosa è stato guardato nella finestra vera

Con `scripts/cdp.mjs`, e con `--user-data-dir` su una cartella dello scratchpad. **Quella precauzione
qui non è un consiglio:** con una cadenza attiva il gioco scrive da sé, senza che nessuno chiuda
niente, quindi la sola cosa che protegge il salvataggio dell'utente è non farsi dare quella cartella.
Verificato dopo: il `save.json` vero è rimasto al **22 agosto**, due giorni prima di questa sessione.

- **Il riquadro «Ultimo salvataggio» è passato da «Mai: questa partita non è ancora stata scritta su
  disco» a «24/08/2026, 09:08», senza che nessuno chiudesse la finestra.** È la prima verifica a
  occhio di questo progetto che si fa **non** facendo un gesto: si apre il gioco, non si tocca
  niente, e quel numero deve muoversi.
- **Il file su disco esiste e la busta è valida**, che è più di quanto dica lo schermo: un payload che
  lo schema `zod` del main rifiuta **non viene scritto** (D009), quindi la sua esistenza è la prova
  che ha attraversato il confine intero. Dentro c'era `cash: "1000"` — il caveau di partenza pieno,
  cioè anche il muro della fetta 02 al lavoro.
- **La cadenza è una cadenza e non un caso isolato:** `savedAt` sul disco è passato da
  `1787555218723` a `1787555337557`, cioè da 09:06:58 a 09:08:57. Sono **119 secondi** con una cadenza
  da trenta: le scritture sono state più di una, e a dirlo è il file e non un'impressione.
- **Una trappola confermata, e vale il contrario di quello che sembra comodo:** a finestra nascosta
  non passano tick, quindi la cadenza **non scatta**. Il saldo è rimasto fermo a 387,60 € per quindici
  secondi di orologio vero, campionato tre volte. È la trappola 7 di questa delega, misurata invece
  che creduta — e per vedere la cadenza scattare bisogna che la finestra componga frame.
- **`node node_modules/electron/install.js` è davvero obsoleto**, come la sesta sessione aveva
  scritto: `npm ci` non scarica il binario, e `node -e "require('electron')"` lo scarica al primo
  `require`. È la prima delega a ripagare quella riga invece di riscoprirla.
