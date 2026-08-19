import { describe, expect, it } from 'vitest'

import { importsOf, read, sourceFiles } from '../helpers/sources'

/**
 * INV-01 — `src/core/**` dipende solo da `decimal.js` (ADR 0015).
 *
 * `zod` vive nel main, `vue-i18n` nel renderer. Questa è una allowlist, e le allowlist non si
 * esprimono bene con `no-restricted-imports`: qui è un test, che dà anche un errore leggibile.
 * Il denylist speculare (vue, pinia, electron, I/O) è INV-02, in eslint.config.js.
 */

const ALLOWED = new Set(['decimal.js'])

const isExternal = (specifier: string): boolean =>
  !specifier.startsWith('.') && !specifier.startsWith('@core/')

/** Da 'decimal.js' e da 'decimal.js/foo' si risale allo stesso pacchetto. */
const packageOf = (specifier: string): string => {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? specifier)
}

const sources = sourceFiles('src/core')

describe('le dipendenze esterne di core/', () => {
  it("l'estrattore di import funziona", () => {
    const code = `import Decimal from 'decimal.js'\nimport { x } from './locale'\nexport { y } from '@core/contracts/result'\n`
    expect(importsOf(code)).toEqual(['decimal.js', './locale', '@core/contracts/result'])
  })

  it('il riconoscitore di pacchetto funziona', () => {
    expect(packageOf('decimal.js')).toBe('decimal.js')
    expect(packageOf('@vue/reactivity')).toBe('@vue/reactivity')
    expect(packageOf('node:fs')).toBe('node:fs')
  })

  it('sono solo quelle ammesse', () => {
    const found = new Set(
      sources
        .flatMap((f) => importsOf(read(f)))
        .filter(isExternal)
        .map(packageOf)
    )
    const forbidden = [...found].filter((p) => !ALLOWED.has(p))
    expect(forbidden).toEqual([])
  })
})
