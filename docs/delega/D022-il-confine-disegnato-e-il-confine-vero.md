# D022 — Il confine disegnato è il confine vero

- **Stato:** In corso — scritta ed **eseguita** il 2026-08-20 dall'audit dello STOP 2, gemella di
  [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md). La definizione di fatto è verde;
  manca il commit di chiusura, che è l'ultimo passo e va annotato qui
- **Dipende da:** D013 (tutta la fetta 01). **Non** dipende da D021: una guarda i documenti,
  l'altra i confini del codice, e non si toccano
- **Sblocca:** [D017](D017-il-caveau.md), che sposta tre confini insieme — `capacityOf` esce da
  `atm/rules.ts`, il Ledger riceve la capienza dal dominio
  ([ADR 0025](../adr/0025-la-capienza-di-un-pool-si-chiede-non-si-legge.md)), e nasce
  `domains/vault/rules.ts`, che è il **terzo**
- **ADR vincolanti:** nessuno nuovo. Ne applica due:
  [0001](../adr/0001-simulazione-nel-renderer-core-puro.md), che stabilisce i livelli, e
  [0012](../adr/0012-controlli-sul-codice-morto-sempre-accesi.md)
- **Regole:** una regola di prodotto nuova — **R13** — che esisteva già in prosa senza ID, e una di
  processo — **C13**. Più l'estensione di **R04** al renderer. Nessun invariante nuovo
- **Budget:** ~220 righe di test, ~35 di documentazione, e **5 righe di sorgente**: tre di
  `eslint.config.js` e due di `rotation.ts`. Non zero, e la differenza da
  [D021](D021-un-numero-che-nessuno-conta-non-si-scrive.md) è dichiarata perché si veda

## Obiettivo

Dare un meccanismo ai tre confini architetturali che oggi tiene la review.

## Perché esiste, e perché prima di D017

Il progetto ha dodici regole meccanizzate e un documento — [tracciabilita.md](../tracciabilita.md)
— che dichiara: «Una regola senza una riga in questa tabella è una buona intenzione». L'audit dello
STOP 2 ha trovato **tre confini veri che non ce l'hanno**, e li ha trovati facendo alla tabella la
domanda inversa: non «ogni riga ha un meccanismo?», ma «ogni confine ha una riga?».

| Confine                                                    | Chi lo tiene oggi | Difetto |
| ---------------------------------------------------------- | ----------------- | ------- |
| Le frecce ammesse in [architettura.md](../architettura.md) | 👤 la review      | AUD-008 |
| «I file `rules.ts` contengono **solo** funzioni pure»      | 👤 la review      | AUD-010 |
| Dove nasce un numero che il giocatore vede                 | 👤 la review      | AUD-011 |

**Il momento è prima di D017**, ed è l'argomento di [D001](D001-tooling-e-gate.md) e di
[D020](D020-nessun-sistema-si-fida-del-salvataggio.md): le regole devono esistere prima del codice
che governano. D017 fa tutte e tre le cose che questi meccanismi sorvegliano — sposta confini fra
livelli, scrive il terzo `rules.ts`, porta i numeri del caveau nella UI. Se i meccanismi nascessero
dentro D017 li scriverebbe la stessa persona che scrive il codice da sorvegliare, nello stesso
momento: non sorveglierebbero niente.

## Cosa l'audit ha trovato

### AUD-008 — il diagramma omette sette archi reali e tre nodi

[architettura.md](../architettura.md) dichiara: «Una freccia `A --> B` significa: **A può importare
B**. Non esistono frecce all'insù». Il grafo di import ricostruito dai sorgenti contiene sette
archi che il diagramma non disegna:

| Arco reale non disegnato | Dove si vede                                                           |
| ------------------------ | ---------------------------------------------------------------------- |
| `ST --> CON`             | `src/renderer/stores/game.ts` — sette moduli di `contracts/`           |
| `ST --> KER`             | `src/renderer/stores/game.ts` — `Milliseconds`, `milliseconds`         |
| `ST --> BAL`             | `src/renderer/stores/game.ts` — `BALANCE`                              |
| `RT --> CON`             | `src/renderer/runtime/createGame.ts` e `host.ts`                       |
| `I18N --> KER`           | `src/renderer/i18n/index.ts` — `MILLISECONDS_PER_SECOND`               |
| `I18N --> RT`            | `src/renderer/i18n/index.ts` — `GameLoadError`                         |
| `CMP --> CMP`            | `AtmPanel.vue` e `OperationList.vue`, entrambi verso `PostingRows.vue` |

E tre nodi che non esistono nel diagramma: **`App.vue`**, **`views/`** e **`src/renderer/main.ts`**.
Il nodo dei `.vue` si chiama `components/*.vue` e non li copre, mentre fra loro c'è una direzione
reale — `main.ts → App.vue → views/ → components/`.

`ST --> KER` è quello che conta: chi legge il diagramma conclude che lo store non conosce il
kernel, cioè esattamente la proprietà che l'[ADR 0001](../adr/0001-simulazione-nel-renderer-core-puro.md)
protegge. È un import legittimo e voluto — converte i millisecondi per il recupero — ma **un
diagramma che elenca meno archi di quelli reali è più pericoloso di nessun diagramma**: autorizza a
credere che un confine ci sia dove non c'è.

Il progetto ha già pagato questo difetto una volta, e lo dice nel documento stesso: la nota su
`CMP --> CON`, «La freccia esisteva già da D012 e non era disegnata; a disegnarla è D015». È
tornato subito, e in sette esemplari, perché la correzione era un aggiornamento e non un
meccanismo.

### AUD-010 — la regola senza ID

[convenzioni.md](../convenzioni.md) dice che i file `rules.ts` contengono **solo** funzioni pure:
nessun accesso al contesto, nessun `ctx` fra i parametri, nessun effetto, nessuna lettura dell'ora.
È il confine che rende un dominio provabile con un seme fisso e senza impalcature — ed è l'unica
regola scritta del progetto senza ID e senza riga in [tracciabilita.md](../tracciabilita.md).

Il grilletto nel [registro YAGNI](../roadmap-fette.md) dice «il **terzo** `rules.ts`». D017 lo
scrive. Il grilletto era giusto sul _quando il problema diventa reale_ e sbagliato sul _quando il
meccanismo può ancora essere scritto da chi non ha interesse a passarlo_.

### AUD-011 — dove nasce un numero che il giocatore vede

`@typescript-eslint/no-magic-numbers` (R04) è configurato su `src/core/domains/**` e
`src/core/balance/modifiers.ts` — «dove il problema nasce davvero», come dice
`balance/constants.ts`. Non guarda `src/renderer/**`, e intanto i numeri che il giocatore vede
hanno cominciato ad atterrare nello store: quante operazioni mostra la home e quante ne conserva il
registro sono decisioni di prodotto, citate come tali in [qualita.md](../qualita.md), nel
[registro YAGNI](../roadmap-fette.md) e nell'[ADR 0018](../adr/0018-la-home-e-un-atm.md).

**Oggi non è un difetto**: ogni valore è usato una volta, accanto a chi lo consuma, ed è la stessa
difesa che il progetto usa per il CSS. Il problema è che **niente dice dove va il prossimo**, e
D017 ne porta almeno tre nella UI del caveau.

Il costo del rimedio è stato **misurato**, non stimato:

```bash
npx eslint src/renderer/stores/game.ts src/renderer/components/rotation.ts \
  src/renderer/components/postings.ts \
  --rule '{"@typescript-eslint/no-magic-numbers":["error",{"ignore":[0,1,-1],"ignoreArrayIndexes":true,"ignoreEnums":true,"ignoreReadonlyClassProperties":true,"ignoreTypeIndexes":true,"enforceConst":true,"detectObjects":false}]}'
```

