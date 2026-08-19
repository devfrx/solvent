# D014 — Dominio: bancomat

- **Stato:** Aperta
- **Dipende da:** D007, D008
- **Sblocca:** D011
- **ADR vincolanti:** 0017, 0018, 0019, 0020
- **Regole:** R04, R07, R10, R11
- **Budget:** ~80 righe

## Obiettivo

Il gesto centrale del gioco: spostare denaro fra contanti e carta, pagandone il prezzo. È ciò che
rende la dualità dell'ADR 0017 una scelta invece che un'etichetta.

## Da produrre

`src/core/domains/atm/`

| File          | Contenuto                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------- |
| `types.ts`    | lo stato: soglie usate oggi, ultime operazioni                                               |
| `rules.ts`    | funzioni **pure**: commissione per importo, importo netto, se il prelievo sta nella capienza |
| `commands.ts` | `deposita(importo)` e `preleva(importo)`, entrambi `Result`                                  |
| `system.ts`   | `defineSystem` — ha stato, quindi `save` / `load` / `reset`                                  |

## Invarianti

- Deposito e prelievo sono **una transazione sola** ciascuno (ADR 0019). Mai due `post()`.
- La commissione è un movimento verso `fees`, non una sottrazione mascherata. È lo **stesso**
  meccanismo che userà lo spread delle fiches e la percentuale del black market.
- **La commissione è calcolabile prima della conferma.** `rules.ts` espone una funzione pura che
  la UI chiama per mostrare l'anteprima: la stessa che il comando usa per eseguire. Due formule
  che devono coincidere sono due formule che prima o poi divergono.
- Un prelievo che supererebbe la capienza del caveau **fallisce con un motivo**, non con un
  pulsante spento. Per la fetta 01 la capienza non esiste ancora: il codice deve comunque
  interrogarla invece di assumerla infinita, altrimenti la fetta 02 sarà una modifica invasiva.
- Deposito e prelievo hanno **cause di fallimento diverse**, ed è il motivo per cui la fetta 01 ne
  include due: fondi insufficienti, commissione superiore al residuo, capienza superata, importo
  non positivo. Un solo comando non avrebbe messo alla prova `Result`.
- Un importo di zero o negativo è un errore, non un non-evento: il giocatore ha sbagliato, e va
  detto.

## Fuori scope

- Soglie giornaliere e limiti che salgono col livello: grilletto = quando esiste una progressione.
- Interessi sul conto: arrivano con i depositi vincolati.
- Capienza reale del caveau: fetta 02. Qui si interroga, non si definisce.
- Commissioni variabili per fascia oraria, promozioni, carte diverse.

## Definizione di fatto

- [ ] test: prelievo riuscito → tre movimenti in **una** transazione, somma zero
- [ ] test: la commissione mostrata in anteprima è **esattamente** quella applicata — stessa
      funzione, non due
- [ ] test: fondi insufficienti → nulla si muove, errore con `required` e `available`
- [ ] test: commissione superiore al residuo → rifiuto, con un codice diverso da "fondi insufficienti"
- [ ] test: importo zero o negativo → rifiuto
- [ ] test: deposito riuscito → i contanti scendono, il conto sale, `fees` cresce
- [ ] test: `save` → `load` conserva lo stato del bancomat
- [ ] test: dopo una sequenza mista di depositi e prelievi, la somma di tutti i conti è zero

## Trappole note

- **Due formule per la commissione** è il difetto più probabile di questa delega: una nella UI per
  l'anteprima, una nel comando per l'esecuzione. Devono essere la stessa funzione pura, importata
  da entrambi. È anche il motivo per cui `rules.ts` è puro.
- Calcolare il netto e poi il lordo con due arrotondamenti diversi fa sparire dei centesimi. Con la
  partita doppia il test d'invariante lo prende; senza sarebbe passato inosservato per mesi.
- Interrogare una capienza che non esiste ancora sembra codice morto. Non lo è: è il confine
  giusto, tracciato prima che serva, e costa una chiamata a una funzione che oggi ritorna
  "illimitata". La fetta 02 le darà un valore senza toccare questo file.
