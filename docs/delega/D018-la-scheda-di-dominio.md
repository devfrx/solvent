# D018 — La scheda di dominio: la forma, e le prime tre compilate

- **Stato:** Aperta — scritta il 2026-08-20, dopo la riscrittura della
  [visione](../prodotto/visione.md) e l'audit del kernel che ne è seguito, e **preparata per
  l'esecuzione** il 2026-08-21, dopo che [D017](D017-il-caveau.md) si è chiusa. Vedi _Cosa la
  preparazione ha verificato_
- **Dipende da:** D013 (la fetta 01 chiusa). **Non** dipende da D017: sono documenti, non codice, e
  non si toccano. È però stata eseguita **dopo**, e la differenza è tutta a favore — il caveau
  adesso esiste, quindi nessuna delle tre schede si compila da un disegno
- **Sblocca:** lo studio di ognuno dei diciassette domini, uno alla volta. E il grilletto dell'etichetta
  come tipo, che chiede «il secondo strumento con un'etichetta vera» e con questa delega ne avrà tre
- **ADR vincolanti:** nessuno nuovo. Li **cita**, ed è metà del suo lavoro: 0002, 0003, 0005, 0009,
  0010, 0014, 0016, 0017, 0019, 0020, 0022, 0023, 0024, 0025. Quanti siano non si scrive: la riga
  diceva «dodici» davanti a un elenco di quattordici, ed è il difetto di
  [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) sopravvissuto dentro una delega aperta
- **Regole:** nessuna nuova. Nessun invariante nuovo
- **Budget:** ~180 righe per la scheda, ~110 per ognuna delle tre compilate. Totale ~510 righe di
  documentazione. **Zero righe di codice**, ed è una condizione di correttezza, non una stima

## Obiettivo

Dare a ogni dominio futuro **una scheda da compilare prima di scrivere una riga**, e provare che la
scheda funziona compilandola per i domini che esistono già.

## Perché esiste, e cosa è andato storto senza

La visione è stata riscritta il 2026-08-20 e ha cambiato metà del gioco: via le ere, via il
prestige, dentro i requisiti, le pozze, l'etichetta, il tempo di gioco e il mondo che avanza a
finestra chiusa.

**Nessuno si è chiesto cosa facesse tutto questo al kernel.** L'audit fatto subito dopo — cioè
rileggendo il codice invece che il documento — ha trovato due difetti in mezz'ora, e uno dei due è
il più grosso del progetto finora:

| Trovato                                                                                               | Dove viveva                                   |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Otto ore di assenza valgono **trentanove anni di gioco**: dormire rende tredici volte più che giocare | `BALANCE.RECOVERY_CAP`, scelto nella fetta 01 |
| Il recupero fa **un solo** `tickAll`, quindi nessuna soglia attraversata e rientrata è visibile       | `stores/game.ts`, `recover()`                 |

Il secondo dei due ha guadagnato un pezzo da [D017](D017-il-caveau.md), e va saputo prima di
compilare: quel `tickAll` solo non fa più tornare a casa con **zero** chi è stato via — il reddito
sa quanto ci sta prima di chiedere, e accredita il parziale. La soglia resta invisibile, il guasto
no. Ed è anche il primo caso in cui la domanda 4 della metà kernel risponde «sì»: il caveau pieno è
una soglia che si attraversa e si rientra.

Nessuno dei due è un difetto del kernel: il kernel fa quello che gli è stato chiesto. Sono difetti
di **giunzione** — una decisione di gioco presa senza guardare il meccanismo che dovrà reggerla.

Questa delega esiste perché quella giunzione smetta di essere un atto di attenzione e diventi un
modulo che non si può lasciare vuoto. Le domande dell'audit non sono state geniali: sono dodici
domande ovvie che nessuno aveva scritto in un posto dove tornassero a galla.

## Cosa la preparazione ha verificato

