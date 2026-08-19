# D006 — Kernel: Registry

- **Stato:** Aperta
- **Dipende da:** D003, D004, D005
- **Sblocca:** D008, D009
- **ADR vincolanti:** 0002
- **Regole:** R02, R07
- **Budget:** ~140 righe — è il pezzo più grande del kernel, ed è giusto così

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

## Fuori scope

- Registrazione automatica per glob: scartata in ADR 0002.
- Abilitare o disabilitare sistemi a runtime: nessun caso d'uso.
- Profilazione del tempo per sistema: grilletto = un problema di performance misurato.

## Definizione di fatto

- [ ] test: i sistemi girano in ordine di `order`, non di registrazione
- [ ] test: `register` con id duplicato lancia
- [ ] test: `@ts-expect-error` — un sistema con `save` e senza `reset` non compila
- [ ] test: `@ts-expect-error` — un sistema senza `save` che dichiara `load` non compila
- [ ] test: `loadAll` con un id sconosciuto ritorna `ok` con l'elenco degli ignorati
- [ ] test: `loadAll` con un id noto ma assente lascia il sistema al suo stato iniziale
- [ ] test: `saveAll` produce una chiave per **ogni** sistema con stato, senza eccezioni
- [ ] `tests/rules/registry-completeness.test.ts`: il numero di sistemi registrati nel bootstrap
      è uguale al numero di file `src/core/domains/*/system.ts`
- [ ] nessun `switch` o `if` su un `id` di sistema in tutto il file

## Trappole note

- **A01.** Cinque liste parallele non nascono in un giorno: nasce prima una funzione "che fa una
  cosa in più solo per questo sistema". Il primo `if (system.id === …)` è il momento in cui
  fermarsi.
- **A06.** Il contratto asimmetrico — `save` scritto, `reset` dimenticato — è invisibile finché
  qualcuno non fa prestige. Il tipo lo rende impossibile; il test `@ts-expect-error` dimostra che
  il tipo funziona davvero.
- La tolleranza sugli id sconosciuti sembra permissiva. Non lo è: senza, rimuovere un sistema
  rompe tutti i salvataggi esistenti, e la reazione tipica è non rimuoverlo mai.
