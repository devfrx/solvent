import type { Cheat, CheatResult } from '@core/contracts/cheats'
import type { Money } from '@core/contracts/money'
import { fromString, ZERO } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import type { Result } from '@core/contracts/result'
import { ok } from '@core/contracts/result'

import type { Ledger } from '@core/kernel/Ledger'
import { income, spend } from '@core/kernel/Ledger'

/**
 * D029 · R20 — i cheat del denaro, dichiarati da chi il denaro ce l'ha.
 *
 * Non stanno in un dominio perché il denaro non è di un dominio: `atm` lo **sposta** e `income` lo
 * fa entrare, ma a crearlo dal nulla — con la contropartita su `world` — è il Ledger, ed è l'
 * [ADR 0003](../../../docs/adr/0003-ledger-unica-porta-del-denaro.md) a dirlo.
 *
 * **Passano tutti dalla porta normale**, e la conseguenza si vede: regalare contanti a caveau pieno
 * viene rifiutato con `capacity_exceeded`, esattamente come uno stipendio. Non è un limite del
 * cheat, è la sua utilità principale — un pannello che aggirasse le capienze ricostruirebbe da capo
 * il salvataggio incoerente che [D028](../../../docs/delega/D028-una-capienza-ferma-chi-sale.md) è
 * esistita per rendere sopravvivibile. Chi vuole più contanti amplia prima il caveau: è anche il
 * modo in cui il giocatore lo farebbe.
 */

/** Un cheat non ha niente da restituire: il chiamante guarda solo se ha detto di no, e perché. */
const nothing = <E>(result: Result<unknown, E>): Result<void, E> =>
  result.ok ? ok(undefined) : result

const grant =
  (ledger: Ledger, pool: Pool) =>
  (amount: Money): CheatResult =>
    // Un cheat non è una fonte di reddito: non ha un regime, quindi non trattiene niente. Lo dice
    // qui invece di ereditarlo da un valore predefinito, che è ciò che l'ADR 0052 non vuole.
    nothing(ledger.transaction(income(pool, amount, ZERO), { reason: 'reason.cheat.grant' }))

/**
 * Svuotare è **spendere tutto quello che c'è**, non «scrivere zero»: la contropartita finisce in
 * `sink`, quindi la somma di tutti i conti resta zero (INV-08) e il movimento compare nel registro
 * come qualunque altra uscita. Un cheat che assegnasse il saldo lascerebbe i conti sbilanciati, e
 * il primo caricamento successivo rifiuterebbe la partita per `UnbalancedSaveError`.
 *
 * È anche l'unico cheat che serve a una partita **già** rotta: un pool oltre la propria capienza
 * può scendere (INV-23), quindi svuotarlo lo riporta dentro le regole senza toccare il file.
 */
const drain = (ledger: Ledger, pool: Pool) => (): CheatResult =>
  nothing(ledger.transaction(spend(pool, ledger.balance(pool)), { reason: 'reason.cheat.drain' }))

/**
 * Quattro ordini di grandezza, non quattro cifre scelte: mille è «un po'», un milione è «troppo per
 * il caveau al primo livello», e in mezzo c'è la curva. Chi prova un muro vuole scavalcarlo di poco
 * o di molto, e sono due prove diverse.
 */
const MAGNITUDES: readonly Money[] = ['1000', '10000', '100000', '1000000'].map(fromString)

export const ledgerCheats = (ledger: Ledger): readonly Cheat[] => [
  {
    id: 'cheat.ledger.grant_cash',
    kind: 'amount',
    amounts: MAGNITUDES,
    run: grant(ledger, 'cash')
  },
  {
    id: 'cheat.ledger.grant_card',
    kind: 'amount',
    amounts: MAGNITUDES,
    run: grant(ledger, 'card')
  },
  { id: 'cheat.ledger.drain_cash', kind: 'act', run: drain(ledger, 'cash') },
  { id: 'cheat.ledger.drain_card', kind: 'act', run: drain(ledger, 'card') }
]
