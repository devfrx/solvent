import type { IpcMain } from 'electron'
import { describe, expect, it } from 'vitest'

import { SAVE_CHANNELS } from '../../src/main/save/channels'
import { mountSaveIpc } from '../../src/main/save/ipc'
import type { SaveStore } from '../../src/main/save/SaveStore'

/**
 * I tre canali, e solo i tre.
 *
 * `IpcMain` arriva per parametro, quindi qui non serve Electron: si monta su un finto che
 * registra i nomi e restituisce i gestori. Ciò che si verifica è il confine — quali canali
 * esistono e cosa chiamano — non di nuovo il salvataggio, che ha il suo file.
 */

type Handler = (...args: unknown[]) => unknown

const fakeIpc = (): { ipc: Pick<IpcMain, 'handle'>; handlers: Map<string, Handler> } => {
  const handlers = new Map<string, Handler>()
  return {
    handlers,
    ipc: {
      handle: (channel, listener) => {
        handlers.set(channel, (...args) => listener(undefined as never, ...args))
      }
    }
  }
}

const calls: string[] = []

const recordingStore: SaveStore = {
  save: async (payload) => {
    calls.push(`save(${JSON.stringify(payload)})`)
    return { ok: true, value: 0 }
  },
  load: async () => {
    calls.push('load()')
    return { ok: true, value: { present: false } }
  },
  reset: async () => {
    calls.push('reset()')
    return { ok: true, value: null }
  }
}

describe('i canali montati', () => {
  it('sono tre, e nessuno in più', () => {
    const { ipc, handlers } = fakeIpc()

    mountSaveIpc(ipc, recordingStore)

    expect([...handlers.keys()].sort()).toEqual(
      [SAVE_CHANNELS.load, SAVE_CHANNELS.reset, SAVE_CHANNELS.save].sort()
    )
  })

  it('ognuno chiama la propria operazione, e il payload arriva intero', async () => {
    const { ipc, handlers } = fakeIpc()
    calls.length = 0

    mountSaveIpc(ipc, recordingStore)

    await handlers.get(SAVE_CHANNELS.save)?.({ level: 2 })
    await handlers.get(SAVE_CHANNELS.load)?.()
    await handlers.get(SAVE_CHANNELS.reset)?.()

    expect(calls).toEqual(['save({"level":2})', 'load()', 'reset()'])
  })

  it('l’esito torna indietro com’è: il canale non lo reinterpreta', async () => {
    const { ipc, handlers } = fakeIpc()

    mountSaveIpc(ipc, recordingStore)

    expect(await handlers.get(SAVE_CHANNELS.load)?.()).toEqual({
      ok: true,
      value: { present: false }
    })
  })
})
