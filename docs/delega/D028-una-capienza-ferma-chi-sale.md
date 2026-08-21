# D028 — Una capienza ferma chi sale

- **Stato:** Chiusa — commit `a86850d`, ramo `d028-la-capienza-ferma-chi-sale`. Scritta ed eseguita
  il 2026-08-21, la prima delega dopo la fetta 02
- **Dipende da:** [D017](D017-il-caveau.md), che ha acceso la capienza dei contanti — prima della
  fetta 02 il ramo esisteva ed era spento, quindi il difetto non era raggiungibile
- **Sblocca:** D029, i devcheat — non ancora scritta. Un cheat che regala denaro può portare un pool oltre il
  tetto, e senza questa delega lo lascerebbe lì per sempre: la partita si murerebbe da sola con lo
  strumento nato per sbloccarla
- **ADR vincolanti:** ne produce uno,
  [0035](../adr/0035-una-capienza-ferma-chi-sale.md). Ne applica due:
  [0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md), che stabilisce chi risponde
  del tetto, e [0019](../adr/0019-transazioni-atomiche-nel-ledger.md), che spiega perché il rifiuto
  è intero
- **Regole:** un invariante nuovo, **INV-23**. Nessuna regola R o C nuova
- **Budget:** ~10 righe di sorgente e ~60 di test — misurate **15** e **55**. Il sorgente vero è
  **una condizione** e **una funzione spostata**; il resto sono i tre casi che nessuno copriva

## Obiettivo

Impedire che un saldo oltre la propria capienza congeli ogni transazione che lo tocca, comprese
quelle che lo fanno scendere.

## Perché esiste

Il difetto è stato trovato guardando l'applicazione, non leggendo il codice, ed è la sua parte
istruttiva: **il sintomo non somiglia alla causa.**

La partita di sviluppo di questa macchina ha 1.009.051,70 € di contanti contro una capienza di
1.000,00 €. Il salvataggio è stato costruito a mano per una verifica visiva, e viola l'invariante
delle capienze. Il Ledger, che guarda solo il saldo **risultante**, rifiuta ogni transazione che
tocchi i contanti — anche un deposito, che li fa **scendere**, perché il risultato resta sopra il
tetto comunque.

Quello che si vede a schermo è un'applicazione rotta:

| Cosa si vede                                             | Cosa sembra          | Cos'era                   |
| -------------------------------------------------------- | -------------------- | ------------------------- |
| Il patrimonio netto non si muove mai                     | il loop non gira     | il reddito rifiutato      |
| Il grafico del patrimonio è piatto                       | il grafico è rotto   | non c'è niente da tenere  |
| «Conferma deposito» non fa niente                        | il pulsante è morto  | la transazione rifiutata  |
| «Amplia — 900,00 €» non fa niente                        | il caveau è rotto    | la transazione rifiutata  |
| _«ci stanno ancora -1.008.051,70 €»_ sotto ogni pulsante | un errore di formato | `capacity.minus(current)` |

L'ultima riga è un difetto secondo, non un sintomo del primo: `fits` era
`capacity.minus(current)`, scritto identico in **due** punti — `Ledger.validate` e `previewOf` del
bancomat — mentre a un terzo punto la stessa domanda era già posta bene. `roomIn`, in
`domains/vault/rules.ts`, dichiara «mai negativo» nel proprio commento e ha un test che lo prova.
Tre risposte alla stessa domanda, due sbagliate nello stesso modo. È il difetto A05 nella sua forma
mite: non «il denaro scritto da più punti», ma «lo stesso numero calcolato da più punti».

**Perché non è solo un problema di chi sviluppa.** Un saldo oltre il tetto è raggiungibile anche in
una partita vera: un salvataggio più vecchio della curva di bilanciamento, o — nel gioco che la
[visione](../prodotto/visione.md) descrive — qualunque cosa **riduca** una capienza invece di
ampliarla. L'indagine sequestra, il mondo va anche contro. Il giorno in cui succede, il giocatore
perde la partita per un difetto e non per una scelta.

## Da produrre

| File                                                                | Cosa cambia                                                            |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `src/core/contracts/pools.ts`                                       | accoglie `roomIn`, spostata da `domains/vault/rules.ts`                |
| `src/core/domains/vault/rules.ts`                                   | perde `roomIn` e nient'altro                                           |
| `src/core/kernel/Ledger.ts`                                         | il controllo confronta con il saldo corrente; `fits` passa da `roomIn` |
| `src/core/domains/atm/commands.ts`                                  | `fits` dell'anteprima passa da `roomIn`                                |
| `src/renderer/runtime/createGame.ts`, `src/renderer/stores/game.ts` | importano `roomIn` da `contracts/`                                     |
| `tests/kernel/ledger-capacity.test.ts`                              | i tre casi che non esistevano                                          |
| `tests/contracts/pools.test.ts`                                     | accoglie il blocco di prova di `roomIn`, che segue la funzione         |
| `docs/adr/0035-…`, `docs/tracciabilita.md`                          | l'ADR e l'INV-23                                                       |

