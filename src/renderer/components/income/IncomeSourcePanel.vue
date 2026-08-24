<script setup lang="ts">
import { ref, shallowRef } from 'vue'

import type { Pool } from '@core/contracts/pools'

import { ctaKey, landingKey } from '@renderer/components/income/sources'
import PaymentDialog from '@renderer/components/payment/PaymentDialog.vue'
import type { GameError } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import type { IncomeSourceView } from '@renderer/stores/game'
import { useGameStore } from '@renderer/stores/game'
import UiButton from '@renderer/ui/UiButton.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiText from '@renderer/ui/UiText.vue'

/**
 * **Una** fonte di reddito, e la pagina ne disegna una per riga dell'elenco
 * ([D044](../../../../docs/delega/D044-il-reddito-e-un-elenco-di-fonti.md)).
 *
 * Sostituisce `IncomePanel.vue`, che disegnava il pulsante solo del vecchio potenziamento. Il
 * cambio non è di grafica: quel pannello sapeva che l'acquisto era **uno** — un booleano, un
 * `UiChip` che diceva «già in funzione» — e qui c'è una scala, quindi il livello è un numero su
 * quanti e la fine è un'altra frase.
 *
 * Non conosce il prezzo, non sa quanto renda una fonte, non decide con quale strumento si paghi e
 * non conosce la parola «insufficiente»: riceve una riga già pronta dallo store (R05) e apre il
 * flusso del pagamento. Se il comando dice di no **traduce il codice** che gli è tornato, che è la
 * ragione per cui i codici d'errore sono chiavi i18n e portano con sé i numeri (ADR 0007).
 *
 * **La scelta dello strumento non è qui** (D036, ADR 0042): c'è una CTA sola, e ciò che si sceglie —
 * insieme al prezzo e alla prova che la carta chiede — sta in `PaymentDialog`. R24 impedisce a
 * questo file di tornare a disegnarla, e la impedisce anche di nominare un prezzo.
 *
 * Il pulsante non si spegne, e da D023 non **può** spegnersi: `UiButton` non sa farlo (INV-21).
 * Quando lo strumento non basta si smorza — è l'anteprima del listino — ma resta premibile, e a
 * spiegare il no è il Ledger con le due cifre. In cima alla scala il pulsante non c'è affatto: non
 * è un rifiuto, è una scala finita, e a dirlo è il listino vuoto.
 */

const props = defineProps<{ source: IncomeSourceView }>()

const store = useGameStore()
const { text, money, failure } = useTranslator()

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
  const bought = store.buyIncomeLevel(props.source.id, pool, code)
  refusal.value = bought.ok ? null : bought.error
  if (bought.ok) paying.value = false
}
</script>

<template>
  <UiPanel>
    <header class="head">
      <span class="name">{{ text(`income.source.${source.id}.name`) }}</span>
      <span class="level">
        {{
          source.level === 0
            ? text('income.source.closed')
            : text('income.source.level', { level: source.level, max: source.maxLevel })
        }}
      </span>
    </header>
    <UiText class="desc">{{ text(`income.source.${source.id}.desc`) }}</UiText>

    <dl class="facts">
      <div class="fact">
        <dt>{{ text('income.source.yields') }}</dt>
        <dd>{{ text('income.per_second', { amount: money(source.perSecond) }) }}</dd>
      </div>
      <div v-if="source.nextPerSecond !== null" class="fact">
        <dt>{{ text('income.source.next_level') }}</dt>
        <dd>{{ text('income.per_second', { amount: money(source.nextPerSecond) }) }}</dd>
      </div>
      <div class="fact">
        <dt>{{ text('income.source.lands_in') }}</dt>
        <dd>{{ text(landingKey(source.landsIn)) }}</dd>
      </div>
    </dl>

    <UiText v-if="source.atMax" tone="ink-3" size="xs" class="end">
      {{ text('income.source.at_max') }}
    </UiText>
    <div v-else class="option">
      <UiButton
        :label="text(ctaKey(source.level))"
        :muted="!store.canAffordIncomeLevel[source.id]"
        @press="open"
      />
      <PaymentDialog
        :open="paying"
        :prices="source.prices"
        :affords="(pool: Pool) => store.canBuyIncomeLevelWith(source.id, pool)"
        :card="store.card"
        :refusal="refusal === null ? undefined : failure(refusal)"
        @close="paying = false"
        @confirm="buy"
      />
    </div>
  </UiPanel>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--space-4);
}

.name {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.level {
  font-size: var(--text-sm);
  color: var(--color-ink-3);
  white-space: nowrap;
}

.desc {
  margin: var(--space-2) 0 0;
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

.end,
.option {
  margin-top: var(--space-5);
}
</style>
