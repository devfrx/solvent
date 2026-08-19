import { describe, expect, it } from 'vitest'

import type { ResetScope } from '@core/contracts/lifecycle'

import { createBus } from '@core/kernel/Bus'
import { clock, ticks } from '@core/kernel/Clock'
import { createLedger } from '@core/kernel/Ledger'
import type { SystemContext } from '@core/kernel/Registry'
import { createRegistry, defineSystem, DuplicateSystemError, ORDER } from '@core/kernel/Registry'
import { createRng } from '@core/kernel/Rng'

/**
 * R02 · A01 · ADR 0002 — una lista sola, cinque operazioni.
 *
 * Il difetto A01 erano cinque liste parallele (tick, save, load, reset, stats): aggiungere un
 * sistema voleva dire cinque modifiche coordinate, e quella dimenticata — quasi sempre `reset` —
 * falliva in silenzio fino al primo prestige. Qui le cinque operazioni iterano lo stesso array, e
 * i test lo verificano registrando **una volta** e chiedendo tutte e cinque le cose.
 */

const contesto = (): SystemContext => {
  const bus = createBus()
  return { clock, rng: createRng(1), bus, ledger: createLedger(bus) }
}

const UN_TICK = ticks(1)

/** Un sistema con stato: conta i tick ricevuti e sa salvarli, ricaricarli e azzerarli. */
const contatore = (id: string, order: number) => {
  let visti = 0
  let ultimoScope: ResetScope | null = null

  return {
    sistema: defineSystem({
      id,
      order,
      tick: (_ctx: SystemContext, quanti: typeof UN_TICK) => {
        visti += quanti
      },
      save: () => ({ visti }),
      load: (stato: { visti: number }) => {
        visti = stato.visti
      },
      reset: (scope: ResetScope) => {
        visti = 0
        ultimoScope = scope
      },
      stats: () => ({ visti })
    }),
    visti: () => visti,
    ultimoScope: () => ultimoScope
  }
}

describe('l ordine dei sistemi', () => {
  it('è quello di order, non quello di registrazione', () => {
    const registry = createRegistry()
    registry.register(defineSystem({ id: 'terzo', order: 300 }))
    registry.register(defineSystem({ id: 'primo', order: 100 }))
    registry.register(defineSystem({ id: 'secondo', order: 200 }))

    expect(registry.systems().map((s) => s.id)).toEqual(['primo', 'secondo', 'terzo'])
  })

  it('a parità di order è per id, non a caso', () => {
    const registry = createRegistry()
    registry.register(defineSystem({ id: 'zulu', order: ORDER.INCOME }))
    registry.register(defineSystem({ id: 'alfa', order: ORDER.INCOME }))
    registry.register(defineSystem({ id: 'mike', order: ORDER.INCOME }))

    expect(registry.systems().map((s) => s.id)).toEqual(['alfa', 'mike', 'zulu'])
  })

  it('i tick girano in quell ordine', () => {
    const registry = createRegistry()
    const traccia: string[] = []
    registry.register(defineSystem({ id: 'dopo', order: 200, tick: () => traccia.push('dopo') }))
    registry.register(defineSystem({ id: 'prima', order: 100, tick: () => traccia.push('prima') }))

    registry.tickAll(contesto(), UN_TICK)

    expect(traccia).toEqual(['prima', 'dopo'])
  })
})

describe('registrare', () => {
  it('un id già presente lancia, e l errore dice quale', () => {
    const registry = createRegistry()
    registry.register(defineSystem({ id: 'income', order: ORDER.INCOME }))

    expect(() => registry.register(defineSystem({ id: 'income', order: ORDER.ECONOMY }))).toThrow(
      DuplicateSystemError
    )
    expect(() => registry.register(defineSystem({ id: 'income', order: ORDER.ECONOMY }))).toThrow(
      'income'
    )
  })

  it('il duplicato non entra nella lista', () => {
    const registry = createRegistry()
    registry.register(defineSystem({ id: 'income', order: ORDER.INCOME }))
    try {
      registry.register(defineSystem({ id: 'income', order: ORDER.INCOME }))
    } catch {
      // l'errore è già coperto dal caso sopra: qui conta solo che la lista non sia cresciuta
    }

    expect(registry.systems()).toHaveLength(1)
  })
})

