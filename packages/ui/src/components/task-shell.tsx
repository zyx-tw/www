"use client"

import { useTheme } from "next-themes"

import { BottomCorners, cornerLink, LegalLinks, TopCorners } from "./corners"
import { PageDecode } from "./page-decode"

import { column, enterRow, page } from "../lib/layout"
import { cn } from "../lib/utils"

/** The top right corner's default: a text link to the other theme. */
function ThemeLink() {
  const { resolvedTheme, setTheme } = useTheme()
  const next = resolvedTheme === "light" ? "dark" : "light"
  return (
    <button type="button" className={cornerLink} onClick={() => setTheme(next)}>
      {next === "light" ? "Light" : "Dark"}
    </button>
  )
}

/**
 * The page of a small task (a personal tool, a demo): the four corners, the
 * page motion and one centered column that holds the title and the task.
 * Wrap the app in ThemeProvider once (the Vite template's main.tsx does) for
 * dark first and the D key. `actions` are short text links at the
 * top right, a link to the other theme by default; `wide` gives an editor or a comparison more room. It needs no
 * framework, so a Vite app made from the `task` item renders it as is.
 */
export function TaskShell({
  title,
  description,
  actions = <ThemeLink />,
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
      <PageDecode />
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
