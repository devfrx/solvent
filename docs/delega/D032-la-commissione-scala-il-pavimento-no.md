# D032 — La commissione scala, il pavimento no

- **Stato:** Chiusa — commit `83422a3`, ramo `d032-la-commissione-scala-il-pavimento-no`, che parte da
  `d030-il-contenuto-scorre-nel-telaio` perché i sei commit del 2026-08-21 non sono ancora fusi in
  `main`. Scritta ed eseguita il 2026-08-21
- **Dipende da:** [D014](D014-dominio-bancomat.md), che ha costruito la commissione fissa, e
  [D017](D017-il-caveau.md), che ha tarato i prezzi del caveau **contro** quella commissione
- **Sblocca:** [D033](D033-il-bancomat-e-una-pagina.md). La pagina nuova disegna «ATM fee (1,5%)»
  in ogni anteprima: costruirla su una commissione fissa vorrebbe dire disegnare due volte lo
  stesso riquadro
- **ADR vincolanti:** [0006](../adr/0006-decimal-end-to-end-per-il-denaro.md) (Decimal ovunque),
  [0021](../adr/0021-una-sola-primitiva-per-il-denaro.md) (una primitiva sola),
  [0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md) — **`Proposta`, e questa delega è
  il suo grilletto**, [0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
- **Produce:** ADR [0038](../adr/0038-la-commissione-scala-il-pavimento-no.md) — _La commissione
  scala, il pavimento no_ — e manda l'[ADR 0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md)
  da `Proposta` ad `Accettata`, perché ne è il grilletto
- **Regole:** R04 e R11 (i numeri di gioco stanno in `balance/`), INV-08 (la somma fa zero),
  INV-10 (nessun dominio nomina il conto delle commissioni), INV-11 (l'anteprima **è**
  l'operazione)
- **Budget:** ~90 righe di codice, quasi tutte in `balance/`, `atm/rules.ts` e `contracts/money.ts`.
  Il grosso della delega è nei test che cambiano, non nel codice che nasce

## Obiettivo

Fare della commissione del bancomat una **percentuale con un pavimento**, così che resti una
decisione anche quando gli importi diventano grandi.

## Perché esiste

**Una commissione fissa smette di esistere.** 2,50 € su 500 € sono lo 0,5% e si sentono; 2,50 € su
un milione sono lo 0,00025% e non li nota nessuno. Il gesto centrale del gioco — spostare denaro
sapendo quanto costa — diventa gratuito esattamente nel momento in cui il giocatore ha abbastanza
denaro perché la scelta conti qualcosa.

Il ragionamento scritto oggi in `balance/constants.ts` **non è sbagliato**, ed è la ragione per cui
questa delega non lo cancella:

> con una percentuale il caso "la commissione supera l'importo" non si presenterebbe mai, e con
> esso sparirebbe la dinamica che il caveau della fetta 02 userà — prelevare poco costa
> proporzionalmente molto, quindi conviene prelevare grosso, ma i contanti hanno una capienza.

È vero di una percentuale **nuda**. Non è vero di una percentuale con un pavimento, che è la forma
che tiene tutte e due le cose: sotto la soglia di attraversamento la commissione è piatta e
prelevare poco costa proporzionalmente tanto; sopra, scala e continua a costare.

**Il canvas lo diceva già**, ed è stato letto male una volta: la sua formula è
`Math.max(1, importo × tasso)` — non una percentuale nuda, ma esattamente questa forma.

## La forma

```
commissione(importo, tasso) = max(PAVIMENTO, importo × tasso)   arrotondata ai centesimi per eccesso
```

Tre numeri di gioco, tutti in `balance/constants.ts`:

| Costante           | Valore | Perché quello                                                             |
| ------------------ | ------ | ------------------------------------------------------------------------- |
| `ATM_FEE_FLOOR`    | 2,50 € | è l'`ATM_FEE` di oggi, e resta 2,50 per la ragione scritta in _Il caveau_ |
| `ATM_FEE_RATE_IN`  | 1,5%   | depositare, cioè entrare nel tracciabile                                  |
| `ATM_FEE_RATE_OUT` | 2,0%   | prelevare, cioè uscirne                                                   |

**L'asimmetria è una frase di gioco, non una taratura:** uscire dal sistema tracciabile costa più
che entrarci. È la stessa cosa che il gioco dice in ogni dominio — l'anonimato si paga — detta dal
lato del bancomat. I due tassi vengono dal canvas e si prendono così come sono.

### Dove cade la soglia, e perché è la parte che insegna

La commissione è piatta finché `importo × tasso` non supera il pavimento:

| Direzione | Soglia                     | Sotto la soglia | Sopra             |
| --------- | -------------------------- | --------------- | ----------------- |
| Deposito  | 2,50 / 1,5% = **166,67 €** | piatta a 2,50 € | 1,5% dell'importo |
| Prelievo  | 2,50 / 2,0% = **125,00 €** | piatta a 2,50 € | 2,0% dell'importo |

Gli importi rapidi di oggi — 1, 10, 100, 500 — cadono **tre sotto la soglia e uno sopra**, e non è
una fortuna: è il motivo per cui la lezione resta leggibile a schermo. 1 € è rifiutato perché la
commissione se lo mangia, 10 € ne perde un quarto, 100 € il 2,5%, 500 € il 2%. La curva si vede
premendo quattro pulsanti, che è ciò che `ATM_AMOUNTS` esiste per fare (D014).

**1 € continua a fallire**, ed è la spunta che conta: con il pavimento a 2,50 € la commissione
resta maggiore dell'importo, quindi `error.atm.fee_exceeds_amount` resta raggiungibile **dalla
schermata** e non solo da un test. Una percentuale nuda avrebbe reso quel ramo irraggiungibile, e
un ramo che nessuno può vedere a schermo è un ramo che marcisce.

### Il caveau, e perché il pavimento resta 2,50 e non 1,00 come il canvas

`tests/balance/targets` verifica che lo sconto della carta sul listino del caveau resti **sotto la
commissione del bancomat**:

```ts
expect(discount.lessThan(BALANCE.ATM_FEE)).toBe(true)
```

È la legge della non dominanza, misurata: chi ha solo contanti, per pagare con la carta, deve
prima versarli e lasciare la commissione al bancomat — quindi lo sconto conviene **solo se supera
la commissione**, e non deve mai superarla.

Il confronto giusto adesso è con il **pavimento**, che è la commissione più bassa che possa mai
esistere: se lo sconto sta sotto quello, sta sotto qualunque commissione. Tenere il pavimento a
2,50 € lascia l'intervallo `vault_card_discount` (0,50 – 2,49 €) valido **così com'è**, e i
quattro prezzi di `VAULT_PRICES_CARD` non si toccano.

Col pavimento a 1,00 € del canvas, l'intervallo andrebbe stretto e i quattro prezzi ritarati: un
cantiere in un altro dominio aperto dentro una delega che parla di un altro (ADR 0014). Il canvas è
l'autorità su come una schermata si **vede**, non sui numeri di gioco — è la stessa distinzione già
fatta per il suo `z-index` ([ADR 0037](../adr/0037-il-telaio-non-scorre-il-contenuto-si.md)).

### L'arrotondamento, e l'ADR che fa scattare

`333 € × 1,5%` fa `4,995 €`: **mezzo centesimo**. Oggi non succede mai, perché una commissione
fissa non si calcola. Da questa delega in poi succede a ogni operazione che non cade tonda.

Serve quindi un arrotondamento ai centesimi, e vive in `contracts/money.ts` accanto alla primitiva
([ADR 0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)) — che è **il grilletto scritto
nell'[ADR 0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md)**: _«il meccanismo nasce con
la prima delega che tocca `contracts/money.ts`»_. Quell'ADR passa da `Proposta` ad `Accettata` qui,
e la sua decisione si esegue: la precisione si **dichiara** invece di ereditarla.

Si dichiara al valore che ha già — venti significativi — quindi non cambia un comportamento: smette
solo di essere un valore che nessuno ha scelto. Alzarla è un'altra decisione, con il suo grilletto
già scritto in quell'ADR, e non si prende qui.

**Per eccesso, non al più vicino.** Una commissione che arrotonda per eccesso è ciò che fa una
banca, ed è la riga che il canvas ha già scritto sotto il riquadro delle commissioni pagate: _«the
house always wins a little»_. Mezzo centesimo per operazione non sposta un bilanciamento; la
direzione dell'arrotondamento sposta la **frase** che il gioco dice, e questa è quella giusta.

INV-08 regge comunque, e vale la pena dire perché invece di sperarlo: `transfer` costruisce i tre
movimenti da `importo` e `commissione` già arrotondata — `−importo`, `+(importo − commissione)`,
`+commissione` — quindi i tre sommano a zero **per costruzione**, qualunque cifra abbia la
commissione. L'arrotondamento cade prima della transazione, mai dentro.

## Da produrre

| File                                 | Cosa                                                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `src/core/contracts/money.ts`        | la precisione dichiarata (ADR 0026) e `roundUpToCents(value)`, l'unico arrotondamento del progetto         |
| `src/core/balance/constants.ts`      | `ATM_FEE` esce; entrano `ATM_FEE_FLOOR`, `ATM_FEE_RATE_IN`, `ATM_FEE_RATE_OUT`, tutti e tre `Decimal`      |
| `src/core/domains/atm/rules.ts`      | `atmFee(amount, rate)`. Il commento che spiega perché **non** prende l'importo va **riscritto**, non tolto |
| `src/core/domains/atm/commands.ts`   | `AtmOperation` porta il proprio `feeRate`: nessun `if` sulla direzione, da nessuna parte                   |
| `src/renderer/stores/game.ts`        | `atmFee` come numero fisso **esce**; entrano i due tassi, che sono ciò che la carta e la pagina mostrano   |
| `src/core/balance/targets.ts`        | `vault_card_discount`: la prosa cita il pavimento invece della commissione                                 |
| `tests/contracts/money.test.ts`      | la precisione è quella dichiarata; l'arrotondamento è per eccesso e solo ai centesimi                      |
| `tests/domains/atm/rules.test.ts`    | il pavimento, la percentuale, e la soglia in cui l'uno diventa l'altra — nelle due direzioni               |
| `tests/domains/atm/commands.test.ts` | 1 € resta rifiutato; l'anteprima di 500 € porta la percentuale e non il pavimento                          |
| `tests/balance/targets.test.ts`      | il confronto passa da `ATM_FEE` a `ATM_FEE_FLOOR`, e l'intervallo non si tocca                             |
| `docs/adr/0038-…`                    | la decisione                                                                                               |
| `docs/adr/0026-…`                    | da `Proposta` ad `Accettata`, con la data e la delega che l'ha eseguita                                    |
| `docs/design/domini/atm.md`          | la scheda: la voce «Pagamento» e la sezione delle costanti cambiano                                        |

## Invarianti

- **INV-11 resta**: l'anteprima **è** l'operazione. Una formula sola per la commissione, letta da
  `previewOf` e applicata dal comando — mai due.
- **INV-08 resta**: la somma di tutti i conti fa zero. L'arrotondamento cade **prima** di
  `transfer`, mai fra i suoi tre movimenti.
- **INV-10 resta**: il dominio non nomina il conto `fees`. La terza riga la scrive `transfer`.
- **R04 · R11 restano**: i tre numeri stanno in `balance/`, e `no-magic-numbers` sotto `domains/**`
  continua a impedire che ne compaia uno qui.
- **`vault_card_discount` resta verde senza ritarare nulla**, ed è la misura che dice che il
  pavimento è quello giusto.
- **1,00 € resta rifiutato dalla schermata**, non solo da un test.

## Fuori scope

- **Ritarare i prezzi del caveau.** Il pavimento è scelto apposta perché non serva. Se un giorno
  cambia, quello è il giorno in cui `VAULT_PRICES_CARD` si ritocca — con la sua delega.
- **Il calore.** Il canvas mette «Heat generated» sotto l'anteprima del bancomat. Non esiste, e non
  nasce qui: [D033](D033-il-bancomat-e-una-pagina.md) lo lascia fuori per la stessa ragione.
- **Alzare la precisione oltre i venti significativi.** L'ADR 0026 ha il suo grilletto scritto, ed
  è un saldo che supera 1e17 €. Non è questo.
- **Soglie giornaliere del bancomat.** Sono ciò che darà al bancomat il suo primo stato, e quel
  giorno nascerà `atm/system.ts`. Oggi il bancomat non ha stato, e questa delega non gliene dà.
- **Una commissione che dipende dal calore o dal livello del conto.** Due tassi costanti, e basta.

## Definizione di fatto

- [x] La commissione è `max(pavimento, importo × tasso)`, arrotondata ai centesimi per eccesso, e
      la formula sta in **un** posto.
- [x] I due tassi sono asimmetrici e ciascuna direzione porta il proprio: nessun `if` sulla
      direzione in tutto il repo.
- [x] `ATM_FEE` non esiste più. `grep -rn "ATM_FEE\b" src/ tests/` non trova niente.
- [x] L'ADR 0026 è `Accettata` e la precisione è dichiarata in `contracts/money.ts`.
- [x] `tests/balance/targets` è verde **senza** che `VAULT_PRICES_CASH` o `VAULT_PRICES_CARD`
      siano stati toccati.
- [x] 1,00 € è ancora rifiutato con `error.atm.fee_exceeds_amount`, e la spunta è presa **premendo
      il pulsante nella finestra vera**, non solo in un test.
- [x] La soglia di attraversamento è provata nelle due direzioni: appena sotto la commissione è il
      pavimento, appena sopra è la percentuale.
- [x] Una regola nuova, se ne nasce una, è rotta di proposito una volta.
- [x] `npm run verify` verde e `docs/stato.md` rigenerato.

## Trappole note

1. **Il commento di `atmFee()` dice il contrario del codice nuovo.** Oggi spiega per esteso perché
   la funzione **non** prende l'importo (`noUnusedParameters`, C01). Lasciarlo lì mentre la firma
   cambia è peggio che non averlo mai scritto: chi legge crede al commento. Va **riscritto**, e la
   ragione nuova va detta — l'importo serve, il pavimento è ciò che tiene in piedi la vecchia.
2. **`store.atmFee` è una fotografia.** Oggi è `shallowRef<Money>(atmFee())`, cioè un numero
   catturato una volta e passato alla carta. Con una commissione che dipende dall'importo quel
   `ref` non è più patchabile: è **sbagliato di forma** e va tolto, non aggiornato. Chi lo legge
   oggi è `HomeView` → `BankCard3d`, e la carta deve mostrare **i tassi** — «1,5% in · 2,0% out»,
   che è la riga del canvas.
3. **`isFeeWithinAmount` non cambia, ma il suo test sì.** La funzione resta `fee.lessThan(amount)`.
   Ciò che cambia è quale importo la fa scattare: prima era «meno di 2,50», adesso è «meno del
   pavimento». Un test che scrive `2.50` a mano diventa un numero di gioco ricopiato — deve leggere
   `ATM_FEE_FLOOR`.
4. **Il tasso è `Decimal`, non `number`.** `constants.ts` lo dice già in testa: _«un tasso
   convertito in `number` perderebbe centesimi lungo la catena»_. Scrivere `0.015` come letterale
   JavaScript è il difetto che quel file esiste per impedire.
5. **Arrotondare due volte non è arrotondare.** `roundUpToCents` si applica alla commissione, una
   volta, dentro `atmFee`. Se lo applica anche `previewOf`, o il confine di presentazione, il
   risultato può salire di un centesimo per passaggio. Un solo punto, e sta nella funzione che
   produce il numero.
6. **La soglia non è un numero da scrivere.** 166,67 € e 125,00 € sono `pavimento / tasso`: si
   **misurano** dai due numeri che li producono, come `seconds_to_first_wall` fa già in
   `targets.test.ts`. Scriverli sarebbe il difetto A04 con un altro nome.

## Correzioni rispetto a com'era scritta la delega

1. **La delega diceva di dichiarare venti cifre significative. L'ADR 0026 ne chiedeva quaranta, ed
   è stato eseguito come era scritto.** Il testo qui sopra — _«si dichiara al valore che ha già,
   quindi non cambia un comportamento»_, e il fuori scope _«alzare la precisione oltre i venti
   significativi»_ — era stato scritto senza leggere fino in fondo la sezione _Decisione_ di
   quell'ADR. Dichiarare il predefinito sarebbe stato un ADR eseguito a metà, e il numero non era
   arbitrario: la [visione](../prodotto/visione.md) dichiara un bersaglio di scala di ~1e30 €, e a
   venti cifre `transfer()` smette di bilanciare a 1e20 — dieci ordini di grandezza **prima** del
   bersaglio che il progetto si è dato.
2. **L'ADR 0026 chiedeva due test, non uno, e aveva ragione.** Il primo impone la precisione, il
   secondo copre il guasto vero: `transfer()` che smette di sommare a zero. Le due soglie che
   quell'ADR prevedeva sono state **misurate** e sono esatte — il centesimo esiste fino a 1e37,
   `transfer` sbilancia da 1e40. Sono adesso in `tests/contracts/money`, derivate invece che
   ricopiate: un aggiornamento di decimal.js che le spostasse le renderebbe rosse.
3. **Alzare la precisione non ha reso rosso un solo test degli ottocento esistenti**, ed era la
   conseguenza che l'ADR 0026 temeva di più. La misura è stata presa come vuole
   [D017](D017-il-caveau.md): si scrive la riga, si esegue la suite, si legge. Le divisioni che il
   progetto fa oggi non arrivano a una ventesima cifra significativa.
4. **`store.atmFee` non è stato sostituito: è stato tolto, e al suo posto è nata un'altra cosa.**
   La delega diceva «entrano i due tassi», che è vero, e non diceva la parte che conta: `atmFeeRates`
   non è il successore di `atmFee`, perché non risponde alla stessa domanda. «Quanto costa
   un'operazione» non ha più una risposta costante, e chi la vuole chiede un'anteprima. Un test
   nuovo verifica l'**assenza** (`'atmFee' in store` è falso), perché una riga tolta che qualcuno
   rimette in buona fede è il modo in cui questa delega si disfa.
5. **Il formato `rate` è entrato nell'i18n, e la delega non lo prevedeva.** Il retro della carta
   deve dire «1,5% versando · 2,0% prelevando», e un tasso non è un importo: scriverlo nel
   dizionario sarebbe stato un numero di gioco dentro una traduzione (R04). Il formato usa
   `style: 'percent'`, che moltiplica per cento da sé — così il fattore cento non compare in nessun
   punto del nostro codice. La costante `CURRENCY` dei formati è stata rinominata `NUMBERS`, perché
   con una percentuale dentro il vecchio nome mentiva.
6. **Una partita giocata è cambiata sotto il test che la registra.** `game-roundtrip` versa tutto
   il contante per comprare l'upgrade da 800 €: servivano 669 tick, adesso 677, perché versare
   812,40 € ne costa 12,19 invece di 2,50. **Che quel numero abbia dovuto salire è la misura di
   questa delega**, non un effetto collaterale da assorbire.
7. **Il `grep` della definizione di fatto ha trovato più di quanto cercasse.** `ATM_FEE` viveva
   anche in tre documenti **vivi** — la scheda del bancomat, quella del caveau e il passaggio di
   consegne — oltre che in `constants.ts`, dentro il commento di `VAULT_PRICES_CARD`. Le deleghe
   chiuse che lo nominano non sono state toccate: sono documenti storici, e riscriverle
   falsificherebbe cosa era vero quando sono state eseguite.
8. **La spunta a occhio ha richiesto un cheat, ed è la prima volta.** Il caveau della partita di
   sviluppo era pieno, quindi ogni prelievo sbatteva sulla capienza prima di poter mostrare la
   percentuale: le quattro anteprime del prelievo dicevano tutte «ci stanno ancora 0,00 €». «Svuota
   i contanti» ([D029](D029-i-devcheat.md)) ha costruito lo stato in cui la misura era possibile —
   che è esattamente ciò per cui quella delega esiste.
9. **La verifica a occhio ha diagnosticato il difetto di un'altra delega.** Il pannello dei cheat
   copre 300×502 px della colonna destra e rendeva irraggiungibile metà dei pulsanti da premere.
   Interrogando il DOM per toglierlo di mezzo è venuta fuori la causa che
   [D031](D031-la-sovrapposizione-e-un-pezzo-del-kit.md) cercava: `.panel { display: flex }`
   sovrascrive il `display: none` che il motore dà a un `popover` chiuso. **Non è stata corretta
   qui** — è scritta nella sua delega, che resta quella che la corregge.

## La misura, presa nella finestra vera

Via CDP, con la finestra ferma dov'era, il 2026-08-21. Ogni riga è il testo letto **nel documento**
dopo aver premuto il pulsante, non un numero calcolato a parte.

**Il retro della carta:** «Commissione per operazione = 1,5% versando · 2,0% prelevando».

| Importo  | Deposito (1,5%)                    | Prelievo (2,0%)                    |
| -------- | ---------------------------------- | ---------------------------------- |
| 1,00 €   | _rifiutato_                        | _rifiutato_                        |
| 10,00 €  | commissione **2,50 €** (pavimento) | commissione **2,50 €** (pavimento) |
| 100,00 € | commissione **2,50 €** (pavimento) | commissione **2,50 €** (pavimento) |
| 500,00 € | commissione **7,50 €** (1,5%)      | commissione **10,00 €** (2,0%)     |

**Le due cose che questa tabella dimostra e nessun test poteva dare:**

1. **L'asimmetria si vede a schermo**, e si vede solo a 500,00 €: sotto la soglia i due versi
   pagano identico, perché comanda il pavimento. Chi guardasse solo gli importi piccoli non
   saprebbe che i due tassi esistono.
2. **Il rifiuto è raggiungibile premendo**, e non solo nell'anteprima: premuto «Conferma» su
   1,00 €, sotto il pulsante compare «La commissione di 2,50 € si mangia tutti i 1,00 €» — con il
   motivo, non con un pulsante spento (ADR 0018, che su questo resta in vigore).
