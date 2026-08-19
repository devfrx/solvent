# ADR 0022 — Il Ledger ha conti, non solo pool

- **Stato:** Proposta — il meccanismo nasce con il primo dominio che possiede un budget
- **Data:** 2026-08-19
- **Estende:** [ADR 0017](0017-il-denaro-e-plurale.md) e [ADR 0020](0020-partita-doppia.md); non li supera

## Contesto

L'[ADR 0017](0017-il-denaro-e-plurale.md) ha reso il denaro plurale: `cash` e `card` sono due
dimensioni con affordance dichiarate come dati, non due etichette della UI. L'[ADR
0020](0020-partita-doppia.md) ha aggiunto quattro conti non giocatore — `world`, `sink`, `fees`,
`house` — perché senza contropartita la somma dei saldi non farebbe zero.

Sei conti. Dichiarati in una `const` (`POOL_IDS`), con `Balances = Readonly<Record<Pool, Money>>`.
Sei conti che esistono da sempre, tutti insieme, che nessuno apre e nessuno chiude.

La [visione di prodotto](../prodotto/visione.md) chiede una cosa che quella forma non regge:
**più attività, ognuna con il suo budget**. E dietro quella, la stessa forma altre quattro volte —
ogni immobile con la sua gestione, ogni posizione aperta con il suo margine, ogni lotto
aggiudicato con il suo deposito da saldare, ogni contratto d'affitto con la sua cauzione.

Sono conti che **il giocatore crea giocando**. Non stanno in una `const`.

La domanda vera è una sola: il budget di un'attività è denaro? Se il giocatore può versarlo e
prelevarlo, se l'attività chiude quando finisce, se un euro che entra là dentro è un euro che non
è più nel suo portafoglio — allora sì. E allora la **regola 6** di
[architettura.md](../architettura.md), _nessun denaro fuori dal Ledger_, dice già dove deve stare.

## Decisione

**Separare il concetto di conto da quello di pool.**

- Un **pool** è un conto con affordance dichiarate: `cash`, `card`, e più avanti le fiches del
  casinò e il saldo crypto. Sono pochi, noti al compilatore, e la UI li mostra al giocatore.
- Un **conto** è qualunque riga del libro mastro. I sei di oggi sono conti. `business:pizzeria-1`
  è un conto. `escrow:asta-4412` è un conto.

La forma:

    type AccountId = Pool | `${AccountKind}:${string}`

`Balances` smette di essere un record totale sui sei pool e diventa una mappa aperta sui conti
aperti. Il Ledger cresce di due operazioni:

| Operazione               | Cosa fa                                                         |
| ------------------------ | --------------------------------------------------------------- |
| `openAccount(id, props)` | apre un conto a saldo zero; lancia se l'`id` è già in uso       |
| `closeAccount(id)`       | chiude un conto; **rifiuta** se il saldo non è esattamente zero |

Il rifiuto sul saldo diverso da zero non è pignoleria: chiudere un'attività con 4.000 € dentro è
un'operazione che deve dire **dove vanno quei 4.000 €**. Se il Ledger lasciasse chiudere, quel
denaro sparirebbe dal libro mastro e la partita doppia diventerebbe un'opinione.

Restano invariati:

- ogni transazione somma a zero, e passa dall'unica primitiva `transaction`
  ([ADR 0021](0021-una-sola-primitiva-per-il-denaro.md));
- nessun dominio nomina `world`, `sink` o `fees`: i costruttori restano gli unici a farlo;
- i pool del giocatore continuano a dichiarare capienza, tracciabilità e interessi come dati. Un
  conto di entità nasce con le proprietà del suo `AccountKind`, non con un `if` sul suo nome.

Un conto appartiene a **un** dominio, e il prefisso è quel dominio. È ciò che permette a
`resetAll` di sapere cosa chiudere senza chiedere a nessuno.

## Quando

**Non adesso.** Il grilletto è il primo dominio che ha un budget per entità — l'Impresa, era 3
della visione. Fino a quel momento sei conti bastano, e costruire la mappa aperta prima sarebbe
generalizzazione speculativa, cioè la cosa che il [registro YAGNI](../roadmap-fette.md) esiste
per fermare.

[D009](../delega/D009-persistenza-main.md) scrive lo schema del salvataggio con i sei conti, e va
scritto così: la migrazione v1 → v2 che apre la mappa è l'identità, e le migrazioni esistono
esattamente per questo. Il costo di rimandare è una migrazione banale. Il costo di **non decidere**
sarebbe molto più alto: due o tre domini che nel frattempo si sono tenuti i soldi in casa, e
riportarli nel Ledger dopo.

Per questo la decisione si prende oggi e l'implementazione aspetta il grilletto. Sono due cose
diverse, ed è la seconda volta che il progetto le tiene separate.

## Alternative scartate

- **Il budget come stato del dominio Impresa.** Costa zero oggi, ed è la scelta pigra travestita da
  scelta semplice. Rende falsa la regola 6, che è una delle due regole 🔒 del progetto; toglie i
  budget dalla partita doppia, quindi dal bilanciamento misurato dell'[ADR 0020](0020-partita-doppia.md);
  e garantisce che cinque domini reinventino i saldi ognuno a modo suo. È il difetto A05 con un
  nome nuovo.
- **Un pool per attività, aggiunto a `POOL_IDS`.** Non è scartato perché brutto: è impossibile.
  `POOL_IDS` è una `const` letta dal compilatore, le attività le crea il giocatore a runtime.
- **Un conto unico "imprese" con un sotto-registro dentro il dominio.** Il libro mastro
  tornerebbe a dire una cosa sola dove ne succedono venti, e il primo bilancio per attività
  richiederebbe di ricostruire i movimenti da un secondo registro tenuto a mano — cioè due verità
  sullo stesso denaro.

## Conseguenze

- **Un bilancio per attività si legge dal Ledger, non si ricostruisce.** Cassa, ricavi, costi e
  margine di una pizzeria sono interrogazioni sul libro mastro, non un modello parallelo. È ciò che
  rende possibile la "gestione profonda" senza scrivere un secondo sistema contabile.
- **Un'attività può fallire in modo verificabile.** Saldo sotto zero oltre il fido = insolvenza, e
  la condizione si legge in un punto solo.
- **Il salvataggio cresce con le entità del giocatore.** La mappa aperta è la prima cosa nel save
  la cui dimensione dipende da quanto ha giocato. Il tetto arriva dal dominio che apre i conti — un
  numero massimo di attività — non dal Ledger, che non deve conoscere quel limite.
- **Costo dichiarato:** `Balances` diventa una mappa parziale. Chi legge un saldo deve gestire il
  conto che non esiste, dove oggi il tipo glielo garantiva. È il prezzo dei conti che nascono e
  muoiono, e va pagato nel Ledger una volta sola invece che in ogni dominio.
