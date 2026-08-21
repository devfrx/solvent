# ADR 0026 — La precisione del denaro è dichiarata, non ereditata

- **Stato:** **Accettata** — [D032](../delega/D032-la-commissione-scala-il-pavimento-no.md) è la
  delega che tocca `contracts/money.ts`, cioè il grilletto che questo ADR aspettava: la commissione
  in percentuale ha chiesto un arrotondamento, e un arrotondamento vive accanto alla primitiva.
  `precision: 40` è dichiarata, e i **due** test che questa decisione richiedeva ci sono
  entrambi — vedi _Conseguenze_, dove le due soglie sono adesso misure e non previsioni.
  _Contesto_ e _Conseguenze_ erano già stati **rimisurati** il 2026-08-20 da
  [D021](../delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md) (AUD-009): la decisione non
  cambia, l'evidenza che la motivava sì
- **Data:** 2026-08-20

## Contesto

L'[ADR 0006](0006-decimal-end-to-end-per-il-denaro.md) ha scelto `Decimal` per il denaro. Non ha
mai scelto con **quante cifre**: quel numero è rimasto il valore predefinito di decimal.js, venti
cifre significative, che nessuno ha deciso e che nessun documento nomina.

Rimisurato il 2026-08-20 sulla libreria in uso, e i numeri della prima stesura erano sbagliati di
un ordine di grandezza. La regola vera è che i centesimi reggono fino a `1e(precisione − 3)`:

| Precisione | I centesimi reggono fino a | `transfer()` smette di bilanciare da |
| ---------- | -------------------------- | ------------------------------------ |
| 20 (oggi)  | **1e17 €**                 | **1e20 €**                           |
| 40         | 1e37 €                     | 1e40 €                               |
| 80         | 1e77 €                     | 1e80 €                               |

A venti cifre `new Decimal('1e18').plus('0.01')` vale `1e18`: a quella taglia il centesimo **non
c'è già più**, e la prima stesura di questo ADR scriveva la stessa frase mentre la tabella accanto
dichiarava 1e18 come soglia ancora buona.

**Il guasto non è quello che questo documento diceva**, ed è la correzione che conta. La prima
stesura sosteneva che sopra la soglia «la somma dei conti smette di fare zero in silenzio», cioè
INV-08 rotta. **Non è riproducibile**, e c'è una ragione strutturale: i costruttori del Ledger
producono movimenti che sono specchi esatti — `income` scrive `value` e `value.neg()` — quindi
l'arrotondamento cade dalle due parti allo stesso modo. Provato a 1e20 e a 1e25, con i due pool a
taglie diverse, la somma resta esattamente zero.

Il guasto **riproducibile** è un altro, arriva più tardi ed è più rumoroso: da `1e20` in su i tre
movimenti di `transfer()` non sommano più a zero, perché `value.minus(fee)` arrotonda. Il Ledger se
ne accorge e **lancia** `UnbalancedTransactionError` — che per costruzione significa «il programma
è scritto male, c'è una riga da correggere». Qui invece non c'è nessuna riga sbagliata: c'è un
giocatore che ha premuto «Deposita» con un saldo grande, e riceve un'eccezione al posto di un
`Result`.

Ne discende che il rischio è **un crollo**, non una deriva silenziosa. È meno insidioso e più
grave, e cambia cosa deve provare il test che questa decisione richiede.

La [visione](../prodotto/visione.md) dichiara un bersaglio di scala di **~1e30 €**. Con il
predefinito di oggi il gioco si romperebbe a 1e20, cioè **dieci ordini di grandezza prima** del
bersaglio che si è dato — e prima ancora, da 1e18, mostrerebbe importi in cui i centesimi non ci
sono più.

## Decisione

**La precisione di `Decimal` si dichiara**, e si dichiara in `src/core/contracts/money.ts`, accanto
al tipo che protegge: è già l'unico file di confine del denaro (ADR 0006), e un valore di
configurazione lontano da ciò che governa è un valore che nessuno rilegge.

Il valore è **40 cifre**, cioè otto ordini di grandezza di margine sopra il bersaglio dichiarato.
Non è un numero scelto per abbondanza: è scelto perché il bersaglio esiste ed è scritto.

