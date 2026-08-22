# Passaggio di consegne

Per chi prende in mano Solvent adesso — persona o agente. Si legge in dieci minuti e basta a
ripartire senza fare domande.

## Cos'è Solvent

Idle/tycoon finanziario per desktop. Electron + Vue 3 + TypeScript + Pinia + Vitest.

È la ricostruzione da zero di un progetto precedente (`finanx`, ~104.000 righe) di cui esiste un
audit con **17 difetti misurati**. Quel repo si usa **solo come catalogo di idee di gioco**: mai
copiarne codice, struttura di cartelle o pattern — sono esattamente ciò che ha fallito.

Il gioco ruota attorno a una tensione sola: **contanti contro carta**. Anonimi ma limitati contro
tracciabili ma illimitati. Ogni dominio — black market, prestiti, casinò, immobiliare — è un modo
diverso di viverla. Senza quella tensione, diciassette domini sono diciassette pulsanti che alzano lo
stesso numero.

Non c'è un'attività principale e non c'è una progressione: è una **sandbox**. Nessun dominio si
sblocca — ognuno dichiara un requisito, e il giocatore lo soddisfa quando ci riesce, nell'ordine
che si costruisce da sé. A impedire che uno strumento diventi la risposta a ogni domanda non è una
fase del gioco: è che ognuno **satura**, e che ognuno paga in almeno una fra liquidità,
tracciabilità, varianza e attenzione.

La struttura che regge tutto questo — l'etichetta a nove voci, la legge della non dominanza, le
quattro forme di saturazione — e la profondità di ogni dominio stanno in
[prodotto/visione.md](../prodotto/visione.md), riscritta il 2026-08-20. **Se hai in mente le quattro
ere, quel documento è cambiato sotto di te:** le ere non esistono più come struttura di gioco, e
sopravvivono solo come lettura interna in [roadmap-fette.md](../roadmap-fette.md).

## Dove siamo, esattamente

|                          |                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| STOP 1                   | **approvato** — nome, stile visivo, le tre dipendenze di runtime, la simulazione nel renderer                                                                                                                                                                                                                     |
| STOP 2                   | **riportato** da [D013](D013-verifica-della-fetta.md): la fetta 01 è conclusa e verificata, otto passi manuali su otto                                                                                                                                                                                            |
| Deleghe                  | quali sono chiuse e quali aperte lo dice [stato.md](../stato.md); **l'ordine in cui si eseguono** è il grafo in [README.md](README.md)                                                                                                                                                                            |
| Kernel                   | **finito** (D003–D008) — le righe le conta [stato.md](../stato.md), con il metodo scritto nel codice che le conta                                                                                                                                                                                                 |
| Persistenza nel main     | **finita** — lo schema eseguito, la scrittura atomica, i tre canali IPC                                                                                                                                                                                                                                           |
| Domini                   | tre: `income` ha stato e ticchetta, `vault` ha stato e **non** ticchetta, `atm` è due comandi. Da D026 ognuno ha la sua pagina, e da D033 il bancomat ha la **sua**: la `home` non esiste più, al suo posto ci sono `atm` e `board`                                                                               |
| Schede di dominio        | da D018 il modulo è [design/domini/README.md](../design/domini/README.md), e i tre domini che esistono l'hanno compilato                                                                                                                                                                                          |
| Le regole                | la mappa completa, con la forza di ciascuna, è [tracciabilita.md](../tracciabilita.md)                                                                                                                                                                                                                            |
| `npm run verify`         | **verde**; i tempi, con la data accanto, stanno in [qualita.md](../qualita.md)                                                                                                                                                                                                                                    |
| `npm run verify:release` | **verde** — il renderer compila; il peso, con la data accanto, sta in [qualita.md](../qualita.md) e non si ripete qui                                                                                                                                                                                             |
| `main`                   | **è il punto di partenza, e stavolta davvero.** Il 2026-08-21 tutti i rami di lavoro sono stati fusi con un `--ff-only` e cancellati: ne resta **uno solo**, e `git branch` lo dice in una riga                                                                                                                   |
| `origin/main`            | **allineato.** Il 2026-08-21 sono stati spinti in un colpo i cinquantotto commit che mancavano dal 2026-08-20. Che sia ancora vero non si scrive qui: lo dice `git rev-list --count origin/main..main`                                                                                                            |
| Albero di lavoro         | non si scrive qui, per la ragione della riga sopra: lo dice `git status`. Alla chiusura del 2026-08-22 [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md) e i documenti che la accompagnano sono stati **committati**, e l'albero è tornato pulito — vedi _Cosa c'è nell'albero di lavoro alla chiusura_ |
| Prossimo passo           | **[D034](D034-le-serie-degli-strumenti.md)**, i grafici, che **ha una decisione aperta** e non si esegue prima di averla presa. [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md) è chiusa. La fetta 03 dopo                                                                                            |

> **Il lavoro non è più solo su questa macchina.** Per due settimane `origin/main` è rimasto fermo
> al 2026-08-20, al commit `84dbe47`, e questa riga era un avvertimento. Il 2026-08-21 i
> **cinquantotto** commit che mancavano sono stati fusi e spinti in un colpo, dopo che
> `npm run verify` e `npm run verify:release` erano verdi **su `main` fuso**, non solo sul ramo di
> lavoro.
>
> Nello stesso passaggio i **trentasette** rami di lavoro sono stati cancellati con `git branch -d`,
> che si rifiuta di cancellare un ramo con lavoro non fuso: nessuno si è rifiutato, il che è la
> prova che non c'era lavoro unico da nessuna parte. Ne resta uno, `main`.
>
> **Perché la riga resta invece di sparire:** che il lavoro sia spinto è una condizione, non un
> fatto acquisito. Chi legge lo verifichi invece di crederci — costa un comando:
>
> ```bash
> git rev-list --count origin/main..main
> ```
>
> Se non è zero, siamo di nuovo nella situazione che questa riga descriveva. Un `push` è visibile
> agli altri e non si disfa pulendo: resta una di quelle cose che si chiedono.

## La sessione del 2026-08-22: D033 chiusa, un audit, D035 scritta

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. **Questa è la più
recente**: tutte le sezioni sotto descrivono stati già superati, e si leggono come storia.

**Cosa è stato chiuso.**

| Delega                                   | Cos'era                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| [D033](D033-il-bancomat-e-una-pagina.md) | la home faceva due lavori; adesso il bancomat è una pagina e il cruscotto un'altra |

**Non spezzata**, e la sua intestazione chiedeva di dichiararlo: non esiste uno stato intermedio che
compili — `home` sparisce solo se `atm` e `board` esistono nello stesso commit. Ha portato l'
[ADR 0040](../adr/0040-il-bancomat-e-il-cruscotto-sono-due-pagine.md) e **il primo `Superata` del
progetto**, l'[ADR 0018](../adr/0018-la-home-e-un-atm.md), più diciassette correzioni rispetto a
com'era scritta.

Poi la sessione ha fatto una cosa di specie diversa: **un audit dell'intera codebase**, da cui è
nata [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md), scritta e non eseguita.

### Le sei cose che chi arriva adesso deve sapere

**1. Il salvataggio ha un tetto, ed è a 1e21 €.** `decimal.js` ha `toExpPos = 21`: oltre quella
cifra `toString()` scrive `1e+21`, e il regex dello schema di salvataggio rifiuta quella forma.
`SaveStore` torna `error.save.invalid` **prima** di toccare il disco, la partita va in `failed` con
fase `saving`, e da lì la finestra non si chiude. Misurato attraverso Ledger e schema veri; a 1e20
passa. **Non si incontra giocando** — a 18,00 €/s servirebbero 5,5e19 secondi — ma la
[visione](../prodotto/visione.md) dichiara un bersaglio a ~1e30, e l'
[ADR 0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md) certifica come misurata una soglia
di 1e37. È il punto 1 di D035.

**2. Il renderer non era minificato, e la causa non era nostra.** `electron-vite` imposta
`minify: false` come default del preset del renderer, e chi non lo scrive lo eredita. **Il dubbio
che [D030](D030-il-contenuto-scorre-nel-telaio.md) aveva aperto e che tre deleghe si sono passate
è chiuso**, e non era una configurazione del bundler da trovare: era un default da dichiarare.
Misurato, il pacchetto **dimezza**. E il numero che conta: ApexCharts pesa **931 kB**, non i ~1.815
che [qualita.md](../qualita.md) dichiara — cioè più del triplo di tutto il resto
dell'applicazione messo insieme. È il punto 2 di D035, e rende la decisione dell'
[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md) più contestabile di prima, non meno.

**3. Il pacchetto di rilascio porterebbe due volte ciò che è già nel bundle.** `apexcharts`,
`decimal.js` e i due `@fontsource` stanno in `dependencies` ma il renderer li impacchetta tutti:
solo `zod` è davvero esterna, e a dirlo è l'output compilato del main, non il sorgente. Sono circa
22 MB. `vue`, `pinia` e `vue-i18n` stanno **già** in `devDependencies` per questa ragione, quindi è
un'incoerenza dentro lo stesso file. È il punto 3 di D035.

**4. La classe di difetto che questo progetto dichiara scoperta ha colpito di nuovo, subito.**
D033 ha cancellato la schermata `home` e ha ripulito il codice con un commit apposta — e i
documenti vivi la nominano ancora in sette punti. Il peggiore: in
[preferenze.md](../prodotto/preferenze.md) D033 ha riscritto il **corpo** di P3 e ha lasciato in
piedi il **titolo** che afferma il contrario. Nessun gate può vederlo, ed è scritto in fondo a
questa pagina da prima. Sono i punti 4, 5 e 6 di D035.

**5. Una decisione è stata rimandata dall'utente, e non è dimenticata.** Il confine di
presentazione converte `Money` in `number`, cioè in float64: da ~1e14 € gli importi a schermo
perdono il centesimo — `99999999999999,99` esce come `…,98` — mentre il Ledger resta in equilibrio.
Le tre strade sono un formattatore proprio sulla stringa, `BigInt` con i centesimi, o una notazione
compatta oltre una soglia; la terza cambia come il gioco si legge, quindi è una decisione di
prodotto. Sta in _Fuori scope_ di D035 con scritto che è rimandata: **chi esegue quella delega non
la riapra di iniziativa propria.**

**6. Cosa l'audit NON ha trovato, che vale quanto ciò che ha trovato.** Zero problemi di sicurezza,
verificati invece che supposti: le tre difese di Electron accese, il preload a tre funzioni, nessun
`innerHTML`, nessun `v-html`, nessun `eval`, nessun collegamento esterno, la scrittura
temporaneo-`fsync`-`rename`, lo schema `zod` eseguito, `npm audit` a zero. E il kernel, i contratti,
i domini e la persistenza non hanno prodotto **un solo** reperto di correttezza oltre a quello sulla
scala. Sei reperti su nove stanno fuori da `src/`.

### Come è stato fatto l'audit, e perché conta per il prossimo

Il metodo è la parte riusabile, e senza di essa il prossimo audit ricomincia da zero.

**Non si cercano le classi che un gate già sorveglia.** Questa codebase ha una cintura di test di
regola strutturale — l'elenco sta in [tracciabilita.md](../tracciabilita.md) — e cercarci dentro le
classi che quei test impediscono è tempo speso a riscoprire che funzionano. L'audit ha guardato
**solo** dove nessun gate guarda: la semantica, i confini numerici, la configurazione di rilascio, e
la coerenza fra i documenti vivi e il codice. È la ragione per cui sei reperti su nove stanno fuori
da `src/`.

**Ogni reperto è stato dimostrato eseguendo, non leggendo.** Il tetto del salvataggio con una sonda
che attraversa Ledger e schema veri; la minificazione compilando due volte e confrontando; il peso
di ApexCharts isolandola in un chunk suo; il difetto del loop con un `schedule` finto. Le sonde
vivevano in file temporanei sotto `tests/`, cancellati alla fine — l'albero è tornato pulito e la
suite è tornata al conto di partenza.

**E una trappola dello strumento che vale la prossima volta:** `npm run verify 2>&1 | tail -40`
restituisce il codice d'uscita di `tail`, non di `verify`. La prima esecuzione dell'audit è sembrata
verde mentre `tsc` non era nemmeno installato. Si redirige su file e si legge `$?`, oppure non si
mette niente dopo la pipe.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **`npm run verify` verde**, e il conto dei test è quello di partenza: le sonde dell'audit sono
  state cancellate. `npm run build` verde. `npm audit` a zero vulnerabilità.