Fatta il 2026-08-21, subito dopo la chiusura di [D017](D017-il-caveau.md), e non è stata una
rilettura: le dodici domande della metà kernel sono state **compilate davvero** per i tre domini,
leggendo `src/`, e poi buttate via lasciando qui solo cosa hanno trovato. È lo stesso metodo di
D017, applicato a una delega che non produce codice — dove «fare il cambiamento e guardare cosa
diventa rosso» significa rispondere alle domande e guardare quali non discriminano.

**1. D017 è stata eseguita prima, e cambia il pezzo più fragile di questa delega.** L'intestazione
diceva «non dipende da D017: sono documenti, non codice, e non si toccano», ed è ancora vero come
dipendenza. Ma l'ordine reale è un regalo: il caveau **esiste**, quindi tutte e tre le schede si
compilano leggendo `src/` e nessuna si compila da un disegno. Le quattro righe che davano il caveau
per non scritto sono state corrette qui sotto e nel corpo.

**2. La trappola più importante è già scattata, e ha dato il suo numero.** Diceva: «se D017 viene
eseguita dopo, la sua scheda va riletta contro il codice e corretta dove ha sbagliato — e quella
correzione è la misura di quanto vale l'intera scheda». È successo, e la misura è questa: la
[scheda del caveau](../design/domini/vault.md) ha smentito **tre** delle proprie righe e **zero**
delle proprie decisioni di gioco. Quello che aveva sbagliato era sempre lo stesso tipo di cosa —
_dove_ vive un pezzo e _quanto costa_ collegarlo — mai _cosa il dominio fa_. Chi esegue non deve
rifare quella verifica: deve leggere _Cosa l'esecuzione ha smentito_ in fondo alla scheda e
decidere se la forma deve fare una domanda in più per prendere quella classe di errore.

**3. Cinque domande su dodici rispondono «no» per tutti e tre i domini**, e sono le 6, 9, 10, 11 e
12: nessun dominio emette o ascolta eventi, nessuno ha conti per entità, nessuno tiene liste
storiche, nessuno ha bisogno di sapere che giorno è, nessuno usa l'Rng. Non è un difetto — sono le
domande che sorvegliano cose che ancora non esistono, e il loro valore si vede la prima volta che
una risponde «sì». È però il **numero di partenza** del controllo che la delega si è già data
(«se una sezione non ha mai cambiato una decisione, va tolta; la prova arriva alla quarta
compilata»): senza questa riga, alla quarta scheda quel controllo sarebbe un'impressione.

**4. La domanda 3 discrimina, ma per un pelo, e va saputo prima.** La definizione di fatto pretende
che «cosa fa con un `elapsed` grande» abbia tre risposte diverse. Le ha, ma due cominciano allo
stesso modo: `atm` e `vault` non ticchettano. La differenza vera è che il caveau, pur non
ticchettando, **viene interrogato dentro il tick di un altro** — è la sua capienza a decidere
quanta parte di quell'`elapsed` diventa denaro. Una scheda compilata di fretta scriverebbe «non
ticchetta» due volte e la definizione di fatto sembrerebbe violata. Non lo è: la risposta giusta
per il caveau non parla di sé, parla di chi lo interroga.

**5. La domanda 4 ha trovato il primo «sì» del progetto, ed è il caveau.** «Ha soglie che si possono
attraversare e rientrare?» — `income` no, `atm` no, `vault` **sì**: pieno e non pieno è una soglia
che il giocatore attraversa e rientra depositando. La domanda dice «se sì, riguarda il recupero a
blocchi», che è uno dei due difetti della fetta 03. Ne discende che questa delega, compilando la
scheda di un dominio che esiste, punta il dito su un difetto **già censito** invece di scoprirne
uno nuovo: è la prova che la domanda funziona, ed è anche il motivo per cui non va risolta qui.

