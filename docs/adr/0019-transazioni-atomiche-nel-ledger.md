# ADR 0019 — Il Ledger applica transazioni atomiche, non movimenti singoli

- **Stato:** Proposta
- **Data:** 2026-08-19
- **Conseguenza di:** [ADR 0017](0017-il-denaro-e-plurale.md)

## Contesto

Con due pool ([ADR 0017](0017-il-denaro-e-plurale.md)), l'operazione più comune del gioco — un
prelievo al bancomat — muove **tre** importi contemporaneamente:

    carta   − 500,00
    contanti + 497,50
    commissione   2,50

Con `post()` singoli questo è una sequenza. Una sequenza può interrompersi a metà: se il secondo
movimento fallisce, il primo è già avvenuto e il denaro è sparito. La reazione tipica è un
rollback scritto a mano nel chiamante — cioè la logica del denaro che torna a vivere fuori dal
Ledger, che è esattamente ciò che l'[ADR 0003](0003-ledger-unica-porta-del-denaro.md) esiste per
impedire.

Questo requisito è emerso guardando l'ATM **prima** di scrivere il kernel. Con la sola fetta
"reddito + upgrade" non sarebbe emerso, e il Ledger sarebbe nato con la primitiva sbagliata.

## Decisione

La primitiva del Ledger è la **transazione**:

    transaction(postings: Posting[], meta): Result<Balances, PostError>

Si applica **tutta o niente**. La validazione avviene su tutti i movimenti prima che qualunque
saldo cambi; se uno solo fallisce, nessun saldo si muove e nessun evento viene emesso.

`post()` resta, ed è zucchero per una transazione a un movimento solo: i domini semplici non
pagano la cerimonia.

Gli eventi si emettono **una volta per transazione**, dopo che tutti i saldi sono cambiati — non
uno per movimento. Un handler che legge i saldi dentro l'evento deve vedere uno stato coerente,
mai uno stato a metà.

## Alternative scartate

- **Due `post()` più rollback nel chiamante.** Sposta la responsabilità del denaro fuori dal
  Ledger, e ogni dominio la implementa a modo suo. È il difetto A05 con un nome nuovo.
- **Un `transfer(from, to, amount, fee)` dedicato.** Copre il caso di oggi e non quello di domani:
  lo spread delle fiches, la percentuale del black market, la ritenuta su un affitto sono tutte
  transazioni a tre o quattro movimenti con forme diverse. Un `transfer` specializzato diventerebbe
  tre funzioni specializzate entro due domini.
- **Transazioni annidate.** Non servono e complicano molto la garanzia atomica. Una transazione
  dentro una transazione **lancia**: significa che qualcuno sta orchestrando denaro fuori dal
  Ledger.

## Conseguenze

- Il Ledger cresce di poco — la validazione era già tutta lì, cambia solo che avviene su una lista
  prima di applicare.
- `money.posted` porta una transazione, non un movimento. Il payload dell'evento nasce già plurale,
  invece di diventarlo con un cambio di contratto.
- Un test di invariante diventa possibile: **nessuna transazione applicata parzialmente**, mai. Si
  verifica facendo fallire di proposito l'ultimo movimento di una transazione a tre.
- La commissione dell'ATM, lo spread delle fiches e la percentuale del black market sono la
  **stessa cosa**: un movimento in più nella transazione. Un solo meccanismo per tre domini.
