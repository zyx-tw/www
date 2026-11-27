"use client"

import { useEffect, useRef } from "react"

import { DRIFT, sky, starX, STARS } from "../lib/sky"
import { cn } from "../lib/utils"

/** CSS pixels to one pixel of a star. */
const PIXEL = 2

/**
 * Far stars as square pixels inside the screen's bezel, drifting slowly.
 * Mount it once in a layout, so the same sky carries on from page to page:
 * every StarField reads and writes `sky`. With `margins`, the stars keep to
 * the sides, clear of a column of text. Reduced motion holds it still.
 */
export function StarField({
  margins = false,
  className,
}: {
  margins?: boolean
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)")

    let width = 0
    let height = 0
    let drawn = NaN
    const measure = () => {
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.ceil(width / PIXEL)
      canvas.height = Math.ceil(height / PIXEL)
      drawn = NaN
    }
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

  return (
    <div
      aria-hidden
      data-slot="star-field"
      data-margins={margins ? "" : undefined}
      className={cn(
        "pointer-events-none fixed inset-(--bezel) -z-10",
        className
      )}
    >
      <canvas
        ref={ref}
        className="size-full text-muted-foreground [image-rendering:pixelated]"
      />
    </div>
  )
}
