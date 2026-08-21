# D031 — La sovrapposizione è un pezzo del kit

- **Stato:** Chiusa — commit `d9863d6`, ramo `d031-la-sovrapposizione-e-un-pezzo-del-kit`, che parte da
  [D032](D032-la-commissione-scala-il-pavimento-no.md) e non da `d030` come diceva: D032 ha chiuso
  prima, e le due non si toccano. Scritta il 2026-08-21, eseguita lo stesso giorno
- **Dipende da:** [D025](D025-il-tooltip.md), che ha portato la prima sovrapposizione, e
  [D029](D029-i-devcheat.md), che ha portato la seconda e ne ha rotta una
- **Sblocca:** niente, ed è una correzione. Diceva «D032, la rifinitura del bancomat»: quella è
  diventata [D033](D033-il-bancomat-e-una-pagina.md), e la sua pagina `ATM` del canvas — letta nel
  sorgente — **non ha una sola sovrapposizione**. Le due deleghe sono indipendenti. Resta vero il
  perché generale: il canvas disegna menu e riquadri sovrapposti in quasi ogni **altra** schermata,
  e costruirli uno per volta dentro le pagine è il modo in cui il kit smette di esistere
- **ADR vincolanti:** [0032](../adr/0032-le-sovrapposizioni-stanno-nel-livello-superiore.md) (dove
  vivono le sovrapposizioni), [0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md) (il kit non sa
  che gioco è), [0030](../adr/0030-il-telaio-e-una-forma-non-un-contenitore.md) (una forma non è un
  contenitore), [0037](../adr/0037-il-telaio-non-scorre-il-contenuto-si.md) (R21, nessun
  `z-index`)
- **Produce:** ADR [0039](../adr/0039-una-sovrapposizione-passa-dal-kit.md) e la regola **R22**
- **Regole:** R14, R16, R17 e R21 valgono tutte. Se il pezzo nuovo prende il posto di
  `UiTooltip`, R17 va riletta: dice «se c'è una spiegazione, è `UiTooltip`», e quel nome potrebbe
  cambiare
- **Budget:** non stimato in partenza, come la delega chiedeva. Misurato a fine lavoro: **96 righe**
  nel pezzo nuovo e **34** nella regola. `UiTooltip` ne ha **perse 37** (da 73 a 36) e `DevPanel`
  una sola (da 122 a 121) — che è il numero più interessante dei quattro: vedi _Correzioni_, punto 3

## Obiettivo

Fare della sovrapposizione — riquadro nel livello superiore, ancorato a chi lo apre — **un pezzo
del kit**, invece di una cosa che ogni componente si riscrive.

## Perché esiste

Due ragioni, e la prima è un difetto vivo.

**1. Il pannello dei cheat non si chiude.** È il difetto che ha aperto questa delega, ed è aperto
adesso: il riquadro si apre e non c'è modo di richiuderlo dal pulsante. Il dettaglio di cosa è già
stato provato sta più sotto, in _Il difetto, e cosa si sa davvero_ — con l'avvertenza che **la
causa non è stata diagnosticata**, solo tentata.

**2. La sovrapposizione è già la terza volta che si scrive.** `UiTooltip` (D025) e `DevPanel`
(D029) risolvono lo stesso problema con codice diverso — `popover`, `inset: auto` per disfare il
centraggio del motore, la collocazione rispetto a chi apre, la chiusura — e il canvas di Claude
Design ne disegna una terza e una quarta: il menu contestuale, e i riquadri che si aprono sulle
schede dei domini.

La regola che il progetto si è dato per il kit ([D023](D023-il-design-system.md)) è: **un pezzo
entra nel kit quando lo disegnano due componenti.** Due ci sono già, la terza è annunciata. Il
grilletto è scattato, e non da oggi.

Ne discende ciò che l'utente ha chiesto con parole sue: il popover — o menu contestuale — deve
essere **un componente universale, centralizzato, modulare**. Universale vuol dire che non sa cosa
gli metti dentro; centralizzato vuol dire che ce n'è uno; modulare vuol dire che il contenuto è uno
slot e la collocazione una proprietà.

