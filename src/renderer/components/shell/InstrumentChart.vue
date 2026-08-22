<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import ApexCharts from 'apexcharts'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { Money } from '@core/contracts/money'
import { fromNumber } from '@core/contracts/money'

import type { MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import type { Candle } from '@renderer/runtime/candles'
import { useGameStore } from '@renderer/stores/game'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiTooltip from '@renderer/ui/UiTooltip.vue'

import { candlePointsOf, candleWindowOf, type CandlePoint } from './series'

/**
 * D034 — il grafico di **uno** strumento, e lo stesso componente li disegna tutti e due.
 *
 * Il cruscotto dice com'è adesso, il grafico del patrimonio dice come è andato il totale — e il
 * totale è la cosa meno interessante di questo gioco. La tensione è fra due strumenti che si
 * comportano in modo opposto: i contanti salgono da soli e sbattono contro il tetto del caveau, la
 * carta non si muove finché non decidi tu. Un patrimonio netto che sale liscio nasconde
 * esattamente quella differenza.
 *
 * **Un componente usato due volte, e non due componenti**, che è la decisione presa con l'utente
 * prima di eseguire la delega: la simmetria è ciò che rende confrontabili due strumenti, e una
 * serie piatta accanto a una che oscilla è il modo più diretto di far vedere che sono diversi. Le
 * candele piatte della carta non sono rumore — dicono «qui non è successo niente», e in un gioco
 * sulla tracciabilità è un'informazione.
 *
 * Il resto è la forma di `NetWorthChart.vue`, e le tre ragioni scritte lì valgono qui senza
 * cambiare una parola: la libreria si monta a mano perché l'involucro Vue cancella i formattatori,
 * i colori restano token perché ApexCharts disegna in SVG, e il grafico non porta cifre in pianta
 * stabile perché il tetto dell'ADR 0018 si rispetta nello scopo.
 */

const props = defineProps<{
  /** Il titolo del riquadro. È una chiave, come per `StatTile`: un componente non scrive frasi. */
  readonly title: MessageKey
  /** Le candele **chiuse**. Quella in corso non si disegna: non ha ancora quattro numeri veri. */
  readonly candles: readonly Candle[]
}>()

const store = useGameStore()
const { text, money } = useTranslator()

const points = computed<readonly CandlePoint[]>(() => candlePointsOf(props.candles))

/**
 * La strada di ritorno dal confine di presentazione, e serve **solo** per l'asse: quei numeri li
 * calcola la libreria, e a scriverli in lingua è `money` (ADR 0006). `fromNumber` è una delle due
 * sole conversioni del progetto, e questo è il livello in cui è lecita.
 */
const amountAt = (value: number): string => money(fromNumber(value))

/**
 * Le quattro righe della bolla, con la chiave della loro etichetta.
 *
 * **La bolla è scritta da noi, e non è una preferenza.** Quella che ApexCharts porta per le candele
 * ha `["Open","High","","Low","Close"]` scritto dentro il proprio sorgente: quattro parole in
 * inglese mostrate a un giocatore italiano, che è R12 rotta da una dipendenza invece che da noi. E
 * scriverebbe i numeri come li ha, cioè `948627` invece di 948.627,00 €.
 *
 * Legge le `Candle` invece dei punti già convertiti, quindi in questa bolla non c'è nessun
 * `number`: sono `Decimal` che passano da `money`, che è il formattatore del progetto.
 */
const rowsOf = (candle: Candle): readonly (readonly [MessageKey, Money])[] => [
  ['board.candles.open', candle.open],
  ['board.candles.high', candle.high],
  ['board.candles.low', candle.low],
  ['board.candles.close', candle.close]
]

const bubbleFor =
  (candles: readonly Candle[]) =>
  ({ dataPointIndex }: { readonly dataPointIndex: number }): string => {
    const candle = candles[dataPointIndex]
    if (candle === undefined) return ''

    return rowsOf(candle)
      .map(([label, amount]) => `<b>${text(label)}</b><span>${money(amount)}</span>`)
      .join('')
  }

/**
 * Le opzioni, e la regola che le governa è quella di `NetWorthChart`: **qui dentro entrano solo i
 * colori della serie**, nella forma `var(…)`; assi e bolla si vestono con il CSS in fondo.
 *
 * **Il verde sale, e ciò che non sale è del colore del testo.** È la stessa mappa di
 * `components/ledger/postings.ts` — denaro che entra `gain`, denaro che esce `ink` — e non è una
 * scelta di questo file: il rosso di questo progetto è dei rifiuti e degli allarmi, non del denaro
 * che se ne va (P2). La coincidenza che la rende possibile è che ApexCharts sceglie il colore con
 * `apertura < chiusura`: una candela **piatta** cade quindi sul secondo colore, cioè sull'inchiostro
 * — ed è ciò che serve, perché la carta ne produrrà molte e verdi direbbero che è entrato del
 * denaro che non è entrato.
 */
const optionsFor = (data: readonly CandlePoint[], candles: readonly Candle[]): ApexOptions => ({
  chart: {
    type: 'candlestick',
    height: 140,
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: false },
    background: 'transparent',
    fontFamily: 'inherit',
    parentHeightOffset: 0
  },
  plotOptions: {
    candlestick: {
      colors: { upward: 'var(--color-gain)', downward: 'var(--color-ink)' },
      wick: { useFillColor: true }
    }
  },
  dataLabels: { enabled: false },
  grid: { show: false, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
  series: [
    { name: text(props.title), data: data.map((point) => ({ x: point.x, y: [...point.y] })) }
  ],
  xaxis: {
    type: 'numeric',
    labels: { show: false },
    axisTicks: { show: false },
    axisBorder: { show: false },
    tooltip: { enabled: false },
    crosshairs: { show: false }
  },
  yaxis: {
    ...(data.length === 0 ? {} : candleWindowOf(data)),
    tickAmount: 1,
    labels: { formatter: amountAt }
  },
  tooltip: { custom: bubbleFor(candles) },
  legend: { show: false }
})

const frame = ref<HTMLElement | null>(null)
let chart: ApexCharts | null = null

onMounted(() => {
  const element = frame.value
  if (element === null) return
  chart = new ApexCharts(element, optionsFor(points.value, props.candles))
  void chart.render()
})

/**
 * Una candela nuova sposta **anche** l'asse, non solo le candele: la finestra si adatta alla serie,
 * quindi le due cose cambiano insieme e si passano insieme. E con loro la bolla, che legge le
 * `Candle` di questo aggiornamento — una bolla ferma su una serie vecchia mostrerebbe gli importi
 * di una candela che nel frattempo è scorsa via.
 */
watch(points, (data) => {
  void chart?.updateOptions(optionsFor(data, props.candles))
})

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <UiPanel :title="text(title)">
    <template #actions>
      <UiTooltip
        :text="text('board.candles.explained', { seconds: store.instrumentCandleSeconds })"
        side="bottom"
      >
        <UiLabel>{{ text('board.chart.how_to_read') }}</UiLabel>
      </UiTooltip>
    </template>

    <div ref="frame" class="plot"></div>

    <p class="axis">
      <UiLabel>{{ text('board.chart.oldest') }}</UiLabel>
      <UiLabel>{{ text('board.chart.newest') }}</UiLabel>
    </p>
  </UiPanel>
</template>

<style scoped>
/*
 * Il vestito della libreria, ed è quello di `NetWorthChart` più le quattro righe della bolla. Vale
 * la stessa dichiarazione: `:deep()` tocca classi che non sono nostre, ed è il prezzo dell'ADR 0034.
 * Nessun colore scritto a mano — R15 rifiuterebbe un esadecimale anche qui dentro.
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
  display: grid;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  gap: 0 var(--space-3);
  grid-template-columns: auto auto;
  padding: var(--space-2) var(--space-3);
}

:deep(.apexcharts-tooltip b) {
  color: var(--color-ink-3);
  font-weight: inherit;
}

:deep(.apexcharts-tooltip span) {
  text-align: right;
}

.axis {
  display: flex;
  justify-content: space-between;
  margin: var(--space-2) 0 0;
}
</style>