- **Nessun residuo di debug**, nessun file temporaneo: `git status` vede solo il lavoro voluto.
- **D035 è scritta e non eseguita**, insieme all'aggiornamento del grafo e dell'indice in
  [README.md](README.md) e a [stato.md](../stato.md) rigenerato. Sta in `78de846`.
- **Dopo D033 sono stati fatti due commit di documentazione**: `78de846` porta D035, il grafo e
  `stato.md`; `b7e050a` porta questa pagina. Queste due righe dicevano il contrario — sono state
  scritte mentre l'albero era ancora sporco, e committate nello stesso commit che le smentiva.
- **Il codice di gioco non è stato toccato dall'audit.** Nessun fix è stato applicato: D035 li
  descrive tutti e non ne esegue nessuno.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto.

1. **La tabella delle regole in [architettura.md](../architettura.md) si ferma a R19**, e adesso è
   indietro di tre righe da due sessioni. R20, R21 e R22 stanno in
   [tracciabilita.md](../tracciabilita.md), che è l'elenco autorevole. **D035 non la copre**, ed è
   una scelta: quella delega raccoglie i reperti dell'audit, e questo era già censito prima. Costa
   tre righe e sta bene accanto al suo punto 4, se chi esegue vuole prendersela.
2. **Nessuna misura della catena a macchina scarica.** Resta aperta da due sessioni. Il numero
   preso oggi — a macchina scarica, senza finestra di sviluppo — è nettamente più basso di quello
   in [qualita.md](../qualita.md), il che conferma la diagnosi scritta lì: il minuto non lo pagavano
   i test. Va rimisurato con metodo e scritto una volta, non dedotto da qui.
3. **Gli script CDP vivono ancora nello scratchpad**, quindi la prossima sessione li riscrive per
   la terza volta. Metterli in `scripts/` è una decisione che nessuno ha ancora preso.
4. **Il peso del renderer in [qualita.md](../qualita.md) è di D027 e non è stato rimisurato da
   D033.** Non è stato corretto qui perché il punto 2 di D035 lo rimisura comunque, e farlo due
   volte vorrebbe dire scriverci sopra un numero che vive un giorno.

### Due decisioni prese scrivendo D035, e perché

- **Sette reperti in una delega sola, non tre.** Il precedente è [D016](D016-correzioni-audit.md),
  che ne assorbì diciassette da un audit; l'alternativa era spezzare per radice, come fecero D021 e
  D022. Il titolo dice la ragione: tutti e sette sono «una decisione che nessuno ha preso l'ha presa
  qualcun altro», e separarli avrebbe nascosto proprio la cosa che li rende un problema solo.
- **La decisione del router è rimasta aperta dentro la delega**, con le due opzioni e il trade-off,
  invece di essere risolta scrivendo. La riga del registro YAGNI porta un grilletto — «la terza
  destinazione con una gerarchia» — che potrebbe essere scattato tre destinazioni fa, e deciderlo
  scrivendo una delega sarebbe prendere in autonomia una decisione sull'architettura del renderer.

## La seconda sessione del 2026-08-21: due deleghe chiuse, tre scritte

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione. Il giorno è lo stesso
della sezione qui sotto, ed è la ragione per cui portano un numero. **Non è più la più recente:**
sopra c'è la sessione del 2026-08-22, e questa descrive uno stato già superato.

**Cosa è stato chiuso.**

| Delega                                                | Cos'era                                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| [D032](D032-la-commissione-scala-il-pavimento-no.md)  | la commissione del bancomat era fissa, e a certe cifre smetteva di esistere       |
| [D031](D031-la-sovrapposizione-e-un-pezzo-del-kit.md) | il pannello dei cheat non si chiudeva, e la sovrapposizione era scritta due volte |

Più **tre deleghe nuove scritte**: D032 (poi eseguita), [D033](D033-il-bancomat-e-una-pagina.md) e
[D034](D034-le-serie-degli-strumenti.md). Ognuna delle due chiuse ha portato il proprio ADR —
[0038](../adr/0038-la-commissione-scala-il-pavimento-no.md) e
[0039](../adr/0039-una-sovrapposizione-passa-dal-kit.md) — più l'accettazione dell'
[ADR 0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md), che aspettava un grilletto da
agosto, e la regola **R22**, rotta di proposito.

### Le cinque cose che chi arriva adesso deve sapere

**1. Le tre domande sul bancomat hanno risposta.** Non vanno più poste: stanno qui sotto, in _Le tre
domande, e cosa ha risposto l'utente_. Riproporle sarebbe far rifare una decisione già presa.

**2. Il pannello dei cheat si chiude, e la causa era una riga di CSS.** `.panel { display: flex }`
su un elemento con `popover`: una regola d'autore vince su quella del motore a qualunque
specificità, quindi il riquadro restava visibile anche chiuso. Per due stesure la colpa era stata
data alla meccanica di apertura, che era giusta tutte e due le volte. Adesso la meccanica vive in
`UiPopover`, e **R22 impedisce a chiunque altro di avere in mano un elemento con `popover`**.

**3. La commissione del bancomat non è più un numero.** È `max(pavimento, importo × tasso)`, con due
tassi asimmetrici — 1,5% versando, 2,0% prelevando — e un pavimento a 2,50 €. Ne discende che
`store.atmFee` **non esiste più**: chi vuole sapere quanto costa un'operazione chiede un'anteprima.
Un test verifica l'**assenza**, perché rimetterlo in buona fede è facile.

**4. La precisione del denaro è passata da 20 a 40 cifre**, ed è l'ADR 0026 eseguito come era
scritto. Non ha reso rosso nessuno degli ottocento test esistenti — misurato, non sperato — e le due
soglie che quell'ADR prevedeva sono esatte: il centesimo esiste fino a 1e37, `transfer()` smette di
bilanciare da 1e40.

**5. La catena dei gate ha passato il minuto.** 66 s con 814 test, contro i 51,6 s con 794 di D030.
**Il minuto non lo pagano i venti test nuovi**: sono cresciuti del 2,5% e la catena del 28%. Le due
misure sono state prese con la finestra di sviluppo aperta, e nessuna delle due è il numero a
macchina scarica — che nessuno ha ancora preso. Il dettaglio è in [qualita.md](../qualita.md).

### Le tre domande, e cosa ha risposto l'utente

Erano le tre che la sessione precedente aveva lasciato aperte. **Sono chiuse**, e le risposte hanno
già prodotto D033 e D034.

| Domanda                                   | Risposta                                                                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| La home fa due lavori: restano insieme?   | **No.** Si segue l'artboard `ATM` del canvas, funzionalità **e** disegno. L'ADR 0018 va superato — è D033                                          |
| Si adotta la carta del canvas?            | **Sì**, quella nera con numero, intestatario e scadenza                                                                                            |
| Si prepara la forma del gioco più grande? | **No**, non la striscia a sei voci. Ma i **grafici** sì, e più di quanti il canvas ne disegni: candele per contanti e carta, un'area per il totale |

**Una quarta risposta, non richiesta e più importante delle tre:** _«quando si arriva ai milioni a
chi frega di 2 €?»_ — è la frase da cui è nata D032, e ha corretto un difetto di gioco che nessun
documento aveva visto.

**Una quinta, sul reddito:** «va studiato bene perché porta funzionalità e/o guadagni potenzialmente
core, quindi sarà fatto a parte in un futuro vicino». Non si tocca finché non arriva la sua fetta.

### Le due decisioni prese dentro D031, e perché

Erano dichiarate «da non risolvere in autonomia». L'utente le ha delegate con dei criteri —
«coerenza, zero debiti futuri, professionalità, stato dell'arte, non pigrizia, non necessariamente
la soluzione più invasiva» — e sono state prese così:

- **Un pezzo solo, `UiPopover`, e `UiTooltip` ci si appoggia sopra.** La ragione decisiva non è
  quella che la delega prevedeva («se restano due, fra sei mesi sono quattro»): è che `UiTooltip`
  non era rotto **per fortuna** — non gli era servito scrivere `display`. Una regola rispettata per
  caso non è una regola.
- **Niente `UiMenu`.** Avrebbe **zero** chiamanti contro i due che il kit richiede (D023): il
  pannello dei cheat è un elenco di pulsanti, e il menu contestuale del canvas non ha una riga di
  codice. Il grilletto è scritto nell'ADR 0039: il primo menu vero.

### Cosa c'è nell'albero di lavoro alla chiusura

Verificato con i comandi, non ricordato.

- **Niente di non commesso**: `git status` è vuoto, `git stash list` è vuoto, nessun file non
  tracciato.
- **`npm run verify` verde** — 77 file, **814 test**. **`npm run verify:release` verde**, renderer a
  2.450,46 kB (sempre non minificato: il dubbio di D030 resta aperto e non è stato toccato).
- **Nessun residuo di debug** nel diff della sessione: `console.log`, `debugger`, `TODO` — zero.
- **Cinque commit** su `d031-la-sovrapposizione-e-un-pezzo-del-kit`, che discendeva da
  `d032-la-commissione-scala-il-pavimento-no`, che discendeva da
  `d030-il-contenuto-scorre-nel-telaio`. **Quei rami non esistono più**: vedi il punto qui sotto.
- **Tutto è stato fuso in `main` e spinto**, ed è l'ultima cosa fatta in questa sessione. Un
  `--ff-only`, `verify` e `verify:release` verdi **su `main` fuso**, poi il `push`. Poi i
  trentasette rami di lavoro cancellati con `git branch -d` — quello che si rifiuta se il lavoro
  non è fuso: **nessuno si è rifiutato**, e questa è la prova che non c'era lavoro unico da nessuna
  parte. Resta `main`, allineato con `origin/main`.
- **Il ramo `d030-il-contenuto-scorre-nel-telaio` non punta più al commit di chiusura di D030.** I
  documenti delle tre deleghe nuove sono stati commessi stando su di lui, quindi l'etichetta è
  avanzata a `383c94b`. La delega D030 dichiara `1f3a0e1`, che è ancora nella storia ed è il commit
  giusto: è l'etichetta a essersi spostata, non il commit a essersi perso.

### Cosa questa sessione ha lasciato indietro

Censito, non nascosto.

1. **La tabella delle regole in [architettura.md](../architettura.md) si ferma a R19.** R20, R21 e
   R22 non ci sono. Le prime due mancavano già prima di questa sessione, la terza è di oggi.
   L'elenco autorevole è [tracciabilita.md](../tracciabilita.md), che le ha tutte e tre: quella
   tabella è un riassunto, e adesso è indietro di tre righe. Non è stato corretto qui perché
   riguarda anche lavoro non di questa sessione, e correggerlo durante una chiusura è lavoro nuovo.
2. **Gli script CDP vivono nello scratchpad, quindi la prossima sessione li riscrive.** Questa li ha
   riscritti da zero e ha ripagato due volte le stesse trappole. Il **metodo** è descritto in _Come
   si guarda l'applicazione senza toccarla_; il **codice** no. Metterli in `scripts/` è una
   decisione che nessuno ha preso.
3. **Nessuna misura della catena a macchina scarica.** Vedi il punto 5 qui sopra: prima di
   ottimizzare qualcosa serve un numero preso senza la finestra di sviluppo aperta.

### Due vicoli ciechi, per non ripercorrerli

1. **Lo `Spazio` sintetico non attivava il pannello, e sembrava un difetto di accessibilità.** Non
   lo era: l'evento CDP mandava `key: 'Space'` invece di `key: ' '`, quindi il motore non
   sintetizzava il clic. A dirlo è stato un controllo preso **nello stesso ambiente** — lo stesso
   `Spazio` non attivava nemmeno l'interruttore del tema, che nessuno aveva toccato. È la lezione di
   [D030](D030-il-contenuto-scorre-nel-telaio.md) con un'altra faccia: una misura strana va
   confrontata con un controllo preso allo stesso modo.
2. **`Page.reload` via CDP chiude l'applicazione di sviluppo.** Provato una volta, il server è
   uscito con codice 0. Per rileggere lo stato dopo una modifica conviene riavviare `npm run dev`,
   non ricaricare la pagina da fuori.

**E una trappola dello strumento che costa dieci minuti se non la si sa:** la porta 5173 può restare
occupata da un'istanza precedente, e allora `electron-vite` passa alla 5174 **in silenzio**. Uno
script CDP che filtra i bersagli sul numero di porta non trova più niente, e sembra che
l'applicazione non sia partita. Si filtra su `localhost`, non sul numero.

