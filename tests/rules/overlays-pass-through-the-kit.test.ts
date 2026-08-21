import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R22 · D031 · ADR 0032 — il livello superiore passa da `UiPopover`, e da nessun altro posto.
 *
 * **Non è una regola di stile: è la sola forma in cui il difetto di D029 non può ripresentarsi.**
 * Il foglio di stile del motore tiene chiuso un riquadro del livello superiore con `display: none`,
 * e una regola d'autore vince su quella del motore a qualunque specificità — perché arriva da
 * un'origine più forte della cascata. Ne discende che un `display: flex` scritto senza condizione,
 * su un elemento che porta l'attributo `popover`, lo tiene visibile per sempre: il motore chiude e
 * lo schermo non cambia.
 *
 * È esattamente ciò che è successo al pannello dei cheat, e per due stesure la colpa è stata data
 * alla meccanica di apertura — che era giusta tutte e due le volte. La causa è stata letta nella
 * finestra vera durante [D032](../../docs/delega/D032-la-commissione-scala-il-pavimento-no.md):
 * `#dev-panel` era visibile e cliccabile mentre `:popover-open` era **falso**.
 *
 * `UiTooltip` non aveva il difetto, e qui sta la ragione per cui una regola serviva davvero: non lo
 * aveva perché non gli era servito scrivere `display`, cioè **per fortuna**. Due componenti, una
 * riga di differenza, e la differenza non era una decisione di nessuno.
 *
 * Vietare l'attributo altrove non impedisce di scrivere male il CSS — impedisce di **avere in
 * mano** l'elemento su cui quel CSS farebbe danno. È la stessa mossa del Registry contro le cinque
 * liste (ADR 0002): non si controlla che due cose coincidano, si fa in modo che ce ne sia una sola.
 *
 * ⚠️ **Un limite, dichiarato** (docs/tracciabilita.md): guarda l'attributo scritto nel sorgente.
 * Un `popover` messo a runtime con `setAttribute`, o un `showPopover()` chiamato su un elemento
 * trovato nel documento, le sfuggono — come a R17 sfugge un `title` messo a runtime. Prende la
 * forma con cui il difetto nasce davvero, che è quella comoda: si scrive `popover` nel template.
 */

const normalize = (path: string): string => path.split(sep).join('/')

/** L'unico file autorizzato ad avere in mano un elemento del livello superiore. */
const KEEPER = 'src/renderer/ui/UiPopover.vue'

/**
 * L'attributo `popover` fra gli attributi di un tag, non una parola dentro un valore né un nome di
 * proprietà. `popovertarget` **non** conta: è ciò che un pulsante mette su di sé per comandare un
 * riquadro altrui, e resta legittimo ovunque — è anzi la forma che si vuole incoraggiare.
 *
 * Il confine finale `(?![\w-])` è ciò che separa `popover` da `popovertarget`: senza, la regola
 * vieterebbe proprio il modo corretto di aprire un riquadro dal proprio pulsante.
 */
const POPOVER_ATTRIBUTE = /(?:^|\s)(?::|v-bind:)?popover(?![\w-])/

const components = sourceFiles('src', ['.vue']).map(normalize)

const usesPopover = (path: string): boolean => POPOVER_ATTRIBUTE.test(withoutComments(read(path)))

describe('il rilevatore', () => {
  it('prende l’attributo, comunque sia scritto', () => {
    // Il caso di prova della regola stessa: senza, «nessuno lo scrive» sarebbe vero anche se
    // l'espressione non trovasse niente — è il modo in cui il primo caso di prova per R04 è
    // risultato sbagliato pur sembrando funzionante.
    expect(POPOVER_ATTRIBUTE.test('<div id="x" popover class="p">')).toBe(true)
    expect(POPOVER_ATTRIBUTE.test('<span popover>')).toBe(true)
    expect(POPOVER_ATTRIBUTE.test('<div :popover="mode">')).toBe(true)
  })

  it('e lascia passare `popovertarget`, che è il modo corretto di aprirne uno', () => {
    expect(POPOVER_ATTRIBUTE.test('<button popovertarget="dev-panel">')).toBe(false)
    expect(POPOVER_ATTRIBUTE.test('<button :popovertarget="popovertarget">')).toBe(false)
  })

  it('e non si fa ingannare da una parola dentro un valore o da un nome di componente', () => {
    expect(POPOVER_ATTRIBUTE.test('<UiPopover side="top">')).toBe(false)
    expect(POPOVER_ATTRIBUTE.test('<div class="popover-anchor">')).toBe(false)
  })
})

describe('una sovrapposizione passa dal kit', () => {
  it('c’è qualcosa da guardare, e comprende i due componenti che la usano', () => {
    expect(components.length).toBeGreaterThan(0)
    expect(components).toContain(KEEPER)
    expect(components).toContain('src/renderer/ui/UiTooltip.vue')
    expect(components).toContain('src/renderer/components/dev/DevPanel.vue')
  })

  it('e l’attributo `popover` vive in un file solo', () => {
    expect(components.filter(usesPopover)).toEqual([KEEPER])
  })
})
