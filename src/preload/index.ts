import { contextBridge, ipcRenderer } from 'electron'

import type { SaveApi, SavePayload } from '@core/contracts/save'

import { SAVE_API_KEY, SAVE_CHANNELS } from '../main/save/channels'

/**
 * L'unico ponte fra il renderer e il sistema operativo: tre funzioni, e nient'altro.
 *
 * Quello che **non** si espone è la parte che conta. `ipcRenderer` intero darebbe al renderer la
 * possibilità di invocare qualunque canale, presente e futuro, e la sandbox diventerebbe una
 * formalità. Qui la superficie è `SaveApi`, cioè il contratto: aggiungere un canale significa
 * aggiungerlo al contratto, dove si vede.
 */
const saveApi: SaveApi = {
  save: (payload: SavePayload) => ipcRenderer.invoke(SAVE_CHANNELS.save, payload),
  load: () => ipcRenderer.invoke(SAVE_CHANNELS.load),
  reset: () => ipcRenderer.invoke(SAVE_CHANNELS.reset)
}

contextBridge.exposeInMainWorld(SAVE_API_KEY, saveApi)
