# ADR 0035 — Una capienza ferma chi sale, non chi si trova già in alto

- **Stato:** **Accettata** — [D028](../delega/D028-una-capienza-ferma-chi-sale.md): il confronto
  con il saldo corrente in `Ledger.validate`, `roomIn` spostata in `contracts/pools.ts` e usata da
  entrambi i punti che rispondono «quanto ci sta ancora», e l'**INV-23**. Rotta di proposito in due
  modi — il controllo di prima, e l'aggiramento plausibile «se sei già sopra il tetto non vale più»
- **Data:** 2026-08-21

## Contesto

Il Ledger fa rispettare la capienza di un pool dall'[ADR 0025](0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md):
chiede il tetto a una funzione e rifiuta la transazione se il saldo che ne risulterebbe lo supera.

Scritto così, il controllo guarda **un solo numero**: il saldo dopo. Non guarda da dove viene.

Finché un saldo non può superare il tetto la differenza non esiste, e per due fette non è esistita.
Ma un saldo oltre il tetto **è raggiungibile**, e per più di una strada:

- un salvataggio scritto a mano — è il caso che ha rivelato il difetto;
- un salvataggio più vecchio della curva di bilanciamento, se un giorno un livello del caveau
  valesse meno di prima;
- qualunque cosa, in futuro, riduca una capienza invece di ampliarla — un sequestro, una perdita,
  un evento che restringe.

E quando succede, il controllo non stringe il tetto: **chiude la partita**. Un pool oltre la
capienza rifiuta ogni transazione che lo tocchi, **anche quelle che lo fanno scendere**, perché il
risultato resta sopra comunque. Depositare non si può, prelevare non si può, ampliare il caveau non
si può — e ampliare era l'unica uscita che il gioco offriva. Il reddito, che nasce in contanti, tace.

Il sintomo non somiglia alla sua causa, ed è la parte che è costata tempo: sullo schermo non c'è un
muro, c'è un'applicazione che sembra rotta. Il patrimonio netto non si muove, il grafico è piatto, e
ogni pulsante porta sotto di sé la frase _«Contanti non tiene più di 1.000,00 €: ci stanno ancora
-1.008.051,70 €»_ — che dichiara il difetto due volte, perché **«ci stanno ancora meno di niente»
non è una quantità**.

Quella seconda metà ha una radice sua. `fits` era `capacity.minus(current)`, scritto identico in due
punti — `Ledger.validate` e `previewOf` del bancomat — mentre a un terzo punto la stessa domanda era
già stata posta bene: `roomIn`, in `domains/vault/rules.ts`, dichiara nel proprio commento «mai
negativo» e ha un test che lo prova. Tre risposte alla stessa domanda, due sbagliate nello stesso
modo.

## Decisione

**La capienza rifiuta una transazione solo se il saldo sale.** Un pool già oltre il proprio tetto
può muoversi verso il basso o restare fermo; non può salire di un centesimo.

Ne discende l'invariante che la regola rende vera:

- **INV-23** — nessuna transazione può far **crescere** un pool oltre la sua capienza. Un saldo che
  si trova già oltre non è congelato: può solo scendere.

E la seconda metà, che senza la prima resterebbe un dettaglio cosmetico: **«quanto ci sta ancora»
si chiede a una funzione sola**, `roomIn`, che sale da `domains/vault/rules.ts` a
`contracts/pools.ts` — l'unico livello che il kernel, i domini e lo store possono raggiungere tutti
e tre (R13 vieta a un `rules.ts` di importare valori dal Ledger, quindi il verso opposto non era
percorribile).

È la stessa mossa di [D014](../delega/D014-dominio-bancomat.md) con `capacityOf`, e la ragione è
scritta lì: _«due funzioni che rispondono alla stessa domanda con due valori diversi sono il difetto
che INV-18 rende impossibile, quindi è stata rifatta altrove invece che affiancata»_. Qui le
funzioni erano tre.

## Alternative scartate

- **Non toccare il kernel, e sbloccare la partita con «partita nuova».** È la risposta più piccola,
  e regge finché il caso è solo un salvataggio fatto a mano da chi sviluppa. Cade sul fatto che il
  caso **non** è solo quello: una capienza che un giorno si restringe è nel gioco che la
  [visione](../prodotto/visione.md) descrive — l'indagine sequestra, il mondo va anche contro — e il
  giorno in cui succede il giocatore perde la partita per un difetto, non per una scelta.
- **Sospendere la capienza per chi è già sopra.** Cioè: se il saldo corrente supera il tetto, non
  controllare niente. È l'aggiramento più plausibile — una riga, e la partita si sblocca — ed è
  quello contro cui il test «ma non può salire di un centesimo» è stato rotto di proposito. Rende
  il tetto una porta che si apre da sola una volta superata: chi si trova sopra può salire senza
  limite, ed è esattamente il contrario di ciò che una capienza significa.
- **Lasciare `fits` negativo e correggerlo nella traduzione.** Sposta il difetto dal numero alla
  frase, cioè in un posto che nessun test guarda, e lo lascia sbagliato per chiunque legga il campo
  invece del testo — il reddito, per esempio, che da `roomIn` decide quanto accreditare.
- **Un secondo codice d'errore per «sei già oltre».** Aggiunge una parola al vocabolario del
  rifiuto per raccontare uno stato che il giocatore non ha causato e non può correggere. Il
  rifiuto giusto in quel caso è **nessun rifiuto**: la transazione che scende va accettata.

## Conseguenze

- Il caso «già oltre il tetto» ha adesso tre test, e nessuno esisteva prima: la regola nuova non ha
  reso rosso **nessun** test del progetto, ed è la misura di quanto quel caso fosse scoperto.
- `domains/vault/rules.ts` perde `roomIn` e non perde niente d'altro: il caveau resta l'unico a
  sapere quanto vale la propria capienza, e smette di essere l'unico a saper rispondere «quanto ci
  sta ancora» — che è una domanda su un pool, non sul caveau.
- La partita di sviluppo di questa macchina torna giocabile senza toccare il file: i contanti
  possono scendere, quindi il deposito, il prelievo e l'ampliamento del caveau funzionano di nuovo.
  Non è la ragione per cui la decisione è stata presa, ma è la prova che era vera.
- **Un limite, dichiarato:** un saldo oltre il tetto resta oltre finché il giocatore non lo
  consuma. Il gioco non lo riporta dentro da solo, e non deve: confiscare denaro al caricamento
  sarebbe una punizione per uno stato che il giocatore non ha scelto.
