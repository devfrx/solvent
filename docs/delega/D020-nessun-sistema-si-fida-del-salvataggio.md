# D020 — Nessun sistema si fida del proprio salvataggio

- **Stato:** Aperta — scritta il 2026-08-20, studiando la validazione dello stato caricato prima di
  eseguire [D017](D017-il-caveau.md)
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
- **Venti test di regola** in `tests/rules/`, con `registry-completeness` come modello più vicino.

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

`loadAll` salta i sistemi il cui `id` non compare nella mappa: la spazzatura va passata **sotto
l'id del sistema**, o il test è verde senza aver provato niente. È la trappola principale di questa
delega.

Un sistema il cui stato salvato non ha campi non ha niente da mutare al punto 2, e per lui valgono
solo il 3 e il 4. Oggi non ce n'è nessuno; il test lo dichiari invece di fallire.

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

- [ ] `npm run verify` verde, con l'**output incollato**
- [ ] il test **fallisce** se si toglie a mano la validazione dal `load` di `income` — provato, non
      supposto: è l'unica prova che la regola morda
- [ ] il test passa con lo stato buono ricaricato, e la controprova è dentro il file
- [ ] la spazzatura è passata sotto l'`id` del sistema, e un commento dice perché — altrimenti il
      prossimo che lo legge lo "semplifica"
- [ ] `docs/tracciabilita.md`: INV-20 ha la sua riga e il suo meccanismo
- [ ] `docs/architettura.md`: la regola compare fra quelle fatte rispettare da un test

Il [registro YAGNI](../roadmap-fette.md) è **già** aggiornato, scrivendo questa delega: la voce
«meccanismo condiviso per validare lo stato salvato» è stata sostituita da quella dell'**aiutante**,
col grilletto del primo stato non banale. Non c'è niente da togliere eseguendo — la domanda era
posta lì, e la risposta è questa delega.

## Trappole note

- **Il test verde che non ha provato niente.** `loadAll` salta gli id assenti dalla mappa: una
  spazzatura passata come `{}` non raggiunge nessun `load`, e il test è verde. Si scopre solo
  rompendo `income` di proposito, che è la seconda spunta della definizione di fatto.
- **La tentazione di aggiungere il campo al tipo.** `defineSystem` che chiede un validatore
  sembra più forte perché lo ferma il compilatore. Garantisce che il campo esista, non che
  funzioni: un validatore che ritorna sempre `true` compila benissimo. Ed è una modifica al
  **kernel** per una regola che il kernel non deve conoscere.
- **A17.** È una delega di settanta righe che tocca il punto in cui entra tutto ciò che viene da
  fuori. La voglia di «già che ci sono» qui si chiama zod, aiutanti e schemi dichiarativi: tutti
  hanno un grilletto scritto, e nessuno è scattato.
