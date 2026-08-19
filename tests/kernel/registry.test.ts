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

const context = (): SystemContext => {
  const bus = createBus()
  return { clock, rng: createRng(1), bus, ledger: createLedger(bus) }
}

const ONE_TICK = ticks(1)

/** Un sistema con stato: conta i tick ricevuti e sa salvarli, ricaricarli e azzerarli. */
const counter = (id: string, order: number) => {
  let seen = 0
  let lastScope: ResetScope | null = null

  return {
    system: defineSystem({
      id,
      order,
      tick: (_ctx: SystemContext, elapsed: typeof ONE_TICK) => {
        seen += elapsed
      },
      save: () => ({ seen }),
      load: (state: { seen: number }) => {
        seen = state.seen
      },
      reset: (scope: ResetScope) => {
        seen = 0
        lastScope = scope
      },
      stats: () => ({ seen })
    }),
    seen: () => seen,
    lastScope: () => lastScope
  }
}

describe('l ordine dei sistemi', () => {
  it('è quello di order, non quello di registrazione', () => {
    const registry = createRegistry()
    registry.register(defineSystem({ id: 'third', order: 300 }))
    registry.register(defineSystem({ id: 'first', order: 100 }))
    registry.register(defineSystem({ id: 'second', order: 200 }))

    expect(registry.systems().map((s) => s.id)).toEqual(['first', 'second', 'third'])
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
    const trace: string[] = []
    registry.register(defineSystem({ id: 'after', order: 200, tick: () => trace.push('after') }))
    registry.register(defineSystem({ id: 'before', order: 100, tick: () => trace.push('before') }))

    registry.tickAll(context(), ONE_TICK)

    expect(trace).toEqual(['before', 'after'])
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
    const one = counter('one', ORDER.INCOME)
    registry.register(one.system)

    registry.tickAll(context(), ticks(7))

    expect(one.seen()).toBe(7)
  })

  it('salta i sistemi senza tick invece di lanciare', () => {
    const registry = createRegistry()
    registry.register(defineSystem({ id: 'silent', order: ORDER.INCOME }))

    expect(() => registry.tickAll(context(), ONE_TICK)).not.toThrow()
  })

  it('senza sistemi non lancia', () => {
    expect(() => createRegistry().tickAll(context(), ONE_TICK)).not.toThrow()
  })
})

