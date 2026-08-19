# Documentazione

Mappa di tutto ciò che è scritto, a cosa serve, e quanto ci si può fidare che sia aggiornato.

## I documenti

| Documento                                                          | Risponde a                                                                          | Tipo            |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------- |
| [prodotto/visione.md](prodotto/visione.md)                         | cosa sarà Solvent finito: i domini, cosa li rende profondi, come si collegano       | **vivo**        |
| [prodotto/preferenze.md](prodotto/preferenze.md)                   | le preferenze permanenti: nome, stile, home ATM, contanti/carta, carta 3D           | **vivo**        |
| [architettura.md](architettura.md)                                 | com'è fatto il sistema, cosa può importare cosa                                     | **vivo**        |
| [adr/README.md](adr/README.md)                                     | **compendio delle decisioni**: quali sono, il loro stato, cosa vincolano            | **vivo**        |
| [adr/NNNN-*.md](adr/)                                              | _perché_ una singola decisione è stata presa così, e cosa è stato scartato          | append-only     |
| [tracciabilita.md](tracciabilita.md)                               | dato un difetto, cosa lo impedisce; data una regola, chi la impone                  | **vivo**        |
| [rischi.md](rischi.md)                                             | i 17 difetti misurati, i rischi che questa architettura introduce, quelli accettati | **vivo**        |
| [glossario.md](glossario.md)                                       | cosa significa esattamente una parola, nel codice e fuori                           | **vivo**        |
| [convenzioni.md](convenzioni.md)                                   | come si chiamano le cose, come si commenta, come si committa                        | **vivo**        |
| [qualita.md](qualita.md)                                           | quali sono i gate, cosa garantiscono, cosa **non** garantiscono                     | **vivo**        |
| [roadmap-fette.md](roadmap-fette.md)                               | cosa si costruisce dopo, e cosa è stato lasciato fuori con quale grilletto          | **vivo**        |
| [design/flusso-tick.md](design/flusso-tick.md)                     | cosa succede fra un frame e un cambiamento di saldo                                 | **vivo**        |
| [design/flusso-salvataggio.md](design/flusso-salvataggio.md)       | chi possiede il contratto di salvataggio, e come si migra                           | **vivo**        |
| [design/ciclo-di-vita.md](design/ciclo-di-vita.md)                 | in quali stati può trovarsi l'applicazione                                          | **vivo**        |
| [design/mockups/](design/mockups/)                                 | com'è fatta la schermata, e in quali stati                                          | snapshot        |
| [delega/PASSAGGIO-DI-CONSEGNE.md](delega/PASSAGGIO-DI-CONSEGNE.md) | dove siamo, cosa non fare, qual è il prossimo passo — per chi arriva ora            | **vivo**        |
| [delega/](delega/)                                                 | i pacchetti di lavoro: cosa fare, cosa non fare, quando è finito                    | si **chiudono** |

**Vivo** significa: se una modifica al codice lo contraddice, quel documento cambia nello stesso
commit. **Append-only**: un ADR superato non si cancella, se ne scrive uno nuovo. **Si chiudono**:
una delega chiusa è un documento storico, non una fonte di verità sul codice corrente.

## Da dove cominciare

**Arrivi ora sul progetto** → [delega/PASSAGGIO-DI-CONSEGNE.md](delega/PASSAGGIO-DI-CONSEGNE.md), dieci minuti e sai ripartire. Poi → [architettura.md](architettura.md), poi
[glossario.md](glossario.md), poi il [compendio](adr/README.md) scorrendo solo i titoli.
Venti minuti.

**Devi cambiare qualcosa** → cerca la decisione nel [compendio](adr/README.md). Se esiste, la
discussione riparte dalle alternative già scartate. Poi [convenzioni.md](convenzioni.md).

**Devi aggiungere un sistema** → una cartella sotto `src/core/domains/` con dentro `system.ts` che
chiama `defineSystem`, e una riga di `register` nel bootstrap. Nient'altro, mai (ADR 0002). Il tipo
è in `src/core/kernel/Registry.ts`; se il sistema ha `save`, il compilatore pretende anche `load` e
`reset`. Il bootstrap nasce con [delega/D011](delega/D011-runtime-e-store.md): finché non esiste,
il conteggio di `tests/rules/registry-completeness` è zero a zero e diventa rosso appena nasce la
prima cartella senza la sua riga.

