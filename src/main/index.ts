import { join } from 'node:path'

import { app, BrowserWindow, ipcMain } from 'electron'

import { createSaveStore, mountSaveIpc } from './save/ipc'
import { createSaveFile } from './save/SaveFile'

/**
 * Il processo main: una finestra con le tre difese accese e i tre canali di persistenza.
 *
 * È tutto ciò che il main fa. Non conosce il Ledger, non conosce il Registry, non sa cosa sia un
 * tick: la simulazione vive nel renderer (ADR 0001) e il main possiede il contratto di
 * salvataggio (ADR 0004). Le due cose insieme sono l'intero perimetro di questo file.
 */

const WINDOW = { width: 1180, height: 760 } as const

const createWindow = (): void => {
  const window = new BrowserWindow({
    width: WINDOW.width,
    height: WINDOW.height,
    // Mostrare una finestra bianca e poi riempirla è il primo mezzo secondo di ogni avvio.
    show: false,
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),

      // Le tre difese, e nessuna di queste righe è cancellabile senza cambiare l'architettura:
      // il renderer non vede Node (INV-13), non condivide il contesto del preload, e gira in
      // sandbox. Ciò che passa il confine sono le tre funzioni del preload, mai `ipcRenderer`.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  window.on('ready-to-show', () => window.show())

  const devServer = process.env['ELECTRON_RENDERER_URL']
  if (devServer === undefined) {
    void window.loadFile(join(import.meta.dirname, '../renderer/index.html'))
  } else {
    void window.loadURL(devServer)
  }
}

void app.whenReady().then(() => {
  // La cartella la decide Electron: è l'unico punto in cui `app` incontra la persistenza.
  mountSaveIpc(ipcMain, createSaveStore(createSaveFile(app.getPath('userData'))))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // Su macOS un'applicazione resta viva senza finestre, ed è la convenzione del sistema.
  if (process.platform !== 'darwin') app.quit()
})
