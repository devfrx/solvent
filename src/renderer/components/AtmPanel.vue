<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, shallowRef } from 'vue'

import type { Money } from '@core/contracts/money'

import type { GameError, MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import type { AtmOperationKind } from '@renderer/stores/game'
import { ATM_KINDS, useGameStore } from '@renderer/stores/game'

import PostingRows from './PostingRows.vue'

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
  <section class="panel">
    <div class="switch">
      <button
        v-for="option of ATM_KINDS"
        :key="option"
        type="button"
        class="ghost"
        :class="{ current: kind === option }"
        @click="choose(option)"
      >
        {{ text(WORDING[option].name) }}
      </button>
    </div>

    <p class="caption">{{ text(WORDING[kind].title) }}</p>
    <p class="amount chosen">{{ money(amount) }}</p>

    <div class="quick">
      <button
        v-for="(option, index) of atmAmounts"
        :key="index"
        type="button"
        class="ghost amount"
        @click="setAmount(option)"
      >
        {{ money(option) }}
      </button>
    </div>

    <p class="caption breakdown">{{ text('atm.breakdown') }}</p>
    <div class="ledger">
      <PostingRows v-if="preview.ok" :postings="preview.value" />
      <p v-else class="refusal">{{ failure(preview.error) }}</p>
    </div>

    <button type="button" class="primary send" @click="submit">
      {{ text(WORDING[kind].confirm) }}
    </button>

    <p v-if="refusal !== null" class="refusal">{{ failure(refusal) }}</p>
  </section>
</template>

<style scoped>
.switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.switch .current {
  background: var(--panel-raised);
  color: var(--text);
}

.chosen {
  font-size: 30px;
  font-weight: 650;
  letter-spacing: -0.02em;
  margin: 6px 0 0;
}

.quick {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.breakdown {
  margin-top: 16px;
}

.ledger {
  margin-top: 8px;
  background: var(--panel-raised);
  border: 1px solid var(--line);
  border-radius: 7px;
  padding: 11px;
}

.send {
  width: 100%;
  margin-top: 14px;
}

.refusal {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--danger);
}

.panel > .refusal {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.25);
}
</style>
