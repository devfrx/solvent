<script setup lang="ts">
import type { Surface } from './roles'
import { surfaceVar } from './roles'
import UiLabel from './UiLabel.vue'

/**
 * La superficie: fondo, bordo, raggio, ombra. Nel canvas è la forma portante — un riquadro con
 * un'etichetta in alto e una riga che la stacca dal contenuto.
 *
 * `title` è testo **già tradotto**, non una chiave: una chiave obbligherebbe il kit a conoscere
 * l'i18n, e R14 lo vieta. Chi non ha titolo non paga l'intestazione, perché non viene disegnata.
 *
 * L'ombra viene dal token e nel tema scuro è trasparente: nel design lo scuro non ha ombre, e a
 * dirlo è il colore invece di una seconda regola.
 */

withDefaults(
  defineProps<{
    readonly surface?: Surface
    readonly title?: string
    /** Il riquadro del cruscotto è denso: molti su una riga, un numero ciascuno. */
    readonly dense?: boolean
  }>(),
  { surface: 'surface', title: '', dense: false }
)
</script>

<template>
  <section class="ui-panel" :class="{ dense }" :style="{ background: surfaceVar(surface) }">
    <header v-if="title !== ''" class="head">
      <UiLabel>{{ title }}</UiLabel>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>

<style scoped>
.ui-panel {
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: var(--space-5) var(--space-6);
}

.ui-panel.dense {
  padding: var(--space-4);
  border-radius: var(--radius-md);
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-line-soft);
}
</style>
