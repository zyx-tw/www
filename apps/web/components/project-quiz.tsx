"use client"

import { useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { FIGURE } from "@/lib/copy"
import type { Quiz } from "@/lib/projects"

/**
 * A question the reader answers before the text does. Each item takes one
 * pick: the right option lights, a wrong pick is struck, and the line that
 * says why appears in the space kept for it, so nothing below moves.
 */
export function ProjectQuiz({
  quiz,
  className,
}: {
  quiz: Quiz
  className?: string
}) {
  const [picks, setPicks] = useState<(number | undefined)[]>([])

  return (
    <figure
      className={cn(
        "max-w-2xl border-t border-b border-border py-5",
        className
      )}
    >
      <p className="text-muted-foreground">{quiz.ask}</p>
      <ol className="mt-8 flex flex-col gap-y-8">
        {quiz.items.map(({ text, answer, why }, item) => {
          const pick = picks[item]
          const done = pick !== undefined
          return (
            <li key={text} className="flex flex-col gap-y-2">
              <p className="text-pretty">{text}</p>
              <div
                role="group"
                aria-label={text}
                className="flex flex-wrap gap-x-5 gap-y-3"
              >
                {quiz.options.map((option, index) => {
                  const right = done && index === answer
                  const wrong = done && index === pick && index !== answer
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={index === pick}
                      onClick={() =>
                        setPicks((old) => {
                          const next = [...old]
                          next[item] = index
                          return next
                        })
                      }
                      className={cn(
                        // Tall enough to tap, without making the row taller.
                        "-my-2.5 cursor-pointer py-2.5 outline-offset-4 focus-visible:outline-2",
                        "motion-safe:transition-colors motion-safe:duration-state",
                        right && "text-(--mark)",
                        wrong && "text-muted-foreground line-through",
                        !right &&
                          !wrong &&
                          "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span aria-hidden>{right ? "●" : "○"} </span>
                      <span className={cn(right && "bg-(--mark)/20")}>
                        {option}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p
                aria-live="polite"
                className={cn("text-pretty", !done && "invisible")}
              >
                <span className="text-muted-foreground">
                  {pick === answer ? FIGURE.right : FIGURE.wrong}：
                </span>
                {why}
              </p>
            </li>
          )
        })}
      </ol>
    </figure>
  )
}
