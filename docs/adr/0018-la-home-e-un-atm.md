# ADR 0018 — La home è cruscotto **e** bancomat, con il bancomat al primo posto

- **Stato:** **Superata** da [ADR 0040](0040-il-bancomat-e-il-cruscotto-sono-due-pagine.md) —
  [D033](../delega/D033-il-bancomat-e-una-pagina.md): il bancomat e il cruscotto sono due pagine, e
  il tetto dei riquadri difende il cruscotto invece del bancomat. **La domanda di questo ADR non è
  cambiata**, e il 0040 la ricopia per intero: è la risposta a essere stata sostituita. Tutto il
  resto di ciò che sta scritto qui — la commissione prima della conferma, il rifiuto con un motivo,
  la carta come oggetto — **vale ancora**
- **Stato precedente:** **Accettata** — [D015](../delega/D015-home-bancomat.md): la home è le due
  zone in quest'ordine, la commissione si vede prima della conferma, e `tests/rules/home-tiles`
  conta i riquadri. Rivista il 2026-08-19 su decisione dell'utente
- **Data:** 2026-08-19
- **Origine:** preferenze [P3](../prodotto/preferenze.md#p3--prima-il-bancomat-poi-il-cruscotto) e [P5](../prodotto/preferenze.md#p5--la-carta-è-un-oggetto-3d-ruotabile)

## Contesto

La schermata principale di un idle finanziario tende per gravità a diventare un cruscotto: dieci
riquadri di statistiche, un grafico, e i pulsanti veri sepolti in una barra laterale. È la forma
che il progetto precedente aveva preso.

Un cruscotto **mostra**. Un bancomat **chiede**. Servono entrambi: le statistiche sono l'unica
ragione per riaprire un idle game, e il bancomat è il gesto che rende la dualità contanti/carta una
scelta invece che un'etichetta.

La domanda vera non è "quale delle due" ma **"come si impedisce al cruscotto di mangiarsi il
bancomat"**, che è quello che succede sempre — perché le statistiche crescono e il bancomat no.

## Decisione

La home ha **due zone, in quest'ordine verticale fisso**:

1. **Bancomat** — la carta 3D, il conto, i contanti con la capienza, deposita e preleva.
2. **Cruscotto** — poche statistiche vive.
3. Ultime operazioni, poche righe.

**Il vincolo che tiene:** il cruscotto della home ha un **massimo di sei riquadri**, deciso ora e
verificato da un test. Una statistica nuova non si aggiunge: **sostituisce** una esistente, oppure
va nella schermata Statistiche. Non è una linea guida — è un test che diventa rosso al settimo.

Il bancomat non si può ridurre, comprimere, né spostare sotto il cruscotto. È la prima cosa che si
vede all'apertura.

**La commissione si vede prima della conferma.** Un bancomat che ti dice quanto costa dopo aver
premuto è un bancomat scorretto, e questo gioco parla di soldi.

## Alternative scartate

- **Home a solo bancomat, statistiche in una schermata dedicata.** Era la proposta iniziale di
  questo ADR, scartata dall'utente. Motivo valido: in un idle game le statistiche _sono_ il
  contenuto, e nasconderle dietro un clic riduce la ragione per riaprire il gioco.
- **Home a solo cruscotto, bancomat in una schermata dedicata.** Seppellisce il gesto centrale
  sotto un livello di navigazione, e un gesto che costa un clic in più si fa meno. La dualità
  contanti/carta ([ADR 0017](0017-il-denaro-e-plurale.md)) diventerebbe una nota a piè di pagina.
- **Ibrida senza tetto sui riquadri.** È l'ibrida che sembra ovvia e che diventa un cruscotto entro
  tre iterazioni. La differenza fra questa e la decisione presa è **solo** il numero sei e il test
  che lo impone: senza quello, questo ADR sarebbe una buona intenzione, cioè esattamente il tipo di
  regola che il progetto precedente ha violato tredici volte.

## Conseguenze

- Serve la schermata **Statistiche** dal primo giorno, altrimenti il settimo riquadro non ha dove
  andare e il test diventa un ostacolo invece che una guida.
- `tests/rules/home-tiles.test.ts` conta i riquadri statistici nella vista home e fallisce oltre
  sei. Regola meccanizzata, non affidata alla review. Esiste da
  [D015](../delega/D015-home-bancomat.md), ed è **⚠️ parziale**: conta i tag e rifiuta un `v-for`
  su un riquadro, ma un `v-for` su un contenitore che ne avvolge uno le sfugge. Da D033 si chiama
  `tests/rules/board-tiles` e guarda `BoardView.vue`: stesso tetto, ragione riscritta.
- I riquadri sono **cinque**, non sei: il tetto è un tetto, non una quota, e i numeri vivi della
  fetta 01 sono cinque. Il sesto posto è libero, ed è la forma in cui questo ADR si mostra a chi
  arriverà con una statistica nuova.
- I sei riquadri sono una **scelta di design da rifare a ogni fetta**: quando arriva il black
  market, il calore probabilmente merita un posto — e qualcosa deve uscire. Il test costringe a
  quella conversazione invece di permettere di evitarla.
- Il deposito e il prelievo sono comandi che possono **fallire** — commissione superiore al saldo,
  capienza del caveau superata, importo non valido — e ogni fallimento ha un codice traducibile
  ([ADR 0007](0007-result-come-unico-stile-di-esito.md)).
- La carta 3D è presentazione pura: nessuna logica di dominio, nessun `Decimal` manipolato, quindi
  non intacca la regola R05.
- Il materiale della carta cambia con la progressione (standard → oro → nera): il progresso è
  visibile su un oggetto invece che su una barra. È un aggancio per il prestige, non una feature
  della fetta 01.
