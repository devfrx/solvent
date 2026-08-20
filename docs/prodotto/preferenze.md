# Preferenze di prodotto

Preferenze permanenti, non richieste una tantum. Valgono finché non le cambi esplicitamente, e
ogni delega che tocca la UI o il modello del denaro deve rispettarle.

Ogni voce ha un **perché** — senza, fra sei mesi sembrerà arbitraria e qualcuno la "semplificherà".

---

## P1 — Il nome è Solvent

**Approvato il 2026-08-19.** Un solo identificatore ovunque: `package.json`, `productName`,
`appId`, `setAppUserModelId`, titolo finestra, nome dei salvataggi, README.

**Perché:** [ADR 0008](../adr/0008-nome-e-identita-del-prodotto.md).
**Come si applica:** D001 lo propaga; `tests/rules/product-identity` lo verifica.

---

## P2 — Lo stile visivo del mockup è approvato

**Approvato il 2026-08-19** sulla base di
[fetta-01-primo-stipendio.html](../design/mockups/fetta-01-primo-stipendio.html).

Le costanti dello stile, da estrarre in token quando nascerà il primo CSS:

| Elemento   | Scelta                                                                |
| ---------- | --------------------------------------------------------------------- |
| Fondo      | scuro profondo, quasi nero, non grigio                                |
| Superfici  | pannelli su due livelli, bordo sottile a basso contrasto              |
| Accento    | verde, usato **solo** per il denaro che entra e per l'azione primaria |
| Allarme    | rosso per il fallimento, ambra per il rischio                         |
| Numeri     | cifre tabulari sempre, ovunque compaia un importo                     |
| Tipografia | di sistema, nessun font caricato                                      |
| Densità    | compatta ma respirata; il saldo è l'elemento più grande dello schermo |

**Perché:** un gioco finanziario si legge per numeri. Cifre tabulari significa che un importo che
sale non fa ballare il resto della riga — è la differenza fra un contatore leggibile e uno
fastidioso. L'accento riservato al denaro in entrata fa sì che il verde voglia dire sempre la
stessa cosa.

**Come si applica:** fatto in D012. I token vivono in un blocco `<style>` non scoped dentro
`App.vue` — l'unico non scoped del progetto — e il resto del CSS sta attaccato al componente che lo
usa, così togliere il componente toglie anche il suo stile. Nessun secondo verde, mai.

Accanto ai token, in quel blocco, vivono le poche **primitive** che più di un componente disegna
allo stesso modo: `.panel`, `.caption`, `.amount`, i due pulsanti, e da
[D016](../delega/D016-correzioni-audit.md) anche `.refusal`, il rifiuto spiegato. Il confine è
quello: una primitiva entra lì quando la disegnano **due** componenti, non prima. `.refusal` ci è
entrata perché l'audit l'ha trovata copiata in due pannelli con il valore di `--danger` ricopiato a
mano in quattro righe di `rgba()` — cambiare il token avrebbe spostato il testo e lasciato indietro
sfondo e bordo. Adesso si derivano dal token con `color-mix`, che è ciò che rende il rosso una cosa
sola anche quando è trasparente.

---

## P3 — La home è cruscotto **e** bancomat

La schermata principale è tutte e due le cose, in quest'ordine: **prima il bancomat**, sotto il
cruscotto. Si vede la carta, il contante, si deposita e si preleva; poi le statistiche vive.

**Perché:** in un idle game le statistiche _sono_ il contenuto — nasconderle dietro un clic toglie
la ragione di riaprire il gioco. Ma il bancomat è il gesto che rende la dualità contanti/carta una
scelta invece che un'etichetta, e un gesto sepolto si fa meno.

**Il rischio, e come è chiuso:** il cruscotto si mangia sempre il bancomat, perché le statistiche
crescono e il bancomat no. Quindi il cruscotto della home ha un **tetto di sei riquadri**,
verificato da un test. Il settimo non si aggiunge: sostituisce, oppure va nella schermata
Statistiche. Vedi [ADR 0018](../adr/0018-la-home-e-un-atm.md).

**Come si applica:** fatto in [D015](../delega/D015-home-bancomat.md). Il bancomat sta in alto e
non si comprime; la schermata Statistiche esiste dal primo giorno, altrimenti il settimo riquadro
non ha dove andare. I riquadri sono **cinque** e il tetto è sei: un posto libero, perché una quota
riempita con un numero inventato non è un tetto. A contarli è `tests/rules/home-tiles`.

---

