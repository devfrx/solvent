# D012 — Il guscio, le parole e il reddito

- **Stato:** Aperta — **spezzata il 2026-08-19**, vedi _Perché è stata spezzata_
- **Dipende da:** D011
- **Sblocca:** D015
- **ADR vincolanti:** 0001, 0007, 0011
- **Regole:** R05, R12
- **Budget:** ~430 righe di sorgente + ~150 di test di regola

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
  `.vue` non può importare `domains/*/rules` (R05), quindi li chiama lo store e il componente
  riceve il numero già pronto.
- **`modifiers` esce da `createGame`**: serve a `incomePerSecond`, ed è una riga.

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

- [ ] `tests/i18n/parity.test.ts`: le chiavi di `it` ed `en` coincidono, in entrambe le direzioni
- [ ] test: ogni valore di `Reason` e ogni `code` di errore **letto dal sorgente**, non da una lista
      scritta a mano, ha una chiave in entrambe le lingue — è la parte che la parità da sola non
      copre, ed è anche ciò che la tiene viva quando nasce un codice nuovo
- [ ] `tests/rules/no-logic-in-vue.test.ts`: nessun `.vue` importa `domains/*/rules` o `kernel/*`, e
      nessuno contiene `Math.random`
- [ ] `tests/rules/no-literal-in-template.test.ts`: nessun nodo di testo letterale nei template
      (euristica dichiarata ⚠️ in [tracciabilita.md](../tracciabilita.md))
- [ ] test: `canBuyUpgrade` letto dal selettore e l'esito del comando danno la stessa risposta —
      la coppia che, quando diverge, spegne un pulsante che avrebbe funzionato
- [ ] verifica manuale: il pulsante con fondi insufficienti mostra un messaggio tradotto e
      comprensibile, con le due cifre, non un codice
- [ ] verifica manuale: cambiando lingua da codice, tutta la UI cambia

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
