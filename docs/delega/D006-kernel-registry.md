# D006 — Kernel: Registry

- **Stato:** **Chiusa** — 2026-08-19, commit `39b8520`, ramo `d006-kernel-registry`
- **Dipende da:** D003, D004, D005
- **Sblocca:** D008, D009
- **ADR vincolanti:** 0002
- **Regole:** R02, R07 · Invarianti INV-05
- **Budget:** ~140 righe → **consuntivo: 124 righe di codice** (214 con i commenti) + 406 di test

## Obiettivo

Essere l'**unica** lista di sistemi del progetto, e rendere impossibile registrare un sistema con
stato che non sappia salvarsi, ricaricarsi e azzerarsi.

## Da produrre

`src/core/kernel/Registry.ts`

- `ORDER`: le costanti nominate delle fasi di tick, raggruppate e commentate
- i tipi `Stateless` / `Stateful<S>` / `AnySystem`, con `defineSystem` sovraccaricato
- `SystemContext`
- `Registry` con `register`, `systems`, `tickAll`, `saveAll`, `loadAll`, `resetAll`, `statsAll`

## Invarianti

- **Cinque operazioni, una lista.** `tickAll`, `saveAll`, `loadAll`, `resetAll`, `statsAll`
  iterano lo stesso array. Nessuna di esse contiene un `if` o uno `switch` su un `id` di sistema:
  se ce ne fosse uno, il difetto A01 sarebbe tornato con un altro nome.
- Un sistema con `save` **deve** avere `load` e `reset`: lo impone il tipo, non un controllo a
  runtime.
- `register` con un `id` già presente **lancia**. Due sistemi con lo stesso id significa un
  salvataggio che si sovrascrive da solo.
- L'ordine di `systems()` è stabile e determinato solo da `order`, mai dall'ordine di
  registrazione. A parità di `order`, l'ordine è deterministico e dichiarato (per `id`).
- `loadAll` con un id sconosciuto nel salvataggio **non** lancia: ritorna un `Result` con l'elenco
  degli id ignorati. Un sistema rimosso in una versione nuova non deve impedire il caricamento.
- `loadAll` con un id noto ma assente dal salvataggio lo lascia al suo stato iniziale: è un
  sistema nuovo, non un errore.
- Il Registry non conosce Vue, Pinia, il salvataggio su disco, né alcun dominio.

## Sei correzioni rispetto a com'era scritta questa delega

**1. Il lato errore di `loadAll` non è vuoto.** La delega descrive un solo esito: `ok` con gli id
ignorati. Un `Result` il cui errore non può mai accadere è `Result<T, never>`, cioè un tipo che
obbliga ogni chiamante a scrivere un ramo morto — e la prima persona che se ne accorge toglie il
`Result`, non il ramo.

L'errore che mancava esiste davvero. `SystemsSave` è opaco per costruzione
(`Record<string, unknown>`, deciso in [D002](D002-contratti.md)), quindi lo schema `zod` del main
**non può** verificare la forma dello stato di un sistema: un salvataggio manomesso — che
[rischi.md](../rischi.md) parte 3 accetta esplicitamente — arriva intatto fino al `load`. Ora un
`load` che lancia diventa `error.registry.load_failed` con l'id e la causa, e chi chiama entra
nello stato `Errore` di [ciclo-di-vita.md](../design/ciclo-di-vita.md) invece di crollare.

Si ferma al primo che fallisce: continuare a caricare sopra uno stato già rotto non lo aggiusta,
e rende la diagnosi peggiore. Metà stato caricato è accettabile **perché** l'esito è un errore —
si va in `Errore`, non in `InGioco`.

**2. `SystemContext` ha tre campi, non quattro.** Il [glossario](../glossario.md) dice "Clock, Rng,
Bus e Ledger". Il Ledger è [D007](D007-kernel-ledger.md), che nel grafo viene **dopo**: D006 non
dipende da D007, e non poteva. Non è un rinvio comodo, è il grafo. Costa una riga aggiungerlo
quando esisterà, e oggi non c'è un solo sistema di dominio che ne risenta. Il glossario lo dice
adesso, invece di lasciarlo scoprire.

