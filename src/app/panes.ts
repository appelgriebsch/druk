import { createSignal } from 'solid-js'

import type { KeyScope } from '../ui/keys'
import type { SidebarView } from '../ui/SidebarTabs'
import type { Tree } from './tree'
import type { Focus } from './types'

/** Which pane the keyboard belongs to, whether the sidebar is on screen, and
 * which of its views — the file tree, the source-control panel or the extensions
 * panel — it shows. */
export function createPanes(tree: Tree, initialSidebar: boolean) {
  const [sidebar, setSidebar] = createSignal(initialSidebar)
  const [focus, setFocus] = createSignal<Focus>(initialSidebar ? 'tree' : 'editor')
  const [view, setView] = createSignal<SidebarView>('files')

  // Focus is useless without a visible cursor: a file opened from the picker or a
  // tab may sit in a collapsed folder, leaving no row to highlight.
  const focusTree = () => {
    // The other views borrow this focus slot. Revealing here would expand
    // folders in a tree that is not on screen, and the expansion would still be
    // there when it comes back.
    if (view() !== 'files') return setFocus('tree')
    const path = tree.selectedPath()
    if (path) tree.reveal(path)
    if (!tree.nodes().some(n => n.path === tree.selectedPath())) {
      tree.setSelectedPath(tree.nodes()[0]?.path ?? null)
    }
    setFocus('tree')
  }

  const toggleSidebar = () => {
    if (sidebar()) {
      setSidebar(false)
      setFocus('editor')
      return
    }
    setSidebar(true)
    focusTree()
  }

  const showView = (next: SidebarView) => {
    setView(next)
    setSidebar(true)
    focusTree()
  }

  /** VS Code's Ctrl+Shift+G / X / R: show that view, or put the tree back. */
  const toggleView = (next: Exclude<SidebarView, 'files'>) =>
    showView(sidebar() && view() === next ? 'files' : next)

  /** Which keymap is live, for the peek strip: the other views have keys of their
   * own and show under the tree's focus. */
  const keyPane = (): KeyScope => {
    const showing = view()
    return focus() === 'tree' && showing !== 'files' ? showing : focus()
  }

  return {
    sidebar,
    focus,
    setFocus,
    focusTree,
    toggleSidebar,
    view,
    showView,
    toggleView,
    keyPane,
  }
}

export type Panes = ReturnType<typeof createPanes>
