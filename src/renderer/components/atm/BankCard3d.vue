<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'

import { useTranslator } from '@renderer/i18n'
import type { Card } from '@renderer/stores/game'

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
 * **Da [D036](../../../../docs/delega/D036-il-pagamento-e-un-flusso-solo.md) i tre fatti del retro
 * sono facoltativi**, e il codice non è più decorazione. La carta si disegna in due posti — la
 * pagina del bancomat e la finestra del pagamento — e i fatti sono del **bancomat**: là dentro si
 * decide se spostare denaro con questo strumento, qui si sta solo dimostrando di averlo in mano.
 * Il retro resta un elenco, e un elenco di zero voci è un elenco.
 *
 * **Zero logica.** Riceve stringhe già formattate e non vede un solo `Decimal`: chi formatta è il
 * confine di presentazione (ADR 0006), chi decide quanto denaro si muove è il dominio (R05). */

withDefaults(
  defineProps<{
    /**
     * Numero, scadenza e codice di **questa** partita (ADR 0042). Fino a D036 erano una costante
     * qui dentro, con accanto il grilletto che questa proprietà ha fatto scattare: adesso li deriva
     * dal seme `cardOf`, e il codice è la prova che la carta chiede prima di pagare.
     */
    readonly card: Card
    /** Il tetto dello strumento, già in parole: oggi «Illimitata». */
    readonly capacity?: string | undefined
    /**
     * Cosa costa usare questo strumento, già in parole: da D032 sono i **due tassi**, uno per
     * verso, e non più un importo. Quanto costi la singola operazione non lo sa più nessuno in
     * anticipo — lo dice l'anteprima, che è l'operazione stessa (INV-11).
     */
    readonly fee?: string | undefined
    /** Se i movimenti lasciano traccia, già in parole. È metà della dualità di P4. */
    readonly traceability?: string | undefined
  }>(),
  { capacity: undefined, fee: undefined, traceability: undefined }
)

/**
 * **Ciò che è stampato su ogni carta uguale**, e solo quello: il circuito, le due didascalie e
 * l'intestatario. Non sono numeri di gioco — non stanno in `balance/`, nessuna regola li legge — e
 * non sono parole da tradurre: sono inchiostro, identico in ogni lingua e in ogni partita.
 *
 * **Il grilletto che stava scritto qui è scattato.** Diceva che un numero ricavato dal seme sarebbe
 * stato la prima cosa a distinguere una partita da un'altra a schermo: da D036 numero, scadenza e
 * codice arrivano da `cardOf` e non sono più qui.
 *
 * L'intestatario è rimasto, ed è una decisione: quei tre si ricavano da cifre, un nome vorrebbe un
 * elenco di nomi — dati nuovi che nessuna regola legge, per una riga stampata. Il grilletto è il
 * primo posto in cui il gioco chieda al giocatore come si chiama.
 */
const ORNAMENT = {
  kind: 'DEBIT',
  holderLabel: 'CARDHOLDER',
  holder: 'A. VOLPE',
  expiryLabel: 'VALID THRU'
} as const

const { text } = useTranslator()

/**
 * L'elemento che gira. Si chiama così e non `card` perché `card` adesso è il **dato**: da D036 la
 * carta arriva per proprietà, e due cose con lo stesso nome in un file solo sono la prima riga
 * sbagliata che qualcuno scrive.
 */
const plastic = useTemplateRef<HTMLElement>('plastic')

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
  plastic.value?.setPointerCapture(event.pointerId)
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
      ref="plastic"
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

        <p class="pan">{{ card.number }}</p>

        <footer class="engraved">
          <span class="stamp">
            <span class="caption">{{ ORNAMENT.holderLabel }}</span>
            <span class="value">{{ ORNAMENT.holder }}</span>
          </span>
          <span class="stamp end">
            <span class="caption">{{ ORNAMENT.expiryLabel }}</span>
            <span class="value">{{ card.expiry }}</span>
          </span>
        </footer>
      </div>

      <div class="face back">
        <span class="stripe" aria-hidden="true"></span>

        <p class="signature">
          <span class="strip" aria-hidden="true"></span>
          <span class="value">{{ card.code }}</span>
        </p>

        <p class="caption">{{ text('card.back.title') }}</p>
        <dl class="details">
          <div v-if="traceability !== undefined" class="detail">
            <dt>{{ text('pool.traceability') }}</dt>
            <dd>{{ traceability }}</dd>
          </div>
          <div v-if="capacity !== undefined" class="detail">
            <dt>{{ text('pool.capacity') }}</dt>
            <dd>{{ capacity }}</dd>
          </div>
          <div v-if="fee !== undefined" class="detail">
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

/*
 * Il nero non è un secondo accento: è il **materiale** della carta, e cambierà con la progressione.
 * Era oro fino al 2026-08-23; a cambiare sono stati i soli `--metal-*` in `tokens.css`, e qui non
 * si è toccata una riga. Il giorno in cui un'era ne cambia di nuovo il materiale, il lavoro è lì.
 */
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

/*
 * Il pannello della firma, e viene dall'**inchiostro** del retro invece che dall'oro del chip. Con
 * la carta d'oro le due cose coincidevano; con la carta nera no — restava una barra dorata in mezzo
 * al retro, l'unico pezzo rimasto del materiale di prima. Su una carta vera quel pannello è chiaro,
 * perché ci si scrive sopra.
 */
.strip {
  flex: 1;
  height: 14px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--metal-back-ink) 22%, transparent);
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
