# D025 — Il tooltip: la spiegazione che non occupa posto

- **Stato:** **Chiusa** — scritta ed eseguita il 2026-08-21, insieme a [D024](D024-il-telaio.md)
  e subito dopo di lei: il telaio porta il primo posto stretto in cui una parola in più non ci sta.
  Chiusa lo stesso giorno sul ramo `d024-d025-telaio-e-tooltip`, commit `29ff535`, nella stessa
  sessione a occhio di D024. Vedi _Come è andata_ in fondo
- **Dipende da:** [D023](D023-il-design-system.md) — il tooltip è un pezzo del kit, e senza il kit
  sarebbe il secondo posto in cui nascono dei colori. **Non** dipende da [D024](D024-il-telaio.md):
  le due si toccano nei file ma non nell'ordine
- **Sblocca:** ogni spiegazione che verrà. È anche il primo esemplare di sovrapposizione, quindi
  sblocca il menu e la finestra modale del giorno in cui serviranno
- **ADR vincolanti:** [0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md) e
  [0011](../adr/0011-i18n-obbligatoria-con-parita-verificata.md). Uno nuovo: **0032**
- **Regole:** una nuova, **R17**
- **Budget:** ~120 righe di sorgente nuove e ~55 di test. Non toglie niente a nessuno

## Obiettivo

Dare al progetto **un solo** modo di spiegare una cosa senza occupare spazio, e rendere impossibile
il secondo.

## Perché esiste, e perché adesso

Il [registro YAGNI](../roadmap-fette.md) tiene «il sistema di sovrapposizioni» con un grilletto
scritto: _la prima cosa che deve stare sopra il resto invece che dentro il flusso_. Un tooltip è
esattamente quella cosa, quindi il grilletto è scattato — non è stato aggirato, ed è la differenza
fra costruire una cosa quando serve e costruirla perché è nel disegno.

**E il telaio la rende necessaria.** La striscia degli strumenti di [D024](D024-il-telaio.md) mette
un'etichetta di nove pixel e mezzo sopra una cifra, sempre a schermo, su ogni schermata. `CASH` e
`CARD` sono due parole che il giocatore impara in un minuto; `HEAT`, `ATTENZIONE`, `TRACCIABILITÀ` e
tutto ciò che verrà con i domini non lo sono. In una striscia larga così non c'è posto per la frase
che le spiega, e la frase non può stare da nessun'altra parte: la striscia è ciò che si guarda
mentre si fa altro.

**Il rischio adesso è l'attributo `title`.** Costa zero, funziona subito, e il primo che lo scrive
non fa niente di male. Il secondo lo copia. Al terzo il progetto ha due sistemi di spiegazione — uno
vestito e uno del browser — e nessuno dei due si può cambiare senza toccare l'altro. È la forma
esatta con cui `.refusal` si è duplicata prima di [D016](D016-correzioni-audit.md), ed è la ragione
per cui questa delega porta una regola e non solo un componente.

## Cosa il design dice

Il canvas non disegna tooltip: disegna una regola, ed è più forte. «Mai un numero nudo» — un importo
senza il suo strumento accanto costringe il giocatore a indovinare se quei soldi sono anonimi o
tracciabili. `UiChip` è nato da lì.

Il tooltip è la stessa regola applicata a ciò che una targhetta non riesce a dire: **una parola che
non si spiega da sé non è un'etichetta, è un enigma.** Quello che il canvas insegna è dove la
spiegazione **non** va: non dentro il flusso, perché ciò che si legge sempre non può crescere; e mai
al posto di un rifiuto, che resta una frase visibile sotto il pulsante (INV-21). Il tooltip
aggiunge, non nasconde.

## Cosa trovi già fatto

- **Il kit c'è**, e questa delega gli aggiunge **un** pezzo.
- **Il testo passa già dalle chiavi.** R12 e il test di parità coprono le chiavi nuove senza che
  questa delega debba inventare un meccanismo.
- **Il motore è uno solo ed è Chromium**, e lo controlliamo noi: è il presupposto dell'ADR 0032, e
  va **verificato a runtime** invece che supposto — la definizione di fatto lo chiede.
