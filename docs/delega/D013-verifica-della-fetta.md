# D013 — Verifica della fetta (STOP 2)

- **Stato:** **Chiusa** — 2026-08-20, commit `DA-ANNOTARE`, ramo `d013-verifica-della-fetta`.
  Preparata per l'esecuzione lo stesso giorno, con la fetta 01 davanti
- **Dipende da:** D016 (cioè tutto). Le quindici deleghe che la precedono sono tutte `Chiusa`
- **Sblocca:** la decisione sulla fetta 02
- **ADR vincolanti:** 0014
- **Regole:** nessuna nuova. Questa delega non ne aggiunge: le **verifica**
- **Budget:** ~250 righe di test → **rimisurato: ~120 di test e un README di 20 righe**, e il
  perché sta nella sezione qui sotto

## Obiettivo

Dimostrare — con output, non con affermazioni — che il kernel regge e che la fetta attraversa
davvero tutti i livelli.

## Cosa è cambiato da quando è stata scritta

Questa delega è stata scritta prima del kernel, quando nessuno dei file che elenca esisteva. Adesso
esistono quasi tutti, e il lavoro che resta è un altro.

**1. La tabella _Da produrre_ elencava sei righe: cinque descrivono file che esistono già.**
`tests/save/roundtrip`, `tests/balance/targets`, `tests/i18n/parity` e i test di regola sono nati
con le deleghe che li richiedevano, e nessuno di loro va riscritto. Vanno **eseguiti e guardati**,
che è una cosa diversa e più corta.

**2. Il round-trip su stato non banale esiste**, e si chiama `tests/save/kernel-roundtrip`: saldi
con decimali su cinque conti, due stream dell'Rng avanzati di quantità diverse, un sistema con
stato, il giro completo fino al disco vero. Quello che **non** esiste è il giro della **partita
vera** — `createGame()` che gioca, salva, e un secondo `createGame()` che rilegge — perché quel
test usa un sistema finto al posto di `income`. È il buco che questa delega chiude.

**3. Una `boundedList` nel salvataggio non c'è**, e non è una dimenticanza: la lista delle ultime
operazioni è un mirror dello store, riparte vuota a ogni apertura e non attraversa il disco (D011).
Il primo `boundedList` salvato è il caveau della fetta 02, ed è scritto nel
[registro YAGNI](../roadmap-fette.md). La riga della definizione di fatto che lo chiedeva resta
quindi senza oggetto, e lo dichiara invece di sparire.

**4. `README.md` alla radice non esiste ancora.** È l'unica cosa di questa delega che è codice
nuovo — venti righe di markdown — e nessun test la impone: `tests/rules/product-identity` guarda i
metadati del prodotto, non la presenza del file.

**5. Nessuna riga di `tracciabilita.md` punta più a un meccanismo che non esiste.** L'ultimo era
`tests/rules/home-tiles`, nato con [D015](D015-home-bancomat.md). Verificarlo è una lettura, non un
lavoro: le righe che nominano un file di test lo trovano tutte.

Attenzione però a cosa quella lettura **non** vede, ed è la lezione di
[D016](D016-correzioni-audit.md): la tabella censisce le regole che qualcuno ha messo in tabella.
Due divieti veri — le parole vietate del glossario e il barrel di `convenzioni.md` — non c'erano, e
il conteggio delle righe 👤 non li vedeva per costruzione. La domanda da fare non è «ogni riga ha un
meccanismo?» ma «ogni **regola scritta da qualche parte** ha una riga?».

**6. Il percorso manuale ha due passi che oggi non si fanno come sono scritti**, ed è la parte più
utile di questa preparazione: vedi _Il percorso manuale_ qui sotto.

**7. Gli ADR ancora `Proposta` sono otto**, e per due è corretto: **0022** e **0023** descrivono
cose che il progetto non ha ancora costruito. Gli altri sei — **0008**, **0010**, **0012**,
**0013**, **0014**, **0015** — descrivono cose che il progetto **fa già**: un solo nome propagato,
liste limitate alla definizione, controlli sul codice morto, Prettier come unica autorità, una
fetta alla volta, il criterio di ammissione delle dipendenze. Potrebbero essere in vigore senza che
nessuno l'abbia dichiarato. La domanda per ciascuno è una sola: _esiste un meccanismo che lo impone,
e qualcuno l'ha visto scattare?_ Per 0010 la risposta è già scritta e vale no — il primo
`boundedList` salvato non esiste ancora ([adr/README.md](../adr/README.md)).

