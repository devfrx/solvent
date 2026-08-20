# Caveau — scheda di dominio

- **Stato:** **metà di gioco completa**. La metà kernel non è qui: la compila
  [D018](../../delega/D018-la-scheda-di-dominio.md), leggendo il codice che
  [D017](../../delega/D017-il-caveau.md) avrà scritto
- **Data:** 2026-08-20
- **Costruito da:** [D017](../../delega/D017-il-caveau.md), fetta 02 — ma solo per i **contanti**.
  Oggetti, ingombro e perquisizione arrivano con le fette successive
- **A monte:** la casa e le quattro forme di saturazione nella
  [visione](../../prodotto/visione.md), il blocco 3 della
  [mappa funzionale](../mappa-funzionale.md)

Questa scheda è la prima compilata, ed è anche l'unica che descrive un dominio **che non esiste
ancora**. Ne discende un obbligo: quando D017 sarà eseguita, la scheda va riletta contro il codice
e corretta dove ha sbagliato. Una scheda che descrive ciò che credevamo di scrivere è peggio di
nessuna scheda.

---

## Il ciclo

Conserva contanti e oggetti fisici. Ha un tetto. Si amplia a livelli, e i livelli finiscono.

## Il ruolo, in una riga

È il posto **noioso e sicuro**: non rende, non fa rumore, non chiede attenzione. In cambio tiene i
contanti **anonimi**, e ne tiene pochi.

La lezione che insegna è una sola, e il gioco non la dice a parole: **i contanti sono la forma più
ingombrante di valore.** È da lì che nasce la spinta verso la carta, e la carta lascia tracce.

## L'etichetta

Nove voci ([visione](../../prodotto/visione.md), regola 1). La quarta è nata compilando **questa**
scheda: vedi _Cosa questo studio ha trovato_.

| #   | Voce              | Caveau                                                                      |
| --- | ----------------- | --------------------------------------------------------------------------- |
| 1   | **Rendimento**    | **zero**. Non rende e non costa tenerlo. Costa **ampliarlo**                |
| 2   | **Varianza**      | **zero**. Nessun furto casuale, per scelta                                  |
| 3   | **Liquidità**     | **massima**. I contanti sono spendibili subito e uscire non costa niente    |
| 4   | **Tracciabilità** | **zero**, ed è l'unica voce in cui vince. È tutto il suo motivo di esistere |
| 5   | **Calore**        | **zero**. Tenere denaro dentro non fa notare nessuno                        |
| 6   | **Attenzione**    | **quasi zero**. Un pulsante ogni tanto, nessuna entità da seguire           |
| 7   | **Pozza**         | **minima**, forma 1. È l'unico strumento la cui pozza **è** il suo tetto    |
| 8   | **Pagamento**     | **entrambi**, a prezzi diversi. È il primo listino a due voci del gioco     |
| 9   | **Requisito**     | **nessuno**. È il primo strumento del gioco                                 |

### La legge della non dominanza regge

Il confronto che conta è con il **deposito vincolato**, l'altro posto dove il denaro sta fermo
senza rischio.

| Voce          | Caveau      | Deposito vincolato |
| ------------- | ----------- | ------------------ |
| Rendimento    | zero        | **2 – 4 %**        |
| Liquidità     | **massima** | bassa, con penale  |
| Tracciabilità | **zero**    | totale             |
| Pozza         | minima      | **infinita**       |
| Requisito     | **nessuno** | una carta          |

Il deposito vince su rendimento e pozza; il caveau su liquidità, tracciabilità e requisito.
**Nessuno dei due domina**, e con otto voci la conclusione sarebbe stata la stessa per la ragione
sbagliata — il caveau avrebbe vinto solo su liquidità e requisito, cioè su due voci accessorie,
mentre la sua virtù vera non compariva.

---

## Lo spazio: un tetto solo, due inquilini

Il caveau ha **una** capienza, misurata in **euro**, e ci stanno dentro due cose che si fanno
concorrenza.

| Cosa         | Quanto spazio occupa                                                 |
| ------------ | -------------------------------------------------------------------- |
| **Contanti** | 1 € = 1 unità di spazio. Sempre, senza eccezioni                     |
| **Oggetti**  | un **ingombro** dichiarato dall'oggetto, che **non è il suo valore** |

**L'ingombro è espresso nella stessa unità della capienza, cioè in euro**, ed è la ragione per cui
la sottrazione qui sotto ha senso senza nessuna conversione. Non è il valore dell'oggetto: è quanto
spazio toglie ai contanti.

```
spazio disponibile per i contanti  =  tetto del livello  −  ingombro degli oggetti
```

Un diamante da 50.000 € può ingombrare 500; un quadro da 5.000 € può ingombrarne 4.000. Il
giocatore impara da solo a tenere dentro **valore denso**, e scopre che i contanti sono il valore
meno denso che esista.

**Il kernel non cambia per reggere questa forma**, ed è la ragione per cui la si può decidere
adesso invece che quando arriveranno gli oggetti. Il Ledger controlla `saldo + importo > capienza`
con una capienza di tipo `Money`; l'[ADR 0025](../../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)
la trasforma da costante a **funzione**, e la funzione del caveau fa la sottrazione qui sopra.

