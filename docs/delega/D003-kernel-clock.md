# D003 — Kernel: Clock

- **Stato:** **Chiusa** — 2026-08-19, commit `f398a47`, ramo `d003-kernel-clock`
- **Dipende da:** D002
- **Sblocca:** D006
- **ADR vincolanti:** 0009
- **Regole:** R04
- **Budget:** ~40 righe → **consuntivo: 20 righe di codice** (48 con i commenti) + 116 di test

## Obiettivo

Concentrare in un solo file tutto ciò che il progetto sa del tempo, e rendere impossibile passare
un numero senza unità a un'API temporale.

## Da produrre

`src/core/kernel/Clock.ts`

- `TICKS_PER_SECOND = 10` — **l'unica occorrenza letterale di questo numero in tutto il progetto**
- i tipi branded `Ticks` e `Seconds`, con i loro costruttori espliciti
- l'interfaccia `Clock` e l'istanza `clock`, con le quattro conversioni

## Invarianti

- Cercare `TICKS_PER_SECOND` in `src/**` restituisce questo file e i suoi consumatori, mai una
  seconda definizione.
- Cercare i letterali `10`, `100`, `600`, `3600` in `src/core/domains/**` non restituisce nulla.
- `Ticks` e `Seconds` non sono intercambiabili: passare l'uno dove serve l'altro non compila.
- `Clock` non ha stato: non sa che ora è, non sa quanto tempo è passato. Converte e basta.
  Il tempo che scorre è del loop (D011), non del Clock.

## Cinque correzioni rispetto a com'era scritta questa delega

**1. Le quattro conversioni non erano nominate.** Sono `secondsToTicks`, `ticksToSeconds`,
`perSecondToPerTick` e `perTickToPerSecond`. La quarta serve alla UI (D012), che mostra il reddito
**al secondo** mentre la simulazione lo calcola **al tick**: senza, quella conversione nascerebbe
nel componente, cioè fuori dal Clock, cioè il difetto A04 con un nome nuovo.

**2. Le conversioni non arrotondano.** La definizione di fatto chiedeva il round-trip anche sui
valori frazionari, quindi `secondsToTicks(0,25 s)` fa **2,5 tick**. Vale la pena scriverlo perché
"tick" suona intero: l'arrotondamento a tick interi è dell'accumulatore del loop (D011), e il
tempo frazionario che avanza resta lì. Il Clock converte, non decide.

**3. Il `grep` della definizione di fatto è diventato un test.**
`grep -rn "TICKS_PER_SECOND *=" src/` eseguito una volta non protegge niente: la seconda
definizione nasce il mese dopo. Ora è `tests/rules/tick-rate.test.ts`, che verifica anche il
proprio rilevatore — una definizione scatta, un uso no.

**4. Il secondo invariante non ha bisogno di un grep.** "Cercare i letterali `10`, `100`, `600`,
`3600` in `src/core/domains/**` non restituisce nulla" è già imposto da `no-magic-numbers`, che è
attivo proprio lì e già verificato in `lint-rules.test.ts`. Aggiungere un grep sarebbe un secondo
meccanismo più debole sulla stessa regola. L'invariante resta vero; il modo di verificarlo è il
lint.

**5. Il primo caso di prova sul float era sbagliato, ed è diventato rosso subito.** Per mostrare
che la virgola mobile perde, il test scriveva `expect(0.3 / 10).not.toBe(0.03)` — ma `0.3 / 10` fa
esattamente `0.03`, quindi il caso non dimostrava niente. Il valore che perde davvero è
`0.7 / 10 = 0.06999999999999999`. È lo stesso errore del caso R04 in D001: un test che sembra
dimostrare qualcosa e non dimostra nulla, e che si scopre solo eseguendolo.

Sul budget: ~40 righe previste, 20 di codice e 48 col commento in testa. Il preventivo contava le
righe del file, non le istruzioni — è la stessa lettura da fare per le prossime.

## Fuori scope

- L'accumulatore e il loop: sono in `renderer/runtime/loop.ts` (D011). Il Clock è puro.
- Il tetto di recupero: è un dato in `balance/constants.ts` (D008).
- Formattazione di durate per la UI ("3h 12m"): D012, ed è presentazione.

## Definizione di fatto

- [x] test: andata e ritorno `secondsToTicks` / `ticksToSeconds` su valori interi e frazionari
- [x] test: `perSecondToPerTick` di 100 al secondo dà 10 al tick, in `Decimal`
- [x] test `@ts-expect-error`: un `number` nudo passato dove serve `Ticks` non compila — più il
      caso che conta di più, `Ticks` passato dove serve `Seconds`
- [x] la definizione di `TICKS_PER_SECOND` è una sola, e ora lo verifica un test permanente
      invece di un `grep` eseguito una volta

## Nota di chiusura

`npm run verify` → typecheck, lint, format:check, test: **verdi**, 88 test su 15 file.

Le reti sono state rotte di proposito, e sono diventate rosse tutte:

| Rottura indotta                                 | Cosa è diventato rosso                             |
| ----------------------------------------------- | -------------------------------------------------- |
| `Ticks` ridotto a `number`                      | `npm run typecheck` — due `@ts-expect-error` vuoti |
| un `now()` aggiunto al `clock`                  | `tests/kernel/clock.test.ts`                       |
| una seconda `TICKS_PER_SECOND` sotto `domains/` | `tests/rules/tick-rate.test.ts`                    |

[ADR 0009](../adr/0009-passo-fisso-e-tipi-branded-per-il-tempo.md) **resta Proposta**: i tipi
branded e la frequenza unica sono qui, ma il passo fisso con accumulatore — l'altra metà della
decisione — vive nel loop di D011. Metà meccanismo non è una decisione in vigore.

## Trappole note

- **A04.** Il tick rate si riscrive quando qualcuno ha bisogno di "un secondo" dentro un sistema e
  scrive `10`. I tipi branded esistono per rendere quel gesto un errore di compilazione, non una
  svista invisibile.
- La tentazione di mettere qui `now()` o `elapsed()` è forte. Se il Clock avesse stato, ogni test
  di dominio dovrebbe controllarlo, e il tempo tornerebbe a essere globale.
