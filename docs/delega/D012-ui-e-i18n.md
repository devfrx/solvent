# D012 — UI e i18n

- **Stato:** Aperta
- **Dipende da:** D011
- **Sblocca:** D013
- **ADR vincolanti:** 0001, 0007, 0011
- **Regole:** R05, R12
- **Budget:** **~1.150 righe** — rimisurato il 2026-08-19, vedi _Il budget, rimisurato_

## Obiettivo

Mostrare la fetta a schermo, e dimostrare che un componente può essere utile senza sapere nulla di
economia.

## Da produrre

`src/renderer/`

Riferimento visivo: [home-atm.html](../design/mockups/home-atm.html) e
[fetta-01-primo-stipendio.html](../design/mockups/fetta-01-primo-stipendio.html). Lo stile è
approvato ([P2](../prodotto/preferenze.md#p2--lo-stile-visivo-del-mockup-è-approvato)).

| File                              | Contenuto                                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `App.vue`                         | il guscio: caricamento, errore, gioco. Navigazione con **Home** e **Statistiche**                                   |
| `views/HomeView.vue`              | bancomat sopra (carta, conto, contanti, deposita, preleva), cruscotto sotto (**max 6 riquadri**), ultime operazioni |
| `views/StatsView.vue`             | dove vanno le statistiche che non stanno nei sei. Esiste dal primo giorno                                           |
| `components/StatTile.vue`         | il riquadro del cruscotto — è ciò che il test conta                                                                 |
| `components/BankCard3d.vue`       | la carta 3D ruotabile, fronte e retro                                                                               |
| `components/CashPanel.vue`        | contanti e capienza del caveau                                                                                      |
| `components/WithdrawDialog.vue`   | importo, anteprima della commissione, conferma                                                                      |
| `components/IncomePanel.vue`      | l'upgrade, il costo, il pulsante, l'esito                                                                           |
| `i18n/index.ts`, `it.ts`, `en.ts` | i due dizionari                                                                                                     |

## La carta 3D — vincoli

Vedi [P5](../prodotto/preferenze.md#p5--la-carta-è-un-oggetto-3d-ruotabile).

- CSS 3D puro: `perspective` sul contenitore, `transform-style: preserve-3d` sulla carta,
  `backface-visibility: hidden` sulle facce. **Nessuna libreria** — non passerebbe l'ADR 0015.
- Rotazione al trascinamento; al rilascio torna alla posizione di riposo o resta girata.
- Il retro porta informazione vera: plafond usato, limite, punteggio di credito. Girare la carta
  è un'azione utile, non un giocattolo.
- `prefers-reduced-motion`: la rotazione resta, l'animazione di ritorno no.
- Zero logica: nessun `Decimal` manipolato, nessun calcolo. Riceve valori già formattati.

## Il budget, rimisurato

Diceva **~150 righe** qui e **~230** nell'[indice](README.md): due numeri diversi per la stessa
delega, nati **lo stesso giorno** — il commit di STOP 1 — e mai più toccati. Nessuno dei due era una
misura: i mockup esistevano già in quel commit, e nessuno dei due li aveva guardati.

Rimisurato partendo da ciò che c'è: i due [mockup](../design/mockups/home-atm.html) sono la
specifica, e il codice che li riproduce non può essere molto più corto di loro.

| Voce             | Righe | Da dove viene la cifra                                                                                                                                                                                                               |
| ---------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CSS              | ~465  | `home-atm.html` ne ha 407 non vuote, in tre blocchi: 116 di base e impaginazione, 126 per la carta 3D, 165 per i pannelli. `fetta-01` aggiunge 14 selettori suoi, ~60 righe. **Il CSS non si comprime componentizzando: si sposta.** |
| Markup           | ~330  | 340 righe di `<body>` nei due mockup, meno ~90 di ripetizione che diventa `v-for` (sei riquadri → uno, tre operazioni → una) e di intestazione contata due volte, più ~80 per ciò che i mockup **non** mostrano                      |
| `<script setup>` | ~190  | otto componenti più `i18n/index.ts`. Il grosso sta in `BankCard3d` (trascinamento e `prefers-reduced-motion`) e `WithdrawDialog` (importo, anteprima, conferma)                                                                      |
| i due dizionari  | ~165  | **16 chiavi sono già obbligatorie oggi** — 4 `Reason` e 12 codici d'errore, contati nel sorgente — più ~50 di etichette. Sessantasei chiavi per due lingue, con l'annidamento                                                        |

Le ~80 righe di markup che i mockup non mostrano hanno un nome, e sono la parte che una stima a
occhio dimentica sempre: i tre stati del guscio (caricamento, errore con due scelte, gioco),
`StatsView.vue` che non è disegnata da nessuna parte, il **deposito** accanto al prelievo, e i
motivi mostrati al posto dei pulsanti spenti — che è un invariante di questa delega, non un extra.

**Cosa se ne fa chi la esegue.** Quattrocentosessantacinque righe di CSS sono esattamente la
grandezza del difetto **A14** — 1.067 righe di CSS morto — e questa delega è dove quel difetto è
nato l'altra volta. Il numero non è un permesso: è la soglia oltre la quale conviene fermarsi e
chiedersi cosa non serve. Il _Fuori scope_ qui sopra è la prima difesa; la seconda è che il CSS
resti attaccato al componente che lo usa, così che togliere il componente tolga anche il suo stile.

Con questa cifra D012 diventa **la delega più grande del progetto**, più del kernel intero (535
righe). Se vada spezzata in due — il guscio e l'i18n da una parte, la carta 3D e i pannelli
dall'altra — è una domanda che si risponde quando la si prende in mano, non adesso: è una decisione
sulla forma della roadmap, e va presa da chi la esegue insieme a chi decide.

## Invarianti

- I componenti **leggono selettori e inviano comandi**. Nessun calcolo economico, nessun `Decimal`
  manipolato, nessun RNG, nessuna orchestrazione.
- Nessuna stringa destinata all'utente nel codice. Tutto per chiave (R12).
- Il fallimento dell'acquisto si mostra traducendo il `code` del `Result`, non con una frase
  scritta nel componente. È il motivo per cui i codici di errore sono chiavi i18n.
- **La commissione si vede prima della conferma** (ADR 0018), e la calcola la stessa funzione pura
  che il comando userà per eseguire — importata da `domains/atm/rules`, non riscritta. È l'unico
  import da un dominio che un `.vue` non può avere (R05): quindi la chiama lo **store**, e il
  componente riceve il numero già pronto.
- Un pulsante non si spegne senza spiegazione. Se un'azione non è possibile, si mostra il motivo.
- La formattazione del denaro passa da `toDisplayNumber` — l'unico posto autorizzato a convertire,
  e siamo al confine di presentazione, dove è legittimo (ADR 0006).
- `it` ed `en` hanno esattamente le stesse chiavi, verificato da un test in entrambe le direzioni.
- Lo stato di errore del caricamento è una schermata reale con due scelte, non un `console.error`.

## Fuori scope

- Tema chiaro/scuro. Il difetto A14 era 1.067 righe di CSS morto nate esattamente qui.
- Animazioni, suoni, transizioni.
- Un design system, o qualunque componente riutilizzabile costruito prima del secondo uso.
- Una schermata impostazioni: non c'è ancora niente da impostare.
- Test end-to-end: la decisione è in [qualita.md](../qualita.md).

## Definizione di fatto

- [ ] `tests/i18n/parity.test.ts`: le chiavi di `it` ed `en` coincidono, in entrambe le direzioni
- [ ] test: ogni valore di `Reason` e ogni `code` di errore ha una chiave in **entrambe** le lingue
      — è la parte che la parità da sola non copre
- [ ] `tests/rules/home-tiles.test.ts`: `HomeView.vue` non contiene più di **sei** `StatTile`.
      Verificato aggiungendone un settimo e vedendo il test diventare rosso
- [ ] `tests/rules/no-logic-in-vue.test.ts`: nessun `.vue` importa `domains/*/rules` o `kernel/*`,
      e nessuno contiene `Math.random`
- [ ] `tests/rules/no-literal-in-template.test.ts`: nessun nodo di testo letterale nei template
      (euristica dichiarata ⚠️ in [tracciabilita.md](../tracciabilita.md))
- [ ] verifica manuale: il pulsante con fondi insufficienti mostra un messaggio tradotto e
      comprensibile, non un codice
- [ ] verifica manuale: cambiando lingua da codice, tutta la UI cambia

## Trappole note

- **A09.** Il rebirth orchestrato dentro `PrestigeView.vue` non è nato come orchestrazione: è nato
  come "due righe per collegare le cose". Il confine è: _se il componente decide quanto denaro si
  muove, sta facendo dominio._
- **A13.** Le chiavi mancanti nascono quando se ne aggiunge una in una lingua sola "e poi traduco".
  Il test di parità toglie il "poi".
- Il `t()` con una chiave costruita dinamicamente sfugge a ogni controllo. Se serve, la lista dei
  valori possibili deve essere un tipo unito, così il compilatore la conosce.
