# ADR 0043 — Il tempo che avanza è un'operazione del gioco, non una sequenza del loop

- **Stato:** **Accettata** — [D037](../delega/D037-il-tempo-che-avanza-e-un-operazione-del-gioco.md):
  `Game.advance` esiste, `registry.tickAll` ha un chiamante solo in tutto il renderer, e **R25** in
  `tests/rules/one-way-to-advance` è stata vista rossa rimettendo il secondo percorso dentro
  `recover()`
- **Data:** 2026-08-23
- **Non tocca:** [ADR 0009](0009-passo-fisso-e-tipi-branded-per-il-tempo.md) né
  [ADR 0002](0002-registry-unica-lista-di-sistemi.md), che restano integri: il passo resta fisso, e
  il Registry resta l'unica lista di sistemi
- **Origine:** una richiesta dell'utente — «i grafici usano un metodo di aggiornamento a sé stante,
  che ignora i tick del kernel; risolverlo alla radice e non come toppa» — che, cercata nel codice,
  è risultata essere un difetto misurabile e non una preferenza

## Contesto

Il `Game` che [D011](../delega/D011-runtime-e-store.md) ha costruito espone tre operazioni che
riguardano **tutta** la partita: `save`, `load`, `reset`. Ognuna compone i pezzi che la partita ha —
il Ledger, l'Rng, il Registry — in un ordine dichiarato, in un posto solo.

La quarta cosa che riguarda tutta la partita non ce l'aveva: **il tempo che passa**. Al suo posto
c'era `registry.tickAll(ctx, elapsed)`, chiamato da due punti dello store:

- `loop.onStep`, il passo del frame, che ticchettava **e** campionava le tre serie del cruscotto;
- `recover()`, il recupero all'avvio, che ticchettava e basta.

Due sequenze scritte a mano per lo stesso fatto — _è passato del tempo di gioco_ — e già divergenti.
Il prezzo era misurabile e visibile a schermo: chi chiudeva il gioco e lo riapriva dopo una notte
faceva passare fino a otto ore di gioco (`RECOVERY_CAP`) senza che venisse chiuso un intervallo,
quindi i tre grafici ripartivano vuoti come se non fosse successo niente. Nella stessa sessione i
domini incassavano invece tutto l'arretrato: il gioco sapeva che quel tempo era passato, le sue
serie no.

Non era nemmeno una svista silenziosa. Il commento di `sampleOf`, in
[runtime/loop.ts](../../src/renderer/runtime/loop.ts), la descriveva al contrario:

> «Il tetto del recupero produce un campione solo, non millecinquecento. Tornare dopo otto ore
> arriva qui come un `elapsed` enorme…»

A quel codice il recupero non arrivava mai. Il documento vincolante del tick,
[design/flusso-tick.md](../design/flusso-tick.md), non nominava affatto le serie: chi leggeva il
disegno del loop non poteva accorgersene.

**È il difetto A01 nella sua forma più corta.** L'audit del progetto precedente lo aveva contato
come cinque liste parallele — tick, save, load, reset, stats — mantenute a mano, e l'ADR 0002 lo
chiude **dentro** il gioco facendo iterare al Registry una lista sola. Qui la stessa forma è tornata
un piano più su: non due liste di sistemi, ma due sequenze di «cosa succede quando il tempo passa».

## Decisione

**`Game` guadagna la quarta operazione: `advance(elapsed: Ticks)`.** È l'unico modo in cui il tempo
di gioco avanza.

```ts
advance: (elapsed) => {
  registry.tickAll(ctx, elapsed)
  chronicle.advance(elapsed)
}
```

Sta accanto a `save`, `load` e `reset` e ha la loro stessa forma: compone i pezzi della partita in
un ordine dichiarato, in un posto solo. L'ordine non è indifferente — prima i sistemi, poi la
cronaca — perché il Bus è sincrono ([ADR 0016](0016-il-bus-e-sincrono-e-fire-and-forget.md)): quando
`tickAll` ritorna, le transazioni del tick sono già state annunciate, e un campione preso prima
porterebbe sempre il gioco di un passo fa.

Il loop e il recupero chiamano **questa**, e nessuno dei due sa più cosa succede dentro un passo.

### La cronaca

Ciò che era distribuito fra gli accumulatori dello store diventa un pezzo suo,
[runtime/chronicle.ts](../../src/renderer/runtime/chronicle.ts), e non sa cosa sia un grafico:

- si **dichiara** una registrazione — cosa osservare, ogni quanti tick, quante tenerne — e si
  riceve una `Series` di sola lettura;
- due forme, `samples` (una fotografia) e `candles` (un'escursione: apertura, massimo, minimo,
  chiusura), che si distinguono per **chiusura** e non per un `if`;
- **una lista sola**, iterata da quattro operazioni — `advance`, `moved`, `reopen`, `reset` — e
  nessuna guarda chi sia la registrazione che sta trattando. È la forma del Registry applicata a ciò
  che si registra invece che a ciò che ticchetta.

Le tre registrazioni che oggi esistono — il patrimonio netto e le due candele degli strumenti — le
dichiara il bootstrap, accanto ai sistemi che registra, perché è l'unico posto che ha il Ledger e i
numeri di gioco sotto mano insieme ([ADR 0024](0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)).

**La cronaca vive in `runtime/` e non in `core/`.** `core/` è la simulazione; una serie non decide
niente del gioco, e metterla lì non la renderebbe più vera. Vive invece dove vivono già `sampleOf`,
`Candle` e il `Game` stesso: sono la stessa catena — dal frame al tick, dal tick all'intervallo,
dall'intervallo alla serie — e R01 vieta comunque a uno store di importare ciò che gli sta accanto.

