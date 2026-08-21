# D026 — Dove si attacca un dominio: la pagina, e le cartelle che la reggono

- **Stato:** **Chiusa** — scritta il 2026-08-21 su una domanda dell'utente (_dove vive
  l'interfaccia di un dominio?_) ed eseguita lo stesso giorno, sul ramo
  `d026-dove-si-attacca-un-dominio`. Le tre decisioni sono state prese con l'utente prima di
  toccare un file, e stanno più sotto in _Le tre decisioni, e come sono state prese_
- **Dipende da:** [D024](D024-il-telaio.md) — la colonna, `components/screens.ts` e INV-22 sono il
  meccanismo su cui una pagina di dominio si attacca; senza il telaio questa delega dovrebbe
  costruirlo prima. **Non** dipende da [D018](D018-la-scheda-di-dominio.md): quella dice cosa un
  dominio deve **poter** mostrare, questa dice **dove**
- **Sblocca:** la fetta 03, e ogni dominio dopo. Da qui in poi «dove metto questo pannello?» ha una
  risposta scritta invece di una risposta per assonanza
- **ADR vincolanti:** [0018](../adr/0018-la-home-e-un-atm.md),
  [0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md),
  [0030](../adr/0030-il-telaio-e-una-forma-non-un-contenitore.md) e
  [0014](../adr/0014-una-fetta-verticale-alla-volta.md). Uno nuovo: **0033**. Il 0018 è quello che
  questa delega può **superare**, ed è la ragione per cui le decisioni sono aperte
- **Regole:** almeno una nuova, e quale dipende dalla decisione 1. Nessun invariante nuovo previsto,
  ma INV-12 può cambiare di casa
- **Budget:** ~150 righe di sorgente e ~60 di test se le pagine restano due; ~260 e ~80 se ne nasce
  una terza. La forbice è la decisione 1, ed è dichiarata invece che mediata: un budget solo
  nasconderebbe che le due strade costano diverso

## Obiettivo

Dire **dove vive l'interfaccia di un dominio**, e dove vivono i file che la compongono, prima che i
domini siano diciassette.

## Perché esiste, e perché adesso

**Il caveau è la prova che la regola manca.** [D017](D017-il-caveau.md) ha costruito un dominio
intero — stato, comandi, capienza, ampliamento, un muro che ferma il reddito — e la sua interfaccia
è finita dentro `components/CashPanel.vue`, insieme al saldo dei contanti. Non c'è stata nessuna
decisione: il caveau tocca i contanti, i contanti avevano già un pannello, e il pannello è cresciuto.
Nessun gate poteva vederlo, perché non esiste una regola da rompere.

Guardato adesso, quel file è **due cose**: la metà alta è il pool `cash` — quanto ne hai, che traccia
lascia — e la metà bassa è il dominio `vault` — il livello, la barra, quanto spazio resta, il
listino a due voci, il pulsante che amplia. Sono due domini diversi che condividono un riquadro
perché condividono un numero.

**E la fetta 03 arriva.** Il progresso offline non porta una destinazione nuova, ma la
[fetta 04](../roadmap-fette.md) sì — il calore e il black market — e quello è il primo dominio che
non ha nessun pannello a cui appoggiarsi. Il momento per decidere dove si attacca è **prima** che si
attacchi: è l'argomento di [D001](D001-tooling-e-gate.md) usato per la terza volta, dopo D023 e
D024.

**È la stessa mossa di [D024](D024-il-telaio.md), un piano sopra.** D024 ha deciso dove si attacca
una **schermata**; questa decide dove si attacca un **dominio**. La differenza conta: `screens.ts`
elenca destinazioni, e nessuno ha ancora detto se una destinazione e un dominio siano la stessa cosa.

## Cosa trovi già fatto

- **Il telaio c'è**, e con lui il meccanismo su cui una pagina si attacca: `components/screens.ts`
  porta le destinazioni e le loro parole, `App.vue` le mappa alle viste con un `Record` totale, e
  **INV-22** rende impossibile elencare una destinazione senza schermata. Una pagina nuova è una
  riga in un elenco e una riga in una mappa — e se ne scrivi solo una, `typecheck` è rosso.
