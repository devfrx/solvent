<script setup lang="ts">
import type { ApexOptions } from 'apexcharts'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import { fromNumber } from '@core/contracts/money'

import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'

import { useApexChart } from './apex'
import ChartPanel from './ChartPanel.vue'
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
 * **Da questo file sono usciti il guscio e il ciclo di vita**, e non per snellirlo: il riquadro con
 * il suo vestito è `ChartPanel.vue`, il montaggio a mano della libreria è `apex.ts`, e ognuno dei
 * due porta scritta la ragione per cui è uscito. Qui resta ciò che di questo grafico è **solo di
 * questo grafico**: la serie e le sue opzioni.
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
 * che `tests/rules/board-tiles` non sa contare: il tetto si rispetta nello scopo, e da D033 difende
 * il cruscotto da se stesso invece che il bancomat dal cruscotto (ADR 0040). I
 * numeri che ci sono — i due estremi dell'asse e il valore che compare toccando la linea — non
 * sono statistiche in più: sono ciò che rende leggibile un asse che non parte da zero.
 *
 * Per i primi campioni il grafico ha **meno di trenta punti**, e all'avvio non ne ha nessuno: la
 * cadenza è una regola sola e non ha un'eccezione per il primo istante. Riempirlo aspettando
 * sarebbe inventare, che è la correzione 1 di D015.
 *
 * **Da [D034](../../../../docs/delega/D034-le-serie-degli-strumenti.md) è un'area e non delle
 * barre**, e la serie non è cambiata di una riga: sono opzioni della libreria. Le barre venivano
 * dal canvas del design, che su questo punto non è l'autorità — il grafico è nato dopo di lui. Il
 * motivo è che adesso non è più solo: sotto ci sono due grafici a **candele**, uno per strumento,
 * e tre serie di rettangoli affiancate direbbero che le tre cose sono la stessa. Un'area continua
 * dice «questo è l'andamento generale», che è il lavoro che gli resta.
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
 * e nella forma `var(…)`. Tutto il resto — assi e bolla del valore — si veste con il CSS di
 * `ChartPanel.vue`, dove i token sono a casa loro e dove un gate tiene il vestito in un file solo.
 *
 * Le animazioni sono spente: arriva un campione ogni pochi secondi, e un grafico che si riordina da
 * solo mentre il giocatore guarda un'altra cosa è rumore. Il progetto non anima niente altrove.
 *
 * Una serie vuota non ha una finestra e nessuno gliela chiede: senza campioni l'asse resta quello
 * che la libreria sceglie da sé, perché non c'è nessun campione da misurarci contro.
 */
const optionsFor = (data: readonly number[]): ApexOptions => ({
  chart: {
    type: 'area',
    height: 168,
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: false },
    background: 'transparent',
    fontFamily: 'inherit',
    parentHeightOffset: 0
  },
  /**
   * **Dritta, non morbida.** Una curva interpolata disegnerebbe dei patrimoni fra un campione e il
   * successivo: numeri che nessuno ha mai avuto, che è la correzione 1 di D015 con un altro
   * vestito. Fra due campioni non sappiamo cosa è successo — è proprio la ragione per cui gli
   * strumenti hanno le candele e questo no.
   */
  stroke: { curve: 'straight', width: 1.5 },
  /**
   * **Pieno, non sfumato, e il motivo è R15.** Un `type: 'gradient'` è stato provato e tolto: per
   * costruire il primo stop ApexCharts **risolve** il colore e lo scrive nell'SVG come letterale —
   * `stop-color="rgba(21,20,15,0.28)"`, visto nella finestra vera. Un valore cotto non cambia con il
   * tema, e la sola ragione per cui questa libreria è entrata è che non serva ridisegnare niente
   * (ADR 0034). Il riempimento pieno invece resta un token: la libreria lo avvolge in
   * `color-mix(in srgb, var(--color-ink) 18%, transparent)`, che è la stessa forma già misurata a
   * D027 per le barre.
   */
  fill: { type: 'solid', opacity: 0.1 },
  /**
   * Il pallino compare solo passandoci sopra, e nasce con `stroke: #fff` dalla libreria: bianco
   * scritto a mano, che a tema scuro è un anello luminoso attorno a un punto. Senza contorno il
   * problema non esiste, e ciò che resta è un punto del colore della serie.
   */
  markers: { size: 0, strokeWidth: 0 },
  colors: ['var(--color-ink)'],
  dataLabels: { enabled: false },
  /**
   * **Le due righe orizzontali sono accese, quelle verticali no.** Le orizzontali passano per i due
   * estremi dell'asse e sono ciò che li tiene su: senza, i due numeri galleggiavano accanto a un
   * disegno che non li toccava, e una serie piatta lasciava mezzo riquadro vuoto. Le verticali
   * segnerebbero i campioni, e i campioni **non hanno un quando** — è la stessa ragione per cui
   * l'asse orizzontale non si disegna (ADR 0023). Il colore lo dà il CSS di `ChartPanel.vue`.
   */
  grid: {
    show: true,
    xaxis: { lines: { show: false } },
    padding: { top: -14, right: 0, bottom: 0, left: 0 }
  },
  series: [{ name: text('board.chart.title'), data: [...data] }],
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

useApexChart(frame, () => optionsFor(points.value))
</script>

<template>
  <ChartPanel
    title="board.chart.title"
    hint="board.chart.explained"
    :seconds="store.netWorthSampleSeconds"
  >
    <div ref="frame"></div>
  </ChartPanel>
</template>
