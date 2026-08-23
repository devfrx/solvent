<script setup lang="ts">
import { computed } from 'vue'

import type { MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import type { Theme } from '@renderer/ui/theme'
import { useTheme } from '@renderer/ui/theme'
import UiButton from '@renderer/ui/UiButton.vue'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiScroll from '@renderer/ui/UiScroll.vue'

import type { Screen } from './screens'
import { NAV_GROUPS, SCREEN_WORDING } from './screens'

/**
 * D024 — la colonna: chi siamo in alto, dove si può andare in mezzo, cosa si può regolare in basso.
 *
 * **Nasce piatta**, senza gruppi e senza simboli, e non è una versione ridotta di quella del
 * canvas: è quella che il codice può riempire. I simboli arriveranno col primo dominio che ne porta
 * uno suo — sceglierli adesso vorrebbe dire inventarli.
 *
 * D026 le ha dato i **gruppi**, e il grilletto del registro YAGNI era esattamente questo: la terza
 * destinazione. Con l'ADR 0033 sono quattro, divise fra i posti in cui si fa qualcosa e quelli in
 * cui si guarda ciò che è successo. I gruppi non sono una gerarchia di indirizzi — le voci restano
 * tutte allo stesso livello — quindi non fanno scattare il grilletto del router.
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

  <UiScroll class="destinations">
    <nav class="groups">
      <div v-for="group of NAV_GROUPS" :key="group.title" class="group">
        <p class="group-title">
          <UiLabel>{{ text(group.title) }}</UiLabel>
        </p>
        <UiButton
          v-for="screen of group.screens"
          :key="screen"
          variant="bare"
          size="sm"
          :selected="current === screen"
          :label="text(SCREEN_WORDING[screen].title)"
          @press="$emit('go', screen)"
        />
      </div>
    </nav>
  </UiScroll>

  <div class="foot">
    <UiButton
      variant="bare"
      size="sm"
      icon="theme"
      :label="text(THEME_KEYS[theme])"
      @press="toggle()"
    />
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

/*
 * L'area che scorre è **la lista**, e non la colonna intera: il marchio in alto e l'interruttore
 * in basso restano dove sono. Prima di [D038](../../../../docs/delega/D038-cio-che-si-preme-e-cio-che-scorre.md)
 * non era così, e non per scelta — a questa riga mancava il `min-height: 0` senza cui un elemento
 * flessibile non scende sotto la propria altezza naturale, quindi la lista spingeva e a scorrere
 * finiva la colonna del telaio, marchio compreso. Adesso la riga la scrive `UiScroll`, e non c'è
 * più un posto dove dimenticarla.
 */
.destinations {
  flex: 1;
}

.groups {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-4) var(--space-3);
}

.group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.group-title {
  margin: 0 0 var(--space-1);
  padding: 0 var(--space-4);
}

/*
 * Le voci e l'interruttore non hanno più uno stile qui, e sono **quaranta righe in meno**: la
 * forma di una riga premibile — il fondo, il bordo che compare al puntatore, quello che dice qual
 * è quella accesa, l'anello del fuoco che non c'era — è di `UiButton` (R26). Questo file dice
 * quali voci ci sono e dove stanno, che è quello che sa.
 *
 * Il mezzo cerchio disegnato con un gradiente non c'è più: al suo posto c'è l'icona `theme`, che
 * viene dall'insieme dichiarato in `ui/icons.ts` (R28). Portava scritto «non costa un file di
 * icone», ed era vero finché il file di icone non c'era.
 */
.foot {
  border-top: 1px solid var(--color-line-soft);
  padding: var(--space-4) var(--space-3);
}
</style>
