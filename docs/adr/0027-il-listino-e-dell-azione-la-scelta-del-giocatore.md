# ADR 0027 — Il listino è dell'azione, la scelta è del giocatore

- **Stato:** **Accettata** — [D019](../delega/D019-il-pagamento.md): `PaymentOption` e
  `PriceList` vivono in `contracts/payment.ts`, il listino dell'upgrade è una funzione pura di
  `income/rules.ts`, `UPGRADE_PAYMENT.accepts` **ne è generato**, e il comando riceve il pool e
  ricalcola il prezzo. Il rosso che l'ha dimostrata: con il prezzo copiato (`.plus(0)`) tre test
  di identità diventano rossi e quelli di uguaglianza restano verdi — è INV-19 che si rompe
  senza far rumore, e adesso fa rumore
- **Data:** 2026-08-20

## Contesto

L'[ADR 0017](0017-il-denaro-e-plurale.md) ha deciso che il denaro è plurale, e lo ha scritto con
una frase che il codice non mantiene:

> Non esistono azioni che assumono uno strumento: esistono azioni che dicono «contanti a prezzo
> pieno, carta con +40% di calore».

Metà è costruita. `TransactionMeta.accepts` dichiara quali pool un'azione ammette, il Ledger
rifiuta con `error.ledger.pool_not_accepted` e l'elenco viaggia dentro l'errore. È una **lista di
permessi**, e funziona.

L'altra metà non esiste, e sono due cose diverse:

1. **Nessuno sceglie.** `income` compra il suo upgrade con `spend('card', upgradeCost())`: il pool
   è scritto nel codice. Il giocatore non decide niente, e la frase «la scelta _con cosa pago_ è il
   meccanismo centrale del gioco» — sempre ADR 0017 — descrive qualcosa che non è mai accaduto.
2. **Il prezzo non cambia con lo strumento.** `accepts` sa dire «sì» o «no», non «sì, ma costa
   diverso». Il «+40% di calore» dell'esempio non ha nessun posto dove vivere.

Il grilletto è scattato adesso perché i comandi che spendono stanno per diventare **due**:
l'upgrade del reddito, e l'ampliamento del caveau di [D017](../delega/D017-il-caveau.md). Il primo
non poneva la domanda, il secondo la pone e D017 non può risponderla da solo — una meccanica che
riguarda tutti i domini, disegnata dentro uno, nasce storta.

## Decisione

**Ogni azione che si paga espone un listino: per ogni strumento che accetta, quanto costa con
quello strumento.** Il listino è una funzione pura del dominio, e ritorna una lista di
`PaymentOption`.

```ts
export interface PaymentOption {
  readonly pool: Pool
  readonly price: Money
}
```

Il contratto vive in `contracts/payment.ts`, accanto agli altri: è vocabolario condiviso fra
domini, store, componenti e chiavi i18n, non un dettaglio di uno di loro.

**Quattro conseguenze, e ognuna è la decisione vera.**

**1. Il kernel non cambia.** `accepts` resta la lista di permessi che è, e il Ledger continua a
**validare** movimenti senza sapere quanto costano. Il prezzo per strumento è una regola di gioco:
se il Ledger la conoscesse, sarebbe la seconda cosa che sa del gioco dopo le affordance dei pool, e
la prima è già al limite di ciò che l'[ADR 0003](0003-ledger-unica-porta-del-denaro.md) gli concede.

**2. Il listino è chiamato due volte, dalla stessa funzione.** La UI lo chiama per **mostrare**, il
comando per **applicare**. Non due formule da tenere allineate: una sola, interrogata da entrambi.
È la forma che il bancomat ha già — `previewOf` costruisce i movimenti che la UI mostra e che il
comando applica — ed è INV-11 applicata al pagamento.

**3. Il comando riceve il pool scelto, non il prezzo.** Se ricevesse il prezzo, la UI potrebbe
consegnarne uno diverso da quello mostrato, e la garanzia del punto 2 sarebbe una speranza invece
che una proprietà. Il comando ricalcola dal listino e paga quello.

**4. Un'azione con un solo strumento non è un caso speciale.** È un listino di uno. La UI non
mostra il selettore e mostra il **perché**: «questo si paga solo con la carta». Oggi il giocatore lo
scopre sbagliando, e l'informazione arriva come errore invece che come etichetta.

**I numeri stanno in `balance/`.** Il listino dichiara _che_ i contanti costano diverso; _quanto_
diverso è un importo di gioco, e un importo di gioco non nasce dentro un dominio.

