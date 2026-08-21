# D033 — Il bancomat è una pagina

- **Stato:** **Aperta** — scritta il 2026-08-21, non eseguita. Il ramo si chiami
  `d033-il-bancomat-e-una-pagina` e parta da [D032](D032-la-commissione-scala-il-pavimento-no.md)
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

- [ ] `atm` e `board` sono due destinazioni, e `home` non esiste più — né come schermata, né come
      prefisso di chiave i18n.
- [ ] L'ADR 0018 è `Superata` e l'ADR 0040 dice perché. `docs/stato.md` conta **un** `Superata`.
- [ ] La pagina del bancomat ha le due colonne del canvas, e sotto la soglia diventa una con
      l'operazione **prima**.
- [ ] L'importo si digita, e il campo rifiuta ciò che non è un importo senza far cadere la pagina.
- [ ] `MAX` propone sempre un importo che **passa**, nelle due direzioni — verificato col caveau
      quasi pieno, che è il caso in cui la sottrazione ingenua sbaglia.
- [ ] La nota «min · max» è **derivata**, non scritta: cambiare `ATM_FEE_FLOOR` la cambia.
- [ ] `1,00 €` è ancora rifiutato premendo, e il rifiuto si legge nel suo blocco col codice.
- [ ] La carta ha le due facce del canvas, gira col trascinamento come prima, e il retro non
      dichiara meccaniche che non esistono.
- [ ] `CashPanel` e `HomeView` non esistono più, e niente li importa.
- [ ] La parità i18n è verde: nessuna chiave orfana dopo la rinomina (R13).
- [ ] Le quattro combinazioni schermata × tema guardate **nella finestra vera** via CDP, con i
      colori calcolati letti nel documento — è il metodo di
      [PASSAGGIO-DI-CONSEGNE](PASSAGGIO-DI-CONSEGNE.md), e l'immagine da sola non basta.
- [ ] `npm run verify` verde, `npm run verify:release` verde, `docs/stato.md` rigenerato.

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
