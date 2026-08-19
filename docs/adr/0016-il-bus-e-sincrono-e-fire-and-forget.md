# ADR 0016 — Il Bus è sincrono, fire-and-forget, e non è event sourcing

- **Stato:** **Accettata** — D005: `kernel/Bus.ts`, la guardia sulla profondità e `tests/rules/bus-sincrono`
- **Data:** 2026-08-19

## Contesto

Va deciso **ora** cosa succede quando un handler emette un evento durante l'esecuzione di un altro
emit, perché la risposta cambia la forma di ogni sistema che scriveremo dopo. Rimandarla significa
che ogni sistema deciderà per conto suo — che è il modo in cui nascono le inconsistenze
impossibili da estirpare.

## Decisione

**Sincrono.** `emit` esegue gli handler subito, nell'ordine di registrazione, sullo stesso stack.

**Fire-and-forget.** Il Bus è una _notifica_, non un canale di comando. Un handler non può
cambiare il risultato di chi ha emesso, e `emit` non ritorna nulla. Chi ha bisogno di una risposta
non usa il Bus: usa un comando, che ritorna `Result`, oppure un selettore.

**Emissioni annidate consentite, con guardia.** Un handler può emettere. La profondità è limitata
da una costante; superarla è un **errore**, non un avviso: significa che esiste un ciclo, e un
ciclo di eventi va corretto, non tollerato.

**Non è event sourcing.** Lo stato non si ricostruisce dagli eventi. Ogni sistema possiede il
proprio stato e lo salva (ADR 0002). Gli eventi sono effimeri e non entrano nel salvataggio.

## Alternative scartate

- **Coda asincrona.** L'ordine di esecuzione dentro un tick smetterebbe di essere deterministico:
  i test diventerebbero dipendenti dalla coda dei microtask, e il seed fisso dell'ADR 0005
  perderebbe metà del suo valore.
- **Event sourcing.** Potente, e risolverebbe da solo la persistenza. Ma impone che _ogni_
  cambiamento sia un evento serializzabile e versionato: un costo enorme per un singleplayer,
  quando il test round-trip dà già la garanzia che serve.

## Conseguenze

- Un handler lento rallenta il tick. Accettabile perché gli handler sono brevi per costruzione, e
  misurabile con un budget di tempo per tick se dovesse diventare un problema reale.
- Il debug è uno stack trace unico che parte dall'emittente: nessuna causa persa fra i task.
- **Vietato** usare il Bus per chiedere dati. Nessun evento in stile richiesta/risposta.
- Il divieto di asincronia non poggia sulla firma di `emit`: un'attesa dentro l'iterazione
  rispetterebbe il tipo `void` e romperebbe comunque il determinismo. Il meccanismo è INV-15 in
  [tracciabilità](../tracciabilita.md), cioè `tests/rules/bus-sincrono`.
- **`emit` può lanciare**, e chi lo chiama deve saperlo: `EventCycleError` se le emissioni annidate
  superano `MAX_EMIT_DEPTH`, oppure l'errore di un handler (un `AggregateError` se sono più d'uno),
  rilanciato dopo che tutti gli altri handler hanno girato.