## La **prima** sessione del 2026-08-21: tre deleghe chiuse, due cose aperte

Scritta chiudendo quella sessione, rileggendo il repo e non la conversazione.

**Cosa è stato chiuso, e perché ognuna esisteva.**

| Delega                                         | Cos'era                                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [D028](D028-una-capienza-ferma-chi-sale.md)    | un pool oltre la capienza rifiutava **ogni** transazione, comprese quelle che lo facevano scendere      |
| [D029](D029-i-devcheat.md)                     | i devcheat: costruire uno stato di gioco invece di aspettarlo, senza poter mentire su di esso           |
| [D030](D030-il-contenuto-scorre-nel-telaio.md) | la carta 3D passava sopra la testata scorrendo; adesso scorre solo il contenuto, dentro la propria area |

Ognuna ha portato il proprio ADR — [0035](../adr/0035-una-capienza-ferma-chi-sale.md),
[0036](../adr/0036-i-cheat-passano-dalle-porte-del-gioco.md),
[0037](../adr/0037-il-telaio-non-scorre-il-contenuto-si.md) — più l'invariante **INV-23** e le
regole **R20** e **R21**, ciascuna con il proprio test e ciascuna rotta di proposito almeno una
volta. `npm run verify` è **verde**; il conto dei test e il tempo della catena stanno in
[qualita.md](../qualita.md), con la data accanto, ed è l'unico posto in cui si scrivono.

**Le tre cose che chi arriva adesso deve sapere, e che nessun'altra pagina dice:**

1. **La partita di sviluppo non è più murata viva.** L'avvertenza in fondo a
   [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md) — 903.359,30 € di contanti contro una
   capienza di 1.000,00 €, quindi ogni transazione rifiutata e ogni grafico piatto — **non vale
   più**: con INV-23 quel saldo può scendere, quindi deposito, prelievo e ampliamento funzionano di
   nuovo, e il cheat «svuota i contanti» lo riporta dentro le regole senza toccare il file.
2. ~~**Il pannello dei cheat esiste e ha un difetto aperto.**~~ **Superato.** Il pannello si
   chiude da D031, e la causa era `.panel { display: flex }` su un elemento con `popover`. Il
   dettaglio sta nella sezione della seconda sessione, qui sopra.
3. **Il bancomat è rimasto a metà, ed è deliberato.** L'utente aveva chiesto di rifinire la home
   «secondo il canvas», poi di **non toccarla** finché non avesse puntualizzato lui. **Ha
   puntualizzato**: le tre domande qui sotto hanno risposta, e da lì è nata
   [D033](D033-il-bancomat-e-una-pagina.md). Non sono più «la prima cosa da chiedergli».

### Le tre domande aperte sul bancomat

> **Chiuse.** L'utente ha risposto a tutte e tre nella seconda sessione del 2026-08-21, e da quelle
> risposte sono nate [D033](D033-il-bancomat-e-una-pagina.md) e
> [D034](D034-le-serie-degli-strumenti.md). Le risposte stanno qui sopra, in _Le tre domande, e cosa
> ha risposto l'utente_. **Non vanno riproposte.** Il testo che segue resta perché le domande, come
> erano poste, spiegano perché quelle deleghe hanno la forma che hanno.

Nessuna era stata decisa, e nessuna andava decisa in autonomia: cambiano la forma di una schermata e
di un ADR in vigore.

1. **La home fa due lavori** — è la pagina del bancomat (carta, contanti, deposita/preleva) **e** il
   cruscotto (cinque riquadri, grafico, operazioni recenti). Il canvas invece tiene le due cose
   separate: la sua pagina `ATM` è a due colonne — a sinistra l'operazione, a destra la carta e le
   operazioni — e il cruscotto è una pagina a sé, `Board`. Restano insieme, e allora l'
   [ADR 0018](../adr/0018-la-home-e-un-atm.md) resta in vigore, oppure si separano e quell'ADR va
   superato?
2. **La carta del canvas è un'altra carta.** Nera con l'accento, numero, intestatario, scadenza, e
   sul retro «cosa fa questo strumento». Quella nel codice è oro e porta il solo saldo. Si adotta
   quella del canvas?
3. **Il canvas disegna un gioco più grande di quello che esiste** — una striscia di risorse in
   testa con sei voci (contanti, carta, fiche, crypto, calore, attenzione) e una colonna a cinque
   gruppi. Il codice ha due pool e quattro destinazioni. Ci si ferma a ciò che esiste, oppure si
   prepara la forma?

**Il canvas è già nel repo**, ed è lo stesso file che l'utente ha riconsegnato in quella sessione:
[design/mockups/solvent-canvas.dc.html](../design/mockups/solvent-canvas.dc.html) — verificato byte
per byte dopo la formattazione. Si legge **nel sorgente**, non solo guardandolo, ed è il metodo che
[il suo README](../design/mockups/README.md) descrive.

**Una cosa sul canvas che vale la pena sapere prima di aprirlo:** la sua testata usa `z-index: 20`.
Da R21 quel numero **non si può scrivere** in `src/`, e non è una contraddizione: il canvas è
l'autorità su come una schermata si **vede**, non su come è fatto il telaio. La ragione per esteso
sta nelle alternative scartate dell'[ADR 0037](../adr/0037-il-telaio-non-scorre-il-contenuto-si.md).

### Cosa c'è nell'albero di lavoro, e cosa non c'è

- **Niente di non commesso**: `git status` è pulito, `git stash list` è vuoto.
- **Sei commit su rami impilati**, e `main` non li ha. `d030-il-contenuto-scorre-nel-telaio` li
  contiene tutti: `git merge --ff-only d030-il-contenuto-scorre-nel-telaio` da `main` li porta a
  casa in un colpo. **Non è stato fatto**, perché fondere e spingere sono decisioni dell'utente.
- **`out/` contiene un `index.html` manomesso**: durante D030 ci è stato iniettato un `window.solvent`
  finto per guardare la schermata senza Electron. `out/` è ignorato da git e si rifà con
  `npm run build`, quindi non è un residuo — ma chi apre quel file e lo trova strano adesso sa
  perché.

### Un dubbio che questa sessione non ha sciolto — **e che l'audit ha sciolto**

`npm run build` produce un renderer **non minificato** — i commenti del sorgente sono ancora dentro
il bundle, ed è così che si è scoperto. Ne discende che i 2.437,92 kB dichiarati in
[qualita.md](../qualita.md) sono il peso di un pacchetto non minificato, non il peso di ApexCharts.
Non è stato toccato: è nel [registro YAGNI](../roadmap-fette.md) con il suo grilletto, e prima di
stringere qualcosa va saputo quanto pesa davvero la libreria, o si ottimizza il file sbagliato.

> **Sciolto il 2026-08-22.** Non era una configurazione del bundler da trovare: `electron-vite`
> imposta `minify: false` come **default del preset del renderer**, e chi non lo scrive lo eredita.
> Misurato, il pacchetto dimezza; ApexCharts pesa 931 kB e non i ~1.815 che quella sottrazione
> lasciava credere. Il dubbio è durato tre deleghe perché la domanda era posta al file sbagliato —
> si guardava l'output invece delle opzioni con cui era prodotto. Il rimedio è il punto 2 di
> [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md).

**Perché questa tabella non porta più i numeri.** Li portava, ed erano sbagliati: da
[D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) i fatti contabili stanno in un posto solo
e generato, [stato.md](../stato.md), e nessun documento vivo li ripete (regola C11). È la stessa
mossa del Registry contro le cinque liste: non si controlla che due cose coincidano, si fa in modo
che ce ne sia una sola.

I contratti sono in `src/core/contracts/`, Clock, Rng, Bus, Registry e Ledger in
`src/core/kernel/`, i numeri di gioco in `src/core/balance/`, lo schema del salvataggio e i tre
canali IPC in `src/main/save/`, i tre domini in `src/core/domains/`. In `src/renderer/` ci sono il
bootstrap, il loop, l'unico store, il guscio `App.vue`, le viste sotto `views/` — **una per
destinazione**, e INV-22 non ne ammette una in meno — e i componenti di gioco sotto `components/`,
che da [D026](D026-dove-si-attacca-un-dominio.md) **non è più piatta**: una cartella per
proprietario, e zero file sciolti. Quante siano non si scrive qui, ed è la lezione di
[D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) applicata a un punto in cui aveva già
morso due volte: questa riga ha detto «quattro viste» dopo che D033 ne aveva fatte cinque, e
«cinque cartelle» dopo che D029 ne aveva aggiunta una sesta. La regola non invecchia, il conto sì —
e a tenerlo è `tests/rules/domain-ui`. Il kit che non sa che gioco è sta sotto `ui/`, e le parole del
gioco sotto `i18n/`. Da [D024](D024-il-telaio.md) il guscio non disegna più le
linguette: monta il **telaio** del kit e gli passa dentro la colonna e la testata. Ogni delega chiusa ha in fondo le
**correzioni** rispetto a com'era scritta: [D002](D002-contratti.md) ne ha sette,
[D003](D003-kernel-clock.md) cinque, [D004](D004-kernel-rng.md) sei,
[D005](D005-kernel-bus.md) cinque, [D006](D006-kernel-registry.md) sei,
[D007](D007-kernel-ledger.md) nove, [D008](D008-balance.md) otto,
[D009](D009-persistenza-main.md) dieci, [D010](D010-dominio-income.md) dieci,
[D014](D014-dominio-bancomat.md) undici, [D011](D011-runtime-e-store.md) quattordici,
[D012](D012-ui-e-i18n.md) e [D015](D015-home-bancomat.md) diciassette,
[D016](D016-correzioni-audit.md) sette,
[D019](D019-il-pagamento.md) tredici, [D020](D020-nessun-sistema-si-fida-del-salvataggio.md) nove,
[D023](D023-il-design-system.md) undici, [D017](D017-il-caveau.md) sedici,
[D024](D024-il-telaio.md) e [D025](D025-il-tooltip.md) quattro ciascuna,
[D026](D026-dove-si-attacca-un-dominio.md) e
[D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md) dodici ciascuna. Leggile prima di fidarti del
testo di una delega ancora aperta — alcune di quelle correzioni riguardano proprio deleghe che non
sono ancora state eseguite.

### Cosa vale per qualunque delega, e nessuna lo ripete

Le regole che non stanno nel testo di nessuna delega perché valgono per tutte. Sono qui perché una
delega chiusa è un documento storico: nessuno la rilegge.

Il numero non si scrive, ed è la lezione di [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md)
applicata a un punto cieco: qui diceva «quattro» e poco più sotto «sei», mentre le righe erano
**dodici**. `tests/rules/docs-facts` non poteva vederlo — «regole» è fuori dal suo elenco di cose
contate apposta, perché includerla produceva falsi positivi — quindi l'unica difesa è non scrivere
un numero che nessuno conta.

- **R05 vieta anche i tipi.** Un `.vue` non può scrivere
  `import type { IncomeError } from '@core/domains/income/commands'`: il lint usa la regola base,
  che non distingue un import di tipo. Le unioni che servono alla UI vivono in
  `renderer/i18n/index.ts`.
- **Il codice si scrive in inglese.** Identificatori in inglese; prosa — commenti, messaggi degli
  errori lanciati, descrizioni dei test — in italiano. È la regola C08 di
  [convenzioni.md](../convenzioni.md), imposta da `tests/rules/english-identifiers`, che è
  ⚠️ parziale e lo dichiara.
- **Un importo di gioco non può nascere dentro un dominio.** `no-magic-numbers` guarda i **numeri**,
  ma `Money` si costruisce da una **stringa**: a fermarlo è `tests/rules/domains-no-money-literals`
  (D014, correzione 2).
- **Un `eslint-disable` senza motivazione è un test rosso**, non un appunto di review (C06).
- **Il salvataggio si scrive solo da uno stato che ha una partita vera** (INV-17). `close()` ha una
  precondizione: da `Avvio`, da `Caricamento` e da `Errore` per un caricamento fallito la finestra
  si chiude **senza scrivere**, perché quello che c'è in memoria non è la partita di nessuno.
- **Nessun barrel** (C10) e **nessuna parola vietata nei nomi** (C09): due regole che stavano solo
  in prosa e adesso hanno un test — `tests/rules/no-barrel` e `tests/rules/forbidden-words`.
- **Se apri o chiudi una delega, o aggiungi un ADR, `docs/stato.md` va rigenerato** — altrimenti il
  gate è rosso, ed è voluto (C11). Il comando è `npx vitest run tests/rules/project-state -u`. Quel
  file **non si scrive a mano**: lo produce `tests/helpers/projectState.ts` leggendo il repo.
