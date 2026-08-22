# D035 — Ciò che non si dichiara lo sceglie un altro

- **Stato:** **Aperta** — scritta il 2026-08-22, non eseguita. Il ramo si chiami
  `d035-cio-che-non-si-dichiara-lo-sceglie-un-altro` e parta da **`main`**
- **Dipende da:** niente che non sia già chiuso. Tocca codice che esiste da
  [D032](D032-la-commissione-scala-il-pavimento-no.md) e da
  [D033](D033-il-bancomat-e-una-pagina.md), e documenti che D033 ha lasciato indietro
- **Sblocca:** niente di scritto. Non è a monte di
  [D034](D034-le-serie-degli-strumenti.md), che si può eseguire prima o dopo — ma vedi
  _Perché conviene prima di D034_
- **ADR vincolanti:** [0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md), di cui questa
  delega estende il principio alla rappresentazione;
  [0006](../adr/0006-decimal-end-to-end-per-il-denaro.md) (il confine di presentazione);
  [0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md) (dove vive una dipendenza);
  [0034](../adr/0034-il-grafico-e-una-libreria.md), il cui numero questa delega **corregge**;
  [0040](../adr/0040-il-bancomat-e-il-cruscotto-sono-due-pagine.md) (la `home` non esiste più);
  [0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)
- **Produce:** ADR **0041** — _La rappresentazione del denaro è dichiarata come la sua precisione_,
  e l'invariante **INV-24**. Nessuna regola `R` nuova
- **Regole:** R05 (niente logica nei `.vue`), R11 (`Decimal` end-to-end), C01, C11 (un fatto
  contabile ha un posto solo)
- **Budget:** ~45 righe di codice, ~110 di test, ~70 di documenti. È piccola in righe e larga in
  file: sette punti che non si somigliano, e la ragione per cui stanno insieme è in _Le tre radici_

## Obiettivo

Chiudere i sette difetti correggibili trovati dall'audit del 2026-08-22, alla radice.

## Perché esiste

L'audit del 2026-08-22 ha guardato la codebase intera cercando **ciò che nessun gate può vedere** —
la semantica, i confini numerici, la configurazione di rilascio, e la coerenza fra i documenti vivi
e il codice. Ha trovato nove difetti e zero problemi di sicurezza; il kernel, i contratti, i domini
e la persistenza non ne hanno prodotto nemmeno uno oltre a quello sulla scala.

Due dei nove non stanno qui, e il perché è in _Fuori scope_.

**Il difetto più grave non si incontra giocando, e va detto subito** perché altrimenti la severità
sembra gonfiata: a 18,00 €/s servirebbero 5,5e19 secondi per arrivarci, e il cheat più grande regala
un milione per pressione. Resta il difetto più grave di tutti per due ragioni. La prima è che un
ADR `Accettata` **certifica come misurata** una soglia falsa di sedici ordini di grandezza. La
seconda è che il bersaglio di scala che la [visione](../prodotto/visione.md) dichiara — ~1e30 € — è
oggi irraggiungibile, e nessun documento lo sa.

### Perché conviene prima di D034

Non è una dipendenza e il grafo non porta la freccia. Ma D034 tocca `constants.ts`, aggiunge due
serie allo store e rimisura il peso del renderer: farlo **dopo** che la minificazione è decisa
significa misurarlo una volta sola invece che due, e su un numero che vuol dire qualcosa.

## Le tre radici

I sette difetti non sono sette problemi. Sono tre, e portano tutti lo stesso nome: **una decisione
che nessuno ha preso l'ha presa qualcun altro.**

**R-A — un default ereditato non è una scelta, e questo progetto lo sa già.**
L'[ADR 0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md) porta nel titolo la frase «la
precisione del denaro è dichiarata, **non ereditata**», e l'ha applicata a una riga di
`decimal.js`. L'audit ha trovato che la stessa libreria ne ha una seconda, altrettanto decisiva e
rimasta ereditata; e che `electron-vite` ne sceglie una terza per conto nostro. Da qui i punti 1 e 2.

**R-B — una dichiarazione che nessuno ha mai confrontato con la realtà.**
`package.json` dichiara quali dipendenze sono di runtime, e `electron-builder` **le spedisce**
fidandosi. Nessuno ha mai costruito il pacchetto per guardare se quella dichiarazione fosse vera.
Da qui il punto 3.