- **Il confine del kit c'è ed è imposto.** L'[ADR 0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md)
  dice che `ui/` non conosce dominio, store né parole (**R14**), l'[ADR 0030](../adr/0030-il-telaio-e-una-forma-non-un-contenitore.md)
  separa la forma dal contenitore (**R16**), e la soglia di ammissione è scritta: un pezzo entra nel
  kit quando lo disegnano **due** componenti. Questa delega non tocca quel confine — lo usa.
- **`tests/rules/import-graph` c'è**, e sorveglia il disegno nei due versi: una cartella nuova sotto
  `src/` va aggiunta alla mappa `NODES` di quel test **e** al diagramma di
  [architettura.md](../architettura.md), o è rosso per costruzione (C13). Sottocartelle di
  `components/` **sono** cartelle nuove.
- **I selettori del caveau esistono già e sono nello store**, non nel componente: `cashCapacity`,
  `vaultProgress`, `vaultRoom`, `vaultFill`, `vaultIsFull`, `incomeWithheld`, `expansionPrices`,
  `canExpandWith`, `expandVault`. Spostare l'interfaccia del caveau non tocca lo store: è per questo
  che è un lavoro di impaginazione e non di dominio.
- **Il tetto dei riquadri c'è**, ed è INV-12: `tests/rules/home-tiles` conta i `<StatTile>` **dentro
  `views/HomeView.vue`**, per percorso scritto nel test. Se la home cambia nome o si spezza, quel
  test va con lei — ed è la prima cosa che diventa rossa se la decisione 1 sceglie la strada larga.
- **Il registro YAGNI ha già i grilletti dei pezzi che questa delega sfiora**: i gruppi di
  destinazioni nella colonna, i simboli accanto a ciascuna, le schermate segnaposto dei domini
  chiusi. Vivono in [roadmap-fette.md](../roadmap-fette.md) e **non si anticipano** — ma il primo
  di quei grilletti può scattare qui, e va detto invece che subito.

## Le decisioni aperte

Sono tre, e non sono di chi scrive la delega. Due sono di prodotto e una è di struttura; tutte e tre
cambiano cosa si costruisce, non come. **Chi esegue le porta all'utente prima di scrivere una riga**,
e scrive quale strada è stata scelta e perché — nella delega e nell'ADR 0033.

### Decisione 1 — cosa succede alla home

L'[ADR 0018](../adr/0018-la-home-e-un-atm.md) è **Accettata** e dice: la home è bancomat sopra,
cruscotto sotto, in quest'ordine, con un tetto di sei riquadri che un test impone. Se ogni dominio
ha la sua pagina, il bancomat ne ha una — e allora la home è cosa?

| Strada                                                                      | Cosa costa                                                                                                                                                          |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **La home resta il bancomat**, e i domini nuovi prendono una pagina a testa | zero oggi, e un'incoerenza che cresce: il bancomat è l'unico dominio senza pagina propria, e chi arriva non sa se è una regola o un residuo                         |
| **La home diventa il cruscotto**, e il bancomat prende la sua pagina        | l'ADR 0018 va superato con un ADR nuovo, `home-tiles` cambia bersaglio, e il gesto centrale del gioco costa un clic in più — che è esattamente ciò che 0018 vietava |

**Nessuna delle due è ovvia, ed è il motivo per cui la decisione è qui.** La seconda riga
dell'alternativa scartata dell'ADR 0018 dice testualmente perché il bancomat non deve stare dietro
un clic; ma quell'ADR è stato scritto quando le destinazioni erano due e i domini tre.

### Decisione 2 — il caveau è una pagina o una parte

Il caveau non è un posto dove si va: è un **muro che si incontra**. Il giocatore non apre il caveau
per fare qualcosa — lo guarda quando i contanti smettono di entrare, e lo amplia da lì.

Ne discende una domanda che vale per tutti e diciassette: **un dominio è per forza una pagina?** Se
la risposta è sì, il caveau diventa una destinazione che si apre due volte in una partita. Se è no,
serve il criterio che distingue i due casi — ed è quel criterio, non l'elenco, il vero prodotto di
questa delega.

Qualunque sia la risposta, `CashPanel.vue` si spezza: la metà del pool e la metà del caveau sono due
domini, e stanno in un file solo per un incidente.

### Decisione 3 — le sottocartelle di `components/`

Oggi `components/` è piatta. Con diciassette domini non lo resta. Le forme possibili sono note e
costano diverso; quella che si sceglie va scritta con la ragione, perché è la cartella che cresce
più in fretta di tutte.

