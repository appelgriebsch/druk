import { execFileSync } from 'node:child_process'

export const git = (dir: string, ...args: string[]) => execFileSync('git', args, { cwd: dir })

/**
 * A repository at `dir` that can commit. `commit.gpgsign` is off because a
 * developer with signing on globally would otherwise have every git fixture
 * fail at its first commit, waiting for a passphrase that never comes.
 */
export function initRepo(dir: string): string {
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'config', 'user.email', 'test@example.com')
  git(dir, 'config', 'user.name', 'Test')
  git(dir, 'config', 'commit.gpgsign', 'false')
  return dir
}
