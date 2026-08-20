<script setup lang="ts">
import UiText from './UiText.vue'

/**
 * L'azione — e **non sa spegnersi**. Non ha una proprietà `disabled`, e non scrive `disabled` sul
 * pulsante: è la riga che rende questo kit una regola invece di una tavolozza (INV-21).
 *
 * Il design lo dice così: un'azione che non puoi fare non è mai un pulsante morto, è una frase che
 * dice cosa manca e quanto. Questa fetta lo aveva già deciso per conto suo, in `IncomePanel`, e con
 * l'argomento migliore: un pulsante spento è un rifiuto **senza motivo**, e chi lo guarda non sa se
 * gli mancano dieci euro o un dominio intero. La prima versione di questo componente disabilitava
 * il pulsante quando arrivava una `reason`, e avrebbe disfatto quella decisione senza accorgersene.
 *
 * Restano due cose distinte, e servono davvero tutte e due:
 *
 * - `muted` è l'**anteprima**: da qui si vede che probabilmente non si può, e il pulsante cambia
 *   aspetto restando premibile. Premere è il modo in cui si scopre il perché esatto.
 * - `reason` è la **frase**, quella che il rifiuto ha prodotto, con dentro i numeri.
 *
 * La frase arriva già tradotta (R12): il kit non sa cosa voglia dire.
 */

withDefaults(
  defineProps<{
    readonly label: string
    readonly variant?: 'primary' | 'quiet'
    readonly muted?: boolean
    readonly reason?: string | undefined
  }>(),
  { variant: 'primary', muted: false, reason: undefined }
)

defineEmits<{ press: [] }>()
</script>

<template>
  <div class="ui-button">
    <button type="button" :class="[variant, { muted }]" @click="$emit('press')">{{ label }}</button>
    <UiText v-if="reason !== undefined && reason !== ''" tone="loss" size="xs" class="reason">
      {{ reason }}
    </UiText>
  </div>
</template>

<style scoped>
.ui-button {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

button {
  width: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--track-wide);
  font-variant-numeric: tabular-nums;
  padding: var(--space-4) var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.primary {
  background: var(--color-accent);
  color: var(--color-accent-fg);
}

.quiet {
  background: transparent;
  color: var(--color-ink);
  border-color: var(--color-line);
}

/* Non spento: **smorzato**. Resta premibile, e premerlo è come si scopre di quanto manca. */
.muted {
  background: var(--color-sunken);
  color: var(--color-ink-3);
  border-color: var(--color-line);
}

/*
 * Sfondo e bordo si **derivano** dal token invece di ricopiarne il valore. È la correzione che
 * l'audit di D016 ha imposto a `.refusal`: quattro `rgba()` scritti a mano si scollegano dal token
 * il giorno in cui il token cambia, e nessuno se ne accorge finché il rosso non è due rossi.
 */
.reason {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-loss) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-loss) 25%, transparent);
}
</style>
