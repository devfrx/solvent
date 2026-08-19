import type { IpcMain } from 'electron'

import { SAVE_CHANNELS } from './channels'
import type { SaveStore } from './SaveStore'

/**
 * L'attacco fra i tre canali IPC e le tre operazioni. È tutto quello che questo file fa.
 *
 * `IpcMain` entra **solo come tipo** e arriva per parametro: `Pick<IpcMain, 'handle'>` è la sola
 * parte di Electron che serve, e riceverla invece di importarla tiene fuori il resto — sia dal
 * bundle, sia dai test.
 */
export const mountSaveIpc = (ipc: Pick<IpcMain, 'handle'>, store: SaveStore): void => {
  ipc.handle(SAVE_CHANNELS.save, (_event, payload: unknown) => store.save(payload))
  ipc.handle(SAVE_CHANNELS.load, () => store.load())
  ipc.handle(SAVE_CHANNELS.reset, () => store.reset())
}
