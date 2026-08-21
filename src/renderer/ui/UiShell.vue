<script setup lang="ts">
/**
 * D024 · ADR 0030 — il telaio. Tre regioni, sempre quelle tre: la colonna a sinistra, la testata
 * appiccicata, il contenuto che scorre.
 *
 * **Non ha proprietà, e non può averne** di geometria: è ciò che lo distingue dal contenitore
 * generico che l'ADR 0028 ha scartato. `UiRow` cresce perché chi lo chiama decide ogni volta lo
 * spazio, la direzione e l'allineamento; qui non c'è niente da decidere, perché non c'è niente che
 * vari. R16 lo impone, e `tests/rules/ui-kit-has-no-geometry` la verifica.
 *
 * **Nessun `z-index`, e non è una dimenticanza.** La testata è posizionata e il contenuto no,
 * quindi la testata dipinge dopo per la regola di impilamento del CSS, senza che nessuno debba
 * inventare un numero. Il giorno in cui un discendente del contenuto si posiziona e passa **sopra**
 * la testata, la risposta non è un `z-index` qui: è il livello superiore (ADR 0032), che è dove
 * stanno le cose che coprono il resto.
 */
</script>

<template>
  <div class="ui-shell">
    <aside class="nav"><slot name="nav" /></aside>
    <main class="main">
      <header class="head"><slot name="head" /></header>
      <div class="content"><slot /></div>
    </main>
  </div>
</template>

<style scoped>
.ui-shell {
  display: flex;
  align-items: flex-start;
  min-height: 100vh;
}

.nav {
  flex: 0 0 var(--nav-width);
  width: var(--nav-width);
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-line);
}

/* `min-width: 0` o una riga lunga dentro il contenuto allarga la colonna invece di andare a capo. */
.main {
  flex: 1;
  min-width: 0;
}

.head {
  position: sticky;
  top: 0;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-line);
}

/*
 * Il fondo è più largo degli altri tre: è l'aria sotto l'ultimo pannello, quella che dice che la
 * pagina è finita. Nel canvas sono sessanta pixel, cioè due passi e mezzo del settimo.
 */
.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6) var(--space-7) calc(var(--space-7) * 2.5);
}
</style>
