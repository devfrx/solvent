import type { CommandHandler } from '@core/contracts/commands'
import type { Money } from '@core/contracts/money'
import { ZERO } from '@core/contracts/money'
import type { Pool } from '@core/contracts/pools'

import type { Modifiers } from '@core/balance/modifiers'
import { income, type Ledger } from '@core/kernel/Ledger'
import { defineSystem, ORDER, type Stateful } from '@core/kernel/Registry'

import { createBuyLevel, createDeclare, type IncomeError } from './commands'
import { incomeOver, incomeThatFits, MAX_LEVEL, type IncomeSource } from './rules'
import type { IncomeSave, IncomeSourceId, IncomeState } from './types'

/**
 * Il primo sistema del gioco. Non calcola: legge il proprio stato, chiama le regole pure e chiede
 * al Ledger di applicare. Il denaro non lo tocca mai, e `world` non lo nomina mai — lo scrive il
 * costruttore `income()` (INV-10).
 */

/**
 * La partita si apre **identica a com'era prima di D044**: il lavoro al primo livello, cioè
 * 12,00 €/s, e i lavoretti chiusi. A sorvegliarlo è `income_per_minute_at_start`, e se diventa
 * rosso non è il bersaglio a essere invecchiato — è la partita che non si apre più come prima.
 *
 * **C'è una voce per ogni fonte, e il tipo lo pretende.** Un `levels` parziale darebbe `undefined`,
 * e `yieldAt` ci costruirebbe sopra un importo non finito che il Ledger scopre molto più a valle.
 */
const INITIAL: IncomeState = { levels: { job: 1, gigs: 0 }, declared: false }

/**
 * Quanto spazio c'è ancora in un pool, `null` se non ha tetto.
 *
 * Arriva **per costruzione** e non da un import: a rispondere è il caveau, e un dominio che
 * importa un altro dominio è un precedente, non un import — la visione ne ha diciassette che si
 * contendono le stesse risorse. A collegarli è il bootstrap, che è l'unico posto che ha entrambi
 * sotto mano (ADR 0024).
 *
 * Non è un valore ma una funzione, e da D044 va chiamata **prima di ogni transazione** e non una
 * volta per tick: se due regimi atterrano nello stesso pool, il primo ne ha già consumato una
 * parte.
 */
export type Room = (pool: Pool) => Money | null

/**
 * Il livello di **una** fonte, letto da un salvataggio e verificato prima di essere creduto
 * (INV-20, D020).
 *
 * Un livello frazionario, negativo o fuori scala non fa rumore: produce una resa sbagliata, e il
 * giocatore la scopre come uno stipendio che non torna. Una fonte **mancante** è peggio ancora —
 * `undefined` diventerebbe un importo non finito che il Ledger scopre molto più a valle — quindi
 * qui è spazzatura, non un valore predefinito.
 */
const validLevel = (
  levels: Readonly<Record<IncomeSourceId, number>>,
  id: IncomeSourceId
): number => {
  const level: unknown = levels[id]
  if (typeof level !== 'number' || !Number.isInteger(level) || level < 0 || level > MAX_LEVEL) {
    throw new TypeError(
      `income — stato salvato non valido: il livello di '${id}' deve essere un intero fra 0 e ` +
        `${MAX_LEVEL}.`
    )
  }
  return level
}

/** Ciò che serve per comprare un livello dal di fuori: quale fonte, e con che cosa si paga. */
export interface LevelOrder {
  readonly source: IncomeSource
  readonly pool: Pool
}

