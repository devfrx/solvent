# D014 — Dominio: bancomat

- **Stato:** Aperta — testo aggiornato il 2026-08-19, vedi _Cosa è cambiato_
- **Dipende da:** D007, D008
- **Sblocca:** D011, D012
- **ADR vincolanti:** 0017, 0018, 0019, 0020, 0021, 0024
- **Regole:** R04, R10, R11, C08, INV-10, INV-11 — **R07 esce**: senza stato non c'è un sistema a cui applicarsi (punto 9)
- **Budget:** ~110 righe di sorgente (rimisurato: vedi _Cosa è cambiato_, punto 16)

## Obiettivo

Il gesto centrale del gioco: spostare denaro fra contanti e carta, pagandone il prezzo. È ciò che
rende la dualità dell'ADR 0017 una scelta invece che un'etichetta.

## Cosa è cambiato da quando è stata scritta

Sedici cose. Le prime sei erano già nel [passaggio di consegne](PASSAGGIO-DI-CONSEGNE.md) e da oggi
sono incorporate qui; le altre dieci nascono dal preparare la delega, cioè dal guardarla con il
kernel, la persistenza e il primo dominio già scritti davanti.

| #   | Cosa                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **`post()` non esiste**: la primitiva è una sola, `transaction`, e per il bancomat il costruttore è `transfer` ([ADR 0021](../adr/0021-una-sola-primitiva-per-il-denaro.md))                                                                                                                                                                                                          |
| 2   | **`transfer` trattiene la commissione, non la aggiunge**: `transfer('card', 'cash', 500, 2.50)` fa uscire 500 dalla carta, arrivare 497,50 in contanti e 2,50 in `fees`. È già la forma del mockup                                                                                                                                                                                    |
| 3   | **La commissione va in `balance/constants.ts`**, non nel dominio: `no-magic-numbers` sotto `domains/**` le impedisce di vivere altrove, ed è provato — in D010 `.div(10)` scritto a mano è diventato rosso                                                                                                                                                                            |
| 4   | **Un handler di `money.posted` non può postare denaro**: la guardia contro l'annidamento resta alzata durante l'emissione                                                                                                                                                                                                                                                             |
| 5   | **`SystemContext` ha quattro campi** — `clock`, `rng`, `bus`, `ledger` — e `ResetScope` si importa da `@core/contracts/lifecycle`                                                                                                                                                                                                                                                     |
| 6   | La **ragione** sta sulla `Transaction`, la **categoria** sul `Posting`. Un prelievo è **un** evento con tre righe                                                                                                                                                                                                                                                                     |
| 7   | **`accepts` va omesso in un trasferimento.** Il Ledger controlla **ogni** movimento su un pool del giocatore: `accepts: ['card']` su un prelievo farebbe rifiutare il movimento in **arrivo** sui contanti. È il contrario del caso dell'upgrade, dove il pool del giocatore è uno solo                                                                                               |
| 8   | **Un dominio espone una factory**, non un sistema o comandi sciolti: `createAtm(ledger)` ritorna i comandi già legati al proprio contesto ([ADR 0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md), nato con D010). Il bootstrap di D011 costruisce le istanze condivise e le distribuisce                                                          |
| 9   | **Il bancomat non ha stato, quindi non ha un `system.ts`.** Le due cose che la delega gli metteva in `types.ts` non gli appartengono: le _soglie usate oggi_ sono fuori scopo per dichiarazione della delega stessa, e le _ultime operazioni_ del mockup mescolano lo stipendio ai prelievi — sono il flusso di `money.posted`, quindi dello store. Vedi _Le due decisioni prese qui_ |
| 10  | **`transfer` LANCIA se la commissione supera l'importo.** È un `RangeError`, non un `Result`: per il Ledger è un programma scritto male. La definizione di fatto pretende invece un rifiuto spiegabile, quindi il **dominio deve controllare prima di chiamare**, con un codice suo                                                                                                   |
| 11  | **Zero passa.** `magnitude` rifiuta il negativo e il non finito, ma accetta lo zero: un `transfer` da 0,00 sarebbe una transazione valida che non fa niente ed emette un evento. Anche l'importo non positivo va fermato **prima**, con un codice suo                                                                                                                                 |
| 12  | **La capienza la controlla già il Ledger**, e la restituisce come `error.ledger.capacity_exceeded` con `capacity` e `fits` dentro. Il dominio non la rifà: la **interroga** per l'anteprima leggendo `POOLS[pool].capacity`, che oggi è `null` — cioè "illimitata" — e diventerà un numero nella fetta 02 senza toccare questi file                                                   |
| 13  | **L'anteprima non è un secondo calcolo: sono i movimenti stessi.** Una funzione costruisce i `Posting[]` con `transfer`, la UI li mostra e il comando applica **quelli**. Non due funzioni che devono coincidere, ma un valore solo — è la forma più forte che INV-11 possa avere                                                                                                     |
| 14  | **La commissione è fissa, e deve esserlo.** Con una percentuale il caso "commissione superiore all'importo" non si presenterebbe mai, e la definizione di fatto lo pretende. Il [mockup](../design/mockups/home-atm.html) dà un punto solo — 2,50 su 500 — compatibile con entrambe: decide questa delega, ed è contestabile                                                          |
| 15  | **`deposita` e `preleva` si chiamano `deposit` e `withdraw`** (C08): gli identificatori sono in inglese, la prosa resta in italiano                                                                                                                                                                                                                                                   |
| 16  | **Il budget passa da ~80 a ~110 righe.** Erano una stima di prima del kernel. Senza `system.ts` si risparmia, ma due comandi con tre controlli ciascuno, l'anteprima condivisa e tre codici d'errore costano più di quanto la stima prevedesse. D010 aveva dichiarato ~90 e ne ha scritte 102                                                                                         |

