# Reddito — scheda di dominio

- **Stato:** **ricompilata il 2026-08-24** per [D044](../../delega/D044-il-reddito-e-un-elenco-di-fonti.md)
  e **riletta contro `src/` lo stesso giorno**, a esecuzione finita. Era stata scritta quando il
  dominio non esisteva ancora — vincolava ciò che D044 avrebbe costruito — e la rilettura ne ha
  smentite **tre**, senza cambiare nessuna decisione di gioco. Sono elencate in fondo, come è
  successo alla [scheda del caveau](vault.md)
- **Compilata prima:** il 2026-08-21 da [D018](../../delega/D018-la-scheda-di-dominio.md), e riletta
  il 2026-08-24 da [D043](../../delega/D043-il-reddito-si-mette-in-regola.md)
- **Costruito da:** [D010](../../delega/D010-dominio-income.md), fetta 01; il listino è di
  [D019](../../delega/D019-il-pagamento.md), il parziale a caveau pieno di
  [D017](../../delega/D017-il-caveau.md), il **regime** di
  [D043](../../delega/D043-il-reddito-si-mette-in-regola.md), le **fonti** e il **plateau** di
  [D044](../../delega/D044-il-reddito-e-un-elenco-di-fonti.md)
- **Perché è un caso di prova:** è il **caso pieno** — ha stato **e** ticchetta. Se la scheda non
  regge lui, non regge nessuno
- **A monte:** il blocco 1 della [mappa funzionale](../mappa-funzionale.md)

---

## Metà di gioco

### 1 · L'etichetta

| #   | Voce              | Reddito                                                                                                                                                          |
| --- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Rendimento**    | da 12,00 € al secondo fino a un **plateau dichiarato**. È il solo che crea denaro dal nulla, ed è il solo che **finisce**                                        |
| 2   | **Varianza**      | **zero**. Non usa l'Rng: ogni tick vale esattamente quanto il precedente                                                                                         |
| 3   | **Liquidità**     | **la dichiara la fonte**: le fonti nere pagano in contanti, spendibili subito ma sotto il muro del caveau; quella in regola paga sulla carta, che muro non ne ha |
| 4   | **Tracciabilità** | **la sceglie il giocatore, una fonte alla volta** (ADR 0052): zero sulle fonti nere, totale su quella in regola                                                  |
| 5   | **Calore**        | **zero, oggi**. È l'unica voce su cui questo dominio non ha ancora niente da dire, e la fonte che la riempirà è di fetta 04                                      |
| 6   | **Attenzione**    | **la più bassa del gioco, e resta tale**. Si apre una fonte, si sale di livello, e non chiede altro: nessun gesto da ripetere                                    |
| 7   | **Pozza**         | forma 1, **ed è sua**: i livelli sono finiti e la loro somma è il plateau. Le fonti nere ne incontrano una **seconda**, che è del caveau                         |
| 8   | **Pagamento**     | **lo dichiara la fonte**: il lavoro si migliora con la carta, i lavoretti in contanti. È il primo dominio con due listini che portano strumenti diversi          |
| 9   | **Requisito**     | **nessuno**. È il dominio da cui la partita comincia                                                                                                             |

**Quattro voci sono cambiate rispetto alla compilazione di D043, e la settima è quella che conta.**
Fino a ieri diceva «forma 1 solo in nero, e non è sua: a fermarlo è il caveau». Era vero, e
l'[ADR 0052](../../adr/0052-un-guadagno-dichiara-dove-atterra.md) ha sciolto quel legame per il
reddito in regola — lasciando il dominio **senza nessuna saturazione**, che è ciò che la regola 3
della [visione](../../prodotto/visione.md) vieta. Il plateau è la risposta, ed è sua.

Le voci 3 e 8 smettono di essere proprietà del dominio e diventano proprietà della **fonte**: è la
regola 1 dell'ADR 0052 applicata per la prima volta a più di una. La voce 1 guadagna una fine, e la
voce 6 resta dov'era **per scelta** — un dominio che dichiara l'attenzione più bassa del gioco deve
restare silenzioso, e le fonti non aggiungono un gesto da ripetere: aggiungono una scelta da
prendere.

### 2 · Il ciclo

Il tempo passa e i soldi entrano; si aprono fonti e si sale di livello, e ne entrano di più — finché
non c'è più un livello da comprare.