- **`tests/rules/ui-kit-is-standalone` c'è**, e il pezzo nuovo entra nel suo giro da sé: la cartella
  è già quella che il test guarda.

## Da produrre

| File                                     | Contenuto                                                      |
| ---------------------------------------- | -------------------------------------------------------------- |
| `src/renderer/ui/UiTooltip.vue`          | il pezzo: avvolge chi lo apre, e mette la frase sopra il resto |
| `src/renderer/ui/tokens.css`             | il tempo di apparizione, e nient'altro                         |
| `src/renderer/i18n/it.ts` e `en.ts`      | le chiavi delle spiegazioni di oggi, in tutte e due            |
| `src/renderer/components/*.vue`          | le spiegazioni messe dove servono                              |
| `tests/rules/no-native-tooltips.test.ts` | **R17** — nessun `title` in un `.vue` di `src/`                |
| `docs/adr/0032-*.md`                     | la decisione sulle sovrapposizioni                             |

### Che forma ha `UiTooltip`

Avvolge chi lo apre e gli sta attaccato:

    <UiTooltip :text="text('atm.fee.explained')">
      <UiLabel>{{ text('atm.fee') }}</UiLabel>
    </UiTooltip>

Due proprietà e basta: `text`, già tradotto (R14), e `side`, che è **sopra** se nessuno dice
altrimenti. `side` non è geometria nel senso di R16 — non è uno spazio, una direzione di
impaginazione né una misura: è **da che parte**, e il ripiego quando da quella parte non ci sta lo
dichiara il CSS, non chi chiama.

Si apre col puntatore **e** col fuoco della tastiera. Sono due righe in più e senza di loro il
tooltip esiste solo per chi usa il mouse, che è metà del punto di averlo scritto a mano invece di
lasciare fare al browser.

### Dove vanno le spiegazioni, oggi

Sette punti, e tutti e sette hanno la stessa forma: una parola corta che porta una regola dietro.

| Dove                              | Cosa dice                                                       |
| --------------------------------- | --------------------------------------------------------------- |
| La commissione del bancomat       | che è fissa, e che si paga a ogni operazione                    |
| La capienza del caveau            | che i contanti non ci stanno più, e cosa succede al reddito     |
| La tracciabilità di uno strumento | cosa vuol dire lasciare traccia, e perché è la scelta del gioco |
| I cinque riquadri del cruscotto   | cosa conta ciascuno dei cinque numeri                           |

Sette chiavi nuove, in due lingue. Nessuna delle sette inventa una regola di gioco: dicono a parole
ciò che il codice fa già, ed è la ragione per cui si possono scrivere adesso invece che quando il
dominio esisterà.

### R17, e cosa **non** vieta

Vieta l'attributo `title` dentro il `<template>` di un `.vue` di `src/`. Non tocca `index.html`, dove
`<title>` è il nome della finestra, e non tocca `tests/`, dove una stringa `title=` in un finto
componente è il modo in cui il rilevatore si prova da sé.

⚠️ **Parziale, e lo dichiara**, come `no-literal-in-template`: guarda l'attributo scritto nel
sorgente. Un `title` messo a runtime con `setAttribute` le sfugge. Prende la forma con cui il difetto
nasce davvero, che è quella comoda.

## Invarianti

Nessuno nuovo. R17 è una regola, non un invariante: dice cosa non si scrive, non cosa deve restare
vero del sistema.

## Fuori scope

- **Il menu, la finestra modale, il pannello laterale.** L'ADR 0032 li **sblocca** e questa delega
  non li costruisce: il grilletto di ciascuno è il primo che serve davvero.
- **Il tooltip che spiega una regione.** Il pezzo si àncora a una scatola in linea, ed è dichiarato
  nell'ADR. Spiegare una regione è un'altra cosa e ha un altro nome.
