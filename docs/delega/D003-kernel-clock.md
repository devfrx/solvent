# D003 — Kernel: Clock

- **Stato:** Aperta
- **Dipende da:** D002
- **Sblocca:** D006
- **ADR vincolanti:** 0009
- **Regole:** R04
- **Budget:** ~40 righe

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

## Fuori scope

- L'accumulatore e il loop: sono in `renderer/runtime/loop.ts` (D011). Il Clock è puro.
- Il tetto di recupero: è un dato in `balance/constants.ts` (D008).
- Formattazione di durate per la UI ("3h 12m"): D012, ed è presentazione.

## Definizione di fatto

- [ ] test: andata e ritorno `secondsToTicks` / `ticksToSeconds` su valori interi e frazionari
- [ ] test: `perSecondToPerTick` di 100 al secondo dà 10 al tick, in `Decimal`
- [ ] test `@ts-expect-error`: un `number` nudo passato dove serve `Ticks` non compila
- [ ] `grep -rn "TICKS_PER_SECOND *=" src/` restituisce esattamente una riga

## Trappole note

- **A04.** Il tick rate si riscrive quando qualcuno ha bisogno di "un secondo" dentro un sistema e
  scrive `10`. I tipi branded esistono per rendere quel gesto un errore di compilazione, non una
  svista invisibile.
- La tentazione di mettere qui `now()` o `elapsed()` è forte. Se il Clock avesse stato, ogni test
  di dominio dovrebbe controllarlo, e il tempo tornerebbe a essere globale.
