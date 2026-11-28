"use client"

import * as React from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"

import { cn } from "../lib/utils"

export type At = "top-left" | "top-right" | "bottom-left" | "bottom-right"

const CornerContext = React.createContext<At>("top-left")

/**
 * Tells the tips in a corner which corner they sit in, and opens them at
 * once: an app without a TooltipProvider of its own would otherwise wait
 * Base UI's 600 ms.
 */
export function CornerScope({
  at,
  children,
}: {
  at: At
  children: React.ReactNode
}) {
  return (
    <CornerContext.Provider value={at}>
      <TooltipProvider>{children}</TooltipProvider>
    </CornerContext.Provider>
  )
}

/**
 * A bubble on hover, and on keyboard focus of a link or button, with what the
 * item's label leaves out. It opens toward the page, below the top corners and
 * above the bottom ones, lined up with the item's outer edge, so it never runs
 * off the viewport. `children` is the item itself: one element that takes the
 * trigger's ref and props. A component that sets its own onClick before
 * spreading its props goes inside a span, or the trigger's onClick replaces
 * it. Without a `tip` the item renders as it is.
 */
export function CornerTip({
  tip,
  children,
}: {
  tip?: React.ReactNode
  children: React.ReactElement
}) {
  const at = React.useContext(CornerContext)
  const [dark, setDark] = React.useState(false)

  if (tip == null || tip === "") return children

  return (
    <Tooltip
      onOpenChange={(open, { trigger }) => {
        // The bubble is portalled to <body>, outside a corner's own scheme,
        // such as the dark corners over the www.zyx.tw home's 3D stage in
        // the light theme, so it copies a scheme set below <html>. The site's
        // own theme it inherits, and follows when that changes while open.
        if (open) setDark(trigger?.closest(".dark:not(html)") != null)
      }}
    >
      <TooltipTrigger render={children} />
      <TooltipContent
        side={at.startsWith("top") ? "bottom" : "top"}
        align={at.endsWith("left") ? "start" : "end"}
        // flex, not the stock inline-flex: in a line box the bubble would sit
        // on the page's line height and land a few px low.
        className={cn("flex", dark && "dark")}
      >
        {tip}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * The page nav folded behind a MENU link, for a phone without room for it
 * beside the breadcrumb. It opens a panel under the top right corner with the
 * nav's links in a column, and closes on a pick, a tap outside or Escape.
 */
export function CornerMenu({
  label = "Menu",
  linkClassName,
  className,
  children,
}: {
  label?: string
  /** The corner link style, so MENU looks like the links it hides. */
  linkClassName?: string
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const root = React.useRef<HTMLDivElement>(null)
  const id = React.useId()

  React.useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", away)
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("pointerdown", away)
      document.removeEventListener("keydown", key)
    }
  }, [open])

  return (
    <div ref={root} className={cn("relative flex", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={linkClassName}
      >
        {label}
      </button>
      <div
        id={id}
        hidden={!open}
        // A pick inside closes the panel; the link still navigates. Capture,
        // so a link that stops its click still closes it.
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false)
        }}
        className="absolute top-full right-0 mt-3 min-w-40 rounded-control border border-border bg-background/95 px-5 py-3 shadow-window backdrop-blur-md [&_li]:py-2 [&_ul]:flex-col [&_ul]:items-end [&_ul]:gap-0"
      >
        {children}
      </div>
    </div>
  )
}
