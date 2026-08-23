/**
 * D039 · ADR 0047 — guardare la finestra vera, dalla porta di ispezione.
 *
 * Questo progetto chiede una verifica a occhio in quasi ogni delega, e per sette sessioni lo
 * strumento che la rende possibile è stato riscritto da capo ogni volta: viveva nello scratchpad
 * della sessione, che con la sessione finisce. Sette riscritture per un file che non cambia è il
 * costo che questa cartella esiste per non pagare più.
 *
 * **Non fa parte del gioco.** Non lo importa nessuno, non finisce nel pacchetto — `electron-builder`
 * lo esclude — e il gioco gira identico se questa cartella sparisce.
 *
 * ## Come si usa
 *
 * Prima si apre la porta. Gli argomenti dopo `--` arrivano a Electron, non a electron-vite:
 *
 * ```bash
 * npx electron-vite dev -- --remote-debugging-port=9222
 * ```
 *
 * Poi:
 *
 * ```bash
 * node scripts/cdp.mjs shot finestra.png            # tutta la finestra
 * node scripts/cdp.mjs shot dettaglio.png 0,640,250,65,6   # x,y,larghezza,altezza[,ingrandimento]
 * node scripts/cdp.mjs eval "document.title"
 * node scripts/cdp.mjs click "Bancomat"             # il primo pulsante che contiene quel testo
 * node scripts/cdp.mjs tab 3                        # tre tabulazioni vere, e dice dov'è il fuoco
 * node scripts/cdp.mjs theme dark                   # scavalca il tema, senza toccare il sistema
 * ```
 *
 * ## Le quattro cose imparate a caro prezzo, che stanno qui perché non si ripaghino
 *
 * 1. **Non serve il pacchetto `ws`.** Node ha `WebSocket` fra i globali: bastano un `http.get` su
 *    `/json/list` e questo file.
 * 2. **Il bersaglio si sceglie su `localhost`, non sul numero di porta.** La 5173 può essere
 *    occupata, e Vite passa alla 5174 **in silenzio**.
 * 3. **`Page.reload` termina il processo Electron** invece di ricaricarlo. Per rivedere una
 *    modifica si usa il ricaricamento a caldo, o si chiude e si riapre.
 * 4. **`element.focus()` non fa scattare `:focus-visible`**: il motore lo accende per la tastiera e
 *    non per una chiamata. È la ragione per cui `tab` esiste e manda eventi veri — senza, un anello
 *    di fuoco si può credere provato senza esserlo (D038).
 */

import { writeFileSync } from 'node:fs'
import { get } from 'node:http'

/** La porta di ispezione, quella che l'argomento passato a Electron apre. */
const PORT = 9222

/** Il codice del tasto di tabulazione, come lo vuole `Input.dispatchKeyEvent`. */
const TAB_KEY = 9

/** Quanto ingrandire un ritaglio, se chi lo chiede non lo dice. */
const DEFAULT_SCALE = 3

const USAGE = [
  'uso: node scripts/cdp.mjs <comando> [argomenti]',
  '',
  '  shot <file.png> [x,y,larghezza,altezza[,ingrandimento]]   una fotografia, tutta o ritagliata',
  '  eval "<espressione>"                                      valuta nella pagina e stampa',
  '  click "<testo>"                                           preme il primo pulsante che lo contiene',
  '  tab [quante]                                              tabulazioni vere, e dove finisce il fuoco',
  '  theme <light|dark>                                        scavalca il tema',
  '',
  `prima serve la porta aperta: npx electron-vite dev -- --remote-debugging-port=${PORT}`
].join('\n')

const targets = () =>
  new Promise((resolve, reject) => {
    get(`http://localhost:${PORT}/json/list`, (response) => {
      let body = ''
      response.on('data', (chunk) => (body += chunk))
      response.on('end', () => resolve(JSON.parse(body)))
    }).on('error', reject)
  })

/**
 * La pagina del gioco. Si filtra su `localhost` e **non** sul numero di porta: la 5173 può essere
 * occupata e Vite passa alla 5174 senza dirlo.
 */
const gamePage = async () => {
  const found = await targets()
  const page = found.find((each) => each.type === 'page' && each.url.includes('localhost'))
  if (page === undefined) {
    const seen = found.map((each) => `${each.type} ${each.url}`).join(' | ')
    throw new Error(`nessuna pagina del gioco fra i bersagli: ${seen === '' ? 'nessuno' : seen}`)
  }
  return page
}