- **Non scrivere in un documento vivo un numero che `stato.md` conta.** Quanti ADR ci sono, quali
  sono `Proposta`, quante deleghe sono aperte, quanti documenti: se ti serve dirlo, **linka**
  invece di ricopiare (C11). Vale per i documenti vivi, non per ADR e deleghe, che raccontano il
  momento in cui sono stati scritti.
- **Se sposti un confine fra livelli, il diagramma di [architettura.md](../architettura.md) cambia
  nello stesso commit** — e adesso non è più disciplina: `tests/rules/import-graph` confronta il
  disegno con il grafo di import vero **nei due versi**, e pretende che ogni file di `src/`
  appartenga a un nodo (C13). Una cartella nuova va aggiunta anche alla mappa dentro quel test.
- **Un file `rules.ts` è puro, e c'è un test** (R13): niente `ctx`, niente `Date.now`, niente
  `emit`, niente import di valore da `Bus`, `Ledger` o `Registry`. Gli import di **soli tipi**
  passano.
- **Un dominio non importa un altro dominio** (R19, da D018), e qui gli import di soli tipi **non**
  passano: `tests/rules/domains-are-independent` risolve l'alias e i percorsi relativi. Ciò che un
  dominio deve sapere di un altro arriva **per argomento**, e a consegnarlo è chi ha entrambi i capi
  sotto mano — il bootstrap o lo store ([ADR 0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)).
- **Un dominio nuovo compila la sua [scheda](../design/domini/README.md) prima che qualcuno ne
  scriva una riga** (D018), e la scheda si compila **leggendo `src/`**, non ricordandolo. Se il
  dominio non esiste ancora, la scheda va riletta contro il codice il giorno dopo: è successo al
  caveau, e ha smentito tre delle proprie righe.
- **`no-magic-numbers` copre adesso anche `src/renderer/**/*.ts`** (R04). Un numero di gioco nella
  UI va in `balance/`; un numero di presentazione prende un nome.
- **L'interfaccia di un dominio vive in `components/<dominio>/`, e da nessun'altra parte** (R18,
  [ADR 0033](../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)). Un dominio nuovo è una
  cartella lì **più** una riga in `DOMAIN_SCREENS`, che può dire `null` — e `tests/rules/domain-ui`
  è rosso finché non le hai scritte tutte e due. Le cartelle di `components/` che non sono domini
  sono una lista chiusa di due, `shell/` e `ledger/`: allungarla è una riga in quel test.
- **Nessuna riga che comincia con `|` fuori da una tabella** (C12). Sembra pedante finché non
  spezzi una tabella in due con un paragrafo e la voce diventa invisibile: è successo.

**Le deleghe aperte sono quelle che [stato.md](../stato.md) elenca**, e l'ordine in cui si
eseguono è il grafo in [README.md](README.md). [D013](D013-verifica-della-fetta.md) è chiusa e la
fetta 01 è conclusa: il progetto è allo **STOP 2**, e la fetta 02 è già scritta — vedi _Il prossimo
passo_ in fondo.

Il rapporto dello STOP 2 sta in fondo a quella delega, insieme a undici correzioni. Le quattro cose
che chi arriva adesso deve sapere, e che nessun'altra pagina dice:

1. **Il kernel non è sotto budget: è sopra di circa il 9%**, e va saputo perché la prima risposta
   di D013 diceva il contrario. Il budget di ~500 righe misurava le **sei** deleghe D003–D008, cioè
   `kernel/` **più** `balance/`: la sola cartella `kernel/` è un altro insieme, e confrontarla con
   ~500 è l'errore che è già stato fatto una volta. Le due misure stanno in
   [stato.md](../stato.md), e lo sforamento è dichiarato riga per riga in [README.md](README.md).
2. **Le ultime operazioni sono sommerse dallo stipendio.** Il reddito emette una transazione per
   tick, dieci al secondo: un deposito resta visibile meno di mezzo secondo sulla home, e il
   registro da venti della schermata Statistiche è tutto stipendio dopo due secondi. Ogni test
   è verde, e a ragione — nessuno di loro guarda lo schermo mentre il tempo passa. È nel
   [registro YAGNI](../roadmap-fette.md) con il grilletto della fetta 02.
3. **Le regole che dipendono da un occhio sono sei, ed erano sette.** «I file `rules.ts`
   contengono solo funzioni pure» era l'unica regola scritta senza ID e senza meccanismo: adesso è
   **R13**, con `tests/rules/pure-rules`
   ([D022](D022-il-confine-disegnato-e-il-confine-vero.md)). Le sei che restano sono C04, C05 e i
   quattro nomi di file che [convenzioni.md](../convenzioni.md) affida alla review; sono elencate
   in fondo a [tracciabilita.md](../tracciabilita.md), sotto _Cosa questa tabella non copre_. Se
   diventano sette, è un segnale.
4. **Uno stato `Proposta` non è una dimenticanza: è una decisione che il codice non impone
   ancora.** Quali siano in questo momento lo dice [stato.md](../stato.md), che li conta; il
   perché di ciascuna sta nel suo ADR. Gli altri sono `Accettata`, e ognuno ha accanto il rosso
   che l'ha dimostrato. Il numero **non** si scrive qui: è stato sbagliato per un giorno intero
   prima che [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) togliesse a questa pagina
   il compito di ricordarlo.

Prima di lei c'è stata [D016](D016-correzioni-audit.md), nata da un **audit della codebase** fatto
il 2026-08-20: diciassette difetti, di cui uno critico — chiudere la finestra dalla schermata
d'errore scriveva una partita vuota sopra il salvataggio del giocatore. Le due radici sono nella
delega, e la seconda vale la pena saperla anche senza aprirla: `tests/rules/doc-links` verifica che
i collegamenti fra documenti risolvano, **non che i numeri scritti in prosa siano veri**. Sei
affermazioni numeriche di documenti vivi erano invecchiate senza far rumore.

### Quanto ci si può fidare di questi documenti

Sono stati **auditati per intero** dopo D005: tutti e cinquanta i markdown, collegamenti e ancore
inclusi. Sono usciti quindici disallineamenti, corretti tutti tranne uno — il `post(posting)` di
D007, lasciato aperto perché la decisione spettava a chi avrebbe scritto quel Ledger. È stata
presa: `post()` non esiste ([ADR 0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)). Il
dettaglio di cosa è stato trovato sta in `git log` (`docs: audit di coerenza`) e la lezione in
[rischi.md](../rischi.md), sotto N07.

D007 ne ha trovato un sedicesimo che l'audit non aveva visto: l'[ADR 0003](../adr/0003-ledger-unica-porta-del-denaro.md)
conteneva ancora la firma `Ledger.post({ … })`, superata dall'ADR 0019 lo stesso giorno. Gli ADR
sono append-only, quindi il corpo resta e a dichiararlo è l'intestazione.

Da lì in avanti valgono due cose:

- **I collegamenti non si rompono più in silenzio**: `tests/rules/doc-links` verifica ogni
  link e ogni ancora fra i documenti, ed è un gate come gli altri (regola C07).
- **E dal terzo audit, nemmeno i conteggi**: quanti ADR, quali `Proposta`, quante deleghe, quanti
  documenti stanno in [stato.md](../stato.md), che è **generato** e verificato (C11). Un documento
  vivo che li ripete è rosso, e nessuna riga di tabella può vivere fuori da una tabella (C12).
- **I documenti non appartengono tutti alla stessa specie, e non è un difetto.** Alcuni descrivono ciò che c'è
  (architettura, tracciabilità, glossario); altri **vincolano** ciò che verrà
  ([design/flusso-tick.md](../design/flusso-tick.md), le deleghe aperte). I secondi parlano di
  codice che non esiste ancora, e lo dichiarano in testa. Se ne trovi uno che non lo dichiara, è
  quello il difetto.

Quel primo audit **non** copriva ciò che è cambiato dopo D008. Il secondo — 2026-08-20, tutta la
codebase e tutti i documenti — è quello che ha prodotto [D016](D016-correzioni-audit.md).

Il **terzo** è dello stesso giorno, poche ore dopo, e ha prodotto
[D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) e
[D022](D022-il-confine-disegnato-e-il-confine-vero.md). Ha trovato dodici difetti, **nessuno nel
codice sorgente**: sette erano conteggi invecchiati — la stessa classe che D016 aveva appena
corretto a mano — e tre erano confini architetturali che nessun meccanismo verificava. La lezione
sta tutta in questo: la correzione di D016 era un **aggiornamento**, e un aggiornamento protegge il
giorno in cui lo si esegue e nessun altro. Le coperture sono dichiarate in fondo a D021.

Da lì in poi vale la stessa avvertenza di sempre: quello che è cambiato dopo, nessuno l'ha ancora
guardato — con una differenza, adesso: sette delle dodici classi trovate non possono più tornare in
silenzio, perché un gate le vede.

**E la classe che resta scoperta ha appena colpito di nuovo.** [D019](D019-il-pagamento.md) è stata
chiusa con tutti i gate verdi — collegamenti, conteggi, `stato.md` rigenerato — e alcuni fra i
**documenti vivi** descrivevano ancora il meccanismo di prima: il glossario non conosceva `PriceList` e la parola
«listino» era già presa dalla visione per un'altra cosa, `flusso-tick.md` disegnava un `buyUpgrade()`
senza argomento, `mappa-funzionale.md` diceva che con cosa si paga «si scopre sbagliando».
Trovati solo rileggendoli. `doc-links` guarda i **collegamenti** e `docs-facts` i **conteggi**:
nessuno dei due sa dire se una frase descrive ancora il codice di ieri, e non è chiaro che qualcosa
possa saperlo. Finché non lo sa nessuno, chiudere una delega vuol dire anche **rileggere i documenti
vivi che nominano ciò che hai cambiato** — non solo quelli che la delega elencava.

## Le sei cose da non fare

Sono le regole che, violate, riportano il progetto a com'era. Tutte hanno un meccanismo che le
impone; il meccanismo sta in [tracciabilita.md](../tracciabilita.md).

1. **Non scrivere una lista di sistemi a mano.** Il `Registry` è l'unica che esiste.
2. **Non toccare un saldo.** Solo `Ledger.transaction`, che applica tutto o niente e somma a zero.
3. **Non mettere logica di dominio in un `.vue`.** I componenti leggono selettori e inviano comandi.
4. **Non scrivere `TODO`.** Ciò che manca sta in [roadmap-fette.md](../roadmap-fette.md), con il
   grilletto preciso che lo farà entrare.
5. **Non costruire due domini insieme.** Una fetta verticale alla volta, finita e verde. È il
   difetto A17, quello che ha generato tutti gli altri.
6. **Non aggiornare la documentazione "dopo".** Se una modifica sposta un confine, il documento che
   descrive quel confine cambia nello stesso commit.

## Cosa leggere, in quest'ordine

| Quando                        | Documento                                         | Tempo |
| ----------------------------- | ------------------------------------------------- | ----- |
| sempre, per primo             | [docs/README.md](../README.md) — la mappa         | 2 min |
| per capire la forma           | [architettura.md](../architettura.md)             | 5 min |
| per non inventare parole      | [glossario.md](../glossario.md)                   | 3 min |
| prima di discutere una scelta | [adr/README.md](../adr/README.md) — solo i titoli | 3 min |
| prima di scrivere codice      | la delega che stai eseguendo                      | 5 min |
| quando dubiti che regga       | [rischi.md](../rischi.md), parti 2 e 3            | 5 min |

Non serve leggerli tutti, gli ADR. Servono quando stai per contraddirne uno: allora leggi
**quello**, e riparti dalle alternative già scartate invece che da zero.

## Il prossimo passo, in concreto

**È [D034](D034-le-serie-degli-strumenti.md)**, i grafici a candele di contanti e carta. Ha **una
decisione aperta** scritta in fondo — due grafici a candele oppure candele e linea — e **non si
esegue prima di averla presa con l'utente**: è l'unica cosa che la blocca.

**[D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md) è chiusa**, ed è la ragione per cui
D034 adesso misura un numero che vuol dire qualcosa: il renderer si compila minificato, quindi il
peso che D034 rimisurerà è quello vero invece del doppio. Le dieci correzioni rispetto a com'era
scritta stanno in fondo alla delega, e due meritano di essere sapute prima di aprirla: il punto 8 si
risolve **al contrario** di come la delega lo prescriveva, e le occorrenze di `home` nei documenti
vivi erano dieci invece delle sette che l'audit aveva contato.