Vale un vincolo che non è negoziabile e che va detto qui: **una cartella nuova sotto `src/` è un
nodo del diagramma** (C13). Sottocartelle per dominio significano nodi per dominio, oppure una
regola nel test che li raccoglie — e quella regola va scritta insieme alle cartelle, non dopo.

## Da produrre

La tabella non si può chiudere prima delle tre decisioni, e scriverla adesso sarebbe scrivere una
tabella da rifare. Quello che si può dichiarare è il **perimetro**, e questo è vincolante:

| Cosa                                             | Vincolo                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `docs/adr/0033-*.md`                             | la decisione: dove vive l'interfaccia di un dominio, con il criterio scritto            |
| `src/renderer/components/CashPanel.vue`          | si spezza: il pool da una parte, il caveau dall'altra                                   |
| `src/renderer/components/screens.ts` e `App.vue` | toccati **solo** se nasce una destinazione                                              |
| `docs/architettura.md`                           | l'albero delle cartelle e il diagramma, nello stesso commit (C13)                       |
| `docs/tracciabilita.md`                          | la regola nuova, con il suo meccanismo                                                  |
| `docs/adr/0018-la-home-e-un-atm.md`              | toccato **solo** l'intestazione, se la decisione 1 lo supera: gli ADR non si riscrivono |
| `tests/rules/`                                   | il gate della regola nuova, rotto di proposito almeno una volta                         |

## Invarianti

- **Nessun dominio che non esiste guadagna una pagina.** È A17, ed è la trappola che
  [D024](D024-il-telaio.md) ha già schivata una volta: il canvas disegna diciotto domini e il codice
  ne ha tre. La regola operativa di D024 vale qui alla lettera — **una casella si disegna solo se un
  selettore dello store la può riempire oggi**.
- **Nessuna logica di dominio si sposta.** Questa delega muove file e disegna confini: i selettori
  restano nello store, le regole restano in `domains/*/rules.ts`, e se spostare un pannello fa venire
  voglia di spostare un calcolo, la voglia si annota e si lascia lì.
- **Il kit non cresce per comodità.** Un pezzo entra in `ui/` quando lo disegnano due componenti
  (ADR 0028) e non prende geometria per proprietà (R16). Spezzare un file non crea il secondo
  disegno: crea due metà dello stesso.
- **La regola nuova ha un test.** Una convenzione sulle cartelle tenuta dalla review è la classe di
  regola che questo progetto ha visto rompersi tre volte (D001, D021, D022). Se la decisione 3 non
  produce niente di verificabile, va scritto che è 👤 di review, invece di lasciarlo intendere.

## Fuori scope

- **Cosa è trasversale e cosa è di dominio.** Le valute oltre contanti e carta, gli oggetti, il
  calore, l'attenzione, l'etichetta a nove voci: è la domanda gemella di questa, ed è stata posta lo
  stesso giorno. Il suo posto è la scheda di [D018](D018-la-scheda-di-dominio.md) e il
  [registro YAGNI](../roadmap-fette.md), che ha già i grilletti di ognuna. **Portarla qui vorrebbe
  dire generalizzare da un dominio solo**, che è ciò che la
  [visione](../prodotto/visione.md) vieta con parole sue.
- **Le schermate dei domini che non esistono.** Black market, immobiliare, impresa, casinò, crypto:
  la riga è nel registro YAGNI e il grilletto è la fetta di ciascuno.
- **Le schermate segnaposto dei domini chiusi.** Stessa riga, altro grilletto: il primo dominio che
  dichiara un requisito e lo mostra prima di essere aperto.
- **Un router.** Il grilletto è scritto ed è la prima schermata raggiungibile da fuori, oppure la
  terza destinazione **con una gerarchia**. Una terza destinazione piatta non lo fa scattare.
- **I gruppi e i simboli nella colonna.** Il grilletto dei gruppi è la terza destinazione, quindi la
  decisione 1 può farlo scattare: se scatta, **esce dal registro ed entra in questa delega**, e non
  si anticipa per prudenza.
- **Il raggruppamento dello stipendio.** Il suo grilletto è la prima delega che tocca
  `components/postings.ts`. Se questa lo tocca, scatta; se non lo tocca, resta dov'è.

