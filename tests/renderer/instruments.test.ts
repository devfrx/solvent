import { describe, expect, it } from 'vitest'

import { POOL_IDS, POOLS } from '@core/contracts/pools'

import { instrumentKey, needsProof } from '@renderer/components/payment/instruments'

/**
 * D036 · ADR 0042 — le due domande della finestra del pagamento, provate senza montare niente:
 * è la stessa strada di `rotation.ts` e `postings.ts`, ed è la ragione per cui jsdom resta fuori.
 */

describe('se uno strumento chiede una prova', () => {
  it('la carta sì, i contanti no', () => {
    expect(needsProof('card')).toBe(true)
    expect(needsProof('cash')).toBe(false)
  })

  it('e la risposta viene dall’affordance, non dal nome del pool', () => {
    // Se questa funzione contenesse `pool === 'card'` questo controllo passerebbe lo stesso, e la
    // regola sarebbe sparsa invece che dichiarata. A dirlo è il confronto con la tabella: ogni
    // pool risponde l'inverso del proprio `bearer`, nessuno escluso.
    for (const pool of POOL_IDS) expect(needsProof(pool)).toBe(!POOLS[pool].bearer)
  })
})

describe('cosa si legge sopra un’opzione', () => {
  it('con una voce sola è la ragione, non il nome', () => {
    expect(instrumentKey(1)).toBe('payment.only_with')
  })

  it('con più voci è il nome, perché la scelta c’è davvero', () => {
    expect(instrumentKey(2)).toBe('payment.with')
    expect(instrumentKey(4)).toBe('payment.with')
  })

  it('e un listino vuoto non è il caso di una voce sola', () => {
    // Zero opzioni vuol dire che non c'è niente da comprare — l'ultimo livello del caveau — e la
    // finestra non si apre affatto. Se questa funzione rispondesse `only_with` a zero, un giorno
    // si leggerebbe «si paga solo con: undefined».
    expect(instrumentKey(0)).toBe('payment.with')
  })
})