export interface Income {
  readonly system: Stateful<IncomeSave>
  /**
   * Lo stato, in sola lettura. Serve a chi deve **anticipare** l'esito di un acquisto —
   * `canBuyLevel` lo vuole per argomento — e non è `save()` travestito: `save()` è il contratto
   * con il disco, e i due nomi restano distinti proprio perché rispondono a domande diverse
   * (`types.ts`).
   */
  readonly state: () => IncomeState
  /**
   * ADR 0027 — gli argomenti sono la **fonte** e lo **strumento**, non il prezzo. Chi chiama
   * sceglie quale scala salire e con cosa paga; a dire quanto costa resta il listino, che il
   * comando interroga da sé.
   */
  readonly buyLevel: CommandHandler<LevelOrder, IncomeState, IncomeError>
  /**
   * ADR 0052 — mettersi in regola: da qui in avanti ciò che le fonti dichiarano di poter
   * dichiarare atterra sulla carta, al netto della parte dello Stato. Come `buyLevel`, non riceve
   * un prezzo.
   *
   * Non esiste il comando opposto, ed è il meccanismo dell'irreversibilità: un regime che si
   * cambia quando conviene è un interruttore, e il gioco ottimale di un interruttore è premerlo a
   * ogni oscillazione del saldo.
   */
  readonly declare: CommandHandler<Pool, IncomeState, IncomeError>
  /**
   * Quanto dell'ultimo tick **non** è entrato perché il caveau non lo teneva. Zero quando tutto
   * entra, e a caveau pieno vale tutto ciò che le fonti in nero hanno maturato.
   *
   * Esiste perché un idle in cui il reddito smette di entrare **senza dirlo** è un idle rotto: il
   * giocatore deve capire in un colpo d'occhio che i soldi non stanno arrivando, e perché. È un
   * numero e non un booleano perché la condizione ha due gradi che il giocatore vive in modo
   * diverso — «ne entra una parte» e «non entra niente» — e con un `sì/no` la prima sparirebbe.
   *
   * **Fino a D044 si chiamava `withheld`, e il cambio non è cosmetico**: `withheld` era quanto il
   * caveau non ha fatto entrare, `withholdingRate` è la parte dello Stato. Due cose diverse con lo
   * stesso nome nello stesso dominio, dalla stessa delega — e con due fonti e due regimi la
   * confusione smette di essere teorica.
   *
   * Non si salva: descrive l'ultimo tick, non la partita. Alla riapertura vale zero finché il
   * primo tick non dice il contrario.
   */
  readonly blocked: () => Money
}

/**
 * `modifiers` arriva per costruzione perché non può stare nel `SystemContext`: vive in `balance/`,
 * e `kernel/` non può importare `balance/` (D008). **Resta anche se dentro il dominio nessuno vi
 * registra più niente**: è il punto di composizione di `income.all`, e toglierlo vorrebbe dire
 * togliere il gancio che l'albero delle abilità userà. `ledger` arriva per la stessa porta ma per
 * una ragione diversa: un comando parte dalla UI, fuori da ogni `tick`, quindi nasce già legato al
 * proprio contesto (docs/design/flusso-tick.md).
 *
 * **Deve essere lo stesso `Ledger` che il runtime mette nel `SystemContext`.** Due istanze diverse
 * sono due partite diverse, e nessun tipo lo impedisce: è il prezzo di avere i comandi fuori dal
 * tick, e sta al bootstrap (D011) pagarlo una volta sola.
 */
