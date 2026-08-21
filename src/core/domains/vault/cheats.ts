import type { Cheat, CheatResult } from '@core/contracts/cheats'
import { ok } from '@core/contracts/result'

import { MAX_LEVEL } from './rules'
import type { Vault } from './system'

/**
 * D029 · R20 — i cheat del caveau, dichiarati dal caveau.
 *
 * **Muovono il livello, non la capienza.** Il livello è l'unica cosa che il caveau ricorda
 * (`types.ts`); la capienza si calcola da lì con la curva di `balance/`. Un cheat che scrivesse una
 * capienza arbitraria racconterebbe una partita che il gioco non sa produrre, ed è la classe di
 * stato incoerente che ha bloccato l'ambiente di sviluppo per due giorni.
 *
 * **E lo muovono con `system.load`**, che è la porta da cui il livello arriva già ogni volta che si
 * apre una partita. Non serviva aggiungere un `setLevel` al `Vault` per farlo: una superficie
 * pubblica nuova, esistente solo per i cheat, sarebbe rimasta lì anche il giorno in cui i cheat non
 * ci fossero — e `load` in più **valida il campo** (INV-20), quindi un livello scritto male viene
 * rifiutato qui come verrebbe rifiutato da un salvataggio manomesso.
 */

const levelTo = (vault: Vault, level: number) => (): CheatResult => {
  vault.system.load({ level })
  return ok(undefined)
}

export const vaultCheats = (vault: Vault): readonly Cheat[] => [
  {
    id: 'cheat.vault.level_up',
    kind: 'act',
    // `Math.min` e non un rifiuto: un cheat che dicesse di no all'ultimo livello sarebbe un
    // pulsante che smette di funzionare senza spiegare, e spiegare è compito del gioco vero.
    run: (): CheatResult => levelTo(vault, Math.min(vault.state().level + 1, MAX_LEVEL))()
  },
  { id: 'cheat.vault.max_level', kind: 'act', run: levelTo(vault, MAX_LEVEL) },
  { id: 'cheat.vault.reset_level', kind: 'act', run: levelTo(vault, 0) }
]
