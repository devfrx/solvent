<script setup lang="ts">
import VaultPanel from '@renderer/components/vault/VaultPanel.vue'

/**
 * La pagina del caveau — la prima pagina che nasce dall'[ADR 0033](../../../docs/adr/0033-un-dominio-ha-una-cartella-e-una-pagina.md).
 *
 * **Nasce con un pannello solo, e va bene così.** Un dominio prende la sua pagina quando c'è
 * qualcosa da amministrare, non quando ha abbastanza roba da riempirla: la pagina stretta si allarga
 * col dominio, mentre un pannello infilato nella pagina di qualcun altro non torna più indietro da
 * solo. È esattamente ciò che è successo dentro `CashPanel.vue`.
 *
 * Il caveau resta comunque visibile dalla home, ma solo per la cosa che il giocatore deve sapere
 * mentre è là: che il muro è stato toccato. Quel pezzo è `VaultAlarm`, e sta nella **stessa**
 * cartella di questo pannello.
 */
</script>

<template>
  <VaultPanel />
</template>
