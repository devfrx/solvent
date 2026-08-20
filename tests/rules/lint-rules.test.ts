import { ESLint } from 'eslint'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * Meta-test delle regole ESLint.
 *
 * La definizione di fatto di D001 chiede di verificare ogni regola scrivendo la violazione e
 * vedendo il rosso. Farlo a mano una volta non serve a niente: qui la verifica è permanente.
 * Se qualcuno indebolisce `eslint.config.js`, questo file diventa rosso.
 *
 * Mappa regola → ADR → meccanismo: docs/tracciabilita.md
 */

const eslint = new ESLint({ cwd: process.cwd() })

type Finding = { ruleId: string | null; message: string }

async function lint(filePath: string, code: string): Promise<Finding[]> {
  const results = await eslint.lintText(code, { filePath, warnIgnored: false })
  return results.flatMap((r) => r.messages.map((m) => ({ ruleId: m.ruleId, message: m.message })))
}

const has = (findings: Finding[], needle: string): boolean =>
  findings.some((f) => f.message.includes(needle) || f.ruleId === needle)

const VUE = (body: string): string =>
  `<script setup lang="ts">\n${body}\n</script>\n\n<template>\n  <div />\n</template>\n`

// La prima chiamata carica la configurazione e i parser: qualche secondo. Pagarla una volta qui
// tiene i tempi dei singoli casi onesti, invece di alzare il timeout per tutti.
beforeAll(async () => {
  await lint('src/core/kernel/Clock.ts', 'export const a = 1\n')
}, 60_000)

describe('regole che devono scattare', () => {
  it('R01 — uno store che importa un altro store', async () => {
    const f = await lint(
      'src/renderer/stores/game.ts',
      `import { x } from './other'\nexport const y = x\n`
    )
    expect(has(f, 'R01')).toBe(true)
  })

  it('R03 — Math.random fuori da Rng.ts', async () => {
    const f = await lint('src/core/domains/income/rules.ts', `export const a = Math.random()\n`)
    expect(has(f, 'R03')).toBe(true)
  })

  // `const a = 3600` NON è una violazione: dare un nome a un numero è la correzione, non il difetto.
  // La violazione è il numero usato al volo dentro un'espressione.
  it('R04 — numero magico dentro un calcolo di dominio', async () => {
    const f = await lint(
      'src/core/domains/income/rules.ts',
      `export function f(x: number): number {\n  return x * 3600\n}\n`
    )
    expect(has(f, '@typescript-eslint/no-magic-numbers')).toBe(true)
  })

  it('R04 — un numero con un nome è invece consentito', async () => {
    const f = await lint(
      'src/core/domains/income/rules.ts',
      `export const SECONDS_PER_HOUR = 3600\n`
    )
    expect(has(f, '@typescript-eslint/no-magic-numbers')).toBe(false)
  })

  it('R05 — un .vue che importa il kernel', async () => {
    const f = await lint(
      'src/renderer/components/Panel.vue',
      VUE(`import { clock } from '@core/kernel/Clock'\nconsole.log(clock)`)
    )
    expect(has(f, 'R05')).toBe(true)
  })

  it('R14 — un file del kit che importa il dominio', async () => {
    const f = await lint(
      'src/renderer/ui/UiNumber.vue',
      VUE(`import { toString } from '@core/contracts/money'
console.log(toString)`)
    )
    expect(has(f, 'R14')).toBe(true)
  })

  it('R14 — e uno che importa le parole', async () => {
    const f = await lint(
      'src/renderer/ui/UiLabel.vue',
      VUE(`import { useTranslator } from '@renderer/i18n'
console.log(useTranslator)`)
    )
    expect(has(f, 'R14')).toBe(true)
  })

  it('R14 — un import dentro il kit invece è consentito', async () => {
    const f = await lint(
      'src/renderer/ui/UiPanel.vue',
      VUE(`import { toneVar } from './roles'
console.log(toneVar)`)
    )
    expect(has(f, 'R14')).toBe(false)
  })

  it('R06 — assegnamento diretto a un saldo', async () => {
    const f = await lint(
      'src/core/domains/income/system.ts',
      `export function f(o: { balance: number }): void {\n  o.balance = 1\n}\n`
    )
    expect(has(f, 'R06')).toBe(true)
  })

  it('R06 — anche su un saldo annidato, non solo sul nome nudo', async () => {
    const f = await lint(
      'src/renderer/stores/game.ts',
      `export function f(o: { state: { balances: number } }): void {
  o.state.balances = 1
}
`
    )
    expect(has(f, 'R06')).toBe(true)
  })

  it('R10 — un literal con chiave success al posto di Result', async () => {
    const f = await lint('src/core/domains/income/rules.ts', `export const r = { success: true }\n`)
    expect(has(f, 'R10')).toBe(true)
  })

  it('R03 — un secondo Math.random dentro Rng.ts, senza motivazione', async () => {
    const f = await lint('src/core/kernel/Rng.ts', `export const seed = Math.random()\n`)
    expect(has(f, 'R03')).toBe(true)
  })

  it('R11 — un dominio che importa una conversione del denaro', async () => {
    const f = await lint(
      'src/core/domains/income/rules.ts',
      `import { fromNumber } from '@core/contracts/money'\n\nexport const a = fromNumber(1)\n`
    )
    expect(has(f, 'R11')).toBe(true)
  })

  it('R11 — la stessa conversione presa per via relativa', async () => {
    const f = await lint(
      'src/core/domains/income/rules.ts',
      `import { fromNumber } from '../../contracts/money'\n\nexport const a = fromNumber(1)\n`
    )
    expect(has(f, 'R11')).toBe(true)
  })

  // Il blocco R11 sovrascrive `no-restricted-imports` sotto domains/: in flat config l'ultima
  // configurazione sostituisce le precedenti, non le somma. Questo caso è la prova che INV-02
  // non è sparita nel passaggio.
  it('INV-02 — resta attiva sotto domains/, dove R11 riscrive la stessa regola', async () => {
    const f = await lint(
      'src/core/domains/income/system.ts',
      `import { ref } from 'vue'\n\nexport const a = ref(0)\n`
    )
    expect(has(f, 'INV-02')).toBe(true)
  })

  it('INV-02 — core/ che importa Vue', async () => {
    const f = await lint(
      'src/core/kernel/Bus.ts',
      `import { ref } from 'vue'\nexport const a = ref(0)\n`
    )
    expect(has(f, 'INV-02')).toBe(true)
  })

  it('INV-02 — core/ che fa I/O', async () => {
    const f = await lint(
      'src/core/kernel/Ledger.ts',
      `import { readFileSync } from 'node:fs'\nexport const a = readFileSync\n`
    )
    expect(has(f, 'INV-02')).toBe(true)
  })

  it('INV-03 — il main che importa il kernel', async () => {
    const f = await lint(
      'src/main/save/ipc.ts',
      `import { createRegistry } from '@core/kernel/Registry'\nexport const a = createRegistry\n`
    )
    expect(has(f, 'INV-03')).toBe(true)
  })

  it('any esplicito', async () => {
    const f = await lint(
      'src/core/kernel/Bus.ts',
      `export function f(x: any): unknown {\n  return x\n}\n`
    )
    expect(has(f, '@typescript-eslint/no-explicit-any')).toBe(true)
  })

  it('import fuori ordine', async () => {
    const f = await lint(
      'src/renderer/runtime/createGame.ts',
      `import { createPinia } from 'pinia'\nimport { resolve } from 'node:path'\n\nexport const a = [createPinia, resolve]\n`
    )
    expect(has(f, 'import-x/order')).toBe(true)
  })
})

