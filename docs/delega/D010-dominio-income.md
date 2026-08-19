# D010 — Dominio: income

- **Stato:** **Chiusa** — 2026-08-19, commit `b98f025`, ramo `d010-dominio-income`
- **Dipende da:** D008
- **Sblocca:** D011
- **ADR vincolanti:** 0002, 0003, 0007, 0017, 0020 — più il nuovo **0024**, nato qui
- **Regole:** R02, R04, R07, R10, R11
- **Budget:** ~90 righe → **consuntivo: 102 righe di codice** (209 con i commenti) + 302 di test

## Obiettivo

Il primo sistema del gioco: una fonte di reddito e un upgrade che la migliora. Serve a dimostrare
che il kernel regge — non a essere divertente.

**Il reddito entra in contanti; l'upgrade si compra con la carta.** Non è un dettaglio: obbliga il
giocatore a passare dal bancomat (D014) per progredire, che è il ciclo centrale del gioco reso
obbligatorio dalla fetta più piccola possibile.

## Da produrre

`src/core/domains/income/`

| File        | Contenuto                                                                   |
| ----------- | --------------------------------------------------------------------------- |
| `types.ts`  | lo stato del sistema e la sua forma salvata                                 |
| `rules.ts`  | funzioni **pure**: reddito per tick, costo dell'upgrade, si può comprare    |
| `system.ts` | `defineSystem` con `order: ORDER.INCOME`, e `tick`, `save`, `load`, `reset` |

Più il comando di acquisto, in `commands.ts` accanto al sistema.

`system.ts` esporta una **factory**, non un sistema già costruito: vedi la correzione 1 e
l'[ADR 0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md).

## Invarianti

- `rules.ts` non importa il contesto, non emette, non legge l'ora, non usa l'Rng. Tutto arriva per
  argomento. È la condizione perché il test di bilanciamento (D008) possa esistere.
- `system.ts` non calcola: legge lo stato, chiama le regole pure, applica tramite il Ledger.
- Il sistema **non** scrive mai su un saldo: chiede al Ledger e gestisce il `Result`.
- Il reddito usa `income()`, che costruisce il movimento da `world` (ADR 0020). Il sistema non
  nomina mai `world` a mano.
- Il sistema dichiara che l'upgrade si paga **solo** con `card`. Provare a pagarlo in contanti
  fallisce con `error.ledger.pool_not_accepted`, che è un esito di gioco spiegabile — non un bug.
- L'acquisto è un comando che ritorna `Result`. Il fallimento per fondi insufficienti è un caso
  **normale**, con un errore che porta con sé quanto serviva e quanto c'era.
- L'upgrade registra un modificatore su `income.all`: non modifica il reddito base. Se lo
  modificasse, il registro dei modificatori sarebbe già inutile alla prima feature.
- `save` / `load` / `reset` ci sono tutti e tre, perché il tipo li impone.
- `reset('hard')` riporta allo stato iniziale, upgrade inclusi.

## Dieci correzioni rispetto a com'era scritta questa delega

**1. Il dominio espone una factory, non un sistema già costruito.** È la scelta che
[D008](D008-balance.md) aveva rimandato "a D010 e D011 insieme": il registro dei modificatori non
può stare nel `SystemContext`, e il comando di acquisto parte dalla UI, cioè fuori da ogni `tick`,
dove nessun contesto esiste. `createIncome(ledger, modifiers)` ritorna il sistema da registrare e
il comando già legato al proprio contesto. L'alternativa era un singleton in `balance/`, che
toglie la dipendenza dalle firme e rende due test dello stesso file dipendenti l'uno dall'altro.
Sta in [ADR 0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md),
è **contestabile**, e ne discende una freccia `renderer/runtime → core/balance` che il diagramma
non disegnava.

