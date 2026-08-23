import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { BUTTON_SIZES, BUTTON_VARIANTS } from '../../src/renderer/ui/roles'
import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R26 · D038 · ADR 0044 — ciò che si preme passa dal kit.
 *
 * Prima di questa delega i pulsanti del progetto erano **sei**: `UiButton` e cinque `<button>`
 * scritti a mano — il verso del bancomat, le scorciatoie degli importi, le destinazioni della
 * colonna, l'interruttore del tema, l'aggancio dei cheat. Ognuno ripeteva l'azzeramento del
 * pulsante del browser, e **nessuno dei sei aveva un anello di fuoco**: chi girava con il
 * tabulatore riceveva il contorno del motore, che dei due temi non sa niente.
 *
 * È la forma esatta del difetto che l'audit di [D016](../../docs/delega/D016-correzioni-audit.md)
 * trovò con `.refusal` copiata in due pannelli, e la ragione per cui esiste R23: **la stessa cosa
 * invisibile scritta N volte, che diverge senza che nessun gate lo veda.** Qui la divergenza c'era
 * già — due dei sei avevano uno stato al puntatore e quattro no.
 *
 * ## E la seconda metà, che è INV-21
 *
 * **Nessun pulsante si spegne**, e da qui in poi non solo nel kit. Il controllo stava in
 * `ui-kit-is-standalone` e guardava i file di `ui/`; bastava finché un `<button>` poteva esistere
 * altrove senza che nessuno lo sapesse. Adesso ne esiste uno solo, quindi il controllo può guardare
 * **tutti** i componenti — e deve, perché `UiButton` fa ricadere gli attributi del chiamante sul
 * pulsante vero: un `disabled` scritto su `<UiButton>` arriverebbe a destinazione. Quella comodità
 * è ciò che serve a `popovertarget`, e questa riga è il suo prezzo, pagato.
 *
 * ✅ **Esatta**, e non parziale: cerca il tag scritto nel sorgente, che è l'unico modo in cui un
 * pulsante entra in un template. Un elemento creato a runtime le sfuggirebbe, come sfugge a R22 —
 * ma in questo progetto un `.vue` che costruisce un nodo a mano sarebbe un problema più grosso di
 * questo.
 */

/** L'unico file che ha il diritto di scrivere un pulsante. */
const KEEPER = 'src/renderer/ui/UiButton.vue'

/** Il tag, aperto o chiuso. Il confine dopo il nome distingue `<button` da un `<button-ish>`. */
const NATIVE = /<\/?button[\s>/]/g

/** `disabled` o `:disabled` come **attributo**, non la parola dentro un commento o una classe. */
const DISABLES = /(?<=[\s(]):?disabled(?=[\s=>])/g

const normalize = (path: string): string => path.split(sep).join('/')

export const nativeButtonsIn = (source: string): string[] =>
  (withoutComments(source).match(NATIVE) ?? []).map((found) => found.replace(/[\s>/]+$/, ''))

export const disablesIn = (source: string): string[] =>
  (withoutComments(source).match(DISABLES) ?? []).map((found) => found.trim())

const components = sourceFiles('src', ['.vue']).map(normalize)

const others = components.filter((path) => path !== KEEPER)

const keeper = read(KEEPER)

describe('il rilevatore del pulsante', () => {
  it('riconosce il tag scritto a mano, aperto e chiuso', () => {
    expect(nativeButtonsIn('<button type="button" class="turn">')).toEqual(['<button'])
    expect(nativeButtonsIn('</button>')).toEqual(['</button'])
    expect(nativeButtonsIn('<button/>')).toEqual(['<button'])
  })

  it('lascia passare il componente, che è la strada giusta', () => {
    expect(nativeButtonsIn('<UiButton :label="text(`common.buy`)" @press="buy" />')).toEqual([])
  })

  it('e non rende rosso il commento che spiega la regola', () => {
    expect(nativeButtonsIn('// un <button> scritto a mano non ha un anello di fuoco')).toEqual([])
  })
})

describe('il rilevatore dello spegnimento', () => {
  it('trova l’attributo, non la parola', () => {
    expect(disablesIn('<UiButton :disabled="refused" />')).toEqual([':disabled'])
    expect(disablesIn('<button disabled>')).toEqual(['disabled'])
    expect(disablesIn('// un pulsante spento è un rifiuto senza motivo')).toEqual([])
    expect(disablesIn('.muted { opacity: 0.5 }')).toEqual([])
  })
})

describe('ciò che si preme passa dal kit', () => {
  it('e i componenti da guardare esistono', () => {
    expect(others.length).toBeGreaterThan(5)
  })

  it('il file che lo tiene lo tiene davvero', () => {
    // Senza questa riga la regola passerebbe anche il giorno in cui il pulsante sparisce del tutto,
    // che è un modo di essere verdi senza voler dire niente. È la stessa riga di `chart-dress`.
    expect(nativeButtonsIn(keeper).length).toBeGreaterThan(0)
  })

  for (const path of others) {
    it(`${path} non scrive un pulsante`, () => {
      expect(nativeButtonsIn(read(path))).toEqual([])
    })
  }
})

describe('nessun pulsante si spegne, in nessun file', () => {
  for (const path of components) {
    it(`${path} non spegne niente`, () => {
      expect(disablesIn(read(path))).toEqual([])
    })
  }
})

/**
 * La completezza, ed è la parte che invecchia da sola se nessuno la guarda: ogni variante e ogni
 * misura dichiarata in `roles.ts` deve avere la propria regola in `UiButton.vue`. È la stessa forma
 * con cui `ui-kit-is-standalone` confronta i ruoli di colore con `tokens.css` — una lista sola, e
 * un test che la confronta con la realtà invece di sperare che coincidano.
 *
 * Senza, una variante dichiarata e mai dipinta darebbe un pulsante nudo: nessun errore, nessun
 * avviso, e un buco che si vede solo aprendo la schermata che la usa.
 */
describe('ogni variante e ogni misura sono dipinte', () => {
  const styles = keeper.slice(keeper.indexOf('<style'))

  it('le forze', () => {
    expect(BUTTON_VARIANTS.filter((variant) => !styles.includes(`.${variant} {`))).toEqual([])
  })

  it('e le scatole', () => {
    expect(BUTTON_SIZES.filter((size) => !styles.includes(`.${size} {`))).toEqual([])
  })
})
