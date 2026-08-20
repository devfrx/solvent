# D023 — Il design system: un livello che non sa che gioco è

- **Stato:** **Chiusa** — scritta il 2026-08-20 leggendo il canvas di Claude Design consegnato
  dall'utente, **prima** di [D017](D017-il-caveau.md) — il caveau è la prima schermata nuova, e una
  schermata disegnata prima del sistema è una schermata da rifare — ed eseguita lo stesso giorno:
  commit `a03b97b`, ramo `d023-design-system`. Vedi _Come è andata_ in fondo
- **Dipende da:** [D015](D015-home-bancomat.md) — la home e i componenti di oggi sono ciò che il
  kit deve saper vestire. **Non** dipende da [D017](D017-il-caveau.md)
- **Sblocca:** ogni schermata che verrà, a partire dal caveau
- **ADR vincolanti:** [0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md) (nuovo) e
  [0029](../adr/0029-due-caratteri-e-stanno-nel-bundle.md) (nuovo). Ne tocca due: 0015 — una
  dipendenza nuova vuole un ADR — e 0011, perché le parole restano nell'i18n
- **Preferenza:** [P2](../prodotto/preferenze.md) è **sostituita** da questa delega
- **Regole:** due nuove, **R14** e **R15**. Un invariante nuovo: **INV-21**
- **Budget:** ~360 righe di sorgente nuove e ~130 di test. La migrazione ne **toglie** dal guscio e
  dai componenti di oggi: il netto atteso è circa la metà del lordo

## Obiettivo

Dare al progetto un vocabolario visivo unico, in un livello che non conosce il gioco — e renderlo
impossibile da aggirare.

## Perché esiste, e perché adesso

Oggi un design system c'è già, ma non ha un nome e non ha una difesa. I token e cinque primitive —
`.panel`, `.caption`, `.amount`, i due pulsanti e `.refusal` — vivono in un blocco `<style>` non
scoped dentro `App.vue`, l'unico del progetto, e la regola che le governa è di review: «una
primitiva entra lì quando la disegnano due componenti».

[D016](D016-correzioni-audit.md) ha già visto cosa succede quando una regola sta solo nella testa
di chi legge: `.refusal` copiata in due pannelli, con il valore di `--danger` ricopiato a mano in
quattro righe di `rgba()`. Non era distrazione — era che niente lo impediva.

**E adesso arriva molto più materiale.** Il canvas di Claude Design porta due dozzine di ruoli di
colore in due temi, due caratteri e otto principi. Metterli dentro `App.vue` significa moltiplicare
la superficie di una cosa che si è già rotta una volta.

**Perché prima di D017 e non dopo.** Il caveau è la prima schermata nuova dopo la fetta 01. Se nasce
prima del sistema, nasce con i propri colori, e il sistema arriverebbe a doverla riscrivere. È
l'argomento di [D001](D001-tooling-e-gate.md), usato di nuovo: **le regole vengono prima del codice
che governano.**

## Cosa il design dice, e cosa ne prendiamo

Il canvas non è un kit di componenti: è un **prototipo dell'intera applicazione**, disegnato con
centinaia di stili scritti dentro i tag e **nemmeno una classe**. Non c'è niente da trascrivere. C'è
da leggere cosa ripete.

Porta anche una pagina «Design system», ed è da lì che vengono le decisioni:

- i colori portano **significato**, non umore
- due caratteri, un mestiere ciascuno
- gli strumenti: **mai un numero nudo**
- un'azione che non puoi fare **non è mai un pulsante morto**: è una frase che dice cosa manca
- sette stati dell'applicazione, una schermata ciascuno
- gli stati di dominio si dichiarano dove l'azione viene rifiutata, non solo dove vivono
- sette stati vuoti, e nessuno di loro vuol dire «niente qui»

I primi quattro entrano adesso. Gli altri sono schermate, e le schermate seguono i domini: vanno nel
[registro YAGNI](../roadmap-fette.md) con il loro grilletto.

