# ADR 0036 — I cheat di sviluppo passano dalle porte del gioco, e vivono in un registro

- **Stato:** **Accettata** — [D029](../delega/D029-i-devcheat.md): `contracts/cheats.ts`,
  `kernel/Cheats.ts`, i tre file che dichiarano i cheat, `runtime/cheats.ts`,
  `components/dev/DevPanel.vue`, e la regola **R20** con `tests/rules/cheats-are-dev-only`, rotta di
  proposito in tre modi. La sparizione dal pacchetto di rilascio è una **misura**, ed è in fondo a
  D029
- **Data:** 2026-08-21

## Contesto

Provare a mano un gioco idle costa tempo che non è tempo di sviluppo: per vedere il muro del caveau
bisogna riempirlo, per vedere il potenziamento bisogna guadagnarselo, per vedere il rifiuto di una
capienza bisogna arrivarci. Ogni schermata nuova si paga due volte — una a scriverla e una a
metterla nello stato in cui vale la pena guardarla.

La strada consueta è un pannello di scorciatoie, e la strada consueta è anche il modo in cui
[rischi.md](../rischi.md) descrive il ritorno del difetto **A05** — «denaro scritto da più punti» —
con parole sue: _«esporre la Map dei saldi per comodità di debug»_. Un pannello che scrive i saldi
non è un pannello: è una seconda porta del denaro, e la seconda porta è ciò che l'
[ADR 0003](0003-ledger-unica-porta-del-denaro.md) esiste per non avere.

Ci sono poi tre modi più silenziosi di sbagliarlo:

- **La seconda lista.** Un pannello che elenca i propri pulsanti a mano è la lista scritta a mano
  che l'[ADR 0002](0002-registry-unica-lista-di-sistemi.md) ha tolto ai sistemi. Con tre domini non
  si nota; con diciassette è il difetto A02 daccapo.
- **Il `if (dev)` sparso.** Una guardia ripetuta in dieci file è una difesa che tiene finché
  qualcuno non ne dimentica una — e chi la dimentica non se ne accorge, perché in sviluppo funziona
  tutto uguale.
- **Il cheat che aggira le regole.** Un pulsante che scrive «contanti = 1.000.000» costruisce uno
  stato che il gioco non sa produrre. Non è teoria: è esattamente lo stato che ha bloccato
  l'ambiente di sviluppo di questo progetto per due giorni, e che
  [D028](../delega/D028-una-capienza-ferma-chi-sale.md) è esistita per rendere sopravvivibile.

## Decisione

**I cheat di sviluppo passano dalle porte del gioco**, vivono in un **registro** che non ne conosce
nessuno, e sono raggiungibili da **un solo ramo** che il compilatore sa spegnere.

Tre metà, e ognuna toglie uno dei modi di sbagliare:

1. **Un cheat non ha più poteri di un comando.** Il denaro si muove con `Ledger.transaction`, lo
   stato di un dominio con il `load` che quel dominio ha già. Quindi ogni transazione somma a zero
   (INV-08), ogni capienza è rispettata (INV-23), ogni movimento porta la propria ragione — che è
   `reason.cheat.grant` o `reason.cheat.drain`, quindi **compare nel registro delle operazioni**.
   Non c'è denaro invisibile. Ciò che salta è la fatica, non la regola: regalare contanti a caveau
   pieno viene rifiutato, e chi vuole più contanti amplia prima il caveau, come farebbe il
   giocatore.
2. **Chi ha qualcosa da barare lo dichiara nel proprio file**, e il registro non ne conosce nessuno.
   `kernel/Cheats.ts` non importa un dominio, non nomina il denaro, non sa che esiste un caveau: è
   il `Registry` applicato a un secondo problema. A metterli insieme è `runtime/cheats.ts`, che è il
   livello con tutti i capi sotto mano ([ADR 0024](0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)),
   e il prezzo accettato è lo stesso del bootstrap: un pezzo nuovo con dei cheat non funziona finché
   non ha la sua riga lì.
3. **La domanda «siamo in sviluppo?» ha una risposta sola**, e sta nel bootstrap del renderer. Il
   core non sa in che ambiente gira ([ADR 0001](0001-simulazione-nel-renderer-core-puro.md)) e non
   deve impararlo per questo. `import.meta.env.DEV` è sostituito dal compilatore, quindi in un
   pacchetto di rilascio quel ramo è `false` e tutto ciò che era raggiungibile solo da lì esce dal
   bundle.

Ne discende una regola con un ID e un test:

