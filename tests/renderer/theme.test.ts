import { describe, expect, it } from 'vitest'

import { otherTheme, THEMES, themeOf } from '@renderer/ui/theme'

/**
 * D024 · ADR 0031 — le due funzioni pure di `theme.ts`, che sono tutto ciò che si può provare
 * senza un DOM.
 *
 * Il resto del file tocca `document` e `matchMedia`, e questo progetto ha rifiutato jsdom due volte
 * con il grilletto scritto nel registro YAGNI. La copertura è quindi **dichiaratamente parziale**:
 * l'attributo scritto sulla radice e l'ascolto della preferenza di sistema restano verificati a
 * occhio, e la definizione di fatto di D024 lo chiede apposta.
 *
 * Quello che si prova qui non è banale come sembra: che «l'altro tema» sia **totale** — ogni tema
 * ne ha uno, e non è se stesso — è la proprietà che rende l'interruttore un interruttore invece di
 * un pulsante che a volte non fa niente.
 */

describe('il tema', () => {
  it('quello di partenza è quello che il sistema chiede', () => {
    expect(themeOf(true)).toBe('dark')
    expect(themeOf(false)).toBe('light')
  })

  it('ce ne sono da guardare, altrimenti questo test non guarda niente', () => {
    expect(THEMES.length).toBeGreaterThan(1)
  })

  it('«l’altro» è sempre un tema vero, e non è quello di partenza', () => {
    for (const theme of THEMES) {
      expect(THEMES).toContain(otherTheme(theme))
      expect(otherTheme(theme)).not.toBe(theme)
    }
  })

  it('e premere due volte riporta dove si era', () => {
    for (const theme of THEMES) expect(otherTheme(otherTheme(theme))).toBe(theme)
  })
})
