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

## P2 — Lo stile visivo viene dal design system

**Approvato il 2026-08-20** sulla base del canvas di Claude Design consegnato dall'utente, e
**sostituisce** la versione approvata il 2026-08-19 sul
[mockup della fetta 01](../design/mockups/fetta-01-primo-stipendio.html). Il mockup resta al suo
posto: è il documento che ha fatto approvare la **forma** della home, e quella non cambia.

| Elemento    | Scelta                                                                         |
| ----------- | ------------------------------------------------------------------------------ |
| Temi        | due, completi: chiaro caldo predefinito, scuro. Sceglie il sistema operativo   |
| Fondo       | carta calda nel chiaro, quasi nero caldo nello scuro — mai grigio neutro       |
| Superfici   | quattro livelli — incassata, fondo, superficie, rialzata — con bordo sottile   |
| Accento     | **inchiostro**: il colore del testo, non un colore acceso                      |
| Significato | verde guadagno, rosso perdita, ambra rischio. Un colore per ogni strumento     |
| Allarme     | rosso per il fallimento, ambra per il rischio                                  |
| Numeri      | cifre tabulari sempre, ovunque compaia un importo                              |
| Tipografia  | **due caratteri caricati**: mono per ogni cifra e etichetta, sans per la prosa |
| Densità     | compatta ma respirata; il numero che comanda è l'elemento più grande           |

### Cosa è cambiato rispetto al 2026-08-19, e perché

Tre punti, e vale la pena vederli in chiaro invece di scoprirli leggendo il CSS.

- **Il fondo non è più solo scuro.** Il design nasce chiaro e caldo, e porta lo scuro completo
  accanto. Non si sceglie fra i due a mano: decide `prefers-color-scheme`, quindi nessuno dei due è
  codice morto. Invertire il predefinito è una riga, il giorno in cui si volesse.
- **L'accento non è più verde.** Era verde e riservato al denaro in entrata, che è una buona regola;
  il design la rende più forte togliendo del tutto il colore all'azione. Il verde adesso vuol dire
  **solo** guadagno, in ogni punto dello schermo, e l'azione primaria è inchiostro su carta. Un
  colore che significa una cosa sola è ciò che P2 voleva già.
- **I caratteri adesso si caricano, e sono due.** Era «nessun font caricato», e il costo era la
  ragione. Il design ne chiede due con due mestieri distinti, e il tabulare — che P2 chiedeva già —
  un carattere di sistema non lo garantisce. Stanno nel bundle, non in rete: la pagina resta tutta
  locale. Il ragionamento intero, con le alternative scartate, è
  nell'[ADR 0029](../adr/0029-due-caratteri-e-stanno-nel-bundle.md).

**Perché:** un gioco finanziario si legge per numeri. Cifre tabulari significa che un importo che
sale non fa ballare il resto della riga. E i colori portano significato invece che umore: se il
verde è insieme «guadagno» e «premi qui», il giocatore impara due cose da un segnale solo.

**Come si applica:** [D023](../delega/D023-il-design-system.md). I token e le primitive escono dal
blocco non scoped di `App.vue` — che sparisce — ed entrano in `src/renderer/ui/`, un livello che non
conosce il gioco ([ADR 0028](../adr/0028-il-kit-ui-non-sa-che-gioco-e.md)). Il confine non è più una
riga di questo documento: lo tengono due regole con un test, **R14** e **R15**.

La regola che stava qui — «una primitiva entra nel blocco quando la disegnano **due** componenti» —
esce insieme al blocco. Era buona e ha funzionato finché è stata guardata: l'audit di
[D016](../delega/D016-correzioni-audit.md) ha trovato `.refusal` copiata in due pannelli con il
valore di `--danger` ricopiato a mano in quattro righe di `rgba()`. Il criterio resta lo stesso — un
pezzo entra nel kit quando lo disegnano due componenti — ma adesso ciò che impedisce di aggirarlo è
R15, non l'attenzione di chi rilegge.

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
- Il livello che cresce cambia il materiale della carta: standard, oro, nero. È il progresso reso
  visibile su un oggetto invece che su una barra. Cosa lo faccia crescere è una domanda aperta —
  non il prestige, che la visione ha tolto.

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