describe('tickAll', () => {
  it('consegna a ogni sistema il contesto e il numero di tick', () => {
    const registry = createRegistry()
    const uno = contatore('uno', ORDER.INCOME)
    registry.register(uno.sistema)

    registry.tickAll(contesto(), ticks(7))

    expect(uno.visti()).toBe(7)
  })

  it('salta i sistemi senza tick invece di lanciare', () => {
    const registry = createRegistry()
    registry.register(defineSystem({ id: 'muto', order: ORDER.INCOME }))

    expect(() => registry.tickAll(contesto(), UN_TICK)).not.toThrow()
  })

  it('senza sistemi non lancia', () => {
    expect(() => createRegistry().tickAll(contesto(), UN_TICK)).not.toThrow()
  })
})

describe('saveAll', () => {
  it('produce una chiave per ogni sistema con stato, e solo per quelli', () => {
    const registry = createRegistry()
    const uno = contatore('uno', ORDER.INCOME)
    const due = contatore('due', ORDER.INCOME)
    registry.register(uno.sistema)
    registry.register(due.sistema)
    registry.register(defineSystem({ id: 'senza-stato', order: ORDER.ECONOMY, tick: () => {} }))

    registry.tickAll(contesto(), ticks(3))

    expect(registry.saveAll()).toEqual({ uno: { visti: 3 }, due: { visti: 3 } })
  })

  it('un sistema con stato non può sparire dal salvataggio', () => {
    const registry = createRegistry()
    const conStato = ['a', 'b', 'c'].map((id) => contatore(id, ORDER.INCOME))
    for (const c of conStato) registry.register(c.sistema)

    expect(Object.keys(registry.saveAll()).sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('loadAll', () => {
  it('consegna a ogni sistema il proprio stato', () => {
    const registry = createRegistry()
    const uno = contatore('uno', ORDER.INCOME)
    const due = contatore('due', ORDER.INCOME)
    registry.register(uno.sistema)
    registry.register(due.sistema)

    const esito = registry.loadAll({ uno: { visti: 10 }, due: { visti: 20 } })

    expect(esito).toEqual({ ok: true, value: { ignored: [] } })
    expect(uno.visti()).toBe(10)
    expect(due.visti()).toBe(20)
  })

  /** Un sistema rimosso in una versione nuova non deve impedire di aprire una partita vecchia. */
  it('un id sconosciuto non lancia: torna ok con l elenco degli ignorati', () => {
    const registry = createRegistry()
    const uno = contatore('uno', ORDER.INCOME)
    registry.register(uno.sistema)

    const esito = registry.loadAll({ uno: { visti: 5 }, sparito: { qualunque: 1 } })

    expect(esito).toEqual({ ok: true, value: { ignored: ['sparito'] } })
    expect(uno.visti()).toBe(5)
  })

  it('un id noto ma assente dal salvataggio resta allo stato iniziale', () => {
    const registry = createRegistry()
    const uno = contatore('uno', ORDER.INCOME)
    const nuovo = contatore('nuovo', ORDER.INCOME)
    registry.register(uno.sistema)
    registry.register(nuovo.sistema)

    const esito = registry.loadAll({ uno: { visti: 4 } })

    expect(esito).toEqual({ ok: true, value: { ignored: [] } })
    expect(uno.visti()).toBe(4)
    expect(nuovo.visti()).toBe(0)
  })

  it('non consegna nulla ai sistemi senza stato', () => {
    const registry = createRegistry()
    registry.register(defineSystem({ id: 'senza-stato', order: ORDER.ECONOMY }))

    expect(registry.loadAll({ 'senza-stato': { visti: 1 } })).toEqual({
      ok: true,
      value: { ignored: ['senza-stato'] }
    })
  })

  /**
   * Lo stato dei sistemi è opaco per il contratto di salvataggio, quindi lo schema del main non
   * può verificarne la forma: un salvataggio manomesso arriva fin qui. Un `load` che lancia è un
   * esito, non un crollo — chi chiama va nello stato Errore e offre partita nuova.
   */
  it('un load che lancia diventa un errore, non un crollo', () => {
    const registry = createRegistry()
    registry.register(
      defineSystem({
        id: 'rotto',
        order: ORDER.INCOME,
        save: () => 0,
        load: () => {
          throw new Error('stato illeggibile')
        },
        reset: () => {}
      })
    )

    const esito = registry.loadAll({ rotto: 'non è quello che mi aspettavo' })

    expect(esito).toEqual({
      ok: false,
      error: {
        code: 'error.registry.load_failed',
        id: 'rotto',
        cause: expect.any(Error)
      }
    })
  })
})

describe('resetAll', () => {
  it('azzera ogni sistema con stato e gli passa l ambito', () => {
    const registry = createRegistry()
    const uno = contatore('uno', ORDER.INCOME)
    const due = contatore('due', ORDER.INCOME)
    registry.register(uno.sistema)
    registry.register(due.sistema)
    registry.tickAll(contesto(), ticks(9))

    registry.resetAll('hard')

    expect([uno.visti(), due.visti()]).toEqual([0, 0])
    expect([uno.ultimoScope(), due.ultimoScope()]).toEqual(['hard', 'hard'])
  })

  it('soft e hard arrivano al sistema come sono: la scelta è sua', () => {
    const registry = createRegistry()
    const uno = contatore('uno', ORDER.INCOME)
    registry.register(uno.sistema)

    registry.resetAll('soft')

    expect(uno.ultimoScope()).toBe('soft')
  })
})

describe('statsAll', () => {
  it('raccoglie da chi ha stats e ignora chi non ne ha', () => {
    const registry = createRegistry()
    const uno = contatore('uno', ORDER.INCOME)
    registry.register(uno.sistema)
    registry.register(defineSystem({ id: 'muto', order: ORDER.ECONOMY, tick: () => {} }))
    registry.tickAll(contesto(), ticks(2))

    expect(registry.statsAll()).toEqual({ uno: { visti: 2 } })
  })
})

describe('il tipo System', () => {
  it('un sistema con save e senza reset non compila', () => {
    // @ts-expect-error — A06: il contratto asimmetrico è invisibile fino al primo prestige
    const rotto = defineSystem({
      id: 'rotto',
      order: ORDER.INCOME,
      save: () => 1,
      load: (n: number) => String(n)
    })

    expect(rotto.id).toBe('rotto')
  })

  it('un sistema senza save che dichiara load non compila', () => {
    // @ts-expect-error — load senza save è uno stato che si carica e non si salva mai
    const rotto = defineSystem({
      id: 'rotto',
      order: ORDER.INCOME,
      load: (n: number) => String(n)
    })

    expect(rotto.id).toBe('rotto')
  })

  it('un sistema senza save che dichiara reset non compila', () => {
    // @ts-expect-error — reset senza save azzera qualcosa che il Registry non sa salvare
    const rotto = defineSystem({
      id: 'rotto',
      order: ORDER.INCOME,
      reset: () => {}
    })

    expect(rotto.id).toBe('rotto')
  })
})

describe('ORDER', () => {
  it('le fasi sono in ordine crescente e distinte', () => {
    const valori = Object.values(ORDER)

    expect([...valori].sort((a, b) => a - b)).toEqual(valori)
    expect(new Set(valori).size).toBe(valori.length)
  })

  it('lascia spazio fra una fase e l altra per infilarne una nuova', () => {
    const valori = Object.values(ORDER)
    const distanze = valori.slice(1).map((v, i) => v - (valori[i] ?? 0))

    for (const distanza of distanze) expect(distanza).toBeGreaterThanOrEqual(100)
  })
})
