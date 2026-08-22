# D033 — Il bancomat è una pagina

- **Stato:** Chiusa — commit `459e78b`, ramo `d033-il-bancomat-e-una-pagina`, che parte da `main`.
  Scritta il 2026-08-21, eseguita il 2026-08-22. **Non spezzata**, e l'intestazione chiedeva di
  dichiararlo: non esiste uno stato intermedio che compili — `home` sparisce solo se `atm` e
  `board` esistono nello stesso commit (INV-22 e il `Record` totale su `Screen`), e la rinomina
  i18n attraversa le due pagine e la carta. Un ramo, cinque commit sequenziati. Le correzioni
  rispetto a com'era scritta sono in fondo
- **Stato precedente:** **Aperta** — scritta il 2026-08-21, non eseguita. Il ramo si chiami
  `d033-il-bancomat-e-una-pagina` e parta da **`main`**: il 2026-08-21 tutti i rami di lavoro sono
  stati fusi e cancellati, quindi `d032-la-commissione-scala-il-pavimento-no` — che questa riga
  nominava — non esiste più come etichetta, e il suo contenuto è in `main`
- **Dipende da:** [D032](D032-la-commissione-scala-il-pavimento-no.md), che porta la commissione in
  percentuale — questa pagina la **disegna** in ogni anteprima e sulla carta;
  [D026](D026-dove-si-attacca-un-dominio.md), che ha dato a ogni dominio la sua pagina;
  [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md), che ha portato il grafico che qui
  trasloca
- **Non dipende da** [D031](D031-la-sovrapposizione-e-un-pezzo-del-kit.md), e la sua intestazione
  dice il contrario. Vedi _Perché D031 non è più a monte_
- **Sblocca:** [D034](D034-le-serie-degli-strumenti.md), i grafici degli strumenti: hanno bisogno
  di una pagina dove stare, e quella pagina è il cruscotto che questa delega separa
- **ADR vincolanti:** [0018](../adr/0018-la-home-e-un-atm.md) — **che questa delega supera**,
  [0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md),
  [0033](../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md),
  [0030](../adr/0030-il-telaio-e-una-forma-non-un-contenitore.md),
  [0037](../adr/0037-il-telaio-non-scorre-il-contenuto-si.md)
- **Produce:** ADR **0040** — _Il bancomat e il cruscotto sono due pagine_, che manda l'ADR 0018 in
  `Superata`. Sarebbe il primo `Superata` del progetto: oggi ne conta zero
  ([stato.md](../stato.md)). Era 0039 quando questa delega è stata scritta: D031 ha chiuso prima e
  quel numero se l'è preso
- **Fonte del disegno:** [design/mockups/solvent-canvas.dc.html](../design/mockups/solvent-canvas.dc.html),
  artboard `ATM`, righe 1702–2453. **Si legge nel sorgente**, con il metodo del
  [suo README](../design/mockups/README.md)
- **Regole:** R05 (niente logica nei `.vue`), R14 (il kit non conosce chiavi i18n), R16 (niente
  geometria nel kit), R17 (una spiegazione è `UiTooltip`), R18 (`DOMAIN_SCREENS` totale), R21 (zero
  `z-index`), INV-11, INV-22 (una destinazione senza schermata non compila)
- **Budget:** ~450 righe. È la delega più grande dopo il kernel, e la ragione è che tocca tre cose
  insieme — la lista delle destinazioni, la pagina nuova, la carta. Chi la esegue dichiari se la
  spezza

## Obiettivo

Dare al bancomat la pagina che il canvas gli disegna, e al cruscotto la sua.

## Perché esiste

**La home fa due lavori.** È la pagina del bancomat — carta, contanti, deposita e preleva — **e** il
cruscotto: cinque riquadri, il grafico, le operazioni recenti. L'[ADR 0018](../adr/0018-la-home-e-un-atm.md)
lo ha deciso apposta, con una domanda giusta:

> come si impedisce al cruscotto di mangiarsi il bancomat, che è quello che succede sempre — perché
> le statistiche crescono e il bancomat no.

La risposta che si era data era un **tetto**: massimo sei riquadri, verificato da
`tests/rules/home-tiles`. Ha retto una fetta. Non regge la seconda, e il motivo è nella delega
accanto: [D034](D034-le-serie-degli-strumenti.md) porta due grafici nuovi, e un grafico non è un
riquadro — il tetto non lo conta, e non lo conterebbe comunque perché nessun numero di riquadri
descrive quanta pagina occupa un grafico.

