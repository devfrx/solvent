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

**Nessun barrel, mai** (C10). Un file che si limita a ri-esportare nasconde le dipendenze reali:
da `import { x } from '@core/kernel'` non si vede quale modulo si sta tirando dentro, e con esso
sparisce metà del valore di `import-x/order` e delle `no-restricted-imports` che governano i
confini. A imporlo è `tests/rules/no-barrel`, che guarda **cosa c'è dentro** e non come si chiama
il file: `index.ts` resta un nome legittimo per un punto d'ingresso con del contenuto vero —
`main/index.ts`, `preload/index.ts` e `i18n/index.ts` lo sono.

Fino a [D016](delega/D016-correzioni-audit.md) questa riga concedeva un'eccezione,
`core/kernel/index.ts`, che **non è mai esistita**: un permesso che puntava al vuoto, e che
chiunque avrebbe potuto riempire per allinearsi al documento. La regola senza eccezioni è più
forte, ed è anche l'unica meccanizzabile.

## La lingua del codice

**Gli identificatori sono in inglese. La prosa resta in italiano.**

| Cosa                                                                                                   | Lingua       |
| ------------------------------------------------------------------------------------------------------ | ------------ |
| Variabili, parametri, funzioni, tipi, costanti, proprietà, chiavi di oggetto, `SystemId`, nomi di file | **inglese**  |
| Commenti, documenti, messaggi degli errori lanciati, descrizioni dei test (`describe` / `it`)          | **italiano** |

Fino al 2026-08-19 questa regola non esisteva, e il risultato era prevedibile: tipi e API pubblica
in inglese, variabili locali e qualche costante in italiano, due identificatori con l'accento
(`quantità`, `profondità`). Nessuno aveva scelto — e una convenzione che nessuno ha scelto è il
modo in cui il debito entra senza fare rumore, perché ogni file nuovo decide da capo.

Perché questa divisione e non "tutto in inglese": i documenti del progetto sono in
italiano e ci restano, i commenti spiegano il **perché** e lo spiegano meglio nella lingua di chi
scrive, e i messaggi degli errori lanciati sono rivolti a chi legge quei commenti — non
all'utente, che riceve una chiave i18n (R12).

Il meccanismo è `tests/rules/english-identifiers`, ed è **⚠️ parziale e lo dichiara**: una lista
di parole italiane comuni, non un dizionario. Prende il caso normale e non prende una parola che
non sia in elenco. Quando la review ne trova una, si aggiunge alla lista nello stesso commit: è
per questo che è un test e non una riga di questo documento.

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

## Funzioni pure di dominio — R13

I file `rules.ts` contengono **solo** funzioni pure:

- nessun accesso al contesto, nessun `ctx` fra i parametri
- nessun effetto: non emettono, non scrivono, non leggono l'ora
- tutto ciò che serve arriva per argomento e ritorna nel valore

Chi ha bisogno del contesto è `system.ts`, che orchestra: legge dal contesto, chiama le regole
pure, applica il risultato tramite il Ledger. La separazione è ciò che rende il dominio testabile
con un seed fisso e senza impalcature.

Il meccanismo è `tests/rules/pure-rules`, ed è **⚠️ parziale e lo dichiara**: cerca le forme in cui
l'impurità entra — un `ctx` fra i parametri, una lettura dell'ora, un `emit`, un import di valore
dal kernel — e non dimostra la purezza, che richiederebbe l'analisi del flusso. Fino a
[D022](delega/D022-il-confine-disegnato-e-il-confine-vero.md) questa regola non aveva né un ID né
una riga in [tracciabilita.md](tracciabilita.md): per la regola del progetto stesso, non esisteva.

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

Un `eslint-disable` senza quella riga non è un difetto in review: è un test rosso.
`tests/rules/eslint-disable.test.ts` cerca in `src/` ogni riga che spegne una regola e pretende
la motivazione (regola C06 in [tracciabilita.md](tracciabilita.md)).

## Commenti

Si commenta il **perché**, mai il cosa. Un commento che rinomina la riga sotto è rumore che invecchia.

I commenti che valgono sono tre:

- il rimando a una decisione: `// ADR 0009: qui il tempo frazionario resta nell'accumulatore`
- l'avvertimento non ovvio: `// l'ordine conta: il Ledger deve aver già applicato prima che stats legga`
- la spiegazione di una scelta apparentemente strana, che altrimenti qualcuno "correggerebbe"

**Nel codice non esistono `TODO`** (ADR 0014). Ciò che manca sta in
[roadmap-fette.md](roadmap-fette.md), dove si vede senza aprire quel file.
