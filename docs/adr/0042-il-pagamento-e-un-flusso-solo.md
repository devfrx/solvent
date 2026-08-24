# ADR 0042 — Il pagamento è un flusso solo

- **Stato:** **Accettata** — [D036](../delega/D036-il-pagamento-e-un-flusso-solo.md), con i due
  rossi che l'hanno dimostrata: **R24** in `tests/rules/payment-flow`, vista rossa rimettendo in
  `VaultPanel` l'import di `PaymentOption` **e** il ciclo sul listino; e **R22 allargata** in
  `tests/rules/overlays-pass-through-the-kit`, vista rossa con un `<dialog>` in `AtmPanel`
- **Data:** 2026-08-23
- **Estende:** [ADR 0027](0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md), di cui
  costruisce la conseguenza rimasta scritta e non fatta
- **Origine:** una richiesta dell'utente — «un componente universale e centralizzato per decidere il
  metodo di pagamento, invece dei soliti mille CTA» — che coincide con un debito già dichiarato

## Contesto

L'[ADR 0027](0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) elenca fra le proprie
conseguenze una che nessuno ha costruito:

> «La UI acquisisce un componente che non aveva: la scelta dello strumento, con il prezzo di ognuno.
> **Non è un menù a tendina in fondo a un modulo** — è la cosa che il giocatore guarda prima di
> premere, e va disegnata come tale.»

Al suo posto ogni pannello che paga disegna **un pulsante per strumento**, dentro un `v-for` sul
listino. Sono due, e la duplicazione è già cominciata: `instrumentOf` esiste identica in
`IncomePanel.vue` (da D044
[IncomeSourcePanel.vue](../../src/renderer/components/income/IncomeSourcePanel.vue)) e in
[VaultPanel.vue](../../src/renderer/components/vault/VaultPanel.vue), e il commento della seconda lo
dichiara — «è la stessa funzione di `IncomePanel`, con l'altro ramo acceso». Non è un rischio
futuro: è la stessa forma del difetto che
[ADR 0039](0039-una-sovrapposizione-passa-dal-kit.md) ha chiuso per le sovrapposizioni, dove due
copie della stessa meccanica erano divergenti prima che qualcuno le guardasse.

Il grilletto di [D023](../delega/D023-il-design-system.md) — «un pezzo entra nel kit quando lo
disegnano **due** componenti» — è quindi scattato. E con lui quello della **finestra modale**, che
il [registro YAGNI](../roadmap-fette.md) tiene fuori con la condizione «il primo che serve davvero».

C'è una seconda metà, e non è cosmetica. L'[ADR 0017](0017-il-denaro-e-plurale.md) fonda il gioco su
una tensione sola — «anonimi ma limitati contro tracciabili ma illimitati» — e nel codice quella
tensione oggi è **una riga di prosa sul retro della carta**. Pagare in contanti e pagare con la
carta sono lo stesso gesto: un clic. La differenza fra i due strumenti è dichiarata e non si sente.

Intanto la carta porta un numero, una scadenza e un codice di tre cifre che sono una costante dentro
un `.vue`, con accanto il proprio grilletto scritto da
[D033](../delega/D033-il-bancomat-e-una-pagina.md): «un numero ricavato dal seme della partita
sarebbe la prima cosa nel gioco a distinguere una partita da un'altra a schermo».

## Decisione

**Ogni azione che si paga passa da un flusso solo**, e lo strumento si sceglie lì dentro. Il flusso
è una **finestra modale** del kit, non un menù: deve contenere il listino, il prezzo di ciascuna
voce, l'oggetto con cui si paga e il rifiuto quando arriva, e deve impedire di toccare il gioco
mentre la si guarda.

**Tre decisioni, e ognuna è quella vera.**

### 1. Il pezzo è uno, e una regola rende impossibile il secondo

Come per il Registry contro le cinque liste ([ADR 0002](0002-registry-unica-lista-di-sistemi.md)),
per il livello superiore ([ADR 0032](0032-le-sovrapposizioni-stanno-nel-livello-superiore.md)) e per
il vestito dei grafici ([ADR 0034](0034-il-grafico-e-una-libreria.md)): non si controlla che due
disegni coincidano, si fa in modo che ce ne sia **uno**.

**R24** — fuori da `components/payment/` nessun `.vue` nomina `PaymentOption` o `PriceList`, e
nessuno **cicla** su un listino. Sono due rilevatori e non uno, perché la fila si può ricostruire in
due modi: con il tipo, e senza — un template di Vue non è tipizzato. Un componente che non può né
nominare un'opzione né iterarne una lista non ne disegna una fila, e il terzo dominio non
ricostruisce i due pulsanti in buona fede.

