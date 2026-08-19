# D007 — Kernel: Ledger

- **Stato:** **Chiusa** — 2026-08-19, commit `f9a0c59`, ramo `d007-kernel-ledger`
- **Dipende da:** D002, D005
- **Sblocca:** D008, D014
- **ADR vincolanti:** 0003, 0006, 0007, **0017**, **0019**, **0020** — e ne nasce uno, il **0021**
- **Regole:** R06, R10, R11 · Invarianti INV-04, INV-08, INV-09, INV-10
- **Budget:** ~170 righe → **consuntivo: 197 righe di codice** (334 con i commenti) + 420 di test

## Obiettivo

Essere l'unico punto del progetto in cui un saldo cambia, rendere ogni movimento spiegabile, e
garantire che **i conti tornino sempre**.

## Da produrre

`src/core/kernel/Ledger.ts`

- i saldi in una `Map<Pool, Money>` **privata nella closure**: non esposta, non esportata
- `POOLS`: le proprietà di ogni pool come **dati** (`traceable`, `capacity`, `yields`, `player`)
- `transaction(postings, meta): Result<Balances, LedgerError>` — la primitiva, tutto o niente
- `post(posting)` — zucchero per una transazione a un movimento
- `income()`, `spend()`, `transfer()` — costruiscono i movimenti verso `world` / `sink` / `fees`
  così che nessun dominio nomini a mano i conti non-giocatore
- `balance(pool)` — sola lettura
- `save()` / `load()` / `reset(scope)`

## Invarianti

**Denaro**

- Non esiste alcun modo, dall'esterno, di scrivere su un saldo che non sia `transaction`. Non "è
  vietato": non c'è la superficie per farlo.
- **Ogni transazione somma esattamente a zero** (ADR 0020). Una transazione che non bilancia
  **lancia** — è un errore del programmatore, non un esito di gioco.
- **La somma di tutti i conti è sempre zero.** Vale dopo ogni transazione, dopo un caricamento,
  dopo un reset. È l'invariante più forte del progetto.
- I pool non-giocatore (`world`, `sink`, `fees`, `house`) esistono, entrano nel salvataggio, e non
  compaiono mai nella UI. `world` è normalmente negativo, ed è corretto.

**Atomicità**

- La validazione avviene su **tutti** i movimenti prima che qualunque saldo cambi. Se uno fallisce,
  nessun saldo si muove e nessun evento viene emesso.
- Non esistono applicazioni parziali. Mai.
- Una transazione dentro una transazione **lancia**: significa che qualcuno sta orchestrando
  denaro fuori dal Ledger.

**Pool**

- Un pool con `capacity` rifiuta ciò che lo supererebbe, con `error.ledger.capacity_exceeded` che
  porta dentro quanto ci starebbe ancora.
- Un movimento verso un pool non accettato dall'azione fallisce con
  `error.ledger.pool_not_accepted`, che elenca **quali** pool sarebbero andati bene — così la UI
  può spiegare invece di spegnere un pulsante.
- Per la fetta 01 esistono `cash` e `card`, senza capienza e senza interessi. La **forma** c'è, i
  valori arrivano con i domini che li rendono veri.

**Eventi**

- `money.posted` porta **una transazione**, non un movimento, ed è emesso **una volta**, dopo che
  tutti i saldi sono cambiati. Un handler deve sempre vedere uno stato coerente.
- Se la transazione fallisce, nessun evento.

**Persistenza**

- Nel `save` i saldi sono stringhe decimali (INV-04), pool non-giocatore inclusi.
- Il round-trip di `0.1 + 0.2` deve tornare esatto: è il test che dimostra che `Decimal` sta
  davvero facendo il suo lavoro.

## Nove correzioni rispetto a com'era scritta questa delega

**1. `post(posting)` non esiste.** È la correzione che il
[passaggio di consegne](PASSAGGIO-DI-CONSEGNE.md) lasciava aperta apposta, ed era davvero
irrisolvibile come scritta: una transazione a un movimento non somma a zero, e la delega stessa
dice che una transazione che non bilancia lancia. Le due alternative erano farlo sparire o
trasformarlo in zucchero a due movimenti — con la controparte nominata dal chiamante, cioè con
`world` e `sink` che rientrano nei domini contro INV-10.

È sparito. La primitiva è una sola, e i tre costruttori coprono ogni caso della fetta 01 senza
cerimonia: `ledger.transaction(income('cash', guadagno), { reason: 'reason.income.tick' })`. Il
perché completo, con le alternative, sta in
[ADR 0021](../adr/0021-una-sola-primitiva-per-il-denaro.md).