**Il canvas aveva già dato l'altra risposta**, ed è quella strutturale: due pagine. `ATM` è una
destinazione, `Board` è un'altra. Il cruscotto può crescere quanto vuole senza toccare il bancomat,
perché non gli sta più sopra.

Non è un cambio di idea sull'ADR 0018: è la sua domanda, con una risposta che regge più a lungo.
Il tetto di sei riquadri difendeva il bancomat **dentro** una pagina condivisa; separarle rende la
difesa inutile invece che più severa.

### Perché D031 non è più a monte

[D031](D031-la-sovrapposizione-e-un-pezzo-del-kit.md) dichiara di sbloccare «D032, la rifinitura del
bancomat», con questa ragione:

> il canvas disegna menu e riquadri sovrapposti in quasi ogni schermata, e costruirli uno per volta
> dentro le pagine è il modo in cui il kit smette di esistere

È vero del canvas nel suo insieme, e **non è vero della sua pagina `ATM`**. Letta nel sorgente,
righe 1702–2453, quella pagina non ha un solo elemento nel livello superiore: nessun menu, nessun
riquadro che si apre, nessun popover. Ha due colonne, dei riquadri fermi e una carta che gira.

L'unica sovrapposizione che questa pagina usa è `UiTooltip`, che **esiste già** da
[D025](D025-il-tooltip.md) ed è quello che R17 impone.

Ne discende l'ordine: le due deleghe sono **indipendenti** e possono chiudersi in qualunque ordine.
D031 resta aperta con il suo difetto vivo — il pannello dei cheat che non si chiude — e va fatta,
ma non è questa a doverla aspettare.

## La forma

### 1 · Le destinazioni diventano cinque

| Oggi                              | Dopo                                                    |
| --------------------------------- | ------------------------------------------------------- |
| `home` — bancomat **e** cruscotto | `atm` — solo il bancomat<br>`board` — solo il cruscotto |
| `income`, `vault`, `stats`        | invariate                                               |

I gruppi della colonna seguono la divisione che c'è già — dove si **fa** qualcosa e dove si
**guarda** ciò che è successo (D026) — e la separazione la rende più netta invece di romperla:

```
Fare    →  atm · income · vault
Guardare →  board · stats
```

`DOMAIN_SCREENS.atm` passa da `'home'` a `'atm'`, e la frase che oggi lo giustifica in
`screens.ts` — _«`atm` sta su `home` e non su una destinazione sua: la home **è** la pagina del
bancomat»_ — va **riscritta**, non cancellata: è il commento che spiegava una scelta che questa
delega ribalta.

**`board` non è un dominio**, e la regola lo sopporta già: `DOMAIN_SCREENS` va da cartella di
dominio a destinazione, non il contrario, quindi una destinazione senza dominio è legittima —
`stats` lo è da sempre. Un dominio senza destinazione non compila, e resta così.

### 2 · La pagina del bancomat, due colonne

Il canvas la dà a 12 colonne: **7 a sinistra** (l'operazione), **5 a destra** (la carta e lo
storico). Sotto la larghezza in cui due colonne stanno strette, diventano una — e la colonna
dell'operazione va **prima**, perché è ciò per cui si apre questa pagina.

**Colonna sinistra — si fa.**

| Pezzo                | Cosa                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Titolo e sottotitolo | «Il ponte fra contanti e carta. Trattiene una commissione in tutte e due i versi — e il verso che scegli è una scelta su quanto si vede.» |
| `FROM ⇄ TO`          | i due strumenti affiancati, ciascuno col proprio saldo e la propria nota. Il pulsante centrale **scambia**                                |
| Importo              | un campo che si **digita**, con i tasti rapidi sotto e `MAX`                                                                              |
| Anteprima            | «Prima di confermare — le righe, non il totale»: i movimenti che il comando applicherà                                                    |
| Rifiuto              | un blocco suo: `Rifiutato · CODICE` e la frase che spiega                                                                                 |
| Conferma             | il pulsante, con la nota di cosa succede premendo                                                                                         |

**Colonna destra — si guarda.**

