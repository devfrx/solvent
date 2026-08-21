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
 * Un `ref` e non un router: quattro destinazioni **piatte** senza un indirizzo da condividere non
 * giustificano una dipendenza (ADR 0015), e il grilletto è scritto — la prima schermata che deve
 * essere raggiungibile da fuori, oppure la prima gerarchia. Un gruppo nella colonna non è una
 * gerarchia di indirizzi: è un titolo sopra delle voci che restano tutte allo stesso livello.
 */

export const SCREENS = ['home', 'income', 'vault', 'stats'] as const

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
  { title: 'app.nav.group.act', screens: ['home', 'income', 'vault'] },
  { title: 'app.nav.group.look', screens: ['stats'] }
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
  home: { title: 'app.nav.home', description: 'home.description' },
  income: { title: 'app.nav.income', description: 'income.description' },
  vault: { title: 'app.nav.vault', description: 'vault.description' },
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
 * `atm` sta su `home` e non su una destinazione sua: la home **è** la pagina del bancomat, con il
 * cruscotto sotto, e l'ADR 0018 resta in vigore.
 */
export const DOMAIN_SCREENS: Readonly<Record<string, Screen | null>> = {
  atm: 'home',
  income: 'income',
  vault: 'vault'
}
