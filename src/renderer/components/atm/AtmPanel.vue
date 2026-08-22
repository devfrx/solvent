<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref, shallowRef } from 'vue'

import type { Pool } from '@core/contracts/pools'

import type { GameError, MessageKey } from '@renderer/i18n'
import { refusalCode, useTranslator } from '@renderer/i18n'
import type { AtmOperationKind } from '@renderer/stores/game'
import { useGameStore } from '@renderer/stores/game'
import UiButton from '@renderer/ui/UiButton.vue'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiText from '@renderer/ui/UiText.vue'
import UiTooltip from '@renderer/ui/UiTooltip.vue'

import PostingRows from '../ledger/PostingRows.vue'

import { readAmount } from './amount'
import InstrumentSide from './InstrumentSide.vue'

/**
 * Il gesto centrale del gioco: dove metti i soldi, sapendo quanto costa spostarli.
 *
 * ADR 0018 — la commissione si vede **prima** della conferma. Non è una cortesia: un bancomat che
 * dice quanto costa dopo che hai premuto è un bancomat scorretto, e questo gioco parla di soldi.
 * Il riquadro «prima di confermare» non è un riassunto dell'operazione — **è** l'operazione,
 * l'elenco di movimenti che il comando applicherà (INV-11). Questo componente non conosce la
 * commissione, non sa quanto arriva a destinazione e non fa una sottrazione: chiede l'anteprima e
 * la mostra.
 *
 * Se l'anteprima è un **no**, si legge il perché al posto dei movimenti e il pulsante resta
 * premibile: un pulsante spento è un rifiuto senza motivo, ed è esattamente ciò che questa fetta
 * esiste per non fare. Premerlo ridà lo stesso codice, perché a rispondere è la stessa funzione.
 * Da D023 non è più disciplina: `UiButton` non sa spegnersi (INV-21).
 *
 * **Da [D033](../../../../docs/delega/D033-il-bancomat-e-una-pagina.md) l'importo si digita.**
 * Prima si sceglieva **solo** fra quattro pulsanti, ed era scritto in `constants.ts` che fosse
 * deliberato: con un caveau da 250.000,00 € quattro importi fissi hanno smesso di essere una
 * scelta. I quattro restano sotto il campo — sono le scorciatoie, non più l'unico accesso — e
 * `MAX` propone un importo che **passa**, chiedendolo a `largestThatFits` invece di ricavarlo da
 * una sottrazione che con la commissione in percentuale sbaglierebbe.
 */

/**
 * La parola di ciascuna direzione. Un `Record` totale: una direzione nuova non compila finché non
 * ha la sua, che è lo stesso meccanismo con cui `failure` obbliga a tradurre un codice d'errore.
 *
 * È **una** e non più tre: il verso non ha più due linguette che lo scelgono, lo dicono i due lati
 * del blocco `DA ⇄ A`, e l'unico posto in cui serve ancora una parola è il pulsante che conferma.
 */
const CONFIRM: Readonly<Record<AtmOperationKind, MessageKey>> = {
  deposit: 'atm.deposit.confirm',
  withdraw: 'atm.withdraw.confirm'
}

const store = useGameStore()
const { atmAmounts, atmDefaultAmount, atmFeeFloor, atmMaximums, balances, vaultRoom } =
  storeToRefs(store)
const { text, money, plainMoney, failure } = useTranslator()

/**
 * Si parte dal deposito, e non è una preferenza estetica: il reddito entra in contanti e l'upgrade
 * si paga con la carta (D010), quindi la prima cosa utile che si può fare qui è depositare.
 */
const kind = shallowRef<AtmOperationKind>('deposit')

/**
 * I due strumenti del verso corrente, letti **dal dominio** attraverso lo store (D035, punto 7).
 *
 * Qui c'era una costante che ridiceva la tabella di `DEPOSIT`/`WITHDRAW`, e non per pigrizia:
 * R05 vieta a un `.vue` di importare `domains/atm/commands` — nemmeno per un tipo — e il
 * selettore non esisteva. Adesso esiste, e la stessa domanda ha una risposta sola: i due strumenti
 * mostrati qui sopra e i movimenti mostrati là sotto vengono dalla stessa dichiarazione.
 */
