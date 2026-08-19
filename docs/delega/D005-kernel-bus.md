# D005 — Kernel: Bus

- **Stato:** **Chiusa** — 2026-08-19, commit `e9cf441`, ramo `d005-kernel-bus`
- **Dipende da:** D002
- **Sblocca:** D006, D007
- **ADR vincolanti:** 0016
- **Invarianti:** INV-15
- **Budget:** ~50 righe → **consuntivo: 71 righe di codice** (125 con i commenti) + 303 di test

## Obiettivo

Dare ai sistemi un modo di notificarsi senza conoscersi, senza introdurre né asincronia né
accoppiamento nascosto.

## Da produrre

`src/core/kernel/Bus.ts`

- `on(event, handler): Unsubscribe` e `emit(event, payload)`, tipizzati su `GameEvents`
- guardia sulla profondità delle emissioni annidate: superarla **lancia**, non avverte

## Invarianti

- `emit` è **sincrono** e ritorna `void`. Un handler non può cambiare nulla per chi ha emesso.
- Gli handler girano nell'ordine di registrazione.
- La `Unsubscribe` è idempotente: chiamarla due volte non rompe e non toglie l'handler sbagliato.
- Disiscriversi **durante** un `emit` non salta né ripete gli handler rimanenti. È il classico
  errore di implementazione di un bus: iterare l'array che si sta modificando.
- Un handler che lancia non deve impedire l'esecuzione degli altri, ma l'errore non va inghiottito
  in silenzio: si rilancia dopo aver eseguito tutti.
- Il Bus **non** ha stato di gioco: nessuna coda, nessuno storico, niente che entri nel salvataggio.

## Cinque correzioni rispetto a com'era scritta questa delega

**1. La guardia sulla profondità non passa dalla raccolta degli errori — interrompe.** Due
invarianti di questa delega si contraddicono se si applicano alla lettera: "un handler che lancia
non impedisce agli altri di girare, si rilancia dopo aver eseguito tutti" e "superare la profondità
**lancia**". Presi insieme, l'errore della guardia viene catturato dall'`emit` del livello sopra,
che poi **prosegue** con i propri handler rimanenti — ognuno dei quali può emettere di nuovo. Con
due handler sullo stesso evento e `MAX_EMIT_DEPTH = 8` si arriva a centinaia di errori annidati in
`AggregateError`, cioè esattamente la diagnosi illeggibile che la guardia doveva evitare: la
guardia lancia ma non ferma niente.

Correzione: il ciclo è un tipo di errore a sé, `EventCycleError`, e **non** viene raccolto —
risale immediatamente. Il test che lo tiene fermo è "ferma la cascata invece di lasciar girare gli
altri handler": senza la correzione la traccia contiene un giro per ogni livello, con la
correzione è vuota.

**2. Se lanciano più handler, l'errore che emerge è un `AggregateError`.** La delega dice "si
rilancia" al singolare. Rilanciare solo il primo inghiottirebbe gli altri in silenzio, che è
proprio ciò che quell'invariante vieta. Con un errore solo si rilancia **l'originale**, perché lo
stack trace buono è quello; con più di uno, un `AggregateError` che li porta tutti. Entrambi i casi
hanno un test.

**3. Iterare una copia è metà della difesa, non tutta.** Le trappole note dicevano "si evita
iterando una copia". La copia impedisce di saltare o ripetere gli handler rimanenti, ma da sola
lascia passare un handler che si è disiscritto **un istante prima**, nello stesso `emit`: era
nella copia, quindi viene chiamato lo stesso. Ed è la variante peggiore, perché colpisce un sistema
appena smontato che scrive su stato che non possiede più.

Correzione: l'unità che si registra e si toglie è l'**iscrizione** (`{ handler, attiva }`), non la
funzione. Si itera la copia e si salta chi non è più attivo. Come effetto, l'idempotenza della
`Unsubscribe` diventa strutturale invece che convenzionale: due iscrizioni della stessa funzione
sono due cose distinte, quindi una `Unsubscribe` chiamata due volte non può togliere l'omonima
iscritta dopo. Con la rimozione per identità di funzione quel test è rosso.

**4. L'ADR 0016 era una decisione senza meccanismo.** Il "fuori scope" elencava `Promise`,
`queueMicrotask`, `setTimeout` — ma nulla lo imponeva. Che `emit` ritorni `void` è una firma: un
`queueMicrotask` dentro l'iterazione la rispetta e rompe comunque il determinismo dell'ordine
dentro un tick, e con esso metà del valore del seed fisso dell'ADR 0005. Senza meccanismo, l'ADR
0016 non poteva passare ad _Accettata_ onestamente.

Correzione: `tests/rules/bus-sincrono.test.ts` legge `Bus.ts`, toglie i commenti — un commento che
spiega il divieto lo nomina senza usarlo — e pretende che non resti nessuna forma di attesa. Nuova
riga **INV-15** in [tracciabilità](../tracciabilita.md).

