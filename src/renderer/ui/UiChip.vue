<script setup lang="ts">
import type { ColorRole } from './roles'
import { toneVar } from './roles'

/**
 * La targhetta: il nome di uno strumento o di uno stato, con il suo colore.
 *
 * Esiste per una regola sola del design — **mai un numero nudo**. Un importo senza lo strumento
 * accanto costringe il giocatore a indovinare se quei soldi sono anonimi o tracciabili, che è
 * l'unica domanda su cui questo gioco è costruito.
 *
 * Il fondo si deriva dal colore con `color-mix`, così una targhetta nuova non porta un secondo
 * valore da tenere allineato al primo: si dichiara il ruolo, e il resto scende da lì.
 */

withDefaults(defineProps<{ readonly label: string; readonly tone?: ColorRole }>(), {
  tone: 'ink-3'
})
</script>

<template>
  <span
    class="ui-chip"
    :style="{
      color: toneVar(tone),
      background: `color-mix(in srgb, ${toneVar(tone)} 12%, transparent)`,
      borderColor: `color-mix(in srgb, ${toneVar(tone)} 30%, transparent)`
    }"
    >{{ label }}</span
  >
</template>

<style scoped>
.ui-chip {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--track-label);
  text-transform: uppercase;
  padding: var(--space-1) var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
}
</style>