## Definizione di fatto

- [ ] Le tre decisioni sono state prese **con l'utente**, e ognuna è scritta con l'alternativa
      scartata e il suo costo
- [ ] `npm run verify` verde, con l'**output incollato**
- [ ] `npm run verify:release` verde
- [ ] La regola nuova è stata **rotta di proposito**, e cosa diventa rosso è scritto
- [ ] `docs/adr/0033-*.md` esiste, è `Accettata` nel commit che scrive il meccanismo, e porta il
      **criterio** — non l'elenco delle pagine di oggi
- [ ] Se la decisione 1 supera l'[ADR 0018](../adr/0018-la-home-e-un-atm.md), quell'ADR lo dichiara
      nell'intestazione e il corpo resta: gli ADR sono append-only
- [ ] `docs/architettura.md`: albero delle cartelle e diagramma aggiornati, e
      `tests/rules/import-graph` verde nei due versi
- [ ] `docs/tracciabilita.md`: la regola nuova ha la sua riga e la sua forza
- [ ] Le schermate toccate sono state **guardate a occhio nei due temi**, con l'interruttore di
      [D024](D024-il-telaio.md). Il modo sta in
      [PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md), sotto _Come si guarda l'applicazione
      senza toccarla_
- [ ] `docs/adr/README.md` e `docs/delega/README.md`: l'ADR e questa delega nei rispettivi indici,
      con il consuntivo delle righe contro il budget
- [ ] `docs/stato.md` rigenerato con `npx vitest run tests/rules/project-state -u`
- [ ] In fondo alla delega: le **correzioni** rispetto a com'era scritta

## Trappole note

- **Diciassette pagine vuote.** Avere un criterio in mano fa venire voglia di applicarlo a tutti. Il
  criterio si scrive una volta; le pagine nascono una per fetta, con il dominio dietro.
- **Il pannello che si sposta e porta con sé il calcolo.** `CashPanel.vue` legge nove selettori dallo
  store e non calcola niente — nemmeno la larghezza della barra, che è una percentuale e viene da
  fuori (R05). Spezzarlo è un taglio, non una riscrittura: se durante il taglio nasce un `computed`,
  è finito nel posto sbagliato.
- **`home-tiles` che diventa verde perché non guarda più niente.** Quel test punta a un percorso
  scritto: `src/renderer/views/HomeView.vue`. Se la home si sposta e il percorso non lo segue, il
  test passa contro un file che non c'è — e INV-12 smette di esistere in silenzio. È la stessa classe
  di difetto del valore predefinito additivo di D017, correzione 2.
- **La sottocartella che il diagramma non conosce.** `tests/rules/import-graph` pretende che ogni
  file di `src/` appartenga a un nodo. Una cartella nuova senza la sua riga nella mappa è rossa —
  ed è il modo giusto di scoprirlo, ma solo se ci si aspetta il rosso invece di rincorrerlo.
- **Il caveau che diventa una destinazione perché è un dominio.** «Dominio» è una parola del codice.
  Quello che il giocatore apre è un **posto**, e i due elenchi possono non coincidere: se coincidono,
  è una decisione, non un fatto.

## Le tre decisioni, e come sono state prese

Portate all'utente **prima** di toccare un file, una alla volta, con due strade e i costi di
ciascuna. Nessuna è stata presa da chi ha eseguito.

### Decisione 1 — la home resta il bancomat

**Scelta dall'utente.** L'[ADR 0018](../adr/0018-la-home-e-un-atm.md) **non** è stato superato: è
stato confermato, e ha cambiato significato. La home non è più «un'eccezione ibrida»: è **la pagina
del dominio `atm`**, con il cruscotto sotto perché il cruscotto non è di nessun dominio. Il tetto di
sei riquadri e `tests/rules/home-tiles` non si sono toccati, e `views/HomeView.vue` non ha cambiato
percorso — quindi INV-12 non è mai stato in pericolo.

**Alternativa scartata:** la home diventa il cruscotto e il bancomat prende una destinazione sua.
Costava un ADR superato, il bersaglio di `home-tiles` spostato, e un clic in più sul gesto centrale
del gioco — cioè testualmente ciò che l'ADR 0018 vietava. In cambio dava uniformità, che qui è
l'argomento più debole: `atm` è il dominio **meno** pagina che ci sia — non ha stato, non ticchetta,
non si registra ([D014](D014-dominio-bancomat.md)).

