# Glossario

Il linguaggio del progetto. Ogni termine qui dentro ha **un solo** significato, e quel significato
è lo stesso nel codice, nei test, negli ADR e nelle conversazioni.

Un progetto in cui la stessa cosa si chiama in tre modi è un progetto in cui tre persone credono
di parlare della stessa cosa e non è vero.

## Tempo

| Termine                   | Significato                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Tick**                  | l'unità atomica di simulazione. Vale `1 / TICKS_PER_SECOND` secondi. Tipo: `Ticks`                                                   |
| **Passo fisso**           | ogni tick vale sempre lo stesso tempo simulato, indipendentemente dal framerate                                                      |
| **Accumulatore**          | il tempo reale trascorso e non ancora convertito in tick interi; resta per il frame dopo                                             |
| **Recupero** _(catch-up)_ | l'esecuzione di N tick interi al caricamento, per il tempo passato a gioco chiuso. Usa lo **stesso** codice del gioco in tempo reale |
| **Tetto di recupero**     | il numero massimo di tick eseguibili in un recupero, perché l'avvio non si blocchi                                                   |

Non si dice mai "frame" per intendere "tick": il frame è la UI, il tick è la simulazione.

## Sistemi

| Termine                              | Significato                                                                                                                                                                 |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sistema**                          | un'unità di simulazione registrata nel Registry. Ha un `id`, un `order`, e può avere `tick`, `save`, `load`, `reset`, `stats`                                               |
| **Sistema con stato**                | un sistema che ha `save`. Se ce l'ha, ha per forza anche `load` e `reset`: lo impone il tipo                                                                                |
| **Ordine** _(`order`)_               | la posizione del sistema nella sequenza di tick. È una costante nominata, mai un numero sparso                                                                              |
| **Contesto** _(`ctx`)_               | l'insieme di Clock, Rng, Bus e Ledger passato a ogni `tick`. Non è un singleton: arriva per parametro. Da D007 sono quattro                                                 |
| **Ambito di reset** _(`ResetScope`)_ | `hard` = partita nuova, tutti azzerano. `soft` = alcuni sistemi conservano lo stato — **senza chiamante** da quando la visione ha tolto il prestige: vedi il registro YAGNI |

## Denaro

| Termine                     | Significato                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Money**                   | `Decimal`. Mai `number`, in nessun punto di nessuna catena economica                                                      |
| **Pool**                    | un contenitore di denaro con un saldo e le proprie **affordance**. Non è un'etichetta della UI                            |
| **Affordance**              | cosa un pool permette e a che prezzo: tracciabilità, capienza, interessi, dove è accettato                                |
| **Saldo** _(`balance`)_     | il valore corrente di un pool. Si legge dal Ledger, non si assegna mai                                                    |
| **Movimento** _(`posting`)_ | una riga: pool, importo (negativo = uscita), categoria                                                                    |
| **Transazione**             | un insieme di movimenti applicato **tutto o niente**, che somma a zero. Porta **una** ragione: è un evento economico solo |
| **Partita doppia**          | l'invariante: la somma di tutti i conti, giocatore e non, è sempre zero                                                   |
| **Ragione** _(`reason`)_    | _perché_ è avvenuta una transazione. Chiave i18n tipizzata, non stringa libera                                            |
| **Categoria**               | il raggruppamento per la telemetria economica di **un movimento**: `income`, `purchase`, `transfer`, `fee`                |

### I pool

I sei che esistono, cioè quelli in `POOL_IDS` (`contracts/pools.ts`):

| Pool    | Del giocatore? | Cos'è                                                                        |
| ------- | -------------- | ---------------------------------------------------------------------------- |
| `cash`  | sì             | contanti: anonimi, capienza limitata dal caveau, nessun interesse            |
| `card`  | sì             | carta e conto: tracciati, illimitati, generano interessi e credito           |
| `world` | **no**         | da dove nasce il reddito. Va in negativo, ed è corretto                      |
| `sink`  | **no**         | dove finiscono acquisti e costi                                              |
| `fees`  | **no**         | commissioni, spread, percentuali. Separato perché il bilanciamento lo guarda |
| `house` | **no**         | il margine del banco al casinò                                               |

