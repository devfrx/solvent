# ADR 0008 — Un solo nome, deciso prima del primo file

- **Stato:** Proposta — richiede la scelta dell'utente
- **Data:** 2026-08-19

## Contesto

Nel progetto precedente lo stesso prodotto aveva 4 nomi diversi in giro per il repo, `appId` era
rimasto `com.electron.app` e `publish.url` puntava a `example.com`: metadati del template mai
sostituiti. Il nome è una decisione strutturale perché entra in cose difficili da cambiare dopo
il primo rilascio — `appId`, percorso dei salvataggi, chiavi di registro Windows.

## Decisione (proposta)

Nome: **Solvent**.

Usato identico e senza varianti in: `package.json` (`name`, `productName`), `appId`
(`com.solvent.game`), `setAppUserModelId`, titolo della finestra, nome del file di salvataggio,
titolo in UI, README.

Nessun metadato del template Electron sopravvive: `publish` va rimosso finché non esiste un
canale di distribuzione reale, invece di puntare a un dominio finto.

## Alternative scartate

- **Bankroll.** Ugualmente valido e più immediato come richiamo al denaro; scartato perché più
  generico e più probabile che collida con app esistenti.

## Conseguenze

- Un test verifica che `name`, `productName` e `appId` restino coerenti fra loro: rinominare a
  metà diventa un test rosso, non una svista.
- `appId` andrebbe idealmente su un dominio controllato. In assenza, `com.solvent.game` è un
  segnaposto stabile e nostro — non ereditato.
