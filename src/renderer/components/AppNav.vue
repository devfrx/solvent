<script setup lang="ts">
import { computed } from 'vue'

import type { MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import type { Theme } from '@renderer/ui/theme'
import { useTheme } from '@renderer/ui/theme'
import UiLabel from '@renderer/ui/UiLabel.vue'

import type { Screen } from './screens'
import { SCREEN_WORDING, SCREENS } from './screens'

/**
 * D024 — la colonna: chi siamo in alto, dove si può andare in mezzo, cosa si può regolare in basso.
 *
 * **Nasce piatta**, senza gruppi e senza simboli, e non è una versione ridotta di quella del
 * canvas: è quella che il codice può riempire. Il canvas disegna diciotto domini raccolti in
 * quattro gruppi; qui ce ne sono due, e due voci non fanno due gruppi. I simboli arriveranno col
 * primo dominio che ne porta uno suo — sceglierli adesso vorrebbe dire inventarli.
 *
 * Non decide dove si va: lo dice a chi la monta, e riceve indietro quale destinazione è quella
 * corrente. La lista la legge da `screens.ts`, la stessa che sceglie la vista, quindi una voce che
 * compare qui ha per forza una schermata dietro (INV-22).
 */

defineProps<{ readonly current: Screen }>()

defineEmits<{ go: [Screen] }>()

const { text } = useTranslator()
const { theme, toggle } = useTheme()

/**
 * Un `Record` totale su `Theme`: un tema nuovo non compila finché non ha il suo nome. È lo stesso
 * meccanismo di `SCREEN_WORDING`, applicato a una lista di due.
 */
const THEME_KEYS: Readonly<Record<Theme, MessageKey>> = {
  light: 'app.theme.light',
  dark: 'app.theme.dark'
}

const name = computed<string>(() => text('app.name'))

/**
 * Il marchio è la prima lettera del nome, **derivata** e non scritta: sono due posti in cui
 * l'identità del prodotto comparirebbe, e due posti che nessuno confronta prima o poi non
 * coincidono più (C03, ADR 0008).
 */
const sigil = computed<string>(() => name.value.slice(0, 1))
</script>

<template>
  <div class="brand">
    <span class="sigil" aria-hidden="true">{{ sigil }}</span>
    <span class="wordmark">{{ name }}</span>
  </div>

  <nav class="destinations">
    <button
      v-for="screen of SCREENS"
      :key="screen"
      type="button"
      class="destination"
      :class="{ current: current === screen }"
      @click="$emit('go', screen)"
    >
      {{ text(SCREEN_WORDING[screen].title) }}
    </button>
  </nav>

  <div class="foot">
    <button type="button" class="theme" @click="toggle()">
      <span class="dial" aria-hidden="true"></span>
      <UiLabel>{{ text(THEME_KEYS[theme]) }}</UiLabel>
    </button>
  </div>
</template>

<style scoped>
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6) var(--space-5) var(--space-5);
  border-bottom: 1px solid var(--color-line-soft);
}

.sigil {
  flex: 0 0 auto;
  width: var(--space-7);
  height: var(--space-7);
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-accent);
  color: var(--color-accent-fg);
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
}

.wordmark {
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  letter-spacing: var(--track-wide);
  text-transform: uppercase;
}

.destinations {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4) var(--space-3);
}

.destination {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  background: transparent;
  color: var(--color-ink-3);
  font-family: inherit;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

/*
 * A dire quale voce è scelta è anche il **bordo**, non solo il fondo. È la correzione che D023 ha
 * trovato guardando: nel tema scuro `--color-raised` contro `--color-surface` sono due punti di
 * luminosità, e la differenza che nel chiaro si vede da sola lì sparisce.
 */
.destination.current {
  background: var(--color-raised);
  color: var(--color-ink);
  border-color: var(--color-line);
}

.foot {
  border-top: 1px solid var(--color-line-soft);
  padding: var(--space-4) var(--space-3);
}

.theme {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.theme:hover {
  border-color: var(--color-line);
}

/* Mezzo cerchio pieno: il segno consueto del tema, e non costa un file di icone. */
.dial {
  flex: 0 0 auto;
  width: var(--space-4);
  height: var(--space-4);
  border: 1px solid var(--color-ink-3);
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, var(--color-ink-3) 50%, transparent 50%);
}
</style>
