<!-- Generato da tests/helpers/projectState.ts, verificato da tests/rules/project-state (regola C11).
     Non si modifica a mano: si rigenera con `npx vitest run tests/rules/project-state -u`. -->

# Stato del progetto

Questo documento non si scrive: si **conta**. Contiene i fatti del progetto che una macchina
può derivare dal repo, e nessun altro documento li ripete — se ne ha bisogno, punta qui
(regola C11, [D021](delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md)).

Cosa **non** c'è, e perché: il numero di test non è derivabile senza eseguirli, e il tempo dei
gate dipende dalla macchina. Sono le due sole affermazioni contabili del progetto che restano
affidate a un occhio, e stanno in [qualita.md](qualita.md) con la data accanto.

## Decisioni

**42** ADR: 38 `Accettata`, 3 `Proposta`, 1 `Superata`.

- `Proposta`: 0010, 0022, 0023
- `Superata`: 0018

Il perché di ciascuna sta nel [compendio](adr/README.md); uno stato si legge
dall'intestazione del suo ADR, ed è da lì che questo elenco arriva.

## Deleghe

**36** deleghe: 35 `Chiusa`, 0 `In corso`, 1 `Aperta`.

- `Aperta`: D036
- `In corso`: _nessuno_

L'ordine in cui si eseguono non è questo elenco: è il grafo in
[delega/README.md](delega/README.md).

## Documenti

**102** markdown: 101 sotto `docs/`, più il `README.md` della radice.

## Codice

**94** file sotto `src/`, di cui **34** `.vue`.
**83** file di test. I domini sono 3: `atm`, `income`, `vault`.

Le righe sono **righe di codice**: commenti e righe vuote escluse, con lo stesso metodo per
tutti — ed è `codeLines` in `tests/helpers/projectState.ts` a definirlo, così due misure restano
confrontabili.

| Cartella                      | File | Righe |
| ----------------------------- | ---- | ----- |
| `src/core/contracts/`         | 11   | 202   |
| `src/core/kernel/`            | 7    | 549   |
| `src/core/balance/`           | 3    | 108   |
| `src/core/domains/`           | 12   | 432   |
| `src/main/` + `src/preload/`  | 8    | 246   |
| `src/renderer/`               | 53   | 3.971 |
| — di cui `src/renderer/i18n/` | 3    | 639   |
| — di cui CSS dentro i `.vue`  | 34   | 1.035 |
