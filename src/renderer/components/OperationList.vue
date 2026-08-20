<script setup lang="ts">
import type { Transaction } from '@core/contracts/ledger'

import { useTranslator } from '@renderer/i18n'

import PostingRows from './PostingRows.vue'

/**
 * Un estratto conto: una riga per operazione, con dentro i suoi movimenti.
 *
 * Serve due volte — poche righe sulla home (ADR 0018), tutte quelle che la lista limitata conserva
 * sulla schermata Statistiche — e prima di questa delega era **copiato** nelle due viste, con tre
 * blocchi di CSS identici carattere per carattere. Due copie di uno stile che nessuno lega fra
 * loro divergono al primo ritocco, e la copia rimasta indietro non fa rumore: è il seme del
 * difetto A14, e la difesa dichiarata in `App.vue` — lo stile sta attaccato a chi lo usa — non
 * poteva funzionare finché «chi lo usa» erano due.
 *
 * Quante righe mostrare non lo decide questo componente: gliele passa chi lo monta, e a tagliarle
 * è un selettore dello store (R05).
 */

defineProps<{ readonly operations: readonly Transaction[] }>()

const { text } = useTranslator()
</script>

<template>
  <p v-if="operations.length === 0" class="empty">{{ text('stats.operations.empty') }}</p>
  <ol v-else class="operations">
    <li v-for="(entry, index) of operations" :key="index">
      <p class="reason">{{ text(entry.reason) }}</p>
      <PostingRows :postings="entry.postings" />
    </li>
  </ol>
</template>

<style scoped>
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
