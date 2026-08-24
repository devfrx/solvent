import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { importsOf, read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R24 · D036 · ADR 0042 — la scelta di **con cosa si paga** passa da un pezzo solo.
 *
 * Il difetto che questa regola chiude è **già successo due volte nello stesso modo**. L'
 * [ADR 0027](../../docs/adr/0027-il-listino-e-dell-azione-la-scelta-del-giocatore.md) elencava fra
 * le proprie conseguenze il componente che disegna la scelta, e nessuno l'ha costruito: al suo
 * posto `IncomePanel` e `VaultPanel` hanno fatto ciascuno un ciclo sul listino con un pulsante per
 * strumento, e la funzione che etichetta la voce era scritta identica in tutti e due — con il
 * commento della seconda che lo dichiarava, «è la stessa funzione di `IncomePanel`».
 *
 * Nessun gate poteva vederlo, perché non c'era una regola da rompere. E il terzo listino non è
 * immaginato: è la fetta 03, dove ogni oggetto comprato è un'azione che si paga.
 *
 * È la mossa del Registry contro le cinque liste ([ADR 0002](../../docs/adr/0002-registry-unica-lista-di-sistemi.md)),
 * di R22 sul livello superiore e di R23 sul vestito dei grafici: non si controlla che due disegni
 * coincidano, si fa in modo che ce ne sia **uno**.
 *
 * ## Due rilevatori, perché la fila si può ricostruire in due modi
 *
 * Il primo guarda chi ha in mano il **vocabolario**: `PaymentOption` e `PriceList` non entrano in
 * un `.vue` che non sia del flusso. Il secondo guarda chi **cicla su un listino** senza nominarne
 * il tipo — che in un template di Vue si può, perché un template non è tipizzato.
 *
 * ⚠️ **Un limite, dichiarato** (docs/tracciabilita.md): il secondo rilevatore riconosce un listino
 * dal nome della sorgente del ciclo. Un `v-for` su un selettore chiamato in un altro modo gli
 * sfugge, come a `no-literal-in-template` sfugge un attributo. Prende le due forme con cui il
 * difetto è nato davvero — l'import del tipo e il ciclo su `…Prices` — perché sono quelle comode.
 *
 * **Passare il listino a `PaymentDialog` resta legittimo, ed è il punto.** Un pannello scrive
 * `:prices="expansionPrices"` senza nominare un tipo e senza ciclare: consegna, non disegna.
 */

const FLOW = 'src/renderer/components/payment/'

/** Il vocabolario del pagamento: chi lo importa in un `.vue` sta per disegnare una scelta. */
const VOCABULARY = ['PaymentOption', 'PriceList']

const PAYMENT_MODULE = '@core/contracts/payment'

const normalize = (path: string): string => path.split(sep).join('/')

/**
 * Un `v-for` sul listino, comunque sia scritto l'alias: `option of prices`, `each in
 * store.expansionPrices`, `o of upgradePrices`. A riconoscerlo è il **nome della sorgente**, che
 * finisce per `prices` o `Prices` — è così che si chiamano i tre selettori che esistono.
 *
 * Non nomina gli apici, e non è una semplificazione: una classe di caratteri con un apice dentro un
 * `/regex/` letterale manda fuori fase la scansione di `tests/rules/english-identifiers`, che lo
 * dichiara fra i propri limiti. `[^>]*` dice la stessa cosa — dentro un tag — senza scriverli.
 */
const LOOP_ON_PRICES = /v-for=[^>]*\b(?:of|in)\s+[\w.]*[Pp]rices\b/

export const vocabularyIn = (source: string): string[] => {
  const clean = withoutComments(source)
  if (!importsOf(clean).includes(PAYMENT_MODULE)) return []
  return VOCABULARY.filter((word) => new RegExp(`\\b${word}\\b`).test(clean))
}

export const loopsOnPrices = (source: string): boolean =>
  LOOP_ON_PRICES.test(withoutComments(source))

const components = sourceFiles('src', ['.vue']).map(normalize)

const outsideFlow = components.filter((path) => !path.startsWith(FLOW))

describe('i due rilevatori', () => {
  it('prendono il vocabolario del pagamento, importato in qualunque forma', () => {
    // Il caso di prova della regola stessa: senza, «nessuno lo importa» sarebbe vero anche se
    // l'espressione non trovasse niente — è il modo in cui il primo caso di prova per R04 è
    // risultato sbagliato pur sembrando funzionante.
    expect(vocabularyIn("import type { PaymentOption } from '@core/contracts/payment'")).toEqual([
      'PaymentOption'
    ])
    expect(
      vocabularyIn("import type { PaymentOption, PriceList } from '@core/contracts/payment'")
    ).toEqual(['PaymentOption', 'PriceList'])
  })

  it('e non si fanno ingannare da una parola che non viene da lì', () => {
    expect(vocabularyIn("import type { Pool } from '@core/contracts/pools'")).toEqual([])
    expect(vocabularyIn('const priceList = 3')).toEqual([])
  })

  it('prendono un ciclo su un listino, con qualunque alias', () => {
    expect(loopsOnPrices('<div v-for="option of prices" :key="option.pool">')).toBe(true)
    expect(loopsOnPrices('<div v-for="each in store.expansionPrices">')).toBe(true)
    expect(loopsOnPrices('<li v-for="o of upgradePrices" :key="o.pool">')).toBe(true)
  })

  it('e lasciano passare chi il listino lo consegna invece di disegnarlo', () => {
    expect(loopsOnPrices('<PaymentDialog :prices="expansionPrices" />')).toBe(false)
    expect(loopsOnPrices('<div v-for="candle of cashCandles">')).toBe(false)
  })
})

describe('la scelta di uno strumento passa da un pezzo solo', () => {
  it('c’è qualcosa da guardare, e comprende i due pannelli che pagano', () => {
    expect(outsideFlow.length).toBeGreaterThan(0)
    expect(outsideFlow).toContain('src/renderer/components/income/IncomeSourcePanel.vue')
    expect(outsideFlow).toContain('src/renderer/components/vault/VaultPanel.vue')
    expect(components).toContain(`${FLOW}PaymentDialog.vue`)
  })

  it('e fuori dal flusso nessun componente nomina un’opzione di pagamento', () => {
    const offenders = outsideFlow.filter((path) => vocabularyIn(read(path)).length > 0)

    expect(offenders).toEqual([])
  })

  it('e fuori dal flusso nessun componente cicla su un listino', () => {
    const offenders = outsideFlow.filter((path) => loopsOnPrices(read(path)))

    expect(offenders).toEqual([])
  })
})
