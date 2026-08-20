/**
 * D023 · R14 · ADR 0028 — le uniche parole che il kit conosce.
 *
 * Sono **ruoli di colore**, non pool. `cash` e `card` si chiamano così perché così li chiama il
 * design, non perché questo file sappia che esiste un `Pool`: `ui/` non importa `@core`, e il ponte
 * fra un pool e il suo ruolo vive in `components/`, che il dominio lo conosce già. La prima
 * proprietà chiamata `pool` invece di `tone` è il momento in cui R14 muore.
 *
 * Gli elenchi esistono a runtime perché `tests/rules/ui-kit-is-standalone` li confronta con
 * `tokens.css`: un ruolo senza il suo token è rosso. È la stessa forma del Registry — una lista
 * sola, e un test che la confronta con la realtà invece di sperare che coincidano.
 */

export const COLOR_ROLES = [
  'ink',
  'ink-2',
  'ink-3',
  'accent',
  'gain',
  'loss',
  'heat',
  'cash',
  'card',
  'chip',
  'cryp'
] as const

export type ColorRole = (typeof COLOR_ROLES)[number]

export const TEXT_SIZES = ['micro', 'xs', 'sm', 'md', 'lg', 'xl'] as const

export type TextSize = (typeof TEXT_SIZES)[number]

/** I tre livelli di superficie che il design distingue davvero, dal fondo all'occhio. */
export const SURFACES = ['sunken', 'surface', 'raised'] as const

export type Surface = (typeof SURFACES)[number]

/**
 * Il nome del token, non il suo valore: un componente non deve mai avere in mano un colore. Che
 * ogni ruolo abbia il proprio token non è una speranza — lo verifica il test contro `tokens.css`.
 */
export const toneVar = (role: ColorRole): string => `var(--color-${role})`

export const sizeVar = (size: TextSize): string => `var(--text-${size})`

export const surfaceVar = (surface: Surface): string => `var(--color-${surface})`
