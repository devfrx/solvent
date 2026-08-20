<script setup lang="ts">
import { storeToRefs } from 'pinia'

import AtmPanel from '@renderer/components/AtmPanel.vue'
import BankCard3d from '@renderer/components/BankCard3d.vue'
import CashPanel from '@renderer/components/CashPanel.vue'
import IncomePanel from '@renderer/components/IncomePanel.vue'
import OperationList from '@renderer/components/OperationList.vue'
import StatTile from '@renderer/components/StatTile.vue'
import { traceabilityKey, useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'

/**
 * ADR 0018 — la home è **bancomat sopra, cruscotto sotto**, e l'ordine non è negoziabile: il
 * cruscotto si mangia sempre il bancomat, perché le statistiche crescono e il bancomat no.
 *
 * Il tetto di sei riquadri è ciò che tiene, e non è una linea guida: `tests/rules/home-tiles` lo
 * verifica. Oggi ne bastano **cinque**, perché cinque sono i numeri vivi che questa fetta ha
 * davvero — il sesto posto resta vuoto apposta. Un riquadro inventato per riempire la griglia è
 * peggio di uno spazio: occupa il posto che la fetta 02 userà davvero.
 *
 * I cinque non sono indipendenti, ed è la parte che vale la pena sapere: **guadagnato meno speso
 * meno commissioni fa esattamente il patrimonio netto**, sempre. Non è una coincidenza — è INV-08,
 * la somma di tutti i conti che fa zero, guardata dal lato del giocatore.
 */

const store = useGameStore()
const {
  balances,
  cardCapacity,
  atmFee,
  incomePerSecond,
  netWorth,
  earned,
  spent,
  feesPaid,
  recentOperations
} = storeToRefs(store)
const { text, money } = useTranslator()
</script>

<template>
  <p class="zone">
    <UiLabel>{{ text('home.zone.atm') }}</UiLabel>
  </p>

  <BankCard3d
    :account="money(balances.card)"
    :capacity="cardCapacity === null ? text('pool.unlimited') : money(cardCapacity)"
    :fee="money(atmFee)"
    :traceability="text(traceabilityKey('card'))"
  />

  <CashPanel />
  <AtmPanel />

  <IncomePanel />

  <p class="zone">
    <UiLabel>{{ text('home.zone.dashboard') }}</UiLabel>
  </p>

  <div class="tiles">
    <StatTile
      label="home.tile.income"
      :value="text('income.per_second', { amount: money(incomePerSecond) })"
      tone="gain"
    />
    <StatTile label="home.tile.net_worth" :value="money(netWorth)" tone="plain" />
    <StatTile label="home.tile.earned" :value="money(earned)" tone="gain" />
    <StatTile label="home.tile.spent" :value="money(spent)" tone="plain" />
    <StatTile label="home.tile.fees" :value="money(feesPaid)" tone="plain" />
  </div>

  <UiPanel :title="text('atm.recent.title')">
    <OperationList :operations="recentOperations" />
  </UiPanel>
</template>

<style scoped>
/* Il separatore fra le due zone: dice dove finisce ciò che chiede e comincia ciò che mostra. */
.zone {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-1) 0 calc(var(--space-1) * -1);
}

.zone::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-line);
}

.tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
</style>
