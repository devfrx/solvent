# ADR 0009 — Passo fisso a 10 tick/s, tempo con tipi branded

- **Stato:** Proposta
- **Data:** 2026-08-19
- **Copre il difetto:** A04 (tick rate riscritto in 5 posti diversi)

## Contesto

Nel progetto precedente il tick rate era riscritto in cinque punti, e le conversioni
per-secondo/per-tick erano sparse nei sistemi. Cambiare la frequenza avrebbe richiesto di trovarli
tutti, e ogni omissione avrebbe sbilanciato un sistema in silenzio.

C'è una seconda decisione nascosta qui: **passo fisso o delta-time variabile?** Va presa ora
perché cambia la firma di ogni `tick`.

## Decisione

`TICKS_PER_SECOND = 10`, dichiarato in `core/kernel/Clock.ts`. È l'unica occorrenza letterale di
quel numero nel progetto.

Il loop è a **passo fisso con accumulatore**: `requestAnimationFrame` accumula il tempo reale
trascorso e il Registry esegue un numero **intero** di tick. Il tempo frazionario resta
nell'accumulatore per il frame successivo.

`Ticks` e `Seconds` sono tipi branded: un `number` nudo non è assegnabile a un parametro
temporale. È la forma forte della regola "niente numeri magici di tempo" — non un lint che
indovina, ma il type checker che rifiuta.

Perché 10: 100 ms è sotto la soglia in cui un contatore che sale appare a scatti, e costa dieci
esecuzioni del Registry al secondo — irrilevante. Più alto non migliora la percezione; più basso
si vede.

## Alternative scartate

- **Delta-time variabile** (`tick(dt)`). La simulazione smette di essere riproducibile: due
  macchine con framerate diverso divergono, e i test con seed fisso perdono senso.
- **Tick a 1 Hz con interpolazione in UI.** Introduce un secondo modello del tempo, quello
  "finto" della UI, che va tenuto allineato al primo. Due modelli del tempo è esattamente il
  difetto che stiamo eliminando.

## Conseguenze

- Il recupero del tempo offline è **N tick interi**, cioè lo stesso codice del gioco in tempo
  reale. Non esiste una "formula offline" separata da bilanciare a parte — che è la fonte
  classica di exploit negli idle game.
- Serve un tetto ai tick di recupero (es. 8 ore) per non bloccare l'avvio dopo una pausa lunga.
  Il tetto è un dato in `balance/constants.ts`, non un numero nel loop.
- Costo accettato: la UI si aggiorna a 10 Hz, non a 60. Per un contatore di denaro è corretto.
