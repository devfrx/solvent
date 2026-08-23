# ADR 0044 — Ciò che si preme passa dal kit

- **Stato:** **Accettata** — [D038](../delega/D038-cio-che-si-preme-e-cio-che-scorre.md):
  `src/renderer/ui/UiButton.vue` è l'unico `<button>` di `src/`, le quattro forze e le quattro
  scatole sono dichiarate in `roles.ts`, e la regola **R26** con
  `tests/rules/buttons-pass-through-the-kit` la impone. Rotta di proposito: un `<button>` rimesso in
  `AppNav.vue`, e un `disabled` su un `<UiButton>` in `AtmPanel.vue`
- **Data:** 2026-08-23

## Contesto

L'[ADR 0028](0028-il-kit-ui-non-sa-che-gioco-e.md) ha fatto di `UiButton` «il pezzo che rende il
design system una regola invece di una tavolozza»: non sa spegnersi, e chi non può fare un'azione
riceve una frase invece di un rettangolo morto. Quella regola è vera, ed è verificata — dentro
`ui/`.

Fuori, il progetto aveva **cinque** altri pulsanti, scritti a mano in tre file: il verso del
bancomat, le cinque scorciatoie degli importi, le quattro destinazioni della colonna, l'interruttore
del tema, l'aggancio del pannello dei cheat. Ognuno ripeteva a modo suo l'azzeramento del pulsante
del browser — `background`, `border`, `border-radius`, `font-family`, `cursor` — e nessuno dei sei,
`UiButton` compreso, dichiarava un **anello di fuoco**. Chi girava l'applicazione con il tabulatore
riceveva il contorno del motore, che dei due temi di [D023](../delega/D023-il-design-system.md) non
sa niente.

Non era distrazione, ed è la parte che conta: **niente lo impediva.** È la forma esatta del difetto
che l'audit di [D016](../delega/D016-correzioni-audit.md) trovò con `.refusal` copiata in due
pannelli, e quella che [D034](../delega/D034-le-serie-degli-strumenti.md) ha ritrovato nel vestito
dei grafici — la stessa cosa scritta N volte, che diverge senza che nessun gate lo veda. E la
divergenza c'era già: due dei sei pulsanti avevano uno stato al puntatore, quattro no.

Ne discende una seconda falla, più seria della prima. **INV-21 valeva solo in `ui/`**: qualunque
componente poteva scrivere `<button disabled>` e nessuna verifica lo avrebbe visto. L'invariante
più caratteristico del progetto era difeso su una cartella e non sull'applicazione.

## Decisione

**Un pulsante solo, ed è del kit.** `UiButton` è l'unico `<button>` di `src/`, e ciò che i cinque
scritti a mano dicevano con il CSS lo dicono adesso con due elenchi chiusi, dichiarati in
`roles.ts` accanto ai ruoli di colore:

- **`variant`** — quanto è forte: `primary`, `quiet`, `raised`, `bare`.
- **`size`** — quale scatola: `md`, `sm`, `chip`, `icon`.

Il criterio di ammissione è quello di D023 e non è stato allentato: **un valore entra quando lo
disegnano due componenti.** Sette degli otto lo soddisfano oggi; l'ottavo, `icon`, ne ha uno — il
disco del bancomat — ed è il posto che ogni design system riserva al pulsante di solo glifo. È
scritto qui perché sia contestabile, non perché sia sfuggito.

Ne discende una regola con un ID e un test:

- **R26** — nessun `.vue` di `src/` scrive un `<button>`, tranne `UiButton.vue`. E **nessun `.vue`,
  nemmeno fuori dal kit, scrive `disabled`**: il controllo di INV-21 si sposta da
  `ui-kit-is-standalone` a `buttons-pass-through-the-kit` e passa dalla cartella all'applicazione.

Tre conseguenze di forma, che valgono la pena di essere scritte perché sono le tre che un revisore
potrebbe voler disfare:

