# ADR 0050 — La cadenza sta sulla via unica, e si consuma in un posto solo

- **Stato:** **Accettata** — [D041](../delega/D041-il-salvataggio-ha-una-cadenza.md): `Game.advance`
  alimenta una `Cadence` accanto alla cronaca, e lo store la consuma in una riga di `loop.onStep`.
  Rotta di proposito sei volte, e ogni rottura ha un conto: il `||` della coalizione, il `take` che
  non azzera, il `clear` che dimentica il resto, il `reset` che non azzera, la chiusura che non
  aspetta, e la cadenza mai alimentata — 3, 3, 2, 1, 1 e 5 test caduti
- **Data:** 2026-08-24
- **Estende:** l'[ADR 0043](0043-il-tempo-che-avanza-e-un-operazione-del-gioco.md) e
  l'[ADR 0049](0049-il-mondo-avanza-a-blocchi.md), che hanno stabilito **chi** fa passare il tempo e
  **a quale grana**. Questa dice chi si accorge che è passato
- **Non tocca:** l'[ADR 0004](0004-il-main-e-proprietario-del-contratto-di-salvataggio.md), che resta
  intero: il contratto non cambia di un campo, il main non sa se lo chiamano alla chiusura o a metà
  partita, e il preload resta tre funzioni (INV-16)

## Contesto

Il gioco scriveva su disco in **un** momento solo: la chiusura della finestra. A chiamarla è
`host.onClosing`, che è un `beforeunload` — copre la chiusura e nient'altro. Un crollo del renderer,
un processo terminato, un blackout: in tutti quei casi l'intera sessione di gioco resta in memoria e
sparisce con lei. Il progetto ne aveva già la prova pratica, presa di proposito: chiudendo
[D040](../delega/D040-il-recupero-avanza-a-blocchi.md) l'applicazione è stata **terminata** invece
che chiusa, per non scrivere la partita di prova sopra quella dell'utente.

Serviva quindi un secondo momento, «ogni tanto mentre si gioca». La domanda che nessuno aveva posto
è **chi conta quel tanto**.

Il [registro YAGNI](../roadmap-fette.md) dichiarava che salvataggio a intervalli e progresso offline
sono «lo stesso problema». È vero del **gancio** e falso dell'**unità**, e la differenza decide il
disegno: la durabilità si misura in tempo reale, i blocchi in tempo di gioco. Mentre si gioca
coincidono — dieci tick sono un secondo. Durante un recupero al tetto pieno passano 7.300 tick in
meno di tre millisecondi.

## Decisione

**La cadenza avanza dentro `Game.advance`, e si consuma in un posto solo.**

`createCadence(every)` vive in `renderer/runtime/cadence.ts`, riceve tick e risponde a una domanda
sola — _è dovuto?_ — usando lo **stesso** accumulatore della cronaca, `sampleOf`. `Game.advance` la
fa avanzare accanto a `chronicle.advance`, dentro il ciclo dei blocchi. Lo store la consuma in una
riga di `loop.onStep`, ed è l'unico posto che scrive perché è l'unico che ha `SaveApi`.

**Ciò che si accumula è un `boolean`, non un numero**, e in quel carattere sta la coalizione:
ventiquattro soglie attraversate durante un recupero sono **una** cosa da fare. Ventiquattro
round-trip IPC dentro il caricamento sarebbero precisamente il tempo di avvio che il tetto di
recupero esiste per proteggere.

**`Game` espone una funzione, non l'oggetto `Cadence`.** `takeSaveDue()` prende la risposta e la
azzera; chi la consuma non può farla avanzare. È la forma di `Series`, e per la stessa ragione: con
l'oggetto in mano, una riga scritta nello store desincronizzerebbe la cadenza dal tempo di gioco
senza che nulla lo dica.

**Una scrittura a cadenza che fallisce non manda la partita in errore.** La chiusura sì, e la
differenza non è incoerenza: là una scrittura mancata **ha** perso qualcosa, perché la finestra sta
chiudendo e quella è l'unica copia; qui la partita è in memoria e la chiusura riproverà comunque. A
dirlo al giocatore è `savedAt`, che è già a schermo sotto «Ultimo salvataggio».

