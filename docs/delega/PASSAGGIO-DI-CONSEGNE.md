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

|                         |                                                       |
| ----------------------- | ----------------------------------------------------- |
| STOP 1                  | **approvato** — nome, stile, dipendenze, architettura |
| D001 — tooling e gate   | **chiusa**, commit `e275f59`                          |
| D002 — contratti        | **chiusa**, commit `288367e`                          |
| D003 — kernel: Clock    | **chiusa**, commit `f398a47`                          |
| D004 — kernel: Rng      | **chiusa**, commit `a87d8cf`                          |
| D005 — kernel: Bus      | **chiusa**, commit `e9cf441`                          |
| D006 — kernel: Registry | **chiusa**, commit `39b8520`                          |
| D007 — kernel: Ledger   | **chiusa**, commit `DA-ANNOTARE`                      |
| Codice di dominio       | **zero righe**. Del kernel manca solo il Balance      |
| `npm run verify`        | **verde** — 187 test su 25 file                       |
| Prossimo passo          | **[D008 — Balance](D008-balance.md)**                 |

I contratti sono in `src/core/contracts/`, Clock, Rng, Bus, Registry e Ledger in
`src/core/kernel/`. Ogni delega chiusa ha in fondo le **correzioni** rispetto a com'era scritta:
[D002](D002-contratti.md) ne ha sette, [D003](D003-kernel-clock.md) cinque,
[D004](D004-kernel-rng.md) sei, [D005](D005-kernel-bus.md) cinque,
[D006](D006-kernel-registry.md) sei, [D007](D007-kernel-ledger.md) nove. Leggile prima di fidarti
del testo di una delega ancora aperta — alcune di quelle correzioni riguardano proprio deleghe che
non sono ancora state eseguite.

### Cosa è già cambiato nelle deleghe ancora aperte

Undici cose che il testo di quelle deleghe **non** dice ancora, e che chi le esegue deve sapere
prima di iniziare. Sono qui perché una delega chiusa è un documento storico: nessuno la rilegge.

| Delega                 | Cosa è cambiato                                                                                                                                                                                                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D010, D014             | **`post()` non esiste**: la primitiva è una sola. Si chiama `transaction` con i movimenti costruiti da `income`, `spend` o `transfer` ([ADR 0021](../adr/0021-una-sola-primitiva-per-il-denaro.md))                                                                                                |
| D014                   | **`transfer` trattiene la commissione, non la aggiunge**: `transfer('card', 'cash', 500, 2.50)` fa uscire 500 dalla carta e arrivare 497,50 in contanti. Stessa forma per lo spread delle fiches e la percentuale del black market                                                                 |
| D010, D011, D014       | **Un handler di `money.posted` non può postare denaro**: la guardia contro l'annidamento resta alzata durante l'emissione. Chi reagisce muovendo denaro lo fa nel proprio `tick`                                                                                                                   |
| D008, D010, D011, D014 | **`SystemContext` ha quattro campi** — `clock`, `rng`, `bus`, `ledger` — e **`ResetScope` si importa da `@core/contracts/lifecycle`**, non più dal Registry                                                                                                                                        |
| D010, D014             | La **ragione** sta sulla `Transaction`, la **categoria** sul `Posting`. Un prelievo è un evento solo con tre righe                                                                                                                                                                                 |
| D010, D014             | Un'azione che accetta solo certi strumenti lo dichiara in `TransactionMeta.accepts`. Assente = nessun vincolo, e vincola solo i pool del giocatore                                                                                                                                                 |
| D009                   | `SavePayload` ha tre chiavi: `ledger`, `rng`, `systems`. Le prime due sono tipizzate a fondo, lo stato dei sistemi è opaco (`Record<string, unknown>`), perché il contratto non può conoscere i domini                                                                                             |
| D010, D011, D014       | **`Bus.emit` può lanciare**: `EventCycleError` sui cicli, o l'errore di un handler (`AggregateError` se sono più d'uno). Un `tick` che emette non è un'operazione che non fallisce mai                                                                                                             |
| D011                   | **Anche il Ledger lancia**: `UnbalancedTransactionError` e `NestedTransactionError` dicono che il codice è scritto male, `UnbalancedSaveError` che il salvataggio è manomesso                                                                                                                      |
| D011                   | Il loop deve decidere cosa fa quando `emit` o il Ledger lanciano. Fermare la simulazione è la risposta giusta: dicono che qualcosa è scritto male, non che il giocatore ha sbagliato. **`loadAll` ritorna `Result<LoadReport, RegistryError>`**, e quel caso va nello stato `Errore`, non ignorato |
| tutte                  | Un `eslint-disable` senza motivazione è un test rosso, non un appunto di review (C06)                                                                                                                                                                                                              |

### Quanto ci si può fidare di questi documenti

Sono stati **auditati per intero** dopo D005: tutti e cinquanta i markdown, collegamenti e ancore
inclusi. Sono usciti quindici disallineamenti, corretti tutti tranne uno — il `post(posting)` di
D007, lasciato aperto perché la decisione spettava a chi avrebbe scritto quel Ledger. È stata
presa: `post()` non esiste ([ADR 0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)). Il
dettaglio di cosa è stato trovato sta in `git log` (`docs: audit di coerenza`) e la lezione in
[rischi.md](../rischi.md), sotto N07.

D007 ne ha trovato un sedicesimo che l'audit non aveva visto: l'[ADR 0003](../adr/0003-ledger-unica-porta-del-denaro.md)
conteneva ancora la firma `Ledger.post({ … })`, superata dall'ADR 0019 lo stesso giorno. Gli ADR
sono append-only, quindi il corpo resta e a dichiararlo è l'intestazione.

Da lì in avanti valgono due cose:

