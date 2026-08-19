import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles } from '../helpers/sources'

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

const LINK = /\[[^\]]*\]\(([^)]+)\)/g
const HEADING = /^#{1,6}\s+(.*)$/
const EXTERNAL = /^(?:https?:|mailto:)/

/** Lo slug di GitHub: minuscolo, via la punteggiatura, **ogni** spazio diventa un trattino. */
const slug = (heading: string): string =>
  heading
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N} -]/gu, '')
    .replace(/ /g, '-')

const anchorsOf = (path: string): Set<string> => {
  const anchors = new Set<string>()
  for (const line of read(path).split('\n')) {
    const heading = HEADING.exec(line)?.[1]
    if (heading !== undefined) anchors.add(slug(heading))
  }
  return anchors
}

interface Link {
  readonly from: string
  readonly href: string
  /** Il file puntato, già risolto. Coincide con `from` quando l'href è solo un'ancora. */
  readonly to: string
  readonly anchor: string | null
}

const linksOf = (doc: string): Link[] =>
  [...read(doc).matchAll(LINK)]
    .map((match) => (match[1] ?? '').trim())
    .filter((href) => href !== '' && !EXTERNAL.test(href))
    .map((href) => {
      const cut = href.indexOf('#')
      const path = cut === -1 ? href : href.slice(0, cut)
      const anchor = cut === -1 ? null : href.slice(cut + 1)
      return {
        from: doc,
        href,
        to: path === '' ? doc : resolve(dirname(doc), path),
        anchor: anchor === '' ? null : anchor
      }
    })

const links = sourceFiles('docs', ['.md']).flatMap(linksOf)

describe('i collegamenti fra documenti', () => {
  it('il rilevatore trova i link e ignora ciò che non lo è', () => {
    const found = linksOf('docs/README.md').length

    expect(found).toBeGreaterThan(0)
    expect([
      ...'vedi [la mappa](README.md#stato) e [fuori](https://x.dev)'.matchAll(LINK)
    ]).toHaveLength(2)
    expect([...'- [x] una spunta non è un link'.matchAll(LINK)]).toHaveLength(0)
    // Il trattino doppio non è un refuso: l'em dash sparisce e i due spazi che lo circondavano
    // diventano due trattini. È il punto in cui uno slugger scritto a intuito sbaglia.
    expect(slug('Albero delle cartelle — la forma della fetta 01')).toBe(
      'albero-delle-cartelle--la-forma-della-fetta-01'
    )
  })

  it('ce ne sono, altrimenti questo test non guarda niente', () => {
    expect(links.length).toBeGreaterThan(50)
  })

  it('puntano tutti a un file che esiste', () => {
    const broken = links
      .filter((link) => !existsSync(link.to))
      .map((link) => `${link.from} -> ${link.href}`)

    expect(broken).toEqual([])
  })

  it('ogni ancora corrisponde a un titolo di quel file', () => {
    const cache = new Map<string, Set<string>>()
    const broken = links
      .filter((link) => link.anchor !== null && existsSync(link.to))
      .filter((link) => {
        if (!cache.has(link.to)) cache.set(link.to, anchorsOf(link.to))
        return !cache.get(link.to)?.has(link.anchor ?? '')
      })
      .map((link) => `${link.from} -> ${link.href}`)

    expect(broken).toEqual([])
  })
})
