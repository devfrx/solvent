# ADR 0005 — Un solo PRNG seedato, con stream separati per dominio

- **Stato:** **Accettata** — D004: `kernel/Rng.ts`, gli stream per dominio e il lint su `Math.random`
- **Data:** 2026-08-19

## Contesto

Nel progetto precedente c'erano 176 sorgenti di casualità dirette (`Math.random`). Conseguenze:
save-scum banale (ricaricare cambiava l'esito), bilanciamento non riproducibile, e nessun test
di dominio deterministico possibile.

## Decisione

Un solo PRNG seedato (mulberry32), con **stream indipendenti per dominio**
(`rng.stream('income')`, `rng.stream('market')`, …). Lo stato — seed più un cursore per stream —
è serializzabile ed **entra nel salvataggio**.

Superficie minima adesso: `next()`, più `save`/`load`/`reset`. Gli helper (`int`, `pick`,
`chance`) si aggiungono quando esiste il primo consumatore reale, non prima.

## Alternative scartate

- **Un solo stream globale.** Aggiungere una chiamata random dentro un sistema sposta la
  sequenza di tutti gli altri: i test di bilanciamento diventerebbero fragili a ogni modifica
  non correlata.

## Conseguenze

- `Math.random` è vietato da lint ovunque tranne `src/core/kernel/Rng.ts`.
- I test di dominio girano con seed fisso e producono lo stesso risultato ogni volta.
- Ricaricare un salvataggio riproduce la stessa sequenza: niente save-scum senza volerlo.