## Il difetto, e cosa si sa davvero

> **Diagnosticato il 2026-08-21**, di rimbalzo, misurando altro: vedi _La causa, misurata_ in fondo
> a questa sezione. Il resto resta scritto com'era, perché la cronologia dei tentativi è ciò che
> impedisce di rifarli.

**Non era diagnosticato quando questa delega è stata scritta.** Quello che segue è ciò che era
stato provato e cosa ne era uscito.

Cronologia:

1. **Prima stesura** — `@click` su un pulsante che chiamava `togglePopover()` a mano. Il pannello si
   apriva e **non si chiudeva**. Una causa plausibile c'era, ed è nota: un `popover` predefinito si
   congeda da solo al clic fuori, e il pulsante è **fuori** — quindi il motore chiudeva e il
   gestore riapriva nello stesso clic.
2. **Seconda stesura** (quella nel repo adesso, commit `7a4611b`) — l'aggancio dichiarativo:
   `popovertarget="dev-panel"` sul pulsante, `id="dev-panel"` sul riquadro, nessun `togglePopover()`
   scritto a mano. È la forma che il motore gestisce da sé, invocante compreso.
3. **L'utente ha riprovato: il pannello continua a non chiudersi.**

Cosa **non** è stato fatto, e va fatto per primo:

- La riproduzione minima è stata scritta (`out/renderer/popover-test.html`, poi cancellata) ma
  **non eseguita**: la sessione è stata chiusa prima.
- Il pannello dei cheat **non entra nel pacchetto compilato** — è dev-only, ed è verificato
  ([D029](D029-i-devcheat.md), _La misura_). Quindi non si può provarlo sull'ambiente statico di
  `out/renderer/`: serve la finestra di sviluppo, interrogata via CDP come descrive
  [PASSAGGIO-DI-CONSEGNE](PASSAGGIO-DI-CONSEGNE.md).

Piste da guardare, in ordine di costo:

| Pista                                                                     | Come si esclude                                                                      |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Il codice nuovo non è mai arrivato a schermo (HMR, ricarica non fatta)    | leggere l'attributo `popovertarget` nel DOM della finestra vera                      |
| Vue non rende `popovertarget` come attributo utile                        | stessa lettura: c'è l'attributo, ed è quello giusto?                                 |
| Il riquadro **copre** il pulsante, quindi il secondo clic non lo colpisce | `document.elementFromPoint` al centro del pulsante con il riquadro aperto            |
| Il congedo al clic fuori riapre comunque                                  | riproduzione minima in HTML puro, senza Vue, con la stessa struttura e lo stesso CSS |
| Un secondo elemento con lo stesso `id` in pagina                          | `document.querySelectorAll('#dev-panel').length`                                     |

**La riproduzione minima in HTML puro era il primo passo**, e non serve più: la risposta è arrivata
prima, dalla finestra vera.

### La causa, misurata

Trovata il 2026-08-21 durante [D032](D032-la-commissione-scala-il-pavimento-no.md), interrogando la
finestra di sviluppo via CDP per un'altra ragione — il pannello copriva i pulsanti che quella delega
doveva premere. **Non è stata corretta**: questa resta la delega che la corregge, e correggerla lì
sarebbe stato costruire due cose insieme.

Le prime tre piste della tabella qui sopra sono **escluse**, e da una lettura sola:

| Pista                                    | Letto nel DOM della finestra vera                        |
| ---------------------------------------- | -------------------------------------------------------- |
| il codice nuovo non è arrivato a schermo | il pulsante ha `popovertarget="dev-panel"`, c'è          |
| Vue non rende `popovertarget`            | lo rende: è l'attributo giusto sull'elemento giusto      |
| un secondo elemento con lo stesso `id`   | `document.querySelectorAll('#dev-panel').length` è **1** |

