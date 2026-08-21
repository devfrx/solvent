import { incomeCheats } from '@core/domains/income/cheats'
import { vaultCheats } from '@core/domains/vault/cheats'
import type { Cheats } from '@core/kernel/Cheats'
import { createCheats } from '@core/kernel/Cheats'
import { ledgerCheats } from '@core/kernel/LedgerCheats'

import type { Game } from './createGame'

/**
 * D029 · R20 — dove i cheat di una partita si mettono insieme, e l'unico posto che li nomina tutti.
 *
 * È il gemello di `createGame`: lì si registra un sistema con **una riga**, qui si registrano i
 * cheat di un pezzo con una riga. La ragione è la stessa dell'
 * [ADR 0024](../../../docs/adr/0024-un-sistema-riceve-per-costruzione-cio-che-non-sta-nel-contesto.md) —
 * questo livello è l'unico che ha tutti i capi sotto mano — e il prezzo accettato è lo stesso: un
 * pezzo nuovo con dei cheat non funziona finché non ha la sua riga qui.
 *
 * **Non c'è `import.meta.env` in questo file**, ed è deliberato. La domanda «siamo in sviluppo?»
 * ha una risposta sola e vive nel bootstrap (`main.ts`), che è l'unico posto che già decide cose
 * dell'ambiente. Tenerla fuori di qui lascia questa funzione **provabile**: un test costruisce una
 * partita, installa i cheat e li esegue, senza dover fingere una variabile del compilatore.
 *
 * **E in un pacchetto di rilascio questo file non esiste.** Non per una guardia scritta qui, ma
 * perché nessuno lo chiama: `main.ts` avvolge l'unica chiamata in `import.meta.env.DEV`, che il
 * compilatore sostituisce con `false`, e da lì in poi questo modulo — e i tre che importa — non
 * sono raggiungibili. La misura è in fondo a [D029](../../../docs/delega/D029-i-devcheat.md).
 */

export const installCheats = (game: Game): Cheats => {
  const cheats = createCheats()

  cheats.register(...ledgerCheats(game.ctx.ledger))
  cheats.register(...vaultCheats(game.vault))
  cheats.register(...incomeCheats(game.income))

  return cheats
}
