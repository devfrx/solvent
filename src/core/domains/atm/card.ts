/**
 * ADR 0042 — la carta del giocatore, e i suoi dati sono **veri**.
 *
 * Fino a D036 numero, scadenza e codice erano una costante dentro `BankCard3d.vue`, dichiarata
 * decorazione con accanto il proprio grilletto: «un numero ricavato dal seme della partita sarebbe
 * la prima cosa nel gioco a distinguere una partita da un'altra a schermo». È questo.
 *
 * Il codice non è più stampa: è la **prova** che uno strumento non al portatore chiede prima di
 * pagare (`POOLS.card.bearer === false`). A confrontarlo è lo store, che ha sotto mano sia la carta
 * sia il pool scelto; qui c'è solo la domanda, pura.
 *
 * ## Perché non passa dall'`Rng`
 *
 * Un'estrazione da uno stream avanza un cursore, e quel cursore entra nel salvataggio
 * ([ADR 0005](../../../../docs/adr/0005-rng-seedato-con-stream-per-dominio.md)): `cardOf` chiamata
 * due volte darebbe due carte, e la carta cambierebbe a ogni ridisegno. Serve una funzione del
 * **seme**, non della sequenza — quindi il mescolatore è qui, è locale, e non tiene niente.
 *
 * ## Perché sta in `atm/`
 *
 * La carta è il centro della pagina del bancomat da
 * [D033](../../../../docs/delega/D033-il-bancomat-e-una-pagina.md), ed è l'unico dominio che la
 * disegni. Chi paga la riceve dallo store, che è il punto con entrambi i capi sotto mano
 * (ADR 0024): un dominio che importasse questo file romperebbe R19.
 */

/** Le sedici cifre in gruppi di quattro, la scadenza e il codice: ciò che è stampato sulla carta. */
export interface Card {
  /** `#### #### #### ####`, come stampato sul fronte. L'ultima cifra è quella di controllo. */
  readonly number: string
  /** `MM / AA`, come stampata sul fronte. */
  readonly expiry: string
  /** Le tre cifre del retro, ed è la prova. Lo zero iniziale è una cifra, quindi è una stringa. */
  readonly code: string
}

const DECIMAL_BASE = 10

/**
 * Due, e vale per tutte e tre le volte in cui compare: le cifre di Luhn si alternano a due a due
 * e si raddoppiano, e mese e anno si stampano su due cifre.
 */
const PAIR = 2

/**
 * Il finalizzatore di murmur3, trascritto com'è pubblicato — la stessa disciplina con cui `Rng.ts`
 * trascrive mulberry32: un algoritmo copiato esatto si verifica, uno "riordinato" no.
 */
const AVALANCHE_FIRST = 0x85ebca6b
const AVALANCHE_SECOND = 0xc2b2ae35
const AVALANCHE_SHIFT = 16
const AVALANCHE_MIDDLE_SHIFT = 13

/**
 * Il rapporto aureo a 32 bit, lo stesso che murmur usa per spargere: due indici vicini danno due
 * sali lontani, quindi due cifre consecutive non si assomigliano. Senza, semi vicini darebbero
 * carte quasi uguali — ed è la cosa che un test verifica con `1` e `2`.
 */
const SALT_STRIDE = 0x9e3779b9

const avalanche = (value: number): number => {
  let mixed = value | 0
  mixed = Math.imul(mixed ^ (mixed >>> AVALANCHE_SHIFT), AVALANCHE_FIRST)
  mixed = Math.imul(mixed ^ (mixed >>> AVALANCHE_MIDDLE_SHIFT), AVALANCHE_SECOND)
  return (mixed ^ (mixed >>> AVALANCHE_SHIFT)) >>> 0
}

/** Il valore alla posizione `index` della carta di questo seme. Senza stato, senza cursore. */
const at = (seed: number, index: number): number =>
  avalanche(seed + Math.imul(index + 1, SALT_STRIDE))

const digitAt = (seed: number, index: number): number => at(seed, index) % DECIMAL_BASE

/**
 * La prima cifra è **stampa**, non estrazione: è il circuito, ed è uguale su ogni carta emessa
 * dallo stesso emittente. Con una cifra qualunque il numero smetterebbe di somigliare a un numero
 * di carta, che è tutto ciò per cui esiste.
 */
