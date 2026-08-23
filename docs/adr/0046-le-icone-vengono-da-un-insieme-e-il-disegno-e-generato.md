# ADR 0046 — Le icone vengono da un insieme, e il disegno è generato

- **Stato:** **Accettata** — [D038](../delega/D038-cio-che-si-preme-e-cio-che-scorre.md):
  `@iconify-json/lucide` è in `devDependencies`, `src/renderer/ui/icons.ts` dichiara l'insieme e i
  nomi, `src/renderer/ui/glyphs.json` è **generato** da `tests/helpers/glyphs.ts`, e la regola
  **R28** con `tests/rules/icons` la impone. Rotta di proposito: un nome inventato in `icons.ts`, un
  corpo modificato a mano in `glyphs.json`, e un `ICON_SET` che punta a un pacchetto non installato
- **Data:** 2026-08-23
- **Richiesto da:** [ADR 0015](0015-criterio-di-ammissione-delle-dipendenze.md), che pretende un ADR
  per ogni dipendenza nuova

## Contesto

Fino a oggi Solvent non aveva **nessuna icona**, e non per caso. `AppNav.vue` porta scritto da
[D024](../delega/D024-il-telaio.md) perché: «i simboli arriveranno col primo dominio che ne porta uno
suo — sceglierli adesso vorrebbe dire inventarli». Al loro posto c'erano due glifi disegnati a mano:
la freccia doppia del bancomat, scritta come **carattere** dentro il template, e il mezzo cerchio
dell'interruttore del tema, disegnato con un gradiente lineare e commentato «non costa un file di
icone».

Erano due decisioni corrette per un'applicazione con due glifi. Non lo restano: un carattere non si
allinea come un disegno e non ha un tratto che si accordi al resto, e un mezzo cerchio fatto di
gradiente è un'icona che nessuno può riusare.

**La richiesta di adottare Iconify è arrivata dall'utente**, e questo documento esiste per
registrare cosa costa e cosa si è scelto di conseguenza — come l'[ADR 0034](0034-il-grafico-e-una-libreria.md)
per ApexCharts. La domanda non è «serve un insieme di icone», è «quale forma può entrare in questo
progetto senza disfare quello che c'è».

Le regole che un insieme di icone incontra qui sono tre, e una libreria di icone le viola tutte e
tre per natura:

- **R15** — nessun colore fuori dai token. Un'icona a colori fissi porta una seconda tavolozza.
- **La pagina è tutta locale** ([ADR 0029](0029-due-caratteri-e-stanno-nel-bundle.md)), e il
  grilletto della CSP nel [registro YAGNI](../roadmap-fette.md) è «la prima cosa che il renderer
  carica senza averla scritta lui». Il componente `@iconify/vue`, nella sua forma consueta, scarica
  i disegni dall'API di Iconify a runtime.
- **A14** — 1.067 righe di CSS morto nel progetto precedente. L'insieme `lucide` è **1.844 icone in
  554 kB** di JSON, e il gioco ne disegna **due**.

## Le tre cose che l'ADR 0015 pretende

| Domanda                                 | Risposta                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quale regola o ADR la rende necessaria  | Nessuna. È una richiesta di prodotto, ed è **la dipendenza con il caso più debole finora ammessa**: sta qui scritto invece che nascosto                                                                                                                                                                                                         |
| Cosa scriveremmo a mano, e quante righe | Oggi: **due `<path d="…">`**, dieci righe. Il criterio dell'ADR 0015 — «sostituisce codice la cui definizione di corretto non è ovvia» — su quel conteggio **non la ammetterebbe**                                                                                                                                                              |
| Perché entra lo stesso                  | Perché ciò che si compra non sono i due disegni: è **l'insieme**. La terza icona e la decima vengono dalla stessa mano della prima, con lo stesso tratto e la stessa griglia, e la licenza viaggia col pacchetto. L'alternativa vera non è «dieci righe»: è che ogni icona futura la scelga e la ricalchi chi ne ha bisogno, un file alla volta |

## Decisione

**L'insieme è [Lucide](https://lucide.dev), e sta nelle `devDependencies` come dati, non come
libreria.** `@iconify-json/lucide` non è mai importato da `src/`: lo legge la derivazione, e nel
pacchetto finisce solo ciò che il gioco nomina.

Il disegno passa da **tre file**, e la divisione è la decisione vera:

