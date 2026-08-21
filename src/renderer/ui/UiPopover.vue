<script setup lang="ts">
import { ref, useId } from 'vue'

/**
 * D031 · ADR 0032 — la sovrapposizione, e da qui in poi l'**unica**: R22 vieta l'attributo
 * `popover` in ogni altro `.vue` di `src/`.
 *
 * Sta nel livello superiore del motore, non dentro il flusso, e sono tre problemi risolti in un
 * colpo: non lo taglia un antenato con `overflow: hidden`, non ha bisogno di un `z-index` perché il
 * livello superiore non partecipa all'impilamento (R21), e `Esc` lo chiude senza che nessuno lo
 * scriva. A collocarlo è l'ancoraggio CSS: nessuna libreria, nessuna misura presa a mano, e il
 * ribaltamento vicino al bordo è una proprietà invece di un calcolo.
 *
 * **Non dipinge niente**, ed è la sua parte più importante. Fondo, bordo, ombra e larghezza sono
 * del contenuto, cioè di chi chiama: `UiTooltip` è una bolla stretta e smorzata, il pannello dei
 * cheat una colonna tratteggiata, e i due non hanno una pittura in comune da condividere. Ciò che
 * hanno in comune è la meccanica, ed è tutto quello che sta in questo file.
 *
 * ## Perché esiste, e cosa rende impossibile
 *
 * `display` su un elemento con `popover` è la riga che disfa il meccanismo, e sta **qui e in
 * nessun altro posto**. Il foglio di stile del motore tiene chiuso un riquadro con `display: none`;
 * una regola d'autore vince su quella del motore **a qualunque specificità**, perché arriva da
 * un'origine più forte della cascata. Ne discende che un solo `display: flex` scritto senza
 * condizione tiene il riquadro visibile per sempre: il motore chiude, e lo schermo non cambia.
 *
 * È successo davvero. Il pannello dei cheat di [D029](../../../docs/delega/D029-i-devcheat.md) non
 * si chiudeva, e per due stesure la colpa era stata data alla meccanica di apertura — che era
 * giusta tutte e due le volte. La causa è stata letta nella finestra vera durante
 * [D032](../../../docs/delega/D032-la-commissione-scala-il-pavimento-no.md): `#dev-panel` era
 * visibile e cliccabile mentre `:popover-open` era **falso**.
 *
 * `UiTooltip` non aveva il difetto, e non per progetto: la sua bolla non scriveva `display` perché
 * non le serviva. Una regola rispettata per fortuna è una regola che il prossimo componente rompe —
 * ed è la ragione per cui questo pezzo esiste invece di una nota nella documentazione.
 *
 * Qui i due stati sono **scritti tutti e due**, chiuso e aperto. La regola del motore basterebbe da
 * sola, ma allora l'invariante starebbe in un foglio di stile che nessuno apre; scritta così, chi
 * legge questo file vede che `display` ha una condizione e non gliene toglie una.
 */

const props = withDefaults(
  defineProps<{
    /**
     * Cosa lo apre. Il **puntatore** per una spiegazione — che si raggiunge anche col tabulatore e
     * non prende il fuoco — la **pressione** per un riquadro che si comanda.
     *
     * Non è una comodità: le due strade hanno meccaniche opposte, e sceglierne una a mano è come
     * nasce il difetto. Premendo, l'apertura è **dichiarativa** (`popovertarget`) e il motore fa
     * tutto, invocante compreso; aprire e chiudere a mano da un `@click` non funziona, perché un
     * riquadro si congeda da sé al clic fuori e il pulsante è fuori — quindi il motore chiude e il
     * gestore riapre nello stesso clic. Col puntatore invece non c'è un invocante che il motore
     * riconosca, e le due chiamate servono davvero.
     */
    readonly on?: 'hover' | 'press'
    /** Da che parte, quando c'è posto. Se non ce n'è, il ripiego lo dichiara il CSS. */
    readonly side?: 'top' | 'bottom'
  }>(),
  { on: 'press', side: 'top' }
)

/**
 * L'aggancio dichiarativo vuole un `id`, e due istanze in pagina non possono averlo uguale.
 * `useId` lo dà stabile fra server e client e diverso per istanza: generarlo a mano vorrebbe dire
 * un contatore di modulo, cioè stato globale in un pezzo del kit.
 */
const id = useId()

const box = ref<HTMLElement | null>(null)

const open = ref(false)

/**
 * Le due guardie non sono prudenza: aprire un riquadro già aperto — o chiuderne uno già chiuso — è
 * un errore, e succede appena il puntatore entra su un elemento che ha anche il fuoco.
 */
