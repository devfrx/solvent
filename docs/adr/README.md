# Compendio delle decisioni

Indice di tutte le decisioni strutturali del progetto. Ogni riga rimanda a un ADR che ne contiene
il **perché**, le alternative scartate e i trade-off accettati.

## Come si usa

- **Prima di cambiare una struttura**, cerca qui se la decisione è già stata presa. Se sì, la
  discussione riparte dalle alternative già scartate, non da zero.
- **Se una decisione va superata**, non si modifica l'ADR esistente: si marca `Superata da ADR
NNNN` e se ne scrive uno nuovo. La storia delle decisioni è parte del valore — sapere _perché_
  una cosa fu decisa così spiega perché cambiarla costa quello che costa.
- **Serve un ADR** per: nuova dipendenza, cambio di pattern, breaking change su un'interfaccia
  condivisa, scelta fra approcci con trade-off reali. Non serve per le scelte minori.

## Stati

| Stato         | Significato                                                           |
| ------------- | --------------------------------------------------------------------- |
| **Proposta**  | scritta, non ancora approvata: il codice non può ancora appoggiarcisi |
| **Accettata** | in vigore: il codice la rispetta e i meccanismi la impongono          |
| **Superata**  | sostituita da un ADR successivo, che è indicato in testa              |

Una decisione diventa _Accettata_ nel commit che introduce il meccanismo che la impone — mai
prima, altrimenti sarebbe solo una buona intenzione.

Sono passate ad _Accettata_: **0006** e **0007** con [D002](../delega/D002-contratti.md),
**0005** con [D004](../delega/D004-kernel-rng.md), **0016** con
[D005](../delega/D005-kernel-bus.md), **0002** con [D006](../delega/D006-kernel-registry.md),
**0003**, **0017**, **0019**, **0020** e **0021** con
[D007](../delega/D007-kernel-ledger.md), **0004** con
[D009](../delega/D009-persistenza-main.md) e il nuovo **0024** con
[D010](../delega/D010-dominio-income.md).

**0001** e **0009** con [D011](../delega/D011-runtime-e-store.md): la simulazione gira davvero nel
renderer, e il passo fisso con accumulatore esiste. **0011** con
[D012](../delega/D012-ui-e-i18n.md), **0018** con [D015](../delega/D015-home-bancomat.md): la home
ha le due zone nell'ordine dichiarato, la commissione si vede prima della conferma, e il tetto dei
riquadri è un test.

**0008**, **0012**, **0013**, **0014** e **0015** con
[D013](../delega/D013-verifica-della-fetta.md), che è lo STOP 2. Sono le cinque che il codice
imponeva **già** senza che nessuno l'avesse dichiarato: la domanda posta a ciascuna è stata una
sola — _esiste un meccanismo che la impone, e qualcuno l'ha visto scattare?_ — e la seconda metà è
stata pagata, rompendo ognuna di proposito e guardando il rosso. Le rotture sono in fondo a quella
delega, e la riga di stato di ogni ADR porta la propria.

Il **0025** nasce allo STOP 2 con [D017](../delega/D017-il-caveau.md) ed è stato `Proposta` per la
ragione giusta finché il meccanismo che lo impone non è stato scritto. Adesso c'è, ed è
`Accettata`: è la seconda decisione strutturale della fetta 02, e riguarda un confine del kernel —
il Ledger ha smesso di **leggere** la capienza di un pool e ha cominciato a **chiederla**, perché il
caveau si amplia e una costante compilata non si amplia. Nel farlo ha **cancellato** l'unico mock di
modulo del progetto, che è il segnale migliore che un confine possa dare di sé.

Il **0027** nasce lo stesso giorno, ed è l'unico del progetto che non decide una cosa nuova: finisce
una vecchia. L'[ADR 0017](0017-il-denaro-e-plurale.md) aveva scritto che «non esistono azioni che
assumono uno strumento», e da allora `income` compra il suo upgrade con il pool scritto nel
sorgente. Il 0027 dà a quella frase un meccanismo — il **listino** — e lo fa nel momento in cui i
comandi che spendono stanno per diventare due.

Il **0028** e il **0029** nascono il 2026-08-20 da un design consegnato dall'utente, e sono i primi
del progetto che riguardano l'**aspetto** invece della struttura. Il 0028 dice dove vive lo stile e
cosa gli è vietato sapere: un livello, `renderer/ui/`, che non conosce dominio, store né parole — il
primo nodo del diagramma con sole frecce entranti. Il 0029 sono i due caratteri, ed esiste perché
sono due dipendenze nuove (ADR 0015). Tutti e due li **impone** [D023](../delega/D023-il-design-system.md), che li ha portati ad
_Accettata_ nello stesso giorno in cui sono nati: è la prima volta che succede, e la ragione è che
un ADR sull'aspetto senza il CSS che lo applica non decide niente.

Il **0030** e il **0031** nascono il 2026-08-21 dallo stesso canvas, e sono i due che
[D024](../delega/D024-il-telaio.md) ha preso prima di scrivere il telaio — e portato ad _Accettata_
nel commit che lo ha scritto, come D023 con i suoi due. Il 0030 risponde a
una domanda che l'ADR 0028 aveva lasciato aperta: se i contenitori generici sono scartati, dove vive
l'impaginazione? La risposta separa la **forma** — regioni fisse, nessuna geometria in ingresso — dal
contenitore, e la separazione ha una regola con un test invece di un paragrafo. Il 0031 dà al
giocatore l'interruttore del tema e gli nega la memoria, perché ricordare vorrebbe dire archiviare, e
questo progetto archivia in un posto solo.

Il **0032** nasce il giorno dopo, dal primo pezzo che deve stare **sopra** il resto: il
tooltip di [D025](../delega/D025-il-tooltip.md). Decide che le sovrapposizioni usano il livello
superiore del motore e l'ancoraggio CSS invece di una libreria di posizionamento — il motore qui è
uno solo, e fa già tutte e tre le metà del problema. La metà che conta però non è tecnica: è **R17**,
che vieta l'attributo `title` del browser. Senza, il pezzo vestito sarebbe un modo di spiegare
accanto a quello gratis, e il gratis vince sempre. Anche questo è passato ad _Accettata_ con la
delega che lo ha scritto — e con una cosa in più delle altre: il presupposto «il motore è uno solo e
recente» è stato **chiesto al motore** invece che al changelog, e la risposta sta in
[qualita.md](../qualita.md) con la data.

Quali decisioni siano ancora _Proposta_ lo dice [stato.md](../stato.md), che le conta invece di
ricordarsele. Qui c'è il **perché**, che è la sola cosa che un conteggio non può dire.

Per quasi tutte è la ragione ovvia: **0022**, **0023** e **0026** descrivono cose che il
progetto non ha ancora costruito, e diventeranno un fatto con la delega che le userà. Il **0027**
era fra loro fino a [D019](../delega/D019-il-pagamento.md), e il **0025** fino a
[D017](../delega/D017-il-caveau.md): sono le due decisioni della fetta 02 passate ad _Accettata_,
ognuna dalla delega che l'ha costruita.
L'eccezione è **0010**, che ha il meccanismo **a metà**: `boundedList<T>(max)` è l'unico costruttore e `max` è
obbligatorio, ma la seconda frase della decisione — «il validatore del salvataggio rifiuta un array
che supera il `max` dichiarato» — non ha niente da validare, perché nel payload della versione 1
non c'è nessun array. La lista delle ultime operazioni ha il suo limite ed è un mirror che riparte
vuoto: non attraversa il disco. Metà meccanismo non è una decisione in vigore.

**A chiuderla non è stato il caveau, e questa riga lo diceva.** La fetta 02 prometteva «il primo
`boundedList` con dati veri dentro» e non l'ha mantenuto: il caveau conserva contanti **e oggetti**,
ma gli oggetti nascono col black market, e un inventario vuoto è l'astrazione che l'ADR 0014 vieta
([roadmap-fette.md](../roadmap-fette.md)). Nemmeno [D027](../delega/D027-un-grafico-e-una-serie-che-nessuno-tiene.md)
la chiude, e per una ragione sua: la serie del patrimonio netto **potrebbe** entrare nel salvataggio,
e resta fuori perché senza il calendario dell'[ADR 0023](0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)
un campione non sa quando è stato preso — due barre affiancate potrebbero distare un tick o otto ore.
Il grilletto resta quello che il registro YAGNI ha scritto: il primo dominio che possiede **cose**.

## Le decisioni

| #                                                                              | Titolo                                                             | Stato         | Cosa vincola                                                                              | Difetto coperto |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------- | ----------------------------------------------------------------------------------------- | --------------- |
| [0001](0001-simulazione-nel-renderer-core-puro.md)                             | La simulazione gira nel renderer, `core/` è puro                   | **Accettata** | dove vive la logica, cosa può importare `core/`                                           | A02             |
| [0002](0002-registry-unica-lista-di-sistemi.md)                                | Il Registry è l'unica lista di sistemi                             | **Accettata** | come si aggiunge un sistema, chi itera                                                    | A01, A06        |
| [0003](0003-ledger-unica-porta-del-denaro.md)                                  | Il Ledger è l'unica porta del denaro                               | **Accettata** | chi può cambiare un saldo                                                                 | A05             |
| [0004](0004-il-main-e-proprietario-del-contratto-di-salvataggio.md)            | Il main possiede il contratto di salvataggio                       | **Accettata** | chi scrive la versione, dove vivono le migrazioni                                         | A07, A08        |
| [0005](0005-rng-seedato-con-stream-per-dominio.md)                             | PRNG seedato con stream per dominio                                | **Accettata** | ogni sorgente di casualità del gioco                                                      | A03             |
| [0006](0006-decimal-end-to-end-per-il-denaro.md)                               | Il denaro è `Decimal` end-to-end                                   | **Accettata** | il tipo di ogni valore monetario                                                          | A11             |
| [0007](0007-result-come-unico-stile-di-esito.md)                               | `Result<T,E>` come unico stile di esito                            | **Accettata** | la firma di ogni operazione che può fallire                                               | A12             |
| [0008](0008-nome-e-identita-del-prodotto.md)                                   | Un solo nome, deciso prima del primo file                          | **Accettata** | `appId`, percorso salvataggi, chiavi di registro                                          | A15             |
| [0009](0009-passo-fisso-e-tipi-branded-per-il-tempo.md)                        | Passo fisso a 10 tick/s, tempo con tipi branded                    | **Accettata** | la firma di ogni `tick`, il progresso offline                                             | A04             |
| [0010](0010-liste-storiche-limitate-alla-definizione.md)                       | Una lista storica nasce già con il suo limite                      | Proposta      | la dimensione massima del salvataggio                                                     | A10             |
| [0011](0011-i18n-obbligatoria-con-parita-verificata.md)                        | i18n dal primo giorno, parità verificata da un test                | **Accettata** | ogni stringa mostrata all'utente                                                          | A13             |
| [0012](0012-controlli-sul-codice-morto-sempre-accesi.md)                       | `noUnusedLocals` / `noUnusedParameters` sempre accesi              | **Accettata** | la sopravvivenza del codice morto                                                         | A14             |
| [0013](0013-prettier-e-autorita-sulla-formattazione.md)                        | Prettier è l'unica autorità sulla formattazione                    | **Accettata** | il diff di ogni commit                                                                    | A16             |
| [0014](0014-una-fetta-verticale-alla-volta.md)                                 | Una fetta verticale alla volta                                     | **Accettata** | l'ordine di tutto il lavoro futuro                                                        | A17             |
| [0015](0015-criterio-di-ammissione-delle-dipendenze.md)                        | Criterio di ammissione delle dipendenze                            | **Accettata** | ogni `npm install` da qui in avanti                                                       | —               |
| [0016](0016-il-bus-e-sincrono-e-fire-and-forget.md)                            | Il Bus è sincrono, fire-and-forget, non event sourcing             | **Accettata** | la forma di ogni handler e di ogni sistema                                                | —               |
| [0017](0017-il-denaro-e-plurale.md)                                            | Il denaro è plurale: pool con affordance diverse                   | **Accettata** | ogni azione che muove denaro, in ogni dominio                                             | —               |
| [0018](0018-la-home-e-un-atm.md)                                               | La home è un ATM, non una dashboard                                | Superata      | la schermata principale e la navigazione — superata dal 0040                              | —               |
| [0019](0019-transazioni-atomiche-nel-ledger.md)                                | Il Ledger applica transazioni atomiche                             | **Accettata** | la primitiva di ogni movimento di denaro                                                  | —               |
| [0020](0020-partita-doppia.md)                                                 | Ogni transazione bilancia a zero                                   | **Accettata** | come si scrive ogni riga di economia, e come si misura il bilanciamento                   | —               |
| [0021](0021-una-sola-primitiva-per-il-denaro.md)                               | Una sola primitiva per il denaro: `post()` non esiste              | **Accettata** | come un dominio chiede un movimento di denaro                                             | —               |
| [0022](0022-il-ledger-ha-conti-non-solo-pool.md)                               | Il Ledger ha conti, non solo pool                                  | Proposta      | dove vive il denaro di un'entità creata dal giocatore                                     | A05             |
| [0023](0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                      | Il tempo di gioco è un sistema di dominio                          | Proposta      | chi sa che giorno è, e come lo sanno gli altri                                            | —               |
| [0024](0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md) | Un sistema riceve per costruzione ciò che non sta nel contesto     | **Accettata** | come un dominio ottiene ciò che il `SystemContext` non porta                              | —               |
| [0025](0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)                  | La capienza di un pool si chiede, non si legge                     | **Accettata** | chi decide quanto tiene un pool, quando il tetto può crescere                             | A05             |
| [0026](0026-la-precisione-del-denaro-e-dichiarata.md)                          | La precisione del denaro è dichiarata, non ereditata               | Proposta      | fin dove il denaro resta esatto, e chi ha scelto quel limite                              | —               |
| [0027](0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)               | Il listino è dell'azione, la scelta è del giocatore                | Accettata     | chi decide con cosa si paga, e dove vive il prezzo di ogni strumento                      | A05             |
| [0028](0028-il-kit-ui-non-sa-che-gioco-e.md)                                   | Il kit UI non sa che gioco è                                       | **Accettata** | dove vive lo stile, e cosa gli è vietato sapere                                           | A14             |
| [0029](0029-due-caratteri-e-stanno-nel-bundle.md)                              | Due caratteri, e stanno nel bundle                                 | **Accettata** | con quali caratteri si legge il gioco, e da dove arrivano                                 | —               |
| [0030](0030-il-telaio-e-una-forma-non-un-contenitore.md)                       | Il telaio è una forma, non un contenitore                          | **Accettata** | quale impaginazione il kit accetta, e quale rifiuta                                       | A14             |
| [0031](0031-il-tema-si-sceglie-e-non-si-ricorda.md)                            | Il tema si sceglie, e non si ricorda                               | **Accettata** | chi decide il tema, e perché la scelta non sopravvive alla finestra                       | A14             |
| [0032](0032-le-sovrapposizioni-stanno-nel-livello-superiore.md)                | Le sovrapposizioni stanno nel livello superiore                    | **Accettata** | dove sta ciò che copre il resto, e perché non ha una libreria                             | A14             |
| [0033](0033-un-dominio-ha-una-cartella-e-una-pagina.md)                        | Un dominio ha una cartella, e di norma una pagina                  | **Accettata** | dove vive l'interfaccia di un dominio, e dove il giocatore la trova                       | A17             |
| [0034](0034-il-grafico-e-una-libreria.md)                                      | Il grafico è una libreria, e la libreria disegna in SVG            | **Accettata** | con cosa si disegna un grafico, e come i suoi colori restano token                        | A14             |
| [0035](0035-una-capienza-ferma-chi-sale.md)                                    | Una capienza ferma chi sale, non chi si trova già in alto          | **Accettata** | quando un tetto rifiuta, e chi risponde «quanto ci sta ancora»                            | A05             |
| [0036](0036-i-cheat-passano-dalle-porte-del-gioco.md)                          | I cheat di sviluppo passano dalle porte del gioco                  | **Accettata** | come si costruisce uno stato di gioco senza poter mentire su di esso                      | A05             |
| [0037](0037-il-telaio-non-scorre-il-contenuto-si.md)                           | Il telaio non scorre, il contenuto sì                              | **Accettata** | chi scorre in un'applicazione da scrivania, e perché non serve un `z-index`               | A14             |
| [0038](0038-la-commissione-scala-il-pavimento-no.md)                           | La commissione scala, il pavimento no                              | **Accettata** | perché una commissione fissa smette di esistere, e cosa la tiene viva                     | —               |
| [0039](0039-una-sovrapposizione-passa-dal-kit.md)                              | Una sovrapposizione passa dal kit                                  | **Accettata** | chi possiede il livello superiore, e perché una riga di CSS lo disfaceva                  | —               |
| [0040](0040-il-bancomat-e-il-cruscotto-sono-due-pagine.md)                     | Il bancomat e il cruscotto sono due pagine                         | **Accettata** | quante destinazioni ci sono, e cosa difende il tetto dei riquadri                         | —               |
| [0041](0041-la-rappresentazione-del-denaro-e-dichiarata.md)                    | La rappresentazione del denaro è dichiarata come la sua precisione | **Accettata** | come un importo si scrive quando attraversa il disco, e a quale scala smette di scriversi | —               |
| [0042](0042-il-pagamento-e-un-flusso-solo.md)                                  | Il pagamento è un flusso solo                                      | **Accettata** | dove si sceglie con cosa si paga, e cosa uno strumento chiede prima di pagare             | —               |
| [0043](0043-il-tempo-che-avanza-e-un-operazione-del-gioco.md)                  | Il tempo che avanza è un'operazione del gioco                      | **Accettata** | chi può far avanzare il tempo di gioco, e cosa succede a ogni passo                       | A01             |
| [0044](0044-cio-che-si-preme-passa-dal-kit.md)                                 | Ciò che si preme passa dal kit                                     | **Accettata** | chi può disegnare un pulsante, con quali forze e quali scatole                            | A14             |
| [0045](0045-cio-che-scorre-passa-dal-kit.md)                                   | Ciò che scorre passa dal kit                                       | **Accettata** | chi può far scorrere un'area, e chi veste la barra                                        | A14             |
| [0046](0046-le-icone-vengono-da-un-insieme-e-il-disegno-e-generato.md)         | Le icone vengono da un insieme, e il disegno è generato            | **Accettata** | da dove viene un simbolo, e come si cambia insieme                                        | A14             |
| [0047](0047-uno-strumento-che-non-e-il-prodotto-vive-in-scripts.md)            | Uno strumento che non è il prodotto vive in `scripts/`             | **Accettata** | dove sta ciò che serve a guardare il gioco, e cosa non ci sta                             | —               |
| [0048](0048-la-catena-di-build-si-muove-insieme.md)                            | La catena di build si muove insieme                                | **Accettata** | a quale versione sta Vite, e perché non alla più recente                                  | —               |
| [0049](0049-il-mondo-avanza-a-blocchi.md)                                      | Il mondo avanza a blocchi, e il blocco è dell'operazione           | **Accettata** | a quale grana il mondo può cambiare, e di chi è la responsabilità di spezzare             | R25             |
| [0050](0050-la-cadenza-sta-sulla-via-unica.md)                                 | La cadenza sta sulla via unica, e si consuma in un posto solo      | **Accettata** | chi si accorge che il tempo è passato, e quando il gioco si scrive su disco               | INV-25          |
| [0051](0051-lo-spazio-di-un-caveau-non-e-una-somma-di-denaro.md)               | Lo spazio di un caveau non è una somma di denaro                   | **Proposta**  | in quale unità si misura ciò che sta in un caveau, e dove vive la conversione             | INV-26          |
| [0052](0052-un-guadagno-dichiara-dove-atterra.md)                              | Un guadagno dichiara dove atterra                                  | **Accettata** | in quale pool atterrano i soldi che un dominio produce, e chi lo decide                   | INV-27          |

Gli ADR da 0017 a 0020 nascono dall'aver guardato la [visione di prodotto](../prodotto/visione.md)
**prima** di scrivere il kernel. Tre di essi cambiano il Ledger rispetto allo STOP 1 iniziale: è
esattamente il valore di quel passaggio, e sarebbe costato una migrazione del salvataggio farlo
dopo. Il 0021 nasce invece dallo **scriverlo**, quel Ledger: la contraddizione fra il `post()` del
0019 e la somma zero del 0020 era visibile sulla carta, ma quale delle due dovesse cedere si è
visto solo con il codice davanti.

Il **0022** e il **0023** nascono dalla stessa mossa, ripetuta: la visione è stata riletta chiedendo
cosa vuol dire _profondo_ dominio per dominio, e sono uscite due cose che la prima lettura non
aveva visto — che i conti del libro mastro non possono essere sei e fissi, e che serve un solo
posto che sappia che giorno è. Entrambe sono **decise e non costruite**: il grilletto è nel
[registro YAGNI](../roadmap-fette.md), e prenderle oggi costa un documento, mentre prenderle dopo
tre domini costerebbe tre domini.

I codici `A01`–`A17` sono i difetti misurati nell'audit del progetto precedente, elencati in
[../rischi.md](../rischi.md). La catena completa difetto → regola → meccanismo → test sta in
[../tracciabilita.md](../tracciabilita.md).

## Decisioni approvate dall'utente

Approvate il **2026-08-19**. Restavano in stato _Proposta_ finché non esisteva il meccanismo che
le impone: approvata non è Accettata, perché una è una volontà e l'altra è un fatto verificabile.

Da [D013](../delega/D013-verifica-della-fetta.md) tutte e quattro sono **fatti**, e l'ultima a
diventarlo è stata la più silenziosa: il nome del prodotto era approvato dal 2026-08-19 e imposto
da un test da D001, ma la riga di stato dell'ADR 0008 diceva ancora «richiede la scelta
dell'utente». La scelta era stata fatta; nessuno era tornato a scriverlo.

| Cosa                         | ADR                                                                         | Esito                                                         |
| ---------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Dove gira la simulazione     | 0001                                                                        | renderer, con `core/` puro e il main proprietario della busta |
| Il nome del prodotto         | 0008                                                                        | **Solvent**                                                   |
| Le tre dipendenze di runtime | 0015                                                                        | `decimal.js`, `vue-i18n`, `zod`                               |
| Lo stile visivo              | [P2](../prodotto/preferenze.md#p2--lo-stile-visivo-viene-dal-design-system) | il mockup della fetta 01                                      |

## Decisioni prese in autonomia, contestabili

Prese seguendo la direttiva _"la soluzione più coerente, professionale, meno pigra, senza debiti"_.
Non bloccano, ma sono strutturali: se una non convince, il momento di dirlo è adesso — dopo tre
domini costerebbe una migrazione.

| Cosa                                                                 | ADR                                                                            | Alternativa scartata                                                                                                                                               |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Ogni transazione bilancia a zero                                     | [0020](0020-partita-doppia.md)                                                 | movimenti singoli con categoria: più corto, ma la categoria è un'etichetta che nulla verifica                                                                      |
| Il Ledger espone transazioni, non movimenti                          | [0019](0019-transazioni-atomiche-nel-ledger.md)                                | due `post()` con rollback nel chiamante: rimette la logica del denaro fuori dal Ledger                                                                             |
| I pool dichiarano le proprie affordance come dati                    | [0017](0017-il-denaro-e-plurale.md)                                            | un saldo unico con etichette nella UI                                                                                                                              |
| `post()` non esiste: una primitiva sola                              | [0021](0021-una-sola-primitiva-per-il-denaro.md)                               | zucchero a due movimenti, che però rimetterebbe `world` e `sink` nei domini (INV-10)                                                                               |
| Il Ledger avrà conti dinamici, non solo sei pool                     | [0022](0022-il-ledger-ha-conti-non-solo-pool.md)                               | il budget di un'attività come stato del dominio: costa zero oggi e rende falsa la regola 6                                                                         |
| Il tempo di gioco è un dominio, non il kernel                        | [0023](0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                      | un `now` nel `SystemContext`: più diretto, ma aggiunge una chiave a `SavePayload`                                                                                  |
| Un sistema riceve per costruzione ciò che il contesto non porta      | [0024](0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md) | un singleton in `balance/`: nessun parametro in più, e una dipendenza che sparisce dalle firme                                                                     |
| La capienza di un pool si chiede al dominio, non si legge da `POOLS` | [0025](0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)                  | il dominio controlla prima e il kernel non si tocca: costa zero, e sposta l'invariante della capienza fuori dal Ledger — cioè il difetto A05 con un altro nome     |
| Un dominio ha una cartella sua, e di norma una pagina sua            | [0033](0033-un-dominio-ha-una-cartella-e-una-pagina.md)                        | il criterio caso per caso — «una pagina è un posto dove si va apposta»: dà la risposta giusta sul caveau, e resta un giudizio che nessun test può verificare       |
| La cadenza del salvataggio sta sulla via unica del tempo             | [0050](0050-la-cadenza-sta-sulla-via-unica.md)                                 | contarla nello store: cinquanta righe in meno, e un secondo posto che sa una cadenza — con R25 che resta verde perché guarda `tickAll`, che una cadenza non nomina |

Le prime quattro sono **in vigore** dalla fetta 01 e sono state usate da due domini: cambiarle
costa il Ledger, i suoi test e i due domini. I due momenti buoni per contestarle — prima di D007 e
prima di D014 — sono passati entrambi, e nessuna delle quattro si è rivelata scomoda usandole
([D013](../delega/D013-verifica-della-fetta.md), punto 3 del rapporto).

Le due successive non sono in vigore e **non costano ancora niente**: nessuna riga di codice le
applica. Contestarle oggi costa la modifica di un documento. Il momento in cui smetteranno di
essere gratuite è il blocco B per il tempo e il blocco D per i conti — la sequenza sta in
[roadmap-fette.md](../roadmap-fette.md).

Il **0025** era dello STOP 2 e stava nel mezzo: non costava ancora niente perché nessuna
riga la applicava. [D017](../delega/D017-il-caveau.md) l'ha applicata, e adesso il prezzo si può
scrivere invece di stimarlo: costa una firma del kernel, un campo in più sul `Ledger`, una riga del
bootstrap — e **restituisce** il `vi.mock` che `tests/kernel/ledger-capacity` teneva. Contestarla
oggi costa più di ieri e molto meno di domani.

L'**0033** è di [D026](../delega/D026-dove-si-attacca-un-dominio.md), ed è la prima riga di questa
tabella che nasce già **in vigore**: costa le due pagine nuove, la colonna a gruppi, le cinque
cartelle di `components/` e `tests/rules/domain-ui`. Contestarla non è gratis e non è caro: i file
sono dove sono, e spostarli è un `git mv` più un giro di import. Il momento in cui diventerà caro è
il primo dominio della fetta 04, che nascerà già dentro questa forma.

Il **0051** nasce il 2026-08-24 rileggendo la [scheda del caveau](../design/domini/vault.md) contro
il codice, ed è `Proposta` finché [D042](../delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md) non
la esegue. Corregge un **errore di unità** che nessun gate poteva vedere: la capienza del caveau è
un `Money`, e l'ingombro di un oggetto — che per disegno **non è** il suo valore — era dichiarato
nella stessa unità. Le due grandezze non si sommano, e oggi non si sommano solo perché nessuno ha
ancora provato. Il costo oggi è un tipo branded e una moltiplicazione; il giorno degli oggetti
sarebbe ogni chiamante di quell'ingombro. Va letta insieme
all'[ADR 0025](0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md), che le ha preparato il posto:
la capienza è già una **funzione** che il caveau possiede, quindi la conversione ha un punto solo
dove vivere.

Il **0052** nasce lo stesso giorno, e non da una rilettura: da una sessione di gioco. È `Proposta`
finché [D043](../delega/D043-il-reddito-si-mette-in-regola.md) non la esegue. Il difetto che copre
non è visibile nel codice di oggi — è una costante privata, `INCOME_POOL = 'cash'`, che nessun
documento ha mai deciso e che fa del tetto dei contanti il tetto di **tutto** il reddito del gioco.
A 12,00 €/s quel tetto è la lezione della fetta 02; con i domini che la
[visione](../prodotto/visione.md) promette — impresa, mercato, immobiliare, crypto — è un pulsante
da premere dieci volte al secondo. Va letta insieme
all'[ADR 0027](0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md), di cui estende il
ragionamento: quell'ADR vieta la conversione automatica **dentro un acquisto** perché cancella il
momento in cui il giocatore decide di lasciare una traccia; questa vieta che quel momento diventi
un gesto da ripetere, e lo trasforma in una scelta che si prende una volta.

## Decisioni deliberatamente rimandate

Non sono dimenticanze: sono decisioni che oggi non hanno abbastanza informazione per essere prese
bene, e che rimandare non costa nulla. Sono elencate con il **momento in cui vanno prese**.

| Decisione                                                              | Si prende quando                                          | Perché non ora                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un tool per il codice morto non visto da TS (CSS, export inutilizzati) | all'inizio della seconda fetta                            | oggi la superficie è troppo piccola perché il problema esista                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Simulazione in un Web Worker                                           | se e quando un profilo mostra il tick che blocca il frame | ottimizzazione senza una misura è indovinare                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Canale di distribuzione e firma del binario                            | prima del primo rilascio pubblico                         | mettere un `publish` finto ora è come è nato `example.com`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Strategia di telemetria / analytics                                    | quando esiste un giocatore che non siamo noi              | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Cosa matura mentre il gioco è chiuso, e per quanto                     | alla prima fetta con affitti o mercato (blocco B o C)     | il tetto di otto ore della fetta 03 è stato scelto per un gioco senza scadenze né mercati che corrono. Con gli affitti e la crypto quel numero va ridiscusso, e non prima di avere entrambi davanti                                                                                                                                                                                                                                                                                                                                                                              |
| Dove vive la partita: sul disco del giocatore o su un server           | il primo numero confrontato fra due giocatori             | oggi la partita è di chi la gioca e nessuno la legge: [rischi.md](../rischi.md) accetta che il salvataggio si possa manomettere, ed è la risposta giusta per un singleplayer offline (ADR 0001). Una classifica la rende sbagliata di colpo — un punteggio confrontabile vuole una simulazione **autorevole**, e qui l'autorità è un file JSON sul disco di casa. Il giunto però c'è già e non costa: `src/core/**` è TypeScript puro che gira in Node, e `SaveApi` sono tre funzioni **asincrone** — spostare l'autorità è cambiare l'implementazione del preload, non il gioco |
