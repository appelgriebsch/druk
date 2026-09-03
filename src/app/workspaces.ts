/**
 * The offer, the checks and the prompts around switching workspace. The switch
 * itself is `Root`'s remount: every controller is built from `rootDir` once.
 */
import { homedir } from 'node:os'
import { basename, resolve } from 'node:path'

import { isDirectory } from '../core/fs'
import { resolvedPath, workspaceEntries } from '../core/workspaces'
import type { Git } from './git'
import type { Status } from './status'
import type { Prompt } from './types'
import type { Workspace } from './workspace'

const expandHome = (path: string): string =>
  path === '~' || path.startsWith('~/') ? resolve(homedir(), path.slice(2)) : path

export function createWorkspaces(deps: {
  rootDir: string
  status: Status
  git: Git
  workspace: Workspace
  setPrompt: (prompt: Prompt) => void
  /** `Root`'s remount; absent where nothing can switch. */
  open?: (dir: string) => void
}) {
  const { rootDir, status, git, workspace, setPrompt, open } = deps

  const repos = () => {
    const active = git.activeRepo()
    return [...new Set([...(active ? [active] : []), ...git.repos()])]
  }

  const entries = () => workspaceEntries(rootDir, repos())

  const pick = () => {
    if (!open) return status.say('This druk cannot switch workspaces', 'warn')
    setPrompt({ kind: 'workspacePick', entries: entries() })
  }

  const openPrompt = () => {
    if (!open) return status.say('This druk cannot switch workspaces', 'warn')
    setPrompt({ kind: 'workspaceOpen' })
  }

  // Unsaved buffers stop it the way they stop quitting: the remount drops them
  // and the session restores tabs from disk.
  const switchTo = (dir: string, discardUnsaved = false) => {
    if (!open) return status.say('This druk cannot switch workspaces', 'warn')
    const at = resolve(rootDir, expandHome(dir.trim()))
    if (!isDirectory(at)) return status.say(`Not a folder: ${dir}`, 'error')
    if (resolvedPath(at) === resolvedPath(rootDir)) {
      return status.say(`${basename(at)} is already open`)
    }

    const dirty = workspace.dirtyPaths()
    if (!discardUnsaved && dirty.length > 0) {
      return setPrompt({
        kind: 'workspaceDirty',
        dir: at,
        names: dirty.map(path => basename(path)),
      })
    }
    open(at)
  }

  return { pick, openPrompt, switchTo, entries }
}

export type Workspaces = ReturnType<typeof createWorkspaces>