**R-C — chiudere una delega non ha un passo che rilegge i documenti vivi che nominano ciò che è
cambiato.** Il progetto lo sa e lo scrive in fondo a
[PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md): «`doc-links` guarda i collegamenti e
`docs-facts` i conteggi: nessuno dei due sa dire se una frase descrive ancora il codice di ieri».
D033 ha cancellato la schermata `home` e ha ripulito il codice con un commit apposta — i documenti
vivi la nominano ancora in sette punti. Da qui i punti 4, 5 e 6.

Il punto 7 non ha una radice comune con gli altri, e non gliene invento una: è un componente che si
è riscritto una tabella perché non poteva leggere quella vera. Il punto 8 nemmeno: è una riga
messa nell'ordine sbagliato.

## Da produrre

### 1 · La notazione del denaro si dichiara accanto alla sua precisione

**Il difetto, misurato.** `decimal.js` ha `toExpPos = 21`: da 1e21 in su `toString()` restituisce
`1e+21` invece di `1000000000000000000000`. Il regex dello schema di salvataggio
(`src/main/save/schema.ts`, la costante `DECIMAL`) accetta solo la forma decimale piena, quindi
**il salvataggio fallisce**. Fallisce in scrittura, prima che il disco venga toccato: `SaveStore`
valida con `parseEnvelope` e torna `error.save.invalid`.

Misurato attraverso il codice vero — Ledger reale, schema reale, un `income('card', 1e21)`:

    card serializzata come: 1e+21
    parseEnvelope -> { ok: false, error: { code: 'error.save.invalid',
                       path: 'payload.ledger.balances.card' } }

A 1e20 lo stesso giro passa. La soglia è esattamente 1e21.

**Perché è un arresto e non un degrado.** `error.save.invalid` manda la partita in `failed` con
fase `saving`, e da lì — per la correzione 13 di [D011](D011-runtime-e-store.md) — **la finestra
non si chiude**. Il giocatore ha due vie: riprovare, che fallirà in modo deterministico, o chiudere
perdendo la partita. Ogni salvataggio successivo è impossibile.

**Cosa fare.** In `src/core/contracts/money.ts`, accanto a `SIGNIFICANT_DIGITS`, dichiarare la
soglia di notazione nei **due** versi e passarla allo stesso `Decimal.set`. Il verso negativo va
pinnato insieme all'altro anche se oggi non morde: `toExpNeg = -7` è lo stesso default ereditato, e
non morde solo perché tutto arrotonda ai centesimi — cioè per una proprietà che vale adesso, non
per una regola.

Il commento che ne spiega il perché **esiste già** nel file: è quello dell'ADR 0026, e questa è la
sua seconda metà. Va scritto che la precisione dice **quante cifre**, la notazione dice **come si
scrivono**, e che la seconda è quella che attraversa il disco.

**La strada scartata, e perché.** Allargare il regex di `schema.ts` per accettare la forma
esponenziale corregge il sintomo: lascia due rappresentazioni dello stesso importo sul disco, e un
confine che accetta una forma che il resto del progetto non sa produrre di proposito.

### 2 · Il renderer si compila minificato, e lo dichiara

**Il difetto, con la sua causa.** `electron-vite` imposta `minify: false` come **default del preset
del renderer** — sta in `node_modules/electron-vite/dist/chunks/`, dentro
`electronRendererConfigPresetPlugin`, e viene fuso con la configurazione dell'utente: chi non lo
scrive lo eredita. `electron.vite.config.ts` non lo scrive. Il pacchetto contiene quindi i commenti
del sorgente — 82 occorrenze di `ADR 00` dentro il JS compilato.

**Questo chiude il dubbio che [D030](D030-il-contenuto-scorre-nel-telaio.md) ha aperto e che tre
deleghe si sono passate senza scioglierlo.** Non era una configurazione del bundler da trovare: era
un default da dichiarare.

**Quanto vale, misurato il 2026-08-22 sulla stessa macchina e sullo stesso commit:**

| Renderer                       | JS          | CSS      | totale      |
| ------------------------------ | ----------- | -------- | ----------- |
| com'era prima di questa delega | 2.469,77 kB | 38,20 kB | 2.507,97 kB |
| minificato                     | 1.197,87 kB | 20,85 kB | 1.218,72 kB |

