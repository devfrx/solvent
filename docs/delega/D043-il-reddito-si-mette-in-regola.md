# D043 — Il reddito si mette in regola

- **Stato:** **Chiusa** — scritta **ed eseguita** il 2026-08-24 sul ramo
  `d043-il-reddito-si-mette-in-regola`, fusa in `main` e spinta. `npm run verify` e `npm run build`
  sono verdi, 1.343 test. Il punto 9 **non c'era** quando la delega è stata scritta, e la sua
  assenza era il difetto: [D042](D042-il-caveau-ha-uno-spazio-e-una-scala.md) ce l'aveva, questa
  aggiunge un pannello nuovo e non se l'era chiesto. **È stato chiuso il 2026-08-24 dentro
  [D044](D044-il-reddito-e-un-elenco-di-fonti.md)**: il pannello del regime si disegna, dichiara il
  3,0% e l'irreversibilità **prima** del flusso di pagamento, e premendolo il lavoro passa davvero
  dai contanti alla carta — a schermo, sulla riga «Atterra su», mentre i lavoretti restano dov'erano
- **Data:** 2026-08-24
- **Fetta:** 02 riaperta da una sessione di gioco, e non è un ritocco di bilanciamento: è la riga
  che decide dove atterrano i soldi
- **Decide:** [ADR 0052](../adr/0052-un-guadagno-dichiara-dove-atterra.md) — un guadagno dichiara
  dove atterra
- **A monte:** [D017](D017-il-caveau.md) (il caveau e il suo muro),
  [D019](D019-il-pagamento.md) e l'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
  (il listino), [D042](D042-il-caveau-ha-uno-spazio-e-una-scala.md) (la scala del caveau)

## Obiettivo

Togliere al caveau un lavoro che non è mai stato suo — fare da tetto a **tutto** il reddito del
gioco — dando al reddito un **regime**: dove atterra, e quanto trattiene lo Stato lungo la strada.

Il giocatore guadagna una decisione che si prende una volta: restare **in nero** — contanti,
anonimi, zero trattenute, il tetto del caveau — oppure **mettersi in regola** — carta, illimitata,
tracciata, e una percentuale che se ne va.

## Perché esiste

Il perché sta per intero nell'[ADR 0052](../adr/0052-un-guadagno-dichiara-dove-atterra.md), e qui
basta la riga che l'ha fatta nascere: con un reddito di un milione al secondo, il caveau si riempie
**dentro un tick**, e l'unica valvola che il gioco offre è un pulsante da premere a mano dieci volte
al secondo. Il muro della fetta 02 è giusto e resta; quello che non regge è che ci passi attraverso
ogni euro che il gioco produrrà mai.

Non è un difetto che si vede leggendo il codice di oggi. A 12,00 €/s il muro morde dopo ottanta
secondi ed è la lezione migliore che il gioco abbia. Si vede solo proiettando la stessa riga sui
domini che la [visione](../prodotto/visione.md) promette — impresa, mercato, immobiliare, crypto —
e il momento più economico per correggerla è **prima** che quei domini esistano. È la stessa mossa
dell'[ADR 0051](../adr/0051-lo-spazio-di-un-caveau-non-e-una-somma-di-denaro.md), che ha dato uno
spazio al caveau prima che esistesse un oggetto da metterci dentro.

## Le tre decisioni, con i conti che le hanno decise

### 1 · La trattenuta si tara contro la commissione del bancomat, non contro il realismo

**Il vincolo non è quanto tassa uno Stato vero. È quanto costa fare la stessa cosa a mano.**

Chi resta in nero e vuole comunque i soldi sulla carta li versa al bancomat, e paga
`ATM_FEE_RATE_IN`, cioè l'**1,5%**. Se mettersi in regola trattenesse molto di più, il gioco
ottimale tornerebbe a essere: resta in nero, e clicca. Avremmo scritto una ADR per rendere ottimale
esattamente la mansione che voleva togliere.

Se trattenesse **meno**, il verso opposto: la carta diventerebbe gratis e migliore sotto ogni
aspetto, i contanti smetterebbero di essere una scelta, e il caveau resterebbe un dominio senza
clienti — arredamento con dentro del codice, che è la cosa che
[D017](D017-il-caveau.md) ha già evitato una volta tarando lo sconto della carta.

Ne discende l'intervallo, e il numero dentro:

