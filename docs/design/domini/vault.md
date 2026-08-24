# Caveau — scheda di dominio

- **Stato:** **completa.** La metà di gioco è del 2026-08-20, riletta contro il codice il
  2026-08-21 quando [D017](../../delega/D017-il-caveau.md) è stata eseguita — cosa è cambiato sta
  in fondo, sotto _Cosa l'esecuzione ha smentito_. La **metà kernel** e la sezione _Cosa prende in
  prestito, e cosa presta_ le ha compilate [D018](../../delega/D018-la-scheda-di-dominio.md) lo
  stesso giorno, leggendo `src/core/domains/vault/`.
  **Riletta una terza volta il 2026-08-24**, preparando [D042](../../delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md):
  quella rilettura ha trovato **un errore di unità** in _Lo spazio_ e **una riga sbagliata** in
  _Deve vedere_. Tutte e due sono corrette qui sotto, con il segno di cosa erano prima
- **Data:** 2026-08-20, riletta il 2026-08-21 e il 2026-08-24
- **Costruito da:** [D017](../../delega/D017-il-caveau.md), fetta 02 — ma solo per i **contanti**.
  Oggetti, ingombro e perquisizione arrivano con le fette successive
- **A monte:** la casa e le quattro forme di saturazione nella
  [visione](../../prodotto/visione.md), il blocco 3 della
  [mappa funzionale](../mappa-funzionale.md)

Questa scheda è la prima compilata, ed è stata l'unica a descrivere un dominio **che non esisteva
ancora**. L'obbligo che si era data — «quando D017 sarà eseguita, la scheda va riletta contro il
codice e corretta dove ha sbagliato» — **è stato pagato**, e quello che ne è uscito sta in fondo.
Una scheda che descrive ciò che credevamo di scrivere è peggio di nessuna scheda.

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

**Le righe 1 e 2 adesso si guardano, e in un posto solo.** Da
[D034](../../delega/D034-le-serie-degli-strumenti.md) i contanti hanno la loro serie di candele sul
cruscotto, e quando il caveau è pieno le candele si appiattiscono **sempre allo stesso livello** e
restano lì finché il giocatore non deposita. Non è una curva che si strozza: è un muro, che è
esattamente la differenza per cui i livelli sono finiti — e adesso la si vede invece di doverla
dedurre da `VAULT_CAPACITIES`.

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

Il caveau ha **una** capienza, misurata in **ingombro**, e ci stanno dentro due cose che si fanno
concorrenza.

| Cosa         | Quanto spazio occupa                                                 |
| ------------ | -------------------------------------------------------------------- |
| **Contanti** | una **densità dichiarata**: tanti euro per unità di ingombro, ferma  |
| **Oggetti**  | un **ingombro** dichiarato dall'oggetto, che **non è il suo valore** |

```
ingombro disponibile per i contanti  =  spazio del livello  −  ingombro degli oggetti
capienza in euro dei contanti        =  ingombro disponibile  ×  densità dei contanti
```

Un diamante da 50.000 € può ingombrare 500; un quadro da 5.000 € può ingombrarne 4.000. Il
giocatore impara da solo a tenere dentro **valore denso**, e scopre che i contanti sono il valore
meno denso che esista.

**Fino al 2026-08-24 questa sezione diceva che l'ingombro si misura in euro**, e la ragione scritta
era che così la sottrazione non ha bisogno di conversioni. Funzionava, ed è per questo che è durata
due fette. Il difetto è che «un euro di denaro» e «un euro di ingombro» sono la stessa unità su due
grandezze che non si sommano: il giorno degli oggetti quella sottrazione si scrive, il tipo dice che
va tutto bene, e a valle esce una capienza sbagliata — che il Ledger fa rispettare, e che il
giocatore scopre come stipendio che non arriva. Con D042 l'ingombro prende un tipo suo, `Space`, e la
conversione diventa **una sola e dichiarata**: l'[ADR 0051](../../adr/0051-lo-spazio-di-un-caveau-non-e-una-somma-di-denaro.md).

**Il kernel non cambia per reggere questa forma**, ed è ancora vero dopo la correzione. Il Ledger
controlla `saldo + importo > capienza` con una capienza di tipo `Money`; l'[ADR 0025](../../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)
la trasforma da costante a **funzione**, e la funzione del caveau fa le due righe qui sopra prima di
rispondere. Chi la riceve continua a ricevere degli euro, e non sa che dietro c'è un volume.

