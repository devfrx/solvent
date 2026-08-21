# ADR 0033 — Un dominio ha una cartella, e di norma una pagina

- **Stato:** **Accettata** — [D026](../delega/D026-dove-si-attacca-un-dominio.md):
  `src/renderer/components/<dominio>/`, la mappa `DOMAIN_SCREENS` in `components/shell/screens.ts`,
  e la regola **R18** che `tests/rules/domain-ui` impone. Rotta di proposito tre volte, una per
  verifica
- **Data:** 2026-08-21
- **Supera:** [ADR 0018](0018-la-home-e-un-atm.md) **no** — lo conferma. La home resta bancomat
  sopra e cruscotto sotto, e adesso si sa **perché**: è la pagina del dominio `atm`

## Contesto

Il caveau è la prova che la regola manca. [D017](../delega/D017-il-caveau.md) ha costruito un
dominio intero — stato, comandi, capienza, ampliamento, un muro che ferma il reddito — e la sua
interfaccia è finita dentro `components/CashPanel.vue`, insieme al saldo dei contanti.

Non c'è stata nessuna decisione. Il caveau tocca i contanti, i contanti avevano già un pannello, e
il pannello è cresciuto. Nessun gate poteva vederlo, perché non esisteva una regola da rompere.

Guardato adesso, quel file è **due cose**: la metà alta è il pool `cash`, la metà bassa è il dominio
`vault`. Due domini in un riquadro perché condividono un numero.

E i domini saranno **diciassette**. La [mappa](../prodotto/visione.md) li elenca tutti. Il momento
per decidere dove si attacca un dominio è **prima** che si attacchi: è l'argomento di
[D001](../delega/D001-tooling-e-gate.md) usato per la quarta volta, dopo D023, D024 e D025.

**La domanda non è una sola, sono due**, e tenerle insieme è ciò che ha reso difficile rispondere:

1. Dove vivono i **file** di un dominio?
2. Il giocatore ha un **posto** dove va a trovarlo?

La prima ha una risposta sola. La seconda no, e si vede leggendo la mappa dei domini: `calendar`
([ADR 0023](0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md), `Proposta`) è l'orologio del gioco e
non ha niente da mostrare; il calore, gli eventi periodici e le indagini hanno la colonna
_requisito_ vuota nella visione, perché non sono cose che si aprono — sono cose che accadono.

Una regola che dicesse «ogni dominio è una pagina» sarebbe falsa il giorno in cui `calendar` nasce.

## Decisione

**Tutta l'interfaccia di un dominio vive in `src/renderer/components/<dominio>/`**, e il nome della
cartella è il nome della cartella del dominio in `src/core/domains/`.

**La sua pagina è dove lo si amministra.** Un dominio dichiara la propria destinazione; se non ne ha
una, lo dichiara scrivendo `null` — che è una risposta, non una dimenticanza.

**Un pezzo dello stesso dominio può comparire altrove** — un allarme sulla home, una spia nella
testata — **ma esce dalla stessa cartella.** Nessun file di un dominio contiene l'interfaccia di un
altro. È l'unica metà della regola che non ha eccezioni, ed è quella che il caveau ha violato.

Le cartelle di `components/` che **non** sono domini sono una lista chiusa e dichiarata. Oggi sono
due:

- `shell/` — ciò che è dell'applicazione e di nessun dominio: la colonna, la testata, l'elenco
  delle destinazioni, il riquadro del cruscotto
- `ledger/` — ciò che mostra il registro: l'estratto conto, riga per riga

Non si chiamano `common/` né `shared/`: sono due delle parole che C09 vieta, e le vieta per la
ragione che si vedrebbe qui — una cartella il cui nome non dice di chi è la roba raccoglie tutto
ciò che nessuno ha voglia di collocare.

Ne discende una regola con un ID e un test:

- **R18** — un dominio ha la sua cartella sotto `components/`, e la sua interfaccia sta lì.
  `tests/rules/domain-ui` pretende tre cose: nessun file sciolto direttamente sotto `components/`;
  ogni sottocartella è un dominio di `src/core/domains/` oppure una della lista dichiarata; ogni
  dominio compare in `DOMAIN_SCREENS` con una destinazione o con `null`.

## Il criterio, in una riga

> La **cartella** è del dominio, sempre. La **pagina** è del giocatore, e c'è quando c'è qualcosa da
> amministrare.

Un dominio che non si amministra — il calendario, il calore finché è solo un numero che sale — non
prende una pagina e lo scrive. Un dominio che si amministra la prende, anche se oggi ci sta dentro
un pulsante solo: nasce stretta una volta sola, e cresce col dominio.

