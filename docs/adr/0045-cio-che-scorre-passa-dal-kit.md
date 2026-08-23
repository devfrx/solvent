# ADR 0045 — Ciò che scorre passa dal kit

- **Stato:** **Accettata** — [D038](../delega/D038-cio-che-si-preme-e-cio-che-scorre.md):
  `src/renderer/ui/UiScroll.vue` è l'unica area che scorre di `src/` e l'unico posto in cui la barra
  ha un colore, e la regola **R27** con `tests/rules/scroll-passes-through-the-kit` la impone.
  Rotta di proposito: un `overflow-y: auto` rimesso in `AppNav.vue`, e uno `scrollbar-color` in
  `tokens.css`
- **Data:** 2026-08-23

## Contesto

Prima di questa delega le aree che scorrevano erano **sei**, in cinque file: le due regioni del
telaio, il contenuto della finestra modale, la striscia degli strumenti nella testata, la lista
delle destinazioni nella colonna, il riquadro dei cheat. La barra di scorrimento non era vestita da
nessuna parte: era quella del sistema operativo, in un'applicazione che di temi ne ha due scritti a
mano ([ADR 0028](0028-il-kit-ui-non-sa-che-gioco-e.md)).

Il vestito però non è la ragione di questo documento — è la parte che si vede. La ragione è
`min-height: 0`.

`UiShell` lo scriveva, e spiegava perché: «un elemento flessibile non scende sotto la propria
dimensione naturale se non gliela si toglie, quindi senza di lei un contenuto lungo **spinge**
invece di scorrere». `AppNav` no. Ne discendeva che la sua `overflow-y: auto` non interveniva mai, e
a scorrere finiva la colonna intera del telaio — marchio in alto e interruttore del tema in basso
compresi — invece della sola lista delle destinazioni.

**Due aree che scorrono, scritte da due file, e una delle due sbagliata in un modo che nessun gate
poteva vedere.** È la forma di `.refusal` ([D016](../delega/D016-correzioni-audit.md)) e del vestito
dei grafici (**R23**, [ADR 0034](0034-il-grafico-e-una-libreria.md)), applicata a una proprietà che
non si nota finché non si allunga un elenco.

## Decisione

**Un'area sola, ed è del kit.** `UiScroll` possiede tre cose e nient'altro:

1. `overflow: auto`, e con esso il `min-height: 0` e il `min-width: 0` senza cui non interviene.
2. Il **vestito della barra**, con le proprietà standard: `scrollbar-width: thin` e uno
   `scrollbar-color` derivato da `--color-ink-3`, con il binario trasparente e il pollice che si
   scurisce al puntatore.
3. `overscroll-behavior: contain`, perché due aree annidate senza quella riga si passano la rotella.

**Non ha proprietà**, come `UiShell`, e per la stessa ragione dell'[ADR 0030](0030-il-telaio-e-una-forma-non-un-contenitore.md):
non c'è niente da parametrizzare perché non c'è niente che vari. Nemmeno l'asse — quando un asse è
`auto` l'altro smette di essere `visible` e diventa `auto` da sé, per come è scritta la cascata: le
sei aree si comportavano già così, comprese le quattro che dichiaravano un asse solo. Una proprietà
`axis` avrebbe descritto una differenza che non esiste.

**Non dipinge e non si colloca**: fondo, bordo, spazio interno, disposizione dei figli e posto nel
telaio restano di chi chiama, che li scrive nel proprio CSS scoped sulla radice del componente. È il
patto di `UiPopover` e la strada che `DevPanel.corner` percorre già.

Ne discende una regola con un ID e un test:

- **R27** — nessun file di `src/renderer/` scrive un `overflow` che **scorre** (`auto`, `scroll`,
  `overlay`) né una proprietà `scrollbar-*`, tranne `UiScroll.vue`. `overflow: hidden` e
  `overflow: visible` passano: il primo ritaglia, il secondo disfà un default, e nessuno dei due fa
  scorrere niente.

### Le due cose decise guardando, non ragionando

**`scrollbar-gutter: stable` è stato scritto e tolto.** Riserva lo spazio della barra anche quando
la barra non c'è, quindi il contenuto non salta il primo tick in cui la pagina supera il fondo — e
sembra il difetto giusto da chiudere. Il prezzo si è misurato nella finestra vera: nell'area del
contenuto lo spazio a sinistra restava **24 px** e quello a destra diventava **34 px**, e nella
colonna le due aree annidate ne riservavano una ciascuna, **21 px** contro gli 8 del disegno. Dieci
pixel sono `--space-4`: in una scala che arriva a 24 è un passo intero di asimmetria, permanente,
contro un salto che capita solo quando un'area attraversa la propria soglia.

**Le frecce alle estremità restano quelle di Windows.** Le proprietà standard dicono di che colore è
la barra, non di quali pezzi è fatta; toglierle vorrebbe dire passare ai pseudo-elementi
`::-webkit-scrollbar`, che il motore **ignora** appena una proprietà standard è dichiarata — è un
aut aut, non una somma. Restano perché è la stessa scelta che
[D036](../delega/D036-il-pagamento-e-un-flusso-solo.md) ha già fatto per il pallino della scelta nel
pagamento: **il congegno è del motore, il colore è del tema.** Le frecce prendono l'inchiostro del
pollice come il resto della barra.

## Alternative scartate

- **Vestire la barra una volta sola su `:root`.** `scrollbar-width` e `scrollbar-color` sono
  ereditate, quindi due righe in `tokens.css` avrebbero vestito ogni area presente e futura senza un
  componente e senza una migrazione. È la soluzione più corta, ed è quella che risolve il problema
  sbagliato: il difetto non era il colore, era `min-height: 0` scritto in un file e dimenticato
  nell'altro. Un token non porta con sé una riga di geometria.
- **Una classe globale in `tokens.css`.** Già scartata dall'ADR 0030 per il telaio, con una ragione
  che vale identica qui: «una classe non si può verificare, non si può richiedere e non si può
  rifiutare».
- **I pseudo-elementi `::-webkit-scrollbar`.** Danno il controllo completo — larghezza, pollice
  arrotondato, frecce spente — e in un'applicazione Electron il motore è uno solo, quindi il prezzo
  consueto della non-portabilità qui non si paga. Restano fuori per la ragione scritta sopra: questo
  progetto ha scelto tre volte il congegno del motore invece di riscriverlo — `<dialog>`, `popover`,
  l'ancoraggio CSS — e una volta ha scelto di ricolorare il congegno invece di sostituirlo. Sono
  quattro precedenti nella stessa direzione.
- **Un `UiScroll` con una proprietà `axis`.** Vedi sopra: descriverebbe una differenza che la
  cascata non fa.

## Conseguenze

- La lista delle destinazioni scorre **da sola**, e marchio e interruttore del tema restano fermi.
  Non è una funzionalità nuova: è ciò che il disegno voleva già, e che mancava per una riga.
- Il telaio guadagna un elemento per regione — `.nav-scroll` dentro l'`<aside>` — e il costo è
  zero: una barra occupa spazio solo quando c'è, e quella di fuori non scorre mai.
- Un'area nuova che scorre non può nascere senza `min-height: 0`, perché non può nascere fuori da
  `UiScroll`.
- Il vestito della libreria di grafici (**R23**) e questo non si sovrappongono: quello nomina classi
  di qualcun altro nel DOM, questo dichiara proprietà standard su un elemento nostro.
- `UiShell` e `UiDialog` smettono di possedere lo scorrimento e restano quello che erano: la
  geometria delle tre regioni e la meccanica della finestra modale.
