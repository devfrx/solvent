# Convenzioni

Regole di forma. Sono noiose di proposito: una convenzione discussa a ogni file non è una
convenzione. Dove è possibile, sono imposte da uno strumento — la colonna "chi la impone" dice
quale.

## Nomi di file

| Cosa                                                        | Forma                      | Esempio                   | Chi la impone       |
| ----------------------------------------------------------- | -------------------------- | ------------------------- | ------------------- |
| Modulo del kernel (esporta un'interfaccia e la sua factory) | `PascalCase.ts`            | `Registry.ts`             | review              |
| Modulo di funzioni pure                                     | `camelCase.ts`             | `rules.ts`                | review              |
| Componente Vue                                              | `PascalCase.vue`           | `BalancePanel.vue`        | `eslint-plugin-vue` |
| Test                                                        | `<unità>.test.ts`          | `ledger.test.ts`          | `vitest.config.ts`  |
| ADR                                                         | `NNNN-slug-in-italiano.md` | `0009-passo-fisso-...md`  | review              |
| Delega                                                      | `DNNN-slug-in-italiano.md` | `D006-kernel-registry.md` | review              |

Un solo `index.ts` che riesporta è ammesso in tutto il progetto: `core/kernel/index.ts`. Ogni
altro barrel è vietato — nascondono le dipendenze reali e rendono inutile ogni regola di import.

## Nomi di identificatori

| Cosa                       | Forma                            | Esempio                           |
| -------------------------- | -------------------------------- | --------------------------------- |
| Tipo, interfaccia          | `PascalCase`, senza prefisso `I` | `SystemContext`                   |
| Costante di configurazione | `SCREAMING_SNAKE`                | `TICKS_PER_SECOND`                |
| Oggetto di costanti        | `SCREAMING_SNAKE` con `as const` | `ORDER`, `BALANCE`, `TARGETS`     |
| `SystemId`                 | minuscolo, puntato se annidato   | `income`, `income.salary`         |
| Chiave i18n                | `dominio.contesto.chiave`        | `income.panel.title`              |
| Chiave di ragione          | `reason.<dominio>.<evento>`      | `reason.income.tick`              |
| Codice di errore           | `error.<dominio>.<causa>`        | `error.ledger.insufficient_funds` |
| Booleano                   | `is` / `has` / `can`             | `isRunning`, `canAfford`          |

I nomi vietati sono nel [glossario](glossario.md#parole-vietate).

## Ordine degli import

Dall'esterno verso l'interno, gruppi separati da una riga vuota, imposto da `import/order`:

1. built-in di Node
2. dipendenze esterne
3. `core/contracts`
4. `core/kernel`
5. `core/balance`
6. `core/domains`
7. renderer (store, componenti, i18n)
8. relativi (`./`)

L'ordine non è estetico: se un file del kernel ha un import del gruppo 6 o 7, la violazione si
vede a colpo d'occhio prima ancora che il lint parli.

## Funzioni pure di dominio

I file `rules.ts` contengono **solo** funzioni pure:

- nessun accesso al contesto, nessun `ctx` fra i parametri
- nessun effetto: non emettono, non scrivono, non leggono l'ora
- tutto ciò che serve arriva per argomento e ritorna nel valore

Chi ha bisogno del contesto è `system.ts`, che orchestra: legge dal contesto, chiama le regole
pure, applica il risultato tramite il Ledger. La separazione è ciò che rende il dominio testabile
con un seed fisso e senza impalcature.

## Test

- Un file di test per unità. `describe` porta il nome dell'unità, `it` una frase che descrive il
  comportamento in italiano: `it('rifiuta un posting che porterebbe il saldo sotto zero')`.
- Niente mock del kernel: il kernel è puro e veloce, si usa quello vero. Se un test ha bisogno di
  un mock del Ledger, il codice sotto test sta facendo troppo.
- Un test che non può fallire non è un test. Prima di considerarlo finito, rompilo di proposito e
  guarda il rosso.

## Commit

Conventional Commits, con lo **scope uguale all'ID della delega**. È la tracciabilità che collega
il git log ai documenti senza sforzo:

    feat(D006): registry con ordine dichiarato e save/load/reset dal tipo
    test(D007): il ledger rifiuta un posting non finito
    docs(D009): ADR 0004 passa da Proposta ad Accettata
    chore(D001): eslint flat config con le regole R01, R03, R05

Tipi ammessi: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`. Nient'altro.

Un commit che tocca più di una delega è un commit da spezzare.

## Un ramo per delega

Nome: `dNNN-slug`. Il ramo si chiude quando la definizione di fatto della delega è verde — non
quando "il codice c'è".

## `eslint-disable`

Non è vietato: vietarlo produce aggiramenti peggiori, tipo riscrivere il codice in una forma che
il lint non riconosce.

È vietato **senza motivazione**. La forma ammessa è una riga, sopra, che dice perché:

    // eslint-disable-next-line no-restricted-properties -- unico punto autorizzato: ADR 0005
    const bits = Math.random()

Un `eslint-disable` senza quella riga è un difetto in review, alla pari di un test rosso.

## Commenti

Si commenta il **perché**, mai il cosa. Un commento che rinomina la riga sotto è rumore che invecchia.

I commenti che valgono sono tre:

- il rimando a una decisione: `// ADR 0009: qui il tempo frazionario resta nell'accumulatore`
- l'avvertimento non ovvio: `// l'ordine conta: il Ledger deve aver già applicato prima che stats legga`
- la spiegazione di una scelta apparentemente strana, che altrimenti qualcuno "correggerebbe"

**Nel codice non esistono `TODO`** (ADR 0014). Ciò che manca sta in
[roadmap-fette.md](roadmap-fette.md), dove si vede senza aprire quel file.
