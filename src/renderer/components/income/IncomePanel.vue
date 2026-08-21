<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { shallowRef } from 'vue'

import type { PaymentOption } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'

import type { GameError } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiButton from '@renderer/ui/UiButton.vue'
import UiChip from '@renderer/ui/UiChip.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiText from '@renderer/ui/UiText.vue'

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
 * Il pulsante non si spegne, e da D023 non **può** spegnersi: `UiButton` non sa farlo (INV-21).
 * Quando i fondi non bastano si smorza — è l'anteprima del listino — ma resta premibile, e a
 * spiegare il no è il Ledger con le due cifre. Un pulsante spento è un rifiuto senza motivo, ed è
 * esattamente ciò che questa fetta esiste per non fare.
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
  <UiPanel>
    <header class="head">
      <span class="name">{{ text('income.upgrade.overtime.name') }}</span>
      <span class="level">{{ text('common.level', { level: upgraded ? 1 : 0 }) }}</span>
    </header>
    <UiText class="desc">{{ text('income.upgrade.overtime.desc') }}</UiText>

    <UiChip v-if="upgraded" tone="gain" :label="text('income.upgrade.owned')" />
    <template v-else>
      <div v-for="option of upgradePrices" :key="option.pool" class="option">
        <UiText tone="ink-3" size="xs" class="instrument">{{ instrumentOf(option) }}</UiText>
        <UiButton
          :label="text('common.buy', { cost: money(option.price) })"
          :muted="!store.canBuyUpgradeWith(option.pool)"
          :reason="refusal === null ? undefined : failure(refusal)"
          @press="buy(option.pool)"
        />
      </div>
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

.level {
  font-size: var(--text-sm);
  color: var(--color-ink-3);
}

.desc {
  margin: var(--space-2) 0 var(--space-5);
}

.instrument {
  margin: 0 0 var(--space-3);
}
</style>
