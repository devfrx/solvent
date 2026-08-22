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
    resolve: { alias: { '@core': core, '@renderer': renderer } },

    // `minify: false` è il default del **preset del renderer** di electron-vite — sta nel suo
    // `electronRendererConfigPresetPlugin` e viene fuso con questa configurazione, quindi chi non
    // lo scrive lo eredita (D035, punto 2). È lo stesso difetto dell'ADR 0026 con un'altra
    // libreria: un default che nessuno aveva scelto e che nessun documento nominava.
    //
    // Il dubbio aperto da D030 e passato di mano per tre deleghe finiva qui, e la domanda era
    // rivolta al file sbagliato: si guardava l'output invece delle opzioni con cui era prodotto.
    // Senza questa riga il pacchetto porta i commenti del sorgente, e pesa il doppio.
    //
    // `'oxc'` e non `true`: dice **chi** minifica, invece di lasciarlo scegliere al default — che è
    // il difetto che questa riga esiste per chiudere. E non `'esbuild'`, misurato: Vite 8 non lo
    // porta più con sé, e chiederlo fa fallire `build` con «Cannot find package 'esbuild'».
    build: { minify: 'oxc' }
  }
})
