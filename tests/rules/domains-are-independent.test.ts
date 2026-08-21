import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { importsOf, read, sourceFiles } from '../helpers/sources'

/**
 * R19 — nessun dominio importa un altro dominio.
 *
 * La regola era **vera e non imposta da niente**, ed è
 * [D018](../../docs/delega/D018-la-scheda-di-dominio.md) a trovarla così: la domanda 6 della metà
 * kernel la afferma, e nessun ADR, invariante o test la reggeva. Il lint sotto `domains/**` vieta
 * `vue`, `pinia`, `electron` e le conversioni di `Money` — questo no.
 *
 * Era vera **per scelta, due volte nello stesso giorno**: [D017](../../docs/delega/D017-il-caveau.md)
 * ha rinunciato ad aprire l'arco sia per il reddito sia per il bancomat (correzioni 3 e 4). Tutte
 * e due le volte lo spazio del caveau è arrivato **per argomento**, consegnato da chi aveva
 * entrambi i capi sotto mano — il bootstrap e lo store
 * ([ADR 0024](../../docs/adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md)).
 *
 * Una scelta ripetuta è una regola che non si sa di avere. Con diciassette domini a contendersi le
 * stesse risorse, il primo arco disegnato per comodità è il precedente che apre gli altri sedici, e
 * nessun gate lo direbbe: `income` che importa `vault/rules` compila, passa il lint e passa i test.
 *
 * **Vale anche per i soli tipi**, ed è deliberato: un `import type` non aggiunge codice ma aggiunge
 * un nome, e il giorno in cui quel nome cambia forma sono due domini a doversi muovere insieme. È
 * la stessa ragione per cui R05 non distingue un import di tipo.
 *
 * Il confine con `tests/rules/import-graph` è netto: quello sorveglia i passaggi **fra livelli** e
 * dichiara di non modellare gli archi interni a un livello — `domains/* --> domains/*` è
 * esattamente uno di quelli, e per questo gli sfugge. Il diagramma di `docs/architettura.md` lo
 * diceva in prosa, sotto _Frecce vietate_.
 */

const DOMAINS_ROOT = 'src/core/domains/'

const ALIAS = '@core/domains/'

const normalize = (path: string): string => path.split(sep).join('/')

/**
 * A quale dominio appartiene un percorso, `null` se non è dentro un dominio.
 *
 * Un file **direttamente** sotto `domains/` non appartiene a nessuno: oggi non ce ne sono, e il
 * giorno in cui ne nascesse uno non sarebbe un dominio da sorvegliare ma un file comune da
 * discutere.
 */
const domainOf = (path: string): string | null => {
  if (!path.startsWith(DOMAINS_ROOT)) return null
  const parts = path.slice(DOMAINS_ROOT.length).split('/')
  return parts.length > 1 ? (parts[0] ?? null) : null
}

/**
 * Il dominio che un import raggiunge, risolvendo l'alias e i percorsi relativi.
 *
 * I relativi contano quanto l'alias: `../atm/rules` è lo stesso arco di `@core/domains/atm/rules`
 * scritto in un altro modo, ed è la forma in cui nascerebbe davvero — chi sta dentro `vault/`
 * scrive `../atm/`, non l'alias.
 */
const importedDomain = (from: string, specifier: string): string | null => {
  if (specifier.startsWith(ALIAS))
    return domainOf(`${DOMAINS_ROOT}${specifier.slice(ALIAS.length)}`)
  if (!specifier.startsWith('.')) return null

  const parts = `${from.split('/').slice(0, -1).join('/')}/${specifier}`.split('/')
  const resolved: string[] = []
  for (const part of parts) {
    if (part === '.' || part === '') continue
    if (part === '..') resolved.pop()
    else resolved.push(part)
  }
  return domainOf(resolved.join('/'))
}

const sources = sourceFiles(DOMAINS_ROOT.replace(/\/$/, '')).map(normalize)

/** Ogni arco `dominio --> altro dominio` che esiste davvero, con il file che lo scrive. */
const crossings = (): string[] =>
  sources.flatMap((path) => {
    const own = domainOf(path)
    if (own === null) return []
    return importsOf(read(path))
      .map((specifier) => importedDomain(path, specifier))
      .filter((other): other is string => other !== null && other !== own)
      .map((other) => `${path}: importa ${other}`)
  })

describe('il rilevatore', () => {
  it('riconosce il dominio di un file, e nessuno fuori da domains/', () => {
    expect(domainOf('src/core/domains/vault/rules.ts')).toBe('vault')
    expect(domainOf('src/core/kernel/Ledger.ts')).toBeNull()
    expect(domainOf('src/core/domains/orphan.ts')).toBeNull()
  })

  it('lascia passare un fratello dello stesso dominio', () => {
    expect(importedDomain('src/core/domains/vault/system.ts', './rules')).toBe('vault')
    expect(importedDomain('src/core/domains/vault/system.ts', './types')).toBe('vault')
  })

  it('prende l’arco scritto con l’alias e quello scritto relativo', () => {
    expect(importedDomain('src/core/domains/income/system.ts', '@core/domains/vault/rules')).toBe(
      'vault'
    )
    expect(importedDomain('src/core/domains/vault/system.ts', '../atm/rules')).toBe('atm')
  })

  it('non chiama dominio ciò che non lo è', () => {
    expect(importedDomain('src/core/domains/atm/rules.ts', '@core/contracts/money')).toBeNull()
    expect(importedDomain('src/core/domains/atm/rules.ts', '../../balance/constants')).toBeNull()
    expect(importedDomain('src/core/domains/atm/rules.ts', 'decimal.js')).toBeNull()
  })

  it('prende anche un import di soli tipi, che ne porta comunque il nome', () => {
    const line = "import type { VaultState } from '@core/domains/vault/types'"

    expect(importsOf(line)).toEqual(['@core/domains/vault/types'])
  })
})

describe('i domini', () => {
  it('ce ne sono da guardare, altrimenti questo test non guarda niente', () => {
    expect(new Set(sources.map(domainOf)).size).toBeGreaterThan(2)
  })

  it('nessuno importa un altro dominio', () => {
    expect(crossings()).toEqual([])
  })
})
