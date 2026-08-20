# D021 — Un numero che nessuno conta non si scrive

- **Stato:** Chiusa — commit `289c2f1`, ramo `d021-un-numero-che-nessuno-conta-non-si-scrive`.
  Scritta ed eseguita il 2026-08-20 dall'audit dell'intera codebase e di tutti i documenti, fatto
  allo STOP 2 dopo la chiusura di [D013](D013-verifica-della-fetta.md)
- **Dipende da:** D013 (tutta la fetta 01). **Non** dipende da nessuna delega aperta
- **Sblocca:** tutto ciò che aggiunge documenti, cioè ogni delega futura. In particolare
  [D017](D017-il-caveau.md) e [D018](D018-la-scheda-di-dominio.md), che insieme ne aggiungono
  almeno cinque
- **ADR vincolanti:** nessuno nuovo. Ne applica due che esistono già:
  [0013](../adr/0013-prettier-e-autorita-sulla-formattazione.md) e
  [0014](../adr/0014-una-fetta-verticale-alla-volta.md)
- **Regole:** due regole nuove — **C11** e **C12** — entrambe di processo, entrambe con il proprio
  meccanismo. Nessun invariante nuovo, e non è una dimenticanza: un invariante è una conseguenza di
  una decisione sul dominio, e qui il dominio non si tocca
- **Budget:** ~330 righe di test e ~130 di documentazione. **Zero righe di sorgente**, ed è una
  condizione di correttezza, non una stima — come in [D018](D018-la-scheda-di-dominio.md) e in
  [D020](D020-nessun-sistema-si-fida-del-salvataggio.md)

## Obiettivo

Togliere ai documenti il compito di ridire fatti che la macchina può contare.

## Perché esiste, e perché adesso

Il rischio **N07** — «la documentazione può disallinearsi dal codice» — è l'unico che
[rischi.md](../rischi.md) classifica **alto**, e si è già realizzato due volte:

- **dopo D005**: quindici disallineamenti su cinquanta documenti, corretti tutti tranne uno;
- **il 2026-08-20**, con l'audit che ha prodotto [D016](D016-correzioni-audit.md): «sei affermazioni
  numeriche di documenti vivi erano invecchiate senza far rumore».

L'audit di questa delega, fatto lo stesso giorno di D016 e poche ore dopo, ne ha trovate **altre
sei**, più due difetti di forma e uno di evidenza. Non è disattenzione: è che la correzione di D016
è stata un **aggiornamento** e non un meccanismo, e un aggiornamento protegge il giorno in cui lo
si esegue e nessun altro.

Il momento è adesso per la ragione che il progetto ha già accettato due volte, a
[D001](D001-tooling-e-gate.md) e a [D020](D020-nessun-sistema-si-fida-del-salvataggio.md): **le
regole devono esistere prima del codice che governano.** Qui il «codice» sono i documenti, e la
fetta 02 ne scrive cinque — le tre deleghe aperte, la scheda di dominio e le sue tre compilazioni.
Ogni documento aggiunto prima del meccanismo è un documento in più da rileggere a mano dopo.

## Cosa l'audit ha trovato

Dodici difetti, nessuno critico, **nessuno nel codice sorgente**. Gli ID sono quelli del rapporto e
restano stabili: un difetto corretto si marca, non si rinumera.

La colonna _Dove_ porta la **frase**, non il numero di riga. Non è pigrizia: scrivendo questa
delega, aggiungere la sua riga alla tabella di stato del passaggio di consegne ha spostato di uno i
numeri che questa tabella citava. Un numero di riga è precisamente un fatto che nessuno conta, ed è
ciò di cui parla la delega.