| File             | Cos'è              | Chi lo scrive                                                 |
| ---------------- | ------------------ | ------------------------------------------------------------- |
| `ui/icons.ts`    | l'insieme e i nomi | **le persone** — `ICON_SET`, e da `swap` a `arrow-left-right` |
| `ui/glyphs.json` | i tracciati        | **la macchina** — `tests/helpers/glyphs.ts`                   |
| `ui/UiIcon.vue`  | come si disegna    | le persone, una volta                                         |

`UiIcon` non ha una proprietà di misura e non ha un colore: è alto `1em`, quindi prende la misura
del testo che lo ospita, e i corpi dipingono con `currentColor`, quindi prende l'inchiostro di chi
lo ospita e cambia da solo con il tema e con la variante del pulsante. È la stessa proprietà per cui
l'ADR 0034 ha preteso una libreria che rende in SVG, e ne discende che **R15 resta vera senza
un'eccezione.**

Ne discende una regola con un ID e un test:

- **R28** — `glyphs.json` coincide con ciò che la derivazione produce da `icons.ts`; ogni nome
  dichiarato è disegnato da almeno un componente; nessun corpo porta un colore proprio.

## Alternative scartate

- **`@iconify/vue` con il componente `Icon`.** È la strada ufficiale e la più corta. Nella forma
  consueta chiede i disegni all'API di Iconify a runtime: farebbe scattare il grilletto della CSP e
  romperebbe la premessa di tutta locale su cui poggiano le tre difese di
  [D009](../delega/D009-persistenza-main.md). Registrare l'insieme in locale con `addCollection`
  toglie la rete e rimette il difetto A14: quell'oggetto è annidato, quindi non si sfronda, e nel
  pacchetto finiscono 1.844 icone per due.
- **`unplugin-icons` con `@iconify/json`.** Risolve a compilazione ed è sfrondato per costruzione.
  Costa un **plugin di build** dentro una configurazione già delicata — `electron-vite@5` regge
  `vite` fino alla 7 e il progetto è sulla 8, ed è la ragione per cui l'unico comando che installa è
  `npm ci --legacy-peer-deps` (correzione 8 di [D023](../delega/D023-il-design-system.md)) — più un
  file di dichiarazioni per i moduli virtuali, più `@iconify/json` intero sul disco. E un
  `<UiIcon name>` scelto a runtime vuole comunque una tabella scritta a mano dei componenti
  importati: il plugin non toglie la tabella, aggiunge se stesso.
- **Copiare i due tracciati a mano.** Zero dipendenze, dieci righe, ed è la risposta giusta se le
  icone restano due per sempre. Non lo restano, e allora Iconify smetterebbe di essere una fonte e
  tornerebbe a essere un posto da cui si copia — cioè la cosa che questa delega esiste per non fare.
  È la stessa alternativa che l'ADR 0029 ha scartato per i caratteri, con le stesse parole:
  «l'aggiornamento a mano, le licenze da portare a mano, e due file binari che fra un anno nessuno
  saprà da dove vengono».
- **Un file generato in TypeScript invece che in JSON.** Il generatore dovrebbe produrre un sorgente
  che Prettier accetta senza toccarlo, o `format:check` sarebbe rosso subito dopo la rigenerazione.
  Con JSON basta `JSON.stringify(…, null, 2)`, che è già la forma che Prettier scrive.

## Conseguenze

- **Cambiare insieme è cambiare una riga**, `ICON_SET`, più il pacchetto installato. I nomi a destra
  della tabella cambiano con lui, e il gate dice subito quali non esistono nel nuovo insieme.
- Il pacchetto cresce di quanto pesano i tracciati nominati, non di quanto pesa l'insieme. Il numero
  misurato, con la data accanto, sta in [qualita.md](../qualita.md).
- `glyphs.json` è il **secondo** artefatto generato del progetto dopo `docs/stato.md`, e ha lo stesso
  meccanismo: si rigenera con `-u`, e chi lo modifica a mano trova il gate rosso.
- Un'icona aggiunta «che poi servirà» è rossa: R28 pretende che qualcuno la disegni. È
  l'[ADR 0012](0012-controlli-sul-codice-morto-sempre-accesi.md) applicato a una cartella nuova.
- Il progetto acquisisce un vocabolario visivo che prima non aveva. Le destinazioni della colonna
  **restano senza simboli**: quella riga di `AppNav.vue` non è stata disfatta, perché il grilletto
  che dichiara — il primo dominio che porta un simbolo suo — non è ancora scattato.
