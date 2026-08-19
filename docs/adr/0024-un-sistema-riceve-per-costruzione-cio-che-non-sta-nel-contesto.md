# ADR 0024 — Un sistema riceve per costruzione ciò che non sta nel contesto

- **Stato:** **Accettata** — D010: `createIncome(ledger, modifiers)` e nessun singleton in `balance/`
- **Data:** 2026-08-19

## Contesto

`SystemContext` ha quattro campi — `clock`, `rng`, `bus`, `ledger` — e arriva a ogni `tick`. Il
registro dei modificatori non è fra questi e **non può esserci**: vive in `balance/`, e `kernel/`
non può importare `balance/` (INV-01, [ADR 0001](0001-simulazione-nel-renderer-core-puro.md)).
[D008](../delega/D008-balance.md) l'aveva registrato come una scelta rimandata a D010 e D011.

Il primo sistema con stato ha reso la domanda concreta in due modi diversi, e conviene tenerli
distinti:

- il **tick** ha bisogno dei modificatori per calcolare il reddito;
- il **comando** di acquisto ha bisogno del Ledger, ma parte dalla UI, cioè fuori da ogni `tick`,
  dove nessun `SystemContext` esiste ([flusso-tick.md](../design/flusso-tick.md)).

## Decisione

Un dominio espone una **factory**, non un sistema già costruito. Tutto ciò che gli serve e che non
sta nel `SystemContext` arriva come parametro di quella factory:

    export const createIncome = (ledger: Ledger, modifiers: Modifiers): Income => …

La factory ritorna il sistema da registrare **e** i comandi già legati al proprio contesto. Il
bootstrap (`createGame.ts`, [D011](../delega/D011-runtime-e-store.md)) è l'unico posto che
costruisce le istanze condivise e le distribuisce, e ne discende una freccia
`renderer/runtime --> core/balance` che il diagramma di [architettura.md](../architettura.md) non
disegnava.

Dentro il `tick`, il Ledger si legge **dal contesto** e non dalla closure: il contesto resta la
via normale, e la cattura è l'eccezione dichiarata per i comandi.

## Alternative scartate

- **Un singleton in `balance/`** (`export const MODIFIERS = createModifiers()`). Non aggiunge
  parametri e non tocca il diagramma. È stato scartato perché è stato scartato dappertutto
  altrove: `Registry.ts` scrive che il contesto "arriva per parametro a ogni `tick`, **mai come
  singleton**: è il prezzo di un `core/` puro". Un registro globale rende due test dello stesso
  file dipendenti l'uno dall'altro, e la dipendenza smette di essere visibile nella firma.
- **Spostare `Modifiers` in `contracts/` e metterlo nel `SystemContext`.** Risolverebbe il vincolo
  di import e sarebbe la forma più diretta. Costa però il tipo condiviso più grande del progetto —
  ogni sistema riceverebbe un registro che quasi nessuno usa — e riapre una decisione che D008 ha
  già chiuso. Il grilletto per riaprirla è reale: **tre** domini che ricevono lo stesso oggetto per
  costruzione senza usarlo.
- **Passare i modificatori a ogni chiamata** invece che alla costruzione. Sposta la domanda al
  chiamante e la ripete a ogni riga, senza togliere niente.

## Conseguenze

- Un sistema non è più un valore ma il risultato di una chiamata: il bootstrap ha una riga in più
  per dominio, ed è la stessa riga che l'[ADR 0002](0002-registry-unica-lista-di-sistemi.md) già
  accetta come prezzo dell'ordine dichiarato.
- **Nessun tipo garantisce che il `Ledger` catturato dal comando sia quello del `SystemContext`.**
  Due istanze diverse sono due partite diverse. È il prezzo di avere i comandi fuori dal tick, e si
  paga una volta sola nel bootstrap.
- I test costruiscono ciò che serve e nient'altro: `createIncome(ledger, modifiers)` con un Ledger
  vero e un registro vuoto è tutta l'impalcatura necessaria a provare il primo dominio.
