<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'

import { useTranslator } from '@renderer/i18n'

import type { Face, Rotation } from './rotation'
import { draggedTo, releasedOn, restingAt, transformOf } from './rotation'

/**
 * L'unico oggetto che il giocatore possiede davvero (P5): si vede in prospettiva, si gira col
 * mouse, e il retro porta informazione vera. Una carta che gira e mostra un rettangolo vuoto è un
 * giocattolo — girarla deve servire a qualcosa.
 *
 * CSS 3D puro: `perspective` sul contenitore, `transform-style: preserve-3d` sulla carta,
 * `backface-visibility: hidden` sulle facce. Nessuna libreria: non passerebbe l'ADR 0015 per un
 * effetto che costa venti righe di CSS.
 *
 * **Le due facce vengono dall'artboard `ATM` del canvas** ([D033](../../../../docs/delega/D033-il-bancomat-e-una-pagina.md)),
 * il modo di girarle no. Il canvas inclina col puntatore e gira al clic; qui c'è il trascinamento
 * vero, con la matematica in `rotation.ts`, pura e già provata. È **comportamento**, non disegno,
 * ed è migliore di quello che il canvas mima con due `onMouseMove`.
 *
 * **Il saldo non sta più sul fronte.** Fino a D033 ci stava, e nella pagina nuova sarebbe lo
 * stesso numero due volte nella stessa schermata: il saldo della carta è già il lato `A CARTA` del
 * blocco `DA ⇄ A`. Il fronte porta solo decorazione, il retro solo fatti.
 *
 * **Il retro porta tre righe, e il canvas ne disegna cinque.** `INTEREST` e `RISK` restano fuori:
 * gli interessi e il conto congelato non esistono come meccanica, e una carta che dichiara una
 * meccanica assente è un numero finto con un'etichetta. Il retro è un elenco, ed è fatto per
 * crescere di una riga il giorno in cui la meccanica nasce.
 *
 * **Zero logica.** Riceve tre stringhe già formattate e non vede un solo `Decimal`: chi formatta è
 * il confine di presentazione (ADR 0006), chi decide quanto denaro si muove è il dominio (R05). */

defineProps<{
  /** Il tetto dello strumento, già in parole: oggi «Illimitata». */
  readonly capacity: string
  /**
   * Cosa costa usare questo strumento, già in parole: da D032 sono i **due tassi**, uno per verso,
   * e non più un importo. Quanto costi la singola operazione non lo sa più nessuno in anticipo —
   * lo dice l'anteprima, che è l'operazione stessa (INV-11).
   */
  readonly fee: string
  /** Se i movimenti lasciano traccia, già in parole. È metà della dualità di P4. */
  readonly traceability: string
}>()

/**
 * **Decorazione dichiarata.** Non sono numeri di gioco — non stanno in `balance/`, nessuna regola
 * li legge, cambiarli non sposta niente — e non sono parole da tradurre: sono ciò che è stampato
 * su una carta, uguale in ogni lingua. Stanno qui, con questo commento, perché altrimenti il primo
 * che li legge va a cercare da dove vengono.
 *
 * Un numero ricavato dal seme della partita sarebbe bello e costerebbe poco (l'Rng ha già i suoi
 * stream per dominio, ADR 0005): è **fuori scopo** per D033, e il grilletto è scritto — sarebbe la
 * prima cosa nel gioco a distinguere una partita da un'altra a schermo.
 */
const ORNAMENT = {
  kind: 'DEBIT',
  number: '4913 2201 0067 5540',
  holderLabel: 'CARDHOLDER',
  holder: 'A. VOLPE',
  expiryLabel: 'VALID THRU',
  expiry: '08 / 31',
  code: '441'
} as const

const { text } = useTranslator()

const card = useTemplateRef<HTMLElement>('card')

const face = shallowRef<Face>('front')
const rotation = shallowRef<Rotation>(restingAt('front'))
const dragging = shallowRef(false)

/**
 * Lo stato del gesto in corso. Non è reattivo di proposito: cambia a ogni `pointermove` e non lo
 * guarda nessuno tranne il gestore successivo — metterlo in un `ref` farebbe ridisegnare la
 * schermata sessanta volte al secondo per un numero che non compare da nessuna parte.
 */
let grabbedAt = { across: 0, down: 0 }
let grabbedFrom: Rotation = restingAt('front')
let travelled = 0

const flip = (): void => {
  face.value = face.value === 'front' ? 'back' : 'front'
  rotation.value = restingAt(face.value)
}

const grab = (event: PointerEvent): void => {
  dragging.value = true
  travelled = 0
  grabbedAt = { across: event.clientX, down: event.clientY }
  grabbedFrom = rotation.value
  card.value?.setPointerCapture(event.pointerId)
}

const drag = (event: PointerEvent): void => {
  if (!dragging.value) return
  const across = event.clientX - grabbedAt.across
  const down = event.clientY - grabbedAt.down
  travelled = Math.max(travelled, Math.abs(across) + Math.abs(down))
  rotation.value = draggedTo(grabbedFrom, across, down)
}

const release = (): void => {
  if (!dragging.value) return
  dragging.value = false
  face.value = releasedOn(face.value, rotation.value, travelled)
  rotation.value = restingAt(face.value)
}
</script>

