<script setup lang="ts">
import type { ColorRole, TextSize } from './roles'
import { toneVar } from './roles'
import UiLabel from './UiLabel.vue'
import UiNumber from './UiNumber.vue'

/**
 * D024 — l'etichetta sopra la cifra. È la forma che il canvas ripete ovunque ci sia un numero con
 * un nome, e nel codice la disegnano due posti: la striscia degli strumenti nella testata e il
 * riquadro del cruscotto, che prima la componeva a mano con tre tag.
 *
 * Il quadratino è la metà visiva di «mai un numero nudo», la regola da cui è nato `UiChip`: un
 * importo senza il suo strumento accanto costringe il giocatore a indovinare se quei soldi sono
 * anonimi o tracciabili. Dove serve la parola c'è la targhetta; dove c'è posto solo per un segno,
 * c'è questo.
 *
 * `mark` e `tone` sono due proprietà e non una perché dicono due cose diverse: di **che cosa** è
 * fatto quel numero, e **come sta andando**. Nel cruscotto un totale guadagnato è verde e non
 * appartiene a uno strumento; nella striscia un saldo appartiene a uno strumento e non ha un verso.
 */

withDefaults(
  defineProps<{
    /** Già tradotta (R14): il kit non sa cosa voglia dire. */
    readonly label: string
    /** Già formattato: come si scrive un importo lo decide `contracts/money`. */
    readonly value: string
    readonly tone?: ColorRole
    readonly size?: TextSize
    /** Lo strumento a cui il numero appartiene. Assente, il quadratino non si disegna. */
    readonly mark?: ColorRole | undefined
  }>(),
  { tone: 'ink', size: 'md', mark: undefined }
)
</script>

<template>
  <span class="ui-readout">
    <span
      v-if="mark !== undefined"
      class="mark"
      :style="{ background: toneVar(mark) }"
      aria-hidden="true"
    ></span>
    <span class="body">
      <UiLabel>{{ label }}</UiLabel>
      <UiNumber :value="value" :tone="tone" :size="size" />
    </span>
  </span>
</template>

<style scoped>
.ui-readout {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
}

.mark {
  flex: 0 0 auto;
  width: var(--space-3);
  height: var(--space-3);
  border-radius: var(--radius-xs);
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}
</style>
