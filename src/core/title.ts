/**
 * The terminal's window and tab title — OSC 0.
 *
 * Restored by XTWINOPS push/pop (`CSI 22;2t` / `CSI 23;2t`) rather than by
 * writing an empty title on the way out: the title we replaced belongs to the
 * shell and is not ours to reconstruct, while a terminal that stacks it hands
 * the exact string back. One push per run keeps that stack balanced however
 * many times the title changes in between.
 */
import { basename } from 'node:path'

/** Force the title on or off, for tests and for a terminal we guessed wrong. */
export const TITLE_ENV = 'DRUK_TITLE'

const BEL = '\x07'

/**
 * `TERM`s whose parser handles only the palette forms of OSC (`ESC ] P`, `ESC ] R`)
 * and prints the rest of the string as text — a title would land in the buffer.
 */
const NO_OSC_TERM = /^(dumb|linux|vt\d)/

export function supportsTitle(
  env: NodeJS.ProcessEnv = process.env,
  tty: boolean = Boolean(process.stdout.isTTY),
): boolean {
  if (!tty) return false
  const forced = env[TITLE_ENV]
  if (forced === '0' || forced === 'off') return false
  if (forced === '1' || forced === 'on') return true
  return !NO_OSC_TERM.test(env.TERM ?? '')
}

export function encodeTitle(title: string): string {
  // A control character in the string ends the sequence early and leaves the
  // rest of it on screen, and a filename is allowed to carry one.
  return `\x1B]0;${title.replaceAll(/\p{Cc}/gu, '')}${BEL}`
}

export function formatTitle(project: string, path: string | null, dirty: boolean): string {
  if (!path) return `${project} — druk`
  return `${dirty ? '● ' : ''}${basename(path)} — ${project} — druk`
}

const writeOut = (text: string): void => {
  process.stdout.write(text)
}

let last = ''
let pushed = false
let exitHookInstalled = false

/**
 * The title is the terminal's state, so it outlives us: a throw or a
 * `process.exit` would leave the tab named after a file nothing is editing.
 * `App`'s `onCleanup` covers the ordinary quit alone. Installed on first use
 * and once, as `src/core/progress.ts` installs its own.
 */
function installExitHook(): void {
  if (exitHookInstalled) return
  exitHookInstalled = true
  process.on('exit', () => restoreTerminalTitle())
}

/** Name the terminal's window, skipping a no-op repeat and unsupported terminals. */
export function setTerminalTitle(
  title: string,
  write: (text: string) => void = writeOut,
  env: NodeJS.ProcessEnv = process.env,
  tty: boolean = Boolean(process.stdout.isTTY),
): void {
  if (!supportsTitle(env, tty)) return
  const sequence = encodeTitle(title)
  if (sequence === last) return
  last = sequence
  if (!pushed) {
    pushed = true
    write('\x1B[22;2t')
    installExitHook()
  }
  write(sequence)
}

/** Give back whatever the title was before our first `setTerminalTitle`. */
export function restoreTerminalTitle(write: (text: string) => void = writeOut): void {
  if (!pushed) return
  pushed = false
  last = ''
  write('\x1B[23;2t')
}
