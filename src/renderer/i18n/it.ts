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
  'app.name': 'Solvent',
  'app.nav.home': 'Bancomat',
  'app.nav.income': 'Reddito',
  'app.nav.vault': 'Caveau',
  'app.nav.stats': 'Statistiche',

  'app.nav.group.act': 'Dove si opera',
  'app.nav.group.look': 'Dove si guarda',

  'app.theme.light': 'Chiaro',
  'app.theme.dark': 'Scuro',

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
  'app.duration.under_a_minute': 'meno di un minuto',

  'common.buy': 'Compra — {cost}',
  'common.level': 'liv. {level}',

  'pool.cash': 'Contanti',
  'pool.card': 'Carta',
  'pool.unlimited': 'Illimitata',
  'pool.traced': 'Ogni movimento è registrato',
  'pool.untraced': 'Nessuna traccia',
  'pool.traceability': 'Tracciabilità',
  'pool.cash.explained':
    'Non lasciano traccia, ma il caveau ha un fondo: oltre la capienza lo stipendio non entra ' +
    'più.',
  'pool.card.explained':
    'Non ha un tetto, ma ogni movimento resta registrato. È l’altra metà della scelta.',
  'pool.traceability.explained':
    'Se i movimenti di questo strumento restano registrati. È la sola domanda su cui questo ' +
    'gioco è costruito.',
  'pool.capacity': 'Capienza',

  'income.per_second': '+ {amount} / s',
  'income.upgrade.overtime.name': 'Straordinari',
  'income.upgrade.overtime.desc': 'Aumenta il reddito di tutte le fonti.',
  'income.upgrade.owned': 'Già in funzione',

  'payment.only_with': 'Si paga solo con: {pool}',
  'payment.with': 'Con {pool}',

  'vault.level': 'Caveau {level} di {total}',
  'vault.room': 'Spazio libero',
  'vault.expand': 'Amplia — {cost}',
  'vault.at_max': 'Ultimo livello: i contanti finiscono qui.',
  'vault.full': 'Il caveau è pieno: lo stipendio non entra più. Deposita sul conto.',
  'vault.withholding': 'Il caveau non tiene tutto: {amount} di stipendio non è entrato.',

  'stats.saved_at.title': 'Ultimo salvataggio',
  'stats.saved_at.never': 'Mai: questa partita non è ancora stata scritta su disco.',
  'stats.operations.title': 'Registro delle operazioni',
  'stats.operations.empty': 'Ancora niente da mostrare.',
  'stats.description':
    'Il registro completo e l’ultimo salvataggio: cosa è successo, riga per riga.',

  'home.description':
    'Il bancomat e il cruscotto. Qui il denaro entra in contanti, si deposita pagando la ' +
    'commissione, e si vede quanto costa spostarlo.',
  'income.description':
    'Lo stipendio arriva da solo: qui si comprano le cose che lo fanno arrivare più in fretta.',

  'vault.description':
    'Quanti contanti puoi tenere addosso, e quanto costa tenerne di più. Quando è pieno lo ' +
    'stipendio non entra: si deposita sul conto, oppure si amplia.',

  'home.zone.atm': 'Bancomat',
  'home.zone.dashboard': 'Cruscotto',
  'home.tile.income': 'Reddito',
  'home.tile.net_worth': 'Patrimonio netto',
  'home.tile.earned': 'Guadagnato in totale',
  'home.tile.spent': 'Speso in totale',
  'home.tile.fees': 'Commissioni pagate',
  'home.tile.income.explained': 'Quanto entra ogni secondo, con gli upgrade già contati.',
  'home.tile.net_worth.explained':
    'Contanti più carta. È guadagnato meno speso meno commissioni: sempre, per costruzione.',
  'home.tile.earned.explained':
    'Tutto ciò che è entrato da inizio partita, prima di qualunque spesa.',
  'home.tile.spent.explained':
    'Tutto ciò che è uscito per comprare qualcosa. Le commissioni si contano a parte.',
  'home.tile.fees.explained':
    'Quanto è costato spostare il denaro. È il prezzo di rendere tracciabile ciò che non lo era.',

  'atm.account.title': 'Sul conto',
  'atm.cash.title': 'Contanti',
  'atm.cash.capacity': 'Capienza del caveau',
  'atm.cash.capacity.explained':
    'Quanti contanti il caveau tiene adesso. Quando è pieno lo stipendio si ferma: si deposita, ' +
    'oppure si amplia.',
  'atm.deposit': 'Deposita',
  'atm.withdraw': 'Preleva',
  'atm.deposit.title': 'Deposita sul conto',
  'atm.withdraw.title': 'Preleva dal conto',
  'atm.breakdown': 'Cosa succede',
  'atm.breakdown.explained':
    'I movimenti esatti che la conferma applicherà. La commissione è fissa e si paga a ogni ' +
    'operazione, grande o piccola.',
  'atm.fee': 'Commissione',
  'atm.fee.per_operation': 'Commissione per operazione',
  'atm.deposit.confirm': 'Conferma deposito',
  'atm.withdraw.confirm': 'Conferma prelievo',
  'atm.recent.title': 'Ultime operazioni',

  'card.tier.gold': 'Gold',
  'card.hint.drag': 'Trascina per girare la carta',

  'reason.income.tick': 'Stipendio',
  'reason.income.upgrade': 'Straordinari acquistati',
  'reason.atm.deposit': 'Deposito',
  'reason.atm.withdraw': 'Prelievo',
  'reason.vault.expand': 'Caveau ampliato',

  'error.ledger.insufficient_funds': 'Ti servono {required} su {pool}, ne hai {available}.',
  'error.ledger.capacity_exceeded': '{pool} non tiene più di {capacity}: ci stanno ancora {fits}.',
  'error.ledger.pool_not_accepted': 'Non si paga con {pool}. Si accetta: {accepted}.',
  'error.ledger.invalid_amount': 'Importo non utilizzabile su {pool}: {amount}.',
  'error.income.already_upgraded': 'Gli straordinari sono già stati comprati.',
  'error.vault.max_level': 'Il caveau è già all’ultimo livello: più grande di così non si fa.',
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
