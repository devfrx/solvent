# Registro dei rischi

Tre parti, e la terza è la più importante:

1. **I difetti misurati** nel progetto precedente (audit del 19/08/2026) e cosa li impedisce ora.
2. **I rischi nuovi** che _questa_ architettura introduce. Un'architettura che non ne dichiara è
   un'architettura non ancora capita.
3. **I rischi accettati** senza mitigazione, per scelta.

## Parte 1 — I 17 difetti misurati

Colonna "rischio residuo": cosa può ancora andare storto **nonostante** la mitigazione.
Colonna "cosa lo farebbe tornare": il gesto preciso che riaprirebbe il difetto.

| #   | Difetto                             | Mitigazione                       | Rischio residuo | Cosa lo farebbe tornare                                                                                     |
| --- | ----------------------------------- | --------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------- |
| A01 | 5 liste di sistemi mantenute a mano | ADR 0002 — solo il Registry itera | basso           | scrivere un `switch` su `system.id` da qualche parte                                                        |
| A02 | 74 archi store→store, 3 cicli       | ADR 0001 + lint R01               | basso           | un `eslint-disable` su un import fra store                                                                  |
| A03 | 176 sorgenti `Math.random`          | ADR 0005 + lint R03               | basso           | usare `crypto.getRandomValues` — non coperto dal lint attuale                                               |
| A04 | tick rate riscritto in 5 posti      | ADR 0009 — tipi branded           | molto basso     | fare un `as Ticks` su un numero letterale                                                                   |
| A05 | denaro scritto da più punti         | ADR 0003 — saldi in una closure   | molto basso     | esporre la `Map` dei saldi per "comodità di debug"                                                          |
| A06 | persistenza a mano in 3 file        | ADR 0002 — tipo `System`          | molto basso     | tipizzare un sistema come `any`                                                                             |
| A07 | `version: 3` nel renderer           | ADR 0004 — tipo senza campo       | molto basso     | far passare la versione dentro il `payload`                                                                 |
| A08 | 915 righe di schema advisory        | ADR 0004 — `zod` eseguito         | **medio**       | aggiungere un campo al payload e non allo schema: il round-trip lo prende, ma solo se il test lo costruisce |
| A09 | logica di dominio nei `.vue`        | ADR 0001 + lint R05               | **medio**       | scrivere la logica _inline_ nel `.vue` senza importare nulla: nessun import da bloccare                     |
| A10 | liste storiche illimitate           | ADR 0010 — `boundedList`          | basso           | usare un array normale per una history                                                                      |
| A11 | pipeline mista `number`/`Decimal`   | ADR 0006 — tipo classe            | molto basso     | un `.toNumber()` in mezzo a una catena                                                                      |
| A12 | 62 `boolean` contro 35 `{success}`  | ADR 0007 + lint                   | **medio**       | ritornare `boolean` da una funzione che non è un comando                                                    |
| A13 | 20 chiavi i18n mancanti             | ADR 0011 — test di parità         | molto basso     | aggiungere una terza lingua senza estendere il test                                                         |
| A14 | codice morto (CSS, API)             | ADR 0012 — flag TS                | **medio**       | il CSS morto non è visto da TypeScript: resta scoperto                                                      |
| A15 | 4 nomi, `publish.url` finto         | ADR 0008 + test identità          | basso           | aggiungere un quinto posto dove appare il nome, non coperto dal test                                        |
| A16 | 154/156 file non formattati         | ADR 0013 — gate                   | molto basso     | disattivare il gate perché "urgente"                                                                        |
| A17 | 24 sistemi prima del kernel         | ADR 0014 — una fetta alla volta   | **alto**        | è l'unico difetto la cui mitigazione è **disciplina di processo**, non un meccanismo                        |

I cinque difetti a rischio residuo **medio o alto** sono A08, A09, A12, A14, A17. Sono quelli su
cui vale la pena spendere attenzione in review — gli altri li tiene il tooling.

**A17 merita una nota.** È il difetto che ha generato tutti gli altri, ed è l'unico che nessun
lint può impedire: nulla vieta tecnicamente di aprire ventiquattro cartelle in `domains/`.
L'unica difesa reale è che la seconda fetta non inizi finché la prima non è verde.

## Parte 2 — I rischi che questa architettura introduce

