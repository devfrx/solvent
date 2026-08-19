<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { toString as decimalOf } from '@core/contracts/money'
import { POOL_IDS, POOLS } from '@core/contracts/pools'

import { useGameStore } from './stores/game'

/**
 * Il guscio: rende visibile lo stato del ciclo di vita e il mirror dello store, e nient'altro.
 *
 * Non ha etichette e non ha frasi, di proposito. Ciò che si vede sono **dati** — l'id di uno
 * stato, l'id di un pool, un importo, il codice di un errore — perché ogni parola rivolta al
 * giocatore è una chiave i18n, e l'i18n è di D012 (R12). Quella delega riempie questo guscio con
 * le viste e la navigazione: nessuna riga di qui viene buttata, prende solo un vestito.
 *
 * Serve a una cosa precisa, ed è la verifica manuale della definizione di fatto di D011:
 * nascondere la finestra, riesporla, e **vedere** i saldi recuperare il tempo passato.
 */

const { status, failure, balances, history } = storeToRefs(useGameStore())

/** I conti non-giocatore non compaiono mai nella UI (ADR 0017): l'elenco si deriva dai dati. */
const playerPools = POOL_IDS.filter((pool) => POOLS[pool].player)
</script>

<template>
  <main :data-status="status">
    <output data-role="status">{{ status }}</output>

    <output v-if="failure !== null" data-role="failure">{{ failure.code }}</output>

    <template v-else>
      <dl data-role="balances">
        <template v-for="pool of playerPools" :key="pool">
          <dt>{{ pool }}</dt>
          <dd>{{ decimalOf(balances[pool]) }}</dd>
        </template>
      </dl>

      <ol data-role="history">
        <li v-for="(entry, index) of history.items" :key="index">{{ entry.reason }}</li>
      </ol>
    </template>
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  padding: 2rem;
  background: #0e1116;
  color: #e6edf3;
  font-family: ui-monospace, monospace;
  font-size: 0.9rem;
}

[data-role='status'] {
  color: #7d8590;
}

[data-role='failure'] {
  display: block;
  margin-top: 1rem;
  color: #f85149;
}

dl {
  display: grid;
  grid-template-columns: max-content max-content;
  gap: 0.25rem 2rem;
  margin: 1rem 0;
}

dd {
  margin: 0;
  text-align: right;
}

ol {
  margin: 0;
  padding: 0;
  color: #7d8590;
  list-style: none;
}
</style>
