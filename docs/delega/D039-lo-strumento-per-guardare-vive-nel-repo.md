# D039 — Lo strumento per guardare vive nel repo

- **Stato:** **Chiusa** — scritta **ed eseguita** il 2026-08-23, subito dopo
  [D038](D038-cio-che-si-preme-e-cio-che-scorre.md), su `main`. Vedi _Come è andata_ in fondo
- **Dipende da:** niente. È la decisione che sette passaggi di consegne hanno rimandato
- **Sblocca:** ogni verifica a occhio che verrà, che è quasi ogni delega di questo progetto
- **ADR vincolanti:** [0047](../adr/0047-uno-strumento-che-non-e-il-prodotto-vive-in-scripts.md)
  (nuovo). Ne tocca uno: [0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md), per la
  dipendenza **non** aggiunta
- **Regole:** nessuna nuova. **Quattro esistenti allargano l'ambito** — P01, C06, C08, C09 —
  perché dicevano «nel codice» e guardavano solo `src/`
- **Budget:** dichiarato ~90 righe di strumento; **misurate 136** con il metodo di `codeLines`, 219
  con i commenti — che sono la metà del file e sono il punto: le quattro trappole stanno lì, dove chi
  apre il file le legge comunque. **Nessuna riga di test**: uno strumento che si esegue a mano si
  prova eseguendolo, e i gate che lo proteggono sono quelli che c'erano già

## Obiettivo

Smettere di riscrivere lo strumento che apre la finestra vera, e farlo senza aprire una cartella
esente dalle regole.

## Perché esiste, e perché adesso

Il [passaggio di consegne](PASSAGGIO-DI-CONSEGNE.md) censiva questa voce a ogni chiusura, sempre con
la stessa frase: «metterli in `scripts/` resta una decisione che nessuno ha preso, e adesso si sa
quanto costa non prenderla: una riscrittura a sessione». Il contatore è arrivato a **sette**.

Non è il costo delle novanta righe: è che ogni riscrittura riparte **senza** le quattro cose che le
sessioni precedenti avevano imparato pagandole — che il bersaglio si filtra su `localhost` e non
sul numero di porta, che `Page.reload` termina il processo Electron invece di ricaricarlo, che non
serve il pacchetto `ws`, e — scoperta in D038 — che `element.focus()` **non** fa scattare
`:focus-visible`, quindi un anello di fuoco si può credere provato senza esserlo.

**Adesso perché è una decisione presa dall'utente**, non perché il grilletto sia scattato da sé.
Era stata dichiarata «da non risolvere in autonomia» perché una cartella nuova alla radice è un
confine, e i confini di questo repo sono quattro.

## Cosa trovi già fatto

- **Il metodo esiste**, sparso fra il passaggio di consegne e la memoria delle sessioni: la riga che
  apre la porta (`npx electron-vite dev -- --remote-debugging-port=9222`) e le trappole note.
- **`electron-builder.yml` ha una lista di esclusioni**, non di inclusioni: una cartella nuova ci
  finisce dentro **per difetto**. È la riga da non dimenticare.
- **ESLint non ignora `scripts/`**: la sua lista di `ignores` è `node_modules`, `dist`, `out`,
  `.vite` e `docs`. Quindi il file è lintato — e siccome non passa da TypeScript, `no-undef` è
  acceso e non sa cosa siano `process`, `console`, `Buffer` e `WebSocket`.
- **Quattro test di regola dicono «nel codice» e guardano `sourceFiles('src')`**: `no-todo`,
  `eslint-disable`, `forbidden-words`, `english-identifiers`. Le loro estensioni di default sono
  `.ts` e `.vue`, quindi un `.mjs` gli sfugge due volte.

## Da produrre

| File                                      | Contenuto                                                  |
| ----------------------------------------- | ---------------------------------------------------------- |
| `scripts/cdp.mjs`                         | cinque comandi, e le quattro trappole scritte in testa     |
| `electron-builder.yml`                    | `!scripts/**` — la cartella non è il prodotto              |
| `eslint.config.js`                        | i quattro globali della piattaforma per `scripts/**/*.mjs` |
| `tests/rules/no-todo.test.ts`             | P01 guarda anche `scripts/`                                |
| `tests/rules/eslint-disable.test.ts`      | C06 guarda anche `scripts/`                                |
| `tests/rules/forbidden-words.test.ts`     | C09 guarda anche `scripts/`                                |
| `tests/rules/english-identifiers.test.ts` | C08 guarda anche `scripts/`                                |