| ID          | Difetto                                                            | Dove — la frase da cercare                                                                                                                         | Severità |
| ----------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **AUD-001** | «Non resta aperta nessuna delega» mentre ne sono aperte cinque     | [PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md) — «Non resta aperta nessuna delega»                                                           | alto     |
| **AUD-002** | «gli ADR `Proposta` sono tre»: sono sei                            | [PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md) — «Gli ADR `Proposta` sono tre»; [docs/README.md](../README.md) — «Restano _Proposta_ in tre» | alto     |
| **AUD-003** | La mappa non conosce gli ADR 0025–0027 né le deleghe aperte        | [docs/README.md](../README.md) — sezione _Stato attuale_                                                                                           | medio    |
| **AUD-004** | L'albero delle cartelle cita 24 ADR su 27                          | [architettura.md](../architettura.md) — «adr/0001..0024-\*.md»                                                                                     | basso    |
| **AUD-005** | «i cinquanta documenti del progetto» sono sessantacinque           | [convenzioni.md](../convenzioni.md) — «i cinquanta documenti del progetto»                                                                         | basso    |
| **AUD-006** | I gate dicono «fra 42 e 45 s»: misurati **33,5 s**                 | [qualita.md](../qualita.md) e [roadmap-fette.md](../roadmap-fette.md)                                                                              | basso    |
| **AUD-007** | Una voce del registro YAGNI è resa come prosa, non come tabella    | [roadmap-fette.md](../roadmap-fette.md) — «Il denaro formattato dal `Decimal`», in coda a _Nell'applicazione_                                      | medio    |
| **AUD-012** | L'indice delle deleghe non elenca D020                             | [README.md](README.md) — tabella _Indice_                                                                                                          | basso    |
| **AUD-009** | L'ADR 0026 si contraddice sulla soglia e motiva un guasto irreale  | [adr/0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md) — _Contesto_                                                                      | medio    |
| **AUD-008** | Il diagramma dell'architettura omette sette archi reali e tre nodi | [architettura.md](../architettura.md) — blocco `mermaid`                                                                                           | medio    |
| **AUD-010** | Il grilletto della purezza di `rules.ts` scatta dentro D017        | [roadmap-fette.md](../roadmap-fette.md) — registro YAGNI, _Negli strumenti_                                                                        | medio    |
| **AUD-011** | I numeri di presentazione non hanno casa né sorvegliante           | `stores/game.ts`, `components/rotation.ts`                                                                                                         | basso    |

**Questa delega chiude i primi nove.** AUD-008, AUD-010 e AUD-011 sono di un'altra famiglia — sono
confini del **codice** che oggi tiene la review, non fatti scritti nei documenti — e stanno in
_Fuori scope_ con il loro perché.

### Le due radici

**R1 — il gate sui documenti copre i collegamenti, non i fatti.** `tests/rules/doc-links` verifica
che ogni link e ogni ancora risolvano. Nessun meccanismo verifica che un numero scritto in prosa sia
vero. Da sola questa frase descrive un buco; quello che spiega **perché** il buco si riempie sempre
è un'altra cosa: i documenti **ridicono** fatti che la macchina può contare, ed è la violazione di
una regola che il progetto ha già scritto per sé — «I documenti non duplicano il codice»
([docs/README.md](../README.md), regola di manutenzione 2) — applicata a una categoria di
duplicazione che nessuno aveva riconosciuto come tale: il **conteggio**.

Da qui discendono AUD-001, 002, 003, 004, 005, 006 e 012. Tutti e sette hanno la stessa forma: un
numero o un elenco vero quando è stato scritto, e mai più riguardato.

Ne discende anche la loro **coda**: quando un ADR o una delega nascono, il commit aggiorna i
documenti che quel documento cita, e non quelli che citano lui. È il denominatore comune che
[rischi.md](../rischi.md) descrive sotto N07 — «una delega ha aggiornato i documenti che citava, e
non quelli che citavano lei» — e AUD-012 ne è l'esemplare più puro: il commit che ha creato D020 ha
toccato il grafo e la prosa di [README.md](README.md), e non la sua tabella _Indice_.

**R2 — nessun gate guarda la forma del Markdown.** Una riga che comincia con `|` e che non sta in
una tabella non è un errore per nessuno: non per Prettier, che la legge come prosa e quindi la
lascia stare, e non per `doc-links`, che guarda i collegamenti. Da qui AUD-007.

### Come riprodurre i difetti

Perché chi esegue non debba fidarsi sulla parola, e perché ogni test nuovo abbia un caso reale
contro cui essere rotto.

```bash
# AUD-002 — quanti ADR sono davvero Proposta
grep -h '^- \*\*Stato' docs/adr/0*.md | grep -c Proposta

# AUD-004, AUD-005 — i due conteggi scritti in prosa
ls docs/adr/[0-9]*.md | wc -l
find docs -name '*.md' | wc -l

# AUD-006 — il tempo di parete della catena intera
start=$(date +%s%N); npm run verify >/dev/null 2>&1; end=$(date +%s%N); echo $(( (end-start)/1000000 ))ms
```