const show = (): void => {
  if (props.on !== 'hover') return
  const element = box.value
  if (element !== null && !element.matches(':popover-open')) element.showPopover()
}

const hide = (): void => {
  if (props.on !== 'hover') return
  const element = box.value
  if (element !== null && element.matches(':popover-open')) element.hidePopover()
}

/**
 * Lo stato aperto/chiuso arriva **dal motore**, non da noi, ed è vero in tutte e due le modalità:
 * il motore lo cambia anche quando chiude per `Esc` o per un clic fuori, che sono i due casi in cui
 * uno stato tenuto a mano si scollegherebbe. A noi resta di consegnarlo a chi disegna l'aggancio,
 * che ne ha bisogno per `aria-expanded`.
 */
const onToggle = (event: Event): void => {
  open.value = (event as ToggleEvent).newState === 'open'
}
</script>

<template>
  <div
    class="ui-popover-anchor"
    :class="on"
    :tabindex="on === 'hover' ? 0 : undefined"
    :aria-describedby="on === 'hover' ? id : undefined"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <!--
      Chi apre. Riceve `popovertarget` e `expanded` invece di essere disegnato qui: il pulsante è
      del chiamante — tratteggiato per i cheat, una parola sottolineata per una spiegazione — e un
      pezzo del kit che lo disegnasse tornerebbe a essere un contenitore (ADR 0030).
    -->
    <slot name="trigger" :popovertarget="id" :expanded="open" />

    <div
      :id="id"
      ref="box"
      popover
      class="ui-popover"
      :class="side"
      :role="on === 'hover' ? 'tooltip' : undefined"
      @toggle="onToggle"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
/*
 * L'ancora. `anchor-name` è **globale al documento**, quindi la strada consueta sarebbe generarne
 * uno per istanza; `anchor-scope` invece lo richiude nel proprio sottoalbero, e ogni riquadro vede
 * solo la propria. Il nome resta scritto nel CSS, che è l'unico posto in cui un nome di ancora
 * funziona: `anchor-name: var(--qualcosa)` **non** si risolve, e la prima stesura di `UiTooltip` lo
 * faceva — le bolle finivano tutte nell'angolo in alto a sinistra. Provato, non supposto.
 *
 * Il riquadro sta **dentro** l'ancora nel documento, e deve starci: `anchor-scope` confina il nome
 * al sottoalbero, quindi un fratello non lo vedrebbe. Che poi il motore lo sposti nel livello
 * superiore non cambia niente — l'ancoraggio guarda l'albero, non la pittura.
 */
.ui-popover-anchor {
  display: inline-flex;
  align-items: center;
  anchor-name: --ui-popover;
  anchor-scope: --ui-popover;
}

.ui-popover-anchor:focus-visible {
  outline: 1px solid var(--color-ink-3);
  outline-offset: var(--space-1);
  border-radius: var(--radius-xs);
}

/*
 * `inset: auto` e `margin` disfano ciò che il foglio di stile del motore mette su ogni riquadro del
 * livello superiore — inset a zero e margine automatico, cioè «al centro dello schermo». Senza
 * queste due righe l'ancoraggio non ha niente su cui lavorare, e il margine che resta è la distanza
 * dall'elemento che apre.
 *
 * Niente fondo, niente bordo, niente ombra e niente larghezza: quelli sono del contenuto.
 */
.ui-popover {
  position: fixed;
  inset: auto;
  margin: var(--space-2);
  padding: 0;
  border: none;
  background: none;
  overflow: visible;
  position-anchor: --ui-popover;
  justify-self: anchor-center;
}

/*
 * **Le due righe che questo componente esiste per possedere.** Chiuso non si vede, aperto sì, e la
 * seconda vince sulla prima perché è più specifica. Scriverne una sola senza condizione — che è la
 * cosa che viene naturale il giorno in cui serve impilare del contenuto — tiene il riquadro
 * visibile per sempre: è il difetto di D029, e da qui in poi non può più nascere altrove, perché
 * R22 impedisce a chiunque altro di avere in mano un elemento con `popover`.
 */
.ui-popover:not(:popover-open) {
  display: none;
}

.ui-popover:popover-open {
  display: flex;
  flex-direction: column;
}

/* Se da quella parte non ci sta, si ribalta dall'altra. È una dichiarazione, non un calcolo. */
.ui-popover.top {
  position-area: top;
  position-try-fallbacks: flip-block;
}

.ui-popover.bottom {
  position-area: bottom;
  position-try-fallbacks: flip-block;
}

/* Una spiegazione si chiede col puntatore, e il puntatore lo dice. */
.ui-popover-anchor.hover {
  cursor: help;
}
</style>