**E il numero che conta davvero.** Con `apexcharts` isolata in un chunk suo, minificata:

| Cosa                                                                | Peso      |
| ------------------------------------------------------------------- | --------- |
| `apexcharts`                                                        | 931,04 kB |
| tutto il resto — Vue, Pinia, vue-i18n, `decimal.js`, l'intero gioco | 266,08 kB |

**Cosa fare.** Una riga in `electron.vite.config.ts`, nel blocco `renderer`, con il commento che
dice perché esiste: senza, il default torna in silenzio al primo aggiornamento di `electron-vite`.
Poi rimisurare la sezione del peso in [qualita.md](../qualita.md) con la data accanto.

**E una cosa che non è una riga di codice.** [qualita.md](../qualita.md) scrive «Circa 1.815 kB per
un grafico a barre», e quel numero è il grilletto scritto dell'
[ADR 0034](../adr/0034-il-grafico-e-una-libreria.md) per rimettere la libreria in discussione. È il
peso di una build non minificata: quello vero è **931 kB**. La cifra corretta non indebolisce quella
decisione, la rende più netta — la libreria del grafico pesa **tre volte e mezzo l'intera
applicazione**. Va riscritta dove sta, e l'ADR 0034 va riletto contro di essa. Se quella rilettura
produca una modifica all'ADR è una decisione di chi esegue, non di questa delega.

### 3 · Solo ciò che serve a runtime sta in `dependencies`

**Il difetto, verificato leggendo l'output compilato invece che il sorgente:**

    out/main/index.js     -> electron, node:fs/promises, node:path, zod
    out/preload/index.cjs -> electron

Solo `zod` è genuinamente esterna. Le altre quattro `dependencies` sono consumate a build time — il
blocco `renderer` non usa `externalizeDepsPlugin`, quindi il renderer le impacchetta tutte:

| Pacchetto                     | in `node_modules` | dove finisce davvero                      |
| ----------------------------- | ----------------- | ----------------------------------------- |
| `apexcharts`                  | 19 MB             | dentro il bundle del renderer             |
| `@fontsource/jetbrains-mono`  | 2,4 MB            | quattro `woff2` emessi in `out/renderer/` |
| `@fontsource/instrument-sans` | 631 kB            | un `woff2` emesso in `out/renderer/`      |
| `decimal.js`                  | 296 kB            | dentro il bundle del renderer             |

`electron-builder` spedisce le `dependencies` di produzione — il blocco `files` di
`electron-builder.yml` contiene solo negazioni, quindi il default `**/*` resta in vigore. Sono circa
**22 MB** che l'installatore porterebbe due volte.

**Perché adesso e non alla prima distribuzione.** Non c'è ancora un canale — `electron-builder.yml`
lo dice. Ma il giorno della prima distribuzione è il momento peggiore per indagare un installatore
inspiegabilmente grosso, e questa è la delega che ha già il pacchetto sotto mano.

**Cosa fare.** Spostare le quattro in `devDependencies`. Non è una preferenza: `vue`, `pinia` e
`vue-i18n` **stanno già lì** per esattamente questa ragione, il che rende le quattro
un'incoerenza interna del file, non una scelta discutibile. `zod` resta dov'è.

**La trappola sta in _Trappole note_, punto 2**, e va letta prima di toccare il file.

### 4 · I documenti vivi smettono di descrivere una schermata che non esiste

`home` non esiste dal 2026-08-22: `src/renderer/components/shell/screens.ts` dichiara cinque
destinazioni — `atm`, `income`, `vault`, `board`, `stats` — e `VaultAlarm` è montato in
`AtmView.vue`. D033 ha ripulito il codice con un commit apposta e non i documenti. I sette punti,
tutti:

| Dove                                | Cosa dice                                                        |
| ----------------------------------- | ---------------------------------------------------------------- |
| `prodotto/preferenze.md`, titolo P3 | «La home è cruscotto **e** bancomat»                             |
| `prodotto/preferenze.md`, corpo P3  | «La schermata principale è tutte e due le cose, in quest'ordine» |
| `prodotto/preferenze.md`, P2        | «la **forma** della home»                                        |
| `prodotto/preferenze.md`, P5        | «la home gli ruota intorno»                                      |
| `README.md` di `docs/`              | l'indice: «nome, stile, home ATM, contanti/carta, carta 3D»      |
| `architettura.md`, albero cartelle  | `VaultAlarm.vue # il caveau visto dalla home`                    |
| `design/domini/vault.md`            | «sta in `components/vault/VaultAlarm.vue`, e compare sulla home» |