**2. Il `Clock` arriva per argomento, perché altrimenti le due richieste si contraddicono.** D008
dice di convertire il reddito con `clock.perSecondToPerTick`; la definizione di fatto di questa
delega dice che `rules.ts` non importa da `kernel/` se non i tipi. Le due cose stanno insieme solo
se il Clock è un parametro — e non costa niente, perché il Clock non ha stato: converte e basta
(ADR 0009). C'è un test che legge `rules.ts` e pretende che ogni import da `@core/kernel/` sia
`import type`.

**3. La composizione va fatta sulla base **al secondo**, non su quella al tick.** Il test dei
bersagli di D008 componeva dopo la conversione, e con i soli `mult` di oggi il numero è identico:
è per questo che nessuno se n'era accorto. Con un `add` no — un `+8` verrebbe letto come "8 per
tick", cioè 80 al secondo. L'ordine giusto è comporre e poi convertire, e adesso c'è un test con
un `add` che lo tiene fermo.

**4. La regola del reddito non riceve lo stato.** [flusso-tick.md](../design/flusso-tick.md)
disegnava `guadagnoPerTick(stato, modificatori)`. Con l'upgrade espresso come modificatore — che è
proprio ciò che questa delega impone — lo stato non entra nel calcolo, e un parametro inutilizzato
sarebbe un errore di compilazione (`noUnusedParameters`, C01). La firma è
`incomeOver(clock, modifiers, elapsed)`, e il disegno è stato aggiornato nello stesso commit.

**5. `tests/rules/registry-completeness` andava corretto, non aggirato.** Pretendeva che le
cartelle di dominio e le registrazioni in `createGame.ts` coincidessero — ma il grafo delle deleghe
mette D010 e [D014](D014-dominio-bancomat.md) **prima** di [D011](D011-runtime-e-store.md), che è
chi scrive quel file: c'è una finestra in cui i sistemi esistono e il bootstrap no, e il primo
sistema del progetto la apre. Il verdetto è ora una funzione pura di tre valori, con un caso per
tutti e quattro gli esiti — compresi i due che oggi non si presentano — e torna secco dal giorno in
cui il bootstrap nasce. Verificato creando un bootstrap finto senza registrazioni e guardando il
rosso: non è un indebolimento, è la stessa forma che `gates.test.ts` usa per `typecheck:web`.

**6. Comprare due volte aveva bisogno di un codice d'errore che non esisteva.**
`Modifiers.register` **lancia** `DuplicateModifierError` sul duplicato, e giustamente: un raddoppio
legittimo è una seconda sorgente. Ma un doppio clic non è un programma scritto male. Nasce
`error.income.already_upgraded`, il primo codice di errore di dominio del progetto; la sua chiave
i18n è di [D012](D012-ui-e-i18n.md), insieme al test di parità.

**7. `accepts: ['card']` non è falsificabile dal comando, e la risposta non è inventare una scelta
che il gioco non ha.** Il comando paga sempre con la carta, quindi il rifiuto del Ledger non è
raggiungibile passando da lì — e il [mockup](../design/mockups/fetta-01-primo-stipendio.html) ha un
pulsante solo, non una scelta di strumento. Aggiungere un parametro `pool` sarebbe stato costruire
per un futuro immaginato. La dichiarazione è invece una costante esportata, `UPGRADE_PAYMENT`, e un
test mette **quella** davanti a un pagamento in contanti: senza, `accepts` sarebbe una decorazione.

**8. Il `load` guarda ciò che riceve.** Lo stato di un sistema è opaco per lo schema del main
(ADR 0002, verificato da [D009](D009-persistenza-main.md)): un salvataggio manomesso o prodotto da
una versione bacata arriva intatto fin qui, e questo è **l'unico** punto che può guardarlo. Senza
il controllo, `upgraded: 'sì'` sarebbe falsy e declasserebbe il giocatore in silenzio. Con il
controllo diventa `error.registry.load_failed`, che è un esito. La generalizzazione — un
meccanismo condiviso per validare lo stato di un sistema — **non** è stata costruita: il grilletto è
il secondo dominio con stato, cioè D014, ed è scritto nel [registro YAGNI](../roadmap-fette.md).