**Conseguenza per gli oggetti: nessuna, ed è il punto.** La capienza che il Ledger riceve è una
funzione che il caveau **possiede**, quindi il giorno degli oggetti la sottrazione entra dentro
quella funzione e nient'altro si muove — nessun parametro nuovo, nessuna firma diversa, nessun test
in più. Costruire oggi un posto dove mettere un ingombro che nessuno produce sarebbe
generalizzazione speculativa, cioè la cosa che l'
[ADR 0014](../../adr/0014-una-fetta-verticale-alla-volta.md) vieta.

**E una cosa che il tetto non è**, perché è la prima che sembra rotta: 250.000 € di contanti
diventano ridicoli quando il patrimonio è a 1e12, e quello è il **funzionamento**, non la scadenza.
Con l'ingombro slegato dal valore, un quadro da dieci milioni dichiara ingombro 4.000 ed entra lo
stesso: il tetto non ha mai impedito agli oggetti di valere tanto, e togliendolo si toglierebbe solo
la forma 1 della saturazione.

---

## L'ampliamento

- **Livelli finiti, con un tetto dichiarato.** Il caveau arriva a un ultimo livello e lì si ferma.
  Il giocatore lo vede dal primo secondo — «caveau 1 di 9» — e sa che i contanti hanno una fine.
  Quanti siano è **una costante sola**: [D042](../../delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md)
  trasforma l'elenco in una curva, quindi allungare la scala diventa cambiare un numero invece di
  scriverne tredici. D017 ne aveva scelti cinque; D042 ne dichiara nove, e il muro finale resta
  dov'era.
- Ogni livello dà più spazio e costa di più. **E ogni prezzo sta appena sotto la capienza del
  livello da cui si paga**: per pagare in contanti bisogna poterli tenere, quindi il caveau va
  quasi riempito prima di potersi ampliare. È il muro che insegna sé stesso, ed è una scelta di
  D017 che questa scheda non aveva previsto. Con D042 quella frase diventa una **regola** — il prezzo è
  una frazione dichiarata della capienza di partenza — invece di quattro numeri allineati a mano:
  dei quattro, uno era già scivolato al 90,7% senza che nessuno se ne accorgesse.
- **Si paga in contanti o con la carta, a prezzi diversi.** Il meccanismo — il **listino** di
  un'azione — è dell'[ADR 0027](../../adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md)
  e lo costruisce [D019](../../delega/D019-il-pagamento.md); il caveau è il primo a offrirne due.
  La taratura ha un vincolo: senza il calore, lo strumento più economico vincerebbe sempre, quindi
  la differenza di prezzo va misurata contro la **commissione del bancomat** — pagare con la carta
  conviene solo se lo sconto supera quanto costa portarci i contanti.

  **Come è stata risolta**, perché la riga qui sopra dice il criterio e non la risposta: lo sconto
  della carta è di **due euro** a ogni livello, cioè **sotto** i 2,50 € di `ATM_FEE_FLOOR`. Ne discende
  che chi ha i contanti li spende, perché convertirli costerebbe più di quanto lo sconto faccia
  risparmiare, e chi ha già del denaro sulla carta paga con quella. Con cosa paghi è **dove hai i
  soldi**, e nessuna delle due voci è arredamento. Uno sconto più grande — cinquanta euro, per dire
  — ucciderebbe i contanti in un colpo solo. È la taratura più fragile della fetta, ed è la prima
  cosa da rifare quando il calore darà alla carta un prezzo da pagare.

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

**Deve vedere:** quanto spazio è occupato e quanto ne resta; **cosa compra** il livello successivo e
quanti livelli restano; **che il reddito si è fermato**, e perché; cosa c'è dentro oltre al denaro,
quando gli oggetti esisteranno.

> **La prima riga diceva «quanto costa il livello successivo», e la scheda aveva torto.** Mostrare
> il prezzo sulla pagina vuol dire nominare un'opzione di listino fuori dal flusso di pagamento, che
> è ciò che **R24** vieta e che l'[ADR 0042](../../adr/0042-il-pagamento-e-un-flusso-solo.md) ha
> deciso **dopo** che questa scheda era stata scritta. Vince l'ADR, che è più recente ed è
> meccanizzato. La pagina dice cosa l'ampliamento **compra** — lo spazio e la capienza che ne esce —
> e il prezzo resta dove si sceglie con cosa pagarlo. Corretta il 2026-08-24, preparando
> [D042](../../delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md).

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

