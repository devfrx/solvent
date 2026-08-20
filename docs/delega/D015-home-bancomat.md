# D015 — La home: bancomat, carta e cruscotto

- **Stato:** **Chiusa**, commit `3aa3460` — nata il 2026-08-19 dallo spezzamento di [D012](D012-ui-e-i18n.md)
- **Dipende da:** D012, D014
- **Sblocca:** D013
- **ADR vincolanti:** 0001, 0007, 0011, 0017, 0018
- **Regole:** R05, R12, INV-11, INV-12
- **Budget:** ~720 righe di sorgente — **consuntivo: 725**, più 321 di test

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

- [x] `tests/rules/home-tiles.test.ts`: `HomeView.vue` non contiene più di **sei** `StatTile`.
      Verificato aggiungendone un settimo e vedendo il test diventare rosso
- [x] test: le righe mostrate nell'anteprima sono **lo stesso valore** che il comando applica — non
      due elenchi che devono coincidere, ma uno solo (INV-11)
- [x] test: un prelievo con la commissione maggiore dell'importo mostra il **codice tradotto**, non
      un pulsante spento
- [x] test: il cruscotto legge le commissioni pagate da un saldo, non da un contatore
- [x] verifica manuale: la carta si gira al trascinamento, e il retro mostra dati veri
- [x] verifica manuale: con `prefers-reduced-motion` attivo la rotazione resta e l'animazione di
      ritorno no
- [x] verifica manuale: prelevare 500 sposta 497,50 sui contanti e 2,50 alle commissioni, e le
      ultime operazioni lo mostrano
- [x] `npm run verify:release` verde: da D011 il renderer compila, e deve continuare a farlo

## Diciassette correzioni rispetto a com'era scritta questa delega

**1. Il cruscotto ha cinque riquadri, non sei.** INV-12 è un **tetto**, non una quota: la delega
lascia a chi la esegue di decidere quali sono i sei, e i numeri vivi che la fetta 01 ha davvero
sono cinque. Il sesto sarebbe stato inventato per riempire la griglia, cioè avrebbe occupato il
posto che la fetta 02 userà davvero. Il posto vuoto è il messaggio.

**2. Tre dei sei riquadri del mockup non hanno dati sotto.** «Guadagnato oggi» non ha un giorno —
il tempo di gioco è un dominio che non esiste ([ADR 0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md));
«Punteggio credito» arriva con i prestiti, che sono l'era 2; «Tempo di gioco» idem. Al loro posto
ci sono **guadagnato** e **speso in totale**, che sono `world` col segno cambiato e `sink`: saldi
letti, esattamente come le commissioni che la definizione di fatto chiede. Da lì viene la proprietà
che tiene insieme il cruscotto — _guadagnato − speso − commissioni = patrimonio netto_, che è
INV-08 guardata dal lato del giocatore, e ha un test suo.

