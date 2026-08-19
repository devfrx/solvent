# ADR 0013 — Prettier è l'unica autorità sulla formattazione

- **Stato:** Proposta
- **Data:** 2026-08-19
- **Copre il difetto:** A16 (154 file su 156 che il formattatore avrebbe riscritto)

## Contesto

Nel progetto precedente il formattatore era configurato ma il codice non era formattato: 154 file
su 156 sarebbero stati riscritti eseguendolo. Un formattatore in quello stato è peggio che
assente, perché eseguirlo produce un diff di 154 file che seppellisce qualunque modifica reale —
quindi nessuno lo esegue mai, e la configurazione mente.

## Decisione

`.prettierrc.json` e `.editorconfig` descrivono la formattazione che il progetto usa **davvero**,
inclusi i file `.vue`. Il primo commit è già formattato.

`npm run format:check` è un **gate**: se è rosso, il lavoro non è finito. Non è un suggerimento.

`eslint-config-prettier` disattiva in ESLint tutte le regole di stile, così i due strumenti non
possono dare verdetti opposti sullo stesso file. Divisione netta: **Prettier formatta, ESLint
giudica la struttura.**

## Alternative scartate

- **Solo ESLint con regole stilistiche.** Formatta i template `.vue` peggio, e mescola due
  responsabilità che è più semplice tenere separate. Con due strumenti sullo stesso terreno,
  prima o poi danno verdetti opposti e qualcuno disattiva quello scomodo.

## Conseguenze

- Nessuna discussione sulla formattazione, mai, in nessuna review.
- La formattazione non diventa mai un diff separato: non esiste il commit "format all files" che
  nasconde una modifica funzionale in mezzo.
