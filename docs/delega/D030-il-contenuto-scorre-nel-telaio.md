# D030 — Il contenuto scorre nel telaio

- **Stato:** Chiusa — commit `PENDING`, ramo `d030-il-contenuto-scorre-nel-telaio`. Scritta ed
  eseguita il 2026-08-21
- **Dipende da:** [D024](D024-il-telaio.md), che ha costruito il telaio, e
  [D029](D029-i-devcheat.md) solo nell'ordine di esecuzione: i cheat servono a **mettere** la
  schermata nello stato in cui il difetto si vede
- **Sblocca:** la rifinitura del bancomat. Una schermata non si rifinisce mentre un suo pezzo
  attraversa la testata
- **ADR vincolanti:** ne produce uno,
  [0037](../adr/0037-il-telaio-non-scorre-il-contenuto-si.md). Ne applica due:
  [0030](../adr/0030-il-telaio-e-una-forma-non-un-contenitore.md), che dice che il telaio è una
  forma, e [0032](../adr/0032-le-sovrapposizioni-stanno-nel-livello-superiore.md), la cui frase in
  prosa diventa qui un test
- **Regole:** una regola nuova, **R21**, con `tests/rules/no-z-index`. Nessun invariante nuovo
- **Budget:** ~15 righe di sorgente e ~25 di test — misurate **12** e **22**

## Obiettivo

Impedire che un pezzo del contenuto attraversi la testata scorrendo, senza aprire una scala di
`z-index`.

## Perché esiste

Il difetto lo ha visto l'utente: la carta 3D del bancomat **passa sopra la testata** mentre si
scorre. Sembra un dettaglio estetico ed è un confine, ed è per questo che vale una delega invece di
una riga.

La causa è precisa. `.stage` in `BankCard3d.vue` ha `perspective: 1100px`, e `perspective` — come
`transform`, come un filtro — crea un **contesto di impilamento**. Un elemento così dipinge nello
stesso strato di un elemento posizionato con `z-index: auto`, cioè nello stesso strato della
testata `sticky`; a decidere chi vince è l'ordine nel documento, e il contenuto viene dopo la
testata.

Il commento di `UiShell` aveva già scritto la crepa senza riconoscerla: _«il giorno in cui un
discendente del contenuto si posiziona e passa sopra la testata…»_. Quel giorno era già arrivato
quando la frase è stata scritta.

**Perché non un `z-index`.** Sarebbe una riga, e il canvas di Claude Design la usa (`z-index: 20`
sulla testata). Due ragioni per non farlo, e la seconda vale più della prima: un numero solo non
esiste — ha senso solo rispetto agli altri, quindi il quarto non si sceglie senza rileggere i primi
tre — e risolverebbe **il caso**, non la classe. La prossima `transform` dentro il contenuto
riporterebbe la stessa domanda.

**Il canvas non è l'autorità qui, ed è una distinzione da tenere.** È l'autorità su come si **vede**
una schermata; è un prototipo scritto con gli stili in linea, e il suo
[README](../design/mockups/README.md) dice già che se ne prende un pezzo per volta. Su come è fatto
il telaio l'autorità è l'ADR 0030.

## Da produrre

| File                             | Cosa cambia                                                            |
| -------------------------------- | ---------------------------------------------------------------------- |
| `src/renderer/ui/UiShell.vue`    | il telaio alto quanto la finestra; `.content` unica regione che scorre |
| `tests/rules/no-z-index.test.ts` | **R21**                                                                |
| `docs/adr/0037-…`                | la decisione, con le quattro alternative scartate                      |
| `docs/tracciabilita.md`          | R21 nella tabella                                                      |

## Invarianti

- La pagina non scorre: `document.documentElement.scrollHeight === clientHeight`.
- L'unica regione che scorre è `.content`, e ciò che ci sta dentro non può dipingere fuori.
- **R21** — nessun `z-index` in `src/`.

## Fuori scope

- **La carta.** Non ha niente che non vada: la `perspective` è ciò che la rende un oggetto, e
  toglierla sarebbe togliere P5 per aggiustare un telaio.
- **Il CSS delle librerie.** ApexCharts scrive `z-index` per conto suo. R21 guarda `src/`, e il
  limite è dichiarato nell'ADR e in testa al test.
- **Una testata che si nasconde scorrendo**, o due colonne che scorrono separatamente. La forma
  adesso le regge — si aggiunge una regione, non si cambia modello — ma nessuno le ha chieste.

## Definizione di fatto

- [x] La pagina non scorre più; `.content` sì — misurato nel documento.
- [x] Nel punto appena sopra il bordo inferiore della testata, con la carta scorsa fin sotto,
      `elementFromPoint` risponde **la testata**.