**3. Il retro della carta del mockup mostra tre numeri che non esistono.** Plafond usato, limite,
punteggio di credito: nella fetta 01 la carta non presta soldi e nessuno ha un punteggio.
Disegnarli sarebbe stato inventarli, che è il contrario di quello che
[P5](../prodotto/preferenze.md#p5--la-carta-è-un-oggetto-3d-ruotabile) chiede. Il retro porta le
tre dichiarazioni **vere** dello strumento, lette da `POOLS`: tracciabilità, capienza, commissione
per operazione. `card.back.limit_used` e `card.back.credit_score` sono uscite dal dizionario.

**4. Il fronte non ha numero, intestatario né scadenza,** per la stessa ragione: sono dati
inventati, e uno di essi — «M. ROSSI» — sarebbe stato anche una frase dentro un template (R12).
Il fronte porta il livello della carta, il chip e **il saldo del conto**, e così sparisce il
pannello «Sul conto» del mockup: la carta _è_ il conto, e il numero grande sta dove il giocatore lo
cerca.

**5. L'importo si sceglie fra quattro, e il più piccolo fallisce sempre.** Il mockup non ha un
campo di testo e la delega elenca «gli importi rapidi»: un campo libero avrebbe aperto un confine
nuovo — chi trasforma una stringa digitata in `Money`, e cosa succede quando non è un numero
(`fromString` **lancia**). `BALANCE.ATM_AMOUNTS` è 1 · 10 · 100 · 500, e l'1,00 € c'è **perché è
rifiutato**: senza di lui il rifiuto dell'anteprima esisterebbe solo dentro un test, e un ramo che
nessuno può vedere a schermo è un ramo che marcisce. Letti in fila, i quattro raccontano da soli la
regola del bancomat: 1,00 € rifiutato, 10,00 € ne perde un quarto, 500,00 € lo 0,5%.

**6. Il pannello fa entrambe le operazioni, quindi le parole diventano simmetriche.**
`atm.confirm` («Conferma prelievo») presupponeva una schermata di solo prelievo: diventa
`atm.withdraw.confirm`, e nascono `atm.deposit.confirm` e `atm.deposit.title`.
`atm.withdraw.breakdown` diventa `atm.breakdown`, perché il riquadro «cosa succede» è lo stesso
nelle due direzioni. Il dizionario era completo, ma completo per un mockup che disegnava una
schermata sola.

**7. Anteprima e comando sono appaiati una volta sola.** La delega chiede il selettore
dell'anteprima e dà per scontato il comando, che c'era già. Tenuti separati, un giorno «Deposita»
mostrerebbe l'anteprima di un prelievo — INV-11 rispettata dentro il dominio e persa nello store.
C'è una tabella sola, `directions`, e `preview` e `confirm` leggono la **stessa riga**. Al suo
posto spariscono `store.deposit` e `store.withdraw`.

**8. `fitsIn` non entra, e nemmeno la barra della capienza.** `capacityOf` sì: la capienza si
mostra, e oggi dice «Illimitata» perché è la verità. `fitsIn` invece risponderebbe sempre «sì»
finché la capienza è `null` — un ramo che nessun test può rendere rosso, sotto una barra sempre
vuota. Entrano con il valore, in fetta 02, che è dove la delega stessa li colloca.

**9. Nasce un sesto componente, `PostingRows.vue`, e con lui `postings.ts`.** Il riquadro «cosa
succede» e le ultime operazioni mostrano la stessa cosa — l'elenco dei movimenti — e la regola su
**quali** movimenti si vedono deve essere una sola: i pool del giocatore, più la commissione, che
si riconosce dalla propria `category` e non dal nome del conto su cui finisce (ADR 0017). È il
secondo uso, quindi il componente riutilizzabile è ammesso invece che vietato.

**10. Gli importi di una transazione hanno il verso davanti, e serve un secondo formato.** Intl
scrive «497,50 €», non «+ 497,50 €»: in un elenco di movimenti il segno **è** l'informazione.
Nasce `signedMoney` accanto a `money`, nello stesso file — che resta l'unico autorizzato a
convertire un `Money` (ADR 0006) — e un saldo resta senza segno, perché il più davanti al
patrimonio sarebbe rumore.

**11. `ZERO.minus(x)` e non `x.neg()`.** Visto a schermo, non pensandoci: una partita nuova
mostrava «-0,00 €» su «Guadagnato in totale». L'opposto di zero è **meno zero**, in decimal.js
come in JavaScript, e Intl lo scrive col segno.

**12. `no-undef` si spegne sui `.vue`.** Un componente che gestisce un `PointerEvent` nomina un
tipo del DOM, e `no-undef` non sa cosa sia — a saperlo è TypeScript, che risolve `lib`.
typescript-eslint spegne quella regola su ogni `.ts` per esattamente questa ragione, ma il suo
blocco non elenca i `.vue`. Non è un permesso di nominare il browser: `window` e `document`
restano in `runtime/host.ts`.

**13. La matematica della rotazione esce dal componente.** `rotation.ts` è pura e provata a parte,
ed è ciò che ha permesso di **non** far entrare jsdom — il cui grilletto, nel
[registro YAGNI](../roadmap-fette.md), nominava proprio «il pannello del bancomat con il suo
importo, o la carta 3D». Il grilletto è stato riscritto invece che tirato, e l'esercizio ha pagato
subito: senza il modulo scritto due volte, una carta trascinata all'indietro mostra la faccia
sbagliata — un difetto che si vedrebbe solo a mano.

**14. Il test «gli stessi oggetti» non guardava gli oggetti.** Scritto con `toEqual`, restava verde
anche su una copia con gli stessi numeri — cioè proprio su ciò che INV-11 vieta. Scoperto
rompendolo: `posting.amount.plus(0)` non lo svegliava. Adesso confronta per **identità**, come il
mirror dei saldi di [D011](D011-runtime-e-store.md).

**15. La schermata Statistiche cresce insieme alla home.** D012 le aveva lasciato le sole ragioni
in attesa del selettore che compone gli importi; quel selettore è nato qui, e lasciarla indietro
avrebbe prodotto due elenchi della stessa cosa con due livelli di dettaglio diversi. Ordine nuovo
per entrambe: dalla più recente, che è come si legge un estratto conto.

**16. `balance.panel.title` esce, `balance.panel.rate` diventa `income.per_second`.** Il pannello
del saldo di D012 non esiste più — la carta mostra il conto, `CashPanel` i contanti — e una chiave
che nessuno usa è codice morto con un'altra faccia (A14). Il ritmo del reddito resta, sotto il nome
di ciò che descrive.

**17. L'upgrade sta fra le due zone.** L'[ADR 0018](../adr/0018-la-home-e-un-atm.md) fissa
bancomat → cruscotto → ultime operazioni e non nomina l'upgrade, che però è l'unica cosa che si
compra. Sta subito sotto il bancomat, dove il giro si chiude: guadagna, deposita, compra.

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 477 test su 52 file in ~5 s
(erano 436 su 49). `npm run verify:release` **verde**: il renderer compila in 88 moduli, 562 kB di
JavaScript e 9,78 kB di CSS.

Il consuntivo di sorgente — **725 righe**, più 321 di test — coincide quasi esattamente con il
budget, che per una volta non era una speranza: il dizionario era già scritto, ed è proprio ciò che
aveva fatto sbagliare la stima di D012 di due volte e mezzo. Le 456 righe di CSS del renderer sono
vicine alle 407 del mockup, e stanno **tutte** attaccate al componente che le usa tranne i token di
`App.vue`: togliere un componente toglie il suo stile, che è la difesa contro le 1.067 righe morte
del difetto A14.

### Cosa è stato verificato a mano, e come

Il gioco è stato **giocato**. Non nella finestra di Electron: in questo ambiente la finestra non
compone frame, quindi `requestAnimationFrame` non scatta e il reddito non entrerebbe mai. La
schermata è stata servita dal bundle di produzione (`npm run build`) con, al posto del preload, le
tre funzioni finte che il contratto `SaveApi` dichiara, e una partita salvata con 1.000,00 € sulla
carta al posto del tempo che non passava. Tutto il resto è il gioco vero: lo stesso store, lo
stesso Ledger, gli stessi componenti.

- **Il giro completo si chiude.** Preleva 500 → la carta scende a 500,00 €, i contanti salgono a
  497,50 €, «Commissioni pagate» passa a 2,50 € e le ultime operazioni mostrano le tre righe.
  Quattro depositi da 100 portano la carta a 890,00 €, «Compra — 800,00 €» riesce, il riquadro
  «Reddito» passa da `+ 12,00 € / s` a `+ 18,00 € / s` e «Speso in totale» a 800,00 €. È la fetta
  01 giocabile dallo schermo, che con la sola D012 non era possibile.
- **Il rifiuto è una frase, non un pulsante spento.** Scelto 1,00 €, il riquadro «cosa succede»
  mostra _«La commissione di 2,50 € si mangia tutti i 1,00 €.»_; il pulsante **non** è disabilitato
  (`disabled === false`) e premerlo ripete la stessa frase senza muovere un centesimo.
- **La carta gira davvero.** Trascinandola, il `transform` segue la mano — `rotateY(-14deg)` →
  `76deg` → `226deg`, con l'inclinazione fermata a 28° — e al rilascio si ferma su
  `rotateX(-4deg) rotateY(180deg)`, cioè sul retro, che mostra _Tracciabilità · Capienza ·
  Commissione per operazione_. Un clic secco la rigira sul fronte.
- **`prefers-reduced-motion`** è nel CSS compilato e riguarda **solo** la transizione
  (`.card { transition: none }`): la rotazione è un `transform` scritto da JavaScript e non dipende
  dall'animazione, quindi resta. Le due cose sono separate per costruzione, non per fortuna.
- **Il cambio di lingua** sull'istanza viva cambia tutto, chiavi nuove comprese: `ATM`,
  `NET WORTH`, `Every movement is recorded`, `+€97.50`.

L'identità del cruscotto è stata letta a schermo insieme al resto: 1.000,00 − 800,00 − 12,50 =
187,50, che è il patrimonio netto mostrato.

### Le reti sono state rotte una alla volta

Tredici rotture indotte, una per volta, con il ripristino subito dopo.

| Rottura indotta                                     | Cosa è diventato rosso                   |
| --------------------------------------------------- | ---------------------------------------- |
| un settimo riquadro nella home                      | `rules/home-tiles`                       |
| i riquadri moltiplicati da un `v-for`               | `rules/home-tiles`                       |
| il modulo scritto una volta sola invece che due     | `renderer/rotation`                      |
| l'inclinazione senza limite                         | `renderer/rotation`                      |
| la commissione sparisce dalle righe mostrate        | `renderer/postings` — 3 casi             |
| l'importo ricalcolato invece che mostrato           | `renderer/postings` — 3 casi             |
| una copia con gli stessi numeri al posto del valore | `renderer/postings`, **dopo** la 14      |
| «Deposita» appaiato all'operazione di prelievo      | `renderer/store`                         |
| le commissioni diventano un contatore in memoria    | `renderer/store`                         |
| le ultime operazioni tornano dalla più vecchia      | `renderer/store` — 2 casi                |
| una frase scritta a mano dentro il pannello         | `rules/no-literal-in-template`           |
| il pannello importa le regole del bancomat          | `rules/no-logic-in-vue` + `npm run lint` |
| il segno del movimento torna a quello di un saldo   | `i18n/translator`                        |

La settima riga è la più utile: la rottura è rimasta **verde** la prima volta, e ha mostrato che il
test misurava l'uguaglianza mentre il suo nome prometteva l'identità (correzione 14).

## Cosa deve sapere chi prende D013

- **La fetta 01 è giocabile, ed è stata giocata**, con i passaggi qui sopra. D013 è lo STOP 2:
  rifarli è il suo mestiere, ma non parte da zero.
- **Il modo di far girare il gioco senza Electron** è quello descritto sopra: bundle di produzione,
  tre funzioni finte al posto del preload, un salvataggio con dei soldi dentro. In una finestra che
  non compone frame il reddito non entra mai, e non è un difetto del gioco.
- **`tests/rules/home-tiles` è ⚠️ parziale e lo dichiara**: conta i tag e rifiuta un `v-for` su un
  riquadro, ma un `v-for` su un contenitore che ne avvolge uno le sfugge. Per prenderlo servirebbe
  rendere il componente, cioè jsdom.
- **jsdom non è entrato**, di nuovo, e il suo grilletto nel registro YAGNI è stato riscritto: non
  più «il primo componente con stato locale non banale» — quello esiste da oggi — ma il primo
  comportamento che **non** si riesce a estrarre in una funzione pura.
- **Cinque riquadri, sei posti.** Se D013 decide che ne serve un sesto, il posto c'è; il settimo no.

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
