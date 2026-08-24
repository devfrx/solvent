# Solvent — mappa funzionale

**Documento di consegna per la progettazione dell'interfaccia.** Descrive **cosa fa** il software
e **quali informazioni, decisioni ed esiti** l'interfaccia dovrà reggere quando il gioco sarà
completo. È autoconsistente: non serve leggere il codice né gli altri documenti del repository.

**Cosa questo documento NON contiene, deliberatamente:** colori, tipografia, spaziature, griglie,
nomi di componenti, elenco delle schermate, gerarchia di navigazione, tono visivo. Quelle sono
decisioni di design e non sono state prese. Qui c'è solo la materia prima: il dominio, i suoi
vincoli e la sua crescita.

Lingua del documento: italiano. Il software si spedisce in **italiano e inglese**, entrambe
obbligatorie.

---

## 1. Cos'è Solvent

Un **idle/tycoon finanziario per desktop**. Il giocatore parte da uno stipendio e arriva a
governare un patrimonio fatto di immobili, imprese, posizioni di mercato e traffici illegali. Il
tempo passa anche mentre non guarda: riaprire il gioco significa scoprire cosa è successo.

Non ha un'attività principale con dei contorni. È una **sandbox di diciassette domini** che si
contendono le stesse risorse. Nessuno si sblocca: ognuno dichiara un requisito, e il giocatore lo
soddisfa quando ci riesce, nell'ordine che si costruisce da sé.

### La tensione centrale: contanti contro carta

Tutto il gioco ruota attorno a una scelta sola, ripetuta all'infinito con conseguenze diverse.

|                         | **Contanti**                     | **Carta**                       |
| ----------------------- | -------------------------------- | ------------------------------- |
| Tracciabilità           | nessuna                          | totale                          |
| Capacità                | limitata: occupano spazio fisico | illimitata                      |
| Interessi e credito     | nessuno                          | sì, e costruiscono il punteggio |
| Black market            | conveniente, poco visibile       | accettata, ma molto visibile    |
| Investimenti e prestiti | possibile ma penalizzato         | la via naturale                 |
| Rischio                 | furto, perquisizione, perdita    | blocco del conto, commissioni   |

Entrambi si possono usare **ovunque**: non ci sono muri, ci sono convenienze e conseguenze. Il
**bancomat** è il ponte fra i due, e trattiene una commissione in entrambe le direzioni.

**Conseguenza per l'interfaccia:** ogni volta che compare un importo, il giocatore deve poter
capire **di quale strumento** si tratta. Un numero senza strumento è ambiguo in un gioco dove i
due strumenti hanno regole opposte. Più avanti gli strumenti diventano quattro (contanti, carta,
fiches del casinò, crypto).

### Le tre risorse scarse

Il denaro non è la risorsa scarsa: in un idle cresce sempre. Le risorse vere sono tre.

| Risorsa        | Cos'è                                | Cosa la consuma                                           | Cosa la restituisce                    | Il tetto che impone                   |
| -------------- | ------------------------------------ | --------------------------------------------------------- | -------------------------------------- | ------------------------------------- |
| **Denaro**     | il punteggio                         | tutto                                                     | tutto                                  | nessuno                               |
| **Calore**     | quanto sei visibile alle autorità    | black market, riciclaggio, insider, movimenti grossi      | il tempo, i consulenti, la reputazione | l'indagine: conti bloccati, sequestri |
| **Attenzione** | quante cose riesci davvero a seguire | ogni entità gestita a mano: attività, immobili, posizioni | delegare — che costa margine ed errori | quante cose puoi tenere in aria       |

Calore e attenzione non si comprano. Sono i due limiti che rendono una scelta una scelta.

**Conseguenza per l'interfaccia:** oltre al denaro esistono almeno due grandezze non monetarie,
sempre presenti, con una soglia oltre la quale succede qualcosa di brutto. Il giocatore deve
poterle leggere senza cercarle.

### Come si apre il gioco: requisiti, non fasi

**Nessun dominio si sblocca.** Ognuno dichiara un requisito, e il giocatore lo soddisfa quando ci
riesce, nell'ordine che si costruisce da sé. Non esiste una progressione che decida quando è
pronto.

I requisiti sono di **tipi diversi**, e questo è ciò che rende vero il sandbox: se fossero tutti
«avere X euro», l'ordine di apertura sarebbe identico per tutti.

| Tipo                             | Esempio                                     |
| -------------------------------- | ------------------------------------------- |
| Uno strumento                    | il mercato azionario vuole un conto titoli  |
| Una relazione                    | il black market vuole un contatto           |
| Un punteggio costruito nel tempo | i prestiti vogliono uno storico sulla carta |
| Una cosa che possiedi            | l'impresa vuole una sede                    |

