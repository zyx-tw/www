"use client"

import Link from "next/link"
import { useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { MAP } from "@/lib/copy"
import { type System, systemPath } from "@/lib/map"

/** The px size of `text-caption`: the chart is drawn 1:1, never scaled up. */
const FONT = 14
/** The first ring, and how far out the last one may sit: on a phone, and from `sm` up. */
const RING = 46
const SIZES = {
  phone: { outer: 150, most: 22 },
  wide: { outer: 300, most: 34 },
} as const
type Size = (typeof SIZES)[keyof typeof SIZES]
/** How flat the rings are: their height over their width. */
const FLAT = 0.6

type Box = { x0: number; y0: number; x1: number; y1: number }

/** The step from one ring to the next: closer in a system with many bodies. */
function step(count: number, size: Size) {
  return Math.min(size.most, (size.outer - RING) / Math.max(1, count - 1))
}

/** A label's width: a CJK character is twice as wide as a Latin one. */
function wide(text: string) {
  let units = 0
  for (const char of text) units += char.charCodeAt(0) < 0x2000 ? 0.62 : 1.24
  return units * FONT
}

function overlap(a: Box, b: Box) {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
  return w > 0 && h > 0 ? w * h : 0
}

/**
 * Where every body and its label sit. Each body is one ring further out.
 * A label goes where it covers the least of what is already drawn: the
 * system's name, the dots and the labels before it.
 */
function layout(system: System, size: Size) {
  const count = system.bodies.length
  const outer = RING + step(count, size) * (count - 1)
  const width = (outer + 16) * 2
  const height = outer * 2 * FLAT + 48
  const spots = system.bodies.map((_, index) => {
    const rx = RING + step(count, size) * index
    const angle = index * 2.4 - 0.6
    return {
      rx,
      ry: rx * FLAT,
      x: width / 2 + Math.cos(angle) * rx,
      y: height / 2 + Math.sin(angle) * rx * FLAT,
    }
  })
  const name = wide(system.name) / 2 + 4
  const taken: Box[] = [
    {
      x0: width / 2 - name,
      y0: height / 2 - FONT * 0.7,
      x1: width / 2 + name,
      y1: height / 2 + FONT * 0.7,
    },
    ...spots.map(({ x, y }) => ({
      x0: x - 6,
      y0: y - 6,
      x1: x + 6,
      y1: y + 6,
    })),
  ]
  return {
    width,
    height,
    // Outermost first: a label near the edge has the fewest places to go.
    marks: system.bodies
      .map((body, index) => ({ body, index }))
      .reverse()
      .map(({ body, index }) => {
        const { x, y } = spots[index]!
        const length = wide(body.short)
        const half = FONT * 0.7
        // Beside the dot on either side, then above it, then below it.
        const places = [
          { anchor: "start", dx: 13, dy: 4, x0: x + 9, x1: x + 17 + length },
          { anchor: "end", dx: -13, dy: 4, x0: x - 17 - length, x1: x - 9 },
          {
            anchor: "middle",
            dx: 0,
            dy: -11,
            x0: x - length / 2 - 4,
            x1: x + length / 2 + 4,
          },
          {
            anchor: "middle",
            dx: 0,
            dy: 21,
            x0: x - length / 2 - 4,
            x1: x + length / 2 + 4,
          },
        ] as const
        // Inward first, so a label near the edge points at the middle.
        const order = x > width / 2 ? [1, 0, 2, 3] : [0, 1, 2, 3]
        const tries = order.map((at, rank) => {
          const place = places[at]!
          const mid = y + place.dy - 4
          const box = {
            x0: place.x0,
            y0: mid - half,
            x1: place.x1,
            y1: mid + half,
          }
          const out =
            Math.max(0, -box.x0) +
            Math.max(0, box.x1 - width) +
            Math.max(0, -box.y0) +
            Math.max(0, box.y1 - height)
          const cover = taken.reduce((sum, b) => sum + overlap(box, b), 0)
          return { place, box, cost: out * 1000 + cover + rank }
        })
        const pick = tries.reduce((best, next) =>
          next.cost < best.cost ? next : best
        )
        taken.push(pick.box)
        return { ...spots[index]!, body, label: pick.place }
      })
      .reverse(),
  }
}

/**
 * The note's system as a small chart at the foot of its page: its name in
 * the middle leads back to the system, each written note is a link, and the
 * note being read is framed. Pointing at a body names it under the chart.
 * The chart is drawn 1:1, so its text keeps its size: one drawing for a
 * phone, a roomier one from `sm` up.
 */
export function NoteMap({
  system,
  current,
  className,
}: {
  system: System
  /** The slug of the note being read. */
  current: string
  className?: string
}) {
  const [over, setOver] = useState<string>()
  const pointed = system.bodies.find(({ slug }) => slug === over)

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Chart
        system={system}
        current={current}
        size={SIZES.phone}
        onPoint={setOver}
        className="sm:hidden"
      />
      <Chart
        system={system}
        current={current}
        size={SIZES.wide}
        onPoint={setOver}
        className="max-sm:hidden"
      />
      <p className="min-h-10 max-w-md text-center text-caption text-balance text-muted-foreground">
        {pointed &&
          `${pointed.name}${pointed.href ? "" : `（${MAP.planned}）`}`}
      </p>
    </div>
  )
}

function Chart({
  system,
  current,
  size,
  onPoint,
  className,
}: {
  system: System
  current: string
  size: Size
  onPoint: (slug: string | undefined) => void
  className?: string
}) {
  const { width: WIDTH, height: HEIGHT, marks } = layout(system, size)
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="group"
      aria-label={system.name}
      width={WIDTH}
      height={HEIGHT}
      className={cn("h-auto max-w-full text-caption", className)}
    >
      {marks.map(({ body, rx, ry }) => {
        return (
          <ellipse
            key={body.slug}
            cx={WIDTH / 2}
            cy={HEIGHT / 2}
            rx={rx}
            ry={ry}
            strokeDasharray="1 5"
            className="fill-none stroke-muted-foreground/60"
          />
        )
      })}
      <Link href={systemPath(system)} aria-label={system.name}>
        <text
          x={WIDTH / 2}
          y={HEIGHT / 2 + 5}
          textAnchor="middle"
          className="fill-foreground"
        >
          {system.name}
        </text>
      </Link>
      {marks.map(({ body, x, y, label }) => {
        const here = body.slug === current
        const mark = (
          <g
            onPointerEnter={() => onPoint(body.slug)}
            onPointerLeave={() => onPoint(undefined)}
            className={cn(
              here
                ? "fill-(--mark) stroke-(--mark)"
                : body.href
                  ? "fill-foreground stroke-foreground"
                  : "fill-muted-foreground stroke-muted-foreground"
            )}
          >
            {here && (
              <rect
                x={x - 8}
                y={y - 8}
                width={16}
                height={16}
                className="fill-none"
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={3}
              className={cn(!body.href && "fill-background")}
            />
            <text
              x={x + label.dx}
              y={y + label.dy}
              textAnchor={label.anchor}
              className="stroke-none"
            >
              {body.short}
            </text>
          </g>
        )
        return body.href && !here ? (
          <Link key={body.slug} href={body.href} aria-label={body.name}>
            {mark}
          </Link>
        ) : (
          <g key={body.slug}>{mark}</g>
        )
      })}
    </svg>
  )
}
