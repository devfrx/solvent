import type { CommandHandler } from '@core/contracts/commands'
import type { Balances, LedgerError, Posting, TransactionMeta } from '@core/contracts/ledger'
import type { Money } from '@core/contracts/money'
import { ZERO } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'
import { roomIn } from '@core/contracts/pools'
import type { Result } from '@core/contracts/result'
import { err, ok } from '@core/contracts/result'

import { BALANCE } from '@core/balance/constants'
import { transfer, type Ledger } from '@core/kernel/Ledger'

import { atmFee, fitsIn, isFeeWithinAmount, isValidAmount } from './rules'

/**
 * Il gesto centrale del gioco: spostare denaro fra contanti e carta pagandone il prezzo. È ciò che
 * rende la dualità dell'ADR 0017 una scelta invece che un'etichetta.
 *
 * Il bancomat **non ha stato**, quindi sotto `atm/` non c'è un `system.ts`: non ha niente da
 * salvare e niente da fare a ogni tick, e un sistema che non ticchetta e non ricorda aggiungerebbe
 * una riga al bootstrap e zero comportamento. Le soglie giornaliere gli daranno il primo stato, e
 * quello sarà il giorno in cui nascerà.
 */

export type AtmError =
  | LedgerError
  /** Zero o negativo: `transfer` non se ne accorgerebbe, o lo fermerebbe lanciando. */
  | { readonly code: 'error.atm.amount_not_positive'; readonly amount: Money }
  /** La commissione si mangia tutto: `transfer` lancerebbe, e qui invece c'è un giocatore. */
  | { readonly code: 'error.atm.fee_exceeds_amount'; readonly amount: Money; readonly fee: Money }

/**
 * Le due direzioni, come **dati**. Deposito e prelievo non differiscono per il modo in cui si
 * calcolano — differiscono per due pool e una ragione — e due funzioni gemelle sarebbero due punti
 * in cui la commissione può divergere.
 *
 * `meta` sta qui dentro invece di essere costruita nella chiamata perché contiene una
 * dichiarazione che è un'**assenza**, e un'assenza va detta: vedi `WITHDRAW`.
 */
export interface AtmOperation {
  readonly meta: TransactionMeta
  readonly from: Pool
  readonly to: Pool
  /**
   * Il tasso della commissione in questo verso (D032). Sta **nell'operazione** e non dentro
   * `atmFee` per la ragione che tiene in piedi tutta questa tabella: un tasso letto altrove
   * vorrebbe dire un `if` sulla direzione, e le due direzioni esistono come dati proprio per non
   * averne nessuno.
   */
  readonly feeRate: Money
}

/**
 * ADR 0017 — `accepts` **non** si dichiara in un trasferimento, ed è la trappola di questa delega.
 *
 * Il Ledger controlla l'affordance su **ogni** movimento che tocca un pool del giocatore, e un
 * trasferimento ne tocca due: `accepts: ['card']` su un prelievo farebbe rifiutare il movimento in
 * **arrivo** sui contanti, con `error.ledger.pool_not_accepted`. È il contrario dell'upgrade di
 * D010, dove il pool del giocatore era uno solo e la dichiarazione era giusta — le due situazioni
 * si somigliano e vanno in direzioni opposte.
 *
 * L'assenza è esportata insieme all'operazione così che un test possa guardarci dentro: altrimenti
 * sarebbe indistinguibile da una dimenticanza, ed è il modello di `UPGRADE_PAYMENT` applicato al
 * caso contrario.
 */
export const WITHDRAW: AtmOperation = {
  meta: { reason: 'reason.atm.withdraw' },
  from: 'card',
  to: 'cash',
  feeRate: BALANCE.ATM_FEE_RATE_OUT
}

export const DEPOSIT: AtmOperation = {
  meta: { reason: 'reason.atm.deposit' },
  from: 'cash',
  to: 'card',
  feeRate: BALANCE.ATM_FEE_RATE_IN
}