| Pezzo                | Cosa                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Operazioni recenti   | `OperationList`, che **esiste già** e si riusa senza toccarla                                                    |
| La carta             | l'oggetto, col fronte del canvas e il retro che dice cosa fa lo strumento                                        |
| La nota sui contanti | «I contanti non hanno un oggetto e non hanno un retro: non lasciano traccia, hanno un tetto, non rendono niente» |

L'allarme del caveau (`VaultAlarm`) **resta su questa pagina**, per la ragione già scritta in
[D026](D026-dove-si-attacca-un-dominio.md): il muro si incontra giocando, non amministrando — e si
gioca qui.

`CashPanel` invece **sparisce**, e non è una perdita: era il riquadro che diceva quanti contanti ci
sono e quanto ci sta ancora. Nel disegno del canvas quelle due cose sono il lato `CASH` del blocco
`FROM ⇄ TO`, cioè sono già dette dove servono. Tenerlo sarebbe lo stesso numero in due punti della
stessa schermata.

### 3 · Le tre cose che il canvas chiede e il codice non fa

**a. L'importo si digita.** Oggi si sceglie **solo** dai quattro pulsanti, ed è scritto in
`constants.ts` che era deliberato: _«sono l'unico modo di scegliere un importo nella fetta 01»_.
Quella frase aveva una data, ed è scaduta: con un caveau da 250.000 € quattro importi fissi non
sono una scelta.

I quattro pulsanti **restano**, sotto il campo, ed è il canvas a tenerli: sono le scorciatoie, non
più l'unico accesso.

Il campo produce testo, il dominio vuole `Money`. Fra i due serve una lettura, e **non va nel
`.vue`** (R05): è una funzione pura in un `.ts` accanto alla carta e ai movimenti, provata sui casi
che rompono — vuoto, virgola contro punto, segno meno, migliaia, più di due decimali, testo che non
è un numero.

**b. `MAX` deve offrire un importo che passa.** Un pulsante che propone una cifra e poi la fa
rifiutare è peggio di un pulsante che non c'è.

- **Depositando** il massimo è il saldo dei contanti: la carta non ha tetto.
- **Prelevando** no, e qui sta il calcolo: ciò che **arriva** nel caveau è al netto della
  commissione, quindi il massimo prelevabile è il più grande importo il cui netto ci sta ancora.
  Con la commissione in percentuale la relazione non è una sottrazione: è
  `importo × (1 − tasso) ≤ spazio`. E il saldo della carta resta comunque un tetto.

Vive in `atm/rules.ts` come funzione pura accanto a `fitsIn`, che risponde alla domanda gemella —
`fitsIn` dice «ci sta?», questa dice «quanto ci sta?». È lo stesso paio di `roomIn` e `capacityOf`
in `contracts/pools.ts`, e non è un caso: è la forma che l'[ADR 0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)
ha già scelto una volta.

**c. «min €10» del canvas non si copia.** Nel canvas è un numero scritto a mano. Qui un minimo
artificiale **spegnerebbe una lezione**: 1,00 € esiste fra gli importi rapidi _perché fallisce_, e
il rifiuto dell'anteprima con un motivo — l'[ADR 0018](../adr/0018-la-home-e-un-atm.md) su questo
non è superato — sarebbe raggiungibile solo da un test.

Il minimo vero non è dieci: è il **pavimento della commissione**, sotto il quale l'operazione costa
più di quanto dà. Quindi la nota si **deriva** da `ATM_FEE_FLOOR` (D032) invece di essere scritta,
e dice la cosa vera: sotto quella cifra la commissione si mangia l'importo. Il massimo lo dice la
stessa funzione che alimenta `MAX`.

### 4 · La carta

Il fronte è quello del canvas: marchio, `DEBIT`, il numero a quattro gruppi, `CARDHOLDER`,
`VALID THRU`. Il retro è la banda, il codice, e **cosa fa questo strumento**.

Il retro porta le tre righe che il gioco sa davvero dire — tracciabilità, capienza, commissione, e
quest'ultima adesso è «1,5% in entrata · 2,0% in uscita» invece di una cifra fissa. Le due righe che
il canvas disegna in più, `INTEREST` e `RISK`, **restano fuori**: gli interessi e il conto
congelato non esistono, e una carta che dichiara una meccanica assente è un numero finto con
un'etichetta. Quando arriveranno, si aggiunge una riga — il retro è un elenco, ed è fatto per
questo.