**Per l'interfaccia significa due cose.** Un requisito va **mostrato** prima di essere soddisfatto,
in modo che si possa lavorarci — «serve un conto titoli: 500 €» — e non deve mai essere un
contatore invisibile. E la superficie iniziale non è vuota: **il pulito si vede, il grigio si
scopre.** Banche, broker, depositi, immobiliare sono elencati dal primo secondo; il black market e
certi contatti compaiono solo incontrandoli.

### La casa: cosa ogni strumento deve dichiarare

Perché diciassette domini stiano sullo stesso scaffale, ognuno dichiara le stesse **nove voci**:
rendimento, varianza, liquidità, tracciabilità, calore, attenzione, **pozza**, pagamento, requisito.

Per l'interfaccia sono esattamente le colonne di qualunque confronto fra strumenti, e la ragione
per cui un pannello di dominio non può mostrarne solo tre.

La **pozza** è la voce nuova: quanto uno strumento regge prima che l'attrito morda. Non esiste uno
strumento che assorba denaro all'infinito senza peggiorare — tranne uno, il deposito, che infatti
rende meno di tutti. Il giocatore deve poter vedere **quanto è pieno** ciò in cui sta versando.

### Le sei leggi che tengono in piedi il bilanciamento

Sono rilevanti per l'interfaccia perché descrivono cosa il giocatore deve poter **confrontare**.

1. **Nessun rendimento senza uno svantaggio.** Ogni fonte di guadagno paga in almeno una di
   quattro monete: **liquidità** (i soldi sono bloccati), **tracciabilità** (lasci impronte),
   **varianza** (a volte perdi), **attenzione** (devi seguirlo).
2. **Il rendimento atteso cresce meno del rischio.** Raddoppiare il guadagno costa più del doppio
   in varianza, calore o attenzione.
3. **Ogni strumento dichiara come muore il secondo milione.** Una delle quattro forme: non ci sta,
   ci sta ma non produce, ci sta ma lo paghi peggio, ci sta ma ti fa notare.
4. **Nessuno strumento domina un altro su tutte le voci dell'etichetta.**
5. **Il banco vince sempre un po'.** Ogni conversione costa: commissione del bancomat, spread
   delle fiches, commissione di rete della crypto, diritti d'asta, provvigione dell'agenzia.
6. **Il reddito attivo ha un tetto; il capitale no.** Lo stipendio arriva a un plateau. Da lì si
   cresce solo mettendo il capitale a lavorare.

I rapporti fra i domini sono realistici, i valori assoluti sono scala di gioco. L'ordine dei
rendimenti attesi, e cosa si paga per ognuno:

| Dominio            | Rendimento atteso (annuo)                     | Cosa paghi                      |
| ------------------ | --------------------------------------------- | ------------------------------- |
| Deposito vincolato | 2 – 4 %                                       | liquidità                       |
| Immobiliare, netto | 3 – 5 %                                       | liquidità e attenzione          |
| Mercato azionario  | 7 – 10 %, volatilità 15 – 25 %                | varianza                        |
| Impresa            | 10 – 20 % sul capitale investito              | molta attenzione                |
| Crypto             | 0 – 15 %, oppure −80 %, volatilità 60 – 100 % | varianza estrema                |
| Black market       | +30 – 80 % per operazione                     | calore                          |
| Aste               | +0 – 30 % atteso, varianza altissima          | informazione imperfetta         |
| Casinò             | **−2 – −8 % per giro**                        | è il prezzo della varianza      |
| _Prestito (costo)_ | _5 – 20 % secondo il punteggio_               | _è l'altra parte del confronto_ |

---

## 2. I diciassette domini

Per ognuno: il ciclo di gioco, cosa il giocatore **deve poter vedere**, cosa **deve poter
decidere**, come **può andare male**, e quanto **pesa** in termini di quantità di roba a schermo.

### 2.1 — Contanti e cose fisiche

#### 1. Reddito

**Ciclo:** il tempo passa e i soldi entrano. Si aprono fonti e si sale di livello, e ne entrano di
più — finché non c'è più un livello da comprare.
**Deve vedere:** quanto entra per unità di tempo; il totale accumulato; quali fonti di reddito
sono attive e a che livello; **dove atterra** ciò che ognuna produce e quanto ne viene trattenuto;
quanto costa il livello successivo, con quale strumento si paga, e quanto manca al plateau.
**Deve decidere:** in quale pozza vuole che atterrino i soldi. Ogni livello di ogni fonte rientra
nello stesso tempo ([ADR 0053](../adr/0053-un-miglioramento-dichiara-il-tempo-in-cui-rientra.md)),
quindi il prezzo non discrimina: a discriminare sono il regime della fonte, il tetto che la aspetta
e la traccia che lascia. E sopra a tutto: il reddito attivo ha un plateau, il capitale no.
**Può andare male:** **ogni fonte dichiara con quale strumento si comprano i suoi livelli** — la
carta per il lavoro, i contanti per i lavoretti — e da
[D019](../delega/D019-il-pagamento.md) lo si legge **prima** di premere, accanto al prezzo, invece
di scoprirlo sbagliando. Se lo strumento non basta l'azione viene rifiutata con una spiegazione, non
disabilitata in silenzio. In cima alla scala non c'è più niente da comprare, ed è un esito
raccontato, non un pulsante spento.
**Pesa:** poco. Una manciata di fonti, ciascuna con nome, livello, effetto e costo.

