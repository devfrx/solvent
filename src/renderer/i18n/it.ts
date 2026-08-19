import type { Dictionary } from './index'

/**
 * L'italiano. È la lingua di partenza (`DEFAULT_LOCALE`), non la lingua privilegiata: il tipo
 * `Dictionary` pretende le stesse chiavi qui e in `en.ts`, e il compilatore non fa sconti a
 * nessuna delle due.
 *
 * Le frasi rivolte al giocatore stanno **solo** qui. Un componente che ne scrive una è un test
 * rosso (R12, `tests/rules/no-literal-in-template`).
 */
export const it: Dictionary = {
  'app.nav.home': 'Home',
  'app.nav.stats': 'Statistiche',

  'app.loading.title': 'Caricamento…',
  'app.loading.catchup': 'Recupero il tempo passato…',
  'app.loading.away_for': 'Sei stato via {duration}.',
  'app.closing.saving': 'Salvataggio in corso…',

  'app.error.retry': 'Riprova',
  'app.error.new_game': 'Partita nuova',
  'app.error.close_anyway': 'Chiudi lo stesso',
  'app.error.load_hint':
    'Il file esiste ma non supera la validazione. Non è stato modificato: puoi ritentare o ' +
    'iniziare una partita nuova.',
  'app.error.save_hint':
    'La partita è ancora in memoria e la finestra è rimasta aperta apposta. Puoi ritentare, ' +
    'oppure chiudere perdendo i progressi non salvati.',

  'app.duration.hours': '{n} ora | {n} ore',
  'app.duration.minutes': '{n} minuto | {n} minuti',
  'app.duration.and': '{first} e {second}',

  'balance.panel.title': 'Saldo',
  'balance.panel.rate': '+ {amount} / s',

  'common.buy': 'Compra — {cost}',
  'common.level': 'liv. {level}',

  'pool.cash': 'Contanti',
  'pool.card': 'Carta',

  'income.upgrade.overtime.name': 'Straordinari',
  'income.upgrade.overtime.desc': 'Aumenta il reddito di tutte le fonti.',
  'income.upgrade.owned': 'Già in funzione',

  'stats.saved_at.title': 'Ultimo salvataggio',
  'stats.saved_at.never': 'Mai: questa partita non è ancora stata scritta su disco.',
  'stats.operations.title': 'Ultime operazioni',
  'stats.operations.empty': 'Ancora niente da mostrare.',

  'atm.account.title': 'Sul conto',
  'atm.cash.title': 'Contanti',
  'atm.cash.capacity': 'Capienza del caveau',
  'atm.deposit': 'Deposita',
  'atm.withdraw': 'Preleva',
  'atm.withdraw.title': 'Preleva dal conto',
  'atm.withdraw.breakdown': 'Cosa succede',
  'atm.fee': 'Commissione',
  'atm.confirm': 'Conferma prelievo',
  'atm.recent.title': 'Ultime operazioni',

  'card.tier.gold': 'Gold',
  'card.back.limit_used': 'Plafond usato',
  'card.back.credit_score': 'Punteggio di credito',
  'card.hint.drag': 'Trascina per girare la carta',

  'reason.income.tick': 'Stipendio',
  'reason.income.upgrade': 'Straordinari acquistati',
  'reason.atm.deposit': 'Deposito',
  'reason.atm.withdraw': 'Prelievo',

  'error.ledger.insufficient_funds': 'Ti servono {required} su {pool}, ne hai {available}.',
  'error.ledger.capacity_exceeded': '{pool} non tiene più di {capacity}: ci stanno ancora {fits}.',
  'error.ledger.pool_not_accepted': 'Non si paga con {pool}. Si accetta: {accepted}.',
  'error.ledger.invalid_amount': 'Importo non utilizzabile su {pool}: {amount}.',
  'error.income.already_upgraded': 'Gli straordinari sono già stati comprati.',
  'error.atm.amount_not_positive': 'Serve un importo maggiore di zero, non {amount}.',
  'error.atm.fee_exceeds_amount': 'La commissione di {fee} si mangia tutti i {amount}.',
  'error.save.corrupt': 'Il salvataggio non è leggibile',
  'error.save.invalid': 'Il salvataggio non ha una forma valida: {path}',
  'error.save.version_ahead':
    'Il salvataggio viene da una versione più recente del gioco (la {found}); questa arriva ' +
    'alla {supported}.',
  'error.save.io': 'Non è stato possibile leggere o scrivere il salvataggio: {cause}',
  'error.registry.load_failed': 'Il sistema «{id}» non riconosce il proprio stato salvato.',
  'error.game.load_failed': 'I conti del salvataggio non tornano: il file è stato modificato.'
}
