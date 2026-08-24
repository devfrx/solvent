# Reddito — scheda di dominio

- **Stato:** compilata il 2026-08-21 da [D018](../../delega/D018-la-scheda-di-dominio.md), leggendo
  `src/core/domains/income/`
- **Costruito da:** [D010](../../delega/D010-dominio-income.md), fetta 01; il listino è di
  [D019](../../delega/D019-il-pagamento.md), il parziale a caveau pieno di
  [D017](../../delega/D017-il-caveau.md), il **regime** di
  [D043](../../delega/D043-il-reddito-si-mette-in-regola.md)
- **Perché è un caso di prova:** è il **caso pieno** — ha stato **e** ticchetta. Se la scheda non
  regge lui, non regge nessuno
- **A monte:** il blocco 1 della [mappa funzionale](../mappa-funzionale.md)

---

## Metà di gioco

### 1 · L'etichetta

| #   | Voce              | Reddito                                                                                       |
| --- | ----------------- | --------------------------------------------------------------------------------------------- |
| 1   | **Rendimento**    | 12,00 € al secondo, ×1,5 con l'unico potenziamento. È il solo che crea denaro dal nulla       |
| 2   | **Varianza**      | **zero**. Non usa l'Rng: ogni tick vale esattamente quanto il precedente                      |
| 3   | **Liquidità**     | **massima in nero**: nasce in contanti, spendibili subito. In regola nasce sulla carta        |
| 4   | **Tracciabilità** | **la sceglie il giocatore** (ADR 0052): zero in nero, totale in regola. In uscita mai zero    |
| 5   | **Calore**        | **zero**. Uno stipendio non fa notare nessuno                                                 |
| 6   | **Attenzione**    | **la più bassa del gioco**. Un acquisto in tutta la partita, e poi non chiede più niente      |
| 7   | **Pozza**         | forma 1 **solo in nero**, e non è sua: a fermarlo è il caveau. In regola non ne ha nessuna    |
| 8   | **Pagamento**     | **solo carta**. Il listino ha una voce sola, ed è la prova che la forma regge il caso stretto |
| 9   | **Requisito**     | **nessuno**. È il dominio da cui la partita comincia                                          |

La voce 4 è quella che rende il reddito interessante invece che neutro: **entra anonimo ed esce
tracciato.** Per crescere bisogna aver già accettato la traccia, cioè aver già usato il bancomat.

> **Riletta il 2026-08-24 da [D043](../../delega/D043-il-reddito-si-mette-in-regola.md), e quattro
> voci sono cambiate.** La frase qui sopra era vera per un motivo che nessuno aveva scelto: il
> reddito entrava anonimo perché `INCOME_POOL = 'cash'` stava scritto in un file, non perché il
> gioco lo avesse deciso. Con l'[ADR 0052](../../adr/0052-un-guadagno-dichiara-dove-atterra.md) la
> voce 4 smette di essere una proprietà del dominio e diventa **una scelta del giocatore**: in nero
> entra anonimo, in regola entra tracciato e tassato. Ne discendono anche le voci 3 e 7 — la
> liquidità e la pozza dipendono da dove il denaro atterra — mentre la 8, il pagamento, non si
> muove: i due acquisti di questo dominio si comprano tutti e due solo con la carta.

### 2 · Il ciclo

Il tempo passa e i contanti entrano. Un potenziamento, e ne entrano di più. E, una volta sola, la
scelta di **sotto quale regime** entrino: in nero nel caveau, o in regola sulla carta.

### 3 · Deve vedere, deve decidere, può andare male

**Deve vedere:** quanto entra al secondo; il totale accumulato; quanto costa il potenziamento e con
quale strumento si paga, **letto prima di premere** ([D019](../../delega/D019-il-pagamento.md)); e
**quanto non è entrato** perché il caveau non lo teneva.

**Deve decidere:** se spendere adesso per guadagnare di più dopo, sapendo che il reddito attivo ha
un tetto e il capitale no.