**Il peggiore è il primo, e vale la pena dire perché.** D033 ha riscritto il **corpo** di P3 — «da
D033 la risposta è due pagine» — e ha lasciato in piedi il **titolo** che afferma il contrario, più
le due righe che enunciano la preferenza. [preferenze.md](../prodotto/preferenze.md) è il documento
delle decisioni permanenti approvate dall'utente: è il posto in cui una frase falsa costa di più,
perché è quello che nessuno rimette in discussione.

**Cosa non toccare**, ed è elencato per non farlo ricorreggere da chi passa dopo:
`design/domini/atm.md` dice «il bancomat **stava** sulla `home`», il mockup `home-atm.html` porta
quel nome nel titolo, e i commenti in `src/` spiegano cosa la home era. Sono al passato, e
raccontano il giorno in cui sono stati scritti — che è ciò che un documento storico deve fare.

### 5 · Il registro YAGNI smette di dichiarare mancante una cosa che c'è

La riga «La precisione di `Decimal` scelta invece che ereditata» è ancora in
[roadmap-fette.md](../roadmap-fette.md), sotto _Nel kernel_, con il proprio grilletto — «la prossima
delega che tocca `contracts/money.ts`». Quel grilletto è **scattato ed è stato obbedito**:
`money.ts` dichiara `SIGNIFICANT_DIGITS = 40`, e l'ADR 0026 è `Accettata` con
[D032](D032-la-commissione-scala-il-pavimento-no.md) nominata nella propria intestazione come la
delega che lo ha fatto scattare.

**Perché conta più di una riga scaduta.** Il registro YAGNI è il documento che risponde a «cosa non
c'è, e cosa lo farà entrare», e il progetto ne prescrive l'uso: «si guarda quali grilletti sono
scattati invece di decidere a sentimento cosa costruire». Una riga che descrive come mancante
qualcosa di presente lo rende inaffidabile proprio in quell'uso.

**Il registro ha già il precedente giusto**, e va seguito quello: la riga «con cosa si paga» è stata
**tolta**, e al suo posto è rimasto un paragrafo che dice che è uscita e chi l'ha costruita. Questa
riga esce allo stesso modo, nominando D032 e l'ADR 0026.

**Di contorno, e va corretto nello stesso passaggio:** quella riga dice che le venti cifre
predefinite tengono i centesimi fino a 1e18, mentre il commento di `money.ts` dice 1e17. Due numeri
per lo stesso fatto — ed entrambi misurano la cosa che il punto 1 dimostra non essere quella che
conta.

### 6 · La riga del router dice quante sono le destinazioni, e sono cinque

Sempre in [roadmap-fette.md](../roadmap-fette.md), sotto _Nell'applicazione_: «Da D012 le
destinazioni sono due, `home` e `stats`, e a sceglierle è un `ref` in `App.vue`».

Sono **cinque**, `home` non esiste, e da [D026](D026-dove-si-attacca-un-dominio.md) la colonna le
raggruppa in due gruppi — `app.nav.group.act` e `app.nav.group.look`.

**Qui il conteggio scaduto è il problema minore.** Il grilletto scritto in quella stessa riga è «la
terza destinazione **con una gerarchia**». Se due gruppi in colonna sono una gerarchia, il grilletto
è scattato tre destinazioni fa e nessuno l'ha guardato — perché la riga che lo porta descrive un
mondo con due schermate piatte.

**Questa è una decisione aperta**, e resta aperta: vedi _La decisione aperta_ in fondo. Il
conteggio va corretto in ogni caso; se il grilletto sia scattato no.

### 7 · La pagina del bancomat legge dal dominio quali strumenti muove

**Il difetto.** `src/renderer/components/atm/AtmPanel.vue` dichiara una costante `SIDES` che mappa
ciascuna direzione ai due pool coinvolti. Gli stessi due pool sono già dichiarati da `DEPOSIT` e
`WITHDRAW` in `src/core/domains/atm/commands.ts`. Due dichiarazioni dello stesso fatto, e **niente
che le leghi**: nessun test le confronta.

