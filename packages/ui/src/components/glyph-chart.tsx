"use client"

import * as React from "react"

import { cn } from "../lib/utils"

/**
 * Charts drawn in characters, as a terminal dashboard draws them: a braille
 * area or line chart, a block sparkline, a meter and block columns. Each one
 * fills its container's width, measured in character cells, and redraws on
 * resize. Data marks may carry the data hues (--data-low, --data-mid,
 * --data-high); the chrome around them stays grayscale.
 */

/** How many character cells fit across the element, kept up to date. */
function useCells<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [cells, setCells] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const probe = document.createElement("span")
    probe.textContent = "0".repeat(10)
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre"
    el.appendChild(probe)
    const measure = () => {
      // A cell is at least 4px, so a probe that has not laid out yet cannot
      // ask for thousands of cells.
      const cell = Math.max(4, probe.getBoundingClientRect().width / 10)
      setCells(Math.min(400, Math.max(1, Math.floor(el.clientWidth / cell))))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      ro.disconnect()
      probe.remove()
    }
  }, [])
  return [ref, cells] as const
}

/** `values` stretched or squeezed to `n` points, by linear interpolation. */
function resample(values: number[], n: number) {
  if (!values.length || n <= 0) return []
  if (values.length === 1) return new Array(n).fill(values[0])
  return Array.from({ length: n }, (_, i) => {
    const x = (i / Math.max(1, n - 1)) * (values.length - 1)
    const k = Math.floor(x)
    const f = x - k
    return (
      values[k]! * (1 - f) +
      (values[Math.min(k + 1, values.length - 1)] ?? 0) * f
    )
  })
}

function scale(values: number[], min?: number, max?: number) {
  let lo = min ?? 0
  let hi = max ?? -Infinity
  for (const v of values) {
    if (min === undefined && v < lo) lo = v
    if (max === undefined && v > hi) hi = v
  }
  if (!(hi > lo)) hi = lo + 1
  return values.map((v) => Math.min(1, Math.max(0, (v - lo) / (hi - lo))))
}

/** A data hue for a 0 to 1 value: low, then mid, then high. */
export function heat(v: number) {
  const x = Math.min(1, Math.max(0, v))
  return x < 0.5
    ? `color-mix(in oklch, var(--data-low), var(--data-mid) ${Math.round(x * 200)}%)`
    : `color-mix(in oklch, var(--data-mid), var(--data-high) ${Math.round((x - 0.5) * 200)}%)`
}

const DOT = [
  [0x01, 0x02, 0x04, 0x40],
  [0x08, 0x10, 0x20, 0x80],
]

/**
 * A braille chart: 2 dots across and 4 down per character, `rows` lines
 * tall. `area` fills under the line. `tone="heat"` colors each line of the
 * chart by its height.
 */
function BrailleChart({
  values,
  rows = 4,
  variant = "area",
  tone = "foreground",
  min,
  max,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  values: number[]
  rows?: number
  variant?: "area" | "line"
  tone?: "foreground" | "heat"
  min?: number
  max?: number
}) {
  const [ref, cols] = useCells<HTMLDivElement>()
  const lines = React.useMemo(() => {
    if (!cols) return []
    const dotsX = cols * 2
    const dotsY = rows * 4
    const ys = scale(resample(values, dotsX), min, max).map((v) =>
      Math.round((1 - v) * (dotsY - 1))
    )
    const cells = Array.from({ length: rows }, () => new Array(cols).fill(0))
    ys.forEach((y, x) => {
      const prev = ys[x - 1] ?? y
      const [a, b] =
        variant === "area" ? [y, dotsY - 1] : prev < y ? [prev, y] : [y, prev]
      for (let d = a; d <= b; d++) {
        cells[d >> 2]![x >> 1] |= DOT[x & 1]![d & 3]!
      }
    })
    return cells.map((row) =>
      row.map((bits) => String.fromCharCode(0x2800 + bits)).join("")
    )
  }, [values, cols, rows, variant, min, max])

  return (
    <div
      ref={ref}
      data-slot="braille-chart"
      className={cn(
        "relative w-full overflow-hidden leading-none whitespace-pre [contain:inline-size]",
        className
      )}
      {...props}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={
            tone === "heat"
              ? { color: heat(1 - i / Math.max(1, rows - 1)) }
              : undefined
          }
        >
          {line}
        </div>
      ))}
    </div>
  )
}

