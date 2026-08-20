# ADR 0025 — La capienza di un pool si chiede, non si legge

- **Stato:** Proposta — il meccanismo nasce con [D017](../delega/D017-il-caveau.md)
- **Data:** 2026-08-20

## Contesto

Il Ledger fa rispettare la capienza di un pool da [D007](../delega/D007-kernel-ledger.md), e la
legge da `POOLS[pool].capacity` — una costante di modulo in `contracts/pools.ts`. Nella fetta 01
vale `null` per tutti e sei, quindi il ramo esiste, è provato
(`tests/kernel/ledger-capacity`), ed è spento.

La fetta 02 lo accende, e nel farlo scopre che quella costante non basta più. Il caveau della
[visione](../prodotto/visione.md) non è un tetto fisso: è il **muro dell'era 1**, e la regola delle
quattro ere dice che un muro «non si compra: si supera cambiando modo di giocare». Il caveau «si
amplia, ma non all'infinito». Una capienza che cresce non può vivere in una costante compilata.

Il resto del meccanismo invece **non ha bisogno di niente**, ed è ciò che rende questa la sola
domanda della fetta: il Ledger rifiuta già con `error.ledger.capacity_exceeded`, che porta con sé
il tetto e quanto ci sta ancora; `capacityOf(pool)` e `fitsIn(capacity, current, incoming)` sono
funzioni pure già scritte e già provate ([D014](../delega/D014-dominio-bancomat.md)); lo store le
espone; il pannello dei contanti mostra la capienza e oggi dice «Illimitata»; l'errore è tradotto
in entrambe le lingue. Manca il numero, e manca chi lo sposta.

## Decisione

**`createLedger` riceve la capienza come funzione, non la legge da una costante.**

    export type Capacities = (pool: Pool) => Money | null

    export const createLedger = (bus: Bus, capacities: Capacities = poolCapacity): Ledger => …

`poolCapacity` è il valore predefinito e legge `POOLS[pool].capacity`: chi non ha una capienza
variabile — i quattro conti non-giocatore, e la carta — non cambia di una riga, e i test esistenti
del kernel restano quelli.

Il dominio `vault` possiede il proprio stato (`{ level }`), calcola la capienza con una regola pura
in `balance/`, e il bootstrap consegna al Ledger la funzione che la interroga. `POOLS.cash.capacity`
resta la capienza **di partenza**, cioè la dichiarazione del pool quando nessuno l'ha ancora
ampliato: il dato non sparisce, smette di essere l'ultima parola.

**Il Ledger resta l'unico che decide.** Cambia da dove prende il numero, non chi lo fa rispettare.

## Alternative scartate

- **Il dominio controlla prima, e il kernel non si tocca.** `vault` chiama `fitsIn()` prima di
  chiedere la transazione, e `POOLS` continua a tenere una capienza fissa. Costa zero e non chiede
  un ADR — è per questo che va scritto perché è stata scartata. Sposta l'invariante **fuori** dal
  Ledger e lo trasforma in una cosa da ricordare: il giorno in cui un dominio nuovo accredita
  contanti senza chiedere, il caveau trabocca e nessun test se ne accorge, perché non c'è niente da
  cui accorgersene. È il difetto **A05** — denaro scritto da più punti, ciascuno con la propria
  idea delle regole — con un altro nome, ed è esattamente ciò che il Ledger esiste per rendere
  impossibile invece che sconsigliato ([ADR 0003](0003-ledger-unica-porta-del-denaro.md)).
- **Rendere `POOLS` mutabile.** Una `Map` scrivibile al posto della costante. Toglie il parametro e
  mette al suo posto uno stato globale che chiunque può cambiare senza che la firma lo dica: la
  stessa ragione per cui l'[ADR 0024](0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)
  ha rifiutato un singleton in `balance/`, applicata a un dato ancora più centrale.
- **Anticipare i conti dinamici dell'[ADR 0022](0022-il-ledger-ha-conti-non-solo-pool.md).** È la
  forma generale della stessa domanda, e arriverà. Costruirla adesso significherebbe progettare il
  ciclo di vita di un conto — apertura, chiusura, saldo residuo — per un caso che ha bisogno di un
  numero soltanto. Il grilletto di 0022 resta il suo: il primo dominio con un budget per entità.
- **Mettere la capienza nel `SystemContext`.** Il caveau non è una cosa che serve a ogni `tick` di
  ogni sistema: sarebbe il tipo condiviso più grande del progetto per un consumatore solo.

## Conseguenze

- Una firma del kernel cambia, e con essa i test che costruiscono un Ledger. Il valore predefinito
  fa sì che il cambiamento sia **additivo**: nessun chiamante esistente si rompe, e a dirlo sarà
  `npm run verify` prima ancora della review.
- Il bootstrap guadagna una riga, ed è la stessa riga che l'[ADR 0024](0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)
  accetta già come prezzo: `createGame.ts` resta l'unico posto che costruisce le istanze condivise
  e le distribuisce.
- **Il Ledger acquisisce una dipendenza da uno stato di dominio**, seppur attraverso una funzione e
  non un oggetto. È il costo vero di questa decisione e va detto: fino a oggi il kernel non sapeva
  che i domini avessero uno stato. Il confine regge perché ciò che attraversa è un `Money`, non un
  dominio — il Ledger non sa cosa sia un caveau, sa che qualcuno risponde alla domanda «quanto ci
  sta».
- `capacityOf()` in `domains/atm/rules.ts` diventa il posto sbagliato: risponde leggendo `POOLS`,
  cioè la capienza di partenza, mentre la UI vuole quella vera. Chi esegue [D017](../delega/D017-il-caveau.md)
  lo troverà come primo attrito, ed è dichiarato qui perché non sembri una scoperta.
- Il giorno in cui un secondo pool avrà una capienza variabile — le fiches del casinò, un
  portafoglio crypto — non c'è niente da riaprire: la funzione risponde per `pool`.