## Cosa trovi già fatto

Non è cortesia: è ciò che distingue «verificare» da «riscrivere».

- **497 test su 54 file**, e ogni rete nata da D009 in poi è stata **vista rossa** almeno una volta:
  le tabelle delle rotture indotte stanno in fondo a [D011](D011-runtime-e-store.md),
  [D012](D012-ui-e-i18n.md), [D014](D014-dominio-bancomat.md),
  [D015](D015-home-bancomat.md) e [D016](D016-correzioni-audit.md) — **cinquantanove** rotture
  in tutto.
- **La fetta è già stata giocata a mano**, e i numeri sono nella nota di chiusura di
  [D015](D015-home-bancomat.md): 500 prelevati diventano 497,50 sui contanti e 2,50 di commissione,
  quattro depositi da 100 portano la carta a 890,00 €, l'upgrade riesce e il reddito passa da 12,00
  a 18,00 €/s. Rifarlo è il mestiere di questa delega — ma sapendo cosa si deve vedere.
- **`tests/save/kernel-roundtrip`** fa il giro completo su stato non banale, fino a un file vero.
- **`tests/renderer/store`** carica una partita salvata e verifica saldi, upgrade e reddito dopo il
  caricamento: il pezzo che manca è il **salvataggio** della partita vera, non la sua rilettura.
- **Ogni delega della fetta è `Chiusa` con il commit annotato**, D012, D015 e D016 comprese, e i
  loro rami sono uniti a `main`.

## Da produrre

| File                                   | Cosa dimostra                                                            |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `tests/save/game-roundtrip.test.ts`    | la **partita vera**: gioca → salva → disco → rilegge → identica          |
| `README.md` (radice)                   | cosa fa il progetto e come si aggiunge un sistema, in 20 righe           |
| `docs/roadmap-fette.md`                | la fetta 01 è marcata **conclusa**; il registro YAGNI aggiornato         |
| `docs/tracciabilita.md`                | confermato riga per riga: nessun meccanismo dichiarato e inesistente     |
| `docs/adr/*` e `docs/adr/README.md`    | gli ADR che il codice ora impone passano a `Accettata`; si dice quali no |
| `docs/delega/PASSAGGIO-DI-CONSEGNE.md` | lo stato allo STOP 2, e la domanda sulla fetta 02                        |

Il nome del test è nuovo di proposito: `tests/save/roundtrip` è il confine del main con payload
scritti a mano, `kernel-roundtrip` è il kernel con un sistema finto, e questo è **il gioco**. Tre
file, tre domande diverse, e nessuno dei tre copre gli altri due.

## Lo stato di prova del round-trip

Un round-trip su uno stato vuoto passa sempre e non dimostra nulla. Lo stato deve contenere, come
minimo:

- un saldo con decimali che in virgola mobile andrebbero storti — `0.1 + 0.2` è il caso classico, e
  il bancomat lo produce da solo: 2,50 di commissione su importi che non sono tondi
- **il dominio `income` vero**, con l'upgrade comprato: è ciò che `kernel-roundtrip` non prova,
  perché lì il sistema è finto
- lo stato dell'Rng con almeno uno stream avanzato
- ~~una `boundedList` con almeno un elemento~~ — **non applicabile**: nella versione 1 del
  salvataggio non c'è nessun array (punto 3 qui sopra)

Il confronto è sull'**uguaglianza profonda** dello stato ricostruito, non su qualche campo scelto.
E la seconda partita deve essere un `createGame()` **nuovo**: rileggere nello stesso oggetto che ha
salvato prova molto meno.

## Il percorso manuale

Da fare a mano, oltre ai test, perché è la cosa che i test non vedono:

1. avvio il gioco, il saldo sale
2. deposito al bancomat: la commissione si vede **prima** di confermare, e dopo la conferma le
   ultime operazioni mostrano i tre movimenti
3. compro l'upgrade, il reddito aumenta in modo visibile
4. provo a comprarlo di nuovo, ricevo un messaggio tradotto
5. chiudo la finestra
6. riapro: saldo, upgrade e reddito sono quelli di prima, più il tempo passato
7. reset hard: torna tutto a zero, upgrade incluso
8. **chiudo la finestra dalla schermata d'errore, invece di scegliere**, e riapro: il salvataggio è
   ancora quello di prima. È il difetto critico che [D016](D016-correzioni-audit.md) ha chiuso
   (INV-17), e serve lo stesso salvataggio illeggibile del passo 7 per arrivarci

