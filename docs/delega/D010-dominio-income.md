# D010 — Dominio: income

- **Stato:** Aperta
- **Dipende da:** D008
- **Sblocca:** D011
- **ADR vincolanti:** 0002, 0003, 0007, 0017, 0020
- **Regole:** R02, R04, R07, R10, R11
- **Budget:** ~90 righe

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

## Fuori scope

- Un secondo sistema di reddito: fetta 02.
- Più di un livello di upgrade, o una curva di costo composta: la fetta ha bisogno di **uno**.
- Casualità di qualunque tipo: la fetta è deterministica di proposito (D004).
- Storico dei guadagni.

## Definizione di fatto

- [ ] test: il reddito per tick con zero upgrade è quello dichiarato in `constants.ts`
- [ ] test: con un upgrade attivo, il reddito passa dal modificatore, non da un numero riscritto
- [ ] test: comprare con fondi sufficienti riesce, scala il costo, registra il modificatore
- [ ] test: comprare con fondi insufficienti fallisce, **non** scala nulla, **non** registra nulla,
      e l'errore contiene `required` e `available`
- [ ] test: comprare due volte non registra due volte lo stesso modificatore
- [ ] test: `save` → `load` riproduce lo stesso reddito per tick
- [ ] test: `reset('hard')` riporta il reddito al valore iniziale
- [ ] `rules.ts` non ha `import` da `kernel/` a parte i tipi

## Trappole note

- **A09.** Nel progetto precedente il payout dei giochi viveva nei componenti. Il confine da
  tenere è: _se un numero decide quanto denaro si muove, quel numero si calcola qui._
- La tentazione di far modificare al sistema il proprio reddito base invece di registrare un
  modificatore è forte perché è più corto. È anche il gesto che rende il registro dei modificatori
  una struttura decorativa.
- Un acquisto che scala il costo **prima** di verificare i fondi produce un saldo negativo. Il
  Ledger lo rifiuta, ma se il sistema ha già cambiato il proprio stato, i due sono disallineati:
  l'ordine è prima il `post`, poi lo stato.
