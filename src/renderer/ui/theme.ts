import type { ShallowRef } from 'vue'
import { shallowRef } from 'vue'

/**
 * D024 · ADR 0031 — quale tema è acceso, e come si cambia. Nient'altro.
 *
 * `tokens.css` dichiara i due temi con `light-dark()` e lascia scegliere a `color-scheme`; `:root`
 * porta lo scavalco `data-theme` fin dal giorno di D023, e finora nessuno lo scriveva. Questo file è
 * la mano che lo scrive.
 *
 * **La scelta non si ricorda**, ed è la decisione dell'ADR 0031: ricordarla vorrebbe dire
 * archiviarla, e questo progetto archivia in un posto solo — il salvataggio, che è del processo main
 * e contiene lo stato del gioco. Il colore del fondo non è stato del gioco.
 *
 * **Finché il giocatore non sceglie, il sistema operativo continua a decidere — anche mentre la
 * finestra è aperta.** È il comportamento di oggi e non va perso: senza l'ascolto qui sotto,
 * scrivere l'attributo all'avvio congelerebbe il tema al valore che aveva al momento del montaggio.
 * A dire se una scelta è stata fatta è l'attributo stesso, non un secondo indicatore da tenere
 * allineato.
 *
 * R14 vale anche qui: questo file conosce il DOM, non il gioco. La parola scritta sul pulsante
 * gliela passa `components/`, già tradotta.
 */

export const THEMES = ['light', 'dark'] as const

export type Theme = (typeof THEMES)[number]

/** Lo scavalco che `tokens.css` dichiara su `:root`, e l'unico posto in cui il nome è scritto. */
const ATTRIBUTE = 'data-theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/**
 * Cosa vuol dire la preferenza del sistema. Pura, quindi si prova senza un DOM — che è l'unica
 * verifica che questo file può offrire a un test, e la dichiara invece di fingere di più.
 */
export const themeOf = (prefersDark: boolean): Theme => (prefersDark ? 'dark' : 'light')

/** L'altro dei due. Con due temi «l'altro» è totale, e non c'è un caso che manchi. */
export const otherTheme = (theme: Theme): Theme => (theme === 'dark' ? 'light' : 'dark')

/**
 * Il valore di partenza è quello che [P2](../../../docs/prodotto/preferenze.md) dichiara
 * predefinito, e vive il tempo di una riga: `follow()` lo sostituisce prima che qualcuno lo legga.
 */
const theme = shallowRef<Theme>('light')

let watching = false

const root = (): HTMLElement => document.documentElement

/** Il sistema decide finché l'attributo non c'è. Quando c'è, ha deciso il giocatore. */
const follow = (): void => {
  if (root().hasAttribute(ATTRIBUTE)) return
  theme.value = themeOf(window.matchMedia(DARK_QUERY).matches)
}

const toggle = (): void => {
  const next = otherTheme(theme.value)
  theme.value = next
  root().setAttribute(ATTRIBUTE, next)
}

export interface ThemeSwitch {
  readonly theme: Readonly<ShallowRef<Theme>>
  readonly toggle: () => void
}

/**
 * Lo stato è di modulo e non di chiamata: due interruttori accesi insieme direbbero due cose
 * diverse, ed è la stessa ragione per cui il tema è un attributo sulla radice invece che una classe
 * su un componente.
 */
export const useTheme = (): ThemeSwitch => {
  if (!watching) {
    watching = true
    window.matchMedia(DARK_QUERY).addEventListener('change', follow)
  }
  follow()

  return { theme, toggle }
}
