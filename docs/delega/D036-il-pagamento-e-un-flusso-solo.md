# D036 — Il pagamento è un flusso solo

- **Stato:** **Chiusa** — commit `f72bf9c`, ramo `d036-il-pagamento-e-un-flusso-solo`, che parte da
  `main` fuso (D034 e il guscio dei grafici compresi). Scritta ed eseguita il 2026-08-23. Le
  correzioni rispetto a com'era scritta sono in fondo, e due vengono dall'aver guardato la finestra
  vera invece del codice
- **Dipende da:** [D019](D019-il-pagamento.md), che ha portato il listino e il vocabolario;
  [D023](D023-il-design-system.md), che ha portato il kit e il grilletto dei due disegni;
  [D031](D031-la-sovrapposizione-e-un-pezzo-del-kit.md), che ha portato il livello superiore e R22
- **Sblocca:** la fetta 03, blocco A. Ogni oggetto comprato è un'azione che si paga, e sarebbe il
  terzo `v-for` sul listino
- **ADR vincolanti:** [0042](../adr/0042-il-pagamento-e-un-flusso-solo.md) (questa delega lo porta
  ad _Accettata_), [0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) (il
  listino è dell'azione, e il comando ricalcola il prezzo),
  [0017](../adr/0017-il-denaro-e-plurale.md) (le affordance di un pool sono **dati**),
  [0032](../adr/0032-le-sovrapposizioni-stanno-nel-livello-superiore.md) (il livello superiore),
  [0030](../adr/0030-il-telaio-e-una-forma-non-un-contenitore.md) (un pezzo del kit è una forma),
  [0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md) (R14 — il kit non conosce parole)
- **Regole:** R04, R05, R12, R14, R17, R18, R21, **R22 allargata**, **R24 nuova**, INV-07, INV-21
- **Budget:** dichiarato ~260 righe di codice e ~200 di test; **misurato 335 e 270**, cioè il 29%
  e il 35% sopra. Lo sforamento ha un nome per ognuna delle tre voci, e stanno nelle correzioni 1, 4
  e 7: il pezzo puro `instruments.ts` che la delega non aveva previsto, i tre selettori che R24
  rende necessari, e il secondo rilevatore di R24 — che serve perché un template di Vue non è
  tipizzato. `card.ts` è la sola aggiunta a `core/` ed è **sotto** il preventivo
- **Nessuna decisione aperta.** Le sei prese scrivendola sono in fondo, sotto _Le decisioni prese
  scrivendola_, e stanno nella tabella _Decisioni contestabili_ di
  [PASSAGGIO-DI-CONSEGNE](PASSAGGIO-DI-CONSEGNE.md): l'utente ha delegato con la direttiva generale

## Obiettivo

Che «con cosa pago» si chieda in un posto solo, e che pagare con la carta non sia lo stesso gesto
che pagare in contanti.

## Perché esiste

L'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) ha costruito il
listino e ha lasciato scritta, fra le proprie conseguenze, una cosa che nessuno ha fatto: il
componente che disegna la scelta. Al suo posto ogni pannello che paga fa un `v-for` sul listino e
mette **un pulsante per strumento**.

Sono due, e la duplicazione è già misurata: `instrumentOf` è la stessa funzione in
[IncomePanel.vue](../../src/renderer/components/income/IncomePanel.vue) e in
[VaultPanel.vue](../../src/renderer/components/vault/VaultPanel.vue), e il commento della seconda lo
dichiara per iscritto. È lo stesso reperto di
[D031](D031-la-sovrapposizione-e-un-pezzo-del-kit.md), dove due copie della stessa meccanica
avevano già cominciato a divergere prima che qualcuno le confrontasse.

E c'è la metà che non è di forma. Il gioco è costruito su una tensione — contanti anonimi e
limitati contro carta tracciabile e illimitata — che nel codice oggi è **una riga di prosa sul retro
della carta**. Pagare con l'una o con l'altra costa lo stesso gesto.

## La forma

### 1 · Il permesso è un'affordance dello strumento

`PoolProps` acquisisce la quinta voce, e la sua assenza è ciò che rende il flusso possibile senza un
`if` sul nome del pool:

```ts
/** Se chi lo tiene può spenderlo. I contanti sì; la carta chiede prima di chi è. */
readonly bearer: boolean
```

`cash: true`, `card: false`. I quattro conti non-giocatore dell'
[ADR 0020](../adr/0020-partita-doppia.md) dichiarano `false` e nessuno li guarda: un listino
contiene solo pool del giocatore, e questo va scritto **nel commento** invece che sperato — è la
stessa forma con cui `traceable` vale per loro senza voler dire niente.

**Il kernel non la legge**, e non deve: il Ledger valida movimenti, non autorizzazioni. Il
precedente esatto è `traceable`, che ha un lettore solo ed è la presentazione.

### 2 · La carta è una funzione del seme

`src/core/domains/atm/card.ts`, puro:

```ts
export interface Card {
  /** Sedici cifre in gruppi di quattro, come stampate. */
  readonly number: string
  /** `MM / AA`, come stampata. */
  readonly expiry: string
  /** Le tre cifre del retro. */
  readonly code: string
}

export const cardOf = (seed: number): Card => …
export const authorizes = (card: Card, typed: string): boolean => …
```

**Non passa dall'`Rng`**, e la ragione va scritta nel file: un'estrazione da uno stream avanza un
cursore che finisce nel salvataggio, quindi `cardOf` chiamata due volte darebbe due carte. Serve una
funzione del **seme**, non della sequenza. Il mescolatore è locale, poche righe, con le sue costanti
nominate — R04 vale anche qui.

**Il numero passa il controllo di Luhn.** L'ultima cifra è calcolata, non estratta. Non serve al
gioco e serve alla credibilità, che in questo progetto è una cosa che si cura: la carta ha tre
contatti sul chip «come su una carta vera» e il pannello della firma è chiaro «perché ci si scrive
sopra». Il numero di oggi — `4913 2201 0067 5540` — **non** lo passa: la somma di Luhn fa 53.
Misurato, non supposto.

**L'intestatario resta stampa**, insieme a `DEBIT`, `CARDHOLDER` e `VALID THRU`: un nome vuole un
elenco di nomi, cioè dati nuovi per una riga stampata. `ORNAMENT` non sparisce — dimagrisce a ciò
che è uguale in ogni partita e in ogni lingua, e il commento che lo dichiara decorazione resta vero.

### 3 · `UiDialog` nel kit, e R22 si allarga

`<dialog>` con `showModal()`: livello superiore, sfondo, `Esc` e trappola del fuoco dal motore.
Nessuna libreria ([ADR 0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md)), nessun
`z-index` (R21).

**Meccanica sola, non dipinge niente**, esattamente come `UiPopover`: fondo, bordo e larghezza sono
del contenuto, che entra per slot — quindi è una forma e non un contenitore
([ADR 0030](../adr/0030-il-telaio-e-una-forma-non-un-contenitore.md)).

**I due stati di `display` si scrivono tutti e due**, chiuso e aperto, con la condizione. È la riga
che ha rotto il pannello dei cheat per due stesure, e `<dialog>` ha la stessa classe di difetto del
`popover`: il foglio del motore lo tiene chiuso, una regola d'autore vince a qualunque specificità.

**R22 diventa «il livello superiore passa dal kit»**, con due custodi in un test solo — `UiPopover`
per `popover`, `UiDialog` per `dialog`. Non una regola nuova: la stessa, allargata a ciò che era
sempre stato nel suo scopo. La riga in [tracciabilita.md](../tracciabilita.md) cambia con lei.

### 4 · `PaymentDialog`, e R24

`src/renderer/components/payment/PaymentDialog.vue`. La cartella è nuova, e la sua riga in
`NOT_DOMAINS` di `tests/rules/domain-ui` dice di chi è la roba: il precedente è `ledger/` — un
concetto trasversale con il proprio vocabolario in `contracts/`, che non è un dominio e non ha una
pagina.

Cosa riceve, e cosa non sa:

| Proprietà | Cosa                                                                  |
| --------- | --------------------------------------------------------------------- |
| `prices`  | il listino dell'azione                                                |
| `affords` | se quello strumento basta, per voce — è l'anteprima, non la decisione |
| `card`    | la carta, per mostrarla e farla girare                                |
| `refusal` | la frase del rifiuto, già tradotta, oppure niente                     |

Emette `confirm: [pool, code]` e **non chiama nessuno store**: chi lo apre è il pannello del
dominio, che ha già il suo store sotto mano. Così resta provabile e non conosce le due azioni che
oggi lo usano.

**Cosa disegna.** Una voce per opzione: nome dello strumento, prezzo con quello, e la voce smorzata
quando `affords` dice di no — **smorzata, non spenta** (INV-21). Con un listino di **una** voce non
c'è una scelta da etichettare: si legge la ragione, che è la chiave `payment.only_with` già esistente
e già usata dai due pannelli.

**Quando la voce scelta non è al portatore**, compaiono la carta e il campo del codice. La carta è
[BankCard3d](../../src/renderer/components/atm/BankCard3d.vue) — il codice sta sul **retro**, quindi
va girata. Il pulsante di conferma resta premibile con il campo vuoto o sbagliato: a dire cosa manca
è il rifiuto, che è la stessa legge di tutto il resto (INV-21).

**R24** — `PaymentOption` e `PriceList` non compaiono in nessun `.vue` fuori da
`components/payment/`. Un componente che non può nominare un'opzione non può disegnarne una fila.
⚠️ **Non vede** un listino letto da un selettore senza mai nominarne il tipo: il limite si dichiara
in `tracciabilita.md`, come per R22 e R23.

### 5 · A verificare è lo store

`PaymentError` entra in `contracts/payment.ts` — è vocabolario, come il resto di quel file:

```ts
export interface PaymentError {
  readonly code: 'error.payment.unauthorized'
  readonly pool: Pool
}
```

I due comandi dello store prendono il codice e lo verificano **prima** di chiamare il dominio:

```ts
const buyUpgrade = (pool: Pool, code: string): Result<IncomeState, IncomeError | PaymentError> => …
const expandVault = (pool: Pool, code: string): Result<VaultState, VaultError | PaymentError> => …
```

Il controllo è **uno**, in una funzione locale dello store che entrambi chiamano: due copie della
stessa domanda prima o poi divergono, ed è la ragione per cui `atmFee` è una funzione e non un
numero (D014).

Perché lo store e non il componente: se a controllare fosse la finestra, la garanzia sarebbe «la
finestra si è ricordata» invece di una proprietà, e chiunque chiamasse il comando la scavalcherebbe.
È la decisione 3 dell'ADR 0027 applicata alla prova invece che al prezzo.

Perché non dentro il comando di dominio: il codice viene dalla carta, la carta sta in `atm`, e
`income` non può importare `atm` (R19). Lo store è il punto che ha entrambi i capi
([ADR 0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)).

**Il rifiuto non tocca il Ledger.** Torna prima, quindi non c'è nessuna transazione da annullare —
che è la stessa forma di `notInPriceList` in `income/commands.ts`.

### 6 · La carta si rilegge dove si rilegge tutto il resto

`mirror()` nello store, che esiste esattamente per questo — «caricare non è un movimento economico,
quindi il mirror va riletto a mano». È chiamata sia da `start()` dopo un caricamento sia da
`newGame()` dopo un `reset('hard')`, e tutti e due cambiano il seme.

## Da produrre

| File                                                | Cosa                                                                 |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| `src/core/contracts/pools.ts`                       | `bearer` fra le affordance, e il commento sui quattro conti          |
| `src/core/contracts/payment.ts`                     | `PaymentError`. Resta vocabolario: nessuna funzione                  |
| `src/core/domains/atm/card.ts`                      | `Card`, `cardOf`, `authorizes`. Puro, e senza `Rng`                  |
| `src/renderer/ui/UiDialog.vue`                      | la finestra modale del kit: meccanica, non dipinge                   |
| `src/renderer/components/payment/PaymentDialog.vue` | il flusso: listino, scelta, prova, conferma                          |
| `src/renderer/components/atm/BankCard3d.vue`        | i tre dati arrivano per proprietà; `ORNAMENT` resta la sola stampa   |
| `src/renderer/components/atm/AtmPanel.vue`          | passa la carta alla carta                                            |
| `src/renderer/components/income/IncomePanel.vue`    | una CTA al posto del ciclo; `instrumentOf` esce                      |
| `src/renderer/components/vault/VaultPanel.vue`      | una CTA al posto del ciclo; `instrumentOf` esce                      |
| `src/renderer/stores/game.ts`                       | `card` nel mirror, il controllo unico, i due comandi con il codice   |
| `src/renderer/i18n/it.ts` · `en.ts` · `index.ts`    | le chiavi nuove, e `PaymentError` nell'unione che INV-07 percorre    |
| `tests/domains/atm/card.test.ts`                    | deterministica, ben formata, Luhn, e due semi che danno due carte    |
| `tests/renderer/store.test.ts`                      | il rifiuto non autorizzato, e che non muove un saldo                 |
| `tests/rules/payment-flow.test.ts`                  | R24, con il proprio rilevatore provato nei due versi                 |
| `tests/rules/overlays-pass-through-the-kit.test.ts` | R22 allargata: due custodi, `popover` e `dialog`                     |
| `tests/rules/domain-ui.test.ts`                     | `payment` in `NOT_DOMAINS`, con la riga che dice di chi è la roba    |
| `docs/adr/0042-il-pagamento-e-un-flusso-solo.md`    | da `Proposta` ad `Accettata`, con il rosso che l'ha dimostrata       |
| `docs/tracciabilita.md`                             | R24, e la riga di R22 riscritta                                      |
| `docs/glossario.md`                                 | _strumento al portatore_, e _prova_ accanto a _opzione di pagamento_ |
| `docs/design/domini/atm.md`                         | la carta ha dei dati, e uno di essi ha uno scopo                     |
| `docs/architettura.md`                              | `card.ts` e la cartella `payment/` nell'albero                       |
| `docs/roadmap-fette.md`                             | la riga della finestra modale esce: il grilletto è scattato          |
| `docs/stato.md`                                     | rigenerato con `npx vitest run tests/rules/project-state -u`         |

## Invarianti

- **R05 resta**: la parte sbagliabile esce pura. `authorizes` sta in `core/`, e nessun `.vue`
  calcola. La finestra riceve e emette.
- **R14 resta**: `UiDialog` non conosce dominio, stato né parole. Le parole del pagamento stanno in
  `components/payment/`, che è il piano dove `StatTile` sta per la stessa ragione.
- **INV-21 resta**: nessun pulsante si spegne. Una voce che non basta si **smorza**, e la conferma
  con il codice sbagliato è premibile — a spiegare è il rifiuto.
- **INV-19 resta**: il comando ricalcola il prezzo dal listino. La finestra consegna il pool, mai il
  prezzo. Aggiungere la prova non aggiunge un secondo dato di cui fidarsi.
- **INV-07 resta**: `PaymentError` entra nell'unione, quindi `messageOf` non compila finché non ha
  la sua frase in tutte e due le lingue.
- **Il salvataggio non cambia**: `SAVE_VERSION` resta 1, nessuna migrazione, INV-06 non si muove. La
  carta è una funzione del seme, che nel salvataggio c'era già.
- **Il kernel non cambia**: `bearer` non lo attraversa, e il Ledger continua a non sapere chi
  autorizza.

## Fuori scope

- **Il codice al bancomat.** Prelevare non è pagare: non c'è scelta di strumento, e la cerimonia
  esiste già — l'anteprima dei movimenti. Il grilletto per riaprirla è il primo strumento non al
  portatore che si preleva **senza** passare da un'anteprima.
- **IBAN, PIN, plafond, punteggio di credito.** Non esiste un conto nel gioco, e la carta è un pool
  e non un conto. Il grilletto dell'IBAN è il primo trasferimento verso un terzo che abbia una
  destinazione. Quello del PIN non esiste: sarebbe una seconda prova per lo stesso gesto.
- **Una carta che scade davvero.** Vuole un rinnovo, un costo e uno stato nel salvataggio. La
  scadenza si deriva e resta stampa.
- **Fiches e crypto.** I pool non esistono. Il flusso li accoglierà perché itera un listino e legge
  un'affordance, e i due ruoli di colore ci sono già in `roles.ts`.
- **La conversione automatica quando i fondi non bastano.** Già scartata dall'ADR 0027, e questa
  finestra è il posto più tentante in cui rimetterla.
- **Ricordare la prova per la sessione**, o chiederla solo sopra una soglia. Sono due meccaniche che
  nessuno ha chiesto, e la seconda vuole un numero in `balance/` che nessuno sa scegliere. Il
  grilletto è il primo giocatore — noi compresi — che dica che digitare tre cifre stanca: oggi le
  azioni che si pagano sono **cinque** in una partita intera, l'upgrade più i quattro ampliamenti —
  `VAULT_PRICES_CASH` ha un elemento in meno di `VAULT_CAPACITIES`, e i livelli sono cinque.
- **jsdom.** La parte sbagliabile esce pura, come per `rotation.ts` e `postings.ts`. Se non
  riuscisse, il costo sarebbe evidente invece che teorico — ed è la condizione scritta nel registro
  YAGNI.

## Definizione di fatto

- [x] `npm run verify` verde, e `npm run verify:release` verde.
- [x] **Ogni test nuovo è stato visto rosso di proposito**, e per R24 e R22 il rosso si costruisce
      rimettendo il difetto: un `import type { PaymentOption }` in `VaultPanel.vue`, un `<dialog>`
      in un `.vue` fuori dal kit.
- [x] Nella finestra vera: dal caveau, una CTA sola apre la finestra con **due** voci, contanti e
      carta, con i due prezzi diversi; scegliendo i contanti si conferma e basta; scegliendo la
      carta compare la carta, e il codice sta sul retro.
- [x] Nella finestra vera: dal reddito, la finestra si apre con **una** voce e si legge «si paga
      solo con la carta» invece del nome dello strumento.
- [x] Un codice sbagliato produce una frase e **nessun movimento**: il saldo prima e dopo è lo
      stesso, verificato nello store e non a occhio.
- [x] Due semi diversi danno due carte diverse, e lo stesso seme dà due volte la stessa carta.
- [x] Il numero della carta passa il controllo di Luhn, e il test lo ha visto rosso con una cifra
      forzata.
- [x] Dopo `newGame()` la carta è cambiata, e dopo un caricamento è quella della partita caricata.
- [x] `grep -r "instrumentOf" src` non trova più niente.
- [x] Nessun `.vue` fuori da `components/payment/` nomina `PriceList` o `PaymentOption`.
- [x] Le chiavi nuove esistono in tutte e due le lingue, e `tests/i18n/parity` è verde.
- [x] I documenti vivi che nominano ciò che è cambiato sono stati **riletti**, non solo quelli in
      _Da produrre_: è la classe di difetto che questo progetto dichiara scoperta.
- [x] Le correzioni rispetto a com'era scritta questa delega sono scritte in fondo. Se non ce ne
      sono, o era perfetta o non è stata letta con attenzione.

**Cosa ha risposto la finestra vera**, e non è dedotto. Dal caveau: una CTA sola, `Amplia`, apre una
finestra che `:modal` dichiara aperta, con **due** voci — «Con Contanti 900,00 €» e «Con Carta
898,00 €» — e la conferma che segue lo strumento, `Paga 900,00 €` oppure `Paga 898,00 €`. Con i
contanti la carta non compare affatto; con la carta compaiono la carta e il campo. La carta di
quella partita è `4693 2605 9004 2390`, scadenza `05 / 33`, codice `522` — nessuno dei tre è quello
che `ORNAMENT` stampava, e il numero passa Luhn con somma 70 mentre quello di prima faceva 53. Il
retro rende `backface-visibility: hidden`, quindi il codice si legge **girando**. Con `000` si legge
«Il codice non corrisponde a questo strumento (Carta).», la finestra resta aperta e il caveau resta
a `Caveau 1 di 5`; con `522` la finestra si chiude e il caveau dice `Caveau 2 di 5`. Dal reddito la
finestra si apre con **una** voce, «Si paga solo con: Carta 800,00 €», e la carta compare subito. Lo
sfondo del livello superiore risolve `var(--color-sunken)` dentro `::backdrop`.

## Trappole note

1. **`display` su un elemento del livello superiore.** Vale per `<dialog>` come per `popover`, e il
   difetto è già costato due stesure a D029: il foglio del motore chiude, una regola d'autore senza
   condizione tiene aperto, e lo schermo non cambia. I due stati si scrivono tutti e due.

2. **`showModal()` su un dialogo già aperto lancia.** È la stessa classe delle due guardie di
   `UiPopover`, che non sono prudenza: succede appena il puntatore entra su un elemento che ha anche
   il fuoco. Qui la forma è un doppio clic sulla CTA.

3. **Il campo del codice tiene testo, non un numero.** È la trappola di D012 con un'altra faccia:
   un `ref` numerico perderebbe lo zero iniziale, e `041` non è `41`. Testo di qua, confronto di là,
   e in mezzo una normalizzazione che toglie gli spazi — come fa `readAmount` per gli importi.

4. **La carta va riletta dopo un caricamento e dopo `newGame()`.** Il seme cambia in tutti e due, e
   niente lo annuncia sul Bus. Il posto è `mirror()`, che esiste per questa ragione e che entrambi
   chiamano già. Senza, la partita nuova porta la carta di quella buttata via — e non se ne accorge
   nessun test che non guardi due partite di fila.

5. **`no-magic-numbers` copre `src/core/**`.** Il mescolatore e Luhn sono pieni di numeri: vanno
   nominati, come `STEP` e `FNV_PRIME` in `Rng.ts`.

6. **`storeToRefs` estrae solo `ref` e `computed`.** La carta va in uno `shallowRef` come tutto il
   resto del mirror: un oggetto nudo esce `undefined` e la finestra si apre senza carta, senza un
   errore e senza un avviso. È costato una prova a schermo in D029.

7. **Un test sul rifiuto non autorizzato passa anche se non fa niente.** «Il saldo non è cambiato» è
   vero pure per un comando che non è mai stato chiamato: è la lezione della candela piatta di D034.
   Il test discrimina solo se accanto c'è il **caso verde** — stesso pool, codice giusto, saldo che
   si muove.

8. **La parità i18n non vede una chiave che nessuno usa.** `payment.only_with` esiste già e
   cambierà casa: va verificato che non resti orfana in un pannello che non la nomina più, perché
   `parity` sarebbe verde lo stesso.

## Correzioni rispetto a com'era scritta la delega

1. **`components/payment/instruments.ts` non era in _Da produrre_.** `instrumentOf` doveva finire da
   qualche parte, e un `.vue` non calcola (R05): sono due funzioni pure — se uno strumento chiede
   una prova, e con quale chiave si etichetta una voce — provate senza montare niente, come
   `postings.ts` accanto a `PostingRows.vue`. Sono la ragione per cui jsdom è rimasto fuori un'altra
   volta.

2. **`authorization.ts` nel renderer non è nato.** La delega lo nominava nella prosa; il confronto
   vive in `core/domains/atm/card.ts` come `authorizes`, accanto a **chi produce il codice**. Un
   secondo file avrebbe separato la domanda dalla sua sorgente, che è la forma di difetto che INV-19
   esiste per impedire sui prezzi.

3. **Il prezzo esce dalla CTA**, e `common.buy` e `vault.expand` perdono `{cost}`. È il rovescio
   della correzione 8 di [D019](D019-il-pagamento.md) — «il prezzo resta sul pulsante» — e la
   ragione non è un ripensamento: quella decisione valeva perché il pulsante **era** la scelta. Con
   una CTA che apre un listino a due prezzi, un prezzo scritto su di lei è un prezzo che il
   giocatore può non pagare.

4. **Tre selettori nuovi nello store**, non dichiarati: `canAffordUpgrade`, `canAffordExpansion` e
   `vaultAtMax`. Discendono da R24 — un pannello non può contare le voci di un listino per sapere se
   qualcosa è alla portata o se il caveau è finito — e la domanda per strumento resta dov'era.

5. **Il tipo `Card` si ri-esporta dallo store.** Un `.vue` che importasse `@core/domains/atm/card`
   passerebbe il lint, perché R05 elenca `rules` e `commands`; la disciplina però è la stessa, ed è
   la strada che `AtmOperationKind` aveva già aperto.

6. **`BankCard3d` ha dovuto rinominare il proprio riferimento al DOM.** Si chiamava `card`, e `card`
   adesso è il **dato**: due cose con lo stesso nome in un file solo sono la prima riga sbagliata
   che qualcuno scrive. Adesso l'elemento che gira è `plastic`.

7. **R24 ha due rilevatori, non uno.** La delega ne descriveva uno — il tipo importato — e non
   basta: un template di Vue **non è tipizzato**, quindi la fila si ricostruisce con un `v-for` su
   un selettore senza nominare niente. Il secondo rilevatore guarda il ciclo. Tutti e due visti
   rossi rimettendo il difetto in `VaultPanel`.

8. **`padStart(width, '0')` non si scrive dentro un dominio.**
   `tests/rules/domains-no-money-literals` vede un numero fra apici e non può distinguere
   un'imbottitura da un importo — giustamente. Le due cifre si stampano con `String(100 + n).slice(1)`.

9. **Un `/regex/` letterale con un apice manda fuori fase `english-identifiers`**, ed è una trappola
   che il passaggio di consegne dichiara già. È stata ripagata lo stesso: il rilevatore del ciclo
   adesso non nomina gli apici, e `[^>]*` dice la stessa cosa dentro un tag.

10. **I tre fatti del retro sono diventati facoltativi, e il titolo con loro.** Nel pagamento la
    carta arriva senza — sono fatti del bancomat — e il titolo «Cosa fa questo strumento» restava
    stampato sopra un elenco vuoto. **Trovato guardando la finestra**, non leggendo il codice.

11. **Il pallino della scelta prendeva il blu di sistema**, ed era l'unico blu dell'applicazione.
    Resta il `radio` del motore, con `accent-color` dal tema. Anche questo visto guardando.

12. **Le azioni che si pagano sono cinque, non sei**, ed è stata corretta prima di eseguire:
    `VAULT_PRICES_CASH` ha un elemento in meno di `VAULT_CAPACITIES`, quindi cinque livelli fanno
    **quattro** ampliamenti.

## Le decisioni prese scrivendola

L'utente ha chiesto di scegliere «purché rispetti i principi di coerenza, zero debiti futuri,
professionalità e stato dell'arte odierno, non pigrizia — non necessariamente la soluzione più
invasiva o lunga». Sono la direttiva generale, quindi decise qui e marcate contestabili.

| #   | Decisione                                                           | Perché così                                                                                                                                                                     |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Finestra modale**, non menù contestuale                           | il contenuto non è una voce da scegliere: è un listino, una carta da girare e un campo. E il gioco dietro non deve restare cliccabile a metà pagamento                          |
| 2   | Il **permesso è del pool** (`bearer`), non dell'azione              | un `if (pool === 'card')` dentro il flusso avrebbe centralizzato il disegno e sparso la regola. È la riga dell'ADR 0017 sulle affordance come dati                              |
| 3   | Il flusso si apre **anche** con un listino di uno                   | l'ADR 0027 ha già deciso che non è un caso speciale, e lì dentro c'è la ragione e la prova. Un flusso con un'eccezione è due flussi                                             |
| 4   | Il numero passa **Luhn**                                            | costa otto righe e un test, e senza «il numero è vero» non è sostenuto da niente. Quello di oggi non lo passa: somma 53                                                         |
| 5   | Il bancomat **non** chiede il codice                                | non c'è scelta di strumento e la cerimonia esiste già. È l'unico gesto ripetuto del gioco, e un secondo rito lì è solo attrito                                                  |
| 6   | `BankCard3d` **resta** in `components/atm/` e `payment/` la importa | è il centro della pagina del bancomat da D033, e un `git mv` per una purezza che nessuna regola esprime è rumore. Il grilletto per spostarla è il **terzo** lettore della carta |
