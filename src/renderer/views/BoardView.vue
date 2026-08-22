<script setup lang="ts">
import { storeToRefs } from 'pinia'

import InstrumentChart from '@renderer/components/shell/InstrumentChart.vue'
import NetWorthChart from '@renderer/components/shell/NetWorthChart.vue'
import StatTile from '@renderer/components/shell/StatTile.vue'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'

/**
 * Il cruscotto, e da [D033](../../../docs/delega/D033-il-bancomat-e-una-pagina.md) è una pagina
 * sua. Prima stava sotto il bancomat, dentro la home, e l'[ADR 0018](../../../docs/adr/0018-la-home-e-un-atm.md)
 * lo teneva a bada con un tetto di sei riquadri — perché il cruscotto si mangia sempre il
 * bancomat: le statistiche crescono e il bancomat no.
 *
 * Il tetto **resta**, e difende una cosa diversa ([ADR 0040](../../../docs/adr/0040-il-bancomat-e-il-cruscotto-sono-due-pagine.md)):
 * non più il bancomat da questa pagina, ma questa pagina da se stessa. Senza, torna a essere i
 * dieci riquadri del progetto precedente. A contarli è `tests/rules/board-tiles`.
 *
 * Oggi ne bastano **cinque**, perché cinque sono i numeri vivi che il gioco ha davvero — il sesto
 * posto resta vuoto apposta. Un riquadro inventato per riempire la griglia occupa il posto che la
 * fetta successiva userà davvero.
 *
 * I cinque non sono indipendenti, ed è la parte che vale la pena sapere: **guadagnato meno speso
 * meno commissioni fa esattamente il patrimonio netto**, sempre. Non è una coincidenza — è INV-08,
 * la somma di tutti i conti che fa zero, guardata dal lato del giocatore.
 *
 * Il grafico ([D027](../../../docs/delega/D027-un-grafico-e-una-serie-che-nessuno-tiene.md)) sta
 * sotto i riquadri: quelli dicono com'è adesso, lui dice com'è andata — che è, secondo l'ADR 0018,
 * l'unica ragione per riaprire un idle. Non è un sesto riquadro travestito: non porta cifre, e il
 * posto libero della griglia resta libero.
 *
 * Da [D034](../../../docs/delega/D034-le-serie-degli-strumenti.md) sotto di lui ce ne sono altri
 * **due**, uno per strumento, e sono lo stesso componente montato due volte. L'ordine è la
 * risposta a tre domande sempre più strette: com'è adesso, com'è andato il totale, e come si sono
 * mossi i due strumenti che il totale somma. L'ultima è quella che il patrimonio netto nasconde
 * meglio — i contanti salgono da soli e sbattono contro un tetto, la carta non si muove finché non
 * decidi tu, e una somma liscia non lo fa vedere.
 *
 * I due grafici sono **affiancati**: metterli in colonna li farebbe leggere come due momenti
 * diversi, e sono lo stesso momento visto su due strumenti. Il confronto è tutto il punto.
 */

const store = useGameStore()
const { incomePerSecond, netWorth, earned, spent, feesPaid, cashCandles, cardCandles } =
  storeToRefs(store)
const { text, money } = useTranslator()
</script>

<template>
  <div class="tiles">
    <StatTile
      label="board.tile.income"
      :value="text('income.per_second', { amount: money(incomePerSecond) })"
      tone="gain"
      hint="board.tile.income.explained"
    />
    <StatTile
      label="board.tile.net_worth"
      :value="money(netWorth)"
      tone="plain"
      hint="board.tile.net_worth.explained"
    />
    <StatTile
      label="board.tile.earned"
      :value="money(earned)"
      tone="gain"
      hint="board.tile.earned.explained"
    />
    <StatTile
      label="board.tile.spent"
      :value="money(spent)"
      tone="plain"
      hint="board.tile.spent.explained"
    />
    <StatTile
      label="board.tile.fees"
      :value="money(feesPaid)"
      tone="plain"
      hint="board.tile.fees.explained"
    />
  </div>

  <NetWorthChart />

  <div class="instruments">
    <InstrumentChart title="board.candles.cash.title" :candles="cashCandles.items" />
    <InstrumentChart title="board.candles.card.title" :candles="cardCandles.items" />
  </div>
</template>

<style scoped>
.tiles {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.instruments {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-top: var(--space-3);
}
</style>
