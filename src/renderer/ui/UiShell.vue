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
 *
 * **Da [D038](../../../docs/delega/D038-cio-che-si-preme-e-cio-che-scorre.md) non possiede più lo
 * scorrimento**, e non è un dettaglio di forma: `overflow`, il `min-height: 0` che lo rende
 * possibile e il vestito della barra sono di `UiScroll`, che li tiene in un posto solo (R27). Qui
 * resta la geometria delle tre regioni, che è ciò per cui questo file esiste.
 */

import UiScroll from './UiScroll.vue'
</script>

<template>
  <div class="ui-shell">
    <aside class="nav">
      <UiScroll class="nav-scroll"><slot name="nav" /></UiScroll>
    </aside>
    <main class="main">
      <header class="head"><slot name="head" /></header>
      <UiScroll class="content"><slot /></UiScroll>
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
 * La colonna **scorre**, e non è la stessa cosa che tagliare: le destinazioni sono quattro e ci
 * stanno, ma il giorno in cui fossero venti la colonna le taglierebbe **in silenzio** — ed è la
 * forma di difetto che nasce funzionante e si rompe mesi dopo, senza che nessuno l'abbia toccata.
 *
 * A scorrere è `.nav-scroll`, e questa resta il posto: larghezza, fondo e bordo sono suoi, perché
 * sono ciò che divide la colonna dal resto e non ciò che ci sta dentro.
 */
.nav {
  flex: 0 0 var(--nav-width);
  width: var(--nav-width);
  height: 100%;
  display: flex;
  background: var(--color-surface);
  border-right: 1px solid var(--color-line);
}

.nav-scroll {
  flex: 1;
  display: flex;
  flex-direction: column;
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
 * L'area del contenuto: quella che porta le pagine, e la sola delle tre che può diventare più alta
 * della finestra.
 *
 * `min-height: 0` non è più qui, ed è la riga che questa delega ha spostato invece di cancellare:
 * un elemento flessibile non scende sotto la propria dimensione naturale se non gliela si toglie,
 * quindi senza di lei un contenuto lungo **spinge** invece di scorrere. Adesso la scrive `UiScroll`
 * per chiunque, ed è la ragione per cui esiste — `AppNav` non la sapeva, e la sua colonna scorreva
 * tutta invece di scorrere la lista.
 *
 * Il fondo è più largo degli altri tre: è l'aria sotto l'ultimo pannello, quella che dice che la
 * pagina è finita. Nel canvas sono sessanta pixel, cioè due passi e mezzo del settimo.
 */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6) var(--space-7) calc(var(--space-7) * 2.5);
}
</style>