Due avvertenze che [D015](D015-home-bancomat.md) ha pagato, e che cambiano come si esegue l'elenco:

- **Il passo 1 richiede una finestra che compone frame.** Il loop gira su
  `requestAnimationFrame`: in una finestra nascosta, o in un ambiente senza compositore, quel frame
  non arriva mai e il saldo resta fermo — non è un difetto del gioco. Se la finestra vera non è
  disponibile, il modo di far girare tutto il resto è nella nota di chiusura di D015: bundle di
  produzione, le tre funzioni di `SaveApi` finte al posto del preload, e un salvataggio con dei
  soldi dentro al posto del tempo che non passa.
- **Il passo 7 non ha un pulsante.** «Partita nuova» esiste **solo** nella schermata di errore, ed
  è deliberato: azzerare una partita per sbaglio è un difetto peggiore di un passo scomodo. Per
  eseguirlo a mano serve un salvataggio illeggibile — oppure si dichiara che il reset è coperto dai
  test e non a mano, il che è una risposta legittima purché sia scritta. La domanda vera per lo
  STOP 2 è un'altra, e va riportata: **il giocatore deve poter ricominciare senza rompere un
  file?**

## Definizione di fatto

- [x] `npm run verify` verde, con l'**output incollato** — non riassunto, non parafrasato
- [x] `npm run verify:release` verde: da D011 il renderer compila, e deve continuare a farlo
- [x] gli otto passi manuali sopra, eseguiti davvero, con le due avvertenze rispettate
- [x] `tests/save/game-roundtrip` esiste e passa su una partita **giocata**, non costruita a mano
- [x] ogni test nuovo è stato rotto di proposito almeno una volta, per verificare che possa fallire
- [x] `docs/tracciabilita.md`: nessuna riga ha un meccanismo che non esiste — verificato aprendo i
      file, non fidandosi della tabella
- [x] `docs/roadmap-fette.md`: la fetta 01 è marcata conclusa; il registro YAGNI è aggiornato con
      ciò che è stato tentato e rimandato **durante** il lavoro
- [x] tutte le deleghe della fetta — da D001 a D012, più D014, D015 e **D016** — sono `Chiusa`, con il commit
      annotato **e il ramo unito a `main`**
- [x] gli ADR imposti dal codice sono `Accettata`; quelli ancora non imposti restano `Proposta`, e
      si dice quali e perché
- [x] `README.md` alla radice esiste e sta in 20 righe

## Cosa si riporta allo STOP 2

Non "funziona". Questo:

1. l'output reale dei gate
2. quante righe ha il kernel, confrontate con il budget di ~500 — la misura di D008 dice **535**
3. **quali regole si sono rivelate scomode**, e in quale punto preciso. È l'informazione più
   importante dello STOP 2: una regola scomoda alla prima fetta è una regola da rivedere adesso,
   quando cambiarla costa poco (ADR 0014)
4. cosa è stato tentato e rimandato, dal registro YAGNI
5. se qualcosa è rosso: che cosa, e perché non è stato aggirato

Per il punto 3 il materiale c'è già, ed è nelle correzioni delle deleghe chiuse. Cinque candidati,
da verificare invece che da ricopiare:

- **R05 vieta anche i tipi.** Un `.vue` non può importare un tipo da `domains/*/commands`, perché
  il lint usa la regola base e non distingue un import di tipo. L'aggiramento — le unioni della UI
  vivono in `renderer/i18n/index.ts` — funziona, ma è un aggiramento ([D012](D012-ui-e-i18n.md),
  correzione 17).
- **`no-undef` non conosce il DOM.** Un componente che gestisce un `PointerEvent` lo nomina, e la
  regola base non sa cosa sia: è spenta sui `.vue` ([D015](D015-home-bancomat.md), correzione 12).
- **`english-identifiers` va fuori fase** su un'espressione regolare che contiene virgolette, e
  produce falsi positivi. L'aggiramento è costruire la regex da una stringa ([D014](D014-dominio-bancomat.md)).
- **`no-magic-numbers` non vede il denaro**, perché `Money` si costruisce da una stringa. È servito
  un test in più, `tests/rules/domains-no-money-literals` ([D014](D014-dominio-bancomat.md),
  correzione 2).
- **R06 scattava su una lettura**, non solo su una scrittura: il selettore prendeva entrambi i lati
  dell'assegnamento ([D011](D011-runtime-e-store.md), correzione 3).

