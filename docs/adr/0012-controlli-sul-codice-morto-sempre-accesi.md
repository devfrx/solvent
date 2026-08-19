# ADR 0012 — `noUnusedLocals` e `noUnusedParameters` non si spengono mai

- **Stato:** Proposta
- **Data:** 2026-08-19
- **Copre il difetto:** A14 (`theme.css` morto per 1.067 righe, API morte in `usePlayerStore`)

## Contesto

Nel progetto precedente c'erano 1.067 righe di CSS mai usate e diverse funzioni esportate che
nessuno chiamava. Non era pigrizia: era che nulla lo segnalava, quindi il codice morto era
indistinguibile dal codice vivo a colpo d'occhio.

## Decisione

`noUnusedLocals: true` e `noUnusedParameters: true` in `tsconfig`. Accesi dal primo commit, mai
spenti — nemmeno temporaneamente durante un refactoring.

Un parametro che davvero non serve si prefissa con `_`: è una dichiarazione esplicita
("so che non lo uso"), leggibile in review, non un aggiramento silenzioso.

## Alternative scartate

- **`knip` o `ts-prune` in CI al posto dei due flag.** Non è un'alternativa: è un complemento.
  I due flag costano zero e agiscono mentre scrivi; un tool in CI agisce dopo. Si aggiunge un
  tool solo per ciò che i flag non vedono, e non prima che serva.

## Conseguenze

- Il codice morto non sopravvive alla giornata in cui nasce.
- Costo accettato: durante un refactoring il typecheck è rumoroso. È esattamente il punto — sta
  segnalando lavoro non finito.
- **Limite onesto:** i due flag non vedono il CSS morto, né gli `export` che nessun altro modulo
  importa. Per quelli serve un tool dedicato. Decisione: si valuta all'ingresso della seconda
  fetta verticale, quando esisterà abbastanza superficie perché il problema sia reale.