## Cosa trovi già fatto

- **Le cinque primitive esistono**, in `App.vue`. Questa delega le **sposta e le tipizza**, non le
  inventa: è meno lavoro di quanto il conteggio delle righe faccia pensare.
- **`tests/rules/import-graph` c'è**, e una cartella nuova va aggiunta alla sua mappa `NODES`,
  altrimenti il test è rosso per costruzione — ogni file di `src/` deve appartenere a un nodo (C13).
- **`no-logic-in-vue` e `no-literal-in-template` ci sono**, e il kit li passa da sé: non importa
  dominio e non scrive testo.
- **Il tema si sceglie da solo.** Non serve un interruttore: `prefers-color-scheme` decide, e
  `data-theme` sull'elemento radice resta pronto per il giorno in cui esisteranno le impostazioni. È
  la ragione per cui spedire due temi non produce metà CSS morto.

## Da produrre

| File                                       | Contenuto                                                     |
| ------------------------------------------ | ------------------------------------------------------------- |
| `src/renderer/ui/tokens.css`               | i ruoli di colore nei due temi, e le quattro scale            |
| `src/renderer/ui/roles.ts`                 | `ColorRole` e `TextSize`: le uniche parole che il kit conosce |
| `src/renderer/ui/UiPanel.vue`              | la superficie, con l'intestazione a filo                      |
| `src/renderer/ui/UiLabel.vue`              | l'etichetta mono maiuscola — la firma dello stile             |
| `src/renderer/ui/UiNumber.vue`             | la cifra tabulare, col suo tono                               |
| `src/renderer/ui/UiText.vue`               | la prosa rivolta al giocatore                                 |
| `src/renderer/ui/UiButton.vue`             | l'azione, e il rifiuto spiegato                               |
| `src/renderer/ui/UiChip.vue`               | la targhetta di strumento o di stato                          |
| `tests/rules/ui-kit-is-standalone.test.ts` | **R14** — `ui/` non importa dominio, store o parole           |
| `tests/rules/no-color-literals.test.ts`    | **R15** — nessun colore fuori da `tokens.css`                 |

E la migrazione: `App.vue` perde il suo blocco non scoped, i componenti e le due viste passano al
kit.

### Le quattro scale

Il canvas usa **quattordici** misure di testo, otto raggi e nove spazi. Copiarle tutte non è un
design system: è un foglio di stile. Il lavoro è ridurle, tenendo le più usate.

- **Testo:** sei passi. Il più piccolo è l'etichetta maiuscola, che nel canvas è di gran lunga la
  forma più frequente; il più grande è il numero che comanda la schermata.
- **Spazio:** sei passi.
- **Raggio:** quattro, più la pillola.
- **Spaziatura fra lettere:** tre — larga per le etichette, stretta per i numeri grandi, media per
  il resto.

I valori esatti si prendono dal canvas **contando le occorrenze**, non a occhio, e questa delega non
li scrive: un numero copiato in un documento è un numero che scade (C11). Vivono in `tokens.css`,
che è l'unico posto in cui esistono.

### `UiButton`, e perché non ha una proprietà `disabled`

È il pezzo che rende il design system una regola invece di una tavolozza.

Un pulsante non si spegne: **si rifiuta, con una ragione**. Il tipo non offre `disabled`. Offre
`reason`: se c'è, il pulsante è rifiutato e la frase si vede; se non c'è, si può premere. «Spento
senza motivo» non è vietato — è **impossibile da scrivere**, che è la stessa differenza che passa
fra R07 e una convenzione da ricordare.

La frase la fornisce chi chiama, già tradotta (R12). Il kit non sa cosa voglia dire.

## Invarianti

- **INV-21 — un pulsante spento porta la propria ragione.** Non ha un test, e non è una
  dimenticanza: è 🔒, imposto dal tipo, come INV-13. Un test che lo verificasse dovrebbe **montare**
  un componente, e montare componenti questo progetto lo ha rifiutato due volte con il grilletto
  scritto nel [registro YAGNI](../roadmap-fette.md).

