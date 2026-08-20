# Documenti di delega

> Se stai arrivando ora sul progetto, parti da
> **[PASSAGGIO-DI-CONSEGNE.md](PASSAGGIO-DI-CONSEGNE.md)**: stato, regole e prossimo passo.

Una **delega** è un pacchetto di lavoro autosufficiente: chi la prende in mano deve poterla
eseguire senza fare domande e senza aver letto la conversazione in cui è nata.

Vale per una persona, per un agente, o per me stesso fra tre mesi — che è lo stesso caso.

## Cosa contiene una delega

| Sezione                  | A cosa serve                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------ |
| **Intestazione**         | stato, dipendenze, cosa sblocca, ADR vincolanti, regole applicabili, budget di righe |
| **Obiettivo**            | una frase. Se ne servono due, la delega è due deleghe                                |
| **Da produrre**          | i file esatti, con il loro contenuto atteso                                          |
| **Invarianti**           | ciò che deve essere vero quando la delega è chiusa, e restare vero dopo              |
| **Fuori scope**          | ciò che è tentante fare qui e va fatto altrove, o mai                                |
| **Definizione di fatto** | la lista di spunte. Tutte, non alcune                                                |
| **Trappole note**        | cosa è andato storto nel progetto precedente in questo punto preciso                 |

La sezione **Fuori scope** è quella che fa il lavoro: senza, ogni delega assorbe le vicine e si
torna a costruire venti cose insieme (ADR 0014).

## Il budget di righe

Ogni delega dichiara un ordine di grandezza. Non è un limite contrattuale: è un **allarme**.

Se la delega del Registry dichiara ~140 righe e ne stai scrivendo 400, non hai sforato un budget:
stai risolvendo un problema diverso da quello descritto. Fermati e dillo, invece di continuare.

