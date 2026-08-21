# D031 — La sovrapposizione è un pezzo del kit

- **Stato:** **Aperta** — scritta il 2026-08-21, non eseguita. Il ramo si chiami
  `d031-la-sovrapposizione-e-un-pezzo-del-kit` e parta da `d030-il-contenuto-scorre-nel-telaio`
  (oppure da `main`, se nel frattempo i rami sono stati fusi — vedi
  [PASSAGGIO-DI-CONSEGNE](PASSAGGIO-DI-CONSEGNE.md))
- **Dipende da:** [D025](D025-il-tooltip.md), che ha portato la prima sovrapposizione, e
  [D029](D029-i-devcheat.md), che ha portato la seconda e ne ha rotta una
- **Sblocca:** D032, la rifinitura del bancomat: il canvas disegna menu e riquadri sovrapposti in
  quasi ogni schermata, e costruirli uno per volta dentro le pagine è il modo in cui il kit smette
  di esistere
- **ADR vincolanti:** [0032](../adr/0032-le-sovrapposizioni-stanno-nel-livello-superiore.md) (dove
  vivono le sovrapposizioni), [0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md) (il kit non sa
  che gioco è), [0030](../adr/0030-il-telaio-e-una-forma-non-un-contenitore.md) (una forma non è un
  contenitore), [0037](../adr/0037-il-telaio-non-scorre-il-contenuto-si.md) (R21, nessun
  `z-index`). Probabilmente ne produce uno nuovo — vedi _Le due decisioni aperte_
- **Regole:** R14, R16, R17 e R21 valgono tutte. Se il pezzo nuovo prende il posto di
  `UiTooltip`, R17 va riletta: dice «se c'è una spiegazione, è `UiTooltip`», e quel nome potrebbe
  cambiare
- **Budget:** non stimato. Chi la esegue lo scriva prima di cominciare, dopo aver preso le due
  decisioni aperte: la forbice fra le due opzioni è larga

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

**Non è diagnosticato.** Quello che segue è ciò che è stato provato e cosa ne è uscito: chi esegue
riparta dalla riproduzione, non dalle ipotesi.

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

**La riproduzione minima in HTML puro è il primo passo**, e costa dieci minuti: se lì funziona, il
colpevole è Vue o il nostro CSS; se lì non funziona, è la forma del popover e va cambiata la forma.

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

- [ ] Il pannello dei cheat **si chiude**, e la causa vera del difetto è scritta invece che
      aggirata. Se la seconda stesura era giusta e il problema era altro, va detto quale.
- [ ] La meccanica della sovrapposizione vive in **un** file di `src/renderer/ui/`.
- [ ] Il pezzo nuovo ha almeno due utenti veri nel repo.
- [ ] Apertura e chiusura col puntatore, col tabulatore e con `Esc` — verificate **nella finestra
      vera**, via CDP, e con una misura letta nel DOM: il pannello dei cheat non esiste nel
      pacchetto compilato, quindi l'ambiente statico di `out/renderer/` **non basta**.
- [ ] Zero `z-index` (R21 verde), nessuna chiave i18n nel kit (R14 verde).
- [ ] La regola nuova, se ne nasce una, è rotta di proposito una volta.
- [ ] `npm run verify` verde e `docs/stato.md` rigenerato.

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
