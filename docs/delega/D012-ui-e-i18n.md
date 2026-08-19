# D012 — Il guscio, le parole e il reddito

- **Stato:** **Chiusa** — 2026-08-20, ramo `d012-guscio-parole-reddito`
- **Dipende da:** D011
- **Sblocca:** D015
- **ADR vincolanti:** 0001, 0007, 0011
- **Regole:** R05, R12
- **Budget:** ~430 righe di sorgente + ~150 di test di regola → **consuntivo: ~1.060 di sorgente e ~740 di test** (correzione 16)

## Obiettivo

Vestire il ciclo di vita e far comprare l'upgrade, in due lingue. È la delega che dimostra che un
componente può essere utile senza sapere nulla di economia — e che un fallimento si spiega invece
di spegnere un pulsante.

Riferimento visivo: **[fetta-01-primo-stipendio.html](../design/mockups/fetta-01-primo-stipendio.html)**.
Quel mockup è la specifica di questa delega, e non per caso: la sua intestazione dice di sé che
_mostra gli stati, che sono la parte che conta_. Lo stile è approvato
([P2](../prodotto/preferenze.md#p2--lo-stile-visivo-del-mockup-è-approvato)).

## Perché è stata spezzata

D012 valeva **~1.150 righe** — più del kernel intero (535) — e il numero è una misura fatta sui
mockup, non una stima. Una delega di quella dimensione viola la regola che il progetto si è dato
per prima: _una fetta verticale alla volta, finita e verde_. Non perché sia difficile, ma perché a
metà strada non è verificabile: la definizione di fatto arriva tutta insieme alla fine, e fino a
quel momento nessuno sa se regge.

Il taglio passa dove passano i **due mockup**, che non sono due schermate ma due momenti:

| Delega                            | Cosa copre                                                             | Mockup                                                                           |
| --------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **D012** — questa                 | gli **stati** del ciclo di vita, le parole, il saldo e l'upgrade       | [fetta-01-primo-stipendio.html](../design/mockups/fetta-01-primo-stipendio.html) |
| **[D015](D015-home-bancomat.md)** | la **home completa**: carta 3D, bancomat, cruscotto, ultime operazioni | [home-atm.html](../design/mockups/home-atm.html)                                 |

Dopo D012 il gioco è già una cosa che si può guardare: parte, dice cosa sta facendo, mostra il
saldo che sale e lascia comprare l'upgrade — in italiano e in inglese. È il "primo stipendio" del
titolo del mockup. Dopo D015 la fetta 01 è completa.

**Il meccanismo dell'i18n nasce tutto qui**, non a metà: il test di parità, le chiavi di ogni
`Reason` e di ogni codice d'errore — anche quelli che solo D015 mostrerà. Una lingua che si
completa in due tempi è il difetto A13, e il test di parità esiste per togliere il "poi traduco".

## Da produrre

`src/renderer/`

Il guscio **esiste già** da [D011](D011-runtime-e-store.md): `App.vue`, `main.ts` e `index.html`
rendono i sette stati e i saldi, senza una parola di prosa. Questa delega li veste; non li ricrea.

| File                              | Contenuto                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `App.vue`                         | il guscio vestito: caricamento con il tempo recuperato, errore con **due scelte**, gioco. Navigazione Home e Statistiche |
| `views/HomeView.vue`              | saldo, reddito al secondo, e il pannello dell'upgrade. La zona del bancomat e il cruscotto sono di D015                  |
| `views/StatsView.vue`             | dove vanno le statistiche che non stanno nella home. Esiste dal primo giorno                                             |
| `components/IncomePanel.vue`      | l'upgrade: nome, descrizione, livello, costo, pulsante, esito                                                            |
| `i18n/index.ts`, `it.ts`, `en.ts` | i due dizionari, **completi** — le chiavi di D015 comprese                                                               |

Più due cose nel runtime, piccole e necessarie:

- **i selettori del reddito nello store**: `incomePerSecond`, `upgradeCost`, `canBuyUpgrade`. Un
  `.vue` non può importare le regole di un dominio (R05), quindi li chiama lo store e il componente
  riceve il numero già pronto.
- **`modifiers` esce da `createGame`**: serve a `incomePerSecond`, ed è una riga.

Sono servite anche **quattro cose che questa tabella non elencava**, e ciascuna ha la sua
correzione in fondo: `awayFor` e `failedDuring` nello store (1 e 2), i comandi `retry` e
`closeWithoutSaving` (3), il lettore `Income.state()` nel dominio (4).

## Le chiavi che il mockup dichiara

Sono scritte in giallo sotto ogni schermata del mockup, ed è il modo in cui quel documento
funziona: ogni testo visibile ha già il suo nome.

    app.loading.catchup      app.loading.away_for
    app.error.retry          app.error.new_game
    balance.panel.title      balance.panel.rate
    common.buy               common.level
    income.upgrade.overtime.name    income.upgrade.overtime.desc

Più, per obbligo di INV-07, **ogni** `Reason` e **ogni** codice d'errore che esiste nel sorgente —
sono quattro e tredici, e si contano con un `grep`, non a memoria. Fra questi ce ne sono che solo
D015 mostrerà (`error.ledger.capacity_exceeded`) e uno nato con D011
(`error.game.load_failed`): entrano lo stesso, perché il test di parità li pretende.

## Invarianti

- I componenti **leggono selettori e inviano comandi**. Nessun calcolo economico, nessun `Decimal`
  manipolato, nessun RNG, nessuna orchestrazione.
- Nessuna stringa destinata all'utente nel codice. Tutto per chiave (R12).
- Il fallimento dell'acquisto si mostra traducendo il `code` del `Result`, non con una frase scritta
  nel componente — e il messaggio porta `required` e `available`, che l'errore già contiene. È il
  motivo per cui i codici di errore sono chiavi i18n.
- Un pulsante non si spegne senza spiegazione. Se un'azione non è possibile, si mostra il motivo.
- La formattazione del denaro passa da `toDisplayNumber` — l'unico posto autorizzato a convertire,
  e siamo al confine di presentazione, dove è legittimo (ADR 0006).
- `it` ed `en` hanno esattamente le stesse chiavi, verificato in **entrambe** le direzioni.
- Lo stato di errore del caricamento è una schermata reale con due scelte, non un `console.error`.
- Lo stato `errore` ha **due cause** e una schermata sola: un caricamento fallito, dove la via
  d'uscita è `newGame()`, e un **salvataggio finale** fallito, dove la partita è ancora in memoria e
  la finestra è rimasta aperta apposta (D011, correzione 13). La seconda oggi non ha un pulsante, e
  questa è la delega che glielo dà.

## Fuori scope

- **Tutto ciò che è nel mockup del bancomat**: carta 3D, conto, contanti, deposita e preleva,
  cruscotto, ultime operazioni. È [D015](D015-home-bancomat.md).
- Tema chiaro/scuro. Il difetto A14 era 1.067 righe di CSS morto nate esattamente qui.
- Animazioni, suoni, transizioni.
- Un design system, o qualunque componente riutilizzabile costruito prima del secondo uso.
- Una schermata impostazioni: non c'è ancora niente da impostare.
- Test end-to-end: la decisione è in [qualita.md](../qualita.md).

## Definizione di fatto

- [x] `tests/i18n/parity.test.ts`: le chiavi di `it` ed `en` coincidono, in entrambe le direzioni —
      più i **segnaposto**, che la parità di sole chiavi non vedeva (correzione 12)
- [x] test: ogni valore di `Reason` e ogni `code` di errore **letto dal sorgente**, non da una lista
      scritta a mano, ha una chiave in entrambe le lingue. Il confronto è **secco e nelle due
      direzioni**: dice anche il contrario, cioè una frase rimasta dietro a un codice che non
      esiste più
- [x] `tests/rules/no-logic-in-vue.test.ts`: nessun `.vue` importa le regole di un dominio né
      `kernel/*`, e nessuno contiene `Math.random`
- [x] `tests/rules/no-literal-in-template.test.ts`: nessun nodo di testo letterale nei template
      (euristica dichiarata ⚠️ in [tracciabilita.md](../tracciabilita.md))
- [x] test: `canBuyUpgrade` letto dal selettore e l'esito del comando danno la stessa risposta —
      cinque casi, compreso quello che conta: i soldi ci sono, ma sono in contanti
- [x] verifica manuale: il pulsante con fondi insufficienti mostra un messaggio tradotto e
      comprensibile, con le due cifre, non un codice → _«Ti servono 800,00 € su Carta, ne hai
      0,00 €.»_, letto dall'applicazione in esecuzione. È anche diventato un test (correzione 15)
- [x] verifica manuale: cambiando lingua da codice, tutta la UI cambia — verificata a runtime e
      resa permanente da `tests/i18n/translator.test.ts`

## Diciassette correzioni rispetto a com'era scritta questa delega

**1. Il tempo recuperato non usciva dallo store.** La tabella _Da produrre_ chiede che `App.vue`
mostri «il caricamento con il tempo recuperato», e la chiave `app.loading.away_for` esiste per
quello — ma `recover()` calcolava quel tempo e lo buttava via dentro `stepOf`. Nasce `awayFor`. Nel
farlo si è visto che il **secondo** percorso non lo calcolava nessuno: al ritorno da `Sospeso` il
tempo passato lo copre il delta del loop, che però non lo racconta a nessuno. Ora la finestra che
sparisce annota l'ora del mondo, e quella che riappare la sottrae.

**2. `failed` ha due cause e il codice dell'errore non basta a distinguerle.** La delega lo dice —
caricamento fallito e salvataggio finale fallito, una schermata sola — ma non dice come la
schermata faccia a sapere quale delle due sta mostrando. Non può dedurlo dal codice:
`error.save.io` esce da entrambe. Nasce `failedDuring: 'loading' | 'saving'`, ed è ciò che decide
quale seconda scelta offrire.

**3. Il pulsante che D011 aveva lasciato senza comando.** «La seconda oggi non ha un pulsante, ed è
la delega che glielo dà»: dare il pulsante voleva dire dare anche l'azione, perché `close()` salva
ed è proprio il salvataggio che ha fallito. Nasce `closeWithoutSaving()`. E «Riprova» davanti a due
cause diverse fa due cose diverse — ricaricare o riscrivere — quindi nasce anche `retry()`: la
scelta sta nello store, perché un componente che la facesse dovrebbe sapere cosa significa ciascuno
stato del ciclo di vita.

**4. `canBuyUpgrade` chiedeva uno stato che nessuno poteva leggere.** La firma è
`canBuyUpgrade(state, available)`, ma `createIncome` teneva `IncomeState` nella propria closure e
l'unica via d'uscita era `system.save()`. Usarlo come lettore sarebbe stato comodo e sbagliato:
`save()` è il contratto con il **disco**, e `types.ts` tiene i due nomi distinti proprio perché
rispondono a domande diverse. Nasce `Income.state()`, dieci righe nel dominio.

**5. I selettori del reddito non possono essere delle `computed`.** `incomePerSecond(modifiers)`
legge il registro dei modificatori, che vive in `core/` e **non è reattivo** (ADR 0001): una
`computed` costruita su di lui non si ricalcolerebbe mai, e il pannello resterebbe a 12,00 €/s per
sempre dopo un acquisto riuscito. Sono dei mirror, come i saldi, riletti da `readIncome()` — che è
la stessa forma con cui `mirror()` rilegge i saldi dopo un caricamento, per la stessa ragione:
nessun evento annuncia il cambiamento.

**6. Un `Money` esposto nudo da uno store Pinia smette di essere un `Decimal`.** È il difetto della
correzione 5 di [D011](D011-runtime-e-store.md) da un'altra porta: Pinia avvolge lo store in un
`reactive`, e una proprietà che non è un `ref` viene proxata **alla lettura**. `upgradeCost` è
quindi uno `shallowRef` che non cambia mai — e il commento dice perché, altrimenti qualcuno lo
«semplificherebbe».

**7. Il saldo del mockup è una cifra sola, e con una cifra sola la schermata si contraddice.** Il
reddito entra in **contanti**, l'upgrade si paga con la **carta**, ed è voluto da
[D010](D010-dominio-income.md). Con un numero solo, il messaggio _«ti servono 800,00 €, ne hai
0,00 €»_ starebbe sotto un saldo che sale: incomprensibile. Il pannello mostra i due pool del
giocatore — derivati da `POOLS`, non elencati a mano — e il messaggio d'errore **nomina il pool**,
il che gli aggiunge un segnaposto che il mockup non aveva.

**8. Con la sola D012 l'upgrade non si compra dallo schermo.** Il ponte fra contanti e carta è il
bancomat, cioè [D015](D015-home-bancomat.md). Non è un difetto di questa delega — è la scelta di
D010, che obbliga a passare dal bancomat per progredire — ma nessun documento lo diceva dove D012
potesse leggerlo, e l'obiettivo di questa delega è «far comprare l'upgrade». Comprarlo si prova dai
test e dai comandi; a schermo, l'unico esito raggiungibile oggi è il rifiuto — che per fortuna è
proprio quello che la definizione di fatto chiede di guardare.

**9. Il `messageResolver` piatto era inutile, e il commento che lo giustificava era falso.**
Scoperto rompendolo di proposito: il test è rimasto **verde**. vue-i18n 11 risolve una chiave
piatta esattamente come una annidata, quindi la riga non serviva e la spiegazione accanto — «senza
di essa `t('atm.withdraw')` cercherebbe un oggetto» — era una cosa che non succede. Tolta. Insieme
a lei è uscito `fallbackLocale`, per la ragione opposta: è una rete sotto un pavimento che il tipo
`Dictionary` rende senza buchi, e nessun test potrebbe mai vederla scattare. Le chiavi restano
piatte, ma per il motivo vero: `atm.withdraw` e `atm.withdraw.title` sono due chiavi, e in una
gerarchia la seconda prenderebbe il posto della prima.

**10. `useGrouping: 'always'`, altrimenti la stessa colonna ha due regole.** In italiano CLDR
dichiara `minimumGroupingDigits = 2`: `1284,60 €` esce **senza** separatore e `18.402,15 €` con.
Entrambi i mockup raggruppano sempre, e un gioco finanziario si legge per numeri
([P2](../prodotto/preferenze.md#p2--lo-stile-visivo-del-mockup-è-approvato)).

**11. Una delle frasi del mockup è una riga di progetto, non di gioco.** _«Nessun tick parte prima
che il caricamento sia finito»_ è una regola di
[ciclo-di-vita.md](../design/ciclo-di-vita.md) annotata sulla schermata, non un testo rivolto al
giocatore — che la parola «tick» non conosce. `app.loading.away_for` porta solo _«Sei stato via
{duration}.»_

**12. La parità di sole chiavi non vede il difetto peggiore.** Una traduzione che perde il proprio
`{required}` resta una frase perfettamente plausibile, in una lingua sola, e senza il numero: le
chiavi coincidono, il test è verde, e il giocatore legge «ti servono , ne hai ». Il confronto dei
**segnaposto** fra le due lingue è tre righe e chiude il caso.

**13. Due letture del mockup non sopravvivono al contatto con R12 e con `IncomeState`.** Il
pulsante è _«Compra — 800,00 €»_: il trattino fra la parola e la cifra sarebbe testo letterale nel
template, quindi `common.buy` è **parametrica**. E il mockup mostra _«liv. 1»_ accanto a un
pulsante ancora comprabile, mentre `IncomeState` è un booleano: il livello mostrato è quello
posseduto — 0 prima, 1 dopo.

**14. Il giallo dei mockup non copre ogni testo visibile.** Le chiavi dichiarate sono quelle delle
schermate disegnate; mancano la navigazione — che la delega chiede e il mockup non ha —, il
caricamento che non è un recupero, la chiusura, il pulsante «chiudi lo stesso» e i nomi dei due
pool. Sono nate qui, in entrambe le lingue. Restano fuori i **sei riquadri del cruscotto** di
[D015](D015-home-bancomat.md): sceglierli adesso significherebbe decidere al posto di quella delega
quali sei sono, e INV-12 dice che il settimo sostituisce.

**15. jsdom non è entrato con D012**, contro ciò che [tracciabilita.md](../tracciabilita.md)
dichiarava. La definizione di fatto non chiede di montare un componente, e montarlo costerebbe due
dipendenze nuove — `jsdom` e `@vue/test-utils` — cioè un ADR (ADR 0015). Le due verifiche «a
occhio» sono diventate test veri per un'altra strada: `createTranslator(wording)` riceve le quattro
funzioni di vue-i18n **per costruzione**, esattamente come il renderer riceve il browser da
`runtime/host.ts`. Stesso confine, applicato alle parole. Il grilletto vero di jsdom è ora scritto
nel [registro YAGNI](../roadmap-fette.md).

**16. Il budget contava il mockup, non il dizionario.** Le ~430 righe erano la misura della
schermata; questa delega però si prende **tutto l'i18n**, chiavi di D015 comprese, e quelle non
stanno in nessun mockup di D012. Consuntivo: ~1.060 righe di sorgente, di cui 475 nella sola
cartella `i18n/` — 175 di dizionario e il resto in `index.ts`, che è per metà commento — e ~740 di
test contro le ~150 previste, perché le reti nuove sono cinque e non due.

**17. R05 vieta anche i tipi.** Un `.vue` non può scrivere
`import type { IncomeError } from '@core/domains/income/commands'`: il lint usa la regola base, che
non distingue un import di tipo. È il motivo per cui l'unione `GameError` vive in `i18n/index.ts` e
non nello store — il componente ne ha bisogno per tenere in mano l'errore di un `Result` — e con lei
nascono due frecce che [architettura.md](../architettura.md) non disegnava: `i18n --> contracts` e
`i18n --> domains`, entrambe di soli tipi. Non è un confine spostato: è un confine che non era
ancora stato disegnato, perché `i18n/` non esisteva.

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 436 test su 49 file (erano 382
su 45). `npm run verify:release` **verde**: il renderer compila in 71 moduli, 536 kB di JavaScript e
4,75 kB di CSS.

### Cosa è stato verificato a mano, e con cosa

L'applicazione è stata avviata davvero (`npm run dev`) e la pagina del renderer è stata letta in un
browser: guscio, navigazione, saldo, pannello dell'upgrade e messaggio di rifiuto sono quelli
scritti qui sotto, presi dal DOM vivo e non dal codice.

    Home · Statistiche
    SALDO   Contanti 0,00 €   Carta 0,00 €   + 12,00 € / s
    Straordinari  liv. 0
    Aumenta il reddito di tutte le fonti.
    [ Compra — 800,00 € ]
    Ti servono 800,00 € su Carta, ne hai 0,00 €.

Il cambio di lingua è stato fatto sull'istanza viva e ha cambiato tutto, schermata Statistiche
compresa. Quello che **non** è stato guardato a occhio è il saldo che sale: il loop gira su
`requestAnimationFrame`, e in una finestra che non compone frame quel frame non arriva mai. Lo
coprono i test del loop di [D011](D011-runtime-e-store.md) e quelli dell'acquisto riuscito qui.

### Le reti sono state rotte una alla volta

Quindici rotture indotte, una per volta, con il ripristino subito dopo.

| Rottura indotta                                             | Cosa è diventato rosso         |
| ----------------------------------------------------------- | ------------------------------ |
| una chiave sparisce da `en`                                 | `i18n/parity`                  |
| nasce un codice d'errore e nessuno lo traduce               | `i18n/parity`                  |
| una traduzione perde il proprio segnaposto                  | `i18n/parity`                  |
| una frase scritta a mano dentro un template                 | `rules/no-literal-in-template` |
| un componente importa le regole di un dominio               | `rules/no-logic-in-vue`        |
| un componente estrae un numero a caso                       | `rules/no-logic-in-vue`        |
| l'anteprima guarda i contanti invece della carta            | `renderer/store` — 3 casi      |
| lo store non rilegge il reddito dopo l'acquisto             | `renderer/store`               |
| le due cause di errore tornano indistinguibili              | `renderer/store`               |
| «chiudi lo stesso» salva comunque                           | `renderer/store`               |
| il dizionario non arriva al plugin                          | `i18n/translator`              |
| il messaggio non dice più su quale pool mancano i soldi     | `i18n/translator`              |
| il raggruppamento delle migliaia torna a quello di CLDR     | `i18n/translator`              |
| la frase della durata perde i minuti, in entrambe le lingue | `i18n/translator`              |
| il plurale italiano diventa una forma sola                  | `i18n/translator`              |

Due rotture sono rimaste **verdi**, e sono la parte utile dell'esercizio: togliere il
`messageResolver` e togliere `fallbackLocale` non hanno rotto niente. Nessuna delle due serviva, ed
entrambe sono uscite dal codice (correzione 9).

## Cosa deve sapere chi prende D015

- **Il dizionario è completo**, chiavi `atm.*` e `card.*` comprese: si usano, non si aggiungono. Le
  uniche che mancano davvero sono le etichette dei **sei riquadri del cruscotto**, lasciate a chi
  decide quali sono i sei (INV-12). Ogni chiave nuova entra in **entrambe** le lingue o la parità è
  rossa, e se porta un `{segnaposto}` deve portarlo in tutte e due.
- **Le parole si chiedono a `useTranslator()`**, che dà `text`, `count`, `money`, `instant`,
  `duration`, `poolName` e `failure`. `money` è l'unico posto autorizzato a convertire un `Money`
  in numero (ADR 0006): un componente che chiama `toDisplayNumber` da sé sta aprendo il secondo.
- **`failure(error)` è uno `switch` esaustivo** su `GameError`. Un codice nuovo non compila finché
  non ha la sua frase: è INV-07 diventato un errore del compilatore. Aggiungere il codice significa
  aggiungere il `case`, la chiave e i due testi.
- **I selettori del bancomat non ci sono ancora** — `atmFee`, `previewOf`, la capienza — e vanno
  aggiunti come quelli del reddito: mirror nello store, mai `computed` su qualcosa che vive in
  `core/` (correzione 5), e mai un `Money` esposto nudo (correzione 6).
- **Lo stile ha i suoi token**, in un blocco `<style>` non scoped dentro `App.vue`: `--panel`,
  `--line`, `--accent`, `--danger`, più le classi `panel`, `caption`, `amount`, `primary`, `ghost`.
  Il resto del CSS sta attaccato al componente che lo usa, ed è la difesa contro le 1.067 righe
  morte del difetto A14.
- **La navigazione è un `ref`, non un router**, e le due destinazioni sono `home` e `stats`. Il
  grilletto per un router è nel [registro YAGNI](../roadmap-fette.md).
- **`store.history` porta la `Transaction` intera** ma la schermata Statistiche ne mostra solo la
  ragione: gli **importi** vogliono un selettore che li componga, e nasce con il pannello che li
  mostra — cioè con te.

## Trappole note

- **A09.** Il rebirth orchestrato dentro `PrestigeView.vue` non è nato come orchestrazione: è nato
  come "due righe per collegare le cose". Il confine è: _se il componente decide quanto denaro si
  muove, sta facendo dominio._
- **A13.** Le chiavi mancanti nascono quando se ne aggiunge una in una lingua sola "e poi traduco".
  Il test di parità toglie il "poi".
- Il `t()` con una chiave costruita dinamicamente sfugge a ogni controllo. Se serve, la lista dei
  valori possibili deve essere un tipo unito, così il compilatore la conosce.
- **Il test dei codici d'errore va scritto leggendo il sorgente**, non ricopiando i tredici codici:
  una lista a mano è già scaduta il giorno in cui nasce il quattordicesimo, e ne sono nati tre in
  tre deleghe.
- **`verify:release` è verde da D011 e deve restarlo.** Da qui in avanti un renderer che non
  compila è una regressione, non un'attesa.
