# Passaggio di consegne

Per chi prende in mano Solvent adesso — persona o agente. Si legge in dieci minuti e basta a
ripartire senza fare domande.

## Cos'è Solvent

Idle/tycoon finanziario per desktop. Electron + Vue 3 + TypeScript + Pinia + Vitest.

È la ricostruzione da zero di un progetto precedente (`finanx`, ~104.000 righe) di cui esiste un
audit con **17 difetti misurati**. Quel repo si usa **solo come catalogo di idee di gioco**: mai
copiarne codice, struttura di cartelle o pattern — sono esattamente ciò che ha fallito.

Il gioco ruota attorno a una tensione sola: **contanti contro carta**. Anonimi ma limitati contro
tracciabili ma illimitati. Ogni dominio — mercato nero, prestiti, casinò, immobiliare — è un modo
diverso di viverla. Senza quella tensione, tredici domini sono tredici pulsanti che alzano lo
stesso numero.

## Dove siamo, esattamente

|                       |                                                               |
| --------------------- | ------------------------------------------------------------- |
| STOP 1                | **approvato** — nome, stile, dipendenze, architettura         |
| D001 — tooling e gate | **chiusa**, commit `e275f59`                                  |
| D002 — contratti      | **chiusa**, commit `288367e`                                  |
| D003 — kernel: Clock  | **chiusa**, commit `f398a47`                                  |
| D004 — kernel: Rng    | **chiusa**, commit `a87d8cf`                                  |
| D005 — kernel: Bus    | **chiusa**, commit `e9cf441`                                  |
| Codice di dominio     | **zero righe**. Ci sono i contratti, il Clock, l’Rng e il Bus |
| `npm run verify`      | **verde** — 123 test su 19 file                               |
| Prossimo passo        | **[D006 — Registry](D006-kernel-registry.md)**                |

I contratti sono in `src/core/contracts/`, il Clock, l'Rng e il Bus in `src/core/kernel/`. Ogni
delega chiusa ha in fondo le **correzioni** rispetto a com'era scritta: [D002](D002-contratti.md)
ne ha sette, [D003](D003-kernel-clock.md) cinque, [D004](D004-kernel-rng.md) sei,
[D005](D005-kernel-bus.md) cinque. Leggile prima di fidarti del testo di una delega ancora aperta —
alcune di quelle correzioni riguardano proprio deleghe che non sono ancora state eseguite.

### Cosa è già cambiato nelle deleghe ancora aperte

Sette cose che il testo di quelle deleghe **non** dice ancora, e che chi le esegue deve sapere
prima di iniziare. Sono qui perché una delega chiusa è un documento storico: nessuno la rilegge.

| Delega           | Cosa è cambiato                                                                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D007             | `POOLS` è già in `contracts/pools.ts`. Il Ledger lo **usa**, non lo definisce                                                                                                                                   |
| D007, D010, D014 | La **ragione** sta sulla `Transaction`, la **categoria** sul `Posting`. Un prelievo è un evento solo con tre righe                                                                                              |
| D009             | `SavePayload` ha tre chiavi: `ledger`, `rng`, `systems`. Le prime due sono tipizzate a fondo, lo stato dei sistemi è opaco (`Record<string, unknown>`), perché il contratto non può conoscere i domini          |
| D006, D007, D011 | **`Bus.emit` può lanciare**: `EventCycleError` sui cicli, o l'errore di un handler (`AggregateError` se sono più d'uno). Un `tick` che emette non è un'operazione che non fallisce mai                          |
| D011             | Il loop deve decidere cosa fa quando `emit` lancia. Fermare la simulazione è la risposta giusta: entrambi gli errori dicono che un sistema è scritto male, non che il giocatore ha fatto qualcosa               |
| D007             | `post(posting)` come è elencato **non può esistere**: una transazione a un movimento non somma a zero, e D007 stessa dice che una transazione che non bilancia lancia. O sparisce, o è zucchero a due movimenti |
| tutte            | Un `eslint-disable` senza motivazione è un test rosso, non un appunto di review (C06)                                                                                                                           |

## Le sei cose da non fare

Sono le regole che, violate, riportano il progetto a com'era. Tutte hanno un meccanismo che le
impone; il meccanismo sta in [tracciabilita.md](../tracciabilita.md).

1. **Non scrivere una lista di sistemi a mano.** Il `Registry` è l'unica che esiste.
2. **Non toccare un saldo.** Solo `Ledger.transaction`, che applica tutto o niente e somma a zero.
3. **Non mettere logica di dominio in un `.vue`.** I componenti leggono selettori e inviano comandi.
4. **Non scrivere `TODO`.** Ciò che manca sta in [roadmap-fette.md](../roadmap-fette.md), con il
   grilletto preciso che lo farà entrare.
5. **Non costruire due domini insieme.** Una fetta verticale alla volta, finita e verde. È il
   difetto A17, quello che ha generato tutti gli altri.
6. **Non aggiornare la documentazione "dopo".** Se una modifica sposta un confine, il documento che
   descrive quel confine cambia nello stesso commit.

## Cosa leggere, in quest'ordine

| Quando                        | Documento                                         | Tempo |
| ----------------------------- | ------------------------------------------------- | ----- |
| sempre, per primo             | [docs/README.md](../README.md) — la mappa         | 2 min |
| per capire la forma           | [architettura.md](../architettura.md)             | 5 min |
| per non inventare parole      | [glossario.md](../glossario.md)                   | 3 min |
| prima di discutere una scelta | [adr/README.md](../adr/README.md) — solo i titoli | 3 min |
| prima di scrivere codice      | la delega che stai eseguendo                      | 5 min |
| quando dubiti che regga       | [rischi.md](../rischi.md), parti 2 e 3            | 5 min |