/** Una connessione al protocollo, con le richieste numerate e le risposte appaiate. */
const connect = async (url) => {
  const socket = new WebSocket(url)
  const pending = new Map()
  let last = 0

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    const waiting = pending.get(message.id)
    if (waiting !== undefined) {
      pending.delete(message.id)
      waiting(message.result ?? message.error)
    }
  })

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve)
    socket.addEventListener('error', () => reject(new Error(`porta ${PORT} non risponde`)))
  })

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      last += 1
      pending.set(last, resolve)
      socket.send(JSON.stringify({ id: last, method, params }))
    })

  /** Valuta nella pagina e ritorna il valore, o la descrizione dell'eccezione se ne lancia una. */
  const evaluate = async (expression) => {
    const done = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    })
    return done?.result?.value ?? done?.exceptionDetails?.exception?.description ?? done
  }

  return { send, evaluate, close: () => socket.close() }
}

/** `0,640,250,65,6` → il ritaglio che `Page.captureScreenshot` vuole. Senza, tutta la finestra. */
const clipOf = (box) => {
  if (box === undefined) return undefined
  const [x, y, width, height, scale] = box.split(',').map(Number)
  if ([x, y, width, height].some((each) => !Number.isFinite(each))) {
    throw new Error(`ritaglio illeggibile: ${box} — serve x,y,larghezza,altezza[,ingrandimento]`)
  }
  return { x, y, width, height, scale: Number.isFinite(scale) ? scale : DEFAULT_SCALE }
}

/**
 * Preme il primo pulsante il cui testo contiene quello chiesto. Il confronto è senza maiuscole e
 * su un frammento, perché un'etichetta porta spesso un importo accanto alla parola.
 */
const clickScript = (text) => `(() => {
  const wanted = ${JSON.stringify(text)}.toLowerCase()
  const buttons = [...document.querySelectorAll('button')]
  const hit = buttons.find((each) => each.textContent.trim().toLowerCase().includes(wanted))
  if (hit === undefined) {
    return 'nessun pulsante con quel testo. Ci sono: ' + buttons.map((each) => each.textContent.trim()).join(' | ')
  }
  hit.click()
  return 'premuto: ' + hit.textContent.trim()
})()`

const WHERE_IS_FOCUS = `[document.activeElement.tagName, document.activeElement.className, document.activeElement.textContent.trim().slice(0, 40)].join(' · ')`

const run = async () => {
  const [command, argument, box] = process.argv.slice(2)
  if (command === undefined) return USAGE

  const page = await gamePage()
  const session = await connect(page.webSocketDebuggerUrl)

  try {
    if (command === 'shot') {
      if (argument === undefined) throw new Error('shot vuole un nome di file')
      const clip = clipOf(box)
      const shot = await session.send('Page.captureScreenshot', {
        format: 'png',
        ...(clip === undefined ? {} : { clip })
      })
      writeFileSync(argument, Buffer.from(shot.data, 'base64'))
      return `scritto ${argument}`
    }

    if (command === 'eval') {
      if (argument === undefined) throw new Error('eval vuole un’espressione')
      return JSON.stringify(await session.evaluate(argument), null, 2)
    }

    if (command === 'click') {
      if (argument === undefined) throw new Error('click vuole un testo')
      return await session.evaluate(clickScript(argument))
    }

    if (command === 'tab') {
      const times = argument === undefined ? 1 : Number(argument)
      if (!Number.isInteger(times) || times < 1) throw new Error(`quante tabulazioni? ${argument}`)
      const key = { windowsVirtualKeyCode: TAB_KEY, key: 'Tab', code: 'Tab' }
      for (let done = 0; done < times; done += 1) {
        await session.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...key })
        await session.send('Input.dispatchKeyEvent', { type: 'keyUp', ...key })
      }
      return `il fuoco è su: ${await session.evaluate(WHERE_IS_FOCUS)}`
    }

    if (command === 'theme') {
      if (argument !== 'light' && argument !== 'dark') throw new Error(`tema: ${argument}`)
      return await session.evaluate(
        `(document.documentElement.setAttribute('data-theme', '${argument}'), 'tema: ${argument}')`
      )
    }

    // `throw` e non `return`: un comando sbagliato deve uscire con un codice diverso da zero, o in
    // uno script che ne concatena due il secondo parte lo stesso.
    throw new Error(`comando sconosciuto: ${command}\n\n${USAGE}`)
  } finally {
    session.close()
  }
}

try {
  console.log(await run())
  process.exit(0)
} catch (failure) {
  console.error(failure instanceof Error ? failure.message : failure)
  process.exit(1)
}