| Quanto trattiene | Cosa succede                                                                  |
| ---------------- | ----------------------------------------------------------------------------- |
| sotto 1,5%       | la carta domina, i contanti muoiono                                           |
| **3,00%**        | restare in nero costa 1,5 punti in meno **e un clic ogni volta**              |
| sopra ~5%        | il clic viene pagato abbastanza da valere la pena: la mansione torna ottimale |

**Il 3%, cioè il doppio della commissione.** Un punto e mezzo di reddito è il prezzo di non dover
guardare il caveau mai più, ed è basso abbastanza da non punire chi sceglie l'anonimato. Il numero
è contestabile e si sceglie giocando; l'intervallo che lo tiene onesto no, ed è un bersaglio.

### 2 · Mettersi in regola è un acquisto, e non si torna indietro

Un interruttore gratuito ricrea il difetto: in nero finché c'è spazio, in regola quando il caveau è
pieno, in nero appena si libera. È la stessa mansione con un pulsante diverso, e il ragionamento
per esteso sta nell'ADR.

Quindi: **si paga, con la carta, una volta sola.** Tre conseguenze, e nessuna è un dettaglio.

- **Si paga con la carta** perché mettersi in regola è un atto burocratico, non una mazzetta — e
  perché la carta si riempie **solo** dal bancomat: il prezzo obbliga a passare dal ponte, che è
  ciò che tiene in piedi la lezione della fetta 01. È la stessa scelta di `UPGRADE_PRICE_CARD`, e
  per la stessa ragione.
- **È irreversibile** perché la reversibilità **è** il gioco ottimale che stiamo togliendo. Il
  giocatore lo deve sapere **prima**: lo dice la pagina, non la sorpresa.
- **Costa 50.000,00 €**, che sta fra il quinto livello del caveau (32.000,00 €) e il sesto
  (64.000,00 €). Non è una cifra scelta perché suona bene: è la cifra che **obbliga ad attraversare
  la scala del caveau prima di graduarsi**. Chi vuole mettersi in regola deve prima poter tenere
  abbastanza contanti da versarli senza passare la serata al bancomat, cioè deve ampliare — e la
  scala che [D042](D042-il-caveau-ha-uno-spazio-e-una-scala.md) ha costruito serve a qualcosa
  invece di essere saltata.

### 3 · Il regime è un dato, non un `if` sul nome di un pool

L'[ADR 0017](../adr/0017-il-denaro-e-plurale.md) vieta a un dominio di contenere un `if` sul nome di
un pool, ed è la prima cosa che verrebbe da scrivere qui. La forma giusta è quella che i pool usano
già per sé stessi: **le affordance sono dati.**

```ts
interface Regime {
  readonly pool: Pool
  readonly withholding: Money
}
```

Due valori dichiarati — `UNDECLARED` e `DECLARED` — e una funzione pura che dice quale vale. Il tick
non nomina né `cash` né `card`: legge un regime e lo usa.

**Nasce dentro `domains/income/` e non in `contracts/`**, perché oggi ha un consumatore solo e un
contratto condiviso da un consumatore solo è la generalizzazione da un caso solo — la stessa
ragione per cui `Space` è rimasto dentro `domains/vault/`. Il grilletto per salirlo di livello è
**il secondo dominio che genera guadagni**, e va nel registro YAGNI accanto a quello di `Space`.

## Cosa trovi già fatto

- **Il listino.** `PriceList`, `PaymentOption`, il flusso di pagamento unico
  ([ADR 0042](../adr/0042-il-pagamento-e-un-flusso-solo.md)) e la regola che nessun prezzo si nomina
  fuori dal flusso (R24). Il secondo acquisto del reddito non inventa niente: riusa la forma di
  `upgradePrices`.
- **La capienza che si chiede** ([ADR 0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)).
  `room(pool)` arriva già per costruzione al reddito, e per la carta risponde `null`: quando il
  regime è dichiarato, «quanto ci sta» smette di mordere **senza un ramo in più**.
- **`transfer` che trattiene.** Il costruttore che toglie una parte lungo la strada esiste già ed è
  la forma da copiare: importo, trattenuta, e la contropartita scritta dal kernel.
- **Il conto non-giocatore.** L'[ADR 0020](../adr/0020-partita-doppia.md) ha già il posto dove
  mettere un conto nuovo, e `POOL_IDS` è una lista in cui aggiungere in fondo è stabile.

## Da produrre

