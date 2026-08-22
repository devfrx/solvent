# ADR 0034 — Il grafico è una libreria, e la libreria disegna in SVG

- **Stato:** **Accettata** — [D027](../delega/D027-un-grafico-e-una-serie-che-nessuno-tiene.md):
  `apexcharts` è in `dependencies`, `components/shell/NetWorthChart.vue` la monta a mano, e il
  `fill` reso nella finestra vera è `color-mix(in srgb, var(--color-ink) 85%, transparent)` — cioè
  un token, non un colore della libreria
- **Data:** 2026-08-21
- **Aggiornata:** 2026-08-23 — la conseguenza «se un secondo grafico nascesse, quelle venti righe
  sono ciò che si estrae» è stata riscossa, perché il secondo grafico è nato con
  [D034](../delega/D034-le-serie-degli-strumenti.md): il ciclo di vita è
  `components/shell/apex.ts` e il vestito `:deep()` è `components/shell/ChartPanel.vue`, che la
  regola **R23** tiene in un file solo (`tests/rules/chart-dress`). Nello stesso passaggio decade
  un'altra riga di questa intestazione: da [D035](../delega/D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md)
  `apexcharts` **non è più in `dependencies`** — si compila dentro il renderer, e di runtime resta
  solo `zod`. Il corpo non cambia: racconta il giorno in cui è stato scritto
- **Richiesto da:** [ADR 0015](0015-criterio-di-ammissione-delle-dipendenze.md), che pretende un ADR
  per ogni dipendenza nuova

## Contesto

[D027](../delega/D027-un-grafico-e-una-serie-che-nessuno-tiene.md) porta il primo grafico del
gioco. La sua decisione 2 era **libreria o CSS**, e la prima risposta è stata CSS: il canvas di
Claude Design disegna il proprio «Net worth · 30 days» con trenta `<div>` e in tutto quel file non
compare un solo `<svg>`, quindi per _quel_ disegno una dipendenza non serviva. Il grafico in CSS è
stato costruito, provato e guardato nella finestra vera.

**Poi la decisione è stata ribaltata dall'utente**, e questo ADR esiste per registrare cosa costa e
cosa si è scelto di conseguenza. La domanda non è più «serve una libreria», è «quale libreria può
entrare in questo progetto senza disfare quello che c'è».

Perché non è una domanda di gusto: questo renderer ha una regola che i grafici violano per natura.
**R15** ([ADR 0028](0028-il-kit-ui-non-sa-che-gioco-e.md)) dice che nessun colore vive fuori dai
token, e `tests/rules/no-color-literals` la impone. Una libreria di grafici porta la propria
tavolozza e il proprio tema chiaro/scuro: adottarla vuol dire avere **due** sistemi di temi, che è
la forma esatta del difetto A14 — 1.067 righe di CSS morto perché nessun confine diceva dove
finisce lo stile.

## Decisione