**6. La domanda 6 afferma una regola che nessun meccanismo impone**, ed è l'unica riga della metà
kernel in quelle condizioni. «Nessun dominio importa un altro dominio» è **vero** — verificato con
un `grep` su `src/core/domains/`, zero occorrenze — ed è stato vero due volte per scelta, non per
costruzione: [D017](D017-il-caveau.md) ha rinunciato ad aprirlo sia per il reddito sia per il
bancomat (correzioni 3 e 4). Il lint sotto `domains/**` vieta `vue`, `pinia`, `electron` e le
conversioni di `Money`, e **non** vieta questo.

L'invariante di questa delega dice che «ogni riga della metà kernel ha dietro un ADR, un invariante
o un test». Qui non c'è nessuno dei tre, quindi **chi esegue decide, e lo scrive**:

- **Scrivere la regola**, cioè un file in `tests/rules/` che rifiuta un import fra domini. Sono una
  decina di righe, non tocca `src/` — l'invariante «nessun file sotto `src/` viene toccato` resta
  intatto — e trasformerebbe una riga di prosa in un gate. Costa però un ID nuovo in
  [tracciabilita.md](../tracciabilita.md), e la delega dichiara «nessuna regola nuova».
- **Dichiararla per quello che è**, cioè una regola 👤 tenuta dalla review, e scriverlo nella scheda
  invece di lasciarlo intendere. Costa zero e lascia in piedi la sola riga della metà kernel che
  promette più di quanto mantiene.

**7. L'intestazione conta male gli ADR, ed è il difetto di [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md)
sopravvissuto dentro una delega aperta.** Diceva «ne cita **dodici**» davanti a un elenco di
**quattordici**. È esattamente ciò che la preparazione di D017 aveva trovato in D017 — «sette»
davanti a otto — e la correzione è la stessa: il numero non si scrive, l'elenco si conta da sé.

**8. Uno dei quattordici ADR ha cambiato stato mentre la delega aspettava.** L'[ADR 0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)
era `Proposta` quando D018 è stata scritta ed è ora `Accettata`: la domanda 8 della metà kernel —
«tocca il denaro? quali pool, con quale `accepts`?» — ha adesso una risposta in più da pretendere,
perché la capienza di un pool **si chiede** e la funzione che risponde appartiene a un dominio.
Quali siano `Proposta` adesso lo dice [stato.md](../stato.md), che li conta.

### Cosa ne discende per il budget

**La scheda del caveau è già scritta a metà, e quella metà è più della metà.** Il budget dice ~110
righe per ognuna delle tre compilate; `docs/design/domini/vault.md` esiste già e ne ha oltre
duecento, comprese le sezioni che nessun'altra scheda avrà — le alternative scartate, cosa lo studio
ha trovato, e cosa l'esecuzione ha smentito. Quello che le manca è la **sola metà kernel**, cioè
dodici risposte. Chi esegue si aspetti quindi ~110 righe per `income.md`, ~110 per `atm.md` e
**molte meno** per il caveau, e la scheda in `README.md` resta la voce grossa. Il totale sforerà
verso il basso, ed è la prima volta nel progetto.

## Cosa trovi già fatto

- **La visione** è riscritta e coerente: l'etichetta a nove voci, la legge della non dominanza, le
  quattro forme di saturazione, i requisiti, il tempo, l'attenzione, il fuori-finestra.
- **La mappa funzionale** ([design/mappa-funzionale.md](../design/mappa-funzionale.md)) descrive già
  ciclo, cosa vedere, cosa decidere e cosa può andare male per tutti e diciassette i domini, e per
  i traguardi. **Non si riscrive**: la scheda la cita e aggiunge ciò che le manca, cioè la metà
  kernel.
- **Tre domini esistono davvero**, e da [D017](D017-il-caveau.md) sono tre nel codice e non due:
  `income` (D010), `atm` (D014) e `vault` (D017). Sono i tre casi di prova, e sono diversi apposta —
  uno ticchetta e ha stato, uno non ha né l'uno né l'altro, uno ha stato e non ticchetta.
