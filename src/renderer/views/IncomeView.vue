<script setup lang="ts">
import { storeToRefs } from 'pinia'

import IncomeRegimePanel from '@renderer/components/income/IncomeRegimePanel.vue'
import IncomeSourcePanel from '@renderer/components/income/IncomeSourcePanel.vue'
import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiPanel from '@renderer/ui/UiPanel.vue'

/**
 * La pagina del reddito. Da [D044](../../../docs/delega/D044-il-reddito-e-un-elenco-di-fonti.md)
 * disegna **un pannello per fonte**, in ciclo sull'elenco che lo store le consegna, e sotto le due
 * cose che valgono per tutte: il tetto, e il regime.
 *
 * È la pagina che l'[ADR 0033](../../../docs/adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)
 * aveva accettato come caso limite — un dominio con un pulsante solo — e che quell'ADR prometteva
 * sarebbe cresciuta col dominio. È successo: prima due riquadri, adesso un elenco.
 *
 * **Il regime sta qui e non sulla pagina del caveau** perché riguarda il reddito: il caveau ne è la
 * conseguenza, non il soggetto. È la trappola che l'ADR 0033 accetta a occhi aperti — una pagina
 * nasce stretta una volta sola e cresce, mentre un pannello ospitato nella pagina di un altro
 * dominio non se ne va più, e il modo in cui il caveau è finito dentro i contanti è la prova.
 *
 * **Il plateau sì, e quanto entra al secondo no.** Il secondo è già un riquadro del cruscotto, e un
 * numero scritto in due posti è due posti che prima o poi non coincidono. Il plateau invece non sta
 * da nessun'altra parte, ed è la risposta di questo dominio alla domanda «come muore il secondo
 * milione»: senza, la scala finisce e il giocatore lo scopre trovando un pulsante che non c'è più.
 */

const store = useGameStore()
const { incomeSources, incomePlateau, incomeToPlateau } = storeToRefs(store)
const { text, money } = useTranslator()
</script>

<template>
  <IncomeSourcePanel v-for="source in incomeSources" :key="source.id" :source="source" />

  <UiPanel>
    <dl class="facts">
      <div class="fact">
        <dt>{{ text('income.plateau') }}</dt>
        <dd>{{ text('income.per_second', { amount: money(incomePlateau) }) }}</dd>
      </div>
      <div class="fact">
        <dt>{{ text('income.to_plateau') }}</dt>
        <dd>{{ text('income.per_second', { amount: money(incomeToPlateau) }) }}</dd>
      </div>
    </dl>
  </UiPanel>

  <IncomeRegimePanel />
</template>

<style scoped>
.facts {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--text-xs);
}

.fact {
  display: flex;
  justify-content: space-between;
  gap: var(--space-5);
}

dt {
  color: var(--color-ink-3);
}

dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
