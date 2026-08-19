# ADR 0020 — Ogni transazione bilancia a zero (partita doppia)

- **Stato:** Proposta — **decisa seguendo la direttiva "coerente, professionale, senza debiti"; contestabile**
- **Data:** 2026-08-19
- **Conseguenza di:** [ADR 0019](0019-transazioni-atomiche-nel-ledger.md)

## Contesto

Data la transazione multi-movimento dell'ADR 0019, resta una domanda: i movimenti devono
**sommare a zero**?

In un gioco il denaro nasce dal nulla (il reddito) e sparisce nel nulla (gli acquisti). La
risposta ingenua è no. La risposta contabile è sì: il denaro non nasce dal nulla, nasce da un
**conto sorgente** che va in negativo, e sparisce in un **conto pozzo** che va in positivo.

La differenza sembra formale. Non lo è, per un gioco con tredici domini che muovono denaro e un
problema di bilanciamento serio.

## Decisione

**Ogni transazione somma esattamente a zero.**

Accanto ai pool del giocatore esistono conti non-giocatore, che non compaiono mai nella UI:

| Conto   | Ruolo                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------------- |
| `world` | da dove nasce il reddito. Va in negativo, ed è giusto così                                                |
| `sink`  | dove finiscono gli acquisti e i costi                                                                     |
| `fees`  | commissioni, spread, percentuali. Separato dal `sink` perché è la voce che il bilanciamento guarda di più |
| `house` | il margine del banco al casinò                                                                            |

Il prelievo al bancomat diventa:

    card    − 500,00
    cash    + 497,50
    fees    +   2,50      → somma: 0

E il reddito:

    world   −  12,00
    cash    +  12,00      → somma: 0

Un'unica invariante, verificabile in ogni momento: **la somma di tutti i conti è zero.**

Le funzioni di comodo (`income()`, `spend()`, `transfer()`) costruiscono i movimenti mancanti da
sole: chi scrive un dominio non nomina mai `world` a mano.

## Alternative scartate

- **Movimenti semplici con categoria.** `post({ pool, +12, category: 'income' })` e basta: la
  categoria dice da dove viene. È più corto da scrivere e più immediato da capire.

  Scartata perché la categoria è un'**etichetta**, non un vincolo: nulla verifica che sia giusta,
  e un errore di somma da qualche parte non produce nessun sintomo. In un gioco dove il
  bilanciamento è il problema principale, "quanto denaro è stato creato in un'ora?" deve essere una
  **query esatta**, non una stima ricavata sommando etichette di cui nessuno garantisce la
  coerenza.

## Conseguenze

- `balance/targets.ts` diventa molto più forte: un bersaglio può essere _"in un'ora di gioco si
  creano fra X e Y, e le commissioni ne assorbono fra il 3% e il 7%"_. Sono numeri leggibili
  direttamente dai conti, non simulazioni approssimate.
- Un test di invariante uccide un'intera classe di difetti: se un arrotondamento perde un
  centesimo, **la somma non fa zero e il test è rosso**. Senza partita doppia quel centesimo si
  perde per sempre, in silenzio, e si scopre come "i numeri non tornano" fra sei mesi.
- Commissione, spread e percentuale sono la stessa cosa in tutti i domini: un movimento verso
  `fees`. Un solo concetto per ATM, casinò, black market e affitti.
- La telemetria economica è esatta per costruzione, non ricostruita.
- **Costo, dichiarato:** un concetto in più nel glossario e nel modello mentale. Chi apre il
  Ledger vede quattro conti che non sono del giocatore e deve capire perché ci sono. È il prezzo,
  ed è pagato una volta sola; le funzioni di comodo fanno sì che nessun dominio lo paghi di nuovo.
- I conti non-giocatore **entrano nel salvataggio**: senza, la somma non farebbe zero al
  ricaricamento e l'invariante si spezzerebbe al primo round-trip.

## Se non ti convince

L'alternativa scartata è completamente legittima, ed è quella che sceglierebbe la maggior parte
dei progetti. Il costo di cambiare idea **adesso** è nullo. Il costo di cambiare idea dopo tre
domini è una migrazione del salvataggio più una riscrittura di ogni chiamata al Ledger.
