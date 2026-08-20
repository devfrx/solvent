import type { LoadedSave, SaveApi, SavePayload, SaveResult } from '@core/contracts/save'

import { milliseconds } from '@core/kernel/Clock'

import type { Host, Unsubscribe } from '../../src/renderer/runtime/host'

/**
 * Il browser, finto e sotto controllo: il tempo scorre quando lo si dice, il frame parte quando lo
 * si chiama, la finestra si nasconde e si chiude a comando.
 *
 * È l'altra metà del confine di `runtime/host.ts`. Senza, provare l'accumulatore vorrebbe dire
 * aspettare davvero dei frame veri — cioè un test lento, non deterministico, e che non potrebbe
 * mai far passare otto ore.
 */

export interface Stage {
  readonly host: Host
  /** Fa avanzare l'orologio monotono del loop, senza eseguire niente. */
  readonly advance: (elapsed: number) => void
  /** Esegue il frame in attesa, se ce n'è uno. Ritorna `false` se il loop non ne aveva chiesti. */
  readonly frame: () => boolean
  readonly setVisible: (visible: boolean) => void
  readonly requestClose: () => void
  readonly isClosed: () => boolean
  /** L'ora del mondo, quella confrontabile con `savedAt`. Indipendente da `advance`. */
  readonly setWallClock: (at: number) => void
  /** Tutti i payload passati a `save`, in ordine. */
  readonly written: () => readonly SavePayload[]
}

export interface StageOptions {
  readonly load?: () => Promise<SaveResult<LoadedSave>>
  readonly save?: (payload: SavePayload) => Promise<SaveResult<number>>
  readonly reset?: () => Promise<SaveResult<null>>
  readonly wallClock?: number
  readonly savedAt?: number
}

const ABSENT: SaveResult<LoadedSave> = { ok: true, value: { present: false } }

export const createStage = (options: StageOptions = {}): Stage => {
  let monotonic = 0
  let wallClock = options.wallClock ?? 0
  let scheduled: (() => void) | null = null
  let visibility: ((visible: boolean) => void) | null = null
  let closing: (() => void) | null = null
  let closed = false

  const written: SavePayload[] = []
  const writtenAt = options.savedAt ?? 0

  const host: Host = {
    saveApi: {
      load: options.load ?? ((): Promise<SaveResult<LoadedSave>> => Promise.resolve(ABSENT)),
      save:
        options.save ??
        ((payload): Promise<SaveResult<number>> => {
          written.push(payload)
          return Promise.resolve({ ok: true, value: writtenAt })
        }),
      reset:
        options.reset ??
        ((): Promise<SaveResult<null>> => Promise.resolve({ ok: true, value: null }))
    } satisfies SaveApi,

    now: () => milliseconds(monotonic),
    wallClock: () => wallClock,

    schedule: (run) => {
      scheduled = run
      return () => {
        scheduled = null
      }
    },

    // Il finto browser non ha un documento a cui dichiarare una lingua: la riga vera vive in
    // `host.ts`, che è il confine e non ha test (docs/tracciabilita.md).
    setLanguage: () => undefined,

    onVisibilityChange: (handler): Unsubscribe => {
      visibility = handler
      return () => {
        visibility = null
      }
    },

    onClosing: (handler): Unsubscribe => {
      closing = handler
      return () => {
        closing = null
      }
    },

    close: () => {
      closed = true
    }
  }

  return {
    host,
    advance: (elapsed) => {
      monotonic += elapsed
    },
    frame: () => {
      const run = scheduled
      scheduled = null
      run?.()
      return run !== null
    },
    setVisible: (visible) => visibility?.(visible),
    requestClose: () => closing?.(),
    isClosed: () => closed,
    setWallClock: (at) => {
      wallClock = at
    },
    written: () => written
  }
}