const side = computed(() => store.atmSides[kind.value])

/**
 * **Il campo tiene testo, non un `Decimal`.** Un `ref` su `Money` legato con `v-model` sarebbe la
 * trappola di D012: Vue avvolgerebbe il `Decimal` in un proxy, e da lì il dominio non lo
 * riconoscerebbe più. Lo store usa `shallowRef` per questo; qui la risposta è più semplice —
 * testo di qua, `Money` di là, e in mezzo `readAmount`.
 *
 * Il valore iniziale passa da `plainMoney`, cioè dallo stesso confine di presentazione che
 * scrivono i pulsanti rapidi: ciò che compare nel campo è esattamente ciò che il giocatore
 * scriverebbe a mano, nella lingua accesa.
 */
const typed = ref(plainMoney(atmDefaultAmount.value))

/**
 * Il rifiuto della **conferma**, che non è quello dell'anteprima. Lo dice la trappola 5 di D033:
 * con un campo che cambia a ogni carattere, azzerarlo mentre si digita farebbe lampeggiare il
 * messaggio. L'anteprima si aggiorna a ogni tasto; questo resta finché non si ripreme.
 *
 * Cambiare **verso** lo azzera lo stesso, ed è l'unica eccezione: un rifiuto che parlava di un
 * prelievo, letto sotto un pulsante che adesso deposita, è peggio di nessun rifiuto.
 */
const refusal = shallowRef<GameError | null>(null)

const amount = computed(() => readAmount(typed.value))

/**
 * Una `computed` e non un mirror, ed è l'eccezione che conferma la regola di D012: qui la sorgente
 * non vive in `core/` — sono il verso e il testo del campo, che cambiano solo quando il giocatore
 * tocca qualcosa. `previewOf` è pura, quindi ricalcolarla su di loro è esatto e costa poco.
 */
const preview = computed(() => store.preview(kind.value, amount.value))

const maximum = computed(() => atmMaximums.value[kind.value])

/**
 * La nota sui contanti dice quanto spazio resta nel caveau, che è la cosa che li distingue dalla
 * carta. `vaultRoom` è `null` solo se i contanti non avessero un tetto, e il caveau ce l'ha sempre
 * — la riga esiste perché il tipo lo ammette, non perché succeda.
 */
const noteFor = (pool: Pool): string =>
  pool === 'cash'
    ? text('atm.note.cash', {
        room: vaultRoom.value === null ? text('pool.unlimited') : money(vaultRoom.value)
      })
    : text('atm.note.card')

const swap = (): void => {
  kind.value = kind.value === 'deposit' ? 'withdraw' : 'deposit'
  refusal.value = null
}

const write = (value: (typeof atmAmounts.value)[number]): void => {
  typed.value = plainMoney(value)
}

const submit = (): void => {
  const done = store.confirm(kind.value, amount.value)
  refusal.value = done.ok ? null : done.error
}
</script>

