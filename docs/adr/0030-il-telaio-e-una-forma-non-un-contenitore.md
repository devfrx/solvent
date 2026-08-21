# ADR 0030 — Il telaio è una forma, non un contenitore

- **Stato:** **Accettata** — [D024](../delega/D024-il-telaio.md): `src/renderer/ui/UiShell.vue`, tre
  regioni e nessuna proprietà, e la regola **R16** che gli impedisce di crescere. Rotta di proposito:
  una proprietà `gap` su `UiReadout`, e `tests/rules/ui-kit-has-no-geometry` la stampa nel diff
- **Data:** 2026-08-21

## Contesto

L'[ADR 0028](0028-il-kit-ui-non-sa-che-gioco-e.md) ha scartato `UiRow` e `UiStack` con una ragione
precisa: «nascono con due proprietà e ne hanno dodici dopo tre schermate — è il debito classico dei
design system». Al loro posto ha messo una frase: «uno spazio fra due elementi è una riga di CSS
scoped dentro il componente che lo vuole».

[D024](../delega/D024-il-telaio.md) porta il telaio del design — colonna a sinistra, testata
appiccicata, contenuto — e chiede dove viva. Letto in fretta, l'ADR 0028 dice `components/`: è
impaginazione, e l'impaginazione era stata scartata dal kit.

Letto per intero dice un'altra cosa. Ciò che l'ADR 0028 ha scartato non è **l'impaginazione**: è la
**parametrizzazione** dell'impaginazione. `UiRow` non cresce perché dispone degli elementi in fila,
cresce perché chi lo chiama decide ogni volta con quale spazio, con quale allineamento, in quale
direzione — e ogni decisione nuova diventa una proprietà.

Il telaio non ha quel problema, e non può averlo: le sue tre regioni sono **sempre** quelle tre,
nello stesso posto, con la stessa larghezza. Non c'è niente da parametrizzare, perché non c'è niente
che vari.

E metterlo in `components/` costerebbe caro. Quella cartella è dove vive ciò che conosce il gioco:
importa lo store, importa le parole, importa i contratti. Un file che riceve solo slot e non nomina
niente ci starebbe come unico estraneo, e la prima volta che qualcuno gli passasse un saldo «tanto è
già lì» nessuna regola direbbe di no — perché in `components/` non c'è nessuna regola da rompere.

## Decisione

Il kit accetta un pezzo di impaginazione quando è una **forma**, e lo rifiuta quando è un
**contenitore**. La differenza è verificabile e non è di gusto:

> Se puoi cambiarne la disposizione passandogli una proprietà, è un contenitore. Se la disposizione
> è scritta nel file, è una forma.

Ne discende `UiShell`: tre regioni con un nome — la colonna, la testata, il contenuto — nessuna
proprietà di geometria, nessun valore di spazio, direzione, allineamento o larghezza in ingresso.
Quello che riceve sono slot, cioè cosa mettere dentro, mai come disporlo.

E ne discende una regola con un ID e un test:

- **R16** — un pezzo del kit non prende la geometria per proprietà. Nessun `defineProps` di
  `src/renderer/ui/**` dichiara `gap`, `direction`, `align`, `justify`, `width`, `height`, `padding`
  o `margin`. `tests/rules/ui-kit-has-no-geometry` lo impone.

Senza R16 questo documento sarebbe una convenzione da ricordare, e il progetto sa già come vanno a
finire: `.refusal` copiata in due pannelli, trovata dall'audit di
[D016](../delega/D016-correzioni-audit.md) mesi dopo. Una regola tenuta dalla review si rompe in
silenzio, ed è la lezione di [D001](../delega/D001-tooling-e-gate.md).

## Alternative scartate

- **Il telaio in `components/`.** Sarebbe l'unico file di quella cartella che non conosce il gioco,
  e la cartella non ha nessuna regola che glielo impedisca di diventarlo. Il confine di R14 esiste
  perché il kit sia riusabile: un pezzo riusabile messo dalla parte sbagliata smette di esserlo il
  giorno dopo, e nessun gate lo dice.
- **Il telaio come classi CSS globali in `tokens.css`.** Nessuna proprietà da tipizzare, quindi
  nessuna proprietà che possa crescere: il problema sembra risolto. Non lo è — una classe non si
  può verificare, non si può richiedere e non si può rifiutare. È esattamente la forma da cui
  l'ADR 0028 ha tolto le cinque primitive, e rimetterla per il telaio sarebbe rifare il difetto
  nella cartella che esiste per non farlo.
- **Un `UiShell` con `navWidth` come proprietà.** Sembra innocuo e sarebbe la prima delle dodici. La
  larghezza è una decisione del design, presa una volta: sta in un token, dove le altre decisioni
  del design stanno già.
- **Nessuna R16, e la distinzione tenuta a mente.** È ciò che il progetto ha rifiutato tre volte —
  [D001](../delega/D001-tooling-e-gate.md),
  [D021](../delega/D021-un-numero-che-nessuno-conta-non-si-scrive.md),
  [D022](../delega/D022-il-confine-disegnato-e-il-confine-vero.md) — e ogni volta la ragione era la
  stessa: la regola che nessuno impone è la regola che sparisce senza far rumore.

## Conseguenze

- Il kit guadagna una **categoria**, non solo un pezzo: la forma, con il criterio di ammissione
  scritto. Il prossimo telaio — una schermata di dominio con la sua struttura fissa — sa già se ha
  diritto di entrare.
- `UiRow` e `UiStack` restano scartati, e adesso lo sono con un meccanismo invece che con un
  paragrafo: scritti oggi, R16 li rifiuterebbe alla prima proprietà.
- La riga del [registro YAGNI](../roadmap-fette.md) che li elenca resta dov'è, e guadagna il nome
  della regola che li tiene fuori.
- `tests/rules/ui-kit-has-no-geometry` è ⚠️ **parziale e lo dichiara**: legge i nomi delle proprietà
  nel sorgente, quindi un nome inventato per aggirarla — `spacing`, `size` — le sfugge. Prende la
  forma con cui il difetto nasce davvero, che è quella con i nomi consueti.