**Una cosa è stata dichiarata fuori scope subito.** L'utente ha chiesto anche un cruscotto **con
grafici**, e una libreria per farli. Due argomenti l'hanno fermata: non esiste una serie storica da
disegnare — `history` è una lista di venti transazioni tenuta solo in memoria, e `SavePayload` non
contiene nessuno storico — e una libreria di grafici è una dipendenza nuova, quindi un ADR suo, come
`vue-router` ([ADR 0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md)). Il posto di quel lavoro è una
delega sua, con dentro **chi salva la serie** prima di **come si disegna**.

### Decisione 2 — regola secca, con l'uscita dichiarata

**Presa in autonomia su direttiva generale dell'utente** («la soluzione più coerente, senza debiti
futuri, professionale, non pigra»), quindi **contestabile**: sta nell'indice
[ADR](../adr/README.md).

Ogni dominio ha la sua pagina; chi non ce l'ha lo **scrive**, con un `null` in `DOMAIN_SCREENS`.
Oggi: `atm → home`, `income → income`, `vault → vault`, e nessun `null`.

**Alternativa scartata:** il criterio caso per caso — «una pagina è un posto dove si va apposta, un
muro si mette dove lo si incontra». È la formulazione con cui la decisione era nata, e sul caveau dà
la risposta giusta. Il difetto è che resta un **giudizio**: nessun test lo può verificare, quindi
sarebbe 👤 di review, che è la classe di regola che questo progetto ha visto rompersi tre volte. Con
diciassette domini davanti, un giudizio ripetuto diciassette volte lo decide lo spazio disponibile —
cioè esattamente come il caveau è finito dentro i contanti.

**E la regola secca pura è stata scartata anche lei**, ed è la scoperta che ha prodotto il criterio
vero: sarebbe **falsa**. `src/core/domains/calendar/`
([ADR 0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)) è l'orologio del gioco e non
ha niente da mostrare; nella [mappa dei domini](../prodotto/visione.md) il calore, gli eventi
periodici e le indagini hanno la colonna _requisito_ vuota, perché non sono posti dove si va. Una
regola falsa si aggira, e la si aggira mettendo il pezzo dove capita.

### Decisione 3 — sottocartelle per proprietario

**Presa in autonomia sulla stessa direttiva**, quindi contestabile insieme alla 2 — sono la stessa
riga dell'indice, perché sono lo stesso ADR.

Cinque cartelle, zero file sciolti: `shell/`, `ledger/`, `atm/`, `income/`, `vault/`. Le prime due
sono la **lista chiusa** di ciò che non appartiene a un dominio, e i loro nomi dicono di chi è la
roba. Non si chiamano `common/` né `shared/` perché sono due delle parole che **C09 vieta**, anche
come segmento di percorso — e le vieta per la ragione che si sarebbe vista qui.

**Alternativa scartata:** cartella piatta con il dominio nel nome del file (`AtmPanel.vue`,
`VaultPanel.vue`). Costa zero e in un editor ordina uguale. Non regge due cose: un prefisso non sa
dire «non appartengo a nessun dominio», quindi la colonna, la testata e l'estratto conto restano
alla deriva; e con diciassette domini per tre o quattro file ciascuno la cartella arriva a sessanta
voci, che è la forma in cui `finanx` teneva i propri componenti.

## Cosa è stato verificato a occhio, e come

`npm run dev` con `--remoteDebuggingPort 9222`, e la finestra interrogata dal di dentro senza
portarla mai in primo piano — il modo sta in
[PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md). Le destinazioni sono state **premute** con
`Input.dispatchMouseEvent`, non navigate da codice, e a ogni tappa si è chiesto al documento —
`data-theme`, i colori calcolati di `body`, i titoli dei riquadri, le voci della colonna — oltre che
all'immagine.

Otto combinazioni, quattro destinazioni per due temi, con l'interruttore in fondo alla colonna
premuto in mezzo:

