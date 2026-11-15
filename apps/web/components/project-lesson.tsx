"use client"

import { useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import type { Lesson } from "@/lib/projects"

/**
 * A figure the reader operates: one choice above, and under it what that
 * choice leads to. Unlike a drawing with steps (project-diagram.tsx) it
 * never plays by itself, so what changes on screen is always the reader's
 * own doing.
 *
 * Every state is laid in the same cell and only the chosen one shows: the
 * tallest sets the height, nothing below moves, and the page's decoder keeps
 * the text nodes it started with. The space a shorter state leaves empty is
 * part of what it says.
 */
export function ProjectLesson({
  lesson,
  className,
}: {
  lesson: Lesson
  className?: string
}) {
  const [active, setActive] = useState(0)
  const [touched, setTouched] = useState(false)

  return (
    <figure
      className={cn(
        "max-w-2xl border-t border-b border-border py-5",
        className
      )}
    >
      <div
        role="group"
        aria-label={lesson.ask}
        className="flex flex-wrap items-baseline gap-x-5 gap-y-3"
      >
        <span className="text-muted-foreground">{lesson.ask}</span>
        {lesson.states.map(({ label }, index) => {
          const current = index === active
          return (
            <button
              key={label}
              type="button"
              aria-pressed={current}
              onClick={() => {
                setActive(index)
                setTouched(true)
              }}
              className={cn(
                // Tall enough to tap, without making the row taller.
                "-my-2.5 cursor-pointer py-2.5 outline-offset-4 focus-visible:outline-2",
                "motion-safe:transition-colors motion-safe:duration-state",
                current
                  ? "text-(--mark)"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span aria-hidden>{current ? "●" : "○"} </span>
              <span className={cn(current && "bg-(--mark)/20")}>{label}</span>
            </button>
          )
        })}
      </div>

      {/* The stacked states are hidden from assistive tech one by one, so the
          line of the state just picked is announced from here. */}
      <p aria-live="polite" className="sr-only">
        {touched ? lesson.states[active]?.text : ""}
      </p>

      <div className="mt-8 grid">
        {lesson.states.map((state, index) => (
          <div
            key={state.label}
            aria-hidden={index !== active}
            className={cn(
              "col-start-1 row-start-1 flex flex-col gap-y-8",
              index !== active && "invisible"
            )}
          >
            <div
              className={cn(
                "grid gap-x-10 gap-y-8",
                lesson.side && "sm:grid-cols-2"
              )}
            >
              {state.blocks.map((block) => (
                <div key={block.title} className="flex flex-col gap-y-2">
                  <p className="text-caption text-muted-foreground">
                    {block.title}
                  </p>
                  <ul className="flex flex-col">
                    {block.rows.map((row, at) => (
                      <li
                        key={at}
                        className={cn(
                          "flex gap-x-3",
                          row.tone === "mark" && "text-(--mark)",
                          row.tone === "dim" &&
                            "text-muted-foreground line-through",
                          row.tone === "quiet" && "text-muted-foreground"
                        )}
                      >
                        {block.numbered && (
                          <span className="shrink-0 text-muted-foreground tabular-nums">
                            {at + 1}
                          </span>
                        )}
                        <span className="flex-1 text-pretty">{row.text}</span>
                        {row.value && (
                          <span className="shrink-0 tabular-nums">
                            {row.value}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <figcaption className="text-pretty">{state.text}</figcaption>
          </div>
        ))}
      </div>
    </figure>
  )
}
