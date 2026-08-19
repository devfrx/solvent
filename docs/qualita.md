# Qualità: i gate e la definizione di fatto

Un gate è un comando che, se è rosso, significa **non finito**. Non è un consiglio, non è un
"sistemiamo dopo", e non si aggira.

Questo documento dice quali sono, cosa garantisce ciascuno, e cosa nessuno di essi garantisce.

## I quattro gate veloci, più uno di rilascio

| #   | Comando                | Cosa garantisce                                                                                   | Tempo reale       |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------- | ----------------- |
| G1  | `npm run typecheck`    | le regole imposte dai tipi: R04, R06, R07, R08, R09, R10, R11, INV-13 + nessun codice morto (C01) | ~11 s             |
| G2  | `npm run lint`         | le regole imposte da ESLint: R01, R03, R04, R05, R06, R10, INV-02, INV-03                         | ~7 s              |
| G3  | `npm run format:check` | il codice è formattato (C02)                                                                      | ~5 s              |
| G4  | `npm run test`         | comportamento, round-trip, parità i18n, bersagli, regole strutturali, meta-test del lint          | ~7 s              |
| G5  | `npm run build`        | l'applicazione si compila davvero, main e renderer                                                | decine di secondi |

Rimisurati a D009 chiusa su Windows, con 266 test. Sono tempi **di parete**, quindi comprendono
l'avvio di `npm` e di Node: `typecheck` ne paga tre, perché incatena tre `npm run`. La parte di
lavoro vero è meno della metà del totale.

Due comandi, non uno, ed è deliberato:

    npm run verify          # G1..G4 — il ciclo che si esegue di continuo
    npm run verify:release  # verify + G5

**Perché separati.** Il tempo atteso è parte della specifica: un gate lento viene aggirato. I
quattro veloci stanno **sotto il minuto** — venticinque secondi a D006, trentuno a D007, fra
ventisette e trenta a D008, ventotto e ventinove a D009 su due misure consecutive — e si
eseguono a ogni modifica; la compilazione costa un ordine di grandezza in più e serve prima di
un rilascio, non prima di un salvataggio. Se `verify` supera il minuto, è un problema da risolvere, non da
tollerare, e il rimedio è già censito nel [registro YAGNI](roadmap-fette.md): togliere l'avvio di
`npm` ripetuto, non togliere un gate.

Quella cifra è stata **misurata**, non stimata: a D001 il documento diceva otto secondi con 33
test, e ci è rimasto fino a D006 con 150. Un tempo dichiarato e mai più misurato è la stessa
categoria di bugia di un `TODO`. Da D006 a D007 sono cresciuti tutti e quattro i gate, non solo i
test: è l'andamento normale, e va guardato ogni volta invece che una volta sola. Da D007 a D008
non si sono mossi — la variazione fra due esecuzioni della stessa catena è ormai più grande della
crescita fra due deleghe, ed è per questo che qui c'è un intervallo e non una cifra. Da D008 a
D009 la stessa cosa, con 62 test in più: `lint` è persino sceso, il che dice quanto valga una
misura sola.

`verify:release` non è ancora verde: da D009 `build` compila `out/main/index.js` e
`out/preload/index.cjs` senza errori e si ferma sul renderer, che manca. Diventa verde con D011.
`tests/rules/gates.test.ts` impedisce che un gate sparisca da una delle due catene (INV-14).

## Cosa copre ciascun livello di test