**Il caso peggiore.** `SIDES[kind]` guida ciò che il giocatore **vede** — i due lati del blocco
`DA ⇄ A`, i due saldi, le due note. L'anteprima sotto passa invece da `store.preview` → `previewOf`
→ `DEPOSIT`/`WITHDRAW`. Divergendo, la pagina mostrerebbe due strumenti in alto e i movimenti di
**altri due** sotto, nello stesso riquadro, e ogni test resterebbe verde: INV-11 lega l'anteprima al
comando, non l'anteprima a ciò che le sta sopra.

**Perché conta più di una duplicazione qualunque.** Questo progetto ha eliminato sistematicamente
questa forma, e in questo stesso file: `store.atmFee` **non esiste più** perché era una seconda
lettura, e c'è un test che ne verifica l'assenza; `feeRates` è derivato da
`directions[kind].operation.feeRate` con il commento «`BALANCE.ATM_FEE_RATE_IN` scritto qui sarebbe
una seconda lettura dello stesso numero di gioco». `SIDES` è l'unico punto in cui la stessa domanda
ha due risposte, ed è a poche righe da quello in cui la si è tolta.

**La radice non è pigrizia**, ed è la ragione per cui la correzione va in `stores/game.ts` e non nel
componente: R05 impedisce a un `.vue` di importare `domains/atm/commands`, nemmeno per un tipo.
Mancava il selettore, quindi il componente si è riscritto la tabella. È il segnale di radice
classico — un'API di modulo incompleta, non un autore distratto.

**Cosa fare.** Un selettore nello store che espone i due pool per direzione, derivato da
`directions` esattamente come `feeRates` due righe più sotto. Il componente lo legge, `SIDES`
sparisce.

### 8 · Il loop riprogramma il frame anche quando `onStep` lancia

**Il difetto, con le sue tre conseguenze in cascata.** In `src/renderer/runtime/loop.ts`, dentro
`frame()`, la riga `cancel = schedule(frame)` sta **dopo** `onStep(step)`. Se `onStep` lancia,
l'eccezione esce da `frame()` prima della riassegnazione:

1. nessun frame nuovo viene programmato: il loop è **fermo**;
2. `cancel` conserva il valore precedente, quindi `isRunning()` continua a rispondere **`true`**;
3. `start()` comincia con `if (cancel !== null) return`, quindi **rifiuta di ripartire**.

Verificato con un `schedule` finto e un `onStep` che lancia: dopo il lancio i frame in attesa sono
zero, `isRunning()` dice `true`, e un `start()` successivo non programma niente.

**Perché è il più basso dei sette, e perché non è zero.** In questo progetto un lancio dentro
`onStep` significa per costruzione «programma scritto male»: `income()` costruisce sempre movimenti
che sommano a zero, e il Bus rilancia solo ciò che un handler ha lanciato. **L'audit non ha trovato
un percorso che ci arrivi oggi**, e lo dichiara invece di gonfiarlo. Resta che il modo in cui il
gioco morirebbe è il peggiore possibile: la finestra vive, il tempo non passa più, il saldo è fermo,
e l'unica funzione che il progetto ha per chiedere «sta girando?» risponde di sì.

**Cosa fare.** Avvolgere `onStep` in un `try` e riprogrammare nel `finally`. Riprogrammare
**prima** di `onStep` è l'altra strada e costa una riga in meno, ma apre un caso che oggi non
esiste: un `onStep` che chiamasse `loop.stop()` si vedrebbe riprogrammare il frame subito dopo. Il
`finally` non ha quel buco e tiene la proprietà che l'errore continui a emergere.

## Invarianti

- **INV-24 (nuovo)** — un saldo attraversa il confine di persistenza in forma decimale piena, a
  qualunque scala il gioco arrivi. Verifica: un `Ledger.save()` con un saldo oltre la soglia di
  notazione passa `parseEnvelope`. Va rotto di proposito una volta, togliendo la dichiarazione
  aggiunta al punto 1 e guardando il rosso.
- **INV-11 resta**, e il punto 7 la rafforza dal lato che le mancava: l'anteprima è già l'operazione;
  dopo questa delega anche i due strumenti mostrati sopra vengono dalla stessa dichiarazione.
