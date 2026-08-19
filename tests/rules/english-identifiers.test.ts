import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles } from '../helpers/sources'

/**
 * C08 — gli identificatori sono in inglese; la prosa resta in italiano.
 *
 * Fino al 2026-08-19 la lingua del codice non era decisa: i tipi e l'API pubblica erano in
 * inglese, le variabili locali e qualche costante in italiano, e nessun documento diceva quale
 * fosse la regola. Una convenzione che nessuno ha deciso è la forma in cui il debito entra senza
 * che nessuno se ne accorga: ogni file successivo sceglie da solo, e alla fine il repo ha due
 * lingue invece di una.
 *
 * Questo controllo è **⚠️ parziale, e lo dichiara**: è una lista di parole italiane comuni, non un
 * dizionario. Prende il caso normale — chi scrive `saldo`, `importo`, `valore` — e non prende una
 * parola italiana che non sia in elenco. Quando la review ne trova una, si aggiunge qui: è così
 * che la lista cresce, ed è il motivo per cui esiste invece di una riga in `convenzioni.md`.
 *
 * Cosa **non** guarda, di proposito: commenti, stringhe e descrizioni dei test. Lì l'italiano è la
 * regola, non l'eccezione.
 */

/**
 * Parole italiane che non devono comparire dentro un identificatore. Non ci sono parole ambigue
 * fra le due lingue (`data`, `zero`, `modulo`) né parole troppo corte per non dare falsi
 * positivi (`per`, `con`, `di`): una lista che grida al lupo viene disattivata, e allora non
 * protegge più niente.
 */
const ITALIAN_WORDS = new Set([
  'altrui',
  'ammesse',
  'ammesso',
  'ancora',
  'ancore',
  'attuale',
  'avanzo',
  'banco',
  'bersaglio',
  'caricato',
  'caricati',
  'catena',
  'chiave',
  'chiavi',
  'codice',
  'collegamento',
  'collegamenti',
  'colpevoli',
  'commissione',
  'conteggio',
  'contatore',
  'conto',
  'conti',
  'cursore',
  'cursori',
  'definizione',
  'definizioni',
  'denaro',
  'documento',
  'documenti',
  'dominio',
  'durata',
  'elemento',
  'elenco',
  'errore',
  'errori',
  'esito',
  'esiti',
  'giocatore',
  'giro',
  'grandezza',
  'importo',
  'importi',
  'indice',
  'iscritti',
  'iscrizione',
  'lista',
  'liste',
  'marcatore',
  'messaggio',
  'motivazione',
  'motivo',
  'nome',
  'nomi',
  'normalizza',
  'numero',
  'oggetto',
  'percorso',
  'prima',
  'primo',
  'profondita',
  'quanti',
  'quante',
  'ragione',
  'registrati',
  'registrato',
  'registrazione',
  'registrazioni',
  'recupero',
  'riga',
  'righe',
  'risultato',
  'saldo',
  'saldi',
  'salvato',
  'sbilancio',
  'scelta',
  'secondo',
  'seme',
  'semi',
  'sistema',
  'sistemi',
  'somma',
  'sorgente',
  'sorgenti',
  'stato',
  'testo',
  'titolo',
  'totale',
  'transazione',
  'trattenuta',
  'trovato',
  'trovate',
  'utente',
  'valore',
  'valori',
  'verifica',
  'vietati',
  'vietate',
  'voce',
  'voci'
])

/**
 * Toglie commenti e stringhe **in una passata sola**, con i cinque casi in alternativa: vince chi
 * comincia prima. Farlo in due passate non funziona, e non per pignoleria — le due sequenze
 * sbagliano in modi opposti e reali, entrambi visti in questo repo:
 *
 * - prima i commenti: una stringa che contiene `https://…` viene tagliata a metà dal `//`, e da
 *   lì in poi tutto il file è disallineato;
 * - prima le stringhe: un `l'href` dentro un commento apre una stringa che non esiste, e la
 *   parola dopo la finta chiusura diventa un identificatore che non è mai stato scritto.
 *
 * Limiti dichiarati: sparisce anche ciò che sta dentro `${…}`, e un'espressione regolare che
 * contiene apici o `//` può confondere la scansione. Sono rumore, non falsi positivi: producono
 * frammenti senza parole italiane.
 */
const NOISE =
  /\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\.|\$\{[^}]*\}|[^\\`])*`|'(?:\\.|[^\\'])*'|"(?:\\.|[^\\"])*"/g

const codeOnly = (source: string): string => source.replace(NOISE, ' ')

const IDENTIFIER = /[A-Za-z_$][A-Za-z0-9_$]*/g

/** `semeCorrente` → `seme`, `corrente`. `POOL_IDS` → `pool`, `ids`. */
const wordsOf = (identifier: string): string[] =>
  identifier
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_$]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word !== '')

const italianIn = (code: string): string[] => {
  const found = new Set<string>()
  for (const identifier of codeOnly(code).match(IDENTIFIER) ?? []) {
    for (const word of wordsOf(identifier)) {
      if (ITALIAN_WORDS.has(word)) found.add(identifier)
    }
  }
  return [...found]
}

const normalize = (path: string): string => path.split(sep).join('/')

const HERE = 'tests/rules/english-identifiers.test.ts'

const sources = [...sourceFiles('src'), ...sourceFiles('tests')]
  .map(normalize)
  .filter((path) => path !== HERE)

describe('il rilevatore', () => {
  it('prende una parola italiana usata come identificatore', () => {
    expect(italianIn('const saldo = 1')).toEqual(['saldo'])
    expect(italianIn('let semeCorrente = 0')).toEqual(['semeCorrente'])
    expect(italianIn('const ORE_DI_RECUPERO = 8')).toEqual(['ORE_DI_RECUPERO'])
  })

  it('non guarda i commenti', () => {
    expect(italianIn('// il saldo non si tocca\nconst balance = 1')).toEqual([])
    expect(italianIn('/** lo stato del sistema */\nconst state = 1')).toEqual([])
  })

  it('non guarda le stringhe', () => {
    expect(italianIn(`const message = 'il saldo non basta'`)).toEqual([])
    expect(italianIn('const message = `transazione non bilanciata`')).toEqual([])
    expect(italianIn(`it('registrare due volte lo stesso id lancia', () => {})`)).toEqual([])
  })

  it('le due trappole della passata unica', () => {
    // Un `//` dentro una stringa non è l'inizio di un commento.
    expect(italianIn(`const link = 'vedi https://x.dev' \nconst titolo = 1`)).toEqual(['titolo'])
    // Un apostrofo dentro un commento non è l'inizio di una stringa.
    expect(italianIn("/** l'href è solo un'ancora */\nconst anchor = 1")).toEqual([])
  })

  it('non grida al lupo sull inglese del progetto', () => {
    expect(italianIn('const perSecondToPerTick = 1')).toEqual([])
    expect(italianIn('export const POOL_IDS = []')).toEqual([])
    expect(italianIn('const totalOfAccounts = (ledger) => ledger')).toEqual([])
  })
})

describe('gli identificatori del progetto sono in inglese', () => {
  it('ci sono dei file da guardare, altrimenti questo test non guarda niente', () => {
    expect(sources.length).toBeGreaterThan(30)
  })

  it('in src/ e tests/ non ce n’è nemmeno uno in italiano', () => {
    const offenders = sources.flatMap((file) =>
      italianIn(read(file)).map((identifier) => `${file}: ${identifier}`)
    )

    expect(offenders).toEqual([])
  })
})
