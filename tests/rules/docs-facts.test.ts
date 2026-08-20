import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles } from '../helpers/sources'

/**
 * C11, seconda metà — nessun documento ridice un fatto che `docs/stato.md` possiede.
 *
 * Generare `stato.md` toglie l'errore da un posto; questo test lo toglie da tutti gli altri. Senza,
 * la prima metà sarebbe una fonte di verità accanto a sei copie, che è esattamente la situazione
 * che l'audit del 2026-08-20 ha trovato
 * ([D021](../../docs/delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md)).
 *
 * Due controlli, con due forze diverse e dichiarate.
 *
 * Il primo è ⚠️ **parziale**, come `english-identifiers`: cerca le forme in cui i sei difetti sono
 * nati — un numero accanto alla parola «ADR», «deleghe», «documenti» — e non pretende di prenderle
 * tutte. Una frase costruita diversamente gli sfugge. Meglio di niente, e onesto su cosa non vede.
 *
 * Il secondo è ✅ **esatto**: ogni ADR e ogni delega compaiono nel proprio indice. È il difetto
 * AUD-012 — D020 era nel grafo e nella prosa di `docs/delega/README.md`, e non nella sua tabella —
 * ed è la stessa forma di `registry-completeness`, che confronta i sistemi registrati con i file
 * che li dichiarano.
 */

const normalize = (path: string): string => path.split(sep).join('/')

/** I numeri come li scrivono i documenti del progetto: a parole, e in cifre. */
const NUMBERS = [
  'due',
  'tre',
  'quattro',
  'cinque',
  'sei',
  'sette',
  'otto',
  'nove',
  'dieci',
  'undici',
  'dodici',
  'tredici',
  'quattordici',
  'quindici',
  'sedici',
  'diciassette',
  'diciotto',
  'diciannove',
  'venti',
  'ventuno',
  'ventidue',
  'ventitre',
  'ventitré',
  'ventiquattro',
  'venticinque',
  'ventisei',
  'ventisette',
  'trenta',
  'quaranta',
  'cinquanta',
  'sessanta',
  'settanta',
  'ottanta',
  'novanta',
  'cento'
]

/**
 * Le cose che `stato.md` conta e che in italiano non hanno un altro uso comune.
 *
 * `deleghe` e `decisioni` sono **fuori** apposta: «fra due deleghe», «le due decisioni scartate»
 * sono prosa normale, e includerle produceva una ventina di falsi positivi. Un test che grida al
 * lupo viene disattivato, e da quel momento non protegge niente. I loro conteggi restano coperti
 * dalla terza forma — quella che lega uno stato a un numero — e dalla completezza degli indici.
 */
const COUNTED = ['ADR', 'documenti', 'markdown']

/**
 * Un numero, a parole o in cifre — ma **non** un identificatore.
 *
 * `0006` è il numero di un ADR e `D021` quello di una delega: sono nomi, non quantità, e citarli è
 * ciò che i documenti devono fare. `(?!0\d)` li lascia passare senza indebolire il resto, perché
 * nessun conteggio di questo progetto comincia per zero.
 */
const NUMBER = `(?:${NUMBERS.join('|')}|(?!0\\d)\\d+)`
const SUBJECT = `(?:${COUNTED.join('|')})`

/**
 * Tre forme, e tutte e tre **strette**. La prima versione di questo rilevatore legava un numero a
 * una cosa contata entro venticinque caratteri, e trovava cinquecentocinquantacinque riscontri: un
 * test che grida al lupo viene disattivato, e da quel momento non protegge più niente. Queste tre
 * sono le forme in cui i sei difetti dell'audit sono nati davvero, e nient'altro.
 */
const PATTERNS: readonly RegExp[] = [
  /** «cinquanta documenti», «sei decisioni», «Ventisette ADR» — il numero attaccato alla cosa. */
  new RegExp(`\\b${NUMBER}\\s+${SUBJECT}\\b`, 'gi'),

  /** «gli ADR … sono tre» — la cosa, un verbo, il numero. */
  new RegExp(
    `\\b${SUBJECT}\\b[^.\\n]{0,20}?\\b(?:sono|restano)\\b[^.\\n]{0,10}?\\b${NUMBER}\\b`,
    'gi'
  ),

  /** «Restano _Proposta_ in tre» — lo stato di una decisione, e quanti ne sono. */
  // Senza i confini di parola apposta: nei documenti lo stato si scrive `_Proposta_` e `` `Proposta` ``,
  // e un `\b` dopo la «a» non c'è quando la parola è seguita da un trattino basso.
  new RegExp(`(?:Proposta|Accettata)[^.\\n]{0,12}?\\b${NUMBER}\\b`, 'gi'),

  /** L'intervallo di un albero di cartelle: `adr/0001..0024-*.md` è un conteggio travestito. */
  /\b\d{4}\.\.\d{4}\b/g,

  /** «Non resta aperta nessuna delega»: è un conteggio, e vale zero. */
  /nessuna delega aperta|non resta aperta nessuna delega/gi
]

