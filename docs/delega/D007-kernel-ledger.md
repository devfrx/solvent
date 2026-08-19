# D007 — Kernel: Ledger

- **Stato:** Aperta
- **Dipende da:** D002, D005
- **Sblocca:** D008, D014
- **ADR vincolanti:** 0003, 0006, 0007, **0017**, **0019**, **0020**
- **Regole:** R06, R10, R11 · Invarianti INV-04
- **Budget:** ~170 righe (era ~110 prima degli ADR 0017/0019/0020: la crescita è dichiarata e giustificata)

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

## Fuori scope

- Pool oltre `cash` e `card` — `chips` arriva col casinò ([roadmap](../roadmap-fette.md)).
- Interessi maturati: servono un Clock e un dominio, non stanno qui.
- Storico dei movimenti: nasce quando esisterà la schermata che lo mostra, come `boundedList`.
- Query di telemetria oltre `balance()`: la partita doppia le rende possibili, non obbligatorie.

## Definizione di fatto

- [ ] test: una transazione valida a tre movimenti applica tutto ed emette **una** volta
- [ ] test: una transazione che non somma a zero **lancia**
- [ ] test: se l'ultimo movimento di una transazione a tre fallisce, **nessuno** dei tre è
      applicato e nessun evento è emesso — è il test dell'atomicità, e va scritto per primo
- [ ] test invariante: dopo 1.000 transazioni casuali con seed fisso, la somma di tutti i conti
      è esattamente zero
- [ ] test: `income()` costruisce il movimento da `world` senza che il chiamante lo nomini
- [ ] test: capienza superata → rifiuto, con quanto ci starebbe ancora nell'errore
- [ ] test: pool non accettato → rifiuto, con l'elenco dei pool validi nell'errore
- [ ] test: fondi insufficienti → rifiuto, con `required` e `available`
- [ ] test: l'handler di `money.posted` legge i saldi **nuovi**, tutti
- [ ] test: round-trip di `0.1` più `0.2` — il saldo salvato e ricaricato è esattamente `0.3`
- [ ] test: dopo `load`, la somma di tutti i conti è ancora zero
- [ ] test: `reset('hard')` azzera tutto, invariante inclusa; `reset('soft')` fa ciò che dichiara
- [ ] `grep`: la `Map` dei saldi non compare in nessun `export`

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
