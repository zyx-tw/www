"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { ProjectDiagram } from "@/components/project-diagram"
import { ProjectTrace } from "@/components/project-trace"
import { FIGURE } from "@/lib/copy"
import type { Diagram, Trace } from "@/lib/projects"
import { useReducedMotion } from "@/lib/use-reduced-motion"

/** Milliseconds Play stays on a step before it scrolls to the next. */
const PLAY_MS = 2600
/** The height of the band the step is read in, in pixels. */
const BAND = 40
/** The fixed top corners, in pixels: the stage sticks below them. */
const HEADER = 64
/** The space between the stage and the line read under it, in pixels. */
const GAP = 24

type Figure = Diagram | Trace

/** The steps of a figure, in order, each with the name and line it shows. */
function stepsOf(figure: Figure) {
  return figure.kind === "trace"
    ? figure.events.map(({ from, text }) => ({ label: from, text }))
    : (figure.steps ?? [])
}

/**
 * A figure told by scrolling. The drawing stays in view while the lines
 * about it pass by, and the line in the middle of the screen is the step the
 * drawing shows. Play scrolls through the lines by itself, so the figure can
 * be watched without touching anything; any touch of the page stops it.
 * Reduced motion has no Play.
 */
export function Scrolly({
  figure,
  className,
}: {
  figure: Figure
  className?: string
}) {
  const steps = stepsOf(figure)
  const lines = useRef<(HTMLLIElement | null)[]>([])
  const stage = useRef<HTMLDivElement>(null)
  /** Where the line that counts sits, in pixels from the top of the screen. */
  const band = useRef(0)
  /** Whether the lines pass beside the stage, not under it. */
  const beside = useRef(false)
  const at = useRef(0)
  const reducedMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)

  // Beside the stage (lg), the line across the middle of the screen is the
  // step. Under it, the stage covers the middle, so the line just below the
  // stage is.
  useEffect(() => {
    let observer: IntersectionObserver | undefined
    const watch = () => {
      observer?.disconnect()
      const height = window.innerHeight
      const side = window.matchMedia("(min-width: 1024px)").matches
      beside.current = side
      const stageHeight = stage.current?.getBoundingClientRect().height ?? 0
      const top = side
        ? height / 2 - BAND / 2
        : Math.min(stageHeight + HEADER + GAP, height - 2 * BAND)
      band.current = top
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const step = Number(entry.target.getAttribute("data-step"))
            at.current = step
            setActive(step)
          }
        },
        {
          rootMargin: `-${Math.round(top)}px 0px -${Math.round(height - top - BAND)}px 0px`,
        }
      )
      for (const line of lines.current) if (line) observer.observe(line)
    }
    watch()
    window.addEventListener("resize", watch)
    return () => {
      observer?.disconnect()
      window.removeEventListener("resize", watch)
    }
  }, [steps.length])

  /**
   * Scrolls so the line of this step sits where the step is read. The page
   * scrolls inside `body`, not the window (the TV frame holds `html` still),
   * so the scrolling parent is the one to move.
   */
  function show(step: number) {
    const line = lines.current[step]
    if (!line) return
    let scroller: Element | undefined
    for (let node = line.parentElement; node; node = node.parentElement) {
      const overflow = getComputedStyle(node).overflowY
      if (
        (overflow === "auto" || overflow === "scroll") &&
        node.scrollHeight > node.clientHeight
      ) {
        scroller = node
        break
      }
    }
    // Beside the stage the whole line is centered. Under it, the name of
    // the step goes to the band, so the line reads right below the stage.
    const box = (
      beside.current ? line : (line.firstElementChild ?? line)
    ).getBoundingClientRect()
    const top = beside.current
      ? box.top + box.height / 2 - (band.current + BAND / 2)
      : box.top - band.current
    if (scroller) scroller.scrollBy({ top, behavior: "smooth" })
    else window.scrollBy({ top, behavior: "smooth" })
  }

  useEffect(() => {
    if (!playing) return
    const stop = () => setPlaying(false)
    const id = setInterval(() => {
      const next = at.current + 1
      if (next >= steps.length) return setPlaying(false)
      show(next)
    }, PLAY_MS)
    window.addEventListener("wheel", stop, { passive: true })
    window.addEventListener("touchstart", stop, { passive: true })
    window.addEventListener("keydown", stop)
    return () => {
      clearInterval(id)
      window.removeEventListener("wheel", stop)
      window.removeEventListener("touchstart", stop)
      window.removeEventListener("keydown", stop)
    }
  }, [playing, steps.length])

  function play() {
    if (playing) return setPlaying(false)
    const from = at.current >= steps.length - 1 ? 0 : at.current
    at.current = from
    show(from)
    setPlaying(true)
  }

  return (
    <div
      className={cn(
        "lg:-mx-32 lg:grid lg:grid-cols-7 lg:gap-x-12 2xl:mx-0",
        className
      )}
    >
      {/* Under the lines on a phone, the stage sits above them and holds. */}
      <div
        ref={stage}
        className="sticky top-16 z-10 bg-background py-5 lg:top-32 lg:col-span-5 lg:col-start-3 lg:row-start-1 lg:self-start lg:bg-transparent"
      >
        {figure.kind === "trace" ? (
          <ProjectTrace trace={figure} shown={active + 1} />
        ) : (
          <ProjectDiagram diagram={figure} step={active} />
        )}
        <div className="mt-5 flex items-baseline gap-x-5">
          {!reducedMotion && (
            <button
              type="button"
              aria-pressed={playing}
              onClick={play}
              className="-my-2.5 cursor-pointer bg-(--mark)/20 py-2.5 text-(--mark) outline-offset-4 focus-visible:outline-2"
            >
              {playing ? FIGURE.stop : FIGURE.play}
            </button>
          )}
          <span className="text-muted-foreground tabular-nums">
            {active + 1} / {steps.length}
          </span>
        </div>
      </div>

      <ol className="lg:col-span-2 lg:col-start-1 lg:row-start-1">
        {steps.map(({ label, text }, index) => {
          const current = index === active
          return (
            <li
              key={index}
              data-step={index}
              ref={(element) => {
                lines.current[index] = element
              }}
              className="flex flex-col gap-y-3 py-20 lg:py-40"
            >
              <span
                className={cn(
                  "w-fit uppercase motion-safe:transition-colors motion-safe:duration-state",
                  current
                    ? "bg-(--mark)/20 text-(--mark)"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
              <p
                className={cn(
                  "text-pretty motion-safe:transition-colors motion-safe:duration-state",
                  current ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {text}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
