"use client"

import Link from "next/link"
import { useEffect, useRef, useSyncExternalStore } from "react"

import { cn } from "@/lib/utils"
import { enterRow } from "@/lib/layout"

import { useShowcase } from "@/components/showcase"
import { projectPath } from "@/lib/projects"

// The lg breakpoint, where the list becomes the column beside the window.
const WIDE = "(min-width: 64rem)"

// Put on the page's scroller while the list picks by scroll position, so the
// wheel stops with one row on the pointer. Written out for Tailwind to see.
const SNAP = ["snap-y", "snap-mandatory"]

function subscribeWide(onChange: () => void) {
  const query = window.matchMedia(WIDE)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/**
 * One row per project. The project in the window is marked, as the map
 * marks the name pointed at. A row opens the project's own page
 * (/project/<slug>), which links out.
 *
 * Below lg the window sits above the list and each row adds its purpose in
 * muted text on the right, wrapping below the name when both do not fit;
 * phones show the names alone. Hovering a row or focusing its link from the
 * keyboard puts that project in the window.
 *
 * From lg the list is the left column beside the window, whose title bar
 * carries the purpose, so the rows are names alone; the purpose stays for
 * screen readers. There the list is a wheel: the page's pointer stays at the
 * middle of the screen (app/project/page.tsx), the first row starts on it,
 * and scrolling brings each row to it in turn. The row on the pointer is the
 * one in the window; the cursor picks nothing. Half a screen of space, less
 * half a row, before the first row and after the last lets both reach the
 * pointer.
 */
export function ProjectList({ className }: { className?: string }) {
  const { projects, active, engage, release, point } = useShowcase()
  const listRef = useRef<HTMLUListElement>(null)
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => false
  )

  useEffect(() => {
    const list = listRef.current
    if (!wide || !list) return
    const rows = Array.from(list.children)
    // The root shrinks to the screen's middle line, and the rows have no gaps
    // from lg, so exactly one row is on the line at a time.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) point(rows.indexOf(entry.target))
        }
      },
      { rootMargin: "-50% 0px -50% 0px" }
    )
    rows.forEach((row) => observer.observe(row))
    // Either the document scrolls or, inside the TV bezel, the body does.
    // The classes do nothing on the one that does not scroll.
    const scrollers = [document.documentElement, document.body]
    scrollers.forEach((scroller) => scroller.classList.add(...SNAP))
    return () => {
      observer.disconnect()
      scrollers.forEach((scroller) => scroller.classList.remove(...SNAP))
      point(null)
    }
  }, [wide, point])

  return (
    <section aria-labelledby="projects-heading" className={className}>
      <h2 id="projects-heading" className="sr-only">
        Projects
      </h2>
      <div aria-hidden className="hidden lg:block lg:h-screen-half" />
      <ul ref={listRef} className="flex flex-col gap-y-3 lg:-mt-4.5 lg:gap-y-0">
        {projects.map((project, index) => (
          <li
            key={project.slug}
            data-active={index === active ? "" : undefined}
            // A lone item on a wrapped line starts at the left edge, so
            // space-between is what moves the purpose between the two places.
            // From lg the 12 px between rows is padding instead of a gap, so
            // the rows touch and each one snaps to the screen's middle.
            className={cn(
              "group relative flex flex-wrap justify-between gap-x-5 lg:snap-center lg:py-1.5",
              enterRow(2 + index)
            )}
            onPointerEnter={(event) => {
              if (!wide && event.pointerType === "mouse") engage(index)
            }}
            onPointerLeave={(event) => {
              if (!wide && event.pointerType === "mouse") release(index)
            }}
          >
            {/* The link stretches over the whole row, and on phones over
                half the gap on each side, so a tap between rows still lands
                on one (36 px per row instead of 24). */}
            <Link
              href={projectPath(project)}
              className="terminal-link group-data-active:bg-(--mark)/20 group-data-active:text-(--mark) after:absolute after:inset-0 max-sm:text-muted-foreground max-sm:after:-inset-y-1.5"
              onFocus={(event) => {
                if (!event.currentTarget.matches(":focus-visible")) return
                // From lg the keyboard moves the wheel: the focused row
                // comes to the pointer.
                if (wide) {
                  event.currentTarget.scrollIntoView({ block: "center" })
                } else {
                  engage(index)
                }
              }}
              onBlur={() => release(index)}
            >
              {project.name}
            </Link>
            <span className="text-muted-foreground transition-colors group-data-active:text-foreground max-sm:sr-only lg:sr-only">
              {project.purpose}
            </span>
          </li>
        ))}
      </ul>
      <div
        aria-hidden
        className="hidden lg:-mt-4.5 lg:block lg:h-screen-half"
      />
    </section>
  )
}