<template>
  <UiPanel>
    <div class="bridge">
      <InstrumentSide
        side="atm.from"
        :pool="side.from"
        :balance="money(balances[side.from])"
        :note="noteFor(side.from)"
      />
      <div class="swap">
        <button type="button" class="turn" :aria-label="text('atm.swap')" @click="swap()">
          <span aria-hidden="true">⇄</span>
        </button>
      </div>
      <InstrumentSide
        side="atm.to"
        :pool="side.to"
        :balance="money(balances[side.to])"
        :note="noteFor(side.to)"
      />
    </div>

    <div class="amount">
      <UiLabel>{{ text('atm.amount') }}</UiLabel>
      <p class="field">
        <span class="symbol" aria-hidden="true">€</span>
        <input v-model="typed" class="typed" inputmode="decimal" :aria-label="text('atm.amount')" />
      </p>

      <div class="quick">
        <button
          v-for="(option, index) of atmAmounts"
          :key="index"
          type="button"
          class="chipbutton"
          @click="write(option)"
        >
          {{ money(option) }}
        </button>
        <button type="button" class="chipbutton" @click="write(maximum)">
          {{ text('atm.max') }}
        </button>
        <span class="limits">
          {{ text('atm.limits', { floor: money(atmFeeFloor), max: money(maximum) }) }}
        </span>
      </div>
    </div>

    <div class="preview">
      <p class="head">
        <UiTooltip :text="text('atm.breakdown.explained')">
          <UiLabel>{{ text('atm.breakdown') }}</UiLabel>
        </UiTooltip>
        <span class="aside">{{ text('atm.breakdown.aside') }}</span>
      </p>

      <div v-if="preview.ok" class="ledger">
        <PostingRows :postings="preview.value" />
      </div>
      <div v-else class="refused">
        <p class="code">
          <UiLabel tone="loss">{{ text('atm.refused') }}</UiLabel>
          <UiLabel tone="loss">{{ refusalCode(preview.error) }}</UiLabel>
        </p>
        <UiText tone="ink" size="sm">{{ failure(preview.error) }}</UiText>
      </div>
    </div>

    <div class="send">
      <UiButton
        :label="text(CONFIRM[kind], { amount: money(amount) })"
        :muted="!preview.ok"
        :reason="refusal === null ? undefined : failure(refusal)"
        @press="submit()"
      />
      <UiText size="xs">
        {{ text(preview.ok ? 'atm.confirm.note' : 'atm.confirm.note.refused') }}
      </UiText>
    </div>
  </UiPanel>
</template>

<style scoped>
/*
 * I due strumenti affiancati, col pulsante che li scambia in mezzo. Le colonne laterali sono
 * `1fr` e non `auto`: con `auto` il lato che porta il saldo più lungo si prenderebbe più spazio, e
 * il pulsante scivolerebbe di lato a ogni movimento di denaro.
 */
.bridge {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: stretch;
  margin: calc(var(--space-5) * -1) calc(var(--space-6) * -1) 0;
  border-bottom: 1px solid var(--color-line-soft);
}

.swap {
  display: grid;
  place-items: center;
  padding: 0 var(--space-2);
  border-inline: 1px solid var(--color-line-soft);
}

.turn {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-line);
  background: var(--color-raised);
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: var(--text-md);
  cursor: pointer;
}

.amount {
  margin-top: var(--space-6);
}

.field {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin: var(--space-3) 0 var(--space-4);
  padding: var(--space-4) var(--space-5);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-raised);
}

.symbol {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  color: var(--color-ink-3);
}

/*
 * Il campo non ha un bordo suo: il bordo è della riga che lo contiene, con dentro anche il
 * simbolo. Due bordi annidati sarebbero due rettangoli per una cosa sola.
 */
.typed {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  font-variant-numeric: tabular-nums;
  letter-spacing: var(--track-tight);
}

.typed:focus {
  outline: none;
}

.field:focus-within {
  border-color: var(--color-ink-3);
}

.quick {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

/* La forma della targhetta, ma premibile: sono scorciatoie, non l'azione della schermata. */
.chipbutton {
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-pill);
  background: var(--color-raised);
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--track-wide);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
}

.limits {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-ink-3);
  text-align: right;
}

.preview {
  margin-top: var(--space-6);
}

.head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: 0 0 var(--space-3);
}

.aside {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--color-ink-3);
}

.ledger {
  background: var(--color-raised);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

/*
 * Il rifiuto è un blocco suo, non una riga rossa in fondo: porta un codice e una frase, e la
 * frase è quella che il dominio ha prodotto. Il fondo si **deriva** dal token invece di ricopiarne
 * il valore — è la correzione che l'audit di D016 ha imposto a `UiButton`.
 */
.refused {
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-loss) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-loss) 25%, transparent);
}

.code {
  display: flex;
  gap: var(--space-3);
  margin: 0 0 var(--space-2);
}

.send {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
