import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/** Elenca ricorsivamente i file sorgente sotto `radice`. Ritorna [] se la cartella non esiste. */
export function fileSorgente(radice: string, estensioni = ['.ts', '.vue']): string[] {
  let voci: string[]
  try {
    voci = readdirSync(radice)
  } catch {
    return []
  }

  return voci.flatMap((voce) => {
    const percorso = join(radice, voce)
    if (statSync(percorso).isDirectory()) return fileSorgente(percorso, estensioni)
    return estensioni.some((e) => percorso.endsWith(e)) ? [percorso] : []
  })
}

export const leggi = (percorso: string): string => readFileSync(percorso, 'utf8')

/** Gli specificatori di ogni `import ... from '...'` e `export ... from '...'` in un sorgente. */
export function importDi(sorgente: string): string[] {
  const specificatori: string[] = []
  const espressione = /(?:^|\n)\s*(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g
  let trovato: RegExpExecArray | null
  while ((trovato = espressione.exec(sorgente)) !== null) {
    const specificatore = trovato[1]
    if (specificatore !== undefined) specificatori.push(specificatore)
  }
  return specificatori
}
