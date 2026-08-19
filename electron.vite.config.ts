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
    resolve: { alias: { '@core': core } }
  },
  renderer: {
    plugins: [vue()],
    resolve: { alias: { '@core': core, '@renderer': renderer } }
  }
})
