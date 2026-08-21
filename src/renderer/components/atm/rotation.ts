/**
 * La matematica della carta che gira. Pura, e in un `.ts` invece che dentro il componente per la
 * stessa ragione per cui `createTranslator` è uscito dal composable in D012: è l'unica parte
 * davvero sbagliabile della carta, e così si prova senza montare niente — cioè senza jsdom e senza
 * `@vue/test-utils`, che sono due dipendenze e un ADR (docs/roadmap-fette.md).
 *
 * Il componente resta ciò che deve essere: aggancia tre gestori del puntatore, chiama queste
 * funzioni e scrive un `transform`. Nessun `Decimal`, nessun calcolo di gioco (R05).
 */

/** I gradi sui due assi. `y` gira la carta, `x` la inclina verso chi guarda. */
export interface Rotation {
  readonly x: number
  readonly y: number
}

export type Face = 'front' | 'back'

/** Quanti gradi vale un pixel di trascinamento. Sotto, la carta sembra incollata al tavolo. */
const DEGREES_PER_PIXEL_ACROSS = 0.6
const DEGREES_PER_PIXEL_DOWN = 0.35

/** L'inclinazione si ferma: oltre, la carta si vede di taglio e sparisce. */
const TILT_LIMIT = 28

/**
 * Sotto questa distanza il gesto non è un trascinamento ma un clic secco, e un clic secco gira la
 * carta. Senza questa soglia la carta si girerebbe solo a chi ha la pazienza di trascinarla oltre
 * i novanta gradi, e il retro — che è la metà utile — resterebbe una cosa che quasi nessuno vede.
 */
const TAP_TRAVEL = 6

const HALF_TURN = 180
const FULL_TURN = 360

/** Oltre un quarto di giro dal mezzo giro, chi guarda vede l'altra faccia. */
const QUARTER_TURN = 90

/**
 * Le due posizioni di riposo. Il fronte non è dritto ma leggermente girato: una carta perfettamente
 * frontale sembra un'immagine, una carta di tre quarti sembra un oggetto — ed è l'unico oggetto
 * che il giocatore possiede davvero (P5).
 */
const RESTING: Readonly<Record<Face, Rotation>> = {
  front: { x: 6, y: -14 },
  back: { x: -4, y: HALF_TURN }
}

export const restingAt = (face: Face): Rotation => RESTING[face]

const clamp = (value: number, limit: number): number => Math.max(-limit, Math.min(limit, value))

/** Dove finisce la carta trascinata di `across` e `down` pixel a partire da `from`. */
export const draggedTo = (from: Rotation, across: number, down: number): Rotation => ({
  x: clamp(from.x - down * DEGREES_PER_PIXEL_DOWN, TILT_LIMIT),
  y: from.y + across * DEGREES_PER_PIXEL_ACROSS
})

/**
 * Quale faccia sta guardando chi guarda. Il modulo è scritto due volte perché in JavaScript il
 * resto di un negativo è negativo: `-200 % 360` è `-200`, non `160`, e senza il secondo giro una
 * carta trascinata all'indietro mostrerebbe la faccia sbagliata.
 */
export const facing = (rotation: Rotation): Face => {
  const turned = ((rotation.y % FULL_TURN) + FULL_TURN) % FULL_TURN
  return Math.abs(turned - HALF_TURN) < QUARTER_TURN ? 'back' : 'front'
}

const opposite = (face: Face): Face => (face === 'front' ? 'back' : 'front')

/**
 * Su quale faccia la carta si ferma quando la si lascia. Un clic secco gira; un trascinamento vero
 * lascia la carta dalla parte verso cui è stata portata, che è ciò che rende il gesto un gesto e
 * non un interruttore.
 */
export const releasedOn = (face: Face, rotation: Rotation, travelled: number): Face =>
  travelled < TAP_TRAVEL ? opposite(face) : facing(rotation)

/** Il `transform` CSS. È l'unica cosa che il componente scrive, e non decide niente. */
export const transformOf = (rotation: Rotation): string =>
  `rotateX(${String(rotation.x)}deg) rotateY(${String(rotation.y)}deg)`