Non serve leggere tutti i 20 ADR. Servono quando stai per contraddirne uno: allora leggi
**quello**, e riparti dalle alternative già scartate invece che da zero.

## Il prossimo passo, in concreto

**[D006 — Registry](D006-kernel-registry.md).** `src/core/kernel/Registry.ts`: `ORDER`, i tipi
`Stateless` / `Stateful<S>`, `SystemContext`, e le cinque operazioni che iterano **la stessa**
lista. ~140 righe: è il pezzo più grande del kernel, ed è giusto così. Clock, Rng e Bus sono tutti
e tre pronti, quindi non manca più niente.

Tre cose da sapere prima di iniziare:

1. **È la delega del difetto A01**, quello delle cinque liste di sistemi parallele. La difesa non è
   la disciplina: è che `tickAll`, `saveAll`, `loadAll`, `resetAll` e `statsAll` iterino lo stesso
   array e nessuna contenga un `if` su un `id`. Il primo `if (system.id === …)` è il momento di
   fermarsi.
2. **`SystemContext` è la firma che tutto il dominio erediterà.** Clock, Rng, Bus e Ledger arrivano
   per parametro, mai come singleton — è nel [glossario](../glossario.md). Il Ledger non esiste
   ancora (D007): decidere ora come entra nel contesto è la scelta che costa di più cambiare dopo.
3. **`emit` può lanciare** (vedi la tabella sopra). `tickAll` deve sapere cosa fa se un sistema
   emette e l'emissione fallisce: è una decisione da prendere in D006, non da scoprire in D011.

Poi si prosegue col grafo in [delega/README.md](README.md): D006 → D008 chiudono il kernel, D009 la
persistenza, D010 e D014 i domini, D011 e D012 il runtime e la UI, D013 la verifica finale — che è
lo **STOP 2**, dove ci si ferma di nuovo.

## Come si lavora

- **Ci si ferma sulle decisioni strutturali.** Nuova dipendenza, cambio di pattern, confine
  spostato: due opzioni con i compromessi, e si aspetta. Le cose piccole e reversibili si fanno.
- **Se l'utente dà una direttiva generale** ("la soluzione più professionale"), si decide in
  autonomia e si marca la decisione come contestabile — non ci si ferma di nuovo.
- **Nessun claim senza output.** "Funziona" si dice incollando i test verdi.
- **Un test che non si è mai visto fallire non è una rete, è una decorazione.** Rompilo di proposito
  una volta: costa trenta secondi. È così che si è scoperto che il primo caso di prova per R04 era
  sbagliato, e che la regola sembrava funzionare senza funzionare.
- **Commit:** Conventional Commits con lo scope uguale all'ID della delega —
  `feat(D006): registry con ordine dichiarato`. Un ramo per delega: `d006-kernel-registry`.
- **Quando una delega è finita:** marcala `Chiusa` con il commit, aggiorna
  [tracciabilita.md](../tracciabilita.md) se hai cambiato un meccanismo, e scrivi le **correzioni
  rispetto a com'era scritta la delega** — ogni delega chiusa finora ne ha da quattro a sette, e
  sono scritte lì invece che nascoste. Se una delega esce senza correzioni, o era perfetta o non
  è stata letta con attenzione.

## Come verificare di non aver rotto niente

```
npm run verify
```

Quattro gate in otto secondi: typecheck, lint, format:check, test. Se è rosso, non è finito.
`npm run verify:release` aggiunge la compilazione, e diventerà verde con D011.

## Le decisioni contestabili

Tre sono state prese in autonomia. Sono strutturali, e cambiarle costa poco **adesso** e una
migrazione dopo. Se qualcosa non convince, il momento è prima di D007.

| Cosa                                              | ADR                                                    | Alternativa scartata                    |
| ------------------------------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Ogni transazione somma a zero (partita doppia)    | [0020](../adr/0020-partita-doppia.md)                  | movimenti singoli con categoria         |
| Il Ledger espone transazioni, non movimenti       | [0019](../adr/0019-transazioni-atomiche-nel-ledger.md) | due `post()` con rollback nel chiamante |
| I pool dichiarano le proprie affordance come dati | [0017](../adr/0017-il-denaro-e-plurale.md)             | un saldo unico con etichette nella UI   |

## Prompt pronto per una sessione nuova

```markdown
Riprendi il progetto Solvent in questa repo.

Leggi prima `docs/delega/PASSAGGIO-DI-CONSEGNE.md`: contiene lo stato, le regole e il prossimo
passo. Poi `docs/README.md` per la mappa della documentazione.

Stato: STOP 1 approvato, D001, D002, D003, D004 e D005 chiuse, `npm run verify` verde, zero codice
di dominio. Il prossimo passo è **D006 — Kernel: Registry**.

Come voglio che lavori:

- Esegui la delega D006 così com'è scritta. Se qualcosa nella delega si rivela sbagliato,
  correggilo e **scrivilo** nella sezione delle correzioni — non aggirarlo in silenzio.
- Fermati e presentami 2 opzioni solo sulle decisioni strutturali. Il resto fallo.
- Niente `TODO`, niente `any`, niente scorciatoie presentate come soluzioni.
- Nessun claim di completamento senza l'output reale di `npm run verify`.
- La documentazione toccata dal cambiamento si aggiorna nello stesso commit.

Quando D006 è chiusa, fermati e mostrami l'output dei gate prima di passare alla successiva.
```