export const createIncome = (ledger: Ledger, modifiers: Modifiers, room: Room): Income => {
  let state: IncomeState = INITIAL
  let blocked: Money = ZERO
  const purchase = createBuyLevel({ ledger })
  const declaration = createDeclare({ ledger })

  return {
    system: defineSystem<IncomeSave>({
      id: 'income',
      order: ORDER.INCOME,

      /**
       * D017 — il tick **non chiede e incassa il rifiuto**: sa quanto ci sta **prima** di chiedere,
       * e accredita quello. La ragione è il recupero, che è **un solo** `advance` con tutti i tick
       * arretrati — cioè una transazione da otto ore di stipendio, e il Ledger la rifiuterebbe
       * intera perché una transazione è atomica (ADR 0019). Chi è stato via una notte tornerebbe
       * con **zero**, a caveau vuoto: non un muro, un guasto travestito da regola.
       *
       * **Da D044 il giro è per regime e non per fonte** (ADR 0052, D044 trappole). Due regimi
       * possono condividere un pool con trattenute diverse, e allora la trattenuta di una
       * transazione sola andrebbe scalata sul parziale — cioè una divisione fra `Decimal`, cioè
       * precisione persa e INV-08 rotta in silenzio. Raggruppati per regime, la trattenuta resta
       * `entrato × tasso` come al primo giorno.
       *
       * Al minuto zero i regimi in gioco sono **uno**, quindi il tick emette una transazione sola
       * come prima: il raggruppamento dello stipendio nelle ultime operazioni non peggiora.
       */
      tick: (ctx, elapsed) => {
        let stopped: Money = ZERO

        for (const { regime, amount } of incomeOver(ctx.clock, state, modifiers, elapsed)) {
          // Un regime che non ha maturato niente non è un muro e non è una transazione: è un
          // regime le cui fonti sono ancora chiuse. Chiedergli quanto spazio c'è sarebbe una
          // domanda su un accredito che non esiste, e la risposta non cambierebbe nulla.
          if (amount.isZero()) continue

          // Lo spazio si chiede **qui dentro**, prima di ciascuna transazione, e non una volta per
          // tick: se due regimi atterrano nello stesso pool, il primo ne ha già consumato una
          // parte, e un tetto letto prima del giro sarebbe il tetto di un pool che non esiste più.
          const credited = incomeThatFits(amount, room(regime.pool))
          if (!credited.equals(amount)) stopped = stopped.plus(amount.minus(credited))

          // Zero non è un non-evento: sarebbe una transazione valida che non muove niente ed emette
          // lo stesso, e il giocatore vedrebbe lo storico riempirsi di stipendi da 0,00 € proprio
          // mentre gli si dice che il caveau è pieno.
          if (credited.isZero()) continue

          // La trattenuta si calcola su ciò che **entra**, non su ciò che è maturato: a caveau
          // pieno entra una parte, e tassare il maturato farebbe pagare le tasse su soldi mai
          // ricevuti.
          //
          // Non si arrotonda ai centesimi, e non è una dimenticanza: un tasso su un importo per
          // tick è già una grandezza sotto il centesimo, e arrotondare per eccesso a ogni tick
          // porterebbe la trattenuta effettiva molto sopra quella dichiarata — con un bersaglio di
          // bilanciamento che continua a guardare la costante. Il denaro qui è `Decimal` fino in
          // fondo (ADR 0006), e la partita doppia non chiede centesimi interi.
          ctx.ledger.transaction(
            income(regime.pool, credited, credited.mul(regime.withholdingRate)),
            {
              reason: 'reason.income.tick'
            }
          )
        }

        blocked = stopped
      },

      save: () => state,

      /**
       * INV-20 · D020 — **campo per campo**, non «è un oggetto».
       *
       * `SystemsSave` è opaco per lo schema del main (ADR 0002, D009): un salvataggio manomesso o
       * prodotto da una versione bacata arriva fin qui intatto, e questo è l'unico punto che può
       * guardarlo. Un `load` che lancia è un esito — `loadAll` lo trasforma in
       * `error.registry.load_failed` — mentre accettarlo declasserebbe il giocatore in silenzio.
       *
       * **Si chiede una voce per ogni fonte, e una fonte mancante è spazzatura** — non un valore
       * predefinito. Un livello assente diventerebbe `undefined`, e da lì un importo non finito che
       * il Ledger scopre molto più a valle: lontano da dove è nato, e senza più niente da cui
       * risalire.
       */
      load: (loaded) => {
        const levels = loaded?.levels
        if (typeof levels !== 'object' || levels === null) {
          throw new TypeError(`income — stato salvato non valido: 'levels' deve essere un oggetto.`)
        }
        if (typeof loaded.declared !== 'boolean') {
          throw new TypeError(
            `income — stato salvato non valido: 'declared' deve essere un booleano.`
          )
        }
        // Ricostruito **fonte per fonte** invece di essere adottato così com'è: ciò che arriva ha
        // superato i controlli sulle chiavi che conosciamo, e nient'altro. Copiarlo intero
        // porterebbe dentro anche le chiavi che non conosciamo, cioè spazzatura che si salverebbe
        // da sola al primo `save`. E il giorno in cui una fonte nuova entra, questa riga non
        // compila finché non la si nomina — che è il posto giusto per accorgersene.
        state = {
          levels: { job: validLevel(levels, 'job'), gigs: validLevel(levels, 'gigs') },
          declared: loaded.declared
        }
        // Ciò che l'ultimo tick non ha incassato riguarda l'ultimo tick, e dopo un caricamento
        // l'ultimo tick è di un'altra sessione. Il recupero, che arriva subito dopo, lo riscrive.
        blocked = ZERO
      },

      // `soft` e `hard` fanno la stessa cosa, e a dirlo è questo commento invece di un `if` che
      // finge una differenza: il prestige è la fetta 06, e nessun documento ha ancora deciso se un
      // livello comprato con i soldi sopravviva a un reset morbido. Sceglierlo qui adesso
      // significherebbe inventare una regola di gioco dentro una delega che non la riguarda.
      reset: () => {
        state = INITIAL
        blocked = ZERO
      }
    }),

    state: () => state,

    blocked: () => blocked,

    buyLevel: ({ source, pool }) => {
      const bought = purchase({ state, source, pool })
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
