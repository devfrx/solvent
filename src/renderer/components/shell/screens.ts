import type { MessageKey } from '@renderer/i18n'

/**
 * D024 — le destinazioni del telaio, e le parole di ciascuna.
 *
 * Vivevano dentro `App.vue` e si sceglievano con una fila di linguette. Adesso le legge anche la
 * colonna, quindi la lista esce di lì: se restasse nel guscio, la colonna dovrebbe riceverla per
 * proprietà o riscriverla, e la seconda copia è quella che resta indietro.
 *
 * **La lista non è la mappa delle schermate.** Qui ci sono i nomi e le parole; quale componente
 * montare lo dice `App.vue`, con un `Record` totale su `Screen` — che è INV-22: una destinazione
 * senza schermata non compila. La separazione non è formale, è ciò che permette a questo file di
 * non importare le viste, e alla colonna di leggerlo senza tirarsi dietro l'intera applicazione.
 *
 * Un `ref` e non un router: cinque destinazioni **piatte** senza un indirizzo da condividere non
 * giustificano una dipendenza (ADR 0015), e il grilletto è scritto — la prima schermata che deve
 * essere raggiungibile da fuori, oppure la prima gerarchia. Un gruppo nella colonna non è una
 * gerarchia di indirizzi: è un titolo sopra delle voci che restano tutte allo stesso livello.
 *
 * D033 — `home` non c'è più, e al suo posto ci sono **due** destinazioni. La home faceva due
 * lavori, il bancomat e il cruscotto, e l'[ADR 0018](../../../../docs/adr/0018-la-home-e-un-atm.md)
 * li teneva insieme con un tetto di sei riquadri. Quel tetto difendeva il bancomat **dentro** una
 * pagina condivisa; separarle rende la difesa inutile invece che più severa
 * ([ADR 0040](../../../../docs/adr/0040-il-bancomat-e-il-cruscotto-sono-due-pagine.md)).
 */

export const SCREENS = ['atm', 'income', 'vault', 'board', 'stats'] as const

export type Screen = (typeof SCREENS)[number]

/**
 * D026 — i gruppi della colonna, e l'ordine in cui le destinazioni ci stanno dentro.
 *
 * Il registro YAGNI fissava il grilletto alla **terza** destinazione, perché con due voci due
 * gruppi sono due intestazioni sopra una riga ciascuna. L'ADR 0033 ne ha portate quattro, quindi è
 * scattato qui.
 *
 * La divisione non è inventata: da una parte i posti in cui si **fa** qualcosa — i domini, ognuno
 * con la sua pagina — dall'altra i posti in cui si **guarda** ciò che è successo. È la stessa
 * distinzione che l'ADR 0018 fa dentro la home fra il bancomat e il cruscotto, portata un piano
 * sopra.
 */
export const NAV_GROUPS = [
  { title: 'app.nav.group.act', screens: ['atm', 'income', 'vault'] },
  { title: 'app.nav.group.look', screens: ['board', 'stats'] }
] as const satisfies readonly { readonly title: MessageKey; readonly screens: readonly Screen[] }[]

interface ScreenWording {
  /** Il nome nella colonna, nelle briciole e nel titolo della schermata: è la stessa parola. */
  readonly title: MessageKey
  readonly description: MessageKey
}

/**
 * Un `Record` totale, come `WORDING` in `AtmPanel`: una destinazione nuova non compila finché non
 * ha tutte e due le sue parole, che è lo stesso meccanismo con cui `failure` obbliga a tradurre un
 * codice d'errore.
 */
export const SCREEN_WORDING: Readonly<Record<Screen, ScreenWording>> = {
  atm: { title: 'app.nav.atm', description: 'atm.description' },
  income: { title: 'app.nav.income', description: 'income.description' },
  vault: { title: 'app.nav.vault', description: 'vault.description' },
  board: { title: 'app.nav.board', description: 'board.description' },
  stats: { title: 'app.nav.stats', description: 'stats.description' }
}

/**
 * R18 · ADR 0033 — dove si amministra ogni dominio.
 *
 * La chiave è il nome della cartella in `src/core/domains/`; il valore è la destinazione, oppure
 * `null` per un dominio che non è un posto dove si va. `calendar` (ADR 0023) sarà il primo `null`:
 * è l'orologio del gioco e non ha niente da mostrare.
 *
 * **`null` è una risposta, non una dimenticanza**, ed è la differenza che tiene in piedi la regola:
 * `tests/rules/domain-ui` confronta queste chiavi con le cartelle vere di `src/core/domains/`, e un
 * dominio che non compare qui è rosso. Il tipo non basta da solo — non esiste un'unione `Domain`, e
 * inventarla vorrebbe dire far esportare a `@core` un elenco che nessuno gli chiede.
 *
 * `atm` sta sulla **propria** destinazione da D033, e la frase che stava qui diceva il contrario:
 * «la home *è* la pagina del bancomat, con il cruscotto sotto». Era vera e aveva una data. Adesso
 * il bancomat ha una pagina che è solo sua, e il cruscotto ne ha un'altra.
 *
 * **`board` non è un dominio**, e questa mappa lo sopporta senza cambiare: va da cartella di
 * dominio a destinazione, non il contrario. Una destinazione senza dominio è legittima — `stats`
 * lo è dal primo giorno — mentre un dominio senza destinazione non compila.
 */
export const DOMAIN_SCREENS: Readonly<Record<string, Screen | null>> = {
  atm: 'atm',
  income: 'income',
  vault: 'vault'
}