Il kernel intero — D003 fino a D008 — dichiarava ~500 righe e ne misura **545** (il dettaglio, e
come ci è arrivato, è [nell'indice](#indice)). È una specifica, non una speranza: il 9% di
sforamento ha un nome per ogni riga, ed è per questo che si può dire com'è successo invece di
scoprirlo alla fine.

## Ciclo di vita

    Aperta  →  In corso  →  Chiusa

- **Aperta**: scritta, dipendenze non ancora soddisfatte, oppure nessuno ci sta lavorando.
- **In corso**: esiste un ramo `dNNN-slug`.
- **Chiusa**: la definizione di fatto è tutta verde. Si annota il commit e non si tocca più.

Fra _Aperta_ e _In corso_ c'è un passaggio che non è uno stato ma si vede nel git log: una delega
può essere **preparata per l'esecuzione**, cioè riletta con il codice che nel frattempo esiste e
corretta dove è invecchiata. È successo a [D009](D009-persistenza-main.md),
[D014](D014-dominio-bancomat.md) e [D013](D013-verifica-della-fetta.md), e ogni volta ha tolto
lavoro invece di aggiungerlo: quasi tutto ciò che quelle deleghe chiedevano di costruire esisteva
già.

Una delega chiusa è un **documento storico**, non una fonte di verità sul codice corrente. Le
firme che contiene descrivono ciò che è stato chiesto, non ciò che c'è: per quello si legge il
codice. È la ragione per cui i documenti vivi ([architettura](../architettura.md),
[tracciabilità](../tracciabilita.md), [glossario](../glossario.md)) non duplicano mai le firme.

## L'ordine, e perché è questo

```mermaid
flowchart TD
  D001["D001 · Tooling e gate"] --> D002["D002 · Contratti"]
  D002 --> D003["D003 · Clock"]
  D002 --> D004["D004 · Rng"]
  D002 --> D005["D005 · Bus"]
  D003 --> D006["D006 · Registry"]
  D004 --> D006
  D005 --> D006
  D005 --> D007["D007 · Ledger"]
  D006 --> D008["D008 · Balance"]
  D007 --> D008
  D002 --> D009["D009 · Persistenza (main)"]
  D006 --> D009
  D008 --> D010["D010 · Dominio income"]
  D007 --> D014["D014 · Dominio bancomat"]
  D008 --> D014
  D009 --> D011["D011 · Runtime e store"]
  D010 --> D011
  D014 --> D011
  D011 --> D012["D012 · Guscio, parole e reddito"]
  D012 --> D015["D015 · Home: bancomat e cruscotto"]
  D014 --> D015
  D015 --> D016["D016 · Le correzioni dell'audit"]
  D016 --> D013["D013 · Verifica della fetta — STOP 2"]
  D013 --> D021["D021 · Un numero che nessuno conta non si scrive"]
  D013 --> D022["D022 · Il confine disegnato è il confine vero"]
  D022 --> D017
  D013 --> D019["D019 · Il pagamento — fetta 02"]
  D013 --> D020["D020 · Nessun sistema si fida del salvataggio"]
  D019 --> D017["D017 · Il caveau — fetta 02"]
  D020 --> D017
  D013 --> D018["D018 · La scheda di dominio"]
```

**D017 e D018 non si toccano**, ed è il primo caso del progetto: una scrive codice, l'altra solo
documenti, e nessuna aspetta l'altra. Il grafo lo mostra facendole partire entrambe da D013.

**D019 si è infilata fra D013 e D017**, ed è nata da una domanda posta al momento giusto: prima di
eseguire D017 si è ragionato su come si sceglie con cosa si paga. È venuto fuori che
l'[ADR 0017](../adr/0017-il-denaro-e-plurale.md) aveva promesso quel meccanismo dalla fetta 01 e
nessuno l'aveva costruito, e che il caveau sarebbe stato il **secondo** comando a spendere — cioè
l'ultimo momento per rispondere senza rifare niente. Se D017 fosse partita il giorno prima, avrebbe
scelto un pool nel sorgente e D019 avrebbe dovuto disfarlo.

**D020 usa lo stesso argomento di D001, ed è la seconda volta che il progetto lo accetta.** Il
caveau è il **secondo** dominio con stato, e oggi niente obbliga un dominio a controllare il
salvataggio che riceve. Se la regola nascesse dentro D017, la scriverebbe la stessa persona che
scrive il codice da sorvegliare, nello stesso momento: non sorveglierebbe niente. Zero righe di
sorgente, settanta di test.

**D021 e D022 lo usano per la terza e la quarta volta.** D021 lo applica ai documenti, D022 ai
confini del codice che oggi tiene la review — le frecce di [architettura.md](../architettura.md),
la purezza dei `rules.ts`, dove nasce un numero che il giocatore vede. Sono gemelle e non si
toccano: una legge documenti, l'altra sorgenti.

**Su D021, in dettaglio.** Nasce dall'audit dello
STOP 2, che ha trovato dodici difetti — nessuno nel sorgente, sette della stessa forma: un numero
vero quando è stato scritto e mai più riguardato. La correzione di
[D016](D016-correzioni-audit.md) era stata un aggiornamento, e un aggiornamento protegge il giorno
in cui lo si esegue e nessun altro: sei mesi dopo sarebbe successo di nuovo, e invece è successo
poche ore dopo. Viene prima delle altre perché la fetta 02 scrive documenti nuovi, e ognuno
scritto prima del meccanismo è un documento in più da rileggere a mano.

**D001 è prima di tutto, e non è un caso.** Le regole devono esistere prima del codice che
governano. Se il lint arriva dopo, il primo codice nasce fuori regola e la prima cosa che si fa è
un'eccezione — che poi diventa la norma. È letteralmente il difetto A16: un formattatore
configurato dopo che c'erano già 156 file.

## Indice

| ID                                                        | Titolo                                                                | Budget                     | Stato      |
| --------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------- | ---------- |
| [D001](D001-tooling-e-gate.md)                            | Tooling, regole e gate di qualità                                     | 191 config + 265 test      | **Chiusa** |
| [D002](D002-contratti.md)                                 | Contratti: `Result`, `Money`, `bounded`, eventi, salvataggio, comandi | 113 codice + 417 test      | **Chiusa** |
| [D003](D003-kernel-clock.md)                              | Kernel: Clock                                                         | 20 codice + 116 test       | **Chiusa** |
| [D004](D004-kernel-rng.md)                                | Kernel: Rng                                                           | 55 codice + 172 test       | **Chiusa** |
| [D005](D005-kernel-bus.md)                                | Kernel: Bus                                                           | 67 codice + 303 test       | **Chiusa** |
| [D006](D006-kernel-registry.md)                           | Kernel: Registry                                                      | 124 codice + 406 test      | **Chiusa** |
| [D007](D007-kernel-ledger.md)                             | Kernel: Ledger — pool, transazioni atomiche, partita doppia           | 197 codice + 420 test      | **Chiusa** |
| [D008](D008-balance.md)                                   | Balance: costanti, modificatori, bersagli                             | 70 codice + 154 test       | **Chiusa** |
| [D009](D009-persistenza-main.md)                          | Persistenza nel processo main                                         | 259 codice + 591 test      | **Chiusa** |
| [D010](D010-dominio-income.md)                            | Dominio: income                                                       | 102 codice + 302 test      | **Chiusa** |
| [D014](D014-dominio-bancomat.md)                          | Dominio: bancomat — deposita, preleva, commissione                    | 65 codice + 548 test       | **Chiusa** |
| [D011](D011-runtime-e-store.md)                           | Runtime e store                                                       | 379 codice + 774 test      | **Chiusa** |
| [D012](D012-ui-e-i18n.md)                                 | Il guscio, le parole e il reddito                                     | 1.060 codice + 740 test    | **Chiusa** |
| [D015](D015-home-bancomat.md)                             | La home: bancomat, carta e cruscotto                                  | 725 codice + 321 test      | **Chiusa** |
| [D016](D016-correzioni-audit.md)                          | Le correzioni dell'audit del 2026-08-20                               | 186 codice + 326 test      | **Chiusa** |
| [D013](D013-verifica-della-fetta.md)                      | Verifica della fetta — STOP 2                                         | 93 test + 17 di README     | **Chiusa** |
| [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) | Un numero che nessuno conta non si scrive                             | 672 test + 56 generate     | **Chiusa** |
| [D022](D022-il-confine-disegnato-e-il-confine-vero.md)    | Il confine disegnato è il confine vero                                | 264 test + 5 di sorgente   | **Chiusa** |
| [D019](D019-il-pagamento.md)                              | Il pagamento: il listino di un'azione, e chi lo sceglie               | ~140 codice + ~220 test    | **Aperta** |
| [D020](D020-nessun-sistema-si-fida-del-salvataggio.md)    | Nessun sistema si fida del proprio salvataggio                        | ~70 test, zero di sorgente | **Aperta** |
| [D017](D017-il-caveau.md)                                 | Il caveau: i contanti hanno una capienza — fetta 02                   | ~330 codice + ~410 test    | **Aperta** |
| [D018](D018-la-scheda-di-dominio.md)                      | La scheda di dominio: la forma, e le prime tre compilate              | ~510 di documentazione     | **Aperta** |

D014, D015 e D016 hanno i numeri più alti perché sono nate dopo: D014 con gli ADR 0017–0020, D015
il 2026-08-19 spezzando D012, D016 il 2026-08-20 dall'audit della codebase. Nel grafo sopra si vede
dove stanno davvero — D014 accanto a D010, D015 fra D012 e D013, D016 **prima** di D013. D017 è la
prima della **fetta 02** e la prima con il numero al posto giusto: nasce dopo D016 e viene dopo.
**La numerazione è cronologica, l'ordine è il grafo**: rinumerare romperebbe i riferimenti nei
commit e nella tracciabilità.

**D018 è la prima delega che non appartiene a nessuna fetta.** Nasce il 2026-08-20 dalla
riscrittura della [visione](../prodotto/visione.md) e dall'audit del kernel che ne è seguito, e non
costruisce gioco: costruisce la **scheda** che ogni dominio futuro dovrà compilare prima di essere
scritto, con dentro le dodici domande sul kernel che l'audit ha dovuto fare a mano. È anche la prima
con un budget di sole righe di documentazione, e la prima in cui **zero righe di codice** è una
condizione di correttezza invece di una stima.

**Perché D016 sta prima dello STOP 2.** D013 riporta che la fetta regge; l'audit ha trovato un
difetto di perdita dati. Riportare un verdetto con quel difetto aperto sarebbe riportare un
verdetto falso, e il passo 5 del percorso manuale di D013 — «chiudo la finestra» — ci passa
esattamente sopra senza vederlo, perché lì il salvataggio è valido. Infilare le correzioni dentro
D013 era l'alternativa, ed è stata scartata: una delega che verifica e insieme corregge non può
più dire quale delle due cose ha fatto.

**Perché D012 è stata spezzata.** Valeva ~1.150 righe, più del kernel intero, e il numero era una
misura fatta sui mockup — non una stima. Una delega di quella dimensione non è verificabile a metà
strada: la definizione di fatto arriva tutta insieme alla fine. Il taglio passa fra i due mockup,
che non sono due schermate ma due momenti — gli **stati** e il reddito da una parte, la **home**
col bancomat dall'altra.

Il kernel — D003, D004, D005, D006, D007, D008 — è **finito**, e a D008 stava in **535 righe**:
Clock 20, Rng 55, Bus 67, Registry 126, Ledger 197, Balance 70. Rimisurato a
[D013](D013-verifica-della-fetta.md) fa **545**, e le dieci righe in più sono due: sei al Clock, che
a D011 ha preso `ticksToMilliseconds` e il tipo `Milliseconds` per il loop, e quattro a `balance/`,
con `ATM_FEE` e i quattro importi rapidi. Il budget iniziale era ~500, poi ~560 quando
gli ADR 0017/0019/0020 hanno fatto crescere il Ledger, poi ~530 perché le prime quattro deleghe
erano uscite sotto la stima, poi ~555 quando il Ledger ha ripreso quei 25 e qualcosa in più. Il
Balance è rientrato di venti. Nessuna delle cinque cifre è stata subita: ognuna è dichiarata dov'è
cambiata, e l'ultima è una misura, non una stima.
