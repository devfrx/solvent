# D008 — Balance: costanti, modificatori, bersagli

- **Stato:** **Chiusa** — 2026-08-19, commit `DA-ANNOTARE`, ramo `d008-balance`
- **Dipende da:** D006, D007
- **Sblocca:** D010
- **ADR vincolanti:** 0009 (il tetto di recupero vive qui)
- **Regole:** R04, R11
- **Budget:** ~90 righe → **consuntivo: 70 righe di codice** (181 con i commenti) + 154 di test

## Obiettivo

Tenere in un solo posto tutti i numeri che decidono come si gioca, e rendere il bilanciamento una
cosa **verificabile** invece che una sensazione.

## Da produrre

`src/core/balance/`

| File           | Contenuto                                                                               |
| -------------- | --------------------------------------------------------------------------------------- |
| `constants.ts` | i numeri di gioco: reddito base, costo e moltiplicatore dell'upgrade, tetto di recupero |
| `modifiers.ts` | il registro dei modificatori e l'unica formula di composizione                          |
| `targets.ts`   | i bersagli di bilanciamento, come **dati**                                              |

## Invarianti

- **Una sola formula di composizione**, scritta una volta: `(base + Σ add) × Π mult`. Non esiste
  un secondo posto dove si compongono moltiplicatori.
- L'ordine di composizione è deterministico: prima tutti gli `add`, poi tutti i `mult`. A parità
  di tipo, l'ordine è per `id` di sorgente, così il risultato non dipende dall'ordine di
  registrazione — che cambierebbe i decimali in modo invisibile.
- `sourcesFor(target)` esiste dal primo giorno, perché è ciò che permette alla UI di rispondere a
  "perché guadagno tanto" senza reimplementare la formula.
- Nessun numero di gioco vive fuori da `constants.ts`. In `domains/**` il lint `no-magic-numbers`
  lo impedisce.
- `targets.ts` contiene intervalli, non valori singoli: un bilanciamento espresso come uguaglianza
  esatta è un test che si rompe a ogni ritocco e che verrà disattivato.
- Registrare due volte lo stesso `id` di modificatore **lancia**: un upgrade comprato due volte
  che registra due volte è un bug di gioco, non un raddoppio legittimo.

## Otto correzioni rispetto a com'era scritta questa delega

**1. `remove` non era elencato, e senza di lui D010 non chiude.** La delega descrive `register`,
`compose` e `sourcesFor`. Manca il gesto inverso, e [D010](D010-dominio-income.md) ne ha bisogno
due volte: la sua definizione di fatto pretende che `reset('hard')` riporti il reddito al valore
iniziale — impossibile se il modificatore dell'upgrade non si può togliere — e il suo `load`
ricadrebbe sull'errore di id duplicato la seconda volta che carica.

`remove(id)` toglie una sorgente e non lancia se l'id non c'è. Il no-op è deliberato: azzerare due
volte, o caricare sopra un reset, restano leciti senza che il chiamante debba ricordarsi in che
stato era.

**2. `ModifierTarget` è una stringa, non un'unione di bersagli noti.** Un'unione si sarebbe
scritta in dieci secondi e avrebbe preso i refusi al compilatore, ma obbligherebbe `balance/` a
elencare i bersagli di ogni dominio — cioè a cambiare ogni volta che un dominio ne aggiunge uno.
È la stessa scelta, con la stessa motivazione, che [D006](D006-kernel-registry.md) ha fatto per
`SystemId`. Il prezzo è lo stesso: un `compose('income.al', …)` ritorna la base invece di
lamentarsi.

**3. Un `id` solo, non due.** La delega dice "registrare due volte lo stesso `id` di
**modificatore**" e, due righe dopo, "l'ordine è per `id` di **sorgente**". Sono due parole per
la stessa cosa finché una sorgente produce un modificatore solo, che è il caso di tutta la fetta 01. Qui l'`id` è uno: identifica il modificatore **ed** è il nome di chi lo produce. Una sorgente
che dovesse contribuire sia un `add` sia un `mult` registra due id — il costo di quel caso, se
arriverà, è due righe invece di una.

**4. `createModifiers()` è una factory, e chi tiene l'istanza è una domanda aperta.** Tutto ciò
che ha stato nel progetto è una factory — `createBus`, `createRegistry`, `createLedger` — e un
registro globale di modulo sarebbe stato globale mutabile, cioè il difetto A05 spostato di un
livello.

