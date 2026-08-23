import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R27 · D038 · ADR 0045 — ciò che scorre passa dal kit, e la barra si veste in un posto solo.
 *
 * Prima di questa delega le aree che scorrevano erano **sei**, sparse fra il telaio, la finestra,
 * la testata, la colonna e il pannello dei cheat, e la barra di scorrimento non era vestita da
 * nessuna parte: erano quelle del sistema operativo, in un'applicazione che di temi ne ha due
 * scritti a mano. Il vestito non è il motivo per cui questa regola esiste, però — è la parte che si
 * vede.
 *
 * Il motivo è `min-height: 0`. `UiShell` lo scriveva e spiegava perché; `AppNav` no, e la sua
 * colonna scorreva **tutta** — marchio e interruttore del tema compresi — invece di scorrere la
 * sola lista delle destinazioni. Due aree che scorrono scritte da due file, e una delle due
 * sbagliata in un modo che nessun gate poteva vedere: è la forma esatta del difetto di `.refusal`
 * ([D016](../../docs/delega/D016-correzioni-audit.md)) e del vestito dei grafici (R23).
 *
 * ✅ **Esatta** sui valori scritti nel sorgente, e con un confine dichiarato: `overflow: hidden` e
 * `overflow: visible` **passano**, perché non fanno scorrere niente — il primo ritaglia (la carta
 * 3D, la barra della capienza), il secondo disfà un default (il riquadro di `UiPopover`). A entrare
 * nel kit è ciò che scorre, non ciò che taglia.
 *
 * ⚠️ **Un limite, dichiarato:** guarda i valori scritti, non uno stile assemblato a runtime né il
 * CSS di una libreria — lo stesso limite di `no-z-index` e di `no-color-literals`. Prende la forma
 * con cui il difetto è nato davvero, che è quella scritta a mano in un blocco `<style>`.
 */

/** L'unico file che ha il diritto di far scorrere qualcosa, e di vestirne la barra. */
const KEEPER = 'src/renderer/ui/UiScroll.vue'

/** Una dichiarazione di `overflow`, con o senza asse, e il valore che le hanno dato. */
const OVERFLOW = /\boverflow(?:-x|-y|-block|-inline)?\s*:\s*([a-z-]+)/g

/** I valori che fanno scorrere. Gli altri — `hidden`, `visible`, `clip` — non entrano nel kit. */
const SCROLLS = new Set(['auto', 'scroll', 'overlay'])

/**
 * Il vestito: le proprietà standard e i pseudo-elementi storici. `overscroll-behavior` non è qui e
 * non deve esserlo — dice dove lo scorrimento **si ferma**, non che aspetto ha, e vive dove vive lo
 * scorrimento.
 */
const DRESS = /\bscrollbar-(?:width|color|gutter)\s*:|::-webkit-scrollbar/g

const normalize = (path: string): string => path.split(sep).join('/')

export const scrollingIn = (source: string): string[] =>
  [...withoutComments(source).matchAll(OVERFLOW)]
    .filter((match) => SCROLLS.has(match[1] ?? ''))
    .map((match) => match[0])

export const dressIn = (source: string): string[] =>
  (withoutComments(source).match(DRESS) ?? []).map((found) => found.trim())

const sources = [
  ...sourceFiles('src/renderer', ['.ts', '.vue']),
  ...sourceFiles('src/renderer', ['.css'])
]
  .map(normalize)
  .filter((path) => path !== KEEPER)

const keeper = read(KEEPER)

describe('il rilevatore dello scorrimento', () => {
  it('prende ciò che scorre, su qualunque asse', () => {
    expect(scrollingIn('.panel { overflow-y: auto; }')).toEqual(['overflow-y: auto'])
    expect(scrollingIn('.strip { overflow-x: auto; }')).toEqual(['overflow-x: auto'])
    expect(scrollingIn('.box { overflow: scroll; }')).toEqual(['overflow: scroll'])
  })

  it('lascia stare ciò che taglia, che è un’altra cosa', () => {
    expect(scrollingIn('.card { overflow: hidden; }')).toEqual([])
    expect(scrollingIn('.ui-popover { overflow: visible; }')).toEqual([])
  })

  it('e non rende rosso il commento che spiega la regola', () => {
    expect(scrollingIn('/* un antenato con overflow: auto lo taglierebbe */')).toEqual([])
  })
})

describe('il rilevatore del vestito', () => {
  it('riconosce le proprietà standard e i pseudo-elementi storici', () => {
    expect(dressIn('scrollbar-width: thin;')).toEqual(['scrollbar-width:'])
    expect(dressIn('scrollbar-color: red transparent;')).toEqual(['scrollbar-color:'])
    expect(dressIn('.x::-webkit-scrollbar-thumb { background: grey }')).toEqual([
      '::-webkit-scrollbar'
    ])
  })

  it('lascia passare la riga che dice dove lo scorrimento si ferma', () => {
    expect(dressIn('overscroll-behavior: contain;')).toEqual([])
  })
})

describe('ciò che scorre passa dal kit', () => {
  it('e i file da guardare esistono', () => {
    expect(sources.length).toBeGreaterThan(10)
  })

  it('il file che lo tiene lo tiene davvero', () => {
    // Senza queste due righe la regola passerebbe anche il giorno in cui lo scorrimento e il suo
    // vestito spariscono del tutto, che è un modo di essere verdi senza voler dire niente.
    expect(scrollingIn(keeper).length).toBeGreaterThan(0)
    expect(dressIn(keeper).length).toBeGreaterThan(0)
  })

  for (const path of sources) {
    it(`${path} non fa scorrere niente e non veste nessuna barra`, () => {
      expect([...scrollingIn(read(path)), ...dressIn(read(path))]).toEqual([])
    })
  }
})
