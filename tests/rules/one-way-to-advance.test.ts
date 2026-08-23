import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R25 · ADR 0043 — il tempo di gioco avanza in un posto solo.
 *
 * **Il difetto che questa regola chiude è stato misurato, non immaginato.** Fino a
 * [D037](../../docs/delega/D037-il-tempo-che-avanza-e-un-operazione-del-gioco.md) lo store
 * chiamava `registry.tickAll` da **due** punti — il passo del loop e il recupero all'avvio — e le
 * due sequenze facevano cose diverse: la prima campionava le serie, la seconda no. Riaprire il
 * gioco dopo una notte faceva quindi passare fino a otto ore di gioco senza lasciare un campione
 * né una candela, e i tre grafici del cruscotto ripartivano vuoti come se non fosse successo
 * niente.
 *
 * È il difetto A01 — le liste parallele mantenute a mano — nella sua forma più corta: due
 * chiamanti della stessa cosa che divergono. Il Registry lo aveva chiuso **dentro** il gioco
 * ([ADR 0002](../../docs/adr/0002-registry-unica-lista-di-sistemi.md)); questa regola lo chiude al
 * piano di sopra, dove il gioco viene fatto avanzare.
 *
 * `Game.advance` è l'unica strada: ticchetta i sistemi e fa passare lo **stesso** `elapsed` sulla
 * cronaca. Chi domani vorrà un salvataggio a cadenza, il calendario dell'
 * [ADR 0023](../../docs/adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md) o un cheat che salta
 * un'ora, lo aggiunge lì — e nessun chiamante può dimenticarselo, perché di chiamanti ce n'è uno.
 *
 * **La regola guarda il renderer, non il kernel.** `tickAll` è del Registry ed è giusto che il
 * Registry lo definisca; è giusto che i test del kernel e del bilanciamento lo chiamino, perché
 * provano proprio quello. Ciò che non deve esistere è un **secondo** modo di far avanzare la
 * partita vera, e quello nasce solo dentro `src/renderer/`.
 *
 * ⚠️ **Un limite, dichiarato:** guarda il nome scritto nel sorgente. Chi volesse aggirarla
 * potrebbe raggiungere `registry['tick' + 'All']` da un altro file — ma quella non è la forma in
 * cui il difetto nasce davvero, che è una riga onesta scritta da chi non sapeva che ce n'era già
 * un'altra.
 */

/** L'unico file del renderer che ha il diritto di far avanzare il tempo di gioco. */
const ADVANCER = 'src/renderer/runtime/createGame.ts'

/** Il nome del metodo del Registry, chiamato o riferito. */
const TICK_ALL = /\btickAll\b/g

const normalize = (path: string): string => path.split(sep).join('/')

export const advancesIn = (source: string): string[] =>
  withoutComments(source).match(TICK_ALL) ?? []

const sources = sourceFiles('src/renderer', ['.ts', '.vue'])
  .map(normalize)
  .filter((path) => path !== ADVANCER)

describe('il rilevatore del secondo percorso', () => {
  it('riconosce una chiamata che fa avanzare la partita', () => {
    expect(advancesIn('game.registry.tickAll(game.ctx, step.elapsed)')).toEqual(['tickAll'])
    expect(advancesIn('registry.tickAll(ctx, elapsed)')).toEqual(['tickAll'])
  })

  it('non confonde un nome che lo contiene con il metodo', () => {
    expect(advancesIn('const tickAllowance = 3')).toEqual([])
    expect(advancesIn('system.tick?.(ctx, elapsed)')).toEqual([])
  })

  it('e non rende rosso il commento che spiega la regola', () => {
    // La stessa difesa che `withoutComments` dà a R15 e a R23: una regola deve poter nominare ciò
    // che vieta, o non può spiegare se stessa. Serve davvero — `stores/game.ts` e questo file
    // raccontano tutti e due il difetto chiamandolo per nome.
    expect(advancesIn('// il recupero chiamava tickAll per conto proprio')).toEqual([])
  })
})

describe('il tempo di gioco avanza in un posto solo', () => {
  it('e i file da guardare esistono', () => {
    expect(sources.length).toBeGreaterThan(0)
  })

  it('e il file che lo fa avanzare lo fa avanzare davvero', () => {
    // Senza questa riga la regola passerebbe anche il giorno in cui nessuno ticchetta più, che è
    // un modo di essere verdi senza voler dire niente.
    expect(advancesIn(read(ADVANCER))).toHaveLength(1)
  })

  for (const path of sources) {
    it(`${path} non fa avanzare il tempo per conto proprio`, () => {
      expect(advancesIn(read(path))).toEqual([])
    })
  }
})
