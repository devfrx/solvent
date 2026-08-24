<script setup lang="ts">
import IncomePanel from '@renderer/components/income/IncomePanel.vue'
import IncomeRegimePanel from '@renderer/components/income/IncomeRegimePanel.vue'

/**
 * La pagina del reddito, e da D043 sono **due**: cosa si compra per guadagnare di più, e sotto
 * quale regime lo si guadagna (ADR 0052). Il secondo è la decisione più grossa che questa pagina
 * ospiti — dove atterrano i soldi, e se lasciano una traccia — e sta qui e non sulla pagina del
 * caveau perché riguarda il reddito: il caveau ne è la conseguenza, non il soggetto.
 *
 * Lo dice apertamente perché è la trappola che l'[ADR 0033](../../../docs/adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)
 * accetta a occhi aperti: una pagina nasce stretta una volta sola e cresce col dominio, mentre un
 * pannello ospitato nella pagina di un altro dominio non se ne va più — e il modo in cui il caveau
 * è finito dentro i contanti è la prova.
 *
 * Quanto entra al secondo **non si ripete qui**: è già un riquadro del cruscotto, e un numero
 * scritto in due posti è due posti che prima o poi non coincidono. Questa pagina porta ciò che sul
 * cruscotto non può stare — le cose che si **fanno** al reddito.
 */
</script>

<template>
  <IncomePanel />
  <IncomeRegimePanel />
</template>
