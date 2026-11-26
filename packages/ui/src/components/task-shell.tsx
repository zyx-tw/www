"use client"

import { BottomCorners, LegalLinks, TopCorners } from "./corners"
import { ThemeToggle } from "./ui/theme-toggle"

import { column, enterRow, page } from "../lib/layout"
import { cn } from "../lib/utils"

/**
 * The page of a small task (a personal tool, a demo): the four corners, the
 * page motion and one centered column that holds the title and the task.
 * The root layout mounts ThemeProvider (dark first, the D key) and the page
 * motion once, as the task item's app/layout.tsx does. `actions` are short text links at the
 * top right, a link to the other theme by default; `wide` gives an editor or a comparison more room.
 */
export function TaskShell({
  title,
  description,
  actions = <ThemeToggle />,
  wide = false,
  children,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <>
      <TopCorners fade nav={actions} />
      <main
        id="task"
        className={cn(
          column,
          page,
          wide && "max-w-none lg:max-w-6xl 2xl:max-w-6xl"
        )}
      >
        <h1 className={cn("text-title font-medium", enterRow(1))}>{title}</h1>
        {description && (
          <p className={cn("mt-3 text-muted-foreground", enterRow(2))}>
            {description}
          </p>
        )}
        <div className={cn("mt-15", enterRow(3))}>{children}</div>
      </main>
      <BottomCorners fade links={<LegalLinks />} />
    </>
  )
}