| Destinazione | Tema   | Fondo                | Riquadri | Barra | Caselle | Titolo      |
| ------------ | ------ | -------------------- | -------- | ----- | ------- | ----------- |
| Bancomat     | scuro  | `rgb(16, 15, 12)`    | 8        | 0     | 5       | Bancomat    |
| Reddito      | scuro  | `rgb(16, 15, 12)`    | 1        | 0     | 0       | Reddito     |
| Caveau       | scuro  | `rgb(16, 15, 12)`    | 1        | 1     | 0       | Caveau      |
| Statistiche  | scuro  | `rgb(16, 15, 12)`    | 2        | 0     | 0       | Statistiche |
| Bancomat     | chiaro | `rgb(237, 234, 227)` | 8        | 0     | 5       | Bancomat    |
| Reddito      | chiaro | `rgb(237, 234, 227)` | 1        | 0     | 0       | Reddito     |
| Caveau       | chiaro | `rgb(237, 234, 227)` | 1        | 1     | 0       | Caveau      |
| Statistiche  | chiaro | `rgb(237, 234, 227)` | 2        | 0     | 0       | Statistiche |

**Ha trovato una cosa da correggere, ed è la ragione per cui si guarda.** Sulla pagina del caveau la
parola «Caveau» compariva **due volte** a cento pixel di distanza: una nel titolo della schermata,
una sul titolo del riquadro. Nessun gate poteva vederlo. Il riquadro ha perso il titolo, e la chiave
`vault.title` è stata cancellata invece di restare inutilizzata — torna il giorno in cui quella
pagina ha due riquadri e serve dire quale è quale.

**E ha confermato sul campo la clausola dell'ADR 0033:** con il caveau pieno, `VaultAlarm` compare
sulla home sotto i contanti — «Il caveau è pieno: lo stipendio non entra più» — e viene da
`components/vault/`, non da un paragrafo dentro `CashPanel.vue`.

## Come la regola nuova è stata rotta di proposito

Quattro volte, una per verifica, e ogni volta è stato controllato **quale** riga diventa rossa, non
che qualcosa diventasse rosso.

| Cosa è stato scritto apposta                                  | Cosa è diventato rosso                                                                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `components/Loose.vue`, sciolto nella radice                  | `nessun file sta sciolto nella radice di components/` — `['src/renderer/components/Loose.vue']` |
| `components/widgets/Thing.vue`, una cartella inventata        | `ogni cartella di components/ è un dominio, o una delle due dichiarate` — `['widgets']`         |
| `src/core/domains/casino/rules.ts`, un dominio senza risposta | `ogni dominio dice dove si guarda, anche quando la risposta è null` — `['casino']`              |
| `ghost: 'stats'` in `DOMAIN_SCREENS`, senza la sua cartella   | `un dominio con una destinazione ha la sua cartella` — `['ghost']`                              |

Prima ancora, il test è stato scritto **prima** del codice che governa, ed era rosso per un motivo
diverso e giusto: `components/shell/screens.ts` non esisteva.

## Correzioni rispetto a com'era scritta la delega

1. **`import-graph` non diventa rosso per una sottocartella di `components/`, e la delega lo dava
   per certo.** _Cosa trovi già fatto_ diceva «è rosso per costruzione (C13). Sottocartelle di
   `components/` **sono** cartelle nuove». Non lo sono, per come quel test è fatto: `NODES` sceglie
   il nodo per **prefisso**, e `src/renderer/components/` prende tutto ciò che ci sta sotto.
   Verificato prima di decidere, mettendo un file finto in `src/renderer/components/probe/`: otto
   test verdi. Ne discendono due cose — nessun nodo nuovo nel diagramma, e **la regola nuova ha
   dovuto essere un test suo**, perché nessun gate esistente l'avrebbe tenuta.
2. **La decisione 1 non ha superato l'ADR 0018: l'ha confermato.** La delega prevedeva che potesse
   superarlo, e la tabella _Da produrre_ teneva una riga per quel caso. L'intestazione dell'ADR 0018
   non è stata toccata.
3. **Le decisioni 1 e 2 hanno prodotto un criterio solo, non due.** La delega le teneva separate —
   una di prodotto sulla home, una di prodotto sul caveau — e la risposta è la stessa frase: la
   cartella è del dominio sempre, la pagina è del giocatore e c'è quando c'è qualcosa da
   amministrare.