**Devi decidere se una cosa si fa adesso** → [roadmap-fette.md](roadmap-fette.md), sezione
registro YAGNI. Se è lì, guarda il grilletto.

**Vuoi sapere quanto è solido** → [rischi.md](rischi.md), parte 2 e 3. Sono le due parti scritte
contro il progetto, e sono quelle che dicono di più.

**Devi capire perché una regola esiste** → [tracciabilita.md](tracciabilita.md): ogni regola è
agganciata al difetto misurato che la giustifica.

## Regole di manutenzione

1. **Un confine che si sposta cambia il documento che lo descrive, nello stesso commit.** Non nel
   commit dopo, non in un task "di documentazione". È l'unica difesa contro il rischio N07.
2. **I documenti non duplicano il codice.** Le firme stanno nei file `.ts`. Qui stanno il perché,
   il mapping e il linguaggio — cose che il codice non può contenere.
3. **Una regola senza una riga in [tracciabilita.md](tracciabilita.md) non esiste.** Se aggiungi
   una regola, aggiungi la riga; se una riga non ha un meccanismo, non è una regola: è una
   speranza.
4. **Nessun `TODO` nel codice.** Ciò che manca sta in [roadmap-fette.md](roadmap-fette.md), dove
   si vede senza aprire quel file.

## Stato attuale

**STOP 1 approvato** il 2026-08-19: nome (_Solvent_), stile visivo, le tre dipendenze di runtime e
la simulazione nel renderer. Le decisioni prese in autonomia — pool con affordance, transazioni
atomiche, partita doppia — sono elencate nel [compendio](adr/README.md#decisioni-prese-in-autonomia-contestabili).

**Da D001 a [D010](delega/D010-dominio-income.md) sono chiuse.** Le regole del progetto sono
eseguibili, i contratti esistono — `Result`, `Money`, i pool, i tipi del Ledger, l'ambito di reset,
`boundedList`, gli eventi, il salvataggio, i comandi — e il kernel ha Clock, Rng, Bus, Registry,
Ledger e Balance. Il denaro ha la sua unica porta, a partita doppia; i numeri di gioco hanno un
posto solo e un bersaglio verificato. Con D009 il progetto è uscito da `core/` per la prima volta:
`src/main/` valida il salvataggio con uno schema **eseguito**, lo scrive in modo atomico ed espone
tre canali IPC, e `src/preload/` espone tre funzioni e nient'altro. Con D010 è nato il **primo
dominio**: `income` produce reddito in contanti a ogni tick e vende un upgrade che si paga solo con
la carta. Con D014 è nato il **secondo**, e il ciclo si chiude: `atm` sposta denaro fra contanti e
carta trattenendo una commissione, e non ha stato — è un dominio di soli comandi. La prossima
delega è [D011 — Runtime e store](delega/D011-runtime-e-store.md).

Gli ADR restano in stato _Proposta_ finché il codice non li impone davvero: passano ad _Accettata_
delega per delega, non per decreto. Con D002 sono passati
[0006](adr/0006-decimal-end-to-end-per-il-denaro.md) e
[0007](adr/0007-result-come-unico-stile-di-esito.md), con D004
[0005](adr/0005-rng-seedato-con-stream-per-dominio.md), con D005
[0016](adr/0016-il-bus-e-sincrono-e-fire-and-forget.md), con D006
[0002](adr/0002-registry-unica-lista-di-sistemi.md), con D007
[0003](adr/0003-ledger-unica-porta-del-denaro.md),
[0017](adr/0017-il-denaro-e-plurale.md),
[0019](adr/0019-transazioni-atomiche-nel-ledger.md),
[0020](adr/0020-partita-doppia.md) e il nuovo
[0021](adr/0021-una-sola-primitiva-per-il-denaro.md), con D009
[0004](adr/0004-il-main-e-proprietario-del-contratto-di-salvataggio.md) e con D010 il nuovo
[0024](adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md).
