# ADR 0023 — Il tempo di gioco è un sistema di dominio, non una funzione del kernel

- **Stato:** Proposta — il meccanismo nasce con il primo dominio che ha una scadenza
- **Data:** 2026-08-19
- **Non tocca:** [ADR 0009](0009-passo-fisso-e-tipi-branded-per-il-tempo.md), che resta integro

## Contesto

L'[ADR 0009](0009-passo-fisso-e-tipi-branded-per-il-tempo.md) ha deciso due cose: il passo è fisso
a dieci tick al secondo, e le unità di tempo vivono nel tipo. Il `Clock` che ne è nato **non ha
stato**: converte fra tick e secondi e nient'altro. Non sa che ora è, per una ragione dichiarata —
se lo sapesse, ogni test di dominio dovrebbe controllarlo, e il tempo tornerebbe a essere globale.

La [visione](../prodotto/visione.md) chiede una cosa che oggi nessuno sa fare: **le scadenze**.
L'affitto scade a fine mese. La rata del prestito ha una data. Il deposito vincolato matura fra
novanta giorni. L'asta chiude alle sette. Il contratto d'affitto dura un anno e poi va rinnovato.

Un sistema riceve `tick(ctx, elapsed)`: quanti tick sono passati, non a che punto siamo. Per sapere
"che giorno è" oggi ogni dominio dovrebbe accumulare un contatore proprio, salvarlo, ricaricarlo e
azzerarlo nel modo giusto. Otto domini, otto contatori, otto occasioni di divergere — e la prima
volta che due sistemi non sono d'accordo su che giorno sia, il difetto non è trovabile: è
distribuito.

Serve un solo posto che sa che ora è. La domanda è dove.

## Decisione

**Il tempo di gioco è un sistema di dominio.** `src/core/domains/calendar/`, con un `system.ts`
come tutti gli altri.

- È l'**unico** a tenere il contatore assoluto dei tick trascorsi. Ha stato, quindi ha `save`,
  `load` e `reset`: il tipo `Stateful` lo pretende, e il salvataggio del tempo entra in
  `SystemsSave` come quello di ogni altro dominio.
- Converte i tick in giorni e mesi di gioco usando una costante di **balance** — quanto dura un
  giorno — perché la velocità del tempo è un numero di bilanciamento, non un fatto del kernel.
- **Emette** sul Bus quando il giorno o il mese cambiano:

      'time.day.passed':   { day: number,   tick: Ticks }
      'time.month.passed': { month: number, tick: Ticks }

Gli altri domini **ascoltano**. Il sistema degli affitti non conta i giorni: si sveglia quando il
mese gira. È la stessa forma già scelta per il calore nel punto 3 della visione, ed è la ragione
per cui il Bus è stato deciso prima dei domini.

Il calendario abita una fase nuova dell'`ORDER`, prima di tutte:

    TIME: 50   // il tempo passa prima che chiunque possa reagirci

Il passo di 100 dell'[ADR 0002](0002-registry-unica-lista-di-sistemi.md) esisteva per questo: la
fase nuova entra senza rinumerare niente e senza spostare l'ordine di nessun sistema esistente.

**Una scadenza si scrive come un tick assoluto**, si confronta con il tick portato dall'evento, e
il denaro si muove nel `tick` di chi ascolta — mai nell'handler, dove la guardia contro
l'annidamento è alzata ([ADR 0016](0016-il-bus-e-sincrono-e-fire-and-forget.md)). Poiché il
calendario gira nella fase 50 e i domini economici da 100 in su, l'handler segna e il `tick` dello
stesso frame paga: nessuna latenza, nessuna coda.

## Quando

**Non adesso.** Il grilletto è il primo dominio con una scadenza — gli affitti o le rate, era 2
della visione. Le fette da 01 a 06 non hanno date: il progresso offline della fetta 03 è tempo
_trascorso_, non tempo _assoluto_, e il tetto di recupero lo gestisce senza sapere che giorno sia.

## Alternative scartate

- **Un `now: Ticks` nel `SystemContext`, fornito dal loop.** È la forma più diretta, e a prima
  vista la più pulita: chiunque sa che ora è, sempre. Ma il tick assoluto va **salvato**, e il
  runtime non è un sistema: finirebbe in una quarta chiave di `SavePayload`, cioè in una modifica
  al contratto di salvataggio proprio mentre [D009](../delega/D009-persistenza-main.md) lo scrive.
  Il calendario come dominio ottiene lo stesso risultato entrando in `SystemsSave` senza toccare
  una riga di contratto. Resta l'opzione giusta il giorno in cui un dominio avrà bisogno dell'ora
  esatta e non del cambio di giorno: sta nel [registro YAGNI](../roadmap-fette.md) con quel
  grilletto.
- **Uno stato nel `Clock`.** Rompe l'[ADR 0009](0009-passo-fisso-e-tipi-branded-per-il-tempo.md)
  per comodità, rimette il tempo globale nel kernel e obbliga ogni test di dominio a controllare
  un oggetto condiviso. È la scelta che l'ADR 0009 aveva già scartato, riproposta con un'altra
  motivazione.
- **Uno `Scheduler` nel kernel** — «esegui questo fra N tick». Generalizza un problema che nessun
  dominio ha ancora avuto, e richiede al kernel di conservare callback: cioè stato serializzabile
  di cui il kernel non conosce il significato. Se dopo due o tre domini con scadenze emergerà una
  forma comune, la si estrae da usi veri.
- **Nessun calendario: tutto in secondi.** «Affitto ogni 900 secondi» funziona, e toglie al gioco
  la parola _mese_. Un tycoon finanziario in cui il tempo non ha nomi non può avere contratti,
  scadenze, anzianità di credito né rendimenti annui — cioè metà della profondità che la visione
  chiede.

## Conseguenze

- **Il kernel non cambia.** Nessuna riga di `Clock`, `Registry`, `Bus`, `Ledger` o dei contratti.
  L'unica aggiunta è una costante in `ORDER`, che è il caso d'uso per cui il passo di 100 esiste.
- **`SavePayload` non cambia**, quindi D009 non cambia.
- **Il tempo diventa bilanciabile.** Quanto dura un giorno è un numero in `balance/`, con il suo
  bersaglio misurato in `targets.ts`: si può accelerare il gioco senza toccare un dominio.
- **`GameEvents` cresce di due voci**, ed è la prima volta che un dominio emette invece di
  limitarsi ad ascoltare. È la prova che il contratto del Bus regge, ed è il motivo per cui la
  fetta 04 esiste.
- **Costo dichiarato:** un dominio che avesse bisogno dell'ora esatta a metà giornata non ce
  l'ha. Nessuno dei domini della visione ne ha bisogno — sono tutti «quando il mese gira», «quando
  scade il giorno». Il giorno in cui uno lo chiederà, il grilletto del `now` nel contesto è già
  scritto.
