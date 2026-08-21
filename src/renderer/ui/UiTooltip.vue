<script setup lang="ts">
import UiPopover from './UiPopover.vue'
import UiText from './UiText.vue'

/**
 * D025 · ADR 0032 — la spiegazione che non occupa posto, e l'**unico** modo di farne una: R17
 * vieta l'attributo `title` del browser in ogni `.vue` di `src/`.
 *
 * Da [D031](../../../docs/delega/D031-la-sovrapposizione-e-un-pezzo-del-kit.md) non possiede più la
 * propria meccanica: livello superiore, ancoraggio, ripieghi, apertura e chiusura sono di
 * `UiPopover`, e qui resta ciò che fa di una sovrapposizione una **spiegazione** — che si apre col
 * puntatore, che porta del testo e basta, e che non prende il fuoco.
 *
 * Il file si è accorciato di due terzi, e non è la misura interessante. Quella è che le righe
 * andate via erano le stesse che il pannello dei cheat aveva riscritto per conto proprio,
 * sbagliandone una — ed è per questo che questo componente non aveva il difetto: non perché fosse
 * scritto meglio, ma perché non gli era servito scrivere quella riga.
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
</script>

<template>
  <UiPopover class="ui-tooltip" on="hover" :side="side">
    <template #trigger>
      <slot />
    </template>
    <span class="bubble">
      <UiText size="xs">{{ text }}</UiText>
    </span>
  </UiPopover>
</template>

<style scoped>
.ui-tooltip {
  border-radius: var(--radius-xs);
}

/*
 * La pittura, che è tutto ciò che resta di questo file. `UiPopover` non ne ha nessuna di proposito:
 * una bolla smorzata e stretta e un pannello di sviluppo tratteggiato non hanno una superficie in
 * comune da condividere, e darne una al pezzo del kit vorrebbe dire poi disfarla due volte.
 */
.bubble {
  padding: var(--space-3) var(--space-4);
  width: max-content;
  max-width: 34ch;
  background: var(--color-raised);
  color: var(--color-ink-2);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
}
</style>
