import type { Money } from '@core/contracts/money'

/**
 * Il registro dei modificatori, e l'**unica** formula di composizione del progetto:
 *
 *     (base + Σ add) × Π mult
 *
 * Scritta una volta, in `compose`. Una seconda formula nasce sempre allo stesso modo — un sistema
 * ha "un caso un po' diverso" e se la scrive in casa — e da quel momento i due risultati divergono
 * senza che nessun test se ne accorga, perché entrambi sono plausibili.
 *
 * L'ordine è dichiarato, non emergente: **prima tutti gli `add`, poi tutti i `mult`**, e a parità
 * di tipo per `id` di sorgente. Il primo criterio è quello che conta di più: comporre in ordine di
 * registrazione darebbe `(12 × 2) + 8` invece di `(12 + 8) × 2`, cioè un numero diverso a seconda
 * di com'è scritto il bootstrap. Il secondo protegge dai decimali che si spostano in silenzio
 * quando `Decimal` arrotonda a fine precisione.
 */

/**
 * Il valore su cui i modificatori agiscono, es. `income.all`. È una stringa e non un'unione di id
 * noti per la stessa ragione per cui lo è `SystemId`: un'unione obbligherebbe `balance/` a
 * conoscere i bersagli di ogni dominio, cioè a cambiare ogni volta che un dominio ne aggiunge uno.
 */
export type ModifierTarget = string

/** Due tipi bastano. Un terzo va giustificato, non aggiunto (docs/roadmap-fette.md). */
export type ModifierKind = 'add' | 'mult'

export interface Modifier {
  /** L'`id` della **sorgente**: un upgrade, una skill, un evento. È unico in tutto il registro. */
  readonly id: string
  readonly target: ModifierTarget
  readonly kind: ModifierKind
  readonly value: Money
}

/**
 * Un upgrade comprato due volte che registra due volte è un bug di gioco, non un raddoppio
 * legittimo: chi vuole raddoppiare davvero registra una seconda sorgente, con un `id` suo.
 */
export class DuplicateModifierError extends Error {
  constructor(id: string) {
    super(
      `Modificatore già registrato: '${id}'. Un raddoppio legittimo è una seconda sorgente con ` +
        `un id proprio, non la stessa registrata due volte.`
    )
    this.name = 'DuplicateModifierError'
  }
}

export interface Modifiers {
  readonly register: (modifier: Modifier) => void
  /**
   * Toglie una sorgente. Serve a `reset`: chi ha registrato è anche chi toglie, nel proprio file —
   * mai una lista centralizzata di eccezioni (docs/design/flusso-salvataggio.md). Un `id` che non
   * c'è non è un errore, così azzerare due volte o caricare sopra un reset restano leciti.
   */
  readonly remove: (id: string) => void
  readonly compose: (target: ModifierTarget, base: Money) => Money
  /**
   * Le sorgenti attive su un bersaglio, in ordine di `id`. Esiste dal primo giorno perché è ciò
   * che permette alla UI di rispondere a "perché guadagno tanto" senza reimplementare la formula —
   * e una UI che reimplementa la formula è il secondo posto in cui vive.
   */
  readonly sourcesFor: (target: ModifierTarget) => readonly Modifier[]
}

export const createModifiers = (): Modifiers => {
  // Per `id`, non per bersaglio: l'unicità è globale, quindi il controllo sul duplicato è una
  // lettura sola e `remove` non ha bisogno di sapere su cosa agiva la sorgente.
  const registrati = new Map<string, Modifier>()

  const perId = (a: Modifier, b: Modifier): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)

  const sorgentiDi = (target: ModifierTarget): Modifier[] =>
    [...registrati.values()].filter((sorgente) => sorgente.target === target).sort(perId)

  return {
    register: (modifier) => {
      if (registrati.has(modifier.id)) throw new DuplicateModifierError(modifier.id)
      registrati.set(modifier.id, modifier)
    },

    remove: (id) => {
      registrati.delete(id)
    },

    sourcesFor: sorgentiDi,

    compose: (target, base) => {
      const sorgenti = sorgentiDi(target)
      const sommato = sorgenti
        .filter((sorgente) => sorgente.kind === 'add')
        .reduce((totale, sorgente) => totale.plus(sorgente.value), base)
      return sorgenti
        .filter((sorgente) => sorgente.kind === 'mult')
        .reduce((totale, sorgente) => totale.mul(sorgente.value), sommato)
    }
  }
}
