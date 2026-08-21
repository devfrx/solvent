# D032 — La commissione scala, il pavimento no

- **Stato:** **Aperta** — scritta il 2026-08-21, non eseguita. Il ramo si chiami
  `d032-la-commissione-scala-il-pavimento-no` e parta da `main` (se i sei commit del 2026-08-21
  sono stati fusi) oppure da `d030-il-contenuto-scorre-nel-telaio` — vedi
  [PASSAGGIO-DI-CONSEGNE](PASSAGGIO-DI-CONSEGNE.md)
- **Dipende da:** [D014](D014-dominio-bancomat.md), che ha costruito la commissione fissa, e
  [D017](D017-il-caveau.md), che ha tarato i prezzi del caveau **contro** quella commissione
- **Sblocca:** [D033](D033-il-bancomat-e-una-pagina.md). La pagina nuova disegna «ATM fee (1,5%)»
  in ogni anteprima: costruirla su una commissione fissa vorrebbe dire disegnare due volte lo
  stesso riquadro
- **ADR vincolanti:** [0006](../adr/0006-decimal-end-to-end-per-il-denaro.md) (Decimal ovunque),
  [0021](../adr/0021-una-sola-primitiva-per-il-denaro.md) (una primitiva sola),
  [0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md) — **`Proposta`, e questa delega è
  il suo grilletto**, [0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
- **Produce:** ADR **0038** — _La commissione scala, il pavimento no_. Se
  [D031](D031-la-sovrapposizione-e-un-pezzo-del-kit.md) chiude prima e produce il suo, questo
  diventa 0039. Il numero si fissa aprendo il ramo, non scrivendo la delega
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

- [ ] La commissione è `max(pavimento, importo × tasso)`, arrotondata ai centesimi per eccesso, e
      la formula sta in **un** posto.
- [ ] I due tassi sono asimmetrici e ciascuna direzione porta il proprio: nessun `if` sulla
      direzione in tutto il repo.
- [ ] `ATM_FEE` non esiste più. `grep -rn "ATM_FEE\b" src/ tests/` non trova niente.
- [ ] L'ADR 0026 è `Accettata` e la precisione è dichiarata in `contracts/money.ts`.
- [ ] `tests/balance/targets` è verde **senza** che `VAULT_PRICES_CASH` o `VAULT_PRICES_CARD`
      siano stati toccati.
- [ ] 1,00 € è ancora rifiutato con `error.atm.fee_exceeds_amount`, e la spunta è presa **premendo
      il pulsante nella finestra vera**, non solo in un test.
- [ ] La soglia di attraversamento è provata nelle due direzioni: appena sotto la commissione è il
      pavimento, appena sopra è la percentuale.
- [ ] Una regola nuova, se ne nasce una, è rotta di proposito una volta.
- [ ] `npm run verify` verde e `docs/stato.md` rigenerato.

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
