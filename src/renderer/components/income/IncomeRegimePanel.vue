<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, shallowRef } from 'vue'

import type { Pool } from '@core/contracts/pools'

import PaymentDialog from '@renderer/components/payment/PaymentDialog.vue'
import type { GameError } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiButton from '@renderer/ui/UiButton.vue'
import UiChip from '@renderer/ui/UiChip.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiText from '@renderer/ui/UiText.vue'

/**
 * ADR 0052 — il **regime** del reddito: dove atterra lo stipendio, e quanto ne trattiene lo Stato.
 *
 * È il gemello di `IncomePanel`, e ne ripete la forma per intero — CTA sola, scelta dello strumento
 * dentro `PaymentDialog`, pulsante che si smorza invece di spegnersi (INV-21). Due file e non uno
 * perché sono due acquisti con due listini e due condizioni: fonderli vorrebbe dire un `v-if` sul
 * quale dei due si sta comprando, dentro un componente che non deve decidere niente.
 *
 * **La sola differenza che conta è che dice cosa compra prima di venderlo.** Il prezzo resta dentro
 * il flusso (R24), ma la **trattenuta** e l'irreversibilità no: sono ciò che l'acquisto compra, e
 * un acquisto senza ritorno che si scopre dopo non è una decisione — è una trappola.
 */

const store = useGameStore()
const { declared, declarationPrices, canAffordDeclaration, declaredWithholding, card } =
  storeToRefs(store)
const { text, rate, failure } = useTranslator()

const paying = ref(false)

/** `shallowRef` come in `IncomePanel`: l'errore porta dei `Decimal`, e un `ref` li proxerebbe. */
const refusal = shallowRef<GameError | null>(null)

const open = (): void => {
  refusal.value = null
  paying.value = true
}

const declare = (pool: Pool, code: string): void => {
  const done = store.declareIncome(pool, code)
  refusal.value = done.ok ? null : done.error
  if (done.ok) paying.value = false
}
</script>

<template>
  <UiPanel>
    <header class="head">
      <span class="name">{{ text('income.regime.name') }}</span>
      <span class="state">{{
        text(declared ? 'income.regime.declared' : 'income.regime.black')
      }}</span>
    </header>

    <UiChip v-if="declared" tone="gain" :label="text('income.regime.declared')" />
    <template v-else>
      <UiText class="desc">{{ text('income.regime.desc') }}</UiText>
      <UiText class="desc">
        {{ text('income.regime.buys', { rate: rate(declaredWithholding) }) }}
      </UiText>
      <UiButton
        :label="text('income.regime.declare')"
        :muted="!canAffordDeclaration"
        @press="open"
      />
      <PaymentDialog
        :open="paying"
        :prices="declarationPrices"
        :affords="store.canDeclareWith"
        :card="card"
        :refusal="refusal === null ? undefined : failure(refusal)"
        @close="paying = false"
        @confirm="declare"
      />
    </template>
  </UiPanel>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.name {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.state {
  font-size: var(--text-sm);
  color: var(--color-ink-3);
}

.desc {
  margin: var(--space-2) 0 var(--space-5);
}
</style>
