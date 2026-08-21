# D024 — Il telaio: dove ogni schermata si attacca

- **Stato:** **Chiusa** — scritta ed eseguita il 2026-08-21, rileggendo il canvas di Claude Design
  da cui [D023](D023-il-design-system.md) aveva preso le fondamenta lasciando qui l'impaginazione.
  Chiusa lo stesso giorno sul ramo `d024-d025-telaio-e-tooltip`, commit `da annotare`, insieme a
  [D025](D025-il-tooltip.md): le due spunte che restavano aperte erano una sola sessione a occhio.
  Vedi _Come è andata_ in fondo
- **Dipende da:** [D023](D023-il-design-system.md) — il telaio è fatto dei pezzi del kit, e senza il
  kit sarebbe il secondo posto del progetto in cui nascono dei colori. **Non** dipende da
  [D018](D018-la-scheda-di-dominio.md), che scrive solo documenti
- **Sblocca:** ogni schermata che verrà. Da qui in poi una destinazione nuova è una riga in un
  elenco, non una linguetta in più scritta a mano nel guscio
- **ADR vincolanti:** [0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md) e
  [0018](../adr/0018-la-home-e-un-atm.md). Due nuovi: **0030** e **0031**
- **Preferenza:** [P2](../prodotto/preferenze.md) guadagna due righe — l'impaginazione, e il tema
  che adesso si può scegliere
- **Regole:** una nuova, **R16** — la porta l'ADR 0030, e senza di lei quell'ADR sarebbe una
  convenzione da ricordare. Un invariante nuovo: **INV-22**
- **Budget:** ~370 righe di sorgente nuove e ~70 di test. La migrazione ne **toglie** una sessantina
  fra `App.vue` e i componenti che tocca: il netto atteso è circa 310

## Obiettivo

Dare all'applicazione il telaio del design — colonna a sinistra, testata appiccicata, contenuto — e
metterci dentro **solo** ciò che il codice ha davvero.

## Perché esiste, e perché adesso

Oggi le due schermate si scelgono con una fila di linguette, dichiarata dentro `App.vue` insieme al
proprio CSS. Ha funzionato con due destinazioni, e con due destinazioni era la scelta giusta: un
router per due schermate senza indirizzo da condividere sarebbe stata una dipendenza in cerca di un
problema (ADR 0015).

Non regge la terza. Una linguetta in più è una riga in più in `App.vue`, il suo stile è già lì
accanto, e non esiste niente che impedisca alla quarta di essere scritta senza una schermata dietro.
È la forma in cui il progetto precedente ha accumulato il difetto **A17** — pezzi costruiti prima
del dominio che dovevano mostrare.

**E la fetta 03 arriva.** Il caveau è chiuso, la scheda di dominio è pronta per l'esecuzione: il
prossimo dominio porta la prima destinazione nuova da quando ce ne sono due. Il momento per decidere
dove si attacca è **prima** che si attacchi, che è l'argomento di [D001](D001-tooling-e-gate.md)
usato di nuovo: le regole vengono prima del codice che governano.

**Il telaio è anche l'unico posto da cui un saldo si vede sempre.** Oggi sulla schermata Statistiche
i contanti e la carta spariscono: per sapere quanto si ha bisogna tornare alla home. La striscia
degli strumenti del design risolve esattamente quello, e non è una decorazione — è il numero che il
gioco chiede di guardare mentre si fa altro.

## Cosa il design dice, e cosa ne prendiamo

Il canvas disegna il telaio in modo netto, ed è la parte che [D023](D023-il-design-system.md) ha
lasciato indietro di proposito:

- una **colonna** a sinistra, larga 238px, appiccicata e alta quanto la finestra: marchio in alto,
  destinazioni in mezzo, controlli in basso
- una **testata** appiccicata sopra il contenuto, con le briciole a sinistra
- sotto le briciole, una **striscia di strumenti**: per ciascuno un quadratino del suo colore, la
  sua etichetta maiuscola e la sua cifra tabulare
- ogni schermata si apre con un **titolo** e una frase che dice a cosa serve
- in fondo alla colonna, l'**interruttore del tema**

