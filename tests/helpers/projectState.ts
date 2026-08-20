import { sep } from 'node:path'

import { read, sourceFiles } from './sources'

/**
 * La derivazione di `docs/stato.md`: legge il repo e ne scrive i fatti contabili.
 *
 * C11 — un fatto che la macchina può contare ha un posto solo, ed è generato. Un documento che
 * ridice quanti ADR ci sono, o quali sono in stato `Proposta`, duplica il repo; e ciò che è
 * duplicato prima o poi diverge — l'audit del 2026-08-20 ha trovato sei affermazioni di questo
 * tipo invecchiate, sei mesi dopo che D016 ne aveva corrette altrettante a mano
 * ([D021](../../docs/delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md)).
 *
 * Qui non si valuta niente e non si giudica niente: si conta. Il perché, il come e il quanto vale
 * stanno nei documenti che scrivono le persone.
 */

/** Gli stati che un ADR dichiara nella propria intestazione (`docs/adr/README.md`). */
const DECISION_STATES = ['Accettata', 'Proposta', 'Superata'] as const

/** Gli stati di una delega (`docs/delega/README.md`, sezione _Ciclo di vita_). */
const ASSIGNMENT_STATES = ['Chiusa', 'In corso', 'Aperta'] as const

/**
 * I messaggi degli errori lanciati sono in italiano (C08), e stanno in stringhe invece che dentro
 * un template: il rilevatore di `english-identifiers` legge dentro i template literal, e non
 * distingue una parola italiana di prosa da un identificatore. È uno dei limiti che quel test
 * dichiara, e qui si aggira scrivendo il messaggio dove il rilevatore non guarda.
 */
const NO_HEADER = "stato — manca la riga «- **Stato:**» nell'intestazione di "
const UNKNOWN_STATE = 'stato — stato non riconosciuto in '

/** Le intestazioni della tabella delle righe. Sono dati, e stanno in stringhe per la stessa ragione. */
const HEADER = ['Cartella', 'File', 'Righe'] as const

const normalize = (path: string): string => path.split(sep).join('/')

/**
 * Lo stato dichiarato nell'intestazione, cioè la prima riga che comincia con `- **Stato:**`.
 *
 * Si cerca la **prima** parola di stato che compare su quella riga, e non si legge oltre: un'
 * intestazione dice «Chiusa — commit `c648639`, ramo …» oppure «Aperta — scritta il …, e
 * **preparata per l'esecuzione**», e in entrambe ciò che conta è la prima parola.
 */
const stateOf = <T extends string>(path: string, states: readonly T[]): T => {
  const header = read(path)
    .split('\n')
    .find((line) => line.startsWith('- **Stato:**'))

  if (header === undefined) {
    throw new Error(NO_HEADER + path)
  }

  const found = states
    .map((state) => ({ state, at: header.indexOf(state) }))
    .filter((candidate) => candidate.at !== -1)
    .sort((a, b) => a.at - b.at)[0]

  if (found === undefined) {
    throw new Error(UNKNOWN_STATE + path + ': ' + states.join(', '))
  }
  return found.state
}

/** Il numero di un ADR (`0027`) o l'ID di una delega (`D021`), letto dal nome del file. */
const idOf = (path: string): string => {
  const name = normalize(path).split('/').pop() ?? ''
  return name.split('-')[0] ?? name
}

/**
 * Le righe di codice di un file: niente righe vuote, niente commenti.
 *
 * È il metodo con cui il progetto ha sempre misurato — «righe di codice, commenti e righe vuote
 * escluse» — e fino a oggi viveva solo nella testa di chi contava. Scriverlo qui è metà del valore
 * di questo file: due misure fatte con due metodi diversi non sono confrontabili, e nessuno se ne
 * accorge finché non lo sono più.
 */
