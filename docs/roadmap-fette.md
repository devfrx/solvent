# Registro delle fette e di ciò che non è stato costruito

Due registri. Il primo dice **cosa si costruisce e in che ordine**; il secondo dice **cosa è stato
deliberatamente lasciato fuori e cosa lo farà entrare**.

Il secondo è il più importante: è il posto dove vivono i `TODO` che nel codice non esistono
(ADR 0014). Un elenco visibile di ciò che manca è una difesa; un `TODO` sepolto in un file è
un'omissione.

## Registro delle fette

Regola: una fetta non inizia finché la precedente non ha i gate verdi (ADR 0014).

| #      | Fetta                                                                                                                                           | Cosa dimostra del kernel                                                                                                                                                     | Stato                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **01** | **Il primo stipendio e il bancomat** — reddito in contanti, ATM che deposita e preleva con commissione, carta 3D, un upgrade comprato con carta | Clock, Registry, Ledger a partita doppia con transazioni atomiche e due pool, Balance, salva/ricarica/reset, `Result` su due comandi che possono fallire per ragioni diverse | **in corso** — a che punto lo dice il [passaggio di consegne](delega/PASSAGGIO-DI-CONSEGNE.md) |
| 02     | **Il caveau** — i contanti hanno una capienza                                                                                                   | il primo vincolo che rende la scelta contanti/carta non ovvia; il primo `boundedList` con dati veri dentro                                                                   | non iniziata                                                                                   |
| 03     | **Progresso offline**                                                                                                                           | il tetto di recupero, e che il recupero usi **lo stesso** codice del tempo reale (ADR 0009)                                                                                  | non iniziata                                                                                   |
| 04     | **Calore e black market**                                                                                                                       | il primo sistema che **ascolta** eventi da altri domini invece di importarli; il primo consumatore reale dell'Rng con stream separati                                        | non iniziata                                                                                   |
| 05     | **Prestiti e punteggio di credito**                                                                                                             | il primo sistema che legge lo storico dei movimenti; il primo debito, quindi il primo saldo che può essere negativo per volontà del giocatore                                | non iniziata                                                                                   |
| 06     | **Prestige e ere**                                                                                                                              | `ResetScope` su molti sistemi contemporaneamente: ognuno decide cosa conserva, nel proprio file. Il difetto A09 nasceva qui                                                  | non iniziata                                                                                   |

Oltre la 06 non c'è pianificazione, di proposito: pianificare la fetta 09 oggi significa progettare
per un kernel che non esiste ancora.

### Perché quest'ordine

Non è l'ordine di quanto sono belli i domini: è l'ordine di quanto mettono alla prova il kernel.
Ogni fetta è scelta per essere la **prima** che rompe qualcosa, se qualcosa è rotto.

- **02 prima di tutto il resto** perché senza capienza i contanti sarebbero sempre la scelta
  giusta, e la dualità dell'ADR 0017 resterebbe una decorazione.
- **03 presto** perché un idle senza progresso offline è rotto per definizione, ed è la prova
  che il passo fisso dell'ADR 0009 regge.
- **04 prima dei domini più ricchi** perché il calore è il primo sistema che vive di eventi altrui:
  se il contratto del Bus è sbagliato, si scopre qui — quando cambiarlo costa poco.

### I domini della visione non ancora programmati

Mercato azionario, crypto, immobiliare, negozio, aste di box, casinò, impresa, depositi vincolati,
albero delle abilità, eventi periodici.

Le meccaniche sono descritte in [prodotto/visione.md](prodotto/visione.md). Nessuna di esse entra
prima che la fetta 06 sia verde. Sono descritte, non pianificate: la differenza è deliberata.

## Registro YAGNI — cosa non è stato costruito, e il grilletto che lo farà entrare

Ogni riga qui è un'astrazione che **sarebbe stato facile aggiungere adesso** e che è stata
lasciata fuori. La colonna "grilletto" è la condizione precisa che la fa entrare: senza quella
condizione, non entra — nemmeno se sembra ovvia.