**Consegnare il listino resta legittimo, ed è il punto**: un pannello scrive
`:prices="expansionPrices"` e non disegna niente. ⚠️ Il secondo rilevatore riconosce un listino dal
**nome** della sorgente del ciclo, quindi un selettore chiamato in un altro modo gli sfugge: il
limite si dichiara in [tracciabilita.md](../tracciabilita.md), come per R22 e R23.

### 2. Il permesso è un'affordance dello strumento, non una proprietà dell'azione

Un flusso solo che dentro scrivesse `if (pool === 'card')` avrebbe centralizzato il disegno e
sparso la regola: è il difetto che l'ADR 0017 esiste per non avere — «ogni pool dichiara le proprie
affordance come **dati**, così nessun dominio contiene un `if` sul nome del pool».

Quindi `PoolProps` acquisisce la quinta affordance, con il nome che la finanza le dà:

```ts
/** Se chi lo tiene può spenderlo. I contanti sì; la carta chiede prima di chi è. */
readonly bearer: boolean
```

`cash: true`, `card: false`. **Uno strumento non al portatore chiede una prova prima di pagare.**

Il nome non è un vezzo: uno _strumento al portatore_ è una cosa precisa, e il criterio che divide i
contanti dalla carta divide da solo anche ciò che verrà — le fiches del casinò sono al portatore, la
crypto no. Il giorno in cui entrano, dichiarano il proprio `bearer` e questo flusso non cambia di
una riga.

**Il kernel non lo legge.** È la stessa forma di `traceable`, che oggi ha un solo lettore ed è la
presentazione ([i18n/index.ts](../../src/renderer/i18n/index.ts)). Il Ledger continua a validare
movimenti senza sapere chi ha autorizzato cosa.

### 3. La prova è il codice della carta, e la carta diventa vera

Il codice di tre cifre smette di essere una costante decorativa e diventa una **funzione pura del
seme della partita**: `cardOf(seed)` produce numero, scadenza e codice. Il seme sta già nel
salvataggio (`rng.seed`), quindi non c'è stato nuovo, nessuna migrazione, nessun sistema da
registrare — e la carta diventa diversa in ogni partita, che è il grilletto scritto in
`BankCard3d.vue`.

**Il codice si legge girando la carta.** La finestra mostra la carta dal fronte; il codice sta sul
retro, dove sta su una carta vera. Contanti: un gesto. Carta: leggila, poi digita. Non è attrito
inventato — è la tensione dell'ADR 0017 resa fisica, e dà al ribaltamento 3D di
[P5](../prodotto/preferenze.md) uno scopo oltre alle tre righe di fatti.

**A verificare è lo store, non il componente.** È la stessa decisione dell'ADR 0027 sul prezzo, con
lo stesso argomento: se a controllare fosse la finestra, la garanzia sarebbe «la finestra si è
ricordata di controllare» invece di una proprietà, e chiunque chiamasse il comando dallo store
scavalcherebbe la cerimonia. Il rifiuto è un `PaymentError` con il proprio codice, quindi entra
nell'unione che INV-07 percorre e **non compila** finché non ha la sua frase in tutte e due le
lingue.

## Quando

**Adesso.** I due grilletti sono scattati — il pezzo disegnato due volte (D023) e la finestra
modale (registro YAGNI) — e il terzo listino non è immaginato: è la fetta 03, il blocco A, dove
ogni oggetto comprato è un'azione che si paga.

Costruirlo dopo vorrebbe dire scrivere il terzo `v-for` per poi toglierlo, che è esattamente ciò
che l'ADR 0027 aveva previsto e che due deleghe non hanno fatto.

## Alternative scartate

- **Un menù contestuale ancorato alla CTA**, cioè `UiPopover` con `on="press"`. È il pezzo che
  esiste già e costerebbe zero. Non regge il contenuto: un listino con i prezzi, la carta da girare
  e un campo da compilare non è una bolla ancorata a un pulsante, e soprattutto non è **modale** —
  il gioco resta cliccabile dietro, e un pagamento a metà con il resto raggiungibile è la forma in
  cui nasce uno stato incoerente. `<dialog>` con `showModal()` porta livello superiore, sfondo,
  `Esc` e trappola del fuoco dal motore, senza una libreria e senza un `z-index` (R21).