**5. Il test sulla catena verifica il meccanismo, non ancora il caso interessante — ed è un limite
dichiarato.** `GameEvents` contiene **un** evento solo, quindi l'unica catena che si può costruire
oggi è `money.posted → money.posted → …`. Il test controlla che la catena venga dallo stack reale
(la lunghezza è esattamente `MAX_EMIT_DEPTH + 1`), ma il caso che rende utile il messaggio — `A → B
→ A`, due sistemi che si notificano a vicenda — si potrà scrivere solo con il secondo evento, cioè
alla **fetta 04**, che è anche la prima che vive di eventi altrui secondo
[roadmap-fette](../roadmap-fette.md). Scritto qui perché non venga scambiato per una svista.

L'alternativa era rendere il Bus generico sulla mappa degli eventi (`createBus<E = GameEvents>()`)
per poter costruire nei test una mappa con più eventi. Scartata: aprirebbe un varco in cui un
sistema può dichiararsi una mappa di eventi propria, e `GameEvents` smetterebbe di essere l'unica
interfaccia degli eventi del gioco. Un test più forte non vale un'invariante più debole.

Sul budget: ~50 righe previste, 71 di codice. Sopra il segno di venti righe, e la ragione è la
correzione 3: l'iscrizione con il proprio stato costa più di un array di funzioni.

## Fuori scope

- `once`, wildcard, priorità: [registro YAGNI](../roadmap-fette.md).
- Qualunque cosa asincrona: `Promise`, `queueMicrotask`, `setTimeout` (ADR 0016). Dalla correzione
  4 non è più solo una consegna: è INV-15, ed è un test.
- Eventi in stile richiesta/risposta: vietati per decisione, non per mancanza di tempo.

## Definizione di fatto

- [x] test: due handler sullo stesso evento vengono chiamati in ordine di registrazione
- [x] test: `Unsubscribe` toglie solo il proprio handler, ed è idempotente
- [x] test: disiscriversi dentro un handler non salta gli handler successivi
- [x] test: un handler che lancia non impedisce agli altri di girare, e l'errore emerge
- [x] test: un ciclo di emissioni annidate lancia al superamento della profondità, e il messaggio
      dice **quale** catena di eventi lo ha causato (con il limite della correzione 5)
- [x] test: emettere un evento non dichiarato in `GameEvents` non compila
- [x] test: la guardia **ferma** la cascata invece di lasciarla proseguire (correzione 1)
- [x] test: se lanciano due handler, emergono entrambi (correzione 2)
- [x] test: un handler tolto durante un `emit` non riceve quell'emissione (correzione 3)
- [x] `tests/rules/bus-sincrono.test.ts`: in `Bus.ts` non c'è niente di asincrono (correzione 4)

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 123 test su 19 file (erano 103
su 17).

Le reti sono state rotte di proposito, e sono diventate rosse tutte:

| Rottura indotta                                             | Cosa è diventato rosso                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| iterare l'array vivo invece della copia                     | disiscriversi dentro un handler                              |
| rimuovere per identità di funzione invece che di iscrizione | la `Unsubscribe` chiamata due volte                          |
| raccogliere `EventCycleError` invece di rilanciarlo subito  | la cascata che non si ferma                                  |
| togliere il ripristino della profondità nel `finally`       | 2 casi: la profondità sporca e il Bus dopo un ciclo          |
| un `queueMicrotask` dentro `emit`                           | `tests/rules/bus-sincrono` — "expected 'queueMicrotask' ..." |

La quarta riga è quella che vale di più: senza il `finally`, la profondità non torna mai indietro
dopo un handler che lancia, e dopo `MAX_EMIT_DEPTH` emissioni **normali** il Bus comincerebbe a
diagnosticare cicli che non esistono. È un difetto che non si vede leggendo il codice e che si
manifesterebbe come un gioco che si rompe da solo dopo qualche minuto di gioco.

[ADR 0016](../adr/0016-il-bus-e-sincrono-e-fire-and-forget.md) passa a **Accettata**: la sincronia,
il fire-and-forget e la guardia sui cicli sono tutti qui, e ognuno ha il proprio meccanismo — il
tipo per `emit: … => void`, INV-15 per l'assenza di attese, `EventCycleError` per i cicli.

## Cosa deve sapere chi prende D006 e D011

`emit` **può lanciare**: `EventCycleError` se le emissioni annidate superano `MAX_EMIT_DEPTH`,
oppure l'errore di un handler (un `AggregateError` se sono più d'uno). Un `tick` che emette non è
un'operazione che non fallisce mai, e il loop di D011 deve decidere cosa fa quando succede —
fermare la simulazione è la risposta giusta, perché entrambi gli errori significano che un sistema
è scritto male, non che il giocatore ha fatto qualcosa di strano.

## Trappole note

- L'iterazione sull'array live durante `emit` è il difetto che si manifesta mesi dopo, quando un
  handler comincia a disiscriversi da solo. Si evita iterando una copia — e saltando le iscrizioni
  non più attive, che è la metà mancante (correzione 3).
- La guardia sulla profondità sembra paranoia finché due sistemi non si notificano a vicenda.
  Senza guardia, la diagnosi è uno stack overflow senza contesto. Con una guardia che lancia ma non
  interrompe, la diagnosi è un `AggregateError` annidato — peggio (correzione 1).
