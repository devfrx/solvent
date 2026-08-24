<script setup lang="ts">
import type { Pool } from '@core/contracts/pools'

import type { MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import type { ColorRole } from '@renderer/ui/roles'
import UiChip from '@renderer/ui/UiChip.vue'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiNumber from '@renderer/ui/UiNumber.vue'
import UiText from '@renderer/ui/UiText.vue'

/**
 * Un lato del blocco `DA ⇄ A`: da dove parte il denaro, o dove arriva. Il canvas lo disegna due
 * volte con un pulsante in mezzo, ed è la forma che rende la direzione una **cosa che si vede**
 * invece di due pulsanti che si escludono.
 *
 * Porta tre informazioni e non una: quale strumento, quanto ce n'è, e la cosa che lo distingue
 * dall'altro — la traccia da una parte, il tetto dall'altra. È metà della dualità dell'ADR 0017,
 * detta nel punto in cui il giocatore sta per scegliere.
 *
 * **Zero logica** (R05): riceve un saldo già formattato e una nota già tradotta, e non fa un solo
 * conto. La targhetta invece se la disegna da sé, perché è il ponte fra un pool e un ruolo di
 * colore — che vive in `components/`, non nel kit (R14, ADR 0028).
 */

defineProps<{
  /** `atm.from` oppure `atm.to`: la parola che dice da che parte del ponte siamo. */
  readonly side: MessageKey
  readonly pool: Pool
  /** Già formattato: come si scrive un importo lo decide `contracts/money` (ADR 0006). */
  readonly balance: string
  /** Già tradotta, e con dentro i numeri che le servono. */
  readonly note: string
}>()

const { text, poolName } = useTranslator()

/**
 * Il colore di uno strumento, come `roleOf` per un movimento: un `Record` **totale** su `Pool`,
 * quindi un pool nuovo non compila finché qualcuno non decide di che colore è.
 *
 * I cinque conti non-giocatore prendono il colore del testo e non compaiono mai qui (ADR 0017):
 * la loro riga è la dichiarazione che non li abbiamo dimenticati.
 */
const TONES: Readonly<Record<Pool, ColorRole>> = {
  cash: 'cash',
  card: 'card',
  world: 'ink-3',
  sink: 'ink-3',
  fees: 'ink-3',
  house: 'ink-3',
  tax: 'ink-3'
}
</script>

<template>
  <div class="side">
    <p class="head">
      <UiLabel>{{ text(side) }}</UiLabel>
      <UiChip :label="poolName(pool)" :tone="TONES[pool]" />
    </p>
    <p class="balance">
      <UiNumber :value="balance" size="lg" />
    </p>
    <UiText size="xs" tone="ink-3">{{ note }}</UiText>
  </div>
</template>

<style scoped>
.side {
  min-width: 0;
  padding: var(--space-4) var(--space-5);
}

.head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0 0 var(--space-3);
}

.balance {
  margin: 0 0 var(--space-1);
}
</style>
