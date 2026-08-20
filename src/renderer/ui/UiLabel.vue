<script setup lang="ts">
import type { ColorRole } from './roles'
import { toneVar } from './roles'

/**
 * L'etichetta: mono, maiuscola, con la spaziatura larga. È la forma che il canvas ripete più di
 * ogni altra, ed è la firma dello stile — quella che, tolta, fa sembrare l'interfaccia di un altro
 * gioco.
 *
 * Non traduce niente: riceve il testo già in lingua (R14). Chi la usa ha l'i18n; lei no, e non
 * deve averlo.
 */

withDefaults(defineProps<{ readonly tone?: ColorRole }>(), { tone: 'ink-3' })
</script>

<template>
  <span class="ui-label" :style="{ color: toneVar(tone) }"><slot /></span>
</template>

<style scoped>
.ui-label {
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  letter-spacing: var(--track-label);
  text-transform: uppercase;
}
</style>
