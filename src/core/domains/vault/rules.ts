import type { Money } from '@core/contracts/money'
import type { PaymentOption, PriceList } from '@core/contracts/payment'
import type { Pool } from '@core/contracts/pools'
import { CASH_START_CAPACITY } from '@core/contracts/pools'

import { BALANCE } from '@core/balance/constants'

import type { Space, VaultState } from './types'
import { space } from './types'

/**
 * Le regole del caveau. Tutte pure (R13): nessun contesto, nessun effetto, nessuna lettura
 * dell'ora, nessuna casualità — il caveau non ticchetta e non usa l'Rng, e discende dalla varianza
 * zero decisa nella scheda del dominio.
 *
 * Da `kernel/` questo file non importa niente, nemmeno un tipo: spazio, capienze, prezzi e livelli
 * sono aritmetica su `Decimal` e un indice.
 */

/**
 * Il pool che il caveau tiene, dichiarato **qui** invece che scritto nel bootstrap.
 *
 * È il nome che `createGame` usa per decidere a chi consegnare la capienza variabile (ADR 0025).
 * Scriverlo lì sarebbe un `if` sul nome di un pool in un file che non è del caveau, cioè la forma
 * che l'ADR 0017 esiste per non avere: il dominio dichiara di cosa parla, il bootstrap collega.
 */
export const VAULT_POOL: Pool = 'cash'

/**
 * L'ultimo livello, che è anche «di quanti» il giocatore vede scritto accanto al proprio.
 *
 * Fino a D042 si **contava** la lunghezza dell'elenco delle capienze, per non tenere un numero
 * accanto a una lista che invecchia. Adesso l'elenco non esiste: la scala si calcola, quindi il
 * numero di gradini è la costante da cui si calcola, e contarli sarebbe contare ciò che si è
 * appena prodotto.
 */
export const MAX_LEVEL: number = BALANCE.VAULT_LEVELS - 1

/**
 * Lo spazio del caveau appena nato, **derivato** dalla capienza che il pool dichiara (ADR 0017).
 *
 * Scriverlo come cifra sarebbe la stessa quantità in due posti: `CASH_START_CAPACITY` e questo
 * numero direbbero la stessa cosa, e il giorno in cui uno dei due si muovesse il caveau di partenza
 * comincerebbe a tenere più o meno di quanto i contanti dichiarano di poter tenere. È la forma di
 * INV-18 applicata al primo gradino, ed è la stessa che l'elenco vecchio aveva cominciando da
 * quella costante.
 */
const SPACE_AT_ZERO: Space = space(CASH_START_CAPACITY.div(BALANCE.CASH_PER_SPACE))

/**
 * La scala, **calcolata una volta sola** all'avvio del modulo: uno spazio di partenza, un fattore
 * di crescita, un numero di gradini (D042).
 *
 * Resta una **lista** anche se nasce da una formula, e non per pigrizia: è ciò che permette a
 * `expansionPrices` di rispondere «non si può» con una lista vuota invece che con un ramo. Un
 * indice che cade fuori è già una risposta, e chi legge non trova un `if` che distingue i due casi.
 */
const SPACES: readonly Space[] = [...Array(BALANCE.VAULT_LEVELS).keys()].map((level) =>
  space(SPACE_AT_ZERO.times(BALANCE.VAULT_SPACE_GROWTH.pow(level)))
)

/**
 * Il livello stretto fra zero e il massimo. Un livello fuori scala arriva da un salvataggio, cioè
 * da fuori, e uno spazio `undefined` diventerebbe un tetto che non esiste — cioè nessun tetto, cioè
 * il contrario del muro.
 */
const withinScale = (level: number): number => Math.min(Math.max(level, 0), MAX_LEVEL)

/**
 * Le capienze in contanti, una per gradino. È l'**unico punto del progetto in cui ingombro e denaro
 * si toccano** (INV-26, ADR 0051): lo spazio del livello per la densità dichiarata dei contanti.
 *
 * **Si calcola una volta sola, e non è un'ottimizzazione: è INV-18.** Il Ledger interroga la
 * capienza a ogni transazione e la UI a ogni frame; se ognuna delle due ricevesse un `Decimal`
 * nuovo, il confronto fra ciò che il Ledger fa rispettare e ciò che lo schermo mostra tornerebbe a
 * essere un'uguaglianza fra due valori invece di un'identità fra due letture della stessa cosa — e
 * i test che oggi lo provano con `toBe` non potrebbero più farlo.
 *
 * Il giorno in cui il caveau conterrà anche oggetti, questa lista smette di essere una costante e
 * torna una funzione dell'ingombro occupato: è **qui** che la sottrazione entra, e nient'altro si
 * muove (docs/design/domini/vault.md, _Lo spazio_).
 */
const CASH_CAPACITIES: readonly Money[] = SPACES.map((amount) =>
  amount.times(BALANCE.CASH_PER_SPACE)
)

