# ADR 0017 — Il denaro è plurale: pool con affordance diverse

- **Stato:** Proposta
- **Data:** 2026-08-19
- **Origine:** preferenza [P4](../prodotto/preferenze.md#p4--contanti-e-carta-sono-due-strumenti-con-scopi-diversi)

## Contesto

Il progetto ha due strumenti di pagamento — contanti e carta — che si possono usare **ovunque**,
ma che costano, rischiano e rendono in modo diverso. Il casinò ne introduce un terzo, le fiches,
con una conversione a spread.

La tentazione è trattarlo come un dettaglio di presentazione: un saldo solo, e la UI mostra due
etichette. Sarebbe l'errore strutturale più costoso possibile, perché la scelta _con cosa pago_ è
il meccanismo centrale del gioco: è ciò che rende ogni dominio una decisione invece che un
pulsante.

Il progetto precedente aveva già capito questo — c'erano un selettore di pagamento nel black
market e un badge per gli oggetti legati alla carta — ma lo aveva capito **dopo**, a domini già
scritti, quindi ogni dominio gestiva la cosa a modo suo.

## Decisione

**`Pool` è una dimensione di prima classe del Ledger**, non un'etichetta della UI. Ogni pool
dichiara le proprie proprietà come **dati**, non come `if` sparsi nei domini:

| Proprietà       | Cosa esprime                                                               |
| --------------- | -------------------------------------------------------------------------- |
| `traceable`     | se i movimenti lasciano traccia                                            |
| `capacity`      | il tetto fisico, se esiste (i contanti nel caveau ce l'hanno; la carta no) |
| `yields`        | se il saldo fermo produce interessi                                        |
| `convertibleTo` | verso quali pool si può convertire, e con quale costo o spread             |

**Ogni azione che muove denaro dichiara quali pool accetta, e con quale modificatore.** Non
esistono azioni che assumono uno strumento: esistono azioni che dicono "contanti a prezzo pieno,
carta con +40% di calore".

**Il rifiuto per strumento è un errore tipizzato**, non un pulsante disabilitato:
`error.ledger.pool_not_accepted`, con dentro quali pool sarebbero andati bene. La UI può quindi
spiegare _perché_, che è la differenza fra un gioco leggibile e uno che ti lascia indovinare.

Per la **fetta 01** esistono due pool, `cash` e `card`, senza capacità e senza interessi: le
proprietà arrivano con i domini che le rendono vere. La _forma_ c'è da subito, i valori no.

## Alternative scartate

- **Un saldo unico con un'etichetta nella UI.** Costa zero oggi e costa una riscrittura del Ledger
  più una migrazione del salvataggio il giorno in cui il primo dominio ha bisogno di distinguerli.
  Ed è il giorno del **secondo** dominio, non del decimo.
- **Un sistema di dominio "wallet" sopra un Ledger a saldo unico.** Sposta il problema di un
  livello: il Ledger continuerebbe a non sapere cosa sta muovendo, quindi non potrebbe validare
  né la capacità né l'affordance. Ogni dominio dovrebbe ricordarsi di chiedere al wallet — cioè
  esattamente la disciplina che l'ADR 0003 esiste per non dover chiedere.
- **Pool come stringhe libere.** Rende impossibile al compilatore verificare che ogni azione
  dichiari i pool che accetta.

## Conseguenze

- La dualità è **strutturale dalla fetta 01**. È l'unica cosa della
  [visione](../prodotto/visione.md) che non aspetta: ritirarla dopo costerebbe una migrazione.
- Il Ledger deve poter spostare denaro fra pool in modo atomico, con commissione. Vedi
  [ADR 0019](0019-transazioni-atomiche-nel-ledger.md) — è una conseguenza diretta di questa
  decisione, scoperta guardando l'ATM prima di scrivere il kernel.
- `LedgerSave` cambia forma: da un saldo a una mappa pool → stringa decimale. Nasce già così, non
  ci arriva con una migrazione.
- Le fiches del casinò **non** sono una terza valuta parallela: sono un pool con
  `convertibleTo: cash` a spread e nessun altro sbocco. La stessa struttura le regge senza
  aggiunte.
- Costo accettato: ogni chiamata al Ledger deve dire da quale pool. È verbosità, ed è quella
  giusta — è la domanda che il gioco pone al giocatore a ogni schermata.
