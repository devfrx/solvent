import { describe, expect, it } from 'vitest'

import type { Cheat, CheatId } from '@core/contracts/cheats'
import { fromString } from '@core/contracts/money'
import { ok } from '@core/contracts/result'

import { createCheats, DuplicateCheatError, UnknownCheatError } from '@core/kernel/Cheats'

/**
 * D029 · R20 — il registro dei cheat, provato senza una partita.
 *
 * È il gemello di `tests/kernel/registry`, e come quello prova **il registro**, non ciò che ci
 * finisce dentro: qui i cheat sono finti apposta, perché un test che usasse quelli veri
 * verificherebbe due cose insieme e non direbbe quale delle due si è rotta.
 */

const money = fromString

/** Un cheat finto che scrive dove è passato: è l'unico modo di vedere *se* e *con cosa* è corso. */
const spy = (id: CheatId, seen: string[]): { readonly act: Cheat; readonly withAmount: Cheat } => ({
  act: {
    id,
    kind: 'act',
    run: () => {
      seen.push(`${id}:act`)
      return ok(undefined)
    }
  },
  withAmount: {
    id,
    kind: 'amount',
    amounts: [money('1000')],
    run: (amount) => {
      seen.push(`${id}:${amount.toString()}`)
      return ok(undefined)
    }
  }
})

describe('il registro dei cheat', () => {
  it('non ne conosce nessuno finché qualcuno non li dichiara', () => {
    // La proprietà che rende il registro universale: se nascesse con dei cheat dentro, sarebbe la
    // lista centrale scritta a mano che l'ADR 0002 esiste per non avere.
    expect(createCheats().all()).toEqual([])
  })

  it('li restituisce nell’ordine in cui sono stati registrati', () => {
    // Il pannello li disegna in questo ordine, quindi l'ordine è quello del bootstrap e non
    // dell'alfabeto: i cheat del denaro prima, poi i domini. Non è cosmesi — chi apre il pannello
    // cerca sempre prima gli stessi due.
    const seen: string[] = []
    const cheats = createCheats()

    cheats.register(spy('cheat.vault.max_level', seen).act)
    cheats.register(spy('cheat.ledger.grant_cash', seen).act, spy('cheat.income.boost', seen).act)

    expect(cheats.all().map((cheat) => cheat.id)).toEqual([
      'cheat.vault.max_level',
      'cheat.ledger.grant_cash',
      'cheat.income.boost'
    ])
  })

  it('consegna l’importo a chi lo vuole, e non a chi non lo vuole', () => {
    // Le due forme di `Cheat` esistono per questo, e il test è ciò che rende la distinzione vera
    // invece che decorativa: un `act` che ricevesse un importo lo ignorerebbe in silenzio, e il
    // giorno in cui qualcuno gliene passasse uno sbagliato non se ne accorgerebbe nessuno.
    const seen: string[] = []
    const cheats = createCheats()
    cheats.register(spy('cheat.ledger.grant_cash', seen).withAmount)
    cheats.register(spy('cheat.vault.max_level', seen).act)

    cheats.run('cheat.ledger.grant_cash', money('250'))
    cheats.run('cheat.vault.max_level', money('999'))

    expect(seen).toEqual(['cheat.ledger.grant_cash:250', 'cheat.vault.max_level:act'])
  })

  it('e a chi lo vuole senza riceverlo passa zero', () => {
    const seen: string[] = []
    const cheats = createCheats()
    cheats.register(spy('cheat.ledger.grant_cash', seen).withAmount)

    cheats.run('cheat.ledger.grant_cash')

    expect(seen).toEqual(['cheat.ledger.grant_cash:0'])
  })

  it('due dichiarazioni dello stesso id sono un programma scritto male: lancia', () => {
    // Non un `Result`: non c'è niente da spiegare a nessuno, c'è una riga da correggere. È la
    // stessa distinzione che il Ledger fa fra un esito di gioco e una transazione sbilanciata.
    const seen: string[] = []
    const cheats = createCheats()
    cheats.register(spy('cheat.ledger.grant_cash', seen).act)

    expect(() => cheats.register(spy('cheat.ledger.grant_cash', seen).act)).toThrow(
      DuplicateCheatError
    )
  })

  it('e un id che nessuno ha dichiarato pure', () => {
    expect(() => createCheats().run('cheat.vault.max_level')).toThrow(UnknownCheatError)
  })

  it('il rifiuto di un cheat torna al chiamante invece di essere ingoiato', () => {
    // Metà del motivo per cui il pannello esiste è **vedere** i rifiuti del gioco vero: un cheat
    // che nascondesse il proprio no sarebbe un pulsante che a volte non fa niente.
    const cheats = createCheats()
    cheats.register({
      id: 'cheat.ledger.grant_cash',
      kind: 'act',
      run: () => ({
        ok: false,
        error: {
          code: 'error.ledger.capacity_exceeded',
          pool: 'cash',
          capacity: money('1000'),
          fits: money('0')
        }
      })
    })

    const done = cheats.run('cheat.ledger.grant_cash')

    expect(done.ok).toBe(false)
    if (done.ok) return
    expect(done.error.code).toBe('error.ledger.capacity_exceeded')
  })
})