/**
 * Quanti **contanti** ci stanno nel caveau a un certo livello. È la funzione che il Ledger fa
 * rispettare e che la UI mostra: una sola, interrogata da entrambi (INV-18).
 *
 * Chi la chiama riceve degli euro e non sa che dietro c'è un volume — il Ledger, il reddito e il
 * bancomat non sono cambiati di una riga quando l'unità è cambiata, ed era il punto.
 *
 * Fino a D042 si chiamava `capacityFor`. Il nome è cambiato perché adesso le capienze sono due —
 * l'ingombro e ciò che ci sta dentro — e «la capienza» direbbe quale solo a chi già lo sa.
 */
export const cashCapacityFor = (level: number): Money =>
  CASH_CAPACITIES[withinScale(level)] ?? CASH_START_CAPACITY

/**
 * L'ingombro **non ha un accessore pubblico**, e non l'ha nemmeno privato: chi legge questo file
 * trova `SPACES` e la moltiplicazione che ne esce, e basta. Un `spaceOf(level)` c'è stato per
 * mezz'ora ed è uscito quando si è visto che non lo chiamava nessuno — il Ledger, il reddito, il
 * bancomat e la UI vogliono euro, e il giorno degli oggetti a chiamarlo sarà `CASH_CAPACITIES`,
 * cioè questo stesso file. Una funzione tenuta viva dai propri test è un campo provato e non usato,
 * e nessun gate sa vedere la differenza (D040).
 */

/** Se da qui non si va più da nessuna parte. Il caveau finisce, e il giocatore lo sa dall'inizio. */
export const isMaxLevel = (state: VaultState): boolean => state.level >= MAX_LEVEL

/**
 * I livelli da cui si **parte**, cioè tutti tranne l'ultimo: dall'ultimo non si va da nessuna
 * parte, e a dirlo è la lunghezza di questa lista invece di un `if`.
 */
const EXPANSION_LEVELS: readonly number[] = [...Array(MAX_LEVEL).keys()]

/**
 * Quanto costa un ampliamento in **contanti**, per il livello da cui si paga.
 *
 * È una frazione dichiarata della capienza di partenza, e la frazione **è** la meccanica: per
 * pagare in contanti bisogna poterli tenere, quindi il caveau va quasi riempito prima di potersi
 * ampliare. È il muro che insegna sé stesso, e fino a D042 a renderlo vero erano quattro numeri
 * allineati a mano — di cui uno era già scivolato al 90,7%.
 */
const CASH_PRICES: readonly Money[] = EXPANSION_LEVELS.map((level) =>
  cashCapacityFor(level).times(BALANCE.VAULT_EXPANSION_PRICE_RATIO)
)

/**
 * Gli stessi ampliamenti pagati con la **carta**: lo stesso prezzo meno lo sconto, che è dichiarato
 * una volta sola.
 *
 * Fino a D042 erano quattro costanti che portavano tutte lo stesso numero, con scritto accanto che
 * «un prezzo derivato da un altro non è un prezzo». L'argomento era giusto e applicato al verso
 * sbagliato: a divergere erano proprio loro. Qui la cosa dichiarata non è il prezzo — è lo
 * **sconto**, che è la leva di gioco vera, ed è quella che `vault_card_discount` sorveglia.
 */
const CARD_PRICES: readonly Money[] = CASH_PRICES.map((price) =>
  price.minus(BALANCE.VAULT_CARD_DISCOUNT)
)

/**
 * Il listino dell'ampliamento: per ogni strumento che lo compra, quanto costa con quello
 * (ADR 0027). È il **primo listino a due voci** del gioco.
 *
 * All'ultimo livello è **vuoto**, e non è un caso limite trattato a parte: gli elenchi dei prezzi
 * hanno un elemento in meno della scala, quindi l'indice cade fuori da solo. Chi legge non trova un
 * ramo che distingue «si può» da «non si può» — trova una lista, e una lista vuota è una risposta.
 */
export const expansionPrices = (level: number): PriceList => {
  const cash = CASH_PRICES[level]
  const card = CARD_PRICES[level]
  return cash === undefined || card === undefined
    ? []
    : [
        { pool: VAULT_POOL, price: cash },
        { pool: 'card', price: card }
      ]
}

/**
 * L'opzione del listino per uno strumento, `null` se il listino non lo offre — o se il listino non
 * c'è più. È la gemella di `upgradePriceFor`, e per la stessa ragione: la UI la chiama prima di
 * mostrare un prezzo, il comando prima di pagarlo, e leggono lo **stesso** posto (INV-19).
 */
export const expansionPriceFor = (level: number, pool: Pool): PaymentOption | null =>
  expansionPrices(level).find((option) => option.pool === pool) ?? null

/**
 * L'anteprima del pulsante: ampliabile se non si è già all'ultimo livello e se quello strumento
 * basta. Il prezzo arriva **per argomento**, dentro l'opzione, e l'opzione viene dal listino: se
 * questa funzione se lo ripescasse da sola sarebbe una seconda lettura da tenere allineata a
 * quella del comando, che è ciò che INV-19 vieta.
 *
 * A decidere resta il Ledger quando il comando esegue: qui si risponde alla UI, che vuole saperlo
 * **prima** di smorzare un pulsante — non di spegnerlo (INV-21).
 */
export const canExpand = (state: VaultState, option: PaymentOption, available: Money): boolean =>
  !isMaxLevel(state) && available.greaterThanOrEqualTo(option.price)