## P4 — Contanti e carta sono due strumenti con scopi diversi

Entrambi si possono usare **ovunque**. Non ci sono muri: ci sono convenienze, costi e conseguenze
diverse. Il giocatore sceglie sempre, e la scelta non è mai ovvia.

|                                     | Contanti                                       | Carta                                      |
| ----------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| Tracciabilità                       | nessuna                                        | totale                                     |
| Black market                        | **conveniente**: prezzo pieno, poco calore     | accettata, ma alza molto il calore         |
| Interessi                           | nessuno                                        | sì, e costruiscono il punteggio di credito |
| Investimenti, prestiti, immobiliare | possibile ma penalizzato o limitato            | **la via naturale**                        |
| Capacità                            | limitata: il contante occupa spazio nel caveau | illimitata                                 |
| Rischio                             | furto, perquisizione, perdita                  | blocco del conto, commissioni              |

**Perché:** è la spina dorsale dell'intero gioco, non una preferenza estetica. Ogni dominio —
black market, prestiti, casinò, immobiliare — diventa una scelta invece che un pulsante, perché
c'è sempre un modo veloce e sporco e un modo lento e pulito. Senza questa dualità, tutti i domini
collassano in "premi per guadagnare". Vedi [ADR 0017](../adr/0017-il-denaro-e-plurale.md).

**Come si applica:** nessun dominio può assumere un unico strumento di pagamento. Ogni azione che
muove denaro dichiara quali pool accetta e con quale modificatore. Il rifiuto per strumento
sbagliato è un errore tipizzato, non un pulsante disabilitato senza spiegazione.

---

## P5 — La carta è un oggetto 3D ruotabile

La carta di credito è un oggetto vero: si vede in prospettiva, si può girare con il mouse, ha un
fronte e un retro.

**Perché:** è l'unico oggetto fisico del gioco che il giocatore possiede davvero, e la home gli
ruota intorno. Renderla un rettangolo piatto sprecherebbe il gesto centrale dell'interfaccia. È
anche l'unico punto in cui il gioco può permettersi un vezzo visivo senza rallentare nulla.

**Come si applica:**

- CSS 3D puro (`transform-style: preserve-3d`, `perspective`). Nessuna libreria: non supererebbe
  il criterio dell'[ADR 0015](../adr/0015-criterio-di-ammissione-delle-dipendenze.md).
- Rotazione al trascinamento, con inerzia leggera e ritorno morbido alla posizione di riposo.
- **Il retro non è decorativo:** ci vivono le informazioni secondarie — limite, plafond usato,
  scadenza, punteggio di credito. Girare la carta è un'azione utile, non un gioco.
- Rispetta `prefers-reduced-motion`: la rotazione resta possibile, l'inerzia e l'animazione di
  ritorno no.
- Il livello che cresce (o l'era di prestige) cambia il materiale della carta: standard, oro,
  nero. È il progresso reso visibile su un oggetto invece che su una barra.

**Fatto in [D015](../delega/D015-home-bancomat.md)**, con due correzioni.

**Il retro** non porta plafond, limite e punteggio di credito, perché nella fetta 01 la carta non
presta soldi e nessuno ha un punteggio — mostrarli sarebbe stato inventarli. Porta le tre
dichiarazioni vere dello strumento, lette da `POOLS`: tracciabilità, capienza, commissione per
operazione. Girare la carta serve, che è ciò che questa preferenza chiede; i tre numeri arrivano
con l'era che li crea.

**L'inerzia non è stata costruita**, e fino a [D016](../delega/D016-correzioni-audit.md) nessuno
l'aveva scritto: la riga qui sopra la prometteva e il codice non la conteneva, che è la forma di
disallineamento più difficile da vedere — un documento che descrive una cosa in più, non una in
meno. Al rilascio la carta va **dritta** alla posizione di riposo, con una transizione CSS che
rispetta `prefers-reduced-motion`. Il ritorno morbido c'è; ciò che manca è la velocità che
continua dopo che il dito si è alzato. Sono venti righe di matematica in `rotation.ts` per un
vezzo, e il gesto funziona già: il grilletto sta nel [registro YAGNI](../roadmap-fette.md), ed è
una fetta che tocchi la carta per un'altra ragione.

---

## Come si aggiunge una preferenza

Una preferenza entra qui quando è **permanente** e **vincola le scelte future**. Se è una
richiesta per una schermata sola, non è una preferenza: è una specifica, e va nella delega.

Ogni voce: cosa, perché, come si applica. Il perché non è opzionale.
