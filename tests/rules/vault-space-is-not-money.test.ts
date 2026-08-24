import { sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * INV-26 · [D042](../../docs/delega/D042-il-caveau-ha-uno-spazio-e-una-scala.md) ·
 * [ADR 0051](../../docs/adr/0051-lo-spazio-di-un-caveau-non-e-una-somma-di-denaro.md) — **un
 * ingombro non è un importo**, e la conversione fra i due ha **un punto solo**.
 *
 * Metà del meccanismo è il tipo: `Space` è un `Money` con un marchio in più, quindi il compilatore
 * rifiuta un `Money` dove serve uno `Space`. È il verso in cui l'errore capita — qualcuno che
 * sottrae un valore in euro da un ingombro — ed è quello che conta.
 *
 * ⚠️ **L'altro verso il tipo non lo vede**, ed è lo stesso limite che `Ticks` ha rispetto a
 * `number`: uno `Space` passa dove serve un `Money`, perché lo **è**. Ne discende che il
 * compilatore non fermerebbe un secondo posto che moltiplica un ingombro per la densità dei
 * contanti — e due conversioni sono due risposte alla domanda «quanti contanti ci stanno», cioè
 * precisamente la forma che INV-18 esiste per non avere.
 *
 * Quel verso lo guarda questo test, e con il rilevatore più semplice che ci sia: la densità ha un
 * nome, e quel nome si scrive in un file solo. Chi vuole convertire deve nominarla.
 *
 * **Non è una regola di lint travestita.** `no-restricted-imports` non servirebbe: `BALANCE` è già
 * importato ovunque legittimamente, ed è **una sua chiave** a non dover uscire dal caveau.
 */

const DENSITY = 'CASH_PER_SPACE'

/** L'unico file autorizzato a nominarla: è lì che la conversione vive. */
const OWNER = ['src', 'core', 'domains', 'vault', 'rules.ts'].join(sep)

/**
 * Anche `balance/constants.ts`, che la **dichiara**. Dichiarare non è convertire, e una costante
 * che non potesse comparire nel file che la definisce non potrebbe esistere.
 */
const DECLARATION = ['src', 'core', 'balance', 'constants.ts'].join(sep)

const namesTheDensity = (path: string): boolean =>
  withoutComments(read(path)).includes(DENSITY) &&
  !path.endsWith(OWNER) &&
  !path.endsWith(DECLARATION)

describe('la densità dei contanti si nomina in un posto solo', () => {
  it('c’è da guardare, altrimenti questo test non guarda niente', () => {
    expect(sourceFiles('src').length).toBeGreaterThan(50)
    expect(read(OWNER)).toContain(DENSITY)
  })

  it('e nessun altro file di src/ la nomina', () => {
    // Un secondo posto che moltiplica un ingombro per questa costante è una seconda risposta a
    // «quanti contanti ci stanno», e le due divergerebbero il giorno in cui il caveau conterrà
    // anche oggetti — perché solo una delle due sottrarrebbe il loro ingombro.
    expect(sourceFiles('src').filter(namesTheDensity)).toEqual([])
  })
})
