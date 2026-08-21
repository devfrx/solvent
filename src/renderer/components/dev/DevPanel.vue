<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { shallowRef } from 'vue'

import type { Cheat, CheatId } from '@core/contracts/cheats'
import type { Money } from '@core/contracts/money'

import type { GameError } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiButton from '@renderer/ui/UiButton.vue'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiPopover from '@renderer/ui/UiPopover.vue'
import UiText from '@renderer/ui/UiText.vue'

/**
 * D029 · ADR 0036 — il pannello dei cheat, e l'unico pezzo di interfaccia del progetto che non
 * arriva mai davanti a un giocatore.
 *
 * **Non sa quali cheat esistono.** Legge l'elenco dallo store e disegna una riga per ciascuno,
 * scegliendo la forma dal `kind`: chi vuole un importo mostra le proprie cifre, chi non lo vuole è
 * un pulsante. Un cheat nuovo compare qui senza che questo file cambi, che è metà del senso del
 * registro — se il pannello avesse una lista sua sarebbe la seconda lista, cioè il difetto A02.
 *
 * **E non conosce un solo numero.** Le cifre le porta il cheat (`amounts`), già come `Money`:
 * questo file non ne costruisce nessuno, non ne somma nessuno e non ne legge nessuno — li passa
 * allo store e li dà da formattare al traduttore. È la stessa disciplina di `BankCard3d`, che
 * riceve quattro stringhe già fatte.
 *
 * **Sta nel livello superiore** (ADR 0032), e da [D031](../../../../docs/delega/D031-la-sovrapposizione-e-un-pezzo-del-kit.md)
 * ci sta passando da `UiPopover` invece che per conto proprio. Non è un lusso — un pannello dentro
 * il flusso verrebbe tagliato dal primo antenato con `overflow` e sposterebbe la pagina che si sta
 * guardando, cioè disturberebbe proprio la cosa che serve a verificare.
 *
 * **Questo file è stato il difetto**, e vale la pena che lo dica: la sua `.panel` scriveva
 * `display: flex` senza condizione, e una regola d'autore vince su quella del motore — quindi il
 * riquadro restava visibile anche chiuso, e per due stesure la colpa era stata data alla meccanica
 * di apertura. Adesso quella riga non è più sua: `UiPopover` possiede il `display`, e R22 impedisce
 * a questo file di avere di nuovo in mano un elemento con `popover`.
 *
 * **Non è una schermata.** Nessuna voce nella colonna, nessuna riga in `SCREENS`: le destinazioni
 * sono i posti dove il gioco si amministra (ADR 0033), e questo non è gioco. Vive sopra qualunque
 * schermata, perché serve **mentre** si guarda un'altra cosa.
 */

const store = useGameStore()
const { devCheats } = storeToRefs(store)
const { text, money, failure } = useTranslator()

/** `shallowRef` come altrove: un rifiuto porta dei `Decimal`, e un `ref` li avvolgerebbe. */
const refusal = shallowRef<GameError | null>(null)
const refused = shallowRef<CheatId | null>(null)

const run = (cheat: Cheat, amount?: Money): void => {
  const done = store.runCheat(cheat.id, amount)
  refusal.value = done.ok ? null : done.error
  refused.value = done.ok ? null : cheat.id
}

/** Il rifiuto si mostra sotto il cheat che l'ha ricevuto, e sparisce appena un altro riesce. */
const reasonFor = (cheat: Cheat): string | undefined =>
  refused.value === cheat.id && refusal.value !== null ? failure(refusal.value) : undefined
</script>

<template>
  <UiPopover class="corner" side="top">
    <template #trigger="{ popovertarget, expanded }">
      <button class="tab" type="button" :popovertarget="popovertarget" :aria-expanded="expanded">
        {{ text('dev.title') }}
      </button>
    </template>

    <div class="panel">
      <header class="head">
        <UiLabel>{{ text('dev.title') }}</UiLabel>
        <UiText tone="ink-3" size="xs">{{ text('dev.subtitle') }}</UiText>
      </header>

      <ul class="cheats">
        <li v-for="cheat of devCheats" :key="cheat.id" class="cheat">
          <template v-if="cheat.kind === 'amount'">
            <UiLabel>{{ text(cheat.id) }}</UiLabel>
            <div class="amounts">
              <UiButton
                v-for="amount of cheat.amounts"
                :key="amount.toString()"
                variant="quiet"
                :label="money(amount)"
                :reason="reasonFor(cheat)"
                @press="run(cheat, amount)"
              />
            </div>
          </template>
          <UiButton
            v-else
            variant="quiet"
            :label="text(cheat.id)"
            :reason="reasonFor(cheat)"
            @press="run(cheat)"
          />
        </li>
      </ul>
    </div>
  </UiPopover>
</template>

<style scoped>
/*
 * L'angolo: `fixed` perché l'aggancio deve restare raggiungibile mentre la pagina scorre.
 *
 * Sta sull'**ancora** e non sul pulsante, e non è un dettaglio: da D031 l'ancora è l'elemento a cui
 * il riquadro si aggancia, quindi deve essere lei a trovarsi dove il pulsante si vede. Con `fixed`
 * sul pulsante l'ancora resterebbe un rettangolo vuoto in mezzo alla pagina, e il pannello si
 * aprirebbe lì.
 *
 * Che una classe passata da fuori arrivi fino all'ancora non è fortuna: `UiPopover` ha un elemento
 * di radice solo, quindi gli attributi ricadono lì da soli. Non è una proprietà di geometria (R16):
 * è il chiamante che veste ciò che possiede.
 */
.corner {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
}

/*
 * L'aggancio: piccolo, tratteggiato. Il tratteggio è deliberato — dice «questo non fa parte del
 * gioco» senza bisogno di una parola in più, ed è l'unico posto del progetto che lo usa.
 */
.tab {
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--track-label);
  color: var(--color-ink-3);
  background: var(--color-raised);
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-sm);
}

.tab:hover {
  color: var(--color-ink);
  border-color: var(--color-ink-3);
}

/*
 * La pittura del pannello, e **solo** quella: dove si colloca, come sta nel livello superiore e
 * quando si vede sono di `UiPopover`.
 *
 * Il `display: flex` qui è legittimo, ed è la differenza che conta: questo è un `div` dentro il
 * riquadro, non l'elemento che porta l'attributo `popover`. La riga che disfaceva il meccanismo
 * stava sull'elemento sbagliato, e adesso quell'elemento non è più raggiungibile da questo file —
 * lo impedisce R22, non l'attenzione di chi scrive.
 */
.panel {
  width: 300px;
  max-height: 72vh;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--color-raised);
  border: 1px dashed var(--color-line);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
}

.head {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.cheats {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.cheat {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.amounts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}
</style>
