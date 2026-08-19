import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { createGame } from './runtime/createGame'
import { createBrowserHost } from './runtime/host'
import { provideRuntime, useGameStore } from './stores/game'

/**
 * L'avvio, e nient'altro: costruisce la partita, consegna il browser, monta.
 *
 * Le tre righe sono in quest'ordine per una ragione sola: `provideRuntime` deve precedere il primo
 * `useGameStore()`, e `useGameStore()` deve seguire l'installazione di Pinia. Fuori di qui nessuno
 * costruisce un `Game`, e due `createGame()` sarebbero due partite che non si vedono.
 */

provideRuntime({ game: createGame(), host: createBrowserHost() })

const app = createApp(App)
app.use(createPinia())

// Si parte prima di montare: la prima cosa che si vede è già il caricamento, non una pagina vuota
// che diventa caricamento un frame dopo.
void useGameStore().start()

app.mount('#app')