**Questo ADR non elenca le pagine di oggi**, ed è deliberato: un elenco invecchia alla fetta 03. Il
posto dell'elenco è `DOMAIN_SCREENS`, che è codice e che un test confronta con le cartelle vere.

## Alternative scartate

- **Criterio caso per caso: «una pagina è un posto dove si va apposta, un muro si mette dove lo si
  incontra».** È la formulazione con cui questa decisione è nata, e sul caveau dà la risposta
  giusta. Il difetto è che resta **un giudizio**: non c'è niente da verificare, quindi la regola
  sarebbe 👤 di review — la classe che questo progetto ha visto rompersi tre volte
  ([D001](../delega/D001-tooling-e-gate.md),
  [D021](../delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md),
  [D022](../delega/D022-il-confine-disegnato-e-il-confine-vero.md)). E con diciassette domini
  davanti, un giudizio ripetuto diciassette volte lo decide lo spazio disponibile: è esattamente
  come il caveau è finito dentro i contanti.
- **La regola secca senza uscita: ogni dominio è una pagina, punto.** Si impone da sé e non chiede
  niente a nessuno. È falsa: `calendar` non ha interfaccia, e il calore, gli eventi e le indagini
  non sono posti dove si va. Una regola falsa si aggira, e la si aggira mettendo il pezzo dove
  capita — cioè producendo il difetto che questo ADR esiste per chiudere.
- **Cartella piatta, con il dominio nel nome del file** (`AtmPanel.vue`, `VaultPanel.vue`). Costa
  zero e in un editor ordina uguale. Non regge due cose: un prefisso non sa dire «non appartengo a
  nessun dominio», quindi la colonna, la testata e l'estratto conto restano alla deriva; e con
  diciassette domini per tre o quattro file ciascuno la cartella arriva a sessanta voci, che è la
  forma in cui `finanx` teneva i propri componenti.
- **Sottocartelle per schermata** (`home/`, `stats/`). Sarebbe già rotta oggi: `OperationList` è
  disegnata da due viste. E lega i file al posto in cui capita di mostrarli, che è il legame
  sbagliato — un pannello si sposta di pagina, un dominio no.
- **Un nodo del diagramma per ogni sottocartella.** [D026](../delega/D026-dove-si-attacca-un-dominio.md)
  lo dava per necessario. Non lo è: `tests/rules/import-graph` sceglie il nodo per **prefisso**, e
  `src/renderer/components/` prende tutto ciò che ci sta sotto. Verificato mettendo un file finto in
  `src/renderer/components/probe/`: otto test verdi. Diciassette nodi `CMP_*` renderebbero il
  diagramma illeggibile per descrivere un confine che non esiste — dentro `components/` non c'è
  nessun livello da attraversare.

## Conseguenze

- `CashPanel.vue` si spezza. I contanti restano sulla pagina del bancomat; il caveau prende la sua
  pagina e la sua cartella, e lascia sulla home **soltanto** il proprio allarme — che è un file di
  `components/vault/`, non un paragrafo dentro il pannello dei contanti.
- Le destinazioni passano da due a quattro: `home` (il bancomat), `income`, `vault`, `stats`. Questo
  fa scattare il grilletto dei **gruppi nella colonna**, che il
  [registro YAGNI](../roadmap-fette.md) fissava alla terza destinazione.
- **INV-22 guadagna una gemella.** Fino a oggi era impossibile elencare una destinazione senza
  schermata; adesso è anche impossibile aggiungere un dominio senza dire dove si guarda. Le due
  regole chiudono i due versi dello stesso buco.
- L'[ADR 0018](0018-la-home-e-un-atm.md) resta in vigore e cambia significato: non è più «la home è
  un'eccezione ibrida», è «la home è la pagina del bancomat, e ci sta sopra il cruscotto perché il
  cruscotto non è di nessun dominio». Il tetto di sei riquadri e `tests/rules/home-tiles` non si
  toccano.
- La [scheda di dominio](../delega/D018-la-scheda-di-dominio.md) guadagna una domanda che prima
  nessuno faceva: **questo dominio si amministra?** È la domanda che riempie `DOMAIN_SCREENS`, e va
  risposta prima di scrivere il dominio, non dopo.
- Il kit non cresce. Spezzare un file non crea il secondo disegno: crea due metà dello stesso, e la
  soglia dell'[ADR 0028](0028-il-kit-ui-non-sa-che-gioco-e.md) resta dov'era.
- `tests/rules/domain-ui` è **✅ bloccato**, non parziale: legge le cartelle vere sul disco da tutti
  e due i lati, e non indovina niente da un nome.
