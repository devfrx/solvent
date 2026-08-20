# ADR 0028 — Il kit UI non sa che gioco è

- **Stato:** **Accettata** — [D023](../delega/D023-il-design-system.md): `src/renderer/ui/`, la
  riga di `no-restricted-imports`, `tests/rules/ui-kit-is-standalone` e
  `tests/rules/no-color-literals`. Tutte e tre rotte di proposito, e il nodo `UI` del diagramma non
  ha frecce in uscita
- **Data:** 2026-08-20

## Contesto

Nel progetto precedente il difetto A14 erano 1.067 righe di CSS morto. La quantità non era la
causa: la causa era che nessun confine diceva dove finisce lo stile e dove comincia il gioco, così
ogni componente si disegnava i propri colori e nessuno poteva sapere quali fossero ancora vivi.

Qui il problema è molto più piccolo, e ha già lasciato un segno. I token e cinque primitive —
`.panel`, `.caption`, `.amount`, i due pulsanti e `.refusal` — vivono in un blocco `<style>` **non
scoped** dentro `App.vue`, l'unico del progetto, e la regola che le governa è di review: «una
primitiva entra lì quando la disegnano **due** componenti». [D016](../delega/D016-correzioni-audit.md)
ha trovato `.refusal` copiata in due pannelli, con il valore di `--danger` ricopiato a mano in
quattro righe di `rgba()`: cambiare il token avrebbe spostato il testo e lasciato indietro sfondo e
bordo.

Una regola tenuta dalla review si rompe in silenzio. È la lezione di [D001](../delega/D001-tooling-e-gate.md),
ripetuta da [D021](../delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md) e da
[D022](../delega/D022-il-confine-disegnato-e-il-confine-vero.md).

E adesso arriva molto più materiale: un design vero, con due dozzine di ruoli di colore in due
temi, due caratteri e otto principi. Un blocco dentro `App.vue` non lo regge, e soprattutto non lo
**difende**.

## Decisione

Il design system è un **livello**, `src/renderer/ui/`, e ha una proprietà sola: **non sa che gioco
è.**

- non importa `@core/**` — nessun dominio, nessun kernel, nessun contratto
- non importa `stores/**` — nessuno stato dell'applicazione
- non importa `i18n/**` — **riceve** il testo, non lo cerca

Nel diagramma di [architettura.md](../architettura.md) è il primo nodo con **solo frecce
entranti**. Non è una metafora: è la definizione, disegnata.

Ne discendono due regole con un ID e un invariante:

- **R14** — un file di `ui/` non importa dominio, store o parole.
- **R15** — nessun colore vive fuori dai token: niente `#rrggbb`, `rgb()` o `hsl()` in un `.vue` o
  in un `.ts` del renderer.
- **INV-21** — un pulsante spento porta la propria ragione. Non è disciplina: è la firma di
  `UiButton`, che senza `reason` non compila.

Il blocco non scoped di `App.vue` sparisce. I token diventano `ui/tokens.css`, importato una volta
dal bootstrap; le cinque primitive diventano componenti con proprietà tipizzate.

## Alternative scartate

- **Lasciare le primitive come classi CSS.** È ciò che c'è oggi, e per il colore funziona — R15 da
  sola chiuderebbe la falla di `.refusal`. Non funziona per l'unica regola che il design chiede
  davvero: «un'azione che non puoi fare non è mai un pulsante morto». Una classe non può pretendere
  una ragione. Un tipo sì, e la pretende a compilazione.
- **Un pacchetto separato, `packages/ui`.** Un confine di build per un'applicazione sola. Il
  confine serve; il monorepo no. R14 lo impone con una riga di lint e un test — due file invece di
  una ristrutturazione.
- **Componenti generici di impaginazione, `UiRow` e `UiStack`.** Nascono con due proprietà e ne
  hanno dodici dopo tre schermate: è il debito classico dei design system. Uno spazio fra due
  elementi è una riga di CSS scoped dentro il componente che lo vuole.
- **Adottare il design come foglio di stile globale.** Il canvas non ha nemmeno una classe: sono
  centinaia di stili scritti dentro i tag. Non c'è niente da copiare — i pezzi si **ricavano** da
  ciò che quel disegno ripete, ed è un lavoro di lettura, non di trascrizione.

## Conseguenze

- Un componente nuovo non può inventarsi un colore: R15 è rossa prima che qualcuno lo veda.
- `ui/` è riusabile perché non ha nulla **da** cui dipendere. Un pezzo che un giorno avesse bisogno
  dell'i18n non sarebbe una primitiva: sarebbe un componente di dominio nel posto sbagliato, e R14
  lo direbbe subito.
- Il diagramma guadagna un nodo, e `tests/rules/import-graph` lo verifica nei due versi (C13). Una
  freccia in uscita da `UI` è impossibile da disegnare senza rendere rosso il test.
- La tabella delle regole di [architettura.md](../architettura.md) passa da tredici righe a
  quindici. Non è un'inflazione: è la prima volta che il renderer ha un confine interno.
- Il tema resta un dato, non un `if`: due blocchi di token, e la stessa marcatura sotto tutti e due.