**3. `ORDER` dichiara due fasi, non un elenco di fasi.** La delega chiedeva "le costanti nominate
delle fasi di tick, raggruppate e commentate", che suggerisce un elenco; l'ADR 0002 ne cita due
come esempio. Dichiararne quattro con due vuote sarebbe stato codice speculativo, e per una
ragione precisa: **ciò che protegge dal rischio N02 non è quante fasi sono dichiarate**, ma il
passo di 100 e il pareggio per `id`. Insieme rendono l'inserimento di una fase nuova una riga
sola, senza rinumerare niente e senza spostare l'ordine di nessun sistema esistente.

Quindi ci sono le due che la fetta 01 abita davvero — `ECONOMY` per l'`atm`
([D014](D014-dominio-bancomat.md)), `INCOME` per l'`income` ([D010](D010-dominio-income.md)) — e
le prossime hanno un grilletto nel [registro YAGNI](../roadmap-fette.md). Due test tengono ferma
la scala: fasi crescenti e distinte, e almeno 100 di distanza fra una fase e la successiva.

**4. `AnySystem` non è `Stateless | Stateful<unknown>`.** Sembra ovvio e non compila:
`Stateful<S>` non è assegnabile a `Stateful<unknown>`, perché `load: (stato: S) => void` è
controvariante nel parametro. La forma che accetta **ogni** `Stateful<S>` senza cast in
registrazione ha `save: () => unknown` (covariante in uscita) e `load: (stato: never) => void`
(controvariante in ingresso): due estremi opposti, non esprimibili con un solo parametro di tipo.
Il cast — uno solo in tutto il file — sta in `loadAll`, cioè nel punto in cui uno stato opaco
torna al sistema che lo ha prodotto, ed è lo stesso mestiere che fa il Bus con i suoi handler.

**5. Il "nessun `if` su un `id`" era una spunta a occhio: ora è un test.** La definizione di fatto
lo chiedeva come ultima riga della lista, cioè come una cosa che si guarda una volta e mai più —
che è esattamente la forma di controllo che nel progetto precedente ha lasciato nascere cinque
liste. `tests/rules/registry-no-special-cases.test.ts` cerca la forma vietata (`id === '…'`,
`id !== '…'`, `case '…'`) in `Registry.ts` a ogni `npm run verify`, sui commenti tolti — perché il
commento che spiega il divieto lo nomina senza violarlo.

**6. `registry-completeness` è un conteggio statico, non un import del bootstrap.** La delega dice
"il numero di sistemi registrati nel bootstrap": il bootstrap è `createGame.ts` e nasce con
[D011](D011-runtime-e-store.md), quindi oggi importarlo è impossibile. Il test conta le cartelle
`src/core/domains/*/system.ts` e le `.register(` nel file del bootstrap — la stessa forma che
`gates.test.ts` usa per `typecheck:web`. Vale zero a zero adesso ed entra in funzione da solo il
giorno in cui nasce il primo sistema, senza che nessuno debba ricordarsene.

Sul budget: ~140 righe previste, 124 di codice. Sotto il segno, e non per merito: `SystemContext`
ha un campo in meno (correzione 2) e `ORDER` due fasi in meno (correzione 3).

## Fuori scope

- Registrazione automatica per glob: scartata in ADR 0002.
- Abilitare o disabilitare sistemi a runtime: nessun caso d'uso.
- Profilazione del tempo per sistema: grilletto = un problema di performance misurato.

## Definizione di fatto

