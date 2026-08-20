import type { SaveApi } from '@core/contracts/save'

import type { Milliseconds } from '@core/kernel/Clock'
import { milliseconds } from '@core/kernel/Clock'

import type { Cancel } from './loop'

/**
 * ADR 0001 — l'**unico** file del progetto che tocca il browser: `window`, `document`,
 * `requestAnimationFrame`, `performance`. Tutto il resto del renderer riceve queste quattro cose
 * per costruzione, e per questo gira in un test `node` senza jsdom e senza impalcature.
 *
 * Il confine non è un vezzo: è ciò che permette di far scorrere il tempo a mano e di chiudere una
 * finestra che non esiste. Se un secondo file inizia a nominare `window`, quella proprietà è
 * finita.
 */

/**
 * L'API che il preload aggancia alla finestra (D009). Il `declare global` è del renderer, ed è
 * questo: sta in un modulo normale e non in un `.d.ts` perché così lo vede anche `typecheck:test`,
 * che include solo `tests/**` e segue gli import.
 */
declare global {
  interface Window {
    readonly solvent: SaveApi
  }
}

export type Unsubscribe = () => void

export interface Host {
  readonly saveApi: SaveApi
  /**
   * L'orologio **monotono** del loop: non torna indietro e non salta quando l'ora di sistema
   * cambia. Continua ad avanzare a finestra nascosta, ed è ciò che rende il ritorno da `Sospeso`
   * un recupero e non un salto di tempo perso.
   */
  readonly now: () => Milliseconds
  /**
   * L'ora del mondo, l'unica confrontabile con il `savedAt` che il main ha scritto. Sono due
   * orologi diversi apposta: questo può saltare, e va usato solo dove serve una **data**.
   */
  readonly wallClock: () => number
  readonly schedule: (run: () => void) => Cancel
  /**
   * La lingua **dichiarata dal documento**, che non è la stessa cosa delle parole tradotte:
   * `lang` è ciò che uno screen reader usa per la pronuncia e il browser per la sillabazione, e
   * vive sull'elemento radice — cioè fuori da Vue, dove nessun componente arriva. Sta qui perché
   * `document` sta qui, e senza sarebbe una lingua scritta a mano in `index.html` che
   * `DEFAULT_LOCALE` non riesce a spostare (R12, difetto A13).
   */
  readonly setLanguage: (locale: string) => void
  readonly onVisibilityChange: (handler: (visible: boolean) => void) => Unsubscribe
  /**
   * La finestra sta per chiudersi, e la chiusura è **annullata** finché il gestore non chiama
   * `close()`. È il tempo che serve a salvare: senza, l'ultima partita di gioco si perde.
   */
  readonly onClosing: (handler: () => void) => Unsubscribe
  readonly close: () => void
}

export const createBrowserHost = (): Host => {
  // Alla seconda `beforeunload` la chiusura deve passare, altrimenti la finestra non si chiude
  // mai: il gestore ha già salvato ed è lui a richiamare `close()`.
  let closing = false

  return {
    saveApi: window.solvent,

    now: () => milliseconds(performance.now()),

    wallClock: () => Date.now(),

    schedule: (run) => {
      const handle = requestAnimationFrame(() => run())
      return () => cancelAnimationFrame(handle)
    },

    setLanguage: (locale) => {
      document.documentElement.lang = locale
    },

    onVisibilityChange: (handler) => {
      const listener = (): void => handler(!document.hidden)
      document.addEventListener('visibilitychange', listener)
      return () => document.removeEventListener('visibilitychange', listener)
    },

    /**
     * In Electron assegnare `returnValue` annulla la chiusura **senza** mostrare il dialogo che
     * un browser mostrerebbe: è il modo documentato di prendersi un momento prima di chiudere, e
     * costa zero canali IPC in più — il preload resta le tre funzioni di INV-16.
     *
     * L'alternativa era una stretta di mano fra main e renderer, cioè due canali nuovi e un
     * invariante da riscrivere, per ottenere la stessa cosa.
     */
    onClosing: (handler) => {
      const listener = (event: BeforeUnloadEvent): void => {
        if (closing) return
        event.returnValue = false
        handler()
      }
      window.addEventListener('beforeunload', listener)
      return () => window.removeEventListener('beforeunload', listener)
    },

    close: () => {
      closing = true
      window.close()
    }
  }
}
