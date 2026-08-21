<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useTranslator } from '@renderer/i18n'
import { useGameStore } from '@renderer/stores/game'
import UiText from '@renderer/ui/UiText.vue'

/**
 * Il caveau visto dalla home, ed è la clausola dell'[ADR 0033](../../../../docs/adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md)
 * che si guadagna il posto: **un pezzo di un dominio può comparire fuori dalla sua pagina, ma esce
 * dalla sua cartella.**
 *
 * Senza questo file ci sarebbero due strade, e sono le due che l'ADR esclude. Mettere l'allarme
 * dentro `CashPanel.vue` rifarebbe il difetto che [D026](../../../../docs/delega/D026-dove-si-attacca-un-dominio.md)
 * è nata per chiudere — l'interfaccia del caveau dentro un file del bancomat. Lasciarlo solo sulla
 * pagina del caveau lo renderebbe invisibile: il giocatore scopre il muro **mentre gioca alla
 * home**, non mentre amministra il caveau.
 *
 * Non disegna un riquadro: è un avviso, e un avviso sta attaccato a ciò che commenta. Quando non
 * c'è niente da dire non rende niente, e non lascia nemmeno lo spazio.
 */

const { vaultIsFull, incomeWithheld } = storeToRefs(useGameStore())
const { text, money } = useTranslator()
</script>

<template>
  <p v-if="vaultIsFull" class="alarm">
    <UiText tone="loss" size="xs">{{ text('vault.full') }}</UiText>
  </p>
  <p v-else-if="!incomeWithheld.isZero()" class="alarm">
    <UiText tone="loss" size="xs">
      {{ text('vault.withholding', { amount: money(incomeWithheld) }) }}
    </UiText>
  </p>
</template>

<style scoped>
/* Un filo rosso a sinistra invece di un riquadro: dice «guarda qui» senza pesare come un pannello. */
.alarm {
  margin: calc(var(--space-1) * -1) 0 0;
  padding: var(--space-3) var(--space-4);
  border-left: 2px solid var(--color-loss);
  background: var(--color-sunken);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
</style>