const ISSUER_DIGIT = 4

const NUMBER_DIGITS = 16
const GROUP_SIZE = 4

/**
 * La cifra di controllo secondo Luhn: si raddoppia una cifra sì e una no partendo dalla penultima,
 * e la somma deve finire in zero. **Calcolata, non estratta** — è la differenza fra un numero e
 * sedici cifre in fila, e il numero che questa carta portava prima non la passava (somma 53).
 */
const checkDigitOf = (digits: readonly number[]): number => {
  const sum = [...digits].reverse().reduce((total, digit, index) => {
    // La cifra di controllo occuperà la posizione 0 da destra, quindi qui il raddoppio comincia
    // dalla 0 di questo elenco, che a numero finito sarà la 1.
    if (index % PAIR === 1) return total + digit
    const doubled = digit * PAIR
    return total + (doubled > DECIMAL_BASE - 1 ? doubled - (DECIMAL_BASE - 1) : doubled)
  }, 0)
  return (DECIMAL_BASE - (sum % DECIMAL_BASE)) % DECIMAL_BASE
}

const grouped = (digits: readonly number[]): string =>
  digits
    .join('')
    .replace(new RegExp(`(\\d{${GROUP_SIZE}})(?=\\d)`, 'g'), '$1 ')
    .trim()

const MONTHS_IN_YEAR = 12

/**
 * La finestra dei due anni stampati. È **decorazione dichiarata**: nessuna regola la legge, e una
 * carta che scadesse davvero vorrebbe un rinnovo, un costo e uno stato nel salvataggio. Si deriva
 * lo stesso perché una carta mezza derivata e mezza fissa è incoerente a guardarla. Il grilletto
 * per farla contare è il primo dominio che rinnovi uno strumento.
 */
const EXPIRY_FIRST_YEAR = 28
const EXPIRY_YEARS = 7

const CODE_DIGITS = 3

/** Gli indici da cui vengono mese, anno e le tre cifre del retro: dopo le cifre del numero. */
const MONTH_INDEX = NUMBER_DIGITS
const YEAR_INDEX = NUMBER_DIGITS + 1
const CODE_INDEX = YEAR_INDEX + 1

/**
 * Due cifre stampate, senza un letterale da imbottitura: cento più il valore, e via la prima cifra.
 * `padStart(width, '0')` sarebbe la strada consueta e porterebbe un numero fra apici dentro un
 * dominio, che è la forma che `tests/rules/domains-no-money-literals` vieta — giustamente, perché
 * è indistinguibile da un importo di gioco costruito da una stringa.
 */
const PAD_BASE = 100

const padded = (value: number): string => String(PAD_BASE + value).slice(1)

/**
 * La carta di questa partita. Stessa in ogni chiamata, diversa in ogni partita.
 *
 * L'intestatario non è qui, ed è una decisione: numero, scadenza e codice si ricavano da cifre, un
 * nome vorrebbe un elenco di nomi — dati nuovi che nessuna regola legge, per una riga stampata.
 * Resta in `BankCard3d.vue` insieme alle etichette, che sono uguali in ogni partita e in ogni
 * lingua.
 */
export const cardOf = (seed: number): Card => {
  const body = [
    ISSUER_DIGIT,
    ...Array.from({ length: NUMBER_DIGITS - PAIR }, (_, index) => digitAt(seed, index + 1))
  ]

  const month = 1 + (at(seed, MONTH_INDEX) % MONTHS_IN_YEAR)
  const year = EXPIRY_FIRST_YEAR + (at(seed, YEAR_INDEX) % EXPIRY_YEARS)
  const code = Array.from({ length: CODE_DIGITS }, (_, index) => digitAt(seed, CODE_INDEX + index))

  return {
    number: grouped([...body, checkDigitOf(body)]),
    expiry: `${padded(month)} / ${padded(year)}`,
    code: code.join('')
  }
}

/**
 * Se ciò che è stato digitato è il codice di questa carta.
 *
 * Gli spazi intorno si tolgono perché li lascia chi digita; lo zero iniziale no, perché è una
 * cifra: `041` non è `41`, ed è la ragione per cui il confronto è fra stringhe e non fra numeri.
 */
export const authorizes = (card: Card, typed: string): boolean => typed.trim() === card.code