**La rotazione non si tocca.** Il canvas la fa a inclinazione col puntatore e giro al clic; il
codice ha il trascinamento vero, con la matematica in [rotation.ts](../../src/renderer/components/atm/rotation.ts),
pura e già provata. È **comportamento**, non disegno, ed è migliore di quello che il canvas mima
con due `onMouseMove`. Si adottano le due facce, non il modo di girarle.

Il numero, l'intestatario e la scadenza sono **decorazione dichiarata**: non sono numeri di gioco
(non stanno in `balance/`) e non sono parole da tradurre. Stanno accanto alla carta, con un
commento che dice che non significano niente — altrimenti il primo che li legge cerca da dove
vengono.

### 5 · Il cruscotto trasloca

I cinque riquadri, il grafico del patrimonio e il titolo della zona passano a `BoardView`. Non
cambiano: si spostano.

`tests/rules/home-tiles` si sposta con loro e cambia nome: contava i riquadri **della home** per
difendere il bancomat che ci stava sopra. Il bancomat non ci sta più sopra, quindi il tetto non
difende più niente — ma la regola non si cancella, si **rimotiva**: un cruscotto senza tetto torna
a essere i dieci riquadri del progetto precedente. Il numero resta sei, la ragione cambia, e la
ragione va riscritta nel test.

## Da produrre

| File                                             | Cosa                                                                       |
| ------------------------------------------------ | -------------------------------------------------------------------------- |
| `src/renderer/components/shell/screens.ts`       | `home` esce, entrano `atm` e `board`; gruppi, parole e `DOMAIN_SCREENS`    |
| `src/renderer/App.vue`                           | il `Record` totale su `Screen`: due voci nuove, una via (INV-22)           |
| `src/renderer/views/AtmView.vue`                 | la pagina nuova, due colonne                                               |
| `src/renderer/views/BoardView.vue`               | il cruscotto che trasloca da `HomeView`                                    |
| `src/renderer/views/HomeView.vue`                | **eliminato**                                                              |
| `src/renderer/components/atm/AtmPanel.vue`       | riscritto: `FROM ⇄ TO`, campo, rapidi, `MAX`, anteprima, rifiuto, conferma |
| `src/renderer/components/atm/InstrumentSide.vue` | un lato del blocco `FROM ⇄ TO`: strumento, saldo, nota                     |
| `src/renderer/components/atm/BankCard3d.vue`     | le due facce nuove; `rotation.ts` non si tocca                             |
| `src/renderer/components/atm/CashPanel.vue`      | **eliminato** — vedi _La forma_, punto 2                                   |
| `src/renderer/components/atm/amount.ts`          | da testo a `Money`: funzione pura                                          |
| `src/core/domains/atm/rules.ts`                  | `largestThatFits(...)`, gemella di `fitsIn`                                |
| `src/renderer/stores/game.ts`                    | ciò che la pagina chiede e oggi non espone: il massimo per direzione       |
| `src/renderer/i18n/it.ts` · `en.ts`              | le chiavi `home.*` diventano `board.*` e `atm.*`; le parole nuove          |
| `tests/renderer/atm/amount.test.ts`              | la lettura del campo, sui casi che rompono                                 |
| `tests/domains/atm/rules.test.ts`                | `largestThatFits`: il netto ci sta, e un centesimo in più no               |
| `tests/rules/board-tiles.test.ts`                | era `home-tiles`: stesso tetto, ragione riscritta                          |
| `tests/rules/domain-ui.test.ts`                  | verde con `atm` sulla propria destinazione                                 |
| `docs/adr/0040-…`                                | la decisione                                                               |
| `docs/adr/0018-…`                                | da `Accettata` a `Superata`, con il rimando al 0040                        |
| `docs/design/domini/atm.md`                      | la scheda: la domanda 9 cambia risposta                                    |

## Invarianti

- **R05 resta**: la lettura del campo, il massimo e l'anteprima sono funzioni pure fuori dai `.vue`.
- **INV-11 resta**: l'anteprima **è** l'operazione. Il riquadro «prima di confermare» mostra i
  movimenti che il comando applicherà, non un secondo calcolo che gli somiglia.
- **INV-22 resta**: una destinazione senza schermata non compila. Due destinazioni nuove, due voci
  nel `Record`.
