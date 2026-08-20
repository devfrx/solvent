# ADR 0026 — La precisione del denaro è dichiarata, non ereditata

- **Stato:** Proposta — il meccanismo nasce con la prima delega che tocca `contracts/money.ts`
- **Data:** 2026-08-20

## Contesto

L'[ADR 0006](0006-decimal-end-to-end-per-il-denaro.md) ha scelto `Decimal` per il denaro. Non ha
mai scelto con **quante cifre**: quel numero è rimasto il valore predefinito di decimal.js, venti
cifre significative, che nessuno ha deciso e che nessun documento nomina.

Misurato il 2026-08-20 sulla libreria in uso:

| Precisione | I centesimi reggono fino a |
| ---------- | -------------------------- |
| 20 (oggi)  | **1e18 €**                 |
| 40         | 1e38 €                     |
| 80         | oltre 1e60 €               |

A venti cifre `new Decimal('1e18').plus('0.01')` vale `1e18`: il centesimo **non c'è più**.

Ne discende un guasto che non fa rumore. Il Ledger è a partita doppia
([ADR 0020](0020-partita-doppia.md)) e il suo invariante più profondo è INV-08 — la somma di tutti
i conti fa zero. Sopra 1e18 un accredito di un centesimo si perde da una parte e si registra
dall'altra, e **la somma smette di fare zero**. Nessun test se ne accorgerebbe: nessun test usa
numeri di quella taglia.

La [visione](../prodotto/visione.md) dichiara un bersaglio di scala di **~1e30 €**. Con il
predefinito di oggi, il gioco romperebbe il proprio invariante prima di arrivare al bersaglio che
si è dato.

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
  giocare, e il modo in cui il limite si manifesta — un invariante che smette di valere in
  silenzio — è il peggiore possibile.
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
- **Serve un test che lo imponga**, o la riga è una buona intenzione: un importo alla soglia più un
  centesimo deve valere un centesimo in più. È anche il test che documenta il limite, perché dice
  a quale numero smette di essere vero.
- **Va fatto prima che esista un salvataggio in mano a qualcuno.** Non perché i vecchi salvataggi
  diventerebbero illeggibili — il denaro attraversa il disco come stringa decimale (INV-04) e una
  stringa si rilegge a qualunque precisione — ma perché una partita giocata con due regole di
  arrotondamento diverse ha una contabilità che non torna, e non c'è modo di sapere dove.
- **Non risolve il tetto dello schermo**, che è più basso: `toDisplayNumber` passa da un `number`
  JS, esatto solo fino a 9.007.199.254.740.991. È un problema distinto, con il suo grilletto nel
  [registro YAGNI](../roadmap-fette.md).
