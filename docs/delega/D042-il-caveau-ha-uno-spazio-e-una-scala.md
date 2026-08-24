# D042 — Il caveau ha uno spazio, e una scala invece di quattro numeri

- **Stato:** **Aperta** — scritta il 2026-08-24, non ancora eseguita
- **Dipende da:** [D017](D017-il-caveau.md), che ha costruito il caveau, e
  [D019](D019-il-pagamento.md), che gli ha dato il listino. Niente altro: il kernel non si tocca
- **Sblocca:** il blocco A della [roadmap](../roadmap-fette.md) — aste di box, negozio, oggetti nel
  caveau. Non lo costruisce: gli toglie di mezzo l'unità sbagliata, che è l'unica cosa che oggi
  costringerebbe quel lavoro a rifare questo
- **Il dominio è stato studiato prima:** [design/domini/vault.md](../design/domini/vault.md),
  riletta contro il codice il 2026-08-24. Le decisioni di gioco che questa delega **non** prende da
  sola — il tetto ai contanti, la varianza zero, l'ingombro slegato dal valore — stanno lì
- **ADR vincolanti:** [0051](../adr/0051-lo-spazio-di-un-caveau-non-e-una-somma-di-denaro.md)
  (nuovo), [0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md),
  [0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md),
  [0042](../adr/0042-il-pagamento-e-un-flusso-solo.md), 0006, 0014, 0017, 0024, 0033
- **Regole:** nessuna nuova. Un invariante nuovo: **INV-26**
- **Budget:** ~180 righe di sorgente e ~220 di test. È piccola perché il confine con il resto del
  gioco non si muove: il Ledger, il reddito e il bancomat continuano a ricevere un `Money`, e
  nessuna delle loro firme cambia

## Obiettivo

Tre cose, e la prima è l'unica strutturale.

1. **Lo spazio del caveau smette di essere una somma di denaro.** Diventa `Space`, un tipo suo, e i
   contanti lo occupano a una densità dichiarata ([ADR 0051](../adr/0051-lo-spazio-di-un-caveau-non-e-una-somma-di-denaro.md)).
2. **La scala smette di essere tredici numeri scritti a mano.** Diventa una curva: uno spazio di
   partenza, un fattore di crescita, un numero di livelli, e una regola sul prezzo.
3. **La pagina risponde alle domande che la sua scheda le fa**, e oggi non risponde: cosa c'è
   dentro, cosa compra il passo successivo, e perché il reddito si è fermato.

## Perché esiste

Nasce da una richiesta — «il caveau deve reggere cifre stellari e contenere gli oggetti delle
aste» — e da due letture che l'hanno corretta. Vanno scritte tutte e due, perché senza la seconda
questa delega avrebbe fatto la cosa sbagliata con molta cura.

**La prima lettura era sbagliata, ed è stata verificata invece che creduta.** Diceva: con un tetto a
250.000,00 € un quadro da dieci milioni non entra nel caveau, quindi il tetto va tolto. È falso: la
[scheda](../design/domini/vault.md) dichiara da sempre che **l'ingombro di un oggetto non è il suo
valore**, quindi quel quadro dichiara ingombro 4.000 ed entra. Con l'ingombro slegato dal valore il
tetto di oggi regge un numero qualunque di oggetti, per sempre, a qualunque scala.

**Ne discende che il tetto non si tocca**, e va detto forte perché è la cosa che questa delega
sarebbe stata scritta per fare. Un tetto ai contanti che diventa ridicolo quando il patrimonio è a
1e12 non è un numero scaduto: è la forma 1 della saturazione, cioè la spina dorsale del gioco. I
contanti smettono di essere una risposta, e l'unica via che resta è la carta, che lascia tracce.
Toglierlo sarebbe stato togliere la tensione che regge diciassette domini.

**La seconda lettura ha trovato un difetto vero, più piccolo e più profondo.** Non è il tetto: è
l'**unità**. La scheda, per far tornare i conti, è costretta a scrivere che l'ingombro «è espresso
nella stessa unità della capienza, cioè in euro». Un euro che misura denaro e un euro che misura
ingombro sono la stessa unità su due grandezze che non si sommano, e oggi non si sommano solo perché
nessuno ha ancora provato. Il giorno degli oggetti quella sottrazione si scrive, il compilatore dice
che va tutto bene, e a valle esce una capienza sbagliata — che il Ledger fa rispettare, e che il
giocatore scopre come stipendio che non arriva. Il perché sta nell'
[ADR 0051](../adr/0051-lo-spazio-di-un-caveau-non-e-una-somma-di-denaro.md).

