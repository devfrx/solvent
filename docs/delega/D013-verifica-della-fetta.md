# D013 — Verifica della fetta (STOP 2)

- **Stato:** Aperta
- **Dipende da:** D012 (cioè tutto)
- **Sblocca:** la decisione sulla fetta 02
- **ADR vincolanti:** 0014
- **Budget:** ~250 righe di test

## Obiettivo

Dimostrare — con output, non con affermazioni — che il kernel regge e che la fetta attraversa
davvero tutti i livelli.

## Da produrre

| File                            | Cosa dimostra                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `tests/save/roundtrip.test.ts`  | stato non banale → salva → ricarica → identico                                |
| `tests/balance/targets.test.ts` | il reddito sta nell'intervallo dichiarato                                     |
| `tests/i18n/parity.test.ts`     | nessuna chiave manca in nessuna lingua                                        |
| `tests/rules/*.test.ts`         | Registry completo, niente logica nei `.vue`, identità coerente, nessun `TODO` |
| `docs/adr/*`                    | gli ADR che il codice ora impone passano da `Proposta` ad `Accettata`         |
| `README.md`                     | cosa fa il progetto e come si aggiunge un sistema, in 20 righe                |

## Lo stato di prova del round-trip

Un round-trip su uno stato vuoto passa sempre e non dimostra nulla. Lo stato costruito deve
contenere, come minimo:

- un saldo con decimali che in virgola mobile andrebbero storti (`0.1 + 0.2`)
- il sistema income con almeno un upgrade comprato
- lo stato dell'Rng con almeno uno stream avanzato di N estrazioni
- se esiste già una `boundedList`, almeno un elemento dentro

Il confronto è sull'**uguaglianza profonda** dello stato ricostruito, non su qualche campo scelto.

## Il percorso manuale

Da fare a mano, oltre ai test, perché è la cosa che i test non vedono:

1. avvio il gioco, il saldo sale
2. compro l'upgrade, il reddito aumenta in modo visibile
3. provo a ricomprare senza fondi, ricevo un messaggio tradotto
4. chiudo la finestra
5. riapro: saldo, upgrade e reddito sono quelli di prima, più il tempo passato
6. reset hard: torna tutto a zero, upgrade incluso

## Definizione di fatto

- [ ] `npm run verify` verde, con l'**output incollato** — non riassunto, non parafrasato
- [ ] i sei passi manuali sopra, eseguiti davvero
- [ ] ogni test nuovo è stato rotto di proposito almeno una volta, per verificare che possa fallire
- [ ] `docs/tracciabilita.md`: nessuna riga ha un meccanismo che non esiste
- [ ] `docs/roadmap-fette.md`: la fetta 01 è marcata conclusa; il registro YAGNI è aggiornato con
      ciò che è stato tentato e rimandato **durante** il lavoro
- [ ] tutte le deleghe da D001 a D012 sono `Chiusa`, con il commit annotato
- [ ] gli ADR imposti dal codice sono `Accettata`; quelli ancora non imposti restano `Proposta`,
      e si dice quali
- [ ] `README.md` sta in 20 righe

## Cosa si riporta allo STOP 2

Non "funziona". Questo:

1. l'output reale dei gate
2. quante righe ha il kernel, confrontate con il budget di ~500
3. **quali regole si sono rivelate scomode**, e in quale punto preciso. È l'informazione più
   importante dello STOP 2: una regola scomoda alla prima fetta è una regola da rivedere adesso,
   quando cambiarla costa poco (ADR 0014)
4. cosa è stato tentato e rimandato, dal registro YAGNI
5. se qualcosa è rosso: che cosa, e perché non è stato aggirato

## Trappole note

- **A17.** Il momento di massimo rischio del progetto è **subito dopo** questo STOP: il kernel è
  pagato, tutto sembra facile, e la tentazione è aprire cinque domini insieme. È esattamente così
  che sono nati i 24 sistemi.
- Un test che non è mai stato visto fallire non è una rete: è una decorazione. Romperlo di
  proposito una volta costa trenta secondi.
- Dichiarare verde ciò che non si è eseguito è l'unico errore di questo elenco che non si recupera
  con un commit.
