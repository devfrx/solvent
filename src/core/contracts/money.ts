import Decimal from 'decimal.js'

/**
 * R11 · ADR 0006 — il denaro è `Decimal` dal primo all'ultimo passaggio.
 *
 * La regola è gratis: `Decimal` è una classe, quindi TypeScript rifiuta da solo un `number` dove
 * serve `Money`, e rifiuta anche `a + b` e `a * b`. Il costo accettato è scrivere `a.plus(b)`.
 *
 * Questo è l'unico file di confine: `fromNumber` e `toDisplayNumber` sono le **uniche**
 * conversioni del progetto, e il lint le vieta sotto `src/core/domains/**` — le conversioni
 * stanno al livello di presentazione, mai in mezzo a una catena economica (difetto A11).
 */
export type Money = Decimal

export const ZERO: Money = new Decimal(0)

/** Il denaro attraversa il confine di persistenza come stringa decimale (INV-04). */
export const fromString = (valore: string): Money => new Decimal(valore)

export const toString = (denaro: Money): string => denaro.toString()

export const fromNumber = (valore: number): Money => new Decimal(valore)

export const toDisplayNumber = (denaro: Money): number => denaro.toNumber()
