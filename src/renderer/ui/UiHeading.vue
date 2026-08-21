<script setup lang="ts">
import UiText from './UiText.vue'

/**
 * D024 — l'apertura di una schermata: come si chiama, e a cosa serve.
 *
 * Nel canvas ogni schermata comincia così, e la frase sotto il titolo non è decorazione: è l'unico
 * posto in cui il gioco può dire cosa aspettarsi da una schermata senza rubare spazio a ciò che la
 * schermata mostra.
 *
 * Il titolo è un `h1` e ce n'è **uno per schermata**, che è ciò che un `h1` significa. Le due
 * stringhe arrivano già tradotte (R14).
 */

defineProps<{ readonly title: string; readonly description: string }>()
</script>

<template>
  <header class="ui-heading">
    <h1 class="title">{{ title }}</h1>
    <UiText class="description">{{ description }}</UiText>
  </header>
</template>

<style scoped>
.title {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--track-tight);
}

/*
 * La misura in caratteri e non in pixel: la riga si spezza dove l'occhio la ritrova, e resta la
 * stessa in italiano e in inglese — che con due lingue di lunghezza diversa è tutto il punto.
 */
.description {
  margin-top: var(--space-2);
  max-width: 56ch;
}
</style>
