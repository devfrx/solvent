# ADR 0003 — Il Ledger è l'unica porta del denaro

- **Stato:** **Accettata** — D007: i saldi nella closure di `kernel/Ledger.ts`, e il lint di rete su R06
- **Data:** 2026-08-19
- **Aggiornata da:** [ADR 0019](0019-transazioni-atomiche-nel-ledger.md) e [ADR 0021](0021-una-sola-primitiva-per-il-denaro.md) — la firma qui sotto è cambiata due volte, il principio no

## Contesto

Nel progetto precedente i saldi venivano scritti da più punti, con due meccanismi di iniezione di
dipendenza basati su variabili globali. Non esisteva un modo di rispondere alla domanda
"da dove arrivano questi soldi?" se non leggendo tutto il codice.

## Decisione

`Ledger.post({ pool, amount, reason, category })` è l'**unico** modo di cambiare un saldo.
Valida, applica, ed emette `money.posted` sul Bus.

I saldi vivono in una `Map` privata dentro la closure del Ledger: non sono esposti su nessun
oggetto, quindi non c'è nulla da assegnare dall'esterno.

`reason` è una **chiave i18n tipizzata**, non una stringa libera: la UI la traduce, e l'insieme
delle ragioni possibili è enumerabile.

## Alternative scartate

- **Saldi negli store Pinia con azioni dedicate.** Rende il denaro non testabile fuori dal
  browser (viola ADR 0001) e riapre la porta a scritture dirette da qualunque componente.

## Conseguenze

- La telemetria economica — quanto entra, da dove, in quale categoria — è gratis, non è una
  feature da costruire dopo.
- Regola di lint `no-restricted-syntax` sugli assegnamenti a `.balance` / `.cash` / `.money`
  fuori da `Ledger.ts`, come rete di sicurezza contro nuove pool aggiunte male.
