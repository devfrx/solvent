# D017 — Il caveau: i contanti hanno una capienza

- **Stato:** Aperta — scritta il 2026-08-20 allo STOP 2, e **preparata per l'esecuzione** lo
  stesso giorno: la preparazione ha misurato il costo del cambiamento e ha trovato un difetto
  nella delega stessa. Vedi _Cosa la preparazione ha verificato_
- **Dipende da:** D013 (cioè tutta la fetta 01), **[D019](D019-il-pagamento.md)** che porta il
  listino — senza, l'ampliamento nascerebbe con un pool scritto nel sorgente e da correggere subito
  dopo — e **[D020](D020-nessun-sistema-si-fida-del-salvataggio.md)**, che mette la regola sotto cui
  il caveau nasce: è il **secondo** dominio con stato, e il suo `load` deve rifiutare un
  salvataggio che non riconosce
- **Sblocca:** la fetta 02: il primo muro del gioco, e il primo confine del kernel che si sposta
  dopo la fetta 01
- **Il dominio è stato studiato prima:** [design/domini/vault.md](../design/domini/vault.md), la
  metà di gioco della scheda. Contiene le decisioni di gioco che questa delega **non** deve
  prendere da sola — l'unità della capienza, il tetto a livelli finiti, la varianza zero — e le
  alternative che sono state scartate, con il perché
- **ADR vincolanti:** [0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md) (nuovo),
  [0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md), 0003, 0014, 0017, 0018,
  0020, 0024
- **Regole:** nessuna nuova. Un invariante nuovo: **INV-18**
- **Budget:** ~330 righe di sorgente e ~410 di test. La stima è alta rispetto al lavoro visibile
  perché quasi tutto il costo sta in tre punti che non si vedono: il ramo del reddito che ora può
  fallire, i test del kernel che cambiano firma, e il **selettore del pagamento** — che D019
  costruisce per un'opzione sola e che qui incontra il suo primo caso a due. La stima era ~250 e
  ~330 quando D019 non esisteva

## Obiettivo

Accendere il **primo muro del gioco**: i contanti occupano spazio, e quando lo spazio finisce
l'unica via è la carta — che lascia tracce. È la prima volta che la dualità dell'[ADR 0017](../adr/0017-il-denaro-e-plurale.md)
smette di essere una descrizione e diventa una costrizione.

## Perché esiste, e perché è più piccola di quanto sembri

Metà di questa fetta è **già costruita e spenta**, e a scoprirlo è stata
[D013](D013-verifica-della-fetta.md) preparandola:

- il Ledger fa già rispettare la capienza e rifiuta con `error.ledger.capacity_exceeded`, che porta
  con sé il tetto **e quanto ci sta ancora** (`fits`);
- `capacityOf(pool)` e `fitsIn(capacity, current, incoming)` sono pure, scritte a
  [D014](D014-dominio-bancomat.md) e già provate — `fitsIn` riceve la capienza per argomento
  apposta, così i bordi si provano senza sostituire un modulo;
- lo store espone `cashCapacity` e `cardCapacity`, e il pannello dei contanti mostra la capienza:
  oggi dice «Illimitata»;
- `error.ledger.capacity_exceeded` è tradotto in entrambe le lingue.

Accendere il muro **fisso** è una riga: un valore al posto di `null` in `POOLS.cash.capacity`. Il
lavoro vero è che il muro **si sposta** — «il caveau si amplia, ma non all'infinito» — e una
capienza che cresce non sta in una costante compilata. Da lì nasce
l'[ADR 0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md), che è l'unica decisione
strutturale di questa delega.

## Il pezzo che nessuno si aspetta: il reddito può fallire

Oggi il `tick` di `income` chiama il Ledger e **ignora il `Result`**, con un commento che dice
perché:

> Il `Result` del Ledger non ha un ramo da gestire qui, e non è una svista: dopo il posting il tick
> non fa altro, e l'unico fallimento possibile — la capienza del caveau — non esiste prima della
> fetta 02. Quando esisterà, il reddito non incassato sarà un esito da mostrare al giocatore, e
> questa riga crescerà di conseguenza.

Questa delega è quel giorno. È il cuore del lavoro, non un dettaglio: un idle in cui il reddito
smette di entrare **senza dirlo** è un idle rotto, e il giocatore deve capire in un colpo d'occhio
che il caveau è pieno e che i soldi non stanno arrivando.