E la misura che le rende tutte irrilevanti: **`#dev-panel:popover-open` è `false` mentre il
pannello è visibile e i suoi pulsanti sono cliccabili.** Non è un popover che non si chiude — è un
riquadro che non è mai stato aperto come popover, e che si vede lo stesso.

La riga è in `DevPanel.vue`:

```css
.panel {
  /* … */
  display: flex;
}
```

Il foglio di stile del motore dà `display: none` a ogni elemento con l'attributo `popover` quando è
chiuso. **Una regola d'autore vince su quella del motore**, quindi `display: flex` scritto senza
condizione tiene il pannello visibile qualunque cosa dica il popover: aperto o chiuso, si vede. Il
motore chiude, e lo schermo non cambia.

Ne discende che il difetto **non è nella meccanica di apertura** e non lo era in nessuna delle due
stesure: è una riga di CSS che disfa il meccanismo che entrambe usavano. La forma dichiarativa
della seconda stesura era giusta.

**`UiTooltip` non ha il problema per un motivo che vale la pena guardare: non scrive `display`
affatto.** La sua bolla si dispone con `justify-self: anchor-center` e non ha figli da impilare,
quindi la regola del motore resta l'unica e il congedo funziona. Non è disciplina — è che a quel
componente non è mai servito.

Il pannello dei cheat invece è una colonna, quindi `display: flex` gli serve davvero. Ne discende
la forma della correzione: la dichiarazione va **condizionata allo stato aperto**
(`.panel:popover-open { display: flex }`) oppure spostata su un figlio, così che l'elemento con
l'attributo `popover` non abbia mai un `display` d'autore addosso.

E ne discende la cosa che riguarda il **kit**, che è poi la ragione per cui questa delega esiste:
il difetto non è stato una svista ma una riga che chiunque riscriverebbe in buona fede — il primo
componente che dovrà impilare qualcosa dentro una sovrapposizione la riscriverà uguale. Un pezzo
del kit che possiede il `display` la rende impossibile, invece di sconsigliarla. È il candidato più
forte per la **regola** che la sezione _Da produrre_ lascia opzionale.

## Le due decisioni aperte

Non risolverle in autonomia: cambiano la forma del kit e vanno prese con l'utente
(`dev-communication`).

### 1. Il pezzo nuovo sostituisce `UiTooltip`, o gli sta sotto?

- **A — una base sola, `UiPopover`, e `UiTooltip` la usa.** Un solo posto sa di livello superiore,
  ancoraggio e ripieghi; il tooltip diventa un guscio sottile che ci mette dentro del testo e si
  apre al passaggio del puntatore. Meno codice in totale, e il giorno in cui l'ancoraggio cambia si
  tocca un file. Costa un rifacimento di un componente che oggi funziona e ha i suoi test.
- **B — due pezzi affiancati, `UiTooltip` e `UiPopover`.** Nessun rischio su ciò che funziona, e le
  due cose sono davvero diverse: un tooltip si apre passandoci sopra e non prende il fuoco, un menu
  si apre premendo e lo prende. Costa la duplicazione della meccanica, che è **esattamente** ciò che
  questa delega esiste per togliere.

Chi scrive la delega propende per **A**, e la ragione è nel titolo: se restano due, fra sei mesi
sono quattro. Ma è una decisione dell'utente, non di chi esegue.

### 2. Un pezzo o due: «riquadro» e «menu» sono la stessa cosa?

Un menu contestuale è un riquadro **più** una lista di voci con la navigazione da tastiera (frecce,
`Home`/`End`, invio) e i ruoli ARIA giusti. Le due strade:

- **Un pezzo con uno slot** — `UiPopover` porta il livello superiore e la collocazione; chi lo usa ci
  mette dentro quello che vuole, lista compresa. Il menu resta da costruire ogni volta.
- **Due pezzi** — `UiPopover` come base e `UiMenu` sopra, che sa di voci, tastiera e ruoli.

