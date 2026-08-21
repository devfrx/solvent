# ADR 0039 — Una sovrapposizione passa dal kit

- **Stato:** **Accettata** — [D031](../delega/D031-la-sovrapposizione-e-un-pezzo-del-kit.md):
  `UiPopover` possiede il livello superiore, `UiTooltip` ci si appoggia sopra, il pannello dei cheat
  è il secondo utente vero. Più la regola **R22** con
  `tests/rules/overlays-pass-through-the-kit`, rotta di proposito
- **Data:** 2026-08-21
- **Origine:** un difetto vivo — il pannello dei cheat che non si chiudeva — e la sua causa, letta
  nella finestra vera durante [D032](../delega/D032-la-commissione-scala-il-pavimento-no.md)

## Contesto

L'[ADR 0032](0032-le-sovrapposizioni-stanno-nel-livello-superiore.md) aveva deciso **dove** vivono
le sovrapposizioni: nel livello superiore del motore, così che non le tagli un antenato con
`overflow`, non servano `z-index` (R21) e `Esc` le chiuda gratis. Non aveva deciso **chi** le
costruisce, e la risposta di fatto è stata «ogni componente per conto proprio».

Due componenti l'hanno fatto: `UiTooltip` ([D025](../delega/D025-il-tooltip.md)) e `DevPanel`
([D029](../delega/D029-i-devcheat.md)). Uno dei due era rotto.

**Il pannello dei cheat si apriva e non si chiudeva più.** Per due stesure la colpa è stata data
alla meccanica di apertura, che era giusta tutte e due le volte. La causa vera è una riga di CSS:

```css
.panel {
  display: flex;
}
```

Il foglio di stile del motore tiene chiuso un riquadro del livello superiore con `display: none`.
Una regola d'autore vince su quella del motore **a qualunque specificità**, perché arriva da
un'origine più forte della cascata. Ne discende che quel `display: flex`, scritto senza condizione,
teneva il pannello visibile per sempre: il motore chiudeva, e lo schermo non cambiava. Misurato
leggendo il documento nella finestra vera — `#dev-panel` era visibile e cliccabile mentre
`:popover-open` era **falso**.

**E qui sta la cosa che ha deciso questo ADR:** `UiTooltip` non aveva il difetto, e non perché
fosse scritto meglio. La sua bolla non scriveva `display` perché non le serviva — è una riga di
testo, non una colonna di contenuto. Due componenti, una riga di differenza, e quella differenza
non era una decisione di nessuno.

Una regola rispettata per fortuna è una regola che il prossimo componente rompe. E il prossimo
componente è annunciato: il canvas disegna menu contestuali e riquadri che si aprono sulle schede
dei domini, e ognuno di essi vorrà impilare del contenuto — cioè scrivere esattamente quella riga.

## Decisione

**La meccanica della sovrapposizione vive in `UiPopover`, e in nessun altro posto.**

`UiPopover` possiede ciò che è sbagliabile: l'attributo `popover`, il `display` **condizionato allo
stato aperto**, `inset: auto` per disfare il centraggio del motore, `anchor-name` con
`anchor-scope`, la collocazione dichiarativa con il ribaltamento, e le due guardie contro l'aprire
ciò che è già aperto.

**Non dipinge niente**, ed è deliberato: fondo, bordo, ombra e larghezza sono del contenuto. Una
bolla smorzata e stretta e un pannello di sviluppo tratteggiato non hanno una superficie in comune
da condividere, e darne una al pezzo del kit vorrebbe dire poi disfarla due volte — che è il modo
in cui un componente del kit comincia a crescere proprietà (ADR 0028).

**Chi apre sta in uno slot.** Il pulsante è del chiamante, e riceve `popovertarget` e `expanded`
per legarli a sé. Disegnarlo qui dentro trasformerebbe il pezzo in un contenitore, che l'
[ADR 0030](0030-il-telaio-e-una-forma-non-un-contenitore.md) rifiuta.

**Una proprietà sola decide la meccanica:** `on`, che vale `hover` o `press`. Non è una comodità —
le due strade sono opposte, e sceglierne una a mano è come nasce il difetto:

- **`press`** apre in modo **dichiarativo** (`popovertarget`), e il motore fa tutto, invocante
  compreso. Aprire e chiudere a mano da un `@click` non funziona: un riquadro si congeda da sé al
  clic fuori e il pulsante è fuori, quindi il motore chiude e il gestore riapre nello stesso clic.
