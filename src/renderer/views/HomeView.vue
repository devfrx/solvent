<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { POOL_IDS, POOLS } from '@core/contracts/pools'

import IncomePanel from '@renderer/components/IncomePanel.vue'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'

/**
 * La home della fetta 01: quanto hai, quanto stai guadagnando, e l'unica cosa che si compra.
 *
 * Il bancomat, la carta 3D e il cruscotto sono di D015: qui non c'è niente che li anticipi.
 *
 * Il saldo è **due righe** e non una, e non è un vezzo: il reddito entra in contanti e
 * l'upgrade si paga con la carta (D010). Con un numero solo, il messaggio «ti servono 800,00 €,
 * ne hai 0,00 €» contraddirebbe la cifra che il giocatore ha davanti.
 */

const { balances, incomePerSecond } = storeToRefs(useGameStore())
const { text, money, poolName } = useTranslator()

/** ADR 0017 — i conti non-giocatore non compaiono mai nella UI: l'elenco si deriva dai dati. */
const playerPools = POOL_IDS.filter((pool) => POOLS[pool].player)
</script>

<template>
  <section class="panel">
    <p class="caption">{{ text('balance.panel.title') }}</p>
    <dl class="pools">
      <template v-for="pool of playerPools" :key="pool">
        <dt>{{ poolName(pool) }}</dt>
        <dd class="amount">{{ money(balances[pool]) }}</dd>
      </template>
    </dl>
    <p class="rate amount">{{ text('balance.panel.rate', { amount: money(incomePerSecond) }) }}</p>
  </section>

  <IncomePanel />
</template>

<style scoped>
.pools {
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: baseline;
  gap: 2px 16px;
  margin: 8px 0 2px;
}

dt {
  font-size: 12px;
  color: var(--muted);
}

dd {
  margin: 0;
  text-align: right;
  font-size: 26px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.rate {
  font-size: 13px;
  color: var(--accent);
  margin: 0;
}
</style>