- **I collegamenti non si rompono più in silenzio**: `tests/rules/link-documenti` verifica ogni
  link e ogni ancora fra i documenti, ed è un gate come gli altri (regola C07).
- **I documenti sono di due tipi, e non è un difetto.** Alcuni descrivono ciò che c'è
  (architettura, tracciabilità, glossario); altri **vincolano** ciò che verrà
  ([design/flusso-tick.md](../design/flusso-tick.md), le deleghe aperte). I secondi parlano di
  codice che non esiste ancora, e lo dichiarano in testa. Se ne trovi uno che non lo dichiara, è
  quello il difetto.

Quello che l'audit **non** copre è tutto ciò che è cambiato dopo D007, cioè da ora in poi.

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

**[D008 — Balance](D008-balance.md).** `src/core/balance/`: `constants.ts` con i numeri di gioco,
`modifiers.ts` con l'**unica** formula di composizione, `targets.ts` con i bersagli di
bilanciamento come dati. ~90 righe: è la più piccola rimasta, e chiude il kernel.

Tre cose da sapere prima di iniziare:

1. **`targets.ts` non è documentazione.** Il test che simula i primi tick e verifica che il reddito
   al minuto cada dentro l'intervallo dichiarato si scrive **dentro** D008, non "quando i numeri
   saranno stabili". Se si scrive dopo, non si scrive — ed è scritto nelle trappole di quella
   delega.
2. **L'ordine di composizione non deve dipendere dall'ordine di registrazione.** Prima tutti gli
   `add`, poi tutti i `mult`, e a parità di tipo per `id` di sorgente. Senza il secondo criterio i
   decimali cambiano in modo invisibile, che è il peggior tipo di differenza.
3. **Il Ledger c'è già**, e `balance/` può importare da `kernel/`. Ma i numeri di gioco restano
   `Decimal`: non diventano `number` per comodità dentro una formula (R11).

Poi si prosegue col grafo in [delega/README.md](README.md): D008 chiude il kernel, D009 la
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
  `feat(D007): il ledger a partita doppia`. Un ramo per delega: `d007-kernel-ledger`.
- **Quando una delega è finita:** marcala `Chiusa` con il commit, aggiorna
  [tracciabilita.md](../tracciabilita.md) se hai cambiato un meccanismo, e scrivi le **correzioni
  rispetto a com'era scritta la delega** — ogni delega chiusa finora ne ha da cinque a sette, e
  sono scritte lì invece che nascoste. Se una delega esce senza correzioni, o era perfetta o non
  è stata letta con attenzione.
- **Un numero scritto in un documento è una misura scaduta.** Conteggi, tempi, righe: quando ne
  incontri uno che riguarda ciò che stai toccando, rimisuralo invece di ricopiarlo. `verify` ha
  dichiarato otto secondi da D001 a D006, quando erano venticinque; `rischi.md` ha detto "i quattro
  difetti" davanti a un elenco di cinque per altrettanto tempo.
- **Quando correggi un fatto sbagliato, cerca il concetto, non la frase.** Un `grep` sulla frase
  intera trova le copie identiche e lascia indietro le parafrasi — è successo davvero, con
  "progresso offline" scritto in quattro punti e corretto in due.

## Come verificare di non aver rotto niente

```bash
npm run verify
```

Quattro gate in trentun secondi: typecheck, lint, format:check, test. Se è rosso, non è finito.
`npm run verify:release` aggiunge la compilazione, e diventerà verde con D011.

## Le decisioni contestabili

Quattro, prese in autonomia, e con D007 sono tutte **in vigore**: il Ledger le scrive. Cambiarle
non costa più zero — costa il Ledger e i suoi test, che è ancora poco ma non è più niente. Il
prossimo momento buono per contestarle è prima di D014, il primo dominio che le usa.

| Cosa                                              | ADR                                                     | Alternativa scartata                                                   |
| ------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Ogni transazione somma a zero (partita doppia)    | [0020](../adr/0020-partita-doppia.md)                   | movimenti singoli con categoria                                        |
| Il Ledger espone transazioni, non movimenti       | [0019](../adr/0019-transazioni-atomiche-nel-ledger.md)  | due `post()` con rollback nel chiamante                                |
| I pool dichiarano le proprie affordance come dati | [0017](../adr/0017-il-denaro-e-plurale.md)              | un saldo unico con etichette nella UI                                  |
| `post()` non esiste: una primitiva sola           | [0021](../adr/0021-una-sola-primitiva-per-il-denaro.md) | zucchero a due movimenti, che però rimette `world` e `sink` nei domini |

## Prompt pronto per una sessione nuova

```markdown
Riprendi il progetto Solvent in questa repo.

Leggi prima `docs/delega/PASSAGGIO-DI-CONSEGNE.md`: contiene lo stato, le regole e il prossimo
passo. Poi `docs/README.md` per la mappa della documentazione.

Stato: STOP 1 approvato, da D001 a D007 chiuse, `npm run verify` verde, zero codice di dominio.
Il prossimo passo è **D008 — Balance**.

Come voglio che lavori:

- Esegui la delega D008 così com'è scritta. Se qualcosa nella delega si rivela sbagliato,
  correggilo e **scrivilo** nella sezione delle correzioni — non aggirarlo in silenzio.
- Fermati e presentami 2 opzioni solo sulle decisioni strutturali. Il resto fallo.
- Niente `TODO`, niente `any`, niente scorciatoie presentate come soluzioni.
- Nessun claim di completamento senza l'output reale di `npm run verify`.
- La documentazione toccata dal cambiamento si aggiorna nello stesso commit.

Quando D008 è chiusa, fermati e mostrami l'output dei gate prima di passare alla successiva.
```
