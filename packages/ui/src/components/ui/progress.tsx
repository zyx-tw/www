"use client"

import { useEffect, useRef } from "react"

import { cn } from "../../lib/utils"

/** CSS pixels to one pixel of the bar. */
const PIXEL = 2
/** Pixels of dither at the filled edge. */
const SOFT = 10
/** The 8 by 8 Bayer matrix, as thresholds between 0 and 1. */
const BAYER = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36,
  14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23,
  61, 29, 53, 21,
].map((value) => (value + 0.5) / 64)

/**
 * A determinate progress bar that fills pixel by pixel: the filled edge is a
 * Bayer dither, a gradient of dots instead of a hard line. `value` is 0 to
 * 100. Colors come from the tokens (foreground on muted), so a theme change
 * needs no code. Before hydration it shows the empty track.
 */
function Progress({
  value,
  className,
  ...props
}: { value: number } & Omit<React.ComponentProps<"div">, "children">) {
  const ref = useRef<HTMLCanvasElement>(null)
  const clamped = Math.max(0, Math.min(100, value))

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return
    const draw = () => {
      const width = Math.ceil(canvas.clientWidth / PIXEL)
      const height = Math.ceil(canvas.clientHeight / PIXEL)
      if (!width || !height) return
      canvas.width = width
      canvas.height = height
      const style = getComputedStyle(canvas)
      const filled = (clamped / 100) * (width + SOFT)
      context.fillStyle = style.backgroundColor
      context.fillRect(0, 0, width, height)
      context.fillStyle = style.color
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const level = Math.max(0, Math.min(1, (filled - x) / SOFT))
          if (level > BAYER[(y % 8) * 8 + (x % 8)]!)
            context.fillRect(x, y, 1, 1)
        }
      }
    }
    draw()
    const resize = new ResizeObserver(draw)
    resize.observe(canvas)
    return () => resize.disconnect()
  }, [clamped])

  return (
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn("h-2 w-full", className)}
      {...props}
    >
      <canvas ref={ref} className="block size-full bg-muted text-foreground" />
    </div>
  )
}

export { Progress }
