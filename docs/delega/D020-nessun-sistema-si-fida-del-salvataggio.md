# D020 — Nessun sistema si fida del proprio salvataggio

- **Stato:** **Chiusa** — scritta il 2026-08-20 studiando la validazione dello stato caricato prima
  di eseguire [D017](D017-il-caveau.md), **preparata per l'esecuzione** subito dopo
  [D019](D019-il-pagamento.md) — il test scritto davvero, eseguito e poi ritirato — ed eseguita lo
  stesso giorno: ramo `d020-validazione-del-salvataggio`. Vedi _Cosa la preparazione ha verificato_
  e _Come è andata_ in fondo
- **Dipende da:** D013 (tutta la fetta 01). **Non** dipende da [D019](D019-il-pagamento.md): sono
  due lavori che non si toccano
- **Sblocca:** [D017](D017-il-caveau.md), che porta il **secondo** dominio con stato. E ogni dominio
  con stato che verrà
- **ADR vincolanti:** nessuno nuovo. Ne tocca due: 0002 (il Registry è l'unica lista) e 0004 (il
  contratto di salvataggio è del main)
- **Regole:** nessuna nuova. Un invariante nuovo: **INV-20**
- **Budget:** ~70 righe di test e **zero righe di sorgente**. È una regola, e le regole in questo
  progetto sono test

## Obiettivo

Rendere impossibile che un dominio con stato accetti in silenzio un salvataggio che non riconosce.

## Perché esiste, e perché adesso

`SystemsSave` è **opaco per tutti**. Lo schema del main dichiara
`z.record(z.string(), z.unknown())` e non guarda dentro (ADR 0004: il main conosce la busta, non il
motore). `loadAll` fa l'unico cast del progetto e lo avvolge in un `try`/`catch`.

Ne discende che **l'unico posto che può guardare quello stato è il `load` del sistema stesso**.
`income` lo fa, in tre righe, e il commento accanto spiega perché:

> Un salvataggio manomesso o prodotto da una versione bacata arriva fin qui intatto, e questo è
> l'unico punto che può guardarlo.

**Il problema non è la duplicazione.** Il caveau copierà quelle tre righe e sarà noia. Il problema è
il **terzo** dominio, che scrive `load: (loaded) => { state = loaded }` e passa tutti i gate: lint
verde, tipi verdi, test verdi. Il difetto si vede mesi dopo, su un salvataggio rotto, e nel
frattempo il gioco ha caricato uno stato che nessuno ha controllato.

Oggi **niente obbliga a validare**, ed è la forma esatta del difetto A01: cinque liste tenute a
mano, e quella dimenticata falliva in silenzio.

**Perché prima di D017 e non insieme.** Il caveau è il secondo dominio con stato: se la regola
nascesse nella stessa delega del codice che deve sorvegliare, la scriverebbe la stessa persona
nello stesso momento, e non sorveglierebbe niente. È l'argomento di
[D001](D001-tooling-e-gate.md), che il progetto ha già accettato una volta: **le regole devono
esistere prima del codice che governano.**

## Cosa trovi già fatto

- **`registry.saveAll()`** ritorna la `SystemsSave` di tutti i sistemi con stato: è lo **stato
  buono**, prodotto dai sistemi stessi, e il test parte da lì invece di inventarselo.
- **`loadAll` ritorna un `Result`**: un `load` che lancia diventa
  `error.registry.load_failed` con l'`id` e la causa. Il test non ha bisogno di guardare dentro le
  eccezioni.
- **Il fallimento è già gestito bene.** Se `game.load` fallisce, lo store va in `failed`, mostra
  l'errore tradotto in due lingue e **non scrive sul disco**: è la correzione di
  [D016](D016-correzioni-audit.md), e questa delega non la tocca.
