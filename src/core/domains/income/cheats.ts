import type { Cheat, CheatResult } from '@core/contracts/cheats'
import { ok } from '@core/contracts/result'

import type { Income } from './system'

/**
 * D029 · R20 — i cheat del reddito, dichiarati dal reddito.
 *
 * Uno solo, ed è un **interruttore** invece di due pulsanti: il reddito ha un potenziamento in
 * tutto, e il caso interessante da provare a mano non è comprarlo — quello lo fa il gioco — ma
 * **disfarlo**, per rivedere la schermata di prima senza ricominciare una partita.
 *
 * Passa da `system.load`, come i cheat del caveau e per la stessa ragione: è la porta che il
 * reddito ha già, valida il campo (INV-20) e risincronizza il modificatore su `income.all`. Un
 * cheat che scrivesse `upgraded` senza toccare il modificatore lascerebbe il rendimento fermo e
 * l'etichetta cambiata — due numeri che si contraddicono, cioè il difetto che questo file esiste
 * per non ricreare.
 */

export const incomeCheats = (income: Income): readonly Cheat[] => [
  {
    id: 'cheat.income.toggle_upgrade',
    kind: 'act',
    run: (): CheatResult => {
      income.system.load({ upgraded: !income.state().upgraded })
      return ok(undefined)
    }
  }
]