**Conseguenza per [D017](../../delega/D017-il-caveau.md): nessuna, ed è il punto.** La capienza che
il Ledger riceve è una funzione che il caveau **possiede**, quindi il giorno degli oggetti la
sottrazione entra dentro quella funzione e nient'altro si muove — nessun parametro nuovo, nessuna
firma diversa, nessun test in più. Costruire oggi un posto dove mettere un ingombro che nessuno
produce sarebbe generalizzazione speculativa, cioè la cosa che l'
[ADR 0014](../../adr/0014-una-fetta-verticale-alla-volta.md) vieta.

Quello che D017 deve rispettare è **una riga sola**: la capienza si misura in **euro**. Non in
posti, non in slot, non in un'unità astratta di volume. Rispettarla costa zero perché è già così;
ignorarla costerebbe una conversione a ogni transazione il giorno in cui il caveau contiene due
cose diverse.

---

## L'ampliamento

- **Livelli finiti, con un tetto dichiarato.** Il caveau arriva a un ultimo livello e lì si ferma.
  Il giocatore lo vede dal primo secondo — «caveau 3 di 8» — e sa che i contanti hanno una fine.
- Ogni livello dà più spazio e costa di più.
- **Si paga in contanti o con la carta, a prezzi diversi.** Il meccanismo — il **listino** di
  un'azione — è dell'[ADR 0027](../../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
  e lo costruisce [D019](../../delega/D019-il-pagamento.md); il caveau è il primo a offrirne due.
  La taratura ha un vincolo: senza il calore, lo strumento più economico vincerebbe sempre, quindi
  la differenza di prezzo va misurata contro la **commissione del bancomat** — pagare con la carta
  conviene solo se lo sconto supera quanto costa portarci i contanti.

**Perché livelli finiti e non una curva che si strozza da sola.** L'alternativa era non mettere
nessun tetto e lasciare che il costo crescesse più in fretta della capienza, così che il muro
nascesse da sé — che è quello che la visione preferisce per i gradini di scala. È stata scartata
per un motivo misurabile: in un idle il denaro cresce in fretta, quindi «costa più di quanto
renda» è un bersaglio mobile, tarato contro la curva del gioco. Ogni volta che quella curva
cambia, il caveau va ritarato. Un tetto dichiarato invece si verifica con un test in
`balance/targets.ts` e non si ritara mai.

---

## Come muore il secondo milione

**Forma 1 — non ci sta.** È la forma più netta delle quattro, e il caveau è il solo strumento in
cui la pozza **coincide** con il tetto: non c'è attrito progressivo, non c'è rendimento che cala.
C'è un numero, e oltre quel numero il denaro non entra.

Il numero è la capienza dell'ultimo livello. Sopra quella cifra i contanti smettono di essere una
scelta possibile, non una scelta cara — e l'unica via che resta è la carta, che lascia tracce.

---

## Il requisito

**Nessuno.** È il primo strumento del gioco, e deve esserlo: il reddito arriva in contanti dal
primo secondo, quindi un posto dove metterli esiste da prima che il giocatore decida qualsiasi
cosa.

È l'unico dei diciassette a non avere requisito, e la visione lo permette esplicitamente — «almeno
uno per dominio non è denaro» vale per i domini che si aprono, non per quello da cui si parte.

---

## A quali due domini si collega, e come

La regola operativa della visione chiede **due**. Il caveau ne ha tre, e uno dei tre lo domina.

| Dominio               | Come si collegano                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reddito**           | il reddito arriva in contanti, quindi **entra nel caveau**. Quando il caveau è pieno il reddito si ferma: è il collegamento più stretto del gioco |
| **Bancomat**          | è la valvola. Con un caveau infinito è comodo; con un caveau pieno diventa **obbligatorio**, e non cambia di una riga per diventarlo              |
| **Calore e indagini** | la perquisizione è l'unica cosa che svuota il caveau da fuori. Arriva con le fette 04 e 06                                                        |

In futuro anche **black market** e **aste di box**, che sono i domini da cui nascono gli oggetti.
Finché non esistono, il caveau è un contenitore con dentro solo denaro.

---

## Cosa succede a finestra chiusa

Il reddito continua a maturare e il caveau **si riempie**. Quando lo spazio finisce, il reddito
accredita **quanto ci sta** e il resto non entra.

Questa riga non è un dettaglio di implementazione: è la decisione di gioco più importante del
dominio, ed è stata **misurata** prima di essere scelta. Il recupero fa un solo `tickAll` con tutti
i tick arretrati, cioè una transazione sola da otto ore di reddito, e le transazioni del Ledger
sono atomiche ([ADR 0019](../../adr/0019-transazioni-atomiche-nel-ledger.md)): un rifiuto intero
farebbe tornare a **zero euro** chi è stato via una notte, anche a caveau vuoto. Non sarebbe un
muro, sarebbe un guasto travestito da regola.

Quando il caveau è pieno davvero, «quanto ci sta» vale zero e il reddito si ferma del tutto — che è
il muro, e va detto al giocatore invece che lasciato scoprire guardando un numero che non sale.

---

## Deve vedere, deve decidere, può andare male

**Deve vedere:** quanto spazio è occupato e quanto ne resta; quanto costa il livello successivo e
quanti livelli restano; **che il reddito si è fermato**, e perché; cosa c'è dentro oltre al denaro,
quando gli oggetti esisteranno.

**Deve decidere:** quando smettere di accumulare contanti e portarli in banca, accettando la
traccia. E, quando ci saranno gli oggetti: cosa vale la pena tenere, dato che ogni oggetto è
spazio tolto ai contanti.

**Può andare male:** pieno, e il reddito si ferma. Perquisizione, e si svuota.

---

## Le decisioni prese, e cosa è stato scartato

| Decisione                                        | Alternativa scartata                                 | Perché                                                                                                                                |
| ------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Un tetto solo, condiviso da contanti e oggetti   | due tetti separati: euro e posti                     | due barre che non si parlano tolgono la scelta. Con un tetto solo, tenere un oggetto **costa** spazio ai contanti                     |
| L'ingombro di un oggetto **non** è il suo valore | ingombro proporzionale al valore                     | se coincidessero, un oggetto sarebbe solo contante con un nome diverso. La differenza è ciò che rende il caveau un problema di scelta |
| Livelli finiti con un tetto dichiarato           | livelli infiniti con costo che cresce più della resa | in un idle «costa più di quanto renda» è un bersaglio mobile. Un tetto si verifica con un test e non si ritara                        |
| Varianza zero: nessun furto casuale              | furto con probabilità, e difese da comprare          | duplicherebbe calore e indagini, e darebbe varianza al dominio la cui unica virtù è non averne. Costerebbe a D017 un tick e l'Rng     |
| L'orizzonte dello studio è il caveau **intero**  | studiare solo ciò che la fetta 02 costruisce         | la capienza in euro va decisa una volta sola: se la si sceglie senza sapere degli oggetti, il giorno degli oggetti si rifà            |

---

## Cosa questo studio ha trovato

Tre cose, e nessuna delle tre riguardava il caveau quando si è cominciato.

**1. L'etichetta non misurava la tracciabilità.** La legge 1 della visione dice che ogni fonte di
guadagno paga in almeno una di quattro monete — liquidità, tracciabilità, varianza, attenzione — e
l'etichetta aveva una voce per tre di esse. Il caveau è il primo strumento che lo rende visibile,
perché è quello che paga **solo** in quella moneta: senza la nona voce, la sua unica virtù non
compare da nessuna parte e sembra un deposito vincolato peggiore. Ne discende la voce 4.

**2. [D017](../../delega/D017-il-caveau.md) sbaglia sul pagamento in contanti.** La delega scrive
che pagare l'ampliamento in contanti renderebbe l'operazione «impossibile proprio quando serve».
Non è vero: se il caveau è pieno di contanti il giocatore ha per definizione i soldi per pagare, e
**il pagamento stesso libera spazio**. L'argomento va tolto, non ribaltato: la scelta del
pagamento è comunque trasversale.

**3. La capienza deve avere la forma giusta adesso.** È il vincolo su `capacityFor` descritto in
_Lo spazio_. Costa zero oggi e costa una riscrittura fra tre fette.

---

## Domande aperte

| Domanda                                                       | Chi la chiude                                                                                                                                                                                                                                              |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Quanto costa con ognuno dei due strumenti**                 | [D017](../../delega/D017-il-caveau.md), eseguendola, e il numero va tarato contro `ATM_FEE`. Il **meccanismo** invece è chiuso: [ADR 0027](../../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) e [D019](../../delega/D019-il-pagamento.md) |
| **I numeri**: quanti livelli, quale curva di capienza e costo | [D017](../../delega/D017-il-caveau.md), eseguendola. Vanno in `balance/constants.ts`, con il bersaglio in `balance/targets.ts`                                                                                                                             |
| **L'ingombro degli oggetti**: come si dichiara                | il primo dominio che produce oggetti — black market o aste di box                                                                                                                                                                                          |

---

## La metà kernel

Non è in questa scheda, e non è una dimenticanza.

Le dodici domande sul kernel — ha stato, ticchetta, in quale `ORDER`, cosa fa con un `elapsed`
grande, quali `Reason` introduce, quali pool tocca — sono il lavoro di
[D018](../../delega/D018-la-scheda-di-dominio.md), e si rispondono **leggendo il codice**. Il
codice del caveau non esiste ancora.

Due risposte però sono già decise qui, perché sono scelte di gioco e non di implementazione, e
D018 le troverà scritte:

- **Il caveau ha stato** — il livello — quindi ha `save`, `load` e `reset`.
- **Il caveau non ticchetta e non usa l'Rng.** Discende dalla varianza zero: senza furto casuale
  non c'è niente che debba accadere da solo.
