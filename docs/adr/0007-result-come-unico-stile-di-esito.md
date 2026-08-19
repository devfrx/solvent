# ADR 0007 — `Result<T, E>` come unico stile di esito

- **Stato:** Proposta
- **Data:** 2026-08-19

## Contesto

Nel progetto precedente convivevano 62 funzioni che ritornavano un `boolean` nudo e 35 che
ritornavano `{ success: … }`. Un `false` non dice _perché_, e la UI finiva per indovinare il
messaggio d'errore o per non mostrarne nessuno.

## Decisione

    type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

`E` ha sempre un `code` (chiave i18n) e un contesto tipizzato — es.
`{ code: 'error.insufficient_funds', required: Money, available: Money }`.

Tutti i comandi e `Ledger.post` ritornano `Result`.

## Alternative scartate

- **Eccezioni.** Un fallimento previsto — fondi insufficienti — non è eccezionale. Le eccezioni
  saltano il type checker: nessuna firma dice quali errori possono uscire.

## Conseguenze

- Il tipo `CommandHandler` **obbliga** a ritornare `Result`: nei comandi la regola è imposta dal
  compilatore.
- Fuori dai comandi la regola è solo parzialmente meccanizzabile. Proposta di rinforzo: una
  regola `no-restricted-syntax` che vieta i literal con chiave `success`, così l'unica forma
  disponibile resta `Result`. Vedi la tabella in `docs/architettura.md`.