## Trappole note

- **A17.** Il momento di massimo rischio del progetto è **subito dopo** questo STOP: il kernel è
  pagato, tutto sembra facile, e la tentazione è aprire cinque domini insieme. È esattamente così
  che sono nati i 24 sistemi.
- Un test che non è mai stato visto fallire non è una rete: è una decorazione. Romperlo di
  proposito una volta costa trenta secondi.
- Dichiarare verde ciò che non si è eseguito è l'unico errore di questo elenco che non si recupera
  con un commit.
- **Verificare non è riscrivere.** Cinque dei sei file che la tabella originale elencava esistono
  già: aprirli, eseguirli e guardarli è il lavoro. Riscriverli sarebbe il modo più elegante di non
  verificare niente.

## Come è andata

`npm run verify` **verde**, output reale:

    Test Files  55 passed (55)
         Tests  503 passed (503)

`npm run verify:release` **verde**: `out/main/index.js` 12,23 kB, `out/preload/index.cjs`
1,00 kB, `out/renderer/` 91 moduli, 564,89 kB di JavaScript e 10,65 kB di CSS.

`verify` intero misura **41,4 s** su questa macchina, dentro l'intervallo 42–45 dichiarato a
[D016](D016-correzioni-audit.md) e sei test più grosso. La soglia di [qualita.md](../qualita.md)
resta il minuto, e resta il margine più stretto del progetto: la voce del
[registro YAGNI](../roadmap-fette.md) che propone di togliere i sei `npm run` incatenati portava
ancora la cifra di D007 ed è stata rimisurata qui.

### Il percorso manuale, otto passi su otto

