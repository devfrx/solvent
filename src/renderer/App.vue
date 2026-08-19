<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'

import type { MessageKey } from './i18n'
import { useTranslator } from './i18n'
import { useGameStore } from './stores/game'
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
        <p class="detail">
          {{ text(failedDuring === 'saving' ? 'app.error.save_hint' : 'app.error.load_hint') }}
        </p>
        <div class="choices">
          <button type="button" class="ghost" @click="retry">
            {{ text('app.error.retry') }}
          </button>
          <button
            v-if="failedDuring === 'saving'"
            type="button"
            class="primary"
            @click="store.closeWithoutSaving()"
          >
            {{ text('app.error.close_anyway') }}
          </button>
          <button v-else type="button" class="primary" @click="startOver">
            {{ text('app.error.new_game') }}
          </button>
        </div>
      </div>
    </template>

    <template v-else-if="status === 'playing' || status === 'suspended'">
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
    </template>

    <div v-else-if="status === 'recovering'" class="center">
      <span class="ring" aria-hidden="true"></span>
      <p class="headline">{{ text('app.loading.catchup') }}</p>
      <p v-if="awayFor > 0" class="detail">
        {{ text('app.loading.away_for', { duration: duration(awayFor) }) }}
      </p>
    </div>

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

<style>
/**
 * P2 — le costanti dello stile approvato, estratte in token come quella preferenza chiede.
 *
 * Il verde è **solo** il denaro che entra e l'azione primaria: un secondo verde toglie al primo
 * il suo significato. Le cifre sono tabulari ovunque compaia un importo, altrimenti un saldo che
 * sale fa ballare la riga.
 *
 * Non è scoped, e in tutto il progetto è l'unico blocco che non lo è: i token servono a ogni
 * componente, e il resto dello stile sta attaccato a chi lo usa — così togliere un componente
 * toglie anche il suo CSS, che è la difesa contro le 1.067 righe morte del difetto A14.
 */
:root {
  --bg: #0f1115;
  --panel: #171a21;
  --panel-raised: #1e222b;
  --line: #2a2f3a;
  --text: #e6e8ec;
  --muted: #939aa8;
  --accent: #4ade80;
  --on-accent: #06240f;
  --warn: #fbbf24;
  --danger: #f87171;
  --radius: 10px;
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-size: 14px;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 16px;
}

.caption {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
  font-weight: 600;
}

.amount {
  font-variant-numeric: tabular-nums;
}

button {
  padding: 10px;
  border-radius: 7px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.primary {
  background: var(--accent);
  color: var(--on-accent);
}

.ghost {
  background: transparent;
  color: var(--text);
  border-color: var(--line);
}
</style>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: var(--panel-raised);
  border-bottom: 1px solid var(--line);
}

.tab {
  background: transparent;
  color: var(--muted);
  padding: 6px 12px;
}

.tab.current {
  color: var(--text);
  background: var(--panel);
  border-color: var(--line);
}

.board {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
}

.center {
  flex: 1;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  text-align: center;
  padding: 24px;
}

.headline {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.headline.danger {
  color: var(--danger);
}

.detail {
  font-size: 12px;
  color: var(--muted);
  max-width: 320px;
  line-height: 1.55;
  margin: 0;
}

.choices {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.choices button {
  min-width: 130px;
}

/* Un anello fermo: le animazioni sono fuori scopo, e una che gira senza dire niente lo resterà. */
.ring {
  width: 22px;
  height: 22px;
  border: 2px solid var(--line);
  border-top-color: var(--accent);
  border-radius: 50%;
}
</style>
