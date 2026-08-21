# ADR 0031 — Il tema si sceglie, e non si ricorda

- **Stato:** **Accettata** — [D024](../delega/D024-il-telaio.md): `src/renderer/ui/theme.ts` e
  l'interruttore nel piede della colonna. Premuto nei due versi su tutte e due le schermate alla
  chiusura della delega, con `data-theme` e i colori calcolati misurati a ogni clic
- **Data:** 2026-08-21

## Contesto

[D023](../delega/D023-il-design-system.md) ha spedito **due** temi completi in una dichiarazione
sola, con `light-dark()`, e ha lasciato la scelta al sistema operativo. La ragione era buona e sta
in [P2](../prodotto/preferenze.md): due temi scelti da `prefers-color-scheme` sono due temi vivi,
mentre due temi con un interruttore che nessuno ha ancora scritto sarebbero un tema e mezzo.

L'interruttore è finito nel [registro YAGNI](../roadmap-fette.md) con un grilletto: le impostazioni.

Il grilletto non è scattato, e il problema sì. Su una macchina il sistema operativo sceglie **una**
volta, e da quel momento chi sviluppa vede sempre lo stesso tema. La definizione di fatto di D023
chiedeva apposta di guardarli tutti e due, e quella spunta ha trovato un difetto al primo colpo — un
pulsante indistinguibile dall'altro nel tema scuro, che nessun gate poteva vedere. Ma è una spunta:
si paga una volta, per delega, se qualcuno si ricorda di cambiare l'impostazione di Windows e di
riavviare.

`data-theme` sull'elemento radice esiste già in `tokens.css` dal giorno di D023, ed è lo scavalco
previsto. Finora nessuno lo scrive.

## Decisione

Un interruttore nel piede della colonna scrive `data-theme` su `:root`, e la scelta **dura quanto la
finestra**. Alla partita successiva torna a decidere `prefers-color-scheme`.

Due posizioni, non tre: «chiaro» e «scuro». Il terzo stato — «come il sistema» — è ciò che si ottiene
riaprendo, e un controllo a tre posizioni per una scelta che non sopravvive alla chiusura spiega se
stesso male.

Il meccanismo vive in `src/renderer/ui/theme.ts`: sa quale tema è attivo e come si cambia, e
nient'altro. Non conosce il gioco, non conosce le parole, non conosce lo store — R14 vale anche qui,
e la parola scritta sul pulsante gliela passa `components/`, già tradotta.

## Perché non si ricorda

Ricordarlo vuol dire scriverlo da qualche parte, e questo progetto ha **un** posto dove si scrive:
il salvataggio, che è del processo main ([ADR 0004](0004-il-main-e-proprietario-del-contratto-di-salvataggio.md),
[D009](../delega/D009-persistenza-main.md)).

Il tema non è stato di gioco. Metterlo nel salvataggio significherebbe un campo nello schema, una
migrazione, e un validatore che rifiuta un salvataggio perché il colore del fondo non gli piace —
per una cosa che non fa parte della partita. Il primo giocatore che copiasse il proprio salvataggio
su un'altra macchina si porterebbe dietro anche il tema, che è il segnale più chiaro che quel dato è
nel posto sbagliato.

L'alternativa sarebbe un **secondo** meccanismo di archiviazione accanto al primo, e un secondo
meccanismo è una decisione strutturale: vuole il suo ADR, il suo confine e il suo test. Le
impostazioni lo porteranno, insieme alla lingua e a tutto il resto che oggi è un valore di codice. Il
grilletto ce l'hanno già.

Fino ad allora: si sceglie, e non si ricorda. È meno di quanto il canvas disegna, e più di quanto
c'è oggi.

## Alternative scartate

- **Restare al solo `prefers-color-scheme`.** È ciò che c'è, e sulla carta è la scelta più pulita.
  In pratica significa che su ogni macchina uno dei due temi si guarda solo cambiando
  un'impostazione del sistema operativo e riavviando — cioè quasi mai. Due temi spediti e uno
  guardato è come sono nate le 1.067 righe di CSS morto del progetto precedente (difetto A14).
- **Salvare la scelta nel file di salvataggio.** Un campo di preferenza dentro lo stato del gioco,
  con la sua migrazione. Il costo è permanente e la cosa salvata non è del gioco.
- **`localStorage`.** Due righe, e in cambio un secondo posto in cui il progetto conserva qualcosa,
  senza confine, senza schema e senza test. Il salvataggio ha tre difese e un validatore perché
  qualcuno le ha scritte; una seconda archiviazione le avrebbe tutte da rifare, oppure nessuna.
- **Aspettare le impostazioni.** È la scelta che il registro YAGNI aveva preso, ed era giusta finché
  il costo di non avere l'interruttore era zero. Non è zero: è una spunta della definizione di fatto
  che si paga a mano in ogni delega che tocca la UI, e che a D023 ha già trovato un difetto vero.

## Conseguenze

- [P2](../prodotto/preferenze.md) cambia di una riga: il sistema operativo continua a decidere, e il
  giocatore può scavalcarlo per la sessione.
- La riga «l'interruttore del tema» **esce** dal [registro YAGNI](../roadmap-fette.md), e al suo
  posto ne entra una più stretta: _il tema che si ricorda_, con lo stesso grilletto di prima.
- Nessuna dipendenza nuova, nessuna archiviazione nuova, nessun campo nello schema del salvataggio:
  l'[ADR 0015](0015-criterio-di-ammissione-delle-dipendenze.md) non viene nemmeno interrogato.
- La spunta «guardate a occhio nei due temi» smette di costare un riavvio e comincia a costare un
  clic. È il vero motivo per cui questa decisione vale la pena adesso.
- `theme.ts` espone due funzioni pure — quale tema parte, e qual è l'altro — e sono le uniche che un
  test può guardare senza un DOM. Il resto tocca `document`, e questo progetto ha rifiutato jsdom
  due volte: resta verificato a occhio, e la definizione di fatto lo chiede.
