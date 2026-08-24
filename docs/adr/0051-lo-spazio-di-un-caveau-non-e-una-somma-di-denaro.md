# ADR 0051 — Lo spazio di un caveau non è una somma di denaro

- **Stato:** **Proposta** — il meccanismo che la impone non esiste ancora. La costruisce
  [D042](../delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md), e passa ad _Accettata_ nel commit
  che porta il tipo `Space` e il test che lo tiene separato dal denaro
- **Data:** 2026-08-24

## Contesto

Il caveau ha una capienza, e dall'[ADR 0025](0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)
il Ledger la **chiede** invece di leggerla. La funzione che risponde è `capacityFor(level)`, in
`domains/vault/rules.ts`, e ritorna un `Money`.

Finché dentro c'è solo denaro, un tetto misurato in euro è la cosa più semplice che funzioni, e per
due fette lo è stata. La [scheda del dominio](../design/domini/vault.md) però dichiara che il caveau
conserva **contanti e oggetti**, e che l'ingombro di un oggetto **non è il suo valore** — un quadro
da 5.000,00 € può ingombrare 4.000, un diamante da 50.000,00 € può ingombrarne 500. Per far tornare
i conti la scheda è costretta a una frase che non si può dire a un giocatore:

> L'ingombro è espresso nella stessa unità della capienza, cioè in euro.

Dentro quella frase c'è un errore di categoria, e non è un dettaglio di gusto. Un euro che misura
denaro e un euro che misura ingombro sono la stessa unità usata per due grandezze che non si
sommano: la prima si può spendere, la seconda no; la prima cresce con la partita, la seconda con la
stanza. Sono uguali solo perché nessuno le ha ancora messe nella stessa somma.

**Il difetto è già scritto, e non ha ancora fatto rumore.** `capacityFor` ritorna `Money`; il giorno
in cui l'ingombro degli oggetti entra in quella sottrazione, il tipo dice che tutto va bene mentre
si sta sottraendo un volume da una somma di denaro. Il compilatore non ha modo di accorgersene, e a
valle il risultato è una capienza sbagliata — che il Ledger fa rispettare, e che il giocatore scopre
come stipendio che non arriva. È esattamente il sintomo che il `load` del caveau dichiara di temere
per un livello frazionario, con la differenza che qui non arriva da un salvataggio manomesso: arriva
da noi.

**Cosa non è il problema.** Non è la capienza a 250.000,00 €, e va detto perché è la prima cosa che
sembra rotta. Un tetto ai contanti che diventa ridicolo quando il patrimonio è a 1e12 non è un
numero scaduto: è la forma 1 della saturazione, ed è la spina dorsale del gioco — i contanti
smettono di essere una risposta, e l'unica via che resta è la carta, che lascia tracce
([visione](../prodotto/visione.md)). Chi apre questo ADR cercando il permesso di togliere quel tetto
non lo trova qui.

Non è nemmeno che gli oggetti oggi non ci starebbero. Ci starebbero: con l'ingombro slegato dal
valore, un quadro da dieci milioni dichiara ingombro 4.000 ed entra in un caveau da 250.000. La
scheda aveva già risolto quel problema, e questa decisione **non** lo risolve una seconda volta.

## Decisione

> **La capienza del caveau si misura in `Space` — un'unità di ingombro — e non in `Money`. Il
> denaro è un inquilino come gli altri: occupa spazio a una densità dichiarata.**

Ne discendono tre cose, e nessuna delle tre tocca il kernel.

1. **`Space` è un tipo branded**, come `Ticks` e `Seconds` dell'
   [ADR 0009](0009-passo-fisso-e-tipi-branded-per-il-tempo.md). Un `Money` non è assegnabile a uno
   `Space` e viceversa: la somma che questo ADR esiste per impedire non compila, invece di essere
   vietata da una convenzione che qualcuno rispetterà.

2. **La conversione è una, dichiarata, e vive nel caveau.** `CASH_PER_SPACE` dice quanti euro di
   contanti stanno in un'unità di ingombro; `cashCapacityFor(level)` moltiplica lo spazio libero
   per quella densità e ritorna un `Money`. È l'unico punto in cui le due grandezze si toccano.

3. **Il confine con il resto del gioco non si muove di una riga.** Il Ledger continua a ricevere un
   `Money` da `Capacities`; il reddito continua a ricevere uno spazio in euro; il bancomat continua
   a chiedere se un prelievo ci sta. Nessuno di loro sa che dietro c'è un volume, e nessuno deve
   saperlo: quello che cambia è **da cosa** quel numero è calcolato, non cosa significa per chi lo
   riceve.

