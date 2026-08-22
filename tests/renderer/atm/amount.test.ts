import { describe, expect, it } from 'vitest'

import { readAmount } from '../../../src/renderer/components/atm/amount'

/**
 * La lettura del campo dell'importo, provata **sui casi che rompono**: un campo di testo riceve
 * tutto ciò che una tastiera può produrre, e finché l'importo si sceglieva da quattro pulsanti
 * nessuno di questi casi poteva presentarsi.
 *
 * Si prova senza montare niente, che è ciò che comprano le due righe di R05.
 */

const read = (typed: string): string => readAmount(typed).toString()

describe('un importo digitato', () => {
  it('è il numero che c’è scritto', () => {
    expect(read('500')).toBe('500')
    expect(read('12.34')).toBe('12.34')
  })

  it('accetta la virgola come il punto, perché il gioco ha due lingue', () => {
    expect(read('12,34')).toBe('12.34')
    expect(read('0,5')).toBe('0.5')
  })

  it('legge le migliaia in tutte e due le forme', () => {
    // L'ultimo separatore è quello dei decimali: qui sotto è la virgola in un caso e il punto
    // nell'altro, e i due importi devono coincidere.
    expect(read('1.234,56')).toBe('1234.56')
    expect(read('1,234.56')).toBe('1234.56')
  })

  it('legge un intero raggruppato come un intero', () => {
    expect(read('1.234')).toBe('1234')
    expect(read('250.000')).toBe('250000')
    expect(read('1,234,567')).toBe('1234567')
  })

  it('non tratta come migliaia un gruppo che non torna', () => {
    // Quattro cifre davanti al separatore: nessuna lingua raggruppa così, quindi è un decimale.
    expect(read('1234,5')).toBe('1234.5')
  })

  it('taglia il terzo decimale invece di farlo entrare nei conti', () => {
    // Per difetto, mai per eccesso: il centesimo che non c'è non si regala.
    expect(read('10,999')).toBe('10999')
    expect(read('10,9999')).toBe('10.99')
    expect(read('0,009')).toBe('0')
  })

  it('tiene il segno meno invece di correggerlo di nascosto', () => {
    // Diventa `error.atm.amount_not_positive`, cioè un rifiuto con dentro la cifra digitata. Un
    // campo che raddrizza il segno da sé decide al posto di chi scrive.
    expect(read('-5')).toBe('-5')
    expect(read('-0,01')).toBe('-0.01')
  })

  it('ignora ciò che in un importo non è un importo', () => {
    expect(read('1.200 €')).toBe('1200')
    expect(read(' 42 ')).toBe('42')
  })
})

describe('il giro completo', () => {
  it('rilegge ciò che i pulsanti rapidi scrivono, in tutte e due le lingue', () => {
    // È il patto fra `plainMoney` e questa funzione: premere `MAX` scrive nel campo un testo che
    // il campo stesso deve saper rileggere. Se si rompesse, `MAX` proporrebbe un importo diverso
    // da quello che ha appena calcolato — e nessun tipo se ne accorgerebbe.
    expect(read('5.102,04')).toBe('5102.04')
    expect(read('5,102.04')).toBe('5102.04')
    expect(read('500,00')).toBe('500')
    expect(read('500.00')).toBe('500')
  })
})

describe('ciò che non è un importo', () => {
  it('è zero, che è un rifiuto che il gioco sa già spiegare', () => {
    expect(read('')).toBe('0')
    expect(read('   ')).toBe('0')
    expect(read('abc')).toBe('0')
    expect(read('-')).toBe('0')
    expect(read(',')).toBe('0')
  })

  it('e lo è anche quando somiglia a un numero senza esserlo', () => {
    // `NaN` e `Infinity` restano stringhe: senza cifre dentro, non c'è niente da leggere.
    expect(read('NaN')).toBe('0')
    expect(read('Infinity')).toBe('0')
  })

  it('non fa cadere la pagina su un separatore isolato', () => {
    expect(read(',50')).toBe('0.5')
    expect(read('500,')).toBe('500')
    expect(read('.')).toBe('0')
  })
})
