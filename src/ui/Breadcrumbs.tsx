import { For, Show } from 'solid-js'

import { ui } from '../themes'
import { cut } from './text'

export interface BreadcrumbsProps {
  /** The open file's path from the project root, or null when nothing is open. */
  rel: string | null
  /** Columns the editor column has — the trail is cut to them from the front. */
  width: number
}

const SEPARATOR = ' › '

/**
 * VS Code's breadcrumb row: where the open file sits, over the editor and under
 * the tabs.
 *
 * The trail is cut from the *front* when it does not fit — the file's own name
 * is the half worth keeping, and a path cut from the tail would leave the row
 * naming a folder. Symbols are not in it: that needs the language server's
 * document symbols, which is a feature and not a look.
 */
export function Breadcrumbs(props: BreadcrumbsProps) {
  const parts = () => {
    const rel = props.rel
    if (!rel) return []
    const segments = rel.split('/').filter(Boolean)
    const full = segments.join(SEPARATOR)
    if (full.length <= props.width - 2) return segments
    // Drop leading folders until the rest fits; the name alone is then cut.
    for (let from = 1; from < segments.length; from++) {
      const rest = segments.slice(from)
      if (`…${SEPARATOR}${rest.join(SEPARATOR)}`.length <= props.width - 2) return ['…', ...rest]
    }
    return [cut(segments.at(-1) ?? '', Math.max(1, props.width - 2))]
  }

  return (
    <box height={1} flexShrink={0} flexDirection="row" backgroundColor={ui.bg} paddingLeft={1}>
      <For each={parts()}>
        {(part, index) => (
          <>
            <Show when={index() > 0}>
              <text fg={ui.faint} bg={ui.bg} flexShrink={0} content={SEPARATOR} />
            </Show>
            <text
              fg={index() === parts().length - 1 ? ui.dim : ui.faint}
              bg={ui.bg}
              flexShrink={0}
              wrapMode="none"
              content={part}
            />
          </>
        )}
      </For>
      <box flexGrow={1} backgroundColor={ui.bg} />
    </box>
  )
}
