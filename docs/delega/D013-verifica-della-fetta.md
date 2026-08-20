# D013 — Verifica della fetta (STOP 2)

- **Stato:** Aperta — **preparata per l'esecuzione il 2026-08-20**, con la fetta 01 davanti
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

- [ ] `npm run verify` verde, con l'**output incollato** — non riassunto, non parafrasato
- [ ] `npm run verify:release` verde: da D011 il renderer compila, e deve continuare a farlo
- [ ] gli otto passi manuali sopra, eseguiti davvero, con le due avvertenze rispettate
- [ ] `tests/save/game-roundtrip` esiste e passa su una partita **giocata**, non costruita a mano
- [ ] ogni test nuovo è stato rotto di proposito almeno una volta, per verificare che possa fallire
- [ ] `docs/tracciabilita.md`: nessuna riga ha un meccanismo che non esiste — verificato aprendo i
      file, non fidandosi della tabella
- [ ] `docs/roadmap-fette.md`: la fetta 01 è marcata conclusa; il registro YAGNI è aggiornato con
      ciò che è stato tentato e rimandato **durante** il lavoro
- [ ] tutte le deleghe della fetta — da D001 a D012, più D014 e D015 — sono `Chiusa`, con il commit
      annotato **e il ramo unito a `main`**
- [ ] gli ADR imposti dal codice sono `Accettata`; quelli ancora non imposti restano `Proposta`, e
      si dice quali e perché
- [ ] `README.md` alla radice esiste e sta in 20 righe

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
