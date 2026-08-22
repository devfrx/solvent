<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { computed, ref } from 'vue'

import type { Money } from '@core/contracts/money'
import { fromNumber } from '@core/contracts/money'

import type { MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import type { Candle } from '@renderer/runtime/candles'
import { useGameStore } from '@renderer/stores/game'

import { useApexChart } from './apex'
import ChartPanel from './ChartPanel.vue'
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
 * stabile perché il tetto dell'ADR 0018 si rispetta nello scopo. Il guscio è `ChartPanel.vue` e il
 * montaggio è `apex.ts`: quello che resta qui è la serie, le opzioni e la bolla.
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

/**
 * **L'involucro porta una classe nostra**, e non è cosmesi: è ciò che permette a R23 di esistere
 * come regola esatta invece che come test parziale. La bolla scritta a mano entra dentro l'elemento
 * della libreria, quindi vestirla vorrebbe dire nominare una classe della libreria una seconda
 * volta, fuori da `ChartPanel.vue`. Con una classe nostra il confine resta netto: la **cornice**
 * della bolla è del riquadro, la sua **disposizione** è di chi la scrive.
 */
const bubbleFor =
  (candles: readonly Candle[]) =>
  ({ dataPointIndex }: { readonly dataPointIndex: number }): string => {
    const candle = candles[dataPointIndex]
    if (candle === undefined) return ''

    const rows = rowsOf(candle)
      .map(([label, amount]) => `<b>${text(label)}</b><span>${money(amount)}</span>`)
      .join('')

    return `<div class="candle-bubble">${rows}</div>`
  }

/**
 * Le opzioni, e la regola che le governa è quella di `NetWorthChart`: **qui dentro entrano solo i
 * colori della serie**, nella forma `var(…)`; assi e cornice della bolla si vestono nel CSS di
 * `ChartPanel.vue`.
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

useApexChart(frame, () => optionsFor(points.value, props.candles))
</script>

<template>
  <ChartPanel
    :title="title"
    hint="board.candles.explained"
    :seconds="store.instrumentCandleSeconds"
  >
    <div ref="frame"></div>
  </ChartPanel>
</template>

<style scoped>
/*
 * La disposizione della bolla a candele: quattro etichette e quattro importi in due colonne. La
 * cornice — fondo, bordo, raggio, ombra, caratteri — è di `ChartPanel.vue`, e quella non si tocca
 * da qui.
 *
 * Serve `:deep()` perché questo blocco di HTML lo costruisce la libreria a runtime, quindi non
 * porta l'identificatore di ambito che il compilatore mette sul resto del template. La classe però
 * è nostra, ed è la differenza che tiene R23 vera.
 */
:deep(.candle-bubble) {
  display: grid;
  gap: 0 var(--space-3);
  grid-template-columns: auto auto;
  padding: var(--space-2) var(--space-3);
}

:deep(.candle-bubble b) {
  color: var(--color-ink-3);
  font-weight: inherit;
}

:deep(.candle-bubble span) {
  text-align: right;
}
</style>
