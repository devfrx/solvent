import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R04 — un numero di gioco vive in `balance/constants.ts`, e un **importo** è un numero di gioco.
 *
 * Sotto `domains/**` c'è già `no-magic-numbers`, provato in D010: `.div(10)` scritto a mano
 * diventa rosso. Ma `Money` non si costruisce da un numero — si costruisce da una **stringa**
 * (`fromString('2.50')`, ADR 0006), e una stringa non è un numero magico per ESLint. Il denaro,
 * cioè proprio la categoria di valori che R04 esiste per proteggere, passava attraverso.
 *
 * Verificato scrivendo `fromString('2.50')` dentro `atm/rules.ts` invece di leggere
 * `BALANCE.ATM_FEE_FLOOR`: lint verde, ventisette test verdi. Da qui questo file.
 *
 * Il controllo guarda la **stringa**, non la funzione che la riceve. La prima versione cercava
 * `fromString(` e `new Decimal(`, e un `import { fromString as fromLiteral }` le passava davanti
 * senza svegliarla — trovato provando la rottura. Una regola che si aggira rinominando un import
 * protegge solo chi non stava sbagliando.
 *
 * Cosa **non** vieta: `fromString(saved.balance)`, cioè costruire denaro da un dato che arriva da
 * fuori. È l'uso legittimo, e sarà quello del `load` del primo dominio che salva un importo. A
 * distinguerli è l'argomento: un letterale è un bilanciamento, una variabile è una lettura. Se un
 * giorno servisse davvero un letterale in un dominio, la risposta è spostarlo in `constants.ts` —
 * non allargare questo test.
 */

/**
 * Una stringa che è soltanto un numero: `'2.50'`, `'-1'`. Non `'reason.atm.withdraw'`.
 *
 * Costruita da una stringa invece che scritta come `/regex/` letterale, e non per gusto: le tre
 * virgolette dentro un'espressione regolare mandano fuori fase la scansione di
 * `english-identifiers`, che da lì in poi legge le descrizioni dei test come se fossero codice. Il
 * suo commento dichiarava quel limite come "rumore, non falsi positivi": qui ne ha prodotti tre.
 */
const QUOTE = '[\'"`]'
const NUMBER_AS_STRING = new RegExp(`${QUOTE}-?\\d+(?:\\.\\d+)?${QUOTE}`)

const normalize = (path: string): string => path.split(sep).join('/')

const domainSources = sourceFiles('src/core/domains').map(normalize)

describe('il rilevatore', () => {
  it('prende un importo costruito da un letterale, da qualunque porta', () => {
    expect(NUMBER_AS_STRING.test(`const fee = fromString('2.50')`)).toBe(true)
    expect(NUMBER_AS_STRING.test('const fee = fromString("2.50")')).toBe(true)
    expect(NUMBER_AS_STRING.test(`const fee = new Decimal('2.50')`)).toBe(true)
  })

  it('non si lascia aggirare rinominando l’import', () => {
    expect(NUMBER_AS_STRING.test(`const fee = fromLiteral('2.50')`)).toBe(true)
    expect(NUMBER_AS_STRING.test(`const cost = money('800')`)).toBe(true)
  })

  it('lascia passare un importo costruito da un dato che arriva da fuori', () => {
    expect(NUMBER_AS_STRING.test('const balance = fromString(saved.balance)')).toBe(false)
    expect(NUMBER_AS_STRING.test('const fee = BALANCE.ATM_FEE_FLOOR')).toBe(false)
  })

  it('non grida al lupo sulle stringhe che i domini scrivono davvero', () => {
    expect(NUMBER_AS_STRING.test(`{ reason: 'reason.atm.withdraw' }`)).toBe(false)
    expect(NUMBER_AS_STRING.test(`const id = 'income.upgrade.overtime'`)).toBe(false)
    expect(NUMBER_AS_STRING.test(`{ code: 'error.atm.fee_exceeds_amount' }`)).toBe(false)
  })
})

describe('i domini non costruiscono denaro da un letterale', () => {
  it('ci sono dei file di dominio da guardare, altrimenti il test non guarda niente', () => {
    expect(domainSources.length).toBeGreaterThan(3)
  })

  it('in nessun file sotto src/core/domains/', () => {
    const offenders = domainSources.filter((file) =>
      NUMBER_AS_STRING.test(withoutComments(read(file)))
    )

    expect(offenders).toEqual([])
  })
})
