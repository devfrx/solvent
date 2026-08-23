import { readdirSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'

import { describe, expect, it } from 'vitest'

import { read, sourceFiles, withoutComments } from '../helpers/sources'

/**
 * R18 · ADR 0033 — un dominio ha la sua cartella sotto `components/`, e la sua interfaccia sta lì.
 *
 * Il difetto che questa regola chiude è **già successo**: [D017](../../docs/delega/D017-il-caveau.md)
 * ha costruito il caveau e la sua interfaccia è finita dentro `CashPanel.vue`, insieme al saldo dei
 * contanti. Non c'è stata nessuna decisione — il caveau tocca i contanti, i contanti avevano già un
 * pannello, e il pannello è cresciuto. Nessun gate poteva vederlo, perché non c'era una regola da
 * rompere.
 *
 * Quattro verifiche, e ognuna prende una forma diversa dello stesso difetto:
 *
 * 1. un file **sciolto** sotto `components/` non appartiene a nessuno, ed è da lì che si comincia a
 *    metterci dentro cose di due domini;
 * 2. una sottocartella che **non è** un dominio né una della lista dichiarata è una categoria
 *    inventata di passaggio — allungare la lista è una riga che si vede nel diff;
 * 3. un dominio che **non dice** dove si guarda non ha dimenticato: non ha risposto. `null` è una
 *    risposta, e `calendar` ([ADR 0023](../../docs/adr/0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md))
 *    la userà;
 * 4. un dominio con una destinazione ma **senza cartella** dà al giocatore una pagina vuota.
 *
 * **Non è parziale.** Legge le cartelle vere sul disco da tutti e due i lati e non indovina niente
 * da un nome: l'unica dichiarazione è la lista delle due cartelle che non sono domini, e toglierle
 * il senso vorrebbe dire allungarla, non aggirarla.
 */

const DOMAINS_ROOT = 'src/core/domains'
const COMPONENTS_ROOT = 'src/renderer/components'
const SCREENS = 'src/renderer/components/shell/screens.ts'

/**
 * Le cartelle di `components/` che non appartengono a un dominio. È una lista **chiusa**, e ogni
 * voce dice di chi è la roba che contiene.
 *
 * Non si chiamano `common` né `shared` — sono due delle parole che C09 vieta, e le vieta per la
 * ragione che si vedrebbe proprio qui: una cartella il cui nome non dice di chi è la roba raccoglie
 * tutto ciò che nessuno ha voglia di collocare.
 *
 * `dev` è la terza, da [D029](../../docs/delega/D029-i-devcheat.md), e non è un'eccezione alla
 * regola: contiene interfaccia che **non è gioco**, quindi non ha un dominio a cui appartenere né
 * una destinazione in cui vivere. Il giorno in cui ci finisse dentro un pannello che mostra un
 * numero del gioco, quel pannello sarebbe nel posto sbagliato.
 *
 * `payment` è la quarta, da [D036](../../docs/delega/D036-il-pagamento-e-un-flusso-solo.md), e sta
 * accanto a `ledger` per la stessa ragione: è un concetto **trasversale** con il proprio vocabolario
 * in `contracts/` — `PaymentOption` e `PriceList` — che non è di nessun dominio e non ha una
 * destinazione. Ogni azione che si paga lo attraversa, e R24 impedisce che qualcuna se lo ridisegni
 * in casa. Il giorno in cui ci finisse dentro il pannello di un dominio, sarebbe nel posto sbagliato.
 */
const NOT_DOMAINS: readonly string[] = ['shell', 'ledger', 'dev', 'payment']

const normalize = (path: string): string => path.split(sep).join('/')

/** I nomi delle sottocartelle immediate di una cartella. `[]` se la cartella non esiste. */
const foldersIn = (root: string): string[] => {
  try {
    return readdirSync(root).filter((entry) => statSync(join(root, entry)).isDirectory())
  } catch {
    return []
  }
}

/**
 * A quale cartella appartiene un file, dato il suo percorso sotto `components/`. `null` significa
 * **sciolto**: sta direttamente nella radice, e non è di nessuno.
 */
export const bucketOf = (path: string): string | null => {
  const rest = normalize(path).replace(`${COMPONENTS_ROOT}/`, '')
  const parts = rest.split('/')
  return parts.length > 1 ? (parts[0] ?? null) : null
}

/**
 * Le voci di `DOMAIN_SCREENS`, lette dal sorgente come `registry-completeness` legge le
 * registrazioni del bootstrap: il confronto è fra due cose vere, non fra una dichiarazione e se
 * stessa.
 *
 * Il valore si cattura insieme al nome perché la verifica 4 ha bisogno di distinguere una
 * destinazione da un `null`, e due letture separate dello stesso blocco sono due occasioni di
 * divergere.
 */
export const declaredScreens = (source: string): readonly (readonly [string, string])[] => {
  const block = /DOMAIN_SCREENS[^=]*=\s*\{([\s\S]*?)^\}/m.exec(withoutComments(source))?.[1] ?? ''
  const entry = /^\s+(\w+)\s*:\s*(null|'[\w.]+')/gm
  return [...block.matchAll(entry)].map((match) => [match[1] ?? '', match[2] ?? ''] as const)
}

const domains = foldersIn(DOMAINS_ROOT)
const buckets = foldersIn(COMPONENTS_ROOT)
const files = sourceFiles(COMPONENTS_ROOT).map(normalize)
const declared = declaredScreens(read(SCREENS))

describe('il rilevatore', () => {
  it('riconosce un file sciolto dalla radice, e uno che sta in una cartella', () => {
    expect(bucketOf('src/renderer/components/CashPanel.vue')).toBeNull()
    expect(bucketOf('src/renderer/components/atm/CashPanel.vue')).toBe('atm')
    expect(bucketOf('src/renderer/components/atm/card/Face.vue')).toBe('atm')
  })

  it('legge le voci di DOMAIN_SCREENS con il loro valore', () => {
    const source = [
      'export const DOMAIN_SCREENS: Readonly<Record<string, Screen | null>> = {',
      "  atm: 'atm',",
      '  calendar: null',
      '}',
      ''
    ].join('\n')

    expect(declaredScreens(source)).toEqual([
      ['atm', "'atm'"],
      ['calendar', 'null']
    ])
  })

  it('non legge un dominio nominato in un commento', () => {
    const source = [
      '/** Qui vault: non è una voce. */',
      'export const DOMAIN_SCREENS: Readonly<Record<string, Screen | null>> = {',
      "  atm: 'atm'",
      '}',
      ''
    ].join('\n')

    expect(declaredScreens(source).map(([name]) => name)).toEqual(['atm'])
  })
})

describe('l’interfaccia di un dominio sta nella cartella del dominio', () => {
  it('ci sono dei domini e delle cartelle, altrimenti questo test non guarda niente', () => {
    expect(domains.length).toBeGreaterThan(0)
    expect(files.length).toBeGreaterThan(0)
  })

  it('nessun file sta sciolto nella radice di components/', () => {
    expect(files.filter((path) => bucketOf(path) === null)).toEqual([])
  })

  it('ogni cartella di components/ è un dominio, o una delle due dichiarate', () => {
    const known = [...domains, ...NOT_DOMAINS]
    expect(buckets.filter((name) => !known.includes(name))).toEqual([])
  })

  it('ogni dominio dice dove si guarda, anche quando la risposta è null', () => {
    const named = declared.map(([name]) => name)
    expect(domains.filter((name) => !named.includes(name))).toEqual([])
  })

  it('un dominio con una destinazione ha la sua cartella', () => {
    const withScreen = declared.filter(([, screen]) => screen !== 'null').map(([name]) => name)
    expect(withScreen.filter((name) => !buckets.includes(name))).toEqual([])
  })
})