`UiMenu` **non ha ancora due chiamanti**: il pannello dei cheat è un elenco di pulsanti, non un
menu. Costruirlo adesso sarebbe l'astrazione speculativa che l'
[ADR 0014](../adr/0014-una-fetta-verticale-alla-volta.md) vieta — ma l'utente ha nominato il menu
contestuale, quindi la domanda va posta a lui invece che decisa da chi esegue.

## Da produrre — indicativo, dipende dalle due decisioni

| File                                       | Cosa                                                                |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `src/renderer/ui/UiPopover.vue`            | il pezzo nuovo: livello superiore, ancoraggio, ripieghi, apertura   |
| `src/renderer/ui/UiTooltip.vue`            | riscritto sopra al pezzo nuovo, oppure lasciato com'è (decisione 1) |
| `src/renderer/components/dev/DevPanel.vue` | primo utente vero: perde la meccanica e tiene i cheat               |
| `tests/renderer/…`                         | ciò che è estraibile in funzioni pure — vedi _Trappole note_        |
| `tests/rules/…`                            | se nasce una regola: «una sovrapposizione passa dal kit»            |
| `docs/adr/0038-…`                          | se la decisione 1 è A, o se nasce una regola                        |

## Invarianti

- **R21 resta**: zero `z-index`. Il livello superiore non ne ha bisogno, ed è metà del motivo per
  cui l'ADR 0032 ha scelto quella strada.
- **R14 resta**: il pezzo riceve testo già tradotto e non conosce una sola chiave i18n.
- **R16 resta**: niente proprietà di geometria. La **collocazione** — «sopra», «sotto», «all'angolo»
  — non è geometria: `UiTooltip` ha già `side`, ed è il precedente.
- Si apre e si chiude **col puntatore e con la tastiera**, e `Esc` chiude senza portare via il
  fuoco. È ciò che D025 ha già pagato una volta.

## Fuori scope

- **La rifinitura del bancomat.** È D032, e viene dopo: una schermata non si rifinisce mentre il
  pezzo che ci va sopra sta cambiando forma.
- **Un sistema di scorciatoie da tastiera.** Il pannello si apre da un pulsante. Il giorno in cui
  servisse un tasto, è un'altra delega.
- **Animazioni di apertura.** D023 le ha già dichiarate fuori scopo, e una dissolvenza attraverso
  `display` vuole `@starting-style` e `allow-discrete` — tre righe di CSS per un effetto che
  nessuno ha chiesto.

## Definizione di fatto

- [x] Il pannello dei cheat **si chiude**, e la causa vera del difetto è scritta invece che
      aggirata. Se la seconda stesura era giusta e il problema era altro, va detto quale.
- [x] La meccanica della sovrapposizione vive in **un** file di `src/renderer/ui/`.
- [x] Il pezzo nuovo ha almeno due utenti veri nel repo.
- [x] Apertura e chiusura col puntatore, col tabulatore e con `Esc` — verificate **nella finestra
      vera**, via CDP, e con una misura letta nel DOM: il pannello dei cheat non esiste nel
      pacchetto compilato, quindi l'ambiente statico di `out/renderer/` **non basta**.
- [x] Zero `z-index` (R21 verde), nessuna chiave i18n nel kit (R14 verde).
- [x] La regola nuova, se ne nasce una, è rotta di proposito una volta.
- [x] `npm run verify` verde e `docs/stato.md` rigenerato.

## Trappole note

1. **`anchor-name` è globale al documento.** `UiTooltip` lo richiude nel proprio sottoalbero con
   `anchor-scope`, e senza quella riga tutte le bolle si ancorano alla prima. Sta scritto in testa
   a `UiTooltip.vue`, insieme alla seconda metà: `anchor-name: var(--qualcosa)` **non si risolve**,
   e la prima stesura di quel componente lo faceva.
2. **`inset: auto` non è opzionale.** Il foglio di stile del motore mette inset a zero e margine
   automatico su ogni riquadro del livello superiore, cioè «al centro dello schermo». Senza
   disfarlo, l'ancoraggio non ha niente su cui lavorare.
