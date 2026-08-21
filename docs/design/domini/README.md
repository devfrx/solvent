# La scheda di dominio

Il modulo che ogni dominio compila **prima** che qualcuno ne scriva una riga. Non descrive un
dominio finito: lo interroga finché non è chiaro cosa costerà al kernel, e la differenza fra le due
cose è tutto il valore di questa pagina.

- **Nasce da:** [D018](../../delega/D018-la-scheda-di-dominio.md), il 2026-08-21
- **Si compila:** prima della delega che costruisce il dominio, e **leggendo il codice** che c'è,
  mai ricordandolo
- **Chi la legge:** chi scrive quella delega, chi la esegue, e chi fra sei mesi si chiede perché un
  numero è quel numero

## Perché esiste

La [visione](../../prodotto/visione.md) è stata riscritta il 2026-08-20 e ha cambiato metà del
gioco. **Nessuno si è chiesto cosa facesse tutto questo al kernel.** L'audit fatto subito dopo —
rileggendo il codice invece del documento — ha trovato due difetti in mezz'ora:

| Trovato                                                                                    | Dove viveva                                   |
| ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Otto ore di assenza valevano **trentanove anni di gioco**: dormire rendeva più che giocare | `BALANCE.RECOVERY_CAP`, scelto nella fetta 01 |
| Il recupero fa **un solo** `tickAll`, quindi nessuna soglia attraversata è visibile        | `stores/game.ts`, `recover()`                 |

Nessuno dei due è un difetto del kernel: il kernel fa quello che gli è stato chiesto. Sono difetti
di **giunzione** — una decisione di gioco presa senza guardare il meccanismo che dovrà reggerla.

Le domande dell'audit non sono state geniali. Sono domande ovvie che nessuno aveva scritto in un
posto dove tornassero a galla. Questa scheda è quel posto.

## Come si compila

Tre regole, e la terza è quella che si dimentica.

1. **Leggendo `src/`, non a memoria.** L'audit ha trovato i suoi due difetti rileggendo file che
   qualcuno aveva scritto apposta, con i commenti giusti sopra. Una scheda che descrive ciò che
   credevamo di aver scritto è peggio di nessuna scheda.
2. **Rispondendo, non spuntando.** «Ha stato? Sì» non è una risposta: la risposta è **quale** stato,
   cosa ne sopravvive a un `load` e cosa a un `reset`. Le domande sono corte perché siano
   ricordabili, non perché lo siano le risposte.
3. **Rimandando.** Dove la [visione](../../prodotto/visione.md), la
   [mappa funzionale](../mappa-funzionale.md), un ADR o il
   [registro YAGNI](../../roadmap-fette.md) già rispondono, la scheda **linka**. Una tabella
   ricopiata qui invecchia da sola, ed è il difetto che
   [D021](../../delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md) ha tolto ai documenti
   vivi.

Una scheda si scrive una volta e si legge dieci. Se una sezione non ha mai cambiato una decisione,
va tolta — e quel controllo si fa alla **quarta** scheda compilata, non prima: con tre casi una
sezione che non discrimina può essere sfortuna.

---

## Metà di gioco

Riprende la visione e la mappa funzionale. Non le riscrive.

### 1 · L'etichetta

Le nove voci della [visione](../../prodotto/visione.md), regola 1: rendimento, varianza, liquidità,
tracciabilità, calore, attenzione, pozza, pagamento, requisito. **Compilata**, non descritta.

Nessuna voce resta bianca. Se una non si applica, lo dice a parole — «zero, e per scelta» è una
risposta; uno spazio vuoto è una domanda che nessuno ha letto.

### 2 · Il ciclo

Cosa fa il giocatore, in una frase. Se serve un paragrafo, il dominio ne sta facendo due.

### 3 · Deve vedere, deve decidere, può andare male

Le tre righe della [mappa funzionale](../mappa-funzionale.md). Sono ciò che l'interfaccia dovrà
**poter** mostrare, mai come lo mostra: dove vive quell'interfaccia lo dice l'
[ADR 0033](../../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md), non questa scheda.

### 4 · Come muore il secondo milione

Quale delle quattro forme di saturazione, e **con quale numero**. Un dominio che non satura diventa
la risposta a ogni domanda, ed è la legge che la visione chiama non dominanza.

### 5 · Il requisito, e di che tipo è

