<script setup lang="ts">
import { ref } from 'vue'

import UiText from './UiText.vue'

/**
 * D025 · ADR 0032 — la spiegazione che non occupa posto, e l'**unico** modo di farne una: R17
 * vieta l'attributo `title` del browser in ogni `.vue` di `src/`.
 *
 * Sta nel livello superiore del motore, non dentro il flusso, e sono tre problemi risolti in un
 * colpo: non lo taglia un antenato con `overflow: hidden`, non ha bisogno di un `z-index` perché
 * il livello superiore non partecipa all'impilamento, e `Esc` lo chiude senza che nessuno lo
 * scriva. A collocarlo è l'ancoraggio CSS: nessuna libreria, nessuna misura presa a mano, e il
 * ribaltamento vicino al bordo è una proprietà invece di un calcolo.
 *
 * **Tutte le istanze usano lo stesso nome di ancora, e non si confondono.** `anchor-name` è
 * globale al documento, quindi la strada consueta sarebbe generare un nome per istanza; qui invece
 * `anchor-scope` lo **richiude nel sottoalbero** di chi lo dichiara, e ogni bolla vede solo la
 * propria. Il nome resta scritto nel CSS, che è l'unico posto in cui un nome di ancora funziona:
 * `anchor-name: var(--qualcosa)` **non** si risolve, e la prima stesura di questo componente lo
 * faceva — le bolle finivano tutte nell'angolo in alto a sinistra. Provato, non supposto.
 *
 * **Nessun ritardo e nessuna dissolvenza.** Il ritardo di circa un secondo è uno dei motivi per cui
 * l'attributo del browser non basta, e riprodurlo qui sarebbe copiare il difetto; una dissolvenza
 * attraverso `display` vuole `@starting-style` e `allow-discrete`, cioè tre righe di CSS per un
 * effetto che D023 aveva già dichiarato fuori scopo.
 *
 * ⚠️ **Un limite, dichiarato:** l'involucro prende il fuoco della tastiera, perché senza non si
 * arriverebbe mai a una spiegazione attaccata a un'etichetta — che non è raggiungibile per sua
 * natura. Il giorno in cui si avvolgesse un elemento **già** raggiungibile, il tabulatore si
 * fermerebbe due volte: quel giorno la spiegazione va messa dentro quell'elemento, non attorno.
 */

withDefaults(
  defineProps<{
    /** Già tradotto (R14): il kit non sa cosa voglia dire. */
    readonly text: string
    /** Da che parte, quando c'è posto. Se non ce n'è, il ripiego lo dichiara il CSS. */
    readonly side?: 'top' | 'bottom'
  }>(),
  { side: 'top' }
)

const bubble = ref<HTMLElement | null>(null)

/**
 * Le due guardie non sono prudenza: aprire un riquadro già aperto — o chiuderne uno già chiuso —
 * è un errore, e succede appena il puntatore entra su un elemento che ha anche il fuoco.
 */
const show = (): void => {
  const element = bubble.value
  if (element !== null && !element.matches(':popover-open')) element.showPopover()
}

const hide = (): void => {
  const element = bubble.value
  if (element !== null && element.matches(':popover-open')) element.hidePopover()
}
</script>

<template>
  <span
    class="ui-tooltip"
    tabindex="0"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
    <span ref="bubble" popover class="bubble" :class="side" role="tooltip">
      <UiText size="xs">{{ text }}</UiText>
    </span>
  </span>
</template>

<style scoped>
.ui-tooltip {
  display: inline-flex;
  align-items: center;
  anchor-name: --tooltip;
  anchor-scope: --tooltip;
  cursor: help;
  border-radius: var(--radius-xs);
}

.ui-tooltip:focus-visible {
  outline: 1px solid var(--color-ink-3);
  outline-offset: var(--space-1);
}

/*
 * `inset: auto` e `margin` disfano ciò che il foglio di stile del motore mette su ogni riquadro del
 * livello superiore — inset a zero e margine automatico, cioè «al centro dello schermo». Senza
 * queste due righe l'ancoraggio non ha niente su cui lavorare, e il margine che resta è la distanza
 * dall'elemento che apre.
 */
.bubble {
  position: fixed;
  inset: auto;
  margin: var(--space-2);
  padding: var(--space-3) var(--space-4);
  width: max-content;
  max-width: 34ch;
  position-anchor: --tooltip;
  justify-self: anchor-center;
  background: var(--color-raised);
  color: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  overflow: visible;
}

/* Se da quella parte non ci sta, si ribalta dall'altra. È una dichiarazione, non un calcolo. */
.bubble.top {
  position-area: top;
  position-try-fallbacks: flip-block;
}

.bubble.bottom {
  position-area: bottom;
  position-try-fallbacks: flip-block;
}
</style>
