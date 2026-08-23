<script setup lang="ts">
/**
 * D038 · ADR 0045 — l'area che scorre, e da qui in poi l'**unica**: R27 vieta a ogni altro file di
 * `src/` un `overflow` che scorre e una riga di `scrollbar-*`.
 *
 * **Non ha proprietà, e non può averne** (R16, [ADR 0030](../../../docs/adr/0030-il-telaio-e-una-forma-non-un-contenitore.md)):
 * come `UiShell`, non c'è niente da parametrizzare perché non c'è niente che vari. Nemmeno l'asse —
 * quando un asse è `auto` l'altro smette di essere `visible` e diventa `auto` da sé, per come è
 * scritta la cascata: le sei aree che scorrevano prima di questa delega si comportavano già così,
 * chi dichiarava `overflow-y` compreso. Una proprietà `axis` avrebbe descritto una differenza che
 * non esisteva.
 *
 * **Non dipinge e non si colloca**, ed è la parte che tiene: fondo, bordo, spazio interno,
 * disposizione dei figli e posto nel telaio sono di chi chiama, che li scrive nel proprio CSS
 * scoped sulla radice di questo componente. È il patto di `UiPopover` — «ciò che hanno in comune è
 * la meccanica, ed è tutto quello che sta in questo file» — e la strada è quella che
 * `DevPanel.corner` percorre già: un elemento di radice solo, quindi gli attributi e lo scope del
 * chiamante ci ricadono da soli.
 *
 * ## Le tre righe che questo file esiste per possedere
 *
 * **`min-height: 0` e `min-width: 0`.** Sono la riga che sembra superflua e non lo è: un elemento
 * flessibile non scende sotto la propria dimensione naturale se non gliela si toglie, quindi senza
 * di loro un contenuto lungo **spinge** invece di scorrere e `overflow` non ha mai occasione di
 * intervenire. `UiShell` lo sapeva e lo scriveva; `AppNav` no, e la colonna delle destinazioni
 * scorreva **tutta** — marchio e interruttore del tema compresi — invece di scorrere la sola lista.
 * Nessun gate poteva vederlo, ed è la ragione per cui questa cosa è un pezzo del kit e non una nota.
 *
 * **Il vestito della barra.** `scrollbar-width` e `scrollbar-color` sono proprietà standard e
 * **ereditate**: scritte qui valgono per l'area e per ciò che ci sta dentro, senza un secondo
 * meccanismo. Non ci sono pseudo-elementi `::-webkit-scrollbar` e non è una dimenticanza — dove le
 * proprietà standard sono dichiarate il motore ignora i pseudo-elementi, quindi scriverli
 * entrambi vuol dire scrivere due volte la stessa cosa e tenerne allineata una sola.
 *
 * ## Un vicolo cieco, misurato invece che immaginato
 *
 * `scrollbar-gutter: stable` è stato scritto, guardato nella finestra vera e **tolto**. Riserva lo
 * spazio della barra anche quando la barra non c'è, quindi il contenuto non salta di un dito il
 * primo tick in cui la pagina supera il fondo — che sembra il difetto giusto da chiudere. Il prezzo
 * però è permanente e si misura: nell'area del contenuto lo spazio a sinistra restava
 * **24 px** e quello a destra diventava **34 px**, e nella colonna le due aree annidate ne
 * riservavano una ciascuna — **21 px** contro gli 8 del disegno. Dieci pixel sono `--space-4`: in
 * una scala che arriva a 24 non è un dettaglio, è un passo intero di asimmetria, e si vede.
 *
 * Vale anche il contrario di ciò che sembrava: senza quella riga le due aree annidate della colonna
 * **non costano niente**, perché una barra occupa spazio solo quando c'è, e quella di fuori non
 * scorre mai.
 */
</script>

<template>
  <div class="ui-scroll"><slot /></div>
</template>

<style scoped>
.ui-scroll {
  overflow: auto;

  /* Vedi sopra: senza, dentro un contenitore flessibile questo elemento non scorre, spinge. */
  min-height: 0;
  min-width: 0;

  /*
   * Lo scorrimento non prosegue nel genitore quando qui si arriva in fondo. Con due aree annidate —
   * la colonna del telaio e la lista delle destinazioni dentro di lei — senza questa riga la rotella
   * scavalca l'una e muove l'altra, e chi guarda vede muoversi la cosa che non stava puntando.
   */
  overscroll-behavior: contain;

  scrollbar-width: thin;

  /*
   * Pollice e binario, in quest'ordine. Il colore si **deriva** dal token invece di ricopiarne il
   * valore, che è la correzione imposta dall'audit di D016 a `.refusal`: al 35% l'inchiostro
   * smorzato si stacca da tutte e tre le superfici del design senza diventare una riga nera in un
   * tema chiaro. Il binario è trasparente — la barra è un segno sulla superficie di chi ospita, non
   * una scanalatura sua.
   *
   * **Le due frecce alle estremità restano quelle di Windows**, e non è una svista: le proprietà
   * standard dicono di che colore è la barra, non di quali pezzi è fatta, e toglierle vorrebbe dire
   * passare ai pseudo-elementi `::-webkit-scrollbar` — che il motore ignora appena una proprietà
   * standard è dichiarata, quindi è un aut aut e non una somma. Restano perché è la stessa scelta
   * che `PaymentDialog` ha già fatto per il pallino della scelta: **il congegno è del motore, il
   * colore è del tema.** Prendono l'inchiostro di questa riga come il resto della barra.
   */
  scrollbar-color: color-mix(in srgb, var(--color-ink-3) 35%, transparent) transparent;
}

/*
 * Sul puntatore il pollice si scurisce. Una barra sottile è discreta finché non la si vuole
 * afferrare, e in quel momento deve dire dov'è: è l'unico stato che questa cosa ha, e costa una
 * riga.
 */
.ui-scroll:hover {
  scrollbar-color: color-mix(in srgb, var(--color-ink-3) 62%, transparent) transparent;
}
</style>
