# D038 — Ciò che si preme e ciò che scorre passano dal kit, e le icone vengono da un insieme

- **Stato:** **Chiusa** — scritta **ed eseguita** il 2026-08-23, sul ramo
  `d038-cio-che-si-preme-e-cio-che-scorre`, che discende da
  [D037](D037-il-tempo-che-avanza-e-un-operazione-del-gioco.md) invece che da `main`, perché quel
  ramo non è ancora fuso e una fusione è una cosa che si chiede. Vedi _Come è andata_ in fondo
- **Dipende da:** [D023](D023-il-design-system.md) — il kit esiste, e le sue regole sono quelle che
  questa delega estende. [D024](D024-il-telaio.md) e [D031](D031-la-sovrapposizione-e-un-pezzo-del-kit.md)
  per i due precedenti di forma: una forma non è un contenitore, e un pezzo del kit possiede la
  meccanica e non la pittura
- **Sblocca:** ogni schermata che verrà, come D023. In particolare: un pulsante nuovo non ha più una
  forma da inventare, un elenco lungo non ha più uno scorrimento da scrivere, e un simbolo non ha
  più un disegno da ricalcare
- **ADR vincolanti:** [0044](../adr/0044-cio-che-si-preme-passa-dal-kit.md),
  [0045](../adr/0045-cio-che-scorre-passa-dal-kit.md) e
  [0046](../adr/0046-le-icone-vengono-da-un-insieme-e-il-disegno-e-generato.md), tutti e tre nuovi.
  Ne tocca due: [0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md), di cui estende il confine, e
  [0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md), che pretende un ADR per la
  dipendenza nuova
- **Regole:** tre nuove — **R26**, **R27**, **R28**. Un invariante **cambia meccanismo**: INV-21
- **Budget:** dichiarato ~330 righe di sorgente e ~250 di test; **misurato 566 e 517**, il 70% in
  più. Lo sforamento è quasi tutto commento — i tre componenti nuovi portano il perché di ogni riga
  che possiedono — e la misura che conta è un'altra: il CSS dentro i `.vue` passa da **1.035** a
  **1.039** righe, cioè **quattro**, perché ciò che il kit guadagna i cinque pulsanti e le sei aree
  lo perdono

## Obiettivo

Dare al progetto un'unica cosa premibile, un'unica cosa che scorre e un'unica sorgente di icone — e
renderle impossibili da aggirare.

## Perché esiste, e perché adesso

La richiesta è arrivata dall'utente come feature: «CTA unificati come componenti UI universali,
riutilizzati e riutilizzabili, con i vari stili. Idem per le scrollbar. Da sostituire ovunque essi
vengano utilizzati attualmente ed in futuro.» Poi, a lavoro cominciato, l'aggiunta delle icone da
Iconify, «in modo centralizzato e facile da cambiare».

Letta contro il repo, la prima metà **non era una feature**: era un difetto misurabile, ed è la
terza volta che questo progetto incontra la stessa forma.

**I pulsanti erano sei**, non uno. `UiButton` e cinque `<button>` scritti a mano in tre file — il
verso del bancomat, le cinque scorciatoie degli importi, le quattro destinazioni della colonna,
l'interruttore del tema, l'aggancio dei cheat. Ognuno con il proprio azzeramento del pulsante del
browser, e **nessuno dei sei con un anello di fuoco**: chi girava con il tabulatore riceveva il
contorno del motore, che dei due temi non sa niente. La divergenza non era un rischio, era già
avvenuta — due dei sei avevano uno stato al puntatore e quattro no.

**Le aree che scorrevano erano sei**, in cinque file, e nessuna barra era vestita. Ma il difetto
vero non era il colore: `UiShell` scriveva `min-height: 0` e spiegava perché, `AppNav` no — quindi
la sua `overflow-y: auto` non interveniva mai, e a scorrere finiva la colonna intera del telaio,
marchio e interruttore compresi, invece della sola lista delle destinazioni. **Nessun gate poteva
vederlo.**