**AUD-007** ha una dimostrazione che vale più di un `grep`: `npm run format:check` è **verde**. Se
Prettier vedesse quella riga come parte di una tabella la riallineerebbe alle altre — è l'unica del
file con le barre non allineate. Il gate verde _è_ la prova che Markdown la legge come prosa.

**AUD-009** si riproduce con la libreria in uso, e le due misure sono diverse da quelle che l'ADR
riporta:

```bash
node -e "
const Decimal = require('./node_modules/decimal.js');
for (const e of [16,17,18,19]) console.log('1e'+e+' + 0.07 =', new Decimal('1e'+e).plus('0.07').toString());
for (const e of [19,20]) {
  const v = new Decimal('1e'+e), f = new Decimal('2.50');
  const s = [v.neg(), v.minus(f), f].reduce((a,b)=>a.plus(b), new Decimal(0));
  console.log('transfer a 1e'+e+' | somma dei movimenti =', s.toString());
}"
```

Ne escono due fatti che _Contesto_ dovrà riportare al posto di quelli attuali: i centesimi reggono
fino a **1e17** e non a 1e18, e sopra **1e20** i tre movimenti di `transfer()` non sommano più a
zero — quindi il Ledger **lancia** `UnbalancedTransactionError` invece di rompere INV-08 in
silenzio. È un guasto più rumoroso di quello scritto, e arriva più tardi: la decisione di dichiarare
la precisione resta giusta, l'evidenza che la motiva no.

## Cosa trovi già fatto

- **`tests/helpers/sources.ts`** ha già `sourceFiles(root, extensions)` e `read(path)`, ed è quello
  che `doc-links` usa per enumerare i documenti. Serve esattamente lo stesso elenco.
- **`tests/rules/doc-links.test.ts`** è il modello più vicino: enumera `docs/` più il `README.md` di
  radice, e ha già il blocco «il rilevatore» e la spunta «ce ne sono, altrimenti questo test non
  guarda niente». Si copia la forma, non il codice.
- **L'intestazione di ogni ADR e di ogni delega è già una riga leggibile a macchina**: entrambe
  cominciano con `- **Stato:**`, e l'audit ha verificato che sia vero per tutti e 27 gli ADR e per
  tutte e 22 le deleghe. Non c'è niente da normalizzare prima.
- **`vitest` sa già confrontare un file generato** con `toMatchFileSnapshot`, e lo aggiorna con
  `-u`. Non serve né uno script nuovo, né una cartella nuova, né una dipendenza.

## Da produrre

### Test

| File                                     | Contenuto                                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `tests/helpers/stato.ts`                 | la **derivazione**: legge il repo e produce il testo di `docs/stato.md`. Pura rispetto al disco in un senso solo — legge, non scrive |
| `tests/rules/stato.test.ts`              | C11 — il file generato coincide con quello versionato, e il blocco «il rilevatore» che prova la derivazione su un albero finto       |
| `tests/rules/markdown-form.test.ts`      | C12 — nessuna riga che comincia con `\|` sta fuori da una tabella, in nessun documento                                               |
| `tests/rules/facts-not-restated.test.ts` | ⚠️ — nessun documento **ridice** un fatto che `stato.md` possiede. È un'euristica, e lo dichiara                                     |

### Documenti

| File                                                             | Cosa cambia                                                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `docs/stato.md`                                                  | **nuovo, generato**: i fatti contabili del progetto in un posto solo                                                   |
| [docs/README.md](../README.md)                                   | la riga di `stato.md` nella tabella dei documenti; i conteggi tolti e sostituiti da un collegamento (AUD-002, AUD-003) |
| [PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md)             | AUD-001 e AUD-002: le due affermazioni sbagliate escono, e ciò che resta punta a `stato.md`                            |
| [architettura.md](../architettura.md)                            | AUD-004: `adr/0001..0024-*.md` non diventa `0027` — il conteggio **esce** dall'albero                                  |
| [convenzioni.md](../convenzioni.md)                              | AUD-005: «i cinquanta documenti» perde il numero, che non serviva all'argomento                                        |
| [qualita.md](../qualita.md)                                      | AUD-006: i tempi rimisurati, con la data e la macchina accanto — e la dichiarazione che restano 👤                     |
| [roadmap-fette.md](../roadmap-fette.md)                          | AUD-007: la riga orfana torna dentro la sua tabella. AUD-006: il tempo esce e punta a `qualita.md`                     |
| [README.md](README.md)                                           | AUD-012: D020 entra nell'indice, e D021 con lei                                                                        |
| [adr/0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md) | AUD-009: _Contesto_ e _Conseguenze_ riscritti con i numeri misurati                                                    |
| [tracciabilita.md](../tracciabilita.md)                          | C11 e C12 hanno la loro riga e il loro meccanismo                                                                      |

