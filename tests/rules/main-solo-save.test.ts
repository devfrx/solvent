import { describe, expect, it } from 'vitest'

import { fileSorgente, importDi, leggi } from '../helpers/sorgenti'

/**
 * INV-03 — il main e il preload importano da `core/` **solo** `contracts/save.ts` (ADR 0004).
 *
 * La regola ESLint dice meno di così: vieta `kernel/`, `domains/` e `balance/`, quindi lascia
 * passare `contracts/money` o `contracts/ledger`. È un denylist davanti a un invariante che è un
 * **allowlist**, ed è la stessa forma di `tests/rules/core-deps`: si esprime bene come test e male
 * come regola di lint, perché ogni file nuovo dentro `contracts/` andrebbe altrimenti aggiunto a
 * mano all'elenco dei vietati — cioè la regola si aprirebbe da sola, in silenzio.
 *
 * Oggi `src/main/` e `src/preload/` non esistono: il conteggio è zero a zero, e questa rete
 * diventa rossa il giorno in cui [D009](../../docs/delega/D009-persistenza-main.md) scrive il
 * primo import di troppo. La regola esiste prima del codice che governa, che è la lezione di D001.
 */

const DA_CORE = /(^@core\/|\/core\/)/
const AMMESSO = /(^@core|\/core)\/contracts\/save$/

const sorgenti = [...fileSorgente('src/main'), ...fileSorgente('src/preload')]

describe('cosa il main conosce di core/', () => {
  it('i due riconoscitori distinguono i casi che contano', () => {
    expect(DA_CORE.test('@core/contracts/save')).toBe(true)
    expect(DA_CORE.test('../../core/contracts/save')).toBe(true)
    expect(DA_CORE.test('electron')).toBe(false)
    expect(DA_CORE.test('./SaveFile')).toBe(false)

    expect(AMMESSO.test('@core/contracts/save')).toBe(true)
    expect(AMMESSO.test('../../core/contracts/save')).toBe(true)
    expect(AMMESSO.test('@core/contracts/money')).toBe(false)
    expect(AMMESSO.test('@core/kernel/Ledger')).toBe(false)
  })

  it('è solo contracts/save.ts, in ogni file del main e del preload', () => {
    const vietati = sorgenti.flatMap((file) =>
      importDi(leggi(file))
        .filter((specificatore) => DA_CORE.test(specificatore) && !AMMESSO.test(specificatore))
        .map((specificatore) => `${file} → ${specificatore}`)
    )

    expect(vietati).toEqual([])
  })
})