3. **Aprire un riquadro già aperto è un errore**, e succede appena il puntatore entra su un
   elemento che ha anche il fuoco. `UiTooltip` ha due guardie per questo; chi rifà la meccanica le
   rifaccia.
4. **L'ambiente statico non compone frame.** In `out/renderer/` servito da un server, Chromium
   ricolloca le ancore in un passo dopo il layout, una volta per frame — che lì non arriva mai.
   Una bolla aperta **prima** di uno scorrimento risulta lontana dalla propria ancora, e non è un
   difetto: è successo davvero in [D030](D030-il-contenuto-scorre-nel-telaio.md), correzione 2. Una
   misura presa lì va confrontata con un controllo preso **nello stesso ambiente**.
5. **Non c'è `jsdom` in questo progetto**, quindi un componente non si prova montandolo. Il
   [registro YAGNI](../roadmap-fette.md) ha il grilletto: _il primo comportamento di un componente
   che non si riesce a estrarre in una funzione pura_. Questa delega è il candidato più serio che
   sia comparso finora — se ci si arriva, sono **due dipendenze**, quindi un ADR
   ([0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md)). Non farlo di straforo.

## Correzioni rispetto a com'era scritta la delega

1. **Le due decisioni aperte sono state prese dall'utente, e la seconda con un «no».** Decisione 1
   è **A**: una base sola, `UiPopover`, e `UiTooltip` la usa. La ragione decisiva non era quella
   scritta nella delega — «se restano due, fra sei mesi sono quattro» — ma la causa del difetto,
   che nel frattempo era stata trovata: `UiTooltip` non era rotto **per fortuna**, perché non gli
   era servito scrivere `display`. Una regola rispettata per caso non è una regola.
   Decisione 2 è **un pezzo solo**: niente `UiMenu`. Il pannello dei cheat è un elenco di pulsanti e
   il menu contestuale del canvas non ha una riga di codice, quindi `UiMenu` avrebbe **zero**
   chiamanti — contro i due che il kit richiede (D023).
2. **La riproduzione minima in HTML puro non è servita.** La delega la dava come primo passo, e la
   risposta è arrivata prima e da un altro posto: leggendo il documento della finestra vera durante
   [D032](D032-la-commissione-scala-il-pavimento-no.md), dove il pannello copriva i pulsanti che
   quella delega doveva premere. Tre delle cinque piste erano escludibili con **una** lettura.
3. **`DevPanel` ha perso una riga sola, e non è un fallimento: è la misura giusta.** La delega
   diceva «perde la meccanica e tiene i cheat», e ci si aspetterebbe un file più corto. Le righe di
   meccanica erano cinque — `position`, `inset`, `right`, `bottom`, `display` — e sono state
   sostituite da altrettante fra lo slot, l'ancora e il commento che spiega perché `position: fixed`
   si è spostato. **Ciò che è cambiato non è quanto codice c'è, ma quale**: nessuna delle righe
   rimaste può più rompere una sovrapposizione, perché nessuna tocca un elemento con `popover`.
4. **`position: fixed` è passato dal pulsante all'ancora**, e la delega non lo prevedeva. Con
   `fixed` sul pulsante l'ancora resterebbe un rettangolo vuoto in mezzo alla pagina, e il riquadro
   si aprirebbe **lì**: l'ancoraggio CSS guarda dove l'ancora si trova, non dove sta il suo
   contenuto. Ne discende un guadagno che non era in programma — il pannello adesso è ancorato
   davvero, a 6 px sopra il proprio pulsante, invece di ripetere a mano le coordinate del pulsante
   con `right` e `bottom`.
5. **R17 non è stata rivista, e l'intestazione diceva che forse andava.** «Se c'è una spiegazione, è
   `UiTooltip`» resta vero alla lettera: il componente esiste ancora, ha perso la meccanica e non il
   ruolo. La domanda era giusta da porre e la risposta è stata «no».