Ne discende una cosa che [D010](D010-dominio-income.md) e [D011](D011-runtime-e-store.md) devono
sapere: **il registro non può stare nel `SystemContext`**, perché `SystemContext` vive in
`kernel/Registry.ts` e `kernel/` non può importare `balance/` — la freccia va nell'altro senso
(docs/architettura.md). Il sistema `income` riceverà il registro in un altro modo, e decidere
quale è lavoro di quelle due deleghe, non di questa.

**5. `RECOVERY_CAP` non ha un test, ed è detto qui invece che scoperto dopo.** Il tetto di
recupero è nella delega, nell'[ADR 0009](../adr/0009-passo-fisso-e-tipi-branded-per-il-tempo.md)
e in [flusso-tick.md](../design/flusso-tick.md), quindi c'è. Ma oggi non ha consumatori — il loop
è [D011](D011-runtime-e-store.md) — e ogni test che si potrebbe scrivere riscriverebbe la
costante: otto ore sono otto ore. Un test che non può fallire è una decorazione
([convenzioni](../convenzioni.md#test)), quindi non è stato scritto. Lo esercita il loop di D011.

**6. "Moltiplicatore dell'upgrade" è il moltiplicatore del reddito, non del costo.** In un idle
"costo e moltiplicatore" di solito indicano il costo base e la crescita del costo fra un livello e
il successivo. Qui non può essere: [D010](D010-dominio-income.md) mette fuori scope più di un
livello, quindi una curva di costo non ha niente su cui salire. `UPGRADE_MULTIPLIER` è il `mult`
che l'upgrade registra su `income.all`.

**7. Il test dei bersagli simula senza il sistema `income`, che non esiste ancora.** D008 viene
prima di D010 nel grafo, quindi "simula i primi N tick" non può passare da `tickAll`. Il loop è
scritto nel test, ma con i pezzi veri: il Clock che converte il tasso, `compose` che compone, il
Ledger che applica. Quando D010 esisterà, quel loop diventa una riga di `tickAll` e il bersaglio
resta identico — è il senso di averlo dichiarato come dato.

**8. Il `grep` sui numeri letterali sotto `domains/**` è già una regola di lint.** La definizione
di fatto lo chiede come verifica manuale, ma `@typescript-eslint/no-magic-numbers` è configurato
su `domains/**` e su `balance/modifiers.ts` da [D001](D001-tooling-e-gate.md), e
`tests/rules/lint-rules` prova già che scatti davvero. Un secondo controllo sulla stessa cosa non
aggiunge protezione: aggiunge un posto da aggiornare. La spunta è quella regola. Oggi `domains/`
non esiste ancora, quindi il grep troverebbe zero file in ogni caso.

## Fuori scope

- Modificatori di tipo diverso da `add` e `mult`: due bastano, un terzo va giustificato.
- Modificatori a tempo (buff che scadono): grilletto = il primo buff a tempo.
- Curve di costo diverse dalla progressione della fetta 01.
- Bersagli di bilanciamento per sistemi che non esistono.

## Definizione di fatto

- [x] test: la composizione con due `add` e due `mult` dà il risultato atteso, in `Decimal`
- [x] test: cambiare l'ordine di registrazione **non** cambia il risultato
- [x] test: registrare due volte lo stesso id lancia
- [x] test: `sourcesFor` elenca le sorgenti attive sul bersaglio
- [x] `tests/balance/targets.test.ts`: simula i primi N tick e verifica che il reddito al minuto
      cada dentro `income_per_minute_at_start` — con un bersaglio solo, ma vero
- [x] `grep` di numeri letterali in `src/core/domains/**`: solo `0`, `1`, `-1`

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 204 test su 27 file (erano 187
su 25). I quattro gate stanno fra 27 e 30 secondi su due misure consecutive: la differenza fra due
esecuzioni è ormai più grande della crescita fra due deleghe, e [qualita.md](../qualita.md) lo dice
così invece di dichiarare una cifra sola.

Le reti sono state rotte di proposito, una alla volta, e sono diventate rosse tutte:

| Rottura indotta                                             | Cosa è diventato rosso                                  |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| `compose` applica i modificatori in ordine di registrazione | gli `add` prima dei `mult`                              |
| tolto l'ordinamento per `id`                                | `sourcesFor` in ordine                                  |
| tolto il controllo sull'`id` duplicato                      | i 2 casi sul duplicato                                  |
| `sourcesFor` non filtra per bersaglio                       | 3 casi, fra composizione e registro                     |
| `remove` non toglie niente                                  | i 2 casi su `remove`                                    |
| il reddito base passa da 12 a 13                            | il bersaglio del primo minuto                           |
| il moltiplicatore dell'upgrade non moltiplica più           | l'upgrade che deve uscire dall'intervallo di partenza   |
| l'intervallo del bersaglio diventa larghissimo              | lo stesso caso — un intervallo largo non dimostra nulla |
| il bersaglio diventa un valore singolo (`min` = `max`)      | "sono intervalli, non valori singoli"                   |

Le ultime due meritano una nota: sono le uniche due che non guardano il codice ma **il dato**, e
sono quelle che impediscono a `targets.ts` di tornare a essere documentazione. Un intervallo largo
e un intervallo a larghezza zero falliscono per ragioni opposte, e servono entrambi.

**Il budget è rientrato:** ~90 dichiarate, 70 scritte. Il kernel intero — D003 fino a D008 — sta in
**535 righe** contro le ~555 stimate. È finito.

I numeri di gioco vengono dai [mockup](../design/mockups/) dove esistevano già: 12,00 €/s di
reddito e 800,00 € di upgrade sono quelli disegnati nella fetta 01. Il moltiplicatore ×1,5, il
tetto di recupero di otto ore e l'intervallo 700–740 sono stati scelti qui, e sono **contestabili**:
sono numeri di bilanciamento, cioè la cosa che [rischi.md](../rischi.md) dice esplicitamente che
nessun gate garantisce.

Nessun ADR passa ad _Accettata_ con questa delega. Il [0009](../adr/0009-passo-fisso-e-tipi-branded-per-il-tempo.md)
è quello vincolante e resta _Proposta_: il tetto di recupero adesso c'è, ma il passo fisso con
accumulatore è il loop, cioè [D011](D011-runtime-e-store.md). Metà meccanismo non è una decisione
in vigore.

## Cosa deve sapere chi prende D010, D011 e D014

- **Il registro dei modificatori non è nel `SystemContext`** e non può esserci (correzione 4). Chi
  scrive `income/system.ts` lo riceve in un altro modo — la scelta è di D010 e D011 insieme, e
  probabilmente comporta una freccia `runtime → balance` che oggi il diagramma non disegna.
- **`compose(target, base)` è l'unica formula.** Una regola pura che ricalcola un moltiplicatore in
  casa è la seconda formula, e le due divergono al primo ritocco.
- **Il reddito base è dichiarato al secondo.** Chi lo usa lo converte con `clock.perSecondToPerTick`:
  scrivere `/ 10` è il difetto A04.
- **La commissione del bancomat non è ancora in `constants.ts`.** La delega elencava tre gruppi di
  numeri e quello non c'era, quindi non è stato inventato qui. [D014](D014-dominio-bancomat.md) la
  aggiunge in quel file e non nel proprio: `no-magic-numbers` sotto `domains/**` le impedisce di
  vivere altrove, ed è proprio il punto.
- **`register` lancia sul duplicato.** Un sistema che ricarica deve `remove` prima di `register`,
  oppure controllare il proprio stato: entrambe vanno bene, la seconda è più leggibile.
- **`RECOVERY_CAP` è in tick**, non in secondi né in millisecondi. Il loop lo confronta con il
  numero di tick interi da recuperare, senza conversioni proprie.

## Trappole note

- Il test dei bersagli è quello che si scrive "dopo, quando i numeri saranno stabili". Se si
  scrive dopo, non si scrive: e allora `targets.ts` diventa un file di documentazione, cioè
  esattamente ciò che non deve essere.
- Un bersaglio con un intervallo troppo largo passa sempre e non dimostra nulla. Meglio uno
  stretto che si rompe quando cambi un numero: è il suo lavoro dirti che l'hai cambiato.
- La composizione tende a duplicarsi il giorno in cui un sistema ha "un caso un po' diverso".
  Quel caso è un tipo di modificatore nuovo, da giustificare — non una seconda formula.