### Cosa contiene `docs/stato.md`

Solo ciò che è **derivabile dal repo senza eseguire il gioco**. Ogni voce che non lo è resta fuori,
e la sua assenza è dichiarata dentro il file.

- gli ADR: quanti sono, e l'elenco per stato — `Proposta` e `Accettata`, letti da `- **Stato:**`
- le deleghe: quante sono, e l'elenco per stato — `Aperta`, `In corso`, `Chiusa`
- i documenti: quanti markdown ci sono sotto `docs/`, più il `README.md` di radice
- i file: quanti `.vue`, quanti file di test, quanti file sotto `src/`
- le righe di codice per cartella — `kernel/`, `balance/`, `contracts/`, `domains/`, `main/`,
  `preload/`, `renderer/`, e il CSS dentro i `.vue` — **con il metodo di conteggio scritto nel
  codice che le conta**, che è la parte che oggi manca davvero: i numeri del passaggio di consegne
  sono giusti, ma il metodo che li produce vive solo nella testa di chi li ha misurati

**Cosa resta fuori, e perché.** Il numero di test (503) non è derivabile senza eseguirli, e il tempo
dei gate dipende dalla macchina. Restano dove sono, con la data accanto, e sono le due sole
affermazioni contabili del progetto che restano 👤. Dirlo è la condizione per non ritrovarsele fra
i difetti del prossimo audit.

## Invarianti

- **C11 — un fatto contabile ha un posto solo, ed è generato.** Non «i documenti sono aggiornati»,
  che è una speranza: il file generato e quello versionato coincidono, o il gate è rosso. È la
  stessa forma del Registry contro le cinque liste (A01) e di `previewOf` contro le due formule
  della commissione (INV-11): non si controlla che due cose coincidano, si fa in modo che ce ne sia
  una sola.
- **C12 — nessuna riga di tabella vive fuori da una tabella.** ✅ e senza eccezioni: una riga che
  comincia con `|` sta dentro una tabella, oppure è un difetto.
- **Il divieto di ridire è ⚠️, e lo dichiara.** `facts-not-restated` cerca le forme in cui i sette
  difetti trovati sono nati — un numero scritto a parole accanto alla parola «ADR», «delega»,
  «documenti» — e non pretende di prenderle tutte. Una frase costruita diversamente le sfugge, come
  a `english-identifiers` sfugge una parola italiana fuori elenco. Meglio di niente, e onesto su
  cosa non vede.

## Fuori scope

- **Il test sul grafo di import (AUD-008) e il meccanismo di purezza di `rules.ts` (AUD-010).**
  Sono l'altra famiglia: confini del **codice** che oggi tiene la review, non fatti scritti nei
  documenti. Il rapporto li propone insieme in una delega gemella, **non ancora scritta**, e
  l'argomento per farla prima di [D017](D017-il-caveau.md) è lo stesso di D020: D017 sposta confini
  veri — `capacityOf` esce da `atm/rules.ts`, il Ledger riceve la capienza dal dominio
  ([ADR 0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)), nasce
  `domains/vault/rules.ts`, che è il **terzo**.
- **L'estensione di `no-magic-numbers` al renderer (AUD-011).** Una riga di `eslint.config.js` e una
  costante nominata, e tocca `src/`: qui le righe di sorgente sono zero per costruzione. Va con la
  delega gemella.
- **Un generatore eseguibile a comando** (`npm run docs:stato`, una cartella `scripts/`).
  `toMatchFileSnapshot` di vitest fa già le due cose che servono — confrontare e riscrivere con
  `-u` — e non aggiunge né una cartella, né uno script, né una dipendenza. Il grilletto è il
  **secondo** documento generato: con uno, un comando dedicato è arredamento.
- **Generare anche i tempi dei gate e il conteggio dei test.** Richiederebbe di eseguire la suite
  per scrivere un documento, cioè un gate che dipende da un altro gate. Restano 👤 e dichiarati.
- **Riscrivere i documenti oltre le righe elencate.** Un audit che diventa una riscrittura verso lo
  stile di chi lo ha fatto è un audit fallito. Si toccano le righe difettose e nient'altro.
