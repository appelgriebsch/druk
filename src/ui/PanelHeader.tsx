import type { JSX } from 'solid-js'

import { ui } from '../themes'
import { cut } from './text'

export interface PanelHeaderProps {
  /** The view's name. Drawn uppercase, as VS Code draws a sidebar title. */
  title: string
  /** Columns the sidebar has — the title is cut to them, never wrapped. */
  width: number
  /** The panel holds the keyboard: the title brightens with it. */
  focused: boolean
  /** Buttons for the right of the row — the collapse ▴, a count, a toggle. */
  children?: JSX.Element
}

/**
 * The title row every sidebar view starts with: `EXPLORER`, `SOURCE CONTROL`.
 *
 * One row, and its text never wraps: the panels below are sized against what
 * this leaves, and a header grown to two rows eats the list. The controls that
 * belong to the view sit at the right of the same row, which is where VS Code
 * puts them.
 */
export function PanelHeader(props: PanelHeaderProps) {
  return (
    <box
      height={1}
      flexShrink={0}
      flexDirection="row"
      backgroundColor={ui.sidebarBg}
      paddingLeft={2}
      paddingRight={1}
    >
      <text
        fg={props.focused ? ui.dim : ui.faint}
        bg={ui.sidebarBg}
        flexShrink={1}
        wrapMode="none"
        content={cut(props.title.toUpperCase(), Math.max(1, props.width - 4))}
      />
      <box flexGrow={1} backgroundColor={ui.sidebarBg} />
      {props.children}
    </box>
  )
}