#### 2. Bancomat

**Ciclo:** deposita contanti sul conto, preleva contanti dal conto. Ogni operazione trattiene una
commissione.
**Deve vedere:** i due saldi affiancati; l'importo che sta muovendo; **prima di confermare**, la
scomposizione esatta di cosa succede — quanto esce, quanto entra, quanto se ne va in commissione;
lo storico recente delle operazioni.
**Deve decidere:** quanto spostare e in che direzione, sapendo che il contante non scala e la
carta lascia tracce.
**Può andare male:** fondi insufficienti; capienza del caveau superata in prelievo; importo zero o
negativo; commissione che si mangia l'intero importo.
**Pesa:** poco, ma è il gesto più ripetuto del gioco.

#### 3. Caveau

**Ciclo:** conserva contanti e oggetti fisici. Ha una capienza. Si amplia, ma non all'infinito.
**Deve vedere:** quanto spazio è occupato e quanto ne resta; quanto costa ampliarlo; cosa c'è
dentro oltre al denaro (oggetti, con condizione e provenienza).
**Deve decidere:** quando smettere di accumulare contanti e portarli in banca, accettando la
traccia.
**Può andare male:** pieno. Il reddito **smette di entrare** — accredita quanto ci sta, e il resto
non entra ([D017](../delega/D017-il-caveau.md)) — e la schermata lo dice invece di lasciarlo
scoprire da un numero che non sale. La perquisizione lo svuota; il furto no, per scelta: la varianza
del caveau è zero ([scheda](domini/vault.md)).
**Pesa:** medio. È un contenitore con un tetto **e** un inventario di oggetti eterogenei.

#### 4. Calore

**Ciclo:** accumula visibilità con le azioni grigie, scende da solo col tempo o pagando qualcuno
per ripulire.
**Deve vedere:** il livello attuale rispetto alla soglia che fa scattare un'indagine; **cosa** lo
ha alzato di recente e di quanto; quanto scende per unità di tempo.
**Deve decidere:** se un'operazione redditizia vale il calore che genera, adesso, con il livello
che ha adesso.
**Può andare male:** superata la soglia scatta un'indagine, e metà del gioco si chiude.
**Pesa:** poco in superficie, ma è presente **sempre**, in ogni schermata di ogni dominio grigio,
e ogni azione grigia deve poter dichiarare in anticipo quanto calore costa.

#### 5. Black market

**Ciclo:** sblocca contatti, tratta con loro, incassa. Prezzi ottimi, calore alto.
**Deve vedere:** i contatti disponibili, ciascuno con reputazione, specialità e affidabilità; cosa
offrono e a che prezzo; quanto calore costa l'operazione; quali strumenti di pagamento accettano.
**Deve decidere:** quale contatto usare, con che strumento pagare, e se il margine vale
l'esposizione.
**Può andare male:** il contatto rifiuta la carta; il contatto sparisce; l'operazione attira
un'indagine; una retata chiude il dominio per un periodo.
**Pesa:** medio. Una lista di contatti con attributi, più una trattativa per volta.

#### 6. Aste di box

**Ciclo:** punta al buio su un lotto che vedi solo a metà, aggiudicatelo, aprilo, valuta cosa c'è
dentro, rivendi.
**Deve vedere:** l'anteprima parziale del lotto; un **intervallo** di valore stimato, non un
valore — e l'intervallo si restringe con la perizia, non si azzera; gli altri offerenti, ciascuno
con budget, stile e pazienza diversi; il rilancio corrente e il tempo che resta; nelle sessioni
multi-lotto, **il budget totale residuo** e quanti lotti mancano.
**Deve decidere:** fino a quanto salire, sapendo che vincere il primo lotto significa non poter
puntare sul terzo.
**Può andare male:** aggiudicarsi un lotto che vale meno di quanto è costato; costi nascosti di
smaltimento; un avversario che ti fa salire di proposito.
**Pesa:** alto durante l'asta. È l'unico dominio con **pressione di tempo reale** e un avversario
che risponde.

#### 7. Negozio e restauro

