<script setup lang="ts">
import { computed, ref, shallowRef, useId, watch } from 'vue'

import type { PriceList } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'

import { useTranslator } from '@renderer/i18n'
import type { Card } from '@renderer/stores/game'
import UiButton from '@renderer/ui/UiButton.vue'
import UiDialog from '@renderer/ui/UiDialog.vue'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiText from '@renderer/ui/UiText.vue'

import BankCard3d from '../atm/BankCard3d.vue'

import { instrumentKey, needsProof } from './instruments'

/**
 * D036 · ADR 0042 — **l'unico posto in cui si sceglie con cosa si paga.**
 *
 * L'[ADR 0027](../../../../docs/adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) lo
 * aveva scritto fra le proprie conseguenze e nessuno l'aveva costruito: «la UI acquisisce un
 * componente che non aveva — la scelta dello strumento, con il prezzo di ognuno. Non è un menù a
 * tendina in fondo a un modulo: è la cosa che il giocatore guarda prima di premere». Al suo posto
 * ogni pannello disegnava un pulsante per strumento, e `instrumentOf` era già scritta due volte.
 *
 * **Non conosce nessuno store e nessuna azione.** Riceve un listino, sa dire se una voce è alla
 * portata, e restituisce lo strumento scelto con la prova: chi paga davvero è il pannello del
 * dominio, che il suo store ce l'ha già. Così questo pezzo non sa che esistono un caveau e un
 * reddito, e il terzo listino non lo tocca.
 *
 * **Il prezzo sta qui e non sul pulsante che apre**, ed è il rovescio di una decisione di
 * [D019](../../../../docs/delega/D019-il-pagamento.md): allora il pulsante *era* la scelta, quindi
 * portava il proprio prezzo. Adesso non lo è più — con due strumenti i prezzi sono due — e un
 * prezzo scritto su chi apre sarebbe un prezzo che il giocatore può non pagare.
 *
 * **Con un listino di una voce si apre lo stesso.** Non è un caso speciale (ADR 0027), e non è
 * nemmeno un giro a vuoto: lì dentro c'è la ragione — «si paga solo con la carta» — e c'è la prova
 * da dare. Un flusso con un'eccezione è due flussi.
 *
 * **Il pulsante non si spegne** e non può (INV-21): con il campo vuoto, con il codice sbagliato o
 * con i fondi che non bastano resta premibile, e a dire cosa manca è il rifiuto con i suoi numeri.
 */

const props = defineProps<{
  readonly open: boolean
  /** Il listino dell'azione. Vuoto non arriva mai: chi non ha niente da vendere non apre. */
  readonly prices: PriceList
  /** Se quello strumento basta. È l'anteprima, non la decisione: a decidere è il Ledger. */
  readonly affords: (pool: Pool) => boolean
  /** La carta, per mostrarla e farla girare: il codice sta sul retro, dove sta su una vera. */
  readonly card: Card
  /** La frase dell'ultimo rifiuto, già tradotta (R12), oppure niente. */
  readonly refusal?: string | undefined
}>()

const emit = defineEmits<{ close: []; confirm: [pool: Pool, code: string] }>()

const { text, money, poolName } = useTranslator()

/**
 * Il gruppo dei radio vuole un nome, e due finestre in pagina non possono averlo uguale: sarebbe
 * un gruppo solo, e scegliere di qua spegnerebbe la scelta di là. `useId` lo dà stabile e diverso
 * per istanza, come in `UiPopover`.
 */
const group = useId()

/**
 * Lo strumento scelto. `shallowRef` per la ragione di sempre in questo progetto — qui non porta un
 * `Decimal`, ma la voce che ne porta uno la si cerca nel listino invece di copiarla.
 */
const chosen = shallowRef<Pool | null>(null)

/**
 * Il campo tiene **testo**, non un numero: `041` non è `41`, e uno zero iniziale è una cifra come
 * le altre. È la trappola di D012 con un'altra faccia, e la stessa risposta di `AtmPanel` — testo
 * di qua, confronto di là.
 */