## Fuori scope

- **Una regola nuova che governi `scripts/`.** Ci vive un file: una regola scritta per difendere un
  file solo difende un'ipotesi. Il criterio è quello del kit — entra quando ce ne sono due che si
  somigliano.
- **Contare `scripts/` in `docs/stato.md`.** Quel documento conta il prodotto e ciò che lo verifica.
  Il giorno in cui la cartella crescesse, si aggiunge a `projectState.ts`; e sarà visibile, perché
  la cartella è nel diagramma.
- **Automatizzare la verifica a occhio.** Lo strumento serve a **guardare**, non a decidere. Un test
  che confronta fotografie è un'altra cosa, con un altro costo, e non l'ha chiesta nessuno.

## Definizione di fatto

- [x] `npm run verify` verde e `npm run verify:release` verde
- [x] I cinque comandi provati **contro la finestra vera**, non solo compilati: `shot` intero e
      ritagliato, `eval`, `click`, `tab`, `theme`
- [x] Gli errori escono con un codice diverso da zero e un messaggio leggibile: file mancante,
      ritaglio illeggibile, comando sconosciuto
- [x] `scripts/` non entra nel pacchetto, e la riga che lo esclude porta scritto perché
- [x] I quattro controlli allargati sono verdi sulla cartella nuova
- [x] `docs/architettura.md`: la cartella è nell'albero, con una riga che dice cosa ci sta dentro
- [x] `docs/adr/README.md` e `docs/delega/README.md`: l'ADR e la delega sono nei loro indici
- [x] `docs/stato.md` rigenerato
- [x] Il passaggio di consegne: il residuo aperto da sette sessioni è **chiuso**, non riscritto

## Trappole note

- **La lista di `electron-builder` è di esclusioni.** Chi aggiunge una cartella e non aggiunge la
  riga la spedisce ai giocatori senza accorgersene, e nessun gate lo dice.
- **`no-undef` su un `.mjs`.** typescript-eslint lo spegne sui `.ts` perché a saperlo è il
  compilatore. Su un file che il compilatore non guarda resta acceso, e i globali della piattaforma
  vanno dichiarati o il lint è rosso su `process`.
- **Le estensioni di default di `sourceFiles`** sono `.ts` e `.vue`. Allargare un test a `scripts/`
  senza passargli `['.mjs']` lo allarga a zero file, e il test resta verde per finta.

## Come è andata

Eseguita il 2026-08-23, subito dopo D038, direttamente su `main` — è un cambiamento che non tocca
il gioco e non ha un ramo suo.

**Le tre trappole erano tutte e tre reali**, e sono state incontrate nell'ordine in cui sono scritte
qui sopra.

**Un difetto trovato provando, non ragionando:** un comando sconosciuto usciva con codice **zero**,
perché il ramo finale ritornava l'aiuto invece di lanciare. In uno script che ne concatena due, il
secondo sarebbe partito lo stesso dopo un errore di battitura del primo. Adesso lancia.

**Nessuna dipendenza aggiunta**, ed è la parte che vale la pena scrivere: il criterio dell'ADR 0015
chiede cosa scriveremmo a mano al posto di una libreria, e qui la risposta era già sul tavolo —
novanta righe, scritte sette volte. Node ha `WebSocket` fra i globali, quindi il client del
protocollo è un `http.get` su `/json/list` e un `send` numerato.

## Correzioni rispetto a com'era scritta

**1. Il comando che sceglie una destinazione è diventato generico.** Le sette stesure precedenti
avevano un `go <schermata>` che conosceva i nomi italiani delle destinazioni: uno strumento accoppiato
alle parole del gioco, che sarebbe scaduto alla prima rinominata. Adesso è `click "<testo>"` e preme
il primo pulsante che contiene quel frammento — funziona sulle destinazioni, sui cheat e su
qualunque cosa avrà un'etichetta.

**2. `tab` non c'era nelle sei stesure precedenti**, e senza di lui D038 avrebbe dichiarato provato
un anello di fuoco che non lo era: `element.focus()` non fa scattare `:focus-visible`. È la
trappola più costosa delle quattro, perché non fallisce — dà una risposta sbagliata.
