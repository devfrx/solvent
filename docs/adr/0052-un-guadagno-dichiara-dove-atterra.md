# ADR 0052 — Un guadagno dichiara dove atterra

- **Stato:** **Accettata** — [D043](../delega/D043-il-reddito-si-mette-in-regola.md) la esegue: la
  firma di `income(pool, amount, withheld)` la rende un errore di compilazione (**INV-27**), il
  conto `tax` la rende visibile nella partita doppia, e `income_tax_rate` ne sorveglia la taratura
- **Data:** 2026-08-24
- **Nasce da:** una sessione di gioco, e non da un audit. Il difetto non si vede leggendo il codice:
  si vede immaginando la stessa riga con un reddito di tre ordini di grandezza più grande

## Contesto

Il gioco ha **un** posto dove i soldi arrivano, e nessun documento l'ha mai deciso:

```ts
// src/core/domains/income/system.ts
const INCOME_POOL: Pool = 'cash'
```

È ciò che la fetta 01 poteva fare, quando la carta non aveva ancora niente da fare e il caveau non
esisteva. Non è mai stata una regola — è una costante che nessuno ha più riletto.

Ne discende una cosa che nessuno ha scelto: **il tetto dei contanti è il tetto di tutto il reddito
del gioco.** All'ultimo livello del caveau sono 256.000,00 €, e sopra quella cifra il reddito smette
di entrare — qualunque cosa lo produca, e per sempre.

Non è ciò che il caveau dice di essere. La sua [scheda](../design/domini/vault.md) lo descrive come
il posto che «tiene i contanti **anonimi**, e ne tiene pochi», e la
[visione](../prodotto/visione.md) dichiara la carta «tracciata · **illimitata**». Il tetto doveva
essere il prezzo dell'anonimato; è diventato il soffitto della partita.

**Finché il reddito è 12,00 €/s la differenza non si vede.** Il muro morde dopo ottanta secondi, il
giocatore versa al bancomat, e quel gesto **è** la lezione della fetta 02. Il bersaglio
`seconds_to_first_wall` esiste per tararlo, e lo fa bene.

Si vede quando il reddito cresce. La visione promette impresa, mercato, immobiliare, crypto,
prestiti con leva: domini che non aggiungono euro al secondo, ne aggiungono **cifre**. Con un
reddito di un milione al secondo il caveau si riempie **dentro un tick**, e la valvola del bancomat
va aperta a mano dieci volte al secondo. Il muro smette di essere una decisione e diventa una
mansione — e una mansione, in un idle, è il modo più veloce di far chiudere la finestra.

E c'è un caso in cui il gesto non è nemmeno **possibile**: uno stop-loss che scatta a finestra
chiusa, un affitto che matura, un dividendo che si accredita. La visione li promette tutti e tre e
ne fa un vincolo non negoziabile — _«gli strumenti per proteggersi devono esistere nello stesso
momento in cui esiste la cosa rischiosa»_. Nessuno dei tre può chiedere al giocatore dove mettere i
soldi, e nessuno dei tre può accettare un rifiuto: un pool pieno trasformerebbe una protezione in
una perdita.

## Decisione

**Ogni guadagno dichiara il pool in cui atterra. Non esiste un pool predefinito**, e nessun dominio
ne eredita uno per il fatto di essere arrivato prima.

Ne discendono tre regole, e la terza è quella che il codice di oggi viola.

**1 · A dichiarare è la fonte, non un interruttore del giocatore.** Il pool è una proprietà di
**cosa produce** il denaro — un lavoro in nero paga in banconote, un'impresa registrata paga su un
conto — non una preferenza che si cambia quando conviene. Il giocatore sceglie **quali fonti aprire**
e, dove la fonte lo permette, **sotto quale regime**: una scelta che si prende, non un interruttore
che si spamma.

**2 · Un guadagno dichiara un regime, non solo un pool.** Un regime è una coppia di dati — dove
atterra e quanto viene trattenuto lungo la strada — perché le due cose non si possono scegliere
separatamente: un pool senza tetto che non trattiene niente domina sempre, e la legge della non
dominanza cadrebbe al primo confronto.

**3 · Ciò che accade da solo atterra in un pool senza tetto.** Un'operazione che il giocatore non
può vedere né autorizzare non può essere rifiutata da una capienza. È un vincolo, non una
preferenza: la fonte automatica che dichiarasse un pool con tetto sarebbe una protezione che si
disarma da sola.

Ed è una frase di gioco prima che una regola tecnica: **se è automatico, è tracciato.** Un guadagno
che arriva mentre non guardi arriva su un conto, e un conto lascia una traccia. Chi vuole restare
anonimo deve esserci.

**Ne discende cosa diventa il caveau, e va detto perché è la parte che sembra una perdita:** il
caveau è il tetto del denaro **anonimo**, non del reddito. La forma 1 della saturazione — «non ci
sta» — resta intatta e resta la spina dorsale: riguarda i contanti, che è ciò che la sua scheda ha
sempre detto.

## Perché la fonte, e non un interruttore del giocatore

L'interruttore è la soluzione che viene in mente per prima, ed è quella che ricrea il difetto da cui
siamo partiti.

