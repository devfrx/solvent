<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'

/**
 * La schermata Statistiche. Esiste **dal primo giorno**, e non è un segnaposto: P3 le dà un
 * compito preciso — è dove va il settimo riquadro del cruscotto, quando ce ne sarà uno, perché
 * altrimenti il settimo si aggiunge alla home e il cruscotto si mangia il bancomat.
 *
 * Oggi mostra ciò che c'è e che nella home non sta: quando la partita è stata scritta su disco, e
 * il registro delle transazioni che il Bus ha annunciato. Le operazioni portano solo la loro
 * **ragione**, che è una chiave i18n tipizzata: gli importi vogliono un selettore che li componga,
 * e quello nasce con il pannello che li mostra (D015).
 */

const { history, savedAt } = storeToRefs(useGameStore())
const { text, instant } = useTranslator()
</script>

<template>
  <section class="panel">
    <p class="caption">{{ text('stats.saved_at.title') }}</p>
    <p class="saved amount">
      {{ savedAt === null ? text('stats.saved_at.never') : instant(savedAt) }}
    </p>
  </section>

  <section class="panel">
    <p class="caption">{{ text('stats.operations.title') }}</p>
    <p v-if="history.items.length === 0" class="empty">{{ text('stats.operations.empty') }}</p>
    <ol v-else class="operations">
      <li v-for="(entry, index) of history.items" :key="index">{{ text(entry.reason) }}</li>
    </ol>
  </section>
</template>

<style scoped>
.saved {
  margin: 8px 0 0;
  font-size: 15px;
}

.empty {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.operations {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  font-size: 12px;
  color: var(--muted);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
