import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

// Ambiente `node` per tutto: il kernel e il dominio sono puri e non hanno bisogno di un browser
// (ADR 0001). jsdom entrerà solo quando esisteranno test di componente, e solo per quelli.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@core': resolve(import.meta.dirname, 'src/core'),
      '@renderer': resolve(import.meta.dirname, 'src/renderer')
    }
  }
})
