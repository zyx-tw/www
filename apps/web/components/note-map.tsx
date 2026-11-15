"use client"

import Link from "next/link"
import { useState } from "react"

import { cn } from "@workspace/ui/lib/utils"

import { MAP } from "@/lib/copy"
import { type System, systemPath } from "@/lib/map"

const WIDTH = 360
const HEIGHT = 240

/** Where the body at `index` sits: one ring further out for each. */
function place(index: number) {
  const rx = 64 + 24 * index
  const angle = index * 2.4 - 0.6
  return {
    rx,
    ry: rx / 2,
    x: WIDTH / 2 + Math.cos(angle) * rx,
    y: HEIGHT / 2 + Math.sin(angle) * (rx / 2),
  }
}

/**
 * The note's system as a small chart at the foot of its page: its name in
 * the middle leads back to the system, each written note is a link, and the
 * note being read is framed. Pointing at a body names it under the chart;
 * otherwise the line names the note to read next.
 */
export function NoteMap({
  system,
  current,
  next,
  className,
}: {
  system: System
  /** The slug of the note being read. */
  current: string
  /** The note to read next, if one follows. */
  next?: { name: string; href?: string }
  className?: string
}) {
  const [over, setOver] = useState<string>()
  const pointed = system.bodies.find(({ slug }) => slug === over)

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="group"
        aria-label={system.name}
        className="w-full max-w-md text-caption"
      >
        {system.bodies.map((body, index) => {
          const { rx, ry } = place(index)
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
        {system.bodies.map((body, index) => {
          const { x, y } = place(index)
          const here = body.slug === current
          const left = x > WIDTH / 2 + 70
          const mark = (
            <g
              onPointerEnter={() => setOver(body.slug)}
              onPointerLeave={() => setOver(undefined)}
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
                x={left ? x - 13 : x + 13}
                y={y + 4}
                textAnchor={left ? "end" : "start"}
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
      <p className="min-h-10 max-w-md text-center text-caption text-balance text-muted-foreground">
        {pointed ? (
          `${pointed.name}${pointed.href ? "" : `（${MAP.planned}）`}`
        ) : next ? (
          <>
            {MAP.next}{" "}
            {next.href ? (
              <Link
                href={next.href}
                className="terminal-link text-foreground underline decoration-muted-foreground/40 underline-offset-4"
              >
                {next.name}
              </Link>
            ) : (
              `${next.name}（${MAP.planned}）`
            )}
          </>
        ) : null}
      </p>
    </div>
  )
}
