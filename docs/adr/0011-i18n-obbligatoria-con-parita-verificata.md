# ADR 0011 — i18n dal primo giorno, con parità fra lingue verificata da un test

- **Stato:** **Accettata** — D012: `renderer/i18n/`, il tipo `Dictionary` che pretende ogni chiave in entrambe le lingue, e i due test di `tests/i18n/`
- **Data:** 2026-08-19
- **Copre il difetto:** A13 (20 chiavi mancanti nella lingua di default)

## Contesto

Nel progetto precedente la lingua di default aveva 20 chiavi mancanti. Non era un problema di
traduzione: era che nessuno poteva accorgersene, perché niente confrontava le lingue fra loro.

## Decisione

Nessuna stringa destinata all'utente vive nel codice. Tutto passa da chiavi i18n.

**Due lingue dal primo giorno** (`it`, `en`). Una lingua sola renderebbe la regola non
verificabile: con un solo dizionario non esiste una parità da controllare, e la disciplina
degrada immediatamente.

Un test confronta gli insiemi di chiavi **in entrambe le direzioni** e fallisce sulla differenza:
sia chiave presente in `it` e assente in `en`, sia il contrario.

Le chiavi che nascono nel dominio — `reason.*` del Ledger, `error.*` dei `Result` — sono **tipi
uniti**, non stringhe libere: l'insieme delle ragioni e degli errori possibili è enumerabile dal
compilatore, quindi la copertura i18n del dominio è verificabile e non solo sperabile.

## Alternative scartate

- **Una lingua ora, i18n dopo.** "i18n dopo" significa una migrazione di qualche migliaio di
  stringhe fatta a mano, cioè un lavoro che non si fa mai. Il costo di farlo ora è una riga per
  stringa; il costo di farlo dopo è un progetto.

## Conseguenze

- Costo per stringa leggermente più alto durante lo sviluppo.
- Impossibile che una lingua diverga dall'altra senza un test rosso.
- Le chiavi di dominio sono tipizzate: aggiungere una `Reason` senza tradurla non compila.

## Come è finita, a D012 chiusa

La copertura è più larga di quanto questa decisione chiedesse, e la differenza è stata trovata
scrivendola:

- la parità di sole **chiavi** non vede un segnaposto perso in una traduzione sola — `{required}`
  che sparisce lascia una frase plausibile e senza il numero. Il confronto dei segnaposto è la
  terza rete di `tests/i18n/parity`;
- l'elenco dei codici da tradurre si **rilegge dal sorgente**, e il confronto è secco nelle due
  direzioni: dice anche il contrario, cioè una frase rimasta dietro a un codice che non esiste più;
- le chiavi sono **piatte**, con i punti dentro il nome. `atm.withdraw` e `atm.withdraw.title` sono
  due chiavi, e in una gerarchia la seconda prenderebbe il posto della prima.