È la forma di `.refusal` copiata in due pannelli, trovata dall'audit di
[D016](D016-correzioni-audit.md); è la forma del vestito dei grafici ricopiato, trovato da
[D034](D034-le-serie-degli-strumenti.md) e chiuso da R23. La stessa cosa invisibile scritta N volte,
che diverge senza far rumore.

E ne discende una falla che vale da sola: **INV-21 era difeso su una cartella e non
sull'applicazione.** Il controllo cercava `disabled` nei file di `ui/`; qualunque componente poteva
scrivere `<button disabled>` e nessuno lo avrebbe visto.

## Cosa trovi già fatto

- **Il criterio di ammissione al kit esiste** ([D023](D023-il-design-system.md)): un pezzo entra
  quando lo disegnano **due** componenti. Vale per un pezzo e vale per un valore di variante.
- **Il criterio forma/contenitore esiste** ([ADR 0030](../adr/0030-il-telaio-e-una-forma-non-un-contenitore.md)):
  se puoi cambiarne la disposizione con una proprietà è un contenitore, se la disposizione è scritta
  nel file è una forma. `UiShell` è passato di lì.
- **Il precedente della meccanica senza pittura esiste** ([D031](D031-la-sovrapposizione-e-un-pezzo-del-kit.md)):
  `UiPopover` non dipinge niente, e chi lo chiama veste la propria radice con il proprio CSS scoped.
- **Il precedente del congegno del motore ricolorato esiste**
  ([D036](D036-il-pagamento-e-un-flusso-solo.md)): il pallino della scelta resta quello del motore e
  prende `accent-color`. È l'argomento che decide le frecce della barra di scorrimento.
- **Il precedente dell'artefatto generato esiste**: `docs/stato.md` lo produce
  `tests/helpers/projectState.ts` e lo verifica `tests/rules/project-state` con `-u`. È la forma con
  cui entrano le icone.

## Da produrre

| File                                                | Contenuto                                                    |
| --------------------------------------------------- | ------------------------------------------------------------ |
| `src/renderer/ui/UiButton.vue`                      | l'unica cosa premibile: quattro forze, quattro scatole       |
| `src/renderer/ui/UiScroll.vue`                      | l'unica area che scorre, e l'unico vestito della barra       |
| `src/renderer/ui/UiIcon.vue`                        | il glifo, alto quanto il testo e del colore di chi lo ospita |
| `src/renderer/ui/icons.ts`                          | l'insieme e i nomi — scritti a mano                          |
| `src/renderer/ui/glyphs.json`                       | i tracciati — **generati**                                   |
| `src/renderer/ui/roles.ts`                          | `BUTTON_VARIANTS` e `BUTTON_SIZES`, con i loro tipi          |
| `tests/helpers/glyphs.ts`                           | la derivazione dei tracciati dall'insieme installato         |
| `tests/rules/buttons-pass-through-the-kit.test.ts`  | **R26**, e INV-21 esteso a tutti i componenti                |
| `tests/rules/scroll-passes-through-the-kit.test.ts` | **R27**                                                      |
| `tests/rules/icons.test.ts`                         | **R28**                                                      |

E la migrazione: cinque pulsanti e sei aree che scorrevano passano dal kit.

## Invarianti

- **INV-21 — un pulsante non si spegne mai: se non si può, c'è una frase.** Non è nuovo. Cambia
  **meccanismo**, e diventa più forte: il controllo si sposta da `ui-kit-is-standalone` a
  `buttons-pass-through-the-kit` e guarda tutti i `.vue` invece della sola cartella del kit. La riga
  di [tracciabilita.md](../tracciabilita.md) cambia con lui.

## Fuori scope

- **I simboli nelle destinazioni della colonna.** `AppNav.vue` porta scritto da D024 che i simboli
  arrivano col primo dominio che ne porta uno suo, e quel grilletto non è scattato. Le due icone di
  questa delega **sostituiscono due glifi che il gioco disegnava già**; non ne inventano.
