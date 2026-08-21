import type { Dictionary } from './index'

/**
 * L'inglese. Due lingue dal primo giorno, e non per ambizione: con un dizionario solo non esiste
 * una parità da controllare, e la disciplina degrada subito (ADR 0011).
 *
 * Le chiavi sono le stesse di `it.ts` — lo pretende il tipo, e `tests/i18n/parity` lo verifica
 * anche sui codici che nasceranno dopo.
 */
export const en: Dictionary = {
  'app.name': 'Solvent',
  'app.nav.home': 'ATM',
  'app.nav.income': 'Income',
  'app.nav.vault': 'Vault',
  'app.nav.stats': 'Stats',

  'app.nav.group.act': 'Where you act',
  'app.nav.group.look': 'Where you look',

  'app.theme.light': 'Light',
  'app.theme.dark': 'Dark',

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
  'pool.cash.explained':
    'Leaves no trace, but the vault has a floor: past capacity, wages stop coming in.',
  'pool.card.explained':
    'No ceiling, but every move stays on the record. That is the other half of the choice.',
  'pool.traceability.explained':
    'Whether moves on this instrument stay on the record. It is the one question this game is ' +
    'built on.',
  'pool.capacity': 'Capacity',

  'income.per_second': '+ {amount} / s',
  'income.upgrade.overtime.name': 'Overtime',
  'income.upgrade.overtime.desc': 'Raises the income of every source.',
  'income.upgrade.owned': 'Already running',

  'payment.only_with': 'Paid with {pool} only',
  'payment.with': 'With {pool}',

  'vault.level': 'Vault {level} of {total}',
  'vault.room': 'Free space',
  'vault.expand': 'Expand — {cost}',
  'vault.at_max': 'Last level: this is where cash ends.',
  'vault.full': 'The vault is full: your salary no longer fits. Deposit it into the account.',
  'vault.withholding': 'The vault cannot hold it all: {amount} of salary did not come in.',

  'stats.saved_at.title': 'Last save',
  'stats.saved_at.never': 'Never: this game has not been written to disk yet.',
  'stats.operations.title': 'Operations log',
  'stats.operations.empty': 'Nothing to show yet.',
  'stats.description': 'The full ledger and the last save: what happened, line by line.',

  'home.description':
    'The ATM and the dashboard. Money arrives as cash, is deposited for a fee, and here you ' +
    'see what moving it costs.',
  'income.description':
    'The salary arrives on its own: here you buy the things that make it arrive faster.',

  'vault.description':
    'How much cash you can keep on you, and what it costs to keep more. When it is full the ' +
    'salary does not come in: deposit it into the account, or expand.',

  'home.zone.atm': 'ATM',
  'home.zone.dashboard': 'Dashboard',
  'home.tile.income': 'Income',
  'home.tile.net_worth': 'Net worth',
  'home.tile.earned': 'Earned in total',
  'home.tile.spent': 'Spent in total',
  'home.tile.fees': 'Fees paid',
  'home.tile.income.explained': 'What comes in each second, upgrades already counted.',
  'home.tile.net_worth.explained':
    'Cash plus card. It is earned minus spent minus fees: always, by construction.',
  'home.tile.earned.explained':
    'Everything that came in since the game began, before any spending.',
  'home.tile.spent.explained':
    'Everything that went out to buy something. Fees are counted separately.',
  'home.tile.fees.explained':
    'What moving money has cost. It is the price of making traceable what was not.',

  'home.chart.title': 'Net worth over time',
  'home.chart.explained':
    'One bar every {seconds} seconds of play. The height is the change within the window, not the total: the lowest sample sits at the floor, the highest at the top. After a long pause a single bar covers all the time that passed.',
  'home.chart.how_to_read': 'How to read it',
  'home.chart.oldest': 'Earlier',
  'home.chart.newest': 'Now',

  'atm.account.title': 'On the account',
  'atm.cash.title': 'Cash',
  'atm.cash.capacity': 'Vault capacity',
  'atm.cash.capacity.explained':
    'How much cash the vault holds right now. Once full, wages stop: deposit, or expand.',
  'atm.deposit': 'Deposit',
  'atm.withdraw': 'Withdraw',
  'atm.deposit.title': 'Deposit into the account',
  'atm.withdraw.title': 'Withdraw from the account',
  'atm.breakdown': 'What happens',
  'atm.breakdown.explained':
    'The exact postings the confirmation will apply. The fee is flat and charged on every ' +
    'operation, large or small.',
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
  'reason.vault.expand': 'Vault expanded',

  'error.ledger.insufficient_funds': 'You need {required} on {pool}, you have {available}.',
  'error.ledger.capacity_exceeded': '{pool} holds no more than {capacity}: {fits} still fits.',
  'error.ledger.pool_not_accepted': 'You cannot pay with {pool}. Accepted: {accepted}.',
  'error.ledger.invalid_amount': 'That amount cannot be used on {pool}: {amount}.',
  'error.income.already_upgraded': 'Overtime has already been bought.',
  'error.vault.max_level': 'The vault is already at its last level: it does not get any bigger.',
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
