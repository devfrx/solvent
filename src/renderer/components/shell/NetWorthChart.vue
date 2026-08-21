<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import ApexCharts from 'apexcharts'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { fromNumber } from '@core/contracts/money'

import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiTooltip from '@renderer/ui/UiTooltip.vue'

import { pointsOf, windowOf } from './series'

/**
 * D027 — il grafico del cruscotto: come è andata, e non solo com'è adesso.
 *
 * Sta in `shell/` e non in una cartella di dominio perché il cruscotto **non è di nessun dominio**
 * — è l'unico pezzo di interfaccia del progetto che sta lì per quella ragione, ed è ciò che
 * l'[ADR 0033](../../../../docs/adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md) ha stabilito.
 * La lista chiusa delle cartelle non-dominio non si è dovuta allungare: `shell/` è già dichiarata
 * come «ciò che è dell'applicazione e di nessuno», e il riquadro del cruscotto ci abitava già.
 *
 * Il disegno è di ApexCharts
 * ([ADR 0034](../../../../docs/adr/0034-il-grafico-e-una-libreria.md)). Quello che resta a noi sono
 * i due estremi dell'asse, che vivono in `series.ts` e si provano senza montare niente (R05).
 *
 * **La libreria si monta a mano, senza l'involucro `vue3-apexcharts`, e non è preferenza.** Quel
 * pacchetto clona le opzioni con `JSON.parse(JSON.stringify(…))` a ogni aggiornamento, e
 * `JSON.stringify` **cancella le funzioni**: i formattatori sparivano e l'asse scriveva `948627.0`
 * invece di 948.627,00 €. Visto succedere nella finestra vera, poi confermato leggendo il suo
 * sorgente. Montarla da qui costa una ventina di righe di ciclo di vita e toglie una dipendenza.
 *
 * **I colori restano nostri**, ed è la ragione per cui la scelta è caduta su questa libreria e non
 * su una a `<canvas>`: ApexCharts disegna in SVG, quindi `var(--color-ink)` finisce dentro un
 * attributo `fill` e lo risolve il browser. Cambiare tema non richiede di ridisegnare niente, e R15
 * non si tocca. Verificato nella finestra vera: il `fill` reso è
 * `color-mix(in srgb, var(--color-ink) 85%, transparent)`, e `color-mix` è esattamente ciò che R15
 * vuole al posto di un colore ricopiato.
 *
 * **Il grafico non porta cifre in pianta stabile.** Il patrimonio netto ha già il suo riquadro qui
 * sopra, e un grafico con una cifra grande e un delta sarebbe il settimo riquadro con un vestito
 * che `tests/rules/home-tiles` non sa contare: il tetto dell'ADR 0018 si rispetta nello scopo. I
 * numeri che ci sono — i due estremi dell'asse e il valore che compare toccando una barra — non
 * sono statistiche in più: sono ciò che rende leggibile un asse che non parte da zero.
 *
 * Per i primi campioni il grafico ha **meno barre di trenta**, e all'avvio non ne ha nessuna: la
 * cadenza è una regola sola e non ha un'eccezione per il primo istante. Riempirlo aspettando
 * sarebbe inventare, che è la correzione 1 di D015.
 */

const store = useGameStore()
const { netWorthSeries } = storeToRefs(store)
const { text, money } = useTranslator()

const points = computed<readonly number[]>(() => pointsOf(netWorthSeries.value.items))

/**
 * La strada di ritorno dal confine di presentazione: la libreria ragiona in `number` — l'asse e la
 * bolla del valore li calcola lei — e a scrivere un importo in lingua è solo `money` (ADR 0006).
 * `fromNumber` è una delle due sole conversioni del progetto, e questo è il livello in cui è
 * lecita: dopo il Ledger, mai prima.
 */
const amountAt = (value: number): string => money(fromNumber(value))