- **R18 resta**: `DOMAIN_SCREENS` totale sulle cartelle vere di `src/core/domains/`.
- **R21 resta**: zero `z-index`, canvas compreso — il canvas ne scrive uno, e non si copia
  ([ADR 0037](../adr/0037-il-telaio-non-scorre-il-contenuto-si.md)).
- **R14 resta**: `ui/` non conosce una sola chiave i18n. Tutto ciò che nasce qui sta in
  `components/atm/`, che invece può.
- **Il rifiuto resta raggiungibile a schermo**, premendo `1,00 €`.
- **Nessun numero compare due volte nella stessa schermata**, ed è la misura che ha eliminato
  `CashPanel`.

## Fuori scope

- **Il calore.** «Heat generated» è nel canvas, sotto l'anteprima. Non esiste come meccanica, e non
  nasce qui: sarebbe un terzo cantiere dentro una delega che ne ha già due.
- **Interessi e conto congelato.** Le due righe del retro della carta che il canvas disegna e il
  gioco non sa dire.
- **La striscia degli strumenti a sei voci e la colonna a cinque gruppi** che il canvas mette in
  testa a ogni schermata. Il gioco ha due pool e cinque destinazioni: disegnare sei caselle di cui
  quattro vuote è preparare una forma per un gioco che non c'è (ADR 0014).
- **I grafici degli strumenti.** Sono [D034](D034-le-serie-degli-strumenti.md), e hanno bisogno che
  il cruscotto esista prima.
- **Un router.** Cinque destinazioni **piatte** non giustificano una dipendenza, e il grilletto
  scritto in `screens.ts` non è scattato: nessuna schermata deve ancora essere raggiungibile da
  fuori, e non c'è gerarchia.
- **Un numero di carta generato dal seme della partita.** Sarebbe bello e costa poco — l'Rng ha già
  i suoi stream per dominio ([ADR 0005](../adr/0005-rng-seedato-con-stream-per-dominio.md)) — ed è
  esattamente per questo che va detto invece che fatto: nessuno l'ha chiesto. Il grilletto è la
  prima cosa nel gioco che debba distinguere una partita da un'altra a schermo.

## Definizione di fatto

- [x] `atm` e `board` sono due destinazioni, e `home` non esiste più — né come schermata, né come
      prefisso di chiave i18n.
- [x] L'ADR 0018 è `Superata` e l'ADR 0040 dice perché. `docs/stato.md` conta **un** `Superata`.
- [x] La pagina del bancomat ha le due colonne del canvas, e sotto la soglia diventa una con
      l'operazione **prima**.
- [x] L'importo si digita, e il campo rifiuta ciò che non è un importo senza far cadere la pagina.
- [x] `MAX` propone sempre un importo che **passa**, nelle due direzioni — verificato col caveau
      quasi pieno, che è il caso in cui la sottrazione ingenua sbaglia.
- [x] La nota «min · max» è **derivata**, non scritta: cambiare `ATM_FEE_FLOOR` la cambia.
- [x] `1,00 €` è ancora rifiutato premendo, e il rifiuto si legge nel suo blocco col codice.
- [x] La carta ha le due facce del canvas, gira col trascinamento come prima, e il retro non
      dichiara meccaniche che non esistono.
- [x] `CashPanel` e `HomeView` non esistono più, e niente li importa.
- [x] La parità i18n è verde: nessuna chiave orfana dopo la rinomina (R13).
- [x] Le quattro combinazioni schermata × tema guardate **nella finestra vera** via CDP, con i
      colori calcolati letti nel documento — è il metodo di
      [PASSAGGIO-DI-CONSEGNE](PASSAGGIO-DI-CONSEGNE.md), e l'immagine da sola non basta.
- [x] `npm run verify` verde, `npm run verify:release` verde, `docs/stato.md` rigenerato.

## Trappole note

1. **La rinomina delle chiavi i18n è la parte che rompe in silenzio.** `home.tile.*`,
   `home.chart.*`, `home.zone.*`, `home.description` sono una ventina, in due file. La parità fra
   `it` e `en` è verificata (R13), quindi una chiave dimenticata **in tutti e due** i file passa il
   gate e sparisce dallo schermo. Il controllo vero è che nessuna chiave `home.` sopravviva:
   `grep -rn "'home\." src/` deve essere vuoto.
