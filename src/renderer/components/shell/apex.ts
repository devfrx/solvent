import type { ApexOptions } from 'apexcharts'
import ApexCharts from 'apexcharts'
import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted, watch } from 'vue'

/**
 * Il ciclo di vita di una libreria montata a mano, e l'unico posto del renderer che ne ha uno.
 *
 * **Esiste perché l'[ADR 0034](../../../../docs/adr/0034-il-grafico-e-una-libreria.md) lo aveva
 * già promesso**, e la promessa è scritta fra le sue conseguenze: «se un secondo grafico nascesse,
 * quelle venti righe sono ciò che si estrae». Il secondo grafico è nato con
 * [D034](../../../../docs/delega/D034-le-serie-degli-strumenti.md), quindi il grilletto non è stato
 * interpretato: è stato riscosso.
 *
 * **Una funzione e non un componente**, e la differenza non è di forma. Un componente che ricevesse
 * `ApexOptions` per proprietà sarebbe un **contenitore** secondo il criterio verificabile
 * dell'[ADR 0030](../../../../docs/adr/0030-il-telaio-e-una-forma-non-un-contenitore.md) — «se puoi
 * cambiarne la disposizione passandogli una proprietà» — perché dentro quell'oggetto c'è
 * `height`. Sarebbe anche `vue3-apexcharts` riscritto in casa, che l'ADR 0034 elenca fra le
 * alternative provate e disfatte. Qui invece chi chiama continua a dire, nel proprio sorgente, che
 * monta una libreria a mano: è il prezzo dichiarato, pagato una volta invece che due.
 *
 * Le opzioni arrivano come **getter** e non come `Ref`: `watch` lo traccia da sé, e chi chiama non
 * deve costruire un `computed` per poi passarlo. Ne discende una correzione rispetto a com'erano i
 * due grafici prima: guardavano i **punti**, quindi un'opzione che cambia senza che la serie cambi
 * — il nome della serie, che passa da `text()` — restava quella del montaggio.
 */
export const useApexChart = (host: Ref<HTMLElement | null>, options: () => ApexOptions): void => {
  let chart: ApexCharts | null = null

  onMounted(() => {
    const element = host.value
    if (element === null) return

    chart = new ApexCharts(element, options())
    void chart.render()
  })

  watch(options, (next) => {
    void chart?.updateOptions(next)
  })

  onBeforeUnmount(() => {
    chart?.destroy()
    chart = null
  })
}