**9. `reset` non distingue `soft` da `hard`, ed è dichiarato invece che nascosto.** Il prestige è
la fetta 06 e nessun documento ha deciso se un upgrade comprato con i soldi sopravvive a un reset
morbido. Un `if` sullo scope adesso inventerebbe una regola di gioco dentro una delega che non la
riguarda; un commento nel file del dominio dice cosa succede e perché — che è esattamente dove
[flusso-salvataggio.md](../design/flusso-salvataggio.md) vuole che quella decisione viva.

**10. Il `Result` del Ledger dentro il `tick` non ha un ramo da gestire, e lo dice un commento.**
La delega chiede che il sistema "gestisca il `Result`". Oggi l'accredito del reddito **non può
fallire**: `income('cash', …)` prende da `world`, che non ha capienza né fondi da esaurire. Un ramo
`if (!posted.ok) return` prima di una fine di funzione sarebbe codice morto travestito da rigore.
Con il caveau della fetta 02 il fallimento diventerà possibile, e il reddito non incassato sarà un
esito da mostrare, non da ingoiare.

## Fuori scope

- Un secondo sistema di reddito: fetta 02.
- Più di un livello di upgrade, o una curva di costo composta: la fetta ha bisogno di **uno**.
- Casualità di qualunque tipo: la fetta è deterministica di proposito (D004).
- Storico dei guadagni.

## Definizione di fatto

- [x] test: il reddito per tick con zero upgrade è quello dichiarato in `constants.ts`
- [x] test: con un upgrade attivo, il reddito passa dal modificatore, non da un numero riscritto
- [x] test: comprare con fondi sufficienti riesce, scala il costo, registra il modificatore
- [x] test: comprare con fondi insufficienti fallisce, **non** scala nulla, **non** registra nulla,
      e l'errore contiene `required` e `available`
- [x] test: comprare due volte non registra due volte lo stesso modificatore — ed è un esito
      tipizzato, non un lancio (correzione 6)
- [x] test: `save` → `load` riproduce lo stesso reddito per tick
- [x] test: `reset('hard')` riporta il reddito al valore iniziale
- [x] `rules.ts` non ha `import` da `kernel/` a parte i tipi — ed è un test, non un `grep`

Sei voci aggiunte all'elenco:

- [x] test: i modificatori sono **al secondo** come la base, quindi un `add` non vale dieci volte
      tanto (correzione 3)
- [x] test: l'anteprima `canBuyUpgrade` e l'esecuzione danno la stessa risposta al centesimo
- [x] test: la dichiarazione `UPGRADE_PAYMENT` rifiuta un pagamento in contanti (correzione 7)
- [x] test: uno stato salvato manomesso diventa `error.registry.load_failed`, non un declassamento
      in silenzio (correzione 8)
- [x] test: `reset` toglie **la propria** sorgente dal registro, non l'intero registro
- [x] test: il sistema gira dentro `tickAll`, e il bersaglio di bilanciamento di D008 lo usa invece
      di simularlo a mano

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 295 test su 38 file (erano 266
su 35). I quattro gate stanno fra 28 e 30 secondi: fermi, come da D007 in poi.

`npm run verify:release` resta **rosso** e non è una regressione: `build` compila
`out/main/index.js` e `out/preload/index.cjs` e si ferma sul renderer, che nasce con
[D011](D011-runtime-e-store.md).

### Le reti sono state rotte una alla volta

