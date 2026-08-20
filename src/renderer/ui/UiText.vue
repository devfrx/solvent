<script setup lang="ts">
import type { ColorRole, TextSize } from './roles'
import { sizeVar, toneVar } from './roles'

/**
 * La prosa, e l'unico posto del kit che parla col sans (ADR 0029). La divisione è quella del
 * design: il mono porta le cifre e le etichette, il sans porta ciò che è **rivolto al giocatore** —
 * dove il problema vero non è la forma delle lettere ma le due lingue, e la lunghezza del tedesco.
 *
 * `text-wrap: pretty` evita la parola sola sull'ultima riga, che in una frase corta di rifiuto si
 * nota molto più che in un paragrafo.
 */

withDefaults(defineProps<{ readonly tone?: ColorRole; readonly size?: TextSize }>(), {
  tone: 'ink-2',
  size: 'sm'
})
</script>

<template>
  <p class="ui-text" :style="{ color: toneVar(tone), fontSize: sizeVar(size) }"><slot /></p>
</template>

<style scoped>
.ui-text {
  margin: 0;
  font-family: var(--font-sans);
  font-weight: var(--weight-regular);
  line-height: 1.45;
  text-wrap: pretty;
}
</style>