**Perché `roomIn` sale in `contracts/` e non scende nel kernel.** R13 vieta a un `rules.ts` di
importare **valori** da `Ledger`, quindi il verso opposto non era percorribile: il caveau non
potrebbe più usarla. `contracts/` è l'unico livello che kernel, domini e store raggiungono tutti e
tre, e la domanda «quanto ci sta ancora in questo pool» è una domanda **su un pool** — sta accanto a
`POOLS` e a `CASH_START_CAPACITY`, non dentro il dominio che per caso è stato il primo a porla.

## Invarianti

- **INV-23** — nessuna transazione fa **crescere** un pool oltre la sua capienza. Un saldo già
  oltre può solo scendere, o restare fermo.
- **INV-18 vale anche sui numeri del rifiuto**, non solo sul tetto: l'anteprima del bancomat e il
  Ledger producono lo stesso `fits` perché lo chiedono alla stessa funzione.
- `roomIn` non è mai negativo, e adesso è l'unico posto in cui quella garanzia è scritta.

## Fuori scope

- **Riportare dentro il tetto un saldo che lo supera.** Confiscare denaro al caricamento è una
  punizione per uno stato che il giocatore non ha scelto. Il limite è dichiarato nell'ADR 0035.
- **Un codice d'errore per «sei già oltre».** Il rifiuto giusto in quel caso è nessun rifiuto.
- **`fitsIn` di `atm/rules.ts`.** Risponde «sì o no» a una domanda che riguarda solo un importo in
  **arrivo**, cioè un aumento, e per quel caso la regola non è cambiata. Unirla a `roomIn` sarebbe
  un rifacimento che questa delega non ha ragione di fare.
- **La partita di sviluppo di questa macchina.** Non si tocca e non si cancella: si sblocca da sola,
  ed è la prova che la decisione era vera.

## Definizione di fatto

- [x] Un saldo oltre il tetto può scendere — test.
- [x] Un saldo oltre il tetto non può salire di un centesimo — test.
- [x] `fits` non è mai negativo, nel Ledger e nell'anteprima del bancomat — due test.
- [x] I tre test rotti di proposito: due cadono con il controllo di prima, e quello di guardia cade
      con l'aggiramento plausibile («se sei già sopra, il tetto non vale più»).
- [x] `roomIn` ha un solo corpo in tutto il repo.
- [x] `npm run verify` verde.
- [x] `docs/stato.md` rigenerato.

## Trappole note

1. **Il controllo che guarda un solo numero.** `next.greaterThan(capacity)` sembra completo perché
   la frase «il saldo non supera il tetto» è completa. Manca il verso, e il verso è tutto: una
   regola sui **saldi** congela, una regola sulle **transazioni** ferma. La differenza non si vede
   finché un saldo non si trova dalla parte sbagliata.
2. **L'aggiramento che sblocca e rompe.** «Se il saldo corrente è già sopra, non controllare
   niente» è una riga, sblocca la partita, e trasforma il tetto in una porta che si apre da sola
   una volta superata. È l'unica ragione per cui il test «ma non può salire di un centesimo»
   esiste: da solo non prova la funzionalità nuova, prova che non è stata scritta nel modo
   sbagliato.
3. **Lo stesso numero calcolato in tre punti.** Nessuno dei tre era un errore evidente da solo. A
   renderli un difetto è che rispondono alla stessa domanda: il modo di trovarli non è leggere il
   codice, è chiedersi **quante volte** una domanda è posta.

## Correzioni rispetto a com'era scritta la delega

1. **La regola nuova non ha reso rosso nessun test.** Era la misura attesa dalla preparazione, ed è
   uscita più forte del previsto: dei 767 test, i **7** che sono caduti applicando la modifica erano
   tutti dovuti allo **spostamento** di `roomIn` (import da aggiornare) più `project-state`, che è
   generato. Il cambio di regola, da solo, non ha toccato niente. Non è una rassicurazione: è la
   misura di quanto quel caso fosse scoperto, e la ragione per cui la delega ha dovuto **scrivere**
   la propria rete invece di ereditarla.
2. **La delega prevedeva di toccare un punto, e ne ha toccati due.** `fits` sbagliato nel Ledger era
   nel testo; la copia identica in `previewOf` del bancomat no — è emersa cercando **la domanda**
   invece della riga, che è il metodo che il passaggio di consegne raccomanda per i fatti sbagliati
   e che vale identico per il codice.
3. **`roomIn` non è stata copiata: è stata spostata**, e il blocco di test l'ha seguita da
   `tests/domains/vault/` a `tests/contracts/`. Un test che resta dove la funzione non è più è il
   modo in cui una cartella smette di dire la verità su cosa contiene.
4. **Il caso di prova usa `Ledger.load`, non una sequenza di transazioni.** Costruire un saldo oltre
   il tetto transazione per transazione è impossibile per costruzione — è il punto della delega — e
   il salvataggio è anche il modo in cui il difetto è arrivato davvero. I saldi passati sommano a
   zero, o `load` lancerebbe per INV-08: è la seconda regola a fare da controllo alla prima.
