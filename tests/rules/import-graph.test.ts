import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { importsOf, read, sourceFiles } from '../helpers/sources'

/**
 * C13 — il confine disegnato è il confine vero.
 *
 * [architettura.md](../../docs/architettura.md) dichiara che «una freccia `A --> B` significa: A
 * può importare B», e fino a [D022](../../docs/delega/D022-il-confine-disegnato-e-il-confine-vero.md)
 * nessuno lo verificava. L'audit dello STOP 2 ha trovato sei archi reali non disegnati e quattro
 * nodi che nel diagramma non esistevano (AUD-008) — fra questi `ST --> KER`, che è quello che
 * conta: chi leggeva il diagramma concludeva che lo store non conosce il kernel, cioè esattamente
 * la proprietà che l'ADR 0001 protegge.
 *
 * Il progetto aveva già pagato questo difetto una volta, e lo diceva nel documento stesso: «La
 * freccia esisteva già da D012 e non era disegnata; a disegnarla è D015». È tornato subito, e in
 * sei esemplari, perché la correzione era un aggiornamento e non un meccanismo.
 *
 * **Cosa il diagramma modella, e cosa no.** Modella i **passaggi di livello**. Un modulo che
 * importa un fratello dello stesso livello — `Registry` che importa `Bus`, `AtmPanel` che importa
 * `PostingRows` — è coesione interna, non un confine, e disegnarlo riempirebbe il diagramma di
 * cappi senza dire niente di nuovo. L'esclusione è dichiarata qui perché è una scelta, non una
 * dimenticanza.
 */

/**
 * Da quale percorso nasce quale nodo. È una **dichiarazione**, e non può essere altro: il diagramma
 * usa nomi astratti — `CMP`, `ST`, `KER` — che nessuna euristica può indovinare da una cartella.
 *
 * Il buco che ne deriva sarebbe che una cartella nuova sparisce dal confronto senza far rumore, ed
 * è chiuso dalla terza verifica qui sotto: ogni file di `src/` deve appartenere a un nodo. Chi
 * volesse aggirarla aggiungendo una voce «tutto il resto» toglierebbe al test la sua unica difesa.
 *
 * L'ordine conta: si prende la **prima** voce che corrisponde, quindi i percorsi più profondi
 * stanno prima.
 */
const NODES: readonly (readonly [string, string])[] = [
  ['src/core/contracts/', 'CON'],
  ['src/core/kernel/', 'KER'],
  ['src/core/balance/', 'BAL'],
  ['src/core/domains/', 'DOM'],
  ['src/main/save/', 'SAVE'],
  ['src/main/index.ts', 'MAIN'],
  ['src/preload/', 'PRE'],
  ['src/renderer/runtime/', 'RT'],
  ['src/renderer/stores/', 'ST'],
  ['src/renderer/i18n/', 'I18N'],
  ['src/renderer/components/', 'CMP'],
  ['src/renderer/views/', 'VIEWS'],
  ['src/renderer/App.vue', 'APP'],
  ['src/renderer/main.ts', 'BOOT']
]

const normalize = (path: string): string => path.split(sep).join('/')

/**
 * Un percorso può arrivare come cartella senza la barra finale: `@renderer/i18n` è l'import del
 * punto d'ingresso di `src/renderer/i18n/`. Senza il secondo confronto quell'arco sparirebbe dal
 * grafo reale, e il test direbbe che una freccia disegnata non esiste — che è il contrario del
 * vero. Trovato scrivendo questo test, su `CMP --> I18N`.
 */
const nodeOf = (path: string): string | null =>
  NODES.find(([prefix]) => path.startsWith(prefix) || path === prefix.replace(/\/$/, ''))?.[1] ??
  null

/**
 * Il nodo di destinazione di un import, risolvendo gli alias e i percorsi relativi.
 *
 * `@core/*` e `@renderer/*` sono gli alias di `electron.vite.config.ts`; un import relativo si
 * risolve contro la cartella di chi lo scrive. Un pacchetto esterno ritorna `null` e non entra nel
 * grafo: il diagramma descrive i confini interni, e le dipendenze esterne le governa `core-deps`.
 */