**L'etichetta non è opzionale, in nessuna misura.** Un pulsante senza nome è la cosa che questo kit
non deve poter scrivere. A misura `icon` l'etichetta non si vede — al suo posto c'è il glifo — e
diventa l'`aria-label`. Ne discende che nessun chiamante scrive più un nome accessibile a mano, che
è esattamente il posto in cui una traduzione si dimentica.

**Gli attributi ricadono sul `<button>`, non sull'involucro** (`inheritAttrs: false` più
`v-bind="$attrs"`). Serve al pannello dei cheat, il cui aggancio riceve `popovertarget` e
`aria-expanded` dallo slot di `UiPopover`: su un `div` quel `popovertarget` non sarebbe un errore
per nessuno, e l'apertura dichiarativa smetterebbe di funzionare in silenzio. È anche il motivo per
cui il controllo su `disabled` **deve** allargarsi a tutti i componenti: la stessa ricaduta che
porta a destinazione `popovertarget` porterebbe a destinazione `disabled`.

**L'anello di fuoco è quello di `UiPopover`**, alla lettera: `outline: 1px solid var(--color-ink-3)`
con `outline-offset: var(--space-1)`. Due modi di dire «sei qui» sono due modi che divergono.

## Alternative scartate

- **Lasciare i cinque pulsanti dove sono e aggiungere solo l'anello di fuoco.** Chiude il difetto
  che si vede e lascia intatto quello che lo ha prodotto: cinque azzeramenti scritti a mano, e la
  prossima schermata che ne scrive un sesto. È la correzione che l'audit di D016 ha già fatto una
  volta con `.refusal`, e che D023 ha dovuto rifare.
- **Un `UiButton` che riceve la propria pittura dal chiamante**, come `UiPopover` riceve la sua.
  Regge per le sovrapposizioni, dove — e l'ADR 0032 lo dice — «i due non hanno una pittura in comune
  da condividere». Qui è falso: `primary` la disegnano sei chiamanti e `quiet` quattro. Una pittura
  passata da fuori sarebbe la libertà di reinventare una cosa che esiste già, cioè il ritorno al
  punto di partenza con un componente in mezzo.
- **Una variante `dashed` per l'aggancio dei cheat**, che perde il proprio tratteggio. Avrebbe **un**
  chiamante contro i due che il kit richiede, e si chiamerebbe come il proprio unico committente. Il
  tratteggio dice «questo non fa parte del gioco», e a dirlo resta il riquadro che si apre, che è
  tratteggiato. È la stessa decisione con cui [D031](../delega/D031-la-sovrapposizione-e-un-pezzo-del-kit.md)
  ha tenuto fuori `UiMenu`.
- **Una proprietà `shape` accanto a `variant` e `size`.** Le tre sagome del disegno — il rettangolo
  che riempie la colonna, la pillola inline, il disco — non variano indipendentemente dalla scatola:
  ogni misura ne ha una sola. Una terza proprietà avrebbe descritto una libertà che non esiste, ed è
  la prima delle dodici che l'ADR 0028 racconta.

## Conseguenze

- Un pulsante nuovo non può inventarsi una forma: R26 è rossa prima che qualcuno lo veda, come R15
  lo è per un colore.
- **INV-21 cambia meccanismo e diventa più forte**, e la riga di [tracciabilita.md](../tracciabilita.md)
  cambia con lui: non più «nessun `disabled` scritto nel kit», ma «nessun `disabled` scritto in
  nessun componente».
- `AppNav.vue` perde quaranta righe di stile e `AtmPanel.vue` ventidue: la misura netta sta nella
  delega, con il metodo di `codeLines`.
- Il `38px` del disco del bancomat sparisce. Non era un passo di nessuna scala: adesso il lato lo
  decidono il glifo e lo spazio intorno, con `aspect-ratio`.
- Il kit guadagna una seconda coppia di elenchi a runtime dopo i ruoli di colore, e con essa il
  controllo di completezza che ne discende: una variante dichiarata e mai dipinta è rossa.
- L'interruttore del tema smette di essere un'etichetta maiuscola e diventa una riga come le
  destinazioni sopra di lui. È una differenza visibile, ed è nella direzione giusta: erano due modi
  di disegnare la stessa cosa nella stessa colonna.
