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

/**
 * ADR 0042 — il pagamento rifiutato **prima** del Ledger, perché la prova non è stata data.
 *
 * Uno strumento non al portatore (`POOLS[pool].bearer === false`) chiede di dimostrare di averlo
 * in mano prima di pagarci. A confrontare è lo store, che ha sotto mano sia la carta sia il pool
 * scelto: nel componente sarebbe «si è ricordato di controllare» invece di una proprietà, e dentro
 * un dominio non si può — il codice viene dalla carta, la carta sta in `atm`, e un dominio non ne
 * importa un altro (R19).
 *
 * **Il rifiuto arriva prima del Ledger e non lo scavalca**: non c'è nessuna transazione da
 * annullare, che è la stessa forma di `notInPriceList` in `income/commands.ts`.
 *
 * Un codice nuovo e non uno del Ledger, all'inverso di quella scelta: lì il fatto era lo stesso —
 * «con questo strumento non si paga» — mentre qui è un fatto che il Ledger non conosce, e che non
 * ha nessun `accepted` da mettere accanto. Porta il pool perché la frase deve dire **quale**
 * strumento ha chiesto una prova.
 */
export interface PaymentError {
  readonly code: 'error.payment.unauthorized'
  readonly pool: Pool
}
