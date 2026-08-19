# ADR 0010 — Una lista storica nasce già con il suo limite

- **Stato:** Proposta
- **Data:** 2026-08-19
- **Copre il difetto:** A10 (`loanHistory` e `depositHistory` senza limite, dentro il salvataggio)

## Contesto

Nel progetto precedente due liste storiche finivano nel salvataggio senza alcun tetto. Il file di
salvataggio non aveva una dimensione massima calcolabile: cresceva finché il giocatore giocava.
Il limite era previsto "quando servirà", cioè mai.

## Decisione

`boundedList<T>(max)` in `core/contracts/bounded.ts` è l'**unico** costruttore di lista storica.
`max` è un parametro obbligatorio: non esiste una firma che permetta di creare una history senza
dichiarare quanto è lunga.

Il limite è dichiarato **nel punto di definizione della lista**, dove lo legge chiunque apra quel
file — non in una funzione di potatura altrove.

Il validatore del salvataggio nel main rifiuta un array che supera il `max` dichiarato: un file
manomesso o prodotto da una versione bacata non entra in memoria.

## Alternative scartate

- **Potatura al momento del salvataggio.** Il limite finisce lontano dalla definizione: chi legge
  la definizione non sa che esiste, e chi aggiunge una lista nuova non sa di doverlo aggiungere.
- **Nessun limite più compressione del salvataggio.** Rimanda il problema e lo rende più difficile
  da diagnosticare quando arriva.

## Conseguenze

- Il salvataggio ha un tetto dimensionale **calcolabile a priori**: somma dei `max` dichiarati.
- Una lista che davvero deve essere illimitata diventa una decisione visibile, da giustificare —
  non un'omissione.