**Decisione di gioco:** quando il caveau non tiene tutto, il reddito accredita **quanto ci sta** e
il resto non entra. Non «tutto o niente».

Questa riga sostituisce quella scritta il giorno prima, che diceva il contrario — «la transazione è
rifiutata, quindi non è mai esistita» — e la sostituisce perché la preparazione l'ha **misurata
sbagliata**, non perché suoni meglio. Il motivo sta nel recupero: `recover()` fa **un solo**
`tickAll` con tutti i tick arretrati, quindi una transazione sola da otto ore di reddito. Il Ledger
la rifiuta intera, perché una transazione è atomica ([ADR 0019](../adr/0019-transazioni-atomiche-nel-ledger.md)),
e il giocatore che è stato via torna con **zero** — a caveau vuoto. Non è un muro: è un guasto
travestito da regola.

Ne discende che `income` non può limitarsi a chiedere e incassare il rifiuto: deve **sapere quanto
ci sta prima di chiedere**. Il pezzo esiste già ed è puro — `fitsIn(capacity, current, incoming)` —
e gli manca il fratello che risponde «quanto», invece di «sì o no». Il muro resta un muro: quando
il caveau è pieno davvero, quanto-ci-sta vale zero e il reddito si ferma del tutto.

## L'ampliamento ha un listino, ed è il primo a due voci

[D019](D019-il-pagamento.md) porta il meccanismo — `PaymentOption`, il listino, e la regola che il
prezzo mostrato e quello addebitato vengono dalla stessa funzione (INV-19). Lo costruisce su
`income`, che accetta **un** solo strumento: l'ampliamento del caveau è il primo a offrirne due, e
con esso arriva il selettore vero.

**D019 è chiusa, e quello che ha lasciato è questo.** Non si riscrive: si usa.

- `contracts/payment.ts` — `PaymentOption { pool, price }` e `PriceList`. Nessuna funzione: è
  vocabolario. Il campo del calore **non c'è**, e il suo grilletto resta la fetta 04.
- Il listino è una **funzione pura del dominio** (`income/rules.ts`: `upgradePrices`,
  `upgradePriceFor`), e i prezzi vengono da `balance/constants.ts` — uno per strumento, con lo
  strumento nel nome (`UPGRADE_PRICE_CARD`). Il caveau ne dichiarerà **due**.
- **`accepts` non si scrive più a mano**: `UPGRADE_PAYMENT.accepts` è
  `upgradePrices().map((option) => option.pool)`. L'ampliamento faccia lo stesso, o le due
  dichiarazioni torneranno a poter divergere.
- Il comando riceve il **pool** e ricalcola il prezzo dal listino; un pool fuori listino è rifiutato
  con `error.ledger.pool_not_accepted` e l'elenco di quelli buoni. Nessun comando riceve un prezzo.
- Nello store: `upgradePrices` (uno `shallowRef`, o Pinia proxa i `Decimal` e l'identità di INV-19
  salta) e `canBuyUpgradeWith(pool)`, che è l'anteprima **per strumento**.
- In `IncomePanel.vue`: un `v-for` sul listino, e la chiave `payment.only_with` che con un'opzione
  sola dice il **perché** al posto del nome dello strumento.

**Il selettore è tuo, e con esso una decisione di gioco che D019 non poteva prendere**: cosa fa la
UI quando il giocatore **ha** lo strumento ma non abbastanza. Oggi il pulsante non si spegne, si
smorza, e a spiegare è il rifiuto del Ledger con le due cifre — che con un'opzione sola è la cosa
giusta, perché non c'è nessun altro posto dove guardare. Con due, «non ti bastano i contanti»
convive con «la carta invece basta», e le risposte possibili sono almeno tre: mostrare entrambe e
lasciar scegliere, ordinare le opzioni mettendo davanti quella pagabile, oppure indicare la via del
bancomat. L'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) ne esclude
una sola — la conversione automatica — e lascia aperte le altre.

**Contanti o carta, a prezzi diversi.** Il numero non è deciso qui — va in `balance/` e va scelto
giocando — ma la sua **taratura** ha un vincolo che vale la pena scrivere prima: il calore non
esiste ancora, quindi lo strumento più economico non paga niente in cambio e vincerebbe sempre. La
legge della non dominanza cadrebbe al primo confronto.

Il compromesso che regge già oggi è **la commissione del bancomat**. Se la carta costa meno ma il
giocatore ha solo contanti, deve prima versarli e pagare `ATM_FEE`: conviene solo se lo sconto
supera la commissione. È una scelta vera, verificabile con un test di bilanciamento, e la fetta 04
ci aggiungerà il calore senza smontarla.