| Domanda                                                       | Chi la chiude                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~Quanto costa con ognuno dei due strumenti~~                 | **chiusa** da [D017](../../delega/D017-il-caveau.md): la carta costa **due euro in meno** a ogni livello, e quel numero è tarato contro `ATM_FEE_FLOOR` invece che scelto — sopra la commissione i contanti diventerebbero una voce che nessuno sceglie. Lo verifica `vault_card_discount` in `targets.ts` |
| ~~I numeri: quanti livelli, quale curva di capienza e costo~~ | **chiusa** da [D017](../../delega/D017-il-caveau.md): **cinque** livelli, da 1.000,00 € a 250.000,00 €, con ogni prezzo appena sotto la capienza del livello da cui si paga. Il bersaglio è `seconds_to_first_wall`: il muro morde fra i 60 e i 120 secondi di gioco                                       |
| ~~In quale **unità** si misura lo spazio~~                    | **chiusa** da [D042](../../delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md) e dall'[ADR 0051](../../adr/0051-lo-spazio-di-un-caveau-non-e-una-somma-di-denaro.md): non in euro. `Space` è un tipo suo, i contanti lo occupano a una densità dichiarata, e la conversione vive in un punto solo          |
| **L'ingombro degli oggetti**: con quale numero                | il primo dominio che produce oggetti — black market o aste di box. Il **posto** dove entra non è più una domanda: è dentro `cashCapacityFor`, e non muove nient'altro                                                                                                                                      |

---

## Cosa prende in prestito, e cosa presta

Sezione 8 della [scheda](README.md), aggiunta e compilata da
[D018](../../delega/D018-la-scheda-di-dominio.md).

**Prende in prestito:** il pool `cash` — e non è suo, è la cosa che conserva
([ADR 0017](../../adr/0017-il-denaro-e-plurale.md)); il pool `card`, che è la seconda voce del suo
listino; e il listino stesso (`contracts/payment.ts`). Gli **oggetti**, che un giorno conserverà
insieme al denaro, non li prende in prestito da nessuno: non esistono ancora, e il grilletto è nel
[registro](../../roadmap-fette.md).

**Presta la cosa più usata del progetto: la propria capienza.** `capacityFor(level)` è una funzione
del caveau, e la consegna il bootstrap a due destinatari che non si conoscono — il **Ledger**, che
la fa rispettare su ogni transazione, e il **reddito**, che ne ricava quanto dello stipendio
maturato può entrare. Il bancomat la interroga a sua volta, per argomento, prima di mostrare
l'anteprima di un prelievo.

Nessuno dei tre importa il caveau. È il caso che ha insegnato al progetto come si presta qualcosa
senza aprire una freccia fra domini: **si dichiara una funzione, e la consegna chi ha entrambi i
capi sotto mano** ([ADR 0024](../../adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)).

---

## Questo dominio si amministra?

**Sì**, e la sua destinazione è `vault` (`DOMAIN_SCREENS`). Il caveau è un muro che si incontra, non
un posto dove si va spesso — e la pagina gli tocca lo stesso, perché c'è qualcosa da amministrare:
il livello si amplia, e con due strumenti a prezzi diversi.

Quello che il giocatore incontra **senza andarci** è l'allarme — il reddito si è fermato — e infatti
non vive sulla pagina: sta in `components/vault/VaultAlarm.vue`, e compare sulla pagina del
bancomat. È l'altra
metà della regola dell'[ADR 0033](../../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md): un
pezzo di un dominio può comparire altrove, **ma esce dalla sua cartella** — ed è precisamente ciò che
il caveau aveva violato finendo dentro il pannello dei contanti.

---

## La metà kernel

Compilata da [D018](../../delega/D018-la-scheda-di-dominio.md) leggendo
`src/core/domains/vault/`, non il disegno.

