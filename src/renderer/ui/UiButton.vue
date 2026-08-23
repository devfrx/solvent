<script setup lang="ts">
import type { IconName } from './icons'
import type { ButtonSize, ButtonVariant } from './roles'
import UiIcon from './UiIcon.vue'
import UiText from './UiText.vue'

/**
 * D038 · ADR 0044 — l'azione, e l'**unica** cosa premibile del progetto
 * cosa premibile del progetto: **R26** vieta un `<button>` in ogni altro `.vue` di `src/`.
 *
 * Prima erano sei. Questo pezzo e cinque pulsanti scritti a mano — il verso del bancomat, le
 * scorciatoie degli importi, le destinazioni della colonna, l'interruttore del tema, l'aggancio dei
 * cheat — ognuno con la propria riga di azzeramento del pulsante del browser, e **nessuno dei sei
 * con un anello di fuoco**. Chi girava con il tabulatore riceveva il contorno del motore, che dei
 * due temi non sa niente. Non era distrazione: era che niente lo impediva, ed è la stessa forma del
 * difetto che l'audit di [D016](../../../docs/delega/D016-correzioni-audit.md) trovò con `.refusal`
 * copiata in due pannelli.
 *
 * ## Non sa spegnersi
 *
 * Non ha una proprietà `disabled`, e non scrive `disabled` sul pulsante: è la riga che rende questo
 * kit una regola invece di una tavolozza (INV-21). Il design lo dice così: un'azione che non puoi
 * fare non è mai un pulsante morto, è una frase che dice cosa manca e quanto. La prima versione di
 * questo componente disabilitava il pulsante quando arrivava una `reason`, e avrebbe disfatto quella
 * decisione senza accorgersene.
 *
 * Restano due cose distinte, e servono davvero tutte e due:
 *
 * - `muted` è l'**anteprima**: da qui si vede che probabilmente non si può, e il pulsante cambia
 *   aspetto restando premibile. Premere è il modo in cui si scopre il perché esatto.
 * - `reason` è la **frase**, quella che il rifiuto ha prodotto, con dentro i numeri.
 *
 * Da D038 quell'invariante non vale più solo qui: con R26 nessun altro file ha in mano un
 * `<button>`, quindi un pulsante spento senza motivo non è più impossibile **in `ui/`** — è
 * impossibile **nell'applicazione**.
 *
 * ## L'etichetta è sempre il nome
 *
 * `label` non è opzionale, in nessuna misura: un pulsante senza nome è la cosa che questo kit non
 * deve poter scrivere. A misura `icon` non si vede — al suo posto si vede il glifo — e diventa il
 * nome per chi non lo vede, con `aria-label`. Ne discende che nessun chiamante scrive più un
 * `aria-label` a mano, che è esattamente il posto in cui una traduzione si dimentica.
 *
 * La frase e l'etichetta arrivano già tradotte (R12): il kit non sa cosa vogliano dire.
 *
 * ## Gli attributi ricadono sul pulsante, non sull'involucro
 *
 * `inheritAttrs: false` più `v-bind="$attrs"` sul `<button>`: quello che il chiamante scrive —
 * `popovertarget` e `aria-expanded` per l'aggancio di una sovrapposizione — arriva sull'elemento che
 * il motore deve riconoscere. Senza, finirebbe sul `div` che tiene insieme pulsante e ragione, e
 * l'apertura dichiarativa di `UiPopover` non funzionerebbe più — in silenzio, perché un
 * `popovertarget` su un `div` non è un errore per nessuno.
 */

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    /** Cosa fa, già tradotto. È anche il nome per chi non lo vede: vedi sopra. */
    readonly label: string
    readonly variant?: ButtonVariant
    readonly size?: ButtonSize
    /** Il glifo accanto all'etichetta — o al posto suo, a misura `icon`. */
    readonly icon?: IconName | undefined
    /**
     * «Questo è quello acceso»: la destinazione in cui ci si trova, la scelta corrente. Scrive
     * anche `aria-pressed`, perché un colore diverso non lo dice a chi non lo vede.
     */
    readonly selected?: boolean
    readonly muted?: boolean
    readonly reason?: string | undefined
  }>(),
  {
    variant: 'primary',
    size: 'md',
    icon: undefined,
    selected: false,
    muted: false,
    reason: undefined
  }
)

defineEmits<{ press: [] }>()
</script>

<template>
  <div class="ui-button">
    <button
      v-bind="$attrs"
      type="button"
      :class="[variant, size, { muted, selected }]"
      :aria-label="size === 'icon' ? label : undefined"
      :aria-pressed="selected ? true : undefined"
      @click="$emit('press')"
    >
      <UiIcon v-if="icon !== undefined" :name="icon" />
      <span v-if="size !== 'icon'" class="label">{{ label }}</span>
    </button>
    <UiText v-if="reason !== undefined && reason !== ''" tone="loss" size="xs" class="reason">
      {{ reason }}
    </UiText>
  </div>
