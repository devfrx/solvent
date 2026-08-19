/**
 * I nomi dei tre canali IPC. Un file senza un solo import, e non per caso.
 *
 * Gli stessi tre nomi servono al preload, e il preload gira in **sandbox**: può caricare
 * `electron` e ciò che il bundler gli mette dentro, non un pacchetto esterno. Se i nomi
 * abitassero in `ipc.ts` — che importa `zod` — importarli da lì trascinerebbe `zod` nel preload.
 * Scriverli due volte è l'altra alternativa, ed è quella che si disallinea in silenzio: due
 * costanti che devono coincidere e nessuno che lo verifichi.
 */
export const SAVE_CHANNELS = {
  save: 'solvent.save',
  load: 'solvent.load',
  reset: 'solvent.reset'
} as const

/** La chiave con cui il preload aggancia l'API alla finestra: `window.solvent`. */
export const SAVE_API_KEY = 'solvent'
