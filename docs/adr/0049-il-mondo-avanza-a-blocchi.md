# ADR 0049 — Il mondo avanza a blocchi, e il blocco è dell'operazione

- **Stato:** **Accettata** — [D040](../delega/D040-il-recupero-avanza-a-blocchi.md): `Game.advance`
  cammina l'intervallo in blocchi di `BALANCE.ADVANCE_BLOCK`, e **R25**
  (`tests/rules/one-way-to-advance`) continua a tenere una sola via. Rotta di proposito: un ciclo
  che salta l'ultimo blocco parziale fa cadere sei test, fra cui i due che contano il resto
- **Data:** 2026-08-23
- **Non tocca:** l'[ADR 0009](0009-passo-fisso-e-tipi-branded-per-il-tempo.md), che ne esce
  rafforzato — «lo stesso codice del tempo reale» diventa vero **più** volte, non meno
- **Estende:** l'[ADR 0043](0043-il-tempo-che-avanza-e-un-operazione-del-gioco.md), che ha reso
  `Game.advance` l'unica via per far passare il tempo

## Contesto

L'[ADR 0043](0043-il-tempo-che-avanza-e-un-operazione-del-gioco.md) ha stabilito **chi** fa passare
il tempo. Restava aperta una domanda che nessuno aveva posto: **a quale grana**.

Fino a D040 la risposta implicita era «tutto in una volta». Il recupero all'avvio arrivava a
`advance` con tutti i tick arretrati, e il saldo finale era corretto — ma la storia in mezzo non era
mai esistita. Una soglia attraversata e rientrata durante l'assenza non scattava: una margin call
che parte alla seconda ora e si risana alla sesta, il calore che sfonda e ridiscende, un'attività
che va sotto il fido e risale. La [visione](../prodotto/visione.md) chiama questa la differenza fra
un mondo che va avanti e un mondo che salta, e la promuove a legge: _«il mondo va avanti **anche
contro di te**» è vero solo se il recupero avanza a blocchi abbastanza corti da vedere una soglia._

Che il difetto fosse strutturale e non cosmetico lo dimostra un compenso già presente nel codice: il
`tick` del reddito **non chiede al Ledger e incassa il rifiuto** — calcola prima quanto ci sta — e il
suo commento dice perché, cioè che una transazione da tutta la notte verrebbe rifiutata intera
(ADR 0019) e chi torna dopo un'assenza tornerebbe con zero. Il passo unico aveva già costretto una
riga a difendersi da sé stesso.

## Decisione

**Il blocco è una proprietà di `Game.advance`, non del chiamante.** `advance(elapsed)` cammina
l'intervallo in blocchi di al più `ADVANCE_BLOCK` tick, ripetendo la sequenza — sistemi, poi cronaca
— una volta per blocco.

`ADVANCE_BLOCK` è **un giorno di gioco**, e vive in `balance/constants.ts` come ogni numero che
decide come si gioca (R04). Il giorno è la soglia più stretta che questo gioco nomina: un affitto,
un interesse, una scadenza maturano per giorni, mai per frazioni di giorno.

**Il resto non si perde.** L'ultimo blocco è parziale e viene eseguito comunque: buttarlo costerebbe
fino a un giorno di gioco di reddito a ogni recupero, che è il genere di ammanco che nessuno nota
senza contare i tick — lo stesso difetto che `stepOf` evita restituendo `pending`.

## Alternative scartate

- **Il ciclo in `recover()`, cioè nel chiamante.** Cinquanta righe in meno, e il difetto che
  l'ADR 0043 esiste per impedire: sarebbe un **secondo** posto che sa come si fa passare il tempo.
  Ogni chiamante nuovo — il calendario dell'[ADR 0023](0023-il-tempo-di-gioco-e-un-sistema-di-dominio.md),
  un cheat che salta un'ora, il salvataggio a cadenza — potrebbe dimenticarsene in silenzio, e R25
  resterebbe **verde** mentre la sua ragione viene aggirata. Una regola che passa mentre il difetto
  che impedisce è tornato è peggio di nessuna regola.
- **Un blocco di un tick.** La grana più fine possibile, e il tetto se lo rimangia: il tetto esiste
  perché _«riaprire il gioco dopo giorni non deve bloccare l'avvio per minuti»_. Con 7.300 blocchi
  invece di 365 il costo si moltiplica per venti senza che nessuna soglia del gioco lo chieda —
  nessuna matura sotto il giorno.
- **Un blocco parametrico per chiamante.** Flessibilità per un caso d'uso che non esiste: oggi
  chiama `recover()` e il loop del frame, e il secondo passa uno o due tick. Sarebbe l'astrazione
  speculativa che l'[ADR 0014](0014-una-fetta-verticale-alla-volta.md) vieta.
- **Simulare le soglie senza eseguire i tick** — una formula che calcoli dove il mondo sarebbe
  finito. È esattamente la «formula offline separata» che l'ADR 0009 vieta, e la fonte classica di
  exploit negli idle: due strade che calcolano lo stesso numero prima o poi divergono, e quella
  meno guardata diventa il bug.

## Conseguenze

**Il tempo reale non cambia.** Un frame porta uno o due tick contro i venti di un blocco, quindi il
ciclo gira una volta e la sequenza è quella di prima. Questa decisione riguarda il recupero e chi
verrà dopo, non la partita in corso.

**Costa il numero dei blocchi, non la loro durata.** `income.tick` è O(1) in `elapsed` — calcola
tasso × elapsed ed emette **una** transazione — quindi N blocchi sono N transazioni e N emissioni
sul Bus. Misurato: un recupero al tetto pieno sono 365 blocchi in **meno di tre millisecondi**, e il
numero con la sua data sta in [qualita.md](../qualita.md). Va rimisurato quando i sistemi
registrati cambiano di numero.

**Un recupero produce molti campioni, e nessuno è finto.** Il commento di `sampleOf` in
`runtime/loop.ts` sosteneva il contrario, e aveva ragione: senza blocchi i valori intermedi non
esistevano, e disegnarli sarebbe stato inventare numeri che nessuno aveva avuto. Adesso esistono —
ognuno è stato il patrimonio del giocatore per un giorno di gioco — e i grafici disegnano la salita
invece del salto. La regola non è cambiata; è cambiato quali numeri il giocatore ha avuto.

**`incomeThatFits` perde la ragione che lo rendeva indispensabile, e resta.** Con i blocchi la
transazione gigante non esiste più e il caveau si riempie un giorno alla volta. Il ramo continua a
servire al tempo reale, quindi non si tocca: questa decisione toglie una pressione, non un
meccanismo.

**`withheld` descrive l'ultimo blocco.** È un mirror del presente — `income/types.ts` dichiara
«descrive l'ultimo tick, non la partita» — e dopo un recupero risponde a «i soldi stanno entrando
adesso?», non a «quanto ho perso stanotte». La seconda domanda ha una risposta sua, ed è il tempo
che il tetto ha scartato.