| Rottura indotta                                           | Cosa è diventato rosso                                    |
| --------------------------------------------------------- | --------------------------------------------------------- |
| si compone **dopo** la conversione a tick                 | l'`add` che vale dieci volte tanto — e nient'altro        |
| il tick rate scritto a mano (`.div(10)`) invece del Clock | **nessun test**, ma `no-magic-numbers` sotto `domains/**` |
| l'upgrade registra un `add` invece di un `mult`           | 3 casi, fra regole pure e sistema                         |
| si registra il modificatore **prima** di pagare           | "non muove niente" con i fondi insufficienti              |
| il comando non guarda se è già comprato                   | i 2 casi sul doppio acquisto                              |
| `accepts` sparisce da `UPGRADE_PAYMENT`                   | il pagamento in contanti che deve essere rifiutato        |
| il `load` non rimette il modificatore                     | `save` → `load` che deve dare lo stesso reddito           |
| il `load` si fida dello stato salvato                     | il salvataggio manomesso che deve diventare un esito      |
| il `reset` non toglie il modificatore                     | il reddito che deve tornare al valore iniziale            |
| `syncUpgradeModifier` non fa `remove` prima di `register` | il doppio `load`, che lancerebbe sul duplicato            |
| nasce `createGame.ts` senza la registrazione              | `registry-completeness`, tornato secco                    |

Due righe meritano una nota.

La **seconda** è l'unica in cui nessun test si accorge di niente: scrivere `.div(10)` invece di
`clock.perSecondToPerTick` dà lo stesso numero, ed è letteralmente il difetto A04. A fermarlo è
`no-magic-numbers` sotto `domains/**`, che è il motivo per cui quella regola esiste lì e non
altrove. Un test non avrebbe potuto prenderlo.

La **prima** è l'opposto: è il difetto che nessuna regola può prendere, e lo prende un test solo —
quello con l'`add`. Fino a ieri il progetto componeva nell'ordine sbagliato dentro il test dei
bersagli di D008 e nessuno poteva accorgersene, perché tutti i modificatori esistenti sono `mult`.

### Il budget

~90 righe dichiarate, **102 scritte** (209 con i commenti). I test sono 302, più i due file
riscritti: `tests/balance/targets.test.ts` (53) e `tests/rules/registry-completeness.test.ts` (50).

Le dodici righe in più hanno un nome: il controllo sullo stato salvato (correzione 8) e la guardia
sull'acquisto doppio (correzione 6). Nessuna delle due era nella delega, entrambe chiudono un buco
per cui il progetto ha già un difetto misurato.

### Il test dei bersagli non simula più a mano

`tests/balance/targets.test.ts` faceva girare un `for` con `ledger.transaction(income(...))` scritto
dentro il test, e un commento diceva: "quando il sistema esisterà, il loop qui sotto diventa una riga
di `tickAll`". Esiste, e il loop è quella riga. Un bersaglio verificato su una simulazione scritta a
parte verifica la simulazione, non il gioco — ed è il modo in cui `targets.ts` tornerebbe a essere
documentazione.

Ne è nato anche un caso in più, che prima non era esprimibile: sessanta secondi di tick devono valere
**esattamente** sessanta volte il reddito al secondo. Un centesimo perso per arrotondamento a ogni
tick non uscirebbe dall'intervallo del bersaglio, e questo invece lo prende.

### Gli ADR

Passa ad **Accettata** il nuovo
[0024](../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md): il
meccanismo è `createIncome(ledger, modifiers)`, e non esiste un singleton in `balance/`.

Il [0002](../adr/0002-registry-unica-lista-di-sistemi.md), il
[0003](../adr/0003-ledger-unica-porta-del-denaro.md), il
[0017](../adr/0017-il-denaro-e-plurale.md), il [0019](../adr/0019-transazioni-atomiche-nel-ledger.md)
e il [0020](../adr/0020-partita-doppia.md) erano già _Accettate_: questa è la prima delega che li usa
da fuori il kernel, ed è il primo momento in cui avrebbero potuto risultare scomodi. Non lo sono
stati.