Il nome è deciso, il pool no: **`chips`** — le fiches del casinò, del giocatore, convertibili solo
verso `cash` e a spread — **non è in `POOL_IDS`**. Entra col dominio che lo usa, ed è una riga del
[registro YAGNI](roadmap-fette.md). Vale per le proprietà quanto per i pool: la capienza di `cash`
e gli interessi di `card` sono descritti qui e sono `null`/`false` nel codice finché non esiste il
dominio che li rende veri.

"Cash" è il nome di un pool, non un sinonimo di "denaro". Il denaro è `Money`. I pool non-giocatore
non compaiono mai nella UI, ma entrano nel salvataggio: senza, la somma non farebbe zero al
ricaricamento.

## Bilanciamento

| Termine                        | Significato                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| **Modificatore**               | un contributo a un valore calcolato. È `add` oppure `mult`, mai altro                        |
| **Sorgente**                   | ciò che produce un modificatore: un upgrade, una skill, un evento                            |
| **Bersaglio** _(`target`)_     | il valore su cui i modificatori agiscono, es. `income.all`                                   |
| **Composizione**               | la formula, unica per tutto il progetto: `(base + Σ add) × Π mult`                           |
| **Bersaglio di bilanciamento** | un intervallo atteso dichiarato come **dato** in `balance/targets.ts`, verificato da un test |

Attenzione: _bersaglio_ traduce due cose diverse — il `target` dei modificatori e il bersaglio di
bilanciamento. Nel codice restano distinti: `ModifierTarget` e `BalanceTarget`.

## Casualità

| Termine     | Significato                                                                              |
| ----------- | ---------------------------------------------------------------------------------------- |
| **Seed**    | il numero da cui l'intera sequenza casuale è determinata. Entra nel salvataggio          |
| **Stream**  | una sequenza casuale indipendente, una per dominio. Consumare da uno non muove gli altri |
| **Cursore** | quante estrazioni ha già fatto uno stream. Entra nel salvataggio                         |

## Persistenza

| Termine                              | Significato                                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| **Payload**                          | ciò che il renderer produce da salvare. **Non contiene la versione**                               |
| **Busta** _(`SaveEnvelope`)_         | payload + versione + istante. La costruisce **solo** il main                                       |
| **Migrazione**                       | la trasformazione da una versione di busta alla successiva. Vive solo in `main/save/migrations.ts` |
| **Round-trip**                       | costruisci uno stato, salva, ricarica, confronta. È il test che tiene in piedi la persistenza      |
| **Lista limitata** _(`boundedList`)_ | una lista storica che dichiara il proprio massimo nel punto in cui nasce                           |

## Comunicazione

| Termine       | Significato                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------- |
| **Evento**    | una notifica sul Bus. Sincrona, senza risposta, effimera: non entra nel salvataggio         |
| **Comando**   | un'azione richiesta dalla UI. Ritorna sempre `Result`                                       |
| **Selettore** | una lettura derivata dallo stato. Non muta nulla e non emette                               |
| **Result**    | `{ ok: true, value }` oppure `{ ok: false, error }`. L'errore ha sempre un `code` leggibile |

Un evento non chiede: notifica. Se serve una risposta, è un comando o un selettore.

## Termini di gioco

Non sono ancora implementati — stanno qui perché il nome va deciso una volta sola, prima che tre
domini ne inventino tre varianti. Le meccaniche sono in [prodotto/visione.md](prodotto/visione.md).