`stores/game.ts` e `postings.ts` sono **già verdi**. Un solo errore in tutto il renderer, ed è
`FULL_TURN / 4` in `rotation.ts`: un quarto di giro senza nome.

## Cosa trovi già fatto

- **`tests/helpers/sources.ts`** ha già `importsOf(source)`, che estrae ogni specificatore di
  `import ... from '...'`. È metà del test di C13, ed è già provato dal blocco «il rilevatore» di
  `core-deps`.
- **`tests/rules/core-deps.test.ts`** e **`main-save-only.test.ts`** fanno già una cosa vicina:
  leggono gli import di una cartella e li confrontano con un elenco ammesso. Si copia la forma.
- **`eslint.config.js` ha già il blocco di R04** con la sua configurazione: estenderlo è aggiungere
  un percorso a `files`, non scrivere una regola nuova.
- **`tests/rules/no-logic-in-vue.test.ts`** è il modello per R13: cerca una forma vietata dentro un
  insieme di file, con il blocco «il rilevatore» e la spunta «ce ne sono da guardare».

## Da produrre

### Test

| File                               | Contenuto                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `tests/rules/import-graph.test.ts` | C13 — il grafo reale coincide con il diagramma di `architettura.md`, nei due versi |
| `tests/rules/pure-rules.test.ts`   | R13 — nessun file `rules.ts` prende un contesto, emette, scrive o legge l'ora      |

### Sorgente

| File                                  | Cosa cambia                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `eslint.config.js`                    | R04 si estende a `src/renderer/**/*.ts` — tre righe, ed è un `files` più lungo       |
| `src/renderer/components/rotation.ts` | `FULL_TURN / 4` diventa una costante nominata: è un quarto di giro, e adesso lo dice |

### Documenti

| File                                    | Cosa cambia                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| [architettura.md](../architettura.md)   | i sette archi mancanti e i tre nodi entrano nel diagramma (AUD-008)              |
| [convenzioni.md](../convenzioni.md)     | la regola dei `rules.ts` prende il suo ID: **R13**                               |
| [tracciabilita.md](../tracciabilita.md) | R13 e C13 hanno la loro riga; R04 dichiara il perimetro allargato                |
| [roadmap-fette.md](../roadmap-fette.md) | la voce «un meccanismo per la purezza di `rules.ts`» **esce** dal registro YAGNI |

### Come il test di C13 costruisce i due grafi

**Il diagramma** si legge dal blocco `mermaid` di [architettura.md](../architettura.md): ogni riga
`A --> B`, anche con l'etichetta `-->|testo|`, è un arco ammesso.

**Il grafo reale** si costruisce da `src/`: per ogni file si legge il nodo di partenza, per ogni
`import` il nodo di arrivo, e gli import esterni si saltano.

La corrispondenza fra un percorso e un nodo è una **dichiarazione**, e vive nel test: il diagramma
usa nomi astratti — `CMP`, `ST`, `KER` — che nessuna euristica può indovinare. Il buco che ne
deriva è che una cartella nuova non mappata sparirebbe dal confronto, e si chiude con la terza
verifica:

1. ogni arco **reale** è disegnato, o è rosso;
2. ogni arco **disegnato** esiste davvero, o è rosso — un permesso che punta al vuoto è la stessa
   cosa che [convenzioni.md](../convenzioni.md) ha già tolto una volta, l'eccezione
   `core/kernel/index.ts` che non è mai esistita;
3. ogni file sotto `src/` appartiene a un nodo, o è rosso. È questa che rende le prime due
   complete: senza, `domains/vault/` nascerebbe fuori dal grafo senza far rumore.

Gli archi interni a un nodo — `KER --> KER`, `CMP --> CMP` — contano come archi e vanno disegnati:
è il caso di `AtmPanel → PostingRows`, che oggi non si vede.

## Invarianti

- **R13 — un file `rules.ts` è puro.** Nessun parametro chiamato `ctx` o tipizzato `SystemContext`,
  nessun `Date.now`, nessun `Math.random`, nessun `.emit(`, nessun import da `@core/kernel/Bus` o
  `@core/kernel/Ledger`. È ⚠️: cerca le forme in cui l'impurità entra, non dimostra la purezza.
  Dirlo è la condizione per non credere che dimostri di più.