- **`income` valida già**, ed è il caso di prova che dimostra che il test passa quando deve.
- **Ventisei test di regola** in `tests/rules/`. Attenzione: **nessuno di loro esegue il gioco**
  — ventitré leggono i sorgenti come testo, e l'unico import di valore da `src/` è `POOLS`,
  cioè dati. `registry-completeness` non è quindi il modello più vicino: è uno scanner di
  sorgenti, e questo test è un comportamento. Il modello per la parte che costruisce una
  partita è `tests/save/game-roundtrip`. Vedi il punto 4 della preparazione.

## Da produrre

| File                                                  | Contenuto                                                                                            |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `tests/rules/stateful-systems-reject-garbage.test.ts` | il test: ogni sistema con stato rifiuta un salvataggio che non riconosce, e l'errore porta il suo id |

Nessun file sotto `src/` viene toccato. Se eseguirla fa venire voglia di scrivere codice, la
regola sta cambiando in qualcos'altro.

### Come il test trova la spazzatura

Non la inventa: la **deriva** dallo stato buono, ed è ciò che lo rende generico e forte insieme.

1. Costruisce una partita e chiama `saveAll()`. Per ogni sistema con stato ottiene il proprio stato
   valido, nella forma che quel sistema produce.
2. **Per ogni campo** di quello stato, ne sostituisce il valore con uno di tipo diverso — un
   booleano diventa `0`, `'x'`, `null`, `{}` — e pretende che `loadAll` ritorni
   `error.registry.load_failed` con l'`id` giusto.
3. **Per lo stato intero**, prova `null`, `undefined`, un numero, una stringa, un array e un
   oggetto vuoto, e pretende lo stesso.
4. Come controprova, ricarica lo stato **buono** e pretende che passi. Un test che vede solo rosso
   non distingue «valida bene» da «rifiuta tutto».

Il punto 2 è quello che conta, ed è la ragione per cui il test non si accontenta di `null` e `{}`:
un `load` scritto male quasi sempre controlla che l'oggetto esista e non che i campi abbiano il tipo
giusto. `{ upgraded: 'sì' }` è il salvataggio che passa i controlli pigri.

`loadAll` salta i sistemi il cui `id` non compare nella mappa, quindi la spazzatura va passata
**sotto l'id del sistema**, e gli id si **derivano da `registry.systems()`** invece di scriverli.
Scritti a mano, uno sbagliato o invecchiato prova un altro sistema o nessuno — e la preparazione ha
misurato che in quel caso il test diventa **rosso**, non verde, perché pretende un fallimento che
non arriva. Rosso per la ragione sbagliata è comunque un'ora persa: vedi il punto 2 della
preparazione.

Un sistema il cui stato salvato non ha campi non ha niente da mutare al punto 2, e per lui valgono
solo il 3 e il 4. Oggi non ce n'è nessuno; il test lo dichiari invece di fallire. La forma già usata
nel progetto è il `verdictOf` di `tests/rules/registry-completeness`: una funzione pura dei numeri,
provata direttamente, così il caso che oggi non si presenta è comunque coperto. Costa una decina di
righe, ed è dentro il budget (punto 3 della preparazione).

**Il tipo sbagliato si sceglie per `typeof`, e `typeof` non distingue un array da un oggetto.** Per
un booleano la lista giusta esce da sé — `0`, `1.5`, `'x'`, `''`, `null`, `undefined`, `{}`, `[]` —
ma il giorno in cui uno stato salvato avrà un campo **array**, `{}` verrà scartato come «stesso
tipo» e quel campo sarà provato peggio degli altri. Il test lo dichiari adesso, invece di scoprirlo
allora: il primo array salvato ha già un grilletto nel [registro YAGNI](../roadmap-fette.md).

## Invarianti

- **INV-20 — nessun sistema con stato accetta un salvataggio che non riconosce.** Non è un campo da
  dichiarare né una firma da rispettare: è un **comportamento**, e il test lo verifica su ogni
  sistema registrato. Un dominio che dichiarasse un validatore finto sarebbe rosso lo stesso, ed è
  la ragione per cui la regola è un test invece di un tipo.