### Kernel — `src/core/kernel/Ledger.ts` e `src/core/contracts/`

- `income(pool, amount, withheld)` — **il terzo argomento è obbligatorio**, e non è una comodità: è
  la regola 2 dell'ADR fatta rispettare dal compilatore. Non si può costruire un reddito senza dire
  cosa ne viene trattenuto. Precedente identico: `transfer` chiede la commissione anche quando è
  zero.
- Con trattenuta a zero produce **due** movimenti come oggi: un movimento da 0,00 € è una riga nello
  storico per qualcosa che non è successo, ed è lo stesso principio che il reddito applica già ai
  tick che non accreditano niente.
- Rifiuta una trattenuta maggiore dell'importo, con lo stesso messaggio e la stessa forma di
  `transfer`.
- `tax` in `POOL_IDS` e in `POOLS`: `traceable: true`, `capacity: null`, `yields: false`,
  `player: false`, `bearer: false`. **In fondo alla lista**, perché quell'ordine è l'ordine dei
  saldi nel salvataggio.
- `Category` **non** cresce. Il suo commento dichiara il proprio grilletto — «cresce quando una
  schermata lo mostra» — e nessuna schermata separa ancora tasse e commissioni. Il conto le
  distingue; la telemetria lo farà quando servirà a qualcuno.

### Dominio — `src/core/domains/income/`

- `types.ts`: `IncomeState` guadagna `declared: boolean`.
- `rules.ts`: `Regime`, i due regimi dichiarati, `regimeOf(state)`, e `declarationPrices()` — un
  listino a una voce, vuoto quando si è già in regola, così «non si può più» è una lista vuota
  invece di un ramo (è la forma di `expansionPrices`).
- `commands.ts`: `createDeclare`, gemello di `createBuyUpgrade`. Codice d'errore
  `error.income.already_declared`, che è un esito e non un guasto.
- `system.ts`: `INCOME_POOL` **sparisce**. Il tick legge il regime, chiede lo spazio al pool del
  regime, calcola la trattenuta sull'importo che entra, ed emette una transazione sola.
- `load` accetta `declared` assente come `false`: vedi _Trappole note_.

### Bilanciamento — `src/core/balance/constants.ts`

- `INCOME_TAX_RATE`: `0.03`, con scritto accanto contro cosa è tarato (`ATM_FEE_RATE_IN`) e cosa
  succede sopra e sotto.
- `INCOME_DECLARATION_PRICE_CARD`: `50000`, con il ragionamento sulla scala del caveau.

### Bersagli — `src/core/balance/targets.ts`

- `income_tax_rate`: `{ min: 0.016, max: 0.05 }`. Sopra `ATM_FEE_RATE_IN` o i contanti muoiono;
  sotto il triplo o il clic viene pagato abbastanza da valere la pena. Lega due numeri in due file,
  come fa `seconds_to_first_wall`.
- `income_declaration_price`: `{ min: 30000, max: 70000 }`. Sta fra il quinto e il sesto livello del
  caveau: sotto, la scala si salta; sopra, mettersi in regola arriva quando non serve più.

### Applicazione — `src/renderer/`

- `IncomePanel.vue`: il secondo acquisto, nella forma del primo. La pagina dice **cosa compra** —
  da qui in avanti lo stipendio arriva sulla carta, e lo Stato trattiene il 3% — e **che non si
  torna indietro**. Il prezzo resta dentro il flusso di pagamento (R24).
- Lo stato attuale del regime va letto in un colpo d'occhio: in nero o in regola.
- `i18n/it.ts` e `i18n/en.ts`: parità verificata, come sempre.

### Documenti

- Le due schede di dominio — [caveau](../design/domini/vault.md) e
  [reddito](../design/domini/income.md) — dove dicono che il caveau ferma il reddito: resta vero per
  le fonti nere, e smette di essere universale.
- `docs/tracciabilita.md`: **INV-27**.
- Il registro YAGNI in [roadmap-fette.md](../roadmap-fette.md): il grilletto di `Regime`.
- `docs/adr/README.md`: la voce dell'ADR 0052.

## Invarianti

- **INV-27** — un guadagno dichiara il pool in cui atterra e quanto ne viene trattenuto. A farlo
  rispettare è la firma di `income`, non un test: un reddito senza regime non compila.

## Fuori scope