- **C13 — il diagramma delle dipendenze coincide con il grafo reale**, nei due versi e senza file
  orfani. ✅, e senza eccezioni.
- **R04 continua a essere 🔒 dove lo era**, e adesso copre anche il renderer. L'estensione non
  cambia la forza della regola: cambia quanta superficie tiene.

## Fuori scope

- **Disegnare le dipendenze di `tests/`.** Il diagramma descrive il prodotto. I test importano tutto
  per costruzione, e includerli renderebbe il grafo un elenco di tutto verso tutto.
- **Verificare che un arco disegnato sia _giusto_.** Il test dimostra che diagramma e codice
  coincidono, non che il confine sia quello desiderato. A dire cosa è vietato restano
  `no-restricted-imports` e le righe di [architettura.md](../architettura.md), e la loro coerenza
  reciproca resta 👤. È dichiarato invece che sottinteso.
- **Dimostrare la purezza di una funzione.** Richiederebbe l'analisi del flusso, cioè un tipo o un
  tool nuovo. R13 nasce ⚠️ come `english-identifiers` e come `no-literal-in-template`, e come loro
  dichiara il proprio limite.
- **Estendere R04 ai `.vue`.** I template contengono numeri di presentazione — `gap: 8px` sta nel
  CSS, ma un `v-for` su un intervallo no — e il rapporto costo/beneficio va misurato prima, non
  assunto. Il grilletto è il primo numero di gioco trovato dentro un template.
- **Ripulire `components/` in sottocartelle.** D017 vi aggiunge il terzo pannello di dominio, che
  per la regola del progetto — con due si copia, con tre si estrae — è il momento in cui la domanda
  va posta. Va posta lì, con i tre file davanti, non qui su una previsione.

## Definizione di fatto

- [ ] `npm run verify` verde, con l'**output incollato**
- [ ] `npm run verify:release` verde — si tocca `src/`, quindi la compilazione va riprovata
- [ ] il test di C13 **fallisce** se si toglie un arco dal diagramma, e **fallisce** se se ne
      aggiunge uno che non esiste. Provati entrambi i versi, non supposti
- [ ] il test di C13 **fallisce** se si crea un file sotto `src/` in una cartella non mappata
- [ ] il test di R13 **fallisce** se si aggiunge un `ctx` alla firma di una funzione in
      `atm/rules.ts` — provato, ed è l'unica prova che la regola morda
- [ ] il blocco «il rilevatore» c'è in tutti e due i test nuovi
- [ ] i sette archi e i tre nodi di AUD-008 sono nel diagramma, e il test lo conferma
- [ ] `FULL_TURN / 4` non esiste più, e `npm run lint` copre `src/renderer/**/*.ts`
- [ ] [convenzioni.md](../convenzioni.md): la regola dei `rules.ts` porta **R13**
- [ ] [tracciabilita.md](../tracciabilita.md): R13 e C13 hanno la loro riga e il loro meccanismo, e
      il contatore delle righe 👤 è stato **rimisurato** — da sette dovrebbe scendere a quattro
- [ ] la voce del registro YAGNI sulla purezza di `rules.ts` è **uscita**: non è più una cosa che
      manca
- [ ] ogni test nuovo è stato rotto di proposito almeno una volta

## Come è andata

Eseguita il 2026-08-20, subito dopo essere stata scritta.

**Budget.** Dichiarati ~220 righe di test, ~35 di documentazione e 5 di sorgente. Misurati **264
righe di test** — `import-graph` 162, `pure-rules` 102 — e **5 righe di sorgente**: tre in
`eslint.config.js` e due in `rotation.ts`. Le righe di documentazione sono di più del previsto
perché il diagramma è stato riscritto per intero invece che ritoccato.

**Cosa l'esecuzione ha trovato, e che la delega non prevedeva.**