- [x] Lo stesso punto, con il modello di prima rimesso dal vivo, risponde **la carta**: il difetto
      si riproduce a comando.
- [x] Il tooltip resta ancorato dentro l'area che scorre — misurato, e con il modello di prima a
      fare da controllo.
- [x] R21 rotta di proposito con un `z-index: 20` sulla testata: rossa.
- [x] `npm run verify` verde.
- [x] `docs/stato.md` rigenerato.

## La misura

Il metodo è quello che il progetto si è dato dopo D024: **il documento dice se una cosa c'è,
l'immagine dice se è bella.** Qui la domanda era la prima, quindi si è interrogato il documento.

L'ambiente è quello di D017: `npm run build`, la pagina di `out/renderer/` servita da un server
statico, e `window.solvent` finto — con dentro una partita che ha già caveau al livello 4, contanti
e conto, così ogni schermata ha qualcosa da mostrare invece di aspettarlo.

Il punto misurato è **il pixel appena sopra il bordo inferiore della testata**, in colonna con il
centro della carta, con il contenuto scorso di 220 px.

| Modello                                    | `elementFromPoint` risponde | Il rettangolo della carta arriva a |
| ------------------------------------------ | --------------------------- | ---------------------------------- |
| Nuovo — il contenuto scorre nella sua area | `strip` (la testata)        | y = 25, cioè **sopra** la testata  |
| Quello di prima, rimesso dal vivo          | `DD` (dentro la carta)      | y = −15                            |

La riga che conta è la prima: **il rettangolo della carta arriva sopra la testata anche adesso**, e
non si vede lo stesso. Non vince la testata — è che la carta viene tagliata dal bordo della propria
area prima di arrivarci. È la differenza fra risolvere il caso e togliere la classe.

## Trappole note

1. **`isolation: isolate` sul contenuto sembra la risposta e non lo è.** Crea un contesto di
   impilamento, ma quel contesto dipinge ancora nello stesso strato della testata e ancora dopo di
   lei nell'ordine del documento. Sposta il problema di un livello senza cambiarne l'esito. Chi
   conosce la regola di impilamento ci arriva per primo.
2. **`min-height: 0` su `.content` non è superfluo.** Un elemento flessibile non scende sotto la
   propria dimensione naturale finché non gliela si toglie: senza quella riga il contenuto spinge
   invece di scorrere, e `overflow-y` non interviene mai. È il difetto che sembra «l'overflow non
   funziona».
3. **La colonna può tagliare in silenzio.** Con un telaio ad altezza fissa, una colonna più lunga
   della finestra perde le voci in fondo senza dire niente. `overflow-y: auto` su `.nav` costa una
   riga e chiude una classe che oggi non esiste e domani sì.

## Correzioni rispetto a com'era scritta la delega

1. **La delega prevedeva un file toccato; ne ha toccati due**, e il secondo è la colonna. Con la
   pagina che scorreva, `.nav` alta `100vh` e `sticky` non poteva tagliare niente: era la pagina a
   crescere. Con il telaio fermo quella proprietà sparisce, e il difetto sarebbe nato **da questa
   delega** invece che esistere già.
2. **Il tooltip andava verificato, e la verifica ha prodotto un falso allarme.** Aperto **prima**
   di scorrere, il riquadro risultava a 214 px dalla propria ancora invece di 6. Sembrava una
   regressione dell'ancoraggio CSS dentro un contenitore che scorre; non lo era. In quell'ambiente
   la finestra non compone frame, e Chromium ricolloca le ancore in un passo **dopo** il layout, una
   volta per frame. La prova è che il **modello di prima**, rimesso dal vivo nella stessa pagina,
   dà lo stesso 214: è l'ambiente, non la modifica. Con il riquadro aperto **dopo** lo scorrimento —
   che è anche il caso vero, perché un tooltip si apre col puntatore — la distanza è 6 e lo scarto
   orizzontale zero.
   La lezione è quella già scritta in [D024](D024-il-telaio.md) con un'altra faccia: **una misura
   presa in un ambiente che non dipinge va confrontata con un controllo preso nello stesso
   ambiente**, o il primo numero strano diventa un difetto inventato.
3. **R21 copre anche i `.css`, e la prima stesura no.** `sourceFiles` di default guarda `.ts` e
   `.vue`: `tokens.css` sarebbe rimasto fuori, cioè proprio il file in cui una scala di `z-index`
   nascerebbe più naturalmente. Il test lo dichiara adesso con un caso di prova che pretende quel
   nome nell'elenco.
