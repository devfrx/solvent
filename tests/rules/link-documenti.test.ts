import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { fileSorgente, leggi } from '../helpers/sorgenti'

/**
 * C07 — ogni collegamento fra documenti porta da qualche parte.
 *
 * N07 è il rischio numero uno del progetto: la documentazione che si disallinea dal codice.
 * I collegamenti rotti sono la sua forma più economica da prendere, e l'unica che una macchina
 * può prendere da sola — un file rinominato o una sezione rititolata li rompe in silenzio, e chi
 * legge scopre il buco solo cliccandoci sopra.
 *
 * Con cinquanta documenti fittamente incrociati, controllarli a mano è un `grep` fatto una volta:
 * protegge il giorno in cui lo si esegue e nessun altro.
 */

const COLLEGAMENTO = /\[[^\]]*\]\(([^)]+)\)/g
const TITOLO = /^#{1,6}\s+(.*)$/
const ESTERNO = /^(?:https?:|mailto:)/

/** Lo slug di GitHub: minuscolo, via la punteggiatura, **ogni** spazio diventa un trattino. */
const slug = (titolo: string): string =>
  titolo
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N} -]/gu, '')
    .replace(/ /g, '-')

const ancoreDi = (percorso: string): Set<string> => {
  const ancore = new Set<string>()
  for (const riga of leggi(percorso).split('\n')) {
    const titolo = TITOLO.exec(riga)?.[1]
    if (titolo !== undefined) ancore.add(slug(titolo))
  }
  return ancore
}

interface Collegamento {
  readonly da: string
  readonly href: string
  /** Il file puntato, già risolto. Coincide con `da` quando l'href è solo un'ancora. */
  readonly verso: string
  readonly ancora: string | null
}

const collegamentiDi = (documento: string): Collegamento[] =>
  [...leggi(documento).matchAll(COLLEGAMENTO)]
    .map((trovato) => (trovato[1] ?? '').trim())
    .filter((href) => href !== '' && !ESTERNO.test(href))
    .map((href) => {
      const taglio = href.indexOf('#')
      const percorso = taglio === -1 ? href : href.slice(0, taglio)
      const ancora = taglio === -1 ? null : href.slice(taglio + 1)
      return {
        da: documento,
        href,
        verso: percorso === '' ? documento : resolve(dirname(documento), percorso),
        ancora: ancora === '' ? null : ancora
      }
    })

const collegamenti = fileSorgente('docs', ['.md']).flatMap(collegamentiDi)

describe('i collegamenti fra documenti', () => {
  it('il rilevatore trova i link e ignora ciò che non lo è', () => {
    const finti = collegamentiDi('docs/README.md').length

    expect(finti).toBeGreaterThan(0)
    expect([
      ...'vedi [la mappa](README.md#stato) e [fuori](https://x.dev)'.matchAll(COLLEGAMENTO)
    ]).toHaveLength(2)
    expect([...'- [x] una spunta non è un link'.matchAll(COLLEGAMENTO)]).toHaveLength(0)
    // Il trattino doppio non è un refuso: l'em dash sparisce e i due spazi che lo circondavano
    // diventano due trattini. È il punto in cui uno slugger scritto a intuito sbaglia.
    expect(slug('Albero delle cartelle — la forma della fetta 01')).toBe(
      'albero-delle-cartelle--la-forma-della-fetta-01'
    )
  })

  it('ce ne sono, altrimenti questo test non guarda niente', () => {
    expect(collegamenti.length).toBeGreaterThan(50)
  })

  it('puntano tutti a un file che esiste', () => {
    const rotti = collegamenti
      .filter((collegamento) => !existsSync(collegamento.verso))
      .map((collegamento) => `${collegamento.da} -> ${collegamento.href}`)

    expect(rotti).toEqual([])
  })

  it('ogni ancora corrisponde a un titolo di quel file', () => {
    const cache = new Map<string, Set<string>>()
    const rotte = collegamenti
      .filter((collegamento) => collegamento.ancora !== null && existsSync(collegamento.verso))
      .filter((collegamento) => {
        if (!cache.has(collegamento.verso))
          cache.set(collegamento.verso, ancoreDi(collegamento.verso))
        return !cache.get(collegamento.verso)?.has(collegamento.ancora ?? '')
      })
      .map((collegamento) => `${collegamento.da} -> ${collegamento.href}`)

    expect(rotte).toEqual([])
  })
})
