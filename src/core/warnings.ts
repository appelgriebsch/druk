import { appendFileSync, mkdirSync } from 'node:fs'
import os from 'node:os'
import { dirname, join } from 'node:path'

export const WARNINGS_LOG = join(
  process.env.XDG_STATE_HOME ?? join(os.homedir(), '.local', 'state'),
  'druk',
  'druk.log',
)

/**
 * Bun's default `warning` listener writes to stderr, which is the screen once
 * the renderer owns it (letstri/druk#100). Adding a listener beside it silences
 * nothing — only removing it does — so this replaces the set.
 */
export function divertWarnings(file = WARNINGS_LOG): void {
  process.removeAllListeners('warning')
  process.on('warning', warning => {
    const text = warning.stack ?? `${warning.name}: ${warning.message}`
    try {
      mkdirSync(dirname(file), { recursive: true })
      appendFileSync(file, `${new Date().toISOString()} ${text}\n`)
    } catch {
      // Unwritable log: still not a reason to paint over the editor.
    }
  })
}