**Può andare male:** fondi insufficienti sulla carta; il potenziamento già comprato; il caveau
pieno, e allora lo stipendio si ferma.

### 4 · Come muore il secondo milione

**Forma 1 — non ci sta. Ed è la risposta che questa scheda non si aspettava:** la saturazione del
reddito **non è sua**.

Il reddito non ha una pozza in cui si versa qualcosa: non si può raddoppiare l'ingresso, perché non
c'è un ingresso. Quello che si può fare è comprare un potenziamento, e l'elenco dei potenziamenti
oggi ha **una** voce.

Ciò che davvero lo ferma sta in un altro dominio: `incomeThatFits` accredita **quanto ci sta** nel
caveau, e a caveau pieno vale zero. È la forma 1 in senso stretto — c'è un numero, e oltre quel
numero il denaro non entra — ma il numero appartiene a qualcun altro.

Ne discende una cosa che vale per i quattordici domini che verranno: **un dominio può saturare per
via di un altro**, e la sezione 6 di questa scheda è dove quel legame si vede prima di scriverlo.

### 5 · Il requisito, e di che tipo è

**Nessuno.** Insieme al caveau è l'unico senza, e per la stessa ragione: il gioco deve poter
cominciare. Un requisito qui sarebbe un cancello sul primo secondo di partita.

### 6 · A quali due domini si collega, e come

| Dominio      | Come si collegano                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Caveau**   | **in nero** il reddito nasce in contanti e finisce nel caveau, e a caveau pieno **si ferma**. In regola il caveau non lo riguarda più: il regime scioglie il legame (ADR 0052) |
| **Bancomat** | il potenziamento si paga solo con la carta, e la carta si riempie solo dal bancomat. Senza bancomat il reddito non cresce                                                      |
| **Abilità**  | futuro: i nodi che danno `+x%` si attaccano al bersaglio `income.all` che questo dominio dichiara                                                                              |

Il secondo legame è quello che chiude il cerchio della dualità: **per crescere devi tracciare.**

### 7 · Cosa succede a finestra chiusa

Il reddito **matura**, ed è l'unico dei tre a farlo. Il recupero usa lo stesso codice del tempo
reale, con un tetto di otto ore (`BALANCE.RECOVERY_CAP`).

Cosa può andare **contro** il giocatore: il caveau si riempie mentre è via, e da lì in poi le ore
che restano non valgono niente. Non torna con zero — `incomeThatFits` accredita il parziale — ma
torna con meno di quanto il tetto di recupero lascerebbe sperare, e il gioco non glielo dice finché
non riapre.

### 8 · Cosa prende in prestito, e cosa presta

**Prende in prestito:** il pool `cash` e il pool `card` (`contracts/pools.ts`), il listino
(`contracts/payment.ts`), e lo **spazio** del caveau — che arriva per costruzione, mai per import.

**Presta:** il bersaglio `income.all` (`INCOME_TARGET`). È il primo aggancio trasversale del
progetto: qualunque dominio futuro può registrare un modificatore su di lui senza che il reddito
sappia che esiste. L'albero delle abilità nascerà attaccandosi lì.

### 9 · Questo dominio si amministra?

**Sì**, e la sua destinazione è `income` (`DOMAIN_SCREENS`). C'è qualcosa da amministrare — il
potenziamento — anche se oggi è **un pulsante solo**, ed è il caso che l'
[ADR 0033](../../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md) prevede esplicitamente: la
pagina nasce stretta una volta sola, e cresce col dominio.

Le fonti di reddito che la [visione](../../prodotto/visione.md) promette — più di una, ciascuna con
nome, livello, effetto e costo — sono ciò che la riempirà.

---

## Metà kernel

