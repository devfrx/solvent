import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import importX from 'eslint-plugin-import-x'
import vue from 'eslint-plugin-vue'
import ts from 'typescript-eslint'

/**
 * Le regole del progetto, meccanizzate.
 *
 * Ogni blocco cita la regola (Rxx / INV-xx) e l'ADR che la giustifica. La verifica che ciascuna
 * scatti davvero — scrivendo la violazione e vedendo il rosso — è permanente, in
 * `tests/rules/lint-rules.test.ts`. Se qualcuno indebolisce questo file, quel test diventa rosso.
 *
 * Mappa completa in docs/tracciabilita.md.
 */

// `.left` non e' un dettaglio: senza, il selettore prende anche il lato **destro**, e leggere un
// saldo per rispecchiarlo diventa una violazione. Nessuno se n'era accorto perche' fino a D011
// nessuno leggeva un `.balances` in un assegnamento (D011, correzione 3).
const R06_SALDO = {
  selector:
    'AssignmentExpression > MemberExpression.left[property.name=/^(balance|balances|cash|money)$/]',
  message: 'R06 — un saldo si cambia solo con Ledger.transaction (ADR 0003).'
}

const R10_ESITO = {
  selector: 'ObjectExpression > Property[key.name="success"]',
  message: 'R10 — un solo stile di esito: Result<T, E> (ADR 0007).'
}

const R11_CONVERSIONI = {
  group: ['@core/contracts/money', '**/contracts/money'],
  importNames: ['fromNumber', 'toDisplayNumber'],
  message:
    'R11 — le conversioni da/verso number stanno al confine di presentazione, non dentro una catena economica (ADR 0006).'
}

const INV02_PATHS = [
  { name: 'vue', message: 'INV-02 — core/ non importa Vue (ADR 0001).' },
  { name: 'pinia', message: 'INV-02 — core/ non importa Pinia (ADR 0001).' },
  { name: 'electron', message: 'INV-02 — core/ non importa Electron (ADR 0001).' },
  { name: 'vue-i18n', message: 'INV-02 — core/ non importa vue-i18n (ADR 0011).' },
  { name: 'zod', message: 'INV-02 — zod vive nel main, non in core/ (ADR 0004).' }
]

const INV02_PATTERNS = [
  {
    group: ['node:*', 'fs', 'path', 'os', 'child_process'],
    message: 'INV-02 — core/ è puro: nessun I/O (ADR 0001).'
  },
  {
    group: ['@renderer/**', '**/renderer/**', '**/main/**'],
    message: 'INV-02 — core/ non conosce né il renderer né il main (ADR 0001).'
  }
]

export default ts.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'out/**', '.vite/**', 'docs/**']
  },

  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/recommended'],

  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: ts.parser } }
  },

  // ------------------------------------------------------------------ qualità di base
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    }
  },

  // ------------------------------------------------------- ordine degli import (convenzioni.md)
  {
    files: ['**/*.{ts,vue}'],
    plugins: { 'import-x': importX },
    rules: {
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            { pattern: '@core/contracts/**', group: 'internal', position: 'before' },
            { pattern: '@core/kernel/**', group: 'internal' },
            { pattern: '@core/balance/**', group: 'internal' },
            { pattern: '@core/domains/**', group: 'internal' },
            { pattern: '@renderer/**', group: 'internal', position: 'after' }
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ]
    }
  },

  // ------------------------------------------------------------- R03 — Math.random solo in Rng
  {
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'R03 — la casualità passa solo da core/kernel/Rng.ts (ADR 0005).'
        }
      ]
    }
  },
  // Nessuna eccezione di file per R03: dentro Rng.ts la regola resta accesa, e l'unica riga
  // autorizzata porta la sua motivazione (convenzioni.md). Spegnerla sul file renderebbe invisibile
  // un secondo Math.random aggiunto piu tardi - che e' esattamente come nasce il difetto A03.

  // ----------------------------------------------- R06 — denaro · R10 — un solo stile di esito
  {
    rules: { 'no-restricted-syntax': ['error', R06_SALDO, R10_ESITO] }
  },
  {
    files: ['src/core/kernel/Ledger.ts'],
    rules: { 'no-restricted-syntax': ['error', R10_ESITO] }
  },

  // ------------------------------------------------------ R01 — nessuno store importa uno store
  {
    files: ['src/renderer/stores/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/stores/**', '@renderer/stores/**', './*', '../stores/**'],
              message:
                'R01 — nessuno store importa un altro store (ADR 0001). Passa dal Bus o da un selettore.'
            }
          ]
        }
      ]
    }
  },

  // ----------------------------------------------- R05 — niente logica di dominio nei componenti
  {
    files: ['**/*.vue'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@core/kernel/**',
                '**/core/kernel/**',
                '@core/balance/**',
                '**/core/balance/**',
                '@core/domains/*/rules',
                '**/core/domains/*/rules',
                '@core/domains/*/commands',
                '**/core/domains/*/commands'
              ],
              message:
                'R05 — niente logica di dominio nei .vue (ADR 0001). Leggi un selettore, invia un comando.'
            }
          ]
        }
      ]
    }
  },

  // ---------------------------------------------------------- INV-02 — core/ è puro e autonomo
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { paths: INV02_PATHS, patterns: INV02_PATTERNS }]
    }
  },

  // ------------------------------------- R11 — le conversioni del denaro non entrano nei domini
  //
  // Il blocco ripete INV-02: in flat config `no-restricted-imports` non si somma, l'ultima
  // configurazione che vince sostituisce le precedenti. Senza le due costanti qui dentro, questo
  // blocco spegnerebbe INV-02 sotto `domains/` senza che nulla lo dica.
  {
    files: ['src/core/domains/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: INV02_PATHS, patterns: [...INV02_PATTERNS, R11_CONVERSIONI] }
      ]
    }
  },

  // ------------------------------------------- INV-03 — il main conosce solo il contratto di save
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@core/kernel/**',
                '**/core/kernel/**',
                '@core/domains/**',
                '**/core/domains/**',
                '@core/balance/**',
                '**/core/balance/**'
              ],
              message: 'INV-03 — il main conosce solo core/contracts (ADR 0004).'
            }
          ]
        }
      ]
    }
  },

  // ------------------------------------------------------------- R04 — nessun numero magico
  {
    files: ['src/core/domains/**/*.ts', 'src/core/balance/modifiers.ts'],
    rules: {
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, -1],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
          enforceConst: true,
          detectObjects: false
        }
      ]
    }
  },

  // Prettier per ultimo: spegne ogni regola di stile in ESLint (ADR 0013).
  prettier
)