- **Il registro YAGNI** ([roadmap-fette.md](../roadmap-fette.md)) contiene già i grilletti di ciò
  che i domini futuri chiederanno: conti dinamici, calendario, `boundedList`, terza fase di `ORDER`.
  La scheda ci **rimanda**, non li duplica.

## Da produrre

### La scheda

| File                           | Contenuto                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `docs/design/domini/README.md` | la scheda: le sezioni, cosa chiede ognuna, e **perché** — con l'audit come prova |

La scheda ha **due metà**, e la seconda è la ragione per cui questa delega esiste.

**Metà di gioco.** Riprende la visione e la mappa funzionale, e non le riscrive:

1. **L'etichetta a nove voci** — rendimento, varianza, liquidità, tracciabilità, calore, attenzione,
   pozza, pagamento, requisito. Compilata, non descritta.
2. **Il ciclo** — cosa fa il giocatore, in una frase.
3. **Deve vedere / deve decidere / può andare male** — le tre righe della mappa funzionale.
4. **Come muore il secondo milione** — quale delle quattro forme, e con quale numero.
5. **Il requisito, e di che tipo è** — strumento, relazione, punteggio, possesso. Se è capitale e
   basta, la scheda è incompleta: lo dice la visione.
6. **A quali due domini si collega, e come** — è la regola operativa della visione, ed è la sola
   sezione che può bocciare un dominio invece di descriverlo.
7. **Cosa succede a finestra chiusa** — cosa avanza, cosa si ferma, cosa può andare **contro** il
   giocatore.

**Metà kernel.** Dodici domande. Sono quelle che l'audit ha fatto a mano, e ognuna ha un ADR o un
meccanismo dietro:

| #   | Domanda                                            | Cosa decide                                                          |
| --- | -------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | Ha stato?                                          | `system.ts` con `save`/`load`/`reset`, o solo comandi (D014)         |
| 2   | Ticchetta? In quale `ORDER`?                       | ADR 0002; e se apre una fase nuova, esce dal registro YAGNI          |
| 3   | Cosa fa con un `elapsed` **grande**?               | il recupero. È qui che il difetto di D017 e quello dell'audit vivono |
| 4   | Ha soglie che si possono attraversare e rientrare? | se sì, riguarda il recupero a blocchi                                |
| 5   | Cosa gli serve che non sta nel `SystemContext`?    | arriva per costruzione (ADR 0024), mai da un singleton               |
| 6   | Quali eventi emette, e a quali ascolta?            | ADR 0016. **Nessun dominio importa un altro dominio**                |
| 7   | Quali `Reason` introduce?                          | ogni transazione ne porta una, tradotta in due lingue                |
| 8   | Tocca il denaro? Quali pool, con quale `accepts`?  | solo via Ledger (R06), transazioni atomiche (ADR 0019)               |
| 9   | Ha conti propri per entità?                        | ADR 0022, ancora `Proposta`: se sì, è il suo grilletto               |
| 10  | Ha liste storiche?                                 | ADR 0010, `boundedList` con `max` obbligatorio                       |
| 11  | Ha bisogno di sapere che giorno è?                 | ADR 0023: riceve **durate**, non date                                |
| 12  | Usa l'Rng? Con quale stream?                       | ADR 0005, uno stream per dominio                                     |

E in fondo, due righe che non sono domande ma conseguenze:

- **Quali numeri di gioco introduce** — vanno in `balance/constants.ts`, mai dentro il dominio.
- **Quale bersaglio di bilanciamento lascia** — in `balance/targets.ts`, verificato da un test. Un
  dominio senza bersaglio è un dominio il cui bilanciamento è un'opinione.

### Le tre schede di prova

