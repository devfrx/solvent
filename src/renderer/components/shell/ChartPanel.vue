<script setup lang="ts">
import type { MessageKey } from '@renderer/i18n'
import { useTranslator } from '@renderer/i18n'
import UiLabel from '@renderer/ui/UiLabel.vue'
import UiPanel from '@renderer/ui/UiPanel.vue'
import UiTooltip from '@renderer/ui/UiTooltip.vue'

/**
 * Il riquadro di un grafico: il titolo, la spiegazione, i due capi dell'asse del tempo, e il
 * vestito che riporta nei token ciò che la libreria disegna da sé.
 *
 * **Perché esiste.** La regola scritta di [D023](../../../../docs/delega/D023-il-design-system.md)
 * è che un pezzo entra quando lo disegnano **due** componenti, e da
 * [D034](../../../../docs/delega/D034-le-serie-degli-strumenti.md) i componenti-grafico sono due.
 * Non entra nel kit — R14 gliela chiude, perché qui si traducono delle chiavi — quindi entra dove
 * `StatTile` è già entrato per la stessa ragione: `components/shell/`, ciò che è
 * dell'applicazione e di nessun dominio ([ADR 0033](../../../../docs/adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)).
 *
 * **Il blocco che conta è quello in fondo, non il template.** Il vestito bersaglia classi che
 * **non sono nostre**: le porta la libreria, e un suo aggiornamento può spostarle
 * ([ADR 0034](../../../../docs/adr/0034-il-grafico-e-una-libreria.md) lo dichiara fra i propri
 * prezzi). Finché ne esistevano due copie nessun gate poteva vederle divergere — R15 le lasciava
 * passare entrambe, perché entrambe usavano i token — ed è la forma esatta del difetto che
 * l'audit di [D016](../../../../docs/delega/D016-correzioni-audit.md) trovò mesi dopo con
 * `.refusal`. Le due copie **avevano già cominciato**: la bolla del secondo grafico era diventata
 * una griglia e la prima no. Adesso il vestito vive qui, in un file solo, ed è **R23** a tenerlo
 * qui.
 *
 * **Riceve cosa mettere dentro, mai come disporlo.** Il punto di innesto del grafico arriva per
 * slot e non per proprietà: la disposizione — riquadro, testata, area, piede — è scritta in questo
 * file, che è ciò che secondo l'[ADR 0030](../../../../docs/adr/0030-il-telaio-e-una-forma-non-un-contenitore.md)
 * distingue una forma da un contenitore. Le opzioni della libreria restano nei due grafici, dove
 * sono davvero diverse, e il ciclo di vita sta in `apex.ts`.
 */

defineProps<{
  /** Una chiave, come per `StatTile`: un componente non scrive frasi. */
  readonly title: MessageKey
  /** Come si legge il grafico. Obbligatoria: un asse che non parte da zero va spiegato. */
  readonly hint: MessageKey
  /**
   * La cadenza del grafico, in secondi. È l'unico segnaposto che i suggerimenti di questa famiglia
   * portano, ed è ciò che un campione o una candela **sono**: quanto tempo copre ciascuno.
   */
  readonly seconds: number
}>()

const { text } = useTranslator()
</script>

<template>
  <UiPanel :title="text(title)">
    <template #actions>
      <UiTooltip :text="text(hint, { seconds })" side="bottom">
        <UiLabel>{{ text('board.chart.how_to_read') }}</UiLabel>
      </UiTooltip>
    </template>

    <div class="plot"><slot /></div>

    <p class="axis">
      <UiLabel>{{ text('board.chart.oldest') }}</UiLabel>
      <UiLabel>{{ text('board.chart.newest') }}</UiLabel>
    </p>
  </UiPanel>
</template>

<style scoped>
/*
 * Il vestito della libreria, e l'unico posto del progetto in cui esiste (R23). ApexCharts porta il
 * proprio foglio di stile con i propri colori — le etichette dell'asse nascono con un `fill`
 * esadecimale scritto dentro — e questo blocco lo riporta nei token. Una proprietà CSS batte un
 * attributo di presentazione, quindi l'override vince. Nessun colore scritto a mano: R15
 * rifiuterebbe un esadecimale anche qui dentro.
 *
 * `:deep()` arriva a contenuto che entra per **slot** perché la radice di questo componente porta
 * il suo identificatore di ambito, e il grafico nasce lì sotto. Verificato nella finestra vera,
 * non dedotto.
 *
 * Qui c'è la **cornice** della bolla e non la sua disposizione: quella dipende da cosa la bolla
 * dice, ed è del grafico che la scrive.
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

/* La bolla che la libreria costruisce da sé, quando nessuno gliene passa una scritta a mano. */
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
