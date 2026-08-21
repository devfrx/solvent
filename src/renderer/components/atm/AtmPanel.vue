<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, shallowRef } from 'vue'

import type { Money } from '@core/contracts/money'

import type { GameError, MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import type { AtmOperationKind } from '@renderer/stores/game'
import { ATM_KINDS, useGameStore } from '@renderer/stores/game'
import UiButton from '@renderer/ui/UiButton.vue'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiNumber from '@renderer/ui/UiNumber.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiText from '@renderer/ui/UiText.vue'
import UiTooltip from '@renderer/ui/UiTooltip.vue'

import PostingRows from '../ledger/PostingRows.vue'

/**
 * Il gesto centrale del gioco, e l'unica cosa che la home **chiede** invece di mostrare: dove
 * metti i soldi, sapendo quanto costa spostarli.
 *
 * ADR 0018 — la commissione si vede **prima** della conferma. Non è una cortesia: un bancomat che
 * dice quanto costa dopo che hai premuto è un bancomat scorretto, e questo gioco parla di soldi.
 * Il riquadro «cosa succede» non è un riassunto dell'operazione — **è** l'operazione, l'elenco di
 * movimenti che il comando applicherà (INV-11). Questo componente non conosce la commissione, non
 * sa quanto arriva a destinazione e non fa una sottrazione: chiede l'anteprima e la mostra.
 *
 * Se l'anteprima è un **no**, si legge il perché al posto dei movimenti e il pulsante resta
 * premibile: un pulsante spento è un rifiuto senza motivo, ed è esattamente ciò che questa fetta
 * esiste per non fare. Premerlo ridà lo stesso codice, perché a rispondere è la stessa funzione.
 * Da D023 non è più disciplina: `UiButton` non sa spegnersi (INV-21).
 */

interface Wording {
  readonly name: MessageKey
  readonly title: MessageKey
  readonly confirm: MessageKey
}

/**
 * Le tre parole di ciascuna direzione, in una tabella sola: una direzione nuova non compila finché
 * non ha tutte e tre, che è lo stesso meccanismo con cui `failure` obbliga a tradurre un codice.
 */
const WORDING: Readonly<Record<AtmOperationKind, Wording>> = {
  deposit: { name: 'atm.deposit', title: 'atm.deposit.title', confirm: 'atm.deposit.confirm' },
  withdraw: { name: 'atm.withdraw', title: 'atm.withdraw.title', confirm: 'atm.withdraw.confirm' }
}

const store = useGameStore()
const { atmAmounts } = storeToRefs(store)
const { text, money, failure } = useTranslator()

/**
 * Si parte dal deposito e dall'importo più grande, e nessuna delle due è una preferenza estetica:
 * il reddito entra in contanti e l'upgrade si paga con la carta (D010), quindi la prima cosa utile
 * che si può fare qui è depositare — e con una commissione fissa l'importo piccolo è l'opzione
 * peggiore, che non è quella su cui si apre una schermata.
 */
const kind = shallowRef<AtmOperationKind>('deposit')

/**
 * `shallowRef` come nello store, e per la stessa ragione: un `ref` avvolgerebbe in un proxy anche
 * il contenuto, cioè il `Decimal`, e da lì in poi l'importo non sarebbe più quello che il dominio
 * sa maneggiare.
 */
const amount = shallowRef<Money>(store.atmDefaultAmount)
const refusal = shallowRef<GameError | null>(null)

/**
 * Una `computed` e non un mirror, ed è l'eccezione che conferma la regola di D012: qui la sorgente
 * non vive in `core/` — sono i due `ref` locali qui sopra, che cambiano solo quando il giocatore
 * tocca qualcosa. `previewOf` è pura, quindi ricalcolarla su di loro è esatto.
 */
const preview = computed(() => store.preview(kind.value, amount.value))

const choose = (next: AtmOperationKind): void => {
  kind.value = next
  refusal.value = null
}

const setAmount = (next: Money): void => {
  amount.value = next
  refusal.value = null
}

const submit = (): void => {
  const done = store.confirm(kind.value, amount.value)
  refusal.value = done.ok ? null : done.error
}
</script>

<template>
  <UiPanel>
    <div class="switch">
      <UiButton
        v-for="option of ATM_KINDS"
        :key="option"
        variant="quiet"
        :class="{ current: kind === option }"
        :label="text(WORDING[option].name)"
        @press="choose(option)"
      />
    </div>

    <UiLabel>{{ text(WORDING[kind].title) }}</UiLabel>
    <p class="chosen">
      <UiNumber :value="money(amount)" size="xl" />
    </p>

    <div class="quick">
      <UiButton
        v-for="(option, index) of atmAmounts"
        :key="index"
        variant="quiet"
        :label="money(option)"
        @press="setAmount(option)"
      />
    </div>

    <p class="breakdown">
      <UiTooltip :text="text('atm.breakdown.explained')">
        <UiLabel>{{ text('atm.breakdown') }}</UiLabel>
      </UiTooltip>
    </p>
    <div class="ledger">
      <PostingRows v-if="preview.ok" :postings="preview.value" />
      <UiText v-else tone="loss" size="xs">{{ failure(preview.error) }}</UiText>
    </div>

    <div class="send">
      <UiButton
        :label="text(WORDING[kind].confirm)"
        :reason="refusal === null ? undefined : failure(refusal)"
        @press="submit"
      />
    </div>
  </UiPanel>
</template>

<style scoped>
.switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

/*
 * La direzione scelta si vede **dal bordo**, non dal fondo. Guardando le due schermate a occhio nei
 * due temi — che la definizione di fatto di D023 chiede apposta — nel tema scuro `--color-raised`
 * contro `--color-surface` è una differenza di due punti di luminosità: nel chiaro il bianco si
 * stacca, nello scuro il pulsante scelto era indistinguibile dall'altro.
 */
.switch .current :deep(button) {
  background: var(--color-raised);
  color: var(--color-ink);
  border-color: var(--color-ink-3);
}

.chosen {
  margin: var(--space-2) 0 0;
}

.quick {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.breakdown {
  margin: var(--space-6) 0 0;
}

.ledger {
  margin-top: var(--space-3);
  background: var(--color-raised);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.send {
  margin-top: var(--space-5);
}
</style>
