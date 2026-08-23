<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, shallowRef } from 'vue'

import type { Pool } from '@core/contracts/pools'

import PaymentDialog from '@renderer/components/payment/PaymentDialog.vue'
import type { GameError } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiButton from '@renderer/ui/UiButton.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiText from '@renderer/ui/UiText.vue'

/**
 * Il caveau: il primo muro del gioco, e adesso il primo dominio con una pagina sua
 * ([ADR 0033](../../../../docs/adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)).
 *
 * Fino a [D026](../../../../docs/delega/D026-dove-si-attacca-un-dominio.md) questo pannello non
 * esisteva: era la metà bassa di `CashPanel.vue`, cresciuta lì perché il caveau tocca i contanti e
 * i contanti avevano già un riquadro. Lo spostamento è un **taglio**, non una riscrittura — non un
 * `computed` è nato qui, e i nove selettori sono gli stessi di prima.
 *
 * La larghezza della barra è una percentuale e viene dallo store (R05). La capienza si
 * **interroga**, non si definisce, e a rispondere è la stessa funzione che il Ledger fa rispettare
 * (INV-18, ADR 0025).
 *
 * **Il riquadro non ha un titolo**, ed è una cosa vista guardando: la pagina si chiama già
 * «Caveau», e ripeterlo a cento pixel di distanza è la stessa parola due volte. Il titolo torna il
 * giorno in cui questa pagina ha **due** riquadri e serve dire quale è quale.
 *
 * Il pulsante «amplia» non si spegne e non **può** spegnersi (INV-21): quando nessuno dei due
 * strumenti basta si smorza, e a spiegare è il rifiuto del Ledger con le due cifre.
 *
 * **Da [D036](../../../../docs/delega/D036-il-pagamento-e-un-flusso-solo.md) la scelta non è più
 * qui.** C'erano due pulsanti, uno per strumento, disegnati da un ciclo sul listino, e una
 * `instrumentOf` scritta anche in `IncomePanel` — con il commento che lo dichiarava. Adesso c'è una
 * CTA sola, e i due prezzi si vedono dove si sceglie: `PaymentDialog`
 * ([ADR 0042](../../../../docs/adr/0042-il-pagamento-e-un-flusso-solo.md)).
 */

const store = useGameStore()
const { cashCapacity, vaultProgress, vaultRoom, vaultFill, vaultIsFull } = storeToRefs(store)
const { expansionPrices, canAffordExpansion, vaultAtMax, card } = storeToRefs(store)
const { text, money, failure } = useTranslator()

const paying = ref(false)

/**
 * `shallowRef` come nello store: l'errore porta dei `Decimal`, e un `ref` li avvolgerebbe in un
 * proxy prima che qualcuno li formatti.
 */
const refusal = shallowRef<GameError | null>(null)

/** Aprire azzera il rifiuto di prima: una frase su un tentativo già chiuso è peggio di nessuna. */
const open = (): void => {
  refusal.value = null
  paying.value = true
}

const expand = (pool: Pool, code: string): void => {
  const expanded = store.expandVault(pool, code)
  refusal.value = expanded.ok ? null : expanded.error
  if (expanded.ok) paying.value = false
}
</script>

<template>
  <UiPanel>
    <template v-if="cashCapacity !== null">
      <div class="gauge" :class="{ full: vaultIsFull }">
        <div class="fill" :style="{ width: vaultFill }"></div>
      </div>
      <p class="scale">
        <span>{{ text('vault.level', vaultProgress) }}</span>
        <span>{{ money(cashCapacity) }}</span>
      </p>
    </template>

    <dl class="facts">
      <div class="fact">
        <dt>{{ text('vault.room') }}</dt>
        <dd>{{ vaultRoom === null ? text('pool.unlimited') : money(vaultRoom) }}</dd>
      </div>
    </dl>

    <UiText v-if="vaultAtMax" tone="ink-3" size="xs" class="alarm">
      {{ text('vault.at_max') }}
    </UiText>
    <template v-else>
      <div class="option">
        <UiButton :label="text('vault.expand')" :muted="!canAffordExpansion" @press="open" />
        <PaymentDialog
          :open="paying"
          :prices="expansionPrices"
          :affords="store.canExpandWith"
          :card="card"
          :refusal="refusal === null ? undefined : failure(refusal)"
          @close="paying = false"
          @confirm="expand"
        />
      </div>
    </template>
  </UiPanel>
</template>

<style scoped>
/*
 * La barra della capienza. Resta qui, con il suo stile scoped, perché la disegna **un** componente
 * solo: entra in `ui/` il giorno in cui la disegnano due (ADR 0028). Nessun colore scritto a mano —
 * R15 rifiuterebbe un `#hex` — e il rosso del caveau pieno è il ruolo `loss`, che è già quello che
 * il gioco usa per «da qui non entra».
 */
.gauge {
  height: var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--color-sunken);
  border: 1px solid var(--color-line);
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--color-cash);
}

.gauge.full .fill {
  background: var(--color-loss);
}

.scale {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin: var(--space-2) 0 0;
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  letter-spacing: var(--track-label);
  text-transform: uppercase;
  color: var(--color-ink-3);
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

.alarm {
  margin-top: var(--space-5);
}

.option {
  margin-top: var(--space-5);
}
</style>
