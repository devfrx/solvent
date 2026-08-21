<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, shallowRef } from 'vue'

import type { Cheat, CheatId } from '@core/contracts/cheats'
import type { Money } from '@core/contracts/money'

import type { GameError } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiButton from '@renderer/ui/UiButton.vue'
import UiLabel from '@renderer/ui/UiLabel.vue'
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
 * **Sta nel livello superiore** (ADR 0032): `popover`, niente `z-index`, `Esc` che chiude gratis.
 * Non è un lusso — un pannello dentro il flusso verrebbe tagliato dal primo antenato con `overflow`
 * e sposterebbe la pagina che si sta guardando, cioè disturberebbe proprio la cosa che serve a
 * verificare.
 *
 * **Non è una schermata.** Nessuna voce nella colonna, nessuna riga in `SCREENS`: le destinazioni
 * sono i posti dove il gioco si amministra (ADR 0033), e questo non è gioco. Vive sopra qualunque
 * schermata, perché serve **mentre** si guarda un'altra cosa.
 */

const store = useGameStore()
const { devCheats } = storeToRefs(store)
const { text, money, failure } = useTranslator()

const open = ref(false)

/** `shallowRef` come altrove: un rifiuto porta dei `Decimal`, e un `ref` li avvolgerebbe. */
const refusal = shallowRef<GameError | null>(null)
const refused = shallowRef<CheatId | null>(null)

/**
 * Lo stato aperto/chiuso arriva **dal motore**, non da noi: con `popovertarget` è il browser a
 * aprire, chiudere, ascoltare `Esc` e chiudere al clic fuori. A noi resta di rispecchiarlo per
 * `aria-expanded`.
 *
 * La prima stesura apriva e chiudeva a mano da un `@click`, e il pannello **non si chiudeva più**:
 * un `popover` si congeda da solo quando si clicca fuori, e il pulsante è fuori — quindi il motore
 * chiudeva e il gestore riapriva nello stesso clic. Con l'aggancio dichiarativo il motore sa che
 * quel pulsante è il suo, e non fa il giro.
 */
const onToggle = (event: Event): void => {
  open.value = (event as ToggleEvent).newState === 'open'
}

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
  <button class="tab" type="button" popovertarget="dev-panel" :aria-expanded="open">
    {{ text('dev.title') }}
  </button>

  <div id="dev-panel" popover class="panel" @toggle="onToggle">
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
</template>

<style scoped>
/*
 * L'aggancio: piccolo, in basso a destra, `fixed` perché deve restare raggiungibile mentre la
 * pagina scorre. Il tratteggio è deliberato — dice «questo non fa parte del gioco» senza bisogno
 * di una parola in più, ed è l'unico posto del progetto che lo usa.
 */
.tab {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
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
 * `inset: auto` disfa il «al centro dello schermo» che il motore mette su ogni riquadro del livello
 * superiore, come in `UiTooltip`. Poi si colloca sopra il proprio aggancio.
 */
.panel {
  position: fixed;
  inset: auto;
  right: var(--space-4);
  bottom: calc(var(--space-7) + var(--space-4));
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
