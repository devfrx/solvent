# ADR 0047 — Uno strumento che non è il prodotto vive in `scripts/`

- **Stato:** **Accettata** — [D039](../delega/D039-lo-strumento-per-guardare-vive-nel-repo.md):
  `scripts/cdp.mjs` esiste, `electron-builder.yml` lo esclude dal pacchetto, ESLint gli dà i quattro
  globali di Node, e i quattro test di regola che dicevano «nel codice» adesso lo guardano
- **Data:** 2026-08-23

## Contesto

Questo progetto chiede una **verifica a occhio** in quasi ogni delega: la definizione di fatto di
[D023](../delega/D023-il-design-system.md) pretende che le schermate siano guardate nei due temi,
quella di [D036](../delega/D036-il-pagamento-e-un-flusso-solo.md) ha trovato due difetti che nessun
gate poteva vedere, e [D038](../delega/D038-cio-che-si-preme-e-cio-che-scorre.md) ha bocciato una
riga di CSS misurandola nella finestra vera.

Quella verifica passa da una porta di ispezione e da una ventina di righe che la guidano. Per
**sette sessioni** quelle righe sono vissute nello scratchpad, che è della sessione: chi arrivava
dopo non le trovava e le riscriveva da zero. Sette riscritture per un file che non cambia, e ogni
volta la stessa riscoperta — che il bersaglio si filtra su `localhost` e non sulla porta, che
`Page.reload` termina il processo invece di ricaricarlo, che `element.focus()` non fa scattare
`:focus-visible`.

Il passaggio di consegne lo censiva a ogni chiusura, sempre con la stessa frase: «metterli in
`scripts/` resta una decisione che nessuno ha preso». Sette volte è abbastanza per prenderla.

**Perché era una decisione e non una scorciatoia da fare in silenzio:** una cartella nuova alla
radice è un confine, e questo repo ne ha quattro — `src/`, `tests/`, `docs/`, `build/`. Ognuna ha
una regola che la governa. Una quinta che entrasse senza regole sarebbe il posto dove finisce ciò
che non si vuole giustificare altrove.

## Decisione

`scripts/` esiste, e ospita **strumenti di sviluppo**: cose che si eseguono a mano per capire come
sta il gioco, non cose da cui il gioco dipende.

Tre proprietà, e sono la definizione:

1. **Non entra nel pacchetto.** `electron-builder.yml` la esclude esplicitamente. Quell'elenco è una
   lista di **esclusioni**, quindi una cartella nuova ci finirebbe dentro per difetto: la riga non è
   prudenza, è la correzione di un default.
2. **Nessuno la importa.** Non `src/`, non `tests/`, non la configurazione di build. Il gioco gira
   identico se la cartella sparisce, ed è ciò che la distingue da un passo di build.
3. **Vale il codice come altrove.** I quattro controlli che dicevano «nel codice» e guardavano solo
   `src/` adesso guardano anche qui: niente `TODO` (P01), nessun `eslint-disable` muto (C06),
   identificatori in inglese (C08), nessuna parola vietata nei nomi (C09). Non è zelo — una cartella
   esente dalle regole è il posto dove le regole si aggirano, e sarebbe la ragione per non crearla.

Non nasce con una regola sua, e non è una dimenticanza: ci vive **un** file, e una regola scritta
per difendere un file solo difenderebbe un'ipotesi. Il giorno in cui ce ne fossero due che si
somigliano, il criterio è quello del kit — un pezzo entra quando lo disegnano due.

## Alternative scartate

- **Lasciarli nello scratchpad.** È lo stato di partenza, e il suo prezzo è misurato: sette
  riscritture. Non è nemmeno un pareggio — ogni riscrittura riparte senza le quattro cose imparate,
  e due di quelle costano un'ora ciascuna a riscoprirle.
- **Metterli in `tests/`.** Girano già lì i test di regola, quindi la cartella esiste e non ci
  sarebbe niente da decidere. Ma `vitest.config.ts` include `tests/**/*.test.ts`, e uno strumento
  che si esegue a mano non è un test: finirebbe in una cartella il cui contratto è «tutto qui dentro
  lo esegue il gate», dove non lo esegue nessuno. È la stessa ragione per cui l'ADR 0030 non ha
  messo il telaio in `components/`.
- **Un blocco di codice dentro `PASSAGGIO-DI-CONSEGNE.md`.** Sopravvive alla sessione, che era il
  problema, e in cambio è un programma che nessun gate legge, nessun formatter allinea e nessuno
  può eseguire senza copiarlo. Un documento che contiene codice eseguibile è un documento che
  invecchia in silenzio — è il rischio N07, applicato a un file che nessuno rilegge.
- **Uno script in `package.json`.** Va bene per un comando di una riga. Questo ne ha novanta,
  compresi un client del protocollo e la gestione degli errori, e `package.json` non è un posto in
  cui si scrive un programma.
- **Una dipendenza che faccia lo stesso lavoro** (Playwright, `chrome-remote-interface`). Il
  criterio dell'[ADR 0015](0015-criterio-di-ammissione-delle-dipendenze.md) chiede cosa
  scriveremmo a mano al suo posto: **novanta righe, già scritte sette volte**, contro un pacchetto
  che porta un browser suo o un livello di astrazione su un protocollo che qui si usa per cinque
  comandi. Node ha `WebSocket` fra i globali dalla 22: il client è un `http.get` e un `send`.

## Conseguenze

- Chi arriva non riscrive più lo strumento: lo trova, e con esso le quattro cose che sette sessioni
  hanno pagato per imparare — sono scritte in testa al file, dove chi lo apre le legge comunque.
- Il repo guadagna un **quinto confine** alla radice, e con esso il dovere di dire cosa ci sta
  dentro: la riga in [architettura.md](../architettura.md) è parte di questa decisione, non un
  complemento.
- `eslint.config.js` guadagna un blocco: `scripts/` non passa da TypeScript, quindi `no-undef` è
  acceso e i globali della piattaforma vanno dichiarati. Sono quattro, scritti a mano invece di
  tirare dentro il pacchetto `globals` — una lista corta e vera costa meno di una dipendenza.
- I quattro controlli allargati coprono adesso una cartella in più, e le loro righe in
  [tracciabilita.md](../tracciabilita.md) restano vere: dicevano «nel codice», e adesso lo è.
- `docs/stato.md` **non** conta questa cartella, ed è deliberato: conta ciò che è il prodotto e ciò
  che lo verifica. Il giorno in cui `scripts/` crescesse abbastanza da meritare un conteggio, si
  aggiunge a `projectState.ts` — e quel giorno sarà visibile, perché la cartella è nel diagramma.
