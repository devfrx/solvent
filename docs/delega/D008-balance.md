# D008 — Balance: costanti, modificatori, bersagli

- **Stato:** Aperta
- **Dipende da:** D006, D007
- **Sblocca:** D010
- **ADR vincolanti:** 0009 (il tetto di recupero vive qui)
- **Regole:** R04, R11
- **Budget:** ~90 righe

## Obiettivo

Tenere in un solo posto tutti i numeri che decidono come si gioca, e rendere il bilanciamento una
cosa **verificabile** invece che una sensazione.

## Da produrre

`src/core/balance/`

| File           | Contenuto                                                                               |
| -------------- | --------------------------------------------------------------------------------------- |
| `constants.ts` | i numeri di gioco: reddito base, costo e moltiplicatore dell'upgrade, tetto di recupero |
| `modifiers.ts` | il registro dei modificatori e l'unica formula di composizione                          |
| `targets.ts`   | i bersagli di bilanciamento, come **dati**                                              |

## Invarianti

- **Una sola formula di composizione**, scritta una volta: `(base + Σ add) × Π mult`. Non esiste
  un secondo posto dove si compongono moltiplicatori.
- L'ordine di composizione è deterministico: prima tutti gli `add`, poi tutti i `mult`. A parità
  di tipo, l'ordine è per `id` di sorgente, così il risultato non dipende dall'ordine di
  registrazione — che cambierebbe i decimali in modo invisibile.
- `sourcesFor(target)` esiste dal primo giorno, perché è ciò che permette alla UI di rispondere a
  "perché guadagno tanto" senza reimplementare la formula.
- Nessun numero di gioco vive fuori da `constants.ts`. In `domains/**` il lint `no-magic-numbers`
  lo impedisce.
- `targets.ts` contiene intervalli, non valori singoli: un bilanciamento espresso come uguaglianza
  esatta è un test che si rompe a ogni ritocco e che verrà disattivato.
- Registrare due volte lo stesso `id` di modificatore **lancia**: un upgrade comprato due volte
  che registra due volte è un bug di gioco, non un raddoppio legittimo.

## Fuori scope

- Modificatori di tipo diverso da `add` e `mult`: due bastano, un terzo va giustificato.
- Modificatori a tempo (buff che scadono): grilletto = il primo buff a tempo.
- Curve di costo diverse dalla progressione della fetta 01.
- Bersagli di bilanciamento per sistemi che non esistono.

## Definizione di fatto

- [ ] test: la composizione con due `add` e due `mult` dà il risultato atteso, in `Decimal`
- [ ] test: cambiare l'ordine di registrazione **non** cambia il risultato
- [ ] test: registrare due volte lo stesso id lancia
- [ ] test: `sourcesFor` elenca le sorgenti attive sul bersaglio
- [ ] `tests/balance/targets.test.ts`: simula i primi N tick e verifica che il reddito al minuto
      cada dentro `income_per_minute_at_start` — con un bersaglio solo, ma vero
- [ ] `grep` di numeri letterali in `src/core/domains/**`: solo `0`, `1`, `-1`

## Trappole note

- Il test dei bersagli è quello che si scrive "dopo, quando i numeri saranno stabili". Se si
  scrive dopo, non si scrive: e allora `targets.ts` diventa un file di documentazione, cioè
  esattamente ciò che non deve essere.
- Un bersaglio con un intervallo troppo largo passa sempre e non dimostra nulla. Meglio uno
  stretto che si rompe quando cambi un numero: è il suo lavoro dirti che l'hai cambiato.
- La composizione tende a duplicarsi il giorno in cui un sistema ha "un caso un po' diverso".
  Quel caso è un tipo di modificatore nuovo, da giustificare — non una seconda formula.
