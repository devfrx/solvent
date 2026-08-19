import { describe, expect, it } from 'vitest'

import type { GameEvents } from '@core/contracts/events'
import { ZERO } from '@core/contracts/money'

import type { Unsubscribe } from '@core/kernel/Bus'
import { createBus, EventCycleError, MAX_EMIT_DEPTH } from '@core/kernel/Bus'

/**
 * ADR 0016 — il Bus notifica, non chiede: sincrono, senza risposta, senza memoria.
 *
 * I due difetti che un bus scritto in fretta si porta dietro per mesi sono qui: l'iterazione
 * sull'array vivo mentre un handler si disiscrive, e il ciclo di emissioni che diventa uno stack
 * overflow senza contesto. Entrambi si manifestano il giorno in cui il primo sistema comincia a
 * reagire agli eventi di un altro — la fetta 04, secondo docs/roadmap-fette.md.
 */

const POSTED: GameEvents['money.posted'] = {
  transaction: { reason: 'reason.income.tick', postings: [] },
  balances: { cash: ZERO, card: ZERO, world: ZERO, sink: ZERO, fees: ZERO, house: ZERO }
}

describe('Bus', () => {
  it('gli handler girano nell ordine di registrazione', () => {
    const bus = createBus()
    const traccia: string[] = []

    bus.on('money.posted', () => traccia.push('primo'))
    bus.on('money.posted', () => traccia.push('secondo'))
    bus.emit('money.posted', POSTED)

    expect(traccia).toEqual(['primo', 'secondo'])
  })

  it('ogni handler riceve il payload emesso', () => {
    const bus = createBus()
    const ricevuti: GameEvents['money.posted'][] = []

    bus.on('money.posted', (payload) => ricevuti.push(payload))
    bus.emit('money.posted', POSTED)

    expect(ricevuti).toEqual([POSTED])
  })

  it('emettere un evento che nessuno ascolta non lancia', () => {
    expect(() => createBus().emit('money.posted', POSTED)).not.toThrow()
  })

  /** Nessuna coda, nessuno storico: se comparisse un `save`, il Bus sarebbe entrato nel salvataggio. */
  it('non ha stato di gioco: la superficie è on ed emit, e nient altro', () => {
    expect(Object.keys(createBus())).toEqual(['on', 'emit'])
  })
})

describe('disiscriversi', () => {
  it('toglie solo il proprio handler', () => {
    const bus = createBus()
    const traccia: string[] = []

    const stop = bus.on('money.posted', () => traccia.push('primo'))
    bus.on('money.posted', () => traccia.push('secondo'))
    stop()
    bus.emit('money.posted', POSTED)

    expect(traccia).toEqual(['secondo'])
  })

  /**
   * Il bug classico: `indexOf` senza memoria dell'iscrizione. La seconda chiamata trova la
   * funzione omonima iscritta dopo e toglie quella — un handler che sparisce senza che nessuno
   * l'abbia chiesto.
   */
  it('chiamare due volte la stessa Unsubscribe non tocca un iscritto omonimo', () => {
    const bus = createBus()
    const traccia: string[] = []
    const handler = (): void => {
      traccia.push('vivo')
    }

    const stop = bus.on('money.posted', handler)
    stop()
    bus.on('money.posted', handler)
    stop()
    bus.emit('money.posted', POSTED)

    expect(traccia).toEqual(['vivo'])
  })

  it('dentro un handler non salta gli handler successivi', () => {
    const bus = createBus()
    const traccia: string[] = []

    const stop: Unsubscribe = bus.on('money.posted', () => {
      traccia.push('primo')
      stop()
    })
    bus.on('money.posted', () => traccia.push('secondo'))
    bus.on('money.posted', () => traccia.push('terzo'))
    bus.emit('money.posted', POSTED)

    expect(traccia).toEqual(['primo', 'secondo', 'terzo'])
  })

  it('un handler tolto durante un emit non riceve quell emissione', () => {
    const bus = createBus()
    const traccia: string[] = []
    const secondo: { stop?: Unsubscribe } = {}

    bus.on('money.posted', () => {
      traccia.push('primo')
      secondo.stop?.()
    })
    secondo.stop = bus.on('money.posted', () => traccia.push('secondo'))
    bus.on('money.posted', () => traccia.push('terzo'))
    bus.emit('money.posted', POSTED)

    expect(traccia).toEqual(['primo', 'terzo'])
  })

  it('iscriversi dentro un handler non fa girare il nuovo handler in quell emissione', () => {
    const bus = createBus()
    const traccia: string[] = []

    const stop: Unsubscribe = bus.on('money.posted', () => {
      traccia.push('primo')
      stop()
      bus.on('money.posted', () => traccia.push('tardivo'))
    })
    bus.emit('money.posted', POSTED)

    expect(traccia).toEqual(['primo'])
  })
})