**E una terza cosa, che non è un difetto ma un'occasione mancata.** La richiesta diceva anche
«i domini devono essere profondi, non un pulsante». Per il caveau è vera a metà: la sua etichetta
dichiara **attenzione quasi zero**, «un pulsante ogni tanto, nessuna entità da seguire», ed è la sua
identità, non una mancanza. La sua profondità sono gli **oggetti** e la **perquisizione**, e tutti e
due arrivano da domini che non esistono. Quello che si può fare adesso non è renderlo profondo: è
renderlo **completo** — la sua pagina oggi non risponde a due delle tre domande che la sua stessa
scheda le fa.

## Le tre decisioni, con i conti che le hanno decise

### 1 · La densità dei contanti, e perché il muro non si sposta

`CASH_PER_SPACE` vale **100,00 € per unità di ingombro**, e non è scelto: è **derivato**
all'indietro dal muro che esiste già.

Il caveau di partenza tiene 1.000,00 € — è `CASH_START_CAPACITY`, dichiarata dal pool
([ADR 0017](../adr/0017-il-denaro-e-plurale.md)) — e il bersaglio `seconds_to_first_wall` pretende
che a 12,00 €/s il muro arrivi fra i 60 e i 120 secondi. Con 100,00 € per unità, il livello zero
sono **10 unità**, e quel numero non è scritto da nessuna parte: si calcola dividendo la capienza
dichiarata dal pool per la densità. La cifra dichiarata resta **una sola**, come oggi.

Ne discende che nessuno dei due bersagli esistenti si muove di un centesimo, e questa è metà del
valore della scelta: un cambio di unità che sposta il bilanciamento è un cambio di unità **e** una
ritaratura, e chi lo rileggesse non saprebbe più quale delle due ha rotto cosa.

### 2 · La scala, e perché una curva invece di tredici numeri

Oggi in `balance/constants.ts` ci sono tre elenchi — cinque capienze, quattro prezzi in contanti,
quattro prezzi con la carta — e fra loro esistono due regole che **nessun meccanismo tiene**:

- ogni prezzo sta appena sotto la capienza del livello da cui si paga. È il muro che insegna sé
  stesso: per pagare in contanti bisogna poterli tenere, quindi il caveau va quasi riempito prima
  di potersi ampliare. Oggi lo dice un commento, e a farlo vero sono quattro numeri allineati a
  mano;
- il prezzo con la carta sta due euro sotto quello in contanti. Oggi sono **quattro** costanti che
  portano lo stesso numero.

Diventano:

| Costante                      | Valore   | Cos'è                                               |
| ----------------------------- | -------- | --------------------------------------------------- |
| `CASH_PER_SPACE`              | 100,00 € | quanti euro di contanti stanno in un'unità          |
| `VAULT_SPACE_GROWTH`          | 2        | di quanto lo spazio cresce a ogni livello           |
| `VAULT_LEVELS`                | 9        | quanti livelli esistono, dallo zero all'ultimo      |
| `VAULT_EXPANSION_PRICE_RATIO` | 0,90     | il prezzo, come frazione della capienza di partenza |
| `VAULT_CARD_DISCOUNT`         | 2,00 €   | quanto si risparmia pagando con la carta            |

La scala che ne esce, calcolata e non scritta:

| Livello | Spazio | Capienza contanti | Prezzo contanti | Prezzo carta |
| ------- | ------ | ----------------- | --------------- | ------------ |
| 0       | 10     | 1.000,00 €        | 900,00 €        | 898,00 €     |
| 1       | 20     | 2.000,00 €        | 1.800,00 €      | 1.798,00 €   |
| 2       | 40     | 4.000,00 €        | 3.600,00 €      | 3.598,00 €   |
| 3       | 80     | 8.000,00 €        | 7.200,00 €      | 7.198,00 €   |
| 4       | 160    | 16.000,00 €       | 14.400,00 €     | 14.398,00 €  |
| 5       | 320    | 32.000,00 €       | 28.800,00 €     | 28.798,00 €  |
| 6       | 640    | 64.000,00 €       | 57.600,00 €     | 57.598,00 €  |
| 7       | 1.280  | 128.000,00 €      | 115.200,00 €    | 115.198,00 € |
| 8       | 2.560  | 256.000,00 €      | —               | —            |

