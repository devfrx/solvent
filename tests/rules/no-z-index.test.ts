import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R21 · ADR 0032 · ADR 0037 — nessun `z-index` in tutto `src/`.
 *
 * L'ADR 0032 aveva già dichiarato la cosa, e in prosa: _«la prima riga di `z-index` scritta in
 * `ui/` sarà il segnale che qualcuno ha aggirato questa decisione»_. Un segnale che nessuno guarda
 * non è un segnale — è il caso che [D022](../../docs/delega/D022-il-confine-disegnato-e-il-confine-vero.md)
 * ha già trattato una volta, con le regole che vivevano solo nel testo.
 *
 * **Il divieto è un aiuto, non un dogma.** Una scala di `z-index` non è cattiva perché è brutta: è
 * cattiva perché ogni numero ha senso solo rispetto agli altri, quindi il quarto non si può
 * scegliere senza rileggere i primi tre — e mesi dopo nessuno li rilegge. Vietarlo costringe a
 * rispondere alla domanda vera, che è **perché** due cose si contendono lo stesso spazio. Finora la
 * risposta è stata due volte diversa e nessuna volta un numero: ciò che deve stare sopra tutto va
 * nel livello superiore (ADR 0032), e ciò che non deve uscire dalla propria area scorre dentro di
 * essa (ADR 0037).
 *
 * ⚠️ **Un limite, dichiarato:** guarda il **sorgente** di `src/`, quindi non vede il CSS che una
 * libreria porta con sé. ApexCharts ne scrive del proprio, ed è la stessa classe di buco per cui
 * R17 si è incrinata ([ADR 0034](../../docs/adr/0034-il-grafico-e-una-libreria.md)). Una regola
 * che vale sul codice nostro e non su quello di terzi è comunque una regola: dice dove **noi** non
 * possiamo andare.
 */

const normalize = (path: string): string => path.split(sep).join('/')

/** `z-index`, con o senza spazi attorno ai due punti. Nei commenti si può nominare: R21 lo fa. */
const Z_INDEX = /\bz-index\s*:/

const sources = sourceFiles('src', ['.ts', '.vue', '.css']).map(normalize)

const writesAZIndex = (path: string): boolean => Z_INDEX.test(withoutComments(read(path)))

describe('nessuno scrive un z-index', () => {
  it('c’è qualcosa da guardare, e comprende il CSS del kit', () => {
    expect(sources.length).toBeGreaterThan(0)
    expect(sources).toContain('src/renderer/ui/tokens.css')
    expect(sources).toContain('src/renderer/ui/UiShell.vue')
  })

  it('in nessun file di `src/`', () => {
    expect(sources.filter(writesAZIndex)).toEqual([])
  })

  it('e la regola vede davvero un `z-index`, comunque sia scritto', () => {
    // Il caso di prova della regola stessa: senza, «nessun file lo scrive» sarebbe vero anche se
    // l'espressione non trovasse niente — è il modo in cui il primo caso di prova per R04 è
    // risultato sbagliato pur sembrando funzionante.
    expect(Z_INDEX.test('z-index: 20;')).toBe(true)
    expect(Z_INDEX.test('  z-index : 1')).toBe(true)
    expect(Z_INDEX.test('zIndex: 20')).toBe(false)
  })
})
