<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { traceabilityKey, useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiNumber from '@renderer/ui/UiNumber.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiTooltip from '@renderer/ui/UiTooltip.vue'

/**
 * L'altra metà della dualità (P4): i contanti, e le due cose che li distinguono dalla carta — non
 * lasciano traccia, e **non ci stanno più**.
 *
 * Fino a [D026](../../../../docs/delega/D026-dove-si-attacca-un-dominio.md) questo file era **due
 * domini**: sopra il pool `cash`, sotto il caveau — il livello, la barra, il listino, il pulsante
 * che amplia. Non era stata una decisione: il caveau toccava i contanti, i contanti avevano già un
 * pannello, e il pannello è cresciuto. L'[ADR 0033](../../../../docs/adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)
 * chiude quella strada, e il caveau adesso ha la sua pagina e la sua cartella.
 *
 * **Qui resta il pool.** La capienza si legge ancora, perché è un fatto dei contanti — quanto ce ne
 * sta — e a rispondere è la stessa funzione che il Ledger fa rispettare (INV-18, ADR 0025): quello
 * che si legge qui è quello che decide se lo stipendio entra. **Chi la sposta** è un'altra cosa, ed
 * è del caveau.
 *
 * Nemmeno un numero di questa schermata è calcolato qui (R05).
 */

const store = useGameStore()
const { balances, cashCapacity } = storeToRefs(store)
const { text, money } = useTranslator()
</script>

<template>
  <UiPanel :title="text('atm.cash.title')">
    <p class="total">
      <UiNumber :value="money(balances.cash)" tone="cash" size="xl" />
    </p>

    <dl class="facts">
      <div class="fact">
        <dt>
          <UiTooltip :text="text('atm.cash.capacity.explained')">
            {{ text('atm.cash.capacity') }}
          </UiTooltip>
        </dt>
        <dd>{{ cashCapacity === null ? text('pool.unlimited') : money(cashCapacity) }}</dd>
      </div>
      <div class="fact">
        <dt>
          <UiTooltip :text="text('pool.traceability.explained')">
            {{ text('pool.traceability') }}
          </UiTooltip>
        </dt>
        <dd>{{ text(traceabilityKey('cash')) }}</dd>
      </div>
    </dl>
  </UiPanel>
</template>

<style scoped>
.total {
  margin: 0;
}

.facts {
  margin: var(--space-5) 0 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-xs);
}

.fact {
  display: flex;
  justify-content: space-between;
  gap: var(--space-5);
}

dt {
  color: var(--color-ink-3);
}

dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
