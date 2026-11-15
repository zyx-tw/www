"use client"

import { useEffect, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { PALETTES } from "@/lib/map-palette"

const NAMES = {
  orange: "Vaundy",
  white: "白",
  amber: "琥珀",
  red: "紅",
  green: "綠",
} as const
type Name = keyof typeof NAMES

/**
 * For one decision: the color of a note's marks. With `?c=` in the address
 * the page shows the four choices and paints the marks in the one picked
 * (`--mark`, app/globals.css). Delete this, and the unpicked palettes, once
 * the color is chosen.
 */
export function MarkPalette() {
  const [picked, setPicked] = useState<Name>()

  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get("c")
    if (asked === null) return
    // The address is only known in the browser, so this cannot be first state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPicked(asked in NAMES ? (asked as Name) : "orange")
  }, [])

  useEffect(() => {
    if (!picked) return
    const root = document.documentElement
    root.style.setProperty(
      "--mark",
      PALETTES[picked]?.bright ?? "var(--foreground)"
    )
    window.history.replaceState(null, "", `?c=${picked}`)
    return () => {
      root.style.removeProperty("--mark")
    }
  }, [picked])

  if (!picked) return null
  return (
    <ul className="mb-10 flex gap-x-5" data-decode="own">
      {(Object.keys(NAMES) as Name[]).map((name) => (
        <li key={name}>
          <button
            type="button"
            aria-pressed={name === picked}
            onClick={() => setPicked(name)}
            className={cn(
              "cursor-pointer outline-offset-4 focus-visible:outline-2",
              name === picked
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {name === picked ? `[${NAMES[name]}]` : NAMES[name]}
          </button>
        </li>
      ))}
    </ul>
  )
}