Strumento, relazione, punteggio o possesso. **Se è capitale e basta, la scheda è incompleta:** lo
dice la visione con parole sue — almeno un requisito per dominio non è denaro.

### 6 · A quali due domini si collega, e come

Almeno **due**, e detto come: cosa passa, in che verso, e cosa succede quando l'altro capo manca.

È la sola sezione che può **bocciare** un dominio invece di descriverlo. Un dominio che non si
collega a niente è un pulsante che alza un numero, ed è il difetto da cui l'intero progetto è
ripartito.

### 7 · Cosa succede a finestra chiusa

Cosa avanza, cosa si ferma, e cosa può andare **contro** il giocatore. La terza è quella che si
dimentica, ed è la più cara: è dove viveva il difetto delle otto ore.

### 8 · Cosa prende in prestito, e cosa presta

Le cose **trasversali**: quelle che il dominio usa senza possederle, e quelle che ne escono e
diventano di tutti.

Le sette sezioni qui sopra descrivono un dominio **da dentro**. Nessuna chiede cosa usa senza che
sia suo, e il caveau lo mostra: conserva i contanti, e i contanti non sono suoi.

Dove vive oggi ciascuna:

| Trasversale                                         | Dove vive                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Gli strumenti — contanti, carta, e poi le altre     | `contracts/pools.ts` ([ADR 0017](../../adr/0017-il-denaro-e-plurale.md))                                |
| Il listino di un'azione                             | `contracts/payment.ts` ([ADR 0027](../../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)) |
| Gli **oggetti**, e chi li conserva                  | da nessuna parte: il grilletto è nel [registro](../../roadmap-fette.md)                                 |
| Il calore e l'attenzione                            | nella [visione](../../prodotto/visione.md), non nel codice                                              |
| Il tempo di gioco e le scadenze                     | [ADR 0023](../../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md), non costruito                  |
| Le entità del giocatore, e i conti che hanno        | [ADR 0022](../../adr/0022-il-ledger-ha-conti-non-solo-pool.md)                                          |
| Gli eventi che un dominio emette e un altro ascolta | `contracts/events.ts` ([ADR 0016](../../adr/0016-il-bus-e-sincrono-e-fire-and-forget.md))               |
| L'etichetta a nove voci, e il requisito             | nella [visione](../../prodotto/visione.md)                                                              |

**La sezione non le costruisce e non le progetta.** Chiede a ogni dominio di dichiarare quali usa e
quali produce. Il primo dominio che **presta** qualcosa troverà la riga già scritta invece di
doverla inventare.

### 9 · Questo dominio si amministra?

Sì, e allora ha una destinazione nella colonna. No, e allora scrive `null` — che è una risposta, non
una dimenticanza.

Il criterio è dell'[ADR 0033](../../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md), in una
riga: **la cartella è del dominio, sempre; la pagina è del giocatore, e c'è quando c'è qualcosa da
amministrare.** Un dominio che si amministra prende la sua pagina anche se oggi ci sta dentro un
pulsante solo: nasce stretta una volta sola, e cresce col dominio.

La risposta non resta in questa scheda. Va in `DOMAIN_SCREENS`
(`renderer/components/shell/screens.ts`), e **R18** — `tests/rules/domain-ui` — confronta quelle
chiavi con le cartelle vere di `src/core/domains/`: un dominio che non risponde è rosso.

**Oggi tutti e tre rispondono di sì, quindi la sezione non discrimina ancora.** Va detto invece che
lasciato intendere: il primo `null` sarà il calendario
([ADR 0023](../../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md)), che è l'orologio del
gioco e non ha niente da mostrare. Finché quel `null` non esiste, questa sezione è una domanda con
una risposta sola — e il controllo alla quarta scheda compilata serve esattamente a questo.

---

## Metà kernel

Dodici domande. Sono quelle che l'audit ha fatto a mano, e **ognuna ha dietro un ADR, un invariante
o un test**: una domanda senza un meccanismo è una buona intenzione, e una scheda se ne riempie solo
se qualcuno l'ha compilata di fretta.

