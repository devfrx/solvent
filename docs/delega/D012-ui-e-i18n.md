# D012 — UI e i18n

- **Stato:** Aperta
- **Dipende da:** D011
- **Sblocca:** D013
- **ADR vincolanti:** 0001, 0007, 0011
- **Regole:** R05, R12
- **Budget:** ~150 righe

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
