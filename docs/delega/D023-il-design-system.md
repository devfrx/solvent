# D023 — Il design system: un livello che non sa che gioco è

- **Stato:** Aperta — scritta il 2026-08-20 leggendo il canvas di Claude Design consegnato
  dall'utente, e **prima** di [D017](D017-il-caveau.md): il caveau è la prima schermata nuova, e
  una schermata nuova disegnata prima del sistema è una schermata da rifare
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

- [ ] `npm run verify` verde, con l'**output incollato**
- [ ] `npm run verify:release` verde, e il peso del bundle **rimisurato**: due caratteri lo fanno
      crescere, e di quanto va scritto in [qualita.md](../qualita.md) con la data accanto
- [ ] R14 e R15 hanno un test, e tutti e due sono stati **rotti di proposito**
- [ ] INV-21 rotto di proposito: si prova a spegnere un pulsante senza ragione, e `typecheck`
      diventa rosso. Provato, non supposto — è 🔒, e non ha altro modo di dimostrarsi
- [ ] `App.vue` non ha più un blocco `<style>` non scoped, e nessun colore letterale vive fuori da
      `tokens.css`
- [ ] `docs/architettura.md`: il nodo `UI` è nel diagramma, **senza frecce in uscita**, e la tabella
      delle regole ha R14 e R15
- [ ] `tests/rules/import-graph`: `src/renderer/ui/` è nella mappa `NODES` (C13)
- [ ] `docs/tracciabilita.md`: R14, R15 e INV-21 hanno la loro riga e il loro meccanismo
- [ ] `docs/prodotto/preferenze.md`: P2 è riscritta, e dice cosa è cambiato rispetto al 2026-08-19
- [ ] `docs/roadmap-fette.md`: le voci del fuori scope, ognuna col grilletto
- [ ] `docs/stato.md` rigenerato con `npx vitest run tests/rules/project-state -u`
- [ ] **Le due schermate di oggi sono state guardate a occhio, nei due temi.** Nessun gate lo fa, e
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
