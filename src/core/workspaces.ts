/**
 * Which folders the workspace switcher offers: what the open repositories
 * *have* (`git worktree list` knows a checkout druk was never opened on) and
 * what druk has *been* opened on (`sessions.json`).
 */
import { realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename } from 'node:path'

import { isDirectory } from './fs'
import { worktrees } from './git'
import { recentProjects } from './session'

// Each repository is a synchronous `git` on the render thread, and a folder of
// checkouts can hold dozens; the rest still appear through the recents.
const MAX_WORKTREE_REPOS = 8

export interface WorkspaceEntry {
  path: string
  name: string
  branch: string | null
  source: 'worktree' | 'recent'
  /** The workspace already open — listed, so the list says where you are. */
  current: boolean
}

export function shortenHome(path: string, home = homedir()): string {
  return home && path.startsWith(`${home}/`) ? `~${path.slice(home.length)}` : path
}

const trimSlash = (path: string): string =>
  path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path

/**
 * The one spelling every comparison here uses: `git worktree list` prints the
 * symlink-resolved path (`/private/var/…` on macOS) and the shell the other,
 * and without this the folder you are in is listed twice and current neither time.
 */
export function resolvedPath(path: string): string {
  try {
    return trimSlash(realpathSync(path))
  } catch {
    return trimSlash(path)
  }
}

/** Worktrees of the open repositories, then remembered folders; the current one first. */
export function workspaceEntries(rootDir: string, repos: readonly string[]): WorkspaceEntry[] {
  const root = resolvedPath(rootDir)
  const entries: WorkspaceEntry[] = []
  const seen = new Set<string>()

  const add = (path: string, branch: string | null, source: WorkspaceEntry['source']) => {
    const at = resolvedPath(path)
    if (seen.has(at)) return
    seen.add(at)
    entries.push({ path: at, name: basename(at) || at, branch, source, current: at === root })
  }

  for (const repo of repos.slice(0, MAX_WORKTREE_REPOS)) {
    for (const tree of worktrees(repo)) {
      if (isDirectory(tree.path)) add(tree.path, tree.branch, 'worktree')
    }
  }
  for (const project of recentProjects()) add(project.path, null, 'recent')

  // A folder with no repository, opened for the first time, is in neither list yet.
  add(root, null, 'recent')

  return entries.toSorted((a, b) => Number(b.current) - Number(a.current))
}
