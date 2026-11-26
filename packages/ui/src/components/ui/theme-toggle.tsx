"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

import { cornerLink } from "../corners"
import { cn } from "../../lib/utils"

/**
 * Switches light and dark. A text link in the corner style that names the
 * theme it switches to, LIGHT or DARK, never an icon. Before mount it reads
 * LIGHT, the dark-first default, so the server render matches.
 */
function ThemeToggle({
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "onClick" | "children">) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const next = mounted && resolvedTheme === "light" ? "dark" : "light"
  return (
    <button
      type="button"
      data-slot="theme-toggle"
      className={cn(cornerLink, className)}
      {...props}
      onClick={() => setTheme(next)}
    >
      {next === "light" ? "Light" : "Dark"}
    </button>
  )
}

export { ThemeToggle }