Ne discende una **cosa da non fare**: dare all'ampliamento due prezzi senza guardare `ATM_FEE`. Con
la commissione a 2,50 €, uno sconto di 50 € sulla carta rende i contanti inutili — e il caveau
avrebbe un listino di due voci di cui una non si sceglie mai, che è arredamento con dentro del
codice.

## Cosa la preparazione ha verificato

Fatta il 2026-08-20, subito dopo aver scritto la delega, e non è stata una rilettura: il costo del
cambiamento è stato **misurato** mettendo davvero una capienza a `POOLS.cash` e guardando cosa
diventa rosso. Sette punti, e il primo ha riscritto il cuore della delega.

**1. Il rifiuto atomico e il recupero si scontrano, e la decisione di gioco era sbagliata.** Con
`POOLS.cash.capacity = 5000`, `tests/renderer/store` dice `expected '0' to be '345600'`: il
recupero non incassa «quanto ci sta», incassa **zero**. È il motivo per cui la sezione _Il pezzo che
nessuno si aspetta_ adesso dice il contrario di quello che diceva ieri. Trovarlo è costato una
riga cambiata e una esecuzione dei test; trovarlo dopo sarebbe costato un giocatore.

**2. Tre test che diventano rossi sono cartelli piantati apposta, non regressioni.** Il progetto si
è lasciato dei messaggi per questo giorno, e vanno letti prima di «aggiustarli»:

| Test                      | Cosa dice di sé                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `tests/contracts/pools`   | «nella fetta 01 la forma c'è e i valori no: nessuna capienza, nessun interesse»    |
| `tests/domains/atm/rules` | «oggi è illimitata per i pool del giocatore — è una fotografia, non un'assunzione» |
| `tests/renderer/store`    | «il caveau non ha ancora un tetto, e la schermata lo dice invece di inventarlo»    |

Ognuno va **riscritto** per dire la cosa nuova, non cancellato: una fotografia sostituita da una
fotografia, non da un buco.

**3. La capienza di partenza ha un raggio d'azione misurato.** Sopra circa **900 €** né
`tests/balance/targets` — che guadagna 720,00 € in un minuto simulato — né
`tests/save/game-roundtrip` — che ne guadagna 802,80 giocando — si accorgono di niente. Sotto quella
soglia vanno cambiati entrambi, ed è una scelta da fare **sapendo** di farla. Il numero non è
libero: è anche quanto ci mette il giocatore a incontrare il muro la prima volta.

**4. `cashCapacity` nello store è un mirror che non si aggiorna mai.** È uno `shallowRef` letto una
volta sola alla costruzione (`capacityOf('cash')`), e oggi è corretto perché la capienza non cambia.
Col caveau che si amplia va riletto a mano, come fa `readIncome()` per il reddito: è la trappola dei
mirror che il [passaggio di consegne](PASSAGGIO-DI-CONSEGNE.md) mette in cima all'elenco — quello
che vive in `core/` e che nessun evento annuncia non è reattivo.

**5. L'ADR 0025 toglie l'unico mock di modulo del progetto**, ed è un argomento a favore che non
era stato previsto scrivendolo. `tests/kernel/ledger-capacity` sostituisce `@core/contracts/pools`
con `vi.mock`, e il suo commento lo dichiara: «è l'unico file di test del progetto che sostituisce
un modulo, ed è per questo che sta da solo». Con le capienze passate per parametro quel mock non
serve più: si passa una funzione. Una decisione strutturale che **cancella** un'eccezione invece di
aggiungerne una è la stessa forma del fix di radice di [D016](D016-correzioni-audit.md), che
toglieva codice invece di aggiungerne.

**6. Il caveau non ha un posto ovvio in `ORDER`, e la delega non lo nominava.** Le fasi sono due —
`ECONOMY: 100` e `INCOME: 200` — e il [registro YAGNI](../roadmap-fette.md) dice che una terza nasce
col «primo sistema che non sta in nessuna delle due». Il caveau **non ticchetta**, quindi il suo
`order` decide solo l'ordine di salvataggio e caricamento, non quello del tick: la domanda è più
piccola di quanto sembri. La proposta è `ECONOMY`, perché il caveau è infrastruttura economica
esattamente come il bancomat che occuperà lo stesso slot, e perché aprire una fase per un sistema
che non ticchetta sarebbe l'astrazione speculativa che l'ADR 0014 vieta. Chi esegue decida, e lo
scriva.