### 3 · Deve vedere, deve decidere, può andare male

**Deve vedere:** quali fonti esistono, quali sono aperte e **a che livello**; quanto rende ciascuna
adesso e quanto renderebbe al livello dopo; dove atterra ciò che produce; quanto manca al plateau; e
**quanto non è entrato** perché il caveau non lo teneva.

Il **prezzo no**, e non è una dimenticanza: nominarlo sul pannello sarebbe un'opzione di listino
fuori dal flusso di pagamento, che R24 vieta e che
l'[ADR 0042](../../adr/0042-il-pagamento-e-un-flusso-solo.md) ha deciso dopo D019. Si legge
comunque **prima di pagare**, dentro `PaymentDialog`, che è il senso che quella riga aveva.

**Deve decidere: in quale pozza vuole che atterrino i soldi.** Il prezzo non discrimina più — ogni
livello di ogni fonte rientra nello stesso tempo
([ADR 0053](../../adr/0053-un-miglioramento-dichiara-il-tempo-in-cui-rientra.md)) — quindi a
distinguere restano il regime della fonte, il tetto che la aspetta e la traccia che lascia.

**Può andare male:** fondi insufficienti sullo strumento che quella fonte chiede; la fonte è già al
livello massimo; il caveau pieno, e allora le fonti nere si fermano.

### 4 · Come muore il secondo milione

**Forma 1 — non ci sta. E adesso è sua**, che è il cambiamento più grosso di questa ricompilazione.

I livelli sono **finiti**. La somma di tutte le fonti al livello massimo è il **plateau**: un numero
dichiarato, calcolato da tre costanti, verificato da un bersaglio. Oltre il plateau il denaro non
compra più reddito attivo — il listino è vuoto, esattamente come quello del caveau in cima alla sua
scala.

È la legge 6 della [visione](../../prodotto/visione.md) scritta in codice per la prima volta: _«il
reddito attivo ha un tetto; il capitale no. Lo stipendio e i suoi upgrade arrivano a un plateau. Da
lì in poi si cresce solo mettendo il capitale a lavorare.»_

**Perché la risposta di prima non basta più.** La compilazione del 2026-08-21 diceva che la
saturazione del reddito non era sua: a fermarlo era `incomeThatFits` contro la capienza del caveau.
L'[ADR 0052](../../adr/0052-un-guadagno-dichiara-dove-atterra.md) ha sciolto quel legame per il
reddito in regola — sulla carta non c'è capienza — quindi da D043 in poi il reddito è un dominio che
**non satura**, cioè la cosa che la regola 3 chiama rotta. Non è un difetto di D043: è la
conseguenza che quella delega ha aperto e che questa chiude.

**Le fonti nere ne incontrano due, e i due tetti non sono lo stesso.** Il plateau è del reddito e
non si sposta; il muro del caveau è del caveau e si amplia. Ne discende che una fonte nera ha un
plateau **effettivo** più basso di quello dichiarato finché il caveau non è stato ampliato — ed è
questo, e non un requisito, ciò che le dà un ordine.

### 5 · Il requisito, e di che tipo è

**Nessuno.** Insieme al caveau è l'unico senza, e per la stessa ragione: il gioco deve poter
cominciare, e un requisito qui sarebbe un cancello sul primo secondo di partita.

**Ma ogni fonte oltre la prima ha un prezzo di apertura**, e il prezzo fa un lavoro che assomiglia a
un requisito senza esserlo: per aprire una fonte che si paga in contanti bisogna poterne **tenere**
abbastanza, quindi il caveau va ampliato prima. È la stessa forma di
`VAULT_EXPANSION_PRICE_RATIO` — il muro che insegna sé stesso — e la differenza con un requisito è
che si vede e si muove: il giocatore legge il prezzo dal primo secondo, e ci arriva quando ci
arriva.

### 6 · A quali due domini si collega, e come