- **Rinumerare i difetti AUD.** Gli ID restano quelli del rapporto anche quando la delega li chiude:
  è ciò che permette di ritrovare il filo fra il rapporto e il commit.

## Definizione di fatto

- [ ] `npm run verify` verde, con l'**output incollato** — non riassunto
- [ ] `docs/stato.md` esiste, è generato, ed è **verificato**: cambiare a mano una riga del file
      versionato rende rosso il gate. Provato, non supposto
- [ ] il test di C12 **fallisce** se si rimette la riga orfana di `roadmap-fette.md` dov'era —
      provato rimettendocela, ed è l'unica prova che la regola morda
- [ ] il blocco «il rilevatore» c'è in tutti e tre i test nuovi, ed è la convenzione del progetto
- [ ] ognuno dei nove difetti da AUD-001 a AUD-009 e AUD-012 è chiuso, e per ognuno si può indicare
      la riga che lo chiude
- [ ] nessun documento contiene più il conteggio degli ADR, delle deleghe o dei documenti: o punta a
      `stato.md`, o non ne ha bisogno
- [ ] i tempi dei gate sono stati **rimisurati** e riportati con la data, e la riga che dichiara che
      restano 👤 c'è
- [ ] [ADR 0026](../adr/0026-la-precisione-del-denaro-e-dichiarata.md): _Contesto_ e _Conseguenze_
      riportano i numeri misurati, e la soglia di `transfer()` è fra le conseguenze. Lo **stato**
      resta `Proposta`: il meccanismo non nasce qui
- [ ] `docs/tracciabilita.md`: C11 e C12 hanno la loro riga, e il contatore delle righe che la
      tabella **non** copre è stato rimisurato invece che lasciato com'era
- [ ] ogni test nuovo è stato rotto di proposito almeno una volta
- [ ] zero righe sotto `src/`, verificato con `git diff --stat`

## Cosa è già stato corretto scrivendo questa delega

Due cose, e sono dichiarate qui perché non si scoprano come sorprese in un diff:

1. **D021 è stata registrata** nell'indice e nel grafo di [README.md](README.md), e nella tabella di
   stato di [PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md).
2. **AUD-012 è stato corretto contestualmente**: D020 è entrata nell'indice. Aggiungere D021 a una
   tabella sapendo che le manca D020 sarebbe stato scrivere il difetto due volte.

**Non è stato corretto nient'altro.** In particolare «Non resta aperta nessuna delega» continua
a dire che non c'è nessuna delega aperta mentre ora ne sono cinque: è AUD-001, ed è lavoro di questa
delega. Correggerla adesso avrebbe tolto al gate la sua prima occasione di essere provato contro un
difetto reale.

## Come è andata

Eseguita il 2026-08-20, subito dopo essere stata scritta.

**Budget.** Dichiarati ~330 righe di test e ~130 di documentazione. Misurati **672 righe di test**
— `projectState.ts` 242, `docs-facts` 209, `markdown-form` 155, `project-state` 66 — più
`docs/stato.md` generato (56) e un diff di 287/−184 righe sugli altri documenti. **Zero righe di
sorgente**, come dichiarato. Lo sforamento sui test è tutto nei blocchi «il rilevatore»: sono tre
test di regola, e la convenzione del progetto vale circa metà file ciascuno — è lo stesso conto che
D016 ha dichiarato alla propria chiusura.

**Cosa l'esecuzione ha trovato, e che la delega non prevedeva.**

1. **Il rilevatore dei conteggi, scritto largo, trovava 555 riscontri.** Legava un numero a una cosa
   contata entro venticinque caratteri, e in italiano «fra due deleghe» o «le due decisioni
   scartate» sono prosa normale. Un test così viene disattivato al primo fastidio, quindi è stato
   ristretto a tre forme e a tre soli soggetti: `deleghe` e `decisioni` sono **fuori**, e i loro
   conteggi restano coperti dalla forma che lega uno stato a un numero e dalla completezza degli
   indici.
2. **La regola vale solo sui documenti vivi.** ADR e deleghe sono append-only e storici per
   dichiarazione di [docs/README.md](../README.md): «quindici deleghe» dentro D013 racconta quante
   ce n'erano allora, e riscriverlo sarebbe falsificare un verbale. L'esclusione è **strutturale**,
   non un elenco, così un documento vivo nuovo è coperto dal giorno in cui nasce.