**7. Il meccanismo che obbliga a registrare il sistema c'è ed è secco.**
`tests/rules/registry-completeness` conta le occorrenze di `.register(` in `createGame.ts` e le
confronta con i file `src/core/domains/*/system.ts`: creare `vault/system.ts` senza la riga nel
bootstrap è un test rosso, non una svista da review.

**8. Il bancomat ha bisogno della capienza del caveau, e i due domini non hanno un confine
imposto.** Un **prelievo** porta denaro _verso_ i contanti, quindi l'anteprima deve sapere se ci
sta: `previewOf` oggi non lo chiede a nessuno. Le due funzioni che rispondono — `capacityOf` e
`fitsIn` — vivono in `domains/atm/rules.ts`, dove [D014](D014-dominio-bancomat.md) le ha messe
perché lì servivano, e col caveau non è più il loro posto.

Nessuna regola lo impedirebbe: sotto `src/core/domains/**` il lint vieta `vue`, `pinia`, `electron`
(INV-02) e le conversioni di `Money` (R11), e **non** vieta a un dominio di importarne un altro. Un
`atm` che importa `vault/rules` passerebbe tutti i gate. Sarebbe anche il **primo** accoppiamento
fra domini del progetto, cioè un precedente — e la visione ne ha diciassette che si contendono le
stesse risorse.

La proposta è non aprirlo: la capienza arriva a `previewOf` **per argomento**, come già fa con
`fitsIn(capacity, …)`, e a passarla è chi ha entrambi sotto mano — lo store. Il dominio resta
ignorante di chi gli risponde, la funzione resta pura e provabile con una capienza finta, e nessun
dominio impara il nome di un altro. Chi esegue decida, ma sappia che sta scegliendo un precedente,
non un import.

### Cosa ne discende per il budget

La stima **era** ~250 righe di sorgente e ~330 di test, e non era una svista: il punto 1 aggiunge
lavoro a `income` e ne toglie altrove — il mock che sparisce (punto 5) e i tre test che si
riscrivono invece di nascere (punto 2). È salita a **~330 e ~410** quando
[D019](D019-il-pagamento.md) è nata: il selettore del pagamento a due opzioni è di questa delega, e
la riga qui sopra è rimasta indietro di una sessione — corretta da D019 stessa, che è la delega che
quel budget lo ha cambiato. Se il consuntivo sforerà, sforerà per la ragione dichiarata
al punto 1, che è la sola parte di questa delega scoperta dopo averla scritta.

## Cosa trovi già fatto

- **Tutto l'elenco qui sopra.** Non si riscrive: si accende e si collega.
- **Il bancomat** è già il ponte, con la commissione che si vede prima della conferma. Con il
  caveau pieno diventa obbligatorio invece che comodo, e non cambia di una riga.
- **`tests/kernel/ledger-capacity`** prova già il rifiuto e il valore di `fits`.
- **Il rifiuto è una frase, non un pulsante spento** ([ADR 0018](../adr/0018-la-home-e-un-atm.md)),
  e la home lo fa già: qui c'è un rifiuto in più da vestire, non un modo nuovo di vestirlo.

## Da produrre

### Kernel

| File                          | Cosa cambia                                                               |
| ----------------------------- | ------------------------------------------------------------------------- |
| `src/core/kernel/Ledger.ts`   | `Capacities`, e `createLedger(bus, capacities = poolCapacity)` (ADR 0025) |
| `src/core/contracts/pools.ts` | `cash.capacity` smette di essere `null`: è la capienza **di partenza**    |

### Dominio

