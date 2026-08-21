<script setup lang="ts">
/**
 * D024 · ADR 0030 · ADR 0037 — il telaio. Tre regioni, sempre quelle tre: la colonna a sinistra,
 * la testata ferma, il contenuto che scorre — ed è **l'unica** delle tre che scorre.
 *
 * **Non ha proprietà, e non può averne** di geometria: è ciò che lo distingue dal contenitore
 * generico che l'ADR 0028 ha scartato. `UiRow` cresce perché chi lo chiama decide ogni volta lo
 * spazio, la direzione e l'allineamento; qui non c'è niente da decidere, perché non c'è niente che
 * vari. R16 lo impone, e `tests/rules/ui-kit-has-no-geometry` la verifica.
 *
 * **Nessun `z-index`, e non è una dimenticanza** — da D030 è anche una regola con un test, **R21**.
 * Qui non serve perché il telaio **non scorre**: è alto quanto la finestra, la colonna e la testata
 * stanno ferme, e a scorrere è il solo contenuto, dentro la propria area.
 *
 * Il giorno prima era diverso, e vale la pena saperlo perché la trappola è comune. Scorreva la
 * pagina intera e la testata restava su con `position: sticky`: funziona finché nel contenuto non
 * compare qualcosa che si crea un livello di disegno proprio — una `perspective`, una `transform`,
 * un filtro. La carta 3D del bancomat ne ha una, e siccome viene **dopo** la testata nel documento
 * le passava sopra allo scorrere. La risposta consueta a quel punto è un `z-index` sulla testata,
 * cioè il primo numero di una scala che nessuno saprà più spiegare (ADR 0032). La risposta vera è
 * che in un'applicazione da scrivania il telaio non è ciò che scorre: un contenuto che scorre
 * dentro la propria area **non può** raggiungere la testata, perché il bordo lo taglia prima.
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
/*
 * `height` e non `min-height`: il telaio è alto quanto la finestra e non cresce col contenuto. È la
 * riga da cui discende tutto il resto — senza, `overflow` sul contenuto non avrebbe un fondo contro
 * cui misurarsi e il contenuto tornerebbe a spingere la pagina.
 */
.ui-shell {
  display: flex;
  align-items: stretch;
  height: 100vh;
  overflow: hidden;
}

/*
 * `overflow-y: auto` e non `hidden`: le destinazioni sono quattro e ci stanno, ma il giorno in cui
 * fossero venti la colonna le taglierebbe **in silenzio** — ed è la forma di difetto che nasce
 * funzionante e si rompe mesi dopo, senza che nessuno l'abbia toccata.
 */
.nav {
  flex: 0 0 var(--nav-width);
  width: var(--nav-width);
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-line);
}

/* `min-width: 0` o una riga lunga dentro il contenuto allarga la colonna invece di andare a capo. */
.main {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Non più `sticky`: non ha niente da cui restare indietro, perché sotto di lei non scorre la pagina. */
.head {
  flex: 0 0 auto;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-line);
}

/*
 * L'area che scorre, ed è l'unica del telaio.
 *
 * `min-height: 0` è la riga che sembra superflua e non lo è: un elemento flessibile non scende
 * sotto la propria dimensione naturale se non gliela si toglie, quindi senza di lei un contenuto
 * lungo **spinge** invece di scorrere, e `overflow-y` non ha mai occasione di intervenire.
 *
 * Il fondo è più largo degli altri tre: è l'aria sotto l'ultimo pannello, quella che dice che la
 * pagina è finita. Nel canvas sono sessanta pixel, cioè due passi e mezzo del settimo.
 */
.content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6) var(--space-7) calc(var(--space-7) * 2.5);
}
</style>