## Fuori scope

- **Un aiutante condiviso per scrivere i validatori.** Con due domini e due stati banali — un
  booleano, un numero — un aiutante sarebbe generalizzato da due casi identici, e i messaggi che
  uniformerebbe sono messaggi da sviluppatore: il giocatore vede `error.registry.load_failed` con
  l'id, non il testo interno. Il grilletto va nel [registro YAGNI](../roadmap-fette.md): **il primo
  stato salvato non banale** — un array, un oggetto annidato, una mappa.
- **Zod dentro `core/`.** Oggi `zod` vive solo in `src/main/save/`, e `core/` ha una sola dipendenza
  esterna: `decimal.js`. Portarcene una seconda per validare due booleani è un prezzo strutturale
  pagato per un beneficio di tre righe.
- **Il `load` parziale.** Se un sistema rifiuta, fallisce l'intero caricamento — ed è giusto:
  accettare metà stato darebbe una partita incoerente, che è peggio di una schermata d'errore. È già
  così, e non si tocca.
- **La validazione della busta.** È del main, ed è zod (ADR 0004). Questa delega guarda solo dentro
  `systems`, che la busta non conosce.

## Definizione di fatto

- [x] `npm run verify` verde, con l'**output incollato**
- [x] il test **fallisce** se si toglie a mano la validazione dal `load` di `income` — provato, non
      supposto: è l'unica prova che la regola morda
- [x] il test passa con lo stato buono ricaricato, e la controprova è dentro il file
- [x] la spazzatura è passata sotto l'`id` del sistema, e un commento dice perché — altrimenti il
      prossimo che lo legge lo "semplifica"
- [x] `docs/tracciabilita.md`: INV-20 ha la sua riga e il suo meccanismo
- [x] `docs/architettura.md`: si **estende la riga 7** della tabella «Le regole e chi le fa
      rispettare» — il tipo garantisce che un `load` esista, e non dice niente su cosa quel `load`
      accetta. Non si aggiunge una quattordicesima riga: quella tabella è numerata R01..R13 e INV-20
      è un invariante, non una regola con un ID (punto 8 della preparazione)
- [x] `docs/stato.md` rigenerato con `npx vitest run tests/rules/project-state -u`: un file in più
      sotto `tests/` cambia un conteggio, ed è la delega in cui è più facile dimenticarlo perché non
      tocca `src/` (punto 9 della preparazione)

Il [registro YAGNI](../roadmap-fette.md) è **già** aggiornato, scrivendo questa delega: la voce
«meccanismo condiviso per validare lo stato salvato» è stata sostituita da quella dell'**aiutante**,
col grilletto del primo stato non banale. Non c'è niente da togliere eseguendo — la domanda era
posta lì, e la risposta è questa delega.

## Trappole note

- **Il test che non ha provato niente — ma non diventa verde, diventa rosso.** `loadAll` salta gli
  id assenti dalla mappa: `loadAll({})` ritorna `ok({ ignored: [] })` e `loadAll({ guasto: … })`
  ritorna `ok({ ignored: ['guasto'] })`. Un test che **pretende un fallimento** se ne accorge subito.
  La trappola resta reale in una forma sola: gli id scritti a mano, uno dei quali sbagliato o
  invecchiato. A chiuderla non è il commento — è **derivare gli id da `registry.systems()`**, e il
  commento serve a dire perché quella derivazione non si «semplifica» (punto 2 della preparazione).
- **La tentazione di aggiungere il campo al tipo.** `defineSystem` che chiede un validatore
  sembra più forte perché lo ferma il compilatore. Garantisce che il campo esista, non che
  funzioni: un validatore che ritorna sempre `true` compila benissimo. Ed è una modifica al
  **kernel** per una regola che il kernel non deve conoscere.
