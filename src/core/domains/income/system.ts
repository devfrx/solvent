import type { CommandHandler } from '@core/contracts/commands'
import type { Money } from '@core/contracts/money'
import { ZERO } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'

import type { Modifiers } from '@core/balance/modifiers'
import { income, type Ledger } from '@core/kernel/Ledger'
import { defineSystem, ORDER, type Stateful } from '@core/kernel/Registry'

import { createBuyUpgrade, createDeclare, type IncomeError } from './commands'
import { incomeOver, incomeThatFits, regimeOf, upgradeModifier, UPGRADE_MODIFIER_ID } from './rules'
import type { IncomeSave, IncomeState } from './types'

/**
 * Il primo sistema del gioco. Non calcola: legge il proprio stato, chiama le regole pure e chiede
 * al Ledger di applicare. Il denaro non lo tocca mai, e `world` non lo nomina mai — lo scrive il
 * costruttore `income()` (INV-10).
 */

const INITIAL: IncomeState = { upgraded: false, declared: false }

/**
 * Quanto spazio c'è ancora in un pool, `null` se non ha tetto.
 *
 * Arriva **per costruzione** e non da un import: a rispondere è il caveau, e un dominio che
 * importa un altro dominio è un precedente, non un import — la visione ne ha diciassette che si
 * contendono le stesse risorse. A collegarli è il bootstrap, che è l'unico posto che ha entrambi
 * sotto mano (ADR 0024).
 *
 * Non è un valore ma una funzione, e va chiamata a ogni tick: lo spazio cambia a ogni transazione.
 */
export type Room = (pool: Pool) => Money | null

export interface Income {
  readonly system: Stateful<IncomeSave>
  /**
   * Lo stato, in sola lettura. Serve a chi deve **anticipare** l'esito di un acquisto —
   * `canBuyUpgrade` lo vuole per argomento — e non è `save()` travestito: `save()` è il contratto
   * con il disco, e i due nomi restano distinti proprio perché rispondono a domande diverse
   * (`types.ts`). Il giorno in cui lo stato guadagna un campo che non si salva, questa firma non
   * cambia e quella sì.
   */
  readonly state: () => IncomeState
  /**
   * ADR 0027 — l'argomento è lo **strumento**, non il prezzo. Chi chiama sceglie con cosa paga; a
   * dire quanto costa con quello resta il listino, che il comando interroga da sé.
   */
  readonly buyUpgrade: CommandHandler<Pool, IncomeState, IncomeError>
  /**
   * ADR 0052 — mettersi in regola: da qui in avanti lo stipendio atterra sulla carta, al netto
   * della parte dello Stato. Come `buyUpgrade`, l'argomento è lo **strumento** e non il prezzo.
   *
   * Non esiste il comando opposto, ed è il meccanismo dell'irreversibilità: un regime che si
   * cambia quando conviene è un interruttore, e il gioco ottimale di un interruttore è premerlo a
   * ogni oscillazione del saldo.
   */
  readonly declare: CommandHandler<Pool, IncomeState, IncomeError>
  /**
   * Quanto dell'ultimo tick **non** è entrato perché il caveau non lo teneva. Zero quando tutto
   * entra, e quando il caveau è pieno vale l'intero stipendio maturato.
   *
   * Esiste perché un idle in cui il reddito smette di entrare **senza dirlo** è un idle rotto: il
   * giocatore deve capire in un colpo d'occhio che i soldi non stanno arrivando, e perché. È un
   * numero e non un booleano perché la condizione ha due gradi che il giocatore vive in modo
   * diverso — «ne entra una parte» e «non entra niente» — e con un `sì/no` la prima sparirebbe.
   *
   * Non si salva: descrive l'ultimo tick, non la partita. Alla riapertura vale zero finché il
   * primo tick non dice il contrario.
   */
  readonly withheld: () => Money
}

/**
 * `modifiers` arriva per costruzione perché non può stare nel `SystemContext`: vive in `balance/`,
 * e `kernel/` non può importare `balance/` (D008). `ledger` arriva per la stessa porta ma per una
 * ragione diversa: un comando parte dalla UI, fuori da ogni `tick`, quindi nasce già legato al
 * proprio contesto (docs/design/flusso-tick.md).
 *
 * **Deve essere lo stesso `Ledger` che il runtime mette nel `SystemContext`.** Due istanze diverse
 * sono due partite diverse, e nessun tipo lo impedisce: è il prezzo di avere i comandi fuori dal
 * tick, e sta al bootstrap (D011) pagarlo una volta sola.
 */
