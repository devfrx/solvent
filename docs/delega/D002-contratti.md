# D002 — Contratti

- **Stato:** **Chiusa** — 2026-08-19, ramo `d002-contratti`
- **Dipende da:** D001
- **Sblocca:** D003, D004, D005, D009
- **ADR vincolanti:** 0004, 0006, 0007, 0010
- **Regole:** R08, R09, R10, R11
- **Budget:** ~120 righe, quasi tutte tipi → **consuntivo: 113 righe di codice** (257 con i commenti) + 417 di test

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

## Sette correzioni rispetto a com'era scritta questa delega

Scritte qui invece che nascoste: la delega descriveva un'intenzione, e il codice ha detto qualcosa
di diverso in sette punti.

**1. `POOLS` vive in `contracts/pools.ts`, non nel Ledger.** Questa delega e
[D007](D007-kernel-ledger.md) lo dichiaravano entrambe fra i propri prodotti. Vince questa: `Pool`
è un tipo del contratto — lo nomina il salvataggio, quindi lo deve poter leggere anche il main, che
del kernel non sa nulla (INV-03). D007 va letta come "il Ledger **usa** `POOLS`", non lo definisce.

**2. La tabella dei file diceva meno di quanto serve per `ledger.ts`.** Con soli `Posting`,
`Transaction` e `LedgerError` quei tipi non si scrivono: servono anche `Reason` (la chiave i18n
tipizzata del glossario), `Category` e `Balances` — quest'ultima perché `money.posted` deve portare
**tutti** i saldi nuovi (D007). Sono nello stesso file: è il vocabolario del denaro, non tre file.

**3. La ragione sta sulla transazione, non sul movimento.** Il glossario definiva il movimento come
"pool, importo, ragione, categoria". Ma un prelievo al bancomat è **un** evento economico con tre
righe: la ragione è una sola (`reason.atm.withdraw`), mentre la categoria cambia riga per riga
(`transfer` sulle due gambe, `fee` sulla commissione). Con la ragione sul movimento si ripete tre
volte lo stesso dato e `money.posted` non ha una ragione da mostrare.
[Glossario](../glossario.md#denaro) aggiornato nello stesso commit.

**4. Le categorie della fetta 01 sono quattro, non due.** Il registro YAGNI diceva "categorie oltre
`income` e `purchase` → grilletto: la prima schermata che le mostra". Il grilletto è già scattato,
e non da una schermata: il bancomat ([D014](D014-dominio-bancomat.md), nato **dopo** quella riga con
gli ADR 0017–0020) muove denaro fra pool e paga una commissione. Servono `transfer` e `fee`.
[Roadmap](../roadmap-fette.md) aggiornata.

**5. Il lint di R11 non esisteva.** Fra gli invarianti c'era "il loro import è vietato da lint sotto
`src/core/domains/**`", ma in `eslint.config.js` quella regola non c'era: R11 era solo il tipo. Ora
c'è, con tre casi nel meta-test — la forma `@core/contracts/money`, la forma relativa che la
aggirerebbe, e l'eccezione che alla presentazione le conversioni restano legittime.

Attenzione a come è scritta: in flat config `no-restricted-imports` **non si somma**, l'ultimo
blocco che vince sostituisce i precedenti. Un blocco nuovo su `domains/**` avrebbe spento INV-02
proprio lì sotto, in silenzio. Le due liste sono estratte in costanti e ripetute apposta, e c'è un
caso di test che pretende che INV-02 scatti ancora dentro `domains/`.

**6. Il test di R09 sta in `tests/contracts/bounded`, non in `tests/save/`.** La
[tracciabilità](../tracciabilita.md) lo puntava sotto `save/`, ma l'unità è `contracts/bounded.ts`
e `tests/save/` è dove vivrà il round-trip del main (D009). Riga aggiornata.

**7. Tre aggiunte minori, dichiarate.** `pushBounded` accanto a `boundedList` (una lista immutabile
senza un modo di aggiungere non serve a niente); `boundedList` **lancia** se `max` non è un intero
positivo, perché un `max` a zero produrrebbe una lista che scarta tutto in silenzio; `CodedError` in
`commands.ts`, che obbliga per tipo l'errore di un comando ad avere un `code` — è l'ADR 0007 reso
verificabile invece che ricordato.

Sul budget: ~120 righe previste, 113 di codice scritte. È il primo preventivo che ci prende, e ci
prende perché la delega elencava i file. I 417 di test non erano in preventivo — non lo erano
nemmeno in D001: il budget di una delega conta il codice, e va letto sapendolo.

## Fuori scope

- Lo schema `zod`: vive nel main (D009). Qui ci sono i tipi, non la validazione.
- Le migrazioni: D009, e comunque non esistono per la versione 1.
- Helper su `Result` tipo `map`, `andThen`, `unwrap`: **grilletto** = il terzo posto in cui
  servono davvero. Con due, si scrive a mano.
- Eventi oltre quelli che la fetta 01 emette davvero. `GameEvents` cresce con i sistemi.

## Definizione di fatto

- [x] `npm run typecheck` verde — e la catena ora include `typecheck:web`, come
      `tests/rules/gates.test.ts` pretendeva dal primo file sotto `src/core`
- [x] un test dimostra che `boundedList` scarta l'elemento più vecchio al superamento del `max`
- [x] un test in cui si prova ad assegnare un `number` a un `Money` **non compila** — più un
      secondo caso, `a + b` fra due `Money`, che il compilatore rifiuta gratis
- [x] un test in cui `SavePayload` con un campo `version` **non compila**, diretto e annidato
- [x] `GameEvents` contiene solo `money.posted`, che è l'unico evento che la fetta 01 emette

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 76 test su 13 file, 8 secondi.

Le reti sono state rotte di proposito una a una, e sono diventate rosse tutte:

| Rottura indotta                         | Cosa è diventato rosso                                |
| --------------------------------------- | ----------------------------------------------------- |
| `typecheck:web` tolto dalla catena      | `tests/rules/gates.test.ts`                           |
| un campo `version` dentro `SavePayload` | `npm run typecheck` — `@ts-expect-error` inutilizzato |
| `max` reso opzionale in `boundedList`   | `npm run typecheck` **e** il test a runtime           |
| R11 tolta da `eslint.config.js`         | `tests/rules/lint-rules.test.ts`                      |

[ADR 0006](../adr/0006-decimal-end-to-end-per-il-denaro.md) e
[ADR 0007](../adr/0007-result-come-unico-stile-di-esito.md) passano a **Accettata**: il loro
meccanismo è tutto qui dentro. 0004, 0010 e 0017 restano _Proposta_ — hanno metà meccanismo qui e
metà in D009 e D007.

## Trappole note

- **A07.** La versione tende a rientrare "per comodità di debug" dentro il payload. Il test
  `@ts-expect-error` è lì per far fallire il tentativo.
- **A11.** La tentazione è un `toNumber()` in mezzo a una catena per "semplificare un confronto".
  È esattamente il difetto: le conversioni stanno al confine di presentazione, non in mezzo.
- **A10.** Una history con `max` opzionale sembra più flessibile. Non lo è: è il difetto con un
  passo in più.
