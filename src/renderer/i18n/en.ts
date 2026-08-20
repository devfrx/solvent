import type { Dictionary } from './index'

/**
 * L'inglese. Due lingue dal primo giorno, e non per ambizione: con un dizionario solo non esiste
 * una parità da controllare, e la disciplina degrada subito (ADR 0011).
 *
 * Le chiavi sono le stesse di `it.ts` — lo pretende il tipo, e `tests/i18n/parity` lo verifica
 * anche sui codici che nasceranno dopo.
 */
export const en: Dictionary = {
  'app.nav.home': 'Home',
  'app.nav.stats': 'Statistics',

  'app.loading.title': 'Loading…',
  'app.loading.catchup': 'Catching up on the time that passed…',
  'app.loading.away_for': 'You were away for {duration}.',
  'app.closing.saving': 'Saving…',

  'app.error.retry': 'Try again',
  'app.error.new_game': 'New game',
  'app.error.close_anyway': 'Close anyway',
  'app.error.load_hint':
    'The file is there but does not pass validation. Nothing has been touched: you can try ' +
    'again or start a new game.',
  'app.error.save_hint':
    'The game is still in memory and the window was kept open on purpose. You can try again, ' +
    'or close and lose the unsaved progress.',

  'app.duration.hours': '{n} hour | {n} hours',
  'app.duration.minutes': '{n} minute | {n} minutes',
  'app.duration.and': '{first} and {second}',
  'app.duration.under_a_minute': 'less than a minute',

  'common.buy': 'Buy — {cost}',
  'common.level': 'lv. {level}',

  'pool.cash': 'Cash',
  'pool.card': 'Card',
  'pool.unlimited': 'Unlimited',
  'pool.traced': 'Every movement is recorded',
  'pool.untraced': 'No trace',
  'pool.traceability': 'Traceability',
  'pool.capacity': 'Capacity',

  'income.per_second': '+ {amount} / s',
  'income.upgrade.overtime.name': 'Overtime',
  'income.upgrade.overtime.desc': 'Raises the income of every source.',
  'income.upgrade.owned': 'Already running',

  'stats.saved_at.title': 'Last save',
  'stats.saved_at.never': 'Never: this game has not been written to disk yet.',
  'stats.operations.title': 'Operations log',
  'stats.operations.empty': 'Nothing to show yet.',

  'home.zone.atm': 'ATM',
  'home.zone.dashboard': 'Dashboard',
  'home.tile.income': 'Income',
  'home.tile.net_worth': 'Net worth',
  'home.tile.earned': 'Earned in total',
  'home.tile.spent': 'Spent in total',
  'home.tile.fees': 'Fees paid',

  'atm.account.title': 'On the account',
  'atm.cash.title': 'Cash',
  'atm.cash.capacity': 'Vault capacity',
  'atm.deposit': 'Deposit',
  'atm.withdraw': 'Withdraw',
  'atm.deposit.title': 'Deposit into the account',
  'atm.withdraw.title': 'Withdraw from the account',
  'atm.breakdown': 'What happens',
  'atm.fee': 'Fee',
  'atm.fee.per_operation': 'Fee per operation',
  'atm.deposit.confirm': 'Confirm deposit',
  'atm.withdraw.confirm': 'Confirm withdrawal',
  'atm.recent.title': 'Recent operations',

  'card.tier.gold': 'Gold',
  'card.hint.drag': 'Drag to flip the card',

  'reason.income.tick': 'Salary',
  'reason.income.upgrade': 'Overtime purchased',
  'reason.atm.deposit': 'Deposit',
  'reason.atm.withdraw': 'Withdrawal',

  'error.ledger.insufficient_funds': 'You need {required} on {pool}, you have {available}.',
  'error.ledger.capacity_exceeded': '{pool} holds no more than {capacity}: {fits} still fits.',
  'error.ledger.pool_not_accepted': 'You cannot pay with {pool}. Accepted: {accepted}.',
  'error.ledger.invalid_amount': 'That amount cannot be used on {pool}: {amount}.',
  'error.income.already_upgraded': 'Overtime has already been bought.',
  'error.atm.amount_not_positive': 'The amount must be greater than zero, not {amount}.',
  'error.atm.fee_exceeds_amount': 'The {fee} fee eats up the whole {amount}.',
  'error.save.corrupt': 'The save file cannot be read',
  'error.save.invalid': 'The save file does not have a valid shape: {path}',
  'error.save.version_ahead':
    'The save file comes from a newer version of the game (version {found}); this one reads up ' +
    'to {supported}.',
  'error.save.io': 'The save file could not be read or written: {cause}',
  'error.registry.load_failed': 'System “{id}” does not recognise its own saved state.',
  'error.game.load_failed': 'The saved accounts do not add up: the file has been edited.'
}
