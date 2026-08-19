# D015 — La home: bancomat, carta e cruscotto

- **Stato:** Aperta — **nata il 2026-08-19** dallo spezzamento di [D012](D012-ui-e-i18n.md)
- **Dipende da:** D012, D014
- **Sblocca:** D013
- **ADR vincolanti:** 0001, 0007, 0011, 0017, 0018
- **Regole:** R05, R12, INV-11, INV-12
- **Budget:** ~720 righe di sorgente

## Obiettivo

La schermata che rende la dualità contanti/carta una cosa che si tocca: la carta si gira, il
bancomat mostra la commissione **prima** della conferma, e il cruscotto dice come sta andando.

Riferimento visivo: **[home-atm.html](../design/mockups/home-atm.html)**. È la specifica, e il
budget di questa delega è misurato su di lui: 407 righe di CSS non vuote in tre blocchi, 216 di
markup. Lo stile è approvato
([P2](../prodotto/preferenze.md#p2--lo-stile-visivo-del-mockup-è-approvato)).

## Perché esiste

[D012](D012-ui-e-i18n.md) valeva ~1.150 righe, più del kernel intero, ed è stata spezzata il
2026-08-19. Il taglio passa fra i due mockup: D012 veste **gli stati** e il reddito, questa delega
fa **la home**. Il perché sta scritto per esteso in D012, sotto _Perché è stata spezzata_.

Quando questa delega chiude, la fetta 01 è completa e si passa a
[D013](D013-verifica-della-fetta.md), che è lo **STOP 2**.

## Cosa trovi già fatto

Non è cortesia: sono le cose che, se le riscrivi, diventano un secondo calcolo da tenere allineato.

- **`previewOf(operation, amount)`** ([D014](D014-dominio-bancomat.md)) ritorna i tre movimenti del
  riquadro _cosa succede_ — dal conto −500,00, ai contanti +497,50, commissione +2,50 — e sono **gli
  stessi** che il comando applica. La UI li mostra; non ricalcola la commissione. È INV-11 nella sua
  forma più forte, e la delega che l'ha scritta lo dice: due formule sono impossibili, non
  sconsigliate.
- **`atmFee()`** è la commissione. Non il 2,50 copiato dal mockup.
- **`capacityOf(pool)` e `fitsIn(capacity, current, incoming)`** rispondono sulla capienza del
  caveau. Oggi rispondono "illimitata" ed è corretto: il valore arriva nella fetta 02, senza toccare
  questi file.
- **`store.history`** sono le ultime operazioni: un `boundedList` di 20 alimentato da
  `money.posted`, che porta la `Transaction` intera — ragione compresa. Contiene anche lo stipendio,
  come nel mockup.
- **Il dizionario è completo** da D012, chiavi `atm.*` e `card.*` comprese: qui si usano, non si
  aggiungono. Se ne serve una nuova, entra in **entrambe** le lingue o il test di parità è rosso.

## Da produrre

`src/renderer/`

| File                        | Contenuto                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| `components/BankCard3d.vue` | la carta 3D ruotabile, fronte e retro                                                         |
| `components/CashPanel.vue`  | contanti e capienza del caveau                                                                |
| `components/AtmPanel.vue`   | importo, gli importi rapidi, l'**anteprima** dei tre movimenti, deposita e preleva            |
| `components/StatTile.vue`   | il riquadro del cruscotto — è ciò che il test conta                                           |
| `views/HomeView.vue`        | cresce: la zona bancomat sopra, il cruscotto sotto (**max 6 riquadri**), le ultime operazioni |

Più i selettori nello store che servono a mostrarli — `atmFee`, l'anteprima, la capienza — con la
stessa regola di D012: un `.vue` non importa `domains/*/rules` (R05), quindi li chiama lo store.

## La carta 3D — vincoli

Vedi [P5](../prodotto/preferenze.md#p5--la-carta-è-un-oggetto-3d-ruotabile).

- CSS 3D puro: `perspective` sul contenitore, `transform-style: preserve-3d` sulla carta,
  `backface-visibility: hidden` sulle facce. **Nessuna libreria** — non passerebbe l'ADR 0015.
- Rotazione al trascinamento; al rilascio torna alla posizione di riposo o resta girata.
- Il retro porta informazione vera: plafond usato, limite, punteggio di credito. Girare la carta è
  un'azione utile, non un giocattolo.
- `prefers-reduced-motion`: la rotazione resta, l'animazione di ritorno no.
- Zero logica: nessun `Decimal` manipolato, nessun calcolo. Riceve valori già formattati.

## Invarianti

- **La commissione si vede prima della conferma** (ADR 0018), e non la calcola questo codice: la
  costruisce `previewOf`, che è la stessa funzione che il comando usa per eseguire. Il componente
  riceve un elenco di movimenti e lo mostra riga per riga.
- Se l'anteprima è un **errore**, si mostra il codice tradotto invece di spegnere il pulsante —
  importo non positivo, commissione superiore all'importo, e dalla fetta 02 anche la capienza.
- I componenti leggono selettori e inviano comandi. Nessun calcolo economico, nessun `Decimal`
  manipolato, nessuna orchestrazione (R05).
- Nessuna stringa destinata all'utente nel codice (R12).
- **Il cruscotto non supera i sei riquadri** (INV-12). Il settimo non è una svista da rivedere in
  review: è un test rosso.
- I conti non-giocatore non compaiono mai nella UI (ADR 0017). Le "commissioni pagate" del cruscotto
  sono un saldo letto, non un contatore tenuto da qualcuno.
- La formattazione del denaro passa da `toDisplayNumber`, al confine di presentazione (ADR 0006).

## Fuori scope

- Tema chiaro/scuro, animazioni oltre la rotazione della carta, suoni.
- Un design system, o qualunque componente riutilizzabile costruito prima del secondo uso.
- La capienza **vera** del caveau: fetta 02. Qui si interroga e si mostra, non si definisce.
- Soglie giornaliere del bancomat: arrivano con la progressione, e sono anche ciò che darà al
  bancomat il suo primo stato.
- Test end-to-end: la decisione è in [qualita.md](../qualita.md).

## Definizione di fatto

- [ ] `tests/rules/home-tiles.test.ts`: `HomeView.vue` non contiene più di **sei** `StatTile`.
      Verificato aggiungendone un settimo e vedendo il test diventare rosso
- [ ] test: le righe mostrate nell'anteprima sono **lo stesso valore** che il comando applica — non
      due elenchi che devono coincidere, ma uno solo (INV-11)
- [ ] test: un prelievo con la commissione maggiore dell'importo mostra il **codice tradotto**, non
      un pulsante spento
- [ ] test: il cruscotto legge le commissioni pagate da un saldo, non da un contatore
- [ ] verifica manuale: la carta si gira al trascinamento, e il retro mostra dati veri
- [ ] verifica manuale: con `prefers-reduced-motion` attivo la rotazione resta e l'animazione di
      ritorno no
- [ ] verifica manuale: prelevare 500 sposta 497,50 sui contanti e 2,50 alle commissioni, e le
      ultime operazioni lo mostrano
- [ ] `npm run verify:release` verde: da D011 il renderer compila, e deve continuare a farlo

## Trappole note

- **A09.** Se il componente decide quanto denaro si muove, sta facendo dominio. Il bancomat ha già
  il suo dominio (D014): qui si mostra il suo risultato.
- **Ricalcolare la commissione nel componente** è la trappola più probabile, perché è più corta da
  scrivere che da chiedere. `previewOf` esiste apposta, e restituisce già i tre movimenti.
- **Il retro della carta è la parte che si dimentica.** Una carta che gira e mostra un rettangolo
  vuoto è un giocattolo: [P5](../prodotto/preferenze.md#p5--la-carta-è-un-oggetto-3d-ruotabile)
  chiede che il gesto sia utile.
- **A14 vive qui.** Il mockup ha 407 righe di CSS, e questa delega ne scriverà quasi altrettante:
  è la stessa grandezza delle 1.067 righe di CSS morto del progetto precedente. La difesa è che lo
  stile stia attaccato al componente che lo usa, così togliere il componente tolga anche il suo CSS.
- **Il cruscotto è il posto dove i sei riquadri diventano otto** senza che nessuno decida. INV-12
  esiste per questo, e il test va scritto **prima** dei riquadri, non dopo.