**Il rapporto 0,90 è quello di oggi**, misurato e non scelto: 900 su 1.000, 4.500 su 5.000, 18.000
su 20.000 sono tutti e tre esattamente il novanta per cento. Il quarto, 68.000 su 75.000, è il
90,7% — cioè la prova che quattro numeri a mano divergono, e che nessuno se n'era accorto.

**Il fattore 2 e i nove livelli sono contestabili, e questa è la parte da guardare per prima.** Oggi
i livelli sono cinque e il fattore è circa quattro; il muro finale passa da 250.000,00 € a
256.000,00 €, cioè resta dov'era. Cosa cambia davvero è **quante volte** il giocatore incontra la
decisione: da quattro ampliamenti a otto, ciascuno più piccolo del precedente in proporzione a
quello che possiede. È l'unica cosa che questa delega fa per la richiesta «non un pulsante»: non
aggiunge una meccanica, allunga quella che c'è.

**Cosa costa**, perché va detto: la somma di tutti gli ampliamenti passa da 91.400,00 € a
229.500,00 €, cioè arrivare al muro finale costa **due volte e mezzo** quello che costa oggi. A
12,00 €/s sono circa 5,3 ore di gioco contro 2,1. Non è un difetto — il caveau è un pozzo dove il
denaro esce dal gioco, e un pozzo più profondo è quello che un idle vuole — ma è un cambio di
bilanciamento vero, ed è il primo numero da rimettere in discussione se giocandoci sembra lungo. La
leva è **una**: `VAULT_LEVELS`.

### 3 · La pagina, e le due domande a cui non risponde

La [scheda](../design/domini/vault.md) dichiara cosa il giocatore **deve vedere**. Confrontata con
`VaultPanel.vue` di oggi:

| Deve vedere                             | Oggi                                                           |
| --------------------------------------- | -------------------------------------------------------------- |
| quanto spazio è occupato e quanto resta | **sì** — la barra e «ci stanno ancora»                         |
| quanti livelli restano                  | a metà — c'è «livello 1 di 5», e quanti ne restano si sottrae  |
| quanto costa il livello successivo      | **no** — il prezzo si vede solo aprendo il flusso di pagamento |
| che il reddito si è fermato, e perché   | **no, non qui** — quel pezzo vive sulla pagina del bancomat    |
| cosa c'è dentro oltre al denaro         | niente da mostrare: gli oggetti non esistono                   |

**Alla terza riga non si obbedisce, e la scheda ha torto.** Mostrare il prezzo sulla pagina
vorrebbe dire nominare un'opzione di listino fuori dal flusso di pagamento, che è precisamente ciò
che **R24** vieta e che l'[ADR 0042](../adr/0042-il-pagamento-e-un-flusso-solo.md) ha deciso dopo che
la scheda era stata scritta. Vince l'ADR, che è più recente ed è meccanizzato. Al suo posto la
pagina dice **cosa compra** l'ampliamento — lo spazio nuovo e la capienza che ne esce — e il prezzo
resta dove si sceglie con cosa pagarlo. La riga della scheda va corretta, non obbedita.

**Alla quarta si obbedisce riusando il pezzo che esiste.** `VaultAlarm.vue` sta già nella cartella
del caveau ([ADR 0033](../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)) e compare sulla
pagina del bancomat. Compare **anche** sulla sua, che è il posto dove il giocatore va a capire cosa
fare: nessun componente nuovo, nessuna frase duplicata.

## Cosa trovi già fatto

- Il Ledger **chiede** la capienza invece di leggerla, e la funzione che risponde è del caveau
  ([ADR 0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)). Il punto in cui si
  attacca la densità esiste già ed è uno solo.
- Il listino a due voci, il flusso di pagamento e `accepts` generato dal listino
  ([ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)). Nessuno dei tre si
  tocca: cambiano i numeri che ci passano dentro, non la forma.
- `roomIn` in `contracts/pools.ts`, che è ciò che permette al reddito di accreditare il parziale.
- I cheat del caveau, che muovono il **livello** e non la capienza: continuano a funzionare senza
  una riga di modifica, ed è la prova che il livello era la cosa giusta da salvare.
- `VaultAlarm.vue`, già nella cartella giusta.

## Da produrre

### Dominio — `src/core/domains/vault/`