Il gioco è stato **giocato**, col bundle di produzione e le tre funzioni finte di `SaveApi` al
posto del preload, come descritto nella nota di chiusura di
[D015](D015-home-bancomat.md#cosa-è-stato-verificato-a-mano-e-come). Due differenze rispetto a
quella volta, ed è la parte che vale: la finestra qui **compone frame**, quindi il passo 1 si è
potuto fare davvero invece di essere sostituito da un salvataggio con dei soldi dentro; e il
salvataggio è sopravvissuto alla chiusura, quindi i passi 5 e 6 sono due riaperture vere e non due
letture dello stesso oggetto in memoria. Deposito, acquisto, importo rapido, «Partita nuova» e la
navigazione sono clic veri; le tre misure a tempo — la vita di un'operazione nell'elenco, il
rifiuto ripremuto, `beforeunload` — sono eventi inviati dal codice, perché misurano finestre di
centinaia di millisecondi che una mano non prende.

| #   | Passo                                        | Cosa si è visto                                                                                                                                                                                                                   |
| --- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | il saldo sale                                | contanti da 37,20 € a 73,20 € in tre secondi: **36,00 €, cioè esattamente 12,00 €/s**                                                                                                                                             |
| 2   | la commissione **prima** della conferma      | «cosa succede» mostra −500,00 · +497,50 · +2,50 a pulsante ancora da premere; dopo la conferma il conto è 497,50 € e «Commissioni pagate» 2,50 €                                                                                  |
| 2b  | le tre righe nelle ultime operazioni         | ci sono — `Deposito · Contanti −500,00 € · Carta +497,50 € · Commissione +2,50 €` — e **durano meno di 400 ms**: vedi la correzione 3                                                                                             |
| 3   | l'upgrade aumenta il reddito                 | carta da 1.492,50 a 692,50 €, «Reddito» da **+ 12,00 €/s a + 18,00 €/s**, «Speso in totale» 800,00 €, e lo stipendio passa da +1,20 € a +1,80 € per tick                                                                          |
| 4   | il rifiuto è un messaggio tradotto           | non sull'upgrade, che dopo l'acquisto non ha più un pulsante (correzione 4): sul bancomat a 1,00 €, _«La commissione di 2,50 € si mangia tutti i 1,00 €.»_, `disabled === false`, e conto, commissioni e speso fermi al centesimo |
| 5   | chiudo la finestra                           | la finestra si è chiusa **davvero**, dopo aver scritto: `cash 1440`, `card 692.5`, `fees 7.5`, `sink 800`, `world -2940`, `income.upgraded: true` — somma zero                                                                    |
| 6   | riapro e ritrovo tutto, più il tempo passato | conto 692,50 €, reddito + 18,00 €/s, liv. 1, speso 800,00 €; e i contanti a 1.697,40 € contro i 1.440,00 € salvati, cioè 257,40 € a 18 €/s: il recupero                                                                           |
| 7   | reset hard                                   | «Partita nuova» cancella il file (`null`), azzera conto, speso e commissioni, riporta il reddito a **+ 12,00 €/s**, il livello a 0 e il pulsante «Compra» al suo posto                                                            |
| 8   | chiudo dalla schermata d'errore              | **zero scritture** sul salvataggio, byte identici prima e dopo, e la finestra si chiude lo stesso. È INV-17 sull'applicazione vera                                                                                                |

L'identità del cruscotto regge a ogni passo: guadagnato − speso − commissioni = patrimonio netto,
letta a schermo tre volte su tre.

### Le reti nuove, viste rosse

`tests/save/game-roundtrip` è stato rotto quattro volte, `doc-links` una, e i cinque meccanismi
che promuovono altrettanti ADR una ciascuno. Dieci rotture indotte, una alla volta, ognuna
ripristinata subito dopo.

| Rete                             | Rottura indotta                                         | Rosso ottenuto                                                               |
| -------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `game-roundtrip`, l'upgrade vivo | tolto `syncUpgradeModifier()` dal `load` di `income`    | `expected '12' to be '18'` — due casi, e gli altri quattro **restano verdi** |
| `game-roundtrip`, l'uguaglianza  | tolto `rng.load(payload.rng)` da `createGame`           | `"seed": 4243` contro `4242`, `"cursors": {}` contro `{ income: 3 }`         |
| `game-roundtrip`, i saldi        | `ATM_FEE` da 2,50 a 2,00                                | `"card": "8.8"` contro `"7.8"`, `"fees": "4"` contro `"5"`                   |
| `game-roundtrip`, il disco       | tolto `rename(temporary, path)` da `SaveFile.write`     | `Error: il caricamento doveva riuscire` — quattro casi su sei                |
| `doc-links` sulla radice         | un collegamento a `docs/mappa.md` nel `README.md` nuovo | `expected [ 'README.md -> docs/mappa.md' ] to deeply equal []`               |
| C03 → ADR 0008                   | `productName: "Bankroll"`                               | `expected 'Bankroll' to be 'Solvent'`                                        |
| C01 → ADR 0012                   | una costante mai letta in `income/rules.ts`             | `error TS6133: 'unusedByDesign' is declared but its value is never read`     |
| C02 → ADR 0013                   | tre spazi di troppo prima di `BALANCE.UPGRADE_COST`     | `Code style issues found in the above file`                                  |
| P01 → ADR 0014                   | un `TODO` in un commento                                | `expected [ 'src\core\domains\income\rules.ts' ] to deeply equal []`         |
| INV-01 → ADR 0015                | `import { useI18n } from 'vue-i18n'` sotto `core/`      | `expected [ 'vue-i18n' ] to deeply equal []` e il lint su INV-02             |

La prima riga è la più utile, ed è la ragione per cui questo file esiste: quella rottura tiene
verdi i quattro casi che guardano i **byte** e rende rossi solo i due che guardano il **gioco**.
Un round-trip che confronta i payload direbbe verde su una partita che ha riletto l'upgrade come
dato e ha perso il moltiplicatore che quel dato comanda.

## Il rapporto dello STOP 2

**1. L'output dei gate.** Sopra, incollato. `verify` verde in 41,4 s con 503 test su 55 file;
`verify:release` verde.

**2. Il kernel contro il budget di ~500 righe: sono 545, e il 9% di sforamento è dichiarato.** La
prima risposta a questa domanda era sbagliata, e vale la pena scrivere come: misurando
`src/core/kernel/` viene **471**, cioè sotto budget — un numero comodo e falso, perché il ~500 e il
535 di D008 non misurano quella cartella. Misurano le **sei deleghe D003–D008**, cioè i cinque
moduli del kernel **più `balance/`**. Confrontare 471 con ~500 significa confrontare due insiemi
diversi, che è la trappola dei numeri scaduti applicata a due misure entrambe vere.

L'insieme giusto, col metodo che il [passaggio di consegne](PASSAGGIO-DI-CONSEGNE.md) dichiara —
righe di codice, commenti e righe vuote escluse — fa **545**: `Ledger.ts` 197, `Registry.ts` 126,
`balance/` 74, `Bus.ts` 67, `Rng.ts` 55, `Clock.ts` 26. Erano 535 a D008, e le dieci righe di
differenza sono attribuibili: **sei** al Clock, che a D011 ha guadagnato `ticksToMilliseconds` e il
tipo `Milliseconds` perché il loop ne aveva bisogno, e **quattro** a `balance/`, con `ATM_FEE` e i
quattro importi rapidi di D014 e D015. Nessuna delle due è cresciuta da sola.

Il ~500 è quindi sforato del 9%, e la storia dello sforamento è già scritta in
[README.md](README.md) delega per delega — ~500, poi ~560, poi ~530, poi ~555 — che è esattamente
ciò che un budget dichiarato deve produrre: non un limite rispettato, ma una crescita di cui si sa
il perché. Le stesse righe sono 853 fisiche e 749 non vuote: la differenza è tutta commento, ed è
la convenzione del progetto.

**3. Quali regole si sono rivelate scomode.** I cinque candidati elencati in questa delega sono
stati verificati uno per uno, e reggono tutti come descritti. Ma il rapporto vero è più corto di
quell'elenco, perché quattro dei cinque sono **limiti dichiarati**, non attriti: R05 che non
distingue un import di tipo, `no-undef` che non conosce il DOM, `english-identifiers` che va fuori
fase sulle virgolette, `no-magic-numbers` che non vede il denaro. Ognuno ha già il proprio
aggiramento scritto accanto e ognuno è costato una volta sola. Una regola che costa una volta e poi
non si fa più sentire non è una regola da rivedere.

La sola che si è rivelata scomoda **durante** questa delega è la sesta, che non era in elenco:
**`domains/**` vieta i numeri di gioco, e il divieto non copre `tests/`**. È giusto così — ma
significa che le cifre attese di `game-roundtrip` sono scritte a mano nel test, e se un giorno
`ATM_FEE` cambia, quel file diventa rosso con un numero e non con una regola. È esattamente ciò che
si vuole (la rottura indotta numero 3 lo dimostra), e va saputo prima di leggerlo come un difetto.

Il vero attrito della fetta non è stato una regola di lint: è stato **il divieto di jsdom**, che ha
retto tre volte — D012, D015 e qui — costringendo ogni volta a estrarre una funzione pura invece di
montare un componente. Ha prodotto `rotation.ts` e `postings.ts`, che sono codice migliore di
quello che sarebbe nato altrimenti. Ma il passo 2b di questo percorso manuale — un'operazione che
vive meno di mezzo secondo in un elenco — **nessun test lo avrebbe mai visto**, e non perché manchi
jsdom: perché nessuno stava guardando lo schermo mentre il tempo passava. È il limite che
[qualita.md](../qualita.md) dichiara sotto «cosa nessun gate garantisce», e la fetta 01 lo ha
appena riscosso.

**4. Cosa è stato tentato e rimandato.** Tre voci nuove nel
[registro YAGNI](../roadmap-fette.md): il raggruppamento dello stipendio nelle ultime operazioni
(grilletto: la fetta 02), un meccanismo per la purezza di `rules.ts` (grilletto: il terzo
`rules.ts`), e la rimisura della voce su `verify` più veloce, che portava ancora la cifra di D007.
Nessun codice di gioco è stato scritto.

**5. Cos'è rosso.** Niente. Le due cose che questa delega ha trovato e **non** ha corretto sono
dichiarate invece che aggirate: le ultime operazioni sommerse dallo stipendio (correzione 3) e la
regola sulla purezza di `rules.ts` senza meccanismo (correzione 10). Sono entrambe nel registro
YAGNI con il proprio grilletto, e nessuna delle due è un gate rosso: sono due cose che il progetto
adesso sa di sé e prima no.

### La domanda che questa delega doveva riportare

_Il giocatore deve poter ricominciare senza rompere un file?_ Il passo 7 si esegue **solo**
danneggiando il salvataggio, perché «Partita nuova» vive unicamente nella schermata d'errore. La
scelta è deliberata e regge — azzerare una partita per sbaglio è peggio di un passo scomodo — ma
adesso ha un dato accanto: provando a eseguirla è emerso che il salvataggio **non si può rompere
dall'interno**. Uscire dalla pagina fa scattare `beforeunload`, che salva sopra il file danneggiato
prima che qualcuno possa rileggerlo (correzione 6). È la prova più forte che INV-17 e la chiusura
funzionano, ed è anche la ragione per cui il reset resta oggi una funzione che il giocatore non può
raggiungere di proposito. La risposta spetta allo STOP 2, non a questa delega.

## Undici correzioni rispetto a com'era scritta questa delega

**1. D016 era `Chiusa` in tutti i documenti e non era mai stata committata.** Il lavoro esisteva
per intero nel ramo `d016-correzioni-audit` — 36 file, `verify` verde con 497 test — ma il ramo era
allo stesso commit di `main` e tutto viveva nel working tree. La riga di stato diceva «commit
`da annotare`»: non era un'annotazione mancante, era il commit. La definizione di fatto di questa
delega pretende ogni delega `Chiusa` **con il ramo unito a `main`**, quindi il primo gesto di D013
è stato chiudere D016 davvero — commit `c648639`, annotazione, merge — e solo dopo aprire il
proprio ramo. Una delega che verifica non può verificare da dentro il lavoro non consegnato di
un'altra.

**2. La finestra compone frame, e il passo 1 si è potuto fare.** Questa delega e la nota di
chiusura di D015 avvertono che senza compositore `requestAnimationFrame` non scatta e il saldo
resta fermo, e prescrivono di sostituire il passo 1 con un salvataggio che ha già dei soldi. È vero
della finestra di Electron in questo ambiente, non dell'ambiente: nella pagina servita dal bundle
il loop gira, e il saldo è salito di 36,00 € in tre secondi. L'avvertenza resta utile e va letta al
contrario — **se il saldo non sale, prima di cercare il difetto si conta un frame**.

**3. Il passo 2 è vero per meno di mezzo secondo.** I tre movimenti compaiono esattamente come
INV-11 promette, poi lo stipendio li seppellisce: il reddito emette **una transazione per tick**,
cioè dieci al secondo, e la home ne mostra quattro. Un'operazione vive quattro decimi di secondo;
il registro da venti della schermata Statistiche è **interamente stipendio** dopo due secondi —
misurato, venti righe su venti. Né questa delega né D015 potevano vederlo: la verifica di D015 è
avvenuta in una finestra che non ticchettava, cioè nell'unica condizione in cui l'elenco sembra
funzionare. Non è stato corretto qui — sarebbe codice di gioco nuovo in una delega di verifica — ed
è nel registro YAGNI con il grilletto della fetta 02.

**4. Il passo 4 non è eseguibile come scritto.** «Provo a comprarlo di nuovo, ricevo un messaggio
tradotto»: dopo l'acquisto `IncomePanel.vue` sostituisce il pulsante con «Già in funzione», quindi
un secondo tentativo non ha da dove partire. `error.income.already_upgraded` esiste, è tradotto in
entrambe le lingue, è provato dai test — ed è **irraggiungibile dallo schermo**. Non è codice morto:
è la difesa del dominio contro un doppio clic, e sta al confine giusto. Ma la fetta 01 ha un codice
d'errore tradotto che nessun giocatore vedrà mai, ed è l'immagine speculare del `1,00 €` di
[D015](D015-home-bancomat.md), che esiste **apposta** perché fallisce. Il passo è stato eseguito
nella forma raggiungibile, sul bancomat.

**5. I passi 7 e 8 sono elencati nell'ordine sbagliato.** Il passo 8 dichiara di aver bisogno
«dello stesso salvataggio illeggibile del passo 7», ma il passo 7 lo **cancella**: «Partita nuova»
azzera il file. Eseguiti nell'ordine 8 → 7, che è l'unico che funziona con una sola rottura del
salvataggio.

**6. Il salvataggio non si può danneggiare dall'interno, ed è il comportamento giusto.** Il primo
tentativo — rompere la busta dalla console e ricaricare — è fallito: uscire dalla pagina fa
scattare `beforeunload`, che chiama `close()`, che da uno stato autoritativo **salva**, sovrascrivendo
il danno. Per arrivare alla schermata d'errore il salvataggio va rotto quando in memoria non c'è
ancora nessuna partita, cioè prima che l'applicazione parta. È INV-17 vista dall'altro lato: lo
stesso invariante che impedisce di scrivere quando non c'è una partita, impedisce di **non**
scrivere quando c'è.

**7. `doc-links` non guardava l'unico documento che questa delega crea.** C07 dice «ogni
collegamento fra documenti risolve», e il meccanismo leggeva `sourceFiles('docs')`: il `README.md`
della radice sarebbe nato scoperto. Allargato a `docs/` più la radice. Non è una regola nuova — è
la stessa regola applicata a un documento che non esisteva quando il meccanismo è stato scritto, ed
è la sola riga di codice non di test che D013 abbia toccato.

**8. Il 535 del kernel non era un metodo diverso: era un insieme diverso.** Il
[passaggio di consegne](PASSAGGIO-DI-CONSEGNE.md) avvertiva che «il numero del kernel viene da D008
e usa un altro metodo», e non è così: 20 + 55 + 67 + 126 + 197 + **70** — l'ultimo addendo è
`balance/`, che non sta in `kernel/`. Il metodo è lo stesso; a cambiare è cosa si conta. La
distinzione non è pedanteria: rimisurando solo `src/core/kernel/` viene 471, che confrontato con
~500 dice «c'è margine» quando il margine non c'è. Vedi il punto 2 del rapporto per i numeri veri,
e per le dieci righe cresciute dopo D008 con il nome di chi le ha portate.

**9. Lo stato di prova dell'Rng non può nascere giocando.** La sezione _Lo stato di prova del
round-trip_ chiede «lo stato dell'Rng con almeno uno stream avanzato». Nella fetta 01 **nessun
dominio pesca**: `income` non usa la casualità e `atm` non ha stato. Confermato sul salvataggio
vero della partita a mano, che riporta `"cursors": {}`. Il test pesca esplicitamente e lo dichiara
in un commento: è l'unica riga del giro che non è un gesto del giocatore, e sta al posto del
dominio che pescherà. La riga della `boundedList` era già stata dichiarata non applicabile in
preparazione; questa è la seconda dello stesso elenco, e nessuno l'aveva vista.

**10. La domanda inversa sulla tracciabilità ha trovato una regola senza meccanismo.** Le due
direzioni meccanizzabili sono verdi — ogni meccanismo nominato esiste, e tutti e quaranta gli
identificatori `R`/`C`/`INV`/`P` usati in qualunque documento hanno la loro riga. La terza direzione,
quella che D016 aveva insegnato a fare, ha trovato ciò che per costruzione nessun conteggio poteva
vedere: **«i file `rules.ts` contengono solo funzioni pure»** ([convenzioni.md](../convenzioni.md))
è un confine architetturale vero, senza ID e senza riga, tenuto dalla review su due file. Con esso
i quattro nomi di file che le stesse convenzioni affidano alla review. La settima voce di
[tracciabilita.md](../tracciabilita.md) adesso lo dice, e il grilletto è nel registro YAGNI.

**11. Gli ADR `Proposta` passano da otto a tre, e il motivo di 0010 andava affilato.** Promossi
**0008**, **0012**, **0013**, **0014** e **0015**, ognuno dopo aver visto scattare il proprio
meccanismo. Restano `Proposta` **0022** e **0023**, che descrivono cose non ancora costruite, e
**0010**, che questa delega dava già per «no» ma con la ragione sbagliata: non è che manchi il
meccanismo, è che ne esiste **metà**. `boundedList<T>(max)` è l'unico costruttore e `max` è
obbligatorio — quella parte è 🔒 dal D002. La terza frase della decisione, «il validatore del
salvataggio rifiuta un array che supera il `max`», non ha niente da validare: nel payload della
versione 1 non c'è nessun array. Mezza decisione imposta non è una decisione in vigore, e la
distinzione conta perché dice **cosa** manca. Vale la pena notare che 0008 e 0015 erano approvati
dall'utente dal 2026-08-19 e imposti da un test da D001: la riga di stato era stantia da quindici
deleghe, e nessun meccanismo poteva accorgersene.

## Trappole per chi legge dopo

- **A17 comincia adesso.** Il kernel è pagato, la fetta è verde, e la prossima riga di questo
  documento è la fetta 02. È esattamente il punto in cui il progetto precedente ha aperto
  ventiquattro sistemi.
- **«Verificato» non vuol dire «guardato».** Il passo 2b è passato per verde in D015 e per «vero
  ma per 400 ms» qui, e la differenza non è stata l'attenzione: è stato un compositore. Quando una
  verifica manuale dà un risultato diverso da quella di prima, la prima domanda è cosa è cambiato
  nell'ambiente, non chi ha sbagliato.
- **Un round-trip che confronta i payload non prova che la partita torni.** Lo stato salvato è
  dato; il gioco è dato **più** ciò che il `load` ricostruisce — i modificatori, in questo caso.
  Il primo rosso della tabella qui sopra è tutta la differenza fra le due cose.
