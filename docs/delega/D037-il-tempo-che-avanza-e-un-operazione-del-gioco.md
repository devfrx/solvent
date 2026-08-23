# D037 — Il tempo che avanza è un'operazione del gioco

- **Stato:** **Chiusa** — scritta ed eseguita il 2026-08-23, nella stessa sessione. È la seconda
  volta che succede in questo progetto, e per la stessa ragione di
  [D036](D036-il-pagamento-e-un-flusso-solo.md): la richiesta è arrivata dall'utente come feature, ed
  è risultata essere un difetto misurabile. La decisione aperta — dove vive la cronaca — è stata
  posta all'utente, che ha risposto con la **direttiva generale**: decisa in autonomia, e marcata
  come contestabile
- **Dipende da:** [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md), che ha portato la prima
  serie; [D034](D034-le-serie-degli-strumenti.md), che ha portato le candele e il secondo
  accumulatore; [D011](D011-runtime-e-store.md), che ha scritto il loop e il recupero
- **Sblocca:** qualunque cosa debba succedere a **ogni** passo di gioco. Il calendario dell'
  [ADR 0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md) e un eventuale salvataggio a
  cadenza adesso hanno un posto dove nascere invece di due
- **ADR vincolanti:** [0043](../adr/0043-il-tempo-che-avanza-e-un-operazione-del-gioco.md) (questa
  delega lo impone), [0002](../adr/0002-registry-unica-lista-di-sistemi.md) (una lista sola, nessun
  caso speciale), [0016](../adr/0016-il-bus-e-sincrono-e-fire-and-forget.md) (il Bus è sincrono, ed
  è ciò che rende corretto l'ordine dentro `advance`),
  [0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md) (ciò che non
  sta nel contesto arriva per costruzione), [0010](../adr/0010-liste-storiche-limitate-alla-definizione.md)
  (R09 — una lista nasce col suo limite)
- **Regole:** R01, R05, R09, **R25** (nuova), INV-06
- **Budget:** ~200 righe di codice, di cui la cronaca è circa la metà e il resto è ciò che **esce**
  dallo store. I test sono la parte lunga: il difetto si vede solo da una strada, e quella strada non
  era provata. **Misurato: 153 righe di codice scritte e 50 tolte**, saldo +103 — la cronaca ne pesa
  90, il resto sono `advance`, le tre dichiarazioni e `netWorthOf`. Sotto il budget perché la parte
  che si temeva lunga era già scritta: la logica delle serie non è stata riscritta, è stata
  **spostata**

## Obiettivo

Fare in modo che il tempo di gioco avanzi in un posto solo, e che tutto ciò che dipende dal tempo —
le serie comprese — sia alimentato da lì.

## Perché esiste

L'utente l'ha chiesta così: «i grafici usano un metodo di aggiornamento completamente a sé stante,
che ignora i tick del kernel e la velocità effettiva di gioco; vorrei risolverlo alla radice, non
come una toppa».

Cercata nel codice, la richiesta si è rivelata **più vera di come era formulata**. La cadenza delle
serie era già in tick — non c'era nessun cronometro parallelo — ma le serie erano alimentate da uno
solo dei **due** chiamanti di `registry.tickAll`:

| Dove                          | Cosa faceva                               |
| ----------------------------- | ----------------------------------------- |
| `loop.onStep` (`game.ts:677`) | ticchettava **e** campionava le tre serie |
| `recover()` (`game.ts:724`)   | ticchettava, e le serie non lo sapevano   |

Il secondo è la strada di chi **chiude il gioco e lo riapre**. Fino a otto ore di gioco
(`RECOVERY_CAP`) arrivavano ai domini e non alle serie: il giocatore rientrava con lo stipendio di
una notte in tasca e tre grafici vuoti.

Non era una svista silenziosa: `sampleOf` in [runtime/loop.ts](../../src/renderer/runtime/loop.ts)
dichiarava il contrario — «il tetto del recupero produce un campione solo… tornare dopo otto ore
arriva qui come un `elapsed` enorme» — e a quel codice il recupero non arrivava mai. Il documento
vincolante del tick, [flusso-tick.md](../design/flusso-tick.md), non nominava affatto le serie, quindi
leggere il disegno non bastava ad accorgersene.

**La radice non è il campionamento: è che «il tempo è passato» non aveva un proprietario.** `Game`
aveva `save`, `load` e `reset` — le tre operazioni che riguardano tutta la partita — e non aveva la
quarta, quella che succede dieci volte al secondo. Così è stata scritta due volte, in due punti, in
modo diverso. È il difetto A01 nella sua forma più corta: due sequenze parallele mantenute a mano.

## Da produrre

### 1 · `Game.advance(elapsed)` — la quarta operazione

In [runtime/createGame.ts](../../src/renderer/runtime/createGame.ts), accanto a `save`, `load` e
`reset` e con la loro stessa forma:

```ts
advance: (elapsed) => {
  registry.tickAll(ctx, elapsed)
  chronicle.advance(elapsed)
}
```

L'ordine è **prima i sistemi, poi la cronaca**: il Bus è sincrono (ADR 0016), quindi quando
`tickAll` ritorna le transazioni del tick sono già state annunciate. Al contrario, ogni campione
porterebbe il gioco di un passo fa.

`load` guadagna una riga — le escursioni in corso ripartono dai saldi caricati, perché caricare non è
un movimento economico e nessun evento lo annuncia — e `reset` un'altra, **dopo** quella del Ledger:
azzerare una serie significa anche riaprirla sui saldi che ci sono adesso.

### 2 · `runtime/chronicle.ts` — la cronaca

Il pezzo nuovo, e **non sa cosa sia un grafico**. Si dichiara cosa osservare, ogni quanti tick e
quante tenerne; si riceve una `Series` di sola lettura.

Due forme, e si distinguono per **chiusura**, non per un `if`:

|           |                                                                   |
| --------- | ----------------------------------------------------------------- |
| `samples` | una fotografia per intervallo: dov'era il numero in quell'istante |
| `candles` | un'escursione per intervallo: apertura, massimo, minimo, chiusura |

Quattro operazioni iterano **una lista sola** e nessuna guarda chi sta trattando: `advance` (il
tempo è passato), `moved` (un saldo si è mosso fuori dal tick — la cronaca si iscrive da sé a
`money.posted`), `reopen` (i saldi sono cambiati senza un movimento), `reset`. È la forma del
Registry applicata a ciò che si registra invece che a ciò che ticchetta, e il primo
`if (kind === …)` sarebbe il difetto A01 che torna con un altro nome.

Le **tre registrazioni** che oggi esistono le dichiara il bootstrap, accanto ai sistemi che registra:
è l'unico posto che ha il Ledger e i numeri di gioco sotto mano insieme (ADR 0024).

### 3 · `netWorthOf` in `core/contracts/ledger.ts`

Il patrimonio netto si somma in un posto solo. Serviva comunque: senza, la registrazione del
patrimonio avrebbe fatto la **seconda** somma accanto a quella dello store — e il commento che
D027 aveva scritto sopra quella serie diceva già perché non si può («due somme del patrimonio in due
punti sono due patrimoni»).

### 4 · Lo store torna un mirror

Escono due accumulatori, due candele in corso, la costruzione delle tre liste limitate, le due righe
di aggiornamento dentro l'handler del Bus, `reopen()`, e le **sei** righe che `newGame()` doveva
ricordarsi di azzerare. Restano tre `shallowRef` riletti da `readSeries()`, come `withheld`.

### 5 · R25, con il suo meccanismo

`tests/rules/one-way-to-advance`: fuori da `runtime/createGame.ts`, nessun file di `src/renderer/`
nomina `tickAll`. Una regola senza meccanismo è una speranza, e questo difetto è nato da qualcuno
che ha scritto una riga onesta senza sapere che ce n'era già un'altra — cioè da esattamente ciò che
un test può vedere e una convenzione no.

## Invarianti

1. **`registry.tickAll` ha un chiamante solo in `src/renderer/`.** Lo verifica R25.
2. **Ogni percorso che fa passare il tempo di gioco alimenta le serie.** Ce n'è uno.
3. **Il patrimonio netto si somma in un posto solo**, e i due lettori chiamano la stessa funzione.
4. **Le serie non entrano nel salvataggio.** INV-06 non si muove, e `SavePayload` non cambia.
5. **Il kernel non cambia.** Nessuna riga di `Clock`, `Registry`, `Bus`, `Ledger`.

## Fuori scope

- **Il calendario dell'ADR 0023.** È la decisione che darà a un campione un **quando**, e il suo
  grilletto resta il primo dominio con una scadenza. Questa delega non lo anticipa: un calendario
  chiamato da uno solo dei due percorsi sarebbe stato cieco esattamente come le serie, quindi il
  problema da risolvere prima era questo.
- **Una velocità di gioco regolabile.** Non esiste, e `TICKS_PER_SECOND` resta l'unica occorrenza
  letterale del progetto (ADR 0009). Ciò che questa delega garantisce è che, il giorno in cui
  esistesse, le serie la seguirebbero senza che nessuno se ne ricordi: sono alimentate dai tick
  **eseguiti**, non da un cronometro.
- **Un ciclo su `POOLS[pool].player` al posto delle due candele dichiarate.** Sarebbe la regola
  vera, e pretenderebbe una chiave i18n costruita a runtime contro un'unione tipizzata (R12).
  Grilletto: il terzo strumento del giocatore.
- **Salvare le serie.** Vedi l'invariante 4.
- **Toccare i tre componenti-grafico.** Leggono dallo store e non si accorgono di niente: è la prova
  che il confine era nel posto giusto e la sorgente no.

## Definizione di fatto

- [x] `Game.advance` esiste, e `loop.onStep` e `recover()` chiamano quello
- [x] `runtime/chronicle.ts` esiste, con le due forme e la lista sola
- [x] Le tre registrazioni sono dichiarate nel bootstrap
- [x] `netWorthOf` è in `core/contracts/ledger.ts`, e lo store e la cronaca chiamano quella
- [x] Lo store non tiene più accumulatori, e `newGame()` non azzera più le serie a mano
- [x] **R25** ha il suo test, ed è stata vista **rossa** rimettendo `registry.tickAll` in
      `recover()`
- [x] `tests/renderer/chronicle` prova la cronaca **senza Pinia e senza partita**, e ogni verdetto è
      stato visto rosso rompendo di proposito il pezzo che lo tiene: l'iterazione della lista,
      l'iscrizione al Bus, `reopen`, e la cadenza di `sampleOf`
- [x] I quattro test della riapertura dopo una notte sono stati visti **rossi** rimettendo il
      difetto, e sono la prova che il difetto esisteva
- [x] `npm run verify` verde
- [x] `npm run verify:release` verde
- [x] La finestra vera è stata guardata

**Cosa ha risposto la finestra.** Il gioco è stato riaperto su un salvataggio vecchio di **dieci ore
e mezza** — oltre il tetto di otto ore — dopo aver chiuso il processo senza salvare, così che
`savedAt` restasse indietro. Sul cruscotto, letti dagli assi via CDP:

| Grafico            | Asse                        | Cosa dice                                     |
| ------------------ | --------------------------- | --------------------------------------------- |
| Patrimonio (area)  | 253.447,50 € → 266.119,90 € | **piatto**: il 5% di respiro di `windowOf`    |
| Contanti (candele) | 59.899,20 € → 250.000,00 €  | **la notte intera, in una candela**           |
| Carta (candele)    | 3.447,50 € → 3.619,88 €     | **piatta**: la carta non l'ha toccata nessuno |

I 59.899,20 € sono il saldo **salvato**, e 250.000,00 € è il tetto del caveau: la candela apre dove
il giocatore aveva lasciato i contanti e chiude dove il recupero li ha portati. Prima di D037 quel
numero non poteva comparire — `mirror()` chiamava `reopen()` **dopo** il recupero, quindi la prima
candela apriva già a 250.000,00 € e il salto spariva. Le altre due serie sono piatte e lo dicono
onestamente: a caveau pieno il reddito non entra più.

Il salvataggio del giocatore non è stato toccato: il processo è stato terminato senza scrivere, e
`savedAt` è rimasto quello di prima.

## Trappole note

1. **Rimettere il difetto per vedere il rosso va fatto su un albero pulito o con una copia in
   mano.** È la trappola che [D036](D036-il-pagamento-e-un-flusso-solo.md) ha pagato con mezz'ora di
   lavoro perso: qui ogni file rotto di proposito è stato copiato prima, e ripristinato con un
   `diff` che conferma l'identità.
2. **`nextCandle(open)` e `openCandle(observe())` sono indistinguibili da un test.** Alla chiusura
   di un intervallo il valore osservato **è** la chiusura, quindi le due scritture danno lo stesso
   risultato in ogni caso raggiungibile dal gioco. Provato scambiandole: nessun test è diventato
   rosso. Resta `nextCandle`, che è la semantica dichiarata in `candles.ts` — «la chiusura di una
   candela è l'apertura della seguente» — e che non dipende da una seconda osservazione.
3. **Il caso che il difetto mostrava non era quello a finestra nascosta.** Nascondere e riesporre la
   finestra passa dal **loop**, e le serie lo vedevano già: il test «una notte a finestra nascosta
   vale un campione» era verde da D027. La strada rotta era l'altra — chiudere il gioco e riaprirlo —
   e non aveva un test. Due situazioni che il progetto descrive come «la stessa cosa» avevano
   copertura diversa, ed è il posto dove cercare quando un difetto sembra impossibile.
