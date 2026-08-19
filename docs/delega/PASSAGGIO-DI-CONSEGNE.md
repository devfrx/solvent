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

|                       |                                                       |
| --------------------- | ----------------------------------------------------- |
| STOP 1                | **approvato** — nome, stile, dipendenze, architettura |
| D001 — tooling e gate | **chiusa**, commit `e275f59`                          |
| D002 — contratti      | **chiusa**, commit `288367e`                          |
| D003 — kernel: Clock  | **chiusa**, commit `f398a47`                          |
| D004 — kernel: Rng    | **chiusa**, ramo `d004-kernel-rng`                    |
| Codice di dominio     | **zero righe**. Ci sono i contratti, il Clock e l’Rng |
| `npm run verify`      | **verde** — 103 test su 17 file                       |
| Prossimo passo        | **[D005 — Bus](D005-kernel-bus.md)**                  |

I contratti sono in `src/core/contracts/`, il Clock e l'Rng in `src/core/kernel/`. Ogni delega
chiusa ha in fondo le **correzioni** rispetto a com'era scritta: [D002](D002-contratti.md) ne ha
sette, [D003](D003-kernel-clock.md) cinque, [D004](D004-kernel-rng.md) sei. Leggile prima di
fidarti del testo di una delega ancora aperta — alcune di quelle correzioni riguardano proprio
deleghe che non sono ancora state eseguite.

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

**[D005 — Bus](D005-kernel-bus.md).** `src/core/kernel/Bus.ts`: `on`, `emit`, e una guardia sulla
profondità delle emissioni annidate. ~50 righe. È l'ultimo pezzo che manca prima del Registry
(D006), che vuole Clock, Rng e Bus.

Tre cose da sapere prima di iniziare:

1. **Il Bus è sincrono e basta** (ADR 0016). Niente `Promise`, niente `queueMicrotask`, niente
   richiesta/risposta: un evento notifica, non chiede. `emit` ritorna `void`.
2. **La trappola di implementazione è una sola**, e si manifesta mesi dopo: iterare l'array degli
   handler mentre qualcuno si disiscrive dentro un handler. Si itera una copia. Nella definizione
   di fatto c'è il test apposta.
3. **`GameEvents` esiste già** in `contracts/events.ts` e contiene un evento solo, `money.posted`.
   Il Bus si tipizza su quello; l'interfaccia cresce con i sistemi, non prima.

Poi si prosegue col grafo in [delega/README.md](README.md): D003 → D008 sono il kernel (~560
righe in tutto), D009 la persistenza, D010 e D014 i domini, D011 e D012 il runtime e la UI, D013 la
verifica finale — che è lo **STOP 2**, dove ci si ferma di nuovo.

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
  `feat(D005): bus sincrono`. Un ramo per delega: `d005-kernel-bus`.
- **Quando una delega è finita:** marcala `Chiusa` con il commit, aggiorna
  [tracciabilita.md](../tracciabilita.md) se hai cambiato un meccanismo, e scrivi le **correzioni
  rispetto a com'era scritta la delega** — vedi [D001](D001-tooling-e-gate.md) come esempio: aveva
  quattro cose sbagliate, e sono scritte lì invece che nascoste.

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

Stato: STOP 1 approvato, D001, D002, D003 e D004 chiuse, `npm run verify` verde, zero codice di
dominio. Il prossimo passo è **D005 — Kernel: Bus**.

Come voglio che lavori:

- Esegui la delega D005 così com'è scritta. Se qualcosa nella delega si rivela sbagliato,
  correggilo e **scrivilo** nella sezione delle correzioni — non aggirarlo in silenzio.
- Fermati e presentami 2 opzioni solo sulle decisioni strutturali. Il resto fallo.
- Niente `TODO`, niente `any`, niente scorciatoie presentate come soluzioni.
- Nessun claim di completamento senza l'output reale di `npm run verify`.
- La documentazione toccata dal cambiamento si aggiorna nello stesso commit.

Quando D005 è chiusa, fermati e mostrami l'output dei gate prima di passare alla successiva.
```