| Termine         | Significato                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Contanti**    | il pool `cash`. Si dice "contanti", mai "liquidi", mai "soldi veri"                                                                                                                                                                         |
| **Carta**       | il pool `card` e il conto che le sta dietro. Sono la stessa cosa: non si distinguono                                                                                                                                                        |
| **Fiches**      | il pool `chips`. Mai "gettoni", mai "chip"                                                                                                                                                                                                  |
| **Caveau**      | ciò che limita la capienza dei contanti. Mai "cassaforte", mai "vault"                                                                                                                                                                      |
| **Calore**      | quanto l'attività irregolare ha attirato attenzione. Sale col volume, scende col tempo                                                                                                                                                      |
| **Indagine**    | ciò che scatta quando il calore supera la soglia. Ha conseguenze reali, non è un avviso                                                                                                                                                     |
| **Reputazione** | quanto i contatti del black market si fidano. Apre trattative, non sconti                                                                                                                                                                   |
| **Era**         | **non è un termine di gioco.** Quattro fasi — contanti, capitale, impresa, rete — che vivono solo in [roadmap-fette.md](roadmap-fette.md) per indovinare cosa il giocatore farà per primo. Mai a schermo, mai nel codice, mai in una delega |
| **Requisito**   | ciò che serve per usare uno strumento. Visibile e su cui si può agire, mai un contatore nascosto. I domini non si "sbloccano": hanno requisiti                                                                                              |
| **Etichetta**   | le nove voci che ogni strumento dichiara — rendimento, varianza, liquidità, tracciabilità, calore, attenzione, pozza, pagamento, requisito                                                                                                  |
| **Pozza**       | quanto uno strumento regge prima che l'attrito morda. Mai "capienza" fuori dai pool, mai "cap"                                                                                                                                              |
| **Traguardo**   | un obiettivo visibile che **non apre niente**. Mai "achievement", mai "sblocco"                                                                                                                                                             |
| **Lotto**       | ciò su cui si punta al buio nelle aste di box. Mai "box", mai "container"                                                                                                                                                                   |
| **Perizia**     | la stima del valore di un lotto o di un oggetto. Riduce l'incertezza, non la elimina                                                                                                                                                        |

## Processo

| Termine             | Significato                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Fetta verticale** | un pezzo di gioco che attraversa **tutti** i livelli, dal kernel alla UI al salvataggio                     |
| **Delega**          | un documento di lavoro autosufficiente: obiettivo, contratto, invarianti, fuori scope, definizione di fatto |
| **Gate**            | un comando che, se rosso, significa "non finito". Non è un consiglio                                        |
| **Difetto Axx**     | uno dei 17 problemi misurati nell'audit del progetto precedente                                             |

## Parole vietate

Non si usano nei nomi di file, cartelle, funzioni o variabili. Non descrivono nulla, e la loro
presenza è il segnale che una responsabilità non è stata trovata:

`utils` · `helpers` · `common` · `misc` · `shared` · `data` · `manager` · `handler` (come nome di
file) · `service` (senza un dominio davanti) · `stuff` · `temp` · `new` / `old` (come suffisso)

Se un pezzo di codice non trova un nome che non sia in questa lista, il problema non è il nome:
è che quel pezzo di codice non ha ancora una responsabilità sola.

**Il meccanismo è `tests/rules/forbidden-words`** (regola C09), e copre i **nomi di file e di
cartelle** sotto `src/`. Due limiti, dichiarati invece che nascosti:

- **Non guarda gli identificatori.** Dentro un identificatore le stesse parole sono spesso
  legittime — `handler` è il nome standard di una callback e compare in `Bus.ts` e in `host.ts` a
  ragione — e una regola che gridasse al lupo lì verrebbe disattivata, dopodiché non proteggerebbe
  più niente. Lì resta la review.
- **Non guarda `tests/`.** Il divieto esiste perché quelle parole nascondono una responsabilità
  mancante nel codice di prodotto. `tests/helpers/` non nasconde niente: la sua responsabilità
  **è** aiutare i test, e la parola la descrive esattamente.

Fino a [D016](delega/D016-correzioni-audit.md) questa sezione era una regola senza meccanismo,
cioè — per la regola del progetto stesso — una regola che non esisteva.
