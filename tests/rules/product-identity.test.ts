import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * C03 — un solo nome per il prodotto, ovunque (ADR 0008).
 *
 * Il difetto A15 era quattro nomi diversi per lo stesso prodotto e metadati del template mai
 * sostituiti. Se aggiungi un sesto posto in cui il nome compare, aggiornalo qui nello stesso commit.
 */

const NAME = 'solvent'
const DISPLAY_NAME = 'Solvent'
const APP_ID = 'com.solvent.game'

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as Record<string, unknown>
const builder = readFileSync('electron-builder.yml', 'utf8')

const TEMPLATE_LEFTOVERS = ['example.com', 'com.electron.app', 'electronjs.org', 'electron-app']

describe('identità del prodotto', () => {
  it('package.json name', () => {
    expect(pkg['name']).toBe(NAME)
  })

  it('package.json productName', () => {
    expect(pkg['productName']).toBe(DISPLAY_NAME)
  })

  it('electron-builder appId', () => {
    expect(builder).toMatch(new RegExp(`^appId:\\s*${APP_ID}\\s*$`, 'm'))
  })

  it('electron-builder productName', () => {
    expect(builder).toMatch(new RegExp(`^productName:\\s*${DISPLAY_NAME}\\s*$`, 'm'))
  })

  it("l'appId contiene il nome del pacchetto", () => {
    expect(APP_ID.split('.')).toContain(NAME)
  })

  it('nessun metadato del template è sopravvissuto', () => {
    const text = `${JSON.stringify(pkg)}\n${builder}`
    for (const leftover of TEMPLATE_LEFTOVERS) {
      expect(text).not.toContain(leftover)
    }
  })

  it('nessun blocco publish finto (ADR 0008)', () => {
    expect(builder).not.toMatch(/^publish:/m)
  })
})
