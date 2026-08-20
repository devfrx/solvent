<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { shallowRef } from 'vue'

import type { PaymentOption } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'

import type { GameError } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'

/**
 * L'upgrade, e la dimostrazione che un componente può essere utile senza sapere nulla di economia.
 *
 * Non conosce il prezzo, non sa quanto renda, non decide con quale strumento si paghi e non
 * conosce la parola «insufficiente». Legge il listino, invia un comando con lo strumento scelto, e
 * se il comando dice di no **traduce il codice** che gli è tornato — che è la ragione per cui i
 * codici d'errore sono chiavi i18n e portano con sé i numeri (ADR 0007).
 *
 * ADR 0027 — il pagamento **si vede prima di premere**: con quale strumento, e a che prezzo con
 * quello. Finché il listino ha una voce sola non c'è niente da scegliere, e al posto del selettore
 * si legge la ragione: «si paga solo con la carta». Prima quell'informazione arrivava solo
 * sbagliando, cioè come rimprovero invece che come etichetta.
 *
 * Il pulsante non si spegne. Quando i fondi non bastano cambia aspetto — l'anteprima del listino lo
 * dice — ma resta premibile, e a spiegare il no è il Ledger con le due cifre. Un pulsante spento è
 * un rifiuto senza motivo, ed è esattamente ciò che questa fetta esiste per non fare.
 */

const store = useGameStore()
const { upgraded, upgradePrices } = storeToRefs(store)
const { text, money, poolName, failure } = useTranslator()

/**
 * `shallowRef` come nello store, e per la stessa ragione: l'errore porta dei `Decimal`, e un `ref`
 * li avvolgerebbe in un proxy prima che qualcuno li formatti.
 */
const refusal = shallowRef<GameError | null>(null)

/**
 * Cosa si legge sopra il pulsante di un'opzione. Con un listino di uno non c'è una scelta da
 * etichettare, c'è una ragione da dare: il nome dello strumento da solo direbbe al giocatore
 * *quale* senza dirgli *perché non gli altri*.
 */
const instrumentOf = (option: PaymentOption): string =>
  upgradePrices.value.length === 1
    ? text('payment.only_with', { pool: poolName(option.pool) })
    : poolName(option.pool)

const buy = (pool: Pool): void => {
  const bought = store.buyUpgrade(pool)
  refusal.value = bought.ok ? null : bought.error
}
</script>

<template>
  <section class="panel">
    <header class="head">
      <span class="name">{{ text('income.upgrade.overtime.name') }}</span>
      <span class="level">{{ text('common.level', { level: upgraded ? 1 : 0 }) }}</span>
    </header>
    <p class="desc">{{ text('income.upgrade.overtime.desc') }}</p>

    <p v-if="upgraded" class="owned">{{ text('income.upgrade.owned') }}</p>
    <template v-else>
      <div v-for="option of upgradePrices" :key="option.pool" class="option">
        <p class="instrument">{{ instrumentOf(option) }}</p>
        <button
          type="button"
          class="primary amount"
          :class="{ dim: !store.canBuyUpgradeWith(option.pool) }"
          @click="buy(option.pool)"
        >
          {{ text('common.buy', { cost: money(option.price) }) }}
        </button>
      </div>
    </template>

    <p v-if="refusal !== null" class="refusal boxed">{{ failure(refusal) }}</p>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.name {
  font-size: 14px;
  font-weight: 600;
}

.level {
  font-size: 12px;
  color: var(--muted);
}

.desc {
  font-size: 12px;
  color: var(--muted);
  margin: 6px 0 14px;
  line-height: 1.5;
}

.instrument {
  font-size: 12px;
  color: var(--muted);
  margin: 0 0 8px;
}

button {
  width: 100%;
}

.dim {
  background: var(--panel-raised);
  color: var(--muted);
  border-color: var(--line);
}

.owned {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

/* Il rifiuto è una primitiva condivisa (`App.vue`): qui resta solo lo stacco dal pulsante. */
.refusal.boxed {
  margin-top: 10px;
}
</style>
