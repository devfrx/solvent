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

const PASSO = 0x6d2b79f5
const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193
const DUE_ALLA_32 = 0x100000000

/** FNV-1a a 32 bit. Serve solo a dare a ogni stream un seme suo, deterministico e scorrelato. */
const impronta = (testo: string): number => {
  let h = FNV_OFFSET
  for (let i = 0; i < testo.length; i += 1) {
    h ^= testo.charCodeAt(i)
    h = Math.imul(h, FNV_PRIME)
  }
  return h | 0
}

const semeDi = (seme: number, id: string): number => impronta(`${id}#${seme}`)

/**
 * mulberry32, trascritto com'è pubblicato: un algoritmo copiato esatto si verifica, uno
 * "riordinato" no.
 *
 * Lo stato interno avanza di `PASSO` a ogni estrazione, quindi da `(seme, cursore)` si ricava
 * senza rigiocare la sequenza. È la ragione per cui il caricamento è istantaneo invece che O(n),
 * e per cui lo stato salvato sono due numeri e non un buffer.
 */
const estrai = (seme: number, cursore: number): number => {
  let t = (seme + Math.imul(cursore + 1, PASSO)) | 0
  t = Math.imul(t ^ (t >>> 15), 1 | t)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / DUE_ALLA_32
}

export interface Stream {
  /** Un numero in `[0, 1)`. */
  readonly next: () => number
}

export interface Rng {
  readonly stream: (id: string) => Stream
  readonly save: () => RngSave
  readonly load: (stato: RngSave) => void
  readonly reset: (seme: number) => void
}

/**
 * L'unico punto del progetto in cui la casualità non è riproducibile: il seme di una partita
 * nuova. Da lì in poi tutto è determinato, salvataggio incluso.
 */
export const seedCasuale = (): number => {
  // eslint-disable-next-line no-restricted-properties -- il seed di una partita nuova (ADR 0005)
  return (Math.random() * DUE_ALLA_32) | 0
}

export const createRng = (seme: number): Rng => {
  let semeCorrente = seme | 0
  const cursori = new Map<string, number>()

  return {
    stream: (id) => ({
      next: () => {
        const cursore = cursori.get(id) ?? 0
        cursori.set(id, cursore + 1)
        return estrai(semeDi(semeCorrente, id), cursore)
      }
    }),

    save: () => ({ seed: semeCorrente, cursors: Object.fromEntries(cursori) }),

    load: (stato) => {
      semeCorrente = stato.seed | 0
      cursori.clear()
      for (const [id, cursore] of Object.entries(stato.cursors)) cursori.set(id, cursore)
    },

    reset: (nuovoSeme) => {
      semeCorrente = nuovoSeme | 0
      cursori.clear()
    }
  }
}