- **A17.** È una delega di settanta righe che tocca il punto in cui entra tutto ciò che viene da
  fuori. La voglia di «già che ci sono» qui si chiama zod, aiutanti e schemi dichiarativi: tutti
  hanno un grilletto scritto, e nessuno è scattato.

## Cosa la preparazione ha verificato

Fatta il 2026-08-20, subito dopo [D019](D019-il-pagamento.md), e non è stata una rilettura: il test
è stato **scritto davvero**, eseguito, rotto di proposito e poi **ritirato**. Nel repo non è rimasta
una riga; sono rimaste le misure. Dodici punti, e il secondo riscrive la trappola principale.

**1. La regola morde, e morde anche contro un `load` pigro.** Tolta la validazione dal `load` di
`income`, due casi diventano rossi — è la seconda spunta della definizione di fatto, ed è verificata.
Poi la misura che conta di più: sostituito il controllo di tipo con quello **pigro** che un dominio
scrive per sbaglio — «l'oggetto esiste ed è un oggetto» invece di «il campo è un booleano» — gli
stessi due casi restano rossi. È esattamente il difetto descritto in _Come il test trova la
spazzatura_, e adesso si sa che il punto 2 lo prende davvero.

**2. La trappola principale, come era scritta, non si riproduce.** La delega diceva: «una spazzatura
passata come `{}` non raggiunge nessun `load`, e il test è verde». Misurato: `loadAll({})` ritorna
`ok({ ignored: [] })` e `loadAll({ guasto: … })` ritorna `ok({ ignored: ['guasto'] })` — ma un test
che **pretende un fallimento** diventa **rosso**, non verde. Provato mettendo davvero la spazzatura
sotto un id inventato: rosso. La trappola resta reale in una forma sola — gli id scritti a mano, uno
dei quali sbagliato — e a chiuderla non è il commento chiesto dalla definizione di fatto: è
**derivare gli id da `registry.systems()`**. Il commento serve a spiegare perché quella derivazione
non si semplifica, ed è per quello che va scritto. Il testo della delega è stato corretto in due
punti.

**3. Il budget è giusto, e non è una stima.** Il test scritto davvero misura **67 righe di codice**
contro le ~70 dichiarate, con il metodo di `codeLines`. Produce sette casi `it` ed esegue in 10 ms:
non sposta il gate. C'è margine per la decina di righe del `verdictOf` del punto 6.

**4. `registry-completeness` non è il modello più vicino, e la scoperta riguarda dove va il file.**
In `tests/rules/` ci sono **26** file, **23** dei quali leggono i sorgenti come testo tramite
`tests/helpers/sources`; l'unico import di valore da `src/` in tutta la cartella è `POOL_IDS` e
`POOLS`, cioè **dati**. **Nessuno costruisce una partita.** Questo test sarebbe il primo, e va
dichiarato come scelta invece di capitarci dentro — la stessa cosa che `import-graph` fa quando
dichiara cosa il diagramma modella e cosa no.

La scelta è comunque **restare in `tests/rules/`**, e la ragione è la stessa che fa rifiutare il
campo in `defineSystem`: INV-20 è un **comportamento**, e la sua versione leggibile dai sorgenti —
«ogni `load` contiene un `throw`» — sarebbe la forma aggirabile con tre righe finte. Che questa
regola si possa provare **solo** eseguendo è il suo tratto, non un incidente. La prima riga del
commento del file lo dica.

**5. Oggi c'è un sistema con stato solo, e il suo stato ha un campo solo.** `registry.saveAll()` dà
`{ income: { upgraded: false } }`. Ne discendono due cose che chi esegue deve avere in mente: il
punto 2 della delega gira su **un** campo booleano, e la controprova del punto 4 pesa quanto il
punto 2 — con un campo solo, «valida bene» e «rifiuta tutto» sono a un passo. La regola diventa
davvero interessante con il caveau, che è esattamente il motivo per cui viene prima.

