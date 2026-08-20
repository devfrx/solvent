import { describe, expect, it } from 'vitest'

import type { SystemId } from '@core/kernel/Registry'

import { createGame } from '../../src/renderer/runtime/createGame'

/**
 * INV-20 · D020 — nessun sistema con stato accetta un salvataggio che non riconosce.
 *
 * **È il primo test di `tests/rules/` che costruisce una partita, ed è una scelta dichiarata.**
 * Gli altri leggono i sorgenti come testo: cercano una forma vietata e la trovano senza eseguire
 * niente. Qui non si può, e non è un incidente — è il tratto di questa regola. La sua versione
 * leggibile dai sorgenti, «ogni `load` contiene un `throw`», sarebbe soddisfatta da tre righe
 * finte; ed è la stessa ragione per cui INV-20 non è un campo di `defineSystem`, che il kernel
 * non deve conoscere: un validatore che ritorna sempre `true` compila benissimo. Un comportamento
 * si prova eseguendolo.
 *
 * Perché nessun altro può farlo: `SystemsSave` è opaco anche per lo schema del main, che conosce
 * la busta e non il motore (ADR 0004), e `loadAll` fa l'unico cast del progetto (ADR 0002). Ne
 * discende che l'unico posto capace di guardare quello stato è il `load` del sistema stesso — e
 * senza questo file niente lo obbliga a guardarlo davvero.
 *
 * ⚠️ **Un limite, dichiarato adesso invece che scoperto dopo:** la spazzatura si sceglie per
 * `typeof`, e `typeof []` è `'object'` come `typeof {}`. Finché i campi salvati sono primitivi la
 * lista esce da sé; il giorno in cui uno stato avrà un campo **array** — il primo `boundedList`
 * che finisce sul disco, che ha un grilletto nel registro YAGNI di `docs/roadmap-fette.md` — `{}`
 * e `null` verranno scartati come «stesso tipo», e quel campo sarà provato peggio degli altri.
 */

/** Fisso: due partite con lo stesso seme sono la stessa partita, e un test non si gioca ai dadi. */
const SEED = 4242

/**
 * Un valore per ogni tipo che `typeof` distingue. Per ogni campo si tengono solo quelli **diversi**
 * dal valore buono: sostituire un booleano con un altro booleano produce uno stato valido, non
 * spazzatura, e pretenderne il rifiuto renderebbe rosso un `load` corretto.
 */
const SPECIMENS: readonly unknown[] = [0, 1.5, 'x', '', true, null, undefined, {}, []]

/** Lo stato intero, quando non è nemmeno della forma giusta. */
const WHOLE_STATE_GARBAGE: readonly unknown[] = [null, undefined, 0, 'x', [], {}]

const otherTypes = (good: unknown): readonly unknown[] =>
  SPECIMENS.filter((specimen) => typeof specimen !== typeof good)

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Cosa c'è da mutare in uno stato salvato, come funzione pura dello stato — nella forma del
 * `verdictOf` di `registry-completeness`, e per la stessa ragione: il caso «nessun campo» oggi non
 * si presenta, perché l'unico sistema con stato ne ha uno. Un `expect(fields.length)` maggiore di
 * zero **fallirebbe** il giorno in cui si presenta, invece di dichiararlo; così invece è coperto
 * prima di esistere.
 */
type Plan =
  | { readonly kind: 'fields'; readonly state: Readonly<Record<string, unknown>> }
  /** Niente da mutare: per questo sistema valgono solo lo stato intero e la controprova. */
  | { readonly kind: 'whole-state-only' }

export const planFor = (state: unknown): Plan =>
  isRecord(state) && Object.keys(state).length > 0
    ? { kind: 'fields', state }
    : { kind: 'whole-state-only' }

/**
 * Gli id si **derivano**, e questa è la riga che tiene in piedi il file: non si «semplifica» in un
 * elenco di stringhe. `loadAll` salta gli id che non conosce, quindi la spazzatura va passata
 * **sotto l'id del sistema** — un id scritto a mano e invecchiato proverebbe un altro sistema o
 * nessuno, e il test diventerebbe rosso pretendendo un fallimento che non può arrivare.
 *
 * `save !== undefined` è la stessa domanda che il Registry si fa al proprio interno: `Stateless`
 * dichiara `save` come `never`, quindi il tipo la riconosce. Esportare `isStateful` da `src/`
 * sarebbe aprire il kernel per comodità di chi lo prova.
 */
const game = createGame(SEED)
const saved = game.registry.saveAll()
const statefulIds: readonly SystemId[] = game.registry
  .systems()
  .filter((system) => system.save !== undefined)
  .map((system) => system.id)

/** Ogni caso parte da una partita pulita: un caricamento rifiutato lascia il gioco a metà strada. */
const rejects = (id: SystemId, state: unknown): void => {
  expect(createGame(SEED).registry.loadAll({ [id]: state })).toMatchObject({
    ok: false,
    error: { code: 'error.registry.load_failed', id }
  })
}

describe('il rilevatore della spazzatura', () => {
  it('sceglie solo valori di tipo diverso da quello buono', () => {
    expect(otherTypes(false)).toEqual([0, 1.5, 'x', '', null, undefined, {}, []])
    expect(otherTypes('x')).toEqual([0, 1.5, true, null, undefined, {}, []])
  })

  it('e il piano distingue uno stato con campi da uno che non ne ha', () => {
    expect(planFor({ upgraded: false })).toEqual({ kind: 'fields', state: { upgraded: false } })
    expect(planFor({})).toEqual({ kind: 'whole-state-only' })
    expect(planFor(0)).toEqual({ kind: 'whole-state-only' })
    expect(planFor(null)).toEqual({ kind: 'whole-state-only' })
    expect(planFor([1])).toEqual({ kind: 'whole-state-only' })
  })
})

describe('nessun sistema con stato si fida del proprio salvataggio', () => {
  it('e almeno uno esiste: senza, questo file sarebbe verde senza aver provato niente', () => {
    expect(statefulIds.length).toBeGreaterThan(0)
  })

  for (const id of statefulIds) {
    const plan = planFor(saved[id])
    const fields = plan.kind === 'fields' ? Object.keys(plan.state) : []

    it(
      plan.kind === 'fields'
        ? `${id} rifiuta un valore di tipo diverso in ognuno dei suoi campi: ${fields.join(', ')}`
        : `${id} salva uno stato senza campi: per lui valgono lo stato intero e la controprova`,
      () => {
        if (plan.kind !== 'fields') return
        for (const field of fields) {
          for (const garbage of otherTypes(plan.state[field])) {
            rejects(id, { ...plan.state, [field]: garbage })
          }
        }
      }
    )

    it(`${id} rifiuta uno stato intero che non riconosce`, () => {
      for (const garbage of WHOLE_STATE_GARBAGE) rejects(id, garbage)
    })
  }

  it('e la controprova: lo stato buono si ricarica intero, senza id ignorati', () => {
    expect(createGame(SEED).registry.loadAll(saved)).toEqual({ ok: true, value: { ignored: [] } })
  })
})