| File                                | Contenuto                                                                                                                                                                                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/core/domains/vault/types.ts`   | `VaultState { level }` e `VaultSave`                                                                                                                                                                                                                               |
| `src/core/domains/vault/rules.ts`   | `capacityFor(level)`, `expansionCost(level)`, `canExpand(state, available)` e **`roomIn(capacity, current)`** — quanto ci sta ancora, che è il fratello mancante di `fitsIn` e ciò che permette al reddito di accreditare il parziale (punto 1 della preparazione) |
| `src/core/domains/vault/system.ts`  | `createVault(ledger)`: il sistema con stato, e il comando `expand()`                                                                                                                                                                                               |
| `src/core/balance/constants.ts`     | capienza di partenza, curva delle capienze, curva dei costi                                                                                                                                                                                                        |
| `src/core/balance/targets.ts`       | l'intervallo in cui il muro deve mordere, e quando                                                                                                                                                                                                                 |
| `src/core/domains/income/system.ts` | il `tick` accredita **quanto ci sta** invece di ignorare il `Result`: è il commento che quel file porta da D010, e questo è il giorno in cui cresce                                                                                                                |
| `src/core/domains/atm/rules.ts`     | `capacityOf` esce: la capienza vera non sta più in `POOLS`. `fitsIn` resta, e la riceve per argomento                                                                                                                                                              |

Il caveau **ha stato**, quindi ha un `system.ts` e si registra — al contrario di `atm`
([D014](D014-dominio-bancomat.md), decisione 1). Non ticchetta: `tick` resta assente, e il tipo lo
permette.

### Applicazione

| File                                    | Cosa cambia                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| `src/renderer/runtime/createGame.ts`    | una riga di `register`, e la funzione di capienza consegnata al Ledger         |
| `src/renderer/stores/game.ts`           | i selettori del caveau; e lo stato «il caveau è pieno», che il reddito produce |
| `src/renderer/components/CashPanel.vue` | la capienza vera, quanto manca, e il pulsante per ampliare                     |
| `src/renderer/i18n/it.ts`, `en.ts`      | le chiavi nuove, in **entrambe** le lingue o il test di parità è rosso         |

## Invarianti

- **INV-18 — la capienza che il Ledger fa rispettare è la stessa che la UI mostra.** Non due
  letture da tenere allineate: una funzione sola, interrogata da entrambi. È INV-11 applicata al
  caveau, ed è la ragione per cui `capacityOf` va rifatto invece che affiancato — oggi risponde
  leggendo `POOLS`, cioè la capienza di partenza, che dopo il primo ampliamento è la risposta
  sbagliata.
- **La somma di tutti i conti resta zero** (INV-08), ampliamento compreso: il caveau si paga, e il
  denaro va da qualche parte.
- **Nessun percorso accredita contanti senza passare dal Ledger** (R06). È l'invariante che
  l'ADR 0025 protegge scegliendo di non spostare il controllo nel dominio.
- **La capienza è misurata in euro, e un giorno gli oggetti se la contenderanno con i contanti.**
  Non è un invariante da far rispettare qui: è una decisione presa nella
  [scheda del caveau](../design/domini/vault.md) — lo spazio del caveau è **uno solo**, e un
  oggetto vi occupa un ingombro espresso in euro che non è il suo valore. Va scritta qui perché
  **non costa niente rispettarla e costerebbe una riscrittura ignorarla**: la capienza consegnata
  al Ledger è una funzione che il caveau possiede (ADR 0025), quindi il giorno degli oggetti la
  sottrazione entra lì dentro e nient'altro si muove. Non serve nessun parametro, nessuna firma
  diversa e nessun test in più oggi. Serve solo non misurare la capienza in qualcos'altro.

## Fuori scope

- **Gli oggetti nel caveau.** La visione dice «conserva contanti **e oggetti**», ma gli oggetti
  nascono col black market e con le aste di box: senza di loro un inventario è un contenitore
  vuoto. Ne discende che **il primo `boundedList` salvato non arriva con questa fetta**, e la riga
  del [registro delle fette](../roadmap-fette.md) che lo prometteva va corretta invece che
  obbedita. L'[ADR 0010](../adr/0010-liste-storiche-limitate-alla-definizione.md) resta `Proposta`
  ancora una fetta, e adesso si sa perché.
- **Il calore.** È il secondo muro dei contanti e ha bisogno di un dominio suo.
- **Le soglie giornaliere del bancomat.** Daranno ad `atm` il suo primo stato, e sono un'altra
  delega.
- **Interessi sul saldo fermo.** `POOLS.yields` esiste ed è `false` per tutti: resta così.
- **I conti dinamici** dell'[ADR 0022](../adr/0022-il-ledger-ha-conti-non-solo-pool.md). L'ADR 0025
  è deliberatamente più piccolo: risponde a «quanto ci sta», non a «esiste un conto».
- **Il meccanismo del pagamento.** Il contratto `PaymentOption`, il listino e la sua lettura sono
  di [D019](D019-il-pagamento.md), che viene **prima** di questa delega. Qui il caveau lo **usa**,
  e ne è il primo caso a due voci: vedi _L'ampliamento ha un listino_.

## Definizione di fatto

- [ ] `npm run verify` verde, con l'**output incollato**
- [ ] `npm run verify:release` verde
- [ ] test: il Ledger rifiuta un accredito che supera la capienza **corrente**, non quella di
      partenza — cioè dopo un ampliamento il tetto è cambiato davvero
- [ ] test: il `tick` del reddito con il caveau **pieno** non muove un centesimo e lo dice; con
      il caveau **quasi** pieno accredita quanto ci sta, e la somma dei conti resta zero
- [ ] test: **il recupero dopo otto ore in un caveau più piccolo del maturato accredita quanto ci
      sta, non zero.** È il caso che la preparazione ha trovato misurando, ed è quello che senza un
      test tornerebbe da solo: `recover()` fa un `tickAll` solo, quindi una transazione sola
- [ ] test: la capienza mostrata dalla UI e quella che il Ledger fa rispettare vengono dalla
      **stessa** funzione (INV-18), verificato per identità e non per uguaglianza — è la trappola
      che [D015](D015-home-bancomat.md) ha pagato alla correzione 14
- [ ] test: il caveau ampliato attraversa il salvataggio, e `tests/save/game-roundtrip` lo include
      nella partita che gioca
- [ ] test di bilanciamento: il muro morde dentro l'intervallo dichiarato in `targets.ts`
- [ ] ogni test nuovo è stato rotto di proposito almeno una volta
- [ ] verifica a mano: il caveau si riempie, il reddito si ferma **e si vede che si è fermato**,
      il bancomat lo svuota, il gioco riparte
- [ ] [ADR 0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md) passa ad `Accettata`
- [ ] `docs/tracciabilita.md`: INV-18 ha la sua riga e il suo meccanismo
- [ ] i tre test-fotografia del punto 2 della preparazione sono stati **riscritti**, non
      cancellati: una fotografia si sostituisce con una fotografia
- [ ] l'`order` del caveau è dichiarato e motivato in una riga, e se apre una fase nuova di
      `ORDER` la voce esce dal [registro YAGNI](../roadmap-fette.md)
- [ ] la riga della fetta 02 nel [registro delle fette](../roadmap-fette.md) è corretta: niente
      `boundedList` salvato qui, e il perché

## Lo stile con cui si disegna, e perché è provvisorio

La direzione visiva del progetto **non è chiusa**: viene rifatta da zero a partire da
`docs/design/mappa-funzionale.md`, che è stata scritta apposta senza nessuna decisione di design
dentro. Ne discende che la preferenza [P2](../prodotto/preferenze.md) — «lo stile visivo del
mockup è approvato» — e i token CSS di `App.vue` sono da considerare **provvisori**.

Per questa delega significa una cosa sola, ed è liberatoria: il pannello del caveau si veste come
quelli accanto, e non si spende un minuto a inventare una forma nuova. Quello che va fatto bene è
**cosa** mostra — la capienza, quanto manca, e il fatto che il reddito si è fermato — perché è
l'informazione a sopravvivere al design system, non il CSS che la porta. Lo stile attaccato al
componente (la difesa contro il difetto A14) resta la regola proprio perché rende il ricambio
economico: togliere il componente toglierà anche il suo stile.

## Trappole note

- **A17.** Questa è la prima delega dopo uno STOP, cioè il momento di massimo rischio del progetto:
  il kernel è pagato e tutto sembra facile. Il caveau apre il black market, le aste e il calore, e
  nessuno dei tre si tocca qui.
- **Il caveau pieno è uno stato del gioco, non un errore.** Se finisce nella schermata d'errore,
  la fetta è sbagliata: è una condizione normale in cui il giocatore vive, e deve poterci giocare.
- **`capacityOf` va rifatto, non affiancato.** Due funzioni che rispondono alla stessa domanda con
  due valori diversi sono il difetto che INV-11 esiste per rendere impossibile.
- **Il valore predefinito di `createLedger` è ciò che rende il cambiamento innocuo**, ed è anche
  ciò che lo rende facile da dimenticare: un test che costruisce un Ledger senza capienze prova il
  comportamento di prima, non quello nuovo. Almeno un test deve passare una funzione **finta** e
  vedere il Ledger obbedirle.
- **I numeri sono contestabili e vanno scelti giocando**, non calcolati: la capienza di partenza
  decide dopo quanti secondi il giocatore incontra il muro la prima volta, e quel numero è
  l'esperienza dei primi minuti di gioco. `targets.ts` è il posto dove si dichiara l'intervallo
  accettabile, e un test lo fa rispettare.