2. **`tests/rules/home-tiles` non si cancella.** È tentante: il tetto difendeva il bancomat, il
   bancomat se n'è andato. Ma senza tetto il cruscotto torna a essere quello del progetto
   precedente. Si **rimotiva** e si rinomina, e la ragione nuova va scritta nel test — un test con
   il commento vecchio è un test che il prossimo cancella.
3. **Il massimo prelevabile non è `spazio + commissione`.** Con la commissione in percentuale
   quella sottrazione sbaglia, e sbaglia **verso l'alto**: propone un importo che poi il caveau
   rifiuta. La relazione è `importo × (1 − tasso) ≤ spazio`, e il risultato va **arrotondato per
   difetto** ai centesimi — per eccesso, `MAX` proporrebbe un centesimo che non ci sta. È
   l'arrotondamento opposto a quello della commissione (D032), e i due non si condividono.
4. **Il campo dell'importo non tiene un `Decimal`.** Tiene testo, e il `Decimal` nasce leggendolo.
   Un `ref` su `Money` legato al campo con `v-model` sarebbe la stessa trappola di D012: Vue
   avvolgerebbe il `Decimal` in un proxy e da lì il dominio non lo riconosce più. Lo store usa
   `shallowRef` per questo, e qui la risposta è ancora più semplice — testo di qua, `Money` di là,
   e in mezzo una funzione.
5. **Digitare mentre l'anteprima è aperta la ricalcola a ogni tasto.** `previewOf` è pura e
   costa poco, quindi va bene — ma il **rifiuto** no: oggi `refusal` si azzera quando cambia
   l'importo, e con un campo che cambia a ogni carattere il messaggio di errore lampeggerebbe. Il
   rifiuto dell'anteprima e il rifiuto della conferma sono due cose diverse, e lo erano già: il
   primo si aggiorna, il secondo resta finché non si ripreme.
6. **Il canvas ha un `z-index: 20` nella testata.** Non si copia. R21 lo impedisce in `src/`, e la
   ragione per esteso sta nelle alternative scartate dell'ADR 0037.
7. **Il canvas disegna in inglese.** Le sue frasi sono la fonte del **contenuto**, non del testo:
   il gioco ha due lingue e la parità è un gate. Ogni frase presa dal canvas entra come chiave in
   tutti e due i file.
8. **Due colonne che diventano una non sono due `@media`.** Il kit non fa geometria (R16) e il
   telaio è una forma, non un contenitore (ADR 0030): la griglia sta nella pagina, che è il posto
   dove la geometria è ammessa.

---

## Cosa è stato verificato a occhio, e come

Con il metodo di [PASSAGGIO-DI-CONSEGNE](PASSAGGIO-DI-CONSEGNE.md): `npx electron-vite dev --remoteDebuggingPort 9222`, la finestra interrogata dal di dentro via CDP, mai portata in primo piano. Gli script vivono nello scratchpad e questa sessione li ha riscritti da zero, come la precedente.

Le quattro combinazioni **schermata × tema** con i colori calcolati letti nel documento:
`atm`/`board` × chiaro/scuro. Il fondo passa da `rgb(237, 234, 227)` a `rgb(16, 15, 12)` e
l'inchiostro da `rgb(21, 20, 15)` a `rgb(241, 237, 226)` — cioè i token cambiano davvero e non solo
l'immagine. Zero `z-index` sulla pagina del bancomat, nessuno scorrimento orizzontale su nessuna
delle quattro, colonne 499px e 353px (il 7 e il 5 del canvas).

E poi le cose che un'immagine non dice:

- premuto `1,00 €` → il blocco del rifiuto compare con `RIFIUTATO · ATM · FEE EXCEEDS AMOUNT` e la
  frase «La commissione di 2,50 € si mangia tutti i 1,00 €», il pulsante resta premibile e
  smorzato, e la nota sotto diventa «Il pulsante resta vivo»;
- premuto `Massimo` → il campo riceve `1.000,00` e l'anteprima passa, con
  −1.000,00 / +985,00 / +15,00;
- scambiato il verso col pulsante centrale → i due lati si invertono e, col caveau pieno, il
  massimo prelevabile è `0,00 €` e il rifiuto è `LEDGER · CAPACITY EXCEEDED`. È la risposta onesta:
  non esiste un importo che passa, e proporne uno sarebbe la bugia che `largestThatFits` esiste per
  non dire;