describe('eccezioni dichiarate — devono NON scattare', () => {
  it('R03 è esente sulla sola riga motivata dentro Rng.ts (ADR 0005)', async () => {
    const f = await lint(
      'src/core/kernel/Rng.ts',
      `// eslint-disable-next-line no-restricted-properties -- il seed di una partita nuova\nexport const seed = Math.random()\n`
    )
    expect(has(f, 'R03')).toBe(false)
  })

  it('R06 è spenta dentro Ledger.ts, che è il solo posto che tocca i saldi (ADR 0003)', async () => {
    const f = await lint(
      'src/core/kernel/Ledger.ts',
      `export function f(o: { balance: number }): void {\n  o.balance = 1\n}\n`
    )
    expect(has(f, 'R06')).toBe(false)
  })

  it('R06 non scatta su una **lettura**: rispecchiare un saldo non è cambiarlo', async () => {
    // Il selettore prendeva anche il lato destro dell'assegnamento, e nessuno se n'era accorto
    // perché fino a D011 nessun codice leggeva un `.balances` per rispecchiarlo. Lo store è il
    // primo mirror del progetto, ed è esattamente ciò che R06 deve **permettere**.
    const f = await lint(
      'src/renderer/stores/game.ts',
      `export function f(o: { balances: number }, target: { value: number }): void {
  target.value = o.balances
}
`
    )
    expect(has(f, 'R06')).toBe(false)
  })

  it('R10 resta attiva anche dentro Ledger.ts — l’eccezione riguarda solo R06', async () => {
    const f = await lint('src/core/kernel/Ledger.ts', `export const r = { success: true }\n`)
    expect(has(f, 'R10')).toBe(true)
  })

  it('R11 è spenta fuori dai domini: alla presentazione le conversioni sono legittime', async () => {
    const f = await lint(
      'src/renderer/stores/game.ts',
      `import { toDisplayNumber } from '@core/contracts/money'\n\nexport const a = toDisplayNumber\n`
    )
    expect(has(f, 'R11')).toBe(false)
  })

  it('un file pulito non produce nulla', async () => {
    const f = await lint('src/core/kernel/Clock.ts', `export const TICKS_PER_SECOND = 10\n`)
    expect(f).toEqual([])
  })
})