- **`hover`** non ha un invocante che il motore riconosca, quindi `showPopover`/`hidePopover`
  servono davvero — con le due guardie, perché aprire un riquadro già aperto è un errore.

E ne discende una regola con un ID e un test:

- **R22** — l'attributo `popover` vive in `src/renderer/ui/UiPopover.vue` e in nessun altro `.vue`.
  `tests/rules/overlays-pass-through-the-kit` lo impone.

R22 non impedisce di scrivere male il CSS: impedisce di **avere in mano** l'elemento su cui quel
CSS farebbe danno. È la stessa mossa del Registry contro le cinque liste
([ADR 0002](0002-registry-unica-lista-di-sistemi.md)) — non si controlla che due cose coincidano,
si fa in modo che ce ne sia una sola.

`popovertarget` resta legittimo ovunque, ed è anzi la forma da incoraggiare: è ciò che un pulsante
mette **su di sé** per comandare un riquadro altrui.

## Conseguenze

**Il difetto è chiuso, e la prova è una misura.** Nella finestra vera, via CDP: primo clic apre
(`display: flex`, riquadro 300×502), secondo clic chiude (`display: none`, 0×0), `Esc` chiude
lasciando il fuoco sul pulsante, e il tabulatore più `Invio` o `Spazio` fanno lo stesso.

**Il pannello adesso è ancorato davvero.** Prima si collocava con `right` e `bottom` scritti a
mano, cioè ripetendo la posizione del proprio pulsante; adesso l'ancoraggio CSS lo mette 6 px sopra
di lui, e il pulsante è l'unico a sapere dove sta. Ne discende una riga spostata che vale la pena
dire: `position: fixed` è passato dal pulsante all'**ancora**. Con `fixed` sul pulsante l'ancora
resterebbe un rettangolo vuoto in mezzo alla pagina, e il riquadro si aprirebbe lì.

**`UiTooltip` si è accorciato di due terzi**, e la misura interessante non è quella: le righe
andate via sono le stesse che il pannello aveva riscritto per conto proprio, sbagliandone una.

**R17 non cambia nome.** «Se c'è una spiegazione, è `UiTooltip`» resta vero: il tooltip continua a
esistere come componente, e ciò che ha perso è la meccanica, non il ruolo. Era la domanda aperta
nell'intestazione di D031, e la risposta è che non serviva rileggerla.

**`useId` entra nel progetto**, ed è la prima volta. L'aggancio dichiarativo vuole un `id` e due
istanze in pagina non possono averlo uguale; generarlo a mano vorrebbe dire un contatore di modulo,
cioè stato globale dentro un pezzo del kit.

## Alternative scartate

**Correggere la riga e basta.** `.panel:popover-open { display: flex }` chiudeva il difetto in
trenta secondi. Non chiudeva la **classe**: il prossimo componente che impila del contenuto dentro
una sovrapposizione riscrive la riga sbagliata in perfetta buona fede, ed è successo una volta
proprio così. Il costo di questo ADR è la differenza fra correggere un caso e togliere la
possibilità.

**Due pezzi affiancati, `UiTooltip` e `UiPopover`.** Nessun rischio su ciò che funzionava, e le due
cose sono davvero diverse — un tooltip si apre passandoci sopra e non prende il fuoco, un pannello
si apre premendo. Ma la duplicazione della meccanica è **esattamente** ciò che ha prodotto il
difetto: se restano due, fra sei mesi sono quattro.

**Un `UiMenu` sopra a `UiPopover`.** Un menu è un riquadro più una lista di voci con la navigazione
da tastiera e i ruoli ARIA giusti, e il canvas ne disegna uno. Ma **non ha ancora due chiamanti**:
il pannello dei cheat è un elenco di pulsanti, non un menu, e il menu contestuale del canvas non ha
una riga di codice. La regola di ammissione al kit ([D023](../delega/D023-il-design-system.md)) è
«due componenti lo disegnano», e `UiMenu` ne avrebbe zero: costruirlo adesso sarebbe l'astrazione
speculativa che l'[ADR 0014](0014-una-fetta-verticale-alla-volta.md) vieta. Il grilletto è scritto:
il primo menu vero.

**Una proprietà di larghezza sul pezzo del kit.** Sarebbe stata la strada comoda per far stare
dentro sia una bolla da 34 caratteri sia una colonna da 300 px. È geometria per proprietà, che R16
vieta — e la ragione è che nascono con due proprietà e ne hanno dodici dopo tre schermate
(ADR 0028). Non dipingere niente risolve lo stesso problema senza aprire quella porta.