- trascinata la carta → da `rotateX(6deg) rotateY(-14deg)` a `rotateX(-4deg) rotateY(180deg)`, cioè
  il retro, con `rotation.ts` non toccato;
- ristretta la finestra da 1600px a 800px a passi → le due colonne diventano una a 1120px, con
  l'operazione **prima** (`y` 159 contro 652), e a nessuna larghezza qualcosa esce dal proprio
  contenitore.

## Correzioni rispetto a com'era scritta la delega

1. **La trappola 3 dice il falso su un arrotondamento, ed è stato misurato.** «Per eccesso, `MAX`
   proporrebbe un centesimo che non ci sta»: con i due tassi in vigore non succede **mai** —
   300.000 valori di spazio per ciascuno, più altri quattro tassi di prova, zero sconfinamenti. Il
   motivo è che anche la commissione arrotonda per eccesso, e restituisce il centesimo che
   l'importo aveva preso. **Per difetto resta comunque la scelta giusta**, ma per un'altra ragione:
   è sicura per **qualunque** tasso — `netto ≤ importo × (1 − tasso) ≤ spazio` per costruzione —
   mentre per eccesso dipende da una coincidenza aritmetica fra il tasso e la griglia dei
   centesimi. Una difesa che regge per caso è una difesa che nessuno sa quando smette.
2. **E per la stessa ragione «un centesimo in più no» è falso sopra la soglia**, sempre: nei casi in
   cui comanda la percentuale, l'importo massimo più un centesimo ci sta ancora — misurato al
   100%. Sotto la soglia, dove la commissione è il pavimento, è esattamente vero, e il test lo
   asserisce **lì**. Il centesimo lasciato sul tavolo è dichiarato invece che inseguito: prenderlo
   vorrebbe dire risalire di un centesimo per volta dentro una regola pura.
3. **`largestThatFits` ha un argomento che la delega non nomina, e un patto in fondo.** L'argomento
   è quanto c'è alla **partenza**: senza, il massimo depositando sarebbe l'infinito, perché la
   carta non ha tetto. Il patto è l'ultima riga — se nemmeno l'importo più grande possibile copre
   la propria commissione, la risposta è **zero**. Senza, con meno del pavimento in contanti `MAX`
   proporrebbe una cifra che viene rifiutata, che è il difetto per cui la funzione esiste.
4. **Due valori nuovi in `contracts/money.ts`, che la delega non elencava.** `roundDownToCents` era
   già annunciato dal commento di `roundUpToCents` — «se un giorno servisse arrotondare un'uscita,
   quella è un'altra funzione con un altro nome» — e `ONE` serve a leggere un tasso al contrario:
   sta lì perché un letterale monetario dentro `domains/` è rosso
   (`tests/rules/domains-no-money-literals`).
5. **Il confine di presentazione guadagna `plainMoney`.** Il campo tiene testo, e quel testo deve
   essere ciò che il giocatore scriverebbe: con `money()` i pulsanti rapidi scriverebbero
   «500,00 €» accanto a un simbolo già stampato, con `toString()` scriverebbero «500», che è una
   forma che il gioco non mostra da nessuna parte. `plainMoney` scrive `5.102,04` in italiano e
   `5,102.04` in inglese, e `readAmount` rilegge tutte e due — c'è un test che chiude il giro.
6. **Il codice del rifiuto si ricava, non si scrive.** Il canvas ne disegna quattro a mano;
   `refusalCode` li ricava dal codice che l'errore porta già con sé. Aggiungere al dizionario una
   seconda etichetta per ogni codice sarebbe stato due nomi per lo stesso rifiuto, cioè A13 con
   un'altra faccia. Non si traduce: la frase c'è ed è quella che `failure` compone, questo è
   l'identificativo.
7. **`home.zone.atm` e `home.zone.dashboard` non traslocano: spariscono.** La delega diceva «il
   titolo della zona passa a `BoardView`», e sarebbe stata l'etichetta «Cruscotto» sotto il titolo
   «Cruscotto». Servivano a dividere due zone dentro una pagina, e la divisione adesso è la pagina.
   È la stessa misura che ha eliminato `CashPanel`.
8. **Il saldo esce dal fronte della carta, e `atm.account.title` con lui.** Non è nella lista della
   delega, e discende dalla sua stessa regola: il saldo della carta è già il lato `A CARTA` del
   blocco `DA ⇄ A`. Il canvas lo aveva già capito — il suo fronte non porta cifre di gioco.
