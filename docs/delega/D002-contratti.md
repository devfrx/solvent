# D002 — Contratti

- **Stato:** Aperta
- **Dipende da:** D001
- **Sblocca:** D003, D004, D005, D009
- **ADR vincolanti:** 0004, 0006, 0007, 0010
- **Regole:** R08, R09, R10, R11
- **Budget:** ~120 righe, quasi tutte tipi

## Obiettivo

Definire i tipi da cui dipende tutto il resto, in modo che le regole R08, R09, R10 e R11 diventino
impossibili da violare invece che da ricordare.

## Da produrre

`src/core/contracts/`

| File          | Contenuto                                                                                                         |
| ------------- | ----------------------------------------------------------------------------------------------------------------- |
| `result.ts`   | `Result<T, E>`, `ok()`, `err()`, e nient'altro                                                                    |
| `money.ts`    | `Money = Decimal`, `ZERO`, `fromString`, `toString`, e le **uniche** `fromNumber` / `toDisplayNumber`             |
| `pools.ts`    | `Pool`, `PoolProps` (`traceable`, `capacity`, `yields`, `player`), `POOLS` come dati (ADR 0017)                   |
| `ledger.ts`   | `Posting`, `Transaction`, `LedgerError` con tutti i casi: fondi, capienza, pool non accettato, importo non valido |
| `bounded.ts`  | `BoundedList<T>` e `boundedList<T>(max)` — `max` obbligatorio                                                     |
| `events.ts`   | l'unica `interface GameEvents`                                                                                    |
| `save.ts`     | `SavePayload` (senza versione), `SaveEnvelope`, `SAVE_VERSION`                                                    |
| `commands.ts` | `CommandHandler<A, T, E>` che ritorna `Result`                                                                    |

## Invarianti

- `SavePayload` **non ha** un campo versione, né direttamente né annidato. `SAVE_VERSION` è
  esportata da qui ma usata **solo** dal main.
- `Money` è `Decimal`: non esiste alcun alias che permetta `number`.
- `fromNumber` e `toDisplayNumber` sono le uniche conversioni del progetto, e il loro import è
  vietato da lint sotto `src/core/domains/**`.
- `boundedList` non ha una firma con `max` opzionale o con default.
- `GameEvents` è una sola interfaccia in un solo file. Se qualcuno la estende con
  `declare module`, la regola è violata.
- Nel payload il denaro è **stringa**, l'Rng è `{ seed, cursors }`, e ogni lista è limitata.

## Fuori scope

- Lo schema `zod`: vive nel main (D009). Qui ci sono i tipi, non la validazione.
- Le migrazioni: D009, e comunque non esistono per la versione 1.
- Helper su `Result` tipo `map`, `andThen`, `unwrap`: **grilletto** = il terzo posto in cui
  servono davvero. Con due, si scrive a mano.
- Eventi oltre quelli che la fetta 01 emette davvero. `GameEvents` cresce con i sistemi.

## Definizione di fatto

- [ ] `npm run typecheck` verde
- [ ] un test dimostra che `boundedList` scarta l'elemento più vecchio al superamento del `max`
- [ ] un test in cui si prova ad assegnare un `number` a un `Money` **non compila** (via
      `@ts-expect-error`, che fallisce se l'errore non c'è: è un test vero, non un commento)
- [ ] un test in cui `SavePayload` con un campo `version` **non compila**, stessa tecnica
- [ ] `GameEvents` contiene solo gli eventi che la fetta 01 emette

## Trappole note

- **A07.** La versione tende a rientrare "per comodità di debug" dentro il payload. Il test
  `@ts-expect-error` è lì per far fallire il tentativo.
- **A11.** La tentazione è un `toNumber()` in mezzo a una catena per "semplificare un confronto".
  È esattamente il difetto: le conversioni stanno al confine di presentazione, non in mezzo.
- **A10.** Una history con `max` opzionale sembra più flessibile. Non lo è: è il difetto con un
  passo in più.