- **R20** — nessun file nomina un modulo dei cheat con un import di **valore** fuori dai posti
  dichiarati, `import.meta.env` è letto da due file soli, e ogni `CheatId` dichiarato è registrato
  (e nessuno di più). `tests/rules/cheats-are-dev-only` lo impone.

Il pannello sta nel **livello superiore** ([ADR 0032](0032-le-sovrapposizioni-stanno-nel-livello-superiore.md))
e **non è una schermata**: nessuna voce nella colonna, nessuna riga in `SCREENS`. Le destinazioni
sono i posti dove il gioco si amministra ([ADR 0033](0033-un-dominio-ha-una-cartella-e-una-pagina.md)),
e questo non è gioco — serve **mentre** si guarda un'altra cosa.

## Alternative scartate

- **Scrivere i saldi direttamente.** È la via rapida, ed è A05 con una buona scusa. Costerebbe anche
  la fiducia in due invarianti: la somma a zero e le capienze non sarebbero più proprietà del
  Ledger, ma proprietà del Ledger _quando nessuno ha premuto il pannello_.
- **Un file `cheats.ts` unico che importa tutti i domini.** Sembra «centralizzato», che è la parola
  che l'utente ha usato, e infatti la decisione la rispetta — ma centralizzato è il **registro**,
  non le dichiarazioni. Un file che importa tutti i domini è il nodo a stella che l'ADR 0002 ha
  tolto, e con quindici domini sarebbe l'unico punto che va toccato quindici volte.
- **Un `CheatId` stringa libera.** Toglie un file da toccare per ogni cheat nuovo, e toglie anche
  due cose: che un cheat non possa esistere senza etichetta in tutte e due le lingue, e che un id
  scritto male non compili invece di comparire come pulsante muto. Un pannello di cheat è **fatto**
  di etichette, quindi il baratto è a favore dell'unione — lo stesso di `Reason`.
- **Un campo di testo per l'importo, invece di cifre pronte.** Costa una conversione stringa →
  `Money` dentro un `.vue`, cioè l'unica funzione di `contracts/` che un componente chiamerebbe, e
  apre un percorso di errore («che succede se scrivo `abc`?») da progettare. Quattro ordini di
  grandezza in un clic coprono ciò che serve, e sono dichiarati **dal cheat**, che è chi sa quali
  cifre lo provano. Il grilletto per cambiare idea è il primo cheat il cui valore utile non è un
  ordine di grandezza.
- **Una voce «Dev» nella colonna.** Sarebbe una destinazione, cioè un posto dove si amministra
  qualcosa del gioco, e questo non lo è. Costringerebbe anche a mettere una riga in `SCREENS` e in
  `DOMAIN_SCREENS` — due elenchi che descrivono il **gioco** — e a spegnerla in rilascio, cioè a
  ripetere l'interruttore in un secondo posto.

## Conseguenze

- **Il codice dei cheat non entra nel pacchetto di rilascio, ed è misurato**: `createCheats`,
  `ledgerCheats`, `vaultCheats` e le due classi d'errore del registro compaiono **zero** volte nel
  bundle compilato, e `DevPanel` è `null` senza che il suo chunk venga emesso. Il metodo e i numeri
  stanno in fondo a [D029](../delega/D029-i-devcheat.md).
- **Le etichette invece restano**, e sono otto per lingua più tre del pannello: `CheatId` entra in
  `MessageKey`, quindi vive nel dizionario di rilascio. È il prezzo dichiarato per non avere un
  secondo dizionario che esiste solo in sviluppo e invecchia da solo. Chi lo trovasse troppo caro
  ha una strada: un dizionario dei cheat separato, con la propria prova di parità.
- **Espandere è una riga per pezzo**: il file dei cheat nel proprio dominio, gli id nell'unione, le
  parole nei due dizionari, e la riga in `runtime/cheats.ts`. Tre dei quattro passi sono imposti dal
  compilatore o da un test; il quarto è l'unico che si può dimenticare, ed è la stessa riga che
  `createGame` chiede per un sistema.
- **Un limite, dichiarato:** questa decisione non difende dal giocatore. Un file di salvataggio si
  può manomettere e [rischi.md](../rischi.md) dice che è giusto così — è un singleplayer offline.
  Ciò che R20 difende è che i cheat non finiscano nel prodotto **per distrazione**, e che il
  pannello non diventi la seconda porta del denaro.
- **Un secondo limite:** R20 guarda la forma del sorgente, non i byte del pacchetto. Un cambio di
  bundler o di configurazione può rompere la sparizione senza rendere rosso niente. Il rimedio è la
  misura, che va rifatta quando si tocca la compilazione — ed è scritto invece che sperato.