9. **`card.tier.gold` sparisce.** Il fronte del canvas dice `SOLVENT` e `DEBIT`, non un livello.
   L'oro resta, ma è il **materiale**, e il materiale vive nei token: l'aggancio dell'ADR 0018 alla
   progressione non aveva bisogno della parola.
10. **`atm.deposit`, `atm.withdraw`, `atm.deposit.title` e `atm.withdraw.title` spariscono.** Con
    `DA ⇄ A` la direzione è una cosa che si **vede**, non due linguette che si escludono, e il
    verbo resta dove serve — sul pulsante, insieme all'importo: «Deposita 500,00 €». Il `Record`
    totale su `AtmOperationKind` resta, con una chiave invece di tre.
11. **Il rifiuto della conferma si azzera anche scambiando il verso**, non solo ripremendo. La
    trappola 5 dice «resta finché non si ripreme», e vale contro il campo che cambia a ogni
    carattere; ma un rifiuto che parlava di un prelievo, letto sotto un pulsante che adesso
    deposita, è peggio di nessun rifiuto.
12. **La lettura del campo ha un'ambiguità, ed è dichiarata invece che nascosta.** `10,999` può
    essere diecimila o dieci-e-spiccioli, e nessuna regola le distingue. `readAmount` legge
    diecimila, perché il gioco scrive sempre due decimali esatti — un terzo decimale non può venire
    da un numero letto sullo schermo. In tutti i casi l'anteprima lo mostra **prima** che si
    confermi (INV-11), quindi l'errore si vede invece di essere pagato.
13. **Tre difetti che solo la finestra vera poteva dire**, e nessuno dei tre sarebbe uscito da un
    test. La carta si schiacciava a 251px perché `.stage` è un flex e un elemento flessibile si
    stringe anche con una larghezza dichiarata. Da lì la soglia delle due colonne è diventata
    **misurata** — 70rem, non i ~62 scritti a occhio la prima volta — perché più in basso non si
    avevano due colonne strette: si aveva una carta rotta. E il retro della carta era illeggibile,
    inchiostro scuro su oro cupo: le tre righe che il retro esiste per portare non si vedevano.
    Adesso c'è `--metal-back-ink`.
14. **Il numero della carta e i suoi due compagni sono decorazione dichiarata, e stanno nello
    `<script setup>`.** `no-magic-numbers` copre `src/renderer/**/*.ts` e **non** i `.vue` — è
    scritto in `eslint.config.js`, con il grilletto per estenderlo — quindi la difesa qui è il
    commento, non il lint. Sono comunque stringhe, non numeri, e nessuna regola le legge.
15. **Un'osservazione, non una correzione: lo stesso numero compare due volte a schermo, e non è
    della pagina.** La striscia della testata (D024) mostra contanti e carta su **ogni**
    destinazione, e il blocco `DA ⇄ A` li mostra di nuovo. La misura che ha eliminato `CashPanel`
    parla di una schermata; questa è la cornice, ed è l'unico posto in cui quei due saldi si
    leggono sulle altre quattro pagine. Toglierla sarebbe una decisione sul telaio, non su questa
    pagina, e non è stata presa qui.
16. **`z-index: 12` e `10` esistono sul cruscotto, e sono di ApexCharts.** R21 e
    `tests/rules/no-z-index` guardano `src/`, quindi sono verdi e hanno ragione: quei numeri stanno
    nel CSS della libreria (ADR 0034). È scritto qui perché la prossima misura presa nel documento
    li ritroverà, e senza questa riga sembrerebbero una violazione.
17. **Tre trappole dello strumento, due nuove.** La porta 5173 era occupata ed `electron-vite` è
    passata alla 5174 in silenzio — filtrare su `localhost` invece che sul numero è servito
    davvero. `requestAnimationFrame` **non si risolve mai** in una finestra che non compone frame,
    quindi aspettare un frame dopo un clic sintetico blocca lo script per sempre: si aspetta con
    `setTimeout`. E dentro un template literal JavaScript la sequenza «backslash s» perde il
    backslash e resta una `s`, quindi una normalizzazione degli spazi scritta così cancella le
    esse — «Massimo» era diventato «Ma imo».
