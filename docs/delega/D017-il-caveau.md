# D017 — Il caveau: i contanti hanno una capienza

- **Stato:** Aperta — scritta il 2026-08-20, allo STOP 2, con la fetta 01 conclusa davanti
- **Dipende da:** D013 (cioè tutta la fetta 01)
- **Sblocca:** la fetta 02, e con essa l'era 1 della [visione](../prodotto/visione.md)
- **ADR vincolanti:** [0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md) (nuovo),
  0003, 0014, 0017, 0018, 0020, 0024
- **Regole:** nessuna nuova. Un invariante nuovo: **INV-18**
- **Budget:** ~250 righe di sorgente e ~330 di test. La stima è alta rispetto al lavoro visibile
  perché quasi tutto il costo sta in due punti che non si vedono: il ramo del reddito che ora può
  fallire, e i test del kernel che cambiano firma

## Obiettivo

Accendere il **muro dell'era 1**: i contanti occupano spazio, e quando lo spazio finisce l'unica
via è la carta — che lascia tracce. È la prima volta che la dualità dell'[ADR 0017](../adr/0017-il-denaro-e-plurale.md)
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
lavoro vero è che il muro dell'era 1 **si sposta** — «il caveau si amplia, ma non all'infinito» — e
una capienza che cresce non sta in una costante compilata. Da lì nasce
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

**Decisione di gioco, contestabile:** quando il caveau è pieno il reddito **non entra e non si
perde** — la transazione è rifiutata, quindi non è mai esistita. Non si accumula da nessuna parte e
non si recupera svuotando il caveau. L'alternativa — accreditare fino a riempire e scartare il
resto — è più gentile e sposta il problema: renderebbe il muro un rallentamento invece di un muro,
e l'era 1 finisce proprio quando il rallentamento non basta più. La partita doppia decide da sola:
una transazione parziale non esiste ([ADR 0019](../adr/0019-transazioni-atomiche-nel-ledger.md)).

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

| File                               | Contenuto                                                                   |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `src/core/domains/vault/types.ts`  | `VaultState { level }` e `VaultSave`                                        |
| `src/core/domains/vault/rules.ts`  | `capacityFor(level)`, `expansionCost(level)`, `canExpand(state, available)` |
| `src/core/domains/vault/system.ts` | `createVault(ledger)`: il sistema con stato, e il comando `expand()`        |
| `src/core/balance/constants.ts`    | capienza di partenza, curva delle capienze, curva dei costi                 |
| `src/core/balance/targets.ts`      | l'intervallo in cui il muro deve mordere, e quando                          |

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
- Il caveau si amplia con la **carta** o con i **contanti**? È una scelta di gioco da fare
  eseguendo, e va dichiarata in `UPGRADE_PAYMENT`-style come ha fatto D010: se si paga in contanti,
  ampliare un caveau pieno diventa impossibile proprio quando serve — che può essere il punto, o
  una crudeltà. Decidere e scriverlo.

## Fuori scope

- **Gli oggetti nel caveau.** La visione dice «conserva contanti **e oggetti**», ma gli oggetti
  nascono col black market e con le aste di box: senza di loro un inventario è un contenitore
  vuoto. Ne discende che **il primo `boundedList` salvato non arriva con questa fetta**, e la riga
  del [registro delle fette](../roadmap-fette.md) che lo prometteva va corretta invece che
  obbedita. L'[ADR 0010](../adr/0010-liste-storiche-limitate-alla-definizione.md) resta `Proposta`
  ancora una fetta, e adesso si sa perché.
- **Il calore.** È il secondo muro dell'era 1 e ha bisogno di un dominio suo.
- **Le soglie giornaliere del bancomat.** Daranno ad `atm` il suo primo stato, e sono un'altra
  delega.
- **Interessi sul saldo fermo.** `POOLS.yields` esiste ed è `false` per tutti: resta così.
- **I conti dinamici** dell'[ADR 0022](../adr/0022-il-ledger-ha-conti-non-solo-pool.md). L'ADR 0025
  è deliberatamente più piccolo: risponde a «quanto ci sta», non a «esiste un conto».

## Definizione di fatto

- [ ] `npm run verify` verde, con l'**output incollato**
- [ ] `npm run verify:release` verde
- [ ] test: il Ledger rifiuta un accredito che supera la capienza **corrente**, non quella di
      partenza — cioè dopo un ampliamento il tetto è cambiato davvero
- [ ] test: il `tick` del reddito con il caveau pieno **non muove un centesimo** e lo dice; la
      somma dei conti resta zero
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
  l'esperienza dell'era 1. `targets.ts` è il posto dove si dichiara l'intervallo accettabile, e un
  test lo fa rispettare.