| Dominio      | Come si collegano                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Caveau**   | **doppio, e da qui in avanti è il legame più stretto del gioco.** Le fonti nere nascono in contanti e a caveau pieno si fermano; **e i loro livelli si pagano in contanti**, quindi il caveau limita anche quanto in fretta crescono |
| **Bancomat** | i livelli del lavoro si pagano solo con la carta, e la carta si riempie solo dal bancomat. Chi resta in nero lascia una commissione a ogni livello; chi si è messo in regola no                                                      |
| **Calore**   | futuro (fetta 04): la fonte che rende di più e **si paga in calore**. La struttura la accoglie senza cambiare — è una riga nell'elenco delle fonti                                                                                   |
| **Abilità**  | futuro: i nodi si attaccano al bersaglio `income.all`, che questo dominio dichiara e che da D044 **non usa più nessuno**                                                                                                             |

**Il primo legame è il pezzo che D043 aveva rotto.** Quella delega si chiudeva dicendo _«il caveau
perde clienti finché non arriva la fetta 04: chi si mette in regola non ha più ragione di
ampliare»_. Una fonte che paga **e** si paga in contanti gli ridà un cliente, una fetta prima del
previsto, e senza toccare una riga del caveau.

### 7 · Cosa succede a finestra chiusa

Il reddito **matura**, ed è l'unico dei tre a farlo. Il recupero usa lo stesso codice del tempo
reale, con il tetto di un anno di gioco (`BALANCE.RECOVERY_CAP`).

Cosa può andare **contro** il giocatore: il caveau si riempie mentre è via, e da lì in poi le fonti
nere non valgono niente. Quella in regola sì.

Ne discende una cosa che prima non c'era: **chi si è messo in regola torna con più di chi è in nero,
e la differenza cresce col plateau.** È voluto — è il prezzo dell'anonimato, ed è coerente con
l'ADR 0052 — ma è la prima volta che la scelta del regime cambia **quanto vale una notte**, e chi
tara `INCOME_TAX_RATE` deve saperlo.

### 8 · Cosa prende in prestito, e cosa presta

**Prende in prestito:** il pool `cash` e il pool `card` (`contracts/pools.ts`), il listino
(`contracts/payment.ts`), e lo **spazio** del caveau — che arriva per costruzione, mai per import.

**Presta il bersaglio `income.all`** (`INCOME_TARGET`), e da D044 lo presta quasi nudo: i livelli
sono aritmetica pura sullo stato, non modificatori registrati, quindi **il gioco** non vi registra
più niente. È il gancio trasversale del progetto in attesa del suo primo cliente vero, che sarà
l'albero delle abilità.

L'unico che vi registra è il **devcheat** `cheat.income.boost` (`domains/income/cheats.ts`), e non è
un dettaglio da nascondere: è ciò che tiene `register` e `remove` provati da qualcosa che non sia un
loro test, cioè che impedisce al registro dei modificatori di diventare quel «campo provato e non
usato» che [D040](../../delega/D040-il-recupero-avanza-a-blocchi.md) ha già pagato una volta. In un
pacchetto di rilascio quel file non è raggiungibile, quindi lì il gancio è nudo davvero.

**Presta anche una forma**, ed è la prima volta che questo dominio ne presta una: _prezzo =
incremento × rientro_ ([ADR 0053](../../adr/0053-un-miglioramento-dichiara-il-tempo-in-cui-rientra.md)).
Vale per qualunque miglioramento che compri **resa**, e i domini che ne venderanno — impresa,
immobiliare, negozio — la trovano scritta invece di inventarne una ciascuno.

### 9 · Questo dominio si amministra?

**Sì**, e la sua destinazione è `income` (`DOMAIN_SCREENS`). Da D044 ha davvero qualcosa da
amministrare: un elenco di fonti con i loro livelli, invece del pulsante solo che
l'[ADR 0033](../../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md) aveva accettato come caso
limite. La pagina che era nata stretta cresce col dominio, che è ciò che quell'ADR prometteva.

---

## Metà kernel

