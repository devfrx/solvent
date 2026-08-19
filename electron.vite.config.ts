import { resolve } from 'node:path'

import vue from '@vitejs/plugin-vue'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

const core = resolve(import.meta.dirname, 'src/core')
const renderer = resolve(import.meta.dirname, 'src/renderer')

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@core': core } }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@core': core } },
    // Un preload in **sandbox** non può essere un modulo ES: Electron lo carica come CommonJS
    // semplice, con un `require` ristretto. Con "type": "module" nel package.json l'unica cosa
    // che lo dichiara è l'estensione, quindi `index.cjs` — il nome che `main/index.ts` punta.
    //
    // `external` va ripetuto: `mergeConfig` sostituisce `rollupOptions` invece di sommarlo, e
    // senza questa riga il pacchetto `electron` finisce **dentro** il bundle del preload, che in
    // sandbox non parte. Si vede solo guardando l'output, non l'esito del comando.
    build: {
      rollupOptions: {
        external: ['electron', /^electron\/.+/],
        output: { format: 'cjs', entryFileNames: '[name].cjs' }
      }
    }
  },
  renderer: {
    plugins: [vue()],
    resolve: { alias: { '@core': core, '@renderer': renderer } }
  }
})