| #   | Domanda                                                            | Cosa decide                                           | Cosa la tiene in piedi                                                                                                                                   |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Ha stato?                                                          | `system.ts` con `save`/`load`/`reset`, o soli comandi | 🔒 `Stateful` in `kernel/Registry.ts` (R07); INV-20 e `tests/rules/stateful-systems-reject-garbage`                                                      |
| 2   | Ticchetta? In quale `ORDER`?                                       | se si registra, e in che ordine carica e salva        | [ADR 0002](../../adr/0002-registry-unica-lista-di-sistemi.md); INV-05 e `tests/rules/registry-completeness`                                              |
| 3   | Cosa fa con un `elapsed` **grande**?                               | il recupero dopo un'assenza                           | [ADR 0009](../../adr/0009-passo-fisso-e-tipi-branded-per-il-tempo.md); `BALANCE.RECOVERY_CAP` e `tests/balance/targets`                                  |
| 4   | Ha soglie che si attraversano e si rientrano?                      | se riguarda il recupero a blocchi                     | il grilletto nel [registro YAGNI](../../roadmap-fette.md)                                                                                                |
| 5   | Cosa gli serve che non sta nel `SystemContext`?                    | cosa arriva **per costruzione**, mai da un singleton  | [ADR 0024](../../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md); `tests/renderer/createGame`                                |
| 6   | Quali eventi emette, a quali ascolta — e importa un altro dominio? | il Bus, e il confine fra domini                       | [ADR 0016](../../adr/0016-il-bus-e-sincrono-e-fire-and-forget.md) e INV-15; **R19** con `tests/rules/domains-are-independent`                            |
| 7   | Quali `Reason` introduce?                                          | le parole che ogni transazione porta con sé           | [ADR 0011](../../adr/0011-i18n-obbligatoria-con-parita-verificata.md); INV-07 e `tests/i18n/parity`                                                      |
| 8   | Tocca il denaro? Quali pool, con quale `accepts`?                  | il Ledger, e chi dichiara la capienza                 | R06; [ADR 0019](../../adr/0019-transazioni-atomiche-nel-ledger.md), [ADR 0025](../../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md) e INV-18 |
| 9   | Ha conti propri per entità?                                        | se fa scattare i conti dinamici                       | [ADR 0022](../../adr/0022-il-ledger-ha-conti-non-solo-pool.md)                                                                                           |
| 10  | Ha liste storiche?                                                 | `boundedList` con il `max` dichiarato                 | [ADR 0010](../../adr/0010-liste-storiche-limitate-alla-definizione.md); R09 e INV-06                                                                     |
| 11  | Ha bisogno di sapere che giorno è?                                 | se fa scattare il calendario                          | [ADR 0023](../../adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md): riceve **durate**, non date                                                     |
| 12  | Usa l'Rng? Con quale stream?                                       | la riproducibilità di una partita                     | [ADR 0005](../../adr/0005-rng-seedato-con-stream-per-dominio.md); R03                                                                                    |

E in fondo, due righe che non sono domande ma **conseguenze**:

| Conseguenza                             | Dove va a finire                                                                              |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| Quali numeri di gioco introduce         | `balance/constants.ts`, mai dentro il dominio — R04 e `tests/rules/domains-no-money-literals` |
| Quale bersaglio di bilanciamento lascia | `balance/targets.ts`, verificato da `tests/balance/targets`                                   |

Un dominio senza bersaglio è un dominio il cui bilanciamento è un'opinione.

---

## Cosa la scheda non fa

- **Non decide la direzione visiva.** Dice cosa un dominio deve **poter** mostrare, mai come.
- **Non costruisce le cose trasversali.** La sezione 8 le dichiara e rimanda; generalizzarle da un
  dominio solo è ciò che la [visione](../../prodotto/visione.md) vieta.
- **Non si compila per i domini che non esistono.** Diciassette schede in un pomeriggio sono
  diciassette domini progettati per un kernel che non li ha mai visti — il difetto **A17**
  travestito da diligenza ([ADR 0014](../../adr/0014-una-fetta-verticale-alla-volta.md)).

## Le schede compilate

| Dominio              | Ha stato | Ticchetta | Perché è un caso di prova                                |
| -------------------- | -------- | --------- | -------------------------------------------------------- |
| [Reddito](income.md) | sì       | sì        | il caso pieno: stato **e** tick                          |
| [Bancomat](atm.md)   | no       | no        | soli comandi. Se la scheda non lo regge, è sbagliata     |
| [Caveau](vault.md)   | sì       | no        | stato senza tick, ed è interrogato dentro il tick altrui |