const targetOf = (from: string, specifier: string): string | null => {
  if (specifier.startsWith('@core/')) return nodeOf(specifier.replace('@core/', 'src/core/'))
  if (specifier.startsWith('@renderer/')) {
    return nodeOf(specifier.replace('@renderer/', 'src/renderer/'))
  }
  if (!specifier.startsWith('.')) return null

  const parts = `${from.split('/').slice(0, -1).join('/')}/${specifier}`.split('/')
  const resolved: string[] = []
  for (const part of parts) {
    if (part === '.' || part === '') continue
    if (part === '..') resolved.pop()
    else resolved.push(part)
  }
  return nodeOf(resolved.join('/'))
}

/** Gli archi disegnati nel blocco `mermaid`, etichette comprese: `PRE -->|solo channels.ts| SAVE`. */
export const drawnEdges = (markdown: string): string[] => {
  const block = /```mermaid\n([\s\S]*?)```/.exec(markdown)?.[1] ?? ''
  const arrow = /^\s*(\w+)\s*-->(?:\|[^|]*\|)?\s*(\w+)/gm
  return [...block.matchAll(arrow)].map((match) => `${match[1] ?? ''} --> ${match[2] ?? ''}`)
}

const sources = sourceFiles('src', ['.ts', '.vue']).map(normalize)

/** Gli archi che esistono davvero, saltando quelli interni a un livello. */
const realEdges = (): string[] => {
  const edges = new Set<string>()
  for (const path of sources) {
    const from = nodeOf(path)
    if (from === null) continue
    for (const specifier of importsOf(read(path))) {
      const to = targetOf(path, specifier)
      if (to !== null && to !== from) edges.add(`${from} --> ${to}`)
    }
  }
  return [...edges].sort()
}

const drawn = drawnEdges(read('docs/architettura.md'))
const real = realEdges()

describe('il rilevatore', () => {
  it('legge gli archi del blocco mermaid, etichette comprese', () => {
    const block = ['```mermaid', 'flowchart TD', '  CMP --> ST', '  PRE -->|solo x| SAVE', '```']

    expect(drawnEdges(block.join('\n'))).toEqual(['CMP --> ST', 'PRE --> SAVE'])
  })

  it('toglie la definizione del nodo, o il nome di arrivo la porterebbe con sé', () => {
    const block = ['```mermaid', '  D013 --> D021["Un titolo"]', '```']

    expect(drawnEdges(block.join('\n'))).toEqual(['D013 --> D021'])
  })

  it('non legge le frecce che stanno nella prosa fuori dal blocco', () => {
    const prose = ['Una freccia `A --> B` significa che A può importare B.', '']

    expect(drawnEdges(prose.join('\n'))).toEqual([])
  })

  it('risolve gli alias e i percorsi relativi allo stesso modo', () => {
    expect(targetOf('src/renderer/stores/game.ts', '@core/kernel/Clock')).toBe('KER')
    expect(targetOf('src/renderer/components/AtmPanel.vue', './PostingRows.vue')).toBe('CMP')
    expect(targetOf('src/preload/index.ts', '../main/save/channels')).toBe('SAVE')
    expect(targetOf('src/core/kernel/Ledger.ts', 'decimal.js')).toBeNull()
  })
})

describe('il grafo di src/', () => {
  it('ce ne sono di archi, altrimenti questo test non guarda niente', () => {
    expect(real.length).toBeGreaterThan(15)
    expect(drawn.length).toBeGreaterThan(15)
  })

  it('ogni arco che esiste è disegnato', () => {
    expect(real.filter((edge) => !drawn.includes(edge))).toEqual([])
  })

  it('ogni arco disegnato esiste davvero', () => {
    expect(drawn.filter((edge) => !real.includes(edge))).toEqual([])
  })

  it('ogni file di src/ appartiene a un nodo del diagramma', () => {
    expect(sources.filter((path) => nodeOf(path) === null)).toEqual([])
  })
})
