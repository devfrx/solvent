# I mockup

Disegni consegnati dall'utente. **Non sono documentazione e non sono codice:** sono la fonte da cui
alcune decisioni sono state ricavate, e servono a rileggere quelle decisioni contro ciò che il
disegno diceva davvero.

Nessuno di questi file si modifica. Se il disegno cambia, si sostituisce.

| File                                                           | Cos'è                                                 | Chi l'ha usato                                            |
| -------------------------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| [fetta-01-primo-stipendio.html](fetta-01-primo-stipendio.html) | la prima schermata, approvata allo STOP 1             | [D012](../../delega/D012-ui-e-i18n.md)                    |
| [home-atm.html](home-atm.html)                                 | la home: bancomat sopra, cruscotto sotto              | [D015](../../delega/D015-home-bancomat.md), ADR 0018      |
| [solvent-canvas.dc.html](solvent-canvas.dc.html)               | il canvas di Claude Design: **l'intera applicazione** | [D023](../../delega/D023-il-design-system.md), e ora D027 |

## Il canvas, e come si legge

`solvent-canvas.dc.html` è di un'altra specie dagli altri due. Disegna **diciotto domini** mentre il
codice ne ha tre: board, bancomat, black market, immobiliare, impresa, casinò, crypto, la carta come
oggetto, e altro. È un prototipo dell'intera applicazione, non di una schermata.

Ne discende l'unico modo sano di usarlo, che è quello che
[D023](../../delega/D023-il-design-system.md) ha stabilito e che
[D024](../../delega/D024-il-telaio.md) ha ripetuto: **se ne prende un pezzo per volta, e solo quando
esiste il dominio dietro.** Costruirlo tutto in un pomeriggio è il difetto A17 con un vestito bello,
e le righe di ciò che resta fuori stanno nel [registro YAGNI](../../roadmap-fette.md), sotto _Nel
design, e non ancora nel codice_.

**Si legge nel sorgente, non solo guardandolo.** È il metodo che ha dato le risposte migliori due
volte: D023 ne ha ricavato i ruoli di colore e le scale leggendo cosa il file **ripete**, e
[D027](../../delega/D027-un-grafico-e-una-serie-che-nessuno-tiene.md) ha scoperto che il grafico
«Net worth · 30 days» non usa nessuna libreria — sono trenta `<div>` con l'altezza in percentuale, e
in tutto il file non compare un solo `<svg>` o `<canvas>`. Guardandolo, quella cosa non si vede.

Tre note su cosa il file contiene e che va saputo prima di crederci:

- **È marcato con i costrutti del suo strumento** — `<x-dc>`, `<sc-if>`, `{{ theme }}` — e senza il
  `support.js` che lo accompagnava non si anima. Quel file **non è qui**: avrebbe voluto
  un'eccezione in ESLint per un asset che nessuno esegue. La pagina resta leggibile lo stesso.
- **Porta ancora le ere.** In alto a sinistra si legge «Era 3 · Enterprise». Le ere **non esistono
  più** come struttura di gioco: la [visione](../../prodotto/visione.md) è stata riscritta il
  2026-08-20 e il gioco è una sandbox con requisiti. Quella riga è del giorno in cui il disegno è
  stato fatto.
- **La sua colonna ha due voci**, `Board` e `Design system`, e i domini stanno dentro la prima come
  riquadri. Il codice ha preso un'altra strada — un dominio, una pagina
  ([ADR 0033](../../adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)) — e la ragione è scritta
  lì. Il canvas non è l'arbitro della navigazione.
