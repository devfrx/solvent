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
 *
 * Il commento di un `<template>` è arrivato con
 * [D038](../../docs/delega/D038-cio-che-si-preme-e-cio-che-scorre.md): `<!-- … -->` non era qui,
 * quindi una spiegazione dentro un template poteva rendere rossa la regola che stava spiegando —
 * e con R26, che vieta un `<button>` scritto a mano, sarebbe successo alla prima frase che lo
 * nomina. Fino a quel giorno la regola era rispettata **per fortuna**, che è la cosa che questo
 * progetto non accetta come meccanismo.
 */
export const withoutComments = (source: string): string =>
  source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')

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
