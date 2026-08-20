<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { shallowRef } from 'vue'

import type { GameError } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'

/**
 * L'upgrade, e la dimostrazione che un componente può essere utile senza sapere nulla di economia.
 *
 * Non conosce il prezzo, non sa quanto renda, non sa con quale strumento si paghi e non conosce la
 * parola «insufficiente». Legge tre selettori, invia un comando, e se il comando dice di no
 * **traduce il codice** che gli è tornato — che è la ragione per cui i codici d'errore sono chiavi
 * i18n e portano con sé i numeri (ADR 0007).
 *
 * Il pulsante non si spegne. Quando i fondi non bastano cambia aspetto — l'anteprima
 * `canBuyUpgrade` lo dice — ma resta premibile, e a spiegare il no è il Ledger con le due cifre.
 * Un pulsante spento è un rifiuto senza motivo, ed è esattamente ciò che questa delega esiste per
 * non fare.
 */

const store = useGameStore()
const { upgraded, canBuyUpgrade } = storeToRefs(store)
const { text, money, failure } = useTranslator()

/**
 * `shallowRef` come nello store, e per la stessa ragione: l'errore porta dei `Decimal`, e un `ref`
 * li avvolgerebbe in un proxy prima che qualcuno li formatti.
 */
const refusal = shallowRef<GameError | null>(null)

const buy = (): void => {
  const bought = store.buyUpgrade()
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
    <button
      v-else
      type="button"
      class="primary amount"
      :class="{ dim: !canBuyUpgrade }"
      @click="buy"
    >
      {{ text('common.buy', { cost: money(store.upgradeCost) }) }}
    </button>

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
