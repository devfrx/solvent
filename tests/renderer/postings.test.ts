import { describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'

import { income, spend, transfer } from '@core/kernel/Ledger'

import { visibleRows } from '../../src/renderer/components/ledger/postings'

/**
 * Quali movimenti di una transazione arrivano davanti al giocatore.
 *
 * I movimenti veri li costruiscono i tre costruttori del kernel, non un elenco scritto a mano:
 * questo test parla della **stessa** forma che il Ledger applica, e se domani `transfer` cambiasse
 * il numero di righe se ne accorgerebbe (convenzioni.md — niente mock del kernel).
 */

const money = fromString

const FEE = money('2.50')

describe('un reddito', () => {
  it('mostra solo dove il denaro arriva: la contropartita non è un movimento del giocatore', () => {
    // ADR 0020 — `world` esiste perché la somma faccia zero, non perché qualcuno lo guardi.
    const rows = visibleRows(income('cash', money('12')))

    expect(rows).toHaveLength(1)
    expect(rows[0]?.pool).toBe('cash')
    expect(toString(rows[0]?.amount ?? money('0'))).toBe('12')
    expect(rows[0]?.tone).toBe('in')
  })
})

describe('una spesa', () => {
  it('mostra solo l’uscita, e la marca come tale', () => {
    const rows = visibleRows(spend('card', money('800')))

    expect(rows).toHaveLength(1)
    expect(rows[0]?.pool).toBe('card')
    expect(toString(rows[0]?.amount ?? money('0'))).toBe('-800')
    expect(rows[0]?.tone).toBe('out')
  })
})

describe('un prelievo', () => {
  const rows = visibleRows(transfer('card', 'cash', money('500'), FEE))

  it('è tre righe: da dove esce, dove arriva, e quanto è costato', () => {
    expect(rows.map((row) => row.pool)).toEqual(['card', 'cash', null])
    expect(rows.map((row) => toString(row.amount))).toEqual(['-500', '497.5', '2.5'])
  })

  it('la commissione si vede ma il suo conto non ha un nome', () => {
    // ADR 0017 — i conti non-giocatore non compaiono mai nella UI. La commissione sì: è metà del
    // motivo per cui questa schermata esiste. A distinguerla è la `category`, non il nome.
    expect(rows[2]?.pool).toBeNull()
    expect(rows[2]?.tone).toBe('fee')
  })

  it('e gli importi sono **gli stessi oggetti**, non copie con gli stessi numeri', () => {
    // Identità e non uguaglianza, come per il mirror dei saldi (D011, correzione 5): una copia con
    // gli stessi numeri passerebbe un confronto strutturale e romperebbe INV-11 lo stesso — sono
    // due elenchi invece che uno, e due elenchi prima o poi divergono.
    const postings = transfer('card', 'cash', money('500'), FEE)

    const amounts = visibleRows(postings).map((row) => row.amount)

    expect(amounts).toHaveLength(postings.length)
    amounts.forEach((amount, index) => {
      expect(amount).toBe(postings[index]?.amount)
    })
  })
})

describe('una transazione senza righe da mostrare', () => {
  it('non ne mostra: nessuna riga vuota, nessun conto interno', () => {
    expect(visibleRows([])).toEqual([])
    expect(visibleRows([{ pool: 'world', amount: money('-1'), category: 'income' }])).toEqual([])
  })
})
