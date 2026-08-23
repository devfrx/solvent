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
 * D038 — quanto è **forte** un'azione. Non è una tavolozza di gusti: ognuna di queste quattro è
 * disegnata da almeno due componenti diversi, che è il criterio con cui un pezzo entra nel kit
 * ([D023](../../../docs/delega/D023-il-design-system.md)).
 *
 * - `primary` — piena, di accento. L'azione della schermata.
 * - `quiet` — solo contorno. Un'azione che c'è ma non è il punto.
 * - `raised` — su una superficie sollevata. Una scorciatoia accanto a ciò su cui agisce.
 * - `bare` — nessun contorno finché non la si tocca. Le voci di una colonna, un interruttore.
 */
export const BUTTON_VARIANTS = ['primary', 'quiet', 'raised', 'bare'] as const

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

/**
 * D038 — quale **scatola**. La misura porta con sé il raggio e la spaziatura, perché nel disegno
 * variano insieme: una scorciatoia inline è una pillola, l'azione di una colonna è un rettangolo.
 *
 * - `md` — il rettangolo che riempie la colonna. L'azione della schermata.
 * - `sm` — la riga larga quanto la colonna, allineata a sinistra, con posto per un'icona.
 * - `chip` — la pillola inline, per una scorciatoia.
 * - `icon` — il disco con un glifo solo, e l'etichetta diventa il nome per chi non lo vede.
 */
export const BUTTON_SIZES = ['md', 'sm', 'chip', 'icon'] as const

export type ButtonSize = (typeof BUTTON_SIZES)[number]

/**
 * Il nome del token, non il suo valore: un componente non deve mai avere in mano un colore. Che
 * ogni ruolo abbia il proprio token non è una speranza — lo verifica il test contro `tokens.css`.
 */
export const toneVar = (role: ColorRole): string => `var(--color-${role})`

export const sizeVar = (size: TextSize): string => `var(--text-${size})`

export const surfaceVar = (surface: Surface): string => `var(--color-${surface})`