**6. Il caso «sistema senza campi» ha già la sua forma nel progetto, e costa poco.** È il `verdictOf`
di `registry-completeness`: una funzione pura provata direttamente, così il caso che oggi non si
presenta è coperto lo stesso. Una decina di righe, dentro il budget del punto 3. Senza, l'unica
scrittura possibile è un `expect(fields.length).toBeGreaterThan(0)` che **fallisce** invece di
dichiarare — che è proprio ciò che la delega chiede di non fare.

**7. La spazzatura si sceglie per `typeof`, e `typeof` ha un buco dichiarato.** Per un booleano la
lista esce da sé e va bene. Ma `typeof []` è `'object'` come `typeof {}`: il giorno in cui uno stato
salvato avrà un campo **array** — il primo `boundedList` che finisce sul disco, che ha un grilletto
nel [registro YAGNI](../roadmap-fette.md) — `{}` verrà scartato come «stesso tipo» e quel campo sarà
provato peggio degli altri. Il limite si dichiara nel file, come fanno le altre regole ⚠️.

**8. La definizione di fatto chiedeva una riga in `architettura.md` che non ha dove andare.** Quella
pagina ha «Le regole e chi le fa rispettare», numerata **1..13**, cioè R01..R13. INV-20 non è una
regola con un ID: è un invariante, e il suo posto è la tabella degli invarianti di
[tracciabilita.md](../tracciabilita.md), che la delega già chiede. In `architettura.md` la riga
giusta è la **7** — «Se un sistema ha stato, ha save/load/reset» — che oggi dice cosa il tipo
garantisce e tace su ciò che il tipo **non** garantisce: quale stato quel `load` accetta. Si estende
quella riga. Inventarne una quattordicesima creerebbe una R14 che nessun documento ha deciso.

**9. Aggiungere un file sotto `tests/` rende rosso `project-state`.** Misurato: i file di test
passano da 61 a 62, e `docs/stato.md` li conta. È voluto (C11) e si rigenera con
`npx vitest run tests/rules/project-state -u`. La definizione di fatto non lo diceva, ed è la delega
in cui è più facile dimenticarlo: non tocca `src/`, quindi «non ho cambiato niente da contare»
sembra vero. Adesso è una spunta.

**10. Il conteggio «venti test di regola» era invecchiato: sono 26.** Corretto nel testo, insieme
alla riga sul modello. Un numero scritto una volta e mai più rimisurato è il difetto che questo
progetto insegue da tre audit.

**11. `isStateful` non è esportato dal Registry, e non serve esportarlo.** Il test rifà la stessa
domanda in una riga — `system.save !== undefined` — e il tipo la restringe correttamente, perché
`Stateless.save` è `never`. Esportarlo sarebbe una modifica a `src/`, che questa delega vieta a se
stessa: una riga ripetuta in un test è più onesta di un'apertura del kernel fatta per comodità di
chi lo prova.

**12. Un vicino trovato per strada: `tracciabilita.md` diceva «Le 12 regole, per ID» sopra una
tabella che ne elenca 13.** R13 è arrivata con [D022](D022-il-confine-disegnato-e-il-confine-vero.md)
e il titolo è rimasto indietro. `tests/rules/docs-facts` non lo vede, e non è un buco: «regole» è
fuori dal suo elenco di cose contate **apposta**, perché includerla produceva una ventina di falsi
positivi. È il difetto di D021 sopravvissuto in un punto cieco dichiarato. Il numero è stato **tolto
dal titolo** invece che aggiornato — aggiornarlo lo avrebbe fatto scadere di nuovo alla prossima
regola.

### Cosa la preparazione **non** ha cambiato

- **Il fuori scope resta intero.** Nessun aiutante condiviso, niente zod in `core/`, nessun campo
  richiesto da `defineSystem`. Scrivendo il test la voglia non è mai arrivata: con un sistema solo
  non c'è niente da condividere.