| File                           | Perché proprio questo                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `docs/design/domini/income.md` | ha stato **e** ticchetta. È il caso pieno, e la domanda 3 su di lui ha già una risposta pagata                       |
| `docs/design/domini/atm.md`    | **non** ha stato e **non** ticchetta. Se la scheda non regge un dominio di soli comandi, è sbagliata                 |
| `docs/design/domini/vault.md`  | ha stato e **non** ticchetta, ed è l'unico dei tre che ha **già** la sua metà di gioco: gli manca solo quella kernel |

Si compilano **leggendo il codice**, non ricordandolo, e da [D017](D017-il-caveau.md) vale per tutti
e tre: quando questa delega è stata scritta il caveau andava compilato dal disegno, e adesso no. Una
scheda che descrive ciò che credevamo di aver scritto è peggio di nessuna scheda.

**La scheda del caveau ha già la sua metà di gioco**, scritta il 2026-08-20 studiando il dominio
prima di eseguire D017: [design/domini/vault.md](../design/domini/vault.md). Questa delega non la
riscrive — le aggiunge la metà kernel, e ne verifica la forma contro la scheda che avrà appena
definito. È anche il documento che ha fatto nascere la nona voce dell'etichetta, quindi è la prova
che compilarne una scopre qualcosa: l'invariante più sotto è già soddisfatto per un terzo.

**E adesso è anche la prova che una scheda regge il proprio dominio scritto.** Il 2026-08-21 si è
riletta contro il codice di D017 e ha corretto tre delle proprie righe, senza cambiare **nessuna**
decisione di gioco: quello che aveva sbagliato era dove vive un pezzo e quanto costa collegarlo, mai
cosa il dominio fa. Sta in fondo alla scheda, sotto _Cosa l'esecuzione ha smentito_, e va letto
prima di scrivere la forma — perché quelle tre righe dicono quali domande la forma non stava
facendo.

## Invarianti

- **La scheda non duplica nessun documento vivo.** Dove la visione, la mappa funzionale o un ADR
  già rispondono, la scheda **rimanda**. Un documento che ricopia è un documento che invecchia da
  solo, ed è il motivo per cui i documenti vivi non contengono mai firme di funzioni.
- **Ogni riga della metà kernel ha dietro un ADR, un invariante o un test.** Una domanda senza un
  meccanismo dietro è una buona intenzione, e la scheda ne è piena solo se qualcuno l'ha riempita
  di fretta.
- **Le tre schede compilate contengono almeno una risposta che ha sorpreso chi la scriveva.** Non è
  poesia: se compilarle non scopre niente, la scheda sta chiedendo cose che si sapevano già, e va
  cambiata prima di darla ai quattordici domini che verranno.
- **Nessun file sotto `src/` viene toccato.** Se compilare una scheda fa venire voglia di
  correggere il codice, la correzione si annota nella scheda e si lascia lì.

## Fuori scope

- **I quattordici domini non ancora costruiti.** Ognuno avrà la sua scheda, con la sua delega, quando ci
  si arriva. Compilarne diciassette adesso è il difetto A17 travestito da diligenza — e la visione lo
  vieta esplicitamente nella sezione «cosa NON si costruisce adesso».
- **L'etichetta come tipo TypeScript, e il test di non dominanza.** Questa delega porta il conteggio
  degli strumenti dichiarati da uno a tre, cioè **fa scattare** il grilletto del registro YAGNI.
  Farlo scattare e obbedirgli nella stessa delega vuol dire non poter più dire quale delle due cose
  ha funzionato.
- **Il tetto di recupero e il recupero a blocchi.** Sono i due difetti che l'audit ha trovato, sono
  scritti nella riga della fetta 03, e si risolvono lì. Qui si scrive la domanda che li avrebbe
  fatti trovare prima, non la risposta.
- **La direzione visiva.** La scheda descrive cosa un dominio deve **poter** mostrare, mai come.
- **Correggere `ResetScope`.** La domanda aperta è nel registro YAGNI e si decide alla fetta 06.

