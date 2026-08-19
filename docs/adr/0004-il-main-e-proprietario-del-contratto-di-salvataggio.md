# ADR 0004 — Il processo main è proprietario del contratto di salvataggio

- **Stato:** **Accettata** — D009: `main/save/schema.ts` eseguito a ogni giro, la scrittura
  atomica in `main/save/SaveFile.ts`, le migrazioni in un posto solo e i tre canali IPC
- **Data:** 2026-08-19

## Contesto

Nel progetto precedente il renderer scriveva `version: 3` hardcoded nell'oggetto salvato,
esistevano due sistemi di migrazione paralleli, e 915 righe di schema si dichiaravano "advisory"
— cioè non venivano eseguite — ed erano già disallineate dalla realtà.

Uno schema che non valida nulla è documentazione che mente.

## Decisione

Il renderer produce un `SavePayload`: un tipo che **non contiene un campo versione**.

Il main lo avvolge:

    SaveEnvelope = { version: number, savedAt: number, payload: SavePayload }

Il main è l'unico che scrive `version` e `savedAt`, l'unico che valida (con uno schema
**eseguibile**, non descrittivo), l'unico che scrive su disco (in modo atomico: file temporaneo

- rename), e l'unico che contiene le migrazioni, in `src/main/save/migrations.ts`.

## Alternative scartate

- **Schema condiviso, validato da entrambi i lati.** Due validatori divergono nel tempo — è
  esattamente il difetto misurato nel progetto precedente. Un solo punto di verità o nessuno.

## Conseguenze

- Il renderer non _può_ scrivere una versione sbagliata, perché il tipo non ha quel campo.
  La regola è imposta dal type checker, non dalla disciplina.
- Il denaro attraversa il confine come **stringa decimale**, mai come `number` (vedi ADR 0006).
- Il test round-trip (costruisci stato → salva → ricarica → confronta) attraversa questo confine
  per intero. È la rete che impedisce a metà dei difetti di persistenza di nascere.
