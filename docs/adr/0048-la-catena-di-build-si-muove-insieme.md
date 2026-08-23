# ADR 0048 — La catena di build si muove insieme

- **Stato:** **Accettata** — `vite` è dichiarato `^7.3.6` in `package.json`, `npm ci` e
  `npm install` girano **senza flag**, e `npm ls vite` non riporta nessun `invalid`. Provata
  cancellando `node_modules` e reinstallando da zero: `verify` e `verify:release` verdi
- **Data:** 2026-08-23
- **Richiesto da:** [ADR 0015](0015-criterio-di-ammissione-delle-dipendenze.md), che pretende che
  una dipendenza dichiari cosa costa

## Contesto

Per due mesi `npm install` non ha funzionato in questa repo. L'unico comando che installava era
`npm ci --legacy-peer-deps`, ed è stato scritto in cinque deleghe come se fosse una proprietà del
progetto invece che un difetto: la correzione 8 di [D023](../delega/D023-il-design-system.md), poi di
nuovo in [D027](../delega/D027-un-grafico-e-una-serie-che-nessuno-tiene.md), in
[D035](../delega/D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md) e in
[D038](../delega/D038-cio-che-si-preme-e-cio-che-scorre.md), che l'ha registrata come «seconda
ricorrenza».

**La causa è una sola riga, e si misura.** Il progetto dichiarava `vite@^8.2.1`; di tutti i
pacchetti che dipendono da Vite, **uno solo** rifiuta la 8:

| Pacchetto              | Range dichiarato                             | vite 7 | vite 8 |
| ---------------------- | -------------------------------------------- | ------ | ------ |
| `electron-vite@5.0.0`  | `^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0`             | sì     | **no** |
| `vitest@4.1.11`        | `^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0`             | sì     | sì     |
| `@vitejs/plugin-vue@6` | `^5.0.0 \|\| ^6.0.0 \|\| ^7.0.0 \|\| ^8.0.0` | sì     | sì     |

`electron-vite@5.0.0` è l'ultima **stabile**: `latest` punta lì, e la sola versione che accetta
`^8.0.0` è `6.0.0-beta.1`.

**Il flag non era gratis, e il suo prezzo era già stato pagato senza collegarlo alla causa.**
`--legacy-peer-deps` non spegne un controllo: spegne la **risoluzione** dei peer, quindi npm smette
di installare i pacchetti che le dipendenze si aspettano di trovare. Da lì `@vue/devtools-api` e
`vue-eslint-parser` sono stati aggiunti a mano alle `devDependencies` — D023 li registra come «senza
cui il build non compila» e «senza cui il lint non parte» — mentre nessuno dei due è importato da una
riga di questo progetto: sono dipendenze di `pinia`, `vue-i18n` ed `eslint-plugin-vue`. Erano
sintomi, catalogati come requisiti.

## Decisione

**La catena di build si muove insieme, alla versione che i suoi pezzi dichiarano di reggere.** In
concreto, oggi: `vite` resta alla **7** finché `electron-vite` non pubblica una stabile che accetta
la 8.

Ne discendono tre cose, tutte verificabili con un comando:

1. **Nessun flag.** `npm ci` e `npm install` girano nudi. Se un giorno servisse di nuovo un flag per
   installare, è il segnale che questa decisione è stata violata, non una scomodità da aggirare.
2. **Nessun `overrides`.** Forzare la risoluzione avrebbe tenuto Vite 8 dichiarando a npm una
   compatibilità che nessuno dei due pacchetti afferma. È lo stesso silenzio del flag, scritto in un
   posto più rispettabile.
3. **Si dichiara ciò che si importa.** `@vue/devtools-api` e `vue-eslint-parser` sono usciti dalle
   `devDependencies`: nessun file del progetto li nomina, e a installarli è npm risolvendo le
   dipendenze di chi li usa davvero.

**Il grilletto per tornare alla 8 è scritto**, e sta nel [registro YAGNI](../roadmap-fette.md):
`electron-vite` con una **stabile** che dichiari `vite ^8`. Non la beta.

## Alternative scartate

- **`electron-vite@6.0.0-beta.1`.** Accetta `^6.0.0 || ^7.0.0 || ^8.0.0`, quindi avrebbe tenuto Vite
  8 senza flag: è l'alternativa seria, ed è stata scartata per cosa è, non per cosa fa. Una beta come
  strumento di build dell'intero progetto è debito futuro per costruzione — l'API può cambiare prima
  della stabile, e quel giorno si migra una seconda volta. L'[ADR 0015](0015-criterio-di-ammissione-delle-dipendenze.md)
  chiede cosa costa una dipendenza: qui il costo è una migrazione che si sa già di dover rifare.
- **`overrides` in `package.json`.** Vedi il punto 2 della decisione: non rimuove la contraddizione,
  la rende invisibile a npm. Con una differenza rispetto al flag che la rende peggiore, non
  migliore: sembra una decisione presa.
- **Tenere `--legacy-peer-deps` e documentarlo meglio.** È lo stato di partenza, ed è stato
  documentato bene quattro volte in quattro deleghe. Documentare un difetto non lo trasforma in una
  scelta.

## Conseguenze

**Il minificatore cambia nome, e la riga che lo dichiara resta.** `minify: 'oxc'` era una
conseguenza di Vite 8, non una preferenza: la correzione 2 di
[D035](../delega/D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md) l'aveva scelto perché «Vite 8
non porta più esbuild con sé, e chiederlo fa fallire `build`». Su Vite 7 esbuild è una dipendenza
diretta di Vite, quindi `electron.vite.config.ts` dichiara `minify: 'esbuild'`. Il principio di
quella riga — **dire chi minifica invece di ereditare un default** — è esattamente quello di prima; a
cambiare è la risposta, e su Vite 7 `'oxc'` non è nemmeno un valore ammesso dal tipo.

**I pesi del renderer non sono confrontabili con quelli di ieri**, e la loro tabella in
[qualita.md](../qualita.md) lo dichiara: sono cambiati sia il bundler — Vite 8 usa rolldown, la 7
rollup — sia il minificatore. Confrontare le due colonne sarebbe l'errore che quella pagina mette in
guardia dal fare.

**Chi legge `package.json` vedrà una versione più vecchia di quella pubblicata**, e questo documento
esiste perché non la «corregga». Alzarla senza alzare `electron-vite` riporta il flag, e con lui i
due pacchetti dichiarati a mano: è successo, e ci sono volute cinque deleghe per collegare il
sintomo alla causa.