- **Una spiegazione obbligatoria su ogni cifra.** Sarebbe la lettura larga di «per tutto», e vuole
  una cinquantina di frasi di prodotto che oggi non esistono. Il meccanismo è lo stesso: il giorno in
  cui quelle frasi ci sono, la regola che le pretende è ~15 righe di test. Va nel registro YAGNI col
  suo grilletto.
- **Il ritardo prima dell'apparizione fatto a tempo di JavaScript.** È una transizione CSS con il suo
  token, e chi ha chiesto meno movimento ne riceve meno — `prefers-reduced-motion` è già dichiarato
  in `tokens.css`.

## Definizione di fatto

- [x] `npm run verify` verde: **726 test, 69 file**
- [x] `npm run verify:release` verde
- [x] R17 rotta di proposito: si rimette un `title=` su un componente, e il test diventa rosso con il
      file e l'attributo stampati nel diff
- [x] **Il presupposto dell'ADR 0032 verificato a runtime, non supposto:** l'applicazione parte, e la
      versione di Chromium che Electron porta è scritta in [qualita.md](../qualita.md) con la data
      accanto, insieme all'esito delle due funzionalità
- [x] Il tooltip provato **con la tastiera**: si arriva col tabulatore, la frase appare, `Esc` la
      chiude. Provato alla chiusura, dentro il gioco
- [x] Il tooltip provato **vicino al bordo**: misurato, si ribalta sotto (`flip-block` scatta)
- [x] Il tooltip provato **dentro un antenato con `overflow: hidden`**: misurato, esce dal ritaglio
      e resta visibile. È il caso per cui la scelta del livello superiore esiste, e regge
- [x] Guardato a occhio **nei due temi**, con l'interruttore di D024 — pagato insieme alla spunta
      gemella di D024, nella stessa sessione
- [x] `docs/tracciabilita.md`: R17 ha la sua riga e il suo meccanismo
- [x] `docs/architettura.md`: la tabella delle regole ha R17
- [x] `docs/roadmap-fette.md`: la voce «il sistema di sovrapposizioni» **esce**, con scritto cosa
      l'ha fatta scattare; entrano le voci del fuori scope
- [x] `docs/adr/README.md` e `docs/delega/README.md`: l'ADR e questa delega nei rispettivi indici
- [x] `docs/stato.md` rigenerato

## Trappole note

- **Il `title` che rientra dalla finestra.** È gratis, funziona, e nessuno lo nota in review. R17
  esiste per questo, e va **rotta di proposito** o non si sa se guarda davvero.
- **Il tooltip che diventa il posto dove finisce ciò che non si sa dove mettere.** Una frase
  importante nascosta dietro il puntatore è una frase che metà dei giocatori non legge mai. La regola
  è quella di INV-21, letta al contrario: ciò che spiega un **rifiuto** sta sempre a schermo. Il
  tooltip aggiunge contesto, non lo sostituisce.
- **`z-index` scritto per far funzionare qualcosa.** Se serve, il livello superiore non è stato usato
  e l'ADR 0032 è già aggirato. Non c'è un test: c'è che nel kit non esiste una sola riga di
  `z-index`, e la prima si vede nel diff.
- **Il ripiego provato solo al centro dello schermo.** Un tooltip vicino al bordo è l'unico caso in
  cui il posizionamento può sbagliare, ed è l'unico che non si incontra provando a caso.
- **La cifra che balla quando il tooltip appare.** Il pezzo avvolge chi lo apre, quindi cambia il
  contenitore di un'etichetta che sta in una striscia larga così. Se il testo si sposta di un pixel
  quando ci si passa sopra, è la scatola dell'involucro che va sistemata, non il tooltip.

## Come è andata

Eseguita il 2026-08-21, nell'albero di lavoro. R17 è stata rotta di proposito — un `title="Solvent"`
rimesso su `AppNav` — e il test l'ha stampata col file e il tag.

**Il presupposto dell'ADR 0032, chiesto al motore invece che al changelog:** Electron **43.4.1**,
Chromium **150.0.7871.224**. I numeri stanno in [qualita.md](../qualita.md) con la data.

### Correzioni rispetto a com'era scritta

