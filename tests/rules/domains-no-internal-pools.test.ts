import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import type { Pool } from '@core/contracts/pools'
import { POOL_IDS, POOLS } from '@core/contracts/pools'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * INV-10 · ADR 0020 — nessun dominio nomina a mano un conto non-giocatore.
 *
 * I costruttori del Ledger — `income`, `spend`, `transfer` — esistono proprio perché la
 * contropartita la scriva il kernel: chi scrive un dominio dichiara una grandezza e un pool del
 * giocatore, e non deve sapere che dall'altra parte c'è `world`, `sink` o `fees`. Un dominio che
 * li nomina sta costruendo una transazione a mano, ed è il gesto da cui nasce il difetto A05.
 *
 * L'elenco dei conti vietati **si deriva** da `POOLS` invece di essere ricopiato: il giorno in cui
 * ne nasce un quinto, questo test lo protegge senza che nessuno se lo ricordi. Il registro
 * (docs/tracciabilita.md) dichiarava un `grep` a mano, che oltre a non essere mai stato eseguito
 * sarebbe **rosso oggi**: `income/system.ts` nomina `world` in un commento, per dire che non lo
 * nomina. Da qui il passaggio da `withoutComments` — un commento che spiega una regola deve poterla
 * citare.
 */

const INTERNAL_POOLS: readonly Pool[] = POOL_IDS.filter((pool) => !POOLS[pool].player)

/**
 * "Nominare" un pool significa scriverne il nome come stringa: `ledger.balance('fees')`. Non un
 * identificatore che ci somiglia — `feeWithheld` non nomina niente. Le tre virgolette invece di
 * un'espressione regolare: il caso è così semplice che una `RegExp` costruita a pezzi sarebbe
 * l'unica parte difficile da leggere del file.
 */
const QUOTES = ["'", '"', '`']

const namesPool = (code: string, pool: Pool): boolean =>
  QUOTES.some((quote) => code.includes(`${quote}${pool}${quote}`))

const normalize = (path: string): string => path.split(sep).join('/')

const domainSources = sourceFiles('src/core/domains').map(normalize)

describe('il rilevatore', () => {
  it('prende un pool nominato come stringa, con qualunque virgoletta', () => {
    expect(namesPool(`ledger.balance('fees')`, 'fees')).toBe(true)
    expect(namesPool('{ pool: "world", amount }', 'world')).toBe(true)
    expect(namesPool('const id = `sink`', 'sink')).toBe(true)
  })

  it('non grida al lupo su un identificatore che ci somiglia', () => {
    expect(namesPool('const feesPaid = 0', 'fees')).toBe(false)
    expect(namesPool('const worldly = true', 'world')).toBe(false)
    expect(namesPool(`transfer('card', 'cash', amount, fee)`, 'fees')).toBe(false)
  })

  it('non guarda i commenti, altrimenti sarebbe rosso su chi spiega la regola', () => {
    const excuse = withoutComments("/** `world` non lo nomina mai */\nconst pool = 'cash'")

    expect(namesPool(excuse, 'world')).toBe(false)
  })
})

describe('i conti non-giocatore', () => {
  it('si derivano da POOLS e sono cinque', () => {
    expect([...INTERNAL_POOLS]).toEqual(['world', 'sink', 'fees', 'house', 'tax'])
  })

  it('ci sono dei file di dominio da guardare, altrimenti il test non guarda niente', () => {
    expect(domainSources.length).toBeGreaterThan(3)
  })

  it('non compaiono in nessun file sotto src/core/domains/', () => {
    const offenders = domainSources.flatMap((file) => {
      const code = withoutComments(read(file))
      return INTERNAL_POOLS.filter((pool) => namesPool(code, pool)).map(
        (pool) => `${file}: ${pool}`
      )
    })

    expect(offenders).toEqual([])
  })
})
