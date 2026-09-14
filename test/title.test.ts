import { expect, test } from 'bun:test'

import {
  encodeTitle,
  formatTitle,
  restoreTerminalTitle,
  setTerminalTitle,
  supportsTitle,
} from '../src/core/title'

const env = (term: string): NodeJS.ProcessEnv => ({ TERM: term })

test('a console that prints OSC strings gets no title', () => {
  expect(supportsTitle(env('xterm-256color'), true)).toBe(true)
  expect(supportsTitle(env('linux'), true)).toBe(false)
  expect(supportsTitle(env('dumb'), true)).toBe(false)
  expect(supportsTitle(env('xterm-256color'), false)).toBe(false)
  expect(supportsTitle({ TERM: 'linux', DRUK_TITLE: '1' }, true)).toBe(true)
  expect(supportsTitle({ TERM: 'xterm', DRUK_TITLE: '0' }, true)).toBe(false)
})

test('a control character in the name cannot end the sequence early', () => {
  expect(encodeTitle('a\x07b\x1Bc')).toBe('\x1B]0;abc\x07')
})

test('the title names the file, the project and the dirty mark', () => {
  expect(formatTitle('druk', null, false)).toBe('druk — druk')
  expect(formatTitle('druk', '/p/src/app/App.tsx', false)).toBe('App.tsx — druk — druk')
  expect(formatTitle('druk', '/p/src/app/App.tsx', true)).toBe('● App.tsx — druk — druk')
})

test('the title is pushed once, repeats are skipped, and the stack is popped', () => {
  const out: string[] = []
  const write = (text: string) => out.push(text)
  const tty = env('xterm-256color')
  setTerminalTitle('one', write, tty, true)
  setTerminalTitle('one', write, tty, true)
  setTerminalTitle('two', write, tty, true)
  restoreTerminalTitle(write)
  restoreTerminalTitle(write)
  expect(out).toEqual(['\x1B[22;2t', '\x1B]0;one\x07', '\x1B]0;two\x07', '\x1B[23;2t'])
})
