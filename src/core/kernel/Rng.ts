import type { RngSave } from '@core/contracts/save'

/**
 * R03 · ADR 0005 — un solo PRNG seedato, con stream indipendenti per dominio.
 *
 * Il difetto A03 erano 176 `Math.random` diretti: save-scum banale, bilanciamento non
 * riproducibile, nessun test di dominio deterministico. Qui la casualità ha una sorgente sola, e
 * il suo stato — un seme più un cursore per stream — entra nel salvataggio.
 *
 * Gli stream sono separati perché aggiungere una chiamata dentro un sistema non deve spostare la
 * sequenza di tutti gli altri: senza, ogni test di bilanciamento cambierebbe risultato per una
 * modifica non correlata.
 *
 * Superficie minima: `next()`. `int`, `pick` e `chance` hanno un grilletto in
 * docs/roadmap-fette.md, ed è il primo sistema che ne ha bisogno davvero.
 */

const STEP = 0x6d2b79f5
const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193
const TWO_POW_32 = 0x100000000

/** FNV-1a a 32 bit. Serve solo a dare a ogni stream un seme suo, deterministico e scorrelato. */
const fingerprint = (text: string): number => {
  let h = FNV_OFFSET
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, FNV_PRIME)
  }
  return h | 0
}

const seedFor = (seed: number, id: string): number => fingerprint(`${id}#${seed}`)

/**
 * mulberry32, trascritto com'è pubblicato: un algoritmo copiato esatto si verifica, uno
 * "riordinato" no.
 *
 * Lo stato interno avanza di `STEP` a ogni estrazione, quindi da `(seme, cursore)` si ricava
 * senza rigiocare la sequenza. È la ragione per cui il caricamento è istantaneo invece che O(n),
 * e per cui lo stato salvato sono due numeri e non un buffer.
 */
const draw = (seed: number, cursor: number): number => {
  let t = (seed + Math.imul(cursor + 1, STEP)) | 0
  t = Math.imul(t ^ (t >>> 15), 1 | t)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / TWO_POW_32
}

export interface Stream {
  /** Un numero in `[0, 1)`. */
  readonly next: () => number
}

export interface Rng {
  readonly stream: (id: string) => Stream
  readonly save: () => RngSave
  readonly load: (state: RngSave) => void
  readonly reset: (seed: number) => void
}

/**
 * L'unico punto del progetto in cui la casualità non è riproducibile: il seme di una partita
 * nuova. Da lì in poi tutto è determinato, salvataggio incluso.
 */
export const randomSeed = (): number => {
  // eslint-disable-next-line no-restricted-properties -- il seed di una partita nuova (ADR 0005)
  return (Math.random() * TWO_POW_32) | 0
}

export const createRng = (seed: number): Rng => {
  let currentSeed = seed | 0
  const cursors = new Map<string, number>()

  return {
    stream: (id) => ({
      next: () => {
        const cursor = cursors.get(id) ?? 0
        cursors.set(id, cursor + 1)
        return draw(seedFor(currentSeed, id), cursor)
      }
    }),

    save: () => ({ seed: currentSeed, cursors: Object.fromEntries(cursors) }),

    load: (state) => {
      currentSeed = state.seed | 0
      cursors.clear()
      for (const [id, cursor] of Object.entries(state.cursors)) cursors.set(id, cursor)
    },

    reset: (newSeed) => {
      currentSeed = newSeed | 0
      cursors.clear()
    }
  }
}
