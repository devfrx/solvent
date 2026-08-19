# ADR 0002 — Il Registry è l'unica lista di sistemi

- **Stato:** Proposta
- **Data:** 2026-08-19

## Contesto

Nel progetto precedente esistevano 5 liste di sistemi mantenute a mano in parallelo: tick, save,
load, reset, stats. Aggiungere un sistema richiedeva 5 modifiche coordinate, e dimenticarne una
falliva in silenzio — tipicamente il `reset` da prestige, che nessun test copriva.

## Decisione

`defineSystem({ id, order, tick?, save?, load?, reset?, stats? })` produce un oggetto
autodescrittivo. Il `Registry` è l'unico posto che tiene un elenco, e `tickAll`, `saveAll`,
`loadAll`, `resetAll`, `statsAll` iterano tutti lo **stesso array**, ordinato per `order`.

`order` è una costante nominata (`ECONOMY`, `INCOME`, …), mai un numero sparso nel codice:
l'ordine di esecuzione dei tick deve essere leggibile in un solo file.

## Alternative scartate

- **Auto-registrazione via `import.meta.glob`.** Elimina la riga di bootstrap ma rende l'ordine
  di registrazione implicito e dipendente dal bundler; inoltre non funziona in Node per i test.
  Una riga esplicita per sistema è un costo accettabile in cambio di un ordine dichiarato.

## Conseguenze

- Aggiungere un sistema = 1 cartella + 1 riga nel bootstrap. Niente altro, mai.
- Un test confronta il numero di sistemi registrati col numero di file
  `src/core/domains/*/system.ts`: se qualcuno crea un sistema e scorda di registrarlo, il test rompe.
- Il `Registry` è l'unico consumatore legittimo di `save`/`load`/`reset`: nessun file scrive
  persistenza a mano.