- **Il calore.** Mettersi in regola rende tracciabile il reddito, e oggi la tracciabilità non costa
  niente. È la fetta 04, ed è dichiarato: quando arriverà, `INCOME_TAX_RATE` è il primo numero da
  rileggere, perché la carta comincerà a pagare **due** prezzi invece di uno.
- **Le fonti multiple.** Questa delega dà un regime a **una** fonte. La regola vale per tutte, ma
  costruire il posto dove metterne una seconda prima che esista è ciò che l'ADR 0014 vieta.
- **L'accredito automatico dell'eccedenza per le fonti nere.** Il black market e il casinò pagheranno
  in contanti e riempiranno il caveau: cosa succede all'eccedenza è una domanda della fetta 04, dove
  la risposta ha un nome — riciclare — invece di essere una comodità.
- **Il raggruppamento di tasse e commissioni nella telemetria.** Il conto le separa già; la
  `Category` cresce quando una schermata le mostra.

## Definizione di fatto

- [x] Un reddito non si può costruire senza dichiarare la trattenuta: il codice vecchio non compila.
- [x] Con regime in nero il comportamento è **identico** a oggi, e i test di D017 lo provano senza
      essere riscritti nella sostanza.
- [x] Con regime dichiarato il reddito atterra sulla carta, `withheld()` resta a zero per sempre, e
      l'allarme del caveau non compare più.
- [x] La somma di tutti i conti fa zero anche con la trattenuta: la partita doppia regge (INV-08).
- [x] Mettersi in regola due volte è rifiutato con `error.income.already_declared`.
- [x] Un salvataggio scritto prima di questa delega si apre, e apre in nero.
- [x] I due bersagli nuovi sono verdi, e nessuno dei due si verifica contro se stesso: la
      trattenuta si confronta con `ATM_FEE_RATE_IN` e si misura anche **simulando** un minuto in
      regola; il prezzo si confronta con la scala del caveau, non con una cifra ricopiata.
- [x] Parità i18n, gate verdi, `docs/stato.md` rigenerato.
- [ ] **La pagina del reddito guardata nella finestra vera**: il pannello del regime si disegna, il
      flusso del pagamento si apre e si chiude, e dopo l'acquisto la pagina dice «in regola» invece
      di restare indietro. Aggiunto **dopo** l'esecuzione, e vale la pena dire perché: la delega
      era stata scritta senza, mentre D042 ce l'aveva — e questa aggiunge un pannello nuovo, cioè
      esattamente il caso in cui un gate verde non dimostra che si veda qualcosa.

## Trappole note

- **Il salvataggio vecchio.** `IncomeSave` guadagna un campo, e il payload è alla versione 1 senza
  migrazioni. Il `load` di oggi rifiuta ciò che non riconosce (INV-20), quindi accettarlo com'è
  chiuderebbe fuori ogni partita esistente. La regola qui è: **`declared` assente vale `false`**, e
  non è fidarsi del salvataggio — è dichiarare cosa significa un campo che non c'è. Una partita
  scritta prima di questa delega è una partita in cui il giocatore era necessariamente in nero.
  Quello che resta vietato è `declared` **presente e non booleano**, che è manomissione.
- **`room(pool)` va chiesto al pool del regime, non a `cash`.** È la riga che sembra invariante e
  non lo è: chiedere lo spazio al pool sbagliato produce un reddito che si ferma su un pool che non
  ha tetto, cioè il muro che compare dove non esiste.
- **La trattenuta si calcola su ciò che entra, non su ciò che è maturato.** A caveau pieno entra una
  parte, e tassare il maturato farebbe pagare le tasse su soldi che il giocatore non ha ricevuto. In
  regime dichiarato le due cifre coincidono sempre — ma coincidono perché la carta non ha tetto, non
  per costruzione, e il giorno di un pool tracciato con un tetto la differenza morde.
- **`tax` va aggiunto in fondo a `POOL_IDS`.** In mezzo cambierebbe l'ordine dei saldi salvati.
- **Il conto `tax` non deve comparire nella UI**: `player: false`, come gli altri quattro.

## Cosa questa delega lascia indietro

- **Il caveau perde clienti finché non arriva la fetta 04.** Chi si mette in regola non ha più
  ragione di ampliare, e gli ultimi tre livelli della scala restano senza motivo fino al black
  market. È un costo reale di questa delega, ed è accettato: il prezzo della dichiarazione è tarato
  apposta perché la scala si attraversi **prima**, e le fonti nere della fetta 04 sono ciò che le
  ridà un cliente.
