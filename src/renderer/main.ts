import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import './ui/tokens.css'
import { createTranslations, DEFAULT_LOCALE } from './i18n'
import { installCheats } from './runtime/cheats'
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

const game = createGame()

/**
 * D029 — l'unico posto del progetto che chiede «siamo in sviluppo?» per i cheat, ed è qui perché
 * qui si decidono già le cose dell'ambiente. `import.meta.env.DEV` non è una variabile: il
 * compilatore la **sostituisce** con `false` in un pacchetto di rilascio, quindi questo ramo
 * sparisce e con lui `installCheats`, il registro e i tre file che dichiarano i cheat — nessuno
 * li raggiunge più. La misura del bundle sta in fondo a D029.
 */
provideRuntime(import.meta.env.DEV ? { game, host, cheats: installCheats(game) } : { game, host })

const app = createApp(App)
app.use(createPinia())
app.use(createTranslations())

// Si parte prima di montare: la prima cosa che si vede è già il caricamento, non una pagina vuota
// che diventa caricamento un frame dopo.
void useGameStore().start()

app.mount('#app')
