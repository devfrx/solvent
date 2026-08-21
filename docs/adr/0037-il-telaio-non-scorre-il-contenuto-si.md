# ADR 0037 — Il telaio non scorre, il contenuto sì

- **Stato:** **Accettata** — [D030](../delega/D030-il-contenuto-scorre-nel-telaio.md): `UiShell.vue`
  alto quanto la finestra, la testata ferma, `.content` come unica area che scorre. Più la regola
  **R21** con `tests/rules/no-z-index`, rotta di proposito. La correzione è **misurata**, non
  guardata: vedi _Conseguenze_
- **Data:** 2026-08-21

## Contesto

Fino a [D024](../delega/D024-il-telaio.md) il telaio scorreva come una pagina web: il documento
intero scorreva, e la testata restava in cima con `position: sticky`. È la forma consueta, funziona,
e `UiShell` dichiarava perfino perché non serviva un `z-index` — la testata è posizionata e il
contenuto no, quindi dipinge dopo per la regola di impilamento del CSS.

Quella dichiarazione aveva una crepa, e il commento la nominava senza riconoscerla: _«il giorno in
cui un discendente del contenuto si posiziona e passa sopra la testata…»_. Quel giorno era già
arrivato. La carta 3D del bancomat ha una `perspective`, e `perspective` — come `transform`, come un
filtro — crea un **contesto di impilamento**. Un elemento così, pur non essendo posizionato, dipinge
nello stesso strato della testata; a decidere chi vince è l'ordine nel documento, e il contenuto
viene dopo. Quindi la carta passava sopra la testata a ogni scorrimento.

La risposta consueta è un `z-index` sulla testata. Sarebbe **una riga**, e il mockup del progetto la
usa (`z-index: 20`). Ha però due problemi che non si vedono il giorno in cui la si scrive:

- **Un numero solo non esiste.** Un `z-index` ha senso solo rispetto agli altri, quindi il secondo
  va scelto rileggendo il primo, il quarto rileggendo tre. È la forma con cui, nel progetto
  precedente, il CSS ha smesso di essere leggibile — e l'[ADR 0032](0032-le-sovrapposizioni-stanno-nel-livello-superiore.md)
  l'aveva già scartata, dichiarando che _«la prima riga di `z-index` scritta in `ui/` sarà il
  segnale che qualcuno ha aggirato questa decisione»_.
- **Non risolve la classe, risolve il caso.** Il prossimo elemento con una `transform` dentro il
  contenuto — un grafico, un pannello che si apre, un'animazione — riporterà la stessa domanda.

C'è una terza cosa, ed è quella che ha deciso: **un'applicazione da scrivania non scorre come una
pagina.** Il telaio sta fermo e a scorrere è la regione del contenuto. Non è una preferenza di
stile: è la ragione per cui in quelle applicazioni la barra di scorrimento non attraversa mai la
testata, e per cui la testata non "rimbalza" al fondo dell'elenco.

## Decisione

**Il telaio è alto quanto la finestra e non scorre. L'unica regione che scorre è il contenuto,
dentro la propria area.**

- `.ui-shell` ha `height: 100vh` e `overflow: hidden` — la pagina non ha più niente da scorrere.
- `.nav` e `.head` stanno ferme perché sotto di loro non si muove nulla: `position: sticky` sparisce
  da entrambe, non perché fosse sbagliata ma perché non ha più nulla da cui restare indietro.
- `.content` è `flex: 1; min-height: 0; overflow-y: auto`.

Ne discende la correzione, e discende **per costruzione**: un contenuto che scorre dentro la propria
area non può raggiungere la testata, perché il bordo dell'area lo taglia prima. Non è che la testata
vince la gara di impilamento — è che **la gara non c'è**.

E ne discende una regola con un ID e un test, che è l'ADR 0032 che smette di essere prosa:

- **R21** — nessun `z-index` in tutto `src/`, `.ts`, `.vue` e `.css` compresi.
  `tests/rules/no-z-index` lo impone.

R21 non è un dogma: è un modo di obbligare alla domanda giusta. Quando due cose si contendono lo
stesso spazio, la risposta è **perché**, non _quale numero_. Finora la risposta è stata due volte
diversa e nessuna volta un numero: ciò che deve stare sopra tutto va nel livello superiore
(ADR 0032), e ciò che non deve uscire dalla propria regione scorre dentro di essa (questo ADR).

## Alternative scartate

- **`z-index` sulla testata.** Una riga, ed è quella che il mockup usa. Il mockup è l'autorità su
  **come si vede** una schermata, non su come è fatto il telaio: è un prototipo scritto con gli
  stili in linea, e [docs/design/mockups/README.md](../design/mockups/README.md) dice già che se ne
  prende un pezzo per volta. Scartata perché risolve il caso e non la classe, e perché apre la scala
  di numeri che l'ADR 0032 ha chiuso.
- **Togliere la `perspective` alla carta.** Renderebbe la carta 2D, cioè toglierebbe l'unico oggetto
  che il giocatore possiede davvero (P5). E non risolverebbe niente: la prossima `transform` nel
  contenuto riaprirebbe la stessa domanda.
- **`isolation: isolate` sul contenuto.** È la risposta che sembra giusta a chi conosce la regola di
  impilamento, e non funziona: crea un contesto sul contenuto, ma quel contesto dipinge **ancora**
  nello stesso strato della testata e ancora dopo di lei nell'ordine del documento. Sposta il
  problema di un livello senza cambiarne l'esito.
- **Spostare la testata dopo il contenuto nel documento**, per vincere l'ordine. Funzionerebbe e
  romperebbe la lettura del documento per uno screen reader, che segue l'ordine vero. Barattare
  l'accessibilità con l'impilamento è il tipo di scambio che non si dichiara mai e si paga sempre.

## Conseguenze

- **La correzione è misurata, non guardata**, ed è il metodo che il progetto si è dato: nel punto
  esatto appena sopra il bordo inferiore della testata, con la carta scorsa fin sotto,
  `document.elementFromPoint` risponde `strip` — cioè la testata. Con il modello di prima rimesso
  **dal vivo** nella stessa pagina, lo stesso punto risponde `DD`, cioè un elemento della carta. Il
  difetto si riproduce e sparisce a comando.
- **La barra di scorrimento vive dentro l'area del contenuto**, non lungo tutta la finestra. È la
  differenza che si vede senza saperla nominare, ed è quella che fa sembrare un'applicazione
  un'applicazione.
- **`.nav` ha `overflow-y: auto`.** Le destinazioni sono quattro e ci stanno; con un telaio a
  altezza fissa, il giorno in cui fossero venti la colonna le taglierebbe **in silenzio**. Una riga
  contro una classe di difetto che nasce funzionante.
- **`min-height: 0` su `.content` è obbligatorio**, e sembra superfluo: un elemento flessibile non
  scende sotto la propria dimensione naturale finché non gliela si toglie, quindi senza quella riga
  il contenuto **spinge** invece di scorrere e `overflow-y` non interviene mai.
- **Un limite, dichiarato:** R21 guarda il sorgente di `src/`, quindi non vede il CSS che una
  libreria porta con sé — ApexCharts ne scrive del proprio. È la stessa classe di buco per cui R17
  si è incrinata ([ADR 0034](0034-il-grafico-e-una-libreria.md)). Una regola che vale sul codice
  nostro resta una regola: dice dove **noi** non possiamo andare.
- **Una domanda che questo ADR non apre:** se un giorno servisse una testata che si nasconde
  scorrendo, o un contenuto a due colonne che scorrono separatamente, la forma è già quella giusta —
  si aggiunge una regione, non si cambia modello.
