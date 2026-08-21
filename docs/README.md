# Documentazione

Mappa di tutto ciò che è scritto, a cosa serve, e quanto ci si può fidare che sia aggiornato.

## I documenti

| Documento                                                          | Risponde a                                                                          | Tipo            |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------- |
| [stato.md](stato.md)                                               | quanti sono gli ADR, le deleghe e i documenti, e in che stato — **generato**        | **generato**    |
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
| [design/mappa-funzionale.md](design/mappa-funzionale.md)           | cosa fa il software e cosa deve reggere l'interfaccia, per chi progetta il design   | snapshot        |
| [design/domini/](design/domini/)                                   | il modulo che ogni dominio compila prima di essere scritto, e le schede compilate   | **vivo**        |
| [design/mockups/](design/mockups/)                                 | i disegni consegnati, canvas compreso — la loro lettura, non la loro autorità       | snapshot        |
| [delega/PASSAGGIO-DI-CONSEGNE.md](delega/PASSAGGIO-DI-CONSEGNE.md) | dove siamo, cosa non fare, qual è il prossimo passo — per chi arriva ora            | **vivo**        |
| [delega/](delega/)                                                 | i pacchetti di lavoro: cosa fare, cosa non fare, quando è finito                    | si **chiudono** |

**Vivo** significa: se una modifica al codice lo contraddice, quel documento cambia nello stesso
commit. **Append-only**: un ADR superato non si cancella, se ne scrive uno nuovo. **Si chiudono**:
una delega chiusa è un documento storico, non una fonte di verità sul codice corrente.
**Generato**: non si scrive a mano, e a scriverlo a mano si diventa rossi — lo produce
`tests/helpers/projectState.ts` e lo verifica `tests/rules/project-state`.

**Nessun documento ridice ciò che [stato.md](stato.md) conta** (regola C11). Un conteggio scritto
due volte è un conteggio che prima o poi diverge, ed è successo sei volte in un giorno solo: chi ha
bisogno di un numero ci punta invece di ricopiarlo. La regola vale sui documenti **vivi**, non su
ADR e deleghe, che raccontano il momento in cui sono stati scritti e devono restare com'erano
([D021](delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md)).

## Da dove cominciare

**Arrivi ora sul progetto** → [delega/PASSAGGIO-DI-CONSEGNE.md](delega/PASSAGGIO-DI-CONSEGNE.md), dieci minuti e sai ripartire. Poi → [architettura.md](architettura.md), poi
[glossario.md](glossario.md), poi il [compendio](adr/README.md) scorrendo solo i titoli.
Venti minuti.

**Devi cambiare qualcosa** → cerca la decisione nel [compendio](adr/README.md). Se esiste, la
discussione riparte dalle alternative già scartate. Poi [convenzioni.md](convenzioni.md).

**Devi aggiungere un sistema** → una cartella sotto `src/core/domains/` con dentro `system.ts` che
chiama `defineSystem`, e una riga di `register` nel bootstrap. Nient'altro, mai (ADR 0002). Il tipo
è in `src/core/kernel/Registry.ts`; se il sistema ha `save`, il compilatore pretende anche `load` e
`reset`. Il bootstrap è `src/renderer/runtime/createGame.ts`, e `tests/rules/registry-completeness`
confronta i `system.ts` con le registrazioni: una in meno è rosso. Un dominio può non essere un
sistema — `atm` non ha stato e non ticchetta, quindi non si registra.

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
carta trattenendo una commissione, e non ha stato — è un dominio di soli comandi. Con D011 il gioco
**gira**: il bootstrap monta i sistemi, il loop avanza a passo fisso con l'accumulatore, lo store
rispecchia il Bus senza calcolare, e la finestra salva prima di chiudersi. Con D012 il gioco **parla**: il guscio veste i sette stati
del ciclo di vita, il saldo e l'upgrade hanno una schermata, e ogni parola passa da una chiave in
due lingue — le chiavi del bancomat comprese, perché una lingua che si completa in due tempi è il
difetto A13. Con D015 il gioco **si gioca**: la home è un bancomat con la carta che si gira, la
commissione si vede prima della conferma, il cruscotto dice come sta andando e il giro si chiude —
si guadagna in contanti, si deposita, si compra con la carta.

Con [D016](delega/D016-correzioni-audit.md) il gioco **non perde più la partita di nessuno**: un
audit dell'intera codebase e di questi documenti, il 2026-08-20, ha trovato diciassette difetti, di
cui uno critico — chiudere la finestra dalla schermata d'errore scriveva una partita vuota sopra il
salvataggio del giocatore. Con le correzioni sono nati due meccanismi per due regole che stavano
solo in prosa (C09, C10) e un invariante nuovo (INV-17).

Con [D013](delega/D013-verifica-della-fetta.md) la fetta 01 è **conclusa**, e il progetto è allo
**STOP 2**. Nessun codice di gioco nuovo: un terzo round-trip che gioca una partita vera e la fa
attraversare il disco, un `README.md` alla radice, gli otto passi del percorso manuale eseguiti
davvero, e un gruppo di ADR che passano ad _Accettata_ dopo aver visto scattare il proprio
meccanismo. Ha trovato tre cose che nessun gate poteva vedere, e il rapporto è in fondo a quella
delega.

**La fetta 02 è aperta**, e non è più una domanda: ha le sue deleghe scritte e misurate.
[D019](delega/D019-il-pagamento.md) è **chiusa** — ogni azione che si paga espone un listino, il
comando riceve lo strumento e ricalcola il prezzo da lì, e l'[ADR 0027](adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
è la prima decisione della fetta a passare ad _Accettata_.
[D020](delega/D020-nessun-sistema-si-fida-del-salvataggio.md) è **chiusa** e ha messo la regola
sotto cui nasce il secondo dominio con stato: nessun sistema accetta un salvataggio che non
riconosce, e a pretenderlo è un test (INV-20). [D017](delega/D017-il-caveau.md) porta il caveau
vero, e adesso non aspetta più nessuno.
[D018](delega/D018-la-scheda-di-dominio.md) corre accanto e non tocca nessuna delle altre. Prima
di tutte vengono [D021](delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md) e
[D022](delega/D022-il-confine-disegnato-e-il-confine-vero.md), nate dall'audit dello STOP 2: sono
regole, e le regole vengono prima del codice che governano. Quali siano aperte adesso lo dice
[stato.md](stato.md).

Gli ADR restano in stato _Proposta_ finché il codice non li impone davvero: passano ad _Accettata_
delega per delega, non per decreto — e a dire quali sono, in ogni momento, è
[stato.md](stato.md), che li conta invece di ricordarseli. Quale delega ha imposto quale decisione
sta nel [compendio](adr/README.md); il **perché** una decisione sia ancora `Proposta` sta scritto
nell'ADR stesso, che è l'unico posto che può spiegarlo.
