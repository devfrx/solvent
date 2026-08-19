import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** Elenca ricorsivamente i file sorgente sotto `root`. Ritorna [] se la cartella non esiste. */
export function sourceFiles(root: string, extensions = ['.ts', '.vue']): string[] {
  let entries: string[]
  try {
    entries = readdirSync(root)
  } catch {
    return []
  }

  return entries.flatMap((entry) => {
    const path = join(root, entry)
    if (statSync(path).isDirectory()) return sourceFiles(path, extensions)
    return extensions.some((e) => path.endsWith(e)) ? [path] : []
  })
}

export const read = (path: string): string => readFileSync(path, 'utf8')

/**
 * Toglie i commenti da un sorgente. Serve ai test di regola che cercano una forma vietata: un
 * commento che spiega **perché** quella forma è vietata la nomina senza usarla, e senza questo
 * la regola costringerebbe a non poter spiegare se stessa.
 */
export const withoutComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

/** Gli specificatori di ogni `import ... from '...'` e `export ... from '...'` in un sorgente. */
export function importsOf(source: string): string[] {
  const specifiers: string[] = []
  const pattern = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)) !== null) {
    const specifier = match[1]
    if (specifier !== undefined) specifiers.push(specifier)
  }
  return specifiers
}
