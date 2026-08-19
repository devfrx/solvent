import { describe, expect, it } from 'vitest'

import { fileSorgente, importDi, leggi } from '../helpers/sorgenti'

/**
 * INV-01 — `src/core/**` dipende solo da `decimal.js` (ADR 0015).
 *
 * `zod` vive nel main, `vue-i18n` nel renderer. Questa è una allowlist, e le allowlist non si
 * esprimono bene con `no-restricted-imports`: qui è un test, che dà anche un errore leggibile.
 * Il denylist speculare (vue, pinia, electron, I/O) è INV-02, in eslint.config.js.
 */

const AMMESSE = new Set(['decimal.js'])

const esterna = (specificatore: string): boolean =>
  !specificatore.startsWith('.') && !specificatore.startsWith('@core/')

/** Da 'decimal.js' e da 'decimal.js/foo' si risale allo stesso pacchetto. */
const pacchettoDi = (specificatore: string): string => {
  const parti = specificatore.split('/')
  return specificatore.startsWith('@') ? parti.slice(0, 2).join('/') : (parti[0] ?? specificatore)
}

const sorgenti = fileSorgente('src/core')

describe('le dipendenze esterne di core/', () => {
  it("l'estrattore di import funziona", () => {
    const codice = `import Decimal from 'decimal.js'\nimport { x } from './locale'\nexport { y } from '@core/contracts/result'\n`
    expect(importDi(codice)).toEqual(['decimal.js', './locale', '@core/contracts/result'])
  })

  it('il riconoscitore di pacchetto funziona', () => {
    expect(pacchettoDi('decimal.js')).toBe('decimal.js')
    expect(pacchettoDi('@vue/reactivity')).toBe('@vue/reactivity')
    expect(pacchettoDi('node:fs')).toBe('node:fs')
  })

  it('sono solo quelle ammesse', () => {
    const trovate = new Set(
      sorgenti
        .flatMap((f) => importDi(leggi(f)))
        .filter(esterna)
        .map(pacchettoDi)
    )
    const vietate = [...trovate].filter((p) => !AMMESSE.has(p))
    expect(vietate).toEqual([])
  })
})