| #   | Domanda                               | Reddito                                                                                                                                                                                                                                                           |
| --- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Ha stato?                             | **sì**: `{ upgraded: boolean }`. `load` rifiuta ciò che non è un booleano lanciando; `reset` rimette `INITIAL` e risincronizza il modificatore                                                                                                                    |
| 2   | Ticchetta? In quale `ORDER`?          | **sì**, `ORDER.INCOME`. Viene **dopo** `ECONOMY`, così al caricamento il caveau ritrova il livello prima che il recupero ticchetti                                                                                                                                |
| 3   | Cosa fa con un `elapsed` grande?      | un solo `tickAll` con tutti i tick arretrati, tetto a otto ore. **Non** incassa un rifiuto: chiede quanto ci sta e accredita quello                                                                                                                               |
| 4   | Soglie che si attraversano?           | **no, non sue**. Le attraversa quelle del caveau, e le vede da fuori con `room`                                                                                                                                                                                   |
| 5   | Cosa serve fuori dal `SystemContext`? | `ledger`, `modifiers` e `room`, tutti e tre per costruzione (ADR 0024). `modifiers` non può stare nel contesto: vive in `balance/`                                                                                                                                |
| 6   | Eventi, e domini importati?           | **nessun evento**, emesso o ascoltato. **Non importa nessun dominio**: lo spazio del caveau arriva per argomento, e a collegarli è il bootstrap                                                                                                                   |
| 7   | Quali `Reason` introduce?             | `reason.income.tick`, `reason.income.upgrade` e `reason.income.declare`. Più due codici suoi, `error.income.already_upgraded` e `error.income.already_declared`                                                                                                   |
| 8   | Tocca il denaro? Quali pool?          | **sì, e in entrata non è più una costante**: il pool lo dichiara il **regime** (ADR 0052) — `cash` in nero, `card` in regola, con la trattenuta che finisce in `tax`. In uscita `spend('card', …)` con `accepts` **generato dal listino**. Nessuna capienza è sua |
| 9   | Conti propri per entità?              | **no**                                                                                                                                                                                                                                                            |
| 10  | Liste storiche?                       | **no**. `withheld` è un numero solo e descrive l'ultimo tick, non la partita: infatti non si salva                                                                                                                                                                |
| 11  | Sapere che giorno è?                  | **no**. Riceve durate in tick, mai date                                                                                                                                                                                                                           |
| 12  | Usa l'Rng?                            | **no**, e discende dalla varianza zero                                                                                                                                                                                                                            |

**Numeri di gioco introdotti:** `INCOME_BASE_PER_SECOND` (12,00 €/s), `UPGRADE_PRICE_CARD`
(800,00 €), `UPGRADE_MULTIPLIER` (×1,5). Tutti in `balance/constants.ts`.

**Bersaglio lasciato:** `income_per_minute_at_start`, fra 700,00 € e 740,00 €. Lega il reddito base
al Clock, e cambiarne uno solo rende rosso `tests/balance/targets`.

---

## Cosa questa compilazione ha trovato

**1. La saturazione del reddito non è sua**, ed è scritto sopra. Nessun documento lo diceva: la
[visione](../../prodotto/visione.md) dice «il reddito attivo ha un tetto», che è vero e riguarda i
potenziamenti; il tetto che morde **oggi** è la capienza del caveau, che è di un altro dominio.

**2. `withheld` risponde a una domanda che la scheda non fa.** Non è stato (non si salva), non è una
lista, non è un evento: è un **numero che spiega perché il tick non ha fatto quello che sembrava**.
La metà kernel non ha una casella dove metterlo, e ce ne sarà uno per ogni dominio che può fallire
parzialmente. La domanda che manca è: _cosa dice il dominio quando fa meno di quanto poteva?_ Va
posta alla quarta scheda, non qui.

**3. Il legame con il bancomat non è nella mappa funzionale.** Il blocco 1 elenca il potenziamento e
il suo prezzo, ma non dice che la carta si riempie **solo** dal bancomat — cioè che senza il gesto
centrale del gioco il reddito non cresce. È la conseguenza di gioco più forte del dominio, e stava
solo dentro il listino.
