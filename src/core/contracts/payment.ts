import type { Money } from './money'
import type { Pool } from './pools'

/**
 * ADR 0027 — il listino è dell'azione, la scelta è del giocatore.
 *
 * L'ADR 0017 dice che «la scelta *con cosa pago* è il meccanismo centrale del gioco», e per due
 * deleghe il codice ha detto il contrario: `income` comprava il suo upgrade con il pool scritto
 * nel sorgente. Qui c'è il vocabolario che mancava perché quella frase diventasse vera.
 *
 * È **solo** vocabolario, nessuna funzione. Un listino si costruisce nel dominio che lo dichiara —
 * i prezzi sono regole di gioco — e si legge da due parti che non si conoscono fra loro: la UI per
 * mostrare, il comando per applicare. Ciò che condividono è il tipo, e sta qui accanto agli altri.
 *
 * Il kernel non lo conosce, e non deve: `TransactionMeta.accepts` continua a dire **se** un pool è
 * ammesso, il Ledger continua a validare movimenti senza sapere quanto costano. Un prezzo per
 * strumento dentro il kernel sarebbe un pezzo di gioco nel motore, che è il difetto A05.
 */

/**
 * Un modo di pagare un'azione: lo strumento, e quanto costa con quello.
 *
 * Non c'è il calore, e non è una dimenticanza: è un dominio della fetta 04, e nessuno leggerebbe
 * quel campo per tre fette. Arriverà **additivo** — nessuna migrazione, nessun chiamante da
 * toccare, nessun test da riscrivere — e fino ad allora il grilletto sta nel registro YAGNI.
 */
export interface PaymentOption {
  readonly pool: Pool
  readonly price: Money
}

/**
 * Il listino di un'azione: un'opzione per ogni strumento che accetta.
 *
 * Una lista e non una mappa su `Pool`, per due ragioni. L'ordine è quello in cui il giocatore le
 * vede, e una mappa non ne ha uno; e una mappa totale obbligherebbe ogni azione a dire qualcosa
 * anche sui quattro conti che strumenti non sono (ADR 0020).
 *
 * Un listino di **una** voce non è un caso speciale: è un listino di uno. Chi lo legge non conta
 * le voci per decidere se è valido — le conta, semmai, per sapere se c'è una scelta da offrire o
 * una ragione da spiegare.
 */
export type PriceList = readonly PaymentOption[]
