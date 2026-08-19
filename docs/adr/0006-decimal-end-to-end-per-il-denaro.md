# ADR 0006 — Il denaro è `Decimal` end-to-end

- **Stato:** **Accettata** — D002: `contracts/money.ts` e il lint sulle conversioni sotto `domains/**`
- **Data:** 2026-08-19

## Contesto

Nel progetto precedente la pipeline dei ricavi d'impresa mescolava `number` e `Decimal`: bastava
un passaggio intermedio in `number` per perdere precisione, e il punto in cui succedeva non era
visibile leggendo la firma delle funzioni.

## Decisione

`type Money = Decimal` (`decimal.js`). Ledger, regole di dominio e modificatori accettano e
ritornano **solo** `Money`.

Le conversioni da/verso `number` esistono in **un solo file di confine**,
`src/core/contracts/money.ts` (`fromNumber`, `toDisplayNumber`), il cui import è vietato da lint
sotto `src/core/domains/**`: le conversioni sono legittime solo al livello di presentazione.

Nel salvataggio il denaro è una **stringa**, mai un `number`.

## Alternative scartate

- **Interi in centesimi con `bigint`.** Preciso e veloce, ma un idle game vive di moltiplicatori
  frazionari e di numeri enormi: formattazione, tassi e potenze diventerebbero codice scritto a
  mano attorno a `bigint`, cioè un `Decimal` peggiore.

## Conseguenze

- La regola è **gratis**: `Decimal` è una classe, quindi TypeScript rifiuta da solo un `number`
  dove serve `Money`, e rifiuta anche `a + b` e `a * b` su due `Decimal`. Non serve un lint.
- Costo accettato: si scrive `a.plus(b)`, non `a + b`.