- **Il budget resta ~70 righe di test e zero di sorgente**, ed è stato confermato da una misura
  invece che da una stima.
- **L'ordine resta quello.** D020 prima di [D017](D017-il-caveau.md): la regola esiste prima del
  secondo dominio con stato, che è il primo che potrebbe dimenticarsene.

## Come è andata

Eseguita il 2026-08-20, sul ramo `d020-validazione-del-salvataggio`.

**Budget.** Dichiarate ~70 righe di test e **zero di sorgente**. Misurate **70 righe di test** —
righe di codice, commenti e righe vuote escluse, con il metodo di `codeLines` — e **zero di
sorgente**: `git diff --stat -- src/` è vuoto. Il budget è centrato sulla riga, e non è bravura: è
che la preparazione lo aveva **misurato** scrivendo il test invece di stimarlo. Le altre deleghe
hanno stimato, e sono finite sotto o sopra.

Il file produce **sei** casi `it` ed esegue in 9 ms. Rotto di proposito **quattro** volte, e ogni
rottura è servita a una domanda diversa — sono elencate qui sotto.

### Le quattro rotture, e cosa ha detto ciascuna

| Cosa si rompe                                                              | Cosa diventa rosso                  |
| -------------------------------------------------------------------------- | ----------------------------------- |
| La validazione tolta dal `load` di `income` (`state = loaded`)             | due casi: i campi e lo stato intero |
| Il controllo **pigro** — «è un oggetto» invece di «il campo è un booleano» | gli stessi due                      |
| Un `load` che rifiuta **tutto**                                            | solo la controprova                 |
| Gli id scritti a mano invece che derivati (`['reddito']`)                  | lo stato intero                     |

La seconda è quella che conta, e conferma il punto 1 della preparazione: il difetto vero non è il
`load` che non controlla niente — è quello che controlla la cosa sbagliata. La terza la
preparazione l'aveva **temuta** senza misurarla (punto 5); adesso si sa che a fermarla è solo il
punto 4. La quarta conferma il punto 2: un id invecchiato è **rosso**, non verde, e il caso lo
annuncia da sé — il titolo diventa «reddito salva uno stato senza campi».

### Correzioni rispetto a com'era scritta

**1. Il ramo non parte da `main`, e chi esegue deve saperlo.** `main` è fermo a `5f087ea`, che
precede [D019](D019-il-pagamento.md): il ramo `d019-il-pagamento` non è stato fuso. Partire da
`main` avrebbe perso il listino e riaperto una delega chiusa. Il ramo di D020 parte quindi dalla
punta di `d019-il-pagamento`. Non è un difetto di questa delega — è uno stato del repo che nessun
documento dice, e la prossima delega lo trova uguale.

**2. «Ventisei test di regola» sono venticinque, e il ventiseiesimo era il test stesso.** La delega
lo scrive in _Cosa trovi già fatto_ e ai punti 4 e 10 della preparazione. Misurato adesso:
`tests/rules/` ne contiene venticinque, e i ventitré che leggono i sorgenti come testo sono giusti.
La preparazione ha contato mentre il proprio test esisteva, e ritirandolo ha lasciato il numero
indietro di uno — cioè il difetto di [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) nato
dentro la frase che lo annunciava. Con questo file il conto torna a essere quello, il che rende la
riga vera di nuovo e non meno pericolosa: nessun documento **vivo** lo ripete.

**3. I casi `it` sono sei, non sette.** La preparazione ne aveva misurati sette. La differenza è
una scelta: la **controprova sta fuori dal ciclo sui sistemi**, perché ricarica lo stato buono
_intero_ e non dipende da quale sistema si stia guardando. Dentro il ciclo sarebbe lo stesso caso
ripetuto una volta per dominio, che con il caveau diventerebbero due identici.