describe('saveAll', () => {
  it('produce una chiave per ogni sistema con stato, e solo per quelli', () => {
    const registry = createRegistry()
    const one = counter('one', ORDER.INCOME)
    const two = counter('two', ORDER.INCOME)
    registry.register(one.system)
    registry.register(two.system)
    registry.register(defineSystem({ id: 'stateless', order: ORDER.ECONOMY, tick: () => {} }))

    registry.tickAll(context(), ticks(3))

    expect(registry.saveAll()).toEqual({ one: { seen: 3 }, two: { seen: 3 } })
  })

  it('un sistema con stato non può sparire dal salvataggio', () => {
    const registry = createRegistry()
    const stateful = ['a', 'b', 'c'].map((id) => counter(id, ORDER.INCOME))
    for (const c of stateful) registry.register(c.system)

    expect(Object.keys(registry.saveAll()).sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('loadAll', () => {
  it('consegna a ogni sistema il proprio stato', () => {
    const registry = createRegistry()
    const one = counter('one', ORDER.INCOME)
    const two = counter('two', ORDER.INCOME)
    registry.register(one.system)
    registry.register(two.system)

    const result = registry.loadAll({ one: { seen: 10 }, two: { seen: 20 } })

    expect(result).toEqual({ ok: true, value: { ignored: [] } })
    expect(one.seen()).toBe(10)
    expect(two.seen()).toBe(20)
  })

  /** Un sistema rimosso in una versione nuova non deve impedire di aprire una partita vecchia. */
  it('un id sconosciuto non lancia: torna ok con l elenco degli ignorati', () => {
    const registry = createRegistry()
    const one = counter('one', ORDER.INCOME)
    registry.register(one.system)

    const result = registry.loadAll({ one: { seen: 5 }, gone: { whatever: 1 } })

    expect(result).toEqual({ ok: true, value: { ignored: ['gone'] } })
    expect(one.seen()).toBe(5)
  })

  it('un id noto ma assente dal salvataggio resta allo stato iniziale', () => {
    const registry = createRegistry()
    const one = counter('one', ORDER.INCOME)
    const fresh = counter('fresh', ORDER.INCOME)
    registry.register(one.system)
    registry.register(fresh.system)

    const result = registry.loadAll({ one: { seen: 4 } })

    expect(result).toEqual({ ok: true, value: { ignored: [] } })
    expect(one.seen()).toBe(4)
    expect(fresh.seen()).toBe(0)
  })

  it('non consegna nulla ai sistemi senza stato', () => {
    const registry = createRegistry()
    registry.register(defineSystem({ id: 'stateless', order: ORDER.ECONOMY }))

    expect(registry.loadAll({ stateless: { seen: 1 } })).toEqual({
      ok: true,
      value: { ignored: ['stateless'] }
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
        id: 'broken',
        order: ORDER.INCOME,
        save: () => 0,
        load: () => {
          throw new Error('stato illeggibile')
        },
        reset: () => {}
      })
    )

    const result = registry.loadAll({ broken: 'non è quello che mi aspettavo' })

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'error.registry.load_failed',
        id: 'broken',
        cause: expect.any(Error)
      }
    })
  })
})

describe('resetAll', () => {
  it('azzera ogni sistema con stato e gli passa l ambito', () => {
    const registry = createRegistry()
    const one = counter('one', ORDER.INCOME)
    const two = counter('two', ORDER.INCOME)
    registry.register(one.system)
    registry.register(two.system)
    registry.tickAll(context(), ticks(9))

    registry.resetAll('hard')

    expect([one.seen(), two.seen()]).toEqual([0, 0])
    expect([one.lastScope(), two.lastScope()]).toEqual(['hard', 'hard'])
  })

  it('soft e hard arrivano al sistema come sono: la scelta è sua', () => {
    const registry = createRegistry()
    const one = counter('one', ORDER.INCOME)
    registry.register(one.system)

    registry.resetAll('soft')

    expect(one.lastScope()).toBe('soft')
  })
})

describe('statsAll', () => {
  it('raccoglie da chi ha stats e ignora chi non ne ha', () => {
    const registry = createRegistry()
    const one = counter('one', ORDER.INCOME)
    registry.register(one.system)
    registry.register(defineSystem({ id: 'silent', order: ORDER.ECONOMY, tick: () => {} }))
    registry.tickAll(context(), ticks(2))

    expect(registry.statsAll()).toEqual({ one: { seen: 2 } })
  })
})

describe('il tipo System', () => {
  it('un sistema con save e senza reset non compila', () => {
    // @ts-expect-error — A06: il contratto asimmetrico è invisibile fino al primo prestige
    const broken = defineSystem({
      id: 'broken',
      order: ORDER.INCOME,
      save: () => 1,
      load: (n: number) => String(n)
    })

    expect(broken.id).toBe('broken')
  })

  it('un sistema senza save che dichiara load non compila', () => {
    // @ts-expect-error — load senza save è uno stato che si carica e non si salva mai
    const broken = defineSystem({
      id: 'broken',
      order: ORDER.INCOME,
      load: (n: number) => String(n)
    })

    expect(broken.id).toBe('broken')
  })

  it('un sistema senza save che dichiara reset non compila', () => {
    // @ts-expect-error — reset senza save azzera qualcosa che il Registry non sa salvare
    const broken = defineSystem({
      id: 'broken',
      order: ORDER.INCOME,
      reset: () => {}
    })

    expect(broken.id).toBe('broken')
  })
})

describe('ORDER', () => {
  it('le fasi sono in ordine crescente e distinte', () => {
    const values = Object.values(ORDER)

    expect([...values].sort((a, b) => a - b)).toEqual(values)
    expect(new Set(values).size).toBe(values.length)
  })

  it('lascia spazio fra una fase e l altra per infilarne una nuova', () => {
    const values = Object.values(ORDER)
    const gaps = values.slice(1).map((v, i) => v - (values[i] ?? 0))

    for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(100)
  })
})