| #   | Domanda                               | Reddito                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Ha stato?                             | **sì**: i livelli delle fonti e il regime. `load` valida ogni livello — intero, dentro la scala — e il booleano del regime; `reset` rimette `INITIAL`                                                                                                                          |
| 2   | Ticchetta? In quale `ORDER`?          | **sì**, `ORDER.INCOME`. Viene **dopo** `ECONOMY`, così al caricamento il caveau ritrova il livello prima che il recupero ticchetti                                                                                                                                             |
| 3   | Cosa fa con un `elapsed` grande?      | un `tick` per blocco, come oggi. **Non** incassa un rifiuto: chiede quanto ci sta e accredita quello, **per regime**                                                                                                                                                           |
| 4   | Soglie che si attraversano?           | **no, non sue**. Le attraversa quelle del caveau, e le vede da fuori con `room`                                                                                                                                                                                                |
| 5   | Cosa serve fuori dal `SystemContext`? | `ledger`, `modifiers` e `room`, tutti e tre per costruzione (ADR 0024). `modifiers` **resta anche se nessuno vi registra più niente**: è il punto di composizione di `income.all`, e toglierlo vorrebbe dire togliere il gancio                                                |
| 6   | Eventi, e domini importati?           | **nessun evento**, emesso o ascoltato. **Non importa nessun dominio**                                                                                                                                                                                                          |
| 7   | Quali `Reason` introduce?             | `reason.income.tick`, `reason.income.level` e `reason.income.declare`. Più due codici suoi, `error.income.max_level` e `error.income.already_declared`                                                                                                                         |
| 8   | Tocca il denaro? Quali pool?          | **sì.** In entrata il pool lo dichiara il regime **della fonte**, e il tick raggruppa **per regime**: una transazione per regime, non una per fonte né una per pool. In uscita `spend` con `accepts` generato dal listino della fonte, **per livello**. Nessuna capienza è sua |
| 9   | Conti propri per entità?              | **no**, e vale la pena dirlo perché una fonte _sembra_ un'entità: non ha un budget, non si crea e non si distrugge. L'elenco è fisso e dichiarato                                                                                                                              |
| 10  | Liste storiche?                       | **no**. Quanto non è entrato è un numero solo e descrive l'ultimo tick, non la partita: infatti non si salva                                                                                                                                                                   |
| 11  | Sapere che giorno è?                  | **no**. Riceve durate in tick, mai date                                                                                                                                                                                                                                        |
| 12  | Usa l'Rng?                            | **no**, e discende dalla varianza zero                                                                                                                                                                                                                                         |

**Numeri di gioco introdotti:** quanti livelli ha una fonte, di quanto cresce la resa a ogni
livello, in quanti secondi un livello rientra, e la resa base di ciascuna fonte. `INCOME_TAX_RATE` e
`INCOME_DECLARATION_PRICE_CARD` restano dov'erano. `UPGRADE_PRICE_CARD` e `UPGRADE_MULTIPLIER`
**spariscono**: erano il prezzo e l'effetto del pulsante solo.

**Bersagli lasciati:** `income_per_minute_at_start` resta e **deve restare verde** — la partita si
apre identica a oggi. Se ne aggiungono due: il **plateau**, cioè il tetto del reddito attivo, e il
**rientro**, cioè che ogni livello si ripaghi nel tempo dichiarato.

---

## Cosa questa compilazione ha trovato

**1. Da D043 il reddito non satura, e nessun test poteva dirlo.** La regola 3 della visione pretende
che ogni strumento dichiari come muore il secondo milione; la risposta del reddito era «il caveau»,
e l'ADR 0052 quel legame l'ha sciolto per il regime dichiarato. Il buco è di un giorno, ed è stato
trovato compilando la sezione 4 — non leggendo il codice, che è verde e a ragione.

**2. La domanda che la compilazione precedente si era prenotata ha una risposta, e ne porta un
difetto.** _«Cosa dice il dominio quando fa meno di quanto poteva?»_ era rimasta senza casella. La
risposta è il numero che oggi si chiama `withheld()` — e questa compilazione trova che il nome è
sbagliato: `withheld` è quanto il caveau non ha fatto entrare, `withholdingRate` è la parte dello
Stato. Due cose diverse con lo stesso nome, nello stesso dominio, dalla stessa delega.

**3. Il registro dei modificatori perde il suo unico cliente.** Il ×1,5 dell'upgrade è **l'unica**
registrazione in tutto il gioco: togliendolo, `register` e `remove` restano vivi solo nei propri
test — cioè diventano quel «campo provato e non usato» che nessun gate sa vedere e che
[D040](../../delega/D040-il-recupero-avanza-a-blocchi.md) ha già pagato una volta. Trovato
compilando la domanda 5.

**4. Una fonte sembra un'entità e non lo è**, ed è la domanda 9 che lo rende visibile. Non ha conti
propri, non ha ciclo di vita, non nasce da una scelta del giocatore: l'elenco è dichiarato e fisso.
Ne discende che il grilletto delle **collezioni di entità** nel registro YAGNI **non** scatta qui, e
nemmeno quello dei conti dinamici.

