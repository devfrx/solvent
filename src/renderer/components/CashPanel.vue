<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { traceabilityKey, useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'

/**
 * L'altra metà della dualità (P4): i contanti, e le due cose che li distinguono dalla carta —
 * non lasciano traccia, e un giorno non ci staranno più.
 *
 * La capienza si **interroga**, non si definisce: `capacityOf` risponde `null` finché il caveau
 * non esiste, e oggi la risposta è «illimitata». È corretta, non provvisoria — il valore arriva
 * con la fetta 02 senza che questo file cambi, e la barra che lo disegna nascerà insieme al
 * valore. Disegnarla adesso vorrebbe dire disegnare una barra sempre vuota.
 */

const { balances, cashCapacity } = storeToRefs(useGameStore())
const { text, money } = useTranslator()
</script>

<template>
  <section class="panel">
    <p class="caption">{{ text('atm.cash.title') }}</p>
    <p class="amount total">{{ money(balances.cash) }}</p>

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
  </section>
</template>

<style scoped>
.total {
  font-size: 26px;
  font-weight: 650;
  letter-spacing: -0.02em;
  margin: 6px 0 0;
}

.facts {
  margin: 12px 0 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
}

.fact {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

dt {
  color: var(--muted);
}

dd {
  margin: 0;
  text-align: right;
}
</style>
