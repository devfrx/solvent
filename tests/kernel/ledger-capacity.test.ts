import { describe, expect, it } from 'vitest'

import { fromString } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'

import { createBus } from '@core/kernel/Bus'
import type { Capacities } from '@core/kernel/Ledger'
import { createLedger, income, poolCapacity, spend } from '@core/kernel/Ledger'

/**
 * ADR 0025 — la capienza di un pool **si chiede, non si legge**.
 *
 * Fino a D017 questo file sostituiva `@core/contracts/pools` con `vi.mock`, ed era l'unico test
 * del progetto che sostituisse un modulo: la capienza era una costante compilata, e provarne i
 * bordi non si poteva fare altrimenti. Adesso si passa una funzione, e quel mock **non serve più**.
 *
 * Che una decisione strutturale cancelli un'eccezione invece di aggiungerne una è il segnale che
 * il confine scelto era già quello giusto — la stessa forma del fix di radice di D016, che
 * toglieva codice invece di aggiungerne.
 */

const money = fromString

/** Una capienza finta, che il Ledger deve obbedire senza sapere da dove viene. */
const cappedAt =
  (limit: string): Capacities =>
  (pool) =>
    pool === 'cash' ? money(limit) : poolCapacity(pool)

const CAP = '1000'

describe('la capienza di un pool', () => {
  it('accetta ciò che ci sta esattamente', () => {
    const ledger = createLedger(createBus(), cappedAt(CAP))

    const result = ledger.transaction(income('cash', money(CAP)), {
      reason: 'reason.income.tick'
    })

    expect(result.ok).toBe(true)
    expect(ledger.balance('cash').toString()).toBe(CAP)
  })

  it('rifiuta ciò che la supererebbe, e dice quanto ci starebbe ancora', () => {
    const ledger = createLedger(createBus(), cappedAt(CAP))
    ledger.transaction(income('cash', money('700')), { reason: 'reason.income.tick' })

    const result = ledger.transaction(income('cash', money('400')), {
      reason: 'reason.income.tick'
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.code).toBe('error.ledger.capacity_exceeded')
    if (result.error.code !== 'error.ledger.capacity_exceeded') return
    expect(result.error.pool).toBe('cash')
    expect(result.error.capacity.toString()).toBe(CAP)
    expect(result.error.fits.toString()).toBe('300')
  })

  it('il rifiuto non muove niente, nemmeno il conto sorgente', () => {
    const bus = createBus()
    const ledger = createLedger(bus, cappedAt(CAP))
    let emitted = 0
    bus.on('money.posted', () => {
      emitted += 1
    })
    ledger.transaction(income('cash', money('700')), { reason: 'reason.income.tick' })
    emitted = 0

    ledger.transaction(income('cash', money('400')), { reason: 'reason.income.tick' })

    expect(ledger.balance('cash').toString()).toBe('700')
    expect(ledger.balance('world').toString()).toBe('-700')
    expect(emitted).toBe(0)
  })

  it('un saldo già oltre il tetto può ancora **scendere**', () => {
    // D028 — il caso che nessun test copriva, ed è quello che aveva murato viva la partita di
    // sviluppo: 1.009.051,70 € di contanti contro un tetto di 1.000,00 €. Il controllo guardava
    // solo il saldo che risulta, quindi rifiutava anche un deposito che **toglie** contanti — il
    // giocatore non poteva né depositare, né prelevare, né ampliare il caveau.
    const ledger = createLedger(createBus(), cappedAt(CAP))
    ledger.load({
      balances: { cash: '9000', card: '0', world: '-9000', sink: '0', fees: '0', house: '0' }
    })

    const result = ledger.transaction(spend('cash', money('500')), { reason: 'reason.atm.deposit' })

    expect(result.ok).toBe(true)
    expect(ledger.balance('cash').toString()).toBe('8500')
  })

  it('ma non può salire di un centesimo', () => {
    // L'altra metà della stessa regola, e senza di lei «può scendere» diventerebbe «non c'è tetto»
    // per chiunque sia già sopra: la capienza ferma **chi sale**, non chi si trova già in alto.
    const ledger = createLedger(createBus(), cappedAt(CAP))
    ledger.load({
      balances: { cash: '9000', card: '0', world: '-9000', sink: '0', fees: '0', house: '0' }
    })

    const result = ledger.transaction(income('cash', money('0.01')), {
      reason: 'reason.income.tick'
    })

    expect(result.ok).toBe(false)
  })

  it('e il rifiuto non promette spazio negativo', () => {
    // Prima diceva «ci stanno ancora -8.000,00 €», che non è una quantità. `roomIn` è la stessa
    // funzione da cui il reddito sa quanto accreditare, quindi la frase e l'accredito non possono
    // più raccontare due cose diverse.
    const ledger = createLedger(createBus(), cappedAt(CAP))
    ledger.load({
      balances: { cash: '9000', card: '0', world: '-9000', sink: '0', fees: '0', house: '0' }
    })

    const result = ledger.transaction(income('cash', money('1')), { reason: 'reason.income.tick' })

    expect(result.ok).toBe(false)
    if (result.ok) return
    if (result.error.code !== 'error.ledger.capacity_exceeded') return
    expect(result.error.fits.toString()).toBe('0')
  })

  it('un pool senza capienza non ha tetto', () => {
    const ledger = createLedger(createBus(), cappedAt(CAP))

    const result = ledger.transaction(income('card', money('999999999')), {
      reason: 'reason.income.tick'
    })

    expect(result.ok).toBe(true)
  })

  it('chiede a **ogni** transazione: il tetto che si sposta lo fa rispettare subito', () => {
    // È la ragione per cui l'ADR 0025 esiste, e la sola cosa che una costante compilata non
    // poteva fare. La funzione qui sotto cambia risposta a metà partita, come farà il caveau
    // ampliandosi: se il Ledger avesse letto il numero una volta sola alla costruzione, la seconda
    // transazione verrebbe rifiutata come la prima.
    let limit = money('1000')
    const ledger = createLedger(createBus(), () => limit)

    expect(
      ledger.transaction(income('cash', money('1200')), { reason: 'reason.income.tick' }).ok
    ).toBe(false)

    limit = money('5000')

    expect(
      ledger.transaction(income('cash', money('1200')), { reason: 'reason.income.tick' }).ok
    ).toBe(true)
    expect(ledger.balance('cash').toString()).toBe('1200')
  })

  it('e chi non consegna niente ottiene la capienza dichiarata dai pool', () => {
    // La trappola dichiarata di D017: il valore predefinito rende il cambiamento innocuo, ed è
    // anche ciò che lo rende facile da dimenticare — un Ledger costruito nudo prova il
    // comportamento di **prima**, non quello nuovo. Qui è il caso sotto esame, non un incidente.
    const ledger = createLedger(createBus())
    const pools: readonly Pool[] = ['cash', 'card', 'world', 'sink', 'fees', 'house']

    for (const pool of pools) expect(ledger.capacities(pool)).toBe(poolCapacity(pool))
  })

  it('la funzione che fa rispettare è la stessa che espone: INV-18 per identità', () => {
    // Non «rispondono lo stesso numero»: è lo **stesso oggetto funzione**. È ciò che permette alla
    // UI di leggere il tetto vero invece di ricostruirselo, e a un test di dimostrarlo senza
    // confrontare cifre che oggi coincidono e domani no.
    const capacities = cappedAt(CAP)

    expect(createLedger(createBus(), capacities).capacities).toBe(capacities)
  })
})