</template>

<style scoped>
.ui-button {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/*
 * L'azzeramento, e la parte che i cinque pulsanti scritti a mano ripetevano ognuno per conto suo.
 * Sta prima delle varianti perché ognuna di loro ne cambia solo il colore.
 */
button {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  border: 1px solid transparent;
  cursor: pointer;
}

.label {
  min-width: 0;
}

/* ── Le quattro scatole ─────────────────────────────────────────────────────────────────────── */

/* L'azione della schermata: riempie la colonna, e ciò che dice sta al centro. */
.md {
  width: 100%;
  justify-content: center;
  padding: var(--space-4) var(--space-5);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--track-wide);
  border-radius: var(--radius-md);
}

/*
 * La riga di una colonna: larga quanto lei e allineata a sinistra, perché quello che conta è dove
 * cominciano le parole — una sotto l'altra si leggono come un elenco, centrate come cinque
 * pulsanti.
 */
.sm {
  width: 100%;
  justify-content: flex-start;
  text-align: left;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  border-radius: var(--radius-sm);
}

/* La forma della targhetta, ma premibile: è una scorciatoia, non l'azione della schermata. */
.chip {
  display: inline-flex;
  align-self: flex-start;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-xs);
  letter-spacing: var(--track-wide);
  border-radius: var(--radius-pill);
}

/*
 * Il disco. `aspect-ratio` invece di una misura scritta: il lato lo decidono il glifo e lo spazio
 * intorno, quindi non c'è un numero da tenere allineato alla scala — quello che c'era, `38px`, non
 * era un passo di niente.
 */
.icon {
  align-self: flex-start;
  justify-content: center;
  aspect-ratio: 1;
  padding: var(--space-4);
  font-size: var(--text-md);
  border-radius: var(--radius-pill);
}

/* ── Le quattro forze ───────────────────────────────────────────────────────────────────────── */

.primary {
  background: var(--color-accent);
  color: var(--color-accent-fg);
}

.primary:hover {
  background: color-mix(in srgb, var(--color-accent) 85%, transparent);
}

.quiet {
  background: transparent;
  color: var(--color-ink);
  border-color: var(--color-line);
}

.raised {
  background: var(--color-raised);
  color: var(--color-ink);
  border-color: var(--color-line);
}

.quiet:hover,
.raised:hover {
  border-color: var(--color-ink-3);
}

/*
 * Nessun contorno finché non la si tocca. È la forma delle voci di una colonna: dieci rettangoli
 * disegnati tutti insieme sono un reticolo, e il reticolo copre la cosa che conta — quale è acceso.
 */
.bare {
  background: transparent;
  color: var(--color-ink-3);
}

.bare:hover {
  color: var(--color-ink);
  border-color: var(--color-line);
}

/* ── I due stati ────────────────────────────────────────────────────────────────────────────── */

/*
 * A dire quale voce è scelta è anche il **bordo**, non solo il fondo. È la correzione che D023 ha
 * trovato guardando: nel tema scuro `--color-raised` contro `--color-surface` sono due punti di
 * luminosità, e la differenza che nel chiaro si vede da sola lì sparisce.
 */
.selected {
  background: var(--color-raised);
  color: var(--color-ink);
  border-color: var(--color-line);
}

/* Non spento: **smorzato**. Resta premibile, e premerlo è come si scopre di quanto manca. */
.muted {
  background: var(--color-sunken);
  color: var(--color-ink-3);
  border-color: var(--color-line);
}

/*
 * L'anello del fuoco, e prima di D038 non ce l'aveva nessuno dei sei pulsanti del progetto. È lo
 * stesso di `UiPopover`, e deve esserlo: due modi di dire «sei qui» sono due modi che divergono.
 * `:focus-visible` e non `:focus` — il motore lo accende per la tastiera e non per il puntatore,
 * che è la distinzione per cui questa pseudo-classe esiste.
 */
button:focus-visible {
  outline: 1px solid var(--color-ink-3);
  outline-offset: var(--space-1);
}

/*
 * Sfondo e bordo si **derivano** dal token invece di ricopiarne il valore. È la correzione che
 * l'audit di D016 ha imposto a `.refusal`: quattro `rgba()` scritti a mano si scollegano dal token
 * il giorno in cui il token cambia, e nessuno se ne accorge finché il rosso non è due rossi.
 */
.reason {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--color-loss) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-loss) 25%, transparent);
}
</style>
