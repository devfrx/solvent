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
 * L'upgrade, e la dimostrazione che un componente può essere utile senza sapere nulla di economia.
 *
 * Non conosce il prezzo, non sa quanto renda, non decide con quale strumento si paghi e non
 * conosce la parola «insufficiente». Apre il flusso del pagamento, e quando il flusso gli
 * restituisce uno strumento e una prova invia il comando — se il comando dice di no **traduce il
 * codice** che gli è tornato, che è la ragione per cui i codici d'errore sono chiavi i18n e portano
 * con sé i numeri (ADR 0007).
 *
 * **Da [D036](../../../../docs/delega/D036-il-pagamento-e-un-flusso-solo.md) la scelta non è più
 * qui.** C'era un pulsante per strumento, disegnato da un ciclo sul listino, e la stessa funzione
 * `instrumentOf` scritta anche in `VaultPanel`: adesso c'è una CTA sola, e ciò che si sceglie —
 * insieme al prezzo di ogni voce e alla prova che la carta chiede — sta in `PaymentDialog`
 * ([ADR 0042](../../../../docs/adr/0042-il-pagamento-e-un-flusso-solo.md)). R24 impedisce a questo
 * file di tornare a disegnarla.
 *
 * Il pulsante non si spegne, e da D023 non **può** spegnersi: `UiButton` non sa farlo (INV-21).
 * Quando nessuno strumento basta si smorza — è l'anteprima del listino — ma resta premibile, e a
 * spiegare il no è il Ledger con le due cifre. Un pulsante spento è un rifiuto senza motivo, ed è
 * esattamente ciò che questa fetta esiste per non fare.
 */

const store = useGameStore()
const { upgraded, upgradePrices, canAffordUpgrade, card } = storeToRefs(store)
const { text, failure } = useTranslator()

const paying = ref(false)

/**
 * `shallowRef` come nello store, e per la stessa ragione: l'errore porta dei `Decimal`, e un `ref`
 * li avvolgerebbe in un proxy prima che qualcuno li formatti.
 */
const refusal = shallowRef<GameError | null>(null)

/** Aprire azzera il rifiuto di prima: una frase su un tentativo già chiuso è peggio di nessuna. */
const open = (): void => {
  refusal.value = null
  paying.value = true
}

const buy = (pool: Pool, code: string): void => {
  const bought = store.buyUpgrade(pool, code)
  refusal.value = bought.ok ? null : bought.error
  if (bought.ok) paying.value = false
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
      <UiButton :label="text('common.buy')" :muted="!canAffordUpgrade" @press="open" />
      <PaymentDialog
        :open="paying"
        :prices="upgradePrices"
        :affords="store.canBuyUpgradeWith"
        :card="card"
        :refusal="refusal === null ? undefined : failure(refusal)"
        @close="paying = false"
        @confirm="buy"
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

.level {
  font-size: var(--text-sm);
  color: var(--color-ink-3);
}

.desc {
  margin: var(--space-2) 0 var(--space-5);
}
</style>