## Fuori scope

Tutto ciò che segue è **nel canvas** e non entra adesso. Ognuno prende una riga nel
[registro YAGNI](../roadmap-fette.md) con il proprio grilletto.

- **La plancia con i riquadri riordinabili.** Il grilletto è la schermata che ha più riquadri di
  quanti ne stiano fermi.
- **Le schermate di dominio** — black market, immobiliare, impresa, casinò, crypto — e le schermate
  segnaposto per i domini chiusi. Il grilletto di ciascuna è la propria fetta. Costruirne i pezzi
  adesso è il difetto **A17**, alla lettera.
- **Le schermate del ciclo di vita**, una per stato. Oggi il guscio li distingue già; una schermata
  dedicata a ciascuno è un'altra delega.
- **Gli stati vuoti.** Il grilletto è il primo elenco che può essere vuoto in un modo che significa
  qualcosa.
- **Il sistema di sovrapposizioni.** Il grilletto è la prima cosa che deve stare sopra il resto.
- **`UiRow` e `UiStack`.** Non arrivano: l'[ADR 0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md)
  li scarta con la ragione.
- **L'interruttore del tema.** Le impostazioni hanno già un grilletto nel registro, e il sistema
  operativo intanto decide da sé.
- **La tabella «cosa l'interfaccia deve al giocatore».** È un documento, e il suo posto è la scheda
  di dominio di [D018](D018-la-scheda-di-dominio.md).

## Definizione di fatto

- [x] `npm run verify` verde, con l'**output incollato**
- [x] `npm run verify:release` verde, e il peso del bundle **rimisurato**: due caratteri lo fanno
      crescere, e di quanto va scritto in [qualita.md](../qualita.md) con la data accanto
- [x] R14 e R15 hanno un test, e tutti e due sono stati **rotti di proposito**
- [x] INV-21 rotto di proposito: si prova a spegnere un pulsante senza ragione, e `typecheck`
      diventa rosso. Provato, non supposto — è 🔒, e non ha altro modo di dimostrarsi
- [x] `App.vue` non ha più un blocco `<style>` non scoped, e nessun colore letterale vive fuori da
      `tokens.css`
- [x] `docs/architettura.md`: il nodo `UI` è nel diagramma, **senza frecce in uscita**, e la tabella
      delle regole ha R14 e R15
- [x] `tests/rules/import-graph`: `src/renderer/ui/` è nella mappa `NODES` (C13)
- [x] `docs/tracciabilita.md`: R14, R15 e INV-21 hanno la loro riga e il loro meccanismo
- [x] `docs/prodotto/preferenze.md`: P2 è riscritta, e dice cosa è cambiato rispetto al 2026-08-19
- [x] `docs/roadmap-fette.md`: le voci del fuori scope, ognuna col grilletto
- [x] `docs/stato.md` rigenerato con `npx vitest run tests/rules/project-state -u`
- [x] **Le due schermate di oggi sono state guardate a occhio, nei due temi.** Nessun gate lo fa, e
      due temi con un occhio solo è come nascono le righe morte

## Trappole note

- **Il canvas non ha classi, e la tentazione è copiare gli stili dentro i tag.** Sono centinaia.
  Copiati, riproducono il difetto **A14** — 1.067 righe di CSS morto — in un pomeriggio. Il canvas
  si **legge**: si contano le forme che ripete, e si tengono quelle.
- **Le quattordici misure di testo.** Chi le copia tutte crede di essere fedele al design. Un design
  system è la riduzione, non la trascrizione: se dopo sei passi una schermata sembra sbagliata, è la
  schermata che si adatta.