### Nel kernel

| Cosa manca                                        | Perché è stato tentato      | Grilletto                                                                                     |
| ------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------- |
| `Rng.int()`, `pick()`, `chance()`                 | ogni PRNG li ha             | il primo sistema che ne ha bisogno davvero (fetta 05)                                         |
| `Bus.once()`, sottoscrizioni con wildcard         | comodi                      | un caso d'uso reale, non uno immaginato                                                       |
| Pool oltre `cash` e `card` (fiches, investimenti) | il gioco le avrà            | il dominio che le usa. La _forma_ c'è dalla fetta 01 (ADR 0017), i valori no                  |
| Proprietà dei pool: capienza, interessi, spread   | sono già nel tipo           | il dominio che le rende vere — capienza in fetta 02, interessi con i depositi                 |
| Categorie oltre le quattro di oggi                | la telemetria le vorrà      | la prima schermata che le mostra                                                              |
| `stats()` implementato nei sistemi                | è nel tipo                  | la prima schermata di statistiche. Il tipo lo prevede opzionale apposta                       |
| Migrazioni del salvataggio                        | servono sempre, prima o poi | la **versione 2** della busta. La versione 1 non ha migrazioni: non ha nulla da cui migrare   |
| Priorità o cancellazione nel Bus                  | i bus "seri" ce l'hanno     | un ordine di handler che conta davvero, misurato                                              |
| Fasi di `ORDER` oltre `ECONOMY` e `INCOME`        | il gioco ne avrà            | il primo sistema che non sta in nessuna delle due. Il passo 100 lascia posto senza rinumerare |
| Un `Logger` nel kernel                            | ovvio                       | quando servirà diagnosticare qualcosa che gli errori tipizzati non spiegano                   |

### Nell'applicazione

| Cosa manca                                      | Grilletto                                                                                |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Salvataggi multipli / slot                      | quando esiste una ragione di gioco per più partite parallele                             |
| Salvataggio automatico a intervalli             | fetta 03, insieme al progresso offline: sono lo stesso problema                          |
| Undo / annulla                                  | mai, salvo decisione di design esplicita                                                 |
| Obiettivi, achievement                          | quando esistono abbastanza sistemi da renderli non banali                                |
| Impostazioni (audio, lingua da UI, scorciatoie) | quando esiste più di una cosa da impostare. La lingua si cambia già da codice            |
| Suono                                           | fetta di design, non di architettura                                                     |
| Tema chiaro/scuro                               | mai prima che la UI sia stabile. Il difetto A14 era 1.067 righe di CSS morto proprio qui |

### Negli strumenti

| Cosa manca                                  | Grilletto                                                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| CI (GitHub Actions o equivalente)           | il primo collaboratore, o il primo rilascio. Oggi `npm run verify` in locale copre lo stesso terreno |
| Tool per il codice morto non visto da TS    | inizio della fetta 02 (ADR 0012)                                                                     |
| Test end-to-end sulla UI                    | quando la UI avrà uno stato proprio non banale, con un ADR                                           |
| Firma del binario e canale di distribuzione | prima del primo rilascio pubblico (ADR 0008: nessun `publish` finto)                                 |
| Web Worker per la simulazione               | un profilo che mostri il tick che blocca il frame (ADR 0001)                                         |

## Come si usa questo registro

1. **Ti serve una cosa che è in questo elenco?** Prima verifica se il grilletto è scattato davvero.
   Se sì, si fa. Se no, la voglia non è un grilletto.
2. **Ti serve una cosa che non c'è in questo elenco?** Aggiungila qui con il suo grilletto, poi
   decidi. Scriverla costringe a rispondere a "quando serve davvero?", che è la domanda che
   uccide la maggior parte delle astrazioni speculative.
3. **Un grilletto è scattato?** La voce esce da qui ed entra nel registro delle fette o in una
   delega.
