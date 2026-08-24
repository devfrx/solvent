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
  'app.nav.atm': 'Bancomat',
  'app.nav.income': 'Reddito',
  'app.nav.vault': 'Caveau',
  'app.nav.board': 'Cruscotto',
  'app.nav.stats': 'Statistiche',

  'app.nav.group.act': 'Dove si opera',
  'app.nav.group.look': 'Dove si guarda',

  'app.theme.light': 'Chiaro',
  'app.theme.dark': 'Scuro',

  'app.loading.title': 'Caricamento…',
  'app.loading.catchup': 'Recupero il tempo passato…',
  'app.loading.away_for': 'Sei stato via {duration}.',
  'app.loading.dropped': 'Il tetto di recupero ne ha scartati {duration}.',
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

  'common.buy': 'Compra',
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

  // Il pannello di sviluppo (D029). Non arriva mai davanti a un giocatore, ma passa dal dizionario
  // come tutto il resto: le parole del progetto vivono in un posto solo (R12).
  'dev.title': 'DEV',
  'dev.subtitle': 'Scorciatoie di sviluppo. Passano dalle regole del gioco, non le aggirano.',
  'dev.amount': 'Importo',
  'cheat.ledger.grant_cash': 'Regala contanti',
  'cheat.ledger.grant_card': 'Regala sul conto',
  'cheat.ledger.drain_cash': 'Svuota i contanti',
  'cheat.ledger.drain_card': 'Svuota il conto',
  'cheat.vault.level_up': 'Caveau: un livello in più',
  'cheat.vault.max_level': 'Caveau: livello massimo',
  'cheat.vault.reset_level': 'Caveau: torna al livello zero',
  'cheat.income.toggle_upgrade': 'Reddito: inverti il potenziamento',
  'reason.cheat.grant': 'Regalo di sviluppo',
  'reason.cheat.drain': 'Svuotamento di sviluppo',
  'income.per_second': '+ {amount} / s',
  'income.upgrade.overtime.name': 'Straordinari',
  'income.upgrade.overtime.desc': 'Aumenta il reddito di tutte le fonti.',
  'income.upgrade.owned': 'Già in funzione',

  'payment.only_with': 'Si paga solo con: {pool}',
  'payment.with': 'Con {pool}',
  'payment.title': 'Come paghi',
  'payment.confirm': 'Paga {cost}',
  'payment.cancel': 'Lascia stare',
  'payment.code.title': 'Codice di sicurezza',
  'payment.code.hint': 'Le tre cifre stanno sul retro: gira la carta.',

  'vault.level': 'Caveau {level} di {total}',
  'vault.room': 'Spazio libero',
  'vault.next_holds': 'Il prossimo tiene',
  'vault.expansions_left': 'Ampliamenti che restano',
  'vault.expand': 'Amplia',
  'vault.at_max': 'Ultimo livello: i contanti finiscono qui.',
  'vault.full': 'Il caveau è pieno: lo stipendio non entra più. Deposita sul conto.',
  'vault.withholding': 'Il caveau non tiene tutto: {amount} di stipendio non è entrato.',

  'stats.saved_at.title': 'Ultimo salvataggio',
  'stats.saved_at.never': 'Mai: questa partita non è ancora stata scritta su disco.',
  'stats.operations.title': 'Registro delle operazioni',
  'stats.operations.empty': 'Ancora niente da mostrare.',
  'stats.description':
    'Il registro completo e l’ultimo salvataggio: cosa è successo, riga per riga.',

  'atm.description':
    'Il ponte fra contanti e carta. Trattiene una commissione in tutte e due i versi — e il verso ' +
    'che scegli è una scelta su quanto si vede.',
  'board.description':
    'Come sta andando la partita: quanto entra, quanto vale, quanto è costato spostarlo.',
  'income.description':
    'Lo stipendio arriva da solo: qui si comprano le cose che lo fanno arrivare più in fretta.',

  'vault.description':
    'Quanti contanti puoi tenere addosso, e quanto costa tenerne di più. Quando è pieno lo ' +
    'stipendio non entra: si deposita sul conto, oppure si amplia.',

  'board.tile.income': 'Reddito',
  'board.tile.net_worth': 'Patrimonio netto',
  'board.tile.earned': 'Guadagnato in totale',
  'board.tile.spent': 'Speso in totale',
  'board.tile.fees': 'Commissioni pagate',
  'board.tile.income.explained': 'Quanto entra ogni secondo, con gli upgrade già contati.',
  'board.tile.net_worth.explained':
    'Contanti più carta. È guadagnato meno speso meno commissioni: sempre, per costruzione.',
  'board.tile.earned.explained':
    'Tutto ciò che è entrato da inizio partita, prima di qualunque spesa.',
  'board.tile.spent.explained':
    'Tutto ciò che è uscito per comprare qualcosa. Le commissioni si contano a parte.',
  'board.tile.fees.explained':
    'Quanto è costato spostare il denaro. È il prezzo di rendere tracciabile ciò che non lo era.',

  'board.chart.title': 'Patrimonio netto nel tempo',
  'board.chart.explained':
    'Un campione ogni {seconds} secondi di gioco. L’altezza è la variazione dentro la finestra, non il totale: i due numeri sull’asse sono il campione più basso e il più alto, e le due righe passano di lì. Dopo una pausa lunga un campione solo copre tutto il tempo passato.',
  'board.chart.how_to_read': 'Come si legge',
  'board.chart.oldest': 'Prima',
  'board.chart.newest': 'Adesso',

  'board.candles.cash.title': 'Contanti nel tempo',
  'board.candles.card.title': 'Carta nel tempo',
  'board.candles.open': 'Apre',
  'board.candles.high': 'Massimo',
  'board.candles.low': 'Minimo',
  'board.candles.close': 'Chiude',
  'board.candles.explained':
    'Una candela ogni {seconds} secondi di gioco, e porta quattro numeri invece di uno: dove il saldo ha aperto, quanto è salito, quanto è sceso, dove ha chiuso. Un intervallo in cui non è successo niente è una candela piatta, e dice proprio questo. Le serie non vengono salvate: a ogni apertura ricominciano da capo, e il grafico resta vuoto finché la prima candela non chiude.',

  'atm.from': 'Da',
  'atm.to': 'A',
  'atm.note.cash': 'Nel caveau · {room} di spazio',
  'atm.note.card': 'Tracciabile, senza tetto',
  'atm.swap': 'Scambia il verso',
  'atm.amount': 'Importo',
  'atm.max': 'Massimo',
  'atm.limits': 'Sotto {floor} la commissione se lo mangia · massimo {max}',
  'atm.breakdown': 'Prima di confermare',
  'atm.breakdown.aside': 'le righe, non il totale',
  'atm.breakdown.explained':
    'I movimenti esatti che la conferma applicherà. La commissione è il maggiore fra un ' +
    'pavimento e una percentuale, quindi su un importo piccolo pesa di più.',
  'atm.refused': 'Rifiutato',
  'atm.confirm.note': 'Questo movimento comparirà nel registro con la sua ragione.',
  'atm.confirm.note.refused': 'Il pulsante resta vivo. Premerlo ripete il motivo.',
  'atm.fee': 'Commissione',
  'atm.fee.per_operation': 'Commissione',
  'atm.fee.rates': '{deposit} versando · {withdraw} prelevando',
  'atm.deposit.confirm': 'Deposita {amount}',
  'atm.withdraw.confirm': 'Preleva {amount}',
  'atm.recent.title': 'Ultime operazioni',
  'atm.card.title': 'La carta, come oggetto',
  'atm.cash.note':
    'I contanti non hanno un oggetto e non hanno un retro: non lasciano traccia, hanno un tetto, ' +
    'non rendono niente.',

  'card.back.title': 'Cosa fa questo strumento',
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
  'error.payment.unauthorized': 'Il codice non corrisponde a questo strumento ({pool}).',
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