Il [0009](../adr/0009-passo-fisso-e-tipi-branded-per-il-tempo.md) resta _Proposta_: `Ticks` arriva
al `tick` e il reddito lo moltiplica, ma il passo fisso con accumulatore è il loop, cioè D011.

**Trovato per strada:** l'[indice degli ADR](../adr/README.md) dichiarava ancora il
[0004](../adr/0004-il-main-e-proprietario-del-contratto-di-salvataggio.md) come _Proposta_ e
"si chiude con D009" — D009 l'aveva accettato nel proprio file ma non nell'indice. Corretto qui.

## Cosa deve sapere chi prende D011

- **Il bootstrap costruisce le istanze condivise e le distribuisce**: un `Ledger`, un `Bus`, un
  `Rng`, un `Registry` e un `Modifiers`, e poi `createIncome(ledger, modifiers)`.
  Il `ledger` passato alla factory **deve** essere lo stesso che finisce nel `SystemContext`: due
  istanze sono due partite, e nessun tipo lo impedisce (ADR 0024).
- **`createGame.ts` ha una riga di `registry.register(...)` per dominio**, e da quel momento
  `tests/rules/registry-completeness` le conta: una in meno è rosso.
- **`createIncome` ritorna anche `buyUpgrade`**, che è il comando che lo store chiama. Ritorna
  `Result<IncomeState, IncomeError>`: `IncomeError` è `LedgerError` più
  `error.income.already_upgraded`.
- **Per la UI, i numeri si leggono dalle regole pure**, non ricalcolandoli: `incomePerSecond` è il
  `+ 12,00 € / s` del mockup, `upgradeCost` è il prezzo sul pulsante, `canBuyUpgrade` decide se il
  pulsante è spento. Tutte e tre prendono solo dati.
- **Lo stato del sistema si legge da `system.save()`.** È l'unica porta che c'è, e per la UI è una
  porta scomoda: se D011 ha bisogno di un selettore vero, quello è il momento di aggiungerlo — non
  di leggere `save()` dal componente.
- **`Registry.loadAll` può tornare `error.registry.load_failed` per colpa di `income`**: il `load`
  del dominio lancia su uno stato salvato non valido. Va nello stato `Errore`, non ignorato.

## Cosa deve sapere chi prende D014

- **Il secondo dominio con stato fa scattare un grilletto.** `income/system.ts` valida a mano lo
  stato che riceve nel `load`, perché lo schema del main non può guardarci dentro. Con due domini
  che lo fanno, la domanda "serve un meccanismo condiviso?" va risposta invece che rimandata: la
  voce è nel [registro YAGNI](../roadmap-fette.md).
- **La forma del comando è già decisa**: una factory che riceve le dipendenze e ritorna un
  `CommandHandler`, e che ritorna lo **stato nuovo** invece di scriverlo. È ciò che rende "prima il
  denaro, poi lo stato" impossibile da sbagliare anziché da ricordare.
- **`UPGRADE_PAYMENT` è il modello per `accepts`**: una costante esportata, non un literal dentro la
  chiamata, così un test può metterla davanti a un pool non accettato.
- **La commissione del bancomat va in `balance/constants.ts`**, e `no-magic-numbers` sotto
  `domains/**` lo impone: `.div(10)` scritto a mano è stato provato ed è rosso.

## Trappole note

- **A09.** Nel progetto precedente il payout dei giochi viveva nei componenti. Il confine da
  tenere è: _se un numero decide quanto denaro si muove, quel numero si calcola qui._
- La tentazione di far modificare al sistema il proprio reddito base invece di registrare un
  modificatore è forte perché è più corto. È anche il gesto che rende il registro dei modificatori
  una struttura decorativa.
- Un acquisto che scala il costo **prima** di verificare i fondi produce un saldo negativo. Il
  Ledger lo rifiuta, ma se il sistema ha già cambiato il proprio stato, i due sono disallineati:
  l'ordine è prima il `post`, poi lo stato.
