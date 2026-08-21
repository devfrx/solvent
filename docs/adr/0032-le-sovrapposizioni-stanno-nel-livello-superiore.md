# ADR 0032 — Le sovrapposizioni stanno nel livello superiore, e non hanno una libreria

- **Stato:** **Accettata** — [D025](../delega/D025-il-tooltip.md): `src/renderer/ui/UiTooltip.vue`,
  nel livello superiore e senza una riga di `z-index`, e la regola **R17**, rotta di proposito con un
  `title="Solvent"` rimesso su `AppNav`. Il presupposto — un motore solo e recente — è stato chiesto
  al motore: Electron 43.4.1, Chromium 150.0.7871.224, in [qualita.md](../qualita.md) con la data
- **Data:** 2026-08-21

## Contesto

Il [registro YAGNI](../roadmap-fette.md) tiene in serbo «il sistema di sovrapposizioni» con un
grilletto preciso: _la prima cosa che deve stare **sopra** il resto invece che dentro il flusso_. Il
tooltip è quella cosa, quindi il grilletto è scattato.

Sovrapporre qualcosa è un problema con tre metà, e ognuna ha il proprio modo di andare storta:

- **Il ritaglio.** Un elemento posizionato dentro il flusso viene tagliato dal primo antenato con
  `overflow: hidden`. Ne esiste già uno nel progetto — la barra della capienza in `CashPanel` — e ne
  esisteranno altri: è la classe di difetto che nasce funzionante e si rompe quando qualcuno, mesi
  dopo, aggiunge un `overflow` per un motivo diverso.
- **L'impilamento.** La risposta consueta è una scala di `z-index`, cioè una serie di numeri di cui
  nessuno sa più dire perché il quarto è più alto del terzo. Nel progetto precedente questa è la
  forma con cui il CSS smette di essere leggibile.
- **La collocazione.** Un riquadro vicino al bordo dello schermo deve ribaltarsi dall'altra parte, e
  calcolarlo a mano vuol dire misurare, ascoltare lo scorrimento e il ridimensionamento, e sbagliare.

La risposta standard dell'ecosistema è una libreria di posizionamento. Sarebbe una dipendenza di
runtime nuova, quindi passa dall'[ADR 0015](0015-criterio-di-ammissione-delle-dipendenze.md), il cui
criterio è: entra ciò che fa una cosa che non sappiamo fare, o che faremmo male.

Il motore qui è **uno solo ed è Chromium** — non è un sito, è un'applicazione Electron — e Chromium
oggi fa tutte e tre le metà da sé:

- il **livello superiore**, con l'attributo `popover`: fuori dal flusso, quindi niente ritaglio, e
  sopra tutto senza `z-index`, perché il livello superiore non partecipa all'impilamento
- l'**ancoraggio CSS**, con `anchor-name` e `position-anchor`: il riquadro si posiziona rispetto a
  chi lo apre, senza una riga di JavaScript che misuri qualcosa
- i **ripieghi dichiarati**, con `position-try-fallbacks`: «sopra, e se non ci sta sotto» è una
  proprietà, non un calcolo

## Decisione

Le sovrapposizioni di questo progetto stanno nel **livello superiore nativo** e si collocano con
l'**ancoraggio CSS**. Nessuna libreria di posizionamento, nessuna scala di `z-index`, nessun
`Teleport`.

Il primo esemplare è `UiTooltip`, e nasce nel kit perché una sovrapposizione non sa che gioco è
(R14): riceve il testo già tradotto, come ogni altro pezzo.

Ne discende una regola con un ID e un test:

- **R17** — nessun tooltip nativo. L'attributo `title` non compare in nessun `.vue` di `src/`:
  se c'è una spiegazione, è `UiTooltip`. `tests/rules/no-native-tooltips` lo impone.

R17 è la metà che rende vera la parola «ovunque». Senza, `UiTooltip` sarebbe **un** modo di fare un
tooltip accanto a quello gratis del browser, e il gratis vince sempre — nello stile del browser, con
il ritardo del browser, invisibile a chi tocca lo schermo invece di puntarlo.

## Alternative scartate

- **Una libreria di posizionamento.** Fa bene un lavoro che il motore fa già, e lo fa perché deve
  reggere motori che qui non esistono. È lo stesso argomento dell'[ADR 0029](0029-due-caratteri-e-stanno-nel-bundle.md)
  sul formato `woff`: portarsi dietro la compatibilità con ciò che non c'è è peso morto, e il peso
  morto non fa rumore.
- **L'attributo `title` del browser.** Costa zero e risolve il problema per finta: non si può
  vestire, appare dopo circa un secondo, sparisce da solo, non si vede col tocco e non si raggiunge
  con la tastiera. Sarebbe anche l'unico pezzo di interfaccia del progetto che non passa dal design
  system. È ciò che R17 vieta.
- **Un riquadro posizionato dentro il flusso, mostrato con `:hover`.** Zero JavaScript, ed è
  allettante. Cade sul ritaglio: il primo antenato con `overflow: hidden` lo taglia a metà, e il
  giorno in cui succede non è il giorno in cui è stato scritto.
- **`<Teleport>` di Vue verso il `body`.** Toglie il ritaglio e lascia l'impilamento: servirebbe
  comunque una scala di `z-index`, e servirebbe comunque calcolare la posizione a mano, perché
  l'elemento non è più vicino a chi lo apre. Risolve un terzo del problema e ne complica un altro.

## Conseguenze

- Nessuna dipendenza nuova: l'ADR 0015 non viene interrogato.
- `z-index` non entra nei token, e non entrerà: il livello superiore non ne ha bisogno. La prima
  riga di `z-index` scritta in `ui/` sarà il segnale che qualcuno ha aggirato questa decisione.
- Il tooltip si apre **anche col fuoco della tastiera**, non solo col puntatore, e `Esc` lo chiude:
  la prima cosa gliela dà il componente, la seconda gliela regala il livello superiore.
- **Un limite, dichiarato:** il riquadro si àncora al proprio contenitore, che è una scatola in
  linea. Un tooltip è per una cosa che si **legge** — un'etichetta, una cifra, una targhetta — non
  per una regione della pagina. Chi volesse spiegare una regione sta cercando un'altra cosa, e
  quell'altra cosa non esiste ancora.
- **Un secondo limite, dichiarato:** questa decisione vale perché il motore è uno e lo controlliamo
  noi. Il giorno in cui questo renderer dovesse girare altrove, cade — e cadrebbe rumorosamente,
  perché senza ancoraggio il riquadro finisce nell'angolo, non scompare in silenzio.
