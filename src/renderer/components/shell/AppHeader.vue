<script setup lang="ts">
import { storeToRefs } from 'pinia'

import type { Pool } from '@core/contracts/pools'
import { POOL_IDS } from '@core/contracts/pools'

import type { MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import type { ColorRole } from '@renderer/ui/roles'
import UiReadout from '@renderer/ui/UiReadout.vue'
import UiScroll from '@renderer/ui/UiScroll.vue'
import UiTooltip from '@renderer/ui/UiTooltip.vue'

import type { Screen } from './screens'
import { SCREEN_WORDING } from './screens'

/**
 * D024 — la testata: dove sei, e quanto hai.
 *
 * La seconda metà è la ragione per cui questa striscia esiste. Prima, sulla schermata Statistiche i
 * saldi sparivano: per sapere quanto si aveva bisognava tornare al bancomat. In un idle il saldo è il
 * numero che si guarda **mentre si fa altro**, quindi il posto giusto è quello che non cambia mai.
 *
 * Non c'è la ricerca, non c'è il contatore di calore, non ci sono le caselle di attenzione: il
 * canvas le disegna e il codice non ha un numero da metterci dentro. La regola di D024 è quella —
 * una casella si disegna solo se un selettore dello store la può riempire oggi.
 *
 * Le cifre restano del colore del testo e a portare il colore dello strumento è il quadratino, come
 * nel canvas: una striscia sempre a schermo con due importi colorati diventerebbe un cruscotto in
 * miniatura, e il cruscotto ha già il suo posto — con il suo tetto di sei riquadri (INV-12).
 */

defineProps<{ readonly current: Screen }>()

const { balances } = storeToRefs(useGameStore())
const { text, money, poolName } = useTranslator()

/**
 * Il ponte fra un pool e il suo colore, e vive qui invece che nel kit per la stessa ragione di
 * `roleOf` in `postings.ts`: `ui/` non sa cosa sia un pool (R14, ADR 0028).
 *
 * `null` è la stessa dichiarazione di `POOL_KEYS` nell'i18n: i conti non-giocatore dell'ADR 0020
 * non hanno un nome, non hanno un colore e non hanno niente da spiegare, perché non compaiono mai
 * davanti al giocatore. Un pool nuovo non compila finché qualcuno non decide da che parte sta.
 */
interface InstrumentLook {
  readonly tone: ColorRole
  /** Cosa vuol dire avere i soldi lì. Nella striscia non c'è posto per la frase, e la frase serve. */
  readonly hint: MessageKey
}

const POOL_LOOKS: Readonly<Record<Pool, InstrumentLook | null>> = {
  cash: { tone: 'cash', hint: 'pool.cash.explained' },
  card: { tone: 'card', hint: 'pool.card.explained' },
  world: null,
  sink: null,
  fees: null,
  house: null,
  tax: null
}

interface Instrument extends InstrumentLook {
  readonly pool: Pool
}

const INSTRUMENTS: readonly Instrument[] = POOL_IDS.flatMap((pool) => {
  const look = POOL_LOOKS[pool]
  return look === null ? [] : [{ pool, ...look }]
})
</script>

<template>
  <div class="crumbs">
    <span class="product">{{ text('app.name') }}</span>
    <span class="divider" aria-hidden="true">/</span>
    <span class="here">{{ text(SCREEN_WORDING[current].title) }}</span>
  </div>

  <UiScroll class="strip">
    <div v-for="instrument of INSTRUMENTS" :key="instrument.pool" class="cell">
      <UiTooltip :text="text(instrument.hint)" side="bottom">
        <UiReadout
          :label="poolName(instrument.pool)"
          :value="money(balances[instrument.pool])"
          :mark="instrument.tone"
        />
      </UiTooltip>
    </div>
  </UiScroll>
</template>

<style scoped>
.crumbs {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-7);
  font-size: var(--text-md);
  white-space: nowrap;
}

.product {
  color: var(--color-ink-3);
}

.divider {
  color: var(--color-line);
}

.here {
  font-weight: var(--weight-semibold);
}

/*
 * La striscia scorre di lato quando gli strumenti non ci stanno, e da D038 a farlo è `UiScroll`
 * (R27): qui restano il respiro ai lati e la riga che la stacca dalle briciole.
 */
.strip {
  display: flex;
  align-items: stretch;
  padding: 0 var(--space-7);
  border-top: 1px solid var(--color-line-soft);
}

.cell {
  display: flex;
  align-items: center;
  padding: var(--space-4) var(--space-6) var(--space-4) 0;
  margin-right: var(--space-6);
  border-right: 1px solid var(--color-line-soft);
}

.cell:last-child {
  margin-right: 0;
  padding-right: 0;
  border-right: none;
}
</style>
