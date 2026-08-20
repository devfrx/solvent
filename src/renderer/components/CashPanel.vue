<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { traceabilityKey, useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiNumber from '@renderer/ui/UiNumber.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'

/**
 * L'altra metà della dualità (P4): i contanti, e le due cose che li distinguono dalla carta —
 * non lasciano traccia, e un giorno non ci staranno più.
 *
 * La capienza si **interroga**, non si definisce: `capacityOf` risponde `null` finché il caveau
 * non esiste, e oggi la risposta è «illimitata». È corretta, non provvisoria — il valore arriva
 * con la fetta 02 senza che questo file cambi, e la barra che lo disegna nascerà insieme al
 * valore. Disegnarla adesso vorrebbe dire disegnare una barra sempre vuota.
 *
 * Il totale porta il colore dello strumento (D023): i contanti hanno il loro, la carta il suo, ed è
 * la regola del design — mai un numero nudo, mai due strumenti dello stesso colore.
 */

const { balances, cashCapacity } = storeToRefs(useGameStore())
const { text, money } = useTranslator()
</script>

<template>
  <UiPanel :title="text('atm.cash.title')">
    <p class="total">
      <UiNumber :value="money(balances.cash)" tone="cash" size="xl" />
    </p>

    <dl class="facts">
      <div class="fact">
        <dt>{{ text('atm.cash.capacity') }}</dt>
        <dd>{{ cashCapacity === null ? text('pool.unlimited') : money(cashCapacity) }}</dd>
      </div>
      <div class="fact">
        <dt>{{ text('pool.traceability') }}</dt>
        <dd>{{ text(traceabilityKey('cash')) }}</dd>
      </div>
    </dl>
  </UiPanel>
</template>

<style scoped>
.total {
  margin: 0;
}

.facts {
  margin: var(--space-5) 0 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-xs);
}

.fact {
  display: flex;
  justify-content: space-between;
  gap: var(--space-5);
}

dt {
  color: var(--color-ink-3);
}

dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
