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

**Devi aggiungere un sistema** → il README di progetto (20 righe), poi
[delega/D006](delega/D006-kernel-registry.md) per capire cosa il Registry si aspetta.

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

**D001, [D002](delega/D002-contratti.md), [D003](delega/D003-kernel-clock.md) e
[D004](delega/D004-kernel-rng.md) sono chiuse.** Le regole del progetto sono eseguibili, i
contratti esistono — `Result`, `Money`, i pool, i tipi del Ledger, `boundedList`, gli eventi, il
salvataggio, i comandi — e del kernel ci sono il Clock e l'Rng. Il codice di dominio non è ancora
iniziato: la prossima delega è [D005 — Bus](delega/D005-kernel-bus.md), l'ultimo pezzo che manca
prima del Registry.

Gli ADR restano in stato _Proposta_ finché il codice non li impone davvero: passano ad _Accettata_
delega per delega, non per decreto. Con D002 sono passati
[0006](adr/0006-decimal-end-to-end-per-il-denaro.md) e
[0007](adr/0007-result-come-unico-stile-di-esito.md).
