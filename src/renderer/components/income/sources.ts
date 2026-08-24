import type { Pool } from '@core/contracts/pools'

import type { MessageKey } from '@renderer/i18n'

/**
 * D044 — le due domande che il pannello di una fonte fa, pure e fuori dal `.vue` (R05).
 *
 * Stanno qui e non nel componente per la ragione di `instruments.ts`: sono le righe sbagliabili di
 * questo pezzo, e provarle non costa di montare niente.
 */

/**
 * Il nome dello strumento su cui una fonte fa atterrare ciò che produce.
 *
 * I due regimi dell'[ADR 0052](../../../../docs/adr/0052-un-guadagno-dichiara-dove-atterra.md)
 * atterrano solo su questi due pool, e questa funzione sceglie un'**etichetta**, non una regola:
 * non decide dove vadano i soldi — lo ha già deciso il regime — dice come si chiama il posto in cui
 * sono andati. Il giorno in cui un terzo strumento entrasse nel gioco, qui cresce una riga e
 * nient'altro si muove.
 */
export const landingKey = (pool: Pool): MessageKey => (pool === 'card' ? 'pool.card' : 'pool.cash')

/**
 * Cosa c'è scritto sul pulsante: **aprire** una fonte chiusa non è la stessa cosa che salire di
 * livello, e il prezzo lo dice — aprire dà tutta la resa base, il livello dopo dà solo
 * l'incremento, quindi aprire costa di più (ADR 0053).
 *
 * Un giocatore che legge «compra» su una fonte che non ha mai avuto non sa cosa sta comprando.
 */
export const ctaKey = (level: number): MessageKey =>
  level === 0 ? 'income.source.open' : 'common.buy'