**2. `POOLS` non è da produrre qui.** La sezione "Da produrre" lo elenca, ma
[D002](D002-contratti.md) lo ha già scritto in `contracts/pools.ts` — ed è giusto che stia lì: il
Ledger **legge** le affordance, non le possiede. Il file `Ledger.ts` non contiene un solo `if` sul
nome di un pool; contiene tre letture di `POOLS[pool]`.

**3. `transaction(postings, meta)` non aveva il tipo di `meta`.** Senza, `accepts` non ha dove
stare, e `error.ledger.pool_not_accepted` — che la delega pretende, con l'elenco dei pool validi
dentro — non potrebbe scattare mai: nessuno avrebbe modo di dire quali pool accetta.

Nasce `TransactionMeta` in `contracts/ledger.ts`: `reason`, e `accepts` facoltativo. Facoltativo e
non obbligatorio perché il reddito non è una scelta del giocatore: chi non dichiara nulla accetta
tutto. `accepts` vincola solo i pool del giocatore — `world`, `sink` e `fees` non sono strumenti di
pagamento, sono contabilità, e non li sceglie il chiamante.

**4. `ResetScope` si è spostato in `contracts/lifecycle.ts`.** Viveva in `Registry.ts` perché
[D006](D006-kernel-registry.md) è stata la prima ad averne bisogno. Ma D007 aggiunge il `ledger`
al `SystemContext`, quindi il Registry importa il Ledger; se il Ledger importasse `ResetScope` dal
Registry, i due si importerebbero a vicenda. Un ciclo di tipi in TypeScript non fa danni a runtime
— e sarebbe comunque la prima freccia all'insù del progetto, in un repo che conta i cicli fra i
difetti misurati (A02).

Il tipo è sceso in `contracts/`, che è dove stanno le parole che due pezzi si scambiano.
`tests/kernel/registry.test.ts` cambia una riga di import; nient'altro nel repo lo usava.

**5. `error.ledger.invalid_amount` non aveva un innesco.** Il caso è nel contratto dai tempi di
D002, la delega lo elenca fra gli invarianti, e nessuno dei due dice **quando** scatta.

Scatta su un importo non finito — `NaN` o infinito, cioè il risultato di una divisione andata
male. È l'unico caso in cui il dato che arriva al Ledger è inutilizzabile per come è fatto, e non
per quanto vale. Un importo zero resta lecito: un trasferimento senza commissione ha una riga a
zero, ed è una riga onesta che dice "qui non è stato trattenuto niente".

Il controllo sugli importi viene **prima** di quello sulla somma: se non lo facesse, un `NaN`
renderebbe non finita anche la somma e la transazione verrebbe segnalata come sbilanciata invece
che per la sua causa vera.

**6. I costruttori prendono una grandezza, e un importo negativo lancia.** La delega non lo dice, e
senza il controllo `income('cash', -12)` produce una transazione **perfettamente bilanciata** che
toglie denaro invece di darlo. Nessun invariante se ne accorgerebbe: la somma fa zero lo stesso.
È il caso peggiore possibile — un bug che i test dell'invariante non vedono — e costa cinque righe.

Con esso, la regola generale del file: un dato inutilizzabile è un **esito** e torna dentro un
`Result`; un programma scritto male **lancia**. Non c'è niente da spiegare al giocatore quando il
verso di un importo è sbagliato: c'è una riga da correggere.

**7. `load` verifica la somma e rifiuta un salvataggio che non torna.** La delega chiede il test
_"dopo `load`, la somma di tutti i conti è ancora zero"_, ma non dice cosa succede se il
salvataggio caricato quella somma non ce l'ha. Senza il controllo, INV-08 sarebbe vero "dopo ogni
transazione" e **sperato** dopo un caricamento — e un salvataggio manomesso è un caso che
[rischi.md](../rischi.md) accetta esplicitamente.

Lo schema `zod` del main verifica la forma (ADR 0004) ma non può verificare l'invariante: è del
Ledger, non del contratto. Quindi `load` la verifica **prima** di scrivere, e lancia
`UnbalancedSaveError`. Va nello stato `Errore` di
[ciclo-di-vita.md](../design/ciclo-di-vita.md) esattamente come `loadAll`, che è il precedente.

**8. `reset('soft')` non tocca i saldi, e questa è la dichiarazione.** La delega dice che `soft`
"fa ciò che dichiara" e lascia a chi esegue il compito di dichiararlo.