| #   | Domanda                               | Caveau                                                                                                                                                                   |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Ha stato?                             | **sì**: `{ level: number }`, un numero solo. Capienza, prezzo e livelli restanti si **calcolano** da lì — salvarli sarebbe salvare due volte lo stesso fatto             |
| 2   | Ticchetta? In quale `ORDER`?          | **no**, e si registra lo stesso. `ORDER.ECONOMY`, che senza `tick` decide solo l'ordine di salvataggio e caricamento — e conta: `ECONOMY` carica prima di `INCOME`       |
| 3   | Cosa fa con un `elapsed` grande?      | **niente di suo — ma è interrogato dentro il tick di un altro.** È la sua capienza a decidere quanta parte di quell'`elapsed` diventa denaro                             |
| 4   | Soglie che si attraversano?           | **sì, ed è il primo «sì» del progetto.** Pieno e non pieno è una soglia che il giocatore riattraversa depositando. Riguarda il recupero a blocchi                        |
| 5   | Cosa serve fuori dal `SystemContext`? | `ledger` per costruzione (ADR 0024): un ampliamento parte dalla UI, fuori da ogni `tick`                                                                                 |
| 6   | Eventi, e domini importati?           | **nessun evento**. **Non importa nessun dominio**, e nessun dominio importa lui: è il bootstrap a consegnare `capacityFor` a chi la usa                                  |
| 7   | Quali `Reason` introduce?             | `reason.vault.expand`. Più un codice suo, `error.vault.max_level` — che è un esito, non un guasto: il caveau finisce, e il giocatore lo sa dal primo secondo             |
| 8   | Tocca il denaro? Quali pool?          | **sì**: `spend` sul pool scelto, con `accepts` **generato dal listino** e per livello. Ed è il solo che **dichiara una capienza**: `Ledger.capacities` è la sua (INV-18) |
| 9   | Conti propri per entità?              | **no**. Il giorno degli oggetti sarà la prima domanda da rifare: un oggetto ha un'identità, e un'identità tende a volere un conto                                        |
| 10  | Liste storiche?                       | **no**. Lo stato è un intero                                                                                                                                             |
| 11  | Sapere che giorno è?                  | **no**                                                                                                                                                                   |
| 12  | Usa l'Rng?                            | **no**, e discende dalla varianza zero: senza furto casuale non c'è niente che debba accadere da solo                                                                    |

Il `load` merita una riga in più, perché è il punto in cui questo dominio è più fragile di quanto
sembri: controlla il livello **campo per campo** — intero, non negativo, non oltre il massimo — e
non «è un oggetto» (INV-20). Un livello frazionario o fuori scala non fa rumore: produce una
capienza sbagliata, che il Ledger fa rispettare, e che il giocatore scopre come stipendio che non
arriva.

**Numeri di gioco introdotti.** D017 ne aveva lasciati tre, tutti elenchi: `VAULT_CAPACITIES`,
`VAULT_PRICES_CASH` e `VAULT_PRICES_CARD`, tredici cifre in tutto.
[D042](../../delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md) li sostituisce con **cinque
costanti e due regole**: la densità dei contanti, il fattore di crescita dello spazio, quanti
livelli esistono, il prezzo come frazione della capienza di partenza, e lo sconto della carta. Le
tre liste si **calcolano**, e `MAX_LEVEL` si legge dal numero di livelli.

**Bersagli lasciati:** `seconds_to_first_wall` (60–120 secondi), `vault_card_discount`
(0,50 €–2,49 €, tutto sotto `ATM_FEE_FLOOR`) e, con D042, **`vault_max_cash`** — il muro finale, che
per due fette è stato l'unico numero del caveau che nessun test guardava. È il solo dei tre domini a
lasciarne più di uno.

---

## Cosa l'esecuzione ha smentito

Tre cose, e nessuna delle tre è una decisione di gioco che sia cambiata.

**1. «Conseguenza per D017: nessuna» era vera per la forma, non per il posto.** La sezione _Lo
spazio_ prometteva che la capienza consegnata al Ledger fosse «una funzione che il caveau
possiede», e così è — `capacityFor(level)`, in `vault/rules.ts`, con il livello stretto fra zero e
il massimo. Il giorno degli oggetti la sottrazione entra lì dentro e nient'altro si muove, esattamente
come scritto. Quello che la scheda non poteva sapere è **chi la chiama**: non il caveau, ma il
bootstrap, che la consegna al Ledger insieme a `poolCapacity` per tutti gli altri pool
([ADR 0025](../../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)).

**2. Il collegamento con il bancomat era descritto e non c'era.** La tabella _A quali due domini si
collega_ dice che il bancomat «è la valvola» e «non cambia di una riga per diventarlo». È cambiato
di quindici: l'anteprima di un prelievo deve sapere se il denaro in arrivo **ci sta**, altrimenti
mostra una scomposizione esatta di un'operazione che il Ledger poi rifiuta. La capienza gli arriva
per argomento — nessun dominio ne importa un altro — ma la riga «non cambia» era ottimista.

**3. «Il reddito accredita quanto ci sta» costa più di quanto la scheda lasciasse intendere.** La
frase è giusta e la decisione di gioco pure. Quello che non si vedeva è che il reddito, per farlo,
deve **sapere quanto ci sta prima di chiedere** — cioè ricevere lo spazio per costruzione, il che
tocca la firma di `createIncome`, il bootstrap e nove test. È la parte più cara della delega, ed è
anche l'unica che senza la scheda sarebbe stata scoperta a giocare.
