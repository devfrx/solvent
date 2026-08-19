import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { fileSorgente } from '../helpers/sorgenti'

/**
 * I gate non si perdono per strada.
 *
 * Il difetto A16 non è nato da una configurazione sbagliata: è nato da una configurazione giusta
 * che nessuno eseguiva. Qui si verifica che `verify` incateni davvero tutti i gate veloci, e che
 * `typecheck:web` rientri nella catena **nel momento esatto** in cui il progetto web ha dei file.
 *
 * È il sostituto meccanico del `TODO` che ADR 0014 vieta: nessuno deve ricordarsene.
 */

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>
}

const script = (nome: string): string => pkg.scripts[nome] ?? ''

describe('la catena dei gate', () => {
  it('verify incatena i quattro gate veloci', () => {
    const verify = script('verify')
    for (const gate of ['typecheck', 'lint', 'format:check', 'test']) {
      expect(verify).toContain(gate)
    }
  })

  it('verify:release aggiunge la compilazione', () => {
    expect(script('verify:release')).toContain('verify')
    expect(script('verify:release')).toContain('build')
  })

  it('ogni gate citato esiste come script', () => {
    const citati = [...script('verify').matchAll(/npm run ([\w:]+)/g)].map((m) => m[1] ?? '')
    for (const nome of citati) {
      expect(Object.keys(pkg.scripts)).toContain(nome)
    }
  })
})

describe('typecheck:web entra in catena quando il progetto web esiste', () => {
  const fileWeb = [...fileSorgente('src/core'), ...fileSorgente('src/renderer')]

  it('lo script esiste comunque', () => {
    expect(script('typecheck:web')).toContain('tsconfig.web.json')
  })

  it(
    fileWeb.length === 0
      ? 'nessun file web: resta fuori dalla catena, ed è corretto'
      : 'ci sono file web: DEVE essere nella catena di typecheck',
    () => {
      if (fileWeb.length === 0) {
        expect(script('typecheck')).not.toContain('typecheck:web')
        return
      }
      expect(script('typecheck')).toContain('typecheck:web')
    }
  )
})
