import { describe, expect, it } from 'vitest'

import { fromString, toString } from '@core/contracts/money'
import type { PaymentOption, PriceList } from '@core/contracts/payment'

/**
 * ADR 0027 — il vocabolario del pagamento. Non ha funzioni, quindi qui non c'è comportamento da
 * provare: c'è la **forma**, e a farla valere è il compilatore.
 *
 * Un file di soli tipi senza test sarebbe un contratto di cui nessuno ha mai verificato che dica
 * quello che crede di dire. È lo stesso patto di `tests/contracts/commands`, dove metà dei casi
 * sono `@ts-expect-error`: un errore atteso che smettesse di esserlo renderebbe questo file rosso.
 */

const CARD: PaymentOption = { pool: 'card', price: fromString('800') }
const CASH: PaymentOption = { pool: 'cash', price: fromString('900') }

describe('PaymentOption', () => {
  it('è uno strumento e il suo prezzo, e nient’altro', () => {
    expect(Object.keys(CARD).sort()).toEqual(['pool', 'price'])
    expect(toString(CARD.price)).toBe('800')

    // @ts-expect-error — il calore arriva con la fetta 04, e arriva **additivo**: finché non c'è,
    // scriverlo non compila, e nessun chiamante può cominciare a leggerlo per sbaglio. Questa
    // riga è il grilletto del registro YAGNI messo davanti al compilatore.
    const early: PaymentOption = { pool: 'card', price: fromString('800'), heat: 1 }
    expect(early).toBeTypeOf('object')
  })

  it('non si modifica dopo essere stata costruita — e la difesa è **di compilazione**', () => {
    const option: PaymentOption = { pool: 'card', price: fromString('800') }

    // @ts-expect-error — un prezzo che si può riscrivere è un prezzo che la UI può cambiare, e
    // INV-19 diventerebbe una promessa invece di una proprietà.
    option.price = fromString('1')

    // Il limite, dichiarato invece che sottinteso: `readonly` non congela niente a runtime. Se la
    // riga sopra compilasse, il prezzo cambierebbe davvero — ed è cambiato. A fermarla è il gate,
    // non l'oggetto, ed è lo stesso patto delle altre regole ⚠️ parziali del progetto.
    expect(toString(option.price)).toBe('1')
  })

  it('porta un `Money`, non un numero', () => {
    // @ts-expect-error — ADR 0006: un importo che passa da un `number` perde centesimi, e la
    // partita doppia lo scopre come una somma che non fa zero.
    const broken: PaymentOption = { pool: 'card', price: 800 }
    expect(broken).toBeTypeOf('object')
  })

  it('e un pool che non esiste non compila', () => {
    // @ts-expect-error — i pool sono `POOL_IDS`, non stringhe libere (ADR 0017).
    const broken: PaymentOption = { pool: 'crypto', price: fromString('1') }
    expect(broken).toBeTypeOf('object')
  })
})

describe('PriceList', () => {
  it('di una voce è un listino come gli altri, non un caso speciale', () => {
    const single: PriceList = [CARD]
    const double: PriceList = [CASH, CARD]

    expect(single).toHaveLength(1)
    expect(double.map((option) => option.pool)).toEqual(['cash', 'card'])
  })

  it('non si allunga: chi lo riceve lo legge e basta', () => {
    const prices: PriceList = [CARD]

    // @ts-expect-error — il listino è dell'azione che lo dichiara; chi lo legge non ci aggiunge
    // opzioni, o il giocatore vedrebbe uno strumento che il Ledger poi rifiuta. `readonly` toglie
    // `push` dal tipo, e come sopra è una difesa di compilazione: l'array resta un array.
    prices.push(CASH)
    expect(prices).toHaveLength(2)
  })
})
