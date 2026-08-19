# D004 — Kernel: Rng

- **Stato:** **Chiusa** — 2026-08-19, commit `a87d8cf`, ramo `d004-kernel-rng`
- **Dipende da:** D002
- **Sblocca:** D006
- **ADR vincolanti:** 0005
- **Regole:** R03
- **Budget:** ~70 righe → **consuntivo: 55 righe di codice** (97 con i commenti) + 172 di test

## Obiettivo

Rendere ogni futura sorgente di casualità del gioco riproducibile e indipendente dalle altre.

## Da produrre

`src/core/kernel/Rng.ts`

- mulberry32, o un PRNG equivalente a stato piccolo e serializzabile
- `stream(id)`: uno stream per dominio, con il proprio cursore
- `save()` / `load()` / `reset(seed)`
- **è l'unico file del progetto in cui `Math.random` è consentito**, e solo per generare il seed
  iniziale di una partita nuova, con l'`eslint-disable` motivato previsto dalle
  [convenzioni](../convenzioni.md#eslint-disable)

## Invarianti

- Consumare da uno stream **non** sposta la sequenza di nessun altro stream.
- `load(save())` riproduce esattamente la stessa sequenza successiva. Questa è la proprietà su cui
  poggia il round-trip: se cade, il salvataggio non è deterministico.
- Lo stato di uno stream è `{ seed, cursore }`, cioè due numeri: serializzabile senza cerimonie.
- Superficie **minima**: `next()`. Nessun `int`, `pick`, `chance` finché non esiste un consumatore
  ([registro YAGNI](../roadmap-fette.md)).

## Sei correzioni rispetto a com'era scritta questa delega

**1. L'eccezione di R03 non è più a livello di file.** `eslint.config.js` spegneva
`no-restricted-properties` su **tutto** `Rng.ts`. Così un secondo `Math.random` aggiunto più tardi
— dentro `next()`, "solo per questa volta" — non avrebbe fatto rumore. È letteralmente il modo in
cui nasce il difetto A03. Ora la regola resta accesa anche qui, e l'unica riga autorizzata porta la
propria motivazione, che è la forma già descritta dalle
[convenzioni](../convenzioni.md#eslint-disable). Nel meta-test ci sono i due casi: la riga motivata
non scatta, un secondo `Math.random` muto sì.

**2. La motivazione dell'`eslint-disable` era una regola di review; ora è un test.** D004 è la
prima delega che ne usa uno davvero, quindi è il momento giusto. `tests/rules/eslint-disable.test.ts`
pretende un `--` su ogni riga che spegne una regola sotto `src/`. Nuova riga **C06** in
[tracciabilità](../tracciabilita.md): era una speranza scritta nelle convenzioni, adesso è un gate.

**3. Il `grep` di `Math.random` **non** è diventato un test, ed è deliberato.** In
[D003](D003-kernel-clock.md) il grep di `TICKS_PER_SECOND` è diventato permanente perché lì non
esisteva nessun lint. Qui il lint c'è, ed è già verificato nelle due direzioni. Aggiungere un grep
sarebbe un secondo meccanismo, più debole, sulla stessa regola: sembra sicurezza, è duplicazione.

**4. Il seme di uno stream è derivato, non memorizzato.** La delega diceva "lo stato di uno stream
è `{ seed, cursore }`". Nella pratica il seme di uno stream si ricava da `(seme globale, id)` con
un'impronta, e nel salvataggio finisce **un** seme più una mappa di cursori — che è esattamente la
forma di `RngSave` fissata in [D002](D002-contratti.md). Se ogni stream salvasse anche il proprio
seme, la stessa informazione starebbe in due posti e prima o poi divergerebbe.

Il cursore non è solo contabilità: lo stato interno di mulberry32 avanza di un passo fisso, quindi
da `(seme, cursore)` si ricava **senza rigiocare la sequenza**. Il caricamento è istantaneo anche
dopo un milione di estrazioni.

**5. `randomSeed()` è separata da `createRng`.** Il costruttore prende un seme e basta: così
`createRng` è completamente deterministico, test inclusi. Un seme di default nascosto nel
costruttore sarebbe una sorgente di casualità in più — piccola, invisibile, e nel posto peggiore.

**6. mulberry32 è trascritto com'è pubblicato**, costanti `61` e `0x6d2b79f5` incluse. Un algoritmo
copiato esatto si può verificare contro la fonte; uno riordinato "con nomi migliori" no, e un PRNG
sbagliato non si vede leggendolo.

Sul budget: ~70 previste, 55 di codice. Dentro il segno.

## Fuori scope

- Gli helper sopra. Il grilletto è la fetta 05.
- Distribuzioni non uniformi.
- Qualsiasi uso dell'Rng nel dominio della fetta 01: la fetta è deterministica di proposito.

## Definizione di fatto

- [x] test: stesso seed, stessa sequenza, due istanze indipendenti
- [x] test: 100 estrazioni dallo stream `a` non cambiano la prima estrazione dello stream `b`
- [x] test: `load(save())` a metà sequenza continua identico
- [x] test: `reset(seed)` riporta i cursori a zero
- [x] test statistico minimo su `next()`: media e distribuzione su 100.000 estrazioni entro
      tolleranza — un PRNG rotto che ritorna sempre `0.5` passerebbe tutti i test sopra
- [x] `Math.random` compare solo in `Rng.ts`, su una riga sola e motivata — imposto dal lint, non
      da un `grep` eseguito una volta (correzione 3)

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 103 test su 17 file.

Le reti sono state rotte di proposito, e sono diventate rosse tutte:

| Rottura indotta                              | Cosa è diventato rosso                              |
| -------------------------------------------- | --------------------------------------------------- |
| uno stream globale al posto di quelli per id | 3 casi in `tests/kernel/rng.test.ts`                |
| `next()` che ritorna sempre `0.5`            | 4 casi, fra cui **solo** quello sulla distribuzione |
| `load` che ignora i cursori                  | la ripresa a metà sequenza                          |
| la motivazione tolta all'`eslint-disable`    | `tests/rules/eslint-disable.test.ts`                |

La seconda riga merita una nota: con `next()` fisso a `0.5` il test sulla **media** passa —
la media di una costante `0.5` è `0.5`. A prenderlo è solo il test sulla distribuzione. È la
dimostrazione della trappola scritta in fondo a questa delega, e il motivo per cui un test
statistico che guarda solo la media non serve a niente.

[ADR 0005](../adr/0005-rng-seedato-con-stream-per-dominio.md) passa a **Accettata**: la sorgente
unica, gli stream separati e il lint che vieta `Math.random` altrove sono tutti qui e tutti
verificati. Che lo stato finisca su disco è una conseguenza, e la copre il round-trip di D009 —
come per l'ADR 0006, dove il denaro-come-stringa al confine è INV-04 e non un pezzo mancante.

## Trappole note

- **A03.** 176 sorgenti casuali erano nate una alla volta, ognuna "solo questa". Il lint è
  l'unica difesa che non si stanca.
- Uno stream globale unico sembra più semplice finché non aggiungi un sistema: allora tutti i test
  di bilanciamento cambiano risultato per una modifica non correlata.
- Il test statistico è quello che si dimentica sempre, ed è l'unico che accorge se il PRNG è
  sbagliato invece che solo deterministico.
