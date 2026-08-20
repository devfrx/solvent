<script setup lang="ts">
import type { Posting } from '@core/contracts/ledger'

import { useTranslator } from '@renderer/i18n'

import type { PostingRow } from './postings'
import { visibleRows } from './postings'

/**
 * I movimenti di una transazione, riga per riga. È il riquadro monospazio del mockup — la
 * **transazione vera**, tre righe che sommano a zero — e serve due volte: prima della conferma è
 * l'anteprima che ADR 0018 pretende, dopo è la riga nello storico.
 *
 * Le due non sono due elenchi che devono coincidere: sono lo stesso elenco, costruito da
 * `previewOf` e applicato dal comando senza passare da una seconda formula (INV-11). Questo
 * componente lo mostra e basta — quali righe si vedano lo decide `visibleRows`, che è pura e
 * provata a parte.
 */

defineProps<{ readonly postings: readonly Posting[] }>()

const { text, signedMoney, poolName } = useTranslator()

/**
 * La commissione non ha il nome di un conto: quel movimento finisce su un conto non-giocatore, che
 * nella UI non esiste (ADR 0017). Ha però una parola sua, ed è quella che il giocatore cerca.
 */
const labelOf = (row: PostingRow): string =>
  row.pool === null ? text('atm.fee') : poolName(row.pool)
</script>

<template>
  <dl class="rows">
    <template v-for="(row, index) of visibleRows(postings)" :key="index">
      <dt>{{ labelOf(row) }}</dt>
      <dd class="amount" :class="row.tone">{{ signedMoney(row.amount) }}</dd>
    </template>
  </dl>
</template>

<style scoped>
.rows {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 3px 16px;
  margin: 0;
  font-size: 12px;
}

dt {
  color: var(--muted);
}

dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* P2 — il verde è solo il denaro che entra; l'ambra è il costo. Niente terzo colore. */
.in {
  color: var(--accent);
}

.fee {
  color: var(--warn);
}
</style>