/**
 * L'anteprima **è** l'operazione, non un secondo calcolo che le somiglia: questa funzione
 * costruisce i movimenti che la UI mostra, e il comando applica **quelli**. Non due formule da
 * tenere allineate ma un valore solo — è la forma più forte che INV-11 possa avere, e rende il
 * difetto "due formule per la commissione" impossibile invece che sconsigliato.
 *
 * Ritorna un `Result` perché l'anteprima sa già dire di no, e deve dirlo **prima** di chiamare il
 * kernel: `transfer` lancia se la commissione supera l'importo, `magnitude` lancia sul negativo.
 * Un `try`/`catch` intorno al Ledger sarebbe la risposta sbagliata — quei lanci dicono che il
 * programma è scritto male, mentre qui è il giocatore ad aver digitato un numero che non va.
 */
/**
 * Il pool in arrivo, visto da chi ha in mano sia il tetto sia il saldo: lo store (D017).
 *
 * Arriva **per argomento** e non da un import, ed è una decisione più che una comodità: un
 * prelievo porta denaro verso i contanti, quindi l'anteprima deve sapere se ci sta — ma il
 * bancomat che importa il caveau sarebbe il primo accoppiamento fra domini del progetto, cioè un
 * precedente in un gioco che ne ha diciassette a contendersi le stesse risorse. Il dominio resta
 * ignorante di chi gli risponde, e la funzione resta provabile con una capienza finta.
 */
export interface Destination {
  /** Il tetto del pool in arrivo, `null` se non ne ha. */
  readonly capacity: Money | null
  /** Quanto c'è già dentro. */
  readonly current: Money
}

export const previewOf = (
  operation: AtmOperation,
  amount: Money,
  destination: Destination
): Result<readonly Posting[], AtmError> => {
  if (!isValidAmount(amount)) return err({ code: 'error.atm.amount_not_positive', amount })

  const fee = atmFee(amount, operation.feeRate)
  if (!isFeeWithinAmount(amount, fee)) {
    return err({ code: 'error.atm.fee_exceeds_amount', amount, fee })
  }

  // Ciò che **arriva** è al netto della commissione, non l'importo digitato: chi preleva 500,00 €
  // verso un caveau con 498,00 € di spazio ci sta, e chiedere sull'importo lordo lo rifiuterebbe.
  const { capacity, current } = destination
  const incoming = amount.minus(fee)
  if (capacity !== null && !fitsIn(capacity, current, incoming)) {
    // Lo stesso codice e le stesse due cifre che il Ledger produrrebbe premendo: l'anteprima dice
    // di no con la frase del rifiuto, non con una seconda spiegazione da tenere allineata.
    return err({
      code: 'error.ledger.capacity_exceeded',
      pool: operation.to,
      capacity,
      fits: roomIn(capacity, current) ?? ZERO
    })
  }

  // Il dominio non nomina mai il conto delle commissioni (INV-10): la terza riga la scrive
  // `transfer`, che è anche l'unico posto in cui la commissione è trattenuta invece che aggiunta.
  return ok(transfer(operation.from, operation.to, amount, fee))
}

export interface Atm {
  readonly deposit: CommandHandler<Money, Balances, AtmError>
  readonly withdraw: CommandHandler<Money, Balances, AtmError>
}

/**
 * Una factory che riceve le dipendenze e ritorna i comandi già legati al proprio contesto
 * (ADR 0024). Non ritorna un sistema: non ce n'è uno.
 *
 * **Deve ricevere lo stesso `Ledger` che il runtime mette nel `SystemContext`**: due istanze sono
 * due partite, e nessun tipo lo impedisce.
 */
export const createAtm = (ledger: Ledger): Atm => {
  const commandFor =
    (operation: AtmOperation): CommandHandler<Money, Balances, AtmError> =>
    (amount) => {
      // La capienza la legge dal **Ledger**, cioè dalla stessa funzione che il Ledger fa
      // rispettare (INV-18, ADR 0025). Non è un secondo controllo che duplica il primo: l'ultima
      // parola resta di `transaction`, e questa serve a far dire di no all'anteprima **con la
      // stessa frase** invece di lasciare che la si scopra premendo.
      const preview = previewOf(operation, amount, {
        capacity: ledger.capacities(operation.to),
        current: ledger.balance(operation.to)
      })
      if (!preview.ok) return preview

      return ledger.transaction(preview.value, operation.meta)
    }

  return { deposit: commandFor(DEPOSIT), withdraw: commandFor(WITHDRAW) }
}
