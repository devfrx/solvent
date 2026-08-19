import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

/**
 * C03 — un solo nome per il prodotto, ovunque (ADR 0008).
 *
 * Il difetto A15 era quattro nomi diversi per lo stesso prodotto e metadati del template mai
 * sostituiti. Se aggiungi un sesto posto in cui il nome compare, aggiornalo qui nello stesso commit.
 */

const NOME = 'solvent'
const NOME_VISIBILE = 'Solvent'
const APP_ID = 'com.solvent.game'

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as Record<string, unknown>
const builder = readFileSync('electron-builder.yml', 'utf8')

const AVANZI_DEL_TEMPLATE = ['example.com', 'com.electron.app', 'electronjs.org', 'electron-app']

describe('identità del prodotto', () => {
  it('package.json name', () => {
    expect(pkg['name']).toBe(NOME)
  })

  it('package.json productName', () => {
    expect(pkg['productName']).toBe(NOME_VISIBILE)
  })

  it('electron-builder appId', () => {
    expect(builder).toMatch(new RegExp(`^appId:\\s*${APP_ID}\\s*$`, 'm'))
  })

  it('electron-builder productName', () => {
    expect(builder).toMatch(new RegExp(`^productName:\\s*${NOME_VISIBILE}\\s*$`, 'm'))
  })

  it("l'appId contiene il nome del pacchetto", () => {
    expect(APP_ID.split('.')).toContain(NOME)
  })

  it('nessun metadato del template è sopravvissuto', () => {
    const testo = `${JSON.stringify(pkg)}\n${builder}`
    for (const avanzo of AVANZI_DEL_TEMPLATE) {
      expect(testo).not.toContain(avanzo)
    }
  })

  it('nessun blocco publish finto (ADR 0008)', () => {
    expect(builder).not.toMatch(/^publish:/m)
  })
})
