import type { LedgerError } from './ledger'
import type { Money } from './money'
import type { Result } from './result'

/**
 * D029 · ADR 0036 — il vocabolario dei cheat di sviluppo. Qui ci sono solo i tipi; il registro che
 * li tiene è `kernel/Cheats.ts`, e chi li dichiara è ogni pezzo che ne ha (R20).
 *
 * **Perché nel core e non in un angolo del renderer.** Un cheat che scrivesse i saldi da fuori
 * sarebbe il difetto A05 rimesso in piedi con una buona scusa — «comodità di debug» è la frase
 * esatta con cui [rischi.md](../../../docs/rischi.md) descrive il modo in cui quel difetto torna.
 * Un cheat qui dentro non ha più poteri di un comando di gioco: passa dal Ledger, somma a zero,
 * rispetta le capienze e finisce nel registro delle operazioni con la propria ragione. Ciò che
 * salta è la **fatica**, non la regola.
 */

/**
 * L'identificatore di un cheat, ed è una chiave i18n tipizzata come `Reason`: il pannello traduce
 * un codice, non riceve una frase.
 *
 * È un'unione centrale e ha un prezzo dichiarato — un cheat nuovo si scrive in due posti, qui e nel
 * proprio dominio. Il prezzo compra due cose che una stringa libera non darebbe: nessun cheat può
 * esistere senza etichetta in tutte e due le lingue (`Dictionary` è un `Record` totale), e un id
 * scritto male non compila invece di comparire come pulsante muto. È lo stesso baratto di `Reason`,
 * e la ragione per cui vale la pena qui è che un pannello di cheat è **fatto** di etichette.
 */
export type CheatId =
  // Il denaro. Li dichiara il kernel, perché il denaro è suo: nessun dominio lo crea dal nulla
  // tranne il reddito, e nemmeno lui lo fa fuori dal Ledger (ADR 0003).
  | 'cheat.ledger.grant_cash'
  | 'cheat.ledger.grant_card'
  | 'cheat.ledger.drain_cash'
  | 'cheat.ledger.drain_card'
  // Il caveau. Muovono il livello, non la capienza: la curva resta quella di `balance/`, e un
  // cheat che scrivesse una capienza arbitraria racconterebbe una partita che non esiste.
  | 'cheat.vault.level_up'
  | 'cheat.vault.max_level'
  | 'cheat.vault.reset_level'
  // Il reddito. Ha un potenziamento solo, quindi il cheat è un interruttore.
  | 'cheat.income.toggle_upgrade'

/**
 * Un cheat fallisce come fallisce un comando di gioco, e per le stesse ragioni: regalare contanti
 * a caveau pieno è un `capacity_exceeded`, non un caso speciale. Chi lo esegue mostra il rifiuto
 * con la frase che il giocatore vedrebbe — è anche il modo più rapido di provare quella frase.
 */
export type CheatResult = Result<void, LedgerError>

/**
 * Due forme, e non una con un booleano: un cheat che prende un importo e uno che non ne prende.
 *
 * La differenza non è cosmetica — decide se il pannello disegna una fila di cifre o un pulsante
 * solo — e un `amount: Money` ignorato da metà dei cheat sarebbe una firma che mente. Le due forme
 * di oggi sono tutte quelle che servono; una terza si aggiunge quando esiste un cheat che la
 * vuole.
 */
export type Cheat =
  | { readonly id: CheatId; readonly kind: 'act'; readonly run: () => CheatResult }
  | {
      readonly id: CheatId
      readonly kind: 'amount'
      /**
       * Gli ordini di grandezza che hanno senso **per questo cheat**, e il pannello ne disegna uno
       * per pulsante. Stanno qui e non nel pannello per la stessa ragione per cui un cheat sta nel
       * proprio file: chi dichiara il cheat sa quali cifre servono a provarlo, e il pannello non
       * deve saperlo. Senza, la scelta finirebbe in un elenco unico buono per tutti — cioè il
       * posto in cui, fra sei domini, non sarebbe più buona per nessuno.
       */
      readonly amounts: readonly Money[]
      readonly run: (amount: Money) => CheatResult
    }