## Le due decisioni prese qui

Prese preparando la delega, **contestabili**, e in questo momento costano zero: nessuna riga di
codice le applica.

### 1. Il bancomat non ha stato

La delega elencava `types.ts` con "soglie usate oggi, ultime operazioni" e `system.ts` con
"`defineSystem` — ha stato, quindi `save` / `load` / `reset`". Guardando i due elementi uno alla
volta, nessuno dei due è stato del bancomat nella fetta 01:

- le **soglie** sono nella sezione _Fuori scope_ di questa stessa delega ("soglie giornaliere e
  limiti che salgono col livello");
- le **ultime operazioni** del [mockup](../design/mockups/home-atm.html) elencano
  `Stipendio +1.240,00`, `Prelievo −500,00`, `Commissione bancomat −2,50`: c'è dentro il reddito,
  che non è del bancomat. È il flusso di `money.posted`, cioè un mirror dello store
  ([D011](D011-runtime-e-store.md)), non lo stato di un dominio. Il
  [registro YAGNI](../roadmap-fette.md) lo conferma da un'altra direzione: dice che il primo
  `boundedList` che entra **davvero** nel salvataggio è il caveau della fetta 02;
- le **commissioni pagate** del cruscotto sono `ledger.balance('fees')`, non un contatore.

Senza stato non c'è `save`/`load`/`reset` da scrivere, e senza `tick` un sistema registrato non
farebbe niente: `src/core/domains/atm/` non ha un `system.ts`, e `registry-completeness` continua
a contare un dominio registrato solo — `income`.

**L'alternativa** era inventare uno stato per riempire il file: un contatore di operazioni che
nessuna schermata mostra. Costa una riga oggi e una migrazione del salvataggio il giorno in cui la
forma giusta si vede.

Il giorno in cui le soglie giornaliere entrano, il bancomat guadagna uno stato e un `system.ts`, e
quella è una fetta con un grilletto già scritto.

### 2. La commissione è un importo fisso

`BALANCE.ATM_FEE = 2,50 €`, uguale per il deposito e per il prelievo. Non una percentuale.

La ragione non è di gusto: la definizione di fatto pretende un test in cui **la commissione supera
l'importo**, con un codice diverso da "fondi insufficienti". Con una percentuale quel caso non
esiste — lo 0,5% di qualunque cifra è sempre minore della cifra. Con un importo fisso, un prelievo
da 1,00 € lo produce.

Ne discende anche una dinamica di gioco che il caveau della fetta 02 userà: prelevare poco costa
proporzionalmente molto, quindi conviene prelevare grosso — ma i contanti hanno una capienza.

È un numero di bilanciamento, quindi **contestabile a costo di una riga** in `constants.ts` più il
test che diventa rosso apposta.

## Da produrre

`src/core/domains/atm/`

| File          | Contenuto                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rules.ts`    | funzioni **pure**: la commissione per un importo, se l'importo è valido, se la commissione ci sta dentro, la capienza di un pool e se un importo in arrivo ci entra |
| `commands.ts` | `AtmError`, l'anteprima come `Posting[]`, e `createAtm(ledger)` che ritorna `deposit` e `withdraw`                                                                  |

**Niente `types.ts` e niente `system.ts`**: vedi la decisione 1. `AtmError` sta in `commands.ts`,
dov'è `IncomeError` in [D010](D010-dominio-income.md).

Più **una riga in `src/core/balance/constants.ts`**: `ATM_FEE`. Non nel dominio —
`no-magic-numbers` sotto `domains/**` lo impedisce, ed è proprio il punto.

### I codici d'errore

Il dominio ne dichiara tre; gli altri arrivano dal Ledger e passano attraverso.

    export type AtmError =
      | LedgerError
      | { readonly code: 'error.atm.amount_not_positive'; readonly amount: Money }
      | { readonly code: 'error.atm.fee_exceeds_amount'; readonly amount: Money; readonly fee: Money }

| Codice                            | Quando                                                   | Chi lo produce |
| --------------------------------- | -------------------------------------------------------- | -------------- |
| `error.atm.amount_not_positive`   | importo zero o negativo                                  | il dominio     |
| `error.atm.fee_exceeds_amount`    | la commissione è maggiore o uguale all'importo           | il dominio     |
| `error.ledger.insufficient_funds` | il pool di partenza non ha abbastanza                    | il Ledger      |
| `error.ledger.capacity_exceeded`  | il pool di arrivo non ci sta — il caveau, dalla fetta 02 | il Ledger      |

I primi due **devono** essere del dominio: `transfer` sul secondo caso **lancia** un `RangeError`,
e sul primo non si accorge di niente (lo zero passa). Le loro chiavi i18n sono di
[D012](D012-ui-e-i18n.md), insieme al test di parità: qui si dichiarano i codici, non le
traduzioni.

**Maggiore o uguale**, non maggiore: una commissione pari all'importo fa arrivare zero a
destinazione, ed è un prelievo che il giocatore non voleva fare. Il Ledger lo accetterebbe.

## Invarianti

- Deposito e prelievo sono **una transazione sola** ciascuno (ADR 0019). Mai due `post()`.
- La commissione è un movimento verso `fees`, non una sottrazione mascherata. È lo **stesso**
  meccanismo che userà lo spread delle fiches e la percentuale del black market.
- **L'anteprima e l'esecuzione sono lo stesso valore**, non due funzioni che devono coincidere: la
  funzione costruisce i `Posting[]`, la UI li mostra, il comando li applica (INV-11).
- **`accepts` non si dichiara** in un trasferimento: entrambi i pool coinvolti sono del giocatore,
  e un elenco parziale farebbe rifiutare il movimento in arrivo (punto 7).
- Il dominio non nomina mai `fees` (INV-10): lo scrive `transfer`.
- Un prelievo che supererebbe la capienza del caveau **fallisce con un motivo**, non con un
  pulsante spento. A rifiutarlo è il Ledger; il dominio la interroga per l'anteprima, e oggi la
  risposta è "illimitata".
- Deposito e prelievo hanno **cause di fallimento diverse**, ed è il motivo per cui la fetta 01 ne
  include due: fondi insufficienti, commissione superiore all'importo, capienza superata, importo
  non positivo. Un solo comando non avrebbe messo alla prova `Result`.
- Un importo di zero o negativo è un errore, non un non-evento: il giocatore ha sbagliato, e va
  detto.
- Identificatori in inglese, prosa in italiano (C08).

## Fuori scope

- Soglie giornaliere e limiti che salgono col livello: grilletto = quando esiste una progressione.
  È anche ciò che darà al bancomat il suo primo stato, e quindi il suo `system.ts`.
- **Le ultime operazioni**: sono il mirror dello store alimentato da `money.posted`, e
  appartengono a [D011](D011-runtime-e-store.md) — nel mockup contengono anche lo stipendio.
- Interessi sul conto: arrivano con i depositi vincolati.
- Capienza reale del caveau: fetta 02. Qui si interroga, non si definisce.
- Commissioni variabili per fascia oraria, promozioni, carte diverse.
- Commissioni diverse fra deposito e prelievo: una sola costante finché non c'è una ragione di
  gioco per due.

## Definizione di fatto

- [ ] test: prelievo riuscito → tre movimenti in **una** transazione, somma zero
- [ ] test: l'anteprima è **lo stesso valore** che il comando applica, non un calcolo parallelo
- [ ] test: fondi insufficienti → nulla si muove, errore con `required` e `available`
- [ ] test: commissione maggiore o uguale all'importo → `error.atm.fee_exceeds_amount`, che è un
      codice diverso da "fondi insufficienti" — e `transfer` **non** viene mai chiamato, perché
      lancerebbe
- [ ] test: importo zero, negativo o non finito → `error.atm.amount_not_positive`, e nessuna
      transazione
- [ ] test: deposito riuscito → i contanti scendono, il conto sale, `fees` cresce
- [ ] test: dopo una sequenza mista di depositi e prelievi, la somma di tutti i conti è zero
- [ ] test: la commissione letta dal dominio è quella di `constants.ts`, non un numero suo
- [ ] test: un prelievo riesce, e accanto sta la prova che `accepts: ['card']` lo romperebbe con
      `error.ledger.pool_not_accepted` sui contanti — la trappola 7 resa visibile
- [ ] test: la capienza di `cash` interrogata oggi risponde "illimitata", ed è la fotografia di
      com'è adesso, non un'assunzione
- [ ] test: la regola sulla capienza, con una capienza finta, accetta e rifiuta ai bordi — così la
      fetta 02 la trova già provata invece di scriverla insieme al caveau
- [ ] `grep` di `world`, `sink` e `fees` sotto `src/core/domains/`: nessuna occorrenza (INV-10)

Voci **tolte** rispetto all'elenco originale, con il perché:

- ~~`save` → `load` conserva lo stato del bancomat~~: non c'è stato da conservare (decisione 1).
  La rete che protegge il salvataggio resta quella di `income` e del round-trip di D009.

## Trappole note

- **Due formule per la commissione** era il difetto più probabile di questa delega. La forma
  scelta lo rende impossibile invece che sconsigliato: l'anteprima **è** l'elenco dei movimenti che
  verranno applicati, quindi non esiste un secondo calcolo da tenere allineato.
- **`accepts` è la trappola nuova.** Sull'upgrade di D010 serviva ed era giusto dichiararlo; qui
  farebbe rifiutare la transazione per il pool in arrivo. Le due situazioni si somigliano e vanno
  in direzioni opposte.
- **Due errori del kernel lanciano invece di tornare un `Result`**, e sono proprio i due casi che
  la definizione di fatto chiede di gestire: commissione superiore all'importo (`RangeError` da
  `transfer`) e importo negativo (`RangeError` da `magnitude`). Chiamare il Ledger e poi
  `try`/`catch` non è la risposta: il controllo va prima, e il `Result` esce dal dominio.
- Calcolare il netto e poi il lordo con due arrotondamenti diversi fa sparire dei centesimi. Con la
  partita doppia il test d'invariante lo prende; senza sarebbe passato inosservato per mesi.
- Interrogare una capienza che non esiste ancora sembra codice morto. Non lo è: è il confine
  giusto, tracciato prima che serva, e costa una lettura di `POOLS[pool].capacity` che oggi
  risponde `null`. La fetta 02 le darà un valore senza toccare questo file.
- **Un dominio senza `system.ts` è una forma nuova nel progetto**, e la tentazione sarà di
  aggiungerne uno vuoto "per coerenza". Un sistema che non ticchetta e non ha stato non fa niente:
  registrarlo aggiunge una riga al bootstrap e zero comportamento.
