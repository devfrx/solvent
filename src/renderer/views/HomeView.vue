<script setup lang="ts">
import { storeToRefs } from 'pinia'

import AtmPanel from '@renderer/components/atm/AtmPanel.vue'
import BankCard3d from '@renderer/components/atm/BankCard3d.vue'
import CashPanel from '@renderer/components/atm/CashPanel.vue'
import OperationList from '@renderer/components/ledger/OperationList.vue'
import NetWorthChart from '@renderer/components/shell/NetWorthChart.vue'
import StatTile from '@renderer/components/shell/StatTile.vue'
import VaultAlarm from '@renderer/components/vault/VaultAlarm.vue'
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
 *
 * Da [D026](../../../docs/delega/D026-dove-si-attacca-un-dominio.md) questa pagina è **la pagina
 * del bancomat**, e l'ADR 0018 non cambia: cambia il perché. Il caveau e il reddito hanno preso la
 * loro ([ADR 0033](../../../docs/adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)); del caveau
 * resta qui il solo allarme, perché il muro si incontra giocando e non amministrando.
 *
 * Da [D027](../../../docs/delega/D027-un-grafico-e-una-serie-che-nessuno-tiene.md) il cruscotto
 * ha anche un **grafico**, e sta sotto i riquadri: quelli dicono com'è adesso, lui dice come è
 * andata — che è, secondo l'ADR 0018, l'unica ragione per riaprire un idle. Non è un sesto
 * riquadro travestito: non porta cifre, e il posto libero della griglia resta libero.
 */

const store = useGameStore()
const {
  balances,
  cardCapacity,
  atmFeeRates,
  incomePerSecond,
  netWorth,
  earned,
  spent,
  feesPaid,
  recentOperations
} = storeToRefs(store)
const { text, money, rate } = useTranslator()
</script>

<template>
  <p class="zone">
    <UiLabel>{{ text('home.zone.atm') }}</UiLabel>
  </p>

  <BankCard3d
    :account="money(balances.card)"
    :capacity="cardCapacity === null ? text('pool.unlimited') : money(cardCapacity)"
    :fee="
      text('atm.fee.rates', {
        deposit: rate(atmFeeRates.deposit),
        withdraw: rate(atmFeeRates.withdraw)
      })
    "
    :traceability="text(traceabilityKey('card'))"
  />

  <CashPanel />
  <VaultAlarm />
  <AtmPanel />

  <p class="zone">
    <UiLabel>{{ text('home.zone.dashboard') }}</UiLabel>
  </p>

  <div class="tiles">
    <StatTile
      label="home.tile.income"
      :value="text('income.per_second', { amount: money(incomePerSecond) })"
      tone="gain"
      hint="home.tile.income.explained"
    />
    <StatTile
      label="home.tile.net_worth"
      :value="money(netWorth)"
      tone="plain"
      hint="home.tile.net_worth.explained"
    />
    <StatTile
      label="home.tile.earned"
      :value="money(earned)"
      tone="gain"
      hint="home.tile.earned.explained"
    />
    <StatTile
      label="home.tile.spent"
      :value="money(spent)"
      tone="plain"
      hint="home.tile.spent.explained"
    />
    <StatTile
      label="home.tile.fees"
      :value="money(feesPaid)"
      tone="plain"
      hint="home.tile.fees.explained"
    />
  </div>

  <NetWorthChart />

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