<template>
  <div class="stage">
    <div
      ref="card"
      class="card"
      :class="{ dragging }"
      :style="{ transform: transformOf(rotation) }"
      role="button"
      tabindex="0"
      :aria-label="text('card.hint.drag')"
      @pointerdown="grab"
      @pointermove="drag"
      @pointerup="release"
      @pointercancel="release"
      @keydown.enter.prevent="flip"
      @keydown.space.prevent="flip"
    >
      <div class="face front">
        <header class="brand">
          <span class="mark">{{ text('app.name') }}</span>
          <span class="kind">{{ ORNAMENT.kind }}</span>
        </header>

        <span class="chip" aria-hidden="true">
          <span class="contact"></span>
          <span class="contact"></span>
          <span class="contact"></span>
        </span>

        <p class="pan">{{ ORNAMENT.number }}</p>

        <footer class="engraved">
          <span class="stamp">
            <span class="caption">{{ ORNAMENT.holderLabel }}</span>
            <span class="value">{{ ORNAMENT.holder }}</span>
          </span>
          <span class="stamp end">
            <span class="caption">{{ ORNAMENT.expiryLabel }}</span>
            <span class="value">{{ ORNAMENT.expiry }}</span>
          </span>
        </footer>
      </div>

      <div class="face back">
        <span class="stripe" aria-hidden="true"></span>

        <p class="signature">
          <span class="strip" aria-hidden="true"></span>
          <span class="value">{{ ORNAMENT.code }}</span>
        </p>

        <p class="caption">{{ text('card.back.title') }}</p>
        <dl class="details">
          <div class="detail">
            <dt>{{ text('pool.traceability') }}</dt>
            <dd>{{ traceability }}</dd>
          </div>
          <div class="detail">
            <dt>{{ text('pool.capacity') }}</dt>
            <dd>{{ capacity }}</dd>
          </div>
          <div class="detail">
            <dt>{{ text('atm.fee.per_operation') }}</dt>
            <dd>{{ fee }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>

  <p class="hint">{{ text('card.hint.drag') }}</p>
</template>

<style scoped>
.stage {
  perspective: 1100px;
  display: flex;
  justify-content: center;
  padding: 6px 0 2px;
  user-select: none;
}

/*
 * `flex: 0 0 auto` non e' decorazione: `.stage` e' un flex, e un elemento flessibile **si stringe**
 * anche quando ha una larghezza dichiarata. Senza questa riga la carta si schiacciava a 251px
 * quando la colonna destra scendeva sotto i 330 — misurato nella finestra vera, non supposto.
 */
.card {
  flex: 0 0 auto;
  width: 290px;
  height: 183px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.3, 1);
  cursor: grab;
  touch-action: none;
}

.card.dragging {
  transition: none;
  cursor: grabbing;
}

/* P5 — la rotazione resta possibile, l'animazione di ritorno no. */
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}

.face {
  position: absolute;
  inset: 0;
  border-radius: 14px;
  backface-visibility: hidden;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 18px 40px -18px var(--metal-shadow),
    0 0 0 1px var(--metal-sheen) inset;
}

/* L'oro non è un secondo accento: è il materiale della carta, e cambierà con la progressione. */
.front {
  background: linear-gradient(
    135deg,
    var(--metal-edge) 0%,
    var(--metal-mid) 38%,
    var(--metal-shine) 55%,
    var(--metal-mid) 72%,
    var(--metal-edge) 100%
  );
  color: var(--metal-ink);
}

.back {
  background: linear-gradient(
    135deg,
    var(--metal-back-edge) 0%,
    var(--metal-back-mid) 50%,
    var(--metal-back-edge) 100%
  );
  color: var(--metal-back-ink);
  transform: rotateY(180deg);
  overflow: hidden;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.mark {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: var(--weight-bold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.kind {
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.13em;
  opacity: 0.6;
}

.chip {
  width: 38px;
  height: 28px;
  margin-top: 12px;
  border-radius: 5px;
  background: linear-gradient(145deg, var(--metal-chip-light), var(--metal-chip-dark));
  box-shadow: inset 0 0 0 1px var(--metal-chip-inset);
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  padding: 5px 6px;
}

/* I contatti del chip: tre righe, come su una carta vera. */
.contact {
  height: 1px;
  background: var(--metal-chip-inset);
}

.pan {
  margin: auto 0 0;
  font-family: var(--font-mono);
  font-size: 15px;
  letter-spacing: 0.09em;
  line-height: 1.2;
}

.engraved {
  display: flex;
  align-items: flex-end;
  gap: var(--space-5);
  margin-top: 12px;
  color: var(--metal-chip-ink);
}

.stamp {
  display: flex;
  flex-direction: column;
}

.stamp.end {
  margin-left: auto;
  text-align: right;
}

.caption {
  font-family: var(--font-mono);
  font-size: 7.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.7;
  line-height: 1.4;
}

.value {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  line-height: 1.4;
}

.stripe {
  height: 34px;
  background: var(--metal-stripe);
  margin: 2px -16px 0;
}

.signature {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin: 10px 0 12px;
}

.strip {
  flex: 1;
  height: 14px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--metal-chip-light) 40%, transparent);
}

.back .caption {
  margin: 0 0 6px;
}

.details {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.detail {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.02em;
}

dt {
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.6;
  white-space: nowrap;
}

dd {
  margin: 0;
  text-align: right;
}

.hint {
  text-align: center;
  font-size: 11px;
  color: var(--color-ink-3);
  margin: 4px 0 0;
}
</style>