Prendiamo tutti e cinque. Non prendiamo **niente altro**, ed è la parte che conta: il canvas disegna
diciotto domini, una ricerca, un contatore di calore, otto caselle di attenzione e un allarme del
fisco. Di quelle cose il codice non ha una riga, e costruirne il vestito adesso è il difetto **A17**
alla lettera — la trappola che D023 chiamava «la più grossa che questo progetto abbia incontrato».

La regola operativa di questa delega è una sola: **una casella del telaio si disegna solo se un
selettore dello store la può riempire oggi.** Le altre non si disegnano vuote: non si disegnano.

## Cosa trovi già fatto

- **Il kit c'è**, e questa delega ne aggiunge tre pezzi, non ventitré. Superficie, etichetta, cifra,
  prosa, pulsante e targhetta reggono già tutto ciò che sta dentro il telaio.
- **I due temi ci sono**, completi, in una dichiarazione sola con `light-dark()`. Manca soltanto chi
  li sceglie: `data-theme` sull'elemento radice è già lo scavalco, scritto in `tokens.css` da D023 e
  finora mai usato da nessuno.
- **Le due destinazioni ci sono già come elenco** — `SCREENS` e `SCREEN_KEYS` dentro `App.vue` — con
  le loro chiavi tradotte. Questa delega le **sposta**, non le inventa.
- **`tests/rules/import-graph` c'è**, e l'arco `APP --> CMP` va disegnato in
  [architettura.md](../architettura.md) o il test è rosso per costruzione (C13).
- **`tests/rules/product-identity` c'è**, e dichiara che chi aggiunge un posto in cui il nome del
  prodotto compare lo aggiorna nello stesso commit. Il marchio della colonna è quel posto.

## Da produrre

| File                                         | Contenuto                                                        |
| -------------------------------------------- | ---------------------------------------------------------------- |
| `src/renderer/ui/UiShell.vue`                | il telaio a tre regioni: colonna, testata appiccicata, contenuto |
| `src/renderer/ui/UiReadout.vue`              | l'etichetta sopra la cifra, col quadratino dello strumento       |
| `src/renderer/ui/UiHeading.vue`              | il titolo di una schermata e la frase che la spiega              |
| `src/renderer/ui/theme.ts`                   | quale tema, e come si cambia. Nient'altro                        |
| `src/renderer/ui/tokens.css`                 | due token nuovi: il settimo passo di spazio, e la larghezza      |
| `src/renderer/components/screens.ts`         | le destinazioni, con la loro chiave tradotta                     |
| `src/renderer/components/AppNav.vue`         | la colonna: marchio, destinazioni, interruttore                  |
| `src/renderer/components/AppHeader.vue`      | le briciole e la striscia degli strumenti                        |
| `src/renderer/components/StatTile.vue`       | passa a `UiReadout` invece di comporlo a mano                    |
| `src/renderer/App.vue`                       | perde le linguette, monta il telaio, mappa schermata → vista     |
| `src/renderer/views/HomeView.vue`            | guadagna il proprio titolo                                       |
| `src/renderer/views/StatsView.vue`           | guadagna il proprio titolo                                       |
| `src/renderer/i18n/it.ts` e `en.ts`          | le chiavi nuove, in tutte e due                                  |
| `tests/renderer/theme.test.ts`               | le due funzioni pure di `theme.ts`                               |
| `tests/rules/ui-kit-has-no-geometry.test.ts` | **R16** — nessun pezzo del kit prende la geometria               |
| `tests/rules/product-identity.test.ts`       | il posto nuovo in cui il nome vive: il dizionario                |
| `docs/adr/0030-*.md` e `0031-*.md`           | le due decisioni che questa delega prende                        |

### I tre pezzi nuovi del kit, e perché proprio tre

Il criterio non cambia ed è quello dell'[ADR 0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md): un
pezzo entra nel kit quando lo disegnano **due** componenti. Tre lo soddisfano, e uno che sembrava
soddisfarlo no.

