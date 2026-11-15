"use client"

import { useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { FIGURE } from "@/lib/copy"
import type { Trace } from "@/lib/projects"

/**
 * A run replayed by the reader, one event a press. Events that have happened
 * stay on screen and the newest is lit, so the record is seen growing. Every
 * event keeps its place from the start: nothing below moves.
 */
export function ProjectTrace({
  trace,
  className,
}: {
  trace: Trace
  className?: string
}) {
  const { events } = trace
  const [shown, setShown] = useState(1)
  const last = shown === events.length

  return (
    <figure
      className={cn(
        "max-w-2xl border-t border-b border-border py-5",
        className
      )}
    >
      <div className="flex items-baseline gap-x-5">
        <button
          type="button"
          onClick={() => setShown(last ? 1 : shown + 1)}
          className={cn(
            "-my-2.5 cursor-pointer py-2.5 outline-offset-4 focus-visible:outline-2",
            "bg-(--mark)/20 text-(--mark)"
          )}
        >
          {last ? FIGURE.again : FIGURE.next}
        </button>
        <span className="text-muted-foreground tabular-nums">
          {shown} / {events.length}
        </span>
      </div>

      <ol aria-label={trace.alt} className="mt-8 flex flex-col gap-y-5">
        {events.map(({ from, lines }, index) => {
          const current = index === shown - 1
          return (
            <li
              key={index}
              aria-hidden={index >= shown}
              className={cn(
                "flex gap-x-3",
                "motion-safe:transition-colors motion-safe:duration-state",
                index >= shown && "invisible",
                current ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <span className={cn("w-18 shrink-0", current && "text-(--mark)")}>
                {from}
              </span>
              <span className="min-w-0 flex-1 wrap-anywhere whitespace-pre-wrap">
                {lines.join("\n")}
              </span>
            </li>
          )
        })}
      </ol>

      {/* Every event's line shares one cell, so the tallest sets the height. */}
      <figcaption aria-live="polite" className="mt-8 grid">
        {events.map(({ text }, index) => (
          <p
            key={index}
            aria-hidden={index !== shown - 1}
            className={cn(
              "col-start-1 row-start-1 text-pretty",
              index !== shown - 1 && "invisible"
            )}
          >
            {text}
          </p>
        ))}
      </figcaption>
    </figure>
  )
}
