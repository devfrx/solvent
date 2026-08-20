# D018 — La scheda di dominio: la forma, e le prime tre compilate

- **Stato:** Aperta — scritta il 2026-08-20, dopo la riscrittura della
  [visione](../prodotto/visione.md) e l'audit del kernel che ne è seguito
- **Dipende da:** D013 (la fetta 01 chiusa). **Non** dipende da D017: sono documenti, non codice, e
  non si toccano
- **Sblocca:** lo studio di ognuno dei diciassette domini, uno alla volta. E il grilletto dell'etichetta
  come tipo, che chiede «il secondo strumento con un'etichetta vera» e con questa delega ne avrà tre
- **ADR vincolanti:** nessuno nuovo. Ne **cita** dodici, ed è metà del suo lavoro: 0002, 0003, 0005,
  0009, 0010, 0014, 0016, 0017, 0019, 0020, 0022, 0023, 0024, 0025
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

Nessuno dei due è un difetto del kernel: il kernel fa quello che gli è stato chiesto. Sono difetti
di **giunzione** — una decisione di gioco presa senza guardare il meccanismo che dovrà reggerla.

Questa delega esiste perché quella giunzione smetta di essere un atto di attenzione e diventi un
modulo che non si può lasciare vuoto. Le domande dell'audit non sono state geniali: sono dodici
domande ovvie che nessuno aveva scritto in un posto dove tornassero a galla.

## Cosa trovi già fatto

- **La visione** è riscritta e coerente: l'etichetta a nove voci, la legge della non dominanza, le
  quattro forme di saturazione, i requisiti, il tempo, l'attenzione, il fuori-finestra.
- **La mappa funzionale** ([design/mappa-funzionale.md](../design/mappa-funzionale.md)) descrive già
  ciclo, cosa vedere, cosa decidere e cosa può andare male per tutti e diciassette i domini, e per
  i traguardi. **Non si riscrive**: la scheda la cita e aggiunge ciò che le manca, cioè la metà
  kernel.
- **Tre domini esistono davvero**: `income` (D010), `atm` (D014), e `vault` disegnato in
  [D017](D017-il-caveau.md) ma non ancora scritto. Sono i tre casi di prova, e sono diversi apposta
  — uno ticchetta e ha stato, uno non ha né l'uno né l'altro, uno ha stato e non ticchetta.
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

| File                           | Perché proprio questo                                                                                                             |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `docs/design/domini/income.md` | ha stato **e** ticchetta. È il caso pieno, e la domanda 3 su di lui ha già una risposta pagata                                    |
| `docs/design/domini/atm.md`    | **non** ha stato e **non** ticchetta. Se la scheda non regge un dominio di soli comandi, è sbagliata                              |
| `docs/design/domini/vault.md`  | ha stato e **non** ticchetta, ed è l'unico dei tre che **non esiste ancora**: si compila dal disegno di [D017](D017-il-caveau.md) |

Si compilano **leggendo il codice**, non ricordandolo — tranne il caveau, che si compila leggendo
D017. Una scheda che descrive ciò che credevamo di aver scritto è peggio di nessuna scheda.

**La scheda del caveau ha già la sua metà di gioco**, scritta il 2026-08-20 studiando il dominio
prima di eseguire D017: [design/domini/vault.md](../design/domini/vault.md). Questa delega non la
riscrive — le aggiunge la metà kernel, e ne verifica la forma contro la scheda che avrà appena
definito. È anche il documento che ha fatto nascere la nona voce dell'etichetta, quindi è la prova
che compilarne una scopre qualcosa: l'invariante più sotto è già soddisfatto per un terzo.

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
- [ ] le tre schede sono state compilate leggendo `src/`, e la scheda del caveau leggendo D017
- [ ] almeno una sorpresa per scheda è annotata, o è dichiarato per iscritto che non ce n'è stata
- [ ] la domanda 3 — «cosa fa con un `elapsed` grande» — ha una risposta **diversa** nelle tre
      schede. Se sono uguali, la domanda è scritta male
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
- **Il caveau è l'unico dei tre che si compila da un documento e non dal codice**, e questo lo rende
  il più prezioso e il più fragile: è l'unica scheda che può scoprire un difetto **prima** che il
  codice esista, ed è anche l'unica che può descrivere qualcosa che poi non verrà scritto così. Se
  D017 viene eseguita dopo, la sua scheda va riletta contro il codice e corretta dove ha sbagliato —
  e quella correzione è la misura di quanto vale l'intera scheda.