const BARS = "▁▂▃▄▅▆▇█"

/** One line of block bars, as wide as its container. */
function Sparkline({
  values,
  min,
  max,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  values: number[]
  min?: number
  max?: number
}) {
  const [ref, cols] = useCells<HTMLDivElement>()
  const text = React.useMemo(
    () =>
      scale(resample(values, cols), min, max)
        .map(
          (v) => BARS[Math.min(BARS.length - 1, Math.floor(v * BARS.length))]
        )
        .join(""),
    [values, cols, min, max]
  )
  return (
    <div
      ref={ref}
      data-slot="sparkline"
      className={cn(
        "relative w-full overflow-hidden whitespace-pre [contain:inline-size]",
        className
      )}
      {...props}
    >
      {text}
    </div>
  )
}

/**
 * A meter of full blocks over a dotted track, as wide as its container.
 * `tone="heat"` shades the filled cells from low to high along the track.
 */
function Meter({
  value,
  tone = "foreground",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  /** 0 to 1. */
  value: number
  tone?: "foreground" | "heat"
}) {
  const [ref, cols] = useCells<HTMLDivElement>()
  const filled = Math.round(Math.min(1, Math.max(0, value)) * cols)
  return (
    <div
      ref={ref}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      data-slot="meter"
      className={cn(
        "relative w-full overflow-hidden whitespace-pre [contain:inline-size]",
        className
      )}
      {...props}
    >
      {tone === "heat" ? (
        Array.from({ length: filled }, (_, i) => (
          <span key={i} style={{ color: heat(i / Math.max(1, cols - 1)) }}>
            █
          </span>
        ))
      ) : (
        <span>{"█".repeat(filled)}</span>
      )}
      <span className="text-muted">
        {"░".repeat(Math.max(0, cols - filled))}
      </span>
    </div>
  )
}

/**
 * Columns, `rows` text lines tall, one per value, spread across the width.
 * Heights step in eighths of a line, as the partial blocks ▁ to █ do, but
 * each column is one filled box so no seams show between its cells. With
 * `onSelect` each column is a button; `selected` stays solid and the others
 * step back.
 */
function BlockColumns({
  values,
  labels,
  rows = 6,
  selected,
  onSelect,
  tone = "foreground",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "onSelect"> & {
  values: number[]
  /** Accessible names, one per value. */
  labels?: string[]
  rows?: number
  selected?: (index: number) => boolean
  onSelect?: (index: number) => void
  tone?: "foreground" | "heat"
}) {
  const [ref, cols] = useCells<HTMLDivElement>()
  const n = values.length
  // Each value gets the same whole number of cells, one of them a gap while
  // there is room for it.
  const per = n ? Math.max(1, Math.floor(cols / n)) : 1
  const width = per > 2 ? per - 1 : per
  const top = values.reduce((m, v) => Math.max(m, v), 1e-9)

  return (
    <div
      ref={ref}
      data-slot="block-columns"
      className={cn(
        "relative flex w-full items-end justify-between overflow-hidden whitespace-pre [contain:inline-size]",
        className
      )}
      style={{ height: `${rows * 1.25}rem` }}
      {...props}
    >
      {values.map((v, i) => {
        const eighths = Math.max(
          1,
          Math.round((Math.max(0, v) / top) * rows * 8)
        )
        const on = selected ? selected(i) : true
        const Tag = onSelect ? "button" : "div"
        return (
          <Tag
            key={i}
            {...(onSelect
              ? {
                  type: "button" as const,
                  onClick: () => onSelect(i),
                  "aria-pressed": on,
                }
              : {})}
            aria-label={labels?.[i]}
            className={cn(
              "flex h-full items-end transition-colors duration-state outline-none focus-visible:bg-muted",
              !on && "text-muted-foreground/50 hover:text-muted-foreground"
            )}
            style={{
              width: `${width}ch`,
              color: tone === "heat" && on ? heat(v / top) : undefined,
            }}
          >
            <span
              className="block w-full bg-current"
              style={{ height: `${(eighths / 8) * 1.25}rem` }}
            />
          </Tag>
        )
      })}
    </div>
  )
}

export { BlockColumns, BrailleChart, Meter, Sparkline }
