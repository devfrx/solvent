<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { shallowRef } from 'vue'

import type { PaymentOption } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'

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
 * Il pulsante «amplia» non si spegne e non **può** spegnersi (INV-21): quando i fondi non bastano
 * si smorza, e a spiegare è il rifiuto del Ledger con le due cifre. Con due strumenti a prezzi
 * diversi la riga sopra il pulsante porta il **nome** dello strumento invece della ragione: la
 * scelta c'è, e il prezzo è diverso per ciascuno.
 */

const store = useGameStore()
const { cashCapacity, vaultProgress, vaultRoom, vaultFill, vaultIsFull } = storeToRefs(store)
const { text, money, poolName, failure } = useTranslator()

/**
 * `shallowRef` come nello store: l'errore porta dei `Decimal`, e un `ref` li avvolgerebbe in un
 * proxy prima che qualcuno li formatti.
 */
const refusal = shallowRef<GameError | null>(null)

/**
 * Cosa si legge sopra il pulsante di un'opzione. Con due voci non c'è più una ragione da dare —
 * il giocatore può scegliere davvero — quindi si etichetta lo strumento. È la stessa funzione di
 * `IncomePanel`, con l'altro ramo acceso.
 */
const instrumentOf = (option: PaymentOption): string =>
  text(store.expansionPrices.length === 1 ? 'payment.only_with' : 'payment.with', {
    pool: poolName(option.pool)
  })

const expand = (pool: Pool): void => {
  const expanded = store.expandVault(pool)
  refusal.value = expanded.ok ? null : expanded.error
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

    <UiText v-if="store.expansionPrices.length === 0" tone="ink-3" size="xs" class="alarm">
      {{ text('vault.at_max') }}
    </UiText>
    <template v-else>
      <div v-for="option of store.expansionPrices" :key="option.pool" class="option">
        <UiText tone="ink-3" size="xs" class="instrument">{{ instrumentOf(option) }}</UiText>
        <UiButton
          :label="text('vault.expand', { cost: money(option.price) })"
          :muted="!store.canExpandWith(option.pool)"
          :reason="refusal === null ? undefined : failure(refusal)"
          @press="expand(option.pool)"
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

.instrument {
  margin: 0 0 var(--space-3);
}
</style>
