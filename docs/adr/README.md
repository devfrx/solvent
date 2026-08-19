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

Al momento **tutte le decisioni sono in stato Proposta**: sono lo STOP 1 in attesa di
approvazione. Diventano _Accettate_ nel commit che introduce il meccanismo che le impone — mai
prima, altrimenti sarebbero solo buone intenzioni.

## Le decisioni

| #                                                                   | Titolo                                                 | Stato    | Cosa vincola                                                            | Difetto coperto |
| ------------------------------------------------------------------- | ------------------------------------------------------ | -------- | ----------------------------------------------------------------------- | --------------- |
| [0001](0001-simulazione-nel-renderer-core-puro.md)                  | La simulazione gira nel renderer, `core/` è puro       | Proposta | dove vive la logica, cosa può importare `core/`                         | A02             |
| [0002](0002-registry-unica-lista-di-sistemi.md)                     | Il Registry è l'unica lista di sistemi                 | Proposta | come si aggiunge un sistema, chi itera                                  | A01, A06        |
| [0003](0003-ledger-unica-porta-del-denaro.md)                       | Il Ledger è l'unica porta del denaro                   | Proposta | chi può cambiare un saldo                                               | A05             |
| [0004](0004-il-main-e-proprietario-del-contratto-di-salvataggio.md) | Il main possiede il contratto di salvataggio           | Proposta | chi scrive la versione, dove vivono le migrazioni                       | A07, A08        |
| [0005](0005-rng-seedato-con-stream-per-dominio.md)                  | PRNG seedato con stream per dominio                    | Proposta | ogni sorgente di casualità del gioco                                    | A03             |
| [0006](0006-decimal-end-to-end-per-il-denaro.md)                    | Il denaro è `Decimal` end-to-end                       | Proposta | il tipo di ogni valore monetario                                        | A11             |
| [0007](0007-result-come-unico-stile-di-esito.md)                    | `Result<T,E>` come unico stile di esito                | Proposta | la firma di ogni operazione che può fallire                             | A12             |
| [0008](0008-nome-e-identita-del-prodotto.md)                        | Un solo nome, deciso prima del primo file              | Proposta | `appId`, percorso salvataggi, chiavi di registro                        | A15             |
| [0009](0009-passo-fisso-e-tipi-branded-per-il-tempo.md)             | Passo fisso a 10 tick/s, tempo con tipi branded        | Proposta | la firma di ogni `tick`, il progresso offline                           | A04             |
| [0010](0010-liste-storiche-limitate-alla-definizione.md)            | Una lista storica nasce già con il suo limite          | Proposta | la dimensione massima del salvataggio                                   | A10             |
| [0011](0011-i18n-obbligatoria-con-parita-verificata.md)             | i18n dal primo giorno, parità verificata da un test    | Proposta | ogni stringa mostrata all'utente                                        | A13             |
| [0012](0012-controlli-sul-codice-morto-sempre-accesi.md)            | `noUnusedLocals` / `noUnusedParameters` sempre accesi  | Proposta | la sopravvivenza del codice morto                                       | A14             |
| [0013](0013-prettier-e-autorita-sulla-formattazione.md)             | Prettier è l'unica autorità sulla formattazione        | Proposta | il diff di ogni commit                                                  | A16             |
| [0014](0014-una-fetta-verticale-alla-volta.md)                      | Una fetta verticale alla volta                         | Proposta | l'ordine di tutto il lavoro futuro                                      | A17             |
| [0015](0015-criterio-di-ammissione-delle-dipendenze.md)             | Criterio di ammissione delle dipendenze                | Proposta | ogni `npm install` da qui in avanti                                     | —               |
| [0016](0016-il-bus-e-sincrono-e-fire-and-forget.md)                 | Il Bus è sincrono, fire-and-forget, non event sourcing | Proposta | la forma di ogni handler e di ogni sistema                              | —               |
| [0017](0017-il-denaro-e-plurale.md)                                 | Il denaro è plurale: pool con affordance diverse       | Proposta | ogni azione che muove denaro, in ogni dominio                           | —               |
| [0018](0018-la-home-e-un-atm.md)                                    | La home è un ATM, non una dashboard                    | Proposta | la schermata principale e la navigazione                                | —               |
| [0019](0019-transazioni-atomiche-nel-ledger.md)                     | Il Ledger applica transazioni atomiche                 | Proposta | la primitiva di ogni movimento di denaro                                | —               |
| [0020](0020-partita-doppia.md)                                      | Ogni transazione bilancia a zero                       | Proposta | come si scrive ogni riga di economia, e come si misura il bilanciamento | —               |

Gli ADR da 0017 a 0020 nascono dall'aver guardato la [visione di prodotto](../prodotto/visione.md)
**prima** di scrivere il kernel. Tre di essi cambiano il Ledger rispetto allo STOP 1 iniziale: è
esattamente il valore di quel passaggio, e sarebbe costato una migrazione del salvataggio farlo
dopo.

I codici `A01`–`A17` sono i difetti misurati nell'audit del progetto precedente, elencati in
[../rischi.md](../rischi.md). La catena completa difetto → regola → meccanismo → test sta in
[../tracciabilita.md](../tracciabilita.md).

## Decisioni approvate dall'utente

Approvate il **2026-08-19**. Restano in stato _Proposta_ finché non esiste il meccanismo che le
impone — cioè fino al commit di [D001](../delega/D001-tooling-e-gate.md). Approvata non è
Accettata: la differenza è che una è una volontà e l'altra è un fatto verificabile.

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

| Cosa                                              | ADR                                             | Alternativa scartata                                                                          |
| ------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Ogni transazione bilancia a zero                  | [0020](0020-partita-doppia.md)                  | movimenti singoli con categoria: più corto, ma la categoria è un'etichetta che nulla verifica |
| Il Ledger espone transazioni, non movimenti       | [0019](0019-transazioni-atomiche-nel-ledger.md) | due `post()` con rollback nel chiamante: rimette la logica del denaro fuori dal Ledger        |
| I pool dichiarano le proprie affordance come dati | [0017](0017-il-denaro-e-plurale.md)             | un saldo unico con etichette nella UI                                                         |

## Decisioni deliberatamente rimandate

Non sono dimenticanze: sono decisioni che oggi non hanno abbastanza informazione per essere prese
bene, e che rimandare non costa nulla. Sono elencate con il **momento in cui vanno prese**.

| Decisione                                                              | Si prende quando                                          | Perché non ora                                                |
| ---------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| Un tool per il codice morto non visto da TS (CSS, export inutilizzati) | all'inizio della seconda fetta                            | oggi la superficie è troppo piccola perché il problema esista |
| Simulazione in un Web Worker                                           | se e quando un profilo mostra il tick che blocca il frame | ottimizzazione senza una misura è indovinare                  |
| Canale di distribuzione e firma del binario                            | prima del primo rilascio pubblico                         | mettere un `publish` finto ora è come è nato `example.com`    |
| Strategia di telemetria / analytics                                    | quando esiste un giocatore che non siamo noi              | —                                                             |
