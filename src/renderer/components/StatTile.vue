<script setup lang="ts">
import type { MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiNumber from '@renderer/ui/UiNumber.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'

/**
 * Un riquadro del cruscotto. È ciò che `tests/rules/home-tiles` conta, e il conto è il solo motivo
 * per cui questo componente esiste come componente: sei riquadri scritti a mano nella vista si
 * contano guardando, sei riquadri che sono un tag si contano da un test (INV-12).
 *
 * Riceve un valore **già formattato**: nessun `Decimal`, nessuna conversione, nessuna decisione su
 * cosa mostrare. La chiave dell'etichetta invece la traduce da sé — una chiave non è un valore.
 *
 * Da D023 la superficie, l'etichetta e la cifra vengono dal kit: qui resta solo il fatto che un
 * riquadro è un'etichetta sopra un numero.
 */

defineProps<{
  readonly label: MessageKey
  readonly value: string
  /** P2 — il verde è solo il denaro che entra. Tutto il resto è del colore del testo. */
  readonly tone: 'plain' | 'gain'
}>()

const { text } = useTranslator()
</script>

<template>
  <UiPanel dense surface="raised">
    <UiLabel>{{ text(label) }}</UiLabel>
    <p class="figure">
      <UiNumber :value="value" size="md" :tone="tone === 'gain' ? 'gain' : 'ink'" />
    </p>
  </UiPanel>
</template>

<style scoped>
.figure {
  margin: var(--space-1) 0 0;
}
</style>