- **Tenere i pulsanti in linea e limitarsi a estrarre `instrumentOf`.** Toglie la duplicazione
  misurata e lascia il problema: la scelta resta una fila di CTA che cresce con il listino, e con
  tre voci un pannello diventa tre pulsanti impilati. Ed è la lettura minima della frase dell'ADR
  0027, che dice l'opposto: la scelta **è** la cosa da disegnare, non una riga sopra il pulsante.

- **Chiedere il codice anche al bancomat.** Uniforme, e sbagliata per due ragioni misurabili.
  Prelevare non è pagare: la direzione decide i due lati, non c'è nessuna scelta di strumento da
  fare, e la cerimonia esiste già — l'anteprima dei movimenti «prima di confermare»
  ([ADR 0018](0018-la-home-e-un-atm.md)). Un secondo rito sullo stesso gesto, in quello che è
  l'unico gesto ripetuto del gioco, è attrito e basta. Il grilletto per riaprirla è il primo
  strumento non al portatore che si preleva **senza** passare da un'anteprima.

- **Un `PaymentMethod` nuovo accanto a `Pool`.** Sembra il modello corretto — «metodo di pagamento»
  è il nome che la richiesta usa — e sarebbe una seconda lista da tenere allineata a `POOL_IDS`,
  cioè il difetto A01 in una veste nuova. Uno strumento con cui si paga **è** un pool: ha un saldo,
  ha una capienza, lascia o non lascia traccia. Ciò che mancava non era un tipo: era un'affordance.

- **Verificare il codice dentro il comando di dominio.** Il posto più severo, e impossibile senza
  rompere R19: il codice viene dalla carta, la carta sta in `atm`, e `income` non può importare
  `atm`. Farlo passare per argomento fino al comando vorrebbe dire che ogni dominio che spende
  conosce la forma di una prova che non è sua. Lo store è il punto che ha entrambi i capi sotto
  mano, ed è ciò per cui esiste ([ADR 0024](0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)).

- **Ricavare dal seme anche l'intestatario.** Il numero, la scadenza e il codice si derivano da
  cifre; un nome vuole un elenco di nomi, cioè dati nuovi che nessuna regola legge, per una riga
  stampata. L'intestatario resta ciò che è: stampa, insieme alle etichette `CARDHOLDER` e
  `VALID THRU`, che sono uguali in ogni partita e in ogni lingua.

- **Fare della scadenza una data che scade.** Sarebbe l'unico dei tre dati con una meccanica, e la
  meccanica non esiste: una carta che scade vuole un rinnovo, un costo e uno stato nel salvataggio.
  La scadenza si deriva perché una carta mezza derivata e mezza fissa è incoerente a guardarla, e
  resta dichiarata come stampa.

## Conseguenze

- **`IncomePanel` e `VaultPanel` perdono il `v-for` e `instrumentOf`**, e restano con **una** CTA
  che apre il flusso. Il caveau passa da due pulsanti a uno.

- **Un listino di una voce apre la finestra lo stesso.** L'ADR 0027 ha già deciso che non è un caso
  speciale, ed è la riga che qui costa qualcosa: per l'upgrade del reddito — carta, voce unica — la
  finestra si apre per una scelta che non c'è. Si apre perché lì dentro c'è la **ragione** («si paga
  solo con la carta») e c'è la prova da dare, e perché un flusso con un'eccezione è due flussi.

- **`UiDialog` entra nel kit, e R22 si allarga.** Da «l'attributo `popover` vive solo in
  `UiPopover`» a «il livello superiore passa dal kit», con due custodi in un test solo: `<dialog>`
  finisce nello stesso livello e ha la stessa classe di difetto — una regola d'autore su `display`
  che vince su quella del motore.

- **Il salvataggio non cambia.** `SAVE_VERSION` resta 1: la carta è una funzione del seme, che nel
  salvataggio c'era già.

- **Il flusso è pronto per gli strumenti che non esistono.** Fiches e crypto entreranno come voci di
  `POOL_IDS` con il proprio `bearer`, e la finestra le mostrerà senza una riga di differenza. Il
  ruolo di colore c'è già per tutte e due in [roles.ts](../../src/renderer/ui/roles.ts).

- **Resta fuori la conversione automatica**, e non è questo ADR a deciderlo: l'ADR 0027 l'ha già
  scartata, e la finestra ne è il posto più tentante. Quando i fondi non bastano si smorza la voce e
  si spiega — non si compra la differenza al bancomat per conto del giocatore.