## Definizione di fatto

- [ ] `npm run verify` verde, con l'**output incollato**. Non tocca codice, quindi deve esserlo per
      costruzione: se non lo è, qualcosa è stato toccato che non doveva
- [ ] `docs/design/domini/README.md` esiste e contiene entrambe le metà, con le dodici domande
- [ ] ognuna delle dodici domande cita l'ADR, l'invariante o il test che la rende una regola e non
      un consiglio
- [ ] le tre schede sono compilate, e **nessuna** ha una voce dell'etichetta vuota — se una voce non
      si applica, lo dice a parole invece di restare bianca
- [ ] le tre schede sono state compilate leggendo `src/` — **tutte e tre**, caveau compreso: la riga
      diceva «e la scheda del caveau leggendo D017», ed era vera finché il caveau non esisteva
- [ ] almeno una sorpresa per scheda è annotata, o è dichiarato per iscritto che non ce n'è stata
- [ ] la domanda 3 — «cosa fa con un `elapsed` grande» — ha una risposta **diversa** nelle tre
      schede. Ce l'ha, ma per un pelo: due su tre non ticchettano, e la differenza sta in cosa
      succede loro **dentro il tick di un altro** (punto 4 della preparazione)
- [ ] la domanda 6 dichiara cosa la tiene in piedi: oggi «nessun dominio importa un altro dominio»
      è vero e non ha nessun meccanismo dietro (punto 6 della preparazione). Delle due strade si
      sceglie, e si scrive quale
- [ ] il [registro YAGNI](../roadmap-fette.md) è aggiornato: la riga dell'etichetta dichiara che il
      grilletto è **scattato** e nomina questa delega
- [ ] `docs/delega/README.md`: D018 nell'indice, nel grafo, e con il consuntivo delle righe
- [ ] `docs/tracciabilita.md`: se la scheda ha aggiunto un meccanismo, ha la sua riga; se non l'ha
      aggiunto, è scritto che non l'ha aggiunto

## Trappole note

- **A17, e stavolta con un'aggravante.** Avere una scheda in mano fa venire voglia di compilarla
  tredici volte in un pomeriggio. Sarebbero diciassette domini progettati per un kernel che non li ha
  mai visti, cioè esattamente i 24 sistemi nati prima di un modo per collegarli. Tre, e sono tre
  che **esistono**.
- **La scheda che diventa un modulo burocratico.** Una scheda si compila una volta e si legge dieci:
  se una sezione non ha mai cambiato una decisione, va tolta. La prova arriva alla quarta compilata,
  non a questa delega — ma va scritto nel README che quel controllo esiste e quando si fa.
- **Compilare a memoria.** Le tre schede riguardano codice che qualcuno ha scritto e che sembra di
  ricordare. L'audit da cui nasce questa delega ha trovato i suoi due difetti **rileggendo**, e
  entrambi erano in file che erano stati scritti apposta con quei commenti sopra.
- **La metà kernel che diventa un elenco di sì/no.** «Ha stato? Sì.» non è una risposta: la risposta
  è quale stato, cosa ne sopravvive a un `load` e cosa a un `reset`. Le domande sono corte perché
  siano ricordabili, non perché le risposte lo siano.
- **Questa trappola è già scattata, e ha lasciato un numero invece di un avvertimento.** Diceva che
  il caveau era l'unico dei tre a compilarsi da un documento invece che dal codice, e che se D017
  fosse stata eseguita dopo la sua scheda andava riletta contro il codice — «e quella correzione è
  la misura di quanto vale l'intera scheda». D017 è stata eseguita, la rilettura è stata fatta, e la
  misura è **tre righe smentite e zero decisioni di gioco cambiate**. Non c'è più niente da temere
  qui: c'è da leggere quelle tre righe e chiedersi quale domanda le avrebbe prese prima.
