# D009 — Persistenza nel processo main

- **Stato:** Aperta
- **Dipende da:** D002, D006
- **Sblocca:** D011
- **ADR vincolanti:** 0004, 0006, 0010
- **Regole:** R08, R09, INV-03, INV-04
- **Budget:** ~180 righe

## Obiettivo

Rendere il contratto di salvataggio un fatto verificato dal codice, non un documento che si
dichiara autorevole.

## Da produrre

`src/main/save/`

| File            | Contenuto                                                                                |
| --------------- | ---------------------------------------------------------------------------------------- |
| `schema.ts`     | schema `zod` della busta e del payload — **eseguito**, non descrittivo                   |
| `SaveFile.ts`   | lettura e scrittura atomica (temporaneo + rename), percorso in `app.getPath('userData')` |
| `migrations.ts` | la mappa versione → versione+1. Per la versione 1: vuota, e va bene                      |
| `ipc.ts`        | i tre canali `save`, `load`, `reset`, tipizzati                                          |

`src/preload/index.ts` — espone **solo** questi tre, nient'altro.

## Invarianti

- Il main è l'unico che scrive `version` e `savedAt` (R08).
- **Non si scrive mai un payload non valido.** In caso di fallimento, il file precedente resta
  intatto e l'errore torna al renderer con il percorso del campo che ha fallito.
- Scrittura atomica: temporaneo, `fsync`, `rename`. Un crollo a metà non lascia un file troncato.
- In caricamento: si valida la busta, **poi** si migra, **poi** si valida il payload migrato.
  Validare prima di migrare fallisce sempre, e chi lo sistema di solito lo sistema togliendo la
  validazione.
- Lo schema rifiuta un array che supera il `max` dichiarato per quella lista (R09).
- Lo schema rifiuta un numero dove il contratto vuole una stringa decimale (INV-04).
- `contextIsolation` acceso, `nodeIntegration` spento, `sandbox` acceso. Il preload espone tre
  funzioni, non `ipcRenderer`.
- Il main non importa nulla da `core/` a parte `contracts/save.ts` (INV-03).

## Fuori scope

- Migrazioni vere: non esistono per la versione 1 ([roadmap](../roadmap-fette.md)).
- Salvataggi multipli, slot, backup a rotazione.
- Cifratura o firma del salvataggio: è un singleplayer offline (vedi [rischi](../rischi.md), parte 3).
- Salvataggio automatico a intervalli: fetta 03, insieme al progresso offline.

## Definizione di fatto

- [ ] test: busta valida → scritta → riletta → identica
- [ ] test: payload non valido → **nessuna** scrittura, file precedente intatto, errore col
      percorso del campo
- [ ] test: file assente → `ok` con "nessun salvataggio", non un errore
- [ ] test: JSON illeggibile → errore `error.save.corrupt`, il file non viene toccato
- [ ] test: una lista oltre il proprio `max` viene rifiutata dallo schema
- [ ] test: un `number` al posto di una stringa decimale viene rifiutato
- [ ] test: la busta con una versione **futura** viene rifiutata con un messaggio chiaro — un
      salvataggio di una versione più nuova non va migrato all'indietro né aperto a forza
- [ ] verifica manuale: uccidere il processo durante la scrittura non lascia un file troncato

## Trappole note

- **A08.** Le 915 righe di schema "advisory" erano nate valide. Sono diventate stale perché nessuno
  le eseguiva. Uno schema che non fallisce mai non sta validando: sta decorando.
- **A07.** La versione tende a filtrare nel payload attraverso un campo "meta" o "info". Ogni
  campo aggiunto alla busta va guardato con sospetto.
- La versione futura è il caso che nessuno gestisce e che si presenta al primo utente che apre una
  build vecchia dopo aver provato una nuova. Il comportamento corretto è rifiutare e dirlo.
- `fsync` prima del `rename` sembra eccessivo finché non capita una perdita di corrente.
