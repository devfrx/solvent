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

**27** ADR: 22 `Accettata`, 5 `Proposta`, 0 `Superata`.

- `Proposta`: 0010, 0022, 0023, 0025, 0026
- `Superata`: _nessuno_

Il perché di ciascuna sta nel [compendio](adr/README.md); uno stato si legge
dall'intestazione del suo ADR, ed è da lì che questo elenco arriva.

## Deleghe

**22** deleghe: 20 `Chiusa`, 0 `In corso`, 2 `Aperta`.

- `Aperta`: D017, D018
- `In corso`: _nessuno_

L'ordine in cui si eseguono non è questo elenco: è il grafo in
[delega/README.md](delega/README.md).

## Documenti

**69** markdown: 68 sotto `docs/`, più il `README.md` della radice.

## Codice

**52** file sotto `src/`, di cui **10** `.vue`.
**62** file di test. I domini sono 2: `atm`, `income`.

Le righe sono **righe di codice**: commenti e righe vuote escluse, con lo stesso metodo per
tutti — ed è `codeLines` in `tests/helpers/projectState.ts` a definirlo, così due misure restano
confrontabili.

| Cartella                      | File | Righe |
| ----------------------------- | ---- | ----- |
| `src/core/contracts/`         | 10   | 144   |
| `src/core/kernel/`            | 5    | 471   |
| `src/core/balance/`           | 3    | 74    |
| `src/core/domains/`           | 6    | 188   |
| `src/main/` + `src/preload/`  | 8    | 246   |
| `src/renderer/`               | 20   | 1.757 |
| — di cui `src/renderer/i18n/` | 3    | 372   |
| — di cui CSS dentro i `.vue`  | 10   | 443   |
