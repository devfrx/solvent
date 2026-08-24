# ADR 0053 — Un miglioramento dichiara il tempo in cui rientra

- **Stato:** **Accettata** — [D044](../delega/D044-il-reddito-e-un-elenco-di-fonti.md) l'ha
  costruita il 2026-08-24. Il meccanismo è `pricesOf` in `domains/income/rules.ts`, che calcola ogni
  prezzo come incremento di resa per `INCOME_PAYBACK_SECONDS`, e il bersaglio è
  `income_level_payback`, che misura il rientro su **ogni** livello di **ogni** fonte partendo dal
  listino e dalle rese — mai dalla costante, o direbbe che un numero è uguale a sé stesso
- **Data:** 2026-08-24
- **Nasce da:** una sessione di gioco. «Compro gli straordinari a 800 €?» è una domanda sul nome, e
  la risposta è che sotto quel nome non c'è una scala: ci sono tre numeri — un prezzo, un
  moltiplicatore, un booleano — che nessuna regola lega fra loro

## Contesto

La [visione](../prodotto/visione.md) dichiara la legge della crescita, e la dichiara come un
rapporto:

> Un miglioramento ha due numeri: quanto costa e quanto rende. Se il costo cresce come la resa, ogni
> livello si ripaga **nello stesso tempo del precedente**, per sempre. Se la resa crescesse più del
> costo il gioco esploderebbe; se crescesse meno si impianterebbe. È l'unico rapporto che conta.

Nessuna riga di codice lo impone, e i due miglioramenti che il gioco ha oggi ci arrivano da due
strade diverse.

Il **caveau** ha una scala vera da [D042](../delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md): il
prezzo di un ampliamento è una frazione dichiarata della capienza del livello da cui si paga. È una
regola, ed è verificata — ma non è questa regola. Il suo prezzo è tarato sul **muro** («per pagare in
contanti bisogna poterli tenere»), non sul rientro, e la sua ragione di gioco è un'altra.

Il **reddito** non ha una scala per niente. Ha un booleano, un prezzo di 800,00 € e un
moltiplicatore ×1,5: tre numeri scelti uno alla volta, di cui nessuno può contraddire gli altri
perché nessuna regola li mette in relazione. Il rapporto della visione lì non è violato — è
**assente**, che è peggio, perché un rapporto assente non può diventare rosso.

E c'è la lezione di D042, che vale la pena avere davanti: i quattro prezzi del caveau scritti a mano
dicevano di essere il 90% della capienza, e **uno era già scivolato al 90,7%** senza che nessuno se
ne accorgesse. Non era un errore di distrazione: era una regola tenuta in piedi da numeri allineati
a mano invece che da un calcolo.

## Decisione

**Il prezzo di un miglioramento che compra resa non si dichiara. Si dichiara il tempo in cui quel
miglioramento rientra, e il prezzo si calcola.**

    prezzo del livello = (quanto rende in più) × (secondi di rientro dichiarati)

Il numero che vive in `balance/` non è più un prezzo: è un **tempo**. I prezzi sono ciò che ne
discende.

Ne discendono tre cose, e la terza è quella per cui questa decisione vale la pena.

**1 · Il rapporto della visione diventa vero per costruzione.** Non c'è un modo di scriverlo
sbagliato: il rientro di ogni livello è il numero dichiarato, sempre, a ogni livello e per ogni
fonte. Non serve tenere allineate due curve, perché la seconda non esiste.

**2 · Il bilanciamento ha una leva sola, e la leva si legge.** «Un livello si ripaga in cinque
minuti» è una frase che un giocatore capisce e che chi bilancia può spostare sapendo cosa sta
spostando. «Il livello tre costa 4.860 €» non è né l'una né l'altra cosa.

**3 · Il prezzo smette di essere ciò che distingue due miglioramenti.** Se ogni livello di ogni
fonte rientra nello stesso tempo, «quale compro?» non è più «quale costa meno»: è **in quale pozza
voglio che atterrino**, con quale traccia e sotto quale tetto. La scelta si sposta dal prezzo al
regime dell'[ADR 0052](0052-un-guadagno-dichiara-dove-atterra.md), che è dove il gioco la vuole — la
tensione contanti contro carta invece di un confronto fra due cartellini.

## A cosa si applica, e a cosa no

**Si applica a un miglioramento che compra resa**: più euro al secondo, più affitto, più margine.

**Non si applica** a un miglioramento che compra **capienza** (il caveau), **tempo** (una scadenza
più corta) o **accesso** (un dominio che si apre). Quelli non hanno un rendimento da cui dividere, e
forzarli in questa forma vorrebbe dire inventargliene uno.

Il caveau resta com'è, e non è un'eccezione tollerata: è un miglioramento di specie diversa, con una
regola sua che [D042](../delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md) ha già scritto e
verificato.

## Alternative scartate

- **Una lista di prezzi scritta a mano.** È ciò che il caveau aveva fino a D042, ed è la ragione per
  cui quella delega esiste: quattro numeri che dicevano di seguire una regola, e uno che non la
  seguiva più.
- **`costo = costo₀ × k^livello`, con la resa che cresce a parte.** È l'idioma classico degli idle, e
  il suo difetto è che sono **due curve indipendenti che devono combaciare**. Se `k` e il fattore di
  crescita divergono di un decimale il gioco esplode o si impianta, e nessuno se ne accorge finché
  non è tardi — perché ognuna delle due curve, guardata da sola, sembra ragionevole. Questa ADR toglie
  la seconda curva invece di sorvegliarla.
- **Prezzo come frazione della resa totale invece che dell'incremento.** Il rientro resterebbe
  costante, ma varrebbe `g / (g − 1)` volte i secondi dichiarati: il numero scritto in `balance/`
  non sarebbe il numero vero. Un valore che significa una cosa diversa da come si legge è un
  commento che invecchia travestito da costante.
- **Un rientro che cresce col livello**, cioè livelli alti proporzionalmente più cari. È il modo
  classico di far finire una scala, e qui non serve: la scala finisce perché i livelli sono
  **finiti**. Un rientro crescente sarebbe anche un bersaglio mobile — esattamente ciò che D042 ha
  rifiutato scegliendo livelli finiti invece di una curva che si strozza da sola.

## Conseguenze

- **`balance/` guadagna un numero il cui nome è un tempo.** Chi lo cambia sa di stare cambiando il
  ritmo del gioco, non un cartellino.
- **Un bersaglio misura il rientro direttamente**, una volta, invece di un test per livello. Il
  rientro è la proprietà; i prezzi sono ciò che ne esce.
- **Aprire una fonte costa più del livello successivo, e non è un difetto.** Aprire dà tutta la resa
  base; il livello dopo dà solo l'incremento. Per euro di reddito comprato il prezzo è identico —
  è la proprietà, vista da vicino.
- **I domini futuri che vendono resa** — impresa, immobiliare, negozio — trovano una forma da
  riusare invece di inventarne una ciascuno. Non è un contratto condiviso e non deve diventarlo
  finché non ci sono due usi veri: il grilletto sta nel [registro YAGNI](../roadmap-fette.md).
- **Il criterio della cadenza di salvataggio va riletto.** `AUTOSAVE_SECONDS` è derivato dal prezzo
  dell'acquisto più economico che il gioco vende; con i prezzi legati alla resa, quel prezzo smette
  di essere fermo e cresce col reddito. Il criterio sopravvive — i prezzi crescono **insieme** a
  ciò che si perde — ma il margine si stringe, e va rimisurato invece di ereditato.