- **Una variante `dashed`.** Avrebbe un chiamante contro i due richiesti: vedi le alternative
  scartate dell'[ADR 0044](../adr/0044-cio-che-si-preme-passa-dal-kit.md).
- **Il campo di testo come pezzo del kit.** Ce ne sono due, il campo dell'importo e quello del
  codice, e si somigliano — ma questa delega parla di ciò che si preme, non di ciò che si scrive. Il
  grilletto è il terzo campo, e sta nel [registro YAGNI](../roadmap-fette.md).
- **Gli script CDP in `scripts/`.** Aperta da sette sessioni, e non è di questa delega. Vedi
  [PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md).

## Definizione di fatto

- [x] `npm run verify` verde
- [x] `npm run verify:release` verde, e il peso del renderer **rimisurato** in
      [qualita.md](../qualita.md) con la data accanto
- [x] R26, R27 e R28 hanno un test, e tutti e tre sono stati **rotti di proposito**
- [x] INV-21 rotto di proposito con la sua forma nuova: un `disabled` su un `<UiButton>` **fuori**
      dal kit, che prima nessun gate vedeva
- [x] Nessun `<button>` fuori da `UiButton.vue`, nessun `overflow` che scorre fuori da
      `UiScroll.vue`, nessuna icona fuori da `glyphs.json`
- [x] `docs/architettura.md`: la tabella delle regole arriva a R28
- [x] `docs/tracciabilita.md`: R26, R27 e R28 hanno la loro riga e il loro meccanismo, e INV-21 ha
      il meccanismo nuovo
- [x] `docs/adr/README.md`: i tre ADR nuovi sono nel compendio
- [x] `docs/delega/README.md`: questa delega è nell'indice e nel grafo
- [x] `docs/stato.md` rigenerato con `npx vitest run tests/rules/project-state -u`
- [x] **La finestra vera è stata guardata, nei due temi**, e l'anello di fuoco è stato provato con
      il tabulatore vero e non con un `focus()`: vedi _Come è andata_

## Trappole note

- **Il `min-height: 0` che sembra superfluo.** È la riga che rende possibile lo scorrimento dentro
  un contenitore flessibile, ed è quella che `AppNav` non aveva. Chi scrive `UiScroll` senza di lei
  costruisce un componente che non scorre e non lo scopre finché un elenco non si allunga.
- **`display` su un elemento del livello superiore.** Non riguarda questa delega e riguarda il file
  accanto: `UiPopover` e `UiDialog` possiedono quelle righe, e R22 impedisce a chiunque altro di
  averle in mano. Un `UiScroll` messo **sopra** invece che **dentro** il riquadro dei cheat le
  toglierebbe di mano al custode.
- **Gli attributi che ricadono sull'involucro.** Con `inheritAttrs: false` e `v-bind="$attrs"` il
  `popovertarget` arriva sul `<button>`; senza, arriva sul `div` e l'apertura dichiarativa smette di
  funzionare **in silenzio**, perché un `popovertarget` su un `div` non è un errore per nessuno.
- **L'insieme di icone importato intero.** `@iconify-json/lucide` è 1.844 icone in 554 kB, e il
  gioco ne disegna due. Importarlo è il difetto A14 con un'altra estensione.

## Come è andata

Eseguita il 2026-08-23, sul ramo `d038-cio-che-si-preme-e-cio-che-scorre`.

**Le misure, prese e non stimate.** Il CSS dentro i `.vue` passa da **1.035** a **1.039** righe, e i
file `.vue` da 34 a 36: **quattro righe di stile in più con due componenti in più**, ed è il numero
che dice cosa è successo davvero. `src/renderer/` passa da 4.069 a **4.155** righe di codice, e
quelle 86 sono le tre regole nuove viste dal lato del sorgente più i due elenchi di `roles.ts`.

Il peso del renderer minificato passa da **1.207,33 kB** a
**1.208,70 kB** di JS e da **22,84 kB** a **23,15 kB** di CSS: **1,37 kB e 310 byte**, per tre
componenti nuovi, due icone e tre regole. È poco perché quasi tutto è **spostamento**: ciò che il
kit guadagna, i cinque pulsanti scritti a mano e le sei aree che scorrevano lo perdono. I numeri
esatti, con la data e il metodo, stanno in [qualita.md](../qualita.md).

