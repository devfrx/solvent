<script setup lang="ts">
import { storeToRefs } from 'pinia'

import PostingRows from '@renderer/components/PostingRows.vue'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'

/**
 * La schermata Statistiche. Esiste **dal primo giorno**, e non è un segnaposto: P3 le dà un
 * compito preciso — è dove va il settimo riquadro del cruscotto, quando ce ne sarà uno, perché
 * altrimenti il settimo si aggiunge alla home e il cruscotto si mangia il bancomat.
 *
 * Oggi mostra ciò che c'è e che nella home non sta: quando la partita è stata scritta su disco, e
 * il registro **intero** delle transazioni — la home ne mostra poche righe, qui ci sono tutte
 * quelle che la lista limitata conserva. Gli importi sono gli stessi movimenti dell'anteprima del
 * bancomat, costruiti dalla stessa funzione (D015).
 */

const { operations, savedAt } = storeToRefs(useGameStore())
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
    <p v-if="operations.length === 0" class="empty">{{ text('stats.operations.empty') }}</p>
    <ol v-else class="operations">
      <li v-for="(entry, index) of operations" :key="index">
        <p class="reason">{{ text(entry.reason) }}</p>
        <PostingRows :postings="entry.postings" />
      </li>
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
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reason {
  margin: 0 0 3px;
  font-size: 12px;
  font-weight: 600;
}
</style>