- **Il regime resta dentro un dominio.** Il grilletto per salirlo in `contracts/` è il secondo
  dominio che genera guadagni.
- **La regola 3 dell'ADR non ha ancora un meccanismo.** «Ciò che accade da solo atterra in un pool
  senza tetto» non ha oggi nessuna fonte automatica da sorvegliare. Il grilletto è la prima fonte
  che produce denaro senza che il giocatore prema niente — un affitto, un dividendo, uno stop-loss —
  e va nel registro YAGNI insieme agli altri.

## Consuntivo

### Cosa e stato costruito

- **Kernel.** `income(pool, amount, withheld)` con il terzo argomento obbligatorio, il conto `tax`
  in fondo a `POOL_IDS`, e lo schema del main allargato al settimo saldo.
- **Dominio.** `Regime` come dato, `regimeOf`, il listino della dichiarazione, `createDeclare`, e il
  tick che non nomina piu nessun pool.
- **Bilanciamento.** `INCOME_TAX_RATE` al 3%, `INCOME_DECLARATION_PRICE_CARD` a 50.000,00 €, e i
  due bersagli che li sorvegliano.
- **Applicazione.** `IncomeRegimePanel.vue`, quattro selettori nello store, due chiavi i18n nuove
  per la ragione e l'errore piu sei per la pagina.

### Le tre cose che l'esecuzione ha cambiato rispetto al testo

**1 · Il listino della dichiarazione non si svuota.** La delega diceva «vuoto quando si e gia in
regola, cosi non serve un ramo», copiando la forma di `expansionPrices` del caveau. E sbagliato: la
forma del caveau vale per una **scala**, dove l'indice cade fuori da solo. Qui lo stato e un
booleano, e un listino che dipende dallo stato rende `accepts` dipendente dallo stato — cioe rende
variabile la cosa che il Ledger deve poter sapere prima di guardare una partita. Il gemello che sta
venti righe sopra nello stesso file, `upgradePrices()`, rispondeva gia bene: listino fermo,
condizione nel comando e in `canDeclare`.

**2 · Il campo assente e la chiave presente a `undefined` non sono la stessa cosa.** La delega
diceva «`declared` assente vale `false`», e scritto come `loaded.declared !== undefined` avrebbe
fatto passare anche uno stato manomesso a mano — cioe avrebbe bucato INV-20. A trovarlo e stato
`tests/rules/stateful-systems-reject-garbage`, che genera la spazzatura **dallo stato buono** e
quindi ha provato `declared: undefined` senza che nessuno glielo chiedesse. La distinzione giusta e
`'declared' in loaded`: JSON non sa produrre una chiave presente che vale `undefined`, quindi
vederla vuol dire che qualcuno l'ha scritta.

**3 · Il nome del campo del regime.** La delega scriveva `withholding: Money`, che si legge come un
importo. E una frazione, e il tipo non lo dice: `withholdingRate`.

### Cosa e costato piu del previsto

Il terzo argomento obbligatorio di `income` ha toccato **dodici file**: un modulo di cheat e dieci
file di test, piu il sistema del reddito. Nessuna delle modifiche e interessante — `, ZERO` — ma e
il grosso delle 405 righe di test contate nell'indice, che quindi **non sono 405 righe di prove
nuove**: le prove nuove sono ventitre casi fra dominio, kernel, bilanciamento e store.

Era il prezzo dichiarato, ed e stato pagato per la ragione dichiarata: adesso un reddito senza
regime non compila, e INV-27 non ha bisogno di un test che lo sorvegli.

### Cosa resta da fare

- **INV-26 manca ancora in `tracciabilita.md`**, e non e di questa delega: e di
  [D042](D042-il-caveau-ha-uno-spazio-e-una-scala.md), che risulta `In corso`. La tabella ha un
  buco fra 25 e 27 finche quella non chiude.
- **Quattro commenti in `balance/constants.ts` e `contracts/pools.ts` citano costanti che D042 ha
  cancellato** — `VAULT_CAPACITIES`, `VAULT_PRICES_CARD`. Trovati passando di qui, lasciati stare:
  sono di quella delega.
- **Il grafo delle deleghe non ha ne D042 ne D043.** Aggiungere solo la seconda avrebbe disegnato
  una freccia verso un nodo che non esiste.