**Il difetto della colonna era vero e si è visto sparire.** Prima, `.destinations` dichiarava
`flex: 1` e `overflow-y: auto` senza `min-height: 0`: non si restringeva, quindi spingeva, e a
scorrere era la colonna del telaio. Adesso scorre la lista e il marchio resta in cima.

**Un vicolo cieco, misurato invece che immaginato: `scrollbar-gutter: stable`.** Scritto, guardato
nella finestra vera, tolto. Riserva lo spazio della barra anche quando la barra non c'è, e in cambio
lascia un'asimmetria permanente: **24 px a sinistra contro 34 a destra** nell'area del contenuto, e
**21 px** invece di 8 nella colonna, dove le due aree annidate ne riservavano una ciascuna. Dieci
pixel sono `--space-4`. Tolto quello, l'annidamento delle due aree **non costa niente**, perché una
barra occupa spazio solo quando c'è.

**L'anello di fuoco è stato provato con il tabulatore vero.** Un `element.focus()` non fa scattare
`:focus-visible` — il motore lo accende per la tastiera e non per una chiamata — quindi la prova
vale solo passando da `Input.dispatchKeyEvent`. È il genere di verifica che si crede fatta e non lo
è.

## Correzioni rispetto a com'era scritta

**1. Il rilevatore dei commenti non vedeva quelli di un template, e nessuno lo sapeva.**
`withoutComments` in `tests/helpers/sources.ts` e la costante `NOISE` di `english-identifiers`
toglievano `/* */` e `//` e non `<!-- -->`, quindi la prosa italiana dentro un `<template>` veniva
letta come codice. Trovato scrivendo `UiIcon.vue`, che ne ha uno. Che finora nessuno se ne fosse
accorto è **fortuna e non progetto**: `UiPopover.vue` ne ha uno da D031, e passava solo perché
nessuna delle sue parole era nell'elenco. Corretto in tutti e due i posti — ed è la stessa classe di
argomento che quel file porta scritto addosso.

**2. `eslint-disable-next-line` in un template non spegne niente se il tag occupa più righe.** La
direttiva guarda la riga successiva, e la violazione viene segnalata dove sta l'attributo — sei
righe più giù. Un permesso che sembra dato e non lo è. La forma a blocco, con `eslint-enable` dopo,
è l'unica che funziona.

**3. Il `38px` del disco del bancomat non era un passo di nessuna scala**, e la delega non lo aveva
notato. Adesso il lato lo decidono il glifo e lo spazio intorno, con `aspect-ratio: 1`.

**4. La misura `icon` ha un chiamante solo**, contro i due che il criterio di D023 richiede. È stata
ammessa lo stesso, ed è scritto sia qui sia nell'[ADR 0044](../adr/0044-cio-che-si-preme-passa-dal-kit.md):
è il posto che ogni design system riserva al pulsante di solo glifo, e nasconderlo sarebbe stato
peggio che dichiararlo.

**5. La dipendenza nuova è quella con il caso più debole finora ammesso**, e l'[ADR 0046](../adr/0046-le-icone-vengono-da-un-insieme-e-il-disegno-e-generato.md)
lo scrive nella tabella che l'ADR 0015 pretende: quello che scriveremmo a mano al suo posto oggi
sono **due `<path>`**, dieci righe. Ciò che si compra è l'insieme, non i due disegni.

**6. `npm install` continua a non funzionare in questa repo**, ed è la correzione 8 di D023 alla
seconda ricorrenza: aggiungere `@iconify-json/lucide` è fallito con `ERESOLVE` — `electron-vite@5`
regge `vite` fino alla 7, il progetto è sulla 8 — ed è passato solo con `--legacy-peer-deps`, che ha
aggiunto due pacchetti e non ne ha tolto nessuno. La causa vera resta aperta.