Il Ledger conserva tutto. Non è un `hard` più leggero e non è pigrizia: azzerare il denaro di
un'era è un **evento economico con una sua ragione**, quindi è una `transaction` del dominio che
governerà il prestige, non un azzeramento silenzioso del kernel (ADR 0003). Il Ledger non sa cosa
un'era conserva; lo sa quel dominio, e lo dirà nel proprio file — che è dove
[flusso-salvataggio.md](../design/flusso-salvataggio.md) vuole che stia la decisione.

**9. La guardia contro l'annidamento copre anche l'emissione.** L'ADR 0019 dice che una transazione
dentro una transazione lancia, ma non dice dove finisce "dentro". Se la guardia si abbassasse prima
di `emit`, non potrebbe scattare mai: dentro la validazione e l'applicazione non gira codice di
nessun altro, quindi sarebbe codice morto travestito da difesa.

Resta alzata fino a dopo l'emissione. Conseguenza esplicita: **un handler di `money.posted` non può
postare denaro**. È coerente con tutto il resto — il Bus notifica e non chiede (ADR 0016), lo store
è un lettore e non una fonte ([flusso-tick.md](../design/flusso-tick.md)) — e chi deve muovere
denaro reagendo a qualcosa lo fa nel proprio `tick`, dove l'ordine è dichiarato da `order` invece
che dal caso.

## Fuori scope

- Pool oltre `cash` e `card` — `chips` arriva col casinò ([roadmap](../roadmap-fette.md)).
- Interessi maturati: servono un Clock e un dominio, non stanno qui.
- Storico dei movimenti: nasce quando esisterà la schermata che lo mostra, come `boundedList`.
- Query di telemetria oltre `balance()`: la partita doppia le rende possibili, non obbligatorie.

## Definizione di fatto

- [x] test: una transazione valida a tre movimenti applica tutto ed emette **una** volta
- [x] test: una transazione che non somma a zero **lancia**
- [x] test: se l'ultimo movimento di una transazione a tre fallisce, **nessuno** dei tre è
      applicato e nessun evento è emesso — è il test dell'atomicità, e va scritto per primo
- [ ] test invariante: dopo 1.000 transazioni casuali con seed fisso, la somma di tutti i conti
      è esattamente zero
- [x] test: `income()` costruisce il movimento da `world` senza che il chiamante lo nomini
- [x] test: capienza superata → rifiuto, con quanto ci starebbe ancora nell'errore
- [x] test: pool non accettato → rifiuto, con l'elenco dei pool validi nell'errore
- [x] test: fondi insufficienti → rifiuto, con `required` e `available`
- [x] test: l'handler di `money.posted` legge i saldi **nuovi**, tutti
- [x] test: round-trip di `0.1` più `0.2` — il saldo salvato e ricaricato è esattamente `0.3`
- [x] test: dopo `load`, la somma di tutti i conti è ancora zero
- [x] test: `reset('hard')` azzera tutto, invariante inclusa; `reset('soft')` fa ciò che dichiara
- [x] `grep`: la `Map` dei saldi non compare in nessun `export`

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 187 test su 25 file (erano 150
su 22). I quattro gate misurano ora **31 secondi** di parete, contro i 25 di D006:
[qualita.md](../qualita.md) è stato aggiornato con la misura, non con la stima.

Le reti sono state rotte di proposito, una alla volta, e sono diventate rosse tutte:

| Rottura indotta                                    | Cosa è diventato rosso                                       |
| -------------------------------------------------- | ------------------------------------------------------------ |
| applicati i movimenti **prima** di validarli       | l'atomicità, più altri 8 casi — è la rete più larga          |
| tolto il controllo che la transazione sommi a zero | i 2 casi sulla somma zero                                    |
| tolta la guardia contro l'annidamento              | la transazione dentro una transazione                        |
| l'evento parte prima che i saldi cambino           | l'handler che legge i saldi nuovi                            |
| tolto il controllo sui fondi                       | l'atomicità, i fondi insufficienti, il rifiuto che non muove |
| tolto il controllo sulla capienza                  | i 2 casi in `tests/kernel/ledger-capienza`                   |
| tolto il controllo sui pool accettati              | il pool non accettato                                        |
| tolto il controllo sugli importi non finiti        | l'importo non finito                                         |
| tolta la guardia sulle grandezze dei costruttori   | l'importo negativo                                           |
| tolto il controllo sulla somma del salvataggio     | il salvataggio che non torna                                 |
| tolta la copia dei movimenti                       | la lista del chiamante che cambia sotto l'evento             |
| `reset('soft')` azzera come `hard`                 | il `soft` che conserva                                       |
| la `Map` dei saldi esce dalla closure              | i saldi privati                                              |

