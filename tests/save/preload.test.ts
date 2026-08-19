import { beforeEach, describe, expect, it, vi } from 'vitest'

const electron = vi.hoisted(() => ({
  exposed: new Map<string, unknown>(),
  invocations: [] as { channel: string; args: unknown[] }[]
}))

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (key: string, api: unknown): void => {
      electron.exposed.set(key, api)
    }
  },
  ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
      electron.invocations.push({ channel, args })
      return Promise.resolve({ ok: true, value: null })
    },
    send: (): void => undefined,
    on: (): void => undefined
  }
}))

import { SAVE_API_KEY, SAVE_CHANNELS } from '../../src/main/save/channels'
import '../../src/preload/index'

/**
 * INV-03 — quello che il preload **non** espone è la parte che conta.
 *
 * `ipcRenderer` intero darebbe al renderer ogni canale, presente e futuro, e la sandbox
 * diventerebbe una formalità. Questo test guarda l'oggetto che attraversa il ponte, non il
 * sorgente: un `contextBridge` in più lo si vede solo così.
 */

const api = (): Record<string, unknown> => {
  const exposed = electron.exposed.get(SAVE_API_KEY)
  expect(exposed).toBeTypeOf('object')
  return exposed as Record<string, unknown>
}

beforeEach(() => {
  electron.invocations.length = 0
})

describe('il ponte del preload', () => {
  it('aggancia una cosa sola alla finestra', () => {
    expect([...electron.exposed.keys()]).toEqual([SAVE_API_KEY])
  })

  it('espone tre funzioni, e nient’altro', () => {
    expect(Object.keys(api()).sort()).toEqual(['load', 'reset', 'save'])
    for (const operation of Object.values(api())) expect(operation).toBeTypeOf('function')
  })

  it('non espone ipcRenderer, né una sua scorciatoia', () => {
    for (const forbidden of ['invoke', 'send', 'on', 'ipcRenderer']) {
      expect(api()).not.toHaveProperty(forbidden)
    }
  })

  it('ogni funzione parla sul proprio canale', async () => {
    const payload = { ledger: 'finto' }
    await (api()['save'] as (value: unknown) => Promise<unknown>)(payload)
    await (api()['load'] as () => Promise<unknown>)()
    await (api()['reset'] as () => Promise<unknown>)()

    expect(electron.invocations).toEqual([
      { channel: SAVE_CHANNELS.save, args: [payload] },
      { channel: SAVE_CHANNELS.load, args: [] },
      { channel: SAVE_CHANNELS.reset, args: [] }
    ])
  })
})
