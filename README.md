# Solvent

Idle/tycoon finanziario per desktop: Electron, Vue 3, TypeScript, Pinia, Vitest. Il gioco ruota
attorno a una tensione sola — **contanti contro carta**, anonimi ma limitati contro tracciabili ma
illimitati. Si guadagna in contanti, si deposita al bancomat pagando la commissione, si compra con
la carta.

    npm ci           # senza flag: la catena di build è consistente (ADR 0048)
    npm run dev      # al primo avvio Electron scarica il proprio binario da sé
    npm run verify   # typecheck, lint, format:check, test — se è rosso, non è finito

## Aggiungere un sistema

1. una cartella sotto `src/core/domains/<nome>/`: `rules.ts` sono funzioni pure, `system.ts`
   orchestra, `types.ts` dichiara lo stato che finisce nel salvataggio
2. **una riga** in `src/renderer/runtime/createGame.ts`, l'unico posto che registra un sistema
3. le chiavi tradotte in `i18n/it.ts` **e** in `en.ts`, o il test di parità è rosso
4. il denaro si muove solo con `Ledger.transaction`, e ogni transazione somma a zero

Un dominio senza stato non è un sistema e non si registra: `atm/` è due comandi e basta.

La mappa dei documenti è [docs/README.md](docs/README.md); a che punto siamo lo dice il
[passaggio di consegne](docs/delega/PASSAGGIO-DI-CONSEGNE.md).
