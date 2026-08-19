import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { importsOf, read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R05 · A09 · ADR 0001 — nessuna logica di dominio dentro un `.vue`.
 *
 * Il difetto A09 non è nato come orchestrazione: è nato come «due righe per collegare le cose»
 * dentro una `PrestigeView.vue`, ed è finito con il rebirth che decideva quanto denaro si muove da
 * dentro un componente. Il confine è quello: _se il componente decide quanto denaro si muove, sta
 * facendo dominio._
 *
 * A imporlo è ESLint, e questo test è il **backstop**: la regola di lint vive in un file che
 * qualcuno può indebolire, e `tests/rules/lint-rules` verifica che scatti ma non che sia ancora
 * puntata su tutto ciò che conta. Qui si guarda il risultato — cosa i `.vue` importano davvero —
 * che è la domanda a cui serve rispondere.
 */

/**
 * Le cartelle intere che un componente non può nominare, con l'alias e per percorso relativo.
 * `core/contracts` **non** è qui, e non è una dimenticanza: un componente che mostra i pool li
 * legge da `POOLS`, che sono dati dichiarati, non regole da eseguire.
 */
const FORBIDDEN_FOLDERS = ['core/kernel/', 'core/balance/']

/** Dentro un dominio, i tre file che contengono decisioni. `types.ts` non è fra questi. */
const FORBIDDEN_DOMAIN_FILES = ['/rules', '/commands', '/system']

const RANDOM = /\bMath\s*\.\s*random\b/

const normalize = (path: string): string => path.split(sep).join('/')

const components = sourceFiles('src', ['.vue']).map(normalize)

const isForbidden = (specifier: string): boolean =>
  FORBIDDEN_FOLDERS.some((folder) => specifier.includes(folder)) ||
  (specifier.includes('domains/') &&
    FORBIDDEN_DOMAIN_FILES.some((file) => specifier.endsWith(file)))

const forbiddenIn = (source: string): string[] => importsOf(source).filter(isForbidden)

describe('il rilevatore', () => {
  it('prende un import del kernel e uno delle regole di un dominio', () => {
    expect(forbiddenIn(`import { clock } from '@core/kernel/Clock'`)).toEqual([
      '@core/kernel/Clock'
    ])
    expect(forbiddenIn(`import { upgradeCost } from '@core/domains/income/rules'`)).toEqual([
      '@core/domains/income/rules'
    ])
    expect(forbiddenIn(`import { BALANCE } from '@core/balance/constants'`)).toEqual([
      '@core/balance/constants'
    ])
  })

  it('lascia passare i contratti, che sono dati e non regole', () => {
    expect(forbiddenIn(`import { POOLS } from '@core/contracts/pools'`)).toEqual([])
    expect(forbiddenIn(`import type { CommandHandler } from '@core/contracts/commands'`)).toEqual(
      []
    )
    expect(forbiddenIn(`import { useGameStore } from '@renderer/stores/game'`)).toEqual([])
  })

  it('prende la casualità scritta a mano, comunque sia spaziata', () => {
    expect(RANDOM.test('const roll = Math.random()')).toBe(true)
    expect(RANDOM.test('const roll = Math . random ()')).toBe(true)
    expect(RANDOM.test('const randomised = pick(list)')).toBe(false)
  })
})

describe('i componenti', () => {
  it('ce ne sono da guardare, altrimenti questo test non guarda niente', () => {
    expect(components.length).toBeGreaterThan(2)
  })

  it('nessuno importa il kernel, il bilanciamento o le regole di un dominio', () => {
    const offenders = components.flatMap((file) =>
      forbiddenIn(read(file)).map((specifier) => `${file}: ${specifier}`)
    )

    expect(offenders).toEqual([])
  })

  it('nessuno estrae un numero a caso: la casualità passa solo da Rng (R03)', () => {
    const offenders = components.filter((file) => RANDOM.test(withoutComments(read(file))))

    expect(offenders).toEqual([])
  })
})
