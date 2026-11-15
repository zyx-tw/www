"use client"

import { useId, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import type { Dial } from "@/lib/projects"

/**
 * A quantity the reader moves. The bars are text, one block a cell, and the
 * same bars stand at every stop: only their lengths change, so the eye
 * follows what grows and what stays.
 */
export function ProjectDial({
  dial,
  className,
}: {
  dial: Dial
  className?: string
}) {
  const id = useId()
  const [active, setActive] = useState(0)
  const stop = dial.stops[active]!

  return (
    <figure
      className={cn(
        "max-w-2xl border-t border-b border-border py-5",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <label htmlFor={id} className="text-muted-foreground">
          {dial.ask}
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={dial.stops.length - 1}
          step={1}
          value={active}
          aria-valuetext={stop.label}
          onChange={(event) => setActive(Number(event.target.value))}
          className="h-10 w-40 cursor-pointer accent-(--mark)"
        />
        <span className="bg-(--mark)/20 text-(--mark) tabular-nums">
          {stop.label}
        </span>
      </div>

      <ul className="mt-8 flex flex-col gap-y-2">
        {stop.bars.map(({ label, cells, value, tone }) => (
          <li
            key={label}
            className="grid grid-cols-[1fr_auto] gap-x-3 sm:grid-cols-[9rem_1fr_auto]"
          >
            <span className="max-sm:col-span-2">{label}</span>
            <span
              aria-hidden
              className={cn(
                "overflow-hidden whitespace-pre",
                tone === "mark" && "text-(--mark)",
                tone === "quiet" && "text-muted-foreground"
              )}
            >
              {"█".repeat(cells)}
              <span className="text-border">
                {"░".repeat(Math.max(0, dial.scale - cells))}
              </span>
            </span>
            <span className="text-right tabular-nums">{value ?? cells}</span>
          </li>
        ))}
      </ul>

      {/* Every stop's line shares one cell, so the tallest sets the height. */}
      <figcaption aria-live="polite" className="mt-8 grid">
        {dial.stops.map(({ text }, index) => (
          <p
            key={index}
            aria-hidden={index !== active}
            className={cn(
              "col-start-1 row-start-1 text-pretty",
              index !== active && "invisible"
            )}
          >
            {text}
          </p>
        ))}
      </figcaption>
    </figure>
  )
}