- **INV-14 resta**: nessun gate sparisce da `verify` né da `verify:release`. Il punto 2 tocca la
  configurazione di `build`, che è il gate G5.
- **R11 resta**: il punto 1 non introduce nessuna conversione nuova, e non tocca il confine di
  presentazione.
- **C11 resta**: i numeri rimisurati al punto 2 stanno in [qualita.md](../qualita.md) con la data
  accanto, e in nessun altro documento vivo.
- **Il salvataggio non cambia forma**: nessuna migrazione, `SAVE_VERSION` resta 1. Il punto 1
  cambia **come si scrive** un importo, non quali campi esistono — e un salvataggio scritto prima
  di questa delega si rilegge senza toccarlo, perché `fromString` accetta già tutte e due le forme.

## Fuori scope

- **Il confine di presentazione che perde il centesimo oltre ~1e14 €.** È il nono reperto
  dell'audit e il fratello del punto 1: `toDisplayNumber` converte in `number`, cioè in float64, e
  da lì `99999999999999,99` esce come `…,98`. **È una decisione di gioco prima che di codice** —
  formattatore proprio sulla stringa, `BigInt` con i centesimi, o notazione compatta oltre una
  soglia — e l'utente ha scelto di rimandarla il 2026-08-22. Non si tocca qui, e chi apre questa
  delega non la riapra: è rimandata, non dimenticata.
- **Rimettere in discussione ApexCharts.** Il punto 2 corregge il numero su cui poggia il
  grilletto dell'ADR 0034; **decidere** cosa farne è un'altra delega, e vuole il confronto con i
  candlestick del blocco C che l'ADR nomina.
- **Aggiornare `electron-vite`.** `npm install` continua a non funzionare — `electron-vite@5.0.0`
  regge `vite` fino alla 7 e il progetto è sulla 8, ed è ancora la correzione 8 di
  [D023](D023-il-design-system.md). L'unica candidata è `6.0.0-beta.1`: adottare una beta è una
  decisione strutturale con il suo ADR, non una riga in questa delega. `npm ci --legacy-peer-deps`
  resta il comando.
- **Una CSP sul renderer.** Manca, ed è una decisione **documentata** con il grilletto scritto nel
  registro YAGNI. L'audit l'ha verificata prima di non segnalarla: il grilletto non è scattato — la
  pagina è tutta locale, i caratteri sono nel bundle (ADR 0029) e non esiste una distribuzione.
- **Un meccanismo che accorga i documenti vivi quando il codice cambia sotto di loro** (la radice
  R-C). L'audit non sa se sia meccanizzabile, e il progetto nemmeno: «non è chiaro che qualcosa
  possa saperlo». Qui si correggono le sette occorrenze; inventare il gate è una delega sua, e
  parte da una domanda a cui nessuno ha ancora risposto.
- **Rimisurare la catena `verify` a macchina scarica.** È il residuo dichiarato del 2026-08-21 e
  resta aperto. Il punto 2 tocca `build`, cioè G5, che non sta in `verify`.

## Definizione di fatto

- [ ] `npm run verify` verde, con l'output mostrato — non riassunto.
- [ ] `npm run verify:release` verde, e il peso del renderer **rimisurato** dopo la minificazione.
- [ ] INV-24 ha il suo test, ed è stato visto **rosso** togliendo la dichiarazione del punto 1.
- [ ] Il test del punto 8 è stato visto rosso rimettendo `cancel = schedule(frame)` dopo `onStep`.
- [ ] Il test del punto 7 è stato visto rosso invertendo i due pool di una direzione nel selettore
      nuovo — e **verde** con `SIDES` ancora al suo posto, prima di toglierla: è la prova che oggi
      non protegge nessuno.
- [ ] `grep -rn "home" docs/` non trova più una frase al **presente** che descriva una schermata.
- [ ] Il registro YAGNI non ha più la riga sulla precisione di `Decimal`, e ha al suo posto la nota
      che dice chi l'ha costruita.
- [ ] La riga del router conta cinque destinazioni.
- [ ] `docs/stato.md` rigenerato con `npx vitest run tests/rules/project-state -u`.
- [ ] `docs/tracciabilita.md` ha la riga di INV-24, con il suo meccanismo.
- [ ] L'ADR 0041 esiste, ed è `Accettata` con il rosso che l'ha dimostrata accanto.
- [ ] Il grafo e l'indice in [README.md](README.md) portano D035.
- [ ] Le correzioni rispetto a com'era scritta questa delega sono scritte in fondo.

