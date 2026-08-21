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

**37** ADR: 33 `Accettata`, 4 `Proposta`, 0 `Superata`.

- `Proposta`: 0010, 0022, 0023, 0026
- `Superata`: _nessuno_

Il perché di ciascuna sta nel [compendio](adr/README.md); uno stato si legge
dall'intestazione del suo ADR, ed è da lì che questo elenco arriva.

## Deleghe

**30** deleghe: 30 `Chiusa`, 0 `In corso`, 0 `Aperta`.

- `Aperta`: _nessuno_
- `In corso`: _nessuno_

L'ordine in cui si eseguono non è questo elenco: è il grafo in
[delega/README.md](delega/README.md).

## Documenti

**91** markdown: 90 sotto `docs/`, più il `README.md` della radice.

## Codice

**83** file sotto `src/`, di cui **28** `.vue`.
**76** file di test. I domini sono 3: `atm`, `income`, `vault`.

Le righe sono **righe di codice**: commenti e righe vuote escluse, con lo stesso metodo per
tutti — ed è `codeLines` in `tests/helpers/projectState.ts` a definirlo, così due misure restano
confrontabili.

| Cartella                      | File | Righe |
| ----------------------------- | ---- | ----- |
| `src/core/contracts/`         | 11   | 178   |
| `src/core/kernel/`            | 7    | 549   |
| `src/core/balance/`           | 3    | 103   |
| `src/core/domains/`           | 11   | 344   |
| `src/main/` + `src/preload/`  | 8    | 246   |
| `src/renderer/`               | 43   | 3.068 |
| — di cui `src/renderer/i18n/` | 3    | 544   |
| — di cui CSS dentro i `.vue`  | 28   | 751   |