/**
 * Le opzioni, e la regola che le governa: **qui dentro entra un colore solo**, quello della serie,
 * e nella forma `var(…)`. Tutto il resto — assi e bolla del valore — si veste con il CSS in fondo a
 * questo file, dove i token sono a casa loro.
 *
 * Le animazioni sono spente: arriva un campione ogni pochi secondi, e un grafico che si riordina da
 * solo mentre il giocatore guarda un'altra cosa è rumore. Il progetto non anima niente altrove.
 *
 * Una serie vuota non ha una finestra e nessuno gliela chiede: senza campioni l'asse resta quello
 * che la libreria sceglie da sé, perché non c'è nessuna barra da misurarci contro.
 */
const optionsFor = (data: readonly number[]): ApexOptions => ({
  chart: {
    type: 'bar',
    height: 140,
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: false },
    background: 'transparent',
    fontFamily: 'inherit',
    parentHeightOffset: 0
  },
  plotOptions: { bar: { columnWidth: '78%', borderRadius: 2, borderRadiusApplication: 'end' } },
  colors: ['var(--color-ink)'],
  dataLabels: { enabled: false },
  grid: { show: false, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
  series: [{ name: text('home.chart.title'), data: [...data] }],
  xaxis: {
    labels: { show: false },
    axisTicks: { show: false },
    axisBorder: { show: false },
    tooltip: { enabled: false }
  },
  yaxis: {
    ...(data.length === 0 ? {} : windowOf(data)),
    tickAmount: 1,
    labels: { formatter: amountAt }
  },
  tooltip: { x: { show: false }, y: { formatter: amountAt } },
  legend: { show: false }
})

const frame = ref<HTMLElement | null>(null)
let chart: ApexCharts | null = null

onMounted(() => {
  const element = frame.value
  if (element === null) return
  chart = new ApexCharts(element, optionsFor(points.value))
  void chart.render()
})

/**
 * Un campione nuovo sposta **anche** l'asse, non solo le barre: la finestra si adatta alla serie,
 * quindi le due cose cambiano insieme e si passano insieme. Aggiornare le sole serie lascerebbe
 * l'asse su un intervallo vecchio, cioè barre alte in modo sbagliato.
 */
watch(points, (data) => {
  void chart?.updateOptions(optionsFor(data))
})

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <UiPanel :title="text('home.chart.title')">
    <template #actions>
      <UiTooltip
        :text="text('home.chart.explained', { seconds: store.netWorthSampleSeconds })"
        side="bottom"
      >
        <UiLabel>{{ text('home.chart.how_to_read') }}</UiLabel>
      </UiTooltip>
    </template>

    <div ref="frame" class="plot"></div>

    <p class="axis">
      <UiLabel>{{ text('home.chart.oldest') }}</UiLabel>
      <UiLabel>{{ text('home.chart.newest') }}</UiLabel>
    </p>
  </UiPanel>
</template>

<style scoped>
/*
 * Il vestito della libreria, ed è tutto qui: ApexCharts porta il proprio foglio di stile con i
 * propri colori — le etichette dell'asse nascono con un `fill` esadecimale scritto dentro — e
 * questo blocco lo riporta nei token. Una proprietà CSS batte un attributo di presentazione, quindi
 * l'override vince; è anche il prezzo dichiarato dell'ADR 0034, perché `:deep()` tocca classi che
 * non sono nostre e un aggiornamento della libreria può spostarle. Nessun colore scritto a mano:
 * R15 rifiuterebbe un esadecimale anche qui dentro.
 */
.plot {
  min-height: 140px;
}

:deep(.apexcharts-yaxis text),
:deep(.apexcharts-xaxis text) {
  font-family: var(--font-mono);
  font-size: var(--text-micro);
  letter-spacing: var(--track-label);
  fill: var(--color-ink-3);
}

:deep(.apexcharts-tooltip) {
  background: var(--color-raised);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  color: var(--color-ink-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

:deep(.apexcharts-tooltip-series-group) {
  background: transparent;
  padding: var(--space-2) var(--space-3);
}

.axis {
  display: flex;
  justify-content: space-between;
  margin: var(--space-2) 0 0;
}
</style>