export const restatements = (markdown: string): string[] =>
  PATTERNS.flatMap((pattern) => markdown.match(pattern) ?? [])

/**
 * I documenti su cui la regola vale: quelli **vivi**.
 *
 * Restano fuori gli ADR numerati e le deleghe, e non è un permesso: è la loro natura, dichiarata da
 * `docs/README.md`. Un ADR è **append-only** — «un ADR superato non si cancella» — e una delega
 * chiusa è «un documento storico, non una fonte di verità sul codice corrente». Un conteggio
 * scritto lì dentro descrive il momento in cui è stato scritto, ed è corretto che non cambi mai:
 * «quindici deleghe» in D013 racconta quante ce n'erano allora, e riscriverlo sarebbe falsificare
 * un verbale.
 *
 * L'esclusione è **strutturale** e non un elenco: un documento vivo nuovo è coperto dal giorno in
 * cui nasce, senza che nessuno si ricordi di aggiungerlo.
 */
const HISTORICAL = /^docs\/(?:adr\/\d{4}-|delega\/D\d{3}-)/

const GENERATED = 'docs/stato.md'

const documents = [...sourceFiles('docs', ['.md']), 'README.md']
  .map(normalize)
  .filter((path) => path !== GENERATED && !HISTORICAL.test(path))

const idsIn = (path: string, pattern: RegExp): string[] => [
  ...new Set([...read(path).matchAll(pattern)].map((match) => match[1] ?? ''))
]

const filesIn = (root: string, pattern: RegExp): string[] =>
  sourceFiles(root, ['.md'])
    .map(normalize)
    .map((path) => pattern.exec(path)?.[1] ?? '')
    .filter((id) => id !== '')

describe('il rilevatore dei conteggi', () => {
  it('prende un numero scritto a parole accanto a una cosa contata', () => {
    expect(restatements('Gli ADR `Proposta` sono tre, non otto.')).not.toEqual([])
    expect(restatements('Restano _Proposta_ in tre, e per ognuna è scritto perché.')).not.toEqual(
      []
    )
    expect(restatements('i cinquanta documenti del progetto sono in italiano')).not.toEqual([])
  })

  it('prende un numero in cifre, che è la forma in cui invecchia più in fretta', () => {
    expect(restatements('Ventisette ADR, di cui 6 `Proposta`.')).not.toEqual([])
  })

  it("prende l'intervallo di un albero di cartelle", () => {
    expect(restatements('│  └─ adr/0001..0024-*.md')).toContain('0001..0024')
  })

  it('lascia stare una frase che non conta niente', () => {
    expect(restatements('Il perché di ogni decisione sta nel compendio.')).toEqual([])
    expect(restatements('Una delega chiusa è un documento storico.')).toEqual([])
  })

  it('non lega un numero a una cosa contata che sta lontano', () => {
    expect(
      restatements('diciassette difetti misurati, e ognuno ha la sua riga nelle deleghe')
    ).toEqual([])
  })
})

describe('nessun documento ridice un conteggio', () => {
  it('ce ne sono da guardare, altrimenti questo test non guarda niente', () => {
    expect(documents.length).toBeGreaterThan(12)
  })

  it('in nessuno di loro', () => {
    const offenders = documents.flatMap((document) =>
      restatements(read(document)).map((hit) => `${document}: ${hit.trim()}`)
    )

    expect(offenders).toEqual([])
  })
})

describe('gli indici sono completi', () => {
  it('ogni ADR compare nella tabella del compendio', () => {
    const declared = idsIn('docs/adr/README.md', /\[(\d{4})\]\(\d{4}-/g)
    const existing = filesIn('docs/adr', /\/(\d{4})-/)

    expect(existing.length).toBeGreaterThan(20)
    expect(existing.filter((id) => !declared.includes(id))).toEqual([])
  })

  it("ogni delega compare nell'indice", () => {
    const declared = idsIn('docs/delega/README.md', /\[(D\d{3})\]\(D\d{3}-/g)
    const existing = filesIn('docs/delega', /\/(D\d{3})-/)

    expect(existing.length).toBeGreaterThan(20)
    expect(existing.filter((id) => !declared.includes(id))).toEqual([])
  })
})
