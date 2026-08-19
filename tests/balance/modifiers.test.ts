import { describe, expect, it } from 'vitest'

import { fromString } from '@core/contracts/money'

import type { Modifier, ModifierKind } from '@core/balance/modifiers'
import { createModifiers, DuplicateModifierError } from '@core/balance/modifiers'

/**
 * Il registro dei modificatori, e l'**unica** formula di composizione del progetto:
 * `(base + Σ add) × Π mult`.
 *
 * Due cose valgono più di tutto il resto qui. La prima è che gli `add` vengono sempre prima dei
 * `mult`, qualunque sia l'ordine in cui sono stati registrati: comporre in ordine di
 * registrazione darebbe risultati diversi a ogni partita, e nessuno se ne accorgerebbe guardando
 * i numeri. La seconda è che a parità di tipo l'ordine è per `id`, così il risultato non dipende
 * da chi ha chiamato `register` per primo — cioè dal bootstrap.
 */

const denaro = fromString

const modificatore = (
  id: string,
  kind: ModifierKind,
  valore: string,
  target = 'income.all'
): Modifier => ({ id, target, kind, value: denaro(valore) })

describe('la composizione', () => {
  it('senza modificatori ritorna la base', () => {
    const modifiers = createModifiers()

    expect(modifiers.compose('income.all', denaro('12')).toString()).toBe('12')
  })

  it('somma tutti gli add e moltiplica per tutti i mult', () => {
    const modifiers = createModifiers()
    modifiers.register(modificatore('a', 'add', '3'))
    modifiers.register(modificatore('b', 'add', '5'))
    modifiers.register(modificatore('c', 'mult', '2'))
    modifiers.register(modificatore('d', 'mult', '1.5'))

    // (12 + 3 + 5) × 2 × 1,5 = 60
    expect(modifiers.compose('income.all', denaro('12')).toString()).toBe('60')
  })

  it('gli add vengono prima dei mult anche se registrati dopo', () => {
    const modifiers = createModifiers()
    modifiers.register(modificatore('primo', 'mult', '2'))
    modifiers.register(modificatore('secondo', 'add', '8'))

    // (12 + 8) × 2 = 40, non (12 × 2) + 8 = 32
    expect(modifiers.compose('income.all', denaro('12')).toString()).toBe('40')
  })

  it('il risultato non dipende dall ordine di registrazione', () => {
    const crescente = createModifiers()
    crescente.register(modificatore('alfa', 'add', '3'))
    crescente.register(modificatore('mike', 'mult', '1.5'))
    crescente.register(modificatore('zulu', 'mult', '2'))

    const decrescente = createModifiers()
    decrescente.register(modificatore('zulu', 'mult', '2'))
    decrescente.register(modificatore('mike', 'mult', '1.5'))
    decrescente.register(modificatore('alfa', 'add', '3'))

    expect(decrescente.compose('income.all', denaro('12')).toString()).toBe(
      crescente.compose('income.all', denaro('12')).toString()
    )
  })

  it('un modificatore su un altro bersaglio non entra nel calcolo', () => {
    const modifiers = createModifiers()
    modifiers.register(modificatore('proprio', 'add', '8'))
    modifiers.register(modificatore('altrui', 'add', '1000', 'atm.fee'))

    expect(modifiers.compose('income.all', denaro('12')).toString()).toBe('20')
  })

  it('un bersaglio senza modificatori ritorna la base', () => {
    const modifiers = createModifiers()
    modifiers.register(modificatore('proprio', 'add', '8'))

    expect(modifiers.compose('atm.fee', denaro('2.5')).toString()).toBe('2.5')
  })
})

describe('il registro', () => {
  it('registrare due volte lo stesso id lancia', () => {
    const modifiers = createModifiers()
    modifiers.register(modificatore('income.upgrade.overtime', 'mult', '1.5'))

    expect(() =>
      modifiers.register(modificatore('income.upgrade.overtime', 'mult', '1.5'))
    ).toThrow(DuplicateModifierError)
  })

  it('il secondo tentativo non cambia nemmeno il risultato', () => {
    const modifiers = createModifiers()
    modifiers.register(modificatore('upgrade', 'mult', '1.5'))

    expect(() => modifiers.register(modificatore('upgrade', 'mult', '99'))).toThrow()
    expect(modifiers.compose('income.all', denaro('12')).toString()).toBe('18')
  })

  it('sourcesFor elenca le sorgenti del bersaglio, in ordine di id', () => {
    const modifiers = createModifiers()
    modifiers.register(modificatore('zulu', 'mult', '2'))
    modifiers.register(modificatore('alfa', 'add', '3'))
    modifiers.register(modificatore('mike', 'add', '1'))

    expect(modifiers.sourcesFor('income.all').map((sorgente) => sorgente.id)).toEqual([
      'alfa',
      'mike',
      'zulu'
    ])
  })

  it('sourcesFor non vede le sorgenti di un altro bersaglio', () => {
    const modifiers = createModifiers()
    modifiers.register(modificatore('proprio', 'add', '3'))
    modifiers.register(modificatore('altrui', 'add', '3', 'atm.fee'))

    expect(modifiers.sourcesFor('atm.fee').map((sorgente) => sorgente.id)).toEqual(['altrui'])
  })

  it('remove toglie il modificatore, e il valore torna alla base', () => {
    const modifiers = createModifiers()
    modifiers.register(modificatore('income.upgrade.overtime', 'mult', '1.5'))

    modifiers.remove('income.upgrade.overtime')

    expect(modifiers.compose('income.all', denaro('12')).toString()).toBe('12')
    expect(modifiers.sourcesFor('income.all')).toEqual([])
  })

  it('remove di un id che non c è non fa niente: azzerare due volte è lecito', () => {
    const modifiers = createModifiers()

    expect(() => modifiers.remove('mai-registrato')).not.toThrow()
  })

  it('dopo remove lo stesso id si può registrare di nuovo', () => {
    const modifiers = createModifiers()
    modifiers.register(modificatore('upgrade', 'mult', '1.5'))
    modifiers.remove('upgrade')

    expect(() => modifiers.register(modificatore('upgrade', 'mult', '1.5'))).not.toThrow()
    expect(modifiers.compose('income.all', denaro('12')).toString()).toBe('18')
  })

  it('due registri non condividono i modificatori', () => {
    const uno = createModifiers()
    const altro = createModifiers()
    uno.register(modificatore('upgrade', 'mult', '1.5'))

    expect(altro.compose('income.all', denaro('12')).toString()).toBe('12')
  })
})
