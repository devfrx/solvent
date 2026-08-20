import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import './ui/tokens.css'
import { createTranslations, DEFAULT_LOCALE } from './i18n'
import { createGame } from './runtime/createGame'
import { createBrowserHost } from './runtime/host'
import { provideRuntime, useGameStore } from './stores/game'

/**
 * L'avvio, e nient'altro: costruisce la partita, consegna il browser, monta.
 *
 * Le righe sono in quest'ordine per una ragione sola: `provideRuntime` deve precedere il primo
 * `useGameStore()`, e `useGameStore()` deve seguire l'installazione di Pinia. Fuori di qui nessuno
 * costruisce un `Game`, e due `createGame()` sarebbero due partite che non si vedono.
 */

const host = createBrowserHost()

// La lingua del documento la decide `DEFAULT_LOCALE` come tutte le altre parole: scritta a mano in
// `index.html` sarebbe l'unica che non lo segue (R12).
host.setLanguage(DEFAULT_LOCALE)

provideRuntime({ game: createGame(), host })

const app = createApp(App)
app.use(createPinia())
app.use(createTranslations())

// Si parte prima di montare: la prima cosa che si vede è già il caricamento, non una pagina vuota
// che diventa caricamento un frame dopo.
void useGameStore().start()

app.mount('#app')
