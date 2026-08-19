# Flusso di un tick

Cosa succede fra un frame del browser e un cambiamento di saldo. Descrive lo stato **corrente**
del progetto; se il loop cambia, questo file cambia nello stesso commit.

Decisioni rilevanti: [ADR 0009](../adr/0009-passo-fisso-e-tipi-branded-per-il-tempo.md) (passo
fisso), [ADR 0002](../adr/0002-registry-unica-lista-di-sistemi.md) (chi itera),
[ADR 0016](../adr/0016-il-bus-e-sincrono-e-fire-and-forget.md) (il Bus è sincrono).

## Dal frame al tick

Il browser chiama a ~60 Hz, la simulazione avanza a 10 Hz. L'accumulatore fa da cuscinetto: il
tempo frazionario non si perde e non si conta due volte.

```mermaid
flowchart TD
  RAF["requestAnimationFrame<br/>~60 volte al secondo"] --> ACC["accumulatore += tempo reale trascorso"]
  ACC --> Q{"accumulatore >=<br/>durata di un tick?"}
  Q -- no --> WAIT["nessun tick<br/>il resto rimane nell'accumulatore"]
  Q -- sì --> N["n = quanti tick interi ci stanno<br/>accumulatore -= n × durata"]
  N --> CAP{"n oltre il<br/>tetto di recupero?"}
  CAP -- sì --> CLAMP["n = tetto<br/>il resto è scartato"]
  CAP -- no --> TICK
  CLAMP --> TICK["registry.tickAll(ctx, n)"]
  TICK --> RENDER["la UI legge i selettori"]
  WAIT --> RENDER
  RENDER --> RAF
```

Il tetto di recupero serve a un caso solo ma importante: riaprire il gioco dopo giorni non deve
bloccare l'avvio per minuti. Il tetto è un dato in `balance/constants.ts`, non un numero nel loop.

## Dentro `tickAll`

Un solo passaggio, in ordine di `order`. Nessun sistema conosce gli altri: comunicano solo
attraverso il Ledger e il Bus.

```mermaid
sequenceDiagram
    participant L as loop
    participant R as Registry
    participant S as income (system)
    participant P as income/rules (puro)
    participant LG as Ledger
    participant B as Bus
    participant ST as store (Pinia)

    L->>R: tickAll(ctx, n)
    Note over R: itera i sistemi ordinati per `order`<br/>è l'unica lista che esiste
    R->>S: tick(ctx, n)
    S->>S: legge il proprio stato
    S->>P: guadagnoPerTick(stato, modificatori)
    Note over P: funzione pura:<br/>nessun ctx, nessun effetto
    P-->>S: Money
    S->>LG: post({ cash, +Money, reason.income.tick, income })
    LG->>LG: valida e applica sul saldo privato
    LG->>B: emit('money.posted', ...)
    B->>ST: l'handler aggiorna il mirror reattivo
    LG-->>S: Result<Money, PostError>
    S-->>R: void
    Note over R: prossimo sistema
```

Tre punti che il diagramma rende visibili meglio di qualsiasi paragrafo:

1. **Il sistema non tocca mai un saldo.** Chiede al Ledger, che gli risponde con un `Result`.
2. **Il calcolo è nella funzione pura**, che non riceve il contesto. È testabile da sola con un
   seed fisso e senza impalcature.
3. **Lo store è un lettore, non una fonte.** Riceve dal Bus, non calcola. Se lo store calcolasse,
   il gioco non sarebbe simulabile senza Vue — e cadrebbe l'ADR 0001.

## Un comando che può fallire

L'acquisto di un upgrade. Stesso disegno, direzione opposta: parte dalla UI.

```mermaid
sequenceDiagram
    participant C as IncomePanel.vue
    participant ST as store
    participant CMD as comando
    participant LG as Ledger
    participant B as Bus
    participant I as i18n

    C->>ST: compraUpgrade()
    ST->>CMD: esegue
    CMD->>LG: post({ cash, -costo, reason.upgrade.buy, purchase })
    alt saldo sufficiente
        LG->>B: emit('money.posted')
        LG-->>CMD: ok
        CMD->>CMD: registra il modificatore sul bersaglio income.all
        CMD-->>ST: Result ok
    else saldo insufficiente
        LG-->>CMD: error { code: 'error.ledger.insufficient_funds', required, available }
        CMD-->>ST: Result error
        ST->>C: il codice di errore
        C->>I: traduce il codice
    end
```

Il componente non sa cosa sia un saldo insufficiente: riceve un codice e lo traduce. È la
differenza fra un `boolean` e un `Result` (ADR 0007), e la ragione per cui i codici di errore sono
chiavi i18n e non frasi.
