# ADR 0001 — La simulazione gira nel renderer, `core/` è puro

- **Stato:** Proposta (in attesa di approvazione — STOP 1)
- **Data:** 2026-08-19

## Contesto

Nel progetto precedente il 98% della logica viveva nel renderer e il processo main era ridotto a
un file server. La conseguenza non è stata la lentezza: è stata che il _contratto di salvataggio_
è diventato una finzione, perché il renderer costruiva da solo l'oggetto salvato, versione inclusa.
Il difetto non era "logica nel posto sbagliato", era "nessun confine".

## Decisione

La simulazione gira nel **renderer**. Tutto ciò che sta sotto `src/core/**` non importa mai
`vue`, `pinia` né `electron`: è TypeScript puro che gira in Node.

Il processo main non ospita la simulazione, ma è proprietario del **contratto di persistenza**
(vedi ADR 0004). Il confine che conta è `core/` ↔ resto, non renderer ↔ main.

## Alternative scartate

- **Simulazione nel processo main, renderer come vista pura.** Ogni lettura della UI diventa
  traffico IPC, per un gioco singleplayer offline. Il guadagno cercato — "puro e testabile" — si
  ottiene con la regola no-Vue/no-Pinia, non spostando processo. Costo alto, beneficio nullo.
- **Simulazione in un Web Worker.** Aggiunge serializzazione a ogni frame per risolvere un
  problema di performance che non è stato misurato. Rimandata: la purezza di `core/` la rende
  adottabile in futuro senza rifattorizzare.

## Conseguenze

- I test del kernel e del dominio girano in Vitest/Node, senza browser e senza Electron.
- Il calcolo del progresso offline resta possibile: è una funzione pura di (stato, tick trascorsi).
- Serve una regola di lint che vieti gli import di `vue`/`pinia`/`electron` sotto `src/core/**`.
  Senza quella regola questo ADR è solo una buona intenzione.