**La libreria è [ApexCharts](https://apexcharts.com), e la ragione è il modo in cui disegna.**

ApexCharts rende in **SVG**. Un colore passato come `var(--color-ink)` finisce dentro un attributo
`fill`, e a risolverlo è il browser: i due temi continuano a funzionare da soli, e cambiare tema non
richiede di ridisegnare il grafico. Una libreria a `<canvas>` non può farlo — il canvas non conosce
le variabili CSS — quindi avrebbe preteso di leggere i token con `getComputedStyle` e ridisegnare a
ogni cambio di tema, cioè un secondo meccanismo di temi accanto a quello che c'è.

**Non è una preferenza estetica: è l'unico modo in cui R15 resta vera con una libreria dentro.**

**L'involucro `vue3-apexcharts` è stato installato e poi tolto.** Clona le opzioni con
`JSON.parse(JSON.stringify(…))` a ogni aggiornamento, e `JSON.stringify` **cancella le funzioni**:
i formattatori sparivano, e l'asse scriveva `948627.0` al posto di `948.627,00 €`. Visto succedere
nella finestra vera, poi confermato leggendo il suo sorgente. La libreria si monta a mano in
`onMounted`, si aggiorna in un `watch` e si distrugge in `onBeforeUnmount`: una ventina di righe di
ciclo di vita, e una dipendenza in meno.

### Le tre cose che l'ADR 0015 pretende

| Domanda                                | Risposta                                                                                                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Quale regola o ADR la rende necessaria | Nessuna. È una scelta dell'utente, presa sapendo che il grafico in CSS esisteva e funzionava                                                                                 |
| Cosa scriveremmo a mano al suo posto   | È stato scritto: circa 60 righe fra geometria pura e componente, più i loro test. Quel codice non copriva assi con numeri, valore al passaggio del puntatore, né candlestick |
| L'ADR                                  | Questo                                                                                                                                                                       |

**Il criterio dell'ADR 0015 non la promuoverebbe da solo**, e va detto invece che lasciato
intendere: l'altezza di una barra è una sottrazione e una divisione, quindi la definizione di
«corretto» è ovvia. Ciò che la libreria aggiunge davvero è l'**asse con i suoi numeri** — che è ciò
che rende onesto un asse che non parte da zero — e i tipi di grafico che il progetto non ha ancora:
i candlestick del mercato azionario del blocco C e delle crypto stanno già nel canvas del design.

## Alternative scartate

- **Restare in CSS.** Zero dipendenze, zero ADR, R15 intatta. È stato costruito e funzionava: barre
  in `flex`, altezze in percentuale, i due temi gratis. Non dà assi con i numeri, valore al
  passaggio del puntatore, né candlestick — e senza asse un grafico che non parte da zero non è
  leggibile, è solo una forma.
- **[unovis](https://unovis.dev).** Sulla carta la migliore: rende in SVG e il suo tema è **fatto**
  di variabili CSS, quindi R15 sarebbe stata gratis invece che difesa. Scartata leggendo il suo
  albero: `@unovis/ts` dipende da **three.js**, **leaflet**, **maplibre-gl**, **elkjs**, **dagre**
  e da tutta la famiglia d3. Un motore 3D e due librerie di mappe dentro un idle finanziario per
  disegnare delle barre non passa il criterio dell'ADR 0015, e il fatto che il bundle le
  scuoterebbe via non è una risposta: entrano comunque nel progetto, e ogni `npm ci` le scarica.
- **[Apache ECharts](https://echarts.apache.org).** Il più capace di tutti, e ha un renderer SVG
  opzionale. Scartato per due ragioni: è canvas-first — quindi la strada che rende R15 vera è quella
  secondaria, non quella principale — e i suoi colori passano da `zrender`, che li **parsa** invece
  di scriverli nell'SVG. Un `var(…)` dato in pasto a un parser di colori non è un colore.
- **[Chart.js](https://www.chartjs.org).** Un solo dipendente e molto diffuso, ma disegna solo su
  `<canvas>`: i token andrebbero letti con `getComputedStyle` e il grafico ridisegnato a ogni cambio
  di tema. È il secondo sistema di temi che questo ADR esiste per evitare.
- **[Observable Plot](https://observablehq.com/plot).** SVG, moderno, e i suoi marchi si vestono con
  il CSS. Non ha i candlestick già fatti — si compongono — quindi paga la dipendenza senza dare la
  metà che l'ha giustificata.
- **Tenere anche `vue3-apexcharts`.** Comodo — un tag invece di venti righe di ciclo di vita — e
  rotto per il nostro uso: cancella le funzioni dalle opzioni. È l'unica alternativa scartata di
  questo ADR che è stata **provata e disfatta** invece che valutata.

## Conseguenze

- **Le dipendenze di runtime passano da tre a quattro.** Erano `decimal.js`, `vue-i18n` e `zod`; il
  criterio dell'ADR 0015 aveva morso due volte (`vue-router` e `jsdom` sono rimasti fuori). Questa è
  la prima che entra dopo l'origine, e la prima che entra **senza** che una regola la renda
  necessaria. Il peso nel bundle sta in [qualita.md](../qualita.md) con la data accanto.
- **R15 resta vera, e adesso ha una condizione.** Vale finché il colore della serie si passa come
  `var(…)` e il resto si veste con il CSS. Una libreria futura a `<canvas>` la romperebbe, e questa
  riga è il posto dove quel giorno si torna a leggere.
- **La libreria porta i propri colori, e il CSS li copre.** Le etichette dell'asse nascono con un
  `fill` esadecimale scritto dentro; il blocco `:deep()` di `NetWorthChart.vue` lo riporta nei
  token, e una proprietà CSS batte un attributo di presentazione. È un **override**, non un'assenza:
  quelle classi non sono nostre, e un aggiornamento della libreria può spostarle. Nessun gate lo
  vedrebbe — `no-color-literals` guarda il nostro sorgente, non il DOM che una libreria produce.
- **⚠️ Il tooltip nativo torna, e nessun gate lo vede.** ApexCharts scrive un elemento `<title>`
  dentro l'SVG delle etichette dell'asse, e un `<title>` in SVG **è** un tooltip del browser: appare
  dopo circa un secondo, non si raggiunge con la tastiera, non passa dal design system. È esattamente
  ciò che **R17** ([ADR 0032](0032-le-sovrapposizioni-stanno-nel-livello-superiore.md)) ha tolto con
  [D025](../delega/D025-il-tooltip.md). `tests/rules/no-native-tooltips` non può prenderlo, e lo
  dichiara fra i propri limiti: guarda l'attributo `title` scritto nel sorgente, non un elemento
  iniettato a runtime da una libreria. Sono due, portano lo stesso testo già visibile accanto, e non
  spiegano niente che non si veda — quindi restano, dichiarati qui invece che scoperti dopo.
- **Il grafico è l'unico posto del renderer che monta una libreria a mano.** Il ciclo di vita —
  `onMounted`, `watch`, `onBeforeUnmount` — non esiste in nessun altro componente, ed è il prezzo di
  non usare l'involucro. Se un secondo grafico nascesse, quelle venti righe sono ciò che si estrae.
- **I candlestick non sono stati costruiti.** La libreria li ha, il gioco no: il primo mercato è il
  blocco C della [roadmap](../roadmap-fette.md). Questa dipendenza è entrata per un grafico a barre,
  e il resto è un'opzione aperta — non una promessa mantenuta.
