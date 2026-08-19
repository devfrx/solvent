import { describe, expect, it } from 'vitest'

import {
  fromNumber,
  fromString,
  toDisplayNumber,
  toString,
  ZERO,
  type Money
} from '@core/contracts/money'

/**
 * R11 · ADR 0006 — il denaro è `Decimal` end-to-end.
 *
 * Il difetto A11 era una pipeline che mescolava `number` e `Decimal`: bastava un passaggio
 * intermedio per perdere precisione, e la firma delle funzioni non lo mostrava.
 */
describe('Money', () => {
  it('ZERO è zero', () => {
    expect(toString(ZERO)).toBe('0')
  })

  it('andata e ritorno con la stringa non perde nulla', () => {
    const grande = '123456789012345678.90123456789'
    expect(toString(fromString(grande))).toBe(grande)
  })

  it('0,1 più 0,2 fa esattamente 0,3', () => {
    expect(toString(fromString('0.1').plus(fromString('0.2')))).toBe('0.3')
    // La stessa somma in virgola mobile: è il difetto che Decimal esiste per togliere.
    expect(0.1 + 0.2).not.toBe(0.3)
  })

  it('un number non è assegnabile a Money', () => {
    // @ts-expect-error — R11: Money è Decimal, e una classe non accetta un number (ADR 0006)
    const denaro: Money = 5
    expect(denaro).toBe(5)
  })

  it('due Money non si sommano con `+`: la regola è gratis', () => {
    const a = fromString('1')
    const b = fromString('2')
    // @ts-expect-error — R11: `+` non è definito su Decimal, si scrive a.plus(b) (ADR 0006)
    const sbagliata: unknown = a + b

    expect(toString(a.plus(b))).toBe('3')
    // Senza il rifiuto del compilatore, questo sarebbe finito in un saldo.
    expect(sbagliata).toBe('12')
  })

  it('le conversioni di confine esistono, e sono queste due', () => {
    expect(toString(fromNumber(12.5))).toBe('12.5')
    expect(toDisplayNumber(fromString('12.5'))).toBe(12.5)
  })
})