1. **Gli archi mancanti erano diciassette, non sei; i nodi quattro, non tre.** L'audit li aveva
   contati a mano su un grafo che non modellava `main.ts`, `App.vue`, `views/` e `main/index.ts`:
   una volta che quei nodi esistono, esistono anche i loro archi. Il quarto nodo — `main/index.ts`,
   che sta nel riquadro del main e non è né `SAVE` né `PRE` — l'audit non l'aveva visto affatto.
2. **`CMP --> CMP` non è un difetto.** La delega lo elencava fra gli archi da disegnare; scrivendo
   il test è emerso che il diagramma modella i **passaggi di livello**, e un componente che importa
   un fratello è coesione interna. Disegnarlo avrebbe riempito il diagramma di cappi. L'esclusione
   è dichiarata nel test invece di essere sottintesa.
3. **Il verso inverso ha morso subito, e su chi lo aveva scritto.** Riscrivendo il diagramma ci è
   finita dentro una freccia `BOOT --> VIEWS` che non esiste: `main.ts` monta `App.vue`, ed è
   `App.vue` a conoscere le viste. Un permesso che punta al vuoto è lo stesso difetto
   dell'eccezione `core/kernel/index.ts` che [convenzioni.md](../convenzioni.md) ha già tolto una
   volta — e stavolta l'ha trovato un test invece di un audit.
4. **Un import di cartella non ha la barra finale.** `@renderer/i18n` è il punto d'ingresso di
   `src/renderer/i18n/`, e il risolutore lo mancava: il test dichiarava inesistente un arco
   (`CMP --> I18N`) che invece c'è. Trovato dal verso inverso, che senza quel verso sarebbe passato.
5. **R04 sul renderer costava una costante.** L'unico numero magico in tutto `src/renderer/**/*.ts`
   era `FULL_TURN / 4` in `rotation.ts`: adesso è `QUARTER_TURN`, e dice cosa significa.

**La prova che mordono.** R13 è stato provato aggiungendo un `ctx` alla firma di una funzione in
`atm/rules.ts`: rosso, con il file e il motivo. C13 è stato provato in entrambi i versi, e il verso
inverso ha trovato un difetto vero (punto 3) prima ancora che qualcuno lo cercasse.

## Trappole note

- **Il parser del mermaid che legge i commenti.** Il documento spiega gli archi anche in prosa, e la
  prosa contiene `-->`. Il rilevatore deve leggere **solo** dentro il blocco ` ```mermaid `, o il
  primo arco che trova è quello di una frase che lo descrive.
- **La freccia con l'etichetta.** `PRE -->|solo channels.ts| SAVE` è un arco come gli altri, e un
  rilevatore scritto su `A --> B` non lo vede. È già nel diagramma oggi, quindi il test nasce rosso
  su di lui se la forma non è prevista.
- **Il nodo che compare solo in un arco.** In mermaid `D013 --> D021["..."]` dichiara il nodo e
  l'arco insieme. Il rilevatore degli archi deve togliere l'etichetta prima di leggere il nome, o
  il nodo di arrivo si chiamerà `D021["..."]`.
- **La mappa percorso → nodo che invecchia.** È il buco di questo test, e la terza verifica lo
  chiude. Se qualcuno la aggira aggiungendo una voce «tutto il resto», ha tolto al test la sua
  unica difesa.
- **R13 che grida al lupo su un commento.** I file `rules.ts` spiegano perché sono puri, e nel farlo
  nominano `ctx` e «effetto». Il rilevatore deve togliere i commenti — `withoutComments` esiste già
  in `tests/helpers/sources.ts` — o il primo file che segnala è quello che rispetta la regola meglio
  di tutti.
- **A17.** Due test di regola e cinque righe di sorgente. La voglia di «già che ci sono» qui si
  chiama sottocartelle in `components/`, R04 sui template, e un tool per il grafo delle dipendenze:
  tutti e tre hanno un grilletto scritto in _Fuori scope_.