- **`UiShell`** — il telaio. È un pezzo solo con tre regioni fisse, non un contenitore generico: la
  differenza è l'argomento dell'[ADR 0030](../adr/0030-il-telaio-e-una-forma-non-un-contenitore.md),
  e senza quell'argomento questo componente sarebbe `UiRow` con un altro nome. A tenerlo fermo non è
  l'argomento ma **R16**: la prima proprietà `gap` o `direction`, in qualunque file del kit, è rossa.
- **`UiReadout`** — etichetta sopra cifra. Lo disegnano due: la striscia della testata e il riquadro
  del cruscotto, che oggi lo compone a mano con tre tag. `StatTile` ci passa dentro, e ci **perde**
  righe.
- **`UiHeading`** — titolo e frase. Lo disegnano due: le due viste. Nel canvas apre ogni schermata.
- **`UiMeter` non entra**, e vale la pena scriverlo. La barra esiste già in `CashPanel`, col suo
  commento che dice «entra in `ui/` il giorno in cui la disegnano due». Il secondo disegno sarebbe
  il contatore di calore, che è fuori scope. Quindi resta dov'è: una regola che si applica solo
  quando fa comodo non è una regola.

### I due token nuovi

Il telaio è la prima cosa più grande di un pannello, e la scala a sei passi di D023 è stata ricavata
**dagli interni** dei pannelli: il suo passo più largo è 18px, e il contenuto del design respira a 24. Entrano due valori, tutti e due usati:

- `--space-7: 24px` — il margine del contenuto e della testata
- `--nav-width: 238px` — la larghezza della colonna, che è una misura di impaginazione e non di
  spazio: sta in un token proprio invece di allungare la scala fino a duecento

Il commento in testa a `tokens.css` dice «sei passi» e diventa falso: va aggiornato nello stesso
commit. Nessun gate lo vede, ed è esattamente la ragione per cui sta scritto qui.

### Cosa la colonna e la testata mostrano davvero

Ogni casella, con il selettore che la riempie. Se una riga non avesse la seconda colonna, quella
casella non si costruirebbe.

| Casella                       | Da dove viene                                              |
| ----------------------------- | ---------------------------------------------------------- |
| Marchio, e la sua iniziale    | `app.name`, la stessa parola in tutte e due le lingue      |
| Le destinazioni               | `SCREENS`, la stessa lista che sceglie la vista            |
| L'interruttore del tema       | `useTheme()`                                               |
| Le briciole                   | `app.name` e la chiave della destinazione corrente         |
| La striscia: contanti e carta | `balances.cash`, `balances.card`, e `poolName` per il nome |

Cinque righe. Il canvas ne disegna una dozzina, e le altre sette non hanno una seconda colonna.

### `App.vue`, e l'unica cosa che il tipo deve impedire

Oggi il guscio sceglie la vista con un `v-if` e un `v-else`. Con due destinazioni funziona; con tre
smette di funzionare **in silenzio** — il terzo nome finisce in `SCREENS`, compare nella colonna, e
al clic si vede la seconda vista.

La mappa `Record<Screen, Component>` chiude il caso a compilazione: una destinazione senza schermata
**non compila**. È INV-22, ed è 🔒 per la stessa ragione per cui INV-13 lo è — il tipo lo pretende, e
nessuna review deve ricordarselo.

## Invarianti

- **INV-22 — ogni voce della colonna ha la sua schermata.** 🔒, imposto dal `Record` totale in
  `App.vue`. È la difesa contro A17 messa dove il difetto entrerebbe: non si può elencare un dominio
  che non esiste, perché non ci sarebbe niente da montare quando lo si preme.

## Fuori scope

Tutto ciò che segue è **nel canvas** e non entra adesso. Ognuno prende una riga nel
[registro YAGNI](../roadmap-fette.md) con il proprio grilletto, o ne ha già una.

- **Le diciotto destinazioni di dominio, e i gruppi che le raccolgono.** La colonna nasce piatta
  perché due voci non fanno due gruppi. Il grilletto dei gruppi è la terza destinazione.
- **I simboli accanto alle destinazioni.** Nel canvas ogni dominio ne ha uno. Sceglierne due adesso
  significherebbe inventarli: entrano col primo dominio che ne porta uno suo.
- **La ricerca, il contatore di calore, le caselle di attenzione, l'allarme del fisco.** Nessuno dei
  quattro ha un numero dietro.
