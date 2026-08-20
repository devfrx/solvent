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
 * **Zero logica.** Riceve quattro stringhe già formattate e non vede un solo `Decimal`: chi
 * formatta è il confine di presentazione (ADR 0006), chi decide quanto denaro si muove è il
 * dominio (R05). La matematica della rotazione — l'unica parte sbagliabile — sta in `rotation.ts`,
 * pura e provata a parte.
 */

defineProps<{
  /** Il saldo della carta, già formattato. */
  readonly account: string
  /** Il tetto dello strumento, già in parole: oggi «Illimitata». */
  readonly capacity: string
  /** Cosa costa un'operazione al bancomat, già formattato. */
  readonly fee: string
  /** Se i movimenti lasciano traccia, già in parole. È metà della dualità di P4. */
  readonly traceability: string
}>()

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
          <span class="tier">{{ text('card.tier.gold') }}</span>
          <span class="chip" aria-hidden="true"></span>
        </header>
        <div>
          <p class="caption engraved">{{ text('atm.account.title') }}</p>
          <p class="amount balance">{{ account }}</p>
        </div>
      </div>

      <div class="face back">
        <span class="stripe" aria-hidden="true"></span>
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
            <dd class="amount">{{ fee }}</dd>
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

.card {
  width: 290px;
  height: 180px;
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
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow:
    0 18px 40px -18px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(255, 255, 255, 0.07) inset;
}

/* L'oro non è un secondo accento: è il materiale della carta, e cambierà con la progressione. */
.front {
  background: linear-gradient(
    135deg,
    #3a3016 0%,
    #8a6d24 38%,
    #d9b451 55%,
    #8a6d24 72%,
    #3a3016 100%
  );
  color: #231a07;
}

.back {
  background: linear-gradient(135deg, #2a2413 0%, #6d5620 50%, #2a2413 100%);
  color: #231a07;
  transform: rotateY(180deg);
}

.brand {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.tier {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.chip {
  width: 38px;
  height: 28px;
  border-radius: 5px;
  background: linear-gradient(145deg, #f5e2a0, #b8912f);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.25);
}

.engraved {
  color: #3a2f10;
}

.balance {
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.02em;
  margin: 3px 0 0;
}

.stripe {
  height: 36px;
  background: #120f06;
  margin: -16px -16px 0;
  border-radius: 14px 14px 0 0;
}

.details {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 10px;
}

dt {
  opacity: 0.75;
}

dd {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  text-align: right;
}

.hint {
  text-align: center;
  font-size: 11px;
  color: var(--muted);
  margin: 4px 0 0;
}
</style>