### La regola

**R25 — il tempo di gioco avanza in un posto solo.** Fuori da `runtime/createGame.ts`, nessun file
di `src/renderer/` nomina `tickAll`. La impone `tests/rules/one-way-to-advance`.

Senza il meccanismo questa decisione sarebbe una speranza: il difetto è nato da qualcuno che ha
scritto una riga onesta senza sapere che ce n'era già un'altra, ed è esattamente ciò che un test
può vedere e una convenzione no.

## Alternative scartate

- **Far campionare anche a `recover()`.** Due righe, verde subito, e il difetto tornerebbe al terzo
  chiamante: un salvataggio a cadenza, un cheat che salta un'ora, il calendario dell'
  [ADR 0023](0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md). È la toppa che questo ADR esiste
  per non mettere — cura il sintomo e lascia in piedi la ragione per cui si è presentato.
- **La cronaca è un sistema registrato.** La forma più pura secondo l'ADR 0002: una lista sola, e la
  cronaca ticchetta dentro `tickAll` come `income` e `vault`. Costa però una **terza forma di
  sistema** nel Registry — ticchetta e si azzera ma non si salva, che oggi il tipo `Stateless`
  esclude per costruzione (`reset?: never`) — più una fase nuova in `ORDER` e una modifica a
  `registry-completeness`, che equipara i sistemi alle cartelle di dominio. Tre modifiche al tipo più
  caricato del kernel per un registratore che non gioca. E il precedente contrario esiste già ed è
  forte: il **Ledger** e l'**Rng** non sono sistemi, e `Game` li compone a mano dentro `save`,
  `load` e `reset`. `advance` fa la stessa cosa nella stessa riga di codice.
- **La cronaca in `core/kernel/`.** Metterebbe in un posto solo tutto ciò che è cadenzato dai tick, e
  renderebbe le serie provabili senza il renderer. Ma provabili senza il renderer lo sono comunque —
  `tests/renderer/chronicle` gira in `node` senza Pinia e senza montare niente — e `core/` è
  definito come il gioco: un registratore che nessuna regola di gioco legge non lo è.
- **Il calendario dell'ADR 0023, in anticipo.** È la decisione che dà al gioco un contatore assoluto
  del tempo, ed è ciò che un giorno permetterà a un campione di sapere **quando** è stato preso. Non
  risolve però questo difetto — un calendario chiamato da un solo dei due percorsi resterebbe cieco
  esattamente come le serie — e costa giorni, mesi ed eventi sul Bus che nessun dominio ascolta
  ancora. Il suo grilletto resta il primo dominio con una scadenza.
- **Un `AdvanceStep` che porti anche i tick scartati dal tetto.** `stepOf` sa già quanti tick il
  tetto ha buttato via, e passarli renderebbe `advance` più «informativo». Nessuno li userebbe: chi
  li mostra è la schermata di recupero, che legge `awayFor` dallo store. Un parametro che nessuno
  legge è un contratto che nessuno mantiene.

## Conseguenze

- **Un chiamante solo, e un test che lo tiene tale.** `registry.tickAll` compare in `src/renderer/`
  in un posto solo. Il giorno in cui qualcosa dovrà succedere a ogni passo di gioco — un
  salvataggio a cadenza, il calendario, un cheat che salta il tempo — si aggiunge dentro `advance`,
  e nessun chiamante può dimenticarsene.
- **Lo store torna a essere ciò che dichiara di essere.** La sua prima riga dice «un lettore: riceve
  dal Bus e rispecchia, non calcola niente», e per due deleghe non era vero. Spariscono due
  accumulatori, due candele in corso, la costruzione di tre liste limitate e le sei righe che
  `newGame()` doveva ricordarsi di azzerare.
- **Il patrimonio netto si somma in un posto solo.** `netWorthOf` entra in
  `core/contracts/ledger.ts`, e la stessa funzione risponde al riquadro del cruscotto e alla serie
  che ne registra l'andamento. Prima erano due somme in due file, e due somme dello stesso
  patrimonio sono due patrimoni — la trappola già chiusa per la commissione del bancomat (INV-11) e
  per la capienza del caveau (INV-18).
- **Il contratto di salvataggio non cambia.** La cronaca non si salva, per la ragione già scritta:
  senza il calendario dell'ADR 0023 un campione non sa quando è stato preso, quindi una serie
  salvata direbbe di più e mentirebbe. INV-06 non si muove, e D009 non si tocca.
- **Il kernel non cambia.** Nessuna riga di `Clock`, `Registry`, `Bus`, `Ledger`. L'unica aggiunta a
  `contracts/` è `netWorthOf`, che è una somma dichiarata dove vivono i suoi argomenti.
- **Costo dichiarato:** `Game` cresce di due membri pubblici — `advance` e `series` — e chi legge il
  bootstrap trova tre dichiarazioni di registrazione accanto alle due di sistema. È una superficie in
  più da capire, in cambio di un percorso in meno da ricordare.
- **Un limite che resta.** Le due candele degli strumenti sono due dichiarazioni e non un ciclo su
  `POOLS[pool].player`, che pure sarebbe la regola vera: un ciclo pretenderebbe una chiave i18n
  costruita a runtime, e le chiavi di questo progetto sono un'unione tipizzata (R12). Il grilletto è
  il terzo strumento del giocatore, e sta nel [registro YAGNI](../roadmap-fette.md).
