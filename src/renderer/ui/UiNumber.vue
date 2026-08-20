<script setup lang="ts">
import { computed } from 'vue'

import type { ColorRole, TextSize } from './roles'
import { sizeVar, toneVar } from './roles'

/**
 * La cifra. Riceve una stringa **già formattata**: come si scrive un importo lo decide
 * `contracts/money`, e il kit non può saperlo senza importare il dominio (R14).
 *
 * `tabular-nums` è il motivo per cui questo componente esiste invece di una classe: un saldo che
 * sale dieci volte al secondo, con cifre di larghezza diversa, fa ballare tutta la riga. Il design
 * lo dice in una frase — le cifre non devono ballare mentre ticchettano — e nel canvas quella
 * proprietà compare su ogni numero.
 *
 * La spaziatura stretta serve solo dove le cifre sono grandi: sotto una certa misura non si vede, e
 * toglie aria a un numero che ne ha già poca.
 */

const props = withDefaults(
  defineProps<{
    readonly value: string
    readonly tone?: ColorRole
    readonly size?: TextSize
  }>(),
  { tone: 'ink', size: 'sm' }
)

const LARGE: readonly TextSize[] = ['lg', 'xl']

const tracking = computed(() =>
  LARGE.includes(props.size) ? 'var(--track-tight)' : 'var(--track-wide)'
)
</script>

<template>
  <span
    class="ui-number"
    :style="{ color: toneVar(tone), fontSize: sizeVar(size), letterSpacing: tracking }"
    >{{ value }}</span
  >
</template>

<style scoped>
.ui-number {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: var(--weight-medium);
}
</style>