**Mai due scritture in volo** (INV-25). La chiusura aspetta quella a cadenza; la cadenza salta il
giro se ne trova una. Il `rename` atomico del main protegge dal file troncato, non dal payload più
vecchio che vince perché è arrivato secondo.

## Alternative scartate

- **La cadenza nello store, contata sui tick che il loop consegna.** Cinquanta righe in meno, e non
  perde niente in termini di gioco: non coprirebbe il recupero, e il recupero non è gioco che si può
  perdere — è ripetibile, parte dallo stesso `savedAt` e produce lo stesso stato. Costa la
  **proprietà**: sarebbe un secondo posto che sa una cadenza, e il giorno in cui qualcuno fa passare
  del tempo senza passare dal frame — il calendario dell'[ADR 0023](0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md),
  un cheat che salta un'ora — quel posto non lo vedrebbe. **E nessun gate se ne accorgerebbe:** R25
  guarda chi nomina `tickAll`, e una cadenza non lo nomina, quindi resterebbe verde mentre la sua
  ragione viene aggirata. È la forma esatta del difetto che D037 ha chiuso.
- **Un timer di orologio reale** (`setInterval`). Il browser vive in un file solo
  ([ADR 0001](0001-simulazione-nel-renderer-core-puro.md)): sarebbe un ingresso nuovo in `host.ts`
  per contare una cosa che il gioco sa già contare. A finestra nascosta non passano tick — il
  browser non chiama il frame — quindi il gioco è **fermo** e una cadenza sui tick si mette in pausa
  da sé; un timer continuerebbe a scrivere lo stesso salvataggio identico tutta la notte. E due
  orologi che misurano la stessa partita prima o poi divergono, che è la ragione per cui `now` e
  `wallClock` sono due funzioni con due commenti che spiegano perché non si scambiano.
- **Un contatore invece di un booleano**, cioè «quante volte è scattata». Direbbe di più e
  produrrebbe ventiquattro scritture identiche dentro il caricamento. Il giorno in cui una cadenza
  dovrà sapere quante volte, questa è la riga da cui si allarga — e a quel punto la posizione dentro
  il ciclo dei blocchi comincerà a contare, mentre oggi non conta.
- **Accodare la scrittura invece di saltare il giro** quando ne trova una in volo. Con il disco
  lento si scriverebbe due volte lo stesso stato; saltando, la prossima arriva fra trenta secondi ed
  è più recente.
- **Sostituire la scrittura alla chiusura invece di aggiungersi.** La chiusura resta l'unica
  autoritativa: è l'ultima cosa che il giocatore fa, e l'unica che può scrivere lo stato finale.

## Conseguenze

**Si perde al massimo mezzo minuto di gioco**, e il numero è derivato invece che scelto:
`AUTOSAVE_SECONDS = 30`. Il criterio è che ciò che si può perdere resti sotto la cosa più economica
che il gioco vende — 800,00 € — al reddito **massimo** che il gioco raggiunge, 18,00 €/s: la soglia
è 44 secondi, e trenta ci sta con margine. Il margine non è prudenza generica: è ciò che tiene il
criterio in piedi quando entrerà un moltiplicatore nuovo, invece di farlo scadere in silenzio come è
successo al tetto di recupero tarato in ore reali.

**Il costo è 120 scritture in un'ora di gioco**, su un payload di poche centinaia di byte.

**`savedAt` diventa vivo.** Prima poteva muoversi solo caricando o chiudendo; adesso avanza da sé, e
il riquadro «Ultimo salvataggio» della schermata Statistiche è la prima verifica a occhio di questo
progetto che si fa **non** facendo un gesto.

**La cadenza è di questa partita.** `reset` la azzera — `newGame()` si preme da una partita che
stava girando, quindi il conto è a metà — e `load` anche, benché su ogni percorso che esiste oggi sia
un no-op: la regola è che quando il gioco in memoria viene sostituito il conto riparte, e una regola
rispettata per caso non è una regola (la lezione di D031).

**Chi verrà dopo eredita la cadenza senza saperlo.** Il calendario dell'ADR 0023, un cheat che salta
un'ora, qualunque cosa faccia passare del tempo: passa da `advance`, quindi muove la cadenza. È la
stessa proprietà per cui l'ADR 0049 ha messo il ciclo dei blocchi lì e non nel chiamante.