- [x] test: i sistemi girano in ordine di `order`, non di registrazione
- [x] test: a parità di `order` l'ordine è per `id`, non quello di registrazione
- [x] test: `register` con id duplicato lancia, e il duplicato non entra nella lista
- [x] test: `@ts-expect-error` — un sistema con `save` e senza `reset` non compila
- [x] test: `@ts-expect-error` — un sistema senza `save` che dichiara `load` non compila
- [x] test: `@ts-expect-error` — un sistema senza `save` che dichiara `reset` non compila
- [x] test: `loadAll` con un id sconosciuto ritorna `ok` con l'elenco degli ignorati
- [x] test: `loadAll` con un id noto ma assente lascia il sistema al suo stato iniziale
- [x] test: `loadAll` con un `load` che lancia ritorna un errore tipizzato (correzione 1)
- [x] test: `saveAll` produce una chiave per **ogni** sistema con stato, senza eccezioni
- [x] test: `resetAll` passa l'ambito a ogni sistema con stato
- [x] test: `statsAll` raccoglie da chi ha `stats` e ignora chi non ne ha
- [x] test: le fasi di `ORDER` sono crescenti, distinte e distanti almeno 100 (correzione 3)
- [x] `tests/rules/registry-completeness.test.ts`: cartelle di dominio uguali alle registrazioni
      nel bootstrap (correzione 6)
- [x] `tests/rules/registry-no-special-cases.test.ts`: nessun ramo su un `id` (correzione 5)

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 150 test su 22 file (erano 123
su 19).

Le reti sono state rotte di proposito, e sono diventate rosse tutte:

| Rottura indotta                                           | Cosa è diventato rosso                  |
| --------------------------------------------------------- | --------------------------------------- |
| tolto l'ordinamento: vince l'ordine di registrazione      | 3 casi sull'ordine                      |
| tolto il pareggio per `id`                                | l'ordine a parità di fase               |
| tolto il controllo sull'id duplicato                      | 2 casi su `register`                    |
| tolto il `try/catch` attorno al `load`                    | il `load` che lancia                    |
| aggiunto un `systems().filter((s) => s.id !== 'segreto')` | `tests/rules/registry-no-special-cases` |
| creato `domains/income/system.ts` senza registrarlo       | `tests/rules/registry-completeness`     |

Le ultime due meritano una nota: sono le uniche due reti che non guardano il comportamento ma la
**forma**, e sono quelle che difendono da A01. L'ultima ha anche dimostrato che il conteggio
statico funziona davvero e non è un test che passa perché non guarda niente — con una cartella di
dominio e zero registrazioni è diventato rosso col messaggio giusto.

[ADR 0002](../adr/0002-registry-unica-lista-di-sistemi.md) passa a **Accettata**: la lista unica,
le cinque operazioni che la iterano, il tipo che rende `save` senza `reset` impossibile e i due
test di forma sono tutti qui.

## Cosa deve sapere chi prende D007, D010 e D011

- **`SystemContext` non ha ancora il `ledger`.** Aggiungerlo è il primo gesto di D007, e il
  glossario lo dice già.
- **`loadAll` ritorna `Result<LoadReport, RegistryError>`**, e l'errore è reale: D011 deve
  mandare quel caso nello stato `Errore`, non ignorarlo.
- **`order` è obbligatorio anche per un sistema che non ticka**, perché la lista è una sola e va
  ordinata comunque. L'`atm` di D014 non ticka e sta in `ORDER.ECONOMY`.
- **`stats()` ritorna `SystemStats`**, cioè `Record<string, unknown>`: il kernel non sa cosa sia
  una statistica, per la stessa ragione per cui non sa cosa sia lo stato di un sistema.

## Trappole note

- **A01.** Cinque liste parallele non nascono in un giorno: nasce prima una funzione "che fa una
  cosa in più solo per questo sistema". Il primo `if (system.id === …)` è il momento in cui
  fermarsi — e da oggi è un test rosso, non un momento da riconoscere (correzione 5).
- **A06.** Il contratto asimmetrico — `save` scritto, `reset` dimenticato — è invisibile finché
  qualcuno non fa prestige. Il tipo lo rende impossibile; il test `@ts-expect-error` dimostra che
  il tipo funziona davvero.
- La tolleranza sugli id sconosciuti sembra permissiva. Non lo è: senza, rimuovere un sistema
  rompe tutti i salvataggi esistenti, e la reazione tipica è non rimuoverlo mai.
