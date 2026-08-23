<script setup lang="ts">
import { useTemplateRef, watch } from 'vue'

/**
 * D036 · ADR 0042 · ADR 0032 — la finestra, e il **secondo** dei due pezzi che hanno in mano il
 * livello superiore. R22 non nomina più un attributo: dice che il livello superiore passa dal kit,
 * e i custodi sono due — `UiPopover` per `popover`, questo per `dialog`.
 *
 * Sta accanto a `UiPopover` invece che dentro perché le due meccaniche sono opposte, non simili.
 * Un riquadro ancorato si congeda da sé al clic fuori, non prende il fuoco e non spegne ciò che
 * c'è dietro; una finestra **modale** fa esattamente le tre cose contrarie, e le fa il motore:
 * `showModal()` porta lo sfondo, rende inerte il resto del documento, chiude con `Esc` e tiene il
 * fuoco dentro. Metterle nello stesso file vorrebbe dire una proprietà che sceglie fra due
 * comportamenti che non condividono una riga.
 *
 * **Non dipinge niente**, come l'altro: fondo, bordo e larghezza sono del contenuto, che entra per
 * slot. La disposizione è scritta qui, quindi è una forma e non un contenitore
 * ([ADR 0030](../../../docs/adr/0030-il-telaio-e-una-forma-non-un-contenitore.md)) — e non c'è un
 * `z-index`, perché il livello superiore non partecipa all'impilamento (R21).
 *
 * ## Le due righe che questo file esiste per possedere
 *
 * `display` su un elemento del livello superiore è la riga che disfa il meccanismo, e vale per
 * `dialog` esattamente come per `popover`: il foglio di stile del motore tiene chiusa una finestra
 * con `display: none`, e una regola d'autore vince su quella del motore **a qualunque
 * specificità**, perché arriva da un'origine più forte della cascata. Un solo `display: flex`
 * scritto senza condizione la tiene visibile per sempre.
 *
 * È già successo in questo progetto, al pannello dei cheat di
 * [D029](../../../docs/delega/D029-i-devcheat.md), e per due stesure la colpa era stata data alla
 * meccanica di apertura — che era giusta tutte e due le volte. Qui i due stati sono **scritti tutti
 * e due**, chiuso e aperto: la regola del motore basterebbe da sola, ma allora l'invariante starebbe
 * in un foglio che nessuno apre.
 */

const props = defineProps<{
  /** Se è aperta. Chi la possiede è il chiamante: una finestra non decide da sé di esistere. */
  readonly open: boolean
  /**
   * Come si chiama, per chi non la vede. Arriva **già tradotta** (R12): il kit non sa cosa voglia
   * dire, ed è la stessa forma di `UiButton.label`.
   */
  readonly label: string
}>()

const emit = defineEmits<{ close: [] }>()

const box = useTemplateRef<HTMLDialogElement>('box')

/**
 * Le due guardie non sono prudenza, ed è la stessa lezione di `UiPopover`: `showModal()` su una
 * finestra già aperta **lancia**, e succede al doppio clic sul pulsante che la apre.
 */
watch(
  () => props.open,
  (wanted) => {
    const element = box.value
    if (element === null) return
    if (wanted && !element.open) element.showModal()
    if (!wanted && element.open) element.close()
  }
)

/**
 * Lo stato chiuso arriva **dal motore**, non da noi, e vale per le tre strade che non passano da
 * qui: `Esc`, il clic sullo sfondo, e un `close()` di chiunque. Senza, chi possiede la finestra
 * resterebbe convinto che sia aperta e non la riaprirebbe più.
 */
const onClose = (): void => emit('close')

/**
 * Il clic sullo sfondo. Non lo chiude il motore, e il bersaglio dell'evento è la finestra stessa —
 * il contenuto sta in un figlio, quindi un clic su di lui non arriva mai qui con questo bersaglio.
 */
const onClick = (event: MouseEvent): void => {
  if (event.target === box.value) emit('close')
}
</script>

<template>
  <dialog ref="box" class="ui-dialog" :aria-label="label" @close="onClose" @click="onClick">
    <div class="ui-dialog-content"><slot /></div>
  </dialog>
</template>

<style scoped>
/*
 * **Le due righe che questo componente esiste per possedere.** Chiusa non si vede, aperta sì, e la
 * seconda vince sulla prima perché è più specifica. Scriverne una sola senza condizione — che è la
 * cosa che viene naturale il giorno in cui serve impilare del contenuto — tiene la finestra
 * visibile per sempre.
 *
 * Niente fondo, niente bordo, niente ombra e niente larghezza: quelli sono del contenuto. Restano
 * il margine automatico, che è ciò che la mette al centro, e il tetto di altezza, che è ciò che
 * impedisce a una finestra più alta dello schermo di uscirne — non è geometria da fuori, è la
 * differenza fra una finestra e un foglio (R16).
 */
.ui-dialog:not([open]) {
  display: none;
}

.ui-dialog[open] {
  display: block;
}

.ui-dialog {
  margin: auto;
  padding: 0;
  border: none;
  background: none;
  max-width: min(92vw, 30rem);
  color: var(--color-ink);
}

/*
 * Lo sfondo. Da Chromium 122 `::backdrop` eredita dall'elemento che lo origina, quindi le
 * variabili del tema si risolvono qui dentro: senza quella regola sarebbe un colore vuoto, cioè
 * trasparente in un tema e sbagliato nell'altro. Verificato nella finestra vera, non dedotto.
 */
.ui-dialog::backdrop {
  background: color-mix(in srgb, var(--color-sunken) 72%, transparent);
}

/*
 * Il figlio che rende riconoscibile un clic sullo sfondo — il contenuto sta dentro di lui, quindi
 * un clic sul contenuto non ha mai la finestra come bersaglio. È anche ciò che scorre quando il
 * contenuto è più alto dello schermo, ed è la stessa decisione di
 * [D030](../../../docs/delega/D030-il-contenuto-scorre-nel-telaio.md): scorre il contenuto, non il
 * telaio. Non dipinge: è il chiamante a farlo.
 */
.ui-dialog-content {
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  overflow: auto;
}
</style>