| Livello                | Dove             | Cosa dimostra                                                                               | Cosa **non** dimostra                                           |
| ---------------------- | ---------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Kernel**             | `tests/kernel/`  | Clock, Rng, Bus, Registry, Ledger si comportano come dichiarato, isolatamente               | che i sistemi li usino bene                                     |
| **Dominio**            | `tests/domains/` | le regole pure producono i numeri attesi, con seed fisso                                    | che la UI mostri quei numeri                                    |
| **Round-trip**         | `tests/save/`    | stato → salva → ricarica → identico. Attraversa payload, busta, validazione                 | che una migrazione futura funzioni                              |
| **Bilanciamento**      | `tests/balance/` | i numeri stanno negli intervalli dichiarati in `targets.ts`                                 | che il gioco sia divertente                                     |
| **i18n**               | `tests/i18n/`    | nessuna chiave manca in nessuna lingua                                                      | che le traduzioni siano corrette                                |
| **Regole strutturali** | `tests/rules/`   | Registry completo, nessuna logica nei `.vue`, identità del prodotto coerente, nessun `TODO` | ciò che è dichiarato ⚠️ in [tracciabilita.md](tracciabilita.md) |

**Non esistono test end-to-end sulla UI in questa fetta.** Con due componenti che leggono selettori
e inviano comandi, il costo di uno strumento E2E supera il valore. La decisione si rivede quando la
UI avrà uno stato proprio non banale — e allora sarà un ADR.

## Il test round-trip, e perché è il più importante

    costruisci uno stato non banale
      → registry.saveAll()
      → il main avvolge, valida, scrive
      → rileggi, valida, migra
      → registry.loadAll()
      → confronta con lo stato di partenza

Metà dei difetti di persistenza del progetto precedente sarebbero morti qui. La condizione perché
funzioni davvero è una sola: lo stato costruito deve essere **non banale**. Un round-trip su uno
stato vuoto passa sempre e non dimostra niente.

Lo stato di prova deve contenere, come minimo: un saldo con decimali, un sistema con stato, lo
stato dell'Rng con almeno uno stream avanzato, e una lista limitata con almeno un elemento.

Da D009 il giro esiste, in `tests/save/kernel-roundtrip`, e c'è un caso che verifica che lo stato
di partenza sia davvero non banale — cinque conti su sei mossi, due stream avanzati di quantità
diverse, un sistema con stato. **La lista limitata manca**, e non per dimenticanza: nel payload
della versione 1 non c'è nessun array, e la voce ha un grilletto nel
[registro YAGNI](roadmap-fette.md). Entra con il caveau della fetta 02, insieme al primo
`boundedList` che finisce davvero nel salvataggio.

## Definizione di fatto

Vale per ogni delega. Tutte le voci, non alcune.

- [ ] `npm run verify` verde, con l'output mostrato — non riassunto
- [ ] i test nuovi falliscono se si rompe di proposito il codice che coprono
- [ ] nessun `TODO`, nessun `any`, nessun `eslint-disable` senza motivazione accanto
- [ ] la documentazione toccata dal cambiamento è aggiornata **nello stesso commit**
- [ ] se una decisione strutturale è cambiata, l'ADR è aggiornato o ne esiste uno nuovo
- [ ] la delega è marcata `Chiusa` con il riferimento al commit

## Definizione di fatto dello STOP 2

Oltre a tutto quanto sopra:

- [ ] output reale, incollato, di `typecheck`, `lint` e `test` — non una dichiarazione
- [ ] la fetta gira: si guadagna, si compra, si salva, si chiude, si riapre, si ritrova tutto
- [ ] il reset azzera davvero, verificato da un test e a mano
- [ ] `docs/tracciabilita.md` non ha righe con un meccanismo che non esiste
- [ ] gli ADR che il codice ora impone passano da `Proposta` ad `Accettata`

## Cosa nessun gate garantisce

Detto qui perché un elenco di gate produce l'illusione opposta:

- **Che il gioco sia bilanciato.** `targets.ts` verifica intervalli che abbiamo scelto noi. Se
  l'intervallo è sbagliato, il test è verde e il gioco è noioso.
- **Che la UI sia usabile.** Nessun test lo misura.
- **Che le traduzioni siano giuste.** Il test verifica che ci siano, non che vogliano dire qualcosa.
- **Che l'architettura regga alla decima fetta.** Lo dimostra solo la decima fetta. È il motivo per
  cui la prima è una sola (ADR 0014).