- **La colonna che si chiude.** Il canvas disegna il comando; il grilletto è la prima finestra
  troppo stretta per tenerla aperta.
- **L'indicatore del salvataggio nel piede della colonna.** `savedAt` esiste e la schermata
  Statistiche lo mostra già: un secondo posto è una scelta di prodotto, non di impaginazione.
- **Il selettore della lingua.** `DEFAULT_LOCALE` è un valore di codice, e il grilletto è la
  schermata impostazioni, che ce l'ha già.
- **Il tema che si ricorda fra due partite.** È l'ADR 0031, e la ragione sta lì.
- **La plancia con i riquadri riordinabili**, gli stati vuoti, il sistema di sovrapposizioni e le
  schermate di dominio: le loro righe nel registro YAGNI restano dove sono, intatte.

## Definizione di fatto

- [x] `npm run verify` verde: **726 test, 69 file**
- [x] `npm run verify:release` verde
- [x] INV-22 rotto di proposito: si aggiunge una destinazione a `SCREENS` senza la sua vista, e
      `typecheck` diventa rosso. Provato, non supposto
- [x] R16 rotta di proposito: si dà a `UiShell` una proprietà `gap`, e il test diventa rosso con il
      nome della proprietà stampato nel diff
- [x] `docs/architettura.md`: l'arco `APP --> CMP` è disegnato, il nodo `UI` continua a non avere
      frecce in uscita, e la tabella delle regole ha la riga di R16
- [x] `tests/rules/import-graph` verde nei due versi, senza toccare la mappa `NODES` — nessuna
      cartella nuova nasce qui
- [x] `tests/rules/product-identity` ha la sua verifica sul dizionario, e il conto dei posti in cui
      il nome vive è aggiornato nel commento
- [x] `docs/tracciabilita.md`: R16 e INV-22 hanno la loro riga e il loro meccanismo
- [x] `docs/prodotto/preferenze.md`: P2 dice l'impaginazione, e dice che il tema adesso si sceglie
- [x] `docs/roadmap-fette.md`: la riga dell'interruttore del tema **esce**, con scritto perché; le
      voci nuove del fuori scope entrano col loro grilletto
- [x] `docs/adr/README.md` e `docs/delega/README.md`: i due ADR e questa delega nei rispettivi indici
- [x] `docs/stato.md` rigenerato con `npx vitest run tests/rules/project-state -u`
- [x] **Le due schermate guardate a occhio nei due temi, e l'interruttore premuto nei due versi.**
      Nessun gate lo fa. Fatto alla chiusura, dentro `npm run dev`: quattro combinazioni guardate —
      home chiara, home scura, statistiche chiare, statistiche scure — e a ogni clic `data-theme`,
      la parola sull'interruttore e i colori calcolati misurati insieme all'immagine

## Trappole note

- **La colonna vuota chiede di essere riempita.** Due voci in una barra alta quanto la finestra
  sembrano un errore, e la reazione istintiva è aggiungere le altre sedici «per vedere come viene».
  È A17, e stavolta ha una difesa: INV-22 non lo lascia compilare.
- **La striscia degli strumenti che diventa un cruscotto.** Ha già due caselle e ne accetterebbe
  dieci. Il tetto lo dà la stessa ragione di INV-12: ciò che sta sempre a schermo non cresce, perché
  il posto per crescere è una schermata.
- **`UiShell` che diventa `UiRow`.** La prima proprietà `gap` o `direction` è il momento in cui
  questo pezzo smette di essere una forma e diventa il contenitore generico che l'ADR 0028 ha
  scartato con la ragione. Se serve uno spazio, è una riga di CSS scoped dentro chi lo vuole.
- **Il tema guardato una volta sola.** L'interruttore rende facile guardarli tutti e due, ed è
  proprio per questo che è facile dimenticarsene: chi lo aggiunge lo prova una volta e passa oltre.
  La definizione di fatto lo chiede apposta, come lo chiedeva D023 — e a D023 è servito al primo
  colpo, trovando un pulsante indistinguibile nello scuro.