3. **Un blocco di codice indentato non è una tabella.** Il primo rilevatore di C12 segnalava D009 e
   D014, che scrivono le unioni di TypeScript indentate di quattro spazi — dove `|` separa i casi.
   Per Markdown quattro spazi **sono** codice, e il limite è entrato nel rilevatore con il suo caso.
4. **Due gate si contraddicevano su `stato.md`.** Le colonne numeriche allineate a destra sono più
   leggibili e rendono rosso `format:check`: su un file generato, due gate in disaccordo sono un
   file che nessuno può tenere verde. Ha vinto Prettier, che sulla formattazione è l'unica autorità
   (ADR 0013).
5. **C08 ha morso l'autore della delega.** `stato.ts`, `statoMarkdown`, `stato`: identificatori in
   italiano in un progetto che li vuole in inglese. Rinominati in `projectState.ts` e
   `projectStateMarkdown`, e i messaggi degli errori — che in italiano ci vanno — sono usciti dai
   template literal, dove il rilevatore di `english-identifiers` legge.
6. **Scrivere questa delega ha prodotto il difetto che descrive.** Aggiungere la riga di D021 alla
   tabella di stato del passaggio di consegne ha spostato di uno i numeri di riga che la tabella
   dei difetti citava. I numeri di riga sono usciti, e al loro posto c'è la frase da cercare.
7. **AUD-012 è stato trovato dal test, non dall'audit.** L'indice delle deleghe non elencava D020, e
   a dirlo è stata la verifica di completezza appena scritta — la prima volta che un meccanismo di
   questa delega ha trovato qualcosa da solo.

**La prova che morde.** Aggiungere D022 al repo ha reso rosso `project-state` finché `stato.md` non
è stato rigenerato: è la definizione di fatto che si verifica da sé, senza che nessuno debba
ricordarsi di controllare.

## Trappole note

- **Il gate verde che non ha guardato niente.** Un confronto fra un file generato e un file
  versionato è verde anche quando la derivazione ritorna una stringa vuota, o quando il file
  versionato non esiste e lo snapshot lo scrive al primo giro. La spunta «cambiare a mano una riga
  lo rende rosso» è l'unica che distingue le due cose, ed è per questo che sta nella definizione di
  fatto invece che nei buoni propositi.
- **Il rilevatore di C12 che grida al lupo.** Una riga di tabella dentro un blocco di codice
  recintato — e questa delega ne contiene — non è un difetto. Il rilevatore deve saltare i blocchi
  ` ``` `, o il primo file che segnala è quello che descrive la regola.
- **La tentazione di generare tutto.** `stato.md` è utile finché contiene ciò che nessuno dovrebbe
  riscrivere a mano. Metterci dentro anche ciò che serve a un lettore lo trasforma in una seconda
  mappa, e due mappe divergono — che è il difetto da cui questa delega nasce, ripreso dal lato
  opposto.
- **La tentazione di sistemare i documenti mentre ci si passa.** Sono sessantacinque markdown e
  quasi tutti hanno una riga che si potrebbe scrivere meglio. Il diff di questa delega deve poter
  essere letto riga per riga contro l'elenco dei nove difetti: tutto ciò che non ci corrisponde è
  fuori scope, anche quando è un miglioramento.
- **A17.** È una delega di soli test che tocca il documento che descrive tutto il resto. La voglia di
  «già che ci sono» qui si chiama grafo di import, purezza di `rules.ts`, `no-magic-numbers` sul
  renderer: tutti e tre hanno un perché scritto in _Fuori scope_, e tutti e tre tolgono a chi verrà
  dopo il caso reale su cui provarli.

## Copertura dell'audit da cui nasce

Dichiarata perché una delega nata da un audit vale quanto la copertura di quell'audit.

**Auditato per intero**: `src/` (21 file, 5.169 righe), `tests/` (55 file), i 13 file di
configurazione di radice, il `README.md` di radice, i 12 documenti _vivi_, i 27 ADR per stato, le 4
deleghe aperte.

**Escluso**: `node_modules/` e `package-lock.json` (terze parti), `out/` (artefatto di build), le 18
deleghe chiuse come fonte di verità — [README.md](README.md) le dichiara documenti storici.

**Baseline**: `npm run verify` verde prima dell'audit, 503 test su 55 file, e nessuna riga è stata
toccata durante. Sul **codice sorgente l'audit non ha trovato difetti**: zero export morti, zero
regole CSS orfane, zero identificatori citati nei documenti e inesistenti nel codice, e i conteggi
di riga del passaggio di consegne riprodotti esattamente con il loro stesso metodo.