**1. `anchor-name: var(--nome)` non si risolve, e la prima stesura ci si appoggiava.** Il piano era
generare un nome di ancora per istanza con `useId()` e passarlo al CSS attraverso una proprietà
personalizzata. È il modo consueto di far entrare un valore dinamico nel CSS, e per queste due
proprietà **non funziona**: il motore non sostituisce la `var()`, l'ancora resta indefinita e la
bolla finisce nell'angolo in alto a sinistra. Misurato: con `var()` la bolla è a `0,0` mentre chi la
apre è a `79,79`; con il nome scritto a mano è a `26,12`, cioè sopra e centrata.

La versione buona è **più semplice** di quella che non funzionava: `anchor-scope` richiude il nome
nel sottoalbero di chi lo dichiara, quindi tutte le istanze usano lo stesso nome scritto nel CSS e
ognuna vede solo la propria. Sparisce `useId()`, sparisce la proprietà personalizzata, sparisce la
regex che ripuliva l'identificatore. Provato con due istanze accanto: ciascuna bolla sta sopra la
propria.

**2. Niente token per il ritardo, perché non c'è un ritardo.** La delega prevedeva una riga in
`tokens.css` per il tempo di apparizione. Il ritardo di circa un secondo è **uno dei motivi** per
cui l'attributo del browser non basta, quindi riprodurlo sarebbe stato copiare il difetto; e una
dissolvenza attraverso `display` vuole `@starting-style` e `transition-behavior`, cioè tre righe per
un effetto che D023 aveva già messo fuori scopo. `tokens.css` non è stato toccato da questa delega.

**3. Le chiavi sono dieci, non sette.** Le sette contate erano commissione, capienza, tracciabilità
e i cinque riquadri — che fanno otto — e mancavano le due della striscia della testata, che sono
proprio quelle da cui questa delega è nata. Il conto giusto è **dieci**, in due lingue. Il budget
diceva ~120 righe di sorgente: le venti stringhe in più sono la differenza, e sono dichiarate qui
invece di sparire nel totale.

**4. `title` è anche il nome di una proprietà, e il primo rilevatore le avrebbe confuse.**
`UiPanel` e `UiHeading` hanno una proprietà che si chiama `title`, e `<UiPanel :title="…">` è
legittimo. Un test che cercasse `title=` avrebbe reso rossi cinque file corretti — cioè sarebbe
stato disattivato entro un giorno. A separare i due casi è l'iniziale del tag: minuscola è un
elemento del documento, maiuscola è un componente. È la stessa convenzione con cui Vue li distingue,
e ha i suoi test nel rilevatore.

### Dentro il gioco, col puntatore e col tabulatore

Fuori dall'applicazione era già verificato — stessa marcatura, stesso CSS, ancoraggio, ribaltamento
e nessun ritaglio. Alla chiusura è stato provato **dentro**, con `npm run dev`, e regge:

| Cosa                              | Cosa è successo                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Puntatore sull'etichetta CONTANTI | la bolla si apre `side="bottom"`, centrata sull'ancora — 324,5 contro 324,5 — e **esce dalla testata** |
| Tabulatore su un riquadro         | il fuoco arriva sull'involucro, `:focus-visible` disegna il contorno, la bolla si apre `side="top"`    |
| `Esc`                             | la bolla si chiude e il fuoco resta dov'è; un secondo `Esc` non rompe niente                           |
| Puntatore, nel tema scuro         | fondo `rgb(32,30,24)`, inchiostro `rgb(190,184,168)`, bordo `rgb(48,45,37)` — leggibile                |

Le dieci spiegazioni ci sono tutte e dieci sulla home. Il ribaltamento vicino al bordo non si è
ripresentato in queste posizioni, ed è giusto così: era già misurato fuori, e qui c'era posto.

**Il livello superiore fa la cosa per cui è stato scelto, e si vede nella prima riga:** la bolla
della striscia sfonda il fondo della testata e si stende sul contenuto sotto, che è esattamente ciò
che un riquadro dentro il flusso non potrebbe fare.