**E [D031](D031-la-sovrapposizione-e-un-pezzo-del-kit.md) non è più a monte di niente.** La sua
intestazione diceva di sbloccare la rifinitura del bancomat; l'artboard `ATM`, letto nel sorgente,
non ha una sola sovrapposizione. È chiusa comunque, ma quella freccia nel grafo non c'è mai stata.

### Come si guarda l'applicazione senza toccarla

**Tre trappole del guardare, e la terza è anche la via d'uscita.** Le prime due sono state pagate
scrivendo D024 e D025; la terza le risolve tutte.

1. Una cattura della finestra può **non dipingere l'ultima banda** in fondo, e per venti minuti il
   piede della colonna è sembrato assente mentre c'era. A dirlo è stata una misura presa **dentro**
   la pagina, non un'altra occhiata.
2. L'applicazione di sviluppo **si chiude** se le si porta la finestra in primo piano da fuori — per
   esempio con uno script che la va a cercare.
3. Non serve portarla in primo piano. `npm run dev` accetta `--remoteDebuggingPort`, e da lì la
   finestra vera si interroga e si comanda dal di dentro:

```bash
npx electron-vite dev --remoteDebuggingPort 9222
```

Con la porta aperta, `http://127.0.0.1:9222/json/list` dice quale pagina è il renderer, e sul suo
WebSocket passano `Runtime.evaluate` — per **chiedere al documento** invece che all'immagine —
`Input.dispatchMouseEvent` e `Input.dispatchKeyEvent` per premere e tabulare, e
`Page.captureScreenshot` per l'immagine. La finestra resta dov'è e non si chiude.

**Perché è scritto qui e non in una delega:** è il modo in cui questo progetto pagherà **ogni**
spunta a occhio da adesso in poi, e le spunte a occhio sono l'unica classe di verifica che nessun
gate può dare. Serve anche l'altra metà, ed è la lezione della prima trappola: l'immagine dice se
qualcosa è bello, il documento dice se c'è. Le due domande sono diverse e vogliono due strumenti.

### E da lì è nata [D026](D026-dove-si-attacca-un-dominio.md), che è chiusa

Guardare l'applicazione ha prodotto una domanda dell'utente che nessun documento del progetto
rispondeva: **dove vive l'interfaccia di un dominio?** Il caveau è la prova che la regola manca —
`components/CashPanel.vue` è due domini in un file, il pool e il caveau, e non per decisione: il
pannello dei contanti c'era già e il caveau ci è cresciuto dentro.

Due cose vanno sapute da chi prende D026, e sono le due che hanno rischiato di far partire quella
delega sbagliata.

1. **Il caveau con solo denaro non è un difetto, è una scelta scritta.** La visione dice «conserva
   contanti **e oggetti**», e il [registro](../roadmap-fette.md) dice perché gli oggetti non ci sono:
   nascono col black market e con le aste di box, e un inventario senza oggetti dentro è
   l'astrazione speculativa che l'[ADR 0014](../adr/0014-una-fetta-verticale-alla-volta.md) vieta. Il
   grilletto è il blocco A.
2. **«Quando UI e quando componente» era già deciso**, e chi credesse di doverlo decidere rifarebbe
   [D023](D023-il-design-system.md): il kit non sa che gioco è (ADR 0028, R14), una forma non è un
   contenitore (ADR 0030, R16), e un pezzo entra nel kit quando lo disegnano **due** componenti.
   Quello che manca è l'ordine **dentro** `components/`, che oggi è piatta.

**D026 è stata eseguita e chiusa lo stesso giorno.** Le tre decisioni sono state prese con
l'utente: la home **restava il bancomat** — l'ADR 0018 fu confermato invece che superato, e la home
_era_ la pagina del dominio `atm`; **quella metà non vale più, ed è D033 ad averla superata** —
ogni dominio ha la sua pagina salvo dichiarare `null`, e `components/` si divide per proprietario,
una cartella ciascuno. Ne è uscito
l'[ADR 0033](../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md), la regola **R18** e
`tests/rules/domain-ui`, rotta di proposito quattro volte. Le destinazioni sono quattro, quindi il
grilletto dei **gruppi nella colonna** è scattato ed è uscito dal registro.

Tre cose che chi arriva adesso deve sapere, e che le dodici correzioni di D026 spiegano per esteso:

1. **Una sottocartella di `components/` non fa rosso `import-graph`**, contro ciò che D026 dava per
   certo: quel test sceglie il nodo per **prefisso**. È la ragione per cui R18 ha dovuto essere un
   test suo invece di appoggiarsi a C13.
2. **`CashPanel.vue` si è spezzato in tre**, non in due: il caveau lascia sulla home il proprio
   allarme, e quel pezzo sta in `components/vault/`. È la clausola dell'ADR 0033 — un dominio può
   comparire fuori dalla sua pagina, ma esce dalla sua cartella — e senza di essa il muro sarebbe
   invisibile proprio dove il giocatore lo incontra.
3. **`income` ha preso una pagina anche lui**, e oggi ci sta dentro un pulsante solo. È scritto nel
   file: una pagina nasce stretta una volta sola e cresce col dominio, mentre un pannello ospitato
   nella pagina di un altro non se ne va più.

**Una cosa è stata chiesta e dichiarata fuori scope: il cruscotto con i grafici.** Non c'è una serie
storica da disegnare — `history` sono venti transazioni in memoria e `SavePayload` non contiene
nessuno storico — e una libreria di grafici è una dipendenza, quindi un ADR
([ADR 0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md)). Il suo posto è una delega sua,
che decide **chi salva la serie** prima di **come si disegna**.

**La domanda gemella — cosa è trasversale e cosa è di dominio — non sta in D026 ed è deliberato.**
Le valute, gli oggetti, il calore, l'attenzione, l'etichetta: generalizzarli adesso vorrebbe dire
generalizzare da un dominio solo, che è ciò che la [visione](../prodotto/visione.md) vieta con parole
sue. Il suo posto è la sezione 8 della scheda di [D018](D018-la-scheda-di-dominio.md), aggiunta lo
stesso giorno, più i grilletti che il registro ha già.

**Lo STOP 2 è stato riportato, e le regole che governano la fetta 02 sono già in vigore.**
La fetta 01 è conclusa e verificata. [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) e
[D022](D022-il-confine-disegnato-e-il-confine-vero.md) sono **chiuse**: sono nate da un audit
dell'intera codebase e di tutti i documenti, e hanno messo un meccanismo sotto cinque confini che
prima teneva la review. Non costruiscono gioco — costruiscono il pavimento su cui la fetta 02
cammina, e la ragione per cui vengono prima è quella di D001 e D020: le regole devono esistere
prima del codice che governano.

Quello che ne discende per chi esegue adesso sta in _Cosa vale per qualunque delega_, e la più
facile da dimenticare è quella su `docs/stato.md`: chiudere una delega significa **rigenerarlo**, o
il gate è rosso. Vale anche per una delega che non tocca `src/`, perché i file di test si contano.

**Il codice di gioco non è stato toccato**: cinque righe in tutto, in `eslint.config.js` e in
`rotation.ts`. Le deleghe della fetta 02 partono esattamente da dove le ha lasciate lo STOP 2, e
nessuna delle loro misure è cambiata.

**[D019 — Il pagamento](D019-il-pagamento.md) è chiusa**, e questa è la sua storia: non c'era, ed è nata da una domanda posta
prima di eseguire il caveau: come sceglie il giocatore con cosa paga? La risposta è che non sceglie
— `income` compra il suo upgrade con il pool scritto nel sorgente — e che
l'[ADR 0017](../adr/0017-il-denaro-e-plurale.md) prometteva il contrario dalla fetta 01. Il caveau
sarebbe stato il **secondo** comando a spendere, cioè l'ultimo momento per rispondere senza
disfare niente. Da lì l'[ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
e il **listino**: ogni azione dichiara, per ogni strumento che accetta, quanto costa con quello.
Il kernel non cambia di una riga.

**[D020 — Nessun sistema si fida del proprio salvataggio](D020-nessun-sistema-si-fida-del-salvataggio.md)
è chiusa**, e con lei il pavimento su cui il caveau cammina. Zero righe di sorgente, 70 di test,
esattamente il budget: ogni sistema con stato deve rifiutare un salvataggio che non riconosce
(**INV-20**), e a pretenderlo è `tests/rules/stateful-systems-reject-garbage` — il primo test di
quella cartella che costruisce una partita invece di leggere i sorgenti, il che è dichiarato in
testa al file. Veniva prima del caveau per la ragione di D001: la regola deve esistere prima del
codice che governa, e il caveau è il **secondo** dominio con stato.

Ne discende una cosa per chi prende D017: **non c'è niente da aggiungere a quel test.** I sistemi
si derivano dal Registry, quindi registrare il caveau lo mette sotto la regola da solo. Ciò che il
caveau deve fare è che il suo `load` rifiuti i tipi sbagliati **campo per campo** — il controllo
pigro «è un oggetto» non basta, ed è misurato.

**[D023 — Il design system](D023-il-design-system.md) è chiusa**, ed è arrivata da fuori: l'utente
ha consegnato un canvas di Claude Design, fatto a foglio bianco. Si è infilata prima del caveau per
la ragione di D001 — il caveau è la prima schermata nuova dopo la fetta 01, e una schermata
disegnata prima che il sistema esista è una schermata da rifare.

Le quattro cose che chi arriva adesso deve sapere:

1. **`src/renderer/ui/` è un livello, non una cartella.** Non importa `@core`, non importa lo store,
   non importa le parole: nel diagramma è l'unico nodo **senza frecce in uscita**. Lo tengono due
   regole con un test, **R14** e **R15**, e il blocco `<style>` non scoped di `App.vue` — l'unico
   che il progetto aveva — non esiste più.
2. **[P2](../prodotto/preferenze.md) è stata sostituita.** Tre cose cambiano: il fondo non è più
   solo scuro (due temi completi, sceglie il sistema operativo), l'accento non è più verde — il
   verde adesso vuol dire **solo** guadagno — e i caratteri si caricano e sono due, dal bundle.
3. **Un pulsante non si spegne, e adesso non può.** `UiButton` non sa scrivere `disabled`
   (**INV-21**). La regola c'era già da D019, in prosa; la prima stesura del componente la stava
   disfacendo senza che nessun gate lo vedesse.
4. **`npm install` non funziona in questa repo**, e non per colpa di D023: `electron-vite@5` regge
   `vite` fino alla 7 e il progetto è sulla 8. L'unico comando che installa è
   `npm ci --legacy-peer-deps`, che però **ignora i peer** — per questo `@vue/devtools-api` e
   `vue-eslint-parser` sono adesso dichiarati a mano. La causa vera è aperta, ed è la correzione 8
   di [D023](D023-il-design-system.md).

**[D017 — Il caveau](D017-il-caveau.md) è chiusa, e con lei la fetta 02.** Il primo muro del gioco è
acceso: i contanti hanno una capienza, la capienza si sposta, e quando è piena il reddito **non
entra e lo dice**. Le sedici correzioni stanno in fondo alla delega; le quattro che chi arriva
adesso deve sapere sono queste:

1. **Il Ledger non legge più la capienza: la chiede, e la espone.** `createLedger(bus, capacities)`
   riceve una funzione ([ADR 0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md), ora
   `Accettata`), e `Ledger.capacities` è **la stessa** che la UI interroga — quindi INV-18 si
   verifica per identità e non confrontando due numeri che oggi coincidono. `capacityOf` in
   `domains/atm/rules.ts` **non esiste più**: leggeva `POOLS`, cioè la capienza di partenza, che
   dopo il primo ampliamento è la risposta sbagliata.
2. **Il valore predefinito di `createLedger` è additivo e ha morso lo stesso.** Tre file di test
   costruivano un Ledger nudo e ci mettevano più denaro di quanto il caveau tenga: hanno smesso di
   provare quello che provavano, e due su tre restavano **verdi**. Dove il tetto non è l'oggetto del
   test si passa `() => null`, con scritto perché. «Additivo» significa _compila_, non _prova ancora
   la stessa cosa_.
3. **`domains/* --> domains/*` non è ancora mai stata disegnata, e D017 ha scelto due volte di non
   aprirla.** Il reddito ha bisogno di sapere quanto spazio c'è nel caveau e il bancomat se un
   prelievo ci sta: in tutti e due i casi la risposta arriva **per argomento**, e a consegnarla è
   chi ha entrambi sotto mano — il bootstrap e lo store. Nessun lint lo impedirebbe, quindi è una
   cosa che si sceglie ogni volta: è scritta in prosa in [architettura.md](../architettura.md),
   sotto _Frecce vietate_.
