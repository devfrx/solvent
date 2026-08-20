# ADR 0029 — Due caratteri, e stanno nel bundle

- **Stato:** Proposta — le due dipendenze entrano con
  [D023](../delega/D023-il-design-system.md)
- **Data:** 2026-08-20

## Contesto

[P2](../prodotto/preferenze.md) diceva «tipografia di sistema, nessun font caricato», e la ragione
era il costo: un carattere caricato è peso, una richiesta e una decisione in più, per un beneficio
che a occhio sembra estetico.

Il design lo contraddice, e non per gusto. Ne chiede due, con due mestieri diversi:

- **JetBrains Mono** per ogni cifra, ogni etichetta e ogni codice, con cifre tabulari. La ragione
  è scritta nel design stesso: le cifre non devono ballare mentre ticchettano. È la stessa cosa che
  P2 chiedeva già — «cifre tabulari sempre» — ma un carattere di sistema non garantisce il
  tabulare: lo garantisce se ce l'ha.
- **Instrument Sans** per tutto ciò che è rivolto al giocatore, dove il problema vero sono le due
  lingue e la lunghezza del tedesco.

Nel canvas il mono compare centinaia di volte e il sans una sola. Non è una svista: l'interfaccia
**è** monospaziata, e il sans è riservato alla prosa. È un'identità, non una decorazione.

## Decisione

Due caratteri, e stanno **nel bundle**: pacchetti `@fontsource`, risolti a compilazione e serviti
dall'applicazione stessa.

Sono due dipendenze nuove, ed è per questo che questo documento esiste (ADR 0015).

## Alternative scartate

- **Google Fonts con un `<link>`.** La pagina smetterebbe di essere tutta locale, e con essa
  cadrebbe la premessa delle tre difese di [D009](../delega/D009-persistenza-main.md). Farebbe
  scattare il grilletto della **CSP** scritto nel [registro YAGNI](../roadmap-fette.md) — «la prima
  cosa che il renderer carica senza averla scritta lui, un font» — cioè aggiungerebbe un secondo
  lavoro a questo. E un gioco desktop che ha bisogno della rete per disegnare un numero è rotto.
- **Copiare i `.woff2` a mano nel repo.** Zero dipendenze, e in cambio l'aggiornamento a mano, le
  licenze da portare a mano e due file binari che fra un anno nessuno saprà da dove vengono. Due
  pacchetti versionati costano meno.
- **Restare ai caratteri di sistema.** Il tabulare non è garantito, e il tabulare è metà del punto.
  L'altra metà è che due mestieri diversi vogliono due voci diverse, e con una famiglia sola la
  distinzione la si finge col peso.

## Conseguenze

- Le dipendenze di runtime del progetto non sono più solo quelle approvate allo STOP 1: queste due
  però spariscono dentro il bundle, e non esiste una riga di codice che le importi a runtime.
- La pagina resta tutta locale. La CSP resta **rimandata**, col suo grilletto intatto — non è stata
  aggirata, semplicemente non è scattata.
- Il bundle cresce. Di quanto lo dice la delega che le installa, misurato: un numero scritto qui
  sarebbe scaduto il giorno dopo (C11).
- Ogni numero del gioco eredita il tabulare dal carattere invece che da una riga di CSS ripetuta.
- Le licenze viaggiano nei pacchetti, quindi la prima distribuzione non trova una sorpresa.
