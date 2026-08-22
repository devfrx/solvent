# ADR 0040 — Il bancomat e il cruscotto sono due pagine

- **Stato:** **Accettata** — [D033](../delega/D033-il-bancomat-e-una-pagina.md): `atm` e `board`
  sono due destinazioni, `home` non esiste più, e il tetto dei riquadri è rimasto cambiando
  bersaglio — `tests/rules/board-tiles`
- **Data:** 2026-08-22
- **Supera:** [ADR 0018](0018-la-home-e-un-atm.md), che resta in vigore per tutto il resto di ciò
  che diceva
- **Origine:** preferenze [P3](../prodotto/preferenze.md#p3--la-home-è-cruscotto-e-bancomat) e
  [P5](../prodotto/preferenze.md#p5--la-carta-è-un-oggetto-3d-ruotabile), e l'artboard `ATM` di
  [solvent-canvas.dc.html](../design/mockups/solvent-canvas.dc.html)

## Contesto

L'[ADR 0018](0018-la-home-e-un-atm.md) ha posto la domanda giusta, e vale la pena ricopiarla per
intero perché **non è cambiata**:

> come si impedisce al cruscotto di mangiarsi il bancomat, che è quello che succede sempre — perché
> le statistiche crescono e il bancomat no.

La risposta che si era data era un **tetto**: una pagina sola con due zone in ordine fisso, e un
massimo di sei riquadri verificato da un test. Ha retto tutta la fetta 01 e la fetta 02.

Ha smesso di reggere per una ragione che si vede in [D034](../delega/D034-le-serie-degli-strumenti.md):
porta due grafici, e **un grafico non è un riquadro**. Il tetto non lo conta, e non potrebbe
contarlo comunque — nessun numero di riquadri descrive quanta pagina occupa un grafico. La difesa
era tarata su un'unità di misura che il contenuto nuovo non usa.

C'è una seconda crepa, più vecchia e meno visibile: il tetto misurava **il cruscotto**, cioè
proprio la cosa che cresce, e da quella misura ricavava una promessa sul **bancomat**, cioè la cosa
che non cresce. Fra le due c'era una pagina condivisa, ed è l'unica ragione per cui il legame
esisteva.

## Decisione

**Due destinazioni.** `atm` è la pagina del bancomat, `board` è quella del cruscotto. La home non
esiste più: né come schermata, né come prefisso di chiave i18n.

I gruppi della colonna seguono la divisione che c'era già da
[D026](../delega/D026-dove-si-attacca-un-dominio.md) — dove si **fa** qualcosa e dove si **guarda**
ciò che è successo — e la separazione la rende più netta invece di romperla:

```
Fare     →  atm · income · vault
Guardare →  board · stats
```

**Il tetto di sei riquadri resta, e cambia bersaglio.** Non difende più il bancomat dal cruscotto:
difende **il cruscotto da se stesso**. Senza, torna a essere i dieci riquadri del progetto
precedente, cioè una parete di numeri in cui nessuno è più importante di un altro. Il test si
chiama `tests/rules/board-tiles` e la ragione nuova è scritta dentro, perché un test con il
commento vecchio è un test che il prossimo cancella.

**Il bancomat resta la prima cosa che si vede all'apertura.** L'applicazione parte su `atm`.
Separare le due pagine non cambia quale delle due viene per prima, e una schermata che si apre
sulle statistiche di una partita appena nata si apre su cinque zeri.

**Tutto il resto dell'ADR 0018 vale ancora**, e non è una clausola di cortesia: la commissione si
vede prima della conferma, un rifiuto ha un motivo e non un pulsante spento, l'anteprima **è**
l'operazione, la carta è un oggetto che si gira. Quelle righe non dipendevano dal fatto che le due
zone stessero sulla stessa pagina.

## Alternative scartate

- **Tenere la pagina unica e alzare il tetto.** Sposta la data del problema senza toccarne la
  causa: il contenuto nuovo si misura in grafici, non in riquadri, e il numero da alzare non
  esiste.
- **Tenere la pagina unica e contare anche i grafici.** Un tetto a due unità di misura — sei
  riquadri **e** un grafico — è un tetto che va rinegoziato a ogni forma nuova, e la terza forma
  arriva sempre. Era già la forma peggiore di quella che l'ADR 0018 chiamava «ibrida senza tetto».
- **Il cruscotto dentro la schermata Statistiche.** Sembra gratis, perché quella schermata esiste
  dal primo giorno. Ma le due cose non rispondono alla stessa domanda: il cruscotto dice **come va
  adesso**, le Statistiche dicono **cosa è successo**, riga per riga. Fonderle darebbe una pagina
  che si apre su un registro di transazioni, e il registro è la parte che non si guarda mai per
  prima.
- **Il bancomat come sovrapposizione sopra il cruscotto.** Costa un livello superiore per il gesto
  centrale del gioco, cioè lo rende qualcosa che si **apre** invece di qualcosa che c'è. È la
  seconda alternativa scartata dall'ADR 0018 con un vestito nuovo.

## Conseguenze

- L'[ADR 0018](0018-la-home-e-un-atm.md) passa a **`Superata`**, ed è il primo del progetto: fino a
  ieri ne contava zero. La sua riga di stato rimanda qui.
- `tests/rules/home-tiles` diventa `tests/rules/board-tiles`. **Non è stato cancellato**, ed è la
  parte che conta: il primo istinto era toglierlo, perché la cosa che difendeva se n'era andata.
- Le chiavi `home.*` diventano `board.*` e `atm.*`. La parità i18n (R13) **non** vede una chiave
  dimenticata in tutte e due le lingue, quindi il controllo vero è che nessuna chiave `home.`
  sopravviva — `grep -rn "'home\." src/` deve essere vuoto.
- `DOMAIN_SCREENS.atm` passa da `'home'` a `'atm'`: il bancomat era l'unico dominio a non avere una
  destinazione col proprio nome, e adesso ce l'ha. Che quella mappa possa dire nomi diversi resta
  vero e resta utile — semplicemente non è più il bancomat a dimostrarlo.
- **`board` è una destinazione che non è un dominio**, e la regola R18 lo sopportava già:
  `DOMAIN_SCREENS` va da cartella di dominio a destinazione, non il contrario. `stats` lo è dal
  primo giorno.
- La pagina del bancomat porta la geometria che il canvas le dà — sette colonne e cinque — e quella
  geometria vive **nella pagina**, non nel kit (R16, [ADR 0030](0030-il-telaio-e-una-forma-non-un-contenitore.md)).
- Il cruscotto adesso può crescere senza toccare il bancomat, che è ciò che
  [D034](../delega/D034-le-serie-degli-strumenti.md) aspettava.
