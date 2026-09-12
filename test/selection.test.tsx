import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { fixture, launch, openFile, press, settle } from './helpers'
import type { Harness } from './helpers'

interface SelectionHost {
  renderer?: { getSelection: () => { getSelectedText: () => string } | null }
}

const selected = (t: Harness) =>
  (t as unknown as SelectionHost).renderer?.getSelection()?.getSelectedText() ?? null

const CONTENT = 'const data = []\nconst beta = 2\n'

async function withOpenFile(content = 'const alpha = 1\nconst beta = 2\n') {
  const dir = fixture({ 'a.ts': content })
  const t = await launch(dir)
  await openFile(t, 'a.ts')
  return { t, dir }
}

/** The editor's first content row: the tab strip is 0 and the breadcrumbs 1. */
const EDITOR_ROW = 2

/** Column of `word` on the editor's first content row — row 2, under the tab
 * strip and the breadcrumbs. */
function colOf(t: Harness, word: string) {
  const row = t.captureCharFrame().split('\n')[EDITOR_ROW]!
  return row.indexOf(word)
}

const save = (t: Harness) => press(t, input => input.pressKey('s', { ctrl: true }))

describe('mouse selection', () => {
  test('dragging in the editor still selects, so Ctrl+C has something to copy', async () => {
    const { t } = await withOpenFile()
    // Found from the frame rather than hard-coded: the editor's first column moves
    // whenever the sidebar is resized or the divider changes width.
    const from = colOf(t, 'alpha')
    await t.mockMouse.drag(from, EDITOR_ROW, from + 5, EDITOR_ROW)
    await settle(t)
    expect(selected(t)).toContain('alpha')
  })

  test('dragging over the file tree selects nothing', async () => {
    const { t } = await withOpenFile()
    await t.mockMouse.drag(2, 3, 10, 3)
    await settle(t)
    expect(selected(t)).toBeNull()
  })

  test('dragging over the tab bar selects nothing', async () => {
    const { t } = await withOpenFile()
    await t.mockMouse.drag(2, 0, 10, 0)
    await settle(t)
    expect(selected(t)).toBeNull()
  })

  test('double-click selects the word under the cursor', async () => {
    const { t, dir } = await withOpenFile(CONTENT)
    const at = colOf(t, 'data')
    await t.mockMouse.doubleClick(at, EDITOR_ROW)
    await settle(t)
    // Typing replaces the selection — the same path Ctrl+A and a drag use.
    await press(t, input => void input.typeText('X'))
    await save(t)
    expect(readFileSync(join(dir, 'a.ts'), 'utf8')).toBe('const X = []\nconst beta = 2\n')
  })

  test('triple-click selects the whole line', async () => {
    const { t, dir } = await withOpenFile(CONTENT)
    const at = colOf(t, 'data')
    await t.mockMouse.click(at, EDITOR_ROW)
    await t.mockMouse.click(at, EDITOR_ROW)
    await t.mockMouse.click(at, EDITOR_ROW)
    await settle(t)
    await press(t, input => void input.typeText('X'))
    await save(t)
    expect(readFileSync(join(dir, 'a.ts'), 'utf8')).toBe('Xconst beta = 2\n')
  })

  test('a single click does not select the word', async () => {
    const { t, dir } = await withOpenFile(CONTENT)
    const at = colOf(t, 'data')
    await t.mockMouse.click(at, EDITOR_ROW)
    await settle(t)
    await press(t, input => void input.typeText('X'))
    await save(t)
    // Caret lands on a letter of the word; inserting must not wipe `data`.
    expect(readFileSync(join(dir, 'a.ts'), 'utf8')).toContain('data')
    expect(readFileSync(join(dir, 'a.ts'), 'utf8')).toContain('X')
  })

  test('double-click inside a string selects only that word', async () => {
    const { t, dir } = await withOpenFile('const s = "hello world"\n')
    const at = colOf(t, 'hello')
    await t.mockMouse.doubleClick(at, EDITOR_ROW)
    await settle(t)
    await press(t, input => void input.typeText('X'))
    await save(t)
    expect(readFileSync(join(dir, 'a.ts'), 'utf8')).toBe('const s = "X world"\n')
  })

  test('double-clicking past the end of a line keeps the line break', async () => {
    const { t, dir } = await withOpenFile()
    // The caret clamps to the line's `\n`, which is not a token: selecting it
    // would make the next keystroke pull the following line up.
    const at = colOf(t, 'const alpha = 1') + 'const alpha = 1'.length + 3
    await t.mockMouse.doubleClick(at, EDITOR_ROW)
    await settle(t)
    await press(t, input => void input.typeText('X'))
    await save(t)
    expect(readFileSync(join(dir, 'a.ts'), 'utf8')).toBe('const alpha = 1X\nconst beta = 2\n')
  })

  test('double-clicking a blank line does not eat the blank lines around it', async () => {
    const { t, dir } = await withOpenFile('const alpha = 1\n\n\n\nconst beta = 2\n')
    const at = colOf(t, 'const alpha = 1')
    // The row under the first line: blank, as the ones under it are.
    await t.mockMouse.doubleClick(at, EDITOR_ROW + 1)
    await settle(t)
    await press(t, input => void input.typeText('X'))
    await save(t)
    expect(readFileSync(join(dir, 'a.ts'), 'utf8')).toBe('const alpha = 1\nX\n\n\nconst beta = 2\n')
  })
})