**4. Il piano porta lo stato, non l'elenco dei nomi.** La delega descrive la funzione pura come
«una funzione pura dei numeri», sul modello del `verdictOf` di `registry-completeness`. Ritornare i
**nomi** dei campi avrebbe costretto a rileggere il valore buono da uno `unknown`, cioè a un cast.
`planFor` ritorna invece il record già ristretto da un predicato di tipo, e il file non contiene
**nessun cast** — che in un test il cui argomento è l'unico cast del progetto non è un dettaglio.

**5. Il caso «nessun sistema con stato» non era nella delega, ed è la stessa trappola.** Se un
giorno non ne restasse nessuno, il ciclo produrrebbe **zero** casi e il file sarebbe verde senza
aver provato niente — la trappola principale, entrata dalla porta che la derivazione degli id apre.
Una riga la chiude: `statefulIds.length` maggiore di zero, con la sua descrizione che dice perché.

**6. `toMatchObject` invece di `toEqual`, ed è la prima volta nel progetto.** Gli errori si
verificano altrove con `toEqual` e `expect.any(Error)` (`tests/kernel/registry.test.ts`). Qui
sarebbe **troppo stretto**: INV-20 dice che il sistema rifiuta, non che cosa lancia, e un dominio
che lanciasse qualcosa che non è un `Error` renderebbe questo file rosso per la ragione sbagliata —
che è l'ora persa di cui parla la delega. `toMatchObject` afferma esattamente la regola: l'esito
porta quel codice e quell'id, e nient'altro.

**7. La riga 7 di `architettura.md` cambia anche di forza, non solo di testo.** Era `🔒`. Il tipo
resta impossibile da aggirare, ma la metà nuova — quale stato quel `load` accetta — è un test:
`🔒 / ✅`, nella forma che la riga 12 di quella tabella già usa. La definizione di fatto chiedeva di
estendere la riga e non lo diceva.

**8. `qualita.md` portava un numero che questa delega fa scadere.** «558 test in 61 file» era la
misura di [D019](D019-il-pagamento.md), e un file di test in più la invalida. Rimisurata e
riscritta con la data accanto, che è l'unica difesa che quel numero ha (regola C11: il tempo e il
numero di test non sono derivabili dal repo, e stanno lì apposta).

**9. E un vicino trovato per strada: quella stessa riga violava C11.** «558 test **in 61 file**» —
i file di test [stato.md](../stato.md) li **conta**, quindi era un fatto contabile ripetuto in un
documento vivo. `tests/rules/docs-facts` non poteva vederlo: cerca un numero accanto ad «ADR»,
«documenti» o «markdown», e «file» è fuori da quell'elenco, dove le altre due parole contate stanno
fuori **apposta** per non gridare al lupo. È il punto cieco dichiarato di
[D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) che colpisce una seconda volta, dopo il
titolo di `tracciabilita.md` del punto 12 della preparazione. Il conteggio dei file è stato
**tolto**, non aggiornato: il numero di test resta, perché non è derivabile senza eseguirli.

### Cosa questa delega lascia a [D017](D017-il-caveau.md)

Il caveau nasce dentro una regola che esiste già, ed è tutto il punto. Tre cose concrete:

- **Il suo `load` deve rifiutare i tipi sbagliati campo per campo.** Copiare le tre righe di
  `income` va benissimo: il grilletto dell'aiutante condiviso è il primo stato **non banale**, e
  una capienza non lo è.
- **Non serve toccare questo file.** I sistemi si derivano dal Registry: registrare il caveau lo
  mette sotto la regola da solo, ed è la differenza fra questo test e una lista scritta a mano.
- **Il primo campo `array` che finisce nel salvataggio fa scattare il limite dichiarato in testa
  al file** — `typeof []` è `'object'` come `typeof {}` — e con esso la voce del
  [registro YAGNI](../roadmap-fette.md). Il caveau, da solo, non lo fa scattare: dà una capienza,
  non un inventario.
