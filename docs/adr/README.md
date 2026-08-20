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

Restano _Proposta_ tre decisioni, e per due è corretto: **0022** e **0023** descrivono cose che il
progetto non ha ancora costruito, e diventeranno un fatto con il dominio che le userà. La terza è
**0010**, e ha il meccanismo **a metà**: `boundedList<T>(max)` è l'unico costruttore e `max` è
obbligatorio, ma la seconda frase della decisione — «il validatore del salvataggio rifiuta un array
che supera il `max` dichiarato» — non ha niente da validare, perché nel payload della versione 1
non c'è nessun array. La lista delle ultime operazioni ha il suo limite ed è un mirror che riparte
vuoto: non attraversa il disco. Metà meccanismo non è una decisione in vigore, ed è il caveau della
fetta 02 a chiuderla.

## Le decisioni

| #                                                                              | Titolo                                                         | Stato         | Cosa vincola                                                            | Difetto coperto |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------- | --------------- |
| [0001](0001-simulazione-nel-renderer-core-puro.md)                             | La simulazione gira nel renderer, `core/` è puro               | **Accettata** | dove vive la logica, cosa può importare `core/`                         | A02             |
| [0002](0002-registry-unica-lista-di-sistemi.md)                                | Il Registry è l'unica lista di sistemi                         | **Accettata** | come si aggiunge un sistema, chi itera                                  | A01, A06        |
| [0003](0003-ledger-unica-porta-del-denaro.md)                                  | Il Ledger è l'unica porta del denaro                           | **Accettata** | chi può cambiare un saldo                                               | A05             |
| [0004](0004-il-main-e-proprietario-del-contratto-di-salvataggio.md)            | Il main possiede il contratto di salvataggio                   | **Accettata** | chi scrive la versione, dove vivono le migrazioni                       | A07, A08        |
| [0005](0005-rng-seedato-con-stream-per-dominio.md)                             | PRNG seedato con stream per dominio                            | **Accettata** | ogni sorgente di casualità del gioco                                    | A03             |
| [0006](0006-decimal-end-to-end-per-il-denaro.md)                               | Il denaro è `Decimal` end-to-end                               | **Accettata** | il tipo di ogni valore monetario                                        | A11             |
| [0007](0007-result-come-unico-stile-di-esito.md)                               | `Result<T,E>` come unico stile di esito                        | **Accettata** | la firma di ogni operazione che può fallire                             | A12             |
| [0008](0008-nome-e-identita-del-prodotto.md)                                   | Un solo nome, deciso prima del primo file                      | **Accettata** | `appId`, percorso salvataggi, chiavi di registro                        | A15             |
| [0009](0009-passo-fisso-e-tipi-branded-per-il-tempo.md)                        | Passo fisso a 10 tick/s, tempo con tipi branded                | **Accettata** | la firma di ogni `tick`, il progresso offline                           | A04             |
| [0010](0010-liste-storiche-limitate-alla-definizione.md)                       | Una lista storica nasce già con il suo limite                  | Proposta      | la dimensione massima del salvataggio                                   | A10             |
| [0011](0011-i18n-obbligatoria-con-parita-verificata.md)                        | i18n dal primo giorno, parità verificata da un test            | **Accettata** | ogni stringa mostrata all'utente                                        | A13             |
| [0012](0012-controlli-sul-codice-morto-sempre-accesi.md)                       | `noUnusedLocals` / `noUnusedParameters` sempre accesi          | **Accettata** | la sopravvivenza del codice morto                                       | A14             |
| [0013](0013-prettier-e-autorita-sulla-formattazione.md)                        | Prettier è l'unica autorità sulla formattazione                | **Accettata** | il diff di ogni commit                                                  | A16             |
| [0014](0014-una-fetta-verticale-alla-volta.md)                                 | Una fetta verticale alla volta                                 | **Accettata** | l'ordine di tutto il lavoro futuro                                      | A17             |
| [0015](0015-criterio-di-ammissione-delle-dipendenze.md)                        | Criterio di ammissione delle dipendenze                        | **Accettata** | ogni `npm install` da qui in avanti                                     | —               |
| [0016](0016-il-bus-e-sincrono-e-fire-and-forget.md)                            | Il Bus è sincrono, fire-and-forget, non event sourcing         | **Accettata** | la forma di ogni handler e di ogni sistema                              | —               |
| [0017](0017-il-denaro-e-plurale.md)                                            | Il denaro è plurale: pool con affordance diverse               | **Accettata** | ogni azione che muove denaro, in ogni dominio                           | —               |
| [0018](0018-la-home-e-un-atm.md)                                               | La home è un ATM, non una dashboard                            | **Accettata** | la schermata principale e la navigazione                                | —               |
| [0019](0019-transazioni-atomiche-nel-ledger.md)                                | Il Ledger applica transazioni atomiche                         | **Accettata** | la primitiva di ogni movimento di denaro                                | —               |
| [0020](0020-partita-doppia.md)                                                 | Ogni transazione bilancia a zero                               | **Accettata** | come si scrive ogni riga di economia, e come si misura il bilanciamento | —               |
| [0021](0021-una-sola-primitiva-per-il-denaro.md)                               | Una sola primitiva per il denaro: `post()` non esiste          | **Accettata** | come un dominio chiede un movimento di denaro                           | —               |
| [0022](0022-il-ledger-ha-conti-non-solo-pool.md)                               | Il Ledger ha conti, non solo pool                              | Proposta      | dove vive il denaro di un'entità creata dal giocatore                   | A05             |
| [0023](0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                      | Il tempo di gioco è un sistema di dominio                      | Proposta      | chi sa che giorno è, e come lo sanno gli altri                          | —               |
| [0024](0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md) | Un sistema riceve per costruzione ciò che non sta nel contesto | **Accettata** | come un dominio ottiene ciò che il `SystemContext` non porta            | —               |

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

| Cosa                         | ADR                                                                        | Esito                                                         |
| ---------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Dove gira la simulazione     | 0001                                                                       | renderer, con `core/` puro e il main proprietario della busta |
| Il nome del prodotto         | 0008                                                                       | **Solvent**                                                   |
| Le tre dipendenze di runtime | 0015                                                                       | `decimal.js`, `vue-i18n`, `zod`                               |
| Lo stile visivo              | [P2](../prodotto/preferenze.md#p2--lo-stile-visivo-del-mockup-è-approvato) | il mockup della fetta 01                                      |

## Decisioni prese in autonomia, contestabili

Prese seguendo la direttiva _"la soluzione più coerente, professionale, meno pigra, senza debiti"_.
Non bloccano, ma sono strutturali: se una non convince, il momento di dirlo è adesso — dopo tre
domini costerebbe una migrazione.

| Cosa                                                            | ADR                                                                            | Alternativa scartata                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Ogni transazione bilancia a zero                                | [0020](0020-partita-doppia.md)                                                 | movimenti singoli con categoria: più corto, ma la categoria è un'etichetta che nulla verifica  |
| Il Ledger espone transazioni, non movimenti                     | [0019](0019-transazioni-atomiche-nel-ledger.md)                                | due `post()` con rollback nel chiamante: rimette la logica del denaro fuori dal Ledger         |
| I pool dichiarano le proprie affordance come dati               | [0017](0017-il-denaro-e-plurale.md)                                            | un saldo unico con etichette nella UI                                                          |
| `post()` non esiste: una primitiva sola                         | [0021](0021-una-sola-primitiva-per-il-denaro.md)                               | zucchero a due movimenti, che però rimetterebbe `world` e `sink` nei domini (INV-10)           |
| Il Ledger avrà conti dinamici, non solo sei pool                | [0022](0022-il-ledger-ha-conti-non-solo-pool.md)                               | il budget di un'attività come stato del dominio: costa zero oggi e rende falsa la regola 6     |
| Il tempo di gioco è un dominio, non il kernel                   | [0023](0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)                      | un `now` nel `SystemContext`: più diretto, ma aggiunge una chiave a `SavePayload`              |
| Un sistema riceve per costruzione ciò che il contesto non porta | [0024](0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md) | un singleton in `balance/`: nessun parametro in più, e una dipendenza che sparisce dalle firme |

Le prime tre sono ora **in vigore**: D007 le ha scritte. Cambiarle non costa più zero — costa il
Ledger e i suoi test, che è ancora poco, ma non è più niente. Il momento buono per contestarle era
prima di D007; il secondo momento buono è prima di D014, che sarà il primo dominio a usarle.

Le ultime due non sono in vigore e **non costano ancora niente**: nessuna riga di codice le
applica. Contestarle oggi costa la modifica di un documento. Il momento in cui smetteranno di
essere gratuite è il blocco B per il tempo e il blocco D per i conti — la sequenza sta in
[roadmap-fette.md](../roadmap-fette.md).

## Decisioni deliberatamente rimandate

Non sono dimenticanze: sono decisioni che oggi non hanno abbastanza informazione per essere prese
bene, e che rimandare non costa nulla. Sono elencate con il **momento in cui vanno prese**.

| Decisione                                                              | Si prende quando                                          | Perché non ora                                                                                                                                                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un tool per il codice morto non visto da TS (CSS, export inutilizzati) | all'inizio della seconda fetta                            | oggi la superficie è troppo piccola perché il problema esista                                                                                                                                       |
| Simulazione in un Web Worker                                           | se e quando un profilo mostra il tick che blocca il frame | ottimizzazione senza una misura è indovinare                                                                                                                                                        |
| Canale di distribuzione e firma del binario                            | prima del primo rilascio pubblico                         | mettere un `publish` finto ora è come è nato `example.com`                                                                                                                                          |
| Strategia di telemetria / analytics                                    | quando esiste un giocatore che non siamo noi              | —                                                                                                                                                                                                   |
| Cosa matura mentre il gioco è chiuso, e per quanto                     | alla prima fetta con affitti o mercato (blocco B o C)     | il tetto di otto ore della fetta 03 è stato scelto per un gioco senza scadenze né mercati che corrono. Con gli affitti e la crypto quel numero va ridiscusso, e non prima di avere entrambi davanti |