6. **`useId` entra nel progetto, ed è la prima volta.** L'aggancio dichiarativo vuole un `id` e due
   istanze in pagina non possono averlo uguale. Non è una dipendenza nuova — è Vue, già in uso — ma
   è una scelta: l'alternativa era un contatore di modulo, cioè stato globale dentro un pezzo del
   kit.
7. **La regola nuova ha avuto bisogno di un confine che la delega non immaginava.** R22 vieta
   l'attributo `popover` e deve lasciar passare `popovertarget`, che è il modo **corretto** di
   aprire un riquadro dal proprio pulsante. Senza il `(?![\w-])` finale la regola avrebbe vietato
   proprio la forma che vuole incoraggiare — ed è il caso di prova che lo dichiara, non un commento.
8. **Niente jsdom, e la trappola 5 non è scattata.** La delega lo dava come candidato più serio per
   la prima dipendenza di prova. Non è servita: ciò che andava verificato — che il riquadro si apra
   e si **chiuda** — è comportamento del motore, e montarlo in un DOM finto avrebbe provato il finto
   invece del vero. La verifica è la finestra vera più una regola strutturale, che insieme coprono
   più di quanto un test montato avrebbe potuto.

## La misura, presa nella finestra vera

Via CDP, con la finestra ferma dov'era, il 2026-08-21. Ogni riga è letta **nel documento** dopo il
gesto, non guardata in un'immagine.

### Il pannello dei cheat

| Gesto                 | `:popover-open` | `display` | riquadro | `aria-expanded` | stacco dal pulsante |
| --------------------- | --------------- | --------- | -------- | --------------- | ------------------- |
| all'avvio             | `false`         | `none`    | 0×0      | `false`         | —                   |
| primo clic            | **`true`**      | `flex`    | 300×502  | `true`          | **6 px**            |
| secondo clic          | **`false`**     | `none`    | 0×0      | `false`         | —                   |
| `Esc`                 | `false`         | `none`    | 0×0      | `false`         | —                   |
| tabulatore + `Invio`  | `true`          | `flex`    | 300×502  | `true`          | 6 px                |
| tabulatore + `Spazio` | `true`          | `flex`    | 300×502  | `true`          | 6 px                |

**Il fuoco dopo `Esc` resta sul pulsante `DEV`**, che è la metà di quella spunta che si dimentica.

### Il tooltip, che ha cambiato meccanica sotto

Dodici ancore in pagina, undici a puntatore. Il ruolo della bolla è `tooltip` e `aria-describedby`
punta al riquadro giusto.

| Ancora            | Aperto | Dove va               | Stacco | Scarto orizzontale |
| ----------------- | ------ | --------------------- | ------ | ------------------ |
| a 56 px dall'alto | sì     | **sotto (ribaltata)** | 6 px   | **0 px**           |
| a 470 px          | sì     | sopra, come chiesto   | 6 px   | **0 px**           |

Il ribaltamento è la dichiarazione che funziona: alla prima ancora non c'è posto sopra, e il CSS
sceglie l'altra parte da solo. Lo scarto orizzontale è **zero** in tutti e due i casi, che è la
prova che `anchor-scope` sta facendo il proprio lavoro — senza, tutte le bolle si aggancerebbero
alla prima.

### Una trappola dello strumento, non del codice

`Spazio` non attivava il pulsante, e per qualche minuto è sembrato un difetto di accessibilità. Non
lo era: l'evento sintetico mandava `key: 'Space'` invece di `key: ' '`, quindi il motore non
sintetizzava il clic. A dirlo è stato un controllo preso **nello stesso ambiente** — lo stesso
`Spazio` non attivava nemmeno l'interruttore del tema, che nessuno aveva toccato.

È la stessa lezione di [D030](D030-il-contenuto-scorre-nel-telaio.md), correzione 2, con un'altra
faccia: **una misura strana va confrontata con un controllo preso allo stesso modo**, o il primo
numero storto diventa un difetto inventato.