**5. Il salvataggio cambia forma, e il grilletto delle migrazioni scatta davvero.** Lo stato passa
da due booleani a un elenco di livelli. Il runner esiste da [D009](../../delega/D009-persistenza-main.md)
ed è provato con migrazioni finte; la sua mappa è **vuota** e aspetta la versione 2. Questa è la
prima vera, e il registro lo dichiarava da cinque fette.

**6. Il criterio della cadenza di salvataggio era appeso a un reddito fermo.** `AUTOSAVE_SECONDS`
scrive nel proprio commento _«il reddito massimo che questo gioco raggiunge oggi è 18,00 €/s»_. Da
qui non è più vero. Il criterio sopravvive — con l'ADR 0053 i prezzi crescono **insieme** a ciò che
una scrittura mancata fa perdere — ma il margine si stringe, e va rimisurato invece che ereditato.

---

## Cosa la rilettura contro `src/` ha corretto

La scheda è stata compilata **prima** che il dominio esistesse, e rileggerla contro il codice il
giorno dopo è il controllo che [D018](../../delega/D018-la-scheda-di-dominio.md) si era prenotato.
Tre righe non tornavano. **Nessuna delle tre cambia una decisione di gioco**, ed è il punto: una
scheda che sbaglia sul come e non sul cosa è una scheda che ha fatto il proprio lavoro.

**1. «Il tick raggruppa per pozza» era la parola sbagliata, e la delega aveva già la ragione.** La
metà kernel diceva «una transazione per pozza»; il codice raggruppa **per regime**. Sembrano la
stessa cosa finché due regimi non condividono un pool con trattenute diverse — e allora la
trattenuta di una transazione sola andrebbe scalata sul parziale, cioè divisa fra `Decimal`, cioè
precisione persa e INV-08 rotta in silenzio. Oggi i due regimi stanno su due pool diversi e le due
descrizioni coincidono: è precisamente il caso in cui una parola sbagliata non fa rumore.

**2. Il pannello non dice il prezzo, e non deve.** La sezione 3 chiedeva «quanto costa quel livello
e con quale strumento si paga, letto prima di premere», citando D019. Era vero quando D019 l'ha
scritto e non lo è più: l'[ADR 0042](../../adr/0042-il-pagamento-e-un-flusso-solo.md) ha spostato
prezzo e scelta dentro `PaymentDialog`, e R24 rende rosso un componente che li nomina fuori di lì.
**È la stessa riga che la rilettura della [scheda del caveau](vault.md) aveva già corretto**, con la
stessa causa: una scheda scritta prima di un'ADR che le è passata sopra.

**3. Il gancio `income.all` non è nudo: ha un cliente, ed è il devcheat.** La sezione 8 diceva che
dentro il dominio non vi registra più nessuno. `domains/income/cheats.ts` sì —
`cheat.income.boost` accende e spegne un `mult` — ed è deliberato: senza, `register` e `remove`
resterebbero vivi solo nei propri test. La riga corretta distingue **il gioco**, che non registra
niente, da **lo strumento di sviluppo**, che è l'unica cosa che tiene quel gancio percorso.

### E una cosa che la scheda non prevedeva, trovata scrivendo il codice

**I modificatori si compongono per regime, non sulla somma delle fonti.** La delega diceva
«`incomePerSecond` — la somma delle fonti, poi i modificatori su `income.all`», e il tick ha bisogno
di un importo **per regime**: ripartire un totale già composto vorrebbe dire dividere fra `Decimal`,
cioè la trappola che la delega stessa vietava due paragrafi più in là. La composizione è quindi
scesa dentro il gruppo, e `incomePerSecond` somma ciò che i gruppi hanno già composto — una formula
sola, letta da due parti, invece di due che devono coincidere.

**Per un `mult` i due risultati sono identici**, perché moltiplicare è distributivo, e `mult` è
l'unico tipo che qualcuno registri oggi su `income.all`. Per un `add` no: si sommerebbe a **ogni**
regime. È la riga da rileggere il giorno in cui l'albero delle abilità diventa il primo cliente
vero, ed è scritta dov'è il codice invece che solo qui.
