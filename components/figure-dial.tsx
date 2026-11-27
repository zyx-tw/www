"use client"

import { useId, useState } from "react"

import { cn } from "../lib/utils"

import type { Dial } from "../lib/figures"

/**
 * A quantity the reader moves. The bars are text, one block a cell, and the
 * same bars stand at every stop: only their lengths change, so the eye
 * follows what grows and what stays.
 */
export function DialFigure({
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
          <li key={label} className="flex flex-wrap gap-x-3">
            <span className="w-full shrink-0 sm:w-36">{label}</span>
            <span
              aria-hidden
              className={cn(
                "min-w-0 flex-1 overflow-hidden whitespace-pre",
                tone === "mark" && "text-(--mark)",
                tone === "quiet" && "text-muted-foreground"
              )}
            >
              {"█".repeat(cells)}
              <span className="text-border">
                {"░".repeat(Math.max(0, dial.scale - cells))}
              </span>
            </span>
            <span className="shrink-0 text-right tabular-nums">
              {value ?? cells}
            </span>
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