| #   | Rischio                                                                                           | Perché è reale                                                                                       | Mitigazione                                                                                                                                                                      | Residuo                                                                                   |
| --- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| N01 | **Il kernel è un punto singolo.** Un difetto nel Registry o nel Ledger si propaga a tutto         | prima nessun componente aveva questo potere                                                          | ~530 righe (266 già scritte a D006), testate per intero, pure, senza I/O                                                                                                         | basso                                                                                     |
| N02 | **`order` è una risorsa globale.** Con molti sistemi, ragionare su chi va prima diventa difficile | l'ordinamento globale è un accoppiamento nascosto fra sistemi che non si conoscono                   | costanti nominate per fase, con passo 100 e pareggio per `id`: inserire una fase è una riga, e non sposta l'ordine di nessuno. Il numero di sistemi cresce lentamente (ADR 0014) | **medio**                                                                                 |
| N03 | **Il contesto passa per parametro.** `core/` puro significa niente singleton comodi               | ogni `tick` porta con sé `ctx`: più verboso di `import { ledger }`                                   | è il prezzo diretto della testabilità in Node                                                                                                                                    | basso, accettato                                                                          |
| N04 | **`Decimal` è molto più lento di `number`**                                                       | 10 tick/s per pochi sistemi è irrilevante; con decine di sistemi e liste lunghe potrebbe non esserlo | misurare prima di ottimizzare; budget di tempo per tick se serve                                                                                                                 | basso oggi                                                                                |
| N05 | **I tipi branded costano da scrivere.** Servono costruttori espliciti                             | ogni conversione diventa una chiamata                                                                | limitati al **solo** dominio del tempo, dove il difetto era misurato                                                                                                             | basso                                                                                     |
| N06 | **i18n dal primo giorno costa a ogni stringa**                                                    | due file da toccare invece di zero                                                                   | il costo alternativo è una migrazione che non si fa mai (ADR 0011)                                                                                                               | accettato                                                                                 |
| N07 | **La documentazione può disallinearsi dal codice**                                                | è il difetto classico di un set di documenti ampio: mente con autorevolezza                          | ADR append-only; deleghe che si **chiudono**; l'architettura si aggiorna nello stesso task che sposta un confine; `tests/rules/link-documenti` per i collegamenti                | **alto — è il rischio principale di questo approccio, e si è già realizzato: vedi sotto** |
| N08 | **Sovra-documentazione.** Oggi il rapporto documenti/codice è infinito                            | se il rapporto non si inverte presto, la documentazione diventa il prodotto                          | lo STOP 2 pretende l'output reale di `typecheck`, `lint` e `test`: nessun claim senza output                                                                                     | **medio**                                                                                 |
| N09 | **Il Bus sincrono blocca il tick** se un handler è lento                                          | scelto deliberatamente (ADR 0016) per il determinismo                                                | handler brevi per costruzione; misurabile                                                                                                                                        | basso                                                                                     |

### N07 in dettaglio, perché è il rischio numero uno

Questo progetto ha più documentazione che codice, e lo avrà ancora per un po'. La regola che tiene
insieme la cosa è una sola:

> **Se una modifica sposta un confine, il documento che descrive quel confine cambia nello stesso
> commit.** Non nel commit dopo, non in un task "di documentazione".

Un documento aggiornato in ritardo è peggio di un documento assente, perché chi lo legge non ha
modo di sapere che è vecchio. La difesa strutturale è che i documenti **non duplicano il codice**:
gli ADR contengono il perché (che il codice non può contenere), la tracciabilità contiene il
mapping (che nessun file contiene), il glossario contiene il linguaggio. Le firme stanno nel
codice, non nei documenti — proprio per questo.

**Non è teoria: è già successo.** Un audit di coerenza fatto dopo D005 ha trovato quindici
disallineamenti su cinquanta documenti. I tre peggiori erano documenti _vivi_ che descrivevano un
meccanismo diverso da quello nel codice: `architettura.md` raccontava una difesa su `Math.random`
più debole di quella reale (D004 l'aveva rafforzata senza toccare quel file), `flusso-tick.md`
mostrava un'API del Ledger superata dagli ADR 0019/0020, `rischi.md` — questo file — elencava fra i
rischi accettati "senza mitigazione" una cosa che da D004 era un test.

Il denominatore comune è **uno solo**: una delega ha aggiornato i documenti che citava, e non
quelli che citavano lei. È la ragione per cui la regola dello "stesso commit" va letta al
contrario: non "aggiorna i documenti che nomini", ma "cerca chi nomina ciò che hai cambiato".

## Parte 3 — Rischi accettati senza mitigazione

Dichiarati, non nascosti:

- **Il CSS morto non è coperto.** TypeScript non vede i fogli di stile. Con due componenti il
  problema non esiste; alla seconda fetta si valuta un tool (ADR 0012).
- **La logica scritta inline in un `.vue`, senza import, sfugge al lint** (A09). Nessuna regola
  automatica distingue "calcolo di presentazione" da "calcolo economico". Resta alla review.
- **Un `eslint-disable` motivato sconfigge qualsiasi regola.** Non lo vietiamo: vietarlo produce
  aggiramenti peggiori. Resta accettato che una motivazione plausibile ma sbagliata passi: nessun
  test giudica il **contenuto** della motivazione, solo che ci sia. Che ci sia, però, non è più una
  convenzione: da D004 è la regola C06, cioè `tests/rules/eslint-disable.test.ts`, e un
  `eslint-disable` muto è un test rosso.
- **Nessuna difesa contro la manomissione del file di salvataggio.** È un singleplayer offline: il
  giocatore che vuole barare con il proprio salvataggio ne ha diritto. Lo schema `zod` serve a non
  far entrare in memoria dati malformati, non a impedire il cheating.