const typed = ref('')

/**
 * Aprendola si riparte da capo: la prima voce scelta e il campo vuoto. Senza, la seconda apertura
 * porterebbe il codice digitato nella prima — e con un listino di una voce sola non ci sarebbe
 * niente da scegliere e nessuno lo sceglierebbe.
 */
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    chosen.value = props.prices[0]?.pool ?? null
    typed.value = ''
  }
)

const option = computed(() => props.prices.find((each) => each.pool === chosen.value) ?? null)

const asksProof = computed<boolean>(() => chosen.value !== null && needsProof(chosen.value))

const pay = (): void => {
  if (chosen.value === null) return
  emit('confirm', chosen.value, typed.value)
}
</script>

<template>
  <UiDialog :open="open" :label="text('payment.title')" @close="emit('close')">
    <UiPanel surface="raised" :title="text('payment.title')">
      <div class="options">
        <label
          v-for="each of prices"
          :key="each.pool"
          class="option"
          :class="{ picked: each.pool === chosen, short: !affords(each.pool) }"
        >
          <input
            type="radio"
            :name="group"
            :checked="each.pool === chosen"
            @change="chosen = each.pool"
          />
          <span class="instrument">
            {{ text(instrumentKey(prices.length), { pool: poolName(each.pool) }) }}
          </span>
          <span class="price">{{ money(each.price) }}</span>
        </label>
      </div>

      <section v-if="asksProof" class="proof">
        <BankCard3d :card="card" />
        <UiLabel>{{ text('payment.code.title') }}</UiLabel>
        <input
          v-model="typed"
          class="code"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          spellcheck="false"
          :aria-label="text('payment.code.title')"
        />
        <UiText tone="ink-3" size="xs">{{ text('payment.code.hint') }}</UiText>
      </section>

      <footer class="commit">
        <UiButton
          :label="text('payment.confirm', { cost: option === null ? '' : money(option.price) })"
          :muted="chosen === null || !affords(chosen)"
          :reason="refusal"
          @press="pay"
        />
        <UiButton variant="quiet" :label="text('payment.cancel')" @press="emit('close')" />
      </footer>
    </UiPanel>
  </UiDialog>
</template>

<style scoped>
.options {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/*
 * Una voce è una riga scegliibile, non un pulsante: il `radio` porta con sé il gruppo, le frecce
 * della tastiera e ciò che un lettore di schermo deve sapere, senza che nessuno lo scriva. Nessun
 * colore a mano — R15 rifiuterebbe un `#hex` — e nessun `z-index` (R21).
 */
.option {
  display: flex;
  align-items: baseline;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  cursor: pointer;
}

/*
 * Il pallino resta quello del motore — porta il gruppo, le frecce e ciò che un lettore di schermo
 * deve sapere — ma prende il colore del tema invece del blu di sistema. Visto guardando: era
 * l'unico blu di tutta l'applicazione.
 */
.option input {
  accent-color: var(--color-accent);
}

.option.picked {
  border-color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
}

/*
 * «Con questo non ci arrivi», e non «con questo non si può»: la voce resta scegliibile e il
 * pulsante resta premibile, perché premere è come si scopre di quanto manca (INV-21).
 */
.option.short .price {
  color: var(--color-loss);
}

.instrument {
  flex: 1;
  font-size: var(--text-sm);
}

.price {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
}

.proof {
  margin-top: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/*
 * Il campo del codice. Largo quanto tre cifre più il respiro: un campo lungo una riga direbbe che
 * ci si scrive una frase.
 */
.code {
  width: 6ch;
  font-family: var(--font-mono);
  font-size: var(--text-md);
  letter-spacing: var(--track-wide);
  text-align: center;
  padding: var(--space-3);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-sunken);
  color: var(--color-ink);
}

.commit {
  margin-top: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
