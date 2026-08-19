# Documenti di delega

Una **delega** è un pacchetto di lavoro autosufficiente: chi la prende in mano deve poterla
eseguire senza fare domande e senza aver letto la conversazione in cui è nata.

Vale per una persona, per un agente, o per me stesso fra tre mesi — che è lo stesso caso.

## Cosa contiene una delega

| Sezione                  | A cosa serve                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **Intestazione**         | stato, dipendenze, cosa sblocca, ADR vincolanti, regole applicabili, budget di righe |
| **Obiettivo**            | una frase. Se ne servono due, la delega è due deleghe                                |
| **Da produrre**          | i file esatti, con il loro contenuto atteso                                          |
| **Invarianti**           | ciò che deve essere vero quando la delega è chiusa, e restare vero dopo              |
| **Fuori scope**          | ciò che è tentante fare qui e va fatto altrove, o mai                                |
| **Definizione di fatto** | la lista di spunte. Tutte, non alcune                                                |
| **Trappole note**        | cosa è andato storto nel progetto precedente in questo punto preciso                 |

La sezione **Fuori scope** è quella che fa il lavoro: senza, ogni delega assorbe le vicine e si
torna a costruire venti cose insieme (ADR 0014).

## Il budget di righe

Ogni delega dichiara un ordine di grandezza. Non è un limite contrattuale: è un **allarme**.

Se la delega del Registry dichiara ~140 righe e ne stai scrivendo 400, non hai sforato un budget:
stai risolvendo un problema diverso da quello descritto. Fermati e dillo, invece di continuare.

Il kernel intero — D003 fino a D008 — sta in ~500 righe. È una specifica, non una speranza.

## Ciclo di vita

    Aperta  →  In corso  →  Chiusa

- **Aperta**: scritta, dipendenze non ancora soddisfatte, oppure nessuno ci sta lavorando.
- **In corso**: esiste un ramo `dNNN-slug`.
- **Chiusa**: la definizione di fatto è tutta verde. Si annota il commit e non si tocca più.

Una delega chiusa è un **documento storico**, non una fonte di verità sul codice corrente. Le
firme che contiene descrivono ciò che è stato chiesto, non ciò che c'è: per quello si legge il
codice. È la ragione per cui i documenti vivi ([architettura](../architettura.md),
[tracciabilità](../tracciabilita.md), [glossario](../glossario.md)) non duplicano mai le firme.

## L'ordine, e perché è questo

```mermaid
flowchart TD
  D001["D001 · Tooling e gate"] --> D002["D002 · Contratti"]
  D002 --> D003["D003 · Clock"]
  D002 --> D004["D004 · Rng"]
  D002 --> D005["D005 · Bus"]
  D003 --> D006["D006 · Registry"]
  D004 --> D006
  D005 --> D006
  D005 --> D007["D007 · Ledger"]
  D006 --> D008["D008 · Balance"]
  D007 --> D008
  D002 --> D009["D009 · Persistenza (main)"]
  D006 --> D009
  D008 --> D010["D010 · Dominio income"]
  D007 --> D014["D014 · Dominio bancomat"]
  D008 --> D014
  D009 --> D011["D011 · Runtime e store"]
  D010 --> D011
  D014 --> D011
  D011 --> D012["D012 · UI e i18n"]
  D012 --> D013["D013 · Verifica della fetta — STOP 2"]
```

**D001 è prima di tutto, e non è un caso.** Le regole devono esistere prima del codice che
governano. Se il lint arriva dopo, il primo codice nasce fuori regola e la prima cosa che si fa è
un'eccezione — che poi diventa la norma. È letteralmente il difetto A16: un formattatore
configurato dopo che c'erano già 156 file.

## Indice

| ID                                   | Titolo                                                                | Budget                | Stato      |
| ------------------------------------ | --------------------------------------------------------------------- | --------------------- | ---------- |
| [D001](D001-tooling-e-gate.md)       | Tooling, regole e gate di qualità                                     | 191 config + 265 test | **Chiusa** |
| [D002](D002-contratti.md)            | Contratti: `Result`, `Money`, `bounded`, eventi, salvataggio, comandi | ~120                  | Aperta     |
| [D003](D003-kernel-clock.md)         | Kernel: Clock                                                         | ~40                   | Aperta     |
| [D004](D004-kernel-rng.md)           | Kernel: Rng                                                           | ~70                   | Aperta     |
| [D005](D005-kernel-bus.md)           | Kernel: Bus                                                           | ~50                   | Aperta     |
| [D006](D006-kernel-registry.md)      | Kernel: Registry                                                      | ~140                  | Aperta     |
| [D007](D007-kernel-ledger.md)        | Kernel: Ledger — pool, transazioni atomiche, partita doppia           | ~170                  | Aperta     |
| [D008](D008-balance.md)              | Balance: costanti, modificatori, bersagli                             | ~90                   | Aperta     |
| [D009](D009-persistenza-main.md)     | Persistenza nel processo main                                         | ~180                  | Aperta     |
| [D010](D010-dominio-income.md)       | Dominio: income                                                       | ~90                   | Aperta     |
| [D014](D014-dominio-bancomat.md)     | Dominio: bancomat — deposita, preleva, commissione                    | ~80                   | Aperta     |
| [D011](D011-runtime-e-store.md)      | Runtime e store                                                       | ~120                  | Aperta     |
| [D012](D012-ui-e-i18n.md)            | UI e i18n — home ATM, carta 3D                                        | ~230                  | Aperta     |
| [D013](D013-verifica-della-fetta.md) | Verifica della fetta — STOP 2                                         | ~250 di test          | Aperta     |

D014 ha il numero più alto perché è nata dopo, con gli ADR 0017–0020. Nel grafo sopra si vede dove
sta davvero: accanto a D010, prima di D011. **La numerazione è cronologica, l'ordine è il grafo** —
rinumerare romperebbe i riferimenti nei commit e nella tracciabilità.

Il kernel — D003, D004, D005, D006, D007, D008 — sta in **~560 righe**. Il budget iniziale era
~500: la crescita viene tutta dal Ledger (ADR 0017, 0019, 0020) ed è dichiarata, non subita.
