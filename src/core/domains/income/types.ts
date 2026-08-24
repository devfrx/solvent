/**
 * Lo stato del sistema `income`, e la sua forma salvata.
 */

/**
 * Le fonti che esistono, dichiarate come **unione di id** e non come stringa libera.
 *
 * L'elenco è fisso: una fonte non si crea e non si distrugge, non ha un budget e non nasce da una
 * scelta del giocatore (scheda di dominio, domanda 9). Ne discende che questo tipo può essere
 * un'unione chiusa — ed è ciò che permette a `IncomeState.levels` di essere un `Record` con le
 * chiavi note, cioè di non poter dimenticare una fonte.
 *
 * La terza fonte — quella che rende di più e si paga in **calore** — è di fetta 04, e quando
 * arriverà sarà una riga in più qui e una in `SOURCES`.
 */
export type IncomeSourceId = 'job' | 'gigs'

export interface IncomeState {
  /**
   * A che livello sta ogni fonte. Zero è una fonte **chiusa**, che non rende niente: la partita si
   * apre con il lavoro a uno e i lavoretti a zero.
   *
   * È un `Record` sulle chiavi note e non una mappa parziale, e non è pignoleria di tipi: un
   * `levels` a cui manca una fonte darebbe `undefined`, e `yieldAt` ci costruirebbe sopra un
   * importo non finito che il Ledger scopre molto più a valle — cioè lontano da dove è nato. Con
   * questo tipo, dimenticare una fonte non compila.
   */
  readonly levels: Readonly<Record<IncomeSourceId, number>>
  /**
   * Se il giocatore ha messo in regola il proprio reddito (ADR 0052). Da qui discende il
   * **regime**, che però non è più una proprietà del dominio: ogni fonte dichiara cosa le succede
   * quando questo booleano cambia, e i lavoretti dichiarano che non le succede niente.
   *
   * Resta una scelta sola, del giocatore e non della fonte: è lo stato di una persona, non di un
   * lavoro.
   *
   * **Non torna mai a `false`.** L'irreversibilità non è severità: un regime che si cambia quando
   * conviene è un interruttore, e il gioco ottimale di un interruttore è premerlo a ogni
   * oscillazione del saldo — cioè la mansione che l'ADR 0052 esiste per togliere.
   */
  readonly declared: boolean
}

/**
 * Ciò che finisce nel salvataggio sotto la chiave `income`. Da D044 **torna a coincidere** con lo
 * stato, e la ragione per cui aveva smesso è sparita insieme al problema che risolveva.
 *
 * Fino a D043 `declared` era **opzionale sul disco**: una partita scritta prima di quella delega
 * era una partita in cui il regime non esisteva, e il campo assente significava «in nero». Adesso
 * il salvataggio ha una versione sua — la 2 — e a portare una partita vecchia fin qui è una
 * **migrazione**, che scrive il campo per tutti. Un tipo che ammette l'assenza descriverebbe una
 * forma che questa versione non produce più.
 *
 * I due nomi restano distinti per la ragione di sempre: `IncomeState` è ciò che il sistema tiene
 * in memoria, `IncomeSave` è il contratto con il file su disco. Il giorno in cui lo stato guadagna
 * un campo che non si salva, a cambiare è uno solo dei due.
 */
export type IncomeSave = IncomeState
