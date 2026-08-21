<script setup lang="ts">
import type { MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiReadout from '@renderer/ui/UiReadout.vue'
import UiTooltip from '@renderer/ui/UiTooltip.vue'

/**
 * Un riquadro del cruscotto. È ciò che `tests/rules/home-tiles` conta, e il conto è il solo motivo
 * per cui questo componente esiste come componente: sei riquadri scritti a mano nella vista si
 * contano guardando, sei riquadri che sono un tag si contano da un test (INV-12).
 *
 * Riceve un valore **già formattato**: nessun `Decimal`, nessuna conversione, nessuna decisione su
 * cosa mostrare. La chiave dell'etichetta invece la traduce da sé — una chiave non è un valore.
 *
 * Da D023 la superficie, l'etichetta e la cifra vengono dal kit; da D024 anche il fatto che
 * un'etichetta stia sopra una cifra, che è `UiReadout`. Qui resta ciò che il kit non può sapere:
 * che questa etichetta è una chiave da tradurre, e che il verde vuol dire denaro in entrata.
 */

defineProps<{
  readonly label: MessageKey
  readonly value: string
  /** P2 — il verde è solo il denaro che entra. Tutto il resto è del colore del testo. */
  readonly tone: 'plain' | 'gain'
  /**
   * Cosa conta questo numero, detto per esteso. Obbligatoria: un riquadro del cruscotto è una
   * parola corta sopra una cifra, ed è la forma che più di ogni altra ha bisogno di una frase.
   */
  readonly hint: MessageKey
}>()

const { text } = useTranslator()
</script>

<template>
  <UiPanel dense surface="raised">
    <UiTooltip :text="text(hint)">
      <UiReadout :label="text(label)" :value="value" :tone="tone === 'gain' ? 'gain' : 'ink'" />
    </UiTooltip>
  </UiPanel>
</template>
