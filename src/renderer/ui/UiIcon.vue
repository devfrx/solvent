<script setup lang="ts">
import sheet from './glyphs.json'
import type { IconName } from './icons'

/**
 * D038 · ADR 0046 — il glifo, e l'**unico** modo di farne uno: R28 tiene i tracciati in un file
 * solo, e quel file è generato da `icons.ts`.
 *
 * **Non sceglie niente e non sa niente.** Riceve un nome dichiarato nel kit, pesca il tracciato e
 * lo disegna. Quale icona vada su quale pulsante lo decide chi disegna il pulsante; da quale
 * insieme venga il disegno lo decide `ICON_SET`, in una riga.
 *
 * **Non ha una proprietà di misura**, e non è una mancanza (R16): l'icona è alta `1em`, quindi
 * prende la misura del testo che la ospita. Un pulsante piccolo la riceve piccola senza che nessuno
 * passi un numero, ed è la ragione per cui le quattro misure di `UiButton` non hanno dovuto
 * dichiararne quattro anche qui. Una proprietà `size` sarebbe la prima delle dodici che
 * l'[ADR 0028](../../../docs/adr/0028-il-kit-ui-non-sa-che-gioco-e.md) descrive.
 *
 * **E non ha un colore.** I corpi dell'insieme dipingono con `currentColor`, quindi l'icona prende
 * l'inchiostro di chi la ospita e cambia da sola con il tema e con la variante del pulsante. È la
 * stessa proprietà per cui l'[ADR 0034](../../../docs/adr/0034-il-grafico-e-una-libreria.md) ha
 * preteso una libreria che rende in SVG, e a tenerla è R28: un corpo con un colore proprio non
 * entra nel file generato.
 *
 * ## Perché `v-html`, e perché non è la scorciatoia che sembra
 *
 * Un tracciato SVG arriva come testo, e metterlo in pagina vuol dire questa direttiva o niente. Qui
 * il testo non viene da nessuno se non da noi: `glyphs.json` è generato da una tabella scritta a
 * mano, versionato, leggibile nel diff, e non contiene una riga che venga da una partita o da un
 * giocatore. La strada senza direttiva — una funzione di rendering che scrive `innerHTML` — sarebbe
 * lo stesso identico codice messo dove il lint non lo riconosce, cioè l'aggiramento che le
 * [convenzioni](../../../docs/convenzioni.md) dichiarano peggiore del divieto.
 *
 * **È decorativa, sempre.** `aria-hidden` non è prudenza: l'icona sta accanto a una parola che dice
 * già cosa fa — l'etichetta di `UiButton`, o l'`aria-label` di chi la usa da sola — e leggerla due
 * volte è il difetto che un'icona con un nome accessibile produce ogni volta. Il giorno in cui una
 * comparisse senza nessuna parola vicina, la parola va aggiunta lì, non qui.
 */

defineProps<{ readonly name: IconName }>()
</script>

<template>
  <!-- eslint-disable vue/no-v-html -- corpo generato da noi e versionato (R28): vedi sopra -->
  <svg
    class="ui-icon"
    :viewBox="sheet.glyphs[name].viewBox"
    aria-hidden="true"
    focusable="false"
    v-html="sheet.glyphs[name].body"
  ></svg>
  <!-- eslint-enable vue/no-v-html -->
  <!--
    La forma a blocco e non `-next-line`, e la ragione è meccanica: la riga dopo è quella che apre il
    tag, mentre la direttiva viene segnalata dove sta l'attributo — sei righe più giù, perché il tag
    non ci sta in una riga sola. Un `-next-line` qui sarebbe una riga che non spegne niente, cioè un
    permesso che sembra dato e non lo è.
  -->
</template>

<style scoped>
/*
 * `1em` su tutte e due le misure: l'icona è alta quanto una riga di testo di chi la ospita, e il
 * `viewBox` fa il resto. `display: block` toglie lo spazio di linea di base che un elemento in
 * riga si porta dietro — dentro un pulsante allineato al centro quello spazio si vede, e si
 * corregge con un `vertical-align` che nessuno sa più spiegare.
 *
 * `flex: 0 0 auto` perché il posto naturale di un'icona è dentro una riga flessibile: senza,
 * un'etichetta lunga la schiaccerebbe.
 */
.ui-icon {
  display: block;
  flex: 0 0 auto;
  width: 1em;
  height: 1em;
}
</style>
