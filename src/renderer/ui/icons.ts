/**
 * D038 · ADR 0046 — le icone che il gioco disegna, e **da quale insieme** vengono.
 *
 * Due dichiarazioni e nient'altro: da quale insieme di Iconify si pesca, e come si chiama da noi
 * ciò che lì si chiama in un altro modo. Cambiare insieme è cambiare `ICON_SET` e i valori di
 * questa tabella — non una riga di componente, non un import sparso in dieci file.
 *
 * I nomi a sinistra sono **del design**, non del gioco: `swap` e `theme` sono cosa fa il gesto, e
 * R14 resta vera perché nessuno di loro nomina un dominio. È lo stesso patto di `roles.ts`, dove
 * `cash` e `card` stanno nel kit perché così li chiama il disegno.
 *
 * **Ce ne sono due, ed è deliberato.** Il progetto non ha mai avuto un'icona: le destinazioni
 * della colonna non ne portano nessuna, e sta scritto in `AppNav.vue` perché — «i simboli
 * arriveranno col primo dominio che ne porta uno suo, sceglierli adesso vorrebbe dire inventarli».
 * Questa delega non li inventa. Prende i **due glifi che il gioco disegna già** — la freccia doppia
 * del bancomat, scritta come carattere, e il mezzo cerchio del tema, disegnato con un gradiente —
 * e li fa venire da un posto solo.
 *
 * A destra non c'è il disegno: c'è il **nome**. I tracciati stanno in `glyphs.json`, che è
 * generato da questa tabella e non si scrive a mano — vedi `tests/rules/icons`.
 */

/**
 * L'insieme, con il prefisso che Iconify gli dà. Vale come nome di pacchetto: la derivazione legge
 * `@iconify-json/<ICON_SET>`, quindi cambiarlo qui e non installare il pacchetto è un test rosso e
 * non un'icona vuota.
 */
export const ICON_SET = 'lucide'

/**
 * Da come la chiamiamo noi a come la chiama l'insieme. `as const` non è ornamentale: è ciò che fa
 * di `IconName` un'unione chiusa, quindi un nome mai dichiarato non compila.
 */
export const ICONS = {
  /** Il verso del bancomat: due frecce che si scambiano. */
  swap: 'arrow-left-right',
  /** Chiaro o scuro, in un glifo solo — che è esattamente ciò che il mezzo cerchio diceva. */
  theme: 'sun-moon'
} as const

export type IconName = keyof typeof ICONS