## Perché il tipo branded e non un commento

Perché la classe di difetto che questo ADR chiude è **una somma fra due grandezze diverse**, e le
somme sbagliate non si vedono rileggendo: si vedono come un numero che è quello sbagliato. Il
progetto ha già scelto questa forma una volta, per il tempo, e la riga che la giustificava vale
identica qui — un `number` nudo al posto di `Ticks` è la stessa specie di errore di un `Money` al
posto di uno `Space`.

Un commento sopra `capacityFor` avrebbe protetto chi legge il commento. Il tipo protegge anche chi
non lo legge, che è il caso che conta: il giorno degli oggetti, chi scrive la sottrazione sta
lavorando in un altro dominio e non ha nessuna ragione di aprire questo file.

## Cosa questa decisione rende possibile, e cosa no

**Rende possibile** che il valore contenuto nel caveau non abbia un tetto, senza che il tetto dei
contanti si muova. Lo spazio è finito e dichiarato; la **densità** no. I contanti hanno una densità
dichiarata e ferma, quindi il loro muro resta esattamente dov'era; un oggetto dichiara la propria, e
un oggetto molto denso porta dentro molto valore senza togliere spazio a nessuno. È la lezione che
la scheda del dominio dice di voler insegnare — _«il giocatore impara da solo a tenere dentro valore
denso, e scopre che i contanti sono il valore meno denso che esista»_ — e fino a oggi non aveva un
posto nel codice dove essere vera.

**Non rende possibile** che i contanti scalino. La densità dei contanti è un numero di
bilanciamento, non una scelta del giocatore, e resta ferma: chi cerca in questo ADR la strada per
tenere in contanti un patrimonio da 1e12 sta cercando di rimuovere la forma 1 della saturazione, e
quella è una decisione della [visione](../prodotto/visione.md), non di qui.

## Alternative scartate

| Alternativa                                                           | Perché no                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Lasciare l'euro come unità dell'ingombro**                          | funziona, ed è la ragione per cui questa riga esiste invece di essere ovvia. Costa una spiegazione a ogni lettura, per sempre, e lascia il compilatore cieco sull'unica somma che non si deve fare. Il costo del cambiamento è una moltiplicazione oggi; fra tre fette è ogni chiamante dell'ingombro di un oggetto  |
| **`Space` come `number` invece che `Decimal` branded**                | un ingombro si somma e si sottrae come il denaro, e le stesse ragioni dell'[ADR 0006](0006-decimal-end-to-end-per-il-denaro.md) valgono identiche. Un `number` reintrodurrebbe la perdita di precisione nell'unica grandezza che deve tornare esatta perché il muro sia un muro                                      |
| **Un `Space` in `contracts/` invece che nel caveau**                  | oggi lo dichiara e lo consuma un dominio solo. Un contratto condiviso da un consumatore è la generalizzazione da un caso solo che l'[ADR 0014](0014-una-fetta-verticale-alla-volta.md) vieta. Il grilletto per spostarlo è il **secondo** dominio che dichiara un ingombro, ed è nel [registro](../roadmap-fette.md) |
| **Due capienze separate: euro per i contanti, posti per gli oggetti** | già scartata dalla [scheda](../design/domini/vault.md) e la ragione regge: due barre che non si parlano tolgono la scelta. Con un tetto solo, tenere un oggetto **costa** spazio ai contanti, ed è tutto il gioco del dominio                                                                                        |

## Conseguenze

- **Un tipo nuovo e una costante nuova**, tutti e due dentro `domains/vault/`. Niente entra in
  `contracts/` e niente entra nel kernel.
- **`capacityFor` cambia nome in `cashCapacityFor`**, perché adesso c'è più di una capienza e il
  nome vecchio direbbe quale solo a chi già lo sa. È l'unica firma pubblica che si muove, e la
  consegna il bootstrap.
- **La curva di bilanciamento si scrive in spazio**, non in euro. Le capienze in euro si
  **calcolano**, quindi smettono di essere un elenco che qualcuno tiene allineato a mano.
- **Il giorno degli oggetti la sottrazione entra in `cashCapacityFor`** e nient'altro si muove. È la
  promessa che la scheda aveva già fatto; questa decisione la rende vera nell'unità giusta.