Se il giocatore può scegliere liberamente dove farsi pagare, il gioco ottimale è: **in nero finché
c'è spazio, dichiarato quando il caveau è pieno, in nero appena si libera.** Cioè un interruttore da
premere a ogni oscillazione del saldo — la stessa mansione di prima con un pulsante diverso.

Una scelta che si **paga** — un prezzo, o l'irreversibilità, o entrambi — non ha quel gioco
ottimale: si prende una volta, sapendo cosa costa. È la differenza fra una decisione e una mansione,
ed è tutto ciò che questa ADR sta comprando.

## Cosa questa decisione rende possibile, e cosa no

**Rende possibile** che i domini della visione arrivino senza ritarare il caveau: ognuno dichiara il
proprio regime, e nessuno chiede al caveau di crescere per contenerlo. Il numero di `vault_max_cash`
non torna a essere un bersaglio mobile, che è esattamente ciò che
[la sua scheda](../design/domini/vault.md) ha evitato prendendo livelli finiti invece di una curva
che si strozza.

**Rende possibile** l'operazione automatica: uno stop-loss può esistere perché ha un posto dove
atterrare che non può dirgli di no.

**Non rende possibile** — e non deve — che i contanti smettano di avere un tetto. Chi arriva qui
perché la cifra «sembra bassa» sta togliendo la tensione che regge diciassette domini, e
`vault_max_cash` glielo dirà.

**Non decide quale regime abbia ciascun dominio futuro.** Decide che deve averne uno, e che deve
dichiararlo. Sceglierli tutti adesso sarebbe progettare per un kernel che non esiste, cioè ciò che
l'[ADR 0014](0014-una-fetta-verticale-alla-volta.md) vieta.

## Alternative scartate

- **L'accredito automatico dell'eccedenza** — quando il caveau è pieno, il reddito si versa da solo
  al bancomat pagando la commissione. Toglie i clic, e per questo è stata la prima candidata. Cade
  su due cose. La prima: nasconde la commissione dentro un tick, cioè fa **dieci volte al secondo**
  ciò che l'[ADR 0027](0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) vieta di fare una
  volta sola dentro un acquisto — _«cancella il momento in cui il giocatore decide di lasciare una
  traccia»_. La seconda è che non risponde alla domanda vera: perché lo stipendio di un'impresa
  registrata dovrebbe arrivare in banconote e poi essere riversato in banca ogni decimo di secondo.
  Cura il sintomo e lascia la causa.
- **Alzare il tetto del caveau, o toglierlo.** Toglie la forma 1 della saturazione, cioè la spina
  dorsale contanti/carta su cui il gioco è costruito. È la soluzione che sembra ovvia guardando il
  numero e non il ruolo.
- **Far pagare tutto sulla carta.** I contanti diventerebbero arredamento con dentro del codice, e
  il caveau un dominio senza clienti. La regola 1 li tiene in vita: le fonti nere pagano in contanti,
  e con la fetta 04 saranno quelle che valgono di più.
- **Un pool nuovo per il denaro «grosso».** Un terzo strumento che non è né contanti né carta
  duplicherebbe la carta con un altro nome, e la dualità
  dell'[ADR 0017](0017-il-denaro-e-plurale.md) vive di essere **due**.

## Conseguenze

- **Il kernel guadagna un costruttore.** `income(pool, amount)` accredita tutto ciò che riceve;
  serve il fratello che ne **trattiene** una parte, nella stessa forma di `transfer`. Nessun dominio
  può scriverlo a mano: INV-10 vieta a un dominio di nominare i conti interni, ed è
  `tests/rules/domains-no-internal-pools` a farlo rispettare.
- **La partita doppia guadagna un conto**, `tax`. Le tasse non sono commissioni: mescolarle in
  `fees` perderebbe per sempre la risposta a «quanto ho pagato di tasse», e un'informazione persa è
  debito che non si vede. La `Category` invece **non** cresce: il suo commento dichiara il proprio
  grilletto — _«cresce quando una schermata lo mostra»_ — e nessuna schermata separa ancora le due
  cose.
- **Il regime nasce dentro il dominio che lo usa, non in `contracts/`.** Un contratto condiviso da
  un consumatore solo è la generalizzazione da un caso solo. Il grilletto per salirlo di livello è
  **il secondo dominio che genera guadagni**, e vive nel registro YAGNI accanto a quello di `Space`.
- **La taratura ha un vincolo nuovo, e non è ovvio.** Quanto trattiene il regime dichiarato va
  confrontato con quanto costa **portarci i contanti a mano**, cioè con `ATM_FEE_RATE_IN`. Se
  trattenesse molto di più, il giocatore che clicca ogni secondo verrebbe pagato per farlo — e
  avremmo scritto una ADR per rendere ottimale la mansione che voleva togliere. Lo sorveglia un
  bersaglio in `balance/targets.ts`, non questo paragrafo.
- **Due schede di dominio dicono oggi il contrario e vanno corrette**: quella del
  [caveau](../design/domini/vault.md) e quella del [reddito](../design/domini/income.md) descrivono
  «il reddito nasce in contanti, quindi il caveau lo ferma» come il collegamento più stretto del
  gioco. Resta vero **per le fonti nere**, e smette di essere universale.
