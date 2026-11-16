"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { DRIFT, sky, starX, STARS } from "@/lib/sky"

/** CSS pixels to one pixel of a star, as on the map's wireframe. */
const PIXEL = 2

/**
 * The far stars behind every page, as square pixels inside the screen's
 * bezel. It lives in the root layout, so the same sky carries on from page
 * to page, the map included: the map turns it, and elsewhere it drifts.
 * Reduced motion holds it still.
 */
export function StarField() {
  const ref = useRef<HTMLCanvasElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)")

    let width = 0
    let height = 0
    const measure = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.ceil(width / PIXEL)
      canvas.height = Math.ceil(height / PIXEL)
      drawn = NaN
    }
    let drawn = NaN
    const resize = new ResizeObserver(measure)
    resize.observe(canvas)
    measure()

    let frame = 0
    let last = 0
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick)
      const dt = Math.min((now - last) / 1000, 0.1)
      // 30 frames a second is plenty for a quiet sky.
      if (dt < 1 / 32 || document.hidden || !width) return
      last = now
      if (!sky.mapped && !still.matches) sky.yaw += dt * DRIFT
      if (sky.yaw === drawn) return
      drawn = sky.yaw
      // Gray comes from the tokens, so a theme change needs no code.
      context.fillStyle = getComputedStyle(canvas).color
      context.clearRect(0, 0, canvas.width, canvas.height)
      for (const { u, v, size } of STARS) {
        const side = Math.max(1, Math.round(size / PIXEL))
        context.fillRect(
          Math.round(starX(u, width, sky.yaw) / PIXEL - side / 2),
          Math.round((v * height) / PIXEL - side / 2),
          side,
          side
        )
      }
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
    }
  }, [])

  // Behind text the stars are dimmer, so none reads as a full stop. On a
  // note they keep to the margins, clear of the column being read.
  const note = /^\/map\/[^/]+\/[^/]+/.test(pathname)
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-(--bezel) -z-10",
        !pathname.startsWith("/map") && "opacity-50",
        note && "sky-margins"
      )}
    >
      <canvas ref={ref} className="pixelated size-full text-muted-foreground" />
    </div>
  )
}
