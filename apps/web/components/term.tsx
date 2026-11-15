"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { createPortal } from "react-dom"

import { MAP } from "@/lib/copy"
import type { Term as Entry } from "@/lib/glossary"

/**
 * A term in a note's text, framed by four corner ticks as the map frames
 * what the pointer is on. Pointing at it, or focusing it, puts it on the
 * instruments at the foot of the screen: its name, then what it means. A
 * click goes to where it is explained; a term explained on this page stays
 * here, and a tap shows the instruments instead.
 */
export function Term({
  term,
  children,
}: {
  term: Entry
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const away = term.href && term.href !== pathname ? term.href : undefined
  const shared = {
    className: "term",
    "data-open": open || undefined,
    onPointerEnter: () => setOpen(true),
    onPointerLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  }

  return (
    <>
      {away ? (
        <Link href={away} {...shared}>
          {children}
        </Link>
      ) : (
        <button type="button" {...shared} onClick={() => setOpen(!open)}>
          {children}
        </button>
      )}
      {open &&
        createPortal(
          <div
            lang="zh-Hant"
            className="pointer-events-none fixed inset-x-(--bezel) bottom-(--bezel) z-10 px-(--gutter) pb-12"
          >
            <div
              role="status"
              data-slot="term-facts"
              className="flex w-fit max-w-xl flex-col gap-1 bg-background"
            >
              <p className="font-medium text-balance">
                <span className="bg-(--mark)/20 text-(--mark)">
                  {term.name}
                </span>
                {term.planned && (
                  <span className="text-caption text-muted-foreground">
                    {"   "}
                    {MAP.planned}
                  </span>
                )}
              </p>
              <p className="text-caption text-muted-foreground">{term.text}</p>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
