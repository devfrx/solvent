# D019 — Il pagamento: il listino di un'azione, e chi lo sceglie

- **Stato:** Aperta — scritta il 2026-08-20, ragionando sul sistema di pagamento **prima** di
  eseguire [D017](D017-il-caveau.md)
- **Dipende da:** D013 (tutta la fetta 01)
- **Sblocca:** [D017](D017-il-caveau.md), che senza di questa nascerebbe con un pool fisso da
  correggere dopo. E ogni dominio futuro che spende
- **ADR vincolanti:** [0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
  (nuovo), 0003, 0007, 0011, 0017, 0024
- **Regole:** nessuna nuova. Un invariante nuovo: **INV-19**
- **Budget:** ~140 righe di sorgente e ~220 di test. È piccola perché il kernel non si tocca: la
  metà del sistema che sembrava mancare era già lì

## Obiettivo

Togliere dal codice la risposta alla domanda **«con cosa pago?»**, e darla al giocatore — con il
prezzo di ogni strumento scritto accanto.

## Perché esiste, e perché non è dentro D017

L'[ADR 0017](../adr/0017-il-denaro-e-plurale.md) dice che «la scelta _con cosa pago_ è il
meccanismo centrale del gioco». Oggi quella scelta non esiste: `income` compra il suo upgrade con
`spend('card', upgradeCost())`, e il pool è scritto nel sorgente.

I comandi che spendono stanno per diventare due — l'upgrade e l'ampliamento del caveau — e questo
è l'unico momento in cui la domanda si può rispondere senza rifare niente. Prima non si poneva;
dopo, D017 avrebbe già scelto per conto suo, e una meccanica che riguarda tutti i domini disegnata
dentro uno nasce storta. È il difetto A05 con un altro nome.

**Metà del lavoro era già fatta e non si vedeva.** `TransactionMeta.accepts` esiste, il Ledger
rifiuta con `error.ledger.pool_not_accepted` portando l'elenco valido dentro l'errore, e
`error.ledger.insufficient_funds` porta già `pool`, `required` e `available`. Il kernel non ha
bisogno di una riga: quello che manca sta sopra di lui.

## Cosa trovi già fatto

- **`accepts`** ([contracts/ledger.ts](../../src/core/contracts/ledger.ts)) e il rifiuto tipizzato
  con l'elenco dei pool ammessi. Resta **esattamente com'è**.
- **`error.ledger.insufficient_funds` con `pool`, `required`, `available`**: «ti mancano 200 € sulla
  carta» si può già dire, e nessuno lo dice.
- **`UPGRADE_PAYMENT`** in `income/commands.ts`, che è già la dichiarazione esportata di come si
  paga quell'azione — con un commento che spiega perché sta lì. Diventa un listino: cambia forma,
  non intenzione.
- **Il pattern dell'anteprima**: `previewOf` del bancomat costruisce i movimenti che la UI mostra e
  che il comando applica, e il comando **la richiama** invece di riceverli. Il listino si comporta
  allo stesso modo, e non c'è niente da inventare.

## Da produrre

### Contratti

| File                            | Contenuto                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/core/contracts/payment.ts` | `PaymentOption { pool, price }` e il tipo del listino. Nessuna funzione: è vocabolario, e va dove sta il vocabolario condiviso |

Il campo `heat` **non** si scrive: nessuno lo leggerebbe fino alla fetta 04, e arriverà additivo.
Il perché sta nell'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md), fra
le alternative scartate.

### Dominio

| File                                  | Cosa cambia                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/core/domains/income/rules.ts`    | il listino dell'upgrade: una funzione pura che ritorna le opzioni. Oggi ne ritorna **una** — la carta — e va bene così                            |
| `src/core/domains/income/commands.ts` | `buyUpgrade` riceve il **pool scelto**, ricalcola dal listino e paga quello. `UPGRADE_PAYMENT` diventa il `TransactionMeta` costruito dal listino |
| `src/core/balance/constants.ts`       | il prezzo per strumento dell'upgrade. Oggi un numero solo, ma passa da qui: un importo di gioco non nasce dentro un dominio                       |

### Applicazione

| File                               | Cosa cambia                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/renderer/stores/game.ts`      | il listino esposto ai componenti, e `buyUpgrade` che porta il pool scelto                                                             |
| `src/renderer/components/`         | il pagamento si **vede prima di premere**: con quale strumento, a che prezzo. Con un'opzione sola non c'è selettore, c'è la ragione   |
| `src/renderer/i18n/it.ts`, `en.ts` | le chiavi nuove in **entrambe** le lingue, o il test di parità è rosso. Servono anche le due frasi di `insufficient_funds` arricchito |

## Il selettore vero è di D017, e non è pigrizia

Oggi **nessuna azione accetta due strumenti**. L'upgrade del reddito si paga solo con la carta, e
non è una svista: è la prima volta che il gioco dice «per questo ti serve il conto», e la
[mappa funzionale](../design/mappa-funzionale.md) la elenca fra le cose che possono andare male.

Ne discende che un componente di **scelta** costruito qui non avrebbe nessun caso da servire, e
sarebbe provato solo da un test che si inventa un listino finto. Il primo listino a due voci è
l'ampliamento del caveau, e nasce con [D017](D017-il-caveau.md).

Questa delega costruisce quindi **il listino e la sua lettura**: il giocatore vede con cosa paga e
quanto costa, e quando l'opzione è una sola vede **perché**. D017 estende lo stesso componente al
caso con due, che è una delega più grossa di quanto dicesse — vedi _Cosa lascia a D017_.

## Invarianti

- **INV-19 — il prezzo che il giocatore vede e quello che il Ledger addebita vengono dalla stessa
  funzione.** Non due formule allineate a mano: il listino, interrogato dalla UI per mostrare e dal
  comando per applicare. È INV-11 applicata al pagamento, ed è la stessa forma che `previewOf` ha
  già nel bancomat.
- **Il comando riceve il pool, mai il prezzo.** Un prezzo che arriva dalla UI è un prezzo che la UI
  può cambiare, e INV-19 diventerebbe una promessa invece di una proprietà.
- **`accepts` continua a essere l'ultima parola.** Il listino è ciò che il giocatore vede; il
  rifiuto del Ledger resta la rete sotto. Un listino che offre un pool non dichiarato in `accepts`
  è un difetto, e un test lo prova.
- **Nessun importo nasce dentro il dominio** (regola del progetto): i prezzi del listino vengono da
  `balance/`.

## Fuori scope

- **Il campo `heat` del listino.** Fetta 04. Additivo, e l'ADR 0027 dichiara perché aspettare non
  costa niente.
- **`convertibleTo`** ([ADR 0017](../adr/0017-il-denaro-e-plurale.md)). Con due pool il grafo è un
  arco solo e quell'arco è il bancomat. Grilletto: il terzo pool, le fiches del casinò.
- **La conversione automatica quando i fondi non bastano.** Decisa contro nell'ADR 0027: il gioco
  spiega e offre la via per il bancomat, non converte di nascosto.
- **Il selettore a due o più opzioni.** Di [D017](D017-il-caveau.md), che è dove nasce il primo
  caso.
- **Prezzi diversi per strumento su azioni esistenti.** L'upgrade resta a un prezzo, perché ha uno
  strumento. Il primo listino con due prezzi è quello del caveau.

## Definizione di fatto

- [ ] `npm run verify` verde, con l'**output incollato**
- [ ] `npm run verify:release` verde
- [ ] test: il listino dell'upgrade offre esattamente i pool che `accepts` dichiara — provato
      confrontando le due liste, non ricopiandole
- [ ] test: il prezzo mostrato e quello addebitato vengono dalla **stessa** funzione (INV-19),
      verificato per identità e non per uguaglianza — è la trappola che
      [D015](D015-home-bancomat.md) ha pagato alla correzione 14
- [ ] test: `buyUpgrade` con un pool **fuori** dal listino è rifiutato, e l'errore dice quali
      andavano bene
- [ ] test: con fondi insufficienti l'errore porta `pool`, `required` e `available`, e la UI li
      mostra tutti e tre — oggi ne mostra zero
- [ ] test di parità i18n verde: ogni chiave nuova esiste in italiano e in inglese
- [ ] ogni test nuovo è stato rotto di proposito almeno una volta
- [ ] verifica a mano: si compra l'upgrade, si vede **prima** con cosa si paga e quanto costa, e
      con la carta vuota il gioco dice cosa manca invece di non fare niente
- [ ] [ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) passa ad
      `Accettata`
- [ ] `docs/tracciabilita.md`: INV-19 ha la sua riga e il suo meccanismo
- [ ] la voce «con cosa si paga» esce dal [registro YAGNI](../roadmap-fette.md): non è più una cosa
      che manca

## Cosa lascia a D017

Da scrivere nella delega del caveau prima di eseguirla, perché ne cambia il budget:

- l'ampliamento nasce con un listino a **due** voci, contanti e carta, a prezzi diversi;
- il **selettore** vero — quello con più di un'opzione — è suo, e con esso la scelta di cosa fare
  quando il giocatore ha lo strumento ma non abbastanza;
- il bilanciamento delle due voci non ha ancora il calore, quindi la differenza di prezzo va tarata
  contro **la commissione del bancomat**: pagare con la carta conviene solo se lo sconto supera
  quanto costa portarci i contanti. È un compromesso vero e verificabile oggi, e la fetta 04 gli
  aggiungerà il calore senza smontarlo.

## Trappole note

- **`accepts` e il listino possono divergere in silenzio.** Sono due dichiarazioni della stessa
  cosa, e il giorno in cui una cambia senza l'altra il giocatore vede un'opzione che il Ledger
  rifiuta. Il listino deve **generare** il `TransactionMeta`, non affiancarlo — se il test del
  primo punto della definizione di fatto si scrive ricopiando le due liste, non prova niente.
- **Il listino di uno sembra inutile finché non lo si guarda dalla UI.** La tentazione è saltarlo e
  tenere `spend('card', ...)` finché non ci sono due opzioni. Costerebbe che l'upgrade continui a
  non dire con cosa si paga — che è l'informazione che l'ADR 0017 voleva dare fin dall'inizio — e
  che D017 lo debba convertire mentre fa altro.
- **L'errore ricco è metà lavoro nella UI, non nel dominio.** `insufficient_funds` porta già tutto
  il necessario da D007. Se questa delega finisce senza aver toccato un componente, ha costruito
  un contratto e non un'esperienza.
- **A17.** È una delega piccola che tocca un contratto condiviso, cioè la forma in cui la voglia di
  «già che ci sono» fa più danni. `heat`, `convertibleTo` e il selettore multiplo sono fuori scope
  per ragioni scritte: aggiungerli qui costa poche righe e toglie a chi verrà dopo il caso reale su
  cui provarli.