- **`data-theme` messo sul posto sbagliato.** `tokens.css` lo dichiara su `:root`. Scritto sul
  `<body>` o su un div del telaio non fa niente e non dà errore: si vede solo guardando.

## Come è andata

Eseguita il 2026-08-21, nell'albero di lavoro. `npm run verify` è verde con **726 test in 69 file**,
`verify:release` compila. Le due regole nuove sono state rotte di proposito, una per una:

| Cosa si rompe                        | Cosa diventa rosso                                       |
| ------------------------------------ | -------------------------------------------------------- |
| Una destinazione in più in `SCREENS` | `typecheck`, su `App.vue`: «Property 'vault' is missing» |
| Una proprietà `gap` su `UiReadout`   | R16, col nome della proprietà stampato nel diff          |

### Correzioni rispetto a com'era scritta

**1. Il titolo di schermata sta nel guscio, non nelle viste.** La delega diceva «`views/*.vue`:
ognuna guadagna il proprio titolo». Farlo lì significa la stessa coppia di righe in ogni vista
futura, e una vista che dimentica il titolo non fa rumore. In `App.vue` è **una** riga per tutte le
destinazioni, letta da `SCREEN_WORDING` — e le due viste non sono state toccate affatto.

**2. R16 non era prevista, e senza di lei l'ADR 0030 non decideva niente.** La delega dichiarava
«nessuna regola nuova». Scrivendo l'ADR è venuto fuori che la distinzione fra una **forma** e un
**contenitore** senza un meccanismo è una convenzione da ricordare — cioè la classe di regola che
questo progetto ha visto rompersi tre volte. Sono venticinque righe di test, e sono il motivo per
cui `UiShell` non diventerà `UiRow`.

**3. Una spiegazione in italiano dentro un `<template>` rende rosso `english-identifiers`.** Il
commento HTML che spiegava perché la striscia non colora le cifre è finito nel mirino di quel test,
che legge i nodi di testo e non distingue un commento del template da un identificatore. Il posto
delle spiegazioni è il blocco `<script>`, dove il rilevatore toglie i commenti prima di guardare.
Non è un difetto del test: è che in un `.vue` il `<template>` non è codice.

**4. Il piede della colonna esiste e sta dove deve, e l'ho creduto assente per venti minuti.** La
cattura della finestra non dipingeva l'ultima banda in fondo, quindi l'interruttore del tema
sembrava non esserci. A dirlo è stata una misura presa dentro la pagina —
`aside` alto 697,6 su una finestra di 698, `.foot` a 652 alto 45,6 — non un'altra occhiata. Vale la
pena scriverlo: **una schermata che non si vede non è una schermata che non c'è**, e l'unico modo di
distinguere i due casi è chiedere al documento invece che all'immagine.

### L'interruttore, premuto

La spunta che restava è stata pagata alla chiusura, dentro `npm run dev`. Il sistema operativo
sceglieva `dark` e `data-theme` non c'era: da lì, quattro clic e quattro combinazioni.

| Dove        | Clic         | `data-theme` | Parola sull'interruttore | Fondo              |
| ----------- | ------------ | ------------ | ------------------------ | ------------------ |
| Statistiche | —            | `light`      | CHIARO                   | `rgb(237,234,227)` |
| Statistiche | interruttore | `dark`       | SCURO                    | `rgb(16,15,12)`    |
| Home        | destinazione | `dark`       | SCURO                    | `rgb(16,15,12)`    |
| Home        | interruttore | `light`      | CHIARO                   | `rgb(237,234,227)` |

Le due schermate cambiano tutte e due, e la parola sull'interruttore dice **quale tema è acceso** —
non cosa succede premendolo, che è la scelta dell'[ADR 0031](../adr/0031-il-tema-si-sceglie-e-non-si-ricorda.md).
Il piede della colonna c'è, e stavolta si vede anche nell'immagine: la correzione 4 diceva il
contrario perché la cattura non dipingeva l'ultima banda, e adesso la dipinge.

**Due clic ravvicinati sullo stesso punto toggano due volte**, non una: provato apposta, perché una
sequenza scritta a mano ne aveva persi uno e sembrava un difetto del pulsante. Non lo era — era la
sequenza. Il pulsante conta due `click` e torna dov'era.
