# ADR 0041 — La rappresentazione del denaro è dichiarata come la sua precisione

- **Stato:** **Accettata** — [D035](../delega/D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md),
  con il rosso che l'ha dimostrata: **INV-24** in `tests/save/kernel-roundtrip`, che prima della
  dichiarazione vedeva `parseEnvelope` rifiutare un saldo di 1e21 € con `error.save.invalid`
- **Data:** 2026-08-22
- **Estende:** [ADR 0026](0026-la-precisione-del-denaro-e-dichiarata.md), di cui è la seconda metà
- **Origine:** l'audit dell'intera codebase del 2026-08-22, reperto sulla scala

## Contesto

L'[ADR 0026](0026-la-precisione-del-denaro-e-dichiarata.md) porta nel titolo la frase «la precisione
del denaro è dichiarata, **non ereditata**», e l'ha applicata a una riga di decimal.js: `precision`,
lasciata al valore predefinito da chiunque non la scriva.

Quella libreria ne ha una **seconda**, altrettanto decisiva e rimasta ereditata. `toExpPos` vale 21:
da 1e21 in su `toString()` non restituisce più la forma decimale piena ma `1e+21`. Il regex di
`main/save/schema.ts` accetta solo la prima, quindi **il salvataggio fallisce** — e fallisce in
scrittura, prima che il disco venga toccato:

```
card serializzata come: 1e+21
parseEnvelope -> { ok: false, error: { code: 'error.save.invalid',
                   path: 'payload.ledger.balances.card' } }
```

A 1e20 lo stesso giro passa. La soglia è esattamente 1e21, e sotto quella cifra nessun test la
poteva incontrare: la suite non aveva un saldo di quella taglia.

**Non è una deriva, è un arresto.** `error.save.invalid` manda la partita in `failed` con fase
`saving`, e da lì — per la correzione 13 di [D011](../delega/D011-runtime-e-store.md) — la finestra
**non si chiude**. Riprovare fallisce in modo deterministico; l'unica uscita è perdere la partita.

Due cose rendono il difetto più grave di quanto la sua irraggiungibilità suggerisca. La prima è che
la [visione](../prodotto/visione.md) dichiara un bersaglio di scala di ~1e30 €, e nessun documento
sapeva che fosse irraggiungibile. La seconda è che l'ADR 0026 **certifica come misurata** una soglia
di 1e37: vera per l'aritmetica, falsa per ciò che attraversa il disco.

## Decisione

La soglia di notazione si dichiara accanto alla precisione, nei **due** versi, e passa allo stesso
`Decimal.set` in `contracts/money.ts`:

```ts
const NOTATION_EXPONENT = SIGNIFICANT_DIGITS

Decimal.set({
  precision: SIGNIFICANT_DIGITS,
  toExpPos: NOTATION_EXPONENT,
  toExpNeg: -NOTATION_EXPONENT
})
```

**Derivata dalla precisione, non scelta a parte.** Non ha senso scrivere in forma esponenziale un
importo che il progetto sa ancora rappresentare per intero, e così le due soglie coincidono per
costruzione: a 1e40 `transfer()` smette di sommare a zero, ed è esattamente lì che la forma decimale
piena finisce. Un numero solo governa tutte e due, e non possono divergere aggiornando una sola.

**Il verso negativo si dichiara insieme all'altro** anche se oggi non morde. `toExpNeg = -7` è lo
stesso default ereditato, e non morde solo perché tutto arrotonda ai centesimi — cioè per una
proprietà che vale adesso e che nessuna regola impone. Pinnarne uno solo lascerebbe in piedi lo
stesso difetto con l'altro segno, in un file che dichiara di averlo risolto.

## Conseguenze

- **INV-24**: un saldo attraversa il confine di persistenza in forma decimale piena, a qualunque
  scala il gioco arrivi. La verifica gira in `tests/save/kernel-roundtrip`, dove c'era già la
  domanda «lo schema accetta ciò che il kernel produce davvero», posta a una scala che nessun
  payload scritto a mano raggiunge.
- **Il salvataggio non cambia forma.** `SAVE_VERSION` resta 1, nessuna migrazione: cambia **come si
  scrive** un importo, non quali campi esistono. Un salvataggio scritto prima si rilegge senza
  toccarlo, perché `fromString` accetta già tutte e due le forme.
- **Il bersaglio della visione è raggiungibile**, e adesso è misurato invece che supposto: 1e30 e
  1e37 passano `parseEnvelope`.
- **Resta il confine di presentazione**, che è un'altra cosa e non la risolve questo ADR:
  `toDisplayNumber` converte in `number`, cioè in float64, e da ~1e14 € gli importi **a schermo**
  perdono il centesimo mentre il Ledger resta in equilibrio. È una decisione di gioco prima che di
  codice, ed è rimandata: sta in _Fuori scope_ di
  [D035](../delega/D035-cio-che-non-si-dichiara-lo-sceglie-un-altro.md).

## Alternative scartate

**Allargare il regex di `schema.ts` per accettare la forma esponenziale.** Corregge il sintomo e
lascia due rappresentazioni dello stesso importo sul disco, più un confine che accetta una forma che
il resto del progetto non sa produrre di proposito. Il posto in cui si decide come un importo si
scrive è il file che lo fabbrica, non quello che lo rilegge.

**Alzare `toExpPos` a un numero grande e basta** — 9e15, il massimo che decimal.js accetta. Toglie
il difetto e rimette in piedi la sua causa: un numero che nessuno ha scelto, slegato dalla
precisione, libero di raccontare che il progetto sa rappresentare per intero importi che non sa
nemmeno sommare.