**Quando i fondi non bastano, il gioco spiega e non converte.**
`error.ledger.insufficient_funds` porta già `pool`, `required` e `available`: dire «ti mancano
200 € sulla carta» si può già. La UI aggiunge quanto c'è negli altri strumenti e la via per il
bancomat. Nessuna conversione automatica dentro l'acquisto: sarebbero due operazioni travestite da
una, e il giocatore smetterebbe di sentire che contanti e carta sono due cose diverse — che è la
tensione su cui il gioco è costruito. Vale anche la legge 5 della
[visione](../prodotto/visione.md): il banco vince sempre un po', e la commissione va vista mentre
si paga.

## Quando

**Adesso, e prima di [D017](../delega/D017-il-caveau.md).** Il caveau è il secondo comando che
spende, e va scritto **col listino** invece che con un pool fisso da correggere dopo.

Ne discende una domanda legittima: un contratto scritto quando esiste **un** chiamante è
generalizzazione da un caso solo, cioè la cosa che il
[registro YAGNI](../roadmap-fette.md) esiste per fermare. La risposta è che i casi sono due, e il
secondo non è immaginato: è **specificato**. L'ampliamento del caveau ha una delega scritta, una
[scheda di dominio](../design/domini/vault.md) compilata e un prezzo che dovrà dichiarare. La
differenza fra generalizzare da uno e generalizzare da due non è quante righe di codice esistono:
è se il secondo caso è noto o sperato.

## Alternative scartate

- **Una tabella globale in `balance/`: «i contanti costano il 5% in meno e scaldano di più»,
  uguale per tutti.** Coerente per costruzione e impossibile da sbilanciare, e per questo sbagliata:
  il black market fa uno sconto in contanti, l'immobiliare li penalizza — nessuno vende una casa in
  nero a prezzo pieno. Una regola sola non può dire tutte e due, e con una sola regola la domanda
  «con cosa pago?» avrebbe una risposta sola e definitiva in tutti i diciassette domini. Sarebbe un
  selettore, non una scelta.

- **Mettere il prezzo per strumento dentro `TransactionMeta.accepts`.** È il posto che sembra
  giusto perché `accepts` è già lì. Ma `TransactionMeta` è ciò che il **Ledger** legge, e il Ledger
  non calcola prezzi: riceve movimenti già costruiti. Ci finirebbe un campo che il kernel trasporta
  e non usa, cioè un pezzo di gioco dentro il kernel.

- **Il comando riceve il `PaymentOption` intero, scelto dalla UI.** Toglie una chiamata e apre un
  buco: nulla obbliga l'opzione applicata a essere una di quelle mostrate. Il bancomat ha già
  affrontato la stessa scelta e ha deciso allo stesso modo — `previewOf` è richiamata dal comando,
  non ricevuta.

- **La conversione automatica quando i fondi non bastano.** Un clic invece di tre. Nasconde la
  commissione dentro l'acquisto, rende il bancomat un dettaglio invece che il ponte, e cancella il
  momento in cui il giocatore decide di lasciare una traccia.

- **Costruire subito la voce `heat` del listino.** L'esempio dell'ADR 0017 la nomina, ma il calore è
  un dominio della fetta 04 e nessuno leggerebbe quel campo per tre fette. `PaymentOption` lo
  riceverà allora, e sarà **additivo**: nessuna migrazione, nessun chiamante da toccare, nessun test
  da riscrivere. Un campo che nessuno legge è ciò che l'[ADR 0014](0014-una-fetta-verticale-alla-volta.md)
  vieta, e la forma qui scelta rende l'attesa gratuita.

- **Costruire `convertibleTo`**, elencato fra le proprietà di un pool dall'ADR 0017 e mai scritto.
  Con due pool il grafo delle conversioni è **un arco solo**, e quell'arco è il bancomat. Il
  grilletto è il terzo pool: le fiches del casinò, che convertono con spread e in una direzione
  sola.

## Conseguenze

- **`UPGRADE_PAYMENT` di `income` smette di essere una costante e diventa un listino.** È il primo
  chiamante, ed è anche la prova che il listino regge un'azione con **un solo** strumento ammesso.

- **Il caveau nasce già col listino.** [D017](../delega/D017-il-caveau.md) diceva di pagare
  l'ampliamento con la carta «come convenzione corrente, non come decisione». Quella riga esce:
  non c'è più niente da rimandare.

- **La UI acquisisce un componente che non aveva**: la scelta dello strumento, con il prezzo di
  ognuno. Non è un menù a tendina in fondo a un modulo — è la cosa che il giocatore guarda prima di
  premere, e va disegnata come tale.

- **Ogni prezzo diventa due chiavi i18n invece di una**, perché va detto anche _con cosa_ si paga e
  _perché_ un'opzione non c'è. Il test di parità fra le due lingue lo fa rispettare senza che
  nessuno se ne ricordi.

- **L'ADR 0017 smette di promettere una cosa che il codice non fa.** Resta `Accettata` e non
  cambia: questo ADR ne costruisce la seconda metà, e la frase sul «+40% di calore» diventa vera
  alla fetta 04 invece che mai.
