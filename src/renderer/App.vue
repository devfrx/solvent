<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

import type { MessageKey } from './i18n'
import { useTranslator } from './i18n'
import type { GameStatus } from './stores/game'
import { useGameStore } from './stores/game'
import UiButton from './ui/UiButton.vue'
import UiText from './ui/UiText.vue'
import HomeView from './views/HomeView.vue'
import StatsView from './views/StatsView.vue'

/**
 * Il guscio: rende i sette stati del ciclo di vita, e adesso li rende con delle parole.
 *
 * Non decide niente di economico e non conosce una sola frase: chiede una chiave e riceve un
 * testo (R12), chiede uno stato allo store e mostra la schermata che gli corrisponde. Le sette
 * caselle sono quelle di docs/design/ciclo-di-vita.md, una a una.
 *
 * `Errore` è **una** schermata con due cause: un caricamento fallito, da cui si esce con una
 * partita nuova, e un salvataggio finale fallito, dove la partita è ancora tutta in memoria e la
 * finestra è rimasta aperta apposta — lì la seconda uscita è chiudere sapendo cosa si perde.
 */

/**
 * Gli stati in cui il tavolo da gioco resta a schermo. `recovering` è fra questi, e non è un
 * dettaglio: prima di questa delega il recupero **sostituiva** la schermata, quindi ogni ritorno
 * dalla finestra nascosta smontava la home — e con lei l'importo scelto al bancomat e il verso
 * della carta. Un alt-tab di due secondi azzerava ciò che il giocatore aveva appena impostato.
 *
 * Adesso il recupero è un **velo**: dice che sta succedendo qualcosa senza portare via ciò che
 * c'era sotto. La macchina a stati non cambia — `Sospeso → Recupero → InGioco` resta il percorso
 * unico di docs/design/ciclo-di-vita.md — cambia solo come il guscio la veste.
 */
const PLAYABLE: readonly GameStatus[] = ['playing', 'suspended', 'recovering']

const store = useGameStore()
const { status, failure, failedDuring, awayFor } = storeToRefs(store)
const { text, duration, failure: failureText } = useTranslator()

/**
 * Le due schermate della fetta. Sono un `ref` e non un router: due destinazioni senza indirizzo
 * da condividere non giustificano una dipendenza (ADR 0015), e il giorno in cui ne servirà uno
 * lo dirà una schermata che vuole essere raggiungibile da fuori.
 */
const SCREENS = ['home', 'stats'] as const

type Screen = (typeof SCREENS)[number]

const SCREEN_KEYS: Readonly<Record<Screen, MessageKey>> = {
  home: 'app.nav.home',
  stats: 'app.nav.stats'
}

const screen = ref<Screen>('home')

const retry = (): void => void store.retry()
const startOver = (): void => void store.newGame()
</script>

<template>
  <main class="shell" :data-status="status">
    <template v-if="status === 'failed' && failure !== null">
      <div class="center">
        <p class="headline danger">{{ failureText(failure) }}</p>
        <UiText class="detail">
          {{ text(failedDuring === 'saving' ? 'app.error.save_hint' : 'app.error.load_hint') }}
        </UiText>
        <div class="choices">
          <UiButton variant="quiet" :label="text('app.error.retry')" @press="retry" />
          <UiButton
            v-if="failedDuring === 'saving'"
            :label="text('app.error.close_anyway')"
            @press="store.closeWithoutSaving()"
          />
          <UiButton v-else :label="text('app.error.new_game')" @press="startOver" />
        </div>
      </div>
    </template>

    <template v-else-if="PLAYABLE.includes(status)">
      <nav class="tabs">
        <button
          v-for="name of SCREENS"
          :key="name"
          type="button"
          class="tab"
          :class="{ current: screen === name }"
          @click="screen = name"
        >
          {{ text(SCREEN_KEYS[name]) }}
        </button>
      </nav>
      <div class="board">
        <HomeView v-if="screen === 'home'" />
        <StatsView v-else />
      </div>

      <div v-if="status === 'recovering'" class="center veil">
        <span class="ring" aria-hidden="true"></span>
        <p class="headline">{{ text('app.loading.catchup') }}</p>
        <UiText v-if="awayFor > 0" class="detail">
          {{ text('app.loading.away_for', { duration: duration(awayFor) }) }}
        </UiText>
      </div>
    </template>

    <div v-else-if="status === 'closing'" class="center">
      <span class="ring" aria-hidden="true"></span>
      <p class="headline">{{ text('app.closing.saving') }}</p>
    </div>

    <div v-else class="center">
      <span class="ring" aria-hidden="true"></span>
      <p class="headline">{{ text('app.loading.title') }}</p>
    </div>
  </main>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-5);
  background: var(--color-raised);
  border-bottom: 1px solid var(--color-line);
}

.tab {
  background: transparent;
  color: var(--color-ink-3);
  padding: var(--space-2) var(--space-5);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--track-wide);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.tab.current {
  color: var(--color-ink);
  background: var(--color-surface);
  border-color: var(--color-line);
}

.board {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-6);
}

/*
 * Il velo del recupero: copre il tavolo senza smontarlo. `fixed` e non `absolute` perché il
 * guscio scorre — un velo ancorato al flusso scivolerebbe via insieme alla schermata.
 */
.veil {
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--color-bg) 88%, transparent);
}

.center {
  flex: 1;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-5);
  text-align: center;
  padding: var(--space-6);
}

.headline {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  margin: 0;
}

.headline.danger {
  color: var(--color-loss);
}

.detail {
  max-width: 320px;
}

.choices {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.choices > * {
  min-width: 130px;
}

/* Un anello fermo: le animazioni sono fuori scopo, e una che gira senza dire niente lo resterà. */
.ring {
  width: 22px;
  height: 22px;
  border: 2px solid var(--color-line);
  border-top-color: var(--color-accent);
  border-radius: 50%;
}
</style>
