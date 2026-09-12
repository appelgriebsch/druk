import { describe, expect, test } from 'bun:test'

import { fixture, launch, openFile, press } from './helpers'
import type { Harness } from './helpers'

const long = `${Array.from({ length: 200 }, (_, index) => `line ${index}`).join('\n')}\n`

/** Rightmost column of the editor rows: the scrollbar track. The editor starts
 * at row 2 — the tab strip is row 0 and the breadcrumbs row 1. */
const track = (t: Harness) =>
  t
    .captureCharFrame()
    .split('\n')
    .slice(2, 19)
    .map(row => row.at(-1))
    .join('')

async function open(t: Harness, name: string) {
  await openFile(t, name)
}

describe('the editor scrollbar', () => {
  test('shows where you are as soon as the file opens', async () => {
    const t = await launch(fixture({ 'big.ts': long }))
    await open(t, 'big.ts')

    const bar = track(t)
    expect(bar).toContain('█')
    // At the top of the file the thumb sits at the top of the track.
    expect(bar.indexOf('█')).toBe(0)
  })

  test('the thumb follows the viewport down the file', async () => {
    const t = await launch(fixture({ 'big.ts': long }))
    await open(t, 'big.ts')
    const before = track(t).indexOf('█')

    for (let step = 0; step < 90; step++) await press(t, input => input.pressArrow('down'))
    const after = track(t).indexOf('█')

    expect(after).toBeGreaterThan(before)
    expect(track(t)).toContain('█')
  })
})