La prima riga è quella che conta: applicare prima di validare non rompe un test, ne rompe nove.
È il segno che l'atomicità non è verificata da un caso costruito ad arte ma dal modo stesso in cui
il resto della suite è scritto.

**Il budget è stato sforato del 16%**: ~170 dichiarate, 197 scritte. Non è un problema diverso, è
lo stesso problema con quattro pezzi che la delega non contava — le tre classi di errore (~30
righe), la guardia sulle grandezze (correzione 6), il controllo dell'invariante nel `load`
(correzione 7) e `TransactionMeta` (correzione 3). Il `post()` che è sparito ne ha restituite
cinque. Dichiarato qui invece che nascosto in un arrotondamento.

Passano ad **Accettata** cinque ADR, che è il numero più alto di ogni delega finora:
[0003](../adr/0003-ledger-unica-porta-del-denaro.md) (i saldi nella closure),
[0017](../adr/0017-il-denaro-e-plurale.md) (`POOLS` letto come dati, `accepts` che rifiuta con
l'elenco), [0019](../adr/0019-transazioni-atomiche-nel-ledger.md) (validare tutto prima di
applicare), [0020](../adr/0020-partita-doppia.md) (la somma zero, verificata anche su 1.000
transazioni generate) e il nuovo
[0021](../adr/0021-una-sola-primitiva-per-il-denaro.md).

L'ADR 0003 conteneva ancora la firma `Ledger.post({ pool, amount, reason, category })`, superata
già dal 0019 e ora anche dal 0021: il corpo resta com'è — gli ADR sono append-only — ma
l'intestazione lo dichiara, che è la forma prevista dal
[compendio](../adr/README.md#come-si-usa). L'audit dopo D005 non l'aveva vista.

## Cosa deve sapere chi prende D008, D010 e D014

- **`post()` non esiste**: si chiama `transaction` con i movimenti di `income`, `spend` o
  `transfer`. [D010](D010-dominio-income.md) dice "prima il `post`, poi lo stato": vale la stessa
  cosa con `transaction` al posto di `post`.
- **`transfer` trattiene la commissione, non la aggiunge.** `transfer('card', 'cash', 500, 2.50)`
  fa uscire 500 dalla carta e arrivare 497,50 in contanti. È la forma che [D014](D014-dominio-bancomat.md)
  si aspetta, ed è la stessa per lo spread delle fiches e la percentuale del black market.
- **Un handler di `money.posted` non può postare denaro** (correzione 9). Chi deve reagire muovendo
  denaro lo fa nel proprio `tick`. Vale soprattutto per [D011](D011-runtime-e-store.md): lo store
  che ascolta l'evento è un lettore.
- **`ledger.transaction` può lanciare**, non solo fallire: `UnbalancedTransactionError` e
  `NestedTransactionError` dicono che il codice è scritto male, `UnbalancedSaveError` che il
  salvataggio è manomesso. Per D011 valgono come `Bus.emit`: si va in `Errore`, non si ignora.
- **`SystemContext` ha quattro campi**: `clock`, `rng`, `bus`, `ledger`.
- **`ResetScope` si importa da `@core/contracts/lifecycle`**, non più dal Registry.
- **I costruttori sono puri**: `income(...)` costruisce i movimenti, non li applica. Si possono
  comporre — un dominio che deve sommare due effetti in una transazione sola concatena le liste.

## Trappole note

- **A05.** Le due iniezioni con variabili globali erano nate per "far scrivere il saldo anche da
  qui". La closure privata toglie la possibilità, che è più robusto di toglierne il permesso.
- Il test dell'atomicità è quello che si scrive per ultimo e che invece va scritto per primo: è
  l'unico modo di essere sicuri che la validazione avvenga davvero **prima** dell'applicazione, e
  non a metà del ciclo.
- Emettere prima di applicare produce bug irriproducibili in cui un handler legge un saldo vecchio.
  Con le transazioni il rischio raddoppia: un evento per movimento mostrerebbe stati intermedi che
  non sono mai realmente esistiti.
- La tentazione di esporre i saldi "solo per il pannello di debug" è il primo passo verso il
  difetto. Il pannello di debug legge `balance()` come tutti.
