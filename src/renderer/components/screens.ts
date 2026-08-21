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
 * Un `ref` e non un router: due destinazioni senza un indirizzo da condividere non giustificano una
 * dipendenza (ADR 0015), e il grilletto è scritto — la prima schermata che deve essere raggiungibile
 * da fuori.
 */

export const SCREENS = ['home', 'stats'] as const

export type Screen = (typeof SCREENS)[number]

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
  stats: { title: 'app.nav.stats', description: 'stats.description' }
}