4. **Il raggruppamento dello stipendio non è stato costruito, e il suo grilletto era «la fetta
   02».** Non stava nella tabella _Da produrre_ di D017 né nella sua definizione di fatto, e il
   caveau non è il posto dove si decide quali righe una schermata mostra. La voce è ancora nel
   [registro YAGNI](../roadmap-fette.md), con un grilletto nuovo — la prima delega che tocca
   `components/postings.ts` — e con un argomento in più: a caveau pieno il reddito **si ferma**,
   quindi lo storico smette di riempirsi di stipendio proprio quando c'è qualcos'altro da leggerci.

**[D018 — La scheda di dominio](D018-la-scheda-di-dominio.md) è chiusa**, e con lei il progetto ha
una cosa che prima non aveva: un **modulo che nessun dominio futuro può lasciare vuoto**. Sta in
[design/domini/README.md](../design/domini/README.md) — nove sezioni di gioco e dodici domande sul
kernel, ognuna con dietro un ADR, un invariante o un test — e le tre schede compilate
([reddito](../design/domini/income.md), [bancomat](../design/domini/atm.md),
[caveau](../design/domini/vault.md)) sono la prova che regge tre domini fatti apposta diversi.

Le quattro cose che chi arriva adesso deve sapere:

1. **`domains/* --> domains/*` adesso è vietata da un test.** Era vera e non imposta da niente: il
   lint sotto `domains/**` vieta `vue`, `pinia`, `electron` e le conversioni di `Money`, non un
   dominio che ne importa un altro, e `import-graph` la salta perché è un arco **interno** a un
   livello. Adesso è **R19**, `tests/rules/domains-are-independent`, e non fa sconti all'
   `import type`. D018 dichiarava «nessuna regola nuova»: è la sua correzione 1, e la ragione è che
   senza quel test D018 violava un proprio invariante nella riga stessa che lo enuncia.
2. **La scheda del bancomat ha trovato che la commissione non ha un bersaglio suo.** È tarata di
   rimbalzo da `vault_card_discount`, che è del caveau: cambiare la commissione rende rosso un test
   che parla d'altro. Non è stato corretto — D018 non tocca `src/` — ed è annotato in
   [atm.md](../design/domini/atm.md).
3. **Una domanda manca alla forma, e si sa già quale.** `withheld` del reddito non è stato, non è
   una lista e non è un evento: è un numero che spiega **perché il tick ha fatto meno di quanto
   poteva**. La metà kernel non ha una casella dove metterlo, e ce ne sarà uno per ogni dominio che
   può fallire parzialmente. Va posta alla quarta scheda, non prima.
4. **Due sezioni non discriminano ancora, e la scheda lo dichiara invece di lasciarlo intendere.**
   La 9 — _questo dominio si amministra?_ — riceve tre «sì»: il primo `null` sarà il calendario.
   Cinque delle dodici domande kernel rispondono «no» per tutti e tre. Non è un difetto: è il
   numero di partenza del controllo che la scheda si è data — se una sezione non ha mai cambiato
   una decisione va tolta, e la prova si fa alla **quarta** compilata.

**[D027 — Un grafico è una serie](D027-un-grafico-e-una-serie-che-nessuno-tiene.md) è chiusa**, e il
cruscotto ha smesso di dire solo com'è adesso. Sotto c'è la prima **serie storica** del progetto: un
campione del patrimonio netto ogni cinque secondi di gioco, trenta in tutto, tenuti in memoria dallo
store. La cadenza è una funzione pura accanto a quella che trasforma i frame in tick — `sampleOf` di
fianco a `stepOf` in `runtime/loop.ts` — perché uno store non può importare un file che gli sta
accanto (R01).

Cinque cose che chi arriva adesso deve sapere, e le prime due sono le più costose da riscoprire:

1. **La serie non si salva, e l'[ADR 0010](../adr/0010-liste-storiche-limitate-alla-definizione.md)
   resta `Proposta` per la terza fetta di fila.** Non è pigrizia: senza il calendario dell'ADR 0023
   un campione non sa **quando** è stato preso, quindi due barre affiancate possono distare un tick
   o otto ore e il grafico le disegnerebbe uguali. Salvarla direbbe di più e mentirebbe.
2. **È entrata una libreria, ed è la prima dipendenza di runtime dopo l'origine.** ApexCharts, con
   l'[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md). Il criterio dell'ADR 0015 **non la
   promuoverebbe da solo** — l'altezza di una barra è una divisione — ed è scritto nell'ADR invece
   che lasciato intendere: è entrata su richiesta dell'utente, a grafico in CSS già costruito e
   guardato. Il modulo compilato passa da 622,87 kB a **2.437,92 kB**, in
   [qualita.md](../qualita.md) con il grilletto per rimetterla in discussione.
3. **La libreria si monta a mano, e c'è una ragione precisa.** `vue3-apexcharts` clona le opzioni
   con `JSON.parse(JSON.stringify(…))`, e `JSON.stringify` cancella le funzioni: i formattatori
   sparivano e l'asse scriveva `948627.0`. Chi pensasse di «semplificare» rimettendo l'involucro
   rifarebbe quel giro.
4. **R17 si è incrinata e nessun gate lo vede.** ApexCharts scrive elementi `<title>` dentro l'SVG
   delle etichette dell'asse, cioè tooltip nativi del browser — quelli che
   [D025](D025-il-tooltip.md) aveva tolto. `tests/rules/no-native-tooltips` guarda l'attributo nel
   **sorgente**, quindi non può prenderli. Sono due, dichiarati nell'ADR 0034 e in
   [rischi.md](../rischi.md).
5. **L'asse del grafico non parte da zero**, ed è una misura: ancorato a zero, due minuti e mezzo di
   gioco valgono **2 pixel su 120** a 100.000,00 €. Il caveau arriva a 250.000,00 €, quindi il
   cruscotto avrebbe portato un rettangolo pieno per la maggior parte della partita.

**E una cosa sull'ambiente, che è costata tempo:** la partita di sviluppo su questa macchina ha
903.359,30 € di contanti contro una capienza di 1.000,00 €. È fatta a mano e viola l'invariante,
quindi il Ledger rifiuta **ogni** transazione che tocchi i contanti e il reddito è fermo: il
patrimonio non può muoversi, e qualunque grafico lì dentro appare piatto senza essere rotto. Per
vedere una serie che sale serve un'altra partita — l'app accetta `--user-data-dir`, così il
salvataggio vero non si tocca.

Tre cose che chi apre la fetta 03 deve avere in mente prima di scrivere una riga:

1. **A17 non è finita con la fetta 02.** Il caveau apre il black market, le aste e il calore, e
   nessuno dei tre si è toccato. Una fetta alla volta
   ([ADR 0014](../adr/0014-una-fetta-verticale-alla-volta.md)).
2. **La fetta 03 ha una domanda in meno e una risposta diversa.** «Il progresso offline è limitato
   dal caveau, non dal tetto» era un'ipotesi con un numero inventato; adesso è una misura: otto ore
   di assenza valgono 1.000,00 € al primo livello e 250.000,00 € all'ultimo, contro i 345.600,00 €
   che `RECOVERY_CAP` permetterebbe. Il tetto di otto ore va ri-derivato **in tempo di gioco**, e il
   recupero deve avanzare a blocchi invece che in un `tickAll` solo — ma quel `tickAll` solo adesso
   non fa più tornare a casa con zero, ed è il motivo per cui `roomIn` esiste.
3. **Il gioco si fa girare senza Electron**, e D017 l'ha rifatto per guardare la schermata nei due
   temi: `npm run build`, la pagina di `out/renderer/` servita da un server statico, le tre funzioni
   di `SaveApi` finte al posto del preload — con dentro un salvataggio che ha già dei soldi, così
   ogni stato si **costruisce** invece di aspettarlo. In questo ambiente la finestra non compone
   frame, quindi il loop non gira: i colori si rileggono dal DOM, che è più severo di un occhio. Il
   modo esatto è nella nota di chiusura di [D017](D017-il-caveau.md).

Quanto ci mette `verify`, e con quanti test, lo dice [qualita.md](../qualita.md) con la data
accanto: è l'unico posto del progetto in cui un tempo si scrive, e questa pagina lo ripeteva
scaduto di due deleghe. La soglia è il minuto, è il margine più stretto del progetto, e il rimedio
è già censito nel [registro YAGNI](../roadmap-fette.md) — togliere l'avvio ripetuto di `npm`, non
togliere un gate.

## Come si lavora

- **Ci si ferma sulle decisioni strutturali.** Nuova dipendenza, cambio di pattern, confine
  spostato: due opzioni con i compromessi, e si aspetta. Le cose piccole e reversibili si fanno.
- **Se l'utente dà una direttiva generale** ("la soluzione più professionale"), si decide in
  autonomia e si marca la decisione come contestabile — non ci si ferma di nuovo.
- **Nessun claim senza output.** "Funziona" si dice incollando i test verdi.
- **Un test che non si è mai visto fallire non è una rete, è una decorazione.** Rompilo di proposito
  una volta: costa trenta secondi. È così che si è scoperto che il primo caso di prova per R04 era
  sbagliato, e che la regola sembrava funzionare senza funzionare.
- **Commit:** Conventional Commits con lo scope uguale all'ID della delega —
  `feat(D007): il ledger a partita doppia`. Un ramo per delega: `d007-kernel-ledger`.
- **Il ramo si fonde su `main` quando la fetta è conclusa, non a ogni delega.** Per quattro deleghe
  di fila i rami si sono impilati uno sull'altro e `main` è rimasto alla fetta 01: funzionava, e
  costava una riga di avvertimento in ogni prompt — «parti dal ramo, non da `main`» — cioè
  esattamente il tipo di istruzione che prima o poi qualcuno salta. Alla chiusura della fetta 02
  sono state fuse tutte e quattro, in un `--ff-only` senza conflitti. Le deleghe chiuse continuano a
  dire da quale ramo partivano, ed è giusto: raccontano il giorno in cui sono state scritte, non
  dove si sta adesso.
- **Quando una delega è finita:** marcala `Chiusa` con il commit, aggiorna
  [tracciabilita.md](../tracciabilita.md) se hai cambiato un meccanismo, e scrivi le **correzioni
  rispetto a com'era scritta la delega** — ogni delega chiusa finora ne ha da cinque a diciassette, e
  sono scritte lì invece che nascoste. Se una delega esce senza correzioni, o era perfetta o non
  è stata letta con attenzione.
- **Un numero scritto in un documento è una misura scaduta.** Conteggi, tempi, righe: quando ne
  incontri uno che riguarda ciò che stai toccando, rimisuralo invece di ricopiarlo. `verify` ha
  dichiarato otto secondi da D001 a D006, quando erano venticinque; `rischi.md` ha detto "i quattro
  difetti" davanti a un elenco di cinque per altrettanto tempo.
- **Quando correggi un fatto sbagliato, cerca il concetto, non la frase.** Un `grep` sulla frase
  intera trova le copie identiche e lascia indietro le parafrasi — è successo davvero, con
  "progresso offline" scritto in quattro punti e corretto in due.

## Come tornare operativi, da zero

Quattro righe, e la prima è quella che sorprende chi arriva: **`npm install` non funziona in questa
repo.** `electron-vite@5` regge `vite` fino alla 7 e il progetto è sulla 8; l'unico comando che
installa è quello qui sotto, che però ignora i peer — per questo `@vue/devtools-api` e
`vue-eslint-parser` sono dichiarati a mano. La causa vera è aperta ed è la correzione 8 di
[D023](D023-il-design-system.md).

```bash
npm ci --legacy-peer-deps
```

Se poi `npm run dev` dice _Electron uninstall_, il binario non è stato scaricato e si completa con
`node node_modules/electron/install.js`. Per guardare l'applicazione senza portarla in primo piano,
vedi _Come si guarda l'applicazione senza toccarla_.

## Come verificare di non aver rotto niente

```bash
npm run verify
```

Quattro gate in una trentina di secondi: typecheck, lint, format:check, test. Se è rosso, non è
finito.

`npm run verify:release` aggiunge la compilazione, ed è **verde da D011**: `build` produce
`out/main/index.js`, `out/preload/index.cjs` e `out/renderer/`. Da D009 a D010 era rosso e non era
una regressione — il renderer non esisteva ancora — ma da qui in avanti non ha più scuse.