## Trappole note

1. **`toExpNeg` è la metà che si dimentica.** La soglia di notazione ha due versi, e il negativo non
   morde oggi solo perché tutto arrotonda ai centesimi. Pinnarne uno solo lascia in piedi
   esattamente il difetto che questa delega chiude, con l'altro segno, e lo lascia in piedi in un
   file che dichiara di aver risolto il problema — che è peggio di non averlo toccato.

2. **Spostare una dipendenza in `devDependencies` cambia cosa `externalizeDepsPlugin` esternalizza.**
   Quel plugin legge l'elenco delle `dependencies` per decidere cosa **non** impacchettare nel main
   e nel preload. `zod` deve restare dov'è: è l'unica che il main richiede davvero a runtime, e
   spostarla la farebbe finire dentro il bundle del main — dove funzionerebbe, il che è il modo
   peggiore in cui un errore può presentarsi. Dopo lo spostamento, `verify:release` va guardato
   **nell'output**, non nel codice d'uscita: si controlla che `out/main/index.js` continui a
   dichiarare `zod` fra i suoi import esterni.

3. **La minificazione può far comparire un difetto che c'era già.** Un bundle non minificato
   perdona cose che uno minificato no — un confronto che si appoggia al nome di una funzione, un
   `Function.prototype.name` letto a runtime. Se qualcosa si rompe dopo il punto 2, il difetto **non
   è la minificazione**: è qualcosa che stava nascosto dietro di essa. Va cercato lì, non spento
   rimettendo `minify: false`.

4. **`grep` sulla frase intera non basta, e in questo progetto è già successo.** La lezione è
   scritta in [PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md): «quando correggi un fatto
   sbagliato, cerca il concetto, non la frase» — «progresso offline» era scritto in quattro punti e
   corretto in due. I sette punti del punto 4 sono quelli che l'audit ha trovato cercando `home`
   con i confini di parola: chi esegue cerchi anche «schermata principale», «pagina principale» e
   «cruscotto sotto».

5. **La tabella dei pesi del punto 2 invecchia mentre la delega si esegue.** Sono misure del
   2026-08-22 su questo commit; se la delega si esegue dopo che `src/` si è mosso, vanno rifatte
   invece che ricopiate. Il numero che **non** invecchia è il rapporto: ApexCharts pesa più del
   triplo di tutto il resto.

6. **Il selettore del punto 7 espone due `Pool`, non due `Money`.** Un `Money` nudo esposto da uno
   store Pinia viene avvolto in un proxy reattivo alla lettura, ed è la trappola per cui metà dei
   `ref` di quel file sono `shallowRef`. Un `Pool` è una stringa e non ha quel problema — ma il
   selettore vive in mezzo a quelli che ce l'hanno, e copiarne la forma senza copiarne la ragione è
   il modo in cui una convenzione diventa un culto.

## La decisione aperta

Va presa con l'utente **durante** l'esecuzione, e non blocca il resto della delega: riguarda solo il
punto 6, e il conteggio va corretto in ogni caso.

**Il grilletto del router è scattato?** La riga dice «la terza destinazione con una gerarchia». Le
destinazioni sono cinque e la colonna le raggruppa in due gruppi da D026.

- **A — sì, ed esce dal registro.** Allora serve una delega sua: `vue-router` è una dipendenza,
  quindi un ADR ([ADR 0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md)), e la
  navigazione è oggi un `ref` in `App.vue` che cinque viste leggono. Non si fa qui.
- **B — no, e il grilletto si riscrive.** «Gerarchia» voleva dire schermate **dentro** altre
  schermate, non gruppi in una colonna; il `ref` regge cinque destinazioni piatte come ne reggeva
  due. Allora la riga resta nel registro con un grilletto detto meglio, e senza il conteggio —
  perché un conteggio in un grilletto è la cosa che è appena scaduta.

**Chi scrive propende per B**, e la ragione è misurabile invece che estetica: nessuna delle cinque
destinazioni è raggiungibile da fuori, nessuna ha uno stato nell'URL, e nessuna ne contiene un'altra.
La gerarchia è nella **colonna**, non nella navigazione. Ma è una decisione dell'utente, e questa
delega non la prende.