- **Il momento in cui `ui/` comincia a sapere.** La prima proprietà chiamata `pool` invece di `tone`
  è il momento in cui R14 muore, e muore sembrando comoda. Il ponte fra un pool e un ruolo di colore
  vive in `components/`, che il dominio lo conosce già.
- **Il tema che nessuno guarda.** Spedirne due e guardarne uno è esattamente come sono nate le righe
  morte del progetto precedente. La definizione di fatto lo chiede apposta.
- **A17, di nuovo, e più forte del solito.** Il canvas mostra diciotto domini finiti e bellissimi. È
  la tentazione più grossa che questo progetto abbia incontrato finora: tutto sembra già disegnato,
  quindi tutto sembra a un pomeriggio di distanza. Non lo è, e quei domini non esistono.

## Come è andata

Eseguita il 2026-08-20, sul ramo `d023-design-system`, commit `a03b97b`.

**Budget.** Dichiarate ~360 righe di sorgente e ~130 di test. Misurate **346 righe di kit** e **129
di test**, con il metodo di `codeLines`. La migrazione dei componenti e delle viste ne ha **tolte
62**: 282 aggiunte contro 344 tolte nei file che esistevano già. Il netto di `src/` è quindi **+284**
contro un lordo di 346, che è la metà annunciata più qualcosa.

Le tre regole nuove sono state rotte di proposito, una per una:

| Cosa si rompe                     | Cosa diventa rosso                   |
| --------------------------------- | ------------------------------------ |
| Un file del kit importa lo store  | il test **e** il lint, tutti e due   |
| Un `#hex` dentro `StatTile.vue`   | R15, con il valore stampato nel diff |
| `:disabled` rimesso su `UiButton` | INV-21                               |

## Correzioni rispetto a com'era scritta

**1. `UiButton` scriveva `disabled` pur non avendo quella proprietà, e la delega non poteva vederlo.**
Il testo diceva: «il tipo non offre `disabled`, quindi spento senza motivo è impossibile da
scrivere». È falso, e a dimostrarlo è stata la prima stesura di questo stesso componente: la
proprietà non c'era e l'attributo sì — `:disabled="refused"` sul `<button>`. Una proprietà che non
esiste nell'API non impedisce all'attributo di esistere nel template. Sono due cose, e solo la
seconda è quella che il giocatore vede.

**2. Ne discende che INV-21 non è 🔒, è ✅** — e ha un test, che la delega diceva di non avere.
`tests/rules/ui-kit-is-standalone` cerca l'attributo nei sorgenti del kit. È leggibile dai sorgenti
proprio perché è una forma, non un tipo, quindi non serve montare niente e il grilletto di jsdom
resta dov'era.

**3. La regola che il design chiede il progetto l'aveva già, e la prima stesura la disfaceva.**
`IncomePanel` porta scritto da D019: «il pulsante non si spegne. Un pulsante spento è un rifiuto
senza motivo, ed è esattamente ciò che questa fetta esiste per non fare». Un `UiButton` che si
disabilita quando riceve una ragione avrebbe rovesciato quella decisione **passando tutti i gate**.
La versione buona è più forte di tutte e due: il kit non sa spegnere un pulsante, punto.

**4. Servono due proprietà, non una.** «Probabilmente non puoi» e «ecco perché non hai potuto» sono
informazioni diverse e arrivano in momenti diversi: `muted` è l'anteprima che il listino sa dare
prima di premere, `reason` è la frase che il Ledger produce dopo. Con una sola, o si perde
l'anteprima o si inventa una ragione che nessuno ha ancora calcolato.

**5. I due temi stanno in una dichiarazione sola, non in due blocchi.** `light-dark()` sceglie in
base a `color-scheme`, quindi ogni colore è scritto **una volta** con i suoi due valori. La forma
consueta — un blocco chiaro e un blocco scuro — sarebbe stata ventiquattro token da tenere
allineati a mano, cioè la stessa classe di difetto che R15 esiste per chiudere. Non funziona per
`--shadow`, che non è un colore: lì il token è il **colore** dell'ombra e la geometria resta fissa.

