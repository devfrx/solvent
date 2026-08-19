# D004 — Kernel: Rng

- **Stato:** Aperta
- **Dipende da:** D002
- **Sblocca:** D006
- **ADR vincolanti:** 0005
- **Regole:** R03
- **Budget:** ~70 righe

## Obiettivo

Rendere ogni futura sorgente di casualità del gioco riproducibile e indipendente dalle altre.

## Da produrre

`src/core/kernel/Rng.ts`

- mulberry32, o un PRNG equivalente a stato piccolo e serializzabile
- `stream(id)`: uno stream per dominio, con il proprio cursore
- `save()` / `load()` / `reset(seed)`
- **è l'unico file del progetto in cui `Math.random` è consentito**, e solo per generare il seed
  iniziale di una partita nuova, con l'`eslint-disable` motivato previsto dalle
  [convenzioni](../convenzioni.md#eslint-disable)

## Invarianti

- Consumare da uno stream **non** sposta la sequenza di nessun altro stream.
- `load(save())` riproduce esattamente la stessa sequenza successiva. Questa è la proprietà su cui
  poggia il round-trip: se cade, il salvataggio non è deterministico.
- Lo stato di uno stream è `{ seed, cursore }`, cioè due numeri: serializzabile senza cerimonie.
- Superficie **minima**: `next()`. Nessun `int`, `pick`, `chance` finché non esiste un consumatore
  ([registro YAGNI](../roadmap-fette.md)).

## Fuori scope

- Gli helper sopra. Il grilletto è la fetta 05.
- Distribuzioni non uniformi.
- Qualsiasi uso dell'Rng nel dominio della fetta 01: la fetta è deterministica di proposito.

## Definizione di fatto

- [ ] test: stesso seed, stessa sequenza, due istanze indipendenti
- [ ] test: 100 estrazioni dallo stream `a` non cambiano la prima estrazione dello stream `b`
- [ ] test: `load(save())` a metà sequenza continua identico
- [ ] test: `reset(seed)` riporta i cursori a zero
- [ ] test statistico minimo su `next()`: media e distribuzione su 100.000 estrazioni entro
      tolleranza — un PRNG rotto che ritorna sempre `0.5` passerebbe tutti i test sopra
- [ ] `grep -rn "Math.random" src/` restituisce solo `Rng.ts`

## Trappole note

- **A03.** 176 sorgenti casuali erano nate una alla volta, ognuna "solo questa". Il lint è
  l'unica difesa che non si stanca.
- Uno stream globale unico sembra più semplice finché non aggiungi un sistema: allora tutti i test
  di bilanciamento cambiano risultato per una modifica non correlata.
- Il test statistico è quello che si dimentica sempre, ed è l'unico che accorge se il PRNG è
  sbagliato invece che solo deterministico.
