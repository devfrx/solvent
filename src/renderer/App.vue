<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { Component } from 'vue'
import { ref } from 'vue'

import AppHeader from './components/AppHeader.vue'
import AppNav from './components/AppNav.vue'
import type { Screen } from './components/screens'
import { SCREEN_WORDING } from './components/screens'
import { useTranslator } from './i18n'
import type { GameStatus } from './stores/game'
import { useGameStore } from './stores/game'
import UiButton from './ui/UiButton.vue'
import UiHeading from './ui/UiHeading.vue'
import UiShell from './ui/UiShell.vue'
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

/**
 * INV-22 · D024 — ogni destinazione della colonna ha la sua schermata, e a pretenderlo è il tipo:
 * `Record<Screen, Component>` è **totale**, quindi un nome aggiunto a `SCREENS` non compila finché
 * non ha qualcosa da montare.
 *
 * Fino a D024 la scelta era un `v-if` con un `v-else`, e con due destinazioni funzionava. Con tre
 * avrebbe smesso di funzionare **in silenzio**: il terzo nome sarebbe comparso nella colonna e al
 * clic si sarebbe vista la seconda vista. È la difesa contro A17 messa dove il difetto entrerebbe —
 * non si può elencare un dominio che non esiste, perché non c'è niente da montare quando lo si preme.
 */
const SCREEN_VIEWS: Readonly<Record<Screen, Component>> = {
  home: HomeView,
  stats: StatsView
}

const store = useGameStore()
const { status, failure, failedDuring, awayFor } = storeToRefs(store)
const { text, duration, failure: failureText } = useTranslator()

/**
 * Dove siamo. È un `ref` e non un router: due destinazioni senza indirizzo da condividere non
 * giustificano una dipendenza (ADR 0015), e il giorno in cui ne servirà uno lo dirà una schermata
 * che vuole essere raggiungibile da fuori. I nomi e le parole stanno in `components/screens.ts`,
 * perché li legge anche la colonna.
 */
const screen = ref<Screen>('home')

const retry = (): void => void store.retry()
const startOver = (): void => void store.newGame()
</script>

<template>
  <div class="app" :data-status="status">
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
      <UiShell>
        <template #nav>
          <AppNav :current="screen" @go="screen = $event" />
        </template>
        <template #head>
          <AppHeader :current="screen" />
        </template>

        <UiHeading
          :title="text(SCREEN_WORDING[screen].title)"
          :description="text(SCREEN_WORDING[screen].description)"
        />
        <component :is="SCREEN_VIEWS[screen]" />
      </UiShell>

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
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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