La configurazione va applicata **prima che esista un solo `Decimal`**, altrimenti vale per alcuni
valori e non per altri — che è peggio di non applicarla.

## Alternative scartate

- **Lasciare il predefinito.** È l'opzione in vigore oggi, e il problema non è il numero: è che
  nessuno l'ha scelto. Una libreria ha deciso al posto del progetto quanto in grande si può
  giocare, e il limite si manifesta come un'eccezione non gestita in faccia al giocatore, dieci
  ordini di grandezza prima del bersaglio dichiarato.
- **Ottanta cifre o più.** Non costa niente di misurabile, ma dichiara che il bersaglio non si
  conosce. Un margine senza un bersaglio davanti non è prudenza: è l'assenza di una decisione con
  l'aria di una decisione.
- **Arrotondare ogni importo ai centesimi.** Terrebbe l'esattezza a qualunque taglia, ma
  aggiungerebbe una regola di arrotondamento a ogni operazione — e in un sistema a partita doppia
  l'arrotondamento è esattamente il punto in cui il denaro si crea o si distrugge. Si sposterebbe
  il guasto invece di toglierlo.
- **Interi in centesimi con `bigint`.** Già scartata dall'ADR 0006, e per le stesse ragioni: un
  idle vive di moltiplicatori frazionari.

## Conseguenze

- **Il cambiamento va misurato, non assunto.** `precision` governa anche l'arrotondamento delle
  divisioni, quindi qualche test sul denaro può cambiare risultato. Si misura come ha fatto la
  preparazione di [D017](../delega/D017-il-caveau.md): si scrive la riga, si esegue la suite, e si
  legge cosa diventa rosso prima di aggiustarlo.
- **Servono due test, non uno.** Il primo impone la precisione: un importo alla soglia più un
  centesimo vale un centesimo in più, e dice a quale numero smette di essere vero. Il secondo copre
  il guasto vero: `transfer()` a `1e(precisione)` non deve lanciare. Scrivere solo il primo
  lascerebbe scoperto proprio il caso che manda in crollo il gioco — ed è ciò che sarebbe successo
  con l'evidenza scritta nella prima stesura di questo ADR.
- **Va fatto prima che esista un salvataggio in mano a qualcuno.** Non perché i vecchi salvataggi
  diventerebbero illeggibili — il denaro attraversa il disco come stringa decimale (INV-04) e una
  stringa si rilegge a qualunque precisione — ma perché una partita giocata con due regole di
  arrotondamento diverse ha una contabilità che non torna, e non c'è modo di sapere dove.
- **Non risolve il tetto dello schermo**, che è più basso: `toDisplayNumber` passa da un `number`
  JS, esatto solo fino a 9.007.199.254.740.991. È un problema distinto, con il suo grilletto nel
  [registro YAGNI](../roadmap-fette.md).

### Cosa la misura ha detto, eseguendola (2026-08-21, D032)

**Le due soglie previste erano esatte**, e adesso sono in `tests/contracts/money`:

|                                      | Previsto | Misurato                                           |
| ------------------------------------ | -------- | -------------------------------------------------- |
| Il centesimo esiste fino a           | 1e37 €   | **1e37 €** — a 1e38 sommarlo non cambia più niente |
| `transfer()` smette di bilanciare da | 1e40 €   | **1e40 €** — a 1e39 la somma è ancora zero esatto  |

**Alzare la precisione non ha reso rosso nessun test esistente.** Era la conseguenza più temuta —
_«`precision` governa anche l'arrotondamento delle divisioni, quindi qualche test sul denaro può
cambiare risultato»_ — e il modo di saperlo era scrivere la riga ed eseguire la suite, come ha
fatto la preparazione di [D017](../delega/D017-il-caveau.md). Ottocento test, nessuno spostato:
le divisioni che il progetto fa oggi non arrivano a una ventesima cifra significativa.

Il costo di aritmetica più larga non è stato misurato, e non è stato misurato di proposito: la
catena dei gate non è rallentata in modo percepibile, e un profilo per un numero che non si vede
sarebbe ottimizzazione senza un problema.
