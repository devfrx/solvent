import type { Cheat, CheatResult } from '@core/contracts/cheats'
import { ok } from '@core/contracts/result'

import { BALANCE } from '@core/balance/constants'
import type { Modifiers } from '@core/balance/modifiers'

import { INCOME_TARGET } from './rules'

/**
 * D029 · R20 — i cheat del reddito, dichiarati dal reddito.
 *
 * Uno solo, ed è un **interruttore**: accende e spegne un moltiplicatore su `income.all`.
 *
 * **Da [D044](../../../../docs/delega/D044-il-reddito-e-un-elenco-di-fonti.md) non tocca più lo
 * stato, e la differenza è tutto il punto.** Prima invertiva `upgraded`, cioè l'unico modificatore
 * che il gioco registrasse davvero; adesso i livelli sono aritmetica pura sullo stato e nel
 * registro non c'è più niente. Questo cheat è ciò che tiene `income.all` **provato da qualcosa che
 * non sia un test** finché l'albero delle abilità non arriva: senza, `register` e `remove`
 * resterebbero vivi solo nei propri test — cioè quel «campo provato e non usato» che nessun gate sa
 * vedere e che [D040](../../../../docs/delega/D040-il-recupero-avanza-a-blocchi.md) ha già pagato
 * una volta.
 *
 * **Toglie prima di rimettere**, e non è prudenza: `register` rifiuta il duplicato **lanciando**,
 * perché un upgrade comprato due volte è un bug di gioco e non un raddoppio legittimo. Un
 * interruttore che non togliesse prima farebbe crollare la seconda pressione.
 */

const BOOST_ID = 'cheat.income.boost'

export const incomeCheats = (modifiers: Modifiers): readonly Cheat[] => [
  {
    id: 'cheat.income.boost',
    kind: 'act',
    run: (): CheatResult => {
      const active = modifiers.sourcesFor(INCOME_TARGET).some((each) => each.id === BOOST_ID)
      modifiers.remove(BOOST_ID)
      if (!active) {
        // Vale **un livello**, e il numero non è scelto qui: è il fattore di crescita della scala.
        // Un moltiplicatore suo sarebbe un numero di gioco in più da tarare per una cosa che nel
        // pacchetto di rilascio non esiste.
        modifiers.register({
          id: BOOST_ID,
          target: INCOME_TARGET,
          kind: 'mult',
          value: BALANCE.INCOME_LEVEL_GROWTH
        })
      }
      return ok(undefined)
    }
  }
]