**6. R15 non ha eccezioni, quindi i colori della carta sono diventati token.** `BankCard3d` ne
scriveva tredici, e sono oro: non sono ruoli, sono **di che cosa è fatto un oggetto**. Un elenco di
file esenti sarebbe stata una lista da mantenere — la regola che si apre da sola — quindi hanno una
sezione loro in `tokens.css`, `--metal-*`, senza `light-dark()`: una carta d'oro è d'oro anche di
notte. **La carta non è stata ridisegnata**: i valori sono quelli di prima. Ridisegnarla è una
decisione visiva e non era in questa delega.

**7. I fogli di stile dei pacchetti non si usano: i `@font-face` sono scritti a mano.**
`@fontsource` dichiara per ogni peso sia `woff2` sia `woff`, e il secondo esiste per motori che qui
non esistono. Presi così com'erano, il bundle portava **nove** file di carattere invece di cinque —
circa centotrenta kilobyte che nessuno avrebbe mai scaricato, cioè il difetto A14 applicato agli
asset. Trenta righe in `ui/fonts.css` costano meno, e in cambio danno `font-display` scelto invece
che ereditato.

**8. `npm install` in questa repo non funziona, e non per colpa di questa delega.** `electron-vite@5`
dichiara di reggere `vite` fino alla 7, e il progetto è sulla 8: `npm install` e `npm ci` falliscono
tutti e due con `ERESOLVE`, da prima di D023. L'unica via è `--legacy-peer-deps`, che però **ignora
i peer**: aggiungendo i caratteri sono spariti `@vue/devtools-api` (senza cui il build non compila)
e `vue-eslint-parser` (senza cui il lint non parte). Adesso sono dichiarati fra le dipendenze di
sviluppo — se un gate ne ha bisogno, deve stare scritto. **La causa vera resta aperta**, ed è una
decisione strutturale che va presa a parte: o `vite` scende alla 7, o `electron-vite` sale alla 6
quando sarà stabile. Fino ad allora l'unico comando che installa è
`npm ci --legacy-peer-deps`, e questa riga è l'unico posto in cui è scritto.

**9. Un difetto che nessun gate poteva vedere, trovato guardando.** Nel tema scuro il pulsante
scelto del bancomat era indistinguibile dall'altro: `--color-raised` contro `--color-surface` sono
due punti di luminosità, e nel chiaro la differenza è bianco contro carta. Adesso a dirlo è il
**bordo**, che si vede in tutti e due. È esattamente la spunta che la definizione di fatto chiedeva,
ed è servita al primo colpo.

**10. `UiPanel` ha guadagnato una variante densa.** Il riquadro del cruscotto è un pannello con meno
imbottitura, e senza quella variante sarebbe nata una **seconda** implementazione di superficie —
cioè la cosa che il kit esiste per impedire. Una proprietà booleana costa meno di due file che si
somigliano.

**11. Il ponte fra dominio e colore ha un nome e un posto.** `roleOf` sta in
`components/postings.ts`: traduce il significato di un movimento — entrata, uscita, commissione —
nel ruolo di colore che il kit capisce. La delega lo prescriveva a parole; adesso è una funzione
pura di tre casi, dalla parte giusta del confine.

### Cosa questa delega lascia a [D017](D017-il-caveau.md)

- **Il caveau non disegna niente di nuovo.** Superficie, etichetta, cifra, targhetta, pulsante e
  prosa ci sono: se serve un settimo pezzo, il criterio è quello di sempre — entra quando lo
  disegnano **due** componenti, non prima.
- **La barra della capienza sarà il primo pezzo nuovo davvero**, e nasce con un numero vero invece
  che vuota. È l'unica cosa che `CashPanel` aspetta.
- **Il colore dei contanti e quello della carta esistono già** come ruoli, e li usa già la home. Il
  caveau non ne sceglie di nuovi.