Per vedere il gioco girare davvero serve il binario di Electron, che l'installazione di `npm` non
sempre scarica: se `npm run dev` dice _Electron uninstall_, si completa con
`node node_modules/electron/install.js`.

Se la finestra non c'è — o non compone frame, e allora il saldo non sale mai — il gioco si guarda
lo stesso: `npm run build`, la pagina di `out/renderer/` servita da un server statico qualunque, e
al posto del preload le tre funzioni di `SaveApi` scritte a mano, con dentro un salvataggio che ha
già dei soldi. Il modo esatto è nella nota di chiusura di
[D015](D015-home-bancomat.md#cosa-è-stato-verificato-a-mano-e-come).

## Le decisioni contestabili

Prese in autonomia; quante siano non si scrive, perché nessuno le conta. **Le righe nuove si
aggiungono in fondo**: la prosa qui sotto indicizza la tabella per posizione — «le prime quattro»,
«la ventiduesima» — e una riga infilata in mezzo sposta tutto ciò che viene dopo senza che nessun
gate se ne accorga.

**È già successo, e in due modi.** Il primo: questo paragrafo diceva «Trenta» davanti a trentasei
righe. Il secondo è più insidioso e riguarda le righe **aggiunte in fondo**, che erano la mossa
sicura: le sei di D017 hanno spinto in avanti la fine della tabella, e le due frasi che ci si
appoggiavano da dietro — «le cinque che precedono l'ultima», «le ultime cinque» — hanno smesso di
puntare a ciò che nominavano. Adesso quelle due dicono di **quale delega** parlano invece di dove
stanno, che è l'unica ancora che non si sposta.

Le prime quattro sono **in vigore** da D007 e sono state usate da due
domini: cambiarle costa il Ledger, i suoi test e i due domini. D014 era il momento buono per
contestarle ed è passato — nessuna delle quattro si è rivelata scomoda usandole.

La quinta e la sesta sono del 2026-08-19, nascono dalla revisione della visione e **non costano
ancora niente**: nessuna riga di codice le applica.

La settima è **in vigore da D009**: costa il main, il preload e i loro test.

L'ottava è **in vigore da D010**, da D014 e ora dal bootstrap che le distribuisce entrambe. Costa i
due domini e `createGame.ts` — e D011 ha scoperto che l'unica cosa che rende quella scelta sicura è
un test: passare al bootstrap un `Ledger` diverso da quello del contesto lasciava **quaranta test
verdi**. Adesso non più.

La nona e la decima sono **in vigore da D014**. Costano il dominio e i suoi test — poco, ma non più
zero. La nona è quella che cambia una forma del progetto: `atm` è il primo dominio senza
`system.ts`, e il bootstrap di D011 lo conferma con una riga di `register` invece di due.

L'undicesima e la dodicesima sono di **D011**, e costano il renderer e i suoi test.

La tredicesima, la quattordicesima, la quindicesima e la sedicesima sono di **D012**. Costano il
dizionario, il guscio e le schermate — e D015 le ha ereditate senza contestarne nessuna: le chiavi
piatte hanno retto una decina di chiavi nuove, i mirror hanno retto i selettori del bancomat.

Le cinque righe che portano **D015** costano la home. Due riguardano cosa il gioco **non** mostra —
i tre numeri del retro della carta e il sesto riquadro — e sono le meno costose da cambiare: i dati
arriveranno, e i posti sono lì ad aspettarli. La terza è un numero di gioco travestito da
interfaccia. La quarta torna sul tavolo a ogni componente nuovo, ed è giusto così.

| Cosa                                                                         | ADR                                                                                                                       | Alternativa scartata                                                                                                                                                                                          |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ogni transazione somma a zero (partita doppia)                               | [0020](../adr/0020-partita-doppia.md)                                                                                     | movimenti singoli con categoria                                                                                                                                                                               |
| Il Ledger espone transazioni, non movimenti                                  | [0019](../adr/0019-transazioni-atomiche-nel-ledger.md)                                                                    | due `post()` con rollback nel chiamante                                                                                                                                                                       |
| I pool dichiarano le proprie affordance come dati                            | [0017](../adr/0017-il-denaro-e-plurale.md)                                                                                | un saldo unico con etichette nella UI                                                                                                                                                                         |
| `post()` non esiste: una primitiva sola                                      | [0021](../adr/0021-una-sola-primitiva-per-il-denaro.md)                                                                   | zucchero a due movimenti, che però rimette `world` e `sink` nei domini                                                                                                                                        |
| Il Ledger avrà conti dinamici, non solo sei pool                             | [0022](../adr/0022-il-ledger-ha-conti-non-solo-pool.md)                                                                   | il budget di un'attività tenuto come stato del dominio                                                                                                                                                        |
| Il tempo di gioco è un dominio, non il kernel                                | [0023](../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                                                          | un `now` nel `SystemContext`, che aggiunge una chiave al salvataggio                                                                                                                                          |
| I tipi d'esito del salvataggio stanno in `contracts/save.ts`                 | [D009](D009-persistenza-main.md#il-contratto-cresce) — non ha un ADR: è una conseguenza di INV-03, non una decisione a sé | allargare INV-03 a tutto `contracts/`, cioè un allowlist di un file che diventa un denylist da mantenere                                                                                                      |
| Un sistema riceve per costruzione ciò che il contesto non porta              | [0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)                                     | un singleton in `balance/`: nessun parametro in più, e una dipendenza che sparisce dalle firme                                                                                                                |
| Un dominio senza stato non ha un `system.ts` e non si registra               | [D014](D014-dominio-bancomat.md) — decisione 1                                                                            | inventargli uno stato per riempire il file: un contatore che nessuna schermata mostra, più una migrazione il giorno in cui la forma giusta si vede                                                            |
| La commissione del bancomat è un importo fisso, non una percentuale          | [D014](D014-dominio-bancomat.md) — decisione 2                                                                            | una percentuale, che però non produce **mai** il caso "commissione superiore all'importo" — e quel caso è metà del valore della fetta                                                                         |
| D011 produce anche l'ingresso del renderer, non solo i tre file dichiarati   | [D011](D011-runtime-e-store.md) — correzione 6                                                                            | lasciare `verify:release` rosso fino a D012, e chiudere D011 senza aver mai eseguito il proprio loop                                                                                                          |
| Se il salvataggio finale fallisce, la finestra **non** si chiude             | [D011](D011-runtime-e-store.md) — correzione 13                                                                           | chiudere comunque: comodo, e perde l'unica copia esistente della partita                                                                                                                                      |
| Il saldo della home mostra i **due pool del giocatore**, non una cifra sola  | [D012](D012-ui-e-i18n.md) — correzione 7                                                                                  | la cifra sola del mockup, sotto cui il messaggio «ti servono 800,00 €, ne hai 0,00 €» è incomprensibile                                                                                                       |
| Le chiavi i18n sono **piatte**, non una gerarchia di oggetti                 | [D012](D012-ui-e-i18n.md) — correzione 9                                                                                  | l'annidamento, in cui `atm.withdraw.title` prende il posto di `atm.withdraw` senza che nulla lo dica                                                                                                          |
| La navigazione è un `ref`, non un router                                     | [D012](D012-ui-e-i18n.md) — [registro YAGNI](../roadmap-fette.md)                                                         | `vue-router`: una dipendenza, quindi un ADR (ADR 0015), per due destinazioni senza indirizzo                                                                                                                  |
| jsdom resta fuori: le verifiche a occhio diventano test per un'altra strada  | [D012](D012-ui-e-i18n.md) — correzione 15                                                                                 | `jsdom` + `@vue/test-utils`, cioè due dipendenze e un ADR, per montare componenti che la definizione di fatto non chiede di montare                                                                           |
| Il cruscotto ha **cinque** riquadri, non sei: il tetto è un tetto            | [D015](D015-home-bancomat.md) — correzione 1                                                                              | riempire il sesto posto con un numero inventato, che è anche il posto che la fetta 02 userà davvero                                                                                                           |
| Il retro della carta porta le affordance del pool, non tre numeri finti      | [D015](D015-home-bancomat.md) — correzione 3                                                                              | plafond, limite e punteggio di credito come li disegna il mockup: dati che nella fetta 01 non esistono                                                                                                        |
| L'importo si sceglie fra quattro, e il più piccolo è rifiutato apposta       | [D015](D015-home-bancomat.md) — correzione 5                                                                              | un campo di testo, che apre il confine «chi trasforma una stringa digitata in `Money`» e cosa succede quando non è un numero                                                                                  |
| jsdom resta fuori una **seconda** volta: si estrae invece di montare         | [D015](D015-home-bancomat.md) — correzione 13                                                                             | tirare il grilletto che il registro YAGNI aveva scritto: due dipendenze e un ADR per provare quattro funzioni pure                                                                                            |
| Le righe di una transazione hanno il segno: nasce `signedMoney`              | [D015](D015-home-bancomat.md) — correzione 10                                                                             | un formato solo: «497,50» in un elenco di movimenti non dice da che parte va il denaro                                                                                                                        |
| `doc-links` guarda anche il `README.md` della radice, non solo `docs/`       | [D013](D013-verifica-della-fetta.md) — correzione 7                                                                       | lasciarlo scoperto perché «non è un documento di `docs/`»: sarebbe l'unico del progetto con i collegamenti liberi di marcire, e l'unico che un estraneo legge per primo                                       |
| Il listino sta nell'**azione**, non in una tabella globale in `balance/`     | [ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)                                               | una regola sola per tutti — coerente per costruzione, e per questo sbagliata: il black market sconta i contanti, l'immobiliare li penalizza                                                                   |
| Il **selettore** del pagamento è di D017, non di D019                        | [D019](D019-il-pagamento.md) — _Il selettore vero è di D017_                                                              | costruirlo in D019, dove nessuna azione accetta due strumenti: sarebbe provato solo contro un listino finto                                                                                                   |
| `heat` e `convertibleTo` restano fuori dal listino, con il grilletto scritto | [ADR 0027](../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) — alternative scartate                        | dichiararli subito: un campo che nessuno legge per tre fette, e un grafo di conversioni per un arco solo                                                                                                      |
| La validazione dello stato salvato è un **test**, non un tipo né un aiutante | [D020](D020-nessun-sistema-si-fida-del-salvataggio.md)                                                                    | `defineSystem` che chiede un validatore: garantisce che il campo esista, non che funzioni — e cambia il kernel per una regola che il kernel non deve conoscere                                                |
| D019 e D020 vanno **prima** di D017, non dentro                              | [README](README.md) — il grafo                                                                                            | infilarle nel caveau: la regola sarebbe scritta dalla stessa persona che scrive il codice da sorvegliare, nello stesso momento                                                                                |
| Un pool fuori listino è rifiutato col codice del Ledger, non con uno nuovo   | [D019](D019-il-pagamento.md) — correzione 3                                                                               | un `error.income.*` suo: due frasi per una situazione sola, e il giocatore ne leggerebbe una diversa a seconda di quale delle due strade lo rifiuta                                                           |
| Il prezzo resta sul pulsante; la riga sopra porta strumento e ragione        | [D019](D019-il-pagamento.md) — correzione 8                                                                               | l'importo nel riquadro del pagamento e «Compra» nudo: toglie la ripetizione e contraddice il mockup approvato allo STOP 1                                                                                     |
| Con un'opzione sola il pagamento è **una** chiave i18n, non due              | [D019](D019-il-pagamento.md) — correzione 9                                                                               | le due che l'ADR 0027 prevedeva — _con cosa si paga_ e _perché non gli altri_ — che con un listino di uno sono la stessa frase                                                                                |
| Il caveau ha **cinque** livelli, da 1.000,00 € a 250.000,00 €                | [D017](D017-il-caveau.md) — `balance/constants.ts`                                                                        | una curva senza tetto che si strozza da sola: in un idle «costa più di quanto renda» è un bersaglio mobile, da ritarare a ogni cambio di reddito                                                              |
| Lo sconto della carta è **sotto** la commissione del bancomat                | [D017](D017-il-caveau.md) — `targets.ts`, `vault_card_discount`                                                           | uno sconto più grande: senza il calore la carta non paga niente in cambio della traccia, e i contanti diventerebbero una voce di listino che nessuno sceglie mai                                              |
| Il Ledger **espone** la funzione delle capienze, non la riceve soltanto      | [D017](D017-il-caveau.md) — correzione 5                                                                                  | lasciarla solo in ingresso: INV-18 tornerebbe un confronto fra due numeri che oggi coincidono, che è la forma debole che la definizione di fatto vieta                                                        |
| Il reddito riceve lo **spazio** per costruzione, non importa il caveau       | [D017](D017-il-caveau.md) — correzione 3                                                                                  | `income` che importa `vault/rules`: nessun gate lo fermerebbe, e sarebbe il primo accoppiamento fra domini in un gioco che ne ha diciassette                                                                  |
| Il caveau sta in `ORDER.ECONOMY`, e non apre una fase nuova                  | [D017](D017-il-caveau.md) — correzione 9                                                                                  | una terza fase per un sistema che non ticchetta; e l'ordine conta davvero in un punto — `ECONOMY` carica prima di `INCOME`, cioè prima che il recupero ticchetti                                              |
| Quanto resta fuori dal tick è un **importo**, non un `sì/no`                 | [D017](D017-il-caveau.md) — correzione 7                                                                                  | un booleano: farebbe sparire il caveau **quasi** pieno, che è il caso che il giocatore incontra per primo                                                                                                     |
| «Nessun dominio importa un altro dominio» diventa un test, non una nota      | [D018](D018-la-scheda-di-dominio.md) — correzione 1                                                                       | dichiararla 👤 di review: costa zero e lascia in piedi l'unica riga della metà kernel che promette più di quanto mantiene                                                                                     |
| Il canvas del design entra nella repo, formattato da Prettier                | [D018](D018-la-scheda-di-dominio.md) — `docs/design/mockups/`                                                             | tenerlo fuori: nessun agente lo troverebbe, e i documenti dovrebbero portare un percorso della scrivania di qualcuno                                                                                          |
| La serie del patrimonio netto sta in **memoria**, non nel salvataggio        | [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md) — decisione 1                                                    | un dominio nuovo che la salva, e con lui l'ADR 0010 ad `Accettata`: senza il calendario dell'ADR 0023 un campione non sa quando è stato preso, quindi due barre affiancate possono distare un tick o otto ore |
| L'asse del grafico **non parte da zero**: la finestra si adatta alla serie   | [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md) — decisione 3                                                    | l'asse ancorato a zero, che è la verità più stretta e diventa illeggibile presto: misurato, a 100.000,00 € due minuti e mezzo di gioco valgono 2 pixel su 120                                                 |
| Il grilletto del router **non** è scattato: la gerarchia è nella colonna     | [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md) — _La decisione aperta_                                       | dichiararlo scattato e aprire una delega per `vue-router`: una dipendenza e un ADR per cinque destinazioni piatte, nessuna raggiungibile da fuori, nessuna con uno stato nell'URL, nessuna dentro un'altra    |
| Il frame si riprogramma **prima** di `onStep`, non dentro un `finally`       | [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md) — correzione 1                                                | il `try`/`finally` che la delega prescriveva: chiude il lancio e lascia in piedi lo `stop()` chiamato da dentro `onStep`, che si vedrebbe riprogrammare il frame subito dopo l'annullamento                   |

La ventiduesima è di **D013** e costa una riga di un test: è anche l'unica riga non di test che
quella delega abbia toccato.

**Le cinque righe del 2026-08-20 — quelle di [D019](D019-il-pagamento.md) e
[D020](D020-nessun-sistema-si-fida-del-salvataggio.md) — e tre di loro sono entrate in vigore con D019.** Il listino dentro l'azione, il selettore rimandato a D017, il calore e `convertibleTo` lasciati fuori: adesso costano `contracts/payment.ts`, il dominio `income`, lo store e un componente — poco, ma non più zero. Le altre due, quelle di D020, sono entrate in vigore con [D020](D020-nessun-sistema-si-fida-del-salvataggio.md) e non costano quasi niente lo stesso: la validazione come **test** costa un file di `tests/rules/` e zero righe di `src/` — contestarla vuol dire cancellare quel file, non disfare il kernel — e l'ordine «prima di D017, non dentro» è ormai speso, perché D017 le trova entrambe già fatte. Nascono tutte dalle due domande poste prima di eseguire D017 — come si sceglie con cosa si paga, e chi controlla lo stato che arriva dal disco. Le scelte **di gioco** di quelle sessioni non sono qui perché non sono state prese in autonomia: lo spazio unico del caveau, il tetto a livelli finiti, la varianza zero e la nona voce dell'etichetta sono state decise dall'utente, e stanno nella [scheda del caveau](../design/domini/vault.md) con le alternative scartate.

**Le sei righe in fondo sono di [D017](D017-il-caveau.md)**, e sono quelle che chiudono la fetta 02:
i cinque livelli del caveau, lo sconto della carta sotto la commissione, la funzione delle capienze
esposta invece che solo ricevuta, lo spazio passato al reddito per costruzione, il caveau in
`ORDER.ECONOMY`, e l'importo — non il `sì/no` — che resta fuori dal tick. Costano il dominio, il
Ledger e i loro test. **D024, D025 e D026 non ne hanno aggiunte**: le loro scelte in autonomia sono
diventate ADR — 0030, 0031, 0032 e 0033 — e un ADR è già il posto dove una decisione si contesta.
Le due di D026 stanno nella tabella _Decisioni prese in autonomia_ dell'[indice ADR](../adr/README.md),
e sono la prima riga di quella tabella che nasce già **in vigore**.

**Le due righe di [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md)**, e sono
le prime del progetto prese su una **direttiva generale** invece che su una domanda: l'utente ha
risposto «segui le tue raccomandazioni» a tutte e due le decisioni della delega, e questa pagina
dice che in quel caso si decide e si marca. Costano lo store, un componente e una funzione pura, e
la seconda ha un numero dietro invece di un'opinione — l'escursione del grafico misurata a quattro
livelli di patrimonio, che sta nella delega. La scelta della **libreria** invece non è qui: è
diventata l'[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md), e un ADR è già il posto dove una
decisione si contesta.

**Le due righe di [D018](D018-la-scheda-di-dominio.md) non sono diventate un ADR, e la differenza è
di specie.** La prima — la regola sui domini scritta come test invece che dichiarata di review — è
in vigore da subito e costa un file di `tests/rules/` e una riga in
[tracciabilita.md](../tracciabilita.md): contestarla vuol dire cancellare quel file, non disfare
niente. Non è un ADR perché non decide **cosa** il progetto fa: decide che una cosa già decisa venga
imposta, ed è la stessa forma della validazione-come-test di
[D020](D020-nessun-sistema-si-fida-del-salvataggio.md).

La seconda è più piccola e ha un prezzo misurato: il canvas nella repo costa circa **0,8 s** di
`format:check` ogni volta che qualcuno esegue `verify`, e il numero sta in
[qualita.md](../qualita.md) con la data accanto invece che in questa riga. È la prima decisione del
progetto in cui il costo di un documento si paga in un gate.

**Le due righe di [D035](D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md)** sono le seconde del
progetto prese su una **direttiva generale** — «seguo le tue raccomandazioni» — dopo quelle di D027,
e questa pagina dice che in quel caso si decide e si marca. La prima non costa ancora niente:
nessuna riga di codice la applica, e contestarla vuol dire riaprire una voce del registro YAGNI. La
seconda costa `runtime/loop.ts` e i suoi test, ed è l'unica del progetto che **contraddica la delega
che la conteneva** — la ragione sta nella correzione 1 di D035, ed è una misura invece di
un'opinione: c'è un test che vede rosso lo `stop()` chiamato da dentro `onStep`, sia con il codice
di prima sia con il `finally` che la delega prescriveva.

Sono contestabili anche i **numeri**: il moltiplicatore ×1,5 dell'upgrade, le otto ore di tetto al
recupero e l'intervallo 700–740 del primo minuto scelti da D008, più i 2,50 € di `ATM_FEE_FLOOR` scelti
da D014, e i quattro importi rapidi del bancomat — 1 · 10 · 100 · 500 — scelti da D015. Sono di
un'altra categoria: cambiarli costa una riga in `balance/constants.ts` e un test che diventa rosso
apposta. Reddito base e costo dell'upgrade vengono invece dai
[mockup](../design/mockups/), quindi erano già approvati.

## Prompt pronto per una sessione nuova

C'è una delega scritta e aperta, e **una cosa da decidere prima di cominciare**. Quali siano aperte
lo dice [stato.md](../stato.md), che le conta.

```
Esegui D034 — le serie degli strumenti.

La delega è docs/delega/D034-le-serie-degli-strumenti.md. Leggila per intero prima di
scrivere una riga, comprese le Trappole note.

PRIMA DI COMINCIARE: D034 ha una decisione aperta in fondo — due grafici a candele,
oppure candele per i contanti e linea per la carta. Va posta all'utente, e questa volta
blocca: cambia cosa la delega produce, non un dettaglio dentro un punto.

Il peso del renderer che D034 rimisura è quello **minificato**: D035 ha dichiarato
minify: 'oxc' in electron.vite.config.ts, e i numeri di partenza stanno in docs/qualita.md
con la data del 2026-08-22. Non ricopiarli: rimisurali, perche' src/ si muove.

Il ramo si chiami d034-le-serie-degli-strumenti e parta da main.
Verifica che main sia ancora allineato: git rev-list --count origin/main..main

Ogni test nuovo va visto rosso di proposito una volta — la definizione di fatto lo chiede
punto per punto, ed è il modo in cui questo progetto ha scoperto che una regola non
funzionava, e in cui D035 ha scoperto che la propria correzione del loop era scritta al
contrario.
```

I prompt delle deleghe già consegnate stanno nel `git log` di questo file: si recuperano da lì
invece di tenerli tutti in vita, che è la stessa ragione per cui i numeri stanno in un posto solo.
Questa riga li elencava per nome, ed era un elenco che invecchiava a ogni delega consegnata.

**E dopo le due, torna il lavoro di specie diversa: scrivere una delega, non eseguirne una.** Il
materiale c'è tutto e non va inventato:

- il [registro delle fette](../roadmap-fette.md) dice cosa viene dopo e in che ordine, e il
  **blocco A** — black market e aste di box — è il primo che porta gli **oggetti**, cioè il primo
  `boundedList` che entra davvero nel salvataggio e l'unica cosa che può far passare l'ADR 0010 ad
  `Accettata`;
- la [scheda di dominio](../design/domini/README.md) si compila **prima** che il dominio esista, e
  la sua forma va rivista alla **quarta** compilata — la prossima sarà quella;
- il [registro YAGNI](../roadmap-fette.md) ha i grilletti già scritti: si guarda quali sono scattati
  invece di decidere a sentimento cosa costruire.

Una delega di questo progetto si riconosce dalla forma: dipendenze, ADR vincolanti, budget dichiarato
per **ogni** ramo che le decisioni aperte producono, _Da produrre_, _Invarianti_, _Fuori scope_,
_Definizione di fatto_ e _Trappole note_. Quelle già scritte servono da modello — quante siano lo
dice [stato.md](../stato.md), e questa riga ne ha dichiarate ventisette per due deleghe di fila —
e due sono da leggere per ragioni diverse: [D027](D027-un-grafico-e-una-serie-che-nessuno-tiene.md)
per come si scrive una delega che porta decisioni **non** ancora prese, e
[D016](D016-correzioni-audit.md) per come si scrive una delega che raccoglie i reperti di un audit
sotto le loro radici invece che in un elenco.

**Una cosa che vale la pena sapere prima di scriverne una nuova**, ed è la lezione di D027: il budget
va dichiarato per ramo, e i rami vanno **contati**. D027 ne dichiarava uno su quattro e prometteva
che gli altri tre si sarebbero stimati dopo le decisioni; quel dopo non è mai arrivato, e il ramo
consegnato è finito senza un metro contro cui misurarsi. Non è un difetto grave — è la forma in cui
un budget smette di servire.

### E dopo, la fetta 03

La fetta 03 comincia da una **scheda compilata** invece che da una schermata immaginata, ed è la
differenza che [D018](D018-la-scheda-di-dominio.md) è servita a fare: il modulo sta in
[design/domini/README.md](../design/domini/README.md), e un dominio nuovo lo compila **prima** che
qualcuno ne scriva una riga.

Le tre cose da avere in mente prima di scrivere quella riga stanno qui sopra, in fondo a _Il
prossimo passo_. Una quarta è arrivata con D018 e va tenuta con le altre: **la forma va rivista alla
quarta scheda compilata**, non prima — due sezioni oggi non discriminano, e con tre casi non si può
sapere se sia un difetto della forma o il campione.
