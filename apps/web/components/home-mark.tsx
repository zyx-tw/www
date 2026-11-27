"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

import { cn } from "@workspace/ui/lib/utils"

import type { SceneV1 } from "@workspace/3d"

import { LEAVE_EVENT, OUT } from "@workspace/ui/components/page-decode"
import type { AsciiMark } from "@/lib/ascii-mark"
import sceneFile from "@/lib/home-scene.json"
import { glyphFont } from "@/lib/pond/renderer"
import { useReducedMotion } from "@workspace/ui/hooks/use-reduced-motion"

/** The mark as saved from 3d.zyx.tw, with the rounder edges the home uses. */
const SHAPE = { ...sceneFile.shape, bevel: 0.12 } as SceneV1["shape"]

/** The size of a character cell of the mark. */
const CELL_SCALE = 0.6

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

/**
 * The mark's color follows the day of the week, red to violet from Monday to
 * Sunday: full colors on the dark page, where the mark also glows, and deeper
 * ones on the light page. Content, not chrome (DESIGN.md, Color).
 */
const WEEKDAY_INK = {
  // Sunday first, as getDay() counts.
  dark: [
    "#c77dff",
    "#ff5a5a",
    "#ff9a3c",
    "#ffe04a",
    "#4ade80",
    "#4aa8ff",
    "#7b7bff",
  ],
  light: [
    "#8b3fd1",
    "#d42a2a",
    "#d96a00",
    "#a88a00",
    "#16a34a",
    "#1d6fd6",
    "#4a45d6",
  ],
}

function weekdayInk(dark: boolean) {
  return WEEKDAY_INK[dark ? "dark" : "light"][new Date().getDay()]!
}

/**
 * The zyx mark in characters, swaying slowly over the stars; a drag on it
 * turns it and throws it (lib/ascii-mark.ts). It lives in the root layout
 * and shows on the home alone: three.js loads on the first visit to the
 * home, and the mark is built once and kept, so coming back to the home
 * builds nothing. It decodes in each time, and scrambles out with the page
 * when a link leaves the home. Without WebGL the home is the stars alone.
 * Decorative: the page's heading names the site.
 */
export function HomeMark() {
  const ref = useRef<HTMLCanvasElement>(null)
  const markRef = useRef<AsciiMark | null>(null)
  const stop = useRef(() => {})
  const reducedMotion = useReducedMotion()
  const home = usePathname() === "/"
  const shown = useRef(home)

  useEffect(() => {
    shown.current = home
    const canvas = ref.current
    if (!canvas) return
    const existing = markRef.current
    if (existing) {
      if (!home) return existing.stop()
      existing.resize(getComputedStyle(canvas).fontFamily)
      existing.setMotion(!window.matchMedia(REDUCED_MOTION).matches)
      existing.enter()
      return
    }
    if (!home) return
    let cancelled = false
    void import("@/lib/ascii-mark").then(({ AsciiMark }) => {
      if (cancelled || markRef.current) return
      let mark: AsciiMark
      try {
        mark = new AsciiMark(canvas, SHAPE, null, CELL_SCALE)
      } catch {
        return
      }
      const family = getComputedStyle(canvas).fontFamily
      const paint = () => {
        const dark = document.documentElement.classList.contains("dark")
        mark.setColors(
          weekdayInk(dark),
          getComputedStyle(document.documentElement).getPropertyValue(
            "--background"
          ),
          dark ? 1 : 0
        )
      }
      const resize = new ResizeObserver(() => {
        if (shown.current) mark.resize(family)
      })
      resize.observe(canvas)
      const theme = new MutationObserver(paint)
      theme.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      })
      paint()
      mark.resize(family)
      // Glyphs drawn on a canvas cannot start a webfont load; once the face
      // is in, draw them again. The load rejects when a fallback face is
      // missing (no Arial on Linux), and the face is in all the same.
      document.fonts
        ?.load(glyphFont(16, family))
        .catch(() => undefined)
        .then(() => {
          if (markRef.current === mark && shown.current) mark.resize(family)
        })
      mark.setMotion(!window.matchMedia(REDUCED_MOTION).matches)
      mark.enter()
      const leave = () => {
        if (shown.current) mark.leave(OUT)
      }
      document.addEventListener(LEAVE_EVENT, leave)
      markRef.current = mark
      stop.current = () => {
        document.removeEventListener(LEAVE_EVENT, leave)
        resize.disconnect()
        theme.disconnect()
        mark.destroy()
        markRef.current = null
      }
    })
    return () => {
      cancelled = true
    }
  }, [home])

  // The mark goes with the layout, not with a page.
  useEffect(() => () => stop.current(), [])

  useEffect(() => {
    if (shown.current) markRef.current?.setMotion(!reducedMotion)
  }, [reducedMotion])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn(
        "fixed inset-0 size-full touch-pinch-zoom font-mono text-foreground data-dragging:cursor-grabbing data-over:cursor-grab",
        !home && "hidden"
      )}
    />
  )
}
