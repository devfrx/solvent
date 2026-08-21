<script setup lang="ts">
import { storeToRefs } from 'pinia'

import OperationList from '@renderer/components/ledger/OperationList.vue'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiNumber from '@renderer/ui/UiNumber.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'

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
  <UiPanel :title="text('stats.saved_at.title')">
    <p class="saved">
      <UiNumber
        :value="savedAt === null ? text('stats.saved_at.never') : instant(savedAt)"
        size="md"
      />
    </p>
  </UiPanel>

  <UiPanel :title="text('stats.operations.title')">
    <OperationList :operations="operations" />
  </UiPanel>
</template>

<style scoped>
.saved {
  margin: 0;
}
</style>