describe('un handler che lancia', () => {
  it('non impedisce agli altri di girare, e l errore emerge', () => {
    const bus = createBus()
    const traccia: string[] = []

    bus.on('money.posted', () => {
      throw new Error('crollo')
    })
    bus.on('money.posted', () => traccia.push('secondo'))

    expect(() => bus.emit('money.posted', POSTED)).toThrow('crollo')
    expect(traccia).toEqual(['secondo'])
  })

  it('se lanciano in due, emergono tutti e due', () => {
    const bus = createBus()

    bus.on('money.posted', () => {
      throw new Error('primo crollo')
    })
    bus.on('money.posted', () => {
      throw new Error('secondo crollo')
    })

    let catturato: unknown
    try {
      bus.emit('money.posted', POSTED)
    } catch (errore) {
      catturato = errore
    }

    expect(catturato).toBeInstanceOf(AggregateError)
    const errori: readonly unknown[] = catturato instanceof AggregateError ? catturato.errors : []
    expect(errori.map(String)).toEqual(['Error: primo crollo', 'Error: secondo crollo'])
  })

  /** Senza il ripristino della profondità, un'emissione più tardi sarebbe scambiata per un ciclo. */
  it('non lascia sporca la profondità per le emissioni successive', () => {
    const bus = createBus()
    bus.on('money.posted', () => {
      throw new Error('crollo')
    })

    for (let giro = 0; giro < MAX_EMIT_DEPTH * 2; giro += 1) {
      expect(() => bus.emit('money.posted', POSTED)).toThrow('crollo')
    }
  })
})

describe('la guardia sulle emissioni annidate', () => {
  it('annidare sotto la soglia è consentito', () => {
    const bus = createBus()
    const traccia: string[] = []
    let restanti = MAX_EMIT_DEPTH - 1

    bus.on('money.posted', () => {
      traccia.push('giro')
      if (restanti > 0) {
        restanti -= 1
        bus.emit('money.posted', POSTED)
      }
    })
    bus.emit('money.posted', POSTED)

    expect(traccia).toHaveLength(MAX_EMIT_DEPTH)
  })

  it('un ciclo lancia, e il messaggio porta la catena che lo ha causato', () => {
    const bus = createBus()
    bus.on('money.posted', () => bus.emit('money.posted', POSTED))

    let catturato: unknown
    try {
      bus.emit('money.posted', POSTED)
    } catch (errore) {
      catturato = errore
    }

    expect(catturato).toBeInstanceOf(EventCycleError)
    const messaggio = catturato instanceof Error ? catturato.message : ''
    expect(messaggio).toContain('money.posted → money.posted')
    expect(messaggio.split(' → ')).toHaveLength(MAX_EMIT_DEPTH + 1)
  })

  /**
   * La guardia deve **fermare** la cascata, non aggiungersi agli errori raccolti: un ciclo che
   * continua a girare moltiplica gli errori a ogni livello e seppellisce la diagnosi.
   */
  it('ferma la cascata invece di lasciar girare gli altri handler', () => {
    const bus = createBus()
    const traccia: string[] = []

    bus.on('money.posted', () => bus.emit('money.posted', POSTED))
    bus.on('money.posted', () => traccia.push('dopo'))

    expect(() => bus.emit('money.posted', POSTED)).toThrow(EventCycleError)
    expect(traccia).toEqual([])
  })

  it('dopo un ciclo il Bus resta usabile', () => {
    const bus = createBus()
    const traccia: string[] = []

    const stop = bus.on('money.posted', () => bus.emit('money.posted', POSTED))
    expect(() => bus.emit('money.posted', POSTED)).toThrow(EventCycleError)

    stop()
    bus.on('money.posted', () => traccia.push('sano'))
    bus.emit('money.posted', POSTED)

    expect(traccia).toEqual(['sano'])
  })
})

describe('il tipo del Bus', () => {
  it('un evento non dichiarato in GameEvents non compila', () => {
    const bus = createBus()
    const traccia: string[] = []
    bus.on('money.posted', () => traccia.push('reale'))

    // @ts-expect-error — il calore entra con la fetta 04, insieme al sistema che lo emette
    bus.emit('heat.raised', POSTED)

    expect(traccia).toEqual([])
  })

  it('un payload della forma sbagliata non compila', () => {
    const bus = createBus()
    const traccia: string[] = []
    bus.on('money.posted', () => traccia.push('reale'))

    // @ts-expect-error — money.posted porta una transazione e i saldi, non un numero
    bus.emit('money.posted', 42)

    expect(traccia).toEqual(['reale'])
  })
})