4. **`CashPanel.vue` si è spezzato in tre, non in due.** La delega diceva «il pool da una parte, il
   caveau dall'altra». Ne sono usciti `atm/CashPanel.vue`, `vault/VaultPanel.vue` e
   `vault/VaultAlarm.vue`: senza il terzo, il muro sarebbe stato invisibile proprio dove il
   giocatore lo incontra. È il pezzo che rende la clausola dell'ADR 0033 una cosa vera invece che
   una previsione.
5. **Sono nate due pagine, non una.** Il budget parlava di «una terza»; `income` ne ha presa una
   anche lui, perché la regola secca non fa eccezioni per un dominio piccolo — e `IncomePanel` sulla
   home era lo stesso difetto del caveau, solo più vecchio.
6. **Il grilletto dei gruppi nella colonna è scattato**, come la delega diceva che poteva. È uscito
   dal [registro YAGNI](../roadmap-fette.md) ed è entrato qui: `NAV_GROUPS` in `screens.ts`, due
   gruppi, «Dove si opera» e «Dove si guarda». Non fa scattare il router: un gruppo è un titolo
   sopra delle voci che restano tutte allo stesso livello, non una gerarchia di indirizzi.
7. **La riga «le schermate dei domini che non esistono» del registro YAGNI ha guadagnato un
   meccanismo.** Era un grilletto scritto in prosa; adesso `tests/rules/domain-ui` rifiuta una
   cartella di `components/` che non abbia una cartella in `core/domains/` dietro.
8. **L'albero delle cartelle di `architettura.md` era invecchiato di due deleghe.** Non conosceva
   `AppNav.vue`, `AppHeader.vue`, `screens.ts`, `UiShell.vue`, `UiTooltip.vue` né `theme.ts` — cioè
   tutto D024 e D025 — e l'elenco di `tests/rules/` ne dichiarava sedici su trentuno, con due nomi
   ripetuti due volte. Il **diagramma** invece era aggiornato: è la differenza fra un disegno che un
   test confronta e un albero che nessuno confronta.
9. **La prosa dell'indice ADR indicizzava per posizione, e la riga nuova l'avrebbe spostata.**
   «L'ultima, il **0025**» adesso è «Il **0025**» — la stessa trappola che
   [PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md) descrive per la propria tabella, trovata in
   un secondo documento.
10. **Il titolo del riquadro del caveau è stato tolto, e con lui la chiave `vault.title`.** Trovato
    guardando, non testando: la stessa parola due volte nella stessa schermata.
11. **`git checkout` su un file rinominato riporta la versione staged, non quella nuova**, e questo
    ha cancellato `screens.ts` dopo la quarta rottura di proposito. Chi rompe di proposito un file
    che nella stessa delega è stato mosso con `git mv` rimetta a posto **il testo**, invece di
    fidarsi di `git checkout`.
12. **Cosa è trasversale e cosa è di dominio è rimasto fuori**, come la delega chiedeva, e ha
    provato a rientrare due volte: la prima con il pool `cash`, che non è di nessun dominio e sta in
    `components/atm/` perché è la pagina del bancomat a disegnarlo; la seconda con `StatTile`, che
    sta in `shell/` perché è dell'applicazione. Nessuna delle due è stata generalizzata: quando un
    secondo dominio disegnerà i contanti, quello sarà il grilletto.

## Consuntivo

| Cosa     | Budget                            | Consuntivo | Dove si legge                                                   |
| -------- | --------------------------------- | ---------- | --------------------------------------------------------------- |
| Sorgente | ~150 con due pagine, ~260 con tre | **+124**   | [stato.md](../stato.md): `src/renderer/` da 2.591 a 2.715 righe |
| Test     | ~60 con due pagine, ~80 con tre   | **+81**    | `tests/rules/domain-ui.test.ts`, con lo stesso `codeLines`      |

**Sotto il budget più basso pur avendo costruito la strada più cara**, e la ragione vale la pena
saperla: due terzi di questa delega sono **spostamenti**, e un `git mv` non produce righe. Le righe
nuove stanno quasi tutte in quattro file che prima non esistevano — `VaultPanel.vue`,
`VaultAlarm.vue` e le due viste — più `screens.ts`, che ha guadagnato `NAV_GROUPS` e
`DOMAIN_SCREENS`.

Il test è **una riga sopra** il tetto alto della forbice, e la ragione è la quarta verifica: la
delega ne prevedeva una, l'ADR 0033 ne ha volute quattro perché il difetto ha quattro forme.
