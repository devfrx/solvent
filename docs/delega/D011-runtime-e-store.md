# D011 — Runtime e store

- **Stato:** Aperta
- **Dipende da:** D009, D010
- **Sblocca:** D012
- **ADR vincolanti:** 0001, 0009, 0016
- **Regole:** R01, R04
- **Budget:** ~120 righe

## Obiettivo

Collegare il kernel puro a Vue senza che il kernel se ne accorga.

## Da produrre

`src/renderer/runtime/`

| File            | Contenuto                                                                         |
| --------------- | --------------------------------------------------------------------------------- |
| `createGame.ts` | costruisce il contesto, registra i sistemi, espone salva/carica/reset             |
| `loop.ts`       | `requestAnimationFrame` + accumulatore → tick a passo fisso; gestisce il recupero |

`src/renderer/stores/game.ts` — l'unico store della fetta.

## Invarianti

- `createGame.ts` è l'**unico** posto dove i sistemi vengono registrati. È la riga per sistema
  prevista dall'ADR 0002, ed è ciò che `registry-completeness` conta.
- Lo store **non calcola nulla**: riceve dal Bus e aggiorna un mirror reattivo. Se lo store
  calcolasse, il gioco non sarebbe simulabile senza Vue e cadrebbe l'ADR 0001.
- Lo store non importa altri store (R01). Per la fetta ce n'è uno solo, ma la regola vale da ora.
- Il loop non gira durante il caricamento: nessun tick prima che `loadAll` sia finito.
- Il tempo frazionario resta nell'accumulatore. Non si arrotonda, non si scarta.
- Il recupero è `tickAll` con un `n` grande, limitato dal tetto: **nessuna formula separata**
  (ADR 0009). Lo stesso percorso serve la riapertura del gioco e il ritorno da finestra nascosta.
- Il salvataggio avviene alla chiusura della finestra, e la finestra si chiude **dopo** che il
  main ha confermato la scrittura.
- Gli stati e le transizioni sono quelli di [ciclo-di-vita.md](../design/ciclo-di-vita.md): se il
  codice ne aggiunge uno, quel diagramma cambia nello stesso commit.

## Fuori scope

- Salvataggio automatico a intervalli: fetta 03, insieme al progresso offline.
- Progresso offline oltre il tetto: fetta 03, che è la fetta in cui il tetto nasce.
- Web Worker: grilletto = un profilo che mostri il tick che blocca il frame.
- Devtools o pannelli di debug che leggano stato privato.

## Definizione di fatto

- [ ] test: il loop con un tempo simulato controllato produce **esattamente** il numero di tick
      atteso, e l'accumulatore conserva il resto
- [ ] test: un `n` oltre il tetto viene limitato al tetto
- [ ] test: nessun tick parte prima che il caricamento sia finito
- [ ] test: lo store riflette il saldo dopo un `money.posted`, e non lo calcola
- [ ] test: `createGame` registra tutti i sistemi previsti (è `registry-completeness`)
- [ ] verifica manuale: nascondere e riesporre la finestra recupera il tempo passato

## Trappole note

- **A02.** Il primo import fra store nasce sempre come "mi serve solo un valore da lì". Il valore
  si prende da un selettore o da un evento.
- L'accumulatore che scarta il resto è il difetto per cui il gioco perde qualche percento di
  reddito al minuto, in modo invisibile e impossibile da diagnosticare senza un test dedicato.
- Chiudere la finestra senza attendere la conferma del main perde l'ultima partita di gioco. Su
  Windows, `before-quit` va gestito esplicitamente.
