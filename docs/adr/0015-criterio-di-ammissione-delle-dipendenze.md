# ADR 0015 — Criterio di ammissione delle dipendenze

- **Stato:** Proposta — richiede l'approvazione delle tre dipendenze elencate
- **Data:** 2026-08-19

## Contesto

Ogni dipendenza è una decisione strutturale: vincola la superficie API, il bundle, il ritmo degli
aggiornamenti e le possibilità future. Trattarla come un dettaglio è il modo in cui un progetto si
ritrova con dieci librerie che fanno l'ottanta per cento della stessa cosa.

## Decisione

**Criterio di ammissione.** Si accetta una dipendenza quando sostituisce codice che dovremmo
scrivere e mantenere noi **e** la cui definizione di "corretto" non è ovvia — aritmetica decimale,
plurali per locale, validazione a runtime. Si rifiuta quando è zucchero sintattico su qualcosa che
il linguaggio già fa.

**Le tre dipendenze di runtime approvate all'origine:**

| Pacchetto    | Reso necessario da | Cosa scriveremmo a mano al suo posto                                                                                       |
| ------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `decimal.js` | ADR 0006           | aritmetica decimale arbitraria: qualche centinaio di righe con una definizione di corretto non banale                      |
| `vue-i18n`   | ADR 0011           | plurali e formattazione numerica per locale: si riscrive, male, entro un mese                                              |
| `zod`        | ADR 0004           | validazione a runtime dello schema: è esattamente il codice che nel progetto precedente era diventato 915 righe "advisory" |

**Invariante INV-01:** `src/core/**` dipende **solo** da `decimal.js`. Nient'altro. `zod` vive nel
main, `vue-i18n` nel renderer. Imposto da una allowlist in `no-restricted-imports` sotto `core/`.

**Per ogni aggiunta futura servono tre cose:** (1) quale regola o ADR la rende necessaria, (2) cosa
scriveremmo a mano al suo posto e quante righe, (3) un ADR. Nessuna dipendenza "di comodo".

## Alternative scartate

Le alternative a ciascuna delle tre stanno negli ADR che le richiedono: 0006, 0011, 0004. Qui si
decide solo il **criterio**, che è la parte riutilizzabile.

## Conseguenze

- La superficie di dipendenza del kernel resta minuscola e verificabile con un lint, non con la
  memoria di chi fa la review.
- Aggiungere una libreria costa un ADR: abbastanza da fermare le aggiunte per pigrizia, abbastanza
  poco da non fermare quelle giuste.
