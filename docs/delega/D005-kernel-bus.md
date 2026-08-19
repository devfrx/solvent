# D005 — Kernel: Bus

- **Stato:** Aperta
- **Dipende da:** D002
- **Sblocca:** D006, D007
- **ADR vincolanti:** 0016
- **Budget:** ~50 righe

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

## Fuori scope

- `once`, wildcard, priorità: [registro YAGNI](../roadmap-fette.md).
- Qualunque cosa asincrona: `Promise`, `queueMicrotask`, `setTimeout` (ADR 0016).
- Eventi in stile richiesta/risposta: vietati per decisione, non per mancanza di tempo.

## Definizione di fatto

- [ ] test: due handler sullo stesso evento vengono chiamati in ordine di registrazione
- [ ] test: `Unsubscribe` toglie solo il proprio handler, ed è idempotente
- [ ] test: disiscriversi dentro un handler non salta gli handler successivi
- [ ] test: un handler che lancia non impedisce agli altri di girare, e l'errore emerge
- [ ] test: un ciclo di emissioni annidate lancia al superamento della profondità, e il messaggio
      dice **quale** catena di eventi lo ha causato
- [ ] test: emettere un evento non dichiarato in `GameEvents` non compila

## Trappole note

- L'iterazione sull'array live durante `emit` è il difetto che si manifesta mesi dopo, quando un
  handler comincia a disiscriversi da solo. Si evita iterando una copia.
- La guardia sulla profondità sembra paranoia finché due sistemi non si notificano a vicenda.
  Senza guardia, la diagnosi è uno stack overflow senza contesto.