export const createIncome = (ledger: Ledger, modifiers: Modifiers, room: Room): Income => {
  let state: IncomeState = INITIAL
  let withheld: Money = ZERO
  const purchase = createBuyUpgrade({ ledger, modifiers })
  const declaration = createDeclare({ ledger })

  /**
   * Il modificatore vive nel registro, non nello stato: dopo un `load` o un `reset` va rimesso
   * d'accordo con lo stato. `remove` prima di `register` perché `register` lancia sul duplicato, e
   * caricare due volte di fila è lecito.
   */
  const syncUpgradeModifier = (): void => {
    modifiers.remove(UPGRADE_MODIFIER_ID)
    if (state.upgraded) modifiers.register(upgradeModifier())
  }

  return {
    system: defineSystem<IncomeSave>({
      id: 'income',
      order: ORDER.INCOME,

      /**
       * D017 — questo è il giorno che il commento di D010 annunciava: la capienza del caveau
       * esiste, e il reddito può non entrare.
       *
       * Il tick **non chiede e incassa il rifiuto**: sa quanto ci sta **prima** di chiedere, e
       * accredita quello. La ragione è il recupero, che è **un solo** `advance` con tutti i tick
       * arretrati — cioè una transazione sola da otto ore di stipendio, e il Ledger la
       * rifiuterebbe intera perché una transazione è atomica (ADR 0019). Chi è stato via una notte
       * tornerebbe con **zero**, a caveau vuoto: non un muro, un guasto travestito da regola.
       *
       * Il `Result` continua a non avere un ramo qui, e adesso è una proprietà invece di una
       * scommessa: la capienza è già stata guardata, e l'unico altro fallimento possibile su un
       * `income` sarebbe un importo non finito, che è un programma scritto male.
       */
      tick: (ctx, elapsed) => {
        // ADR 0052 — dove atterra lo stipendio è una proprietà del **regime**, non una costante di
        // questo file. Lo spazio si chiede al pool del regime: chiederlo a `cash` mentre si
        // accredita sulla carta produrrebbe un muro dove non esiste.
        const regime = regimeOf(state)
        const earned = incomeOver(ctx.clock, modifiers, elapsed)
        const credited = incomeThatFits(earned, room(regime.pool))
        // `ZERO` e non `earned.minus(credited)` quando non c'è niente da trattenere: sarebbe lo
        // stesso numero dentro un oggetto nuovo a ogni tick, cioè dieci volte al secondo un
        // mirror che si sveglia per dire la stessa cosa.
        withheld = credited.equals(earned) ? ZERO : earned.minus(credited)

        // Zero non è un non-evento: sarebbe una transazione valida che non muove niente ed emette
        // lo stesso, e il giocatore vedrebbe lo storico riempirsi di stipendi da 0,00 € proprio
        // mentre gli si dice che il caveau è pieno.
        if (credited.isZero()) return

        // La trattenuta si calcola su ciò che **entra**, non su ciò che è maturato: a caveau pieno
        // entra una parte, e tassare il maturato farebbe pagare le tasse su soldi mai ricevuti.
        // Oggi le due cifre coincidono sempre in regime dichiarato — la carta non ha tetto — ma
        // coincidono per una proprietà della carta, non per costruzione.
        //
        // Non si arrotonda ai centesimi, e non è una dimenticanza: un tasso su un importo per tick
        // è già una grandezza sotto il centesimo (1,20 € a tick), e arrotondare per eccesso a ogni
        // tick porterebbe la trattenuta effettiva molto sopra quella dichiarata — con un bersaglio
        // di bilanciamento che continua a guardare la costante. Il denaro qui è `Decimal` fino in
        // fondo (ADR 0006), e la partita doppia non chiede centesimi interi.
        const taxed = credited.mul(regime.withholdingRate)

        ctx.ledger.transaction(income(regime.pool, credited, taxed), {
          reason: 'reason.income.tick'
        })
      },

      save: () => state,

      load: (loaded) => {
        // `SystemsSave` è opaco per lo schema del main (ADR 0002, D009): un salvataggio manomesso
        // o prodotto da una versione bacata arriva fin qui intatto, e questo è l'unico punto che
        // può guardarlo. Un `load` che lancia è un esito — `loadAll` lo trasforma in
        // `error.registry.load_failed` — mentre accettarlo declasserebbe il giocatore in silenzio.
        if (typeof loaded?.upgraded !== 'boolean') {
          throw new TypeError(
            `income — stato salvato non valido: 'upgraded' deve essere un booleano.`
          )
        }
        // `declared` **assente** è una partita scritta prima di D043, cioè una partita in nero: il
        // significato dell'assenza è dichiarato in `IncomeSave`, non indovinato qui.
        //
        // La distinzione è fra **chiave mancante** e chiave presente che vale `undefined`, e non è
        // pignoleria: JSON non sa produrre la seconda, quindi vederla vuol dire che qualcuno ha
        // scritto quello stato a mano. È spazzatura, e INV-20 la rifiuta come rifiuta un `upgraded`
        // che non è un booleano. A pretenderlo è `tests/rules/stateful-systems-reject-garbage`.
        if ('declared' in loaded && typeof loaded.declared !== 'boolean') {
          throw new TypeError(
            `income — stato salvato non valido: 'declared', se c'è, deve essere un booleano.`
          )
        }
        state = { upgraded: loaded.upgraded, declared: loaded.declared ?? false }
        // Ciò che l'ultimo tick non ha incassato riguarda l'ultimo tick, e dopo un caricamento
        // l'ultimo tick è di un'altra sessione. Il recupero, che arriva subito dopo, lo riscrive.
        withheld = ZERO
        syncUpgradeModifier()
      },

      // `soft` e `hard` fanno la stessa cosa, e a dirlo è questo commento invece di un `if` che
      // finge una differenza: il prestige è la fetta 06, e nessun documento ha ancora deciso se un
      // upgrade comprato con i soldi sopravvive a un reset morbido. Sceglierlo qui adesso
      // significherebbe inventare una regola di gioco dentro una delega che non la riguarda.
      reset: () => {
        state = INITIAL
        withheld = ZERO
        syncUpgradeModifier()
      }
    }),

    state: () => state,

    withheld: () => withheld,

    buyUpgrade: (pool) => {
      const bought = purchase({ state, pool })
      if (bought.ok) state = bought.value
      return bought
    },

    declare: (pool) => {
      const declared = declaration({ state, pool })
      if (declared.ok) state = declared.value
      return declared
    }
  }
}
