<script setup lang="ts">
import type { MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'

/**
 * Un riquadro del cruscotto. È ciò che `tests/rules/home-tiles` conta, e il conto è il solo motivo
 * per cui questo componente esiste come componente: sei riquadri scritti a mano nella vista si
 * contano guardando, sei riquadri che sono un tag si contano da un test (INV-12).
 *
 * Riceve un valore **già formattato**: nessun `Decimal`, nessuna conversione, nessuna decisione su
 * cosa mostrare. La chiave dell'etichetta invece la traduce da sé — una chiave non è un valore.
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
  <div class="tile">
    <p class="caption">{{ text(label) }}</p>
    <p class="amount figure" :class="tone">{{ value }}</p>
  </div>
</template>

<style scoped>
.tile {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 11px;
}

.figure {
  font-size: 15px;
  font-weight: 600;
  margin: 4px 0 0;
}

.gain {
  color: var(--accent);
}
</style>
