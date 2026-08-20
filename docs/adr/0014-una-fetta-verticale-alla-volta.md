# ADR 0014 — Una fetta verticale alla volta

- **Stato:** **Accettata** — [D013](../delega/D013-verifica-della-fetta.md): la fetta 01 è arrivata
  in fondo da sola, in sedici deleghe, e nel codice non c'è un `TODO`. Visto rosso mettendone uno:
  `expected [ 'src\core\domains\income\rules.ts' ] to deeply equal []`
- **Data:** 2026-08-19
- **Copre il difetto:** A17 (24 sistemi costruiti prima che esistesse un modo di collegarli)

## Contesto

Il progetto precedente aveva 24 sistemi, costruiti prima che esistesse un kernel che li
collegasse. Non erano 24 sistemi con qualche difetto: erano 24 sistemi ciascuno con la propria
idea di come si salva, come si resetta, come si legge il tempo. Il debito non era nei sistemi,
era nella loro somma.

Questo è un ADR di **processo**, non di struttura. Sta qui perché è la decisione che ha causato
tutte le altre.

## Decisione

Una fetta verticale è finita quando attraversa **tutti** i livelli — kernel, dominio puro, store,
UI, salvataggio, caricamento, reset — e i suoi gate di qualità sono verdi.

Un secondo sistema non inizia prima che il primo sia finito in questo senso.

Le funzionalità non ancora costruite vivono in `docs/roadmap-fette.md` come registro esplicito:
**non** come codice parziale, **non** come astrazione "per quando servirà", **non** come `TODO`
nel codice. Nel codice non esistono `TODO`.

## Alternative scartate

- **Costruire il dominio a strati orizzontali** (prima tutti i modelli, poi tutti gli store, poi
  tutta la UI). Uno strato completo senza consumatori non è verificabile: gli errori di
  progettazione si scoprono solo quando arriva il primo consumatore, cioè quando cambiarli è
  costoso. È il percorso che produce astrazioni speculative.

## Conseguenze

- La prima fetta è lenta: paga per intero il costo del kernel. Le successive sono
  sproporzionatamente veloci, perché quel costo è già stato pagato.
- Se una regola rende scomoda una feature, ce ne si accorge alla prima fetta — quando cambiare la
  regola costa poco — invece che alla ventiquattresima.
- Ciò che non si può fare bene adesso resta fuori e finisce nel registro. Un `TODO` nel codice è
  una scorciatoia mascherata: si vede solo aprendo quel file.