| File        | Cosa                                                                                                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`  | il tipo `Space` — branded su `Money`, sul modello di `Ticks` e `Seconds` — e il suo costruttore. `VaultState` non cambia: resta `{ level: number }`                                                        |
| `rules.ts`  | `spaceOf(level): Space`, `cashCapacityFor(level): Money`, e la scala calcolata dalla curva. `capacityFor` cambia nome in `cashCapacityFor`; `MAX_LEVEL` si legge da `VAULT_LEVELS` invece che da un elenco |
| `system.ts` | `Vault.capacity()` diventa `Vault.cashCapacity()`. Nient'altro: `expand`, `load`, `save` e `reset` restano identici                                                                                        |

### Bilanciamento — `src/core/balance/constants.ts`

Escono `VAULT_CAPACITIES`, `VAULT_PRICES_CASH` e `VAULT_PRICES_CARD`. Entrano le cinque costanti
della tabella qui sopra. Le tre liste si **calcolano** in `rules.ts` a partire da quelle, e restano
liste: `expansionPrices` continua a indicizzare e a ritornare `[]` quando l'indice cade fuori,
senza nessun ramo che distingua «si può» da «non si può».

### Bersagli — `src/core/balance/targets.ts`

Entra **`vault_max_cash`**: quanti contanti tiene l'ultimo livello, fra 220.000,00 € e 290.000,00 €.
È il muro finale del gioco e oggi **non ha nessun bersaglio** — è l'unico numero del caveau che
nessun test guarda, ed è quello da cui dipende la forma 1 della saturazione. L'intervallo è stretto
apposta: un livello in più o in meno lo sfonda, e un fattore di crescita diverso pure.

Gli altri due non si toccano e devono restare verdi **senza essere modificati**. Se `seconds_to_first_wall` o `vault_card_discount` hanno bisogno di un ritocco per passare, la
conversione è sbagliata — non il bersaglio.

### Applicazione — `src/renderer/`

| File                              | Cosa                                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `runtime/createGame.ts`           | una riga: `vault.capacity()` diventa `vault.cashCapacity()`                                                                                      |
| `stores/game.ts`                  | tre selettori nuovi — lo spazio totale, lo spazio occupato, e cosa compra l'ampliamento successivo. `vaultProgress` dice anche quanti ne restano |
| `components/vault/VaultPanel.vue` | la barra mostra lo spazio; sotto, cosa compra il passo successivo e quanti ne restano; il muro compare qui riusando `VaultAlarm`                 |
| `i18n/it.ts`, `i18n/en.ts`        | le chiavi nuove, in parità (R12, INV-07)                                                                                                         |

## Invarianti

**INV-26 — un ingombro non è un importo.** `Space` e `Money` non si scambiano: la conversione
esiste in un punto solo, `cashCapacityFor`, e nessun altro file del progetto moltiplica o divide uno
`Space` per la densità.

Il meccanismo è il tipo, **⚠️ parziale e va dichiarato come tale**: `Space` è `Money` più un
marchio, quindi il compilatore rifiuta un `Money` dove serve uno `Space` — che è il verso in cui
l'errore capita — e **non** rifiuta uno `Space` dove serve un `Money`. È lo stesso limite che
`Ticks` ha rispetto a `number`, e si accetta per la stessa ragione: prende la forma con cui il
difetto nasce davvero.

Il secondo verso lo guarda un test di regola: fuori da `rules.ts` del caveau, nessun file nomina
`CASH_PER_SPACE`.

## Fuori scope

Ciascuna con la ragione, perché un elenco senza ragioni è un elenco di cose dimenticate.

- **L'inventario degli oggetti.** Nessun dominio ne produce: le aste e il black market non esistono.
  Un contenitore vuoto è l'astrazione speculativa che l'[ADR 0014](../adr/0014-una-fetta-verticale-alla-volta.md)
  vieta, e il grilletto è già scritto nel [registro](../roadmap-fette.md). Quello che questa delega
  gli lascia è il **posto esatto**: la sottrazione entra dentro `cashCapacityFor`, e nient'altro si
  muove.
- **La perquisizione.** È calore e indagini, fette 04 e 06.
- **Il taglio delle banconote.** Valutato e scartato: darebbe ai contanti una densità che il
  giocatore sceglie, quindi una seconda leva e un secondo pozzo di denaro. È una meccanica inventata
  per riempire un dominio che la sua etichetta dichiara silenzioso, e sarebbe costata al Ledger un
  secondo depositario del saldo dei contanti — la composizione in banconote — cioè due dichiarazioni
  dello stesso fatto. Il grilletto vero, se mai: il calore, che a una banconota da 500 dà una
  ragione di gioco per essere diversa da dieci da 50.
- **Togliere il tetto ai contanti.** È la forma 1 della saturazione. Vedi _Perché esiste_.
- **Spostare `Space` in `contracts/`.** Un dominio solo lo dichiara. Il grilletto è il secondo, e
  va nel registro.

## Definizione di fatto

1. `npm run verify` e `npm run verify:release` verdi.
2. `seconds_to_first_wall` e `vault_card_discount` verdi **senza essere stati modificati**.
3. `vault_max_cash` esiste, ed è stato visto rosso spostando `VAULT_LEVELS` di uno.
4. Un `Money` passato dove serve uno `Space` **non compila**, verificato scrivendolo.
5. `tests/domains/vault/rules` prova la scala calcolata contro la tabella di questa delega, valore
   per valore: se la curva cambia, il test dice quale riga.
6. Il caveau di partenza tiene ancora esattamente 1.000,00 €, e a dirlo è un test che confronta
   `cashCapacityFor(0)` con `CASH_START_CAPACITY` **per identità di valore**.
7. Un salvataggio con `level` fuori scala è ancora rifiutato campo per campo (INV-20), e il massimo
   contro cui è confrontato viene dalla curva.
8. La parità i18n è verde (INV-07), e nessuna chiave nuova è senza traduzione.
9. La pagina del caveau è stata **guardata nella finestra vera**, nei due temi, con
   `scripts/cdp.mjs`, e il muro è stato raggiunto davvero — non simulato — usando i cheat.
10. Ogni test nuovo è stato **rotto di proposito** e visto rosso, con il conto in fondo alla delega.

## Trappole note

1. **`CASH_START_CAPACITY` non si sposta.** Vive in `contracts/pools.ts` perché un contratto non può
   importare `balance/`, ed è la dichiarazione di partenza del pool. Lo spazio del livello zero si
   **deriva** da lei, non la sostituisce: se questa delega scrivesse `10` da qualche parte, la stessa
   cifra tornerebbe a vivere in due posti, che è il difetto che il commento di `VAULT_CAPACITIES`
   dichiara di aver evitato.
2. **`balance/` non può importare `domains/`.** La freccia è `DOM --> BAL`, e non esiste
   all'inverso: `tests/rules/import-graph` la vede. Ne discende che `Space` **non** può stare in
   `balance/`, e che le cinque costanti nuove sono numeri nudi — la scala si costruisce dove il tipo
   vive, cioè in `rules.ts`.
3. **`no-magic-numbers` vale sotto `domains/**`.** La curva si calcola con `BALANCE.*`, mai con un
   letterale — nemmeno l'esponente.
4. **R24 vieta di mostrare il prezzo sulla pagina.** Vedi la decisione 3. Il rilevatore guarda anche
   il nome della sorgente di un `v-for`: un ciclo su qualcosa che finisce per `Prices` è rosso anche
   se non nomina nessun tipo.
5. **Il rinominare `capacity` in `cashCapacity` tocca il bootstrap**, e il bootstrap nomina `vault`
   prima che `vault` esista. È voluto e commentato: non è un difetto da «correggere» mentre si passa.
6. **Il salvataggio dell'utente è in pericolo**, e da D041 lo è in un modo nuovo: il gioco scrive da
   sé ogni trenta secondi. Chi apre la finestra vera per la prova 9 usa `--user-data-dir` su una
   cartella usa-e-getta, e verifica dopo che il `save.json` vero non si è mosso.

## Cosa questa delega lascia indietro

Censito prima di cominciare, non dopo.

1. **La profondità del caveau resta quella che è**, e non è un rinvio: è la sua etichetta. Chi vuole
   un dominio profondo da giocare guardi il blocco A della [roadmap](../roadmap-fette.md) — aste di
   box e negozio — che è dove vive la decisione «cosa vale la pena tenere».
2. **Il fattore di crescita e il numero di livelli sono bilanciamento**, e il conto che li ha
   decisi sta nella decisione 2. Se giocandoci la scala sembra lunga, la leva è una costante.
3. **`vault_max_cash` misura il muro, non l'esperienza del muro.** Quanto tempo di gioco ci voglia
   ad arrivarci non ha un bersaglio, e non lo avrà finché il reddito è l'unica fonte: con un secondo
   dominio che produce denaro quel numero cambierebbe senza che nessuno abbia toccato il caveau.
