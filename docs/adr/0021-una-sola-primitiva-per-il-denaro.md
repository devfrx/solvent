# ADR 0021 — Una sola primitiva per il denaro: `post()` non esiste

- **Stato:** **Accettata** — il meccanismo è in `src/core/kernel/Ledger.ts` ([D007](../delega/D007-kernel-ledger.md))
- **Data:** 2026-08-19
- **Supera in parte:** [ADR 0019](0019-transazioni-atomiche-nel-ledger.md) — solo il paragrafo su `post()`

## Contesto

L'[ADR 0019](0019-transazioni-atomiche-nel-ledger.md) decide che la primitiva del Ledger è la
transazione, e aggiunge: _«`post()` resta, ed è zucchero per una transazione a un movimento solo:
i domini semplici non pagano la cerimonia»_.

Il giorno dopo l'[ADR 0020](0020-partita-doppia.md) decide che **ogni transazione somma
esattamente a zero**, e che una transazione che non bilancia lancia.

Le due frasi non possono stare insieme. Una transazione a un movimento solo non somma a zero:
`post({ pool: 'cash', amount: 12 })` è, per costruzione, la cosa che l'ADR 0020 dichiara essere un
bug. Lo zucchero dell'ADR 0019 era zucchero per un mondo senza partita doppia, ed è rimasto scritto
per un giorno in un mondo che nel frattempo l'aveva adottata.

L'audit dei documenti fatto dopo D005 ha trovato la contraddizione e ha deliberatamente **non**
scelto: la decisione spettava a chi avrebbe scritto il Ledger, perché è lì che si vede quanto
costa davvero.

## Decisione

**`post()` non esiste.** Il Ledger ha una primitiva sola:

    transaction(postings: readonly Posting[], meta: TransactionMeta): Result<Balances, LedgerError>

Chi muove denaro non scrive movimenti a mano: usa uno dei tre costruttori, che sono funzioni pure e
producono i movimenti già bilanciati.

| Costruttore                             | Movimenti                                                      |
| --------------------------------------- | -------------------------------------------------------------- |
| `income(pool, importo)`                 | `world −importo`, `pool +importo`                              |
| `spend(pool, importo)`                  | `pool −importo`, `sink +importo`                               |
| `transfer(da, a, importo, commissione)` | `da −importo`, `a +(importo−commissione)`, `fees +commissione` |

Il caso che l'ADR 0019 voleva rendere leggero — il reddito di un sistema semplice — è
`ledger.transaction(income('cash', guadagno), { reason: 'reason.income.tick' })`. Una riga, e
nessuna contropartita da ricordare.

## Alternative scartate

- **`post(pool, importo, controparte, meta)`, zucchero a due movimenti.** Sopravvive alla partita
  doppia perché costringe il chiamante a nominare il conto di contropartita — ma è esattamente ciò
  che [INV-10](../tracciabilita.md) vieta: nessun dominio deve nominare `world`, `sink` o `fees`.
  Sarebbero due porte d'ingresso dove ne basta una, e la seconda peggiore della prima.
- **`post(pool, importo, categoria)`, con la controparte dedotta dalla categoria.** Più corto di
  tutti, e già scartato dall'[ADR 0020](0020-partita-doppia.md): fa della categoria un vincolo
  invece che un'etichetta, e reintroduce nel kernel un `if` sul significato di un dato.

## Conseguenze

- **Un solo percorso di validazione.** Ogni riga di economia del progetto passa dalla stessa
  funzione, quindi l'invariante INV-08 si verifica in un punto solo e non in due che devono restare
  d'accordo.
- **Un solo punto da leggere** per sapere quando un saldo può cambiare. Era il motivo dell'ADR
  0003, e con due primitive sarebbe stato vero a metà.
- **Costo, dichiarato:** ogni chiamata al Ledger nomina un costruttore. È una parola in più rispetto
  a `post`, ed è la parola che dice da dove arriva il denaro — cioè l'informazione che nel progetto
  precedente mancava del tutto.
- Il paragrafo `post()` dell'ADR 0019 resta scritto dov'è: la storia delle decisioni è parte del
  valore, e questa è la seconda volta che una decisione presa guardando la visione ne corregge una
  presa il giorno prima.