**Ciclo:** compra oggetti, restaurali, rivendili o mettili all'asta.
**Deve vedere:** l'inventario con condizione, rarità e provenienza di ogni oggetto; il valore
corrente, che è condizione × rarità × domanda, e la domanda oscilla; costo e durata di un
restauro; dove conviene vendere (negozio pulito, black market se l'oggetto non è pulito).
**Deve decidere:** restaurare o vendere com'è; vendere adesso o aspettare che la domanda risalga.
**Può andare male:** restauro che costa più del guadagno; oggetto invendibile che occupa spazio;
smaltimento che **costa**.
**Pesa:** alto. È il primo inventario vero, con decine di oggetti e sei attributi ciascuno.

### 2.2 — Il capitale

#### 8. Prestiti e punteggio di credito

**Ciclo:** chiedi un prestito, usa la leva, rimborsa. Il tasso dipende dal punteggio.
**Deve vedere:** il punteggio di credito e i **fattori visibili e controllabili** che lo compongono
— utilizzo, storico dei pagamenti, anzianità, mix; il tasso che ne consegue; i prestiti in corso
con capitale residuo, rata, scadenza; le garanzie impegnate.
**Deve decidere:** se prendere a prestito, quanto, e se il rendimento dell'investimento supera il
tasso. Il gioco lascia fare anche l'errore.
**Può andare male:** insolvenza. Le garanzie vengono escusse, la carta si blocca, il punteggio
crolla.
**Pesa:** medio. Pochi prestiti, ma ciascuno con uno scadenzario e un punteggio con più fattori.

#### 9. Depositi vincolati

**Ciclo:** blocca una somma per un periodo, riscuoti gli interessi alla scadenza.
**Deve vedere:** durata, tasso, quanto manca alla scadenza, quanto ha maturato finora, la penale
se rompe il vincolo prima.
**Deve decidere:** liquidità contro rendimento. È la scelta più pulita del gioco.
**Può andare male:** serve liquidità e il denaro è bloccato; romperlo costa la penale.
**Pesa:** poco, ma introduce le **scadenze** e il concetto di denaro che esiste ma non è
disponibile.

#### 10. Mercato azionario

**Ciclo:** analizza, apri una posizione, gestiscila, chiudila.
**Deve vedere:** i titoli, ciascuno con settore e prezzo; l'andamento storico in **candele OHLC** —
un grafico che si legge, non una linea decorativa; la fase corrente del mercato (toro, orso,
laterale, crollo), che non viene annunciata quando cambia; le correlazioni fra settori, perché
diversificare significhi qualcosa; le posizioni aperte con prezzo di carico, valore corrente,
profitto o perdita, leva usata e **margine residuo**; gli ordini pendenti con la loro condizione.
**Deve decidere:** cosa comprare, con che tipo di ordine (a mercato, con limite, stop-loss), lungo
o corto, con quanta leva.
**Può andare male:** **margin call** — se il margine non regge, la posizione si chiude da sola, in
perdita, mentre il giocatore non sta guardando. È il modo più veloce di perdere tutto.
**Pesa:** molto alto. Serie storiche, molte posizioni contemporanee, ordini pendenti, un evento
subìto che può arrivare in qualsiasi momento.

#### 11. Immobiliare e affitti

**Ciclo:** compra in un distretto, migliora, affitta o rivendi. Il canone non è un incasso: è un
**contratto con una controparte**.
**Deve vedere:** la città divisa in distretti, ciascuno con tendenza di prezzo, domanda di affitti
e degrado; per ogni immobile: tipo, condizione, valore di mercato, canone potenziale, mutuo se
c'è; le migliorie disponibili e il fatto che agiscono **in modo diverso** — il bagno alza il
canone, la facciata alza il valore; l'inquilino con contratto, durata, deposito cauzionale e
un'affidabilità che **non si vede tutta prima di firmare**; la differenza fra rendita lorda e
netta, cioè cosa si mangiano sfitto, guasti e tasse.
**Deve decidere:** rendita o plusvalenza; affittare o rivendere; comprare a leva o in contanti;
sfrattare o aspettare.
**Può andare male:** l'inquilino paga tardi o smette; lo sfratto costa tempo e denaro e nel
frattempo non entra niente; lo sfitto fra un contratto e l'altro costa e non rende; un guasto non
riparato fa calare condizione, canone e rinnovo; il canone non copre la rata.
**Pesa:** molto alto. Un portafoglio di immobili, ciascuno con sette-otto attributi, un contratto,
uno scadenzario e uno stato di manutenzione.

### 2.3 — Possedere e rischiare

#### 12. Impresa

**Ciclo:** compra un'attività, assumi, apri filiali, regola le politiche.
**Deve vedere:** per ogni attività un **bilancio vero** — cassa, ricavi, costi, margine; la sede,
affittata o di proprietà, con il distretto che decide il passaggio e quindi la domanda; il
personale, che è un costo fisso che non cala quando cala il fatturato; le politiche con il loro
trade-off esplicito (prezzo alto = margine alto e volume basso; qualità alta = reputazione lenta e
costi immediati; orari lunghi = più ricavi e più turnover); lo stato che peggiora da solo —
domanda locale, scorte, reputazione, usura; le sinergie fra attività dello stesso settore.
**Deve decidere:** dove aprire, che politiche tenere, quando assumere un manager sapendo che
prende una percentuale e sbaglia.
**Può andare male:** budget sotto zero oltre il fido = insolvenza. L'attività chiude, i debiti
restano, il punteggio di credito ne risente.
**Pesa:** il più alto del gioco. Molte attività, ciascuna con un bilancio, una sede, del personale
e cinque politiche. **Qui vive il muro dell'attenzione**: oltre poche attività non si arriva a
regolarle a mano.

#### 13. Casinò

**Ciclo:** cambia contanti in fiches, gioca, ricambia in contanti.
**Deve vedere:** le fiches come **terza valuta con spread** — il banco guadagna sulla conversione
in entrata **e** in uscita, anche quando vinci; per ogni gioco, la varianza e il **ritorno
dichiarato**, perché il giocatore possa calcolare l'aspettativa e vedere che è negativa; i limiti
di puntata, che dipendono dallo status e si alzano giocando, non pagando; il calore generato dal
cambio.
**Deve decidere:** se scambiare varianza contro attrito, e quanto.
**Può andare male:** si perde. Sempre un po', per costruzione. E cambiare troppi contanti alza il
calore: il casinò è la lavanderia più cara e più vistosa del gioco.
**Pesa:** medio. Pochi giochi, ma ognuno è un'interazione con esito immediato e ripetuta molte
volte di seguito.

#### 14. Crypto

**Ciclo:** come il mercato azionario, con altri numeri e due differenze strutturali.
**Deve vedere:** le stesse cose del mercato — prezzo, storico, posizioni — più: volatilità tre o
quattro volte più alta; commissioni di rete; il fatto che **non dorme**, quindi corre anche a
gioco chiuso e al rientro il giocatore trova un mondo cambiato; il fatto che **si compra in
contanti**, l'unico ponte fra contanti e capitale che non passa dal bancomat, e per questo alza il
calore.
**Deve decidere:** se usare l'unica scorciatoia che salta il bancomat, pagandola in visibilità.
**Può andare male:** −80 %. E l'ha fatto mentre il gioco era chiuso.
**Pesa:** alto, come il mercato.

#### 15. Albero delle abilità

**Ciclo:** guadagna punti, scegli il ramo.
**Deve vedere:** l'albero con i nodi presi, disponibili e bloccati; **cosa sblocca ogni nodo** —
i nodi non danno percentuali, sbloccano azioni; i rami mutuamente esclusivi che definiscono un
archetipo: legale, grigio, criminale; cosa si sta rinunciando a prendere.
**Deve decidere:** che tipo di giocatore essere, in modo non del tutto reversibile.
**Può andare male:** una scelta di ramo chiude l'altro per quella partita.
**Pesa:** alto in una sola volta. È una struttura ad albero con molti nodi e dipendenze fra loro.

### 2.4 — Le conseguenze

#### 16. Eventi periodici

**Ciclo:** accadono, e tu duri o approfitti. Non sono pop-up con un bonus: **cambiano le regole**
per un periodo.
**Deve vedere:** cosa sta accadendo adesso, per quanto ancora, e **quali regole sono cambiate** e
in quali domini — un'ispezione fiscale rende la carta rischiosa, una retata chiude il mercato
nero, un crollo apre occasioni immobiliari.
**Deve decidere:** aspettare che passi o sfruttarlo.
**Può andare male:** un dominio su cui si contava è chiuso proprio adesso.
**Pesa:** medio, ma **trasversale**: un evento attivo deve essere percepibile da dentro i domini
che tocca, non solo in un elenco a parte.

#### 17. Indagini

**Ciclo:** il calore sfonda la soglia, tu subisci, ti difendi.
**Deve vedere:** che è in corso e a che punto è; **cosa è stato congelato o sequestrato**; cosa
resta ancora accessibile; quali difese esistono e quanto costano; quanto manca alla fine.
**Deve decidere:** come difendersi e cosa salvare.
**Può andare male:** conti congelati, beni sequestrati, un periodo in cui metà del gioco è chiuso.
**Pesa:** medio, ma è lo stato più invasivo del gioco: mentre è attivo, molte azioni altrove sono
negate — e ognuna deve dire perché.

### 2.5 — Fuori dai domini: i traguardi

I traguardi **non sono un dominio**: non ci si versa denaro, non hanno una pozza e non dichiarano
un'etichetta. Stanno qui perché a schermo occupano lo stesso spazio di un dominio, e l'interfaccia
deve reggerli come tale.

Non c'è prestige e non c'è una fine: la partita è una, lunga, e ricominciare è una partita nuova
con un mondo diverso. I traguardi sono ciò che le dà forma.

**Ciclo:** giochi, e ogni tanto una cosa che hai fatto viene riconosciuta.
**Deve vedere:** i traguardi raggiunti e quelli aperti, con quanto manca a ciascuno; quelli che
richiedono di **non** aver fatto qualcosa, che vanno distinti perché si perdono invece di
guadagnarsi.
**Deve decidere:** niente. È l'unico blocco del documento senza una decisione, ed è deliberato.
**Può andare male:** niente. Un traguardo **non apre niente** — se aprisse, sarebbe un cancello
con un nome gentile, e il gioco è una sandbox.
**Pesa:** poco, ma va sempre raggiungibile: è l'unico posto che dice al giocatore cosa si può
fare senza dirgli cosa deve fare.

---

## 3. Inventario trasversale

Questa è la sezione che dice davvero **cosa deve saper fare l'interfaccia**. I diciassette domini
qui sopra, e i traguardi, si riducono a un numero finito di tipi di informazione, azione, esito e
stato. Un sistema di design che li copre tutti copre il gioco intero.

### 3.1 — Tipi di informazione da mostrare

| #   | Informazione                             | Descrizione                                                                                                                                            | Quanto spesso cambia          |
| --- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| 1   | **Importo di denaro**                    | Sempre associato a uno **strumento** (contanti, carta, fiches, crypto). Numeri che vanno da unità a molti ordini di grandezza.                         | fino a 10 volte al secondo    |
| 2   | **Variazione di un importo**             | Entrata o uscita, guadagno o perdita. Il segno è l'informazione, non il decoro.                                                                        | continua                      |
| 3   | **Flusso**                               | Quanto entra o esce per unità di tempo (reddito al secondo, canone al mese, costo fisso).                                                              | lenta                         |
| 4   | **Percentuale e tasso**                  | Rendimenti, tassi d'interesse, ritorno del banco, margine, volatilità. Vanno confrontati fra domini diversi.                                           | lenta                         |
| 5   | **Quantità con un tetto**                | Caveau, plafond, margine residuo, budget d'asta, attenzione, fido. Serve sapere quanto resta, non solo quanto è usato.                                 | variabile                     |
| 6   | **Livello di rischio non monetario**     | Calore, affidabilità di un inquilino, reputazione, condizione di un immobile, status al casinò.                                                        | lenta, ma con soglie critiche |
| 7   | **Soglia con conseguenza**               | Un valore oltre il quale scatta qualcosa di irreversibile: indagine, margin call, insolvenza, caveau pieno.                                            | —                             |
| 8   | **Stima invece di valore**               | Un **intervallo**, non un numero: il lotto d'asta, la perizia. Ridurre l'incertezza è una meccanica; azzerarla ucciderebbe la scelta.                  | per operazione                |
| 9   | **Serie storica**                        | Candele OHLC per mercato e crypto; andamento del patrimonio; storico del punteggio di credito. Liste a lunghezza limitata.                             | continua                      |
| 10  | **Tempo e scadenze**                     | Quanto manca a una scadenza (contratto, deposito, rata, asta); da quanto dura uno stato; quanto tempo è passato a gioco chiuso.                        | continua                      |
| 11  | **Entità con stato proprio**             | Immobile, attività, posizione, oggetto, inquilino, contatto, prestito, nodo abilità. Ognuna con 5–8 attributi e un ciclo di vita.                      | lenta                         |
| 12  | **Collezione di entità**                 | Da poche a molte decine, da confrontare, ordinare e filtrare. Ogni entità può essere in uno stato anomalo che va notato subito.                        | lenta                         |
| 13  | **Registro di eventi economici**         | Ogni movimento di denaro ha una **ragione** (perché è avvenuto) e una **categoria** (reddito, acquisto, trasferimento, commissione).                   | continua                      |
| 14  | **Anteprima di un'operazione**           | Prima di confermare: cosa esce, cosa entra, cosa se ne va in commissione, che calore genera. Non un totale: la **scomposizione**.                      | per operazione                |
| 15  | **Confronto fra alternative**            | Due politiche d'impresa, due migliorie, due rami dell'albero, vendere adesso contro tenere. Ogni scelta sposta almeno due numeri in direzioni opposte. | —                             |
| 16  | **Disponibile / bloccato / sconosciuto** | Un dominio non ancora aperto, un nodo non ancora raggiungibile, un'informazione che il giocatore non ha ancora comprato.                               | per era                       |
| 17  | **Regole temporaneamente cambiate**      | Un evento attivo che modifica il comportamento di uno o più domini. Deve essere percepibile **dentro** il dominio che tocca.                           | occasionale                   |
| 18  | **Progresso di era**                     | Dove sei nella progressione, cosa si è aperto, cosa manca per il prossimo muro.                                                                        | molto lenta                   |
| 19  | **Effetto a distanza**                   | Una scelta qui cambia cosa puoi fare là. Un dominio che si collega solo al saldo è un minigioco, non un sistema.                                       | —                             |

### 3.2 — Tipi di azione

| #   | Azione                               | Esempi                                                                                   | Cosa serve                                                 |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | **Immediata, non può fallire**       | girare la carta, cambiare schermata, ordinare una lista                                  | niente                                                     |
| 2   | **Immediata, può essere rifiutata**  | comprare un potenziamento                                                                | il motivo del rifiuto, sempre                              |
| 3   | **Con anteprima e conferma**         | depositare, prelevare, comprare un immobile, rompere un vincolo                          | la scomposizione prima di confermare                       |
| 4   | **Con esito incerto**                | puntare a un'asta, scommettere, aprire una posizione                                     | l'aspettativa dichiarata prima, l'esito dopo               |
| 5   | **Con importo da scegliere**         | quanto depositare, quanto puntare, quanta leva                                           | limiti minimi e massimi visibili, effetto che si aggiorna  |
| 6   | **Irreversibile o con penale**       | sfratto, rompere un deposito, scegliere un ramo dell'albero, vendere un'attività         | cosa si perde, prima                                       |
| 7   | **Impostata una volta, poi ricorre** | politiche d'impresa, ordini con limite, stop-loss                                        | lo stato dell'impostazione, e quando si attiverà           |
| 8   | **Delegata**                         | assumere un manager: qualcun altro agisce al posto tuo, prende una percentuale e sbaglia | cosa ha fatto il delegato, e cosa ha sbagliato             |
| 9   | **Subita** — non parte dal giocatore | margin call, indagine, guasto, inquilino che smette di pagare, evento                    | notifica che non si perde, e cronologia di cosa è successo |
| 10  | **Con pressione di tempo**           | il rilancio all'asta                                                                     | il tempo residuo, e un avversario che risponde             |

### 3.3 — Tipi di esito

Il gioco tratta il **rifiuto spiegato** come una cosa di prima classe. Un'azione che non si può
fare non è un pulsante spento: è un messaggio che dice esattamente cosa manca. Questi sono gli
esiti già esistenti oggi, e la forma vale per tutti quelli futuri:

| Esito                         | Cosa dice al giocatore                                |
| ----------------------------- | ----------------------------------------------------- |
| Fondi insufficienti           | «Ti servono X su [strumento], ne hai Y.»              |
| Capienza superata             | «[strumento] non tiene più di X: ci stanno ancora Y.» |
| Strumento non accettato       | «Non si paga con [strumento]. Si accetta: [elenco].»  |
| Importo non valido            | «Serve un importo maggiore di zero, non X.»           |
| Costo che eccede il beneficio | «La commissione di X si mangia tutti gli Y.»          |
| Già fatto                     | «È già stato comprato.»                               |

Quattro famiglie, e tutte e quattro hanno bisogno di una forma:

1. **Riuscita** — l'operazione è avvenuta, e ha lasciato una riga nel registro.
2. **Rifiuto spiegato** — l'operazione non è possibile, e il messaggio dice cosa manca e quanto.
3. **Fallimento subìto** — è successo qualcosa di brutto che il giocatore non ha chiesto.
4. **Errore di sistema** — il salvataggio non si legge o non si scrive. Non è un crollo: è uno
   stato con delle uscite (vedi 3.4).

### 3.4 — Stati

**Stati dell'applicazione** (esistono già, sono sette e la macchina a stati è reale):

| Stato           | Cosa succede                                                                                |
| --------------- | ------------------------------------------------------------------------------------------- |
| **Avvio**       | la finestra si sta aprendo; non c'è ancora niente                                           |
| **Caricamento** | si legge il salvataggio; **il gioco non avanza**                                            |
| **Recupero**    | si eseguono i tick del tempo passato a gioco chiuso; c'è un tetto a quanti se ne recuperano |
| **In gioco**    | il gioco avanza dieci volte al secondo                                                      |
| **Sospeso**     | la finestra è nascosta; **niente avanza**. Al ritorno si passa da Recupero                  |
| **Errore**      | due cause diverse (caricamento fallito, salvataggio fallito) con **uscite diverse**         |
| **Chiusura**    | si sta scrivendo il salvataggio; la finestra non si chiude finché non è finito              |

Il recupero produce un'informazione di gioco: **«sei stato via X»**, e quanto tempo è stato
scartato dal tetto.

**Stati di dominio** — stati anomali in cui un'entità o l'intero gioco può trovarsi, ciascuno dei
quali cambia cosa si può fare:

indagine in corso · conto congelato · beni sequestrati · insolvenza · attività chiusa · margin
call subita · immobile sfitto · inquilino moroso · sfratto in corso · guasto non riparato ·
deposito vincolato non disponibile · caveau pieno · contratto in scadenza · evento attivo che
cambia le regole · black market chiuso da una retata · dominio non ancora sbloccato

**Stati vuoti** — ognuno con un significato diverso da «non c'è niente»:

nessuna operazione ancora avvenuta · mai salvato su disco · nessun immobile in portafoglio ·
nessuna posizione aperta · nessun contatto sbloccato · nessun oggetto in inventario · dominio
bloccato dall'era

### 3.5 — Quanto cresce

È la ragione per cui serve un sistema di design e non un foglio di stile. La stessa interfaccia
deve reggere il primo minuto e la trentesima ora.

| Dimensione                   | Primo minuto        | A regime                                                  |
| ---------------------------- | ------------------- | --------------------------------------------------------- |
| Strumenti di pagamento       | 2 (contanti, carta) | 4 (+ fiches, crypto)                                      |
| Domini in uso insieme        | 1–3                 | fino a 18                                                 |
| Numeri sempre a schermo      | ~5                  | decine, su più grandezze non monetarie                    |
| Entità gestite dal giocatore | 0                   | decine: immobili, attività, posizioni, oggetti, prestiti  |
| Serie storiche               | 0                   | più grafici contemporanei                                 |
| Scadenze da seguire          | 0                   | molte, di domini diversi, con orizzonti diversi           |
| Eventi subìti                | 0                   | continui, da più domini                                   |
| Ordini di grandezza          | euro e migliaia     | fino a 1e30: servono i suffissi, non venti cifre in fila  |
| Decisione tipica             | «deposito o tengo?» | «con l'attenzione che mi resta, quale di sei cose seguo?» |

---

## 4. Vincoli tecnici

Non sono preferenze estetiche: sono fatti del progetto che l'interfaccia deve rispettare.

- **Applicazione desktop** (Electron), finestra singola e ridimensionabile. Non è un sito, non è
  mobile. Non c'è navigazione via URL e oggi non c'è un router.
- **Completamente offline.** Nessuna rete, mai. Niente si scarica a runtime — nessuna risorsa
  esterna di alcun tipo.
- **La simulazione avanza dieci volte al secondo**, a passo fisso. Alcuni numeri cambiano
  continuamente; l'interfaccia non può assumere che un valore stia fermo mentre lo si legge.
- **Due lingue obbligatorie, italiano e inglese, con parità verificata da un test.** Nessuna frase
  rivolta al giocatore può essere scritta dentro un componente: passa tutta da un dizionario. Le
  lunghezze cambiano fra le due lingue, e alcune stringhe hanno il plurale.
- **`prefers-reduced-motion` va rispettato.** Ogni animazione deve avere una versione senza.
- **Criterio severo sulle dipendenze.** Una libreria entra solo se supera un vaglio esplicito.
  Oggi il progetto ha tre dipendenze di runtime e nessuna libreria di interfaccia: il sistema di
  design va **costruito**, non installato.
- **Il salvataggio è una busta versionata**, scritta in modo atomico alla chiusura. Un salvataggio
  illeggibile è uno stato d'errore con delle uscite, mai un azzeramento silenzioso.
- **Ogni movimento di denaro è una transazione a partita doppia** che somma a zero e porta una
  ragione. Non esiste un saldo che si assegna: si legge. Questo significa che ogni numero mostrato
  ha una provenienza tracciabile, e un registro delle operazioni è sempre possibile.

---

## 5. Cosa esiste già oggi

Il progetto è costruito **una fetta verticale alla volta**. Oggi è finita la prima. È utile
saperlo per capire da dove si parte — **non è un vincolo di design**.

**Costruito e funzionante:**

- reddito in contanti che entra a ogni tick, con un potenziamento acquistabile solo con la carta
- bancomat che deposita e preleva trattenendo una commissione, con l'anteprima della scomposizione
  prima della conferma
- una rappresentazione della carta di credito come **oggetto tridimensionale ruotabile col mouse**,
  con un fronte e un retro; sul retro le dichiarazioni dello strumento (tracciabilità, capienza,
  commissione)
- due destinazioni: una principale che è insieme bancomat e cruscotto, e una di statistiche
- cinque riquadri di cruscotto (reddito, patrimonio netto, guadagnato in totale, speso in totale,
  commissioni pagate), con un tetto dichiarato di sei
- il registro delle ultime operazioni, con ragione e importi
- i sette stati del ciclo di vita, ciascuno con la sua schermata
- i sei messaggi di rifiuto spiegato elencati in 3.3
- italiano e inglese completi

**Deciso ma non ancora costruito**, nell'ordine: progresso offline (03), calore e black market
(04), prestiti e punteggio di credito (05), indagine (06). Poi i blocchi: negozio e aste;
calendario, depositi e affitti; immobiliare e mercato; impresa, crypto e casinò; indagini, eventi e
albero delle abilità. Il **caveau con capienza** è uscito da questo elenco: la fetta 02 l'ha
costruito ([D017](../delega/D017-il-caveau.md)) — per i **contanti** soltanto, perché gli oggetti
nascono col black market e senza di loro un inventario è un contenitore vuoto.

**Nota sullo stile:** questa riga diceva che l'estetica era provvisoria e la direzione visiva da
decidere. Non è più vero da [D023](../delega/D023-il-design-system.md): il design system esiste, sta
in `src/renderer/ui/`, ha due temi completi e non sa che gioco è
([ADR 0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md)). Questo documento continua a non parlarne,
ma per la ragione opposta — non perché la risposta manchi, perché sta altrove.