const codeLines = (source: string): number =>
  source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .filter((line) => !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*'))
    .length

const linesIn = (paths: readonly string[]): number =>
  paths.reduce((total, path) => total + codeLines(read(path)), 0)

/** Il CSS che vive dentro i `.vue`, che è la metà di `src/` che TypeScript non vede (difetto A14). */
const styleLines = (path: string): number => {
  const source = read(path)
  const blocks = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  return blocks.reduce((total, block) => total + codeLines(block[1] ?? ''), 0)
}

/** «1729» diventa «1.729»: è la forma in cui i documenti del progetto scrivono i numeri. */
const grouped = (value: number): string => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const under = (root: string, extensions?: string[]): string[] =>
  sourceFiles(root, extensions).map(normalize)

const byState = <T extends string>(
  paths: readonly string[],
  states: readonly T[]
): Map<T, string[]> => {
  const grouping = new Map<T, string[]>(states.map((state) => [state, []]))
  for (const path of paths) {
    grouping.get(stateOf(path, states))?.push(idOf(path))
  }
  for (const ids of grouping.values()) ids.sort()
  return grouping
}

const listOf = <T extends string>(grouping: Map<T, string[]>, state: T): string => {
  const ids = grouping.get(state) ?? []
  return ids.length === 0 ? '_nessuno_' : ids.join(', ')
}

const countOf = <T extends string>(grouping: Map<T, string[]>, state: T): number =>
  (grouping.get(state) ?? []).length

export const projectStateMarkdown = (): string => {
  const decisions = under('docs/adr', ['.md']).filter((path) => /\/\d{4}-/.test(path))
  const assignments = under('docs/delega', ['.md']).filter((path) => /\/D\d{3}-/.test(path))
  const documents = [...under('docs', ['.md']), 'README.md']

  const components = under('src', ['.vue'])
  const tests = under('tests', ['.ts']).filter((path) => path.endsWith('.test.ts'))
  const sources = under('src', ['.ts', '.vue'])

  const contracts = under('src/core/contracts', ['.ts'])
  const kernel = under('src/core/kernel', ['.ts'])
  const balance = under('src/core/balance', ['.ts'])
  const domains = under('src/core/domains', ['.ts'])
  const platform = [...under('src/main', ['.ts']), ...under('src/preload', ['.ts'])]
  const renderer = under('src/renderer', ['.ts', '.vue'])
  const words = under('src/renderer/i18n', ['.ts'])

  const decided = byState(decisions, DECISION_STATES)
  const assigned = byState(assignments, ASSIGNMENT_STATES)

  // `src/core/domains/income/rules.ts` → il nome del dominio è il quarto segmento, cioè l'indice 3.
  const domainNames = [...new Set(domains.map((path) => path.split('/')[3] ?? ''))].sort()

  const rows = [
    ['`src/core/contracts/`', contracts.length, linesIn(contracts)],
    ['`src/core/kernel/`', kernel.length, linesIn(kernel)],
    ['`src/core/balance/`', balance.length, linesIn(balance)],
    ['`src/core/domains/`', domains.length, linesIn(domains)],
    ['`src/main/` + `src/preload/`', platform.length, linesIn(platform)],
    ['`src/renderer/`', renderer.length, linesIn(renderer)],
    ['— di cui `src/renderer/i18n/`', words.length, linesIn(words)],
    [
      '— di cui CSS dentro i `.vue`',
      components.length,
      components.reduce((t, p) => t + styleLines(p), 0)
    ]
  ] as const

  const [folder, files, lines] = HEADER
  const width = Math.max(...rows.map(([label]) => label.length), folder.length)
  const cell = (text: string): string => text.padEnd(width)

  return [
    '<!-- Generato da tests/helpers/projectState.ts, verificato da tests/rules/project-state (regola C11).',
    '     Non si modifica a mano: si rigenera con `npx vitest run tests/rules/project-state -u`. -->',
    '',
    '# Stato del progetto',
    '',
    'Questo documento non si scrive: si **conta**. Contiene i fatti del progetto che una macchina',
    'può derivare dal repo, e nessun altro documento li ripete — se ne ha bisogno, punta qui',
    '(regola C11, [D021](delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md)).',
    '',
    "Cosa **non** c'è, e perché: il numero di test non è derivabile senza eseguirli, e il tempo dei",
    'gate dipende dalla macchina. Sono le due sole affermazioni contabili del progetto che restano',
    'affidate a un occhio, e stanno in [qualita.md](qualita.md) con la data accanto.',
    '',
    '## Decisioni',
    '',
    `**${grouped(decisions.length)}** ADR: ${String(countOf(decided, 'Accettata'))} \`Accettata\`, ` +
      `${String(countOf(decided, 'Proposta'))} \`Proposta\`, ` +
      `${String(countOf(decided, 'Superata'))} \`Superata\`.`,
    '',
    `- \`Proposta\`: ${listOf(decided, 'Proposta')}`,
    `- \`Superata\`: ${listOf(decided, 'Superata')}`,
    '',
    'Il perché di ciascuna sta nel [compendio](adr/README.md); uno stato si legge',
    "dall'intestazione del suo ADR, ed è da lì che questo elenco arriva.",
    '',
    '## Deleghe',
    '',
    `**${grouped(assignments.length)}** deleghe: ${String(countOf(assigned, 'Chiusa'))} \`Chiusa\`, ` +
      `${String(countOf(assigned, 'In corso'))} \`In corso\`, ` +
      `${String(countOf(assigned, 'Aperta'))} \`Aperta\`.`,
    '',
    `- \`Aperta\`: ${listOf(assigned, 'Aperta')}`,
    `- \`In corso\`: ${listOf(assigned, 'In corso')}`,
    '',
    "L'ordine in cui si eseguono non è questo elenco: è il grafo in",
    '[delega/README.md](delega/README.md).',
    '',
    '## Documenti',
    '',
    `**${grouped(documents.length)}** markdown: ${grouped(documents.length - 1)} sotto \`docs/\`, ` +
      'più il `README.md` della radice.',
    '',
    '## Codice',
    '',
    `**${grouped(sources.length)}** file sotto \`src/\`, di cui **${grouped(components.length)}** \`.vue\`.`,
    `**${grouped(tests.length)}** file di test. I domini sono ${String(domainNames.length)}: ` +
      `${domainNames.map((name) => `\`${name}\``).join(', ')}.`,
    '',
    'Le righe sono **righe di codice**: commenti e righe vuote escluse, con lo stesso metodo per',
    'tutti — ed è `codeLines` in `tests/helpers/projectState.ts` a definirlo, così due misure restano',
    'confrontabili.',
    '',
    '| ' + cell(folder) + ' | ' + files + ' | ' + lines + ' |',
    '| ' +
      '-'.repeat(width) +
      ' | ' +
      '-'.repeat(files.length) +
      ' | ' +
      '-'.repeat(lines.length) +
      ' |',
    // Le colonne si allineano a sinistra perché è così che le scrive Prettier, che sulla
    // formattazione è l'unica autorità (ADR 0013). Allinearle a destra è più bello e rende rosso
    // `format:check`: due gate che si contraddicono su un file generato sono un file che nessuno
    // può tenere verde.
    ...rows.map(
      ([label, count, total]) =>
        '| ' +
        cell(label) +
        ' | ' +
        String(count).padEnd(files.length) +
        ' | ' +
        grouped(total).padEnd(lines.length) +
        ' |'
    ),
    ''
  ].join('\n')
}
