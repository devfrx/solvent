import { describe, expect, it } from 'vitest'

import { read, withoutComments } from '../helpers/sources'

/**
 * INV-12 · ADR 0018 · ADR 0040 — il cruscotto non supera i **sei** riquadri.
 *
 * **La ragione è cambiata, il numero no**, e vale la pena sapere perché il test non è stato
 * cancellato. Fino a [D033](../../docs/delega/D033-il-bancomat-e-una-pagina.md) il tetto
 * difendeva il **bancomat**: cruscotto e bancomat stavano sulla stessa pagina, e il cruscotto si
 * mangia sempre il bancomat perché le statistiche crescono e il bancomat no. Adesso sono due
 * pagine, il bancomat non ci sta più sopra, e quella difesa non difende più niente.
 *
 * Quello che il tetto difende adesso è **il cruscotto da se stesso**. Senza, torna a essere i
 * dieci riquadri del progetto precedente: una parete di numeri in cui nessuno è più importante di
 * un altro, cioè nessuno. Il settimo riquadro non si aggiunge — **sostituisce** uno dei sei,
 * oppure va nella schermata Statistiche, che esiste dal primo giorno proprio per avere dove
 * andare.
 *
 * Il test era scritto **prima** dei riquadri, e non per rito: il settimo non nasce da una
 * decisione, nasce da una riga in più in una review distratta. Una regola che arriva dopo i
 * riquadri arriva dopo il momento in cui serviva.
 *
 * **⚠️ Parziale, e lo dichiara** (docs/tracciabilita.md): conta i **tag** nel template, quindi un
 * `v-for` su un riquadro moltiplicherebbe sei in sedici lasciando il conto a uno. Quel caso è
 * chiuso a parte — un `v-for` su `<StatTile>` è rosso — ma un `v-for` su un contenitore che ne
 * avvolge uno sfugge ancora: per prenderlo servirebbe rendere il componente, cioè jsdom
 * (docs/roadmap-fette.md).
 */

const BOARD = 'src/renderer/views/BoardView.vue'

/** ADR 0018 — sei, deciso una volta e verificato qui. */
const MAX_TILES = 6

/**
 * Il blocco `<template>` di primo livello, come in `tests/rules/no-literal-in-template`: ancorato a
 * inizio riga perché i `<template v-if>` annidati sono indentati e il loro `</template>` non sta
 * mai in colonna 1. Serve a non contare l'import del componente, che sta nello `<script setup>`.
 */
const ROOT_TEMPLATE = /^<template>([\s\S]*?)^<\/template>/m

/** I commenti del template sono `<!-- … -->`: `withoutComments` toglie quelli di JavaScript. */
const TEMPLATE_COMMENT = /<!--[\s\S]*?-->/g

const TILE = /<StatTile\b/g

/**
 * Un `v-for` fra gli attributi dello stesso tag. La classe di caratteri elenca le virgolette — un
 * attributo può contenere una parentesi angolare, `v-if="a > b"` — quindi si costruisce da una
 * stringa: un `/regex/` letterale con dentro un apice manda fuori fase la scansione di
 * `tests/rules/english-identifiers`, che lo dichiara fra i propri limiti.
 */
const LOOPED_TILE = new RegExp(`<StatTile\\b(?:[^>"']|"[^"]*"|'[^']*')*\\sv-for`)

const templateOf = (source: string): string =>
  (ROOT_TEMPLATE.exec(withoutComments(source))?.[1] ?? '').replace(TEMPLATE_COMMENT, ' ')

const tilesIn = (source: string): number => templateOf(source).match(TILE)?.length ?? 0

const loopsATile = (source: string): boolean => LOOPED_TILE.test(templateOf(source))

const componentWith = (body: string): string =>
  [
    '<script setup lang="ts">',
    "import StatTile from './StatTile.vue'",
    '</script>',
    '',
    '<template>',
    body,
    '</template>',
    ''
  ].join('\n')

describe('il rilevatore', () => {
  it('conta un riquadro per tag, e non conta l’import', () => {
    expect(tilesIn(componentWith('<StatTile /><StatTile />'))).toBe(2)
  })

  it('non conta un riquadro nominato in un commento', () => {
    expect(tilesIn(componentWith('<!-- qui andrebbe un <StatTile /> --><StatTile />'))).toBe(1)
    expect(tilesIn('<script setup lang="ts">\n// <StatTile />\n</script>\n')).toBe(0)
  })

  it('prende il riquadro moltiplicato da un v-for, che sfuggirebbe al conteggio', () => {
    expect(loopsATile(componentWith('<StatTile v-for="tile of tiles" :key="tile" />'))).toBe(true)
    expect(loopsATile(componentWith('<StatTile :label="a" />'))).toBe(false)
  })

  it('non si perde su un attributo che contiene una parentesi angolare', () => {
    expect(loopsATile(componentWith('<StatTile :class="{ up: a > b }" />'))).toBe(false)
    expect(tilesIn(componentWith('<StatTile :class="{ up: a > b }" /><StatTile />'))).toBe(2)
  })
})

describe('il cruscotto', () => {
  const board = read(BOARD)

  it('ha dei riquadri da contare, altrimenti questo test non guarda niente', () => {
    expect(tilesIn(board)).toBeGreaterThan(0)
  })

  it('non ne ha più di sei', () => {
    expect(tilesIn(board)).toBeLessThanOrEqual(MAX_TILES)
  })

  it('e non ne moltiplica uno con un v-for', () => {
    expect(loopsATile(board)).toBe(false)
  })
})
